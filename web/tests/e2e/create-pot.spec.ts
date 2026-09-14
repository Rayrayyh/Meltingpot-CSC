import { expect, test } from "@playwright/test";

/**
 * The seeded person who belongs to no Pot. The suite used to sign a new
 * account up here, which needed sign_up_student open to the anon key; that
 * door is Clerk's now and closed to browsers (0060), so the seed carries a
 * fixture in the state this spec actually needs instead.
 */
const NEWCOMER = "newcomer@meltingpot.dev";

test("creating a Pot generates a code and opens the empty Pot", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(NEWCOMER);
  await page.getByLabel("Password", { exact: true }).fill("MeltingPot-dev1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
  await expect(page.getByText("Join your first Pot")).toBeVisible();

  await page.getByRole("link", { name: "Create a Pot" }).first().click();
  await expect(page).toHaveURL(/\/pots\/new/);
  await page.getByLabel("Pot name").fill("History 7");
  await page
    .getByLabel("What is this Pot for? (optional)")
    .fill("Everything for seventh grade history.");
  await page.getByRole("button", { name: "Create Pot" }).click();

  await expect(page.getByText("Your Pot is ready")).toBeVisible();
  const codeBlock = page.locator("div.font-mono");
  await expect(codeBlock).toHaveText(/^[A-Z0-9]{6}$/);

  await page.getByRole("button", { name: "Copy code" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  await page.getByRole("link", { name: "Open your Pot" }).click();
  await expect(page).toHaveURL(/\/p\//);
  await expect(page.getByRole("heading", { name: "History 7" })).toBeVisible();

  // A brand-new Pot greets its owner with the empty state.
  await expect(page.getByText("Nothing in the pot yet")).toBeVisible();
  await expect(
    page.getByText("Be the first. Write it however it comes to you."),
  ).toBeVisible();

  // Hand the fixture back as it was found. dev_seed does not know about this
  // Pot, so without this the newcomer owns one and the next run never sees
  // the empty dashboard above. Deleting it is a product flow of its own, so
  // the tidy-up is also the only coverage Pot deletion has.
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Delete Pot", exact: true }).click();
  await page.getByLabel("Type History 7 to confirm").fill("History 7");
  await page.getByRole("button", { name: "Delete Pot permanently" }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
  await expect(page.getByText("Join your first Pot")).toBeVisible();
});
