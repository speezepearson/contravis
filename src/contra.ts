import { List, Map } from "immutable";
import Victor from "victor";

export type Role = "lark" | "robin";
export const LARK = "lark" as Role;
export const ROBIN = "robin" as Role;
export function roleAbbrev(role: Role): "L" | "R" {
  switch (role) {
    case "lark":
      return "L";
    case "robin":
      return "R";
  }
}

export type CcwTurns = number;
export type ProgressDirection = Victor & { __brand: "ProgressDirection" };
export const PD_UP = new Victor(0, 1) as ProgressDirection;
export const PD_DOWN = new Victor(0, -1) as ProgressDirection;
export type DancerId = string;

export const fwd = (len: number = 1) => new Victor(len, 0);
export const bak = (len: number = 1) => new Victor(-len, 0);
export const left = (len: number = 1) => new Victor(0, len);
export const right = (len: number = 1) => new Victor(0, -len);
export const partnerward = ({ role }: { role: Role }, len: number = 1) =>
  role === LARK ? right(len) : left(len);
export const progressward = (dancer: DancerState, len: number = 1) =>
  dancer.progressDirection.y > 0 ? new Victor(0, len) : new Victor(0, -len);
export const crossSet = (
  dancer: Pick<DancerState, "ccw" | "posn">,
  len: number = 1
) => (dancer.posn.x < 0 ? new Victor(len, 0) : new Victor(-len, 0));

export interface DancerState {
  role: Role;
  progressDirection: ProgressDirection;
  posn: Victor;
  ccw: CcwTurns;
  labels: { partner: DancerId } & Partial<{
    neighbor: DancerId; // TODO: how does this get assigned? Especially on the ends?
    shadow: DancerId;
  }>;
}
export type DancerKeyframe = { beats: number; end: DancerState };

export type ByDancer<T> = Map<DancerId, T>;

export function findPersonInDirection(
  state: ByDancer<DancerState>,
  offset: (dancer: DancerState) => Victor | null,
  slop: number = 0.2
): ByDancer<DancerId | null> {
  return state.map((dancer) => {
    const relposn = offset(dancer);
    if (!relposn) {
      return null;
    }
    const targetPosn = dancer.posn
      .clone()
      .add(relposn.rotate(2 * Math.PI * dancer.ccw));
    const res = state
      .entrySeq()
      .filter(([, dancer]) => {
        return dancer.posn.distance(targetPosn) < slop;
      })
      .minBy(([, dancer]) => {
        return dancer.posn.distance(targetPosn);
      });
    return res ? res[0] : null;
  });
}

export function ensureSymmetric(counterparts: ByDancer<DancerId>) {
  for (const [id, counterpart] of counterparts.entries()) {
    const counterpartCounterpart = counterparts.get(counterpart);
    if (counterpartCounterpart !== id) {
      throw new Error(
        `for dancer ${id}, counterpart is ${counterpart} but that dancer's counterpart is ${counterpartCounterpart}`
      );
    }
  }
}

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

export function swingKfs(
  state: ByDancer<DancerState>,
  { withYour, beats }: { withYour: keyof DancerState["labels"]; beats: number }
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer, id) => {
    const counterpartId = dancer.labels[withYour];
    if (!counterpartId) {
      throw new Error(
        `dancer ${id} failed to find their ${withYour} to swing with`
      );
    }
    const counterpart = state.get(counterpartId)!;
    // if (id === "L0") debugger;
    if (!(dancer.posn.x < 0 === counterpart.posn.x < 0)) {
      throw new Error(
        `dancer ${id} wants to swing with ${counterpartId}, but they're across the set (${dancer.posn} vs ${counterpart.posn})`
      );
    }
    if (counterpart.role === dancer.role) {
      throw new Error(
        `dancer ${id} wants to swing with ${counterpartId}, but they're the same role`
      );
    }
    const extraCcw = -(dancer.role === ROBIN ? 1 / 2 : 0);
    const swapPosns =
      (dancer.posn.x < 0 !== (dancer.role === LARK)) !==
      dancer.posn.y < counterpart.posn.y;
    if (swapPosns) {
      return moves(dancer, [
        { beats: beats / 6, dx: fwd().add(left(0.3)), dccw: -1 / 4 },
        { beats: beats / 6, dx: fwd().add(fwd(0.3)), dccw: -1 / 2 },
        { beats: beats / 6, dx: fwd().add(right(0.3)), dccw: -3 / 4 },
        { beats: beats / 6, dx: fwd().add(bak(0.3)), dccw: -4 / 4 },
        { beats: beats / 6, dx: fwd().add(left(0.3)), dccw: -5 / 4 },
        { beats: beats / 6, dx: fwd(2), dccw: -5 / 4 + extraCcw },
      ]);
    } else {
      return moves(dancer, [
        { beats: beats / 4, dx: fwd().add(left(0.3)), dccw: -1 / 4 },
        { beats: beats / 4, dx: fwd().add(fwd(0.3)), dccw: -2 / 4 },
        { beats: beats / 4, dx: fwd().add(right(0.3)), dccw: -3 / 4 },
        { beats: beats / 4, dccw: -3 / 4 + extraCcw },
      ]);
    }
  });
}

