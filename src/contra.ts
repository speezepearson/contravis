import { List } from "immutable";
import Victor from "victor";
import {
  DancerId,
  InstructionDir,
  LARK,
  ByDancer,
  DancerState,
  Role,
  Subroutine,
  DancerKeyframe,
  Call,
  alignCcw,
} from "./types";
import { ccwTowards } from "./util";

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
        ? dancer.posn.clone().add(dx.clone().rotate(2 * Math.PI * dancer.ccw))
        : dancer.posn,
    ccw:
      ccw !== undefined
        ? ccw
        : dccw !== undefined
        ? dancer.ccw + dccw
        : dancer.ccw,
  };
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
        ccw: alignCcw({ dir: wantCcw, near: unfudged.end.ccw }),
      },
    });
  });
}

export function compose(
  init: ByDancer<DancerState>,
  pieces: Iterable<Call>
): ByDancer<List<DancerKeyframe>> {
  let res: ByDancer<List<DancerKeyframe>> = init.map((dancer) =>
    List.of({ beats: 0, end: dancer })
  );

  for (const piece of pieces) {
    const cur = res.size === 0 ? init : getCurState(res);
    if ("endThatMoveFacing" in piece) {
      res = fudgeFacing(res, piece.endThatMoveFacing);
    } else if ("youAreNowFacingYourNewNeighbor" in piece) {
      const newNeighbors = findPersonInDirection(cur, () => fwd(2));
      res = res.map((kfs, id) => {
        const dancer = cur.get(id)!;
        return kfs.push({
          beats: 0,
          end: {
            ...dancer,
            labels: { ...dancer.labels, neighbor: newNeighbors.get(id)! },
          },
        });
      });
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
