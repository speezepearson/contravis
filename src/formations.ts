import { FormationId, PD_UP } from "./types";
import { LARK } from "./types";
import { PD_DOWN } from "./types";
import { ROBIN } from "./types";
import { DancerState } from "./types";
import Victor from "victor";
import { ByProto } from "./types";
import { Map } from "immutable";
import { LENGTH_PERIOD } from "./util";

export function fromName(name: FormationId): ByProto<DancerState> {
  switch (name) {
    case "becket":
      return initBecket();
    case "improper":
      return initImproper();
  }
}

export function initImproper(): ByProto<DancerState> {
  return Map([
    [
      "L1",
      {
        role: LARK,
        progressDirection: PD_UP,
        posn: new Victor(-LENGTH_PERIOD / 4, 0),
        ccw: 1 / 4,
      },
    ],
    [
      "R1",
      {
        role: ROBIN,
        progressDirection: PD_UP,
        posn: new Victor(LENGTH_PERIOD / 4, 0),
        ccw: 1 / 4,
      },
    ],
    [
      "L2",
      {
        role: LARK,
        progressDirection: PD_DOWN,
        posn: new Victor(LENGTH_PERIOD / 4, LENGTH_PERIOD / 2),
        ccw: -1 / 4,
      },
    ],
    [
      "R2",
      {
        role: ROBIN,
        progressDirection: PD_DOWN,
        posn: new Victor(-LENGTH_PERIOD / 4, LENGTH_PERIOD / 2),
        ccw: -1 / 4,
      },
    ],
  ]);
}

export function initBecket(): ByProto<DancerState> {
  return Map([
    [
      "L1",
      {
        role: LARK,
        progressDirection: PD_UP,
        posn: new Victor(-LENGTH_PERIOD / 4, LENGTH_PERIOD / 2),
        ccw: 0,
      },
    ],
    [
      "R1",
      {
        role: ROBIN,
        progressDirection: PD_UP,
        posn: new Victor(-LENGTH_PERIOD / 4, 0),
        ccw: 0,
      },
    ],
    [
      "L2",
      {
        role: LARK,
        progressDirection: PD_DOWN,
        posn: new Victor(LENGTH_PERIOD / 4, 0),
        ccw: 1 / 2,
      },
    ],
    [
      "R2",
      {
        role: ROBIN,
        progressDirection: PD_DOWN,
        posn: new Victor(LENGTH_PERIOD / 4, LENGTH_PERIOD / 2),
        ccw: 1 / 2,
      },
    ],
  ]);
}