export function robinsChainAcrossKfs(
  state: ByDancer<DancerState>,
  { toYour }: { toYour: keyof DancerState["labels"] }
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer, id) => {
    if (dancer.role === LARK) {
      return moves(dancer, [
        { beats: 4, dx: right(1.5), dccw: 1 / 2 },
        { beats: 2, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
        { beats: 2, dccw: 1 },
      ]);
    } else {
      const turnerId = dancer.labels[toYour];
      if (!turnerId) {
        throw new Error(
          `robin ${id} failed to find their ${toYour} to chain with`
        );
      }
      const turner = state.get(turnerId)!;
      if (turner.posn.x < 0 === dancer.posn.x < 0) {
        throw new Error(
          `robin ${id} wants to chain to ${turnerId}, but they're not across the set`
        );
      }

      return moves(dancer, [
        { beats: 2, dx: fwd(1).add(left(1.3)), dccw: 1 / 4 },
        { beats: 2, dx: fwd(2).add(left(1)), dccw: 0 },
        { beats: 2, dx: fwd(2.5).add(left(1.5)), dccw: 1 / 4 },
        {
          beats: 2,
          x: turner.posn.clone().addScalarY(turner.posn.x < 0 ? -2 : 2),
          dccw: 1 / 2,
        },
      ]);
    }
  });
}

export function formWaveKfs(
  state: ByDancer<DancerState>
): ByDancer<List<DancerKeyframe>> {
  throw new Error("wave formation is buggy");
  return state.map((dancer) =>
    moves(dancer, [
      {
        beats: 4,
        x: dancer.posn
          .clone()
          .add(dancer.progressDirection.clone().multiplyScalar(3 / 4))
          .add(
            dancer.progressDirection
              .clone()
              .multiplyScalar(1 / 2)
              .rotate(Math.PI / 2)
          ),
        ccw:
          (dancer.progressDirection.y > 0 ? 1 / 4 : -1 / 4) +
          Math.round(
            dancer.ccw - (dancer.progressDirection.y > 0 ? 1 / 4 : -1 / 4)
          ),
      },
    ])
  );
}

export function waveBalanceBellySlideKfs(
  state: ByDancer<DancerState>
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer) => {
    return moves(dancer, [
      { beats: 1, dx: right(0.2) },
      { beats: 1, dx: right(0.2) },
      { beats: 1, dx: left(0.2) },
      { beats: 1, dx: left(0.2) },
      { beats: 4, dx: right(), dccw: -1 },
    ]).concat(
      moves(move(dancer, { dx: right(), dccw: -1 }), [
        { beats: 1, dx: left(0.2) },
        { beats: 1, dx: left(0.2) },
        { beats: 1, dx: right(0.2) },
        { beats: 1, dx: right(0.2) },
        { beats: 4, dx: left(), dccw: 1 },
      ])
    );
  });
}

