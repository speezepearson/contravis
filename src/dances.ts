import { List } from "immutable";
import {
  balance,
  ByDancer,
  Call,
  circle,
  DancerState,
  doSiDo1,
  initImproper,
  larksRollAway,
  passThrough,
  rightLeftThrough,
  ringBalance,
  robinsChainAcross,
  swing,
} from "./contra";

/**
 * https://contradb.com/dances/2593
 */
export function earlyEveningRollaway(): {
  init: ByDancer<DancerState>;
  calls: List<Call>;
} {
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
      rightLeftThrough(),
      robinsChainAcross({ toYour: "partner" }),
      ringBalance(),
      larksRollAway({ your: "neighbor" }),
      { endThatMoveFacing: "partnerward" },
      swing({ beats: 8, withYour: "partner" }),
      circle({
        handedness: "left",
        spots: 3,
        withYour: ["partner", "neighbor"],
      }),
      passThrough(),
      doSiDo1(),
    ]),
  };
}
