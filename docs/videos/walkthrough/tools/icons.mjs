// Export Phosphor icons (MIT, @phosphor-icons/react in web/node_modules) to assets/icons.js as inline SVG strings that
// take currentColor: ICONS["name"] (regular), ICONS["name-bold"], ICONS["name-fill"].  node tools/icons.mjs
import fs from "node:fs";
import path from "node:path";
const DEFS = "/home/user/meltingpot-csc/web/node_modules/@phosphor-icons/react/dist/defs";
const NAMES = `ArrowLeft ArrowRight ArrowSquareOut ArrowClockwise ArrowsClockwise Brain CalendarBlank CalendarCheck Cards CaretDown CaretRight
CaretLeft CaretUpDown CaretDoubleLeft ChalkboardTeacher ChatCircleText Check CheckCircle Clock ClockCounterClockwise CookingPot Copy
Exam Eye FileText FolderSimple GraduationCap HandPointing House HourglassMedium Lightbulb LinkSimple List ListChecks Lock
MagnifyingGlass NotePencil Notebook Paperclip PencilSimple PencilSimpleLine Plant Play Plus Question Robot ShieldCheck Shuffle Sparkle
Star Tray User Users Warning X XCircle Archive Image Bell UsersThree Lightning BookOpen Target Hash Funnel SortAscending`.split(/\s+/).filter(Boolean);
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const attrs = (obj) => {
  const out = [];
  const re = /(\w+):\s*(?:"([^"]*)"|([\d.]+))/g;
  let m;
  while ((m = re.exec(obj))) out.push(`${kebab(m[1])}="${m[2] ?? m[3]}"`);
  return out.join(" ");
};
const ICONS = {};
for (const n of NAMES) {
  const f = path.join(DEFS, n + ".es.js");
  if (!fs.existsSync(f)) { console.error("missing", n); continue; }
  const src = fs.readFileSync(f, "utf8");
  const parts = src.split(/\[\s*\n\s*"(bold|duotone|fill|light|regular|thin)",/);
  for (let i = 1; i < parts.length; i += 2) {
    const w = parts[i], body = parts[i + 1];
    if (!["regular", "bold", "fill"].includes(w)) continue;
    const els = [];
    const re = /createElement\("(\w+)",\s*\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(body))) els.push(`<${m[1]} ${attrs(m[2])}/>`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">${els.join("")}</svg>`;
    ICONS[kebab(n) + (w === "regular" ? "" : "-" + w)] = svg;
  }
}
const out = "/home/user/meltingpot-csc/docs/videos/walkthrough/assets/icons.js";
fs.writeFileSync(out, "// Phosphor icons (MIT, assets/icons/LICENSE-phosphor.txt), exported by tools/icons.mjs from @phosphor-icons/react.\nwindow.ICONS = " + JSON.stringify(ICONS) + ";\n");
console.log(Object.keys(ICONS).length, "icons ->", out);
