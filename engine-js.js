/**
 * engine.js — Shared Walkthrough Engine
 * ───────────────────────────────────────
 * Drop this file in the root of your site.
 * Every topic page loads this and calls:
 *
 *   WalkthroughEngine.init({
 *     containerId: 'app',   // id of the mount point div
 *     questions: [...],     // array of question objects (see format below)
 *     brand: 'abc'          // 'abc' or 'cc' (optional, defaults to 'abc')
 *   });
 *
 * ── Question object format ──────────────────
 * {
 *   eyebrow: "Question 1 · Mensuration",
 *   title:   "Volume of a Trapezoidal Prism",
 *   sub:     "Short description shown below the title.",
 *   steps: [
 *     {
 *       label: "The solid",
 *       html:  "<p>Explanation HTML...</p>",
 *       draw:  function(phase) { ... draws into svg#diagram ... }
 *     },
 *     // ... more steps ...
 *     {
 *       label: "Your turn",
 *       html:  WalkthroughEngine.tryIt({ ... })   // use helper below
 *     }
 *   ]
 * }
 *
 * ── tryIt() helper ──────────────────────────
 * WalkthroughEngine.tryIt({
 *   question:  "HTML string — the practice question",
 *   hints:     ["Step 1 hint", "Step 2 hint"],
 *   answer:    600,          // correct numerical answer
 *   tolerance: 2,            // % tolerance (default 2%)
 *   unit:      "cm³",        // unit shown in feedback
 *   working:   "HTML string — full worked solution"
 * })
 * Returns an HTML string ready to drop into a step's html property.
 */

