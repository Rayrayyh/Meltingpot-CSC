import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { usingClerk } from "@/lib/auth/provider";

/**
 * Mirrors whether the signed in person has a second factor into Clerk's
 * public metadata, where the session token template can read it as the
 * `two_factor` claim (docs/CLERK.md step 1.6). Clerk's token has no claim of
 * its own for this, and public metadata is only ever written from a server,
 * so the claim says what Clerk's own record says: the value comes from the
 * Backend API, never from the caller. The browser half calls this after
 * turning the factor on or off and after every sign in, then refreshes its
 * token so the next request carries the truth. Clerk only.
 */
export async function POST() {
  if (!usingClerk()) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const twoFactor = user.twoFactorEnabled === true;
  if (user.publicMetadata?.two_factor !== twoFactor) {
    await client.users.updateUserMetadata(userId, { publicMetadata: { two_factor: twoFactor } });
  }
  return NextResponse.json({ two_factor: twoFactor });
}
