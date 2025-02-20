import { describe, expect, test } from "vitest";
import { LARK, ROBIN, PD_UP, PD_DOWN } from "./types";
import { List, Map } from "immutable";
import Victor from "victor";
import { robinsChain, swing } from "./figures";
import { initImproper, initBeckett } from "./formations";
import { find, find1 } from "./util";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deepRound = (x: any): any => {
  if (typeof x === "number") {
    return Math.round(x * 1000) / 1000;
  }
  if (Array.isArray(x)) {
    return x.map(deepRound);
  }
  if (x instanceof Victor) {
    return new Victor(deepRound(x.x), deepRound(x.y));
  }
  if (Map.isMap(x)) {
    return x.map((v) => deepRound(v));
  }
  if (List.isList(x)) {
    return x.map(deepRound);
  }
  if (typeof x === "object" && x !== null) {
    return Object.fromEntries(
      Object.entries(x).map(([k, v]) => [k, deepRound(v)])
    );
  }
  return x;
};

describe("initImproper", () => {
  test("smoke", () => {
    const state = initImproper();
    expect(state).toEqual(
      Map([
        [
          "L1",
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, 0),
            ccw: 1 / 4,
          },
        ],
        [
          "R1",
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(1, 0),
            ccw: 1 / 4,
          },
        ],
        [
          "L2",
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, 2),
            ccw: -1 / 4,
          },
        ],
        [
          "R2",
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(-1, 2),
            ccw: -1 / 4,
          },
        ],
      ])
    );
  });
});

describe("initBeckett", () => {
  test("smoke", () => {
    const state = initBeckett();
    expect(state).toEqual(
      Map([
        [
          "L1",
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, 2),
            ccw: 0,
          },
        ],
        [
          "R1",
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(-1, 0),
            ccw: 0,
          },
        ],
        [
          "L2",
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, 0),
            ccw: 1 / 2,
          },
        ],
        [
          "R2",
          {
            role: ROBIN,
            progressDirection: PD_DOWN,
            posn: new Victor(1, 2),
            ccw: 1 / 2,
          },
        ],
      ])
    );
  });
});

describe("find1", () => {
  test("improper", () => {
    const state = initImproper();
    const partner = find1(state, "L1", "towardsYourPartner");
    expect(partner).toEqual([{ h4Id: 0, protoId: "R1" }, state.get("R1")!]);

    const neighbor = find1(state, "L1", "towardsYourNeighbor");
    expect(neighbor).toEqual([{ h4Id: 0, protoId: "R2" }, state.get("R2")!]);
  });

  test("beckett", () => {
    const state = initBeckett();
    const partner = find1(state, "L1", "towardsYourPartner");
    expect(partner).toEqual([{ h4Id: 0, protoId: "R1" }, state.get("R1")!]);

    const neighbor = find1(state, "L1", "towardsYourNeighbor");
    expect(neighbor).toEqual([{ h4Id: 0, protoId: "R2" }, state.get("R2")!]);
  });
});

describe("find", () => {
  test("improper", () => {
    const state = initImproper();
    const partners = find(state, "towardsYourPartner");
    expect(partners.get("L1")).toStrictEqual({ h4Id: 0, protoId: "R1" });
    expect(partners.get("R1")).toStrictEqual({ h4Id: 0, protoId: "L1" });
    expect(partners.get("L2")).toStrictEqual({ h4Id: 0, protoId: "R2" });
    expect(partners.get("R2")).toStrictEqual({ h4Id: 0, protoId: "L2" });

    const neighbors = find(state, "inFrontOfYou");
    expect(neighbors.get("L1")).toStrictEqual({ h4Id: 0, protoId: "R2" });
    expect(neighbors.get("R1")).toStrictEqual({ h4Id: 0, protoId: "L2" });
    expect(neighbors.get("L2")).toStrictEqual({ h4Id: 0, protoId: "R1" });
    expect(neighbors.get("R2")).toStrictEqual({ h4Id: 0, protoId: "L1" });
  });

  test("beckett", () => {
    const state = initBeckett();
    const partners = find(state, "towardsYourPartner");
    expect(partners.get("L1")).toStrictEqual({ h4Id: 0, protoId: "R1" });
    expect(partners.get("R1")).toStrictEqual({ h4Id: 0, protoId: "L1" });
    expect(partners.get("L2")).toStrictEqual({ h4Id: 0, protoId: "R2" });
    expect(partners.get("R2")).toStrictEqual({ h4Id: 0, protoId: "L2" });

    const neighbors = find(state, "inFrontOfYou");
    expect(neighbors.get("L1")).toStrictEqual({ h4Id: 0, protoId: "R2" });
    expect(neighbors.get("R1")).toStrictEqual({ h4Id: 0, protoId: "L2" });
    expect(neighbors.get("L2")).toStrictEqual({ h4Id: 0, protoId: "R1" });
    expect(neighbors.get("R2")).toStrictEqual({ h4Id: 0, protoId: "L1" });
  });
});

describe("swing", () => {
  test("smoke", () => {
    const state = initImproper();
    const end = deepRound(
      swing(state, { beats: 8 }).map((kfs) => kfs.last()?.end)
    );
    expect(end.get("L1")).toMatchObject({
      posn: new Victor(-1, 2),
      ccw: -1,
    });
    expect(end.get("R1")).toMatchObject({
      posn: new Victor(1, 2),
      ccw: -3 / 2,
    });
    expect(end.get("L2")).toMatchObject({
      posn: new Victor(1, 0),
      ccw: -3 / 2,
    });
    expect(end.get("R2")).toMatchObject({
      posn: new Victor(-1, 0),
      ccw: -2,
    });
  });

  test("throws if no candidates to swing with", () => {
    const state = initBeckett().filter((_, id) => id !== "L1");
    expect(() => swing(state, { beats: 8 })).toThrow(/nobody to swing with/);
  });
});

describe("robinsChainAcross", () => {
  test("smoke", () => {
    const state = initBeckett();
    const end = robinsChain(state, { beats: 8 }).map((kfs) => kfs.last()?.end);
    expect(end.get("L1") ?? state.get("L1")).toEqual({
      ...state.get("L1"),
      ccw: state.get("L1")!.ccw + 1,
    });
    expect(end.get("L2") ?? state.get("L2")).toEqual({
      ...state.get("L2"),
      ccw: state.get("L2")!.ccw + 1,
    });

    expect(end.get("R1")).toMatchObject({
      posn: state.get("R2")!.posn,
      ccw: state.get("R1")!.ccw + 1 / 2,
    });
    expect(end.get("R2")).toMatchObject({
      posn: state.get("R1")!.posn,
      ccw: state.get("R2")!.ccw + 1 / 2,
    });
  });
});