export function petronellaKfs(
  state: ByDancer<DancerState>,
  {
    withYour,
  }: {
    withYour: [keyof DancerState["labels"], keyof DancerState["labels"]];
  } = {
    withYour: ["partner", "neighbor"],
  }
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer, id) => {
    const counter0 = state.get(dancer.labels[withYour[0]]!)!;
    const counter1 = state.get(dancer.labels[withYour[1]]!)!;
    // Sanity check it's a square:
    if (counter0.labels[withYour[1]] !== counter1.labels[withYour[0]]) {
      throw new Error(
        `dancer ${id} has ${withYour[0]}=${dancer.labels[withYour[0]]} and ${
          withYour[1]
        }=${dancer.labels[withYour[1]]} but ${counter0}'s ${withYour[1]} is ${
          counter0.labels[withYour[1]]
        } while ${counter1}'s ${withYour[0]} is ${counter1.labels[withYour[0]]}`
      );
    }
    const center = counter0.posn.clone().add(counter1.posn).divideScalar(2);
    const centerCcw =
      Math.atan2(center.y - dancer.posn.y, center.x - dancer.posn.x) /
      (2 * Math.PI);
    const centerward = (len: number) =>
      center.clone().subtract(dancer.posn).normalize().multiplyScalar(len);

    // We end up standing in either counter0 or counter1's spot.
    // Find the angle from c0 to us to c1; if clockwise, we aim for c1's spot; else c0's.
    const finalPosn = (() => {
      const toCounter0 = counter0.posn.clone().subtract(dancer.posn);
      const toCounter1 = counter1.posn.clone().subtract(dancer.posn);
      return toCounter0.cross(toCounter1) > 0 ? counter0.posn : counter1.posn;
    })();

    return moves(dancer, [
      {
        beats: 1,
        x: dancer.posn.clone().add(centerward(0.3)),
        ccw: centerCcw + Math.round(dancer.ccw - centerCcw),
      },
      {
        beats: 1,
        x: dancer.posn.clone().add(centerward(0.3)),
        ccw: centerCcw + Math.round(dancer.ccw - centerCcw),
      },
      {
        beats: 1,
        ccw: centerCcw + Math.round(dancer.ccw - centerCcw),
      },
      {
        beats: 1,
        ccw: centerCcw + Math.round(dancer.ccw - centerCcw),
      },
      {
        beats: 4,
        x: finalPosn,
        ccw: centerCcw + Math.round(dancer.ccw - centerCcw) - 1 + 1 / 4,
      },
      // TODO: need dancers to know who their neighbors are
      // { beats: 4, x: dancer.posn.clone().add((dancer.progressDirection.y>0)===(dancer.posn.x<0)) },
    ]);
  });
}

export function balanceKfs(
  state: ByDancer<DancerState>,
  { withYour }: { withYour: keyof DancerState["labels"] }
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer, id) => {
    const counterpartId = dancer.labels[withYour];
    if (!counterpartId) {
      throw new Error(
        `dancer ${id} failed to find their ${withYour} to box with`
      );
    }
    const counterpart = state.get(counterpartId)!;
    return moves(dancer, [
      {
        beats: 1,
        x: dancer.posn
          .clone()
          .multiplyScalar(3)
          .add(counterpart.posn)
          .divideScalar(4),
      },
      {
        beats: 1,
        x: dancer.posn
          .clone()
          .multiplyScalar(3)
          .add(counterpart.posn)
          .divideScalar(4),
      },
      { beats: 1 },
      { beats: 1 },
    ]);
  });
}

export function boxTheGnatKfs(
  state: ByDancer<DancerState>,
  { withYour }: { withYour: keyof DancerState["labels"] }
): ByDancer<List<DancerKeyframe>> {
  return state.map((dancer, id) => {
    const counterpartId = dancer.labels[withYour];
    if (!counterpartId) {
      throw new Error(
        `dancer ${id} failed to find their ${withYour} to box with`
      );
    }
    const counterpart = state.get(counterpartId)!;
    const finalCcw =
      Math.atan2(
        counterpart.posn.y - dancer.posn.y,
        counterpart.posn.x - dancer.posn.x
      ) /
        (2 * Math.PI) +
      (dancer.role === LARK ? -1 / 4 : 1 / 4);
    return moves(dancer, [
      {
        beats: 4,
        x: counterpart.posn,
        ccw:
          finalCcw +
          Math.round(dancer.ccw - finalCcw) +
          (dancer.role === ROBIN ? 1 : 0),
      },
    ]);
  });
}

export function getCurState(
  kfs: ByDancer<List<DancerKeyframe>>
): ByDancer<DancerState> {
  return kfs
    .map((kfs) => {
      return kfs.last()?.end;
    })
    .filter((dancer) => dancer !== undefined);
}

export function extendKeyframes(
  prev: ByDancer<List<DancerKeyframe>>,
  next: (cur: ByDancer<DancerState>) => ByDancer<List<DancerKeyframe>>
): ByDancer<List<DancerKeyframe>> {
  const cur = getCurState(prev);
  const kfs = addRestKeyframes(cur, next(cur));
  return prev.map((prev, id) => prev.concat(kfs.get(id, List())));
}

