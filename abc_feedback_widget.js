// ============================================================
// ABC Maths — Progress Tracking + Feedback + Bug Report Widget
// ============================================================

(function() {
  const SUPABASE_URL  = 'https://lnwinoghbefmjpvmixzo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo';

  // Check for recently fixed bugs and show banner
  async function checkRecentFix() {
    const topicCode = window._abcTopicCode;
    if (!topicCode) return;
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const resp = await fetch(
        `${SUPABASE_URL}/rest/v1/bug_reports?select=id&status=eq.fixed&fixed_at=gte.${thirtyDaysAgo}&topic_id=in.(select id from topics where topic_code=eq.${topicCode})&limit=1`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      );
      // Simpler approach — check via topic_id after we have it
      const topicResp = await fetch(
        `${SUPABASE_URL}/rest/v1/topics?topic_code=eq.${topicCode}&select=id`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      );
      const topics = await topicResp.json();
      if (!topics || !topics.length) return;
      const topicId = topics[0].id;

      const bugResp = await fetch(
        `${SUPABASE_URL}/rest/v1/bug_reports?status=eq.fixed&fixed_at=gte.${thirtyDaysAgo}&topic_id=eq.${topicId}&limit=1`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      );
      const bugs = await bugResp.json();
      if (bugs && bugs.length > 0) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#e8f0fe;border-left:4px solid #1a56b0;padding:10px 16px;font-size:0.85rem;color:#1a56b0;font-family:Segoe UI,Arial,sans-serif;margin-bottom:8px;';
        banner.innerHTML = '🔧 <strong>Recently updated</strong> — This walkthrough was improved following a student report.';
        document.body.insertBefore(banner, document.body.firstChild);
      }
    } catch(e) {}
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', checkRecentFix);

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
    #abc-report-btn {
      background: none; border: 1.5px solid #ddd; border-radius: 6px;
      padding: 9px 16px; font-size: 0.82rem; color: #888;
      cursor: pointer; font-family: inherit; transition: all 0.18s;
    }
    #abc-report-btn:hover { border-color: #C0272D; color: #C0272D; }
    #abc-complete-done { color: #2e7d32; font-weight: 600; font-size: 0.9rem; display: none; }
    #abc-dashboard-link { display: none; font-size: 0.85rem; color: #C0272D; font-weight: 600; text-decoration: none; }
    #abc-dashboard-link:hover { text-decoration: underline; }

    .abc-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.4); z-index: 1001;
      align-items: center; justify-content: center;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    .abc-overlay.open { display: flex; }
    .abc-modal {
      background: white; border-radius: 10px; width: 90%; max-width: 460px;
      padding: 24px; box-shadow: 0 8px 40px rgba(0,0,0,0.2);
    }
    .abc-modal h3 { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 6px; }
    .abc-modal p  { font-size: 0.82rem; color: #888; margin-bottom: 16px; }
    .abc-modal label { display: block; font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px; }
    .abc-modal select, .abc-modal textarea {
      width: 100%; padding: 9px 12px; border: 1.5px solid #ddd;
      border-radius: 5px; font-size: 0.88rem; font-family: inherit;
      margin-bottom: 14px; box-sizing: border-box; background: white;
    }
    .abc-modal textarea { resize: vertical; min-height: 70px; }
    .abc-modal select:focus, .abc-modal textarea:focus { outline: none; border-color: #C0272D; }
    .abc-modal-btns { display: flex; gap: 10px; }
    .abc-modal-submit {
      background: #C0272D; color: white; border: none; border-radius: 5px;
      padding: 9px 20px; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; font-family: inherit;
    }
    .abc-modal-cancel {
      background: none; border: 1.5px solid #ddd; border-radius: 5px;
      padding: 9px 16px; font-size: 0.88rem; color: #888;
      cursor: pointer; font-family: inherit;
    }
    .abc-modal-done { color: #2e7d32; font-weight: 600; font-size: 0.9rem; display: none; padding: 8px 0; }

    #abc-feedback-panel {
      display: none; position: fixed; bottom: 70px; left: 50%;
      transform: translateX(-50%); width: 90%; max-width: 480px;
      background: white; border: 1.5px solid #eee; border-radius: 10px;
      padding: 20px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 1000; font-family: 'Segoe UI', Arial, sans-serif;
    }
    #abc-feedback-panel h3 { font-size: 0.95rem; font-weight: 700; color: #333; margin-bottom: 14px; }
    .abc-thumb-row { display: flex; gap: 12px; margin-bottom: 14px; }
    .abc-thumb {
      flex: 1; padding: 10px; border: 2px solid #eee; border-radius: 6px;
      font-size: 1.4rem; text-align: center; cursor: pointer;
      transition: all 0.18s; background: white; font-family: inherit;
    }
    .abc-thumb:hover { border-color: #C0272D; }
    .abc-thumb.selected-up   { border-color: #2e7d32; background: #e8f5e9; }
    .abc-thumb.selected-down { border-color: #C0272D; background: #fde8e8; }
    .abc-thumb span { display: block; font-size: 0.72rem; font-weight: 600; color: #666; margin-top: 4px; }
    #abc-feedback-comment {
      width: 100%; padding: 9px 12px; border: 1.5px solid #ddd;
      border-radius: 5px; font-size: 0.88rem; font-family: inherit;
      resize: vertical; min-height: 60px; margin-bottom: 12px; box-sizing: border-box;
    }
    #abc-feedback-comment:focus { outline: none; border-color: #C0272D; }
    .abc-fb-btns { display: flex; gap: 10px; align-items: center; }
    #abc-feedback-submit {
      background: #C0272D; color: white; border: none; border-radius: 5px;
      padding: 9px 20px; font-size: 0.88rem; font-weight: 700;
      cursor: pointer; font-family: inherit;
    }
    #abc-feedback-submit:disabled { background: #ccc; cursor: not-allowed; }
    #abc-feedback-skip { background: none; border: none; color: #aaa; font-size: 0.82rem; cursor: pointer; font-family: inherit; }
    #abc-feedback-thankyou { text-align: center; color: #2e7d32; font-weight: 600; font-size: 0.9rem; padding: 8px 0; display: none; }
    body { padding-bottom: 70px; }
  `;
  document.head.appendChild(style);

  // ── Bottom bar ──
  const bar = document.createElement('div');
  bar.id = 'abc-complete-bar';
  bar.innerHTML = `
    <button id="abc-complete-btn" onclick="abcMarkComplete()">✓ Mark as Complete</button>
    <button id="abc-report-btn" onclick="abcOpenReport()">⚑ Report a Problem</button>
    <div id="abc-complete-done">✓ Topic marked as complete!</div>
    <a id="abc-dashboard-link" href="../dashboard-student.html">← Back to My Dashboard</a>
  `;
  document.body.appendChild(bar);

  // ── Feedback panel ──
  const panel = document.createElement('div');
  panel.id = 'abc-feedback-panel';
  panel.innerHTML = `
    <h3>How was this walkthrough?</h3>
    <div class="abc-thumb-row">
      <button class="abc-thumb" id="abc-thumb-up" onclick="abcSetRating('up')">👍 <span>Helpful</span></button>
      <button class="abc-thumb" id="abc-thumb-down" onclick="abcSetRating('down')">👎 <span>Needs work</span></button>
    </div>
    <textarea id="abc-feedback-comment" placeholder="Any comments? (optional)"></textarea>
    <div class="abc-fb-btns">
      <button id="abc-feedback-submit" onclick="abcSubmitFeedback()">Submit Feedback</button>
      <button id="abc-feedback-skip" onclick="abcCloseFeedback()">Skip</button>
    </div>
    <div id="abc-feedback-thankyou">✓ Thanks for your feedback!</div>
  `;
  document.body.appendChild(panel);

  // ── Bug report modal ──
  const reportModal = document.createElement('div');
  reportModal.className = 'abc-overlay';
  reportModal.id = 'abc-report-overlay';
  reportModal.innerHTML = `
    <div class="abc-modal">
      <h3>⚑ Report a Problem</h3>
      <p>Tell us what's not working and we'll fix it.</p>
      <label>Which question has the problem?</label>
      <select id="abc-report-question">
        <option value="">Loading questions…</option>
      </select>
      <label>What's the problem?</label>
      <textarea id="abc-report-desc" placeholder="e.g. The diagram is not showing, the New button doesn't work, the answer is wrong…"></textarea>
      <div class="abc-modal-btns">
        <button class="abc-modal-submit" onclick="abcSubmitReport()">Send Report</button>
        <button class="abc-modal-cancel" onclick="abcCloseReport()">Cancel</button>
      </div>
      <div class="abc-modal-done" id="abc-report-done">✓ Report sent — thank you!</div>
    </div>
  `;
  document.body.appendChild(reportModal);

  let selectedRating = null;

  window.abcSetRating = function(rating) {
    selectedRating = rating;
    document.getElementById('abc-thumb-up').className   = 'abc-thumb' + (rating === 'up'   ? ' selected-up'   : '');
    document.getElementById('abc-thumb-down').className = 'abc-thumb' + (rating === 'down' ? ' selected-down' : '');
  };

  window.abcOpenReport = function() {
    // Populate question selector from QS array if available
    const sel = document.getElementById('abc-report-question');
    sel.innerHTML = '<option value="">— Select a question —</option>';
    if (typeof QS !== 'undefined') {
      QS.forEach(function(q, i) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = 'Q' + (i+1) + ' · ' + (q.ti || q.ey || 'Question ' + (i+1));
        sel.appendChild(opt);
      });
    } else {
      sel.innerHTML = '<option value="0">This walkthrough</option>';
    }
    // Add "General problem" option
    const gen = document.createElement('option');
    gen.value = 'general';
    gen.textContent = 'General problem (not a specific question)';
    sel.appendChild(gen);

    document.getElementById('abc-report-done').style.display = 'none';
    document.getElementById('abc-report-desc').value = '';
    document.getElementById('abc-report-overlay').classList.add('open');
  };

  window.abcCloseReport = function() {
    document.getElementById('abc-report-overlay').classList.remove('open');
  };

  window.abcSubmitReport = async function() {
    const sel   = document.getElementById('abc-report-question');
    const desc  = document.getElementById('abc-report-desc').value.trim();
    const done  = document.getElementById('abc-report-done');
    const btn   = document.querySelector('.abc-modal-submit');

    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const session = await getSession();

      // Get topic ID
      let topicId = null;
      if (window._abcTopicCode) {
        const topicResp = await fetch(
          `${SUPABASE_URL}/rest/v1/topics?topic_code=eq.${window._abcTopicCode}&select=id`,
          { headers: { 'apikey': SUPABASE_ANON, 'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON}` } }
        );
        const topics = await topicResp.json();
        if (topics && topics.length) topicId = topics[0].id;
      }

      const qIdx = sel.value;
      let qNum   = null;
      let qTitle = null;
      if (qIdx !== '' && qIdx !== 'general' && typeof QS !== 'undefined') {
        qNum   = parseInt(qIdx) + 1;
        qTitle = QS[parseInt(qIdx)]?.ti || null;
      }

      const jsErr = _jsErrors.length > 0 ? _jsErrors.join(' | ') : null;

      await fetch(`${SUPABASE_URL}/rest/v1/bug_reports`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${SUPABASE_ANON}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          student_id:      session ? session.user.id : null,
          topic_id:        topicId,
          question_number: qNum,
          question_title:  qTitle,
          description:     desc || null,
          js_error:        jsErr,
          status:          'open',
          reported_at:     new Date().toISOString()
        })
      });

      done.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Send Report';
      setTimeout(abcCloseReport, 2000);

    } catch(e) {
      console.error('Report error:', e);
      btn.disabled = false;
      btn.textContent = 'Send Report';
    }
  };

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
      if (!patchResp.ok || patchResp.status === 404) {
        await fetch(`${SUPABASE_URL}/rest/v1/walkthrough_progress`, {
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
            status:          'completed',
            completed_at:    new Date().toISOString(),
            last_visited_at: new Date().toISOString()
          })
        });
      }

      btn.style.display = 'none';
      document.getElementById('abc-complete-done').style.display  = 'block';
      document.getElementById('abc-dashboard-link').style.display = 'inline';
      document.getElementById('abc-feedback-panel').style.display = 'block';

    } catch(e) {
      console.error('Complete error:', e);
      btn.disabled = false;
      btn.textContent = '✓ Mark as Complete';
    }
  };

  window.abcSubmitFeedback = async function() {
    if (!selectedRating) { alert('Please select 👍 or 👎 first.'); return; }
    const btn     = document.getElementById('abc-feedback-submit');
    const comment = document.getElementById('abc-feedback-comment').value.trim();
    btn.disabled  = true;
    btn.textContent = 'Submitting…';

    try {
      const session = await getSession();
      if (!session || !window._abcTopicId) { abcCloseFeedback(); return; }

      await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          student_id:   session.user.id,
          topic_id:     window._abcTopicId,
          rating:       selectedRating,
          comment:      comment || null,
          status:       'pending',
          submitted_at: new Date().toISOString()
        })
      });

      document.getElementById('abc-feedback-submit').style.display  = 'none';
      document.getElementById('abc-feedback-skip').style.display    = 'none';
      document.getElementById('abc-feedback-thankyou').style.display = 'block';
      setTimeout(abcCloseFeedback, 2000);

    } catch(e) {
      abcCloseFeedback();
    }
  };

  window.abcCloseFeedback = function() {
    document.getElementById('abc-feedback-panel').style.display = 'none';
  };

  window.abcShowFeedback = function() {
    document.getElementById('abc-feedback-panel').style.display = 'block';
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
