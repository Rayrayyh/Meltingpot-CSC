import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("MeltingPot-dev1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
}

test.describe("role-based dashboard", () => {
  test("a member sees their study desk, never the review module", async ({ page }) => {
    await loginAs(page, "ava@meltingpot.dev");

    // Never the maintainer module.
    await expect(page.getByText("Waiting on your review")).toHaveCount(0);

    // Her unfinished draft is one tap away.
    await expect(page.getByText("Pick up where you left off")).toBeVisible();
    await expect(page.getByText(/photosynthesis rough notes/)).toBeVisible();
    await expect(page.getByText("Resume draft")).toBeVisible();

    // Pot card with stats.
    await expect(page.getByRole("main").getByRole("link", { name: "Biology 101", exact: true })).toBeVisible();
    await expect(page.getByText(/\d+ notes/).first()).toBeVisible();

    // Cross-Pot activity rail.
    await expect(page.getByText("New in your Pots")).toBeVisible();
    await expect(page.getByText("What exam 1 covers").first()).toBeVisible();
  });

  test("Continue deep-links to the last note the member opened", async ({ page }) => {
    await loginAs(page, "ava@meltingpot.dev");
    await page.getByRole("main").getByRole("link", { name: "Biology 101", exact: true }).click();
    await expect(page).toHaveURL(/\/p\//);
    // The last-seen write is a server action posted from the note page; wait
    // for it to be answered before leaving, or the dashboard has nothing new.
    const lastSeen = page.waitForResponse(
      (r) => r.request().method() === "POST" && /\/n\//.test(r.url()),
      { timeout: 15_000 },
    );
    await page.getByText("The cell cycle and its checkpoints").first().click();
    await expect(page).toHaveURL(/\/n\//);
    await expect(
      page.getByRole("heading", { name: "The cell cycle and its checkpoints" }),
    ).toBeVisible({ timeout: 15_000 });
    await lastSeen.catch(() => null);

    await page.goto("/home");
    const continueLink = page.getByRole("link", {
      name: /Continue: The cell cycle and its checkpoints/,
    });
    // The last-seen write happens client-side on the note page; reload until
    // the dashboard reflects it rather than racing the write.
    await expect(async () => {
      await page.reload();
      await expect(continueLink).toBeVisible({ timeout: 2_500 });
    }).toPass({ timeout: 20_000 });
    await continueLink.click();
    await expect(page).toHaveURL(/\/n\//);
    await expect(
      page.getByRole("heading", { name: "The cell cycle and its checkpoints" }),
    ).toBeVisible();
  });

  test("a maintainer leads with corrections waiting across their Pots", async ({
    page,
  }) => {
    await loginAs(page, "maya@meltingpot.dev");

    await expect(page.getByText(/1 correction is waiting on you/)).toBeVisible();
    await expect(page.getByText("Waiting on your review")).toBeVisible();
    // The alert line and the queue row both link the proposal; the queue
    // row is the one whose href reviews it.
    const queueItem = page.locator('a[href*="/review/"]', { hasText: "Osmosis and tonicity" }).first();
    await expect(queueItem).toBeVisible();

    await queueItem.click();
    await expect(page).toHaveURL(/\/review\//);
    await expect(page.getByText("Current version", { exact: true })).toBeVisible();
    await expect(page.getByText("Suggested version", { exact: true })).toBeVisible();
    await expect(page.getByText(/net movement/).first()).toBeVisible();
  });

  test("the review queue is not reachable for plain members", async ({ page }) => {
    await loginAs(page, "ava@meltingpot.dev");
    await page.getByRole("main").getByRole("link", { name: "Biology 101", exact: true }).click();
    await expect(page).toHaveURL(/\/p\//);
    const potId = page.url().split("/p/")[1].split("/")[0];

    // The nav offers no Admin entry to members. Matched loosely on purpose:
    // the link carries a waiting count, so an exact name would pass even if
    // the entry came back.
    await expect(page.getByRole("link", { name: /^Admin/ })).toHaveCount(0);

    // And direct navigation lands on the not-found page, never a hidden one.
    // The route's loading boundary streams a 200 before notFound() runs, so
    // the page is judged by what renders, not by the status line.
    await page.goto(`/p/${potId}/admin`);
    await expect(page.getByRole("heading", { name: /melted away|not found/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Waiting on your review")).toHaveCount(0);
    // The old review URL redirects into the admin page and meets the same wall.
    await page.goto(`/p/${potId}/review`);
    await expect(page.getByRole("heading", { name: /melted away|not found/i })).toBeVisible({ timeout: 15_000 });
  });
});
