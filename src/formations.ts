import { PD_UP } from "./types";
import { LARK } from "./types";
import { PD_DOWN } from "./types";
import { ROBIN } from "./types";
import { DancerState } from "./types";
import Victor from "victor";
import { ByDancer } from "./types";
import { Map } from "immutable";

export function initImproper(nHandsFours: number): ByDancer<DancerState> {
  return Map(
    Array.from({ length: nHandsFours }).flatMap((_, h4i) => {
      const [l1, r1, l2, r2] = [
        `L${h4i * 2}`,
        `R${h4i * 2}`,
        `L${h4i * 2 + 1}`,
        `R${h4i * 2 + 1}`,
      ];
      return [
        [
          l1,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            ccw: 1 / 4,
            labels: { partner: r1, neighbor: r2 },
          },
        ],
        [
          r1,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(1, h4i * 4),
            ccw: 1 / 4,
            labels: { partner: l1, neighbor: l2 },
          },
        ],
        [
          l2,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            ccw: -1 / 4,
            labels: { partner: r2, neighbor: r1 },
          },
        ],
        [
          r2,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(-1, h4i * 4 + 2),
            ccw: -1 / 4,
            labels: { partner: l2, neighbor: l1 },
          },
        ],
      ];
    })
  );
}

export function initBeckett(nHandsFours: number): ByDancer<DancerState> {
  return Map(
    Array.from({ length: nHandsFours }).flatMap((_, h4i) => {
      const [l1, r1, l2, r2] = [
        `L${h4i * 2}`,
        `R${h4i * 2}`,
        `L${h4i * 2 + 1}`,
        `R${h4i * 2 + 1}`,
      ];
      return [
        [
          l1,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4 + 2),
            ccw: 0,
            labels: { partner: r1, neighbor: r2 },
          },
        ],
        [
          r1,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            ccw: 0,
            labels: { partner: l1, neighbor: l2 },
          },
        ],
        [
          l2,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4),
            ccw: 1 / 2,
            labels: { partner: r2, neighbor: r1 },
          },
        ],
        [
          r2,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            ccw: 1 / 2,
            labels: { partner: l2, neighbor: l1 },
          },
        ],
      ];
    })
  );
}
