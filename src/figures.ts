import Victor from "victor";
import { LARK, ROBIN, alignCcw, KeyframeFunc, Other } from "./types";
import {
  ccwTowards,
  reCoord,
  mathmod,
  sameSideOfSet,
  vavg,
  getOther,
} from "./util";
import { fwd, left, move, moves, partnerward, right } from "./contra";

export const swing: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, id) => {
    const [, counterpart] = getOther(cur, id, other);
    if (!sameSideOfSet(dancer.posn, counterpart.posn)) {
      throw new Error(`${id} is trying to swing with somebody across the set`);
    }

    const rc = reCoord(dancer.posn, counterpart.posn);
    const extraCcw = -(dancer.role === ROBIN ? 1 / 2 : 0);
    const swapPosns =
      (dancer.posn.x < 0 !== (dancer.role === LARK)) !==
      dancer.posn.y < counterpart.posn.y;
    if (swapPosns) {
      return moves(dancer, [
        {
          beats: beats / 6,
          x: rc(0.5, 0.2),
          dccw: -1 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.7, 0.0),
          dccw: -1 / 2,
        },
        {
          beats: beats / 6,
          x: rc(0.5, -0.2),
          dccw: -3 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.3, 0.0),
          dccw: -4 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.5, 0.2),
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
          x: rc(0.5, 0.2),
          dccw: -1 / 4,
        },
        {
          beats: beats / 4,
          x: rc(0.7, 0.0),
          dccw: -2 / 4,
        },
        {
          beats: beats / 4,
          x: rc(0.5, -0.2),
          dccw: -3 / 4,
        },
        { beats: beats / 4, dccw: -3 / 4 + extraCcw },
      ]);
    }
  });

export const robinsChain: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, protoId) => {
    if (dancer.role === LARK) {
      return moves(dancer, [
        { beats: beats / 2, dx: right(1.5), dccw: 1 / 2 },
        { beats: beats / 4, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
        { beats: beats / 4, dccw: 1 },
      ]);
    } else {
      const [, turner] = getOther(cur, protoId, other);
      if (sameSideOfSet(dancer.posn, turner.posn)) {
        throw new Error(
          `${protoId} is trying to chain to somebody on the same side of the set`
        );
      }

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
    const [, partner] = getOther(cur, id, { relation: "partner" });
    const [, neighbor] = getOther(cur, id, { relation: "neighbor" });
    const center = vavg(partner.posn, neighbor.posn);
    const centerCcw = ccwTowards({ from: dancer.posn, to: center });

    const rc = reCoord(dancer.posn, center);
    return moves(dancer, [
      {
        beats: beats / 4,
        x: rc(0.3, 0.0),
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }),
      },
      {
        beats: beats / 4,
        x: rc(0.3, 0.0),
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
    const [, partner] = getOther(cur, id, { relation: "partner" });
    const [, neighbor] = getOther(cur, id, { relation: "neighbor" });
    const center = vavg(partner.posn, neighbor.posn);
    const centerCcw = ccwTowards({ from: dancer.posn, to: center });
    const finalPosn =
      partner.posn
        .clone()
        .subtract(dancer.posn)
        .cross(neighbor.posn.clone().subtract(dancer.posn)) > 0
        ? partner.posn
        : neighbor.posn;

    // debugger;
    return moves(dancer, [
      {
        beats,
        x: finalPosn,
        ccw: alignCcw({ dir: centerCcw, near: dancer.ccw }) - 1 + 1 / 4,
      },
    ]);
  });

export const balance: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getOther(cur, protoId, other);
    const rc = reCoord(dancer.posn, counterpart.posn);
    return moves(dancer, [
      {
        beats: beats / 4,
        x: rc(0.3, 0),
      },
      {
        beats: beats / 4,
        x: rc(0.3, 0),
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
    const [, counterpart] = getOther(cur, protoId, { relation: whom });
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

export const larksRollAway: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getOther(cur, protoId, other);
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
    const [, partner] = getOther(cur, id, { relation: "partner" });
    const [, neighbor] = getOther(cur, id, { relation: "neighbor" });
    const [, opposite] = getOther(cur, id, { relation: "opposite" });
    const rightPosn =
      partner.posn
        .clone()
        .subtract(dancer.posn)
        .cross(neighbor.posn.clone().subtract(dancer.posn)) > 0
        ? partner.posn
        : neighbor.posn;
    const leftPosn = rightPosn === partner.posn ? neighbor.posn : partner.posn;
    const leftPosns = [dancer.posn, leftPosn, opposite.posn, rightPosn];

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

export const doSiDo1: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getOther(cur, protoId, other);
    const rc = reCoord(dancer.posn, counterpart.posn);
    return moves(dancer, [
      { beats: beats / 4, x: rc(0.5, 0.2) },
      { beats: beats / 4, x: rc(1.0, 0.0) },
      { beats: beats / 4, x: rc(0.5, -0.2) },
      { beats: beats / 4 },
    ]);
  });

export const doSiDo112: KeyframeFunc<Other> = (cur, { beats, ...other }) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getOther(cur, protoId, other);
    const rc = reCoord(dancer.posn, counterpart.posn);
    return moves(dancer, [
      { beats: beats / 6, x: rc(0.5, +0.2) },
      { beats: beats / 6, x: rc(1.0, +0.0) },
      { beats: beats / 6, x: rc(0.5, -0.2) },
      { beats: beats / 6, x: rc(0.0, +0.0) },
      { beats: beats / 6, x: rc(0.5, +0.2) },
      { beats: beats / 6, x: rc(1, 0) },
    ]);
  });
