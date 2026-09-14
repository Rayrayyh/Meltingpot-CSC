import { expect, test } from "@playwright/test";

const INVALID_MESSAGE = "We couldn't find that Pot. Check the code and try again.";

test.describe("joining a Pot", () => {
  test("invalid code shows the error and keeps the input", async ({ page }) => {
    await page.goto("/join");
    await page.getByLabel("Enter class code").fill("zzzzzz");
    await page.getByRole("button", { name: "Join Pot" }).click();
    await expect(page.getByText(INVALID_MESSAGE)).toBeVisible();
    await expect(page.getByLabel("Enter class code")).toHaveValue("ZZZZZZ");
    await expect(page).toHaveURL("/join");
  });

  test("a stranger joins with a code, sees the Pot, signs in, lands inside", async ({
    page,
  }) => {
    await page.goto("/join");
    await page.getByLabel("Enter class code").fill("5r22ax");
    await page.getByRole("button", { name: "Join Pot" }).click();

    // Pot preview before any authentication. This is the product rule: the
    // code shows the Pot, and only then does anyone ask who you are.
    await expect(page).toHaveURL(/\/join\/5R22AX/);
    await expect(page.getByText("You found")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Biology 101" })).toBeVisible();
    await expect(page.getByText(/\d+ members/)).toBeVisible();

    // Signing in rather than signing up: sign_up_student is closed to
    // browsers now that Clerk owns sign up (0060), so the seed carries a
    // person who belongs to no Pot for exactly this walk. What is under test
    // is unchanged, that authenticating from a code finalizes the membership
    // and opens the Pot with no login wall in the way.
    await page.getByRole("link", { name: "I already have an account" }).click();
    await expect(
      page.getByRole("heading", { name: "Sign in to keep your spot" }),
    ).toBeVisible();
    await expect(page.getByText("Biology 101 is waiting for you.")).toBeVisible();

    await page.getByLabel("Email").fill("joiner@meltingpot.dev");
    await page.getByLabel("Password", { exact: true }).fill("MeltingPot-dev1");
    await page.getByRole("button", { name: "Sign in and open Pot" }).click();

    // Membership finalized; straight into the Pot, no login wall, no detours.
    await expect(page).toHaveURL(/\/p\//, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Biology 101" }),
    ).toBeVisible();
  });

  test("an existing member entering the same code just returns to the Pot", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("ava@meltingpot.dev");
    await page.getByLabel("Password", { exact: true }).fill("MeltingPot-dev1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });

    await page.goto("/join/5R22AX");
    await expect(page.getByText("Welcome back to")).toBeVisible();
    await page.getByRole("button", { name: "Open Pot" }).click();
    await expect(page).toHaveURL(/\/p\//, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Biology 101" })).toBeVisible();
  });

  test("signed-out users are redirected from protected routes to login", async ({
    page,
  }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?next=/);
  });
});
