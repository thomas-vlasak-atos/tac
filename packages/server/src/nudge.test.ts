import { describe, expect, it } from "vitest";
import { createNudgeLimiter } from "./nudge.js";

describe("Anstupsen: Abkühlzeit (REQ-FEEDBACK F12)", () => {
  it("Given ein erstes Anstupsen, Then ist es erlaubt", () => {
    expect(createNudgeLimiter(1000).tryNudge(0, 1, 0)).toBe(true);
  });

  it("Given dasselbe Ziel innerhalb der Abkühlzeit, Then wird es abgelehnt", () => {
    const limiter = createNudgeLimiter(1000);
    limiter.tryNudge(0, 1, 0);
    expect(limiter.tryNudge(0, 1, 500)).toBe(false);
  });

  it("Given die Abkühlzeit ist vorbei, Then ist es wieder erlaubt", () => {
    const limiter = createNudgeLimiter(1000);
    limiter.tryNudge(0, 1, 0);
    expect(limiter.tryNudge(0, 1, 1000)).toBe(true);
  });

  it("Given ein anderes Ziel oder ein anderer Absender, Then zählt es getrennt", () => {
    const limiter = createNudgeLimiter(1000);
    limiter.tryNudge(0, 1, 0);
    expect(limiter.tryNudge(0, 2, 10)).toBe(true);
    expect(limiter.tryNudge(3, 1, 10)).toBe(true);
  });

  it("Given man stupst sich selbst an, Then wird es abgelehnt", () => {
    expect(createNudgeLimiter(1000).tryNudge(2, 2, 0)).toBe(false);
  });
});
