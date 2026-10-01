import { describe, expect, it } from "vitest";
import { NUMBER_VALUES, type Card } from "@tac/shared";
import { cardSvgContent } from "./cardFaces.js";

const number = (value: number) => ({ id: `n${value}`, kind: "number", value }) as unknown as Card;
const special = (kind: string) => ({ id: kind, kind }) as unknown as Card;

describe("cardSvgContent (REQ-DESIGN D12: SVG vor PNG vor Fallback)", () => {
  it("Given jeder Zahlenwert des Decks, When SVG angefragt wird, Then existiert ein SVG-Nachbau", () => {
    for (const value of NUMBER_VALUES) expect(cardSvgContent(number(value))).not.toBeNull();
  });

  it("Given der Trickser, When SVG angefragt wird, Then existiert ein SVG-Nachbau", () => {
    expect(cardSvgContent(special("trickster"))).not.toBeNull();
  });

  it("Given TAC und Meisterkarten mit Vorlage, When SVG angefragt wird, Then existiert ein SVG-Nachbau", () => {
    for (const kind of ["tac", "engel", "krieger", "narr"]) {
      expect(cardSvgContent(special(kind))).not.toBeNull();
    }
  });

  it("Given der Teufel, When SVG angefragt wird, Then existiert ein SVG-Nachbau", () => {
    expect(cardSvgContent(special("teufel"))).not.toBeNull();
  });
});
