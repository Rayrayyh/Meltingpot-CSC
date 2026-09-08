import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { usingClerk } from "@/lib/auth/provider";

// Every signed-in surface. A route missing from this list still redirects,
// because requireAuthUser guards the page itself, but it loses the two things
// the edge adds: the ?next= that returns you where you were after signing in,
// and the second-factor bounce before the page renders at all.
const PROTECTED_PREFIXES = [
  "/home",
  "/p/",
  "/me",
  "/pots",
  "/search",
  "/study",
  "/calendar",
];

// Signed-in pages whose path is also the start of a public one: /join is the
// signed-in join page, /join/<code> is the preview anyone may see.
const PROTECTED_EXACT = ["/join"];

function isProtected(pathname: string) {
  if (PROTECTED_EXACT.includes(pathname)) return true;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
  );
}

/** The sign in page, remembering where the person was going, query included. */
function toSignIn(request: NextRequest, pathname: "/login" | "/login/verify") {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  // The query travels too: a composer opened from an assignment carries
  // ?from=, and losing it on the way through sign in loses the prefill.
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

/** Refreshes the Supabase session cookie and gates signed-in routes. */
async function supabaseProxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // The one auth call outside lib/auth. Route gating is bound up with the
  // Supabase cookie refresh above, so it cannot go behind the seam without
  // dragging the cookie plumbing with it. Under Clerk this whole function is
  // replaced by clerkProxy below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) return toSignIn(request, "/login");

  // A password alone reaches aal1. An account carrying a verified factor is
  // only half signed in until a code clears it, and until this check existed
  // that half-session had the same authority as a whole one: the pause lived
  // in React state, so reloading walked straight past it. The assurance level
  // is read from the session that getUser() just refreshed, so this costs no
  // extra round trip.
  if (user && isProtected(pathname) && pathname !== "/login/verify") {
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance?.currentLevel === "aal1" && assurance.nextLevel === "aal2") {
      return toSignIn(request, "/login/verify");
    }
  }

  return response;
}

/**
 * Clerk keeps its own session cookie fresh and reads it here; the gate is the
 * same list of prefixes. Clerk will not open a session for an enrolled
 * account until its factor has cleared, so the half signed in session has one
 * cause here: the factor was turned on inside it. The session token says so
 * (two_factor, the claim docs/CLERK.md step 1.6 adds from the metadata that
 * app/api/auth/second-factor mirrors, and fva[1] of -1 for a factor never
 * cleared), and such a session goes to the verify step the same way the
 * Supabase branch sends its aal1 sessions. requireAuthUser makes the same
 * check from the Backend API for a token without the claim.
 */
const clerkProxy = () =>
  clerkMiddleware(async (auth, request) => {
    const { pathname } = request.nextUrl;
    if (!isProtected(pathname)) return NextResponse.next();
    const { userId, sessionClaims } = await auth();
    if (!userId) return toSignIn(request, "/login");
    if (pathname !== "/login/verify") {
      const claims = sessionClaims as { two_factor?: unknown; fva?: [number, number] } | null;
      const enrolled = claims?.two_factor === "true" || claims?.two_factor === true;
      const cleared = !Array.isArray(claims?.fva) || claims.fva[1] >= 0;
      if (enrolled && !cleared) return toSignIn(request, "/login/verify");
    }
    return NextResponse.next();
  });

export const proxy = usingClerk() ? clerkProxy() : supabaseProxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
