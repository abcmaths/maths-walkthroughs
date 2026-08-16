// ABC Maths — Progress Tracking Widget

(function() {
  const SUPABASE_URL  = 'https://lnwinoghbefmjpvmixzo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo';

  // Check for recently fixed bugs and show banner
  async function checkRecentFix() {
    const topicCode = window._abcTopicCode;
    if (!topicCode) return;
    try {
      // Step 1: get topic ID
      const topicResp = await fetch(
        SUPABASE_URL + '/rest/v1/topics?topic_code=eq.' + topicCode + '&select=id',
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON } }
      );
      const topics = await topicResp.json();
      if (!topics || !topics.length) return;
      const topicId = topics[0].id;

      // Step 2: get session token for authenticated request
      const session = await getSession();
      const authToken = session ? session.access_token : SUPABASE_ANON;

      // Step 3: check for fixed bugs in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      if (!topicId) return;
      const url = SUPABASE_URL + '/rest/v1/bug_reports?status=eq.fixed&topic_id=eq.' + topicId + '&limit=1';
      const bugResp = await fetch(url,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + authToken } }
      );
      const bugs = await bugResp.json();
      if (bugs && bugs.length > 0) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#e8f0fe;border-left:4px solid #1a56b0;padding:10px 16px;font-size:0.85rem;color:#1a56b0;font-family:Segoe UI,Arial,sans-serif;margin-bottom:8px;';
        banner.innerHTML = '🔧 <strong>Recently updated</strong> — This walkthrough was improved following a student report.';
        document.body.insertBefore(banner, document.body.firstChild);
      }
    } catch(e) { console.error('Banner error:', e.message, e); }
  }

  // Wait for topic code to be set by module script, then check
  function waitForTopicCode(attempts) {
    if (window._abcTopicCode) {
      checkRecentFix();
    } else if (attempts > 0) {
      setTimeout(function() { waitForTopicCode(attempts - 1); }, 200);
    }
  }
  document.addEventListener('DOMContentLoaded', function() { waitForTopicCode(10); });

  // Capture JS errors automatically
  const _jsErrors = [];
  window.addEventListener('error', function(e) {
    _jsErrors.push(e.message + ' (' + e.filename?.split('/').pop() + ':' + e.lineno + ')');
  });

  const style = document.createElement('style');
  style.textContent = `
    #abc-complete-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: white; border-top: 2px solid #eee;
      padding: 10px 24px; display: flex; align-items: center;
      justify-content: center; gap: 16px; z-index: 999;
      font-family: 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08); flex-wrap: wrap;
    }
    #abc-complete-btn {
      background: #C0272D; color: white; border: none;
      border-radius: 6px; padding: 9px 24px; font-size: 0.9rem;
      font-weight: 700; cursor: pointer; font-family: inherit;
    }
    #abc-complete-btn:hover { background: #a01f24; }
    #abc-complete-btn:disabled { background: #ccc; cursor: not-allowed; }
    #abc-complete-done { color: #2e7d32; font-weight: 600; font-size: 0.9rem; display: none; }
    #abc-dashboard-link { display: none; font-size: 0.85rem; color: #C0272D; font-weight: 600; text-decoration: none; }
    #abc-dashboard-link:hover { text-decoration: underline; }

    body { padding-bottom: 70px; }
  `;
  document.head.appendChild(style);

  // ── Bottom bar ──
  const bar = document.createElement('div');
  bar.id = 'abc-complete-bar';
  bar.innerHTML = `
    <button id="abc-complete-btn" onclick="abcMarkComplete()">✓ Mark as Complete</button>
    <div id="abc-complete-done">✓ Topic marked as complete!</div>
    <a id="abc-dashboard-link" href="../dashboard-student.html">← Back to My Dashboard</a>
  `;
  document.body.appendChild(bar);

  // Cache the logged-in student's school_id (needed for any insert into
  // school-scoped tables since the multi-school schema was added).
  let _abcMySchoolId = null;
  async function getMySchoolId(session) {
    if (_abcMySchoolId) return _abcMySchoolId;
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=school_id`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${session.access_token}` } }
      );
      const rows = await resp.json();
      if (rows && rows.length) _abcMySchoolId = rows[0].school_id;
    } catch (e) { console.error('school_id lookup failed:', e); }
    return _abcMySchoolId;
  }

  window.abcMarkComplete = async function() {
    const btn = document.getElementById('abc-complete-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
      const session = await getSession();
      if (!session) {
        btn.disabled = false;
        btn.textContent = '✓ Mark as Complete';
        alert('Please log in to track your progress.');
        return;
      }

      const topicCode = window._abcTopicCode;
      if (!topicCode) { btn.disabled = false; return; }

      const topicResp = await fetch(
        `${SUPABASE_URL}/rest/v1/topics?topic_code=eq.${topicCode}&select=id`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${session.access_token}` } }
      );
      const topics = await topicResp.json();
      if (!topics || !topics.length) { btn.disabled = false; return; }
      window._abcTopicId = topics[0].id;

      const mySchoolId = await getMySchoolId(session);
      if (!mySchoolId) {
        btn.disabled = false;
        btn.textContent = '✓ Mark as Complete';
        alert('Could not verify your school. Please try again or contact your teacher.');
        return;
      }

      const patchResp = await fetch(
        `${SUPABASE_URL}/rest/v1/walkthrough_progress?student_id=eq.${session.user.id}&topic_id=eq.${window._abcTopicId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
            last_visited_at: new Date().toISOString()
          })
        }
      );
      let saveOk = patchResp.ok && patchResp.status !== 404;
      if (!saveOk) {
        const postResp = await fetch(`${SUPABASE_URL}/rest/v1/walkthrough_progress`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON,
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            student_id:      session.user.id,
            topic_id:        window._abcTopicId,
            school_id:       mySchoolId,
            status:          'completed',
            completed_at:    new Date().toISOString(),
            last_visited_at: new Date().toISOString()
          })
        });
        saveOk = postResp.ok;
        if (!saveOk) {
          console.error('walkthrough_progress save failed:', postResp.status, await postResp.text());
          btn.disabled = false;
          btn.textContent = '✓ Mark as Complete';
          alert('Sorry, something went wrong saving your progress. Please try again.');
          return;
        }
      }

      btn.style.display = 'none';
      document.getElementById('abc-complete-done').style.display  = 'block';
      document.getElementById('abc-dashboard-link').style.display = 'inline';

    } catch(e) {
      console.error('Complete error:', e);
      btn.disabled = false;
      btn.textContent = '✓ Mark as Complete';
    }
  };

  async function getSession() {
    try {
      if (window._supabase) {
        const { data: { session } } = await window._supabase.auth.getSession();
        return session;
      }
    } catch(e) {}
    return null;
  }

})();
