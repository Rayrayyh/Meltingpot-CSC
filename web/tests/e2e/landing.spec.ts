import { expect, test, type Page } from "@playwright/test";

/** Waits for the scroll position to stop moving, however it is being driven. */
async function settleScroll(page: Page) {
  let last = Number.NaN;
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY);
    if (Math.abs(y - last) < 0.5) return;
    last = y;
    await page.waitForTimeout(50);
  }
}

test.describe("brand landing", () => {
  test("the brand hero leads and code entry still validates in place", async ({ page }) => {
    await page.goto("/");
    // The landing scrolls natively: the Lenis wheel hijack was removed on
    // 2026-08-29 because owner testing found it made scrolling feel jittery.
    // Nothing may reintroduce a scroll takeover silently.
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)lenis(\s|$)/);
    await expect(
      page.getByRole("heading", { name: "Everyone takes notes. MeltingPot brings them together." }),
    ).toBeVisible();
    // The nav offers both paths: sign in and the orange get-started pill.
    const getStarted = page.getByRole("link", { name: "Get started" }).first();
    await expect(getStarted).toBeVisible();

    // Section two is the bento now, so the landing has no code field of its
    // own. Every way in points at /join, which does, and that is where the
    // code validates in place.
    await expect(page.getByLabel("Enter class code")).toHaveCount(0);
    await expect(getStarted).toHaveAttribute("href", "/join");

    await page.goto("/join");
    await page.getByLabel("Enter class code").fill("zzzzzz");
    await page.getByRole("button", { name: "Join Pot" }).click();
    await expect(
      page.getByText("We couldn't find that Pot. Check the code and try again."),
    ).toBeVisible();
    await expect(page.getByLabel("Enter class code")).toHaveValue("ZZZZZZ");
  });

  // A dead invite link used to report itself under the landing's own code
  // field. That field went with section two, so the reason now travels to the
  // page that still has one rather than vanishing.
  test("a dead invite link lands on /join with the reason", async ({ page }) => {
    await page.goto("/?code=ZZZZZZ&error=notfound");
    await expect(page).toHaveURL(/\/join\?/);
    await expect(
      page.getByText("We couldn't find that Pot. Check the code and try again."),
    ).toBeVisible();
    await expect(page.getByLabel("Enter class code")).toHaveValue("ZZZZZZ");
  });

  test("scrolling pins the melt and builds the organized note", async ({ page }) => {
    await page.goto("/");
    const stopper = page.getByTestId("scroll-stopper");
    const takeaway = page.getByText("The exam loves asking for ATP counts.");

    // Before scrolling, the organized card's pieces are hidden by the timeline.
    await expect(takeaway).not.toBeVisible();

    const stopperY = await stopper.evaluate(
      (el) => el.getBoundingClientRect().top + window.scrollY,
    );

    // Mid-scroll: the section is pinned (still on screen well past its top).
    await page.evaluate(({ y }) => window.scrollTo(0, y), { y: stopperY + 900 });
    await page.waitForTimeout(400);
    await expect(page.getByText("Rough thoughts go in. Real notes come out.")).toBeInViewport();
    await expect(page.getByRole("heading", { name: "How cells make ATP" })).toBeVisible();

    // Deep scroll: the whole organized note has melted in.
    await page.evaluate(({ y }) => window.scrollTo(0, y), { y: stopperY + 1680 });
    await page.waitForTimeout(400);
    await expect(takeaway).toBeVisible();
    await expect(page.getByText("Only you can approve what gets shared.")).toBeVisible();

    // Past the pin, the page continues to the steps section.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await expect(page.getByText("Start your Pot tonight.")).toBeVisible();
  });

  // The header once collided with itself on a phone: the wordmark and the nav
  // met at zero gap, both labels wrapped inside fixed-height controls, and the
  // page scrolled sideways. A student arriving from a text message sees this
  // header first, so it is held to a test.
  for (const width of [320, 360, 375, 414]) {
    test(`the header holds together at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto("/");

      // Nothing scrolls sideways.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBe(0);

      // Both account controls stay on one line, inside their own boxes.
      const signIn = page.getByRole("link", { name: "Sign in" });
      const pill = page.locator("header nav a").last();
      await expect(signIn).toBeVisible();
      await expect(pill).toBeVisible();
      expect((await signIn.boundingBox())!.height).toBeLessThan(30);
      expect((await pill.boundingBox())!.height).toBeLessThanOrEqual(44);

      // The mark and the nav never touch.
      const markBox = (await page.locator("header a").first().boundingBox())!;
      const navBox = (await page.locator("header nav").boundingBox())!;
      expect(navBox.x - (markBox.x + markBox.width)).toBeGreaterThanOrEqual(8);
    });
  }

  // Section two is a bento of eight tiles (2026-09-10), and each one lifts
  // into place on its own. A single Reveal around the whole grid never crossed
  // its own in-view threshold, because the grid is taller than a laptop
  // viewport, and left all eight at opacity zero, so the resting opacity is
  // held to a test rather than trusted.
  test("section two is a bento, and every tile lifts into place", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#spaces");
    // The eight headings the reference sheets carry, verbatim.
    const titles = [
      "Contributions make progress visible.",
      "Version history",
      "Calendar",
      "Collaboration",
      "Shared notes",
      "Study tools",
      "AI summaries",
      "Search",
    ];
    for (const name of titles) {
      await expect(section.getByRole("heading", { name, exact: true })).toBeVisible();
    }

    // The middle band nests two tiles inside one grid cell, so the count is
    // over the tiles themselves rather than the grid's direct children.
    const tiles = page.getByTestId("feature-bento").locator("[data-bento-tile]");
    await expect(tiles).toHaveCount(8);
    // Two stops, because scrollIntoViewIfNeeded jumps: the top row would
    // never have been on screen if the only stop were the bottom row.
    for (const name of ["Version history", "Search"]) {
      await section.getByRole("heading", { name, exact: true }).scrollIntoViewIfNeeded();
      await settleScroll(page);
      await page.waitForTimeout(900);
    }
    const resting = await tiles.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el.parentElement as Element).opacity),
    );
    expect(resting).toEqual(Array(8).fill("1"));

    // The grid is a reproduction of meltingpot-bento.png, so it keeps that
    // sheet's 1672 by 941 proportions rather than reflowing to the viewport.
    const ratio = await page
      .getByTestId("feature-bento")
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.width / r.height;
      });
    expect(ratio).toBeCloseTo(1672 / 941, 2);
  });

  test("anchors scroll to their sections, including back up past the pin", async ({ page }) => {
    await page.goto("/");

    // The nav now navigates to real pages; the landing's own join anchor
    // hangs off the hero call to action instead.
    await page.getByRole("link", { name: "Classes" }).click();
    await page.waitForURL("**/classes");
    await expect(
      page.getByRole("heading", { name: "Classes", exact: true }),
    ).toBeVisible();
    await page.goBack();
    await page.waitForURL("**/");

    // The hero call to action goes to the join page.
    await page.evaluate(() => window.scrollTo(0, 0));
    await settleScroll(page);
    await page.getByRole("link", { name: "Join a class" }).first().click();
    await page.waitForURL("**/join");
    await expect(page.getByLabel("Enter class code")).toBeVisible();

    // So does the closing band, from the bottom of the page.
    await page.goBack();
    await page.waitForURL("**/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settleScroll(page);
    await page.getByRole("link", { name: "or enter a class code" }).click();
    await page.waitForURL("**/join");
    await expect(page.getByLabel("Enter class code")).toBeVisible();
  });

  // A scroll takeover (Lenis, since removed) once overwrote the browser's own
  // scroll for about 0.9s after a wheel notch and swallowed a keypress inside
  // that window, a keyboard accessibility failure and the thing most likely to
  // silently come back. The page scrolls smoothly and the key's own animation
  // starts after the wheel's, so the position is polled until a page's worth
  // has been travelled rather than read the moment the wheel scroll settles.
  test("a keypress mid-scroll is not swallowed", async ({ page }) => {
    await page.goto("/");
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(80);
    await page.keyboard.press("PageDown");
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 4_000 })
      .toBeGreaterThan(400);
  });

  test("reduced motion gets the finished story with no pin", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    // No scroll takeover exists under any preference; the class must stay
    // absent here too.
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)lenis(\s|$)/);

    // Everything is readable immediately, no scroll choreography required.
    await expect(page.getByRole("heading", { name: "How cells make ATP" })).toBeVisible();
    await expect(page.getByText("The exam loves asking for ATP counts.")).toBeVisible();
    await expect(page.getByText("Only you can approve what gets shared.")).toBeVisible();
    await context.close();
  });
});
