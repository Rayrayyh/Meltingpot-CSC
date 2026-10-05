#!/usr/bin/env bash
# Determinism check: compare two renders file-for-file and decoded-frame-for-frame.  usage: framehash.sh a.mp4 b.mp4
set -euo pipefail
FF="${HYPERFRAMES_FFMPEG_PATH:-/usr/local/bin/ffmpeg}"
md5sum "$1" "$2"
n=$(diff <("$FF" -v error -i "$1" -map 0:v -f framemd5 - | grep -v '^#') <("$FF" -v error -i "$2" -map 0:v -f framemd5 - | grep -v '^#') | grep -c '^<' || true)
echo "frames: $("$FF" -v error -i "$1" -map 0:v -f framemd5 - | grep -vc '^#')  differing decoded frames: $n"
