import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { getClassworkConfig, redirectUriFor } from "@/lib/classwork/config";
import { getClassworkAdapter, isClassworkProvider } from "@/lib/classwork";
import { verifyState } from "@/lib/classwork/state";
import { ClassworkError } from "@/lib/classwork/types";
import { NONCE_COOKIE, NONCE_COOKIE_PATH, serverKey, siteOrigin } from "@/lib/classwork/route-helpers";
import { supabaseServer } from "@/lib/supabase/server";

export const maxDuration = 26;
const EXCHANGE_BUDGET_MS = 12_000;

/**
 * The provider sends the browser back here with a code. Before the code is
 * worth anything: the state must carry this session's signature, be young,
 * name this person and this provider, and match the nonce the browser set out
 * with. Then the code becomes a refresh token, the course list is fetched
 * once so settings can open without a provider call, and lms_connect puts the
 * token in Vault behind the server key. Nothing token shaped is ever in a URL
 * the browser sees, and the reply is a redirect with a one word outcome.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = request.nextUrl;
  const origin = siteOrigin(request);
  const back = (query: string, next = "/me/settings") =>
    NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}${query}#connected-classes`, origin));

  const user = await getAuthUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/me/settings", origin));
  if (!isClassworkProvider(provider)) return back("classwork=unavailable");

  const secret = getClassworkConfig().CLASSWORK_STATE_SECRET;
  if (!secret) return back("classwork=unavailable");

  const clearNonce = (response: NextResponse) => {
    response.cookies.set({ name: NONCE_COOKIE, value: "", maxAge: 0, path: NONCE_COOKIE_PATH });
    return response;
  };

  const denied = url.searchParams.get("error");
  if (denied) return clearNonce(back("classwork=denied"));

  const stateToken = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const verified = verifyState(stateToken, secret);
  if (!verified.ok) return clearNonce(back(verified.reason === "expired" ? "classwork=expired" : "classwork=failed"));
  const state = verified.payload;
  const next = safeNextPath(state.next) ?? "/me/settings";
  const nonce = (await cookies()).get(NONCE_COOKIE)?.value;
  if (state.uid !== user.id || state.provider !== provider || !nonce || nonce !== state.nonce || !code) {
    return clearNonce(back("classwork=failed", next));
  }

  const deadlineAt = Date.now() + EXCHANGE_BUDGET_MS;
  const adapter = getClassworkAdapter(provider);
  const instanceUrl = provider === "canvas" ? getClassworkConfig().CANVAS_INSTANCE_URL : undefined;
  try {
    const connected = await adapter.exchangeCode({
      code,
      redirectUri: redirectUriFor(provider),
      instanceUrl,
      deadlineAt,
    });
    const courses = await adapter.listCourses({ accessToken: connected.accessToken, instanceUrl, deadlineAt });
    const supabase = await supabaseServer();
    const { error } = await supabase.rpc("lms_connect", {
      p_provider: provider,
      p_instance_url: instanceUrl ?? null,
      p_external_user_id: connected.externalUserId,
      p_external_display: connected.externalDisplay,
      p_refresh_token: connected.refreshToken,
      p_scopes: connected.scopes,
      p_courses: courses as unknown as import("@/lib/database.types").Json,
      p_server_key: serverKey(),
    });
    if (error) {
      console.error("lms_connect failed", error.message);
      return clearNonce(back("classwork=failed", next));
    }
    return clearNonce(back(`connected=${provider}`, next));
  } catch (error) {
    if (error instanceof ClassworkError) console.error("classwork connect failed", error.code, error.message);
    else console.error("classwork connect failed", error);
    return clearNonce(back("classwork=failed", next));
  }
}
