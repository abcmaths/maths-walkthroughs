/* ABC Learning Portal — shared game widget
   Include with: <script src="../games/js/abc_game_widget.js"></script>
   (path depth may vary — adjust the leading ../ to reach repo root)
   Requires a Supabase client already created as window._lc (games follow the
   same session-check pattern as walkthroughs) OR pass one via init().
*/
(function (global) {
  var SUPABASE_URL = 'https://lnwinoghbefmjpvmixzo.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud2lub2doYmVmbWpwdm1peHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzODIxNzQsImV4cCI6MjA5Nzk1ODE3NH0.ubKHVLrxlxQd-w3n5pS3O6YMAI7I--ndEkI2xWM9qCo';

  var _client = null;

  async function getClient() {
    if (_client) return _client;
    if (global._lc) { _client = global._lc; return _client; }
    var mod = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    _client = mod.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _client;
  }

  async function submitScore(gameCode, score, timeSeconds) {
    try {
      var sb = await getClient();
      var { data: { session } } = await sb.auth.getSession();
      if (!session) return { ok: false, error: 'not_logged_in' };
      var { error } = await sb.from('game_scores').insert({
        game_code: gameCode,
        student_id: session.user.id,
        score: score,
        time_seconds: timeSeconds || null
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  function fmtTime(secs) {
    if (secs === null || secs === undefined) return '\u2014';
    var m = Math.floor(secs / 60), s = secs % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  async function renderLeaderboard(gameCode, containerEl, opts) {
    opts = opts || {};
    var limit = opts.limit || 10;
    containerEl.innerHTML = '<div class="abcg-lb-loading">Loading leaderboard\u2026</div>';
    try {
      var sb = await getClient();
      var { data: { session } } = await sb.auth.getSession();
      var { data, error } = await sb
        .from('game_leaderboard')
        .select('student_id, full_name, score, time_seconds')
        .eq('game_code', gameCode)
        .order('score', { ascending: false })
        .order('time_seconds', { ascending: true, nullsFirst: false })
        .limit(limit);

      if (error) { containerEl.innerHTML = '<div class="abcg-lb-empty">Leaderboard unavailable.</div>'; return; }
      if (!data || !data.length) { containerEl.innerHTML = '<div class="abcg-lb-empty">No scores yet \u2014 be the first!</div>'; return; }

      var meId = session && session.user ? session.user.id : null;
      var rows = data.map(function (row, i) {
        var isMe = row.student_id === meId;
        return '<div class="abcg-lb-row' + (isMe ? ' abcg-lb-me' : '') + '">' +
          '<span class="abcg-lb-rank">' + (i + 1) + '</span>' +
          '<span class="abcg-lb-name">' + (row.full_name || 'Student') + '</span>' +
          '<span class="abcg-lb-score">' + row.score + '</span>' +
          '<span class="abcg-lb-time">' + fmtTime(row.time_seconds) + '</span>' +
          '</div>';
      }).join('');

      containerEl.innerHTML =
        '<div class="abcg-lb-head"><span></span><span>Player</span><span>Score</span><span>Time</span></div>' + rows;
    } catch (e) {
      containerEl.innerHTML = '<div class="abcg-lb-empty">Leaderboard unavailable.</div>';
    }
  }

  global.ABCGame = {
    submitScore: submitScore,
    renderLeaderboard: renderLeaderboard,
    fmtTime: fmtTime
  };
})(window);
