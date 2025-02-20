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
    init: initImproper(),
    calls: List([
      { beats: 4, name: "balance", relation: "neighbor" } as Call,
      { beats: 12, name: "swing", relation: "neighbor" },
      { beats: 4, name: "balance", relation: "partner" },
      { beats: 4, name: "rightLeftThrough" },
      { beats: 8, name: "robinsChain", relation: "partner" },
      { beats: 4, name: "ringBalance" },
      { beats: 4, name: "larksRollAway", relation: "neighbor" },
      { endThatMoveFacing: "towardsYourPartner" },
      { beats: 8, name: "swing", relation: "partner" },
      {
        beats: 8,
        name: "circle",
        handedness: "left",
        spots: 3,
      },
      { beats: 2, name: "passThrough" },
      { youAreNowFacingYourNewNeighbor: true },
      { beats: 6, name: "doSiDo1", relation: "neighbor", h4Offset: 1 },
    ]),
  };
}
