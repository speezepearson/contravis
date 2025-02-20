import Victor from "victor";
import {
  ByProto,
  CcwTurns,
  DancerId,
  DancerIdStr,
  DancerState,
  InstructionDir,
  LARK,
  Other,
  parseDancerId,
  PD_UP,
  ProtoId,
  ROBIN,
  Role,
  stringifyDancerId,
} from "./types";
import { Map } from "immutable";

export const LENGTH_PERIOD = 4;

export function ccwTowards({ from, to }: { from: Victor; to: Victor }): number {
  return Math.atan2(to.y - from.y, to.x - from.x) / (2 * Math.PI);
}
export function mathmod(a: number, b: number) {
  return ((a % b) + b) % b;
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

export function sameSideOfSet(p1: Victor, p2: Victor): boolean {
  return p1.x * p2.x > 0;
}

export function isFacing(
  { posn, ccw }: DancerState,
  dst: Victor,
  { maxTurns = 1 / 2 }: { maxTurns?: number }
): boolean {
  const facingDir = new Victor(1, 0).rotate(ccw * 2 * Math.PI);
  const dstDir = dst.clone().subtract(posn).normalize();
  const dot = facingDir.dot(dstDir);
  const threshold = Math.cos(maxTurns * 2 * Math.PI);
  return dot > threshold;
}

export function h4Offset(dancer: DancerState, h4Id: number): DancerState {
  return {
    ...dancer,
    posn: dancer.posn.clone().addScalarY(LENGTH_PERIOD * h4Id),
  };
}

export function getOther(
  protoStates: ByProto<DancerState>,
  id: ProtoId | DancerId,
  { relation, h4Offset }: Other,
  {
    maxDist = LENGTH_PERIOD * 0.99,
    checkSymmetry = true,
  }: { maxDist?: number; checkSymmetry?: boolean } = {}
): [DancerId, DancerState] {
  if (typeof id === "string") {
    id = { h4Id: 0, protoId: id };
  }
  const { protoId, h4Id } = id;
  const otherId = {
    h4Id:
      h4Id +
      (h4Offset ?? 0) *
        (protoStates.get(protoId)!.progressDirection === PD_UP ? 1 : -1), // What about shadows? Maybe this sign should be (neighbor ? (up ? 1 : -1) : partner ? (lark ? 1 : -1)).
    protoId: (() => {
      switch (relation) {
        case "partner":
          return partnerProtoId(protoId);
        case "neighbor":
          return neighborProtoId(protoId);
        case "opposite":
          return partnerProtoId(neighborProtoId(protoId));
      }
    })(),
  };
  const otherState = getDancer(protoStates, otherId);
  if (otherState.posn.distance(protoStates.get(protoId)!.posn) > maxDist) {
    throw new Error(
      `${protoId} is too far from ${JSON.stringify(
        otherId
      )} to meaningfully interact`
    );
  }

  if (checkSymmetry) {
    // Sanity check: this relationship should always be symmetric.
    const [nextId] = getOther(
      protoStates,
      otherId,
      { relation, h4Offset },
      { checkSymmetry: false }
    );
    if (!(nextId.protoId === protoId && nextId.h4Id === h4Id)) {
      throw new Error(
        `unexpectedly asymmetric interaction: ${JSON.stringify(
          id
        )} -> ${JSON.stringify(otherId)} -> ${JSON.stringify(nextId)}`
      );
    }
  }
  return [otherId, otherState];
}

export function getDancer(
  protoStates: ByProto<DancerState>,
  id: DancerId | DancerIdStr
): DancerState {
  if (typeof id === "string") {
    id = parseDancerId(id);
  }
  const protoState = protoStates.get(id.protoId)!;
  return h4Offset(protoState, id.h4Id);
}

export function getNearbyDancers(
  protoStates: ByProto<DancerState>,
  posn: Victor,
  radius: number
): Map<DancerIdStr, DancerState> {
  let res: Map<DancerIdStr, DancerState> = Map();
  const minY = posn.y - radius;
  const maxY = posn.y + radius;
  for (const [protoId, proto] of protoStates.entries()) {
    for (
      let h4Id = Math.round(minY - 1 - proto.posn.y);
      h4Id <= Math.round(maxY + 1 - proto.posn.y);
      h4Id++
    ) {
      const dancerId = stringifyDancerId({ protoId, h4Id });
      const dancer = getDancer(protoStates, dancerId);
      if (dancer.posn.distance(posn) <= radius) {
        res = res.set(dancerId, dancer);
      }
    }
  }
  return res;
}

/**
 * Calculate the angle corresponding to an instruction direction.
 */
export function instructionDir2Ccw(
  protoStates: ByProto<DancerState>,
  protoId: ProtoId,
  dir: InstructionDir
): CcwTurns {
  switch (dir) {
    case "inFrontOfYou":
      return protoStates.get(protoId)!.ccw;
    case "toYourLeft":
      return protoStates.get(protoId)!.ccw + 0.25;
    case "toYourRight":
      return protoStates.get(protoId)!.ccw - 0.25;
    case "upTheSet":
      return 0.25;
    case "downTheSet":
      return -0.25;
    case "acrossTheSet":
      return protoStates.get(protoId)!.posn.x < 0 ? 0 : 0.5;
    case "out":
      return protoStates.get(protoId)!.posn.x < 0 ? 0.5 : 0;
    case "towardsYourPartner":
      return ccwTowards({
        from: protoStates.get(protoId)!.posn,
        to: protoStates.get(partnerProtoId(protoId))!.posn,
      });
    case "towardsYourNeighbor":
      return ccwTowards({
        from: protoStates.get(protoId)!.posn,
        to: protoStates.get(neighborProtoId(protoId))!.posn,
      });
    case "awayFromYourNeighbor":
      return (
        instructionDir2Ccw(protoStates, protoId, "towardsYourNeighbor") + 0.5
      );
  }
}

export function instructionDir2Vec(
  protoStates: ByProto<DancerState>,
  protoId: ProtoId,
  dir: InstructionDir
): Victor {
  return new Victor(1, 0).rotate(
    2 * Math.PI * instructionDir2Ccw(protoStates, protoId, dir)
  );
}

export function partnerProtoId(id: ProtoId): ProtoId {
  switch (id) {
    case "L1":
      return "R1";
    case "R1":
      return "L1";
    case "L2":
      return "R2";
    case "R2":
      return "L2";
  }
}

export function neighborProtoId(id: ProtoId): ProtoId {
  switch (id) {
    case "L1":
      return "R2";
    case "R2":
      return "L1";
    case "L2":
      return "R1";
    case "R1":
      return "L2";
  }
}

export const structuredDancerId = (id: DancerId | DancerIdStr): DancerId => {
  if (typeof id === "string") {
    id = parseDancerId(id);
  }
  return { protoId: id.protoId, h4Id: id.h4Id };
};

export function shadowId(id: DancerId | DancerIdStr, offset: number): DancerId {
  id = structuredDancerId(id);
  return { protoId: partnerProtoId(id.protoId), h4Id: id.h4Id + offset };
}

export function partnerId(id: DancerId | DancerIdStr): DancerId {
  return shadowId(id, 0);
}

export function neighborId(
  id: DancerId | DancerIdStr,
  h4Offset: number = 0
): DancerId {
  id = structuredDancerId(id);
  return { protoId: neighborProtoId(id.protoId), h4Id: id.h4Id + h4Offset };
}

export function id2role(id: ProtoId): Role {
  switch (id) {
    case "L1":
    case "L2":
      return LARK;
    case "R1":
    case "R2":
      return ROBIN;
  }
}
export function otherRole(role: Role): Role {
  return role === LARK ? ROBIN : LARK;
}

export function reCoord(
  origin: Victor,
  x1: Victor
): (x: number, y: number) => Victor {
  const delta = x1.clone().subtract(origin);
  return (x, y) =>
    origin
      .clone()
      .add(delta.clone().multiplyScalar(x))
      .add(
        delta
          .clone()
          .rotate(Math.PI / 2)
          .multiplyScalar(y)
      );
}
