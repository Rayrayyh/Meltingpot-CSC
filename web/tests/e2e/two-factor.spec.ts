import { createHmac } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/**
 * RFC 6238 TOTP from a base32 secret. The test plays the part of the
 * authenticator app so the whole second step can be exercised for real.
 */
function totp(secret: string, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) {
    const index = alphabet.indexOf(ch);
    if (index < 0) continue;
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes = Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("maya@meltingpot.dev");
  await page.getByLabel("Password", { exact: true }).fill("MeltingPot-dev1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("two-step sign in: enrol, gate the next sign in, then turn it off", async ({
  page,
}) => {
  test.slow();

  await signIn(page);
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
  await page.goto("/me/settings");
  await page.getByRole("button", { name: "Set up two-step sign in" }).click();

  // The setup step offers both ways in: scan the square or type the key.
  await expect(page.getByRole("img", { name: /scannable square/i })).toBeVisible({
    timeout: 15_000,
  });
  const secret = (await page.locator("code").first().innerText()).trim();
  expect(secret).toMatch(/^[A-Z2-7]{16,}$/);

  await page.getByLabel(/six-digit code/i).fill(totp(secret));
  await page.getByRole("button", { name: "Turn on two-step sign in" }).click();
  await expect(page.getByText("Two-step sign in is on")).toBeVisible({ timeout: 15_000 });

  // From here the seed owner has a factor. Whatever fails below, the finally
  // takes it off again: dev_seed is the only other thing that would, and a
  // maya locked behind a code stops every other spec at sign in.
  try {
    // Signing in again stops for the code instead of opening the dashboard.
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });

    await signIn(page);
    await expect(page.getByRole("heading", { name: "One more step" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).not.toHaveURL(/\/home/);

    // A wrong code is refused, and the right one is accepted.
    await page.getByLabel(/six-digit code/i).fill("000000");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel(/six-digit code/i).fill(totp(secret));
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 20_000 });
  } finally {
    await removeFactor(page, secret);
  }
});

/**
 * Leaves the account as it was found. Reaches settings from wherever the
 * test stopped: signed out, or stopped at the code step.
 */
async function removeFactor(page: Page, secret: string) {
  await page.goto("/me/settings");
  if (/\/login/.test(page.url())) {
    if (!/\/login\/verify/.test(page.url())) await signIn(page);
    const codeField = page.getByLabel(/six-digit code/i);
    if (await codeField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await codeField.fill(totp(secret));
      await page.getByRole("button", { name: "Continue" }).click();
    }
    await page.goto("/me/settings");
  }
  const turnOff = page.getByRole("button", { name: "Turn off" });
  if (!(await turnOff.isVisible({ timeout: 5_000 }).catch(() => false))) return;
  await turnOff.click();
  await page.getByRole("button", { name: "Turn it off" }).click();
  await expect(page.getByRole("button", { name: "Set up two-step sign in" })).toBeVisible({
    timeout: 15_000,
  });
}
