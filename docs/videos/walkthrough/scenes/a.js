// scenes/a.js: chunk A of the walkthrough film (notes/STORYBOARD.md): the hook and brand (0 to 10) and the close and
// end (105 to 120). A also owns the props (cream note cards and keycaps around the window) and the dot grid.
// Every change is a tween on F.tl at an absolute time or a seek-safe driver; selectors are scoped under "a-".
(function () {
  "use strict";

  const CSS = [
    // the opening line, built by hand so "Study" can be typed and the rest can build on the same line
    ".a-hook{position:absolute;left:0;top:0;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none}",
    ".a-hook .a-l{font-family:'MP Fraunces',Georgia,serif;font-weight:600;font-size:104px;line-height:1.12;letter-spacing:-0.015em;color:var(--ink);font-variation-settings:'opsz' 144;white-space:nowrap}",
    ".a-hook .a-w{display:inline-block;white-space:pre;color:#ab5a14}",
    ".a-hook .a-typed{display:inline-block;position:relative;text-align:left;white-space:pre}",
    ".a-hook .a-car{display:inline-block;width:4px;height:0.86em;margin-left:5px;vertical-align:-0.06em;border-radius:2px;background:var(--primary)}",
    // the brand lockup (mark, wordmark) and the lines under it
    ".a-brand{position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none;transform-origin:960px 500px}",
    ".a-mark{position:absolute;width:150px;height:150px;will-change:transform,opacity,filter}",
    ".a-mark img{display:block;width:150px;height:150px;object-fit:contain}",
    ".a-wmclip{position:absolute;height:170px;overflow:hidden}",
    ".a-wm{position:absolute;top:0;font-family:'MP Baloo',sans-serif;font-weight:700;font-size:106px;line-height:170px;letter-spacing:-0.025em;color:var(--ink);white-space:nowrap}",
    ".a-sub{position:absolute;left:0;width:1920px;text-align:center;font:500 34px/1.3 'MP Inter',sans-serif;color:var(--ink-muted);letter-spacing:-0.01em;white-space:nowrap}",
    ".a-sub .a-w{display:inline-block;white-space:pre}",
    ".a-endline{position:absolute;left:0;width:1920px;display:flex;justify-content:center}",
    ".a-pill{display:inline-flex;align-items:center;height:64px;padding:0 36px;border-radius:999px;background:#ab5a14;color:var(--on-primary);font:600 30px/1 'MP Inter',sans-serif;letter-spacing:-0.005em}",
    ".a-gh{font:500 26px/1.2 'MP Inter',sans-serif;color:var(--ink-faint);letter-spacing:-0.005em}",
    ".a-note{font:400 20px/1.3 'MP Inter',sans-serif;color:var(--ink-faint)}",
    // app cards that fly through (hook) and gather round the window (close); drawn with the app's own classes at 1x
    ".a-layer{position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none}",
    ".a-card{position:absolute;left:0;top:0;will-change:transform,opacity,filter}",
    ".a-card .a-mid{will-change:transform}",
    ".a-card .ui{transform-origin:50% 50%}",
    ".a-card .card,.a-card .notice,.a-card .a-fc{box-shadow:0 18px 40px rgba(62,45,30,0.12),0 2px 6px rgba(36,34,44,0.06)}",
    ".a-card .a-nc{width:360px}",
    ".a-card .a-nc .row{gap:8px}",
    ".a-card .a-nt{width:350px;background:var(--success-soft)}",
    ".a-card .a-nt .icon svg{fill:var(--success)}",
    ".a-card .a-fc{width:340px;height:196px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;background:var(--card-face);border:1px solid var(--edge);border-radius:14px;--ink-faint:#665f50}",
    ".a-card .a-fc .q{font-family:'MP Serif',Georgia,serif;font-size:20px;line-height:1.5;color:var(--ink)}",
    ".a-card .a-fc .a{font-family:'MP Serif',Georgia,serif;font-size:19px;line-height:1.5;color:var(--ink)}",
    ".a-card .a-fc .tiny{font-size:12px;color:#665f50}",
    ".a-card .a-pr{width:210px;padding:18px 22px}",
    ".a-card .a-pr .a-pct{margin-top:4px;font-size:44px;font-weight:600;letter-spacing:-0.03em;line-height:1.1;font-variant-numeric:tabular-nums}",
    ".a-card .a-hr{width:340px;padding:16px 20px}",
    ".a-card .a-hr .row{gap:8px;margin-bottom:4px}",
    ".a-card .a-hr .a-r{margin-left:auto}",
    ".a-card .a-cd{width:250px;padding:14px}",
    ".a-card .a-cd .h3{margin-bottom:10px}",
    ".a-card .a-cd .cal{grid-template-columns:repeat(3,1fr)}",
    ".a-card .a-cd .day{min-height:64px}",
    // the props get one tweak: a note card with no title shows no empty title line
    "#props .prop.note b:empty{display:none}",
    "#props .prop.note{width:280px;font-size:18px;line-height:1.4}",
    // the close's feed page (under the blur)
    "#a-pfeed .a-desc{margin-top:6px;font-size:14px;color:var(--ink-muted)}",
    "#a-pfeed .a-h2{margin:22px 0 10px}",
    "#a-pfeed .note-card{margin-bottom:10px}",
  ].join("\n");

  const ORANGE = "#ab5a14", INK = "#24222c";

  // ---------- small helpers ----------
  function wordsBuild(F, words, t0, gap, opts) {
    // each word: from y +24, blur 6 px, opacity 0, over 0.4 s on power3.out (STYLE 2); returns arrival times
    const times = [];
    words.forEach((w, i) => {
      const t = t0 + i * gap;
      F.tl.fromTo(w, { opacity: 0, y: opts.y || 24, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t);
      if (opts.settle && !(opts.keep && opts.keep(i))) {
        F.tl.fromTo(w, { color: ORANGE }, { color: INK, duration: 0.35, ease: "power1.inOut", immediateRender: false }, t + 0.3);
      }
      if (opts.tick) F.sound("tick", t);
      times.push(t);
    });
    return times;
  }

  // The pot mark lands at T0 (150 px), holds, shrinks to 60% over 0.5 s on power3.out at T0 + 0.6 while "meltingpot"
  // slides out from behind its right edge over 0.6 s. Pure function of t (a driver), so any seek gives the same frame.
  function lockup(F, parent, T0, CY) {
    const g = F.el("div", "a-brand", null, parent);
    const clip = F.el("div", "a-wmclip", null, g);
    const wm = F.el("span", "a-wm", "meltingpot", clip);
    const mark = F.el("div", "a-mark", '<img src="assets/pot-logo.png" alt="">', g);
    const WMW = wm.offsetWidth;
    const M1 = 90, GAP = 26, SC1 = M1 / 150;
    const left = Math.round(960 - (M1 + GAP + WMW) / 2);
    const cx1 = left + M1 / 2, textLeft = left + M1 + GAP;
    mark.style.left = "885px";
    mark.style.top = (CY - 75) + "px";
    clip.style.top = (CY - 85 + 4) + "px";
    const e3i = F.ease("power3.in"), e3o = F.ease("power3.out"), e2o = F.ease("power2.out");
    const LAND = 0.24;
    F.driver((t) => {
      let s = 1, op = 1, bl = 0;
      if (t < T0 - LAND) { s = 0.5; op = 0; bl = 8; }
      else if (t < T0) { const u = (t - (T0 - LAND)) / LAND; s = F.lerp(0.4, 1.06, e3i(u)); op = Math.min(1, u * u * 2.2); bl = 8 * (1 - u); }
      else if (t < T0 + 0.25) { const u = (t - T0) / 0.25; s = F.lerp(1.06, 1, e2o(u)); }
      const k = e3o(F.clamp((t - (T0 + 0.6)) / 0.5, 0, 1));
      const sc = s * F.lerp(1, SC1, k);
      const cx = F.lerp(960, cx1, k);
      mark.style.transform = "translate(" + (cx - 960).toFixed(2) + "px,0px) scale(" + sc.toFixed(4) + ")";
      mark.style.opacity = op.toFixed(3);
      mark.style.filter = bl > 0.05 ? "blur(" + bl.toFixed(2) + "px)" : "none";
      // the wordmark: emerges from just right of the mark's right edge, sliding right into place
      const v = e3o(F.clamp((t - (T0 + 0.6)) / 0.6, 0, 1));
      const markRight = cx + 75 * sc;
      const cl = Math.max(markRight + 4, textLeft - 2);
      const tx = textLeft - (1 - v) * (WMW * 0.6 + 40);
      clip.style.left = cl.toFixed(2) + "px";
      clip.style.width = (1920 - cl).toFixed(2) + "px";
      wm.style.left = (tx - cl).toFixed(2) + "px";
      wm.style.opacity = t < T0 + 0.6 ? "0" : F.clamp((t - (T0 + 0.6)) / 0.15, 0, 1).toFixed(3);
    });
    return g;
  }

  // An app card (built with the app's classes) inside a positioned wrapper. Returns { outer, mid, w, h }.
  function appCard(F, layer, html, scale, rot) {
    const outer = F.el("div", "a-card", null, layer);
    const mid = F.el("div", "a-mid", null, outer);
    const ui = F.el("div", "ui", html, mid);
    ui.style.transform = "rotate(" + rot + "deg) scale(" + scale + ")";
    return { outer, mid, ui, w: ui.offsetWidth, h: ui.offsetHeight };
  }
  function place(c, cx, cy) {
    c.outer.style.left = Math.round(cx - c.w / 2) + "px";
    c.outer.style.top = Math.round(cy - c.h / 2) + "px";
  }

  const AV = (F, tint) => '<span class="avatar sm ' + tint + '">' + F.icon("user-fill") + "</span>";
  const NOTE_CARD = (F, v2) =>
    '<div class="card note-card a-nc"><div class="row"><span class="title">The cell membrane</span>' + (v2 ? '<span class="badge">v2</span>' : "") + "</div>" +
    '<div class="summary">The cell membrane is a phospholipid bilayer, and size decides what gets through it.</div>' +
    '<div class="meta">' + AV(F, "t2") + "<span>Amy · " + (v2 ? "5m" : "1m") + " ago · Week 2: Cell structure</span></div></div>";

  // ---------- props: ids 0..5 are the six rough notes, 6..9 the keycaps ----------
  const PROPS = [
    { kind: "note", title: "", text: "membrane = phospholipid bilayer. small stuff gets thru, big stuff cant" },
    { kind: "note", title: "", text: "osmosis: water goes to the saltier side??" },
    { kind: "note", title: "", text: "G1 S G2 M, checkpoints between" },
    { kind: "note", title: "", text: "mitosis 2 cells / meiosis 4" },
    { kind: "note", title: "", text: "law = what, theory = why" },
    { kind: "note", title: "", text: "ATP made in mitochondria" },
    { kind: "key", icon: "pencil-simple" },
    { kind: "key", icon: "cards" },
    { kind: "key", icon: "magnifying-glass" },
    { kind: "key", icon: "cooking-pot", clay: true },
  ];
  // The kit drifts each prop linearly with t (film.js propsAt); layouts given as visual centres subtract that drift at
  // the time they are meant to be seen, so a ring at 108 s sits where it is drawn here.
  let PROPNODES = [];
  function linDrift(i, t) { const s = 31 + i * 7; return t * (6 + (s % 6)) * (s % 2 ? 1 : -1) * 0.04; }
  function L(spec, tRef) {
    // spec: [[cx, cy, rot, scale, blur, opacity], ...] as visual centres
    return spec.map((p, i) => {
      const n = PROPNODES[i];
      const w = n ? n.offsetWidth : 0, h = n ? n.offsetHeight : 0;
      return [p[0] - w / 2 - linDrift(i, tRef), p[1] - h / 2, p[2], p[3], p[4], p[5]];
    });
  }

  // =====================================================================================================================
  // A1: hook and brand, 0 to 10
  // =====================================================================================================================
  function buildOpen(F) {
    const tl = F.tl, $ = F.$;
    F.el("style", null, CSS, document.head);

    // ---- the dot grid: fades in to 0.5 over 1 s and drifts about 12 px/s; gone as the window rises
    const dots = $("dots");
    gsap.set(dots, { opacity: 0, x: 0, y: 0 });
    tl.fromTo(dots, { opacity: 0 }, { opacity: 0.5, duration: 1, ease: "power1.out", immediateRender: false }, 0);
    tl.fromTo(dots, { x: 0, y: 0 }, { x: 108, y: -54, duration: 10, ease: "none", immediateRender: false }, 0);
    tl.fromTo(dots, { opacity: 0.5 }, { opacity: 0, duration: 0.7, ease: "power1.in", immediateRender: false }, 9.1);

    // ---- props: six rough notes and four keycaps
    F.propsInit(PROPS);
    PROPNODES = Array.prototype.slice.call(document.querySelectorAll("#props .prop"));
    // hook: the notes drift past on a 6 to 10 degree tilt with depth blur; keycaps wait unseen
    const A = [
      [430, 205, -8, 1.3, 0, 1], [1520, 150, 7, 0.95, 2.5, 1], [250, 560, 9, 0.9, 3, 1],
      [1720, 640, -7, 1.2, 0, 1], [580, 885, 6, 1.3, 0, 1], [1420, 905, -9, 1.1, 1.2, 1],
      [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0],
    ];
    const B = [
      [250, 180, -9, 1.3, 0, 1], [1405, 132, 8, 0.95, 2.5, 1], [140, 545, 10, 0.9, 3, 1],
      [1590, 650, -6, 1.2, 0, 1], [385, 872, 7, 1.3, 0, 1], [1262, 892, -8, 1.1, 1.2, 1],
      [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0], [960, 480, 0, 0.1, 0, 0],
    ];
    const IN = A.map((p, i) => (i < 6 ? [p[0] + 110, p[1] + 10, p[2] + 3, p[3] * 0.9, p[4] + 6, 0] : p));
    const SWALLOW = A.map((p) => [960 + (p[0] - 960) * 0.35, 480 + (p[1] - 480) * 0.35, p[2], p[3], p[4] + 3, 0]);
    const GONE = A.map(() => [960, 480, 0, 0.08, 0, 0]);
    // the margin layout around the window's home (x 323..1597, y 92..852), clear of the caption band
    const MARGIN = [
      [160, 205, -7, 0.85, 0, 1], [1762, 225, 6, 0.8, 1.5, 1], [150, 690, 8, 0.8, 2, 1],
      [1765, 650, -6, 0.85, 0, 1], [235, 960, -5, 0.8, 2.5, 1], [1790, 55, 8, 0.8, 2.5, 1],
      [160, 470, -8, 0.85, 0, 1], [1775, 452, 7, 0.9, 0, 1], [262, 52, 10, 0.75, 2, 1], [1660, 985, -6, 0.85, 0, 1],
    ];
    const OFF = MARGIN.map((p) => [p[0] < 960 ? p[0] - 460 : p[0] + 460, p[1], p[2] * 1.6, p[3], p[4] + 4, 0]);
    F.propsLayout(0, L(IN, 0.5), 0.01);
    F.propsLayout(0.02, L(A, 0.5), 0.9);
    F.propsLayout(0.95, L(B, 3), 3.5);
    F.propsLayout(4.5, L(SWALLOW, 5), 0.5);
    F.propsLayout(5.0, L(GONE, 5), 0.06);
    F.propsLayout(9.0, L(OFF, 9.5), 0.02);
    F.propsLayout(9.3, L(MARGIN, 10), 0.7);

    // ---- headline: caret types "Study" (14 cps), then "at the speed of thought." builds word by word
    const hook = F.el("div", "a-hook", null, $("heads"));
    const l1 = F.el("div", "a-l", null, hook);
    const typed = F.el("span", "a-typed", null, l1);
    const tt = F.el("span", null, "Study", typed);
    const car = F.el("span", "a-car", null, typed);
    // reserve the typed word's width so the centred line never shifts; the caret follows the text and may overhang
    typed.style.width = tt.offsetWidth + "px";
    tt.textContent = "";
    F.el("span", null, " ", l1).style.whiteSpace = "pre";
    const W1 = ["at ", "the ", "speed"].map((w) => F.el("span", "a-w", w, l1));
    const l2 = F.el("div", "a-l", null, hook);
    const W2 = ["of ", "thought."].map((w) => F.el("span", "a-w", w, l2));
    const words = W1.concat(W2);
    gsap.set(words, { opacity: 0 });
    const tType = 0.9375;
    const typeEnd = F.type(tt, "Study", tType, { cps: 14, seed: 7 });
    const tW = 1.5625;
    F.driver((t) => {
      let on = false;
      if (t >= 0.3 && t < tW) on = (t >= tType - 0.06 && t < typeEnd + 0.08) ? true : Math.floor((t - 0.3) / 0.3125) % 2 === 0;
      car.style.opacity = on ? "1" : "0";
    });
    wordsBuild(F, words, tW, 0.3125, { settle: true, keep: (i) => i === 4, tick: true });
    tl.fromTo(hook, { opacity: 1, y: 0, filter: "blur(0px)" }, { opacity: 0, y: -10, filter: "blur(8px)", duration: 0.3, ease: "power2.in", immediateRender: false }, 4.42);
    F.driver((t) => { hook.style.display = t < 5.05 ? "flex" : "none"; });

    // ---- the brand: the mark lands at 5.0, wordmark at 5.6, the site's hero line from 6.3
    const brand = lockup(F, $("heads"), 5.0, 480);
    const sub = F.el("div", "a-sub", null, brand);
    sub.style.top = (480 + 78) + "px";
    const SW = "Everyone takes notes. MeltingPot brings them together.".split(" ").map((w, i, arr) => F.el("span", "a-w", w + (i < arr.length - 1 ? " " : ""), sub));
    gsap.set(SW, { opacity: 0 });
    wordsBuild(F, SW, 6.3, 0.156, { y: 16 });
    tl.fromTo(brand, { opacity: 1, y: 0, filter: "blur(0px)" }, { opacity: 0, y: -30, filter: "blur(4px)", duration: 0.5, ease: "power2.in", immediateRender: false }, 8.9);
    F.driver((t) => { brand.style.display = t >= 4.6 && t < 9.5 ? "block" : "none"; });

    // ---- three small tilted app cards fly through from the right and accelerate off the left edge (7.5 to 9.6)
    const fly = F.el("div", "a-layer", null, $("extras"));
    F.driver((t) => { fly.style.display = t >= 7.4 && t < 9.7 ? "block" : "none"; });
    const c1 = appCard(F, fly, NOTE_CARD(F, false), 1.3, -8);
    const c2 = appCard(F, fly, '<div class="notice success a-nt"><span class="icon">' + F.icon("check-circle-fill") + '</span><div><div class="t">Shared with the class</div><div class="b">Your contribution is live and credited to you. Today is on your record.</div></div></div>', 1.3, 7);
    const c3 = appCard(F, fly, '<div class="a-fc"><div class="eyebrow">Question</div><div class="q">What is the cell membrane made of?</div><div class="tiny">Click the card, or press space, to turn it over</div></div>', 1.2, -6);
    const flights = [
      [c1, 200, 7.5, 1.75, 0, -26, 0],
      [c2, 945, 7.68, 1.75, 0, -18, 0],
      [c3, 755, 7.95, 1.62, 1.5, 22, 0],
    ];
    flights.forEach(([c, cy, t0, d, blur, dy]) => {
      place(c, 0, cy);
      const x0 = 1920 + c.w * 0.75, x1 = -c.w * 0.85;
      gsap.set(c.outer, { x: x0, y: 0, rotation: 0, filter: blur ? "blur(" + blur + "px)" : "none" });
      tl.fromTo(c.outer, { x: x0, y: 0, rotation: 0 }, { x: x1, y: dy, rotation: -3, duration: d, ease: "power2.in", immediateRender: false }, t0);
    });
  }

  // =====================================================================================================================
  // A2: close and end, 105 to 120
  // =====================================================================================================================
  function buildClose(F) {
    const tl = F.tl, $ = F.$;
    const win = F.win.node;

    // ---- the music lifts: the window blurs; a feed page comes in under the blur after D's last page leaves (105.3)
    F.win.blur(105.0);
    const p = F.page("a-pfeed");
    const col = F.shell(p, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Feed" });
    col.innerHTML =
      '<div class="h1">Biology 101</div>' +
      '<div class="a-desc">Everything our class knows about intro biology, gathered in one place. Rough notes welcome.</div>' +
      '<div class="h2 a-h2">Latest shared notes</div>' +
      NOTE_CARD(F, true).replace("card note-card a-nc", "card note-card") +
      '<div class="card note-card"><div class="title">Osmosis and tonicity</div><div class="summary">Water crosses a selectively permeable membrane toward the higher solute concentration; tonicity describes which way cells gain or lose water.</div></div>';
    F.pageIn(105.45, p);
    F.win.setUrl(105.45, "meltingpots.xyz/p/biology-101");
    // the window fades away by 112.0
    tl.fromTo(win, { opacity: 0.35, y: 0 }, { opacity: 0, y: -30, duration: 0.6, ease: "power2.in", immediateRender: false }, 111.4);

    // ---- the dot grid returns behind the closing line
    const dots = $("dots");
    tl.fromTo(dots, { opacity: 0 }, { opacity: 0.5, duration: 1, ease: "power1.out", immediateRender: false }, 105.0);
    tl.fromTo(dots, { x: -96, y: 40 }, { x: 90, y: -50, duration: 15.5, ease: "none", immediateRender: false }, 104.5);

    // ---- props re-form in a loose outer ring (105), then are swallowed by the mark (112.0 to 112.5)
    const RING = [
      [60, 400, 8, 0.8, 2, 1], [1850, 390, -7, 0.8, 2, 1], [175, 905, -6, 0.85, 1.5, 1],
      [1695, 905, 6, 0.85, 1, 1], [945, 18, 4, 0.8, 2.5, 1], [1215, 1035, -5, 0.85, 2, 1],
      [92, 168, -10, 0.8, 0, 1], [1836, 156, 10, 0.8, 0, 1], [1858, 760, 7, 0.8, 1.5, 1], [420, 1012, -6, 0.85, 0, 1],
    ];
    F.propsLayout(105.0, L(RING, 108.5), 0.9);
    F.propsLayout(112.0, L(RING.map((p) => [960 + (p[0] - 960) * 0.35, 450 + (p[1] - 450) * 0.35, p[2], p[3], p[4] + 3, 0]), 112.4), 0.5);
    F.propsLayout(112.5, L(RING.map(() => [960, 450, 0, 0.08, 0, 0]), 112.5), 0.06);

    // ---- app cards gather round the window: the note, a flashcard, a practice result, the history row, a calendar day
    const ring = F.el("div", "a-layer", null, $("extras"));
    F.driver((t) => { ring.style.display = t >= 104.95 && t < 112.1 ? "block" : "none"; });
    const R = [
      [NOTE_CARD(F, true), 1.25, -6, 525, 215],
      ['<div class="a-fc"><div class="eyebrow">Answer</div><div class="a">A phospholipid bilayer.</div><div class="tiny">From The cell membrane · membranes</div></div>', 1.2, 5, 1420, 215],
      ['<div class="card a-pr"><div class="eyebrow">Marked</div><div class="a-pct">80%</div><div class="small muted">8 of 10</div></div>', 1.3, -4, 1625, 625],
      ['<div class="card a-hr"><div class="row"><span class="h3">Version 2</span><span class="badge success">Current</span><span class="tiny faint a-r">just now</span></div><div class="small muted">Correction by Ibrahim · approved by Rayyan</div></div>', 1.25, 3, 650, 880],
      ['<div class="card a-cd"><div class="h3">September 2026</div><div class="cal"><div class="day busy"><span class="d">15</span><span class="notes">1 note</span></div><div class="day"><span class="d">16</span></div><div class="day busy today"><span class="d">17</span><span class="notes">2 notes</span></div></div></div>', 1.25, -6, 285, 600],
    ];
    const CX = 960, CY = 480;
    R.forEach(([html, sc, rot, cx, cy], i) => {
      const c = appCard(F, ring, html, sc, rot);
      place(c, cx, cy);
      // arrive from beyond the frame along the line from the centre: 0.75 s expo.out, staggered a 32nd
      const dx = cx - CX, dy = cy - CY, len = Math.hypot(dx, dy) || 1;
      const ox = (dx / len) * 760, oy = (dy / len) * 560;
      const ta = 104.95 + i * 0.078;
      gsap.set(c.outer, { x: ox, y: oy, opacity: 0, scale: 0.92, rotation: rot * 0.8 });
      tl.fromTo(c.outer, { x: ox, y: oy, opacity: 0, scale: 0.92, rotation: rot * 0.8 }, { x: 0, y: 0, opacity: 1, scale: 1, rotation: 0, duration: 0.75, ease: "expo.out", immediateRender: false }, ta);
      // leave toward the centre and fade, done by 112.0
      tl.fromTo(c.outer, { x: 0, y: 0, opacity: 1, scale: 1 }, { x: -dx * 0.35, y: -dy * 0.35, opacity: 0, scale: 0.7, duration: 0.6, ease: "power2.in", immediateRender: false }, 111.4);
      // while the line holds, the ring turns slowly round the window and draws in a little (seek-safe driver)
      const e = F.ease("sine.inOut");
      F.driver((t) => {
        const u = e(F.clamp((t - 105.4) / 6.2, 0, 1));
        const a = (u * 5 * Math.PI) / 180, k = 1 - 0.05 * u;
        const rx = dx * k, ry = dy * k;
        const nx = rx * Math.cos(a) - ry * Math.sin(a), ny = rx * Math.sin(a) + ry * Math.cos(a);
        c.mid.style.transform = "translate(" + (nx - dx).toFixed(2) + "px," + (ny - dy).toFixed(2) + "px) rotate(" + (u * (i % 2 ? 2 : -2)).toFixed(3) + "deg)";
      });
    });

    // ---- the closing line builds word by word from 106.0
    F.headline({
      t0: 106.0, t1: 112.0, lead: 0.001, gap: 0.3125, lineGap: 0, tick: true,
      lines: [{ text: "The class knows" }, { text: "more together.", accent: "together." }],
    });

    // ---- logo resolve on the end hit: the mark lands at 112.5, the wordmark slides out, then the pill and the lines
    const CYE = 450;
    const end = lockup(F, $("heads"), 112.5, CYE);
    F.driver((t) => { end.style.display = t >= 112.1 ? "block" : "none"; });
    const pillRow = F.el("div", "a-endline", null, end);
    pillRow.style.top = (CYE + 100) + "px";
    const pill = F.el("span", "a-pill", "meltingpots.xyz", pillRow);
    const ghRow = F.el("div", "a-endline", null, end);
    ghRow.style.top = (CYE + 190) + "px";
    const gh = F.el("span", "a-gh", "github.com/Rayrayyh/Meltingpot-CSC", ghRow);
    const noteRow = F.el("div", "a-endline", null, end);
    noteRow.style.top = "1000px";
    const nt = F.el("span", "a-note", "Product screens recreated from MeltingPot's own interface, with example class data.", noteRow);
    [[pill, 113.8, 18], [gh, 114.2, 12], [nt, 114.8, 10]].forEach(([n, t, y]) => {
      gsap.set(n, { opacity: 0, y: y, filter: "blur(6px)" });
      tl.fromTo(n, { opacity: 0, y: y, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out", immediateRender: false }, t);
    });
    // a slow settle on the end card while it holds, then the frame settles to paper
    tl.fromTo(end, { scale: 1 }, { scale: 1.025, duration: 6.4, ease: "sine.inOut", immediateRender: false }, 113.6);
    const fade = $("fade");
    gsap.set(fade, { opacity: 0 });
    tl.fromTo(fade, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.inOut", immediateRender: false }, 119.3);
  }

  FILM.scene({ id: "a", t0: 0, t1: 10, build: buildOpen });
  FILM.scene({ id: "a-close", t0: 105, t1: 120, build: buildClose });
})();
