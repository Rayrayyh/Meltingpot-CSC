# 021 A rejected play() is usually an abort, not a refusal

Summary: `video.play()` returns a promise that rejects for two very different reasons, and treating both as "the browser said no" makes a player tear its own controls off a film that is playing correctly. Learned 2026-09-18 building the landing page demo player.

## The shape of the bug

The first draft of `components/landing/demo-player.tsx` did this:

```ts
void node.play().then(
  () => setPlaying(true),
  () => setStarted(false),   // back to the "Watch the demo" pill
);
```

The reasoning was "a rejected play leaves the pill where it was rather than a
dead frame", which is right for exactly one of the two rejections.

`play()` rejects with `NotAllowedError` when the autoplay policy refuses, and
with `AbortError` when something interrupts the attempt before the first frame
arrives: a `pause()`, a seek, or a new load. It also rejects with
`NotSupportedError` when the file cannot be decoded at all.

This `start()` runs inside a click handler, so the gesture requirement is
already satisfied and `NotAllowedError` is close to unreachable. The rejection
that actually fires in the wild is `AbortError`, from somebody pressing pause
while the film is still buffering. The handler then threw away `started`,
which unmounted the whole control bar and put the pill back over a film that
had done exactly what it was told.

## The rule

Decide what a rejection means from where the call is, not from the fact that
it rejected.

- Inside a user gesture, a rejection is almost always an abort. Stay in the
  started state, drop to paused, and let the person press play again.
- `onError` on the element is the honest signal for "this will not play at
  all", because it fires for a 404, a codec the browser refuses and a corrupt
  file alike. That, and only that, should tear the player back down.
- A muted autoplay attempt outside a gesture is the one case where a rejection
  really does mean refused, and there the fallback belongs.

## While in there

Three smaller things in the same family, all of them "our state and the
element's state are two different truths":

- `muted` drifts unless you listen for `volumechange`. Native controls appear
  inside fullscreen on iOS even when the page draws its own.
- A `<track>`'s `mode` is the truth about captions. A button holding its own
  boolean will announce the opposite of reality as soon as anything else
  changes the mode.
- Resetting your own `currentTime` state on `ended` does not rewind the
  element. The poster does not come back, so the resting frame is the last
  frame of the film.
