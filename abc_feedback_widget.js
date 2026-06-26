// ============================================================
// ABC Maths — Feedback Widget
// Add this script to each walkthrough file, or include via
// the add_tracking.py script update
// ============================================================

(function() {
  const SUPABASE_URL  = 'https://lnwinoghbefmjpvmixzo.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo';

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    #abc-feedback-panel {
      display: none;
      margin: 20px auto;
      max-width: 520px;
      background: white;
      border: 1.5px solid #eee;
      border-radius: 8px;
      padding: 20px 24px;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    #abc-feedback-panel h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 14px;
    }
    .abc-thumb-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    .abc-thumb {
      flex: 1;
      padding: 10px;
      border: 2px solid #eee;
      border-radius: 6px;
      font-size: 1.4rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.18s;
      background: white;
    }
    .abc-thumb:hover { border-color: #C0272D; }
    .abc-thumb.selected-up   { border-color: #2e7d32; background: #e8f5e9; }
    .abc-thumb.selected-down { border-color: #C0272D; background: #fde8e8; }
    .abc-thumb span { display: block; font-size: 0.72rem; font-weight: 600; color: #666; margin-top: 4px; }
    #abc-feedback-comment {
      width: 100%;
      padding: 9px 12px;
      border: 1.5px solid #ddd;
      border-radius: 5px;
      font-size: 0.88rem;
      font-family: inherit;
      resize: vertical;
      min-height: 70px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }
    #abc-feedback-comment:focus { outline: none; border-color: #C0272D; }
    #abc-feedback-submit {
      background: #C0272D;
      color: white;
      border: none;
      border-radius: 5px;
      padding: 9px 20px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
    }
    #abc-feedback-submit:disabled { background: #ccc; cursor: not-allowed; }
    #abc-feedback-done {
      text-align: center;
      color: #2e7d32;
      font-weight: 600;
      font-size: 0.9rem;
      padding: 8px 0;
    }
  `;
  document.head.appendChild(style);

  // Inject HTML panel
  const panel = document.createElement('div');
  panel.id = 'abc-feedback-panel';
  panel.innerHTML = `
    <h3>How was this walkthrough?</h3>
    <div class="abc-thumb-row">
      <button class="abc-thumb" id="abc-thumb-up" onclick="abcSetRating('up')">
        👍 <span>Helpful</span>
      </button>
      <button class="abc-thumb" id="abc-thumb-down" onclick="abcSetRating('down')">
        👎 <span>Needs work</span>
      </button>
    </div>
    <textarea id="abc-feedback-comment" placeholder="Any comments? (optional)"></textarea>
    <button id="abc-feedback-submit" onclick="abcSubmitFeedback()">Submit Feedback</button>
    <div id="abc-feedback-done" style="display:none">✓ Thanks for your feedback!</div>
  `;
  document.body.appendChild(panel);

  let selectedRating = null;
  let topicCode = window._abcTopicCode || null;

  window.abcSetRating = function(rating) {
    selectedRating = rating;
    document.getElementById('abc-thumb-up').className   = 'abc-thumb' + (rating === 'up'   ? ' selected-up'   : '');
    document.getElementById('abc-thumb-down').className = 'abc-thumb' + (rating === 'down' ? ' selected-down' : '');
  };

  window.abcShowFeedback = async function() {
    const panel = document.getElementById('abc-feedback-panel');
    panel.style.display = 'block';

    // Check if already submitted
    try {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/feedback?topic_id=eq.${window._abcTopicId}&select=rating,comment`, {
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${(await getSession()).access_token}`
        }
      });
      const data = await resp.json();
      if (data && data.length > 0) {
        abcSetRating(data[0].rating);
        document.getElementById('abc-feedback-comment').value = data[0].comment || '';
        document.getElementById('abc-feedback-submit').textContent = 'Update Feedback';
      }
    } catch(e) {}
  };

  window.abcSubmitFeedback = async function() {
    if (!selectedRating) {
      alert('Please select 👍 or 👎 first.');
      return;
    }
    const btn     = document.getElementById('abc-feedback-submit');
    const comment = document.getElementById('abc-feedback-comment').value.trim();
    btn.disabled  = true;
    btn.textContent = 'Submitting…';

    try {
      const session = await getSession();
      if (!session) { btn.disabled = false; btn.textContent = 'Submit Feedback'; return; }

      // Get topic ID from topic code
      const topicResp = await fetch(`${SUPABASE_URL}/rest/v1/topics?topic_code=eq.${topicCode}&select=id`, {
        headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${session.access_token}` }
      });
      const topics = await topicResp.json();
      if (!topics || !topics.length) return;
      const topicId = topics[0].id;

      await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          student_id:   session.user.id,
          topic_id:     topicId,
          rating:       selectedRating,
          comment:      comment || null,
          status:       'pending',
          submitted_at: new Date().toISOString()
        })
      });

      document.getElementById('abc-feedback-submit').style.display = 'none';
      document.getElementById('abc-feedback-done').style.display   = 'block';
    } catch(e) {
      btn.disabled = false;
      btn.textContent = 'Submit Feedback';
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

  // Show feedback panel when student reaches last step
  document.addEventListener('DOMContentLoaded', function() {
    var nb = document.getElementById('nb');
    if (!nb) return;
    nb.addEventListener('click', function() {
      if (nb.textContent.trim() === 'Restart') {
        window.abcShowFeedback();
      }
    });
  });
})();
