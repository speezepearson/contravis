import { List } from "immutable";
import { Call, Dance, LARK } from "./types";

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
    formation: "improper",
    calls: List([
      { beats: 4, name: "balance", relation: "neighbor" } as Call,
      { beats: 12, name: "swing", relation: "neighbor" },
      { beats: 4, name: "balance", relation: "partner" },
      { beats: 4, name: "rightLeftThrough" },
      { beats: 8, name: "robinsChain", relation: "partner" },
      { beats: 4, name: "ringBalance", relation: "neighbor" },
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

/**
 * https://contradb.com/dances/2571
 */
export function dearfield(): Dance {
  /* ContraDB:
  formation: Beckett

    A1	2
    slide left along set ⁋
    8
    star right - hands across - 4 places
    6
    mad robin, gentlespoons in front
    A2	8
    gentlespoons start a half hey - lefts in center, rights on ends - ladles ricochet
    8
    neighbors swing
    B1	2
    gentlespoons allemande left ½ to trade
    4
    star left 2 places, ladles joining behind and ending across from neighbors
    2
    partners allemande left ¾
    4
    form an ocean wave & balance - gentlespoons by right hands and partners by left hands
    4
    trade the wave - dancers take one step forward, turn to face across, and neighbors pass by right shoulders across
    B2	16
    partners balance & swing
   */
  return {
    formation: "becket",
    calls: List([
      // A1
      { beats: 2, name: "slice", handedness: "left" },
      { beats: 8, name: "star", handedness: "right", spots: 4 },
      { endThatMoveFacing: "acrossTheSet" },
      // TODO: mad robin

      // A2
      { beats: 8, name: "halfHey", ricochet: LARK },
      { endThatMoveFacing: "acrossTheSet" },
      { beats: 8, name: "swing", relation: "neighbor" },

      // B1
      {
        beats: 2,
        name: "allemande",
        turns: 1 / 2,
        handedness: "left",
        who: { only: LARK },
      },
      { beats: 4, name: "star", spots: 2, handedness: "left" },
      {
        beats: 2,
        name: "allemande",
        turns: 3 / 4,
        handedness: "right",
        who: { relation: "partner" },
      },
      // TODO: ocean wave
      // TODO: trade the wave

      // B2
      { beats: 4, name: "balance", relation: "partner" },
      { beats: 12, name: "swing", relation: "partner" },
    ]),
  };
}
