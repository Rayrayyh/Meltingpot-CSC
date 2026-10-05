// scenes/d.js: chunk D, 70.0 to 105.0 (notes/STORYBOARD.md "D: practice, readout, search").
// Headline "Turn notes into practice." with a flying card stack; flashcards (UI-SPEC m); practice test (n); the one
// split screen with the teaching readout (p, only "What the class is shaky on"); search (o) ending on the note page (h).
// Every app string is verbatim from notes/UI-SPEC.md or run 4's capture log. Deterministic: tweens on F.tl and drivers.
FILM.scene({
  id: "d",
  t0: 70.0,
  t1: 105.0,
  build(F) {
    const tl = F.tl, I = F.icon, C = F.cursor;
    const SHIFT = 300; // the split screen's window shift (stage px): window 623 to 1897, 23 px clear of panel and frame

    // cubic-bezier as a GSAP ease function (bisection on x; pure)
    function bez(x1, y1, x2, y2) {
      const bx = (t) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
      const by = (t) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
      return (x) => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let a = 0, b = 1, m = x;
        for (let i = 0; i < 24; i++) { m = (a + b) / 2; if (bx(m) < x) a = m; else b = m; }
        return by((a + b) / 2);
      };
    }
    const FLIP = bez(0.32, 0.72, 0, 1);   // flashcard turn and next card in (UI-SPEC m)
    const SCORE = bez(0.16, 1, 0.3, 1);   // score count-up (UI-SPEC n)
    const EXPO = bez(0.22, 1, 0.36, 1);   // reveal / settle

    const css = [
      /* ---- flying card stack behind the headline (stage px) ---- */
      "#d-fly { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none; }",
      "#d-fly .d-c { position: absolute; border-radius: 20px; border: 1px solid var(--edge); font-family: 'MP Inter', sans-serif; color: var(--ink);",
      "  box-shadow: 0 18px 44px rgba(62, 45, 30, 0.13), 0 2px 6px rgba(36, 34, 44, 0.06); will-change: transform, filter, opacity; }",
      "#d-fly .d-c.fc { background: var(--card-face); text-align: center; padding: 26px 30px 28px; }",
      "#d-fly .d-c.pq { background: var(--surface-raised); padding: 22px 24px 24px; }",
      "#d-fly .d-c.sc { background: var(--surface-raised); padding: 22px 26px; text-align: center; }",
      "#d-fly .eb { font: 600 14px/1 'MP Inter', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: #665f50; }",
      "#d-fly .q { font-family: 'MP Serif', Georgia, serif; font-size: 25px; line-height: 1.38; margin-top: 12px; }",
      "#d-fly .a { font-family: 'MP Serif', Georgia, serif; font-size: 23px; line-height: 1.38; margin-top: 12px; }",
      "#d-fly .src { margin-top: 12px; font: 400 15px/1.3 'MP Inter', sans-serif; color: #665f50; }",
      "#d-fly .meta { font: 500 15px/1.2 'MP Inter', sans-serif; color: var(--ink-muted); }",
      "#d-fly .pqq { font: 600 20px/1.38 'MP Inter', sans-serif; margin-top: 10px; }",
      "#d-fly .opt { display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 9px 12px; border: 1px solid var(--edge); border-radius: 12px; font: 400 16px/1.3 'MP Inter', sans-serif; }",
      "#d-fly .opt .L { width: 24px; height: 24px; border-radius: 50%; border: 1px solid var(--edge-strong); display: inline-flex; align-items: center; justify-content: center; font: 600 12px/1 'MP Inter', sans-serif; color: var(--ink-muted); flex: none; }",
      "#d-fly .opt.sel { background: var(--primary-soft); border-color: var(--primary); }",
      "#d-fly .opt.sel .L { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }",
      "#d-fly .lab { margin-top: 12px; font: 500 14px/1.2 'MP Inter', sans-serif; color: var(--ink-muted); }",
      "#d-fly .good { margin-top: 4px; font: 500 17px/1.3 'MP Inter', sans-serif; color: var(--success); }",
      "#d-fly .big { font: 600 56px/1 'MP Fraunces', Georgia, serif; letter-spacing: -0.02em; margin-top: 12px; }",
      "#d-fly .of { font: 500 16px/1.2 'MP Inter', sans-serif; color: var(--ink-muted); margin-top: 8px; }",
      /* ---- the split panel (stage px) ---- */
      "#d-split { position: absolute; left: 0; top: 0; width: 600px; height: 1080px; background: var(--paper); border-right: 1px solid var(--edge);",
      "  box-shadow: 14px 0 40px rgba(62, 45, 30, 0.06); display: flex; flex-direction: column; justify-content: center; padding: 0 32px 110px 48px; will-change: transform; }",
      "#d-split .headline { position: relative; left: auto; right: auto; top: auto; height: auto; align-items: flex-start; justify-content: flex-start; text-align: left; }",
      "#d-split .headline .l { font-size: 60px; line-height: 1.1; }",
      "#d-split .d-sub { margin-top: 30px; font: 400 30px/1.42 'MP Inter', sans-serif; color: var(--ink-muted); letter-spacing: -0.005em; }",
      "#d-split .d-sub span { display: inline-block; white-space: pre; }",
      /* ---- inside the window (logical px, .ui pages) ---- */
      ".ui .d-eb { font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); }",
      ".ui .d-h1 { font-size: 22px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.3; margin-top: 2px; }",
      ".ui .d-p { font-size: 13px; line-height: 1.55; color: var(--ink-muted); }",
      ".ui .d-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }",
      ".ui .d-count { display: flex; justify-content: space-between; margin-top: 12px; font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-count .num { font-variant-numeric: tabular-nums; color: var(--ink); }",
      ".ui .d-bar { margin-top: 6px; }",
      ".ui .d-bar > i { transform-origin: 0 50%; }",
      /* flashcards */
      ".ui .d-fcf { position: relative; height: 148px; margin-top: 10px; }",
      ".ui .d-fcf .fc { position: absolute; left: 0; top: 0; width: 100%; height: 148px; }",
      ".ui .d-fcf .fc-face { padding: 12px 28px; gap: 6px; }",
      ".ui .d-fcf .fc-face .q { font-size: 20px; line-height: 1.4; }",
      ".ui .d-fcf .fc-face .a { font-size: 17px; line-height: 1.5; }",
      ".ui .d-fcf .fc-face .q, .ui .d-fcf .fc-face .a { text-wrap: balance; }",
      ".ui .d-fcf .hintc { font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-fcbtns { display: flex; align-items: center; gap: 8px; margin-top: 10px; }",
      ".ui .fcol.d-tight { padding-top: 12px; }",
      ".ui .d-sp { flex: 1; }",
      ".ui .btn .icon { width: 16px; height: 16px; }",
      /* practice */
      ".ui .d-qcard { margin-top: 12px; padding: 16px 18px; }",
      ".ui .d-qq { font-size: 16px; font-weight: 600; line-height: 1.45; letter-spacing: -0.01em; }",
      ".ui .d-cho { margin-top: 4px; font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-opts { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }",
      ".ui .d-opt { display: flex; align-items: center; gap: 10px; height: 38px; padding: 0 12px; border: 1px solid var(--edge); border-radius: var(--r-control); background: var(--surface); font-size: 14px; color: var(--ink); }",
      ".ui .d-opt .L { width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--edge-strong); display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--ink-muted); flex: none; }",
      ".ui .d-opt.hover { background: var(--sunken); border-color: var(--edge-strong); }",
      ".ui .d-opt.d-sel { background: var(--primary-soft); border-color: var(--primary); }",
      ".ui .d-opt.d-sel .L { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }",
      ".ui .d-hint { margin-top: 10px; font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-nav { display: flex; justify-content: space-between; margin-top: 12px; }",
      ".ui .d-jl { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--edge); font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-jump { display: flex; gap: 6px; margin-top: 8px; }",
      ".ui .d-jump span { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--edge); background: var(--surface); display: inline-flex; align-items: center; justify-content: center; font-size: 13px; color: var(--ink-muted); font-variant-numeric: tabular-nums; }",
      ".ui .d-jump span.done { background: var(--primary-soft); border-color: rgba(171, 90, 20, 0.3); color: var(--primary); }",
      ".ui .d-jump span.cur { border-color: var(--primary); color: var(--primary); font-weight: 600; }",
      ".ui .d-rev { margin-top: 14px; }",
      /* hand in */
      ".ui .d-hcard { margin-top: 12px; padding: 18px 20px; }",
      ".ui .d-big { margin-top: 6px; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }",
      ".ui .d-rows { margin-top: 12px; display: flex; flex-direction: column; }",
      ".ui .d-hrow { display: flex; gap: 12px; padding: 8px 0; border-top: 1px solid var(--edge); }",
      ".ui .d-hrow .n { width: 18px; flex: none; font-size: 13px; color: var(--ink-faint); font-variant-numeric: tabular-nums; padding-top: 1px; }",
      ".ui .d-hrow .t { font-size: 14px; font-weight: 500; line-height: 1.4; }",
      ".ui .d-hrow .y { font-size: 13px; color: var(--ink-muted); line-height: 1.4; }",
      ".ui .d-hbtns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }",
      /* marked */
      ".ui .d-mcard { margin-top: 10px; padding: 13px 20px 14px; text-align: center; }",
      ".ui .d-ring { position: relative; width: 80px; height: 80px; margin: 6px auto 0; }",
      ".ui .d-ring svg { position: absolute; inset: 0; width: 80px; height: 80px; transform: rotate(-90deg); }",
      ".ui .d-ring .in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }",
      ".ui .d-ring .pc { font-family: 'MP Fraunces', Georgia, serif; font-weight: 600; font-size: 23px; line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }",
      ".ui .d-ring .of { margin-top: 3px; font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-mt { margin-top: 8px; font-size: 14px; color: var(--ink-muted); }",
      ".ui .d-mf { margin-top: 2px; font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-tiles { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }",
      ".ui .d-tile { width: 112px; padding: 6px 0 5px; border-radius: var(--r-control); font-size: 13px; }",
      ".ui .d-tile b { display: block; font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 1px; }",
      ".ui .d-tile.r { background: var(--success-soft); color: var(--success); }",
      ".ui .d-tile.w { background: var(--danger-soft); color: var(--danger); }",
      ".ui .d-tile.b { background: var(--sunken); color: var(--ink-muted); }",
      ".ui .d-tile.hover { box-shadow: inset 0 0 0 1px rgba(191, 75, 43, 0.35); }",
      ".ui .d-mbtns { display: flex; justify-content: center; gap: 8px; margin-top: 11px; }",
      ".ui .d-qr { margin-top: 10px; padding: 14px 18px; }",
      ".ui .d-qh { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; font-weight: 500; line-height: 1.45; }",
      ".ui .d-qh .icon { width: 18px; height: 18px; margin-top: 1px; }",
      ".ui .d-qh .k { color: var(--ink-faint); font-variant-numeric: tabular-nums; }",
      ".ui .d-yl { margin: 6px 0 0 26px; font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-yl b { font-weight: 500; margin-left: 6px; }",
      ".ui .d-yl b.ok { color: var(--success); } .ui .d-yl b.no { color: var(--danger); }",
      ".ui .d-ex { margin: 8px 0 0 26px; padding: 10px 12px; border-radius: var(--r-control); background: var(--sunken); }",
      ".ui .d-ex .e { font-size: 13px; line-height: 1.5; color: var(--ink); }",
      ".ui .d-ex .s { margin-top: 3px; font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-ex .s.hover { color: var(--primary); }",
      /* readout */
      ".ui .d-atabs { display: flex; gap: 6px; margin-top: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--edge); }",
      ".ui .d-atabs .chip .n { margin-left: 2px; opacity: 0.7; }",
      ".ui .d-shk { margin-top: 14px; }",
      ".ui .d-shk .h { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }",
      ".ui .d-shk .d-p { margin-top: 2px; }",
      ".ui .d-read { margin-top: 10px; }",
      ".ui .d-read .icon { color: var(--ink-muted); }",
      ".ui .d-rcard { margin-top: 12px; padding: 16px 18px; }",
      ".ui .d-rcard .d-eb + .d-hl { margin-top: 6px; }",
      ".ui .d-hl { font-size: 14px; line-height: 1.55; color: var(--ink-muted); }",
      ".ui .d-wr { margin-top: 14px; }",
      ".ui .d-topic { margin-top: 8px; padding: 1px 0 2px 12px; border-left: 2px solid var(--primary); }",
      ".ui .d-topic .tt { font-size: 14px; font-weight: 600; color: var(--ink); }",
      ".ui .d-topic .tx { margin-top: 2px; font-size: 13px; line-height: 1.55; color: var(--ink-muted); }",
      ".ui .d-topic .tr { margin-top: 4px; font-size: 13px; line-height: 1.55; color: var(--ink); }",
      ".ui .d-topic .tr i { font-style: normal; color: var(--ink-faint); }",
      ".ui .d-topic.hover .tt { color: var(--primary); }",
      ".ui .d-foot { display: flex; align-items: flex-start; gap: 6px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--edge); font-size: 13px; line-height: 1.5; color: var(--ink-faint); }",
      ".ui .d-foot .icon { width: 15px; height: 15px; margin-top: 2px; color: var(--ink-faint); }",
      ".ui .d-foot b { font-weight: 500; color: var(--ink-muted); }",
      ".ui .d-off { display: none; }",
      /* search */
      ".ui .d-sform { display: flex; gap: 8px; width: 512px; margin-top: 14px; }",
      ".ui .d-sin { flex: 1; position: relative; padding-left: 34px; }",
      ".ui .d-sin > .icon { position: absolute; left: 11px; top: 11px; width: 16px; height: 16px; color: var(--ink-faint); }",
      ".ui .d-sin .placeholder { position: absolute; left: 34px; top: 0; line-height: 38px; }",
      ".ui .d-stext { white-space: pre; }",
      ".ui .d-kinds { display: flex; gap: 8px; margin-top: 12px; }",
      ".ui .d-kinds .chip .n { margin-left: 6px; opacity: 0.6; }",
      ".ui .d-kinds .chip.hover { color: var(--ink); border-color: var(--edge-strong); }",
      ".ui .d-empty { margin-top: 16px; padding: 28px 24px; text-align: center; }",
      ".ui .d-empty .icon { width: 26px; height: 26px; color: var(--ink-faint); }",
      ".ui .d-empty .h { margin-top: 8px; font-size: 15px; font-weight: 600; }",
      ".ui .d-empty .d-p { margin: 4px auto 0; max-width: 470px; }",
      ".ui .d-rc { margin-top: 14px; font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-results { position: relative; margin-top: 8px; }",
      ".ui .d-res { padding: 11px 18px 12px; margin-bottom: 8px; }",
      ".ui .d-res .kb { display: flex; align-items: center; gap: 5px; }",
      ".ui .d-res .kb .icon { width: 13px; height: 13px; color: var(--ink-faint); }",
      ".ui .d-res .t { margin-top: 4px; font-size: 14px; font-weight: 500; color: var(--ink); }",
      ".ui .d-res .x { margin-top: 3px; font-size: 13px; line-height: 1.5; color: var(--ink-muted); }",
      ".ui .d-res .f { margin-top: 4px; font-size: 13px; color: var(--ink-faint); }",
      ".ui .d-res .tg { display: inline-block; margin-top: 5px; padding: 1px 8px; border-radius: 999px; background: var(--sunken); font-size: 12px; color: var(--ink-muted); }",
      ".ui .d-res mark { background: var(--pending-soft); color: var(--ink); border-radius: 4px; padding: 0 2px; }",
      ".ui .d-res.hover { border-color: var(--edge-strong); }",
      ".ui .d-res.hover .t { color: var(--primary); }",
      /* note page */
      ".ui .d-crumb { font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-crumb b { font-weight: 500; color: var(--ink); }",
      ".ui .d-ttl { display: flex; align-items: center; gap: 10px; margin-top: 8px; }",
      ".ui .d-ttl .d-h1 { margin-top: 0; }",
      ".ui .d-sum { margin-top: 4px; font-size: 14px; line-height: 1.55; color: var(--ink-muted); }",
      ".ui .d-by { display: flex; align-items: center; gap: 8px; margin-top: 12px; }",
      ".ui .d-by .n { font-size: 14px; font-weight: 500; }",
      ".ui .d-by .m { font-size: 13px; color: var(--ink-muted); }",
      ".ui .d-segw { margin-top: 14px; }",
      ".ui .d-body { margin-top: 12px; padding: 18px 22px; }",
      ".ui .d-body .note-body { font-size: 17px; line-height: 1.6; }",
      ".ui .d-body .note-body ul { margin: 4px 0 10px; }",
      ".ui .d-body .term { font-size: 12px; }",
      ".ui .d-body li.hover { color: var(--ink); background: rgba(251, 234, 211, 0.6); border-radius: 4px; }",
      ".ui .d-nf { margin-top: 10px; font-size: 13px; color: var(--ink-faint); }",
    ].join("\n");
    F.el("style", null, css, document.head);

    // helpers ---------------------------------------------------------------------------------------------------
    const mk = (tag, cls, html, parent) => F.el(tag, cls, html, parent);
    const ic = (name, cls) => '<span class="icon' + (cls ? " " + cls : "") + '">' + I(name) + "</span>";
    // stage point of a node, optionally shifted by the split (dx)
    const P = (node, ax, ay, sy, dx) => { const p = F.pt(node, ax, ay, sy || 0); return { x: p.x + (dx || 0), y: p.y }; };
    const go = (t, node, ax, ay, sy, dur, dx) => { const p = P(node, ax, ay, sy, dx); return C.move(t, p.x, p.y, dur); };
    const drift = (t, dx, dy, dur) => C.move(t, C._last.x + dx, C._last.y + dy, dur);
    // a text that switches at times (seek safe)
    const showAt = (node, t0, t1) => F.driver((t) => { const on = t >= t0 && t < t1; node.style.display = on ? "" : "none"; });

    // ===========================================================================================================
    // 70.0 to 72.5: headline "Turn notes into practice." with flashcards and practice questions flying in.
    // ===========================================================================================================
    F.win.blur(70.0, 72.4);
    F.headline({ t0: 70.0, t1: 72.5, lines: [{ text: "Turn notes into practice.", accent: "practice." }] });
    // the margin props make way for the flying stack (and later for the split screen). D fades their parent, #floaters,
    // so this composes with C's own tweens on #props; while they are hidden, #props is set back to full whatever C left.
    const FLT = F.$("floaters");
    tl.fromTo(FLT, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 70.0);
    tl.set(F.$("props"), { opacity: 1 }, 72.0);
    tl.fromTo(FLT, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: false }, 72.4);

    const fly = mk("div", null, null, F.$("extras"));
    fly.id = "d-fly";
    const CARDS = [
      // [kind, html, centre x, centre y, width, landing rotation, from dx, from dy, from rotation]
      ["fc", '<div class="eb">Question</div><div class="q">What is the cell membrane made of?</div>', 330, 250, 380, -3.5, -760, -260, -9],
      ["pq", '<div class="meta">Question 3 of 10</div><div class="pqq">In osmosis, which way does water move across a selectively permeable membrane?</div><div class="opt sel"><span class="L">B</span>From lower to higher solute concentration</div>', 960, 228, 470, 2, 60, -640, 7],
      ["fc", '<div class="eb">Question</div><div class="q">Which molecules get through the cell membrane, and which need help?</div>', 1585, 262, 400, 3.5, 760, -280, 9],
      ["fc", '<div class="eb">Answer</div><div class="a">A phospholipid bilayer.</div><div class="src">From The cell membrane · membranes</div>', 178, 560, 300, -2.5, -640, 40, -8],
      ["sc", '<div class="eb">Marked</div><div class="big">80%</div><div class="of">8 of 10</div>', 1752, 556, 250, 3, 640, 20, 8],
      ["pq", '<div class="pqq" style="margin-top:0">A cell is placed in a hypertonic environment. What happens to it?</div><div class="lab">Correct answer</div><div class="good">It shrivels as water leaves</div>', 400, 850, 430, 2.5, -700, 330, 8],
      ["fc", '<div class="eb">Answer</div><div class="a">Small molecules get through. Big molecules need a transport protein to get through.</div>', 1000, 878, 420, -2, -40, 620, -7],
      ["pq", '<div class="pqq" style="margin-top:0">Which protein is the best-known checkpoint guard?</div><div class="lab">Correct answer</div><div class="good">p53</div>', 1560, 838, 390, -3, 720, 320, -9],
    ];
    const flyNodes = [];
    CARDS.forEach((c, i) => {
      const n = mk("div", "d-c " + c[0], c[1], fly);
      n.style.width = c[4] + "px";
      flyNodes.push({ n, c });
    });
    // place by measured height (layout is ready: fonts are loaded before build)
    flyNodes.forEach(({ n, c }) => {
      n.style.left = (c[2] - c[4] / 2) + "px";
      n.style.top = (c[3] - n.offsetHeight / 2) + "px";
    });
    tl.set(fly, { display: "none" }, 0);
    tl.set(fly, { display: "block" }, 70.0);
    tl.set(fly, { display: "none" }, 72.6);
    flyNodes.forEach(({ n, c }, i) => {
      const t = 70.05 + i * 0.078, d = 0.6 + (i % 3) * 0.1;
      gsap.set(n, { opacity: 0 });
      tl.fromTo(n, { x: c[6], y: c[7], rotation: c[8], opacity: 0 }, { x: 0, y: 0, rotation: c[5], opacity: 1, duration: d, ease: "expo.out", immediateRender: false }, t);
      // a slow drift while the headline holds (never still)
      const dx = (i % 2 ? 1 : -1) * (8 + (i % 3) * 3), dy = (i % 3 === 1 ? -1 : 1) * (6 + (i % 2) * 4);
      tl.fromTo(n, { x: 0, y: 0 }, { x: dx, y: dy, duration: 72.5 - (t + d), ease: "sine.inOut", immediateRender: false }, t + d);
      // blur out as the window returns
      tl.fromTo(n, { opacity: 1, scale: 1, filter: "blur(0px)" }, { opacity: 0, scale: 0.95, filter: "blur(12px)", duration: 0.45, ease: "power2.in", immediateRender: false }, 72.0 + (i % 4) * 0.03);
    });

    // ===========================================================================================================
    // 71.0 to 77.5: Flashcards (UI-SPEC m). Under the blur from 71.0; clicked at 73.4; "Know it" 74.6; space 75.9.
    // ===========================================================================================================
    const pFc = F.page("d-pfc");
    const cFc = F.shell(pFc, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Study", col: 690 });
    cFc.classList.add("d-tight");
    cFc.innerHTML =
      '<div class="d-eb">Study from the full Pot</div><div class="d-h1">Flashcards</div>' +
      '<div class="d-chips"><span class="chip selected">All <span class="n">12</span></span><span class="chip">osmosis <span class="n">3</span></span>' +
      '<span class="chip">cell cycle <span class="n">2</span></span><span class="chip">cell division <span class="n">2</span></span>' +
      '<span class="chip">membranes <span class="n">2</span></span><span class="chip">organelles <span class="n">2</span></span>' +
      '<span class="chip">tonicity <span class="n">2</span></span><span class="chip">scientific method <span class="n">1</span></span></div>' +
      '<div class="d-count"><span class="num d-fcn">1 / 12</span><span class="d-fck">0 know it · 0 still learning</span></div>' +
      '<div class="bar d-bar"><i class="d-fcbar"></i></div>' +
      '<div class="fc-frame d-fcf">' +
      '<div class="fc d-fc1"><div class="fc-face front"><div class="d-eb">Question</div><div class="q">What is the cell membrane made of?</div><div class="hintc">Click the card, or press space, to turn it over</div></div>' +
      '<div class="fc-face back"><div class="d-eb">Answer</div><div class="a">A phospholipid bilayer.</div><div class="hintc">From The cell membrane · membranes</div></div></div>' +
      '<div class="fc d-fc2"><div class="fc-face front"><div class="d-eb">Question</div><div class="q">Which molecules get through the cell membrane, and which need help?</div><div class="hintc">Click the card, or press space, to turn it over</div></div>' +
      '<div class="fc-face back"><div class="d-eb">Answer</div><div class="a">Small molecules get through. Big molecules need a transport protein to get through.</div><div class="hintc">From The cell membrane · membranes</div></div></div>' +
      "</div>" +
      '<div class="d-fcbtns"><span class="btn secondary sm">Still learning</span><span class="btn primary sm d-know">' + ic("check") + "Know it</span>" +
      '<span class="d-sp"></span><span class="btn ghost sm">' + ic("shuffle") + 'Shuffle</span><span class="btn ghost sm">' + ic("arrow-clockwise") + "Start over</span></div>";
    const q = (root, sel) => root.querySelector(sel);
    const fcFrame = q(cFc, ".d-fcf"), fc1 = q(cFc, ".d-fc1"), fc2 = q(cFc, ".d-fc2"), know = q(cFc, ".d-know");
    const fcBar = q(cFc, ".d-fcbar");
    F.pageIn(71.0, pFc);
    F.win.setUrl(71.0, "meltingpots.xyz/p/biology-101/study/flashcards");
    F.caption({ t0: 72.7, t1: 77.5, icon: "cards", bold: "Flashcards", rest: " from the notes the class shared." });

    gsap.set(fcBar, { scaleX: 0 });
    gsap.set(fc2, { opacity: 0 });
    C.at(72.4, 1990, 1030);
    C.show(72.5);
    go(72.5, fcFrame, 0.64, 0.6, 0, 0.7);                 // lands 73.2
    C.hover(fcFrame, 73.05, 73.45);
    C.click(73.4, fcFrame);
    tl.fromTo(fc1, { rotationX: 0 }, { rotationX: 180, duration: 0.44, ease: FLIP, immediateRender: false }, 73.48);
    go(74.0, know, 0.5, 0.56, 0, 0.5);                    // lands 74.5
    C.hover(know, 74.3, 74.68);
    C.click(74.6, know);
    F.textAt(q(cFc, ".d-fcn"), [[0, "1 / 12"], [74.68, "2 / 12"]]);
    F.textAt(q(cFc, ".d-fck"), [[0, "0 know it · 0 still learning"], [74.68, "1 know it · 0 still learning"]]);
    tl.fromTo(fcBar, { scaleX: 0 }, { scaleX: 1 / 12, duration: 0.3, ease: EXPO, immediateRender: false }, 74.68);
    // Fade the answer face, never the 3D card: opacity below 1 on the preserve-3d card flattens it and shows the
    // question face mirrored through the back (final check, 74.67). The question face is hidden outright.
    { const fr = q(fc1, ".fc-face.front"); F.driver((t) => { fr.style.visibility = t >= 74.66 ? "hidden" : ""; }); }
    tl.fromTo(q(fc1, ".fc-face.back"), { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in", immediateRender: false }, 74.66);
    tl.fromTo(fc2, { x: 36, opacity: 0 }, { x: 0, opacity: 1, duration: 0.44, ease: FLIP, immediateRender: false }, 74.7);
    drift(74.95, 250, -100, 0.7);                         // off the buttons, onto the card, while the next card settles
    drift(75.7, 10, -6, 0.9);
    F.sound("key-heavy", 75.9, { n: 2, db: 8 });          // the space bar turns it (shortcut_03: sharp attack, clear of the music)
    tl.fromTo(fc2, { rotationX: 0 }, { rotationX: 180, duration: 0.44, ease: FLIP, immediateRender: false }, 75.9);
    drift(76.65, 160, -140, 0.7);                         // up onto the empty top of the answer card as the beat ends

    // ===========================================================================================================
    // 77.5 to 85.0: Practice (UI-SPEC n): pick B (78.4), "Review and hand in" (79.3), "Hand it in" (80.7), marked.
    // ===========================================================================================================
    const head = '<div class="d-eb">Study from the full Pot</div><div class="d-h1">Practice</div>';
    const pPr = F.page("d-ppr");
    const cPr = F.shell(pPr, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Study", col: 640 });
    const OPTS = [["A", "From higher to lower solute concentration"], ["B", "From lower to higher solute concentration"], ["C", "Only out of the cell"], ["D", "Only into the cell"]];
    cPr.innerHTML = head +
      '<div class="d-count"><span>Question 3 of 10</span><span class="d-ans">9 answered</span></div>' +
      '<div class="bar d-bar"><i class="d-prbar"></i></div>' +
      '<div class="card d-qcard"><div class="d-qq">In osmosis, which way does water move across a selectively permeable membrane?</div>' +
      '<div class="d-cho">Choose one answer</div><div class="d-opts">' +
      OPTS.map((o) => '<div class="d-opt"><span class="L">' + o[0] + "</span>" + o[1] + "</div>").join("") + "</div>" +
      '<div class="d-hint">You can change this answer until you hand the test in.</div></div>' +
      '<div class="d-nav"><span class="btn secondary">' + ic("arrow-left") + 'Previous</span><span class="btn primary">Next' + ic("arrow-right") + "</span></div>" +
      '<div class="d-jl">Jump to a question</div><div class="d-jump">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => '<span class="' + (k !== 3 ? "done" : "cur") + '">' + k + "</span>").join("") + "</div>" +
      '<div class="d-rev"><span class="btn primary d-revb">Review and hand in</span></div>';
    const optB = cPr.querySelectorAll(".d-opt")[1], revB = q(cPr, ".d-revb"), j3 = cPr.querySelectorAll(".d-jump span")[2];
    gsap.set(q(cPr, ".d-prbar"), { scaleX: 0.9 });
    F.swap(77.5, pFc, pPr);
    F.win.setUrl(77.6, "meltingpots.xyz/p/biology-101/study/practice");
    F.caption({ t0: 77.7, t1: 84.9, icon: "exam", bold: "Practice tests", rest: " marked with the answer and where it came from." });
    go(77.65, optB, 0.34, 0.5, 0, 0.6);                   // lands 78.25
    C.hover(optB, 78.05, 78.48);
    C.click(78.4, optB);
    F.classAt(optB, "d-sel", 78.48, 999);
    F.classAt(j3, "done", 78.48, 999);
    // Question 3 is the last one Amy fills in, so the count and the bar agree with "10 of 10 answered" next (final check).
    F.textAt(q(cPr, ".d-ans"), [[0, "9 answered"], [78.48, "10 answered"]]);
    tl.fromTo(q(cPr, ".d-prbar"), { scaleX: 0.9 }, { scaleX: 1, duration: 0.3, ease: EXPO, immediateRender: false }, 78.48);
    // scroll so "Review and hand in" sits near the bottom of the view (the main area is 440 tall under the 40 top bar)
    const SPR = Math.max(0, Math.round(F.inPage(revB).y - 40 + revB.offsetHeight + 22 - 440));
    F.scroll(78.5, pPr, SPR, 0.8);
    go(78.62, revB, 0.5, 0.55, SPR, 0.6);                 // lands 79.22
    C.hover(revB, 79.05, 79.38);
    C.click(79.3, revB);

    // Before you hand it in
    const ROWS = [
      ["What is the cell membrane made of?", "A phospholipid bilayer"],
      ["According to the class notes, how do big molecules get through the cell membrane?", "They need a transport protein"],
      ["In osmosis, which way does water move across a selectively permeable membrane?", "From lower to higher solute concentration"],
      ["A cell is placed in a hypertonic environment. What happens to it?", "It swells and may burst"],
      ["Why is salt lethal to a slug?", "It pulls water out of the slug's body by osmosis"],
      ["How many cells does meiosis produce, and with how many chromosomes each?", "Four, with half the count"],
      ["What does the body use mitosis for?", "Growth, repair and replacing worn-out cells"],
      ["In which phase of the cell cycle is DNA copied?", "S"],
      ["Which protein is the best-known checkpoint guard?", "ATP"],
      ["Which organelle produces ATP?", "Mitochondria"],
    ];
    const pHi = F.page("d-phi");
    const cHi = F.shell(pHi, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Study", col: 640 });
    cHi.innerHTML = head +
      '<div class="card d-hcard"><div class="d-eb">Before you hand it in</div><div class="d-big">10 of 10 answered</div>' +
      '<div class="d-p">Everything is answered. Nothing is marked until you hand it in.</div><div class="d-rows">' +
      ROWS.map((r, i) => '<div class="d-hrow"><span class="n">' + (i + 1) + '</span><div><div class="t">' + r[0] + '</div><div class="y">Your answer: ' + r[1] + "</div></div></div>").join("") +
      '</div><div class="d-hbtns"><span class="btn secondary">Keep answering</span><span class="btn primary d-hand"><span class="d-l1">Hand it in</span><span class="d-l2">Marking</span></span></div></div>';
    const hand = q(cHi, ".d-hand");
    F.swap(79.38, pPr, pHi);
    const SHI = Math.max(0, Math.round(F.inPage(hand).y - 40 + hand.offsetHeight + 30 - 440));
    F.scroll(79.7, pHi, SHI, 0.9);
    go(79.85, hand, 0.5, 0.55, SHI, 0.7);                 // lands 80.55
    C.hover(hand, 80.4, 80.95);
    C.click(80.7, hand);
    showAt(q(cHi, ".d-l1"), -1, 80.78);
    showAt(q(cHi, ".d-l2"), 80.78, 999);

    // Marked
    const QS = [
      ["1.", "What is the cell membrane made of?", "A phospholipid bilayer", null, "The class notes describe the cell membrane as a phospholipid bilayer.", "From The cell membrane"],
      ["2.", "According to the class notes, how do big molecules get through the cell membrane?", "They need a transport protein", null, "Small molecules get through on their own; big molecules need a transport protein to get through.", "From The cell membrane"],
      ["3.", "In osmosis, which way does water move across a selectively permeable membrane?", "From lower to higher solute concentration", null, "Water moves from lower to higher solute concentration: water follows solute.", "From Osmosis and tonicity"],
      ["4.", "A cell is placed in a hypertonic environment. What happens to it?", "It swells and may burst", "It shrivels as water leaves", "Hypertonic means more solute outside the cell, so water leaves and the cell shrivels.", "From Osmosis and tonicity"],
      ["5.", "Why is salt lethal to a slug?", "It pulls water out of the slug's body by osmosis", null, "Salt on a slug pulls water out of its body by osmosis.", "From Osmosis and tonicity"],
      ["6.", "How many cells does meiosis produce, and with how many chromosomes each?", "Four, with half the count", null, "Meiosis divides twice, producing four cells, each with half the chromosome count.", "From Mitosis vs meiosis"],
    ];
    const pMk = F.page("d-pmk");
    const cMk = F.shell(pMk, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Study", col: 640 });
    const R = 34, CIRC = 2 * Math.PI * R;
    cMk.innerHTML = head +
      '<div class="card d-mcard"><div class="d-eb">Marked</div>' +
      '<div class="d-ring"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="' + R + '" fill="none" stroke="var(--sunken)" stroke-width="6"/>' +
      '<circle class="d-arc" cx="40" cy="40" r="' + R + '" fill="none" stroke="var(--primary)" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="' + CIRC.toFixed(2) + '"/></svg>' +
      '<div class="in"><span class="pc">0%</span><span class="of">8 of 10</span></div></div>' +
      '<div class="d-mt">Everything you missed is below, with the answer and where it came from.</div>' +
      '<div class="d-mf">Recorded as your first pass on this test.</div>' +
      '<div class="d-tiles"><div class="d-tile r">Right<b>8</b></div><div class="d-tile w">Wrong<b>2</b></div><div class="d-tile b">Blank<b>0</b></div></div>' +
      '<div class="d-mbtns"><span class="btn primary">Try the 2 you missed</span><span class="btn secondary">Take it again</span><span class="btn ghost">' + ic("sparkle") + "Change the test</span></div></div>" +
      QS.map((r) => '<div class="card d-qr"><div class="d-qh">' + (r[3] ? ic("xcircle-fill") .replace('class="icon"', 'class="icon" style="color:var(--danger)"') : ic("check-circle-fill").replace('class="icon"', 'class="icon" style="color:var(--success)"')) +
        '<span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>" +
        '<div class="d-yl">Your answer<b class="' + (r[3] ? "no" : "ok") + '">' + r[2] + "</b></div>" +
        (r[3] ? '<div class="d-yl">Correct answer<b class="ok">' + r[3] + "</b></div>" : "") +
        '<div class="d-ex"><div class="e">' + r[4] + '</div><div class="s">' + r[5] + "</div></div></div>").join("");
    const pc = q(cMk, ".pc"), arc = q(cMk, ".d-arc"), wTile = q(cMk, ".d-tile.w");
    const qCards = cMk.querySelectorAll(".d-qr"), q4 = qCards[3];
    const q4ok = q4.querySelectorAll(".d-yl")[1], q4src = q(q4, ".s");
    F.swap(81.0, pHi, pMk);
    F.driver((t) => {
      const u = SCORE(F.clamp((t - 81.25) / 1.1, 0, 1));
      const v = Math.round(80 * u);
      const s = v + "%";
      if (pc.textContent !== s) pc.textContent = s;
      arc.setAttribute("stroke-dashoffset", (CIRC * (1 - 0.8 * u)).toFixed(2));
    });
    drift(81.0, -40, -120, 0.75);                          // towards the score while it counts
    go(81.85, wTile, 0.62, 0.5, 0, 0.55);                  // lands 82.4
    C.hover(wTile, 82.2, 82.7, false);
    const SMK = Math.max(0, Math.round(F.inPage(q4).y - 40 - 14));
    F.scroll(82.7, pMk, SMK, 1.3);
    drift(82.75, 30, 70, 1.15);
    go(84.0, q4ok, 0.42, 0.5, SMK, 0.5);                   // lands 84.5 on "Correct answer"
    go(84.55, q4src, 0.7, 0.55, SMK, 0.42);                // lands 84.97 on "From Osmosis and tonicity"
    C.hover(q4src, 84.8, 85.2, false);

    // ===========================================================================================================
    // 85.0 to 95.0: the one split screen. Paper panel from the left, window shifts right by 300, readout (UI-SPEC p).
    // ===========================================================================================================
    const split = mk("div", null, null, F.$("extras"));
    split.id = "d-split";
    const hl = F.headline({ t0: 85.0, lead: 0.32, lines: [{ text: "See what the class" }, { text: "is missing.", accent: "missing." }], lineGap: 0.15 });
    split.appendChild(hl.layer);
    const sub = mk("div", "d-sub", null, split);
    "Whoever runs the Pot sees which topics the class missed, and what to try next.".split(" ").forEach((w, i, a) => mk("span", null, w + (i < a.length - 1 ? " " : ""), sub));
    const subWords = Array.prototype.slice.call(sub.children);
    gsap.set(split, { x: -720 });
    tl.set(split, { display: "none" }, 0);
    tl.set(split, { display: "flex" }, 84.95);
    tl.fromTo(split, { x: -720 }, { x: 0, duration: 0.5, ease: "power3.inOut", immediateRender: false }, 85.0);
    tl.fromTo(split, { x: 0 }, { x: -720, duration: 0.5, ease: "power3.inOut", immediateRender: false }, 94.3);
    tl.set(split, { display: "none" }, 94.85);
    tl.fromTo(FLT, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power2.in", immediateRender: false }, 85.0);
    tl.fromTo(FLT, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: false }, 94.3);
    subWords.forEach((w, i) => {
      gsap.set(w, { opacity: 0, y: 12, filter: "blur(4px)" });
      tl.to(w, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, 86.55 + i * 0.05);
    });
    const winNode = F.$("win");
    tl.fromTo(winNode, { x: 0 }, { x: SHIFT, duration: 0.5, ease: "power3.inOut", immediateRender: false }, 85.0);
    tl.fromTo(winNode, { x: SHIFT }, { x: 0, duration: 0.5, ease: "power3.inOut", immediateRender: false }, 94.3);

    const pRo = F.page("d-pro");
    const cRo = F.shell(pRo, { nav: "pots", tabs: ["Feed", "Study", "Members", "Admin", "Settings"], tab: "Admin", adminCount: 1, col: 640 });
    cRo.innerHTML =
      '<div class="d-h1">Admin</div><div class="d-p">What this Pot has been asked for, what it has been written from, and what has been taken out of it. Only a person can approve a change.</div>' +
      '<div class="d-atabs"><span class="chip">Review<span class="n">1</span></span><span class="chip">Shared notes<span class="n">7</span></span>' +
      '<span class="chip">History<span class="n">9</span></span><span class="chip selected">Study<span class="n">4</span></span><span class="chip">Removed<span class="n">0</span></span></div>' +
      '<div class="d-shk"><div class="h">What the class is shaky on</div><div class="d-p">Read from the questions your class has actually answered, grouped by the note each question came from. About the material, not the people: no student is named, counted, or compared here.</div>' +
      '<span class="btn secondary sm d-read">' + ic("chalkboard-teacher") + '<span class="d-r1">Read the results</span><span class="d-r2">Reading the results</span><span class="d-r3">Read them again</span></span></div>' +
      '<div class="card d-rcard">' +
      '<div class="d-eb d-s">Holding up</div>' +
      '<div class="d-hl d-s">The class can tell mitosis from meiosis by what each one produces.</div>' +
      '<div class="d-hl d-s">Organelle jobs are holding up, starting with where ATP comes from.</div>' +
      '<div class="d-hl d-s">The structure of the cell membrane has landed, including how big molecules get through.</div>' +
      '<div class="d-eb d-wr d-s">Worth revisiting</div>' +
      '<div class="d-topic d-s d-t1"><div class="tt">Osmosis and tonicity</div><div class="tx">The misses run the wrong way round: hypertonic is being read as the cell swelling, so the direction water moves is the confusion, not the vocabulary.</div>' +
      '<div class="tr"><i>Try this: </i><span class="d-try1">Draw one cell in salt water and one in fresh water, have students add arrows for where the water goes, and only then name each case hypertonic or hypotonic.</span></div></div>' +
      '<div class="d-topic d-s d-t2"><div class="tt">The cell cycle and its checkpoints</div><div class="tx">A thinner signal: the misses mix up what happens in S phase with who guards the checkpoints.</div>' +
      '<div class="tr"><i>Try this: </i>Run a two-minute sort of G1, S, G2 and M with one job each, then ask what p53 stops and why that matters.</div></div>' +
      '<div class="d-foot d-s">' + ic("sparkle-fill") + "<span>Read by <b>gemini-3.1-pro-preview</b> from 40 answers. The counts are the database's, not the model's.</span></div>" +
      "</div>";
    const readB = q(cRo, ".d-read"), rcard = q(cRo, ".d-rcard"), streams = cRo.querySelectorAll(".d-s");
    const t1n = q(cRo, ".d-t1"), t2n = q(cRo, ".d-t2"), foot = q(cRo, ".d-foot"), hlines = cRo.querySelectorAll(".d-hl");
    F.swap(85.05, pMk, pRo);
    F.win.setUrl(85.15, "meltingpots.xyz/p/biology-101/admin?tab=study");
    // the cursor travels with the window
    C.move(85.0, C._last.x + SHIFT, C._last.y, 0.5, 0);
    drift(85.5, -14, 10, 0.4);
    go(85.95, q(cRo, ".d-r1"), 0.5, 0.55, 0, 0.6, SHIFT); // lands 86.55 on the visible label (all three labels are laid out at build)
    C.hover(readB, 86.45, 86.98);
    C.click(86.9, readB);
    showAt(q(cRo, ".d-r1"), -1, 86.98);
    const r2 = q(cRo, ".d-r2");
    showAt(r2, 86.98, 88.6);
    showAt(q(cRo, ".d-r3"), 88.6, 999);
    if (window.MP && MP.shimmer) MP.shimmer(tl, { el: r2, t0: 86.98, t1: 88.6, period: 1.1, spread: 4, base: 0.35 });
    drift(87.2, 70, 56, 0.7);
    drift(87.9, 8, 6, 0.8);
    // the readout arrives
    gsap.set(rcard, { opacity: 0 });
    tl.fromTo(rcard, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: EXPO, immediateRender: false }, 88.6);
    Array.prototype.forEach.call(streams, (s, i) => {
      gsap.set(s, { opacity: 0 });
      tl.fromTo(s, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: EXPO, immediateRender: false }, 88.72 + i * 0.1);
    });
    go(88.95, hlines[1], 0.55, 0.5, 0, 0.6, SHIFT);        // lands 89.55 over "Holding up"
    const SRO = Math.max(0, Math.round(F.inPage(foot).y - 40 + foot.offsetHeight + 30 - 440));
    F.scroll(89.6, pRo, SRO, 1.6);
    drift(89.6, 16, 40, 1.5);
    go(91.3, t1n, 0.6, 0.78, SRO, 0.55, SHIFT);           // lands 91.85 on the first "Try this"
    C.hover(t1n, 91.6, 92.75, false);
    if (window.MP && MP.markerSweep) MP.markerSweep(tl, { el: q(cRo, ".d-try1"), t: 91.85, dur: 0.6 });
    go(92.7, t2n, 0.45, 0.25, SRO, 0.55, SHIFT);           // lands 93.25 on the second topic
    C.hover(t2n, 93.1, 93.65, false);
    go(93.6, foot, 0.5, 0.5, SRO, 0.5, SHIFT);             // lands 94.1 on the model line
    C.move(94.3, C._last.x - SHIFT, C._last.y, 0.5, 0);

    // ===========================================================================================================
    // 95.0 to 105.0: Search (UI-SPEC o), then the note page (h).
    // ===========================================================================================================
    const pSe = F.page("d-pse");
    const cSe = F.shell(pSe, { nav: "search", col: 640 });
    const mark = (s) => s.replace("cell membrane", "<mark>cell membrane</mark>");
    const RES = [
      ["notebook", "Note", mark("The cell membrane"), mark("The cell membrane is a phospholipid bilayer, and size decides what gets through it."), null, "Biology 101 · Amy · Week 2: Cell structure · 2 versions · 5m ago"],
      ["notebook", "Note", "Osmosis and tonicity", "Water crosses a selectively permeable membrane toward the higher solute concentration; tonicity describes which way cells gain or lose water.", null, "Biology 101 · Ibrahim · Week 2: Cell structure · 2d ago"],
      ["cards", "Flashcard", mark("What is the cell membrane made of?"), "A phospholipid bilayer.", "membranes", "Biology 101 · From The cell membrane · just now"],
      ["folder-simple", "Section", "Week 2: Cell structure", null, null, "Biology 101 · A part of this Pot"],
    ];
    const KINDS = [["All", 4], ["Notes", 2], ["Summaries", 0], ["Flashcards", 1], ["Sections", 1]];
    cSe.innerHTML =
      '<div class="d-h1">Search</div>' +
      '<div class="d-sform"><div class="input d-sin">' + ic("magnifying-glass") + '<span class="d-stext"></span><span class="caret d-scar"></span>' +
      '<span class="placeholder d-sph">Search notes, summaries, and flashcards</span></div><span class="btn primary d-sgo">Search</span></div>' +
      '<div class="d-kinds">' + KINDS.map((k) => '<span class="chip' + (k[0] === "All" ? " selected" : "") + '">' + k[0] + '<span class="n">' + k[1] + "</span></span>").join("") + "</div>" +
      '<div class="card dashed d-empty">' + ic("magnifying-glass") + '<div class="h">Search your class knowledge</div><div class="d-p">Shared notes, study summaries, and flashcards from every Pot you are in. Try a topic, a classmate\'s name, a section, or a word from a note.</div></div>' +
      '<div class="d-rc">4 results for "cell membrane"</div>' +
      '<div class="d-results">' + RES.map((r) => '<div class="card d-res"><div class="kb">' + ic(r[0]) + '<span class="d-eb">' + r[1] + '</span></div><div class="t">' + r[2] + "</div>" +
        (r[3] ? '<div class="x">' + r[3] + "</div>" : "") + (r[4] ? '<span class="tg">' + r[4] + "</span>" : "") + '<div class="f">' + r[5] + "</div></div>").join("") + "</div>";
    const sin = q(cSe, ".d-sin"), stext = q(cSe, ".d-stext"), scar = q(cSe, ".d-scar"), sph = q(cSe, ".d-sph"), sgo = q(cSe, ".d-sgo");
    const chips = cSe.querySelectorAll(".d-kinds .chip"), chipAll = chips[0], chipFl = chips[3];
    const counts = cSe.querySelectorAll(".d-kinds .chip .n");
    const empty = q(cSe, ".d-empty"), rc = q(cSe, ".d-rc"), resN = Array.prototype.slice.call(cSe.querySelectorAll(".d-res"));
    const resBox = q(cSe, ".d-results");
    F.swap(94.85, pRo, pSe);
    F.win.setUrl(95.0, "meltingpots.xyz/search");
    F.caption({ t0: 95.4, t1: 104.9, icon: "magnifying-glass", bold: "Find it", rest: " when it matters." });
    go(95.15, sin, 0.34, 0.55, 0, 0.6);                    // lands 95.75
    C.hover(sin, 95.55, 95.9, false);
    C.click(95.8);
    F.classAt(sin, "focus", 95.85, 102.1);
    showAt(sph, -1, 95.95);
    F.type(stext, "cell membrane", 95.95, { cps: 22, seed: 47, caret: scar, caretFrom: 95.85, caretUntil: 97.0 });
    drift(96.15, 46, 62, 0.75);
    F.sound("enter", 96.9);
    F.classAt(sgo, "pressed", 96.9, 97.04);
    F.win.setUrl(96.95, "meltingpots.xyz/search?q=cell+membrane");
    // counts on the kind pills appear once a query has run
    Array.prototype.forEach.call(counts, (n) => showAt(n, 96.98, 999));
    // the empty state gives way to the result list
    tl.set(empty, { display: "block" }, 0);
    tl.fromTo(empty, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in", immediateRender: false }, 96.95);
    tl.set(empty, { display: "none" }, 97.1);
    showAt(rc, 97.1, 999);
    showAt(resBox, 97.1, 999);
    gsap.set(rc, { opacity: 0 });
    tl.fromTo(rc, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, 97.1);
    F.textAt(rc, [[0, '4 results for "cell membrane"'], [99.48, '1 result for "cell membrane"'], [100.68, '4 results for "cell membrane"']]);
    resN.forEach((n, i) => {
      gsap.set(n, { opacity: 0 });
      tl.fromTo(n, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, 97.15 + i * 0.28);
    });
    // measure the result positions as they sit once the empty state has gone (restored at the end of the build)
    empty.style.display = "none";
    const resTop = resN.map((n) => n.offsetTop);
    const lastRes = resN[3];
    const resBottom = F.inPage(lastRes).y - 40 + lastRes.offsetHeight;
    const DY = resTop[2] - resTop[0];
    // scroll down while the list fills so all four show, then back up to the filters
    const SSE = Math.max(0, Math.round(resBottom + 14 - 440));
    if (SSE > 0) {
      tl.fromTo(pSe.scroller, { y: 0 }, { y: -SSE, duration: 0.85, ease: "power2.inOut", immediateRender: false }, 97.75);
      tl.fromTo(pSe.scroller, { y: -SSE }, { y: 0, duration: 0.6, ease: "power2.inOut", immediateRender: false }, 98.75);
      drift(97.8, 12, 56, 0.8);
    }
    go(98.75, chipFl, 0.5, 0.55, 0, 0.55);                 // lands 99.3
    C.hover(chipFl, 99.1, 99.5);
    C.click(99.4, chipFl);
    F.driver((t) => {
      const fl = t >= 99.48 && t < 100.68;
      chipFl.classList.toggle("selected", fl);
      chipAll.classList.toggle("selected", !fl);
    });
    // filter: everything but the flashcard leaves, the flashcard rises to the top; "All" brings them back
    [0, 1, 3].forEach((k) => {
      tl.fromTo(resN[k], { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false }, 99.48);
      tl.fromTo(resN[k], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out", immediateRender: false }, 100.8 + (k === 3 ? 0.08 : 0));
    });
    tl.fromTo(resN[2], { y: 0 }, { y: -DY, duration: 0.42, ease: EXPO, immediateRender: false }, 99.55);
    tl.fromTo(resN[2], { y: -DY }, { y: 0, duration: 0.42, ease: EXPO, immediateRender: false }, 100.68);
    // hover the flashcard result where it now sits
    const pf = F.pt(resN[2], 0.55, 0.45, 0);
    C.move(99.75, pf.x, pf.y - DY * F.WIN.scale, 0.5);
    C.hover(resN[2], 100.0, 100.68, false);
    go(100.1, chipAll, 0.5, 0.55, 0, 0.45);                // lands 100.55
    C.hover(chipAll, 100.4, 100.7);
    C.click(100.6, chipAll);
    const res1t = q(resN[0], ".t");
    go(101.1, res1t, 0.3, 0.55, 0, 0.6);                   // lands 101.7
    C.hover(resN[0], 101.45, 102.1);
    C.click(102.0, resN[0]);

    // the note page
    const pNt = F.page("d-pnt");
    const cNt = F.shell(pNt, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Feed", col: 640 });
    cNt.innerHTML =
      '<div class="d-crumb">Biology 101 › Week 2: Cell structure › <b>The cell membrane</b></div>' +
      '<div class="d-ttl"><div class="d-h1">The cell membrane</div><span class="badge primary">Version 2</span></div>' +
      '<div class="d-sum">The cell membrane is a phospholipid bilayer, and size decides what gets through it.</div>' +
      '<div class="d-by"><span class="avatar sm t2">' + I("user-fill") + '</span><span class="n">Amy</span><span class="m">Shared 5m ago · corrected by Ibrahim</span>' +
      '<span class="d-sp"></span><span class="btn ghost sm">' + ic("clock-counter-clockwise") + 'History</span><span class="btn secondary sm">' + ic("chat-circle-text") + "Suggest correction</span></div>" +
      '<div class="d-segw"><span class="seg"><span class="tab">Original</span><span class="tab active" style="background:var(--surface);box-shadow:var(--shadow-card)">Organized</span></span></div>' +
      '<div class="card d-body"><div class="note-body"><div class="term">Cell membrane</div><ul><li>A <mark>phospholipid bilayer</mark>.</li><li>Small molecules get through.</li>' +
      '<li class="d-li3">Big molecules need a transport protein to get through.</li></ul><div class="term">Key takeaways</div><ul><li>The cell membrane is a phospholipid bilayer.</li><li>Size decides what gets through.</li></ul></div></div>' +
      '<div class="d-nf">Built from notes shared in this Pot. The original is always preserved alongside every version.</div>';
    const li3 = q(cNt, ".d-li3");
    F.swap(102.08, pSe, pNt);
    F.win.setUrl(102.18, "meltingpots.xyz/p/biology-101/n/the-cell-membrane");
    const SNT = 110;
    F.scroll(102.9, pNt, SNT, 1.0);
    go(102.45, li3, 0.62, 0.5, SNT, 0.9);                  // follows the body down as it scrolls in
    C.hover(li3, 103.2, 103.95, false);
    C.move(103.95, 1990, 1100, 0.5);                        // leaves down and right by 104.45
    C.hide(104.3);
    // contract: the last page leaves 0.3 s after the chunk's end, under chunk A's blur
    F.pageOut(105.3, pNt);
    empty.style.display = "";
  },
});
