/* The film's core kit: one paused timeline, one apply(t) driver, sound events, the cursor, typing, headlines, captions,
   the window and its pages, the app shell, props and the camera. Scenes (scenes/*.js) call FILM.scene({...}) and do all
   their work inside build(ctx), scheduling tweens at absolute times on FILM.tl.

   Rules every helper keeps (docs/videos/template/PROMPT.md step 2): nothing reads a clock but the timeline; every state
   that GSAP cannot tween (typed text, caret blink, class toggles, the cursor's arc) is a pure function of t inside a
   driver, so any seek renders the same frame; sound events land on the first frame their change is visible. */
(function () {
  "use strict";
  const DUR = 120, FPS = 30;
  // No 3D promotion: with force3D "auto" a layer appears mid-tween and text edges then depend on seek order (measured
  // by the components study, up to 144/255 at text edges). 2D transforms render the same at any seek.
  gsap.config({ force3D: false });
  const tl = gsap.timeline({ paused: true });
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  const EVENTS = [];
  window.__events = EVENTS;
  const $ = (id) => document.getElementById(id);
  const drivers = [];
  const scenes = [];
  let READY = false;

  // ---------- small utilities ----------
  const onFrame = (t) => Math.ceil(t * FPS - 1e-6) / FPS;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = (name) => gsap.parseEase(name);
  function rand(seed) {
    // mulberry32: a seeded PRNG, so jitter is the same on every render
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const icon = (name) => (window.ICONS && window.ICONS[name]) || "";
  const el = (tag, cls, html, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  };
  const sound = (kind, t, extra) => EVENTS.push(Object.assign({ kind, t: +onFrame(t).toFixed(4) }, extra || {}));
  const driver = (fn) => drivers.push(fn);
  // A class that is on between t0 and t1 (seek safe).
  const classAt = (node, cls, t0, t1) => driver((t) => node.classList.toggle(cls, t >= t0 && t < t1));
  // Text that changes at given times: [[t, text], ...] sorted by t (seek safe).
  const textAt = (node, steps) => driver((t) => {
    let s = steps[0][1];
    for (const [tt, v] of steps) if (t >= tt) s = v;
    if (node.textContent !== s) node.textContent = s;
  });
  const htmlAt = (node, steps) => driver((t) => {
    let s = steps[0][1];
    for (const [tt, v] of steps) if (t >= tt) s = v;
    if (node.__html !== s) { node.innerHTML = s; node.__html = s; }
  });

  // ---------- geometry: where a node inside the window sits on the 1920 x 1080 stage ----------
  const WIN = { x: 323, y: 92, w: 1274, h: 760, bar: 40, vpx: 2, scale: 1.5 };
  // Offset of a node inside its .page (logical app px), ignoring transforms; walks offsetParent up to the page.
  function inPage(node) {
    let x = 0, y = 0, n = node;
    while (n && !n.classList.contains("page")) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y };
  }
  // Stage point of a node: ax, ay are anchors inside it (0..1); scrollY is the page's scroll at that moment (logical px).
  function pt(node, ax = 0.5, ay = 0.5, scrollY = 0) {
    const p = inPage(node);
    return {
      x: WIN.x + WIN.vpx + (p.x + node.offsetWidth * ax) * WIN.scale,
      y: WIN.y + WIN.bar + (p.y + node.offsetHeight * ay - scrollY) * WIN.scale,
    };
  }

  // ---------- the cursor (STYLE 3) ----------
  const ARROW = '<svg class="arrow" viewBox="0 0 52 52"><path d="M10 6 L10 40 L18.5 32.2 L24.2 45.4 L30.6 42.6 L25 29.6 L36.4 29.2 Z" fill="#24222c" stroke="#ffffff" stroke-width="2.6" stroke-linejoin="round"/></svg>';
  const cursorKeys = []; // [{t0, t1, x0, y0, x1, y1, bow}]
  let cursorNode = null, cursorShapes = null;
  const cursor = {
    _last: { t: -1, x: 1980, y: 1140 },
    // Place the cursor (no motion).
    at(t, x, y) { cursorKeys.push({ t0: t, t1: t, x0: x, y0: y, x1: x, y1: y, bow: 0 }); this._last = { t, x, y }; return t; },
    // Move along a gentle arc (control point 8% of the distance off the line) in dur seconds, power3.inOut.
    move(t, x, y, dur = 0.55, bow = 0.08, easeName) {
      const a = this._last;
      // An entrance from beyond a frame edge arrives already fast and only eases out (STYLE 3, re-measured on Motionfly).
      const off = a.x < 0 || a.y < 0 || a.x > 1920 || a.y > 1080;
      cursorKeys.push({ t0: t, t1: t + dur, x0: a.x, y0: a.y, x1: x, y1: y, bow, ease: easeName || (off ? "power3.out" : "power3.inOut") });
      this._last = { t: t + dur, x, y };
      return t + dur;
    },
    moveTo(t, node, ax = 0.5, ay = 0.5, scrollY = 0, dur = 0.55) {
      const p = pt(node, ax, ay, scrollY);
      return this.move(t, p.x, p.y, dur);
    },
    show(t, d = 0.2) { tl.to(cursorNode, { opacity: 1, duration: d, ease: "power1.out" }, t); return t + d; },
    hide(t, d = 0.25) { tl.to(cursorNode, { opacity: 0, duration: d, ease: "power1.in" }, t); return t + d; },
    // Press: dip to 0.88 over 0.08 s, back over 0.18 s; the click sound sits on the press. target (optional) presses too.
    click(t, target, opts = {}) {
      const inner = cursorShapes;
      tl.to(inner, { scale: 0.88, duration: 0.08, ease: "power2.in" }, t);
      tl.to(inner, { scale: 1, duration: 0.18, ease: "back.out(2.5)" }, t + 0.08);
      if (target) {
        tl.to(target, { scale: 0.96, duration: 0.08, ease: "power2.in" }, t);
        tl.to(target, { scale: 1, duration: 0.18, ease: "back.out(2)" }, t + 0.08);
        classAt(target, "pressed", t, t + 0.14);
      }
      if (opts.sound !== false) sound("click", t, opts.db != null ? { db: opts.db } : {});
      return t + 0.26;
    },
    // Hover: the target takes its hover look; the arrow becomes a hand between t0 and t1.
    hover(node, t0, t1, hand = true) {
      if (node) classAt(node, "hover", t0, t1);
      if (hand) handSpans.push([t0, t1]);
    },
  };
  const handSpans = [];
  function cursorAt(t) {
    // the last key that has started decides the position
    let k = null;
    for (const c of cursorKeys) if (c.t0 <= t + 1e-9) k = c; else break;
    if (!k) return { x: 1980, y: 1140 };
    const u = k.t1 > k.t0 ? ease(k.ease || "power3.inOut")(clamp((t - k.t0) / (k.t1 - k.t0), 0, 1)) : 1;
    const dx = k.x1 - k.x0, dy = k.y1 - k.y0;
    const cx = (k.x0 + k.x1) / 2 - dy * k.bow, cy = (k.y0 + k.y1) / 2 + dx * k.bow;
    const x = (1 - u) * (1 - u) * k.x0 + 2 * (1 - u) * u * cx + u * u * k.x1;
    const y = (1 - u) * (1 - u) * k.y0 + 2 * (1 - u) * u * cy + u * u * k.y1;
    return { x, y };
  }

  // ---------- typing (STYLE 3) ----------
  // Times for each character: base cps, a seeded factor in 0.7..1.3, +0.12 s after a comma, +0.2 s after a full stop.
  function typeTimes(text, t0, cps = 22, seed = 1) {
    const r = rand(seed), times = [];
    let t = t0;
    for (let i = 0; i < text.length; i++) {
      times.push(t);
      const c = text[i];
      t += (1 / cps) * (0.7 + 0.6 * r());
      if (c === ",") t += 0.12;
      if (c === "." && i < text.length - 1) t += 0.2;
    }
    return { times, end: t };
  }
  // Type text into node (its textContent), one key sound per character. Returns the end time.
  // opts: cps, seed, sound (true), prefix (text already there), caret (a node shown solid while typing, blinking after
  // until opts.caretUntil), keyDb (gain offset for the keys).
  function type(node, text, t0, opts = {}) {
    const { times, end } = typeTimes(text, t0, opts.cps || 22, opts.seed || 1);
    const prefix = opts.prefix || "";
    driver((t) => {
      let n = 0;
      while (n < times.length && t >= times[n]) n++;
      const s = prefix + text.slice(0, n);
      if (node.textContent !== s) node.textContent = s;
    });
    if (opts.sound !== false) times.forEach((tt, i) => { if (text[i] !== " " || opts.spaceKeys !== false) sound("key", tt, opts.keyDb != null ? { db: opts.keyDb } : {}); });
    if (opts.caret) caret(opts.caret, opts.caretFrom != null ? opts.caretFrom : t0 - 0.3, end, opts.caretUntil != null ? opts.caretUntil : end + 1.2);
    return end;
  }
  // A caret: hidden before t0, solid from t0 to tSolid, then blinking an eighth on, an eighth off, hidden after t1.
  function caret(node, t0, tSolid, t1) {
    const half = 0.3125;
    driver((t) => {
      let on = t >= t0 && t < t1 && (t < tSolid || Math.floor((t - tSolid) / half) % 2 === 0);
      node.style.opacity = on ? "1" : "0";
    });
  }

  // ---------- headlines (STYLE 2, 4) ----------
  // lines: [{ text, cls: "" | "hero", muted: false, accent: "word", type: false }]. Words arrive every `gap` s from y +24,
  // blur 6 px; the newest word arrives in orange and settles to ink after 0.3 s, except the accent word, which stays.
  // A line with type: true is typed at 14 cps with a caret and key sounds. Exit at t1 - 0.3: fade and lift 10 px.
  function headline(opts) {
    const layer = el("div", "headline", null, $("heads"));
    if (opts.kicker) el("div", "kicker", opts.kicker, layer);
    const gap = opts.gap || 0.156;
    let t = opts.t0 + (opts.lead || 0.1);
    const words = [];
    opts.lines.forEach((ln, li) => {
      const line = el("div", "l" + (ln.cls ? " " + ln.cls : "") + (ln.muted ? " muted" : ""), null, layer);
      if (ln.type) {
        const span = el("span", "typed", "", line);
        const car = el("span", "tcaret", "", line);
        const end = type(span, ln.text, t + (ln.delay || 0), { cps: ln.cps || 14, seed: 11 + li, caret: car, caretUntil: opts.t1 - 0.3, keyDb: ln.keyDb });
        t = end + 0.1;
        return;
      }
      if (ln.delay) t += ln.delay;
      ln.text.split(" ").forEach((w, wi, arr) => {
        const node = el("span", "w", w + (wi < arr.length - 1 ? " " : ""), line);
        const isAccent = ln.accent && w.replace(/[.,]/g, "") === ln.accent.replace(/[.,]/g, "");
        gsap.set(node, { opacity: 0, y: 24, filter: "blur(6px)" });
        tl.to(node, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" }, t);
        const base = ln.muted ? "var(--ink-muted)" : "var(--ink)";
        if (opts.orange !== false) {
          tl.set(node, { color: "#ab5a14" }, t);
          if (!isAccent) tl.to(node, { color: ln.muted ? "#5c5952" : "#24222c", duration: 0.35, ease: "power1.inOut" }, t + 0.3);
        } else if (isAccent) tl.set(node, { color: "#ab5a14" }, t);
        if (opts.tick) sound("tick", t, { db: opts.tickDb || 0 });
        words.push(node);
        t += gap;
      });
      t += opts.lineGap != null ? opts.lineGap : 0.3;
    });
    gsap.set(layer, { opacity: 1 });
    if (opts.t1 != null) tl.to(layer, { opacity: 0, y: -10, duration: 0.3, ease: "power1.in" }, opts.t1 - 0.3);
    if (opts.t1 != null) tl.set(layer, { display: "none" }, opts.t1);
    tl.set(layer, { display: "none" }, 0);
    tl.set(layer, { display: "flex" }, opts.t0);
    return { layer, words, end: t };
  }

  // ---------- captions under the window (STYLE 1 Cua) ----------
  // { t0, t1, icon: "users", bold: "Join", rest: " with the class code." , boldFirst: true }. The icon and bold part
  // arrive on t0, the rest 1.25 s later; each part rises 12 px with a 6 px blur over 0.35 s.
  function caption(o) {
    const line = el("div", "cap-line", null, $("cap"));
    const ic = el("span", "ic", icon(o.icon || "sparkle"), line);
    const b = el("span", "part", "<b>" + o.bold + "</b>", line);
    const r = o.rest ? el("span", "part", o.rest, line) : null;
    line.style.gap = "0px";
    ic.style.marginRight = "14px";
    tl.set(line, { opacity: 1 }, o.t0);
    tl.set(line, { opacity: 0 }, 0);
    const parts = [ic, b].concat(r ? [r] : []);
    gsap.set(parts, { opacity: 0, y: 12, filter: "blur(6px)" });
    tl.to([ic, b], { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, o.t0);
    if (r) tl.to(r, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power3.out" }, o.t0 + (o.restDelay != null ? o.restDelay : 1.25));
    tl.to(line, { opacity: 0, y: -8, duration: 0.25, ease: "power1.in" }, o.t1 - 0.3);
    return line;
  }

  // ---------- the window and its pages (STYLE 1, 2) ----------
  const win = {
    node: null,
    // Rise from below: 0.8 s on power4.out from +240 px, 4 px vertical blur in the first third.
    enter(t, from = 240, d = 0.8) {
      tl.fromTo(this.node, { opacity: 0, y: from, filter: "blur(4px)" }, { opacity: 1, y: 0, duration: d, ease: "power4.out" }, t);
      tl.to(this.node, { filter: "blur(0px)", duration: d / 3, ease: "none" }, t);
      return t + d;
    },
    exit(t, d = 0.5) { tl.to(this.node, { opacity: 0, y: -40, duration: d, ease: "power2.in" }, t); return t + d; },
    // Blur hand-off behind a headline (STYLE 2): blur 10 px, 35% opacity over 0.4 s, and back.
    blur(t0, t1, d = 0.4) {
      // starts 0.12 s early so the blur is visibly under way on the downbeat frame (review finding at 105.0)
      tl.to(this.node, { filter: "blur(10px)", opacity: 0.35, duration: d, ease: "power2.inOut" }, Math.max(0, t0 - 0.12));
      if (t1 != null) tl.to(this.node, { filter: "blur(0px)", opacity: 1, duration: d, ease: "power2.inOut" }, t1);
    },
    // Hide completely behind a headline (fade 0.3 s) and bring back (rise 16 px).
    away(t0, t1) {
      tl.to(this.node, { opacity: 0, filter: "blur(8px)", duration: 0.3, ease: "power2.in" }, t0);
      if (t1 != null) tl.fromTo(this.node, { opacity: 0, y: 24, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.45, ease: "power3.out", immediateRender: false }, t1);
    },
    url: [[0, "meltingpots.xyz"]],
    setUrl(t, path) { this.url.push([t, path]); },
  };
  // A page inside the window. Returns { el, scroller }. Pages start hidden; use pageIn / swap / pageOut.
  function page(id) {
    const p = el("div", "page ui", null, $("vp"));
    if (id) p.id = id;
    const scroller = el("div", "scroller", null, p);
    return { el: p, scroller };
  }
  // The new page fades in on power3.out over 0.35 s.
  function pageIn(t, p) {
    // No vertical move: each page carries the app's chrome, so a rise doubled the top bar for a few frames (final check).
    tl.fromTo(p.el, { opacity: 0, y: 0 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, t);
    tl.set(p.el, { opacity: 0 }, 0);
    return t + 0.35;
  }
  // The old page fades out on power2.in over 0.2 s.
  function pageOut(t, p) {
    tl.to(p.el, { opacity: 0, y: 0, duration: 0.2, ease: "power2.in" }, t);
    return t + 0.2;
  }
  // Content swap inside a still window (STYLE 2): 0.45 s, overlapping by 0.1 s.
  function swap(t, from, to) {
    if (from) pageOut(t, from);
    pageIn(t + 0.1, to);
    return t + 0.45;
  }
  // Scroll a page's scroller to y (logical px) in dur seconds on power2.inOut.
  function scroll(t, p, y, dur = 1.2) {
    tl.to(p.scroller, { y: -y, duration: dur, ease: "power2.inOut" }, t);
    return t + dur;
  }

  // ---------- the app shell in the window's focused view ----------
  // Slim top bar (pot mark + wordmark), the collapsed nav rail, optional pot tabs, and a centred content column.
  // opts: { nav: "home"|"pots"|"study"|"calendar"|"contrib"|"search", tabs: ["Feed","Study","Members","Admin","Settings"],
  //         tab: "Feed", adminCount: 1, col: 640 }. Returns the content column node (inside the scroller).
  const RAIL = [["search", "magnifying-glass"], ["home", "house"], ["pots", "cooking-pot"], ["study", "graduation-cap"], ["calendar", "calendar-blank"], ["contrib", "notebook"]];
  function shell(p, opts = {}) {
    const root = el("div", "fshell", null, p.el);
    root.innerHTML =
      '<div class="ftop"><img src="assets/pot-logo.png" alt=""><span class="wordmark">meltingpot</span></div>' +
      '<div class="frail">' + RAIL.map(([k, ic]) => '<div class="frail-i' + (opts.nav === k ? " active" : "") + '">' + icon(ic) + "</div>").join("") + "</div>";
    // the scroller sits in the main area
    const main = el("div", "fmain", null, root);
    main.appendChild(p.scroller);
    if (opts.tabs) {
      const tabs = el("div", "ftabs", null, p.scroller);
      opts.tabs.forEach((n) => {
        const tb = el("div", "pot-tab" + (n === opts.tab ? " active" : ""), n, tabs);
        if (n === "Admin" && opts.adminCount) el("span", "count", String(opts.adminCount), tb);
      });
    }
    const col = el("div", "fcol", null, p.scroller);
    if (opts.col) col.style.width = opts.col + "px";
    return col;
  }

  // ---------- props around the window (STYLE 1 Cua keycaps, 5) ----------
  // A set of cream note cards and keycaps in the margins. Each layout is a list of [x, y, rot, scale, blur] per prop;
  // at each change the props travel to the new layout over 0.5 s (power3.inOut) while drifting 0.24 to 0.44 px/s plus a 7 px sway;
  // the linear term (0.04) is mirrored by linDrift in scenes/a.js, so change both together.
  const props = { nodes: [], layouts: [] };
  function propsInit(defs) {
    const layer = $("props");
    defs.forEach((d, i) => {
      const n = el("div", "prop " + d.kind + (d.clay ? " clay" : ""), d.kind === "key" ? icon(d.icon) : "<b>" + d.title + "</b>" + d.text, layer);
      n.dataset.seed = String(31 + i * 7);
      props.nodes.push(n);
    });
  }
  // layout: { t, d: 0.5, pos: [[x, y, rot, scale, blur, opacity], ...] }
  function propsLayout(t, pos, d = 0.5) { props.layouts.push({ t, d, pos }); props.layouts.sort((a, b) => a.t - b.t); }
  function propsAt(t) {
    const L = props.layouts;
    if (!L.length) return;
    let i = 0;
    while (i + 1 < L.length && L[i + 1].t <= t) i++;
    const cur = L[i], prev = i > 0 ? L[i - 1] : cur;
    const u = cur.t <= t ? ease("power3.inOut")(clamp((t - cur.t) / cur.d, 0, 1)) : 0;
    const A = t < cur.t ? cur.pos : prev.pos, B = cur.pos;
    props.nodes.forEach((n, k) => {
      const a = A[k] || [0, 0, 0, 1, 0, 0], b = B[k] || a;
      const s = +n.dataset.seed;
      const dx = Math.sin(t * 0.21 + s) * 7 + t * (6 + (s % 6)) * (s % 2 ? 1 : -1) * 0.04;
      const dy = Math.cos(t * 0.17 + s * 1.3) * 6;
      const dr = Math.sin(t * 0.13 + s) * 2;
      const x = lerp(a[0], b[0], u) + dx, y = lerp(a[1], b[1], u) + dy;
      const r = lerp(a[2], b[2], u) + dr, sc = lerp(a[3], b[3], u), bl = lerp(a[4], b[4], u), op = lerp(a[5] != null ? a[5] : 1, b[5] != null ? b[5] : 1, u);
      n.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px) rotate(" + r.toFixed(3) + "deg) scale(" + sc.toFixed(4) + ")";
      n.style.filter = bl > 0.05 ? "blur(" + bl.toFixed(2) + "px)" : "none";
      n.style.opacity = op.toFixed(3);
    });
  }

  // ---------- camera (STYLE 2): small, slow scale changes of the whole stage ----------
  function cam(t, scale, d, e = "sine.inOut") { tl.to($("stage"), { scale, duration: d, ease: e }, t); return t + d; }

  // ---------- the driver ----------
  const DRIVER = { p: 0 };
  function apply(t) {
    if (!READY) return;
    const c = cursorAt(t);
    cursorNode.style.transform = "translate(" + (c.x - 10).toFixed(2) + "px," + (c.y - 6).toFixed(2) + "px)";
    const hand = handSpans.some(([a, b]) => t >= a && t < b);
    cursorShapes.querySelector(".arrow").style.opacity = hand ? "0" : "1";
    cursorShapes.querySelector(".hand").style.opacity = hand ? "1" : "0";
    let u = win.url[0][1];
    for (const [tt, v] of win.url) if (t >= tt) u = v;
    const un = $("url");
    if (un.textContent !== u) un.textContent = u;
    propsAt(t);
    for (const f of drivers) f(t);
    if (window.MP && typeof window.MP.applyAll === "function") window.MP.applyAll(t);
  }
  tl.to(DRIVER, { p: 1, duration: DUR, ease: "none", onUpdate: () => apply(tl.time()) }, 0);

  function build() {
    win.node = $("win");
    // cursor
    cursorNode = el("div", null, null, $("cursor-layer"));
    cursorNode.id = "cursor";
    cursorShapes = el("div", "shapes", ARROW + '<svg class="hand" viewBox="0 0 256 256" style="left:-6px;top:-2px;width:46px;height:46px"><g fill="#ffffff" stroke="#ffffff" stroke-width="22" stroke-linejoin="round">' + (icon("hand-pointing-fill").match(/<path[^>]*\/>/g) || []).join("") + '</g><g fill="#24222c">' + (icon("hand-pointing-fill").match(/<path[^>]*\/>/g) || []).join("") + "</g></svg>", cursorNode);
    cursorShapes.style.position = "absolute";
    cursorShapes.style.inset = "0";
    cursorShapes.style.transformOrigin = "12px 8px";
    gsap.set(win.node, { opacity: 0 });
    const ordered = scenes.slice().sort((a, b) => a.t0 - b.t0);
    for (const s of ordered) {
      try {
        s.build(FILM);
      } catch (e) {
        console.error("scene " + s.id + " failed", e);
        throw e;
      }
    }
    cursorKeys.sort((a, b) => a.t0 - b.t0);
    // parts.js (MP) pushes its events into the same window.__events array; keep one sorted list.
    if (window.__events !== EVENTS) { for (const e of window.__events) EVENTS.push(e); window.__events = EVENTS; }
    EVENTS.sort((a, b) => a.t - b.t);
    tl.set({}, {}, DUR);
    READY = true;
    tl.time(0.0001);
    tl.time(0);
    apply(0);
  }

  const FACES = ['600 104px "MP Fraunces"', '400 20px "MP Inter"', '500 20px "MP Inter"', '600 20px "MP Inter"', '700 20px "MP Inter"', '700 150px "MP Baloo"', '400 20px "MP Serif"', '600 20px "MP Serif"'];
  window.FILM = {
    DUR, FPS, tl, $, el, icon, rand, ease, clamp, lerp, onFrame, sound, driver, classAt, textAt, htmlAt, WIN, pt, inPage,
    cursor, type, typeTimes, caret, headline, caption, win, page, pageIn, pageOut, swap, scroll, shell,
    propsInit, propsLayout, cam,
    scene(s) { scenes.push(s); },
    ready() { return Promise.all(FACES.map((f) => document.fonts.load(f))).then(build); },
  };
})();
