# Authentication

MeltingPot signs people in with an email and a password, and offers a second
step with an authenticator app to anyone who runs a Pot. Supabase Auth does the
work today. Clerk is the intended replacement, and the code is arranged so that
swap is an implementation, not an excavation.

## The seam

Everything the app needs from an identity provider lives in `web/lib/auth`,
described in the product's own words rather than any one vendor's:

| File | What it is |
|---|---|
| `types.ts` | The contract: `AuthUser`, `SignInOutcome`, `AuthError`, and the two provider interfaces |
| `supabase-server.ts` | Reading identity from the request. The live implementation |
| `supabase-client.ts` | Session lifecycle in the browser. The live implementation |
| `clerk-server.ts`, `clerk-client.ts` | Clerk behind the same seam, built 2026-09-05 and inert until selected. `docs/CLERK.md` has the switch |
| `provider.ts` | The one place that reads `NEXT_PUBLIC_AUTH_PROVIDER` |
| `server.ts` | Server entry point: `getAuthUser`, `requireAuthUser`, `getVerifiedSecondFactorId` |
| `client.ts` | Browser entry point: `getClientAuth()` |

The server and client halves are separate interfaces on purpose. The server
reads identity from the request; the browser drives sign in, sign out, and
second-factor setup. Keeping them apart stops server-only code (`next/headers`)
leaking into the client bundle.

Selection is one environment variable, matching the organizer seam:

```
NEXT_PUBLIC_AUTH_PROVIDER=        # unset or "supabase" (default)
NEXT_PUBLIC_AUTH_PROVIDER=clerk   # selects lib/auth/clerk-*.ts; needs the Clerk keys, see docs/CLERK.md
```

## Using it

Server components and route handlers:

```ts
import { getAuthUser, requireAuthUser } from "@/lib/auth/server";

const user = await getAuthUser();        // AuthUser | null
const user = await requireAuthUser();    // AuthUser, or redirects to /login
```

`requireUser()` and `getUser()` in `lib/data/user.ts` are thin wrappers over
these and remain the usual entry point for pages.

Client components:

```ts
import { getClientAuth } from "@/lib/auth/client";

const outcome = await getClientAuth().signIn({ email, password });
if (outcome.status === "second-factor-required") {
  // ask for the code, then verifySecondFactor({ factorId, code })
}
```

Failures arrive as `AuthError` with a stable `code`, never as provider message
text. `auth-form.tsx` maps codes to sentences in one place.

## Rules

- **No component or route calls `supabase.auth.*` directly.** One exception,
  marked in the file: the Supabase branch of `proxy.ts`, where route gating is
  bound up with the Supabase cookie refresh. The Clerk branch of the same file
  is `clerkMiddleware()`. Under Clerk, supabase-js refuses its own `auth.*`
  methods, so the seam is the only way to ask who is signed in.
- **New auth needs go through `types.ts` first.** Adding a method there makes
  both providers fail to compile until it is filled in, which is the point.
- **In Postgres, ask `public.current_uid()`, never `auth.uid()`.** Migration
  0054 rewrote every policy and definer function in the public schema to it, and
  0056 the six storage policies 0054's loop had not looked at, so a Clerk
  subject can be a person; a new migration that says `auth.uid()` works for
  Supabase sessions and silently fails for Clerk ones.

## Swapping in Clerk

Built on 2026-09-05 as far as the code and the database go (decision 041).
What remains is the Clerk application, Supabase's third-party auth setting, the
two keys and a redeploy, listed step by step in `docs/CLERK.md`. The one thing
outside anyone's afternoon is a domain: Clerk's production instance needs DNS
records the netlify.app subdomain cannot carry.

## What was removed

Google sign in via Supabase OAuth was built and then taken out at the owner's
direction, along with its callback route, button, and setup guide. Nothing of
it remains except migration `0019_oauth_display_name.sql`, which is kept
deliberately: it teaches `handle_new_user` to read the name fields that
third-party providers actually send, which is a general improvement and exactly
what a future Clerk integration needs.
