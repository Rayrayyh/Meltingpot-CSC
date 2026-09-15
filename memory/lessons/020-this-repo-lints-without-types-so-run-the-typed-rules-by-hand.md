# 020 This repo lints without types, so run the typed rules by hand

Summary: `eslint.config.mjs` is eslint-config-next only, which has no type-aware rules, so `no-floating-promises` never runs and an unhandled rejection in an effect is invisible to every gate. Pointing eslint at a throwaway typed config found two real ones in a minute. Learned 2026-09-15 during a bug pass.

## What is missing

`pnpm lint`, `pnpm typecheck`, `pnpm test:unit` and `pnpm build` all pass on a
`.then()` with no rejection handler. The rules that catch it need the type
checker, and the config does not turn them on. That matters here because the
app is full of effects that fetch: a rejected fetch inside one leaves the
component in whatever state it was in and says nothing, in production silently.

## How to run them

`@typescript-eslint` is already in the store as a dependency of
eslint-config-next, but pnpm's layout means it does not resolve by name.
Resolve the real paths and write a config outside the repo:

```bash
cd web
PLUG=$(ls -d node_modules/.pnpm/@typescript-eslint+eslint-plugin@*/node_modules/@typescript-eslint/eslint-plugin | head -1)
PARS=$(ls -d node_modules/.pnpm/@typescript-eslint+parser@*/node_modules/@typescript-eslint/parser | head -1)
```

with a flat config importing `$PWD/$PLUG/dist/index.js` and
`$PWD/$PARS/dist/index.js`, `parserOptions.project` pointed at the real
tsconfig, and then:

```bash
pnpm exec eslint --no-config-lookup --config /tmp/typed.mjs \
  "app/**/*.ts" "app/**/*.tsx" "lib/**/*.ts" "components/**/*.tsx"
```

Worth turning on: `no-floating-promises`, `no-misused-promises`,
`await-thenable`. `no-unnecessary-condition` is worth a look but is mostly
noise in this repo, because `noUncheckedIndexedAccess` is off: every defensive
`if (x === undefined)` after an index access reads as "types have no overlap"
while being exactly right at runtime.

The mirror of that is the useful part. Running `tsc --noEmit
--noUncheckedIndexedAccess` lists every unguarded index access, 161 of them,
and most are safe (a regex capture group that must exist, `"".split(",")[0]`).
Read them for the ones inside a loop over provider data, not as a list to fix.

## What it found

Two floating promises, both real and both user facing. A rejected peek in the
study workspace left the setup screen saying "Checking what the Pot already
has" for the rest of the session. A prefill loop in the composer took each
classwork link off the chip list before awaiting the insert, so a throw lost
the remaining links outright with nothing to retry them.

Both were fixed in the same pass. Neither would have been caught by any gate
the repo runs.
