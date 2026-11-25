import { describe, expect, it } from "vitest";
import { nudgePhrase } from "./nudge.js";

describe("Anstupsen (REQ-FEEDBACK F12)", () => {
  it("Given ein Spielername, Then wird der Name im Satz angesprochen", () => {
    expect(nudgePhrase("Steffen")).toBe("Steffen, du bist dran!");
  });
});
