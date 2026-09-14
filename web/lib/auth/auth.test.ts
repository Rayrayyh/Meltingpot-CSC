import { describe, expect, it } from "vitest";
import { AuthError } from "@/lib/auth/types";
import { clerkClientAuth } from "@/lib/auth/clerk-client";
import { clerkServerAuth } from "@/lib/auth/clerk-server";

/**
 * The seam's contract, independent of any provider: the Clerk half has to be
 * present and complete. If someone adds a method to the interface and forgets
 * the Clerk side, the type check fails before this does; this guards the
 * runtime shape, and the one thing the browser half promises without Clerk
 * loaded, which is to say so rather than hang.
 */
describe("auth provider seam", () => {
  it("names both halves of the Clerk provider", () => {
    expect(clerkServerAuth.name).toBe("clerk");
    expect(clerkClientAuth.name).toBe("clerk");
  });

  const serverMethods = ["getUser", "getVerifiedSecondFactorId", "getAssuranceLevel"] as const;
  const clientMethods = [
    "getUserId",
    "register",
    "signIn",
    "signOut",
    "changePassword",
    "verifySecondFactor",
    "beginSecondFactorSetup",
    "completeSecondFactorSetup",
    "cancelSecondFactorSetup",
    "removeSecondFactor",
  ] as const;

  it("implements every method on both halves", () => {
    for (const method of serverMethods) expect(typeof clerkServerAuth[method]).toBe("function");
    for (const method of clientMethods) expect(typeof clerkClientAuth[method]).toBe("function");
  });

  it("browser half refuses outside a browser, with the seam's own error", async () => {
    // Vitest runs in Node: no window, so no Clerk. The answer is an AuthError
    // naming the configuration, not a hang waiting for a script that never loads.
    await expect(clerkClientAuth.signOut()).rejects.toMatchObject({
      name: "AuthError",
      code: "not_configured",
    });
    await expect(clerkClientAuth.signOut()).rejects.toBeInstanceOf(AuthError);
  });
});
