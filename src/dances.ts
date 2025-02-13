import { List } from "immutable";
import { Call, Dance } from "./types";
import { initImproper } from "./formations";

/**
 * https://contradb.com/dances/2593
 */
export function earlyEveningRollaway(): Dance {
  /* ContraDB:
  formation: improper

    A1	16
    neighbors balance & swing
    A2	8
    right left through
    8
    ladles chain
    B1	4
    balance the ring
    4
    gentlespoons roll away neighbors with a half sashay across the set
    8
    partners swing
    B2	8
    circle left 3 places
    2
    pass through ⁋
    8
    next neighbors do si do once
   */
  return {
    init: initImproper(4),
    calls: List([
      { beats: 4, name: "balance" } as Call,
      { beats: 12, name: "swing" },
      { beats: 4, name: "balance" },
      { beats: 4, name: "rightLeftThrough" },
      { beats: 8, name: "robinsChain" },
      { beats: 4, name: "ringBalance" },
      { beats: 4, name: "larksRollAway", your: "neighbor" },
      { endThatMoveFacing: "partnerward" },
      { beats: 8, name: "swing" },
      {
        beats: 8,
        name: "circle",
        handedness: "left",
        spots: 3,
        withYour: ["partner", "neighbor"] as const,
      },
      { beats: 2, name: "passThrough" },
      { youAreNowFacingYourNewNeighbor: true },
      { beats: 6, name: "doSiDo1" },
    ]),
  };
}
