import { List } from "immutable";
import Victor from "victor";
import {
  InstructionDir,
  LARK,
  ByDancer,
  DancerState,
  ROBIN,
  DancerKeyframe,
  alignCcw,
  KeyframeFunc,
} from "./types";
import {
  ccwTowards,
  getTopoSquare,
  mathmod,
  sameSideOfSet,
  vavg,
} from "./util";
import {
  bak,
  crossSet,
  fwd,
  left,
  move,
  moves,
  partnerward,
  right,
} from "./contra";

export const swing: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    const maybeCounterpart = cur
      .entrySeq()
      .filter(
        ([, { role, posn }]) =>
          role !== dancer.role && sameSideOfSet(posn, dancer.posn)
      )
      .toList()
      .sortBy(
        ([cpid, { posn }]) =>
          posn.distance(dancer.posn) +
          (cpid === dancer.labels.partner
            ? 0
            : cpid === dancer.labels.neighbor
            ? 0.2
            : 10)
      )
      .first();
    if (!maybeCounterpart) {
      throw new Error(`${id} has nobody to swing with`);
    }
    const [, counterpart] = maybeCounterpart;

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

export const robinsChain: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    if (dancer.role === LARK) {
      return moves(dancer, [
        { beats: beats / 2, dx: right(1.5), dccw: 1 / 2 },
        { beats: beats / 4, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
        { beats: beats / 4, dccw: 1 },
      ]);
    } else {
      const expectedTurnerPosn = dancer.posn.clone().add(crossSet(dancer, 2));
      const possibleTurners = cur
        .entrySeq()
        .filter(
          ([, { role, posn }]) =>
            role === LARK &&
            !sameSideOfSet(posn, dancer.posn) &&
            posn.distance(expectedTurnerPosn) < 0.5
        )
        .toList();
      if (possibleTurners.isEmpty()) {
        throw new Error(`${id} has nobody to chain to`);
      }
      if (possibleTurners.size > 1) {
        throw new Error(
          `${id} is unsure who to chain to: options ${possibleTurners}`
        );
      }
      const [, turner] = possibleTurners.first()!;

      return moves(dancer, [
        { beats: beats / 4, dx: fwd(1).add(left(1.3)), dccw: 1 / 4 },
        { beats: beats / 4, dx: fwd(2).add(left(1)), dccw: 0 },
        { beats: beats / 4, dx: fwd(2.5).add(left(1.5)), dccw: 1 / 4 },
        {
          beats: beats / 4,
          x: turner.posn.clone().addScalarY(turner.posn.x < 0 ? -2 : 2),
          dccw: 1 / 2,
        },
      ]);
    }
  });

export const formWave: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) =>
    moves(dancer, [
      {
        beats,
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
        ccw: alignCcw({
          dir: dancer.progressDirection === "up" ? 1 / 4 : -1 / 4,
          near: dancer.ccw,
        }),
      },
    ])
  );

export const waveBalanceBellySlide: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) => {
    return moves(dancer, [
      { beats: beats / 8, dx: right(0.2) },
      { beats: beats / 8, dx: right(0.2) },
      { beats: beats / 8, dx: left(0.2) },
      { beats: beats / 8, dx: left(0.2) },
      { beats: beats / 2, dx: right(), dccw: -1 },
    ]).concat(
      moves(move(dancer, { dx: right(), dccw: -1 }), [
        { beats: beats / 8, dx: left(0.2) },
        { beats: beats / 8, dx: left(0.2) },
        { beats: beats / 8, dx: right(0.2) },
        { beats: beats / 8, dx: right(0.2) },
        { beats: beats / 2, dx: left(), dccw: 1 },
      ])
    );
  });

export const ringBalance: KeyframeFunc<{
  withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
}> = (cur, { beats, withYour = ["partner", "neighbor"] }) =>
  cur.map((dancer, id) => {
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
        beats: beats / 4,
        x: dancer.posn.clone().add(centerward(0.3)),
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }),
      },
      {
        beats: beats / 4,
        x: dancer.posn.clone().add(centerward(0.3)),
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }),
      },
      {
        beats: beats / 4,
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }),
      },
      {
        beats: beats / 4,
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }),
      },
    ]);
  });

export const petronellaSpin: KeyframeFunc<{
  withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
}> = (cur, { beats, withYour = ["partner", "neighbor"] }) =>
  cur.map((dancer, id) => {
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
        beats,
        x: rightCounter.state.posn,
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }) - 1 + 1 / 4,
      },
    ]);
  });

