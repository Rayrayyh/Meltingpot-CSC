import { describe, expect, it } from "vitest";
import { dueBucket, dueLabel, kindLabel, providerName } from "@/lib/classwork/labels";

// Saturday 5 September 2026, 10:00 in Los Angeles.
const now = Date.parse("2026-09-05T17:00:00Z");
const zone = "America/Los_Angeles";

describe("dueLabel", () => {
  it("says today and tomorrow with the clock, in the reader's zone", () => {
    expect(dueLabel("2026-09-06T06:59:00Z", false, now, zone)).toBe("Due today at 11:59pm");
    expect(dueLabel("2026-09-07T06:59:00Z", false, now, zone)).toBe("Due tomorrow at 11:59pm");
  });

  it("names the day inside a week and drops the clock beyond it", () => {
    expect(dueLabel("2026-09-10T06:59:00Z", false, now, zone)).toBe("Due Wed 9 Sept at 11:59pm");
    expect(dueLabel("2026-09-25T06:59:00Z", false, now, zone)).toBe("Due Thu 24 Sept");
  });

  it("shows no clock for an all day date and places noon UTC on the right day", () => {
    expect(dueLabel("2026-09-08T12:00:00.000Z", true, now, zone)).toBe("Due Tue 8 Sept");
    expect(dueLabel("2026-09-05T12:00:00.000Z", true, now, zone)).toBe("Due today");
  });

  it("never says overdue", () => {
    expect(dueLabel("2026-09-05T06:59:00Z", false, now, zone)).toBe("Was due yesterday");
    expect(dueLabel("2026-09-02T06:59:00Z", false, now, zone)).toBe("Was due 4 days ago");
    expect(dueLabel("2026-07-02T06:59:00Z", false, now, zone)).toBe("Was due Wed 1 Jul");
    expect(dueLabel(null, false, now, zone)).toBeNull();
  });
});

describe("buckets and names", () => {
  it("buckets by the reader's day", () => {
    expect(dueBucket("2026-09-06T06:59:00Z", now, zone)).toBe("soon");
    expect(dueBucket("2026-09-12T23:00:00Z", now, zone)).toBe("soon");
    expect(dueBucket("2026-09-13T23:00:00Z", now, zone)).toBe("later");
    expect(dueBucket("2026-09-04T23:00:00Z", now, zone)).toBe("past");
    expect(dueBucket(null, now, zone)).toBe("undated");
  });

  it("names the tools the student knows", () => {
    expect(providerName("google_classroom")).toBe("Google Classroom");
    expect(providerName("canvas")).toBe("Canvas");
    expect(kindLabel("discussion")).toBe("Discussion");
  });
});
