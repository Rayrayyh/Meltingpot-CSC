# 023 A production build only talks to the production Supabase, so a local stack goes through the rewrite

Summary: `next.config.ts` writes the production project's origin into the content security policy by hand, and the policy is only sent by a production build. So `pnpm build` + `next start` pointed straight at a local Supabase stack loads fine and then fails every browser call to it. Point the browser at the same-origin rewrite instead, the pair from lesson 004.

## What it looked like (2026-10-02)

A local stack on `http://127.0.0.1:54321`, the app built with `NEXT_PUBLIC_SUPABASE_URL` set to that address and `SUPABASE_REWRITE_ORIGIN` empty, then `next start -p 3111`. Pages that read on the server were fine. The first thing the browser asked for itself, the class code lookup on `/join`, said:

```
Something went wrong checking that code. Try again.
```

The same RPC called with curl answered normally (`null` for a code that doesn't exist, the Pot for one that does), so the database was never the problem. The response header was:

```
connect-src 'self' https://evcfmwxzxwmeiczfupsw.supabase.co wss://evcfmwxzxwmeiczfupsw.supabase.co
```

`SUPABASE_ORIGIN` is a constant in `next.config.ts`, not read from the environment, and the header is only added when `NODE_ENV` is production. That's why `pnpm dev` against the same stack worked and the e2e suite never sees it.

## The fix

Build and start with the rewrite pair, so the browser only ever talks to its own origin:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3111/supabase
SUPABASE_REWRITE_ORIGIN=http://127.0.0.1:54321
```

Both are read at build time, so set them for `pnpm build`, not just for `next start`. With that, all 12 landing e2e tests passed against the production build.

Two things to keep in mind. `web/.env.local` points at the production project, and `@next/env` only fills a key from it when the process doesn't already have that key, so pass every Supabase variable explicitly (empty counts as set). And don't edit the constant to make a local run work: production is the only place that policy is for.
