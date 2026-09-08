#!/usr/bin/env node
// Moves the existing accounts into a Clerk instance with their password hashes,
// so nobody resets anything at the switch (docs/CLERK.md step 4).
//
//   CLERK_SECRET_KEY=sk_live_... node scripts/import-clerk-users.mjs users.json
//
// users.json is what the export query in docs/CLERK.md step 4 produces: one
// object per account with id (the profile uuid), email, password_digest (the
// bcrypt hash from auth.users), created_at, display_name and, for anyone with
// a verified authenticator app, totp_secret. Either the bare array or the SQL
// editor's copy of the whole result (a row wrapping it under "users") is
// accepted. The script creates each account through Clerk's Backend API, one
// at a time, and writes mapping.sql beside users.json: the SQL that maps each
// Clerk user id back onto its profile. An account Clerk already holds (a
// second run) is looked up by email and mapped the same way.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const key = process.env.CLERK_SECRET_KEY;
if (!key) {
  console.error("Set CLERK_SECRET_KEY to the instance's secret key first.");
  process.exit(1);
}
const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-clerk-users.mjs users.json > mapping.sql");
  process.exit(1);
}

let users = JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
// The SQL editor's "copy as JSON" wraps the cell: [{ "users": [...] }].
if (Array.isArray(users) && users.length === 1 && Array.isArray(users[0]?.users)) users = users[0].users;
if (!Array.isArray(users) && Array.isArray(users?.users)) users = users.users;
if (!Array.isArray(users)) {
  console.error("users.json must hold the array the export query returns.");
  process.exit(1);
}
const out = process.argv[3] ?? join(dirname(file), "mapping.sql");
const lines = [];

const API = "https://api.clerk.com/v1";
const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findByEmail(email) {
  const res = await fetch(`${API}/users?email_address=${encodeURIComponent(email)}&limit=1`, { headers });
  if (!res.ok) return null;
  const list = await res.json();
  return Array.isArray(list) && list[0]?.id ? list[0] : null;
}

let made = 0;
let mapped = 0;
let failed = 0;
for (const u of users) {
  if (!u.id || !u.email || !u.password_digest) {
    console.error(`skipped, missing a field: ${JSON.stringify({ id: u.id, email: u.email })}`);
    failed += 1;
    continue;
  }
  const body = {
    email_address: [u.email],
    password_digest: u.password_digest,
    password_hasher: "bcrypt",
    skip_password_checks: true,
    external_id: u.id,
    unsafe_metadata: { displayName: (u.display_name ?? "").slice(0, 80) },
    created_at: u.created_at,
  };
  if (u.totp_secret) body.totp_secret = u.totp_secret;

  const res = await fetch(`${API}/users`, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  let clerkId = json?.id;
  if (!res.ok) {
    const code = json?.errors?.[0]?.code ?? "";
    if (code === "form_identifier_exists") {
      const existing = await findByEmail(u.email);
      if (existing) {
        clerkId = existing.id;
        console.error(`${u.email}: already in Clerk as ${clerkId}`);
      }
    }
    if (!clerkId) {
      console.error(`${u.email}: ${res.status} ${JSON.stringify(json?.errors ?? json)}`);
      failed += 1;
      await pause(300);
      continue;
    }
  } else {
    made += 1;
    console.error(`${u.email}: created ${clerkId}${u.totp_secret ? " (authenticator carried over)" : ""}`);
  }
  lines.push(`update public.profiles set clerk_id = '${clerkId}' where id = '${u.id}';`);
  // The account now signs in through Clerk; its Supabase Auth row must not
  // stay a second door beside Clerk's second factor (0057 did this for the
  // first ten). Banned rather than deleted: deleting it would fire the
  // trigger that removes the profile.
  lines.push(`update auth.users set banned_until = 'infinity' where id = '${u.id}';`);
  lines.push(`delete from auth.sessions where user_id = '${u.id}';`);
  mapped += 1;
  // The Backend API allows 1000 requests per 10 seconds on production; this
  // is nowhere near it, but a small gap keeps the log readable.
  await pause(300);
}
writeFileSync(out, lines.join("\n") + (lines.length ? "\n" : ""));
console.error(`\n${made} created, ${mapped} mapped, ${failed} failed, of ${users.length}. Mapping written to ${out}.`);
process.exit(failed ? 2 : 0);