export const balance: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    const expectedCounterpartPosn = move(dancer, { dx: fwd(2) }).posn;
    const possibleCounterparts = cur
      .entrySeq()
      .filter(([, { posn }]) => posn.distance(expectedCounterpartPosn) < 0.5)
      .toList();
    if (possibleCounterparts.isEmpty()) {
      throw new Error(`${id} has nobody to balance with`);
    }
    if (possibleCounterparts.size > 1) {
      throw new Error(
        `dancer ${id} isn't sure who to balance with: options ${possibleCounterparts}`
      );
    }
    const [, counterpart] = possibleCounterparts.first()!;

    return moves(dancer, [
      {
        beats: beats / 4,
        x: vavg(dancer.posn, counterpart.posn, [3, 1]),
      },
      {
        beats: beats / 4,
        x: vavg(dancer.posn, counterpart.posn, [3, 1]),
      },
      { beats: beats / 4 },
      { beats: beats / 4 },
    ]);
  });

export const boxTheGnat: KeyframeFunc<{
  withYour: keyof DancerState["labels"];
}> = (cur, { beats, withYour }) =>
  cur.map((dancer, id) => {
    const counterpartId = dancer.labels[withYour];
    if (!counterpartId) {
      throw new Error(
        `dancer ${id} failed to find their ${withYour} to box with`
      );
    }
    const counterpart = cur.get(counterpartId)!;
    const finalCcw =
      ccwTowards(dancer.posn, counterpart.posn) +
      (dancer.role === LARK ? -1 / 4 : 1 / 4);
    return moves(dancer, [
      {
        beats,
        x: counterpart.posn,
        ccw:
          alignCcw({ dir: finalCcw, near: dancer.ccw }) +
          (dancer.role === ROBIN ? 1 : 0),
      },
    ]);
  });

export const rightLeftThrough: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) => {
    // TODO: ensure facing across
    return moves(dancer, [
      {
        beats: beats / 2,
        dx: fwd(2),
        dccw: (1 / 4) * (dancer.role === LARK ? -1 : 1),
      },
      {
        beats: beats / 2,
        dx: fwd(2).add(partnerward(dancer, 2)),
        dccw: (1 / 2) * (dancer.role === LARK ? -1 : 1),
      },
    ]);
  });

export const larksRollAway: KeyframeFunc<{
  your: keyof DancerState["labels"];
}> = (cur, { beats, your }) =>
  cur.map((dancer, id) => {
    const counterpartId = dancer.labels[your];
    if (!counterpartId) {
      throw new Error(
        `dancer ${id} failed to find their ${your} to roll away with`
      );
    }
    const counterpart = cur.get(counterpartId)!;
    return moves(dancer, [
      {
        beats,
        x: counterpart.posn,
        dccw: dancer.role === LARK ? 0 : -1,
      },
    ]);
  });

export const circle: KeyframeFunc<{
  handedness: "left" | "right";
  spots: number;
  withYour: [keyof DancerState["labels"], keyof DancerState["labels"]];
}> = (cur, { beats, handedness, spots, withYour }) =>
  cur.map((dancer, id) => {
    const { leftCounter, rightCounter, opposite } = getTopoSquare(
      cur,
      id,
      withYour[0],
      withYour[1]
    );

    return moves(
      dancer,
      Array.from({ length: spots }, (_, i) => i + 1).map((spotInd) => ({
        beats: beats / spots,
        x: [dancer, leftCounter.state, opposite.state, rightCounter.state][
          mathmod(spotInd * (handedness === "left" ? 1 : -1), 4)
        ].posn,
        dccw: (handedness === "left" ? -1 : 1) * (spotInd / 4),
      }))
    );
  });

export const passThrough: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) =>
    moves(dancer, [
      { beats: beats / 2, dx: fwd(1).add(left(0.3)) },
      { beats: beats / 2, dx: fwd(2) },
    ])
  );

export const doSiDo1: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) =>
    moves(dancer, [
      { beats: beats / 4, dx: fwd(1).add(left(0.3)) },
      { beats: beats / 4, dx: fwd(2) },
      { beats: beats / 4, dx: fwd(1).add(right(0.3)) },
      { beats: beats / 4 },
    ])
  );

export const doSiDo112: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer) =>
    moves(dancer, [
      { beats: beats / 6, dx: fwd(1).add(left(0.3)) },
      { beats: beats / 6, dx: fwd(2) },
      { beats: beats / 6, dx: fwd(1).add(right(0.3)) },
      { beats: beats / 6 },
      { beats: beats / 6, dx: fwd(1).add(left(0.3)) },
      { beats: beats / 6, dx: fwd(2) },
    ])
  );

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
