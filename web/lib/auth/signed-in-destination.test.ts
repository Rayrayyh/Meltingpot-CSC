import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { signedInDestination } from "@/lib/auth/signed-in-destination";

/** A client that answers the two functions the helper asks, and logs the asks. */
function fake(answers: { member?: boolean | null; potId?: string | null }) {
  const calls: string[] = [];
  const client = {
    rpc: async (fn: string) => {
      calls.push(fn);
      if (fn === "lookup_pot_by_code") {
        return { data: answers.member === null ? null : { is_member: answers.member }, error: null };
      }
      if (fn === "join_pot_with_code") return { data: answers.potId ?? null, error: null };
      return { data: null, error: null };
    },
  } as unknown as SupabaseClient<Database>;
  return { client, calls };
}

describe("signedInDestination", () => {
  it("sends a member straight into their Pot", async () => {
    const { client, calls } = fake({ member: true, potId: "pot-1" });
    expect(await signedInDestination(client, "ABC123")).toBe("/p/pot-1");
    expect(calls).toEqual(["lookup_pot_by_code", "join_pot_with_code"]);
  });

  it("shows anyone else the preview and writes nothing", async () => {
    const { client, calls } = fake({ member: false });
    expect(await signedInDestination(client, "ABC123")).toBe("/join/ABC123");
    expect(calls).toEqual(["lookup_pot_by_code"]);
  });

  it("previews a code the lookup does not know rather than guessing", async () => {
    const { client } = fake({ member: null });
    expect(await signedInDestination(client, "ZZZZZZ")).toBe("/join/ZZZZZZ");
  });

  it("ignores a code of the wrong length and follows a safe next", async () => {
    const { client, calls } = fake({ member: true, potId: "pot-1" });
    expect(await signedInDestination(client, "ABC12", "/calendar")).toBe("/calendar");
    expect(calls).toEqual([]);
  });

  it("refuses an off-site next", async () => {
    const { client } = fake({});
    expect(await signedInDestination(client, "", "//evil.test/x")).toBe("/home");
    expect(await signedInDestination(client, "", "https://evil.test")).toBe("/home");
  });

  it("goes home with nothing to go on", async () => {
    const { client } = fake({});
    expect(await signedInDestination(client, "")).toBe("/home");
  });
});
