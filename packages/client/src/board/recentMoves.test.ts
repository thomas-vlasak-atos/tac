import { describe, expect, it } from "vitest";
import type { LastBallMove } from "@tac/shared";
import { moveKey, updateSeenMoves, visibleMoves } from "./recentMoves.js";

const move = (ballId: string, from: number, to: number): LastBallMove => ({
  ballId,
  from: { kind: "FELD", index: from },
  to: { kind: "FELD", index: to },
});

describe("recentMoves (REQ-FEEDBACK F2)", () => {
  it("Given ein neuer Zug, Then wird er als neu gemeldet", () => {
    const result = updateSeenMoves([], move("blau-0", 1, 5), 1000);
    expect(result.isNew).toBe(true);
    expect(result.seen).toHaveLength(1);
  });

  it("Given derselbe Zug erneut vom Server (andere Aktion), Then ist er nicht neu", () => {
    const first = updateSeenMoves([], move("blau-0", 1, 5), 1000);
    const again = updateSeenMoves(first.seen, move("blau-0", 1, 5), 2000);
    expect(again.isNew).toBe(false);
    expect(again.seen).toHaveLength(1);
  });

  it("Given ein Undo (früherer Zug kommt zurück), Then wird zurückgespult und nicht neu animiert", () => {
    let state = updateSeenMoves([], move("blau-0", 1, 5), 1000).seen;
    state = updateSeenMoves(state, move("rot-1", 20, 22), 2000).seen;
    const undone = updateSeenMoves(state, move("blau-0", 1, 5), 3000);
    expect(undone.isNew).toBe(false);
    expect(undone.seen.map((item) => item.key)).toEqual([moveKey(move("blau-0", 1, 5))]);
  });

  it("Given kein Zug (Spiel zurückgesetzt), Then wird alles vergessen", () => {
    const state = updateSeenMoves([], move("blau-0", 1, 5), 1000).seen;
    expect(updateSeenMoves(state, null, 2000).seen).toEqual([]);
  });

  it("Given zwei dicht aufeinanderfolgende Züge (Trickser), Then werden beide markiert", () => {
    let state = updateSeenMoves([], move("blau-0", 1, 30), 1000).seen;
    state = updateSeenMoves(state, move("rot-0", 30, 1), 1500).seen;
    expect(visibleMoves(state)).toHaveLength(2);
  });

  it("Given der vorige Zug liegt lange zurück, Then wird nur der jüngste markiert", () => {
    let state = updateSeenMoves([], move("blau-0", 1, 5), 1000).seen;
    state = updateSeenMoves(state, move("rot-0", 30, 35), 60000).seen;
    expect(visibleMoves(state)).toHaveLength(1);
  });
});
