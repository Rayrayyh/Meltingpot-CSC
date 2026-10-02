# Source this before any hyperframes command: offline, no telemetry, no self-update, local binaries.
# Tested 2026-10-02 with hyperframes 0.8.112, node 22.22.2 and Playwright's chromium_headless_shell-1194 (Chromium 141).
# FFMPEG_BIN and HEADLESS_SHELL may be set first to point at this machine's binaries.
_HF_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export HYPERFRAMES_NO_TELEMETRY=1      # the opt-out the CLI reads; HYPERFRAMES_TELEMETRY_DISABLED is read by no version
export DO_NOT_TRACK=1                  # the second opt-out the CLI honours
export HYPERFRAMES_NO_UPDATE_CHECK=1   # no npm "latest" lookup and no silent self-install
export HYPERFRAMES_NO_AUTO_INSTALL=1
export HYPERFRAMES_SKIP_SKILLS=1       # init otherwise checks its AI skills against GitHub
export HYPERFRAMES_FFMPEG_PATH="${FFMPEG_BIN:-/usr/local/bin/ffmpeg}"
export HYPERFRAMES_FFPROBE_PATH="$_HF_HOME/ffprobe/package/ffprobe"   # render refuses to start without ffprobe
export PRODUCER_HEADLESS_SHELL_PATH="${HEADLESS_SHELL:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}"
export HF="$_HF_HOME/cli/node_modules/.bin/hyperframes"
export HF_OFFLINE="$_HF_HOME/tools/offline.sh"   # prefix a command with "$HF_OFFLINE" to run it with no network at all
unset GEMINI_API_KEY                   # snapshot --describe (a Gemini call) runs by default when this is set
# Without these binaries HyperFrames silently downloads its own Chrome or refuses to render; fail here instead.
for _b in "$HYPERFRAMES_FFMPEG_PATH" "$PRODUCER_HEADLESS_SHELL_PATH"; do
  [ -x "$_b" ] || { echo "env.sh: missing $_b (set FFMPEG_BIN or HEADLESS_SHELL)" >&2; return 1 2>/dev/null || exit 1; }
done
