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

export type InstructionDir =
  | "up"
  | "down"
  | "across"
  | "out"
  | "progressward"
  | "antiprogressward"
  | "partnerward"
  | "neighborward";
export type CcwTurns = number;
export type ProgressDirection = "up" | "down";
export const PD_UP = "up" as ProgressDirection;
export const PD_DOWN = "down" as ProgressDirection;
export type DancerId = string;

export const fwd = (len: number = 1) => new Victor(len, 0);
export const bak = (len: number = 1) => new Victor(-len, 0);
export const left = (len: number = 1) => new Victor(0, len);
export const right = (len: number = 1) => new Victor(0, -len);
export const partnerward = ({ role }: { role: Role }, len: number = 1) =>
  role === LARK ? right(len) : left(len);
export const progressward = (dancer: DancerState, len: number = 1) =>
  dancer.progressDirection === "up" ? new Victor(0, len) : new Victor(0, -len);
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

export interface Subroutine {
  name: string;
  beats: number;
  buildKeyframes: (
    cur: ByDancer<DancerState>
  ) => ByDancer<List<DancerKeyframe>>;
}

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

export function swing({
  beats,
  withYour,
}: {
  beats: number;
  withYour: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `swing your ${withYour}`,
    beats,
    buildKeyframes: (cur) => swingKfs(cur, { withYour, beats }),
  };
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

export function robinsChainAcross({
  toYour,
}: {
  toYour: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `robins chain to your ${toYour}`,
    beats: 8,
    buildKeyframes: (cur) => robinsChainAcrossKfs(cur, { toYour }),
  };
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
          .add(
            new Victor(
              0,
              dancer.progressDirection === "up" ? 1 : -1
            ).multiplyScalar(3 / 4)
          )
          .add(
            new Victor(0, dancer.progressDirection === "up" ? 1 : -1)
              .multiplyScalar(1 / 2)
              .rotate(Math.PI / 2)
          ),
        ccw:
          (dancer.progressDirection === "up" ? 1 / 4 : -1 / 4) +
          Math.round(
            dancer.ccw - (dancer.progressDirection === "up" ? 1 / 4 : -1 / 4)
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

export function getTopoSquare(
  cur: ByDancer<DancerState>,
  cornerId: DancerId,
  label1: keyof DancerState["labels"],
  label2: keyof DancerState["labels"]
): {
  leftCounter: { id: DancerId; state: DancerState };
  rightCounter: { id: DancerId; state: DancerState };
  opposite: { id: DancerId; state: DancerState };
} {
  const dancer = cur.get(cornerId)!;
  const counterId1 = dancer.labels[label1]!;
  const counterId2 = dancer.labels[label2]!;
  const counter1 = cur.get(counterId1)!;
  const counter2 = cur.get(counterId2)!;
  const oppositeId = counter1.labels[label2]!;
  if (oppositeId !== counter2.labels[label1]) {
    throw new Error(
      `dancer ${cornerId} has ${label1}=${dancer.labels[label1]} and ${label2}=${dancer.labels[label2]} but ${counter1}'s ${label2} is ${counter1.labels[label2]} while ${counter2}'s ${label1} is ${counter2.labels[label1]}`
    );
  }
  const opposite = cur.get(oppositeId)!;

  const counter1IsRight = (() => {
    const toCounter1 = counter1.posn.clone().subtract(dancer.posn);
    const toCounter2 = counter2.posn.clone().subtract(dancer.posn);
    return toCounter1.cross(toCounter2) > 0;
  })();

  return {
    leftCounter: counter1IsRight
      ? { id: counterId2, state: counter2 }
      : { id: counterId1, state: counter1 },
    rightCounter: counter1IsRight
      ? { id: counterId1, state: counter1 }
      : { id: counterId2, state: counter2 },
    opposite: { id: oppositeId, state: opposite },
  };
}

export function ringBalance({
  withYour = ["partner", "neighbor"],
}: {
  withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
} = {}): Subroutine {
  return {
    name: `balance the ring with your ${withYour[0]} and ${withYour[1]}`,
    beats: 4,
    buildKeyframes: (cur) => {
      return cur.map((dancer, id) => {
        const { leftCounter, rightCounter } = getTopoSquare(
          cur,
          id,
          withYour[0],
          withYour[1]
        );
        const center = leftCounter.state.posn
          .clone()
          .add(rightCounter.state.posn)
          .divideScalar(2);
        const centerCcw = ccwTowards(dancer.posn, center);
        const centerward = (len: number) =>
          center.clone().subtract(dancer.posn).normalize().multiplyScalar(len);

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
        ]);
      });
    },
  };
}

export function vavg(
  v1: Victor,
  v2: Victor,
  weights: [number, number] = [1, 1]
): Victor {
  return v1
    .clone()
    .multiplyScalar(weights[0])
    .add(v2.clone().multiplyScalar(weights[1]))
    .divideScalar(weights[0] + weights[1]);
}

export function petronellaSpin({
  withYour = ["partner", "neighbor"],
}: {
  withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
} = {}): Subroutine {
  return {
    name: `petronella spin with your ${withYour[0]} and ${withYour[1]}`,
    beats: 4,
    buildKeyframes: (cur) => {
      return cur.map((dancer, id) => {
        const { leftCounter, rightCounter } = getTopoSquare(
          cur,
          id,
          withYour[0],
          withYour[1]
        );
        const center = vavg(leftCounter.state.posn, rightCounter.state.posn);
        const centerCcw = ccwTowards(dancer.posn, center);

        // debugger;
        return moves(dancer, [
          {
            beats: 4,
            x: rightCounter.state.posn,
            ccw: centerCcw + Math.round(dancer.ccw - centerCcw) - 1 + 1 / 4,
          },
        ]);
      });
    },
  };
}

export function balance({
  withYour,
}: {
  withYour: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `balance your ${withYour}`,
    beats: 4,
    buildKeyframes: (cur) => balanceKfs(cur, { withYour }),
  };
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
        x: vavg(dancer.posn, counterpart.posn, [3, 1]),
      },
      {
        beats: 1,
        x: vavg(dancer.posn, counterpart.posn, [3, 1]),
      },
      { beats: 1 },
      { beats: 1 },
    ]);
  });
}

