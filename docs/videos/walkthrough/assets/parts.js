/* parts.js: motion parts for the walkthrough film, ported to one paused GSAP timeline.
 *
 * Contract (docs/videos/walkthrough/notes/COMPONENTS.md has the per-part table):
 *   - Load after assets/vendor/gsap.min.js. Everything hangs off window.MP.
 *   - Every timeline helper takes (tl, opts) and adds tweens to tl at absolute times in seconds.
 *   - Nothing here uses requestAnimationFrame, setTimeout, Date, performance.now or Math.random, and nothing autoplays.
 *     Randomness comes from MP.rand(seed), a seeded PRNG.
 *   - State GSAP cannot tween (typed text length, caret blink, letter shimmer, morph blur) is registered with
 *     MP.drivers.push(fn); the composition's single apply(t) driver calls MP.applyAll(t) (see MP.driverTween).
 *   - Sound cues go through MP.event(kind, t, data) into window.__events at build time: "key" per typed character,
 *     "click" per click press, "whoosh" for big moves. Times are rounded to the 30 fps frame grid.
 *   - Every tween that shares an element/property with another tween is a fromTo with force3D: false, immediateRender:false and an
 *     explicit from value tracked at build time, so any seek order lands on the same frame.
 *   - Seek-order safety (measured on parts-demo.html): no will-change hints, and 2D tweens carry force3D:false, so
 *     Chrome never keeps a composited layer whose text raster depends on which frame was drawn before. Elements a
 *     helper scales get an identity transform at build time for the same reason. Floaters stay 3D on purpose.
 *   - Colours are the brand tokens from assets/ui-light.css (--paper, --surface, --ink, --primary, ...). No gradients
 *     are drawn: the marker sweep uses a single-colour background image (both stops the same colour), i.e. a flat fill.
 *
 * Sources (all MIT; licence texts in reference/components/licences/):
 *   Magic UI (magicui.design/r, github.com/magicuidesign/magicui): text-animate, typing-animation, dot-pattern,
 *     animated-list, orbiting-circles, highlighter, safari, iphone, word-rotate, morphing-text, pointer.
 *   Kibo UI (kibo-ui.com/r): cursor (pointer path and name tag).
 *   Motion Primitives (motion-primitives.com/c, MIT by its README): text-shimmer.
 *   Watermelon UI (ui.watermelon.sh/r, github.com/WatermelonCorp/watermelon-platform): list-stack.
 *   Written here, no component fits: floaters (Cua keycap drift), gridZoomOut (Cua grid of windows).
 */
