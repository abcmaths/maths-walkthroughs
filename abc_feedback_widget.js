// ============================================================
// ABC Maths — Progress Tracking + Feedback Widget
// ============================================================

(function() {
  const SUPABASE_URL  = 'https://lnwinoghbefmjpvmixzo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo';

  const style = document.createElement('style');
  style.textContent = `
    #abc-complete-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: white; border-top: 2px solid #eee;
      padding: 12px 24px; display: flex; align-items: center;
      justify-content: center; gap: 16px; z-index: 999;
      font-family: 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
    }
    #abc-complete-btn {
      background: #C0272D; color: white; border: none;
      border-radius: 6px; padding: 10px 28px; font-size: 0.95rem;
      font-weight: 700; cursor: pointer; font-family: inherit;
      transition: background 0.2s;
    }
    #abc-complete-btn:hover { background: #a01f24; }
    #abc-complete-btn:disabled { background: #ccc; cursor: not-allowed; }
    #abc-complete-done { color: #2e7d32; font-weight: 600; font-size: 0.9rem; display: none; }
    #abc-dashboard-link {
      display: none; font-size: 0.85rem; color: #C0272D;
      font-weight: 600; text-decoration: none;
    }
    #abc-dashboard-link:hover { text-decoration: underline; }
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
    #abc-feedback-skip:hover { color: #888; }
    #abc-feedback-thankyou { text-align: center; color: #2e7d32; font-weight: 600; font-size: 0.9rem; padding: 8px 0; display: none; }
    body { padding-bottom: 70px; }
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.id = 'abc-complete-bar';
  bar.innerHTML = `
    <button id="abc-complete-btn" onclick="abcMarkComplete()">✓ Mark as Complete</button>
    <div id="abc-complete-done">✓ Topic marked as complete!</div>
    <a id="abc-dashboard-link" href="../dashboard-student.html">← Back to My Dashboard</a>
  `;
  document.body.appendChild(bar);

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

  let selectedRating = null;

  window.abcSetRating = function(rating) {
    selectedRating = rating;
    document.getElementById('abc-thumb-up').className   = 'abc-thumb' + (rating === 'up'   ? ' selected-up'   : '');
    document.getElementById('abc-thumb-down').className = 'abc-thumb' + (rating === 'down' ? ' selected-down' : '');
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

      // Try PATCH first (update existing), then POST if not found
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

      // Show completion message, dashboard link and feedback panel
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
          'Prefer': 'resolution=merge-duplicates,return=minimal'
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

      document.getElementById('abc-feedback-submit').style.display = 'none';
      document.getElementById('abc-feedback-skip').style.display   = 'none';
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
