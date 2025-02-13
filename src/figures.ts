import { List } from "immutable";
import Victor from "victor";
import {
  InstructionDir,
  LARK,
  ByDancer,
  DancerState,
  ROBIN,
  Subroutine,
  DancerKeyframe,
  alignCcw,
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
  executeDance,
  fwd,
  left,
  move,
  moves,
  partnerward,
  right,
} from "./contra";

export function swing({ beats }: { beats: number }): Subroutine {
  return {
    name: `swing`,
    beats,
    buildKeyframes: (cur) =>
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
      }),
  };
}

export function robinsChain(): Subroutine {
  return {
    name: `robins chain`,
    beats: 8,
    buildKeyframes: (cur) =>
      cur.map((dancer, id) => {
        if (dancer.role === LARK) {
          return moves(dancer, [
            { beats: 4, dx: right(1.5), dccw: 1 / 2 },
            { beats: 2, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
            { beats: 2, dccw: 1 },
          ]);
        } else {
          const expectedTurnerPosn = dancer.posn
            .clone()
            .add(crossSet(dancer, 2));
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
      }),
  };
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
        ccw: alignCcw({
          dir: dancer.progressDirection === "up" ? 1 / 4 : -1 / 4,
          near: dancer.ccw,
        }),
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

export function ringBalance({
  withYour = ["partner", "neighbor"],
  beats = 4,
}: {
  withYour?: [keyof DancerState["labels"], keyof DancerState["labels"]];
  beats?: number;
} = {}): Subroutine {
  return {
    name: `balance the ring with your ${withYour[0]} and ${withYour[1]}`,
    beats,
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
    },
  };
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
            ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }) - 1 + 1 / 4,
          },
        ]);
      });
    },
  };
}

export function balance(): Subroutine {
  return {
    name: `balance`,
    beats: 4,
    buildKeyframes: (cur) =>
      cur.map((dancer, id) => {
        const expectedCounterpartPosn = move(dancer, { dx: fwd(2) }).posn;
        const possibleCounterparts = cur
          .entrySeq()
          .filter(
            ([, { posn }]) => posn.distance(expectedCounterpartPosn) < 0.5
          )
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
      }),
  };
}

export function boxTheGnat({
  withYour,
}: {
  withYour: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `box the gnat with your ${withYour}`,
    beats: 4,
    buildKeyframes: (cur) =>
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
            beats: 4,
            x: counterpart.posn,
            ccw:
              alignCcw({ dir: finalCcw, near: dancer.ccw }) +
              (dancer.role === ROBIN ? 1 : 0),
          },
        ]);
      }),
  };
}

export function rightLeftThrough({
  beats = 4,
}: { beats?: number } = {}): Subroutine {
  return {
    name: "right left through",
    beats,
    buildKeyframes: (cur) =>
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
      }),
  };
}

export function larksRollAway({
  beats = 4,
  your,
}: {
  beats?: number;
  your: keyof DancerState["labels"];
}): Subroutine {
  return {
    name: `larks roll away your ${your}`,
    beats,
    buildKeyframes: (cur) =>
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
      }),
  };
}

export function circle({
  handedness,
  spots,
  withYour = ["partner", "neighbor"],
  beats = 8,
}: {
  handedness: "left" | "right";
  spots: number;
  withYour: [keyof DancerState["labels"], keyof DancerState["labels"]];
  beats?: number;
}): Subroutine {
  return {
    name: `circle ${handedness} ${spots} spots with your ${withYour[0]} and ${withYour[1]}`,
    beats,
    buildKeyframes: (cur) =>
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
      }),
  };
}

export function passThrough({
  beats = 2,
}: { beats?: number } = {}): Subroutine {
  return {
    name: `pass through`,
    beats,
    buildKeyframes: (cur) =>
      cur.map((dancer) =>
        moves(dancer, [
          { beats: beats / 2, dx: fwd(1).add(left(0.3)) },
          { beats: beats / 2, dx: fwd(2) },
        ])
      ),
  };
}

export function doSiDo1({ beats = 8 }: { beats?: number } = {}): Subroutine {
  return {
    name: `do si do`,
    beats,
    buildKeyframes: (cur) =>
      cur.map((dancer) =>
        moves(dancer, [
          { beats: beats / 4, dx: fwd(1).add(left(0.3)) },
          { beats: beats / 4, dx: fwd(2) },
          { beats: beats / 4, dx: fwd(1).add(right(0.3)) },
          { beats: beats / 4 },
        ])
      ),
  };
}

export function doSiDo112({ beats = 12 }: { beats?: number } = {}): Subroutine {
  return {
    name: `do si do 1 1/2`,
    beats,
    buildKeyframes: (cur) =>
      cur.map((dancer) =>
        moves(dancer, [
          { beats: beats / 6, dx: fwd(1).add(left(0.3)) },
          { beats: beats / 6, dx: fwd(2) },
          { beats: beats / 6, dx: fwd(1).add(right(0.3)) },
          { beats: beats / 6 },
          { beats: beats / 6, dx: fwd(1).add(left(0.3)) },
          { beats: beats / 6, dx: fwd(2) },
        ])
      ),
  };
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

export function balanceAndSwing({
  totalBeats,
}: {
  totalBeats: number;
}): Subroutine {
  return {
    name: `balance and swing`,
    beats: totalBeats,
    buildKeyframes: (cur) => {
      const bal = balance();
      const sw = swing({ beats: totalBeats - bal.beats });
      const res = executeDance({ init: cur, calls: List([bal, sw]) });
      return res;
    },
  };
}
