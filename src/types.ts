import Victor from "victor";
import { List, Map } from "immutable";

export type Role = "lark" | "robin";
export const LARK = "lark" as Role;
export const ROBIN = "robin" as Role;

export type ProgressDirection = "up" | "down";
export const PD_UP = "up" as ProgressDirection;
export const PD_DOWN = "down" as ProgressDirection;

/**
 * A direction the caller might use to describe how dancers should move or face.
 */
export type InstructionDir =
  | "inFrontOfYou"
  | "toYourLeft"
  | "toYourRight"
  | "upTheSet"
  | "downTheSet"
  | "acrossTheSet"
  | "out"
  | "towardsYourPartner"
  | "towardsYourNeighbor"
  | "awayFromYourNeighbor";

export type CcwTurns = number;
export const alignCcw = ({ dir, near }: { dir: CcwTurns; near: CcwTurns }) =>
  dir + Math.round(near - dir);

export type ProtoId = "L1" | "R1" | "L2" | "R2";
export type DancerIdStr = `${ProtoId} ${number}`;
export interface DancerId {
  readonly protoId: ProtoId;
  readonly h4Id: number;
}
export function stringifyDancerId({ protoId, h4Id }: DancerId): DancerIdStr {
  return `${protoId} ${h4Id}`;
}
export function parseDancerId(id: DancerIdStr): DancerId {
  const [protoId, h4Id] = id.split(" ");
  return { protoId: protoId as ProtoId, h4Id: parseInt(h4Id) };
}

export interface DancerState {
  role: Role;
  progressDirection: ProgressDirection;
  posn: Victor;
  ccw: CcwTurns;
}
export type DancerKeyframe = { beats: number; end: DancerState };

export type ByProto<T> = Map<ProtoId, T>;
export type Figure = { beats: number } & (
  | { name: "swing" }
  | { name: "balance" }
  | { name: "robinsChain" }
  | { name: "formWave" }
  | { name: "waveBalanceBellySlide" }
  | {
      name: "ringBalance";
    }
  | {
      name: "petronellaSpin";
    }
  | { name: "boxTheGnat"; whom: "partner" | "neighbor" }
  | { name: "rightLeftThrough" }
  | {
      name: "larksRollAway";
      whom: "partner" | "neighbor" | "toYourLeft" | "toYourRight";
    }
  | {
      name: "circle";
      handedness: "left" | "right";
      spots: number;
    }
  | { name: "passThrough" }
  | { name: "doSiDo1" }
  | { name: "doSiDo112" }
  | {
      name: "custom";
      buildKeyframes: (
        cur: ByProto<DancerState>
      ) => ByProto<List<DancerKeyframe>>;
    }
);

export type Call =
  | Figure
  | { endThatMoveFacing: InstructionDir }
  | { youAreNowFacingYourNewNeighbor: true };

export interface Dance {
  readonly init: ByProto<DancerState>;
  readonly calls: List<Call>;
}

export type KeyframeFunc<Args> = (
  cur: ByProto<DancerState>,
  args: { beats: number } & (Args extends void ? object : Args)
) => ByProto<List<DancerKeyframe>>;
export type KeyframeFuncArgs<KF extends KeyframeFunc<never>> =
  Parameters<KF>[1];
