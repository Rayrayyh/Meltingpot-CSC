# Launch film composition

Follow docs/videos/template/PROMPT.md (step 2), not HyperFrames' bundled workflows: one index.html, one stage, one paused
window.__timelines["main"], every time-derived state driven by one apply(t) driver tween. Source ../env.sh (or the
template's env.sh) before any hyperframes command. Never run publish, feedback, cloud, lambda, cloudrun, auth, capture,
tts, transcribe or "snapshot --describe"; they upload or call paid APIs. Run renders under $HF_OFFLINE so a remote
dependency fails loudly instead of being fetched.
