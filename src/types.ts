import Victor from "victor";
import { List, Map } from "immutable";

export type Role = "lark" | "robin";
export const LARK = "lark" as Role;
export const ROBIN = "robin" as Role;

export type ProgressDirection = "up" | "down";
export const PD_UP = "up" as ProgressDirection;
export const PD_DOWN = "down" as ProgressDirection;

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
export const alignCcw = ({ dir, near }: { dir: CcwTurns; near: CcwTurns }) =>
  dir + Math.round(near - dir);

export type DancerId = string;

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
export type Figure = { beats: number } & (
  | { name: "swing" }
  | { name: "balance" }
  | { name: "robinsChain" }
  | { name: "formWave" }
  | {
      name: "waveBalanceBellySlide";
      withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
    }
  | {
      name: "ringBalance";
      withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
    }
  | {
      name: "petronellaSpin";
      withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
    }
  | { name: "boxTheGnat"; withYour: keyof DancerState["labels"] }
  | { name: "rightLeftThrough" }
  | { name: "larksRollAway"; your: keyof DancerState["labels"] }
  | {
      name: "circle";
      handedness: "left" | "right";
      spots: number;
      withYour: [keyof DancerState["labels"], keyof DancerState["labels"]];
    }
  | { name: "passThrough" }
  | { name: "doSiDo1" }
  | { name: "doSiDo112" }
  | {
      name: "custom";
      buildKeyframes: (
        cur: ByDancer<DancerState>
      ) => ByDancer<List<DancerKeyframe>>;
    }
);

export type Call =
  | Figure
  | { endThatMoveFacing: InstructionDir }
  | { youAreNowFacingYourNewNeighbor: true };

export interface Dance {
  readonly init: ByDancer<DancerState>;
  readonly calls: List<Call>;
}

export type KeyframeFunc<Args> = (
  cur: ByDancer<DancerState>,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  args: { beats: number } & (Args extends void ? {} : Args)
) => ByDancer<List<DancerKeyframe>>;
export type KeyframeFuncArgs<KF extends KeyframeFunc<never>> =
  Parameters<KF>[1];
