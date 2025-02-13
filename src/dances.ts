import { List } from "immutable";
import {
  balance,
  circle,
  doSiDo1,
  larksRollAway,
  passThrough,
  rightLeftThrough,
  ringBalance,
  robinsChain,
  swing,
} from "./figures";
import { Dance } from "./types";
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
      balance({ withYour: "neighbor" }),
      swing({ beats: 12, withYour: "neighbor" }), // "balance and swing" is 16 beats, so swing is only 12
      balance({ withYour: "partner" }),
      rightLeftThrough(),
      robinsChain({ toYour: "partner" }),
      ringBalance(),
      larksRollAway({ your: "neighbor" }),
      { endThatMoveFacing: "partnerward" },
      swing({ beats: 8, withYour: "partner" }),
      circle({
        handedness: "left",
        spots: 3,
        withYour: ["partner", "neighbor"],
      }),
      passThrough({ beats: 2 }),
      doSiDo1({ beats: 6 }),
    ]),
  };
}
