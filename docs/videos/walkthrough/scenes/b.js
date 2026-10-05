// scenes/b.js: chunk B, 9.6 to 45.3 (notes/STORYBOARD.md "B: join, write, organize, share").
// Join with the class code, the Pot feed, "Write it down. Keep moving.", the composer, the organizer's stages, review
// before sharing (original preserved beside the organized note, Worth checking), the shared confirmation and the feed
// with the new note on top. Every app word is copied from notes/UI-SPEC.md sections (a), (c), (d), (e), (f), (g).
FILM.scene({
  id: "b",
  t0: 9.6,
  t1: 45.3,
  build(F) {
    const tl = F.tl, el = F.el, I = F.icon, C = F.cursor;
    const RAW = "membrane = phospholipid bilayer. small stuff gets thru, big stuff cant";

    // ---------- styles (all scoped under .b-pg, the class every chunk B page carries) ----------
    const css = [
      ".b-pg .b-fill{position:absolute;left:0;top:0;width:846px;height:480px;display:flex;flex-direction:column;align-items:center;justify-content:center}",
      ".b-pg .eyebrow{font-size:11.5px}",
      ".b-pg .badge{font-size:12px;height:24px;padding:0 10px}",
      ".b-pg .b-ic{display:inline-flex;width:16px;height:16px;flex:none}",
      ".b-pg .b-ic svg{width:100%;height:100%;fill:currentColor}",
      ".b-pg .focus{outline:2px solid var(--focus-ring);outline-offset:2px}",
      ".b-pg .btn.disabled{opacity:.5}",
      // join
      ".b-pg .b-lock{display:flex;align-items:center;gap:8px;margin-bottom:18px}",
      ".b-pg .b-lock img{width:28px;height:28px;object-fit:contain}",
      ".b-pg .b-lock .wordmark{font-size:23px;line-height:1}",
      ".b-pg .b-jcard{width:420px;padding:24px;display:flex;flex-direction:column}",
      ".b-pg .b-jcard .h1{line-height:1.25}",
      ".b-pg .b-jsub{margin-top:4px;color:var(--ink-muted);font-size:14px}",
      ".b-pg .b-jcard .label{margin-top:18px}",
      ".b-pg .b-codein{position:relative;letter-spacing:0.35em}",
      ".b-pg .b-codein .caret{height:26px;vertical-align:middle;margin-left:0}",
      ".b-pg .b-codein .placeholder{color:var(--ink-faint)}",
      ".b-pg .b-hide{display:none}",
      ".b-pg .b-jcard .hint{margin-top:8px}",
      ".b-pg .b-wide{width:100%;margin-top:16px}",
      // preview
      ".b-pg .b-pcard{width:430px;padding:24px 26px;display:flex;flex-direction:column}",
      ".b-pg .b-pmark{display:flex;align-items:center;gap:7px}",
      ".b-pg .b-pmark img{width:22px;height:22px;object-fit:contain}",
      ".b-pg .b-pmark .wordmark{font-size:19px;line-height:1}",
      ".b-pg .b-found{margin-top:16px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-pname{font-size:32px;margin-top:2px;color:var(--ink)}",
      ".b-pg .b-pdesc{margin-top:8px;font-size:14px;color:var(--ink-muted);line-height:1.5}",
      ".b-pg .b-pstats{margin-top:12px;display:flex;gap:16px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-pstats span{display:inline-flex;align-items:center;gap:5px}",
      ".b-pg .b-pstats .b-ic{width:15px;height:15px;color:var(--ink-faint)}",
      ".b-pg .b-run{margin-top:10px;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink)}",
      ".b-pg .b-saved{margin-top:12px;display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-saved .b-ic{color:var(--success)}",
      ".b-pg .b-pcode{margin-top:10px;text-align:center;font-size:12.5px;color:var(--ink-faint)}",
      // feed
      ".b-pg .b-desc{margin-top:4px;font-size:14px;color:var(--ink-muted)}",
      ".b-pg .b-stats{margin-top:14px;display:grid;grid-template-columns:1fr 1fr 1fr 1.3fr;gap:10px}",
      ".b-pg .b-stat{padding:12px 14px}",
      ".b-pg .b-stat .eyebrow{font-size:11px;letter-spacing:.06em;white-space:nowrap}",
      ".b-pg .b-stat .v{margin-top:4px;font-size:20px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:8px}",
      ".b-pg .b-copy{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px;border-radius:999px;border:1px solid var(--edge-strong);font-size:12px;font-weight:500;color:var(--ink-muted);letter-spacing:0}",
      ".b-pg .b-copy .b-ic{width:13px;height:13px}",
      ".b-pg .b-h2{margin-top:26px;font-size:16px;font-weight:600;letter-spacing:-.01em}",
      ".b-pg .b-h2sub{margin-top:2px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-tiles{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}",
      ".b-pg .b-tile{padding:14px 16px}",
      ".b-pg .b-tile .t{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}",
      ".b-pg .b-tile .t .b-ic{width:18px;height:18px;color:var(--primary)}",
      ".b-pg .b-tile .s{margin-top:4px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-people{margin-top:12px;display:flex;gap:8px}",
      ".b-pg .b-person{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 8px;border-radius:999px;border:1px solid var(--edge);background:var(--surface)}",
      ".b-pg .b-person .n{font-size:13px;font-weight:500;line-height:1.2}",
      ".b-pg .b-person .m{font-size:12px;color:var(--ink-faint);line-height:1.2}",
      ".b-pg .b-chips{margin-top:26px;display:flex;flex-wrap:wrap;gap:6px}",
      ".b-pg .b-lhead{margin-top:16px;display:flex;align-items:center;justify-content:space-between}",
      ".b-pg .b-lhead .b-h2{margin-top:0}",
      ".b-pg .b-list{margin-top:12px;display:flex;flex-direction:column;gap:10px}",
      ".b-pg .note-card{padding:16px 18px}",
      ".b-pg .note-card .title{display:flex;align-items:center;gap:8px}",
      ".b-pg .note-card .summary{font-size:14px;margin-top:4px}",
      ".b-pg .note-card .meta{font-size:12.5px;margin-top:10px}",
      ".b-pg .note-card .actions{font-size:12.5px;align-items:center}",
      ".b-pg .note-card .actions span{display:inline-flex;align-items:center;gap:4px;color:var(--ink-muted)}",
      ".b-pg .note-card .actions .link{color:var(--primary)}",
      ".b-pg .note-card .actions .b-ic{width:14px;height:14px}",
      ".b-pg .note-card.b-lift{border-color:var(--edge-strong);box-shadow:var(--shadow-raised)}",
      ".b-pg .note-card.b-lift .title{color:var(--primary)}",
      // composer
      ".b-pg .b-step{margin-top:2px}",
      ".b-pg .b-step .step-head{font-size:12.5px}",
      ".b-pg .b-h1{margin-top:16px;font-size:24px;font-weight:600;letter-spacing:-.025em;line-height:1.25}",
      ".b-pg .b-ta{position:relative;margin-top:14px;min-height:132px;font-size:15px;padding:14px 16px}",
      ".b-pg .b-ta .placeholder{position:absolute;left:17px;top:14px;right:16px;font-size:15px;line-height:1.625}",
      ".b-pg .b-tools{margin-top:10px;display:flex;align-items:center;gap:8px}",
      ".b-pg .b-tools .grow{flex:1}",
      ".b-pg .b-saving{font-size:12.5px;color:var(--ink-faint);opacity:0;display:inline-flex;align-items:center;gap:6px}",
      ".b-pg .b-saving i{display:block;width:6px;height:6px;border-radius:50%;background:var(--pending)}",
      ".b-pg .b-saving.b-on{opacity:1}",
      ".b-pg .b-count{font-size:12.5px;color:var(--ink-muted);font-variant-numeric:tabular-nums;min-width:86px;text-align:right}",
      ".b-pg .b-foot{margin-top:18px;display:flex;align-items:center;gap:8px}",
      ".b-pg .b-foot .note{flex:1;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-foot .note .b-ic{width:15px;height:15px;color:var(--success)}",
      // organizing
      ".b-pg .b-orgsub{margin-top:4px;font-size:14px;color:var(--ink-muted)}",
      ".b-pg .b-stcard{margin-top:18px;padding:20px 22px}",
      ".b-pg .stages{gap:14px}",
      ".b-pg .stage .label{font-size:14.5px;margin:0;line-height:1.35}",
      ".b-pg .stage .detail{font-size:13px;margin-top:1px}",
      ".b-pg .stage .dot{width:22px;height:22px;position:relative}",
      ".b-pg .stage .dot .chk{display:none;width:13px;height:13px;color:var(--success)}",
      ".b-pg .stage .dot .chk svg{width:100%;height:100%;fill:currentColor}",
      ".b-pg .stage .dot .stir{display:none;width:20px;height:20px;overflow:visible}",
      ".b-pg .stage.active .dot{border-color:transparent}",
      ".b-pg .stage.done .dot .chk{display:inline-flex}",
      ".b-pg .stage.active .dot .stir{display:block}",
      ".b-pg .b-cancel{margin-top:12px;padding:0 12px}",
      // review
      ".b-pg .b-rtop{margin-top:8px;display:flex;align-items:center;gap:12px;padding:6px 14px;border:1px solid var(--edge);border-radius:var(--r-card);background:var(--surface)}",
      ".b-pg .b-rtop .pl{display:flex;flex-direction:column;gap:1px}",
      ".b-pg .b-rtop .pv{font-size:13.5px;font-weight:500}",
      ".b-pg .b-rtop .as{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-cols{margin-top:10px;display:grid;grid-template-columns:226px 1fr;gap:14px;align-items:start}",
      ".b-pg .b-orig{padding:14px 16px;background:var(--sunken);border-color:var(--edge-strong);box-shadow:none}",
      ".b-pg .b-orig .raw{margin-top:8px;font-size:14.5px;line-height:1.6;color:var(--ink);white-space:pre-wrap}",
      ".b-pg .b-orig .keep{margin-top:10px;display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink-faint)}",
      ".b-pg .b-orig .keep .b-ic{width:14px;height:14px}",
      ".b-pg .b-org{padding:12px 18px 14px}",
      ".b-pg .b-org .hd{display:flex;align-items:center;justify-content:space-between}",
      ".b-pg .b-edit{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 10px;border-radius:999px;font-size:12.5px;font-weight:500;color:var(--ink-muted)}",
      ".b-pg .b-edit .b-ic{width:13px;height:13px}",
      ".b-pg .b-by{margin-top:2px;display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--ink-faint)}",
      ".b-pg .b-by .b-ic{width:13px;height:13px;color:var(--primary)}",
      ".b-pg .b-ntitle{margin-top:5px;font-size:18px;font-weight:600;letter-spacing:-.015em;line-height:1.3}",
      ".b-pg .b-nsum{margin-top:3px;font-family:'MP Serif',Georgia,serif;font-size:15px;line-height:1.5;color:var(--ink-muted)}",
      ".b-pg .b-term{margin-top:8px}",
      ".b-pg .b-li{position:relative;padding-left:16px;font-family:'MP Serif',Georgia,serif;font-size:15px;line-height:1.45}",
      ".b-pg .b-li:before{content:'';position:absolute;left:3px;top:9.5px;width:5px;height:5px;border-radius:50%;background:var(--ink-faint)}",
      ".b-pg .b-kt{margin-top:7px;font-size:14px;font-weight:600}",
      ".b-pg .b-worth{margin-top:12px;padding:14px 16px}",
      ".b-pg .b-worth .t{font-size:14px}",
      ".b-pg .b-quote{margin-top:6px;display:inline-block;font-family:'MP Serif',Georgia,serif;font-size:15.5px;font-style:italic;color:var(--ink)}",
      ".b-pg .b-worth .b{margin-top:6px;font-size:13.5px;line-height:1.55;color:var(--ink-muted)}",
      ".b-pg .b-worth .b2{margin-top:8px;font-size:13.5px;line-height:1.55;color:var(--ink)}",
      ".b-pg .b-bar{margin-top:14px;padding:14px 16px}",
      ".b-pg .b-bar .r1{display:flex;align-items:center;gap:8px}",
      ".b-pg .b-bar .only{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:500}",
      ".b-pg .b-bar .only .b-ic{width:16px;height:16px;color:var(--primary)}",
      ".b-pg .b-bar .sv{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:13px;color:var(--success);font-weight:500}",
      ".b-pg .b-bar .sv .b-ic{width:15px;height:15px}",
      ".b-pg .b-bar .r2{margin-top:2px;font-size:13px;color:var(--ink-muted)}",
      ".b-pg .b-bar .r3{margin-top:12px;display:flex;justify-content:flex-end;gap:8px}",
      ".b-pg .b-share{min-width:149px}",
      // shared
      ".b-pg .b-okic{width:44px;height:44px;color:var(--success);display:flex}",
      ".b-pg .b-okic svg{width:100%;height:100%;fill:currentColor}",
      ".b-pg .b-shcard{margin-top:18px;padding:16px 18px}",
      ".b-pg .b-shcard .tt{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600}",
      ".b-pg .b-shcard .sm{margin-top:4px;font-size:14px;color:var(--ink-muted);line-height:1.5}",
      ".b-pg .b-shcard .ad{margin-top:10px;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-faint)}",
      ".b-pg .b-shcard .ad .b-ic{width:14px;height:14px}",
      ".b-pg .b-shbtns{margin-top:18px;display:flex;gap:8px}",
    ].join("\n");
    el("style", null, css, document.head);

    const ic = (name, cls) => '<span class="b-ic' + (cls ? " " + cls : "") + '">' + I(name) + "</span>";
    const avatar = (name, size) => {
      const tint = { Amy: 2, Ibrahim: 1, Adam: 6, Ahmad: 2, Rayyan: 1 }[name] || 1; // components/ui/avatar.tsx tintFor
      return '<span class="avatar ' + (size || "sm") + " t" + tint + '">' + I("user-fill") + "</span>";
    };
    const mkPage = (id) => { const p = F.page(id); p.el.classList.add("b-pg"); return p; };
    const POT = "meltingpots.xyz/p/biology-101";

    // ======================================================================================== P1: Join a Pot (a)
    const p1 = mkPage("b-join");
    const f1 = el("div", "b-fill", null, p1.scroller);
    el("div", "b-lock", '<img src="assets/pot-logo.png" alt=""><span class="wordmark">meltingpot</span>', f1);
    const jc = el("div", "card b-jcard", null, f1);
    el("div", "h1", "Join a Pot", jc);
    el("div", "b-jsub", "Enter the class code your classmate or teacher shared.", jc);
    el("div", "label", "Enter class code", jc);
    const codeIn = el("div", "code-input b-codein", null, jc);
    const codeTyped = el("span", null, "", codeIn);
    const codeCaret = el("span", "caret", "", codeIn);
    const codePh = el("span", "placeholder", "ABC123", codeIn);
    el("div", "hint", "Enter the 6-character code your class shared.", jc);
    const joinBtn = el("div", "btn primary b-wide", null, jc);
    const joinLbl = el("span", null, "Join Pot", joinBtn);

    // ======================================================================================== P2: Pot preview (a)
    const p2 = mkPage("b-prev");
    const f2 = el("div", "b-fill", null, p2.scroller);
    const pc = el("div", "card b-pcard", null, f2);
    el("div", "b-pmark", '<img src="assets/pot-logo.png" alt=""><span class="wordmark">meltingpot</span>', pc);
    el("div", "b-found", "You found", pc);
    el("div", "display b-pname", "Biology 101", pc);
    el("div", "b-pdesc", "Everything our class knows about intro biology, gathered in one place. Rough notes welcome.", pc);
    const pstats = el("div", "b-pstats", "<span>" + ic("users") + "4 members</span><span>" + ic("notebook") + "6 notes</span><span>" + ic("clock") + "active 20h ago</span>", pc);
    const prun = el("div", "b-run", avatar("Rayyan") + "<span>Run by Rayyan</span>", pc);
    el("div", "b-saved", ic("check-circle-fill") + "<span>Membership is saved instantly. No extra setup required.</span>", pc);
    const join2 = el("div", "btn primary b-wide", null, pc);
    const join2Lbl = el("span", null, "Join Pot", join2);
    el("div", "b-pcode", "Class code 5R22AX", pc);

    // ======================================================================================== P3 and P8: Pot feed (c)
    const NOTES = [
      ["What exam 1 covers", "Exam 1 spans weeks 1 to 3, with emphasis on osmosis problems, organelle functions, and the mitosis versus meiosis distinction.", "Ibrahim", "20h ago", "Exam review", false],
      ["Osmosis and tonicity", "Water crosses a selectively permeable membrane toward the higher solute concentration; tonicity describes which way cells gain or lose water.", "Ibrahim", "2d ago", "Week 2: Cell structure", false],
      ["Mitosis vs meiosis", "Mitosis makes two identical body cells; meiosis makes four genetically distinct gametes with half the chromosomes.", "Adam", "3d ago", "Week 3: Cell division", true],
      ["The cell cycle and its checkpoints", "Cells spend most of their life in interphase (G1, S, G2) before dividing in M phase; checkpoints keep damaged cells from dividing.", "Adam", "4d ago", "Week 3: Cell division", false],
    ];
    const noteCard = (n, parent) => el("div", "card note-card",
      '<div class="title">' + n[0] + (n[5] ? '<span class="badge">v2</span>' : "") + "</div>" +
      '<div class="summary">' + n[1] + "</div>" +
      '<div class="meta">' + avatar(n[2]) + "<span>" + n[2] + " · " + n[3] + " · " + n[4] + "</span>" +
      '<span class="actions"><span>' + ic("chat-circle-text") + 'Suggest correction</span><span class="link">Open</span></span></div>', parent);
    function buildFeed(p, shared) {
      const col = F.shell(p, { nav: "pots", tabs: ["Feed", "Study", "Members", "Settings"], tab: "Feed" });
      el("div", "h1", "Biology 101", col);
      el("div", "b-desc", "Everything our class knows about intro biology, gathered in one place. Rough notes welcome.", col);
      el("div", "b-stats",
        '<div class="card b-stat"><div class="eyebrow">Contributors</div><div class="v">5</div></div>' +
        '<div class="card b-stat"><div class="eyebrow">Shared notes</div><div class="v">' + shared + "</div></div>" +
        '<div class="card b-stat"><div class="eyebrow">Open corrections</div><div class="v">1</div></div>' +
        '<div class="card b-stat"><div class="eyebrow">Class code</div><div class="v">5R22AX<span class="b-copy">' + ic("copy") + "Copy</span></div></div>", col);
      el("div", "b-h2", "Study this Pot", col);
      el("div", "b-h2sub", "Browse the source notes or generate material from the full class vault.", col);
      el("div", "b-tiles",
        '<div class="card b-tile"><div class="t">' + ic("file-text") + 'Raw notes</div><div class="s">Shared notes from everyone.</div></div>' +
        '<div class="card b-tile"><div class="t">' + ic("sparkle") + 'Summary</div><div class="s">Build a fresh study guide.</div></div>' +
        '<div class="card b-tile"><div class="t">' + ic("cards") + 'Flashcards</div><div class="s">Generate recall cards from the Pot.</div></div>' +
        '<div class="card b-tile"><div class="t">' + ic("brain") + 'Practice</div><div class="s">Set the length and difficulty, then sit it.</div></div>', col);
      el("div", "b-h2", "Recent contributors", col);
      const ppl = [["Ibrahim", "2 notes · 20h ago"], ["Adam", "2 notes · 3d ago"], ["Rayyan", "1 note · 5d ago"], ["Ahmad", "1 note · 6d ago"]];
      el("div", "b-people", ppl.map((x) => '<div class="b-person">' + avatar(x[0]) + '<div><div class="n">' + x[0] + '</div><div class="m">' + x[1] + "</div></div></div>").join(""), col);
      const chips = el("div", "b-chips", ["All sections", "Week 1: Foundations", "Week 2: Cell structure", "Week 3: Cell division", "Exam review"]
        .map((c, i) => '<span class="chip' + (i === 0 ? " selected" : "") + '">' + c + "</span>").join(""), col);
      const lhead = el("div", "b-lhead", null, col);
      el("div", "b-h2", "Latest shared notes", lhead);
      const add = el("div", "btn primary sm", ic("plus") + "<span>Add contribution</span>", lhead);
      const list = el("div", "b-list", null, col);
      return { col, chips, lhead, add, list };
    }
    const p3 = mkPage("b-feed");
    const feed = buildFeed(p3, "6");
    const cards3 = NOTES.map((n) => noteCard(n, feed.list));

    // ======================================================================================== P4: composer (d)
    const p4 = mkPage("b-comp");
    const c4 = F.shell(p4, { nav: "pots", col: 640 });
    el("div", "b-step", '<div class="step-head"><span>1 of 3 · Write</span></div><div class="bar"><i style="width:33.33%"></i></div>', c4);
    el("div", "b-h1", "Write anything", c4);
    el("div", "b-jsub", "No templates, no formatting, no pressure.", c4);
    const ta = el("div", "textarea b-ta", null, c4);
    const taTyped = el("span", null, "", ta);
    const taCaret = el("span", "caret", "", ta);
    const taPh = el("span", "placeholder", "Type whatever you remember, paste rough notes, explain an idea, or share an example. Formatting does not matter.", ta);
    const tools = el("div", "b-tools", null, c4);
    el("div", "btn secondary sm", ic("paperclip") + "<span>Attach file</span>", tools);
    el("div", "btn secondary sm", ic("link-simple") + "<span>Add link</span>", tools);
    el("div", "grow", null, tools);
    const saving = el("span", "b-saving", "<i></i>Saving", tools);
    const counter = el("span", "b-count", "0 / 20,000", tools);
    const foot4 = el("div", "b-foot", null, c4);
    el("div", "note", ic("check-circle") + "<span>Original text will always be preserved.</span>", foot4);
    el("div", "btn quiet", "Cancel", foot4);
    const contBtn = el("div", "btn primary", "Continue", foot4);

    // ======================================================================================== P5: organizing (e)
    const p5 = mkPage("b-org");
    const c5 = F.shell(p5, { nav: "pots", col: 560 });
    c5.style.paddingTop = "34px";
    el("div", "b-h1", "Organizing your note...", c5).style.marginTop = "0";
    el("div", "b-orgsub", "Your original is saved. Nothing has been shared yet.", c5);
    const stcard = el("div", "card b-stcard", null, c5);
    const stl = el("ul", "stages", null, stcard);
    // components/brand/stir.tsx drawn whole (the vessel, its mouth, six paddles, the front lip), so it reads as a pot
    const STIR = (k) => '<svg class="stir" viewBox="0 0 100 100"><defs><mask id="b-stir-' + k + '"><rect width="100" height="100" fill="#fff"/><ellipse cx="50" cy="32" rx="35" ry="5.5" fill="#000"/></mask></defs>' +
      '<g mask="url(#b-stir-' + k + ')"><ellipse cx="6.5" cy="40" rx="4" ry="4.5" fill="none" stroke="var(--primary)" stroke-width="2.6" transform="rotate(-22 6.5 40)"/>' +
      '<ellipse cx="93.5" cy="40" rx="4" ry="4.5" fill="none" stroke="var(--primary)" stroke-width="2.6" transform="rotate(22 93.5 40)"/>' +
      '<path d="M10 32c0-2 3-4 7-4.5 9-1.5 22-2 33-2s24 0.5 33 2c4 0.5 7 2.5 7 4.5 0 29-5 47-16 55-6 4.5-15 7-24 7s-18-2.5-24-7c-11-8-16-26-16-55Z" fill="var(--primary)"/></g>' +
      [0, 1, 2, 3, 4, 5].map(() => '<circle fill="var(--clay)"></circle>').join("") +
      '<path d="M10.5 33c8.5 3.5 22 5.5 39.5 5.5s31-2 39.5-5.5c-0.4 2.6-0.9 5-1.5 7.2-8.6 3-22.4 4.6-38 4.6s-29.4-1.6-38-4.6c-0.6-2.2-1.1-4.6-1.5-7.2Z" fill="var(--primary)"/></svg>';
    const STAGES = [["Original preserved", "Saved exactly as you wrote it"], ["Structuring the idea", "Building a scannable explanation"],
      ["Creating a summary", "One line the class can skim"], ["Suggesting placement", "Matching this to a section"]];
    const stageNodes = STAGES.map((s, k) => el("li", "stage waiting",
      '<span class="dot"><span class="chk">' + I("check-bold") + "</span>" + STIR(k) + '</span><div><div class="label">' + s[0] + '</div><div class="detail">' + s[1] + "</div></div>", stl));
    el("div", "btn quiet b-cancel", "Cancel and return to draft", c5);

    // ======================================================================================== P6: review before sharing (f)
    const p6 = mkPage("b-rev");
    const c6 = F.shell(p6, { nav: "pots", col: 724 });
    c6.style.paddingTop = "10px";
    el("div", "b-step", '<div class="step-head"><span>3 of 3 · Review before sharing</span><span class="badge pending">Review required</span></div><div class="bar"><i style="width:100%"></i></div>', c6);
    el("div", "b-rtop", '<div class="pl"><span class="eyebrow">Suggested placement</span><span class="pv">Week 2: Cell structure (suggested)</span></div>' +
      '<div class="as">' + avatar("Amy") + "<span>Shared as Amy</span></div>", c6);
    const cols = el("div", "b-cols", null, c6);
    const orig = el("div", "card b-orig", '<div class="eyebrow">Original preserved</div><div class="raw">' + RAW + "</div>", cols);
    const right = el("div", null, null, cols);
    const org = el("div", "card b-org", null, right);
    el("div", "hd", '<span class="eyebrow">Organized</span><span class="b-edit">' + ic("pencil-simple") + "Edit</span>", org);
    el("div", "b-by", ic("sparkle-fill") + "<span>Organized by gemini-3.6-flash</span>", org);
    const lines = [];
    const ln = (cls, html) => { const n = el("div", cls, html, org); lines.push(n); return n; };
    const nTitle = ln("b-ntitle", "The cell membrane");
    ln("b-nsum", "The cell membrane is a phospholipid bilayer, and size decides what gets through it.");
    ln("eyebrow b-term", "Cell membrane");
    ln("b-li", "A phospholipid bilayer.");
    ln("b-li", "Small molecules get through.");
    ln("b-li", "Big molecules can't get through.");
    ln("b-kt", "Key takeaways");
    ln("b-li", "The cell membrane is a phospholipid bilayer.");
    const lastLine = ln("b-li", "Size decides what gets through.");
    const worth = el("div", "notice warning b-worth", null, right);
    worth.innerHTML = '<span class="icon">' + I("warning-fill") + "</span>";
    const wb = el("div", null, null, worth);
    el("div", "t", "Worth checking before you share", wb);
    const quote = el("span", "b-quote", "“big stuff cant”", el("div", null, null, wb));
    el("div", "b", "Big molecules do get in and out, just not through the bilayer on their own: transport proteins carry them, and cells take in very large ones by endocytosis. Size isn't the whole rule either, since small charged ions can't cross the bilayer unaided.", wb);
    el("div", "b2", "Your note has not been changed. Edit it above if you agree, or share it as it is.", wb);
    const bar6 = el("div", "card b-bar", null, c6);
    el("div", "r1", '<span class="only">' + ic("lock") + "Only you can approve what gets shared.</span>" + '<span class="sv">' + ic("check-circle-fill") + "Saved</span>", bar6);
    el("div", "r2", "Organized for you; every word stays yours to change.", bar6);
    const r3 = el("div", "r3", null, bar6);
    el("div", "btn secondary", "Edit my original", r3);
    el("div", "btn secondary", "Save draft", r3);
    el("div", "btn secondary", "Organize again", r3);
    const shareBtn = el("div", "btn primary b-share", null, r3);
    const shareLbl = el("span", null, "Share with class", shareBtn);

    // ======================================================================================== P7: shared confirmation (g)
    const p7 = mkPage("b-shared");
    const c7 = F.shell(p7, { nav: "pots", col: 600 });
    c7.style.paddingTop = "40px";
    const okIc = el("div", "b-okic", I("check-circle-fill"), c7);
    el("div", "b-h1", "Shared with the class", c7).style.marginTop = "12px";
    el("div", "b-jsub", "Your contribution is live and credited to you. Today is on your record.", c7);
    const shc = el("div", "card b-shcard", null, c7);
    el("div", "tt", '<span>The cell membrane</span><span class="badge success">Live</span>', shc);
    el("div", "sm", "The cell membrane is a phospholipid bilayer, and size decides what gets through it.", shc);
    el("div", "ad", ic("folder-simple") + "<span>Added to Week 2: Cell structure in Biology 101 just now</span>", shc);
    const shb = el("div", "b-shbtns", null, c7);
    el("div", "btn primary", "View in class notes", shb);
    const backBtn = el("div", "btn secondary", "Back to class feed", shb);
    el("div", "btn quiet", "Add another contribution", shb);

    // ======================================================================================== P8: the feed with the new note on top (c)
    const p8 = mkPage("b-feed2");
    const feed8 = buildFeed(p8, "7");
    const newCard = noteCard(["The cell membrane", "The cell membrane is a phospholipid bilayer, and size decides what gets through it.", "Amy", "just now", "Week 2: Cell structure", false], feed8.list);
    const cards8 = NOTES.slice(0, 3).map((n) => noteCard(n, feed8.list));

    // ---------- measurements (logical px inside the scrollers, layout is final here) ----------
    const S3 = feed.chips.offsetTop - 14;                 // feed scrolled to the section chips
    const S8 = feed8.chips.offsetTop - 14;
    gsap.set(p8.scroller, { y: -S8 });
    const VIEW = 440;                                     // the main area under the 40 px top bar
    const S6a = Math.round(worth.offsetTop + worth.offsetHeight - VIEW + 16);   // Worth checking fully in view
    const S6b = Math.round(c6.offsetHeight - VIEW);       // the bottom bar in view

    // ============================================================ timeline
    // 9.6 window rises with the join page
    F.win.enter(9.6);
    F.win.setUrl(9.6, "meltingpots.xyz/join");
    F.pageIn(9.6, p1);

    // 10.4 caption, cursor enters from the bottom right, clicks the code field, types the code
    F.caption({ t0: 10.4, t1: 15.3, icon: "users", bold: "Join", rest: " with the class code." });
    C.at(10.2, 1990, 1040);
    C.show(10.3);
    C.moveTo(10.35, codeIn, 0.7, 0.62, 0, 0.55);          // arrives 10.9
    C.click(10.9);
    F.classAt(codeIn, "focus", 10.9, 13.0);
    F.caret(codeCaret, 10.9, 11.95, 13.0);
    const codeEnd = F.type(codeTyped, "5R22AX", 11.05, { cps: 7, seed: 5 });
    F.classAt(codePh, "b-hide", 11.05, 99);
    F.classAt(joinBtn, "disabled", 0, codeEnd - 0.12);
    C.move(11.15, F.pt(codeIn, 0.74, 0.7).x + 10, F.pt(codeIn, 0.74, 0.7).y + 8, 0.45);
    C.moveTo(11.62, joinBtn, 0.56, 0.55, 0, 0.55);        // arrives 12.17
    C.hover(joinBtn, 12.17, 12.8);
    C.click(12.5, joinBtn);
    F.textAt(joinLbl, [[0, "Join Pot"], [12.5, "Checking"]]);

    // 12.8 swap to the preview
    F.swap(12.8, p1, p2);
    F.win.setUrl(12.8, "meltingpots.xyz/join/5R22AX");
    const st6 = pstats.children[1];
    C.moveTo(12.95, st6, 0.5, 1.1, 0, 0.7);               // reads the stats
    C.moveTo(13.75, prun, 0.36, 0.7, 0, 0.5);
    C.moveTo(14.35, join2, 0.6, 0.55, 0, 0.55);           // arrives 14.9
    C.hover(join2, 14.9, 15.3);
    C.click(15.0, join2);
    F.textAt(join2Lbl, [[0, "Join Pot"], [15.0, "Joining"]]);

    // 15.3 swap to the Pot feed
    F.swap(15.3, p2, p3);
    F.win.setUrl(15.3, POT);
    F.caption({ t0: 15.6, t1: 19.9, icon: "cooking-pot", bold: "One Pot", rest: " for everything your class shares." });
    const tile = feed.col.querySelector(".b-tiles").children[1];
    C.moveTo(15.45, tile, 0.62, 0.4, 0, 0.75);            // into the content, rides the scroll
    F.scroll(16.4, p3, S3, 1.4);
    C.move(16.3, F.pt(tile, 0.62, 0.4).x + 26, F.pt(tile, 0.62, 0.4).y + 44, 1.45, 0.05);
    const hc = cards3[0];
    C.moveTo(17.8, hc, 0.62, 0.5, S3, 0.5);               // arrives 18.3
    tl.fromTo(hc, { y: 0 }, { y: -3, duration: 0.18, ease: "power3.out", immediateRender: false }, 18.25);
    tl.fromTo(hc, { y: -3 }, { y: 0, duration: 0.18, ease: "power3.out", immediateRender: false }, 18.85);
    F.classAt(hc, "b-lift", 18.25, 18.95);
    C.hover(null, 18.3, 18.85);
    C.moveTo(18.8, feed.add, 0.55, 0.55, S3, 0.5);        // arrives 19.3
    C.hover(feed.add, 19.3, 19.75);
    C.click(19.4, feed.add);
    C.hide(19.7);

    // 20.0 headline with the blur hand-off; composer comes in under it
    F.win.blur(20.0, 22.9);
    F.headline({ t0: 20.0, t1: 23.0, lines: [{ text: "Write it down.", accent: "down." }, { text: "Keep moving.", muted: true, type: true }] });
    F.swap(21.0, p3, p4);
    F.win.setUrl(21.0, POT + "/contribute");

    // 23.0 composer: click the field, type Amy's note, head for Continue
    F.caption({ t0: 23.2, t1: 28.7, icon: "pencil-simple", bold: "Write", rest: " it rough. No templates, no formatting." });
    C.at(22.6, 1990, 905);
    C.show(22.8);
    C.moveTo(22.85, ta, 0.42, 0.78, 0, 0.55);             // arrives 23.4
    C.click(23.4);
    F.classAt(ta, "focus", 23.4, 28.45);
    const T0 = 23.62;
    const tt = F.typeTimes(RAW, T0, 22, 7);
    const noteEnd = F.type(taTyped, RAW, T0, { cps: 22, seed: 7 });
    F.caret(taCaret, 23.4, noteEnd, 28.45);
    F.classAt(taPh, "b-hide", T0, 99);
    F.classAt(contBtn, "disabled", 0, T0);
    F.driver((t) => {
      let n = 0;
      while (n < tt.times.length && t >= tt.times[n]) n++;
      const s = n + " / 20,000";
      if (counter.textContent !== s) counter.textContent = s;
    });
    F.classAt(saving, "b-on", T0 + 0.1, noteEnd + 0.7);
    const pTa = F.pt(ta, 0.42, 0.78);
    C.move(23.9, pTa.x + 70, pTa.y + 10, 1.3, 0.05);
    C.move(25.3, pTa.x + 150, pTa.y - 4, 1.3, 0.05);
    C.moveTo(noteEnd - 0.45, contBtn, 0.5, 0.55, 0, 0.6);
    C.hover(contBtn, noteEnd + 0.15, 28.4);
    C.move(noteEnd + 0.35, F.pt(contBtn, 0.44, 0.62).x, F.pt(contBtn, 0.44, 0.62).y, 0.55, 0.04);
    C.click(28.1, contBtn);

    // 28.4 organizing: the stages complete one by one
    F.swap(28.4, p4, p5);
    const DONE = [28.7, 29.4, 30.1, 30.8];
    F.driver((t) => {
      stageNodes.forEach((n, i) => {
        const start = i === 0 ? 0 : DONE[i - 1];
        const c = t >= DONE[i] ? "stage done" : t >= start ? "stage active" : "stage waiting";
        if (n.className !== c) n.className = c;
      });
    });
    DONE.forEach((t, i) => {
      const dot = stageNodes[i].querySelector(".dot");
      tl.fromTo(dot, { scale: 0.7 }, { scale: 1, duration: 0.32, ease: "back.out(3)", immediateRender: false }, t);
      F.sound("tick", t);
    });
    // the Stir (components/brand/stir.tsx, bare under 34 px): six paddles on the projected ellipse, 1.2 s a turn
    const stirDots = stageNodes.map((n) => Array.from(n.querySelectorAll(".stir circle")));
    const TR = [[1, 1], [0.86, 0.66], [0.72, 0.46], [0.59, 0.32], [0.47, 0.21], [0.36, 0.13]];
    F.driver((t) => {
      stirDots.forEach((ds) => ds.forEach((c, i) => {
        const u = (((t + 0.05 * i) / 1.2) % 1 + 1) % 1, a = 2 * Math.PI * u;
        const s = 0.88 + 0.12 * Math.sin(a);
        c.setAttribute("cx", (50 + 32 * Math.cos(a)).toFixed(2));
        c.setAttribute("cy", (32 + 6 * Math.sin(a)).toFixed(2));
        c.setAttribute("r", (8 * TR[i][0] * s).toFixed(2));
        c.setAttribute("opacity", String(TR[i][1]));
      }));
    });
    F.caption({ t0: 29.0, t1: 37.4, icon: "sparkle", bold: "AI", rest: " drafts a title, a summary and key takeaways." });
    C.moveTo(28.55, stageNodes[1], 0.72, 0.5, 0, 0.85);
    C.moveTo(29.6, stageNodes[2], 0.76, 0.6, 0, 0.9);
    C.moveTo(30.6, stageNodes[3], 0.7, 0.7, 0, 0.8);

    // 31.3 review before sharing: both columns, the organized note streams in by line
    F.swap(31.3, p5, p6);
    const LT = 31.8;
    lines.forEach((n, i) => {
      gsap.set(n, { opacity: 0, y: 6 });
      tl.fromTo(n, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, LT + i * 0.08);
      if (i % 3 === 0) F.sound("tick", LT + i * 0.08, { db: 8 });   // title, first bullet, Key takeaways
    });
    C.moveTo(31.5, nTitle, 0.8, 0.45, 0, 0.8);            // rests right of the title while the note streams in
    const pt0 = F.pt(nTitle, 0.8, 0.45);
    C.move(32.35, pt0.x + 14, pt0.y - 8, 0.6, 0.05);
    C.moveTo(33.0, lines[4], 0.84, 0.55, 0, 0.8);
    C.moveTo(33.85, lastLine, 0.8, 0.7, 0, 0.7);
    // the review page scrolls by a driver so the original column can stay in view beside the organized one (sticky)
    const io = F.ease("power2.inOut"), colsTop = cols.offsetTop, stickMax = cols.offsetHeight - orig.offsetHeight;
    const scroll6 = (t) => t < 34.6 ? 0 : t < 35.8 ? S6a * io((t - 34.6) / 1.2) : t < 38.0 ? S6a : t < 38.8 ? S6a + (S6b - S6a) * io((t - 38.0) / 0.8) : S6b;
    F.driver((t) => {
      const y = scroll6(t), st = F.clamp(y - colsTop + 12, 0, stickMax);
      p6.scroller.style.transform = "translate(0px," + (-y).toFixed(2) + "px)";
      orig.style.transform = "translate(0px," + st.toFixed(2) + "px)";
    });
    const pl = F.pt(lastLine, 0.72, 0.7);
    C.move(34.6, pl.x + 24, pl.y - 30, 1.0, 0.05);       // rides the scroll
    C.moveTo(35.6, quote, 1.12, 0.05, S6a, 0.45);         // arrives 36.05
    C.click(36.05);                                        // no target, so the quote does not scale
    MP.markerSweep(tl, { el: quote, t: 36.05, dur: 0.6, color: "rgba(171, 90, 20, 0.2)" });
    const pq = F.pt(quote, 1.12, 0.05, S6a);
    C.move(36.35, pq.x + 140, pq.y - 2, 1.3, 0.05);
    F.caption({ t0: 37.6, t1: 44.7, icon: "eye", bold: "You decide", rest: " what gets shared. Your original is always kept." });
    C.move(37.8, pq.x + 190, pq.y + 70, 1.0, 0.05);
    C.moveTo(38.85, shareBtn, 0.55, 0.55, S6b, 0.55);     // arrives 39.4
    C.hover(shareBtn, 39.4, 40.3);
    C.click(40.0, shareBtn);
    F.textAt(shareLbl, [[0, "Share with class"], [40.0, "Sharing"]]);

    // 40.3 shared with the class
    F.swap(40.3, p6, p7);
    tl.fromTo(okIc, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.2)", immediateRender: false }, 40.45);
    gsap.set(okIc, { opacity: 0 });
    C.moveTo(40.45, shc, 0.82, 0.45, 0, 0.75);
    C.moveTo(41.4, backBtn, 0.55, 0.55, 0, 0.55);         // arrives 41.95
    C.hover(backBtn, 41.95, 42.45);
    C.click(42.1, backBtn);

    // 42.4 the feed: "The cell membrane" arrives at the top of the list (Magic UI animated list)
    F.swap(42.4, p7, p8);
    F.win.setUrl(42.4, POT);
    const push = newCard.offsetHeight + 10, TA = 42.75;
    gsap.set(newCard, { opacity: 0, scale: 0.6, transformOrigin: "50% 0%" });
    tl.fromTo(newCard, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.55, ease: "expo.out", immediateRender: false }, TA);
    cards8.forEach((c) => {
      gsap.set(c, { y: -push });
      tl.fromTo(c, { y: -push }, { y: 0, duration: 0.55, ease: "expo.out", immediateRender: false }, TA);
    });
    F.classAt(newCard, "b-lift", 43.1, 43.7);
    C.moveTo(42.6, newCard, 0.7, 0.5, S8, 0.6);
    C.move(43.75, 1990, 1110, 0.7);
    C.hide(44.2);
    F.pageOut(45.3, p8);
  },
});
