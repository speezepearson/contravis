import { List, Map } from "immutable";
import Victor from "victor";

const PI = Math.PI;

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

export type Angle = number;
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

export interface DancerState {
  role: Role;
  progressDirection: ProgressDirection;
  posn: Victor;
  facing: Angle;
}

export type DanceSet = Map<DancerId, DancerState>;

export function findPersonInDirection(
  state: DanceSet,
  offset: (dancer: DancerState) => Victor | null,
  slop: number = 0.2
): Map<DancerId, DancerId | null> {
  return state.map((dancer) => {
    const relposn = offset(dancer);
    if (!relposn) {
      return null;
    }
    const targetPosn = dancer.posn.clone().add(relposn.rotate(dancer.facing));
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

export function ensureSymmetric(counterparts: Map<DancerId, DancerId>) {
  for (const [id, counterpart] of counterparts.entries()) {
    const counterpartCounterpart = counterparts.get(counterpart);
    if (counterpartCounterpart !== id) {
      throw new Error(
        `for dancer ${id}, counterpart is ${counterpart} but that dancer's counterpart is ${counterpartCounterpart}`
      );
    }
  }
}

export function initImproper(nHandsFours: number): DanceSet {
  return Map(
    Array.from({ length: nHandsFours }).flatMap((_, h4i) => {
      return [
        [
          `L${h4i * 2}`,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            facing: PI / 2,
          },
        ],
        [
          `R${h4i * 2}`,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(1, h4i * 4),
            facing: PI / 2,
          },
        ],
        [
          `L${h4i * 2 + 1}`,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            facing: -PI / 2,
          },
        ],
        [
          `R${h4i * 2 + 1}`,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(-1, h4i * 4 + 2),
            facing: -PI / 2,
          },
        ],
      ];
    })
  );
}

export function initBeckett(nHandsFours: number): DanceSet {
  return Map(
    Array.from({ length: nHandsFours }).flatMap((_, h4i) => {
      return [
        [
          `L${h4i * 2}`,
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4 + 2),
            facing: 0,
          },
        ],
        [
          `R${h4i * 2}`,
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(-1, h4i * 4),
            facing: 0,
          },
        ],
        [
          `L${h4i * 2 + 1}`,
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4),
            facing: PI,
          },
        ],
        [
          `R${h4i * 2 + 1}`,
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(1, h4i * 4 + 2),
            facing: PI,
          },
        ],
      ];
    })
  );
}

export type Keyframe = {
  beats: number;
  end: DanceSet;
};

export function swingKfs(
  state: DanceSet,
  { beats = 4 }: { beats?: number } = {}
): List<Keyframe> {
  const counterparts = findPersonInDirection(state, () => fwd(2));

  const end = state.map((dancer, id) => {
    const counterpartId = counterparts.get(id);
    if (!counterpartId) {
      throw new Error("not implemented");
    }
    const counterpart = state.get(counterpartId)!;
    if (!(dancer.posn.x < 0 === counterpart.posn.x < 0)) {
      throw new Error(
        `dancers ${id} wants to swing with ${counterpartId}, but they're across the set`
      );
    }
    const swingerPosns = List.of(dancer.posn, counterpart.posn).sortBy(
      (p) => p.y
    );
    return {
      ...dancer,
      posn:
        dancer.posn.x < 0 === (dancer.role === LARK)
          ? swingerPosns.last()!
          : swingerPosns.first()!,
      facing: dancer.posn.x < 0 ? 0 : PI,
    };
  });

  return List.of({ beats, end });
}

export function robinsChainAcrossKfs(state: DanceSet): List<Keyframe> {
  const robinOpposites = findPersonInDirection(state, ({ role }) =>
    role === ROBIN ? fwd(2).add(partnerward({ role }, 2)) : null
  );

  const end = state.map((dancer, id) => {
    if (dancer.role !== ROBIN) {
      return dancer;
    }
    const oppositeId = robinOpposites.get(id);
    if (!oppositeId) {
      throw new Error("not implemented");
    }
    const opposite = state.get(oppositeId)!;

    // TODO: verify that they're chaining across the set, not up and down it

    return {
      ...dancer,
      posn: opposite.posn,
      facing: opposite.facing,
    };
  });

  return List.of({ beats: 8, end });
}
