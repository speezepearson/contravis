import Victor from "victor";
import { ByDancer, DancerId, DancerState } from "./types";

export function ccwTowards(from: Victor, to: Victor): number {
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

export function sameSideOfSet(p1: Victor, p2: Victor): boolean {
  return p1.x * p2.x > 0;
}
