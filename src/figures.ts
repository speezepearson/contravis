import Victor from "victor";
import { LARK, ROBIN, alignCcw, KeyframeFunc } from "./types";
import {
  ccwTowards,
  getDancer,
  getNearbyDancers,
  instructionDir2Vec,
  // getTopoSquare,
  isFacing,
  mathmod,
  neighborId,
  neighborProtoId,
  partnerId,
  partnerProtoId,
  sameSideOfSet,
  vavg,
} from "./util";
import { crossSet, fwd, left, move, moves, partnerward, right } from "./contra";

export const swing: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    const maybeCounterpart = getNearbyDancers(cur, dancer.posn, 3)
      .filter(
        (cp) =>
          cp.role !== dancer.role &&
          sameSideOfSet(cp.posn, dancer.posn) &&
          cp.posn.distance(dancer.posn) < 4 &&
          isFacing(dancer, cp.posn) &&
          isFacing(cp, dancer.posn)
      )
      .entrySeq()
      .minBy(([, { posn }]) => posn.distance(dancer.posn));
    if (!maybeCounterpart) {
      throw new Error(`${id} has nobody to swing with`);
    }
    const [, counterpart] = maybeCounterpart;

    const midpoint = vavg(dancer.posn, counterpart.posn);
    const toMidpointN = (len: number) =>
      midpoint.clone().subtract(dancer.posn).normalize().multiplyScalar(len);
    const extraCcw = -(dancer.role === ROBIN ? 1 / 2 : 0);
    const swapPosns =
      (dancer.posn.x < 0 !== (dancer.role === LARK)) !==
      dancer.posn.y < counterpart.posn.y;
    if (swapPosns) {
      return moves(dancer, [
        {
          beats: beats / 6,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (1 / 4))),
          dccw: -1 / 4,
        },
        {
          beats: beats / 6,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (0 / 4))),
          dccw: -1 / 2,
        },
        {
          beats: beats / 6,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (-1 / 4))),
          dccw: -3 / 4,
        },
        {
          beats: beats / 6,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (-2 / 4))),
          dccw: -4 / 4,
        },
        {
          beats: beats / 6,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (-3 / 4))),
          dccw: -5 / 4,
        },
        {
          beats: beats / 6,
          x: new Victor(dancer.posn.x < 0 ? -1 : 1, counterpart.posn.y),
          dccw: -5 / 4 + extraCcw,
        },
      ]);
    } else {
      return moves(dancer, [
        {
          beats: beats / 4,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (1 / 4))),
          dccw: -1 / 4,
        },
        {
          beats: beats / 4,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (0 / 4))),
          dccw: -2 / 4,
        },
        {
          beats: beats / 4,
          x: midpoint
            .clone()
            .add(toMidpointN(0.3).rotate(2 * Math.PI * (-1 / 4))),
          dccw: -3 / 4,
        },
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

export const ringBalance: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    const partnerPosn = cur.get(partnerProtoId(id))!.posn;
    const neighborPosn = cur.get(neighborProtoId(id))!.posn;
    const center = vavg(partnerPosn, neighborPosn);
    const centerCcw = ccwTowards({ from: dancer.posn, to: center });
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

export const petronellaSpin: KeyframeFunc<void> = (cur, { beats }) =>
  cur.map((dancer, id) => {
    const partnerPosn = cur.get(partnerProtoId(id))!.posn;
    const neighborPosn = cur.get(neighborProtoId(id))!.posn;
    const center = vavg(partnerPosn, neighborPosn);
    const centerCcw = ccwTowards({ from: dancer.posn, to: center });
    const finalPosn =
      partnerPosn
        .clone()
        .subtract(dancer.posn)
        .cross(neighborPosn.clone().subtract(dancer.posn)) > 0
        ? partnerPosn
        : neighborPosn;

    // debugger;
    return moves(dancer, [
      {
        beats,
        x: finalPosn,
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

export const boxTheGnat: KeyframeFunc<{ whom: "partner" | "neighbor" }> = (
  cur,
  { beats, whom }
) =>
  cur.map((dancer, protoId) => {
    const counterpartId =
      whom === "partner"
        ? partnerId({ h4Id: 0, protoId })
        : neighborId({ h4Id: 0, protoId });
    if (!counterpartId) {
      throw new Error(
        `dancer ${protoId} failed to find somebody to box the gnat with`
      );
    }
    const counterpart = getDancer(cur, counterpartId)!;
    const finalCcw =
      ccwTowards({ from: dancer.posn, to: counterpart.posn }) +
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
  whom: "partner" | "neighbor" | "toYourLeft" | "toYourRight";
}> = (cur, { beats, whom }) =>
  cur.map((dancer, protoId) => {
    const counterpartId = (() => {
      switch (whom) {
        case "partner":
          return { h4Id: 0, protoId: partnerProtoId(protoId) };
        case "neighbor":
          return { h4Id: 0, protoId: neighborProtoId(protoId) };
        case "toYourLeft":
        case "toYourRight": {
          return getNearbyDancers(cur, dancer.posn, 2.2)
            .filter(({ role }) => role !== dancer.role)
            .filter(
              (cand) =>
                cand.posn
                  .clone()
                  .subtract(dancer.posn)
                  .normalize()
                  .dot(instructionDir2Vec(cur, protoId, "inFrontOfYou")) > -0.1
            )
            .filter(
              (cand) =>
                cand.posn
                  .clone()
                  .subtract(dancer.posn)
                  .normalize()
                  .cross(instructionDir2Vec(cur, protoId, whom)) > 0 // TODO: why does this work even though it should be backwards for robins?
            )
            .entrySeq()
            .minBy(([, cand]) => cand.posn.distance(dancer.posn))?.[0];
        }
      }
    })();
    if (!counterpartId) {
      throw new Error(
        `dancer ${protoId} failed to find ${whom} to roll away with`
      );
    }
    const counterpart = getDancer(cur, counterpartId)!;
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
}> = (cur, { beats, handedness, spots }) =>
  cur.map((dancer, id) => {
    const partnerPosn = cur.get(partnerProtoId(id))!.posn;
    const neighborPosn = cur.get(neighborProtoId(id))!.posn;
    const oppositePosn = cur.get(partnerProtoId(neighborProtoId(id)))!.posn;
    const rightPosn =
      partnerPosn
        .clone()
        .subtract(dancer.posn)
        .cross(neighborPosn.clone().subtract(dancer.posn)) > 0
        ? partnerPosn
        : neighborPosn;
    const leftPosn = rightPosn === partnerPosn ? neighborPosn : partnerPosn;
    const leftPosns = [dancer.posn, leftPosn, oppositePosn, rightPosn];

    return moves(
      dancer,
      Array.from({ length: spots }, (_, i) => i + 1).map((spotInd) => ({
        beats: beats / spots,
        x: leftPosns[mathmod(spotInd * (handedness === "left" ? 1 : -1), 4)],
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
