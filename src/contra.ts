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
export const upSet = (len: number = 1) => new Victor(0, len);
export const downSet = (len: number = 1) => new Victor(0, -len);
export const crossSet = (
  dancer: Pick<DancerState, "ccw" | "posn">,
  len: number = 1
) => (dancer.posn.x < 0 ? new Victor(len, 0) : new Victor(-len, 0));

export interface DancerState {
  role: Role;
  progressDirection: ProgressDirection;
  posn: Victor;
  ccw: CcwTurns;
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
      return [
        [
          `L${h4i * 2}`,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            ccw: 1 / 4,
          },
        ],
        [
          `R${h4i * 2}`,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(1, h4i * 4),
            ccw: 1 / 4,
          },
        ],
        [
          `L${h4i * 2 + 1}`,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            ccw: -1 / 4,
          },
        ],
        [
          `R${h4i * 2 + 1}`,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(-1, h4i * 4 + 2),
            ccw: -1 / 4,
          },
        ],
      ];
    })
  );
}

export function initBeckett(nHandsFours: number): ByDancer<DancerState> {
  return Map(
    Array.from({ length: nHandsFours }).flatMap((_, h4i) => {
      return [
        [
          `L${h4i * 2}`,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4 + 2),
            ccw: 0,
          },
        ],
        [
          `R${h4i * 2}`,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            ccw: 0,
          },
        ],
        [
          `L${h4i * 2 + 1}`,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4),
            ccw: 1 / 2,
          },
        ],
        [
          `R${h4i * 2 + 1}`,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            ccw: 1 / 2,
          },
        ],
      ];
    })
  );
}

export function swingKfs(
  state: ByDancer<DancerState>
): ByDancer<List<DancerKeyframe>> {
  const counterparts = findPersonInDirection(state, () => fwd(2));

  return state.map((dancer, id) => {
    const counterpartId = counterparts.get(id);
    if (!counterpartId) {
      throw new Error(`dancer ${id} failed to find somebody to swing with`);
    }
    const counterpart = state.get(counterpartId)!;
    if (!(dancer.posn.x < 0 === counterpart.posn.x < 0)) {
      throw new Error(
        `dancer ${id} wants to swing with ${counterpartId}, but they're across the set`
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
        { beats: 8 / 6, dx: fwd().add(left(0.3)), dccw: -1 / 4 },
        { beats: 8 / 6, dx: fwd().add(fwd(0.3)), dccw: -1 / 2 },
        { beats: 8 / 6, dx: fwd().add(right(0.3)), dccw: -3 / 4 },
        { beats: 8 / 6, dx: fwd().add(bak(0.3)), dccw: -4 / 4 },
        { beats: 8 / 6, dx: fwd().add(left(0.3)), dccw: -5 / 4 },
        { beats: 8 / 6, dx: fwd(2), dccw: -5 / 4 + extraCcw },
      ]);
    } else {
      return moves(dancer, [
        { beats: 2, dx: fwd().add(left(0.3)), dccw: -1 / 4 },
        { beats: 2, dx: fwd().add(fwd(0.3)), dccw: -2 / 4 },
        { beats: 2, dx: fwd().add(right(0.3)), dccw: -3 / 4 },
        { beats: 2, dccw: -3 / 4 + extraCcw },
      ]);
    }
  });
}

export function robinsChainAcrossKfs(
  state: ByDancer<DancerState>
): ByDancer<List<DancerKeyframe>> {
  const robinOpposites = findPersonInDirection(state, ({ role }) =>
    role === ROBIN ? fwd(2).add(partnerward({ role }, 2)) : null
  );

  return state.map((dancer, id) => {
    if (dancer.role === LARK) {
      return moves(dancer, [
        { beats: 4, dx: right(1.5), dccw: 1 / 2 },
        { beats: 2, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
        { beats: 2, dccw: 1 },
      ]);
    } else {
      const oppositeId = robinOpposites.get(id);
      if (!oppositeId) {
        throw new Error(
          `robin ${id} failed to find their opposite to chain with`
        );
      }
      const opposite = state.get(oppositeId)!;

      // TODO: verify that they're chaining across the set, not up and down it

      return moves(dancer, [
        { beats: 2, dx: fwd(1).add(left(1.3)), dccw: 1 / 4 },
        { beats: 2, dx: fwd(2).add(left(1)), dccw: 0 },
        { beats: 2, dx: fwd(2.5).add(left(1.5)), dccw: 1 / 4 },
        { beats: 2, x: opposite.posn, dccw: 1 / 2 },
      ]);
    }
  });
}

export function getCurState(
  kfs: ByDancer<List<DancerKeyframe>>,
  fallback: ByDancer<DancerState>
): ByDancer<DancerState> {
  return kfs.map((kfs, id) => {
    return kfs.last()?.end ?? fallback.get(id)!;
  });
}

export function extendKeyframes(
  prev: ByDancer<List<DancerKeyframe>>,
  next: (cur: ByDancer<DancerState>) => ByDancer<List<DancerKeyframe>>,
  { fallback }: { fallback?: ByDancer<DancerState> } = {}
): ByDancer<List<DancerKeyframe>> {
  const cur = getCurState(prev, fallback!);
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