(function () {
  "use strict";
  var MP = (window.MP = window.MP || {});
  window.__events = window.__events || [];
  MP.drivers = MP.drivers || [];

  /* ------------------------------------------------------------------ core */

  MP.FPS = 30;
  MP.frame = function (t) { return Math.round(t * MP.FPS) / MP.FPS; };

  MP.applyAll = function (t) {
    for (var i = 0; i < MP.drivers.length; i++) MP.drivers[i](t);
  };

  /* One linear proxy tween over the whole film that calls MP.applyAll(t) on every render (seeks included).
     Call once, after all helpers. Also renders t=0 immediately so the first frame is correct before any seek. */
  MP.driverTween = function (tl, duration) {
    var proxy = { t: 0 };
    tl.fromTo(proxy, { t: 0 }, {
      t: duration, duration: duration, ease: "none", force3D: false, immediateRender: false,
      onUpdate: function () { MP.applyAll(proxy.t); }
    }, 0);
    MP.applyAll(0);
    return proxy;
  };

  MP.event = function (kind, t, data) {
    var e = { kind: kind, t: MP.frame(t) };
    if (data) for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) e[k] = data[k];
    window.__events.push(e);
    return e;
  };

  /* mulberry32. MP.rand(seed) returns a function giving floats in [0, 1). Seeds may be numbers or strings. */
  MP.hash = function (s) {
    s = String(s);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  MP.rand = function (seed) {
    var a = (typeof seed === "number" ? seed : MP.hash(seed)) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  function $(el) { return typeof el === "string" ? document.querySelector(el) : el; }
  function $$(els, root) {
    if (typeof els === "string") return Array.prototype.slice.call((root || document).querySelectorAll(els));
    return Array.prototype.slice.call(els || []);
  }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  MP.h = h;
  MP.cssVar = cssVar;

  /* Centre (or a fractional point) of an element in the coordinate space of `space`. Read at build time, before any
     transform is applied to either element; pass explicit x/y instead when layout is not final yet. */
  MP.pointOf = function (el, space, fx, fy) {
    el = $(el); space = $(space);
    var r = el.getBoundingClientRect(), s = space.getBoundingClientRect();
    return { x: r.left - s.left + r.width * (fx == null ? 0.5 : fx), y: r.top - s.top + r.height * (fy == null ? 0.5 : fy) };
  };

  /* ------------------------------------------------------------------ styles (injected once, namespaced .mp-) */

  var CSS = [
    ".mp-caret{display:inline-block;width:2px;height:1.05em;margin-left:1px;vertical-align:-0.15em;background:var(--primary);border-radius:1px}",
    ".mp-caret.block{width:0.55em;opacity:.35}",
    ".mp-typed{white-space:pre-wrap}",
    ".mp-cursor{position:absolute;left:0;top:0;z-index:50;pointer-events:none}",
    ".mp-cursor svg.mp-ptr{display:block;width:26px;height:26px;overflow:visible;filter:drop-shadow(0 2px 3px rgba(36,34,44,.22))}",
    ".mp-cursor svg.mp-ptr path{fill:var(--ink);stroke:var(--surface-raised);stroke-width:1.4;stroke-linejoin:round}",
    ".mp-cursor .mp-ring{position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;border:2px solid var(--primary);opacity:0}",
    ".mp-cursor .mp-tag{position:absolute;left:22px;top:20px;white-space:nowrap;padding:3px 10px 4px 9px;border-radius:12px 12px 12px 4px;font:600 14px/1.3 'MP Inter',Inter,sans-serif;color:var(--on-primary);background:var(--primary)}",
    ".mp-words .mp-w{display:inline-block}",
    ".mp-dotgrid{position:absolute;inset:0;overflow:hidden;pointer-events:none}",
    ".mp-dotgrid svg{position:absolute;left:0;top:0}",
    ".mp-floaters{position:absolute;inset:0;perspective:1400px;transform-style:preserve-3d;pointer-events:none}",
    ".mp-floater{position:absolute;left:0;top:0;transform-style:preserve-3d}",
    ".mp-orbit{position:absolute;left:50%;top:50%;width:0;height:0}",
    ".mp-orbit-path{position:absolute;border-radius:50%;border:1px solid var(--edge-strong);pointer-events:none}",
    ".mp-arm{position:absolute;left:0;top:0;width:0;height:0}",
    ".mp-sat{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--surface-raised);border:1px solid var(--edge);box-shadow:var(--shadow-raised);color:var(--ink-muted)}",
    ".mp-sat svg{width:55%;height:55%}",
    ".mp-stack{position:relative}",
    ".mp-stack>.mp-item{position:absolute;left:0;right:0;top:0;transform-origin:50% 0}",
    ".mp-shimmer .mp-l{color:var(--ink)}",
    ".mp-marker{background-image:linear-gradient(var(--mp-mark,var(--primary-soft)),var(--mp-mark,var(--primary-soft)));background-repeat:no-repeat;background-position:0 88%;background-size:0% 78%;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 .12em;margin:0 -.12em;border-radius:.18em}",
    ".mp-safari{position:absolute;overflow:hidden;background:var(--surface);border:1px solid var(--edge-strong);border-radius:14px;box-shadow:0 30px 60px rgba(62,45,30,.12),0 4px 12px rgba(36,34,44,.06)}",
    ".mp-safari .mp-bar{position:absolute;left:0;right:0;top:0;height:52px;background:var(--sunken);border-bottom:1px solid var(--edge);display:flex;align-items:center}",
    ".mp-safari .mp-dots{display:flex;gap:8px;padding-left:20px}",
    ".mp-safari .mp-dots i{display:block;width:12px;height:12px;border-radius:50%;background:var(--edge-strong)}",
    ".mp-safari .mp-url{position:absolute;left:50%;top:10px;transform:translateX(-50%);height:32px;min-width:38%;padding:0 18px;border-radius:9px;background:var(--surface-raised);border:1px solid var(--edge);display:flex;align-items:center;justify-content:center;gap:8px;font:500 15px/1 'MP Inter',Inter,sans-serif;color:var(--ink-muted)}",
    ".mp-safari .mp-url svg{width:14px;height:14px;color:var(--ink-faint)}",
    ".mp-safari .mp-screen{position:absolute;left:0;right:0;top:52px;bottom:0;overflow:hidden;background:var(--paper)}",
    ".mp-iphone{position:absolute}",
    ".mp-iphone svg.mp-frame{position:absolute;inset:0;width:100%;height:100%}",
    ".mp-iphone .mp-screen{position:absolute;overflow:hidden;background:var(--paper)}",
    ".mp-iphone .mp-island{position:absolute;left:35.57%;top:3.4%;width:28.64%;height:4.2%;border-radius:99px;background:var(--ink);z-index:2}",
    ".mp-gridtile{position:absolute;left:0;top:0;transform-origin:0 0}",
    ".mp-rotate{display:inline-block;position:relative;overflow:hidden;vertical-align:bottom}",
    ".mp-rotate>span{display:inline-block}",
    ".mp-morph{position:relative;display:inline-block;filter:url(#mp-threshold)}",
    ".mp-morph>span{position:absolute;left:0;right:0;top:0;text-align:inherit}"
  ].join("\n");
  function injectCSS() {
    if (document.getElementById("mp-parts-css")) return;
    var s = document.createElement("style");
    s.id = "mp-parts-css";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  injectCSS();

  /* ------------------------------------------------------------------ 2. typeText
     Source: Magic UI Typing Animation (https://magicui.design/r/typing-animation.json, MIT): per-character reveal with a
     line caret. Ported to a time-indexed driver: the character count and caret blink are pure functions of t.
     Per-character times get a seeded jitter so the rhythm reads human, and each character emits a "key" event.
     opts: el, text, t (start), cps (chars/s, default 14), jitterSeed, jitter (0..1, default 0.35),
           pauseAfter (extra s after , . ; :, default 0.12), caret (true | "block" | false),
           caretFrom (default t - 0.4), caretUntil (default end + 1.2; Infinity keeps it), keyEvents (default true),
           prefix (text already present before typing starts). Returns { end, times }. */
  MP.typeText = function (tl, o) {
    var el = $(o.el), text = String(o.text), t0 = o.t || 0, cps = o.cps || 14;
    var rnd = MP.rand(o.jitterSeed != null ? o.jitterSeed : "type:" + text);
    var jitter = o.jitter == null ? 0.35 : o.jitter, pause = o.pauseAfter == null ? 0.12 : o.pauseAfter;
    var prefix = o.prefix || "";
    var times = [], tt = t0;
    for (var i = 0; i < text.length; i++) {
      tt += (1 / cps) * (1 + (rnd() * 2 - 1) * jitter);
      if (i > 0 && /[,.;:!?]/.test(text[i - 1])) tt += pause;
      times.push(MP.frame(tt));
    }
    var end = times.length ? times[times.length - 1] : t0;
    el.textContent = "";
    var typed = h("span", "mp-typed");
    el.appendChild(typed);
    var caret = null;
    if (o.caret !== false) {
      caret = h("span", "mp-caret" + (o.caret === "block" ? " block" : ""));
      el.appendChild(caret);
    }
    var cFrom = o.caretFrom == null ? t0 - 0.4 : o.caretFrom;
    var cUntil = o.caretUntil == null ? end + 1.2 : o.caretUntil;
    if (o.keyEvents !== false) {
      for (var k = 0; k < times.length; k++) {
        MP.event("key", times[k], { ch: text[k] === " " ? "space" : text[k], src: o.id || el.id || "type" });
      }
    }
    var last = -1, lastCaret = null;
    MP.drivers.push(function (t) {
      var n = 0;
      while (n < times.length && times[n] <= t + 1e-6) n++;
      if (n !== last) { typed.textContent = prefix + text.slice(0, n); last = n; }
      if (caret) {
        var on;
        if (t < cFrom || t > cUntil) on = false;
        else if (t >= t0 && t <= end + 0.35) on = true; // solid while typing
        else { var ph = ((t - cFrom) % 1.06 + 1.06) % 1.06; on = ph < 0.6; } // 1.06 s blink, as typing-animation's CSS blink
        if (on !== lastCaret) { caret.style.visibility = on ? "visible" : "hidden"; lastCaret = on; }
      }
    });
    return { end: end, times: times, typed: typed, caret: caret };
  };

  /* ------------------------------------------------------------------ 3. cursor
     Source: Kibo UI Cursor (https://www.kibo-ui.com/r/cursor.json, MIT): the pointer path and the name tag
     (CursorBody / CursorName). Motion from Magic UI Pointer (https://magicui.design/r/pointer.json, MIT) in spirit;
     here every move is a fromTo with the previous position tracked at build time. x and y use different eases so the
     path bows slightly, as a hand does. Click: pointer and target press to 0.95 and back, a primary ring, a "click"
     event. Hover: target background eases to its hover colour (default --primary-hover for primary buttons).
     Usage: var c = MP.cursor.create(stageEl, {x, y, label}); c.moveTo(tl, {x, y, t, dur}); c.click(tl, {t, target});
            c.hover(tl, {target, t, until, to}); MP.cursor.moveTo(tl, {...}) uses the last created cursor. */
  var KIBO_PTR = "M19.438 6.716 1.115.05A.832.832 0 0 0 .05 1.116L6.712 19.45a.834.834 0 0 0 1.557.025l3.198-8 7.995-3.2a.833.833 0 0 0 0-1.559h-.024Z";
  function Cursor(parent, o) {
    o = o || {};
    this.el = h("div", "mp-cursor" + (o.className ? " " + o.className : ""));
    this.el.innerHTML = '<span class="mp-ring"></span><svg class="mp-ptr" viewBox="0 0 20 20" aria-hidden="true"><path d="' + KIBO_PTR + '"/></svg>';
    if (o.label) {
      var tag = h("span", "mp-tag");
      tag.textContent = o.label;
      if (o.tint) tag.style.background = o.tint;
      this.el.appendChild(tag);
    }
    this.ring = this.el.querySelector(".mp-ring");
    this.ptr = this.el.querySelector(".mp-ptr");
    $(parent).appendChild(this.el);
    this.x = o.x || 0; this.y = o.y || 0; this.visible = o.visible !== false;
    gsap.set(this.el, { x: this.x, y: this.y, autoAlpha: this.visible ? 1 : 0 });
    gsap.set(this.ptr, { transformOrigin: "0 0", scale: 1 });
  }
  Cursor.prototype.moveTo = function (tl, o) {
    var p = o.to ? MP.pointOf(o.to, this.el.parentNode, o.fx, o.fy) : { x: o.x, y: o.y };
    var dur = o.dur == null ? 0.9 : o.dur, t = o.t;
    tl.fromTo(this.el, { x: this.x }, { x: p.x, duration: dur, ease: o.ease || "power2.inOut", force3D: false, immediateRender: false }, t);
    tl.fromTo(this.el, { y: this.y }, { y: p.y, duration: dur, ease: o.easeY || "power3.inOut", force3D: false, immediateRender: false }, t);
    this.x = p.x; this.y = p.y;
    return t + dur;
  };
  Cursor.prototype.show = function (tl, o) {
    var on = o.on !== false, d = o.dur == null ? 0.25 : o.dur;
    tl.fromTo(this.el, { autoAlpha: this.visible ? 1 : 0 }, { autoAlpha: on ? 1 : 0, duration: d, ease: "power1.out", force3D: false, immediateRender: false }, o.t);
    this.visible = on;
  };
  Cursor.prototype.click = function (tl, o) {
    var t = o.t, target = o.target ? $(o.target) : null, press = o.press == null ? 0.95 : o.press;
    tl.fromTo(this.ptr, { scale: 1 }, { scale: press - 0.1, duration: 0.08, ease: "power2.out", force3D: false, immediateRender: false }, t);
    tl.fromTo(this.ptr, { scale: press - 0.1 }, { scale: 1, duration: 0.18, ease: "power2.out", force3D: false, immediateRender: false }, t + 0.08);
    tl.fromTo(this.ring, { scale: 0.35, opacity: 0.55 }, { scale: 1.5, opacity: 0, duration: 0.45, ease: "power2.out", force3D: false, immediateRender: false }, t);
    if (target) {
      gsap.set(target, { scale: 1, force3D: false });
      tl.fromTo(target, { scale: 1 }, { scale: press, duration: 0.08, ease: "power2.out", force3D: false, immediateRender: false }, t);
      tl.fromTo(target, { scale: press }, { scale: 1, duration: 0.2, ease: "back.out(2)", force3D: false, immediateRender: false }, t + 0.08);
    }
    MP.event("click", t, { src: o.id || (target && target.id) || "cursor" });
    return t + 0.28;
  };
  Cursor.prototype.hover = function (tl, o) {
    var target = $(o.target), t = o.t, d = o.dur == null ? 0.18 : o.dur;
    var from = o.from || getComputedStyle(target).backgroundColor;
    var to = o.to || cssVar("--primary-hover") || "#964f11";
    if (to.indexOf("var(") === 0) to = cssVar(to.slice(4, -1).trim());
    tl.fromTo(target, { backgroundColor: from }, { backgroundColor: to, duration: d, ease: "power1.out", force3D: false, immediateRender: false }, t);
    if (o.until != null) {
      tl.fromTo(target, { backgroundColor: to }, { backgroundColor: from, duration: d, ease: "power1.out", force3D: false, immediateRender: false }, o.until);
    }
  };
  MP.cursor = {
    last: null,
    create: function (parent, o) { var c = new Cursor(parent, o); MP.cursor.last = c; return c; },
    moveTo: function (tl, o) { return (o.cursor || MP.cursor.last).moveTo(tl, o); },
    click: function (tl, o) { return (o.cursor || MP.cursor.last).click(tl, o); },
    hover: function (tl, o) { return (o.cursor || MP.cursor.last).hover(tl, o); },
    show: function (tl, o) { return (o.cursor || MP.cursor.last).show(tl, o); }
  };

  /* ------------------------------------------------------------------ 1. blurWords
     Source: Magic UI Text Animate, animation "blurInUp" by "word" (https://magicui.design/r/text-animate.json, MIT):
     each word from { opacity 0, blur(10px), y 20 } to { opacity 1, blur(0), y 0 } in 0.3 to 0.4 s, staggered.
     Splits text nodes recursively, so inline accents (<em>, <span class=...>) keep their styling.
     opts: el, t, stagger (default 0.08), dur (default 0.55), y (default 20), blur (default 10), by ("word" | "char"),
           out ({ t, stagger, dur }) to blur the words away again. Returns the end time. */
  MP.blurWords = function (tl, o) {
    var el = $(o.el), by = o.by || "word";
    if (!el.__mpWords) {
      var words = [];
      (function split(node) {
        $$(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var parts = by === "char" ? n.textContent.split("") : n.textContent.split(/(\s+)/);
            var frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var s = h("span", "mp-w"); s.textContent = p; frag.appendChild(s); words.push(s);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && !n.classList.contains("mp-w")) split(n);
        });
      })(el);
      el.classList.add("mp-words");
      el.__mpWords = words;
    }
    var ws = el.__mpWords, st = o.stagger == null ? 0.08 : o.stagger, d = o.dur == null ? 0.55 : o.dur;
    var blur = o.blur == null ? 10 : o.blur, y = o.y == null ? 20 : o.y;
    ws.forEach(function (w, i) {
      tl.fromTo(w, { opacity: 0, filter: "blur(" + blur + "px)", y: y },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: d, ease: "power2.out", force3D: false, immediateRender: i >= 0 && !o.noInitial }, o.t + i * st);
    });
    var end = o.t + (ws.length - 1) * st + d;
    if (o.out) {
      var ost = o.out.stagger == null ? st * 0.5 : o.out.stagger, od = o.out.dur == null ? 0.4 : o.out.dur;
      ws.forEach(function (w, i) {
        tl.fromTo(w, { opacity: 1, filter: "blur(0px)", y: 0 },
          { opacity: 0, filter: "blur(" + blur + "px)", y: -y * 0.5, duration: od, ease: "power2.in", force3D: false, immediateRender: false }, o.out.t + i * ost);
      });
    }
    return end;
  };

  /* ------------------------------------------------------------------ 4. dotGrid
     Source: Magic UI Dot Pattern (https://magicui.design/r/dot-pattern.json, MIT): an SVG of evenly spaced dots
     (width/height 16, cr 1 by default). Static by default, as one SVG <pattern>. Options:
       drift: { tl, t0, t1, dx, dy } slides the pattern linearly (wraps seamlessly on whole cells).
       halftone: { t0, t1, amp, radius, path } Motionfly's soft halftone: individual dots whose radius swells near a
         centre that travels a slow Lissajous path, driven by t (MP.drivers). Edges fade by distance from the middle.
     opts: gap (default 24), r (default 1.3), color (default var(--edge-strong)), opacity. Returns { root }. */
  MP.dotGrid = function (el, o) {
    el = $(el); o = o || {};
    var gap = o.gap || 24, r = o.r || 1.3, color = o.color || "var(--edge-strong)";
    var W = o.width || el.offsetWidth || 1920, H = o.height || el.offsetHeight || 1080;
    var root = h("div", "mp-dotgrid");
    if (o.opacity != null) root.style.opacity = o.opacity;
    el.appendChild(root);
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    var pad = gap * 2;
    svg.setAttribute("width", W + pad * 2); svg.setAttribute("height", H + pad * 2);
    svg.style.left = -pad + "px"; svg.style.top = -pad + "px";
    root.appendChild(svg);
    if (!o.halftone) {
      var pid = "mp-dots-" + MP.hash(String(gap) + r + color + W + H + (o.id || ""));
      svg.innerHTML = '<defs><pattern id="' + pid + '" width="' + gap + '" height="' + gap + '" patternUnits="userSpaceOnUse">' +
        '<circle cx="' + gap / 2 + '" cy="' + gap / 2 + '" r="' + r + '" style="fill:' + color + '"/></pattern></defs>' +
        '<rect width="100%" height="100%" fill="url(#' + pid + ')"/>';
    } else {
      var ht = o.halftone, dots = [], cols = Math.ceil((W + pad * 2) / gap), rows = Math.ceil((H + pad * 2) / gap);
      var g = document.createElementNS(NS, "g");
      g.style.fill = color;
      svg.appendChild(g);
      var cx0 = (W + pad * 2) / 2, cy0 = (H + pad * 2) / 2, maxd = Math.hypot(cx0, cy0);
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var c = document.createElementNS(NS, "circle"), x = i * gap + gap / 2, y = j * gap + gap / 2;
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r);
        var edge = 1 - Math.pow(Math.hypot(x - cx0, y - cy0) / maxd, 2) * 0.85;
        c.setAttribute("opacity", edge.toFixed(3));
        g.appendChild(c); dots.push({ c: c, x: x, y: y, r: -1 });
      }
      var amp = ht.amp == null ? 1.6 : ht.amp, rad = ht.radius || 420, t0 = ht.t0 || 0;
      var path = ht.path || function (t) { // slow Lissajous around the middle
        var u = (t - t0) * 0.11;
        return { x: cx0 + Math.sin(u * 1.0) * W * 0.28, y: cy0 + Math.sin(u * 1.7 + 0.6) * H * 0.22 };
      };
      MP.drivers.push(function (t) {
        var on = (ht.t1 == null || t <= ht.t1 + 0.5) && t >= t0 - 0.5;
        var p = path(t);
        for (var k = 0; k < dots.length; k++) {
          var d = dots[k], q = on ? Math.exp(-(((d.x - p.x) * (d.x - p.x) + (d.y - p.y) * (d.y - p.y)) / (rad * rad))) : 0;
          var nr = Math.round((r * (1 + amp * q)) * 20) / 20;
          if (nr !== d.r) { d.c.setAttribute("r", nr); d.r = nr; }
        }
      });
    }
    if (o.drift) {
      var dr = o.drift, dx = dr.dx == null ? gap : dr.dx, dy = dr.dy == null ? gap : dr.dy;
      dr.tl.fromTo(svg, { x: 0, y: 0 }, { x: dx, y: dy, duration: dr.t1 - dr.t0, ease: "none", force3D: false, immediateRender: true }, dr.t0);
    }
    return { root: root, svg: svg };
  };

  /* ------------------------------------------------------------------ 5. floaters
     Written here (no free component fits): Cua Spaces' keycaps drifting in 3D around a centred window, with depth of
     field. Each item gets a seeded slot on an ellipse around the centre, a depth z, a small tilt, and drifts linearly
     from t0 to t1 (outer element) while bobbing on a sine yoyo (inner element). Blur grows with distance from the
     focal plane (z = focusZ). Entrance: from 140 px further back with opacity 0, staggered.
     opts: container, items (elements or HTML strings), seed, t0, t1, cx, cy, rx, ry, zMin (-420), zMax (160),
           focusZ (0), dofPerPx (1/90 px of blur per px of depth), drift (px, default 60), enterStagger (0.12),
           out ({ t, dur }) to sink them away. Returns the floater elements. */
  MP.floaters = function (tl, o) {
    var box = $(o.container), rnd = MP.rand(o.seed == null ? "floaters" : o.seed);
    var W = box.offsetWidth || 1920, H = box.offsetHeight || 1080;
    var cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
    var rx = o.rx || W * 0.42, ry = o.ry || H * 0.40, zMin = o.zMin == null ? -420 : o.zMin, zMax = o.zMax == null ? 160 : o.zMax;
    var focus = o.focusZ || 0, dof = o.dofPerPx == null ? 1 / 90 : o.dofPerPx, drift = o.drift == null ? 60 : o.drift;
    var layer = h("div", "mp-floaters");
    box.appendChild(layer);
    var n = o.items.length, out = [], span = o.t1 - o.t0;
    o.items.forEach(function (item, i) {
      var outer = h("div", "mp-floater"), inner = h("div", "mp-floater-inner");
      if (typeof item === "string") inner.innerHTML = item; else inner.appendChild(item);
      outer.appendChild(inner); layer.appendChild(outer);
      var w = inner.offsetWidth || 200, hh = inner.offsetHeight || 120;
      var ang = (i / n) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI / n) + (o.phase || -Math.PI / 2);
      var rr = 0.82 + rnd() * 0.22;
      var x = cx + Math.cos(ang) * rx * rr - w / 2, y = cy + Math.sin(ang) * ry * rr - hh / 2;
      var z = zMin + rnd() * (zMax - zMin);
      var a = rnd() * Math.PI * 2;
      var x1 = x + Math.cos(a) * drift, y1 = y + Math.sin(a) * drift * 0.6, z1 = z + (rnd() - 0.5) * 80;
      var rX = (rnd() - 0.5) * 24, rY = (rnd() - 0.5) * 30, rZ = (rnd() - 0.5) * 14;
      var b0 = Math.abs(z - focus) * dof, b1 = Math.abs(z1 - focus) * dof;
      gsap.set(outer, { x: x, y: y, z: z, rotationX: rX, rotationY: rY, rotationZ: rZ, filter: "blur(" + b0.toFixed(2) + "px)" });
      tl.fromTo(outer, { x: x, y: y, z: z, rotationX: rX, rotationY: rY, rotationZ: rZ, filter: "blur(" + b0.toFixed(2) + "px)" },
        { x: x1, y: y1, z: z1, rotationX: -rX * 0.6, rotationY: -rY * 0.6, rotationZ: rZ * 0.4, filter: "blur(" + b1.toFixed(2) + "px)",
          duration: span, ease: "none", immediateRender: false }, o.t0);
      var bob = 6 + rnd() * 8, per = 2.6 + rnd() * 1.8, reps = Math.max(0, Math.ceil(span / per) - 1);
      tl.fromTo(inner, { y: -bob }, { y: bob, duration: per, ease: "sine.inOut", repeat: reps, yoyo: true, force3D: false, immediateRender: true }, o.t0);
      var et = o.t0 + i * (o.enterStagger == null ? 0.12 : o.enterStagger);
      tl.fromTo(inner, { opacity: 0, z: -140 }, { opacity: 1, z: 0, duration: 0.9, ease: "power3.out", immediateRender: true }, et);
      if (o.out) {
        tl.fromTo(inner, { opacity: 1, z: 0 }, { opacity: 0, z: -200, duration: o.out.dur || 0.6, ease: "power2.in", immediateRender: false }, o.out.t + i * 0.04);
      }
      out.push(outer);
    });
    return out;
  };

  /* ------------------------------------------------------------------ 6. orbit
     Source: Magic UI Orbiting Circles (https://magicui.design/r/orbiting-circles.json, MIT): n icons spaced 360/n on a
     circle of `radius` (default 160) with a thin path ring, turning once per `duration` (default 20 s), optionally
     reversed. Ported as an arm that rotates and a satellite that counter-rotates, so icons stay upright.
     opts: container (positioned element; the orbit centres in it), items (icon SVG strings or elements), radius,
           size (icon size, default 56), t0, t1, duration (s per turn, default 20), reverse, path (default true),
           cx, cy (px inside container; default centre), enter (stagger, default 0.1). Returns { root, sats }. */
  MP.orbit = function (tl, o) {
    var box = $(o.container), R = o.radius || 160, size = o.size || 56, n = o.items.length;
    var root = h("div", "mp-orbit");
    if (o.cx != null) { root.style.left = o.cx + "px"; root.style.top = o.cy + "px"; }
    box.appendChild(root);
    if (o.path !== false) {
      var ring = h("div", "mp-orbit-path");
      ring.style.cssText = "left:" + -R + "px;top:" + -R + "px;width:" + 2 * R + "px;height:" + 2 * R + "px";
      root.appendChild(ring);
      tl.fromTo(ring, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", force3D: false }, o.t0);
    }
    var turn = 360 * ((o.t1 - o.t0) / (o.duration || 20)) * (o.reverse ? -1 : 1);
    var sats = [];
    o.items.forEach(function (it, i) {
      var arm = h("div", "mp-arm"), sat = h("div", "mp-sat");
      if (typeof it === "string") sat.innerHTML = it; else sat.appendChild(it);
      sat.style.cssText += ";width:" + size + "px;height:" + size + "px;left:" + (R - size / 2) + "px;top:" + -size / 2 + "px";
      arm.appendChild(sat); root.appendChild(arm);
      var a0 = (360 / n) * i + (o.startAngle || -90);
      tl.fromTo(arm, { rotation: a0 }, { rotation: a0 + turn, duration: o.t1 - o.t0, ease: "none", force3D: false, immediateRender: true }, o.t0);
      tl.fromTo(sat, { rotation: -a0 }, { rotation: -(a0 + turn), duration: o.t1 - o.t0, ease: "none", force3D: false, immediateRender: true }, o.t0);
      tl.fromTo(sat, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)", force3D: false, immediateRender: true },
        o.t0 + 0.15 + i * (o.enter == null ? 0.1 : o.enter));
      sats.push(sat);
    });
    return { root: root, sats: sats };
  };

  /* ------------------------------------------------------------------ 7. stackList
     Sources: Magic UI Animated List (https://magicui.design/r/animated-list.json, MIT): the newest item enters at the
     top from scale 0, opacity 0 (spring 350/40, which is critically damped, so expo.out over 0.5 s here) and the rest
     slide down. Watermelon UI List Stack (https://ui.watermelon.sh/r/list-stack.json, MIT): a collapsed stack
     (y = i * -7, deeper z per card) that fans out into a list (y = (n-1-i) * (h + gap)).
     opts: container (position: relative; its children with class .mp-item, or `items`), mode "arrive" | "fan",
       arrive: t, every (s between arrivals, default 0.9), gap (default 12), max (visible, default all)
       fan:    t (expand time), dur (0.7), gap (8), collapsed (true: build collapsed at t<t)
     Returns the end time. */
  MP.stackList = function (tl, o) {
    var box = $(o.container), items = o.items ? $$(o.items) : $$(box.children);
    box.classList.add("mp-stack");
    items.forEach(function (it) { it.classList.add("mp-item"); });
    var hs = items.map(function (it) { return it.offsetHeight || 64; });
    var gap = o.gap == null ? (o.mode === "fan" ? 8 : 12) : o.gap;
    if (o.mode === "fan") {
      var n = items.length, d = o.dur || 0.7, y = 0, ys = [];
      for (var k = n - 1; k >= 0; k--) { ys[k] = y; y += hs[k] + gap; }
      items.forEach(function (it, i) {
        var from = { y: i * -7, scale: 1 - (n - 1 - i) * 0.04, zIndex: i };
        gsap.set(it, from);
        tl.fromTo(it, { y: from.y, scale: from.scale }, { y: ys[i], scale: 1, duration: d, ease: "back.out(1.15)", force3D: false, immediateRender: false }, o.t + (n - 1 - i) * 0.04);
      });
      box.style.height = y + "px";
      return o.t + d;
    }
    var every = o.every || 0.9, max = o.max || items.length, pos = items.map(function () { return 0; }), shown = [];
    items.forEach(function (it) { gsap.set(it, { opacity: 0, scale: 0, y: 0 }); });
    items.forEach(function (it, i) {
      var t = o.t + i * every;
      tl.fromTo(it, { opacity: 0, scale: 0, y: 0 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out", force3D: false, immediateRender: false }, t);
      var push = hs[i] + gap;
      shown.forEach(function (j, idx) {
        var ny = pos[j] + push;
        tl.fromTo(items[j], { y: pos[j] }, { y: ny, duration: 0.5, ease: "expo.out", force3D: false, immediateRender: false }, t);
        pos[j] = ny;
        if (shown.length - idx >= max) {
          tl.fromTo(items[j], { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "power1.out", force3D: false, immediateRender: false }, t);
        }
      });
      shown.push(i);
      if (o.events) MP.event(o.events, t, { src: "stackList" });
    });
    return o.t + (items.length - 1) * every + 0.5;
  };

  /* ------------------------------------------------------------------ 8. shimmer
     Source: Motion Primitives Text Shimmer (https://motion-primitives.com/c/text-shimmer.json, MIT by its README): a
     bright band sweeps across muted text every `duration` (default 2 s), band width = length * spread. Ported without
     the gradient fill (brand rule): each letter's opacity rises with its distance to the travelling band, computed
     per frame by a driver. opts: el, t0, t1, period (default 2), spread (letters, default 4), base (default 0.38).
     After t1 the text rests at full ink. */
  MP.shimmer = function (tl, o) {
    var el = $(o.el), text = el.textContent, letters = [];
    el.textContent = "";
    el.classList.add("mp-shimmer");
    for (var i = 0; i < text.length; i++) {
      var s = h("span", "mp-l"); s.textContent = text[i]; el.appendChild(s); letters.push(s);
    }
    var period = o.period || 2, spread = o.spread || 4, base = o.base == null ? 0.38 : o.base, n = letters.length;
    var last = [];
    MP.drivers.push(function (t) {
      var active = t >= o.t0 && (o.t1 == null || t < o.t1);
      var ph = (((t - o.t0) / period) % 1 + 1) % 1, band = -spread + ph * (n + spread * 2);
      for (var k = 0; k < n; k++) {
        var v = active ? base + (1 - base) * Math.exp(-Math.pow((k - band) / spread, 2)) : (t < o.t0 ? base : 1);
        v = Math.round(v * 100) / 100;
        if (last[k] !== v) { letters[k].style.opacity = v; last[k] = v; }
      }
    });
  };

  /* ------------------------------------------------------------------ 9. markerSweep
     Source: Magic UI Highlighter, action "highlight" (https://magicui.design/r/highlighter.json, MIT; it draws with
     rough-notation, MIT): a marker fills behind the words, left to right, 600 ms by default. Ported as a flat
     single-colour block (the brand's flat style, no hand-drawn wobble) that grows with background-size, so it wraps
     across lines. opts: el, t, dur (default 0.6), color (CSS colour or var, default var(--primary-soft); use
     var(--added-soft) for an accepted correction), out ({ t, dur }). */
  MP.markerSweep = function (tl, o) {
    var el = $(o.el);
    el.classList.add("mp-marker");
    if (o.color) el.style.setProperty("--mp-mark", o.color);
    tl.fromTo(el, { backgroundSize: "0% 78%" }, { backgroundSize: "100% 78%", duration: o.dur || 0.6, ease: "power2.inOut", force3D: false, immediateRender: true }, o.t);
    if (o.out) tl.fromTo(el, { backgroundSize: "100% 78%" }, { backgroundSize: "0% 78%", duration: o.out.dur || 0.4, ease: "power2.in", force3D: false, immediateRender: false }, o.out.t);
  };

  /* ------------------------------------------------------------------ 10. frames: browser window and phone
     Safari: Magic UI Safari (https://magicui.design/r/safari.json, MIT): a 1203 x 753 window with a 52 px toolbar,
     three dots and a centred address field. Rebuilt in HTML in the brand's colours (dots in --edge-strong, no
     traffic-light colours). iPhone: Magic UI iPhone (https://magicui.design/r/iphone.json, MIT): the 433 x 882 frame
     paths, screen at (21.25, 19.25) sized 389.5 x 843.5 with a 55.75 radius; frame fill --edge-strong, bezel
     --surface-raised, island --ink. Both return { root, screen } to fill with rebuilt UI. */
  MP.frames = {
    safari: function (parent, o) {
      o = o || {};
      var root = h("div", "mp-safari" + (o.className ? " " + o.className : ""));
      var w = o.width || 1203, hh = o.height || 753;
      root.style.cssText += ";left:" + (o.x || 0) + "px;top:" + (o.y || 0) + "px;width:" + w + "px;height:" + hh + "px";
      var lock = (window.ICONS && window.ICONS["lock-simple"]) || '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z"/></svg>';
      root.innerHTML = '<div class="mp-bar"><div class="mp-dots"><i></i><i></i><i></i></div>' +
        '<div class="mp-url">' + lock + '<span class="mp-url-text"></span></div></div><div class="mp-screen"></div>';
      root.querySelector(".mp-url-text").textContent = o.url || "meltingpots.xyz";
      $(parent).appendChild(root);
      return { root: root, screen: root.querySelector(".mp-screen"), url: root.querySelector(".mp-url-text") };
    },
    iphone: function (parent, o) {
      o = o || {};
      var PW = 433, PH = 882, w = o.width || 300, s = w / PW, hh = PH * s;
      var root = h("div", "mp-iphone" + (o.className ? " " + o.className : ""));
      root.style.cssText += ";left:" + (o.x || 0) + "px;top:" + (o.y || 0) + "px;width:" + w + "px;height:" + hh + "px";
      root.innerHTML =
        '<svg class="mp-frame" viewBox="0 0 433 882" aria-hidden="true">' +
        '<path d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z" style="fill:var(--edge-strong)"/>' +
        '<path d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z" style="fill:var(--edge-strong)"/>' +
        '<path d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z" style="fill:var(--edge-strong)"/>' +
        '<path d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z" style="fill:var(--edge-strong)"/>' +
        '<path d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z" style="fill:var(--edge-strong)"/>' +
        '<path d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z" style="fill:var(--surface-raised)"/>' +
        '</svg><div class="mp-island"></div><div class="mp-screen"></div>';
      var sc = root.querySelector(".mp-screen");
      sc.style.cssText = "left:" + (21.25 / PW * 100) + "%;top:" + (19.25 / PH * 100) + "%;width:" + (389.5 / PW * 100) + "%;height:" +
        (843.5 / PH * 100) + "%;border-radius:" + (55.75 * s) + "px";
      $(parent).appendChild(root);
      return { root: root, screen: sc };
    }
  };

  /* ------------------------------------------------------------------ 11. gridZoomOut
     Written here (no free component fits): Cua Spaces at 24 s, one window becomes one tile in a grid of many. A layout
     move, not a camera move: the hero element FLIPs from its own rect into its grid cell (x, y, scale on a 0 0 origin)
     while the other tiles land in their cells, staggered outward from the hero's cell in seeded order.
     opts: container, hero (element already absolutely positioned at heroRect), heroRect {x,y,w,h},
           tiles (elements, any size; each is scaled to a cell), area {x,y,w,h} (default the container), cols, rows,
           gap (default 18), heroCell (index, default centre), t, dur (default 1.2), seed, back ({ t, dur }) to return.
     Emits one "whoosh". Returns the cell rects. */
  MP.gridZoomOut = function (tl, o) {
    var box = $(o.container), cols = o.cols || 5, rows = o.rows || 4, gap = o.gap == null ? 18 : o.gap;
    var A = o.area || { x: 0, y: 0, w: box.offsetWidth, h: box.offsetHeight };
    var hr = o.heroRect, cw = (A.w - gap * (cols - 1)) / cols, ch = (A.h - gap * (rows - 1)) / rows;
    var aspect = hr.w / hr.h;
    if (cw / ch > aspect) cw = ch * aspect; else ch = cw / aspect; // keep the hero's aspect in every cell
    var gx = A.x + (A.w - (cw * cols + gap * (cols - 1))) / 2, gy = A.y + (A.h - (ch * rows + gap * (rows - 1))) / 2;
    var cells = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) cells.push({ x: gx + c * (cw + gap), y: gy + r * (ch + gap), w: cw, h: ch, c: c, r: r });
    var hc = o.heroCell == null ? Math.floor(rows / 2) * cols + Math.floor(cols / 2) : o.heroCell;
    var dur = o.dur || 1.2, t = o.t, hero = $(o.hero), cell = cells[hc], sc = cell.w / hr.w;
    gsap.set(hero, { transformOrigin: "0 0" });
    tl.fromTo(hero, { x: 0, y: 0, scale: 1 }, { x: cell.x - hr.x, y: cell.y - hr.y, scale: sc, duration: dur, ease: "power3.inOut", force3D: false, immediateRender: false }, t);
    var rnd = MP.rand(o.seed == null ? "grid" : o.seed), order = [];
    cells.forEach(function (cl, i) { if (i !== hc) order.push({ i: i, d: Math.hypot(cl.c - cell.c, (cl.r - cell.r) * 1.2) + rnd() * 0.6 }); });
    order.sort(function (a, b) { return a.d - b.d; });
    var tiles = $$(o.tiles);
    order.forEach(function (ob, k) {
      var tile = tiles[k];
      if (!tile) return;
      var cl = cells[ob.i], tw = tile.offsetWidth || hr.w, s = cl.w / tw;
      tile.classList.add("mp-gridtile");
      gsap.set(tile, { x: cl.x, y: cl.y + 24, scale: s * 0.94, opacity: 0 });
      var tt = t + dur * 0.35 + ob.d * 0.08;
      tl.fromTo(tile, { y: cl.y + 24, scale: s * 0.94, opacity: 0 }, { y: cl.y, scale: s, opacity: 1, duration: 0.7, ease: "power3.out", force3D: false, immediateRender: false }, tt);
      if (o.back) tl.fromTo(tile, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "power1.in", force3D: false, immediateRender: false }, o.back.t);
    });
    if (o.back) {
      tl.fromTo(hero, { x: cell.x - hr.x, y: cell.y - hr.y, scale: sc }, { x: 0, y: 0, scale: 1, duration: o.back.dur || dur, ease: "power3.inOut", force3D: false, immediateRender: false }, o.back.t);
      MP.event("whoosh", o.back.t, { src: "gridZoomOut" });
    }
    MP.event("whoosh", t, { src: "gridZoomOut" });
    return cells;
  };

  /* ------------------------------------------------------------------ 12a. wordRotate
     Source: Magic UI Word Rotate (https://magicui.design/r/word-rotate.json, MIT): each word enters from y -50,
     opacity 0 and leaves to y 50 in 0.25 s easeOut, one word per 2.5 s. Ported with explicit change times.
     opts: el, words, t (first change), every (default 2.5), dur (default 0.35), dist (default 0.6em in px, 40).
     The first word shows from the start; word i+1 replaces word i at t + i * every. */
  MP.wordRotate = function (tl, o) {
    var el = $(o.el), words = o.words, every = o.every || 2.5, d = o.dur || 0.35, dist = o.dist || 40;
    el.textContent = ""; el.classList.add("mp-rotate");
    var spans = words.map(function (w, i) {
      var s = h("span"); s.textContent = w;
      if (i > 0) { s.style.position = "absolute"; s.style.left = "0"; s.style.top = "0"; }
      el.appendChild(s); return s;
    });
    spans.forEach(function (s, i) { gsap.set(s, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : -dist }); });
    for (var i = 1; i < spans.length; i++) {
      var tt = o.t + (i - 1) * every;
      tl.fromTo(spans[i - 1], { opacity: 1, y: 0 }, { opacity: 0, y: dist, duration: d, ease: "power2.out", force3D: false, immediateRender: false }, tt);
      tl.fromTo(spans[i], { opacity: 0, y: -dist }, { opacity: 1, y: 0, duration: d, ease: "power2.out", force3D: false, immediateRender: false }, tt);
    }
  };

  /* ------------------------------------------------------------------ 12b. morphText
     Source: Magic UI Morphing Text (https://magicui.design/r/morphing-text.json, MIT): two stacked spans cross-fade
     with blur(8/f - 8 px) and opacity f^0.4 under an SVG alpha-threshold filter, so letters melt into each other
     (morphTime 1.5 s, cooldown 0.5 s). Ported as a driver over explicit morph windows.
     opts: el, texts, t (first morph start), morph (default 1.5), hold (default 1.6 between morphs).
     The element needs a fixed height (it holds absolutely positioned spans). */
  MP.morphText = function (tl, o) {
    var el = $(o.el), texts = o.texts, m = o.morph || 1.5, hold = o.hold == null ? 1.6 : o.hold;
    if (!document.getElementById("mp-threshold-svg")) {
      var svg = h("div"); svg.id = "mp-threshold-svg";
      svg.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><filter id="mp-threshold"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></defs></svg>';
      document.body.appendChild(svg);
    }
    el.textContent = ""; el.classList.add("mp-morph");
    var a = h("span"), b = h("span"); el.appendChild(a); el.appendChild(b);
    var last = "";
    MP.drivers.push(function (t) {
      var k = Math.floor((t - o.t) / (m + hold)), local = (t - o.t) - k * (m + hold);
      var idx, f;
      if (t < o.t) { idx = 0; f = 0; }
      else if (k >= texts.length - 1) { idx = texts.length - 2; f = 1; }
      else { idx = k; f = clamp(local / m, 0, 1); }
      var key = idx + ":" + Math.round(f * 300);
      if (key === last) return; last = key;
      a.textContent = texts[idx]; b.textContent = texts[idx + 1];
      if (f <= 0) { a.style.filter = ""; a.style.opacity = "1"; b.style.filter = ""; b.style.opacity = "0"; return; }
      if (f >= 1) { a.style.filter = ""; a.style.opacity = "0"; b.style.filter = ""; b.style.opacity = "1"; return; }
      b.style.filter = "blur(" + Math.min(8 / f - 8, 100) + "px)"; b.style.opacity = Math.pow(f, 0.4);
      var inv = 1 - f;
      a.style.filter = "blur(" + Math.min(8 / inv - 8, 100) + "px)"; a.style.opacity = Math.pow(inv, 0.4);
    });
  };

  /* ------------------------------------------------------------------ extra: scrollTo
     A browsing move: scrolls a content element inside a frame (translateY), eased like a trackpad flick.
     opts: el, from (default tracked), to (px scrolled, positive scrolls down), t, dur (default 0.9). */
  MP.scrollTo = function (tl, o) {
    var el = $(o.el), from = o.from != null ? o.from : (el.__mpScroll || 0), d = o.dur || 0.9;
    tl.fromTo(el, { y: -from }, { y: -o.to, duration: d, ease: o.ease || "power3.out", force3D: false, immediateRender: false }, o.t);
    el.__mpScroll = o.to;
    return o.t + d;
  };
})();
