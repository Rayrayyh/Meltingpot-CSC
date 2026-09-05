import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Classwork from Google Classroom, end to end against the stub provider in
 * tests/stub-lms (docs/CLASSWORK.md). The dev server must run in stub mode
 * (CLASSWORK_PROVIDER_MODE=stub in .env.local) and the server key must be in
 * Vault; when either is missing the panel says the feature is not set up, and
 * this spec skips itself rather than fail on a site that never claimed it.
 *
 * Nothing here is reseeded by global setup, so the spec leaves Ava exactly as
 * it found her: disconnected. Each run costs two of her ten connects an hour.
 */
const STUB = "http://localhost:3112";

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill("MeltingPot-dev1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home/, { timeout: 15_000 });
}

async function stubUp(request: APIRequestContext) {
  try {
    return (await request.get(`${STUB}/__control`)).ok();
  } catch {
    return false;
  }
}

async function mood(request: APIRequestContext, body: Record<string, unknown>) {
  await request.post(`${STUB}/__control`, { data: body });
}

async function disconnectIfConnected(page: Page) {
  await page.goto("/me/settings");
  const panel = page.getByTestId("classwork-google_classroom");
  await expect(panel).toBeVisible();
  if ((await panel.getByRole("button", { name: "Disconnect" }).count()) > 0) {
    await panel.getByRole("button", { name: "Disconnect" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Disconnect" }).click();
    await expect(panel.getByText("Not connected")).toBeVisible({ timeout: 15_000 });
  }
}

/**
 * Two due days chosen against today, so the labels read "Due <day>" in any
 * month the suite runs in. Near the end of a month they fall into the past
 * and read "Was due", which the assertions allow for.
 */
function pickDays(now: Date) {
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const first = now.getUTCDate() + 2;
  const second = first + 3;
  const future = second <= daysInMonth;
  return future
    ? { first, second, future }
    : { first: 2, second: 5, future: false };
}

function labelFor(day: number, future: boolean) {
  return future ? new RegExp(`Due .*\\b${day}\\b`) : /Was due/;
}

test.describe("classwork from Google Classroom", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await stubUp(request)), "the stub LMS is not running");
    await mood(request, { invalidGrant: false, throttle: 0, slowMs: 0, dueDay: null });
  });

  test("connect, keep a course in the calendar, follow a moved due date, reconnect, disconnect", async ({
    page,
    request,
  }) => {
    // Five page loads, two consent hops and three passes: well over the
    // suite's default.
    test.setTimeout(180_000);
    const days = pickDays(new Date());
    await mood(request, { dueDay: days.first });

    await loginAs(page, "ava@meltingpot.dev");
    await disconnectIfConnected(page);
    const panel = page.getByTestId("classwork-google_classroom");

    const connect = panel.getByRole("link", { name: "Connect Google Classroom" });
    test.skip((await connect.count()) === 0, "classwork is not set up on this site");

    // The consent hop is a full page trip: out to the stub, back through the
    // callback, landing on settings with a one word outcome.
    await connect.click();
    await expect(page).toHaveURL(/connected=google_classroom/, { timeout: 20_000 });
    await expect(page.getByText("Google Classroom connected.")).toBeVisible();
    await expect(panel.getByText(/Connected as ava@example.org/)).toBeVisible();
    await expect(panel.getByText(/^Biology 101/)).toBeVisible();
    await expect(panel.getByText(/^World History/)).toBeVisible();

    // A private link, and the first pass runs before the button settles.
    await panel.getByRole("button", { name: "Show in my calendar", exact: true }).first().click();
    await expect(panel.getByRole("button", { name: "In my calendar", exact: true })).toHaveCount(1, {
      timeout: 40_000,
    });
    const linkId = await panel.locator("[data-link-id]").first().getAttribute("data-link-id");
    expect(linkId).toBeTruthy();

    await page.goto("/calendar");
    await expect(page.getByText("What your classes shared, and what is due.")).toBeVisible();
    const lab = page.getByTestId("calendar-due").filter({ hasText: "Cell division lab report" });
    await expect(lab).toBeVisible({ timeout: 15_000 });
    await expect(lab.getByText("Google Classroom")).toBeVisible();
    await expect(lab.getByText(labelFor(days.first, days.future))).toBeVisible();

    if (days.future) {
      await page.goto("/home");
      await expect(page.getByTestId("due-soon")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("due-soon").getByText("Cell division lab report")).toBeVisible();
    }

    // Upstream moves the due date; a forced pass moves it here. The stub
    // stamps a new updateTime, so the content hash changes and the row is
    // counted as changed rather than merely seen.
    await mood(request, { dueDay: days.second });
    const forced = await page.request.post("/api/classwork/sync", { data: { linkId, force: true } });
    expect(forced.ok()).toBeTruthy();
    const outcome = (await forced.json()) as { status: string; changed: number };
    expect(outcome.status).toBe("ok");
    expect(outcome.changed).toBeGreaterThanOrEqual(1);
    await page.goto("/calendar");
    await expect(
      page
        .getByTestId("calendar-due")
        .filter({ hasText: "Cell division lab report" })
        .getByText(labelFor(days.second, days.future)),
    ).toBeVisible({ timeout: 15_000 });

    // Consent lapses the way it does every week in Google's testing status.
    await mood(request, { invalidGrant: true });
    const lapsed = await page.request.post("/api/classwork/sync", { data: { linkId, force: true } });
    expect(lapsed.ok()).toBeTruthy();
    expect(((await lapsed.json()) as { status: string }).status).toBe("reconnect");
    await page.goto("/me/settings");
    await expect(panel.getByText(/needs reconnecting/)).toBeVisible({ timeout: 15_000 });
    await page.goto("/home");
    await expect(page.getByText("Google Classroom needs reconnecting")).toBeVisible({ timeout: 15_000 });

    await mood(request, { invalidGrant: false });
    await page.goto("/me/settings");
    await panel.getByRole("link", { name: "Reconnect" }).first().click();
    await expect(page).toHaveURL(/connected=google_classroom/, { timeout: 20_000 });
    await expect(panel.getByText(/needs reconnecting/)).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "In my calendar", exact: true })).toHaveCount(1);

    // Disconnecting takes everything it brought in with it.
    await panel.getByRole("button", { name: "Disconnect" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Disconnect" }).click();
    await expect(panel.getByText("Not connected")).toBeVisible({ timeout: 15_000 });
    await page.goto("/calendar");
    await expect(page.getByTestId("calendar-due")).toHaveCount(0);
  });
});
