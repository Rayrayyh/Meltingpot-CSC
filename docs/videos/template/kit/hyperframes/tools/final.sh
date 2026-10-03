#!/usr/bin/env bash
# The final, from lossless frames: HyperFrames renders PNG frames with one capture worker, then x264 encodes them with
# the score muxed. HyperFrames' own mp4 path captures each frame as a JPEG (quality 80), which about doubled the banding
# in a dark glow (measured on meltingpot's remake); one worker removes a 1 px shimmer that 4 workers left in holds.
# Needs about 10.4 GB free for 37.5 s at 1080p (HyperFrames' pre-flight check), though the frames take about 0.5 GB.
# Usage (from the project): bash <kit>/hyperframes/tools/final.sh [crf]   ->  renders/final.mp4  (crf defaults to 14)
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/env.sh"
CRF="${1:-14}"
rm -rf renders/final-frames
"$HF_OFFLINE" "$HF" render --strict --fps 30 --workers 1 --format png-sequence -o renders/final-frames
"$HYPERFRAMES_FFMPEG_PATH" -v error -y -framerate 30 -i renders/final-frames/frame_%06d.png -i assets/audio/score.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -g 60 \
  -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest renders/final.mp4
echo "wrote renders/final.mp4"
