import { NextResponse } from "next/server";
import { getAuthUser, secondFactorOutstanding } from "@/lib/auth/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { classworkAvailability, getClassworkConfig, redirectUriFor } from "@/lib/classwork/config";
import { getClassworkAdapter, isClassworkProvider } from "@/lib/classwork";
import { NONCE_COOKIE, NONCE_COOKIE_PATH } from "@/lib/classwork/route-helpers";
import { newNonce, signState } from "@/lib/classwork/state";

const STATE_TTL_SECONDS = 600;

/**
 * The first hop of connecting a provider: a signed state, a nonce the browser
 * carries back in a cookie, and a top level redirect to the provider's consent
 * page. A link, not a form, because the site's CSP keeps form-action at
 * 'self'. proxy.ts never gates /api, so the session is checked here.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next")) ?? "/me/settings";
  const settings = (query: string) => NextResponse.redirect(new URL(`/me/settings?classwork=${query}`, url.origin));

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url.origin));
  }
  if (await secondFactorOutstanding()) {
    return NextResponse.redirect(new URL(`/login/verify?next=${encodeURIComponent(next)}`, url.origin));
  }
  if (!isClassworkProvider(provider) || !classworkAvailability()[provider]) return settings("unavailable");

  const config = getClassworkConfig();
  const secret = config.CLASSWORK_STATE_SECRET;
  if (!secret) return settings("unavailable");

  const nonce = newNonce();
  const state = signState({ uid: user.id, provider, nonce, iat: Date.now(), next }, secret);
  const adapter = getClassworkAdapter(provider);
  const consent = adapter.authorizeUrl({
    state,
    redirectUri: redirectUriFor(provider),
    instanceUrl: provider === "canvas" ? config.CANVAS_INSTANCE_URL : undefined,
  });

  const response = NextResponse.redirect(consent, 302);
  response.cookies.set({
    name: NONCE_COOKIE,
    value: nonce,
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: NONCE_COOKIE_PATH,
    maxAge: STATE_TTL_SECONDS,
  });
  return response;
}
