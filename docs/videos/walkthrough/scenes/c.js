/* scenes/c.js: chunk C of the walkthrough film, 45.0 to 70.3 (notes/STORYBOARD.md, rows "C: correct, review, history,
   sync"). Ibrahim suggests a correction to Amy's shared note, Rayyan accepts it, the version history shows both versions,
   and the Calendar closes the chapter under the film's one camera pull back, with classmates' smaller windows around ours.
   Every app word comes from notes/UI-SPEC.md sections (h), (i), (j), (k), (l) (and (c), (m) for the classmates' mini pages).
   Avatar tints follow the app's own hash (web/components/ui/avatar.tsx): Amy 2, Ibrahim 1, Adam 6, Ahmad 2, Rayyan 1. */
FILM.scene({
  id: "c",
  t0: 45.0,
  t1: 70.3,
  build: function (F) {
    var tl = F.tl, el = F.el, I = F.icon, MP = window.MP;
    var TINT = { Amy: 2, Ibrahim: 1, Adam: 6, Ahmad: 2, Rayyan: 1 };

    // ---------- chunk CSS (every selector under a c- id or class) ----------
    var CSS = [
      ".c-mt4{margin-top:4px}.c-mt6{margin-top:6px}.c-mt8{margin-top:8px}.c-mt12{margin-top:12px}.c-mt14{margin-top:14px}",
      ".c-crumb{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-muted);white-space:nowrap}",
      ".c-crumb b{font-weight:500;color:var(--ink)}",
      ".c-sep{color:var(--ink-faint)}",
      ".c-lede{margin-top:4px;font-size:14px}",
      ".c-byrow{display:flex;align-items:center;justify-content:space-between;margin-top:12px}",
      ".c-byrow .btn .icon{width:15px;height:15px}",
      ".c-seg{margin-top:12px}",
      ".c-nbody{margin-top:12px;padding:12px 18px}",
      ".c-nbody .note-body{font-size:16px;line-height:1.6}",
      ".c-nbody .note-body ul{margin:4px 0 8px}",
      ".c-foot{margin-top:10px;font-size:12px;color:var(--ink-faint)}",
      ".c-hl{padding:0 2px;margin:0 -2px;border-radius:3px}",
      /* correction flow */
      ".c-flow{position:relative;margin-top:12px}",
      ".c-tap{font-size:13px;color:var(--ink-muted);margin-bottom:8px}",
      ".c-sent{display:flex;align-items:center;height:42px;padding:0 14px;margin-bottom:8px;border-radius:var(--r-control);border:1px solid var(--edge);background:var(--surface);font-family:'MP Serif',Georgia,serif;font-size:15px;color:var(--ink)}",
      ".c-sent.hover{background:var(--sunken);border-color:var(--edge-strong)}",
      ".c-sent.c-picked{background:var(--primary-soft);border-color:rgba(171,90,20,0.3)}",
      ".c-blockB{position:absolute;left:0;right:0;top:0}",
      ".c-selcard{margin-top:6px;padding:9px 14px;border-radius:var(--r-control);background:var(--primary-soft);border:1px solid rgba(171,90,20,0.3);font-family:'MP Serif',Georgia,serif;font-size:15px}",
      ".c-chips{display:flex;gap:8px;margin-top:6px}",
      ".c-chips .chip.hover{border-color:var(--edge-strong);color:var(--ink)}",
      ".c-help{margin-top:6px;font-size:13px;color:var(--ink-muted)}",
      ".ui .input.c-field{gap:0}",
      ".ui .c-typed{white-space:pre}",
      ".c-field.focus{outline:2px solid var(--focus-ring);outline-offset:1px}",
      ".c-pre.c-sel{background:var(--primary-soft);border-radius:2px}",
      ".c-gone{display:none}",
      ".c-ntc .icon{color:var(--primary)}",
      ".c-actions{display:flex;align-items:center;gap:10px;margin-top:12px}",
      ".c-nochange{flex:1;font-size:12px;line-height:1.4;color:var(--ink-faint)}",
      /* show the change */
      ".c-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}",
      ".c-two .panel-before,.c-two .panel-after{padding:12px 16px}",
      ".c-ptext{margin-top:4px;font-size:15px;font-family:'MP Serif',Georgia,serif}",
      ".c-marked{margin-top:6px;padding:12px 16px;font-family:'MP Serif',Georgia,serif;font-size:15px}",
      ".c-stat{font-size:14px;font-weight:500}",
      ".c-act3{position:relative;margin-top:14px;height:40px}",
      ".c-actrow,.c-wait{position:absolute;left:0;right:0;top:0;height:40px;display:flex;align-items:center;gap:10px}",
      ".c-note13{flex:1;font-size:13px;color:var(--ink-muted)}",
      ".c-wait .c-note13{flex:none}",
      ".c-wait .badge{height:26px;padding:0 12px;font-size:12px}",
      ".c-wait .badge .icon,.c-wbadge .icon{width:13px;height:13px}",
      /* review */
      ".c-rhead{display:flex;align-items:center;gap:10px}",
      ".c-people{display:flex;gap:28px}",
      ".c-vrows{display:flex;flex-direction:column;gap:6px;margin-top:6px}",
      ".c-vrow{display:grid;grid-template-columns:128px 1fr;align-items:center;padding:6px 14px;border-radius:var(--r-control);border:1px solid var(--edge);background:var(--surface);font-family:'MP Serif',Georgia,serif;font-size:15px}",
      ".c-vrow.c-vb{background:var(--removed-soft);border-color:rgba(191,75,43,0.25)}",
      ".c-vrow.c-va{background:var(--added-soft);border-color:rgba(67,128,76,0.25)}",
      ".c-vl{font-family:'MP Inter',sans-serif;font-size:12px;font-weight:600;color:var(--ink-muted)}",
      ".c-dec{position:relative;margin-top:12px;height:92px}",
      ".c-decA,.c-acc{position:absolute;left:0;right:0;top:0}",
      ".c-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}",
      ".c-acc .icon{width:20px;height:20px}",
      ".c-acc .b{font-size:13px}",
      "#c-rev .fcol{padding-top:14px}",
      /* history */
      ".c-hgrid{display:grid;grid-template-columns:262px 1fr;gap:16px;align-items:start}",
      ".c-hlist{position:relative;margin-top:8px}",
      ".c-vcard{padding:10px 12px;margin-bottom:8px;border-radius:var(--r-card);border:1px solid var(--edge);background:var(--surface);box-shadow:var(--shadow-card)}",
      ".c-vcard.c-hsel{background:var(--primary-soft);border-color:rgba(171,90,20,0.3)}",
      ".c-vcard.hover{border-color:var(--edge-strong)}",
      ".c-vt{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}",
      ".c-vm{margin-top:4px;font-size:12px;line-height:1.4;color:var(--ink-muted)}",
      ".c-vd{margin-top:2px;font-size:12px;color:var(--ink-faint)}",
      ".c-hfoot{font-size:12px;line-height:1.45;color:var(--ink-faint)}",
      ".c-hright{position:relative;padding:14px 18px;min-height:300px}",
      ".c-pane1{position:absolute;left:18px;right:18px;top:14px}",
      ".c-pt{font-size:16px;font-weight:600;letter-spacing:-0.01em}",
      ".c-pm{margin-top:2px;font-size:12px;color:var(--ink-muted)}",
      ".c-ps{margin-top:4px;font-size:13px;font-weight:500}",
      ".c-pr{font-size:12px;color:var(--ink-muted)}",
      ".c-pbody{margin-top:8px;font-size:15px;line-height:1.55}",
      ".c-pbody ul{margin:2px 0 6px}",
      /* calendar */
      ".c-calhead{display:flex;align-items:flex-end;justify-content:space-between}",
      ".c-sq{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--r-control);border:1px solid var(--edge-strong);color:var(--ink-muted)}",
      ".c-sq .icon{width:15px;height:15px}",
      ".c-calcard{margin-top:14px;padding:12px 14px}",
      "#c-cal .cal .day{min-height:52px;padding:5px 7px}",
      "#c-cal .cal .day.hover{border-color:var(--edge-strong);background:var(--primary-soft)}",
      "#c-cal .cal .day .notes{font-size:12px}",
      ".c-clist{margin-top:12px}",
      ".c-crow{padding:11px 18px}",
      ".c-crow.c-lit{background:var(--primary-soft);border-color:rgba(171,90,20,0.3)}",
      ".c-crow.c-lit .t{color:var(--primary)}",
      /* classmates' windows (stage level, in #extras) */
      ".c-minis{position:absolute;left:0;top:0;width:0;height:0}",
      ".c-mini{position:absolute;border-radius:12px;overflow:hidden;background:#f3ead6;border:1px solid var(--edge);box-shadow:0 18px 44px rgba(62,45,30,0.10),0 2px 6px rgba(36,34,44,0.06);filter:blur(1.2px)}",
      ".c-mbar{position:absolute;left:0;right:0;top:0;height:28px;display:flex;align-items:center;padding:0 10px}",
      ".c-mdots{display:flex;gap:5px;width:60px}",
      ".c-mdots i{display:block;width:8px;height:8px;border-radius:50%;background:var(--edge-strong)}",
      ".c-murl{display:inline-flex;align-items:center;height:17px;padding:0 10px;border-radius:999px;background:rgba(255,253,246,0.7);border:1px solid var(--edge);font:500 9.5px/1 'MP Inter',sans-serif;color:var(--ink-muted);white-space:nowrap}",
      ".c-mvp{position:absolute;left:1px;top:28px;transform-origin:0 0;background:var(--paper);overflow:hidden}",
      ".c-mtop{height:34px;display:flex;align-items:center;gap:7px;padding:0 14px;background:var(--surface);border-bottom:1px solid var(--edge)}",
      ".c-mtop img{width:20px;height:20px;object-fit:contain}",
      ".c-mtop .wordmark{font-size:16px}",
      ".c-mbody{padding:14px 20px}",
      ".c-mbody .note-card{margin-top:10px;padding:14px 16px}",
      ".c-mbody .fc-face{position:relative;height:150px;margin-top:12px}",
      ".c-mcur{position:absolute;left:0;top:0;z-index:3}",
      ".c-mcur svg{display:block;width:20px;height:20px}",
      ".c-mtag{position:absolute;left:14px;top:15px;padding:2px 8px 3px;border-radius:9px 9px 9px 3px;font:600 11px/1.3 'MP Inter',sans-serif;color:#fff8ee;white-space:nowrap}",
      /* name chips round "Keep the class in sync." (in #heads) */
      ".c-chips2{position:absolute;inset:0;pointer-events:none}",
      ".c-chip{position:absolute;width:0;height:0}",
      ".c-chipin{position:absolute;left:0;top:0}",
      ".c-ptr{position:absolute;left:-5px;top:-5px;width:44px;height:44px;transform-origin:5px 5px;z-index:2;filter:drop-shadow(0 2px 3px rgba(36,34,44,0.18))}",
      ".c-pill{position:absolute;display:inline-flex;align-items:center;gap:8px;padding:8px 18px 9px 13px;font:600 27px/1.2 'MP Inter',sans-serif;color:#fff8ee;white-space:nowrap;box-shadow:0 8px 22px rgba(62,45,30,0.14)}",
      ".c-pill svg{width:24px;height:24px;fill:currentColor}",
      ".c-ul{right:22px;bottom:22px;border-radius:22px 22px 5px 22px}",
      ".c-ur{left:22px;bottom:22px;border-radius:22px 22px 22px 5px}",
      ".c-dl{right:22px;top:22px;border-radius:22px 5px 22px 22px}",
      ".c-dr{left:22px;top:22px;border-radius:5px 22px 22px 22px}"
    ].join("\n");
    el("style", null, CSS, document.head);

    function ico(name, cls) { return '<span class="icon' + (cls ? " " + cls : "") + '">' + I(name) + "</span>"; }
    function av(name, size) { return '<span class="avatar' + (size ? " " + size : "") + " t" + TINT[name] + '">' + I("user-fill") + "</span>"; }
    function seg(col, idx) {
      var s = col.querySelector(".c-seg"), th = s.querySelector(".thumb"), tab = s.querySelectorAll(".tab")[idx];
      th.style.left = tab.offsetLeft + "px";
      th.style.width = tab.offsetWidth + "px";
    }
    var MARKED = "Big molecules <del>can't</del><ins>need a transport protein</ins> to get through.";
    var PTR = function (tint, w) {
      return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '"><path d="M3 3 L10 21 L12.8 12.8 L21 10 Z" style="fill:var(--avatar-' + tint + ')" stroke="#fffdf6" stroke-width="1.7" stroke-linejoin="round"/></svg>';
    };

    // ---------- camera-aware cursor targets (the stage scales round 960, 470 during the pull back) ----------
    var e2 = F.ease("power2.inOut");
    function camS(t) {
      if (t <= 65) return 1;
      if (t <= 67.5) return 1 - 0.11 * e2((t - 65) / 2.5);
      if (t <= 68) return 0.89;
      if (t <= 70) return 0.89 + 0.11 * e2((t - 68) / 2);
      return 1;
    }
    function camP(p, t) { var s = camS(t); return { x: 960 + (p.x - 960) * s, y: 470 + (p.y - 470) * s }; }
    function go(t, node, ax, ay, sy, dur) {
      dur = dur || 0.55;
      var p = camP(F.pt(node, ax, ay, sy || 0), t + dur);
      return F.cursor.move(t, p.x, p.y, dur);
    }
    function nudge(t, dx, dy, dur) { var a = F.cursor._last; return F.cursor.move(t, a.x + dx, a.y + dy, dur || 0.9); }

    // =====================================================================================================
    // 45.0 to 47.5: headline "Good notes get better." over the blurred window; the note page comes in under it.
    // =====================================================================================================
    F.headline({ t0: 45.0, t1: 47.5, tick: true, tickDb: 12, lines: [{ text: "Good notes get better.", cls: "hero", accent: "better." }] });
    F.win.blur(45.0, 47.4);

    var P1 = F.page("c-note");
    var c1 = F.shell(P1, { nav: "pots" });
    c1.innerHTML =
      '<div class="c-crumb">Biology 101<span class="c-sep">›</span>Week 2: Cell structure<span class="c-sep">›</span><b>The cell membrane</b></div>' +
      '<div class="h1 c-mt4">The cell membrane</div>' +
      '<p class="c-lede muted">The cell membrane is a phospholipid bilayer, and size decides what gets through it.</p>' +
      '<div class="c-byrow"><div class="person">' + av("Amy") + '<div><div class="n">Amy</div><div class="m">Shared just now</div></div></div>' +
      '<div class="row"><span class="btn secondary sm">' + ico("clock-counter-clockwise") + 'History</span><span class="btn secondary sm c-sugg">' + ico("chat-circle-text") + "Suggest correction</span></div></div>" +
      '<div class="seg c-seg"><span class="thumb"></span><span class="tab">Original</span><span class="tab active">Organized</span></div>' +
      '<div class="card c-nbody"><div class="note-body"><div class="term">Cell membrane</div><ul><li>A <span class="c-hl c-hl1">phospholipid bilayer</span>.</li><li>Small molecules get through.</li><li>Big molecules can\'t get through.</li></ul>' +
      '<div class="term">Key takeaways</div><ul><li>The cell membrane is a <span class="c-hl c-hl2">phospholipid bilayer</span>.</li><li>Size decides what gets through.</li></ul></div></div>' +
      '<p class="c-foot">Built from notes shared in this Pot. The original is always preserved alongside every version.</p>';
    seg(c1, 1);
    F.pageIn(45.3, P1);
    F.win.setUrl(45.3, "meltingpots.xyz/p/biology-101/n/the-cell-membrane");
    // vocabulary highlights sweep in as the blur lifts
    MP.markerSweep(tl, { el: c1.querySelector(".c-hl1"), t: 47.7, dur: 0.45, color: "rgba(248, 229, 200, 0.95)" });
    MP.markerSweep(tl, { el: c1.querySelector(".c-hl2"), t: 47.86, dur: 0.45, color: "rgba(248, 229, 200, 0.95)" });

    // =====================================================================================================
    // 47.6 to 55.2: the correction flow.
    // =====================================================================================================
    F.caption({ t0: 47.7, t1: 55.3, icon: "chat-circle-text", bold: "Classmates", rest: " suggest a fix and say why." });
    var sugg = c1.querySelector(".c-sugg");
    F.cursor.at(47.4, 1760, 1110);
    F.cursor.show(47.45, 0.15);
    go(47.45, sugg, 0.55, 0.6, 0, 0.65);
    F.cursor.hover(sugg, 48.05, 48.52);
    F.cursor.click(48.4, sugg);

    var P2 = F.page("c-corr");
    var c2 = F.shell(P2, { nav: "pots" });
    c2.innerHTML =
      '<div class="eyebrow">The cell membrane</div>' +
      '<div class="h1 c-mt4">Suggest a correction</div>' +
      '<p class="muted c-mt4">Select what seems off in Amy\'s note, then write the fix in your own words.</p>' +
      '<div class="seg c-seg"><span class="thumb"></span><span class="tab active">Correct one sentence</span><span class="tab">Edit the whole note</span></div>' +
      '<div class="c-flow"><div class="c-blockA"><p class="c-tap">Tap the sentence you want to correct.</p>' +
      '<div class="c-sent">Cell membrane: A phospholipid bilayer.</div><div class="c-sent">Small molecules get through.</div><div class="c-sent c-s3">Big molecules can\'t get through.</div></div>' +
      '<div class="c-blockB"><div class="eyebrow">Selected</div><div class="c-selcard">Big molecules can\'t get through.</div>' +
      '<div class="eyebrow c-mt14">What seems off?</div>' +
      '<div class="c-chips"><span class="chip c-ch1">Incorrect fact</span><span class="chip">Incomplete</span><span class="chip">Unclear wording</span><span class="chip">Outdated</span></div>' +
      '<p class="c-help">This helps the maintainer review faster.</p>' +
      '<div class="label c-mt14">Your correction</div>' +
      '<div class="input c-field"><span class="c-pre">Big molecules can\'t get through.</span><span class="c-typed"></span><span class="caret c-caret"></span></div>' +
      '<p class="hint">The sentence is already here. Change what is wrong and leave the rest.</p>' +
      '<div class="notice c-ntc c-mt12">' + ico("shield-check") + '<div><div class="t">A maintainer approves changes</div><div class="b">Your proposal won\'t replace the note automatically.</div></div></div>' +
      '<div class="c-actions"><p class="c-nochange">Nothing has changed yet. Edit the sentence above to send a correction.</p><span class="btn secondary">Cancel</span><span class="btn primary c-cont">Continue</span></div>' +
      "</div></div>";
    seg(c2, 0);
    F.swap(48.5, P1, P2);
    F.win.setUrl(48.55, "meltingpots.xyz/p/biology-101/n/the-cell-membrane/correct");

    var s3 = c2.querySelector(".c-s3"), blockA = c2.querySelector(".c-blockA"), blockB = c2.querySelector(".c-blockB");
    var chip1 = c2.querySelector(".c-ch1"), field = c2.querySelector(".c-field"), pre = c2.querySelector(".c-pre");
    var typed = c2.querySelector(".c-typed"), caret = c2.querySelector(".c-caret"), cont = c2.querySelector(".c-cont");
    var nochange = c2.querySelector(".c-nochange");
    caret.style.opacity = "0";
    // pick the sentence
    go(48.72, s3, 0.42, 0.5, 0, 0.55);
    F.cursor.hover(s3, 49.15, 49.5);
    F.cursor.click(49.375, s3);
    F.classAt(s3, "c-picked", 49.45, 999);
    // the list gives way to the selected sentence, the reasons and the field; the page scrolls them up
    gsap.set(blockB, { opacity: 0 });
    tl.to(blockA, { opacity: 0, y: -6, duration: 0.2, ease: "power2.in" }, 49.55);
    tl.fromTo(blockB, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38, ease: "power3.out", immediateRender: false }, 49.62);
    var contBottom = F.inPage(cont).y + cont.offsetHeight - 40;
    var S2 = Math.max(0, Math.round(contBottom - 440 + 22));
    F.scroll(49.55, P2, S2, 0.45);
    // reason chip
    go(49.6, chip1, 0.5, 0.5, S2, 0.4);
    F.cursor.hover(chip1, 49.9, 50.2);
    F.cursor.click(50.03, chip1);
    F.classAt(chip1, "selected", 50.1, 999);
    // select the prefilled sentence (shortcut), then type the fix
    F.classAt(field, "focus", 50.3, 53.5);
    F.classAt(pre, "c-sel", 50.3, 50.6);
    F.classAt(pre, "c-gone", 50.6, 999);
    F.sound("key-heavy", 50.3, { n: 0 });
    var typeEnd = F.type(typed, "Big molecules need a transport protein to get through.", 50.6, { cps: 22, seed: 307, caret: caret, caretFrom: 50.3, caretUntil: 53.5 });
    tl.to(nochange, { opacity: 0, duration: 0.2, ease: "power1.in" }, 50.6);
    F.classAt(cont, "disabled", 0, 50.6);
    // the cursor drifts off the field while Ibrahim types, then heads for Continue on the last words
    nudge(50.3, 500, 34, 0.8);
    nudge(51.2, 18, -12, 1.1);
    var tCont = Math.max(52.4, typeEnd - 0.65);
    go(tCont, cont, 0.5, 0.55, S2, 0.6);
    F.cursor.hover(cont, tCont + 0.5, 53.5);
    F.cursor.click(53.4, cont);

    // Show the change
    var P3 = F.page("c-chg");
    var c3 = F.shell(P3, { nav: "pots" });
    c3.innerHTML =
      '<div class="h1">Show the change</div>' +
      '<p class="muted c-mt4">Your maintainer will compare these side by side.</p>' +
      '<div class="c-two c-mt14"><div class="panel-before"><div class="eyebrow">Before</div><div class="c-ptext">Big molecules can\'t get through.</div></div>' +
      '<div class="panel-after"><div class="eyebrow">After</div><div class="c-ptext">Big molecules need a transport protein to get through.</div></div></div>' +
      '<div class="eyebrow c-mt14">Marked up</div>' +
      '<div class="card c-marked">' + MARKED + "</div>" +
      '<p class="c-stat c-mt12">This correction adds 5 words and removes 1 word.</p>' +
      '<p class="small muted">Reason: Incorrect fact</p>' +
      '<div class="c-act3"><div class="c-actrow"><p class="c-note13">No changes are public until approved.</p><span class="btn secondary">Back</span><span class="btn primary c-send">Send to maintainer</span></div>' +
      '<div class="c-wait"><span class="badge pending">' + ico("hourglass-medium") + 'Waiting on maintainer</span><p class="c-note13">AI cannot publish this change. A maintainer must decide.</p></div></div>';
    F.swap(53.5, P2, P3);
    var send = c3.querySelector(".c-send"), actrow = c3.querySelector(".c-actrow"), wait = c3.querySelector(".c-wait");
    gsap.set(wait, { opacity: 0 });
    go(53.72, send, 0.5, 0.55, 0, 0.5);
    F.cursor.hover(send, 54.12, 54.52);
    F.cursor.click(54.4, send);
    tl.to(actrow, { opacity: 0, y: -6, duration: 0.18, ease: "power2.in" }, 54.5);
    tl.fromTo(wait, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: "power3.out", immediateRender: false }, 54.58);
    nudge(54.6, 46, 64, 0.65);

    // =====================================================================================================
    // 55.3 to 58.0: Rayyan's review.
    // =====================================================================================================
    var P4 = F.page("c-rev");
    var c4 = F.shell(P4, { nav: "pots", tabs: ["Feed", "Study", "Members", "Admin", "Settings"], tab: "Admin", adminCount: 2 });
    c4.innerHTML =
      '<div class="c-rhead"><span class="eyebrow">Correction proposal</span><span class="badge pending c-wbadge">' + ico("hourglass-medium") + "Waiting on your review</span></div>" +
      '<div class="h1 c-mt4">The cell membrane</div>' +
      '<div class="c-people c-mt8"><div class="person">' + av("Ibrahim") + '<div><div class="n">Ibrahim</div><div class="m">Proposed just now</div></div></div>' +
      '<div class="person">' + av("Amy") + '<div><div class="n">Amy</div><div class="m">Original contributor</div></div></div></div>' +
      '<div class="eyebrow c-mt14">The change</div>' +
      '<div class="c-vrows"><div class="c-vrow c-vb"><span class="c-vl">Current version</span><span>Big molecules can\'t get through.</span></div>' +
      '<div class="c-vrow c-va"><span class="c-vl">Suggested version</span><span>Big molecules need a transport protein to get through.</span></div>' +
      '<div class="c-vrow"><span class="c-vl">Marked up</span><span>' + MARKED + "</span></div></div>" +
      '<div class="c-dec"><div class="c-decA"><p class="c-note13">Accepting publishes this as the newest version and credits both contributors.</p>' +
      '<div class="c-btns"><span class="btn ghost">Decline</span><span class="btn secondary">Request revisions</span><span class="btn primary c-accept">Accept changes</span></div></div>' +
      '<div class="notice success c-acc">' + ico("check-circle-fill") + '<div><div class="t">Accepted. The shared note is updated.</div><div class="b">Ibrahim\'s correction became the newest version and is credited to them. Reviewed by Rayyan.</div></div></div></div>';
    F.swap(55.3, P3, P4);
    F.win.setUrl(55.35, "meltingpots.xyz/p/biology-101/review");
    F.caption({ t0: 55.6, t1: 58.15, icon: "shield-check", bold: "A maintainer", rest: " decides. AI cannot publish a change.", restDelay: 0.4 });
    var accept = c4.querySelector(".c-accept"), decA = c4.querySelector(".c-decA"), acc = c4.querySelector(".c-acc");
    var wbadge = c4.querySelector(".c-wbadge"), count = P4.el.querySelector(".pot-tab.active .count");
    var vrows = c4.querySelectorAll(".c-vrow");
    gsap.set(acc, { opacity: 0 });
    // the three versions of the sentence settle in by line
    for (var vi = 0; vi < vrows.length; vi++) {
      gsap.set(vrows[vi], { opacity: 0, y: 6 });
      tl.fromTo(vrows[vi], { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, 55.55 + vi * 0.08);
    }
    go(55.3, vrows[2], 0.7, 0.4, 0, 0.6);
    nudge(55.9, -60, 8, 0.4);
    go(56.3, accept, 0.5, 0.55, 0, 0.45);
    F.cursor.hover(accept, 56.68, 57.02);
    F.cursor.click(56.9, accept);
    tl.to(decA, { opacity: 0, y: -6, duration: 0.18, ease: "power2.in" }, 57.0);
    tl.to(wbadge, { opacity: 0, duration: 0.2, ease: "power1.in" }, 57.0);
    tl.fromTo(acc, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, 57.05);
    F.sound("tick", 57.1);
    F.textAt(count, [[0, "2"], [57.05, "1"]]);
    nudge(57.15, 140, 46, 0.75);

    // =====================================================================================================
    // 58.0 to 62.3: version history.
    // =====================================================================================================
    var P5 = F.page("c-hist");
    var c5 = F.shell(P5, { nav: "pots", col: 700 });
    c5.innerHTML =
      '<div class="c-crumb">Biology 101<span class="c-sep">›</span>The cell membrane<span class="c-sep">›</span><b>History</b></div>' +
      '<div class="h1 c-mt4">Version history</div>' +
      '<p class="muted">Who changed what, when, and who reviewed it.</p>' +
      '<div class="c-hgrid c-mt14"><div class="c-hleft"><div class="eyebrow">Timeline</div>' +
      '<div class="c-hlist"><div class="c-vcard c-v2"><div class="c-vt">Version 2 <span class="badge success">Current</span></div><div class="c-vm">Correction by Ibrahim · approved by Rayyan</div><div class="c-vd">just now</div></div>' +
      '<div class="c-vcard c-v1"><div class="c-vt">Version 1</div><div class="c-vm">First shared by Amy</div><div class="c-vd">just now</div></div></div>' +
      '<p class="c-hfoot">Every version stays visible. Nothing is silently overwritten.</p></div>' +
      '<div class="card c-hright"><div class="c-pane c-pane2"><div class="c-pt">The cell membrane</div><div class="c-pm">Correction by Ibrahim · approved by Rayyan · just now</div><span class="badge success c-mt6">Current</span>' +
      '<div class="eyebrow c-mt12">Changes from version 1</div><p class="c-ps">This correction adds 5 words and removes 1 word.</p><p class="c-pr">Reason: Incorrect fact</p>' +
      '<div class="note-body c-pbody"><div class="term">Cell membrane</div><ul><li>A phospholipid bilayer.</li><li>Small molecules get through.</li><li>' + MARKED + "</li></ul></div></div>" +
      '<div class="c-pane c-pane1"><div class="c-pt">The cell membrane</div><div class="c-pm">First shared by Amy · just now</div>' +
      '<div class="note-body c-pbody c-mt12"><div class="term">Cell membrane</div><ul><li>A phospholipid bilayer.</li><li>Small molecules get through.</li><li>Big molecules can\'t get through.</li></ul>' +
      '<div class="term">Key takeaways</div><ul><li>The cell membrane is a phospholipid bilayer.</li><li>Size decides what gets through.</li></ul></div></div></div></div>';
    F.swap(58.0, P4, P5);
    F.win.setUrl(58.05, "meltingpots.xyz/p/biology-101/n/the-cell-membrane/history");
    F.caption({ t0: 58.2, t1: 62.4, icon: "clock-counter-clockwise", bold: "Every change", rest: " has a history." });
    var v2 = c5.querySelector(".c-v2"), v1 = c5.querySelector(".c-v1"), hfoot = c5.querySelector(".c-hfoot");
    var pane2 = c5.querySelector(".c-pane2"), pane1 = c5.querySelector(".c-pane1");
    // animated list: version 1 lands first, then version 2 arrives on top and pushes it down
    var push = v2.offsetHeight + 8;
    gsap.set(v1, { y: -push, opacity: 0 });
    gsap.set(v2, { opacity: 0 });
    gsap.set(hfoot, { opacity: 0 });
    tl.fromTo(v1, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out", immediateRender: false }, 58.5);
    tl.fromTo(v1, { y: -push }, { y: 0, duration: 0.5, ease: "expo.out", immediateRender: false }, 59.0);
    tl.fromTo(v2, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out", immediateRender: false }, 59.0);
    tl.fromTo(hfoot, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, 59.35);
    F.sound("tick", 58.5);
    F.sound("tick", 59.0);
    // selection follows the clicks; the right pane swaps between the versions
    F.classAt(v2, "c-hsel", 59.0, 60.08);
    F.classAt(v2, "c-hsel", 61.38, 999);
    F.classAt(v1, "c-hsel", 60.08, 61.38);
    gsap.set(pane1, { opacity: 0 });
    tl.fromTo(pane2, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power2.in", immediateRender: false }, 60.08);
    tl.fromTo(pane1, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, 60.16);
    tl.fromTo(pane1, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power2.in", immediateRender: false }, 61.38);
    tl.fromTo(pane2, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false }, 61.46);
    go(58.35, pane2, 0.55, 0.62, 0, 0.6);
    nudge(58.95, 30, 22, 0.4);
    go(59.4, v1, 0.6, 0.5, 0, 0.45);
    F.cursor.hover(v1, 59.75, 60.2);
    F.cursor.click(60.0, v1);
    nudge(60.25, 6, 4, 0.3);
    go(60.65, v2, 0.62, 0.42, 0, 0.5);
    F.cursor.hover(v2, 61.1, 61.5);
    F.cursor.click(61.3, v2);
    F.cursor.move(61.6, 1990, 1150, 0.65);
    F.cursor.hide(62.05, 0.2);

    // =====================================================================================================
    // 62.5 to 65.0: headline "Keep the class in sync." with classmates' name chips; the Calendar comes in under it.
    // =====================================================================================================
    var hd = F.headline({ t0: 62.5, t1: 65.0, lines: [{ text: "Keep the class in sync.", accent: "sync." }] });
    F.win.blur(62.5, 64.9);
    F.pageOut(62.8, P5);
    var line = hd.layer.querySelector(".l");
    var prevDisp = hd.layer.style.display;
    hd.layer.style.display = "flex";
    var HW = line.offsetWidth || 1120;
    hd.layer.style.display = prevDisp;
    var HL = 960 - HW / 2, HR = 960 + HW / 2, HT = 540 - 58, HB = 540 + 58;
    var chipsLayer = el("div", "c-chips2", null, F.$("heads"));
    var CHIPS = [
      // name, tip x, tip y, pointer rotation, pill side, fly-in direction
      ["Amy", HL + 130, HT - 4, 180, "c-ul", -1, -1],
      ["Ibrahim", HR - 170, HT - 2, -90, "c-ur", 1, -1],
      ["Adam", HL + 250, HB + 6, 90, "c-dl", -1, 1],
      ["Ahmad", HR - 130, HB + 4, 0, "c-dr", 1, 1]
    ];
    CHIPS.forEach(function (c, i) {
      var tint = TINT[c[0]];
      var outer = el("div", "c-chip", null, chipsLayer);
      outer.style.left = c[1].toFixed(1) + "px";
      outer.style.top = c[2].toFixed(1) + "px";
      var inner = el("div", "c-chipin", null, outer);
      inner.innerHTML = '<span class="c-ptr" style="transform:rotate(' + c[3] + 'deg)">' + PTR(tint, 44) + "</span>" +
        '<span class="c-pill ' + c[4] + '" style="background:var(--avatar-' + tint + ')">' + I("user-fill") + c[0] + "</span>";
      gsap.set(outer, { opacity: 0 });
      var t = 63.3 + i * 0.078;
      tl.fromTo(outer, { opacity: 0, x: c[5] * 46, y: c[6] * 34, scale: 0.86 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.7, ease: "expo.out", immediateRender: false }, t);
      tl.fromTo(outer, { opacity: 1 }, { opacity: 0, duration: 0.26, ease: "power1.in", immediateRender: false }, 64.66);
      var ph = i * 1.7;
      F.driver(function (tt) {
        if (tt < 63 || tt > 65.1) return;
        var dx = Math.sin(tt * 1.3 + ph) * 4, dy = Math.cos(tt * 1.1 + ph) * 3;
        inner.style.transform = "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px)";
      });
    });
    tl.set(chipsLayer, { display: "none" }, 0);
    tl.set(chipsLayer, { display: "block" }, 62.5);
    tl.set(chipsLayer, { display: "none" }, 65.0);

    // the Calendar
    var P6 = F.page("c-cal");
    var c6 = F.shell(P6, { nav: "calendar", col: 700 });
    var COUNTS = { 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 17: 2 };
    var cal = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) { return '<div class="dow">' + d + "</div>"; }).join("");
    for (var ci = 0; ci < 35; ci++) {
      var n = ci >= 1 && ci <= 30 ? ci : 0; // September 2026 starts on a Tuesday
      if (!n) { cal += '<div class="day empty"></div>'; continue; }
      var k = COUNTS[n] || 0;
      cal += '<div class="day c-d' + n + (k ? " busy" : "") + (n === 17 ? " today" : "") + '"><span class="d">' + n + "</span>" +
        (k ? '<span class="notes">' + k + (k === 1 ? " note" : " notes") + "</span>" : "") + "</div>";
    }
    var ROWS = [
      ["The scientific method, laws, and theories", "Ahmad", "11 Sept"],
      ["Organelles and what they do", "Rayyan", "12 Sept"],
      ["The cell cycle and its checkpoints", "Adam", "13 Sept"],
      ["Mitosis vs meiosis", "Adam", "14 Sept"],
      ["Osmosis and tonicity", "Ibrahim", "15 Sept"],
      ["What exam 1 covers", "Ibrahim", "17 Sept"],
      ["The cell membrane", "Amy", "17 Sept"]
    ];
    c6.innerHTML =
      '<div class="c-calhead"><div><div class="h1">September 2026</div><p class="muted c-mt4">When your classes shared notes. Every square is a note that exists.</p></div>' +
      '<div class="row"><span class="c-sq">' + ico("caret-left") + '</span><span class="c-sq">' + ico("caret-right") + "</span></div></div>" +
      '<div class="card c-calcard"><div class="cal">' + cal + "</div></div>" +
      '<div class="list c-clist">' + ROWS.map(function (r, i) {
        return '<div class="list-row c-crow c-r' + i + '"><div><div class="t">' + r[0] + '</div><div class="m">' + r[1] + " · Biology 101</div></div><span class=\"r\">" + r[2] + "</span></div>";
      }).join("") + "</div>";
    F.pageIn(62.95, P6);
    F.win.setUrl(62.95, "meltingpots.xyz/calendar");

    // =====================================================================================================
    // 65.0 to 70.3: the one pull back; classmates' windows round ours; a day is clicked and its row lights.
    // =====================================================================================================
    F.cam(65.0, 0.89, 2.5, "power2.inOut");
    F.cam(68.0, 1.0, 2.0, "power2.inOut");
    F.caption({ t0: 65.2, t1: 70.0, icon: "calendar-blank", bold: "Every day", rest: " the class shared, on one calendar." });
    var d17 = c6.querySelector(".c-d17"), d11 = c6.querySelector(".c-d11"), row0 = c6.querySelector(".c-r0");
    var rowBottom = F.inPage(c6.querySelector(".c-r1")).y + c6.querySelector(".c-r1").offsetHeight - 40;
    var S6 = Math.max(0, Math.round(rowBottom - 440 + 14));
    F.cursor.at(65.3, 1960, 1060);
    F.cursor.show(65.32, 0.18);
    go(65.32, d17, 0.55, 0.6, 0, 0.7);
    F.cursor.hover(d17, 65.92, 66.3);
    go(66.25, d11, 0.5, 0.58, 0, 0.5);
    F.cursor.hover(d11, 66.68, 67.1);
    F.cursor.click(66.9, d11);
    F.classAt(row0, "c-lit", 67.0, 999);
    F.scroll(67.05, P6, S6, 0.7);
    go(67.8, row0, 0.62, 0.5, S6, 0.5);
    F.cursor.hover(row0, 68.25, 68.85);
    nudge(68.4, 10, 4, 0.4);
    F.cursor.move(68.95, 1990, 1150, 0.7);
    F.cursor.hide(69.45, 0.25);
    F.pageOut(70.3, P6);

    // props in the margins recede while the classmates' windows are out
    var props = F.$("props");
    tl.fromTo(props, { opacity: 1 }, { opacity: 0.3, duration: 0.8, ease: "power2.inOut", immediateRender: false }, 64.9);
    tl.fromTo(props, { opacity: 0.3 }, { opacity: 1, duration: 0.9, ease: "power2.inOut", immediateRender: false }, 69.0);

    // classmates' windows (stage level, so the camera carries them); simple rebuilt mini pages, slightly blurred
    var minis = el("div", "c-minis", null, F.$("extras"));
    tl.set(minis, { display: "none" }, 0);
    tl.set(minis, { display: "block" }, 64.95);
    tl.set(minis, { display: "none" }, 70.1);
    var TOP = '<div class="c-mtop"><img src="assets/pot-logo.png" alt=""><span class="wordmark">meltingpot</span></div>';
    function mini(box, url, inner, sc) {
      var m = el("div", "c-mini", null, minis);
      m.style.left = box[0] + "px";
      m.style.top = box[1] + "px";
      m.style.width = box[2] + "px";
      m.style.height = box[3] + "px";
      m.innerHTML = '<div class="c-mbar"><span class="c-mdots"><i></i><i></i><i></i></span><span class="c-murl">' + url + "</span></div>";
      var vp = el("div", "c-mvp ui", TOP + '<div class="c-mbody">' + inner + "</div>", m);
      vp.style.width = ((box[2] - 2) / sc).toFixed(1) + "px";
      vp.style.height = ((box[3] - 29) / sc).toFixed(1) + "px";
      vp.style.transform = "scale(" + sc + ")";
      return m;
    }
    var mFeed = mini([-96, 104, 392, 300], "meltingpots.xyz/p/biology-101",
      '<div class="h1">Biology 101</div><div class="h2 c-mt8">Latest shared notes</div>' +
      '<div class="card note-card"><div class="title">The cell membrane <span class="badge">v2</span></div><div class="summary">The cell membrane is a phospholipid bilayer, and size decides what gets through it.</div>' +
      '<div class="meta">' + av("Amy", "sm") + "Amy · 1m ago · Week 2: Cell structure</div></div>" +
      '<div class="card note-card"><div class="title">What exam 1 covers</div><div class="summary">Exam 1 spans weeks 1 to 3, with emphasis on osmosis problems, organelle functions, and the mitosis versus meiosis distinction.</div>' +
      '<div class="meta">' + av("Ibrahim", "sm") + "Ibrahim · 20h ago · Exam review</div></div>", 0.68);
    var mCard = mini([-74, 476, 360, 296], "meltingpots.xyz/p/biology-101/study/flashcards",
      '<div class="row"><span class="chip selected">All 12</span><span class="chip">osmosis 3</span><span class="chip">membranes 2</span></div>' +
      '<div class="step-head c-mt12"><span>1 / 12</span><span>0 know it · 0 still learning</span></div><div class="bar"><i style="width:8%"></i></div>' +
      '<div class="fc-face"><span class="eyebrow">Question</span><div class="q">What is the cell membrane made of?</div><span class="tiny faint">Click the card, or press space, to turn it over</span></div>', 0.66);
    var mNote = mini([1628, 270, 390, 300], "meltingpots.xyz/p/biology-101/n/the-cell-membrane",
      '<div class="c-crumb">Biology 101<span class="c-sep">›</span>Week 2: Cell structure<span class="c-sep">›</span><b>The cell membrane</b></div>' +
      '<div class="row c-mt8"><div class="h1">The cell membrane</div><span class="badge success">Version 2</span></div>' +
      '<div class="tiny muted">Shared just now · corrected by Ibrahim</div>' +
      '<div class="card c-nbody"><div class="note-body"><div class="term">Cell membrane</div><ul><li>A phospholipid bilayer.</li><li>Small molecules get through.</li><li>Big molecules need a transport protein to get through.</li></ul></div></div>', 0.68);
    [[mFeed, -340, 0], [mCard, -340, 1], [mNote, 340, 2]].forEach(function (a) {
      var m = a[0], off = a[1], i = a[2];
      gsap.set(m, { x: off, opacity: 0 });
      tl.fromTo(m, { x: off }, { x: 0, duration: 2.35, ease: "power2.inOut", immediateRender: false }, 65.05 + i * 0.1);
      tl.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power1.out", immediateRender: false }, 65.2 + i * 0.1);
      tl.fromTo(m, { x: 0 }, { x: off, duration: 1.9, ease: "power2.inOut", immediateRender: false }, 68.0 + i * 0.06);
      tl.fromTo(m, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: "power1.in", immediateRender: false }, 68.3 + i * 0.06);
    });
    // each classmate's own pointer moves in their window
    [[mFeed, "Adam", 150, 150, 0], [mCard, "Ahmad", 210, 210, 2.1], [mNote, "Amy", 120, 200, 4.2]].forEach(function (a) {
      var cur = el("div", "c-mcur", PTR(TINT[a[1]], 20) + '<span class="c-mtag" style="background:var(--avatar-' + TINT[a[1]] + ')">' + a[1] + "</span>", a[0]);
      var bx = a[2], by = a[3], ph = a[4];
      F.driver(function (t) {
        if (t < 64.9 || t > 70.2) return;
        var x = bx + Math.sin(t * 0.9 + ph) * 46 + Math.sin(t * 2.3 + ph) * 8;
        var y = by + Math.cos(t * 0.7 + ph) * 26 + Math.sin(t * 1.9 + ph * 2) * 6;
        cur.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)";
      });
    });
  },
});
