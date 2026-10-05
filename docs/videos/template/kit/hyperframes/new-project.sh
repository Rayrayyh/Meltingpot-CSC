#!/usr/bin/env bash
# Scaffold a HyperFrames project that renders with no network: usage  new-project.sh <dir>
# What the stock 0.8.112 scaffold gets wrong for this brief, and what this fixes:
#   - index.html loads GSAP from cdn.jsdelivr.net  -> vendored assets/vendor/gsap.min.js (3.14.2)
#   - package.json has a "publish" script and calls "npx --yes hyperframes@0.8.112" -> scripts call the local bin, no publish
#   - CLAUDE.md / AGENTS.md route agents to HyperFrames' own workflows ("npm run publish", sub-compositions per scene)
#     and would load as project instructions in Claude Code -> replaced by a short pointer to the brief's PART 3
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$HERE/env.sh"
DIR="${1:?usage: new-project.sh <dir>}"
"$HF" init "$DIR" --non-interactive --resolution landscape >/dev/null
cd "$DIR"
mkdir -p assets/vendor assets/fonts assets/audio
cp "$HERE/cli/node_modules/gsap/dist/gsap.min.js" assets/vendor/gsap.min.js
sed -i 's#https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js#assets/vendor/gsap.min.js#' index.html
grep -q 'src="assets/vendor/gsap.min.js"' index.html
node -e '
const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json","utf8"));
const hf=process.argv[1];
p.scripts={lint:hf+" lint",check:hf+" check",snapshot:hf+" snapshot --no-end --timeout 20000 --describe false",render:hf+" render --fps 30 --workers 4"};
fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n");' "$HF"
rm -f AGENTS.md
cat > CLAUDE.md <<'EOF'
# Launch film composition

Follow docs/videos/template/PROMPT.md (step 2), not HyperFrames' bundled workflows: one index.html, one stage, one paused
window.__timelines["main"], every time-derived state driven by one apply(t) driver tween. Source ../env.sh (or the
template's env.sh) before any hyperframes command. Never run publish, feedback, cloud, lambda, cloudrun, auth, capture,
tts, transcribe or "snapshot --describe"; they upload or call paid APIs. Run renders under $HF_OFFLINE so a remote
dependency fails loudly instead of being fetched.
EOF
echo "created $(pwd)"
