import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

/**
 * The fact lib/supabase/server.ts is built around: a Supabase client with a
 * token supplier (how Clerk's token reaches Postgres) cannot come from the ssr
 * wrapper, because that wrapper touches client.auth as it constructs and
 * supabase-js forbids exactly that once accessToken is set. If either library
 * changes its mind, this says so before a deploy does.
 */
const url = "https://example.supabase.co";
const key = "anon-key";
const accessToken = async () => "a-clerk-token";

describe("a Supabase client fed a token supplier", () => {
  it("constructs from supabase-js directly", () => {
    expect(() =>
      createClient(url, key, {
        accessToken,
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }),
    ).not.toThrow();
  });

  it("cannot come from the ssr server wrapper", () => {
    expect(() =>
      createServerClient(url, key, {
        accessToken,
        cookies: { getAll: () => [], setAll: () => undefined },
      }),
    ).toThrow(/accessToken/);
  });
});