const WalkthroughEngine = (() => {

  /* ── CSS injected once ── */
  const CSS = `
    :root{
      --eng-red:#C0272D;--eng-dark:#7A1418;--eng-cream:#FBF6F1;
      --eng-ink:#241A17;--eng-line:#E4D6CE;--eng-gold:#C8922A;
    }
    .wt-stage{background:#fff;border:1px solid var(--eng-line);border-radius:4px;overflow:hidden;width:100%;max-width:760px;}
    .wt-canvas{background:linear-gradient(180deg,#fff,#fdf7f4);padding:14px 0 4px;display:flex;justify-content:center;}
    .wt-canvas svg{width:100%;max-width:520px;height:auto;}
    .wt-panel{padding:20px 24px 24px;border-top:1px solid var(--eng-line);min-height:160px;}
    .wt-step-label{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--eng-gold);font-weight:700;margin-bottom:6px;}
    .wt-panel p{font-size:16px;line-height:1.55;margin:0 0 8px;}
    .wt-formula{font-family:'Cambria Math','Georgia',serif;font-size:18px;background:var(--eng-cream);border-left:4px solid var(--eng-red);padding:9px 13px;margin:8px 0;display:inline-block;}
    .wt-controls{width:100%;max-width:760px;display:flex;justify-content:space-between;align-items:center;margin-top:16px;}
    .wt-btn{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;padding:9px 18px;border-radius:3px;border:1px solid var(--eng-red);background:#fff;color:var(--eng-red);cursor:pointer;transition:.15s;}
    .wt-btn.primary{background:var(--eng-red);color:#fff;}
    .wt-btn:disabled{opacity:.3;cursor:default;}
    .wt-btn:not(:disabled):hover{background:var(--eng-dark);color:#fff;border-color:var(--eng-dark);}
    .wt-dots{display:flex;gap:6px;}
    .wt-dot{width:8px;height:8px;border-radius:50%;background:var(--eng-line);}
    .wt-dot.active{background:var(--eng-red);}
    .wt-dot.done{background:var(--eng-gold);}
    .wt-fadein{animation:wtFade .45s ease;}
    @keyframes wtFade{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
    /* Try It */
    .wt-try{background:#fff;border:2px solid var(--eng-gold);border-radius:6px;padding:18px 20px;margin-top:4px;}
    .wt-try-title{font-family:'Helvetica Neue',Arial,sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--eng-gold);font-weight:700;margin-bottom:10px;}
    .wt-hints{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#3a2a24;margin:8px 0 12px;padding-left:4px;list-style:none;}
    .wt-hints li{margin-bottom:5px;padding-left:18px;position:relative;}
    .wt-hints li::before{content:"›";position:absolute;left:0;color:var(--eng-gold);font-weight:700;}
    .wt-answer-row{display:flex;gap:8px;margin-top:6px;}
    .wt-answer-row input{flex:1;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;padding:8px 12px;border:1px solid var(--eng-line);border-radius:3px;outline:none;}
    .wt-answer-row input:focus{border-color:var(--eng-gold);}
    .wt-check{font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;padding:8px 16px;background:var(--eng-gold);color:#fff;border:none;border-radius:3px;cursor:pointer;white-space:nowrap;}
    .wt-check:hover{background:#a07018;}
    .wt-feedback{margin-top:10px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;padding:9px 12px;border-radius:3px;display:none;}
    .wt-feedback.ok{background:#e8f8ee;color:#1a7a3a;border:1px solid #a8dbb8;display:block;}
    .wt-feedback.err{background:#fde8e8;color:#a01820;border:1px solid #f0b8b8;display:block;}
    .wt-working{margin-top:10px;font-family:'Helvetica Neue',Arial,sans-serif;}
    .wt-working summary{cursor:pointer;color:var(--eng-red);font-weight:600;font-size:14px;}
    .wt-working-body{margin-top:8px;font-size:14px;line-height:1.6;color:#3a2a24;}
  `;

  let _tryStore = {};

  function injectCSS(){
    if(document.getElementById('wt-engine-css')) return;
    const s = document.createElement('style');
    s.id = 'wt-engine-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── Public: tryIt() ── */
  function tryIt(opts){
    const id = 'wt_' + Math.random().toString(36).slice(2);
    _tryStore[id] = opts;
    const hints = (opts.hints||[]).map(h=>`<li>${h}</li>`).join('');
    return `
      <div class="wt-try">
        <div class="wt-try-title">✎ Your Turn</div>
        <p>${opts.question}</p>
        <ul class="wt-hints">${hints}</ul>
        <div class="wt-answer-row">
          <input type="number" step="any" placeholder="Your answer (${opts.unit})" id="${id}_inp"/>
          <button class="wt-check" onclick="WalkthroughEngine._check('${id}')">Check</button>
        </div>
        <div class="wt-feedback" id="${id}_fb"></div>
        <details class="wt-working">
          <summary>Show full working</summary>
          <div class="wt-working-body">${opts.working}</div>
        </details>
      </div>`;
  }

  /* ── Public: _check() (called from inline onclick) ── */
  function _check(id){
    const opts = _tryStore[id];
    const val  = parseFloat(document.getElementById(id+'_inp').value);
    const fb   = document.getElementById(id+'_fb');
    if(isNaN(val)){ fb.className='wt-feedback err'; fb.textContent='Please enter a number first.'; return; }
    const tol = (opts.tolerance||2)/100;
    const lo  = opts.answer*(1-tol), hi = opts.answer*(1+tol);
    if(val>=lo && val<=hi){
      fb.className='wt-feedback ok';
      fb.textContent='✓ Correct! Well done — '+opts.answer.toFixed(1)+' '+opts.unit;
    } else {
      fb.className='wt-feedback err';
      fb.textContent='✗ Not quite. Check your working and try again.';
    }
  }

  /* ── Main init ── */
  function init({ containerId, questions, topicTitle, topicEyebrow }){
    injectCSS();
    const container = document.getElementById(containerId);
    if(!container){ console.error('WalkthroughEngine: container not found'); return; }

    let qIdx = 0, sIdx = 0;

    /* build shell */
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:0;width:100%;">
        <div style="width:100%;max-width:760px;border-bottom:3px solid var(--eng-red);padding-bottom:12px;margin-bottom:20px;">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--eng-red);font-weight:700;" id="${containerId}_eyebrow"></div>
          <h1 style="font-family:'Georgia',serif;font-size:26px;margin:6px 0 4px;line-height:1.2;" id="${containerId}_title"></h1>
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6b5750;" id="${containerId}_sub"></div>
        </div>
        <div class="wt-stage">
          <div class="wt-canvas"><svg id="${containerId}_svg" viewBox="0 0 480 300"></svg></div>
          <div class="wt-panel wt-fadein" id="${containerId}_panel"></div>
        </div>
        <div class="wt-controls">
          <button class="wt-btn" id="${containerId}_prev">← Back</button>
          <div class="wt-dots" id="${containerId}_dots"></div>
          <button class="wt-btn primary" id="${containerId}_next">Next →</button>
        </div>
      </div>`;

    /* build question nav (if multiple questions) */
    if(questions.length > 1){
      const qnav = document.createElement('div');
      qnav.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;width:100%;max-width:760px;';
      qnav.id = containerId+'_qnav';
      container.querySelector('[style]').prepend(qnav);
    }

    function buildQNav(){
      const qnav = document.getElementById(containerId+'_qnav');
      if(!qnav) return;
      qnav.innerHTML = '';
      questions.forEach((q,i)=>{
        const b = document.createElement('button');
        b.className = 'wt-btn' + (i===qIdx?' primary':'');
        b.style.padding='6px 12px';b.style.fontSize='12px';
        b.textContent = 'Q'+(i+1);
        b.onclick = ()=>{ qIdx=i; sIdx=0; render(); };
        qnav.appendChild(b);
      });
    }

    function buildDots(){
      const wrap = document.getElementById(containerId+'_dots');
      wrap.innerHTML='';
      questions[qIdx].steps.forEach((_,i)=>{
        const d=document.createElement('div');
        d.className='wt-dot'+(i===sIdx?' active':i<sIdx?' done':'');
        wrap.appendChild(d);
      });
    }

    function render(){
      buildQNav();
      const q=questions[qIdx], step=q.steps[sIdx];
      document.getElementById(containerId+'_eyebrow').textContent = q.eyebrow||'';
      document.getElementById(containerId+'_title').textContent   = q.title||'';
      document.getElementById(containerId+'_sub').textContent     = q.sub||'';
      const p = document.getElementById(containerId+'_panel');
      p.classList.remove('wt-fadein'); void p.offsetWidth; p.classList.add('wt-fadein');
      p.innerHTML = `<div class="wt-step-label">${step.label}</div>${step.html}`;
      if(step.draw) step.draw(sIdx);
      buildDots();
      document.getElementById(containerId+'_prev').disabled = sIdx===0;
      const nb = document.getElementById(containerId+'_next');
      nb.textContent = sIdx===q.steps.length-1 ? 'Restart ↺' : 'Next →';
    }

    document.getElementById(containerId+'_prev').addEventListener('click',()=>{ if(sIdx>0){sIdx--;render();} });
    document.getElementById(containerId+'_next').addEventListener('click',()=>{
      const q=questions[qIdx];
      sIdx = sIdx===q.steps.length-1 ? 0 : sIdx+1;
      render();
    });

    render();
  }

  return { init, tryIt, _check };

})();