export function addRestKeyframes(
  cur: ByDancer<DancerState>,
  kfs: ByDancer<List<DancerKeyframe>>
): ByDancer<List<DancerKeyframe>> {
  const totalDelays = kfs.map((kfs) => kfs.reduce((t, kf) => t + kf.beats, 0));
  const tf = totalDelays.valueSeq().max() ?? 0;
  return cur.map((start, id) => {
    const dkfs = kfs.get(id);
    if (!dkfs) {
      return List.of({ beats: tf, end: start });
    }
    const totalDelay = totalDelays.get(id)!;
    if (totalDelay === tf) {
      return dkfs;
    }
    return dkfs.push({
      beats: tf - totalDelay,
      end: dkfs.last()?.end ?? start,
    });
  });
}

export function move(
  dancer: DancerState,
  { x, ccw, dx, dccw }: { dx?: Victor; x?: Victor; dccw?: number; ccw?: number }
): DancerState {
  return {
    ...dancer,
    posn:
      x !== undefined
        ? x
        : dx !== undefined
        ? dancer.posn
            .clone()
            .add(roundV(dx.clone().rotate(2 * Math.PI * dancer.ccw)))
        : dancer.posn,
    ccw:
      ccw !== undefined
        ? ccw
        : dccw !== undefined
        ? dancer.ccw + dccw
        : dancer.ccw,
  };
}

export function roundV(v: Victor): Victor {
  return new Victor(
    Math.round(v.x * 1000) / 1000,
    Math.round(v.y * 1000) / 1000
  );
}

export function moves(
  dancer: DancerState,
  rels: Iterable<{
    beats: number;
    x?: Victor;
    ccw?: number;
    dx?: Victor;
    dccw?: number;
  }>
): List<DancerKeyframe> {
  return List(rels).map(({ beats, x, ccw, dx, dccw }) => ({
    beats,
    end: move(dancer, {
      x,
      ccw,
      dx,
      dccw,
    }),
  }));
}

type FudgeFacingDir =
  | "progress"
  | "antiprogress"
  | "across"
  | "partnerward"
  | "neighborward";
export function fudgeFacing(
  keyframes: ByDancer<List<DancerKeyframe>>,
  facing: FudgeFacingDir
): ByDancer<List<DancerKeyframe>> {
  return keyframes.map((kfs) => {
    const unfudged = kfs.last()!;
    const wantCcw = (() => {
      switch (facing) {
        case "progress":
          return unfudged.end.progressDirection.y > 0 ? 1 / 4 : -1 / 4;
        case "antiprogress":
          return unfudged.end.progressDirection.y > 0 ? -1 / 4 : 1 / 4;
        case "across":
          return unfudged.end.posn.x < 0 ? 0 : 1 / 2;
        case "partnerward": {
          const partnerPosn = keyframes
            .get(unfudged.end.labels.partner)!
            .last()!.end.posn;
          return (
            Math.atan2(
              partnerPosn.y - unfudged.end.posn.y,
              partnerPosn.x - unfudged.end.posn.x
            ) /
            (2 * Math.PI)
          );
        }
        case "neighborward": {
          const neighborPosn = keyframes
            .get(unfudged.end.labels.neighbor!)!
            .last()!.end.posn;
          return (
            Math.atan2(
              neighborPosn.y - unfudged.end.posn.y,
              neighborPosn.x - unfudged.end.posn.x
            ) /
            (2 * Math.PI)
          );
        }
      }
    })();
    return kfs.set(kfs.size - 1, {
      ...unfudged,
      end: {
        ...unfudged.end,
        ccw: wantCcw + Math.round(unfudged.end.ccw - wantCcw),
      },
    });
  });
}

export function compose(
  init: ByDancer<DancerState>,
  pieces: Iterable<
    | ((cur: ByDancer<DancerState>) => ByDancer<List<DancerKeyframe>>)
    | { endThatMoveFacing: FudgeFacingDir }
  >
): ByDancer<List<DancerKeyframe>> {
  let res: ByDancer<List<DancerKeyframe>> = init.map((dancer) =>
    List.of({ beats: 0, end: dancer })
  );

  for (const piece of pieces) {
    const cur = res.size === 0 ? init : getCurState(res);
    if (typeof piece === "function") {
      const newKfs = addRestKeyframes(cur, piece(cur));
      res = res.map((kfs, id) => kfs.concat(newKfs.get(id, List())));
    } else {
      res = fudgeFacing(res, piece.endThatMoveFacing);
    }
  }

  return res;
}
