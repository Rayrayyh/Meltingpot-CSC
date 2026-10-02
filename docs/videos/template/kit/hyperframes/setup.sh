#!/usr/bin/env bash
# Installs a pinned, local HyperFrames toolchain next to this script. Network is used here only (npm registry).
# Tested 2026-10-02: hyperframes 0.8.112, gsap 3.14.2, @ffprobe-installer/linux-x64 5.2.0, node 22.22.2.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_NO_UPDATE_CHECK=1 HYPERFRAMES_SKIP_SKILLS=1

# 1. The CLI, pinned and local (calling the local bin avoids an npx registry lookup on every command).
mkdir -p "$HERE/cli"
cd "$HERE/cli"
[ -f package.json ] || npm init -y >/dev/null
npm i -E hyperframes@0.8.112 gsap@3.14.2
echo "c174bfce53a729418d57a8ad8625e7247c793a22fef8e2851e3cfa3de9cd8280  node_modules/gsap/dist/gsap.min.js" | sha256sum -c -

# 2. ffprobe: render stops with "FFprobe not found" without it, and the machine's static ffmpeg ships none.
mkdir -p "$HERE/ffprobe"
cd "$HERE/ffprobe"
if [ ! -x package/ffprobe ]; then
  npm pack @ffprobe-installer/linux-x64@5.2.0 >/dev/null
  tar xzf ffprobe-installer-linux-x64-5.2.0.tgz
  rm ffprobe-installer-linux-x64-5.2.0.tgz
  chmod u+x package/ffprobe   # the tarball ships it without the execute bit (its postinstall does the chmod)
fi
echo "576c21674291ec1948d507ea8ab0d78eb6621a0be8c6f1a6db0f50c5fcb1e0f9  package/ffprobe" | sha256sum -c -

# 3. Check the environment (doctor --json always exits 0, so gate on its payload).
# shellcheck source=/dev/null
source "$HERE/env.sh"
"$HF" --version
"$HF" doctor --json | node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8"));const need=["Node.js","FFmpeg","FFprobe","Chrome"];const bad=(d.checks||[]).filter(c=>need.includes(c.name)&&!c.ok);for(const c of (d.checks||[]).filter(c=>need.includes(c.name)))console.log((c.ok?"ok   ":"FAIL ")+c.name+": "+(c.detail||c.title||""));process.exit(bad.length?1:0)'
