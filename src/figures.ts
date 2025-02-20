import Victor from "victor";
import {
  LARK,
  ROBIN,
  alignCcw,
  KeyframeFunc,
  CounterpartRef,
  PD_UP,
  stringifyDancerId,
} from "./types";
import {
  ccwTowards,
  reCoord,
  mathmod,
  sameSideOfSet,
  vavg,
  getCounterpart,
  isFacing,
  LENGTH_PERIOD,
} from "./util";
import { fwd, left, move, moves, partnerward, right } from "./contra";

export const swing: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [counterpartId, counterpart] = getCounterpart(
      cur,
      protoId,
      counterpartRef
    );
    if (!sameSideOfSet(dancer.posn, counterpart.posn)) {
      throw new Error(
        `${protoId} is trying to swing with somebody across the set`
      );
    }
    if (!isFacing(dancer, counterpart.posn, { maxTurns: 0.501 })) {
      throw new Error(
        `${protoId} is trying to swing with somebody (${stringifyDancerId(
          counterpartId
        )}) they're not facing`
      );
    }

    const rc = reCoord(dancer.posn, counterpart.posn);
    const facingCounterpart = alignCcw({
      near: dancer.ccw,
      dir: ccwTowards({ from: dancer.posn, to: counterpart.posn }),
    });
    const extraCcw = -(dancer.role === ROBIN ? 1 / 2 : 0);
    const swapPosns =
      (dancer.posn.x < 0 !== (dancer.role === LARK)) !==
      dancer.posn.y < counterpart.posn.y;
    if (swapPosns) {
      return moves(dancer, [
        {
          beats: beats / 6,
          x: rc(0.5, 0.2),
          ccw: facingCounterpart - 1 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.7, 0.0),
          ccw: facingCounterpart - 1 / 2,
        },
        {
          beats: beats / 6,
          x: rc(0.5, -0.2),
          ccw: facingCounterpart - 3 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.3, 0.0),
          ccw: facingCounterpart - 4 / 4,
        },
        {
          beats: beats / 6,
          x: rc(0.5, 0.2),
          ccw: facingCounterpart - 5 / 4,
        },
        {
          beats: beats / 6,
          x: new Victor(dancer.posn.x < 0 ? -1 : 1, counterpart.posn.y),
          ccw: facingCounterpart - 5 / 4 + extraCcw,
        },
      ]);
    } else {
      return moves(dancer, [
        {
          beats: beats / 4,
          x: rc(0.5, 0.2),
          ccw: facingCounterpart - 1 / 4,
        },
        {
          beats: beats / 4,
          x: rc(0.7, 0.0),
          ccw: facingCounterpart - 2 / 4,
        },
        {
          beats: beats / 4,
          x: rc(0.5, -0.2),
          ccw: facingCounterpart - 3 / 4,
        },
        { beats: beats / 4, dccw: facingCounterpart - 3 / 4 + extraCcw },
      ]);
    }
  });

export const robinsChain: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpart }
) =>
  cur.map((dancer, protoId) => {
    if (dancer.role === LARK) {
      return moves(dancer, [
        { beats: beats / 2, dx: right(1.5), dccw: 1 / 2 },
        { beats: beats / 4, dx: right(1.3).add(fwd(0.3)), dccw: 3 / 4 },
        { beats: beats / 4, dccw: 1 },
      ]);
    } else {
      const [turnerId, turner] = getCounterpart(cur, protoId, counterpart, {
        maxDist: LENGTH_PERIOD * 1.5,
      });
      if (sameSideOfSet(dancer.posn, turner.posn)) {
        throw new Error(
          `${stringifyDancerId({
            protoId,
            h4Id: 0,
          })} is trying to chain to somebody (${stringifyDancerId(
            turnerId
          )}) on the same side of the set`
        );
      }

      return moves(dancer, [
        // commented out for now because it doesn't generalize to diagonal chains
        // { beats: beats / 4, dx: fwd(1).add(left(1.3)), dccw: 1 / 4 },
        // { beats: beats / 4, dx: fwd(2).add(left(1)), dccw: 0 },
        // { beats: beats / 4, dx: fwd(2.5).add(left(1.5)), dccw: 1 / 4 },
        {
          beats: beats,
          // beats: beats / 4,
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
              dancer.progressDirection === PD_UP ? 1 : -1
            ).multiplyScalar(3 / 4)
          )
          .add(
            new Victor(0, dancer.progressDirection === PD_UP ? 1 : -1)
              .multiplyScalar(1 / 2)
              .rotate(Math.PI / 2)
          ),
        ccw: alignCcw({
          dir: dancer.progressDirection === PD_UP ? 1 / 4 : -1 / 4,
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
    const [, partner] = getCounterpart(cur, id, { relation: "partner" });
    const [, neighbor] = getCounterpart(cur, id, { relation: "neighbor" });
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
    const [, partner] = getCounterpart(cur, id, { relation: "partner" });
    const [, neighbor] = getCounterpart(cur, id, { relation: "neighbor" });
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

export const balance: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [counterpartId, counterpart] = getCounterpart(
      cur,
      protoId,
      counterpartRef
    );
    if (!isFacing(dancer, counterpart.posn, { maxTurns: 0.51 })) {
      throw new Error(
        `${protoId} is trying to balance somebody (${stringifyDancerId(
          counterpartId
        )}) they're not facing`
      );
    }

    const rc = reCoord(dancer.posn, counterpart.posn);
    const facingCounterpart = alignCcw({
      near: dancer.ccw,
      dir: ccwTowards({ from: dancer.posn, to: counterpart.posn }),
    });
    return moves(dancer, [
      {
        beats: beats / 4,
        x: rc(0.3, 0),
        ccw: facingCounterpart,
      },
      {
        beats: beats / 4,
        x: rc(0.3, 0),
        ccw: facingCounterpart,
      },
      { beats: beats / 4, ccw: facingCounterpart },
      { beats: beats / 4, ccw: facingCounterpart },
    ]);
  });

export const boxTheGnat: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [counterpartId, counterpart] = getCounterpart(
      cur,
      protoId,
      counterpartRef
    );
    if (!isFacing(dancer, counterpart.posn, { maxTurns: 0.51 })) {
      throw new Error(
        `${protoId} is trying to box the gnat with somebody (${stringifyDancerId(
          counterpartId
        )}) they're not facing`
      );
    }
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

export const larksRollAway: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getCounterpart(cur, protoId, counterpartRef);
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
    const [, partner] = getCounterpart(cur, id, { relation: "partner" });
    const [, neighbor] = getCounterpart(cur, id, { relation: "neighbor" });
    const [, opposite] = getCounterpart(cur, id, { relation: "opposite" });
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

export const doSiDo1: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getCounterpart(cur, protoId, counterpartRef);
    const rc = reCoord(dancer.posn, counterpart.posn);
    return moves(dancer, [
      { beats: beats / 4, x: rc(0.5, 0.2) },
      { beats: beats / 4, x: rc(1.0, 0.0) },
      { beats: beats / 4, x: rc(0.5, -0.2) },
      { beats: beats / 4 },
    ]);
  });

export const doSiDo112: KeyframeFunc<CounterpartRef> = (
  cur,
  { beats, ...counterpartRef }
) =>
  cur.map((dancer, protoId) => {
    const [, counterpart] = getCounterpart(cur, protoId, counterpartRef);
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