export function boxTheGnat({
  withYour,
}: {
  withYour: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `box the gnat with your ${withYour}`,
    beats: 4,
    buildKeyframes: (cur) => boxTheGnatKfs(cur, { withYour }),
  };
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
      ccwTowards(dancer.posn, counterpart.posn) +
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

export function ccwTowards(from: Victor, to: Victor): number {
  return Math.atan2(to.y - from.y, to.x - from.x) / (2 * Math.PI);
}

export function fudgeFacing(
  keyframes: ByDancer<List<DancerKeyframe>>,
  dir: InstructionDir | ((d: DancerState) => InstructionDir)
): ByDancer<List<DancerKeyframe>> {
  return keyframes.map((kfs) => {
    const unfudged = kfs.last()!;
    const wantCcw = (() => {
      const dancerDir = typeof dir === "function" ? dir(unfudged.end) : dir;
      switch (dancerDir) {
        case "up":
          return 1 / 4;
        case "down":
          return -1 / 4;
        case "across":
          return unfudged.end.posn.x < 0 ? 0 : 1 / 2;
        case "out":
          return unfudged.end.posn.x >= 0 ? 0 : 1 / 2;
        case "progressward":
          return unfudged.end.progressDirection === "up" ? 1 / 4 : -1 / 4;
        case "antiprogressward":
          return unfudged.end.progressDirection === "up" ? -1 / 4 : 1 / 4;
        case "partnerward": {
          const partnerPosn = keyframes
            .get(unfudged.end.labels.partner)!
            .last()!.end.posn;
          return ccwTowards(unfudged.end.posn, partnerPosn);
        }
        case "neighborward": {
          const neighborPosn = keyframes
            .get(unfudged.end.labels.neighbor!)!
            .last()!.end.posn;
          return ccwTowards(unfudged.end.posn, neighborPosn);
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
  pieces: Iterable<Subroutine | { endThatMoveFacing: InstructionDir }>
): ByDancer<List<DancerKeyframe>> {
  let res: ByDancer<List<DancerKeyframe>> = init.map((dancer) =>
    List.of({ beats: 0, end: dancer })
  );

  for (const piece of pieces) {
    const cur = res.size === 0 ? init : getCurState(res);
    if ("endThatMoveFacing" in piece) {
      res = fudgeFacing(res, piece.endThatMoveFacing);
    } else {
      try {
        const newKfss = piece.buildKeyframes(cur);
        res = res.map((oldKfs, id) => {
          const newKfs = newKfss.get(id, List<DancerKeyframe>());
          const newKfsBeats = newKfs.reduce((t, kf) => t + kf.beats, 0);
          if (newKfsBeats > piece.beats) {
            throw new Error(
              `dancer ${id} has ${newKfsBeats} beats of keyframes to accomplish but subroutine has only ${piece.beats} beats`
            );
          }
          if (newKfsBeats === piece.beats) {
            return oldKfs.concat(newKfs);
          }
          return oldKfs.concat(newKfs).push({
            beats: piece.beats - newKfsBeats,
            end: oldKfs.concat(newKfs).last()!.end,
          });
        });
      } catch (e) {
        throw new CompositionError(errstr(e), res, piece);
      }
    }
  }

  return res;
}

function errstr(e: unknown): string {
  return e instanceof Error
    ? e.message
    : e instanceof Object
    ? e.toString()
    : JSON.stringify(e);
}

export class CompositionError extends Error {
  partial: ByDancer<List<DancerKeyframe>>;
  subroutine: Subroutine;

  constructor(
    message: string,
    partial: ByDancer<List<DancerKeyframe>>,
    subroutine: Subroutine
  ) {
    super(message);
    this.name = "CompositionError";
    this.partial = partial;
    this.subroutine = subroutine;
  }
}
