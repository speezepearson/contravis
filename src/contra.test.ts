import { describe, expect, test } from "vitest";
import {
  findPersonInDirection,
  ByDancer,
  initImproper,
  LARK,
  fwd,
  ROBIN,
  initBeckett,
  partnerward,
  swingKfs,
  robinsChainAcrossKfs,
  DancerState,
  PD_UP,
  PD_DOWN,
} from "./contra";
import { Map } from "immutable";
import Victor from "victor";

describe("initImproper", () => {
  test("gives right dancer ids", () => {
    expect(initImproper(1).keySeq().toArray()).toEqual([
      "L0",
      "R0",
      "L1",
      "R1",
    ]);
    expect(initImproper(2).keySeq().toArray()).toEqual([
      "L0",
      "R0",
      "L1",
      "R1",
      "L2",
      "R2",
      "L3",
      "R3",
    ]);
  });

  test("smoke", () => {
    const state = initImproper(1);
    expect(state).toEqual(
      Map([
        [
          "L0",
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, 0),
            ccw: 1 / 4,
          },
        ],
        [
          "R0",
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(1, 0),
            ccw: 1 / 4,
          },
        ],
        [
          "L1",
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, 2),
            ccw: -1 / 4,
          },
        ],
        [
          "R1",
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
  test("gives right dancer ids", () => {
    expect(initBeckett(1).keySeq().toArray()).toEqual(["L0", "R0", "L1", "R1"]);
    expect(initBeckett(2).keySeq().toArray()).toEqual([
      "L0",
      "R0",
      "L1",
      "R1",
      "L2",
      "R2",
      "L3",
      "R3",
    ]);
  });

  test("smoke", () => {
    const state = initBeckett(1);
    expect(state).toEqual(
      Map([
        [
          "L0",
          {
            role: LARK,
            progressDirection: PD_UP,
            posn: new Victor(-1, 2),
            ccw: 0,
          },
        ],
        [
          "R0",
          {
            role: ROBIN,
            progressDirection: PD_UP,
            posn: new Victor(-1, 0),
            ccw: 0,
          },
        ],
        [
          "L1",
          {
            role: LARK,
            progressDirection: PD_DOWN,
            posn: new Victor(1, 0),
            ccw: 1 / 2,
          },
        ],
        [
          "R1",
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

describe("findPersonInDirection", () => {
  test("smoke", () => {
    const state: ByDancer<DancerState> = Map([
      [
        "Alice",
        {
          role: ROBIN,
          progressDirection: PD_UP,
          posn: new Victor(0, 0),
          ccw: 0,
        },
      ],
      [
        "Bob",
        {
          role: LARK,
          progressDirection: PD_UP,
          posn: new Victor(1, 0),
          ccw: 1 / 2,
        },
      ],
    ]);
    const targets = findPersonInDirection(state, () => new Victor(1, 0));
    expect(targets.get("Alice")).toBe("Bob");
    expect(targets.get("Bob")).toBe("Alice");
  });

  test("improper", () => {
    const state = initImproper(1);
    const partners = findPersonInDirection(state, (dancer) =>
      partnerward(dancer, 2)
    );
    expect(partners.get("L0")).toBe("R0");
    expect(partners.get("R0")).toBe("L0");
    expect(partners.get("L1")).toBe("R1");
    expect(partners.get("R1")).toBe("L1");

    const neighbors = findPersonInDirection(state, () => fwd(2));
    expect(neighbors.get("L0")).toBe("R1");
    expect(neighbors.get("R0")).toBe("L1");
    expect(neighbors.get("L1")).toBe("R0");
    expect(neighbors.get("R1")).toBe("L0");

    const opposites = findPersonInDirection(state, (dancer) =>
      fwd(2).add(partnerward(dancer, 2))
    );
    expect(opposites.get("L0")).toBe("L1");
    expect(opposites.get("R0")).toBe("R1");
    expect(opposites.get("L1")).toBe("L0");
    expect(opposites.get("R1")).toBe("R0");
  });

  test("beckett", () => {
    const state = initBeckett(2);
    const partners = findPersonInDirection(state, (dancer) =>
      partnerward(dancer, 2)
    );
    expect(partners.get("L0")).toBe("R0");
    expect(partners.get("R0")).toBe("L0");
    expect(partners.get("L1")).toBe("R1");
    expect(partners.get("R1")).toBe("L1");

    const neighbors = findPersonInDirection(state, () => fwd(2));
    expect(neighbors.get("L0")).toBe("R1");
    expect(neighbors.get("R0")).toBe("L1");
    expect(neighbors.get("L1")).toBe("R0");
    expect(neighbors.get("R1")).toBe("L0");

    const opposites = findPersonInDirection(state, (dancer) =>
      fwd(2).add(partnerward(dancer, 2))
    );
    expect(opposites.get("L0")).toBe("L1");
    expect(opposites.get("R0")).toBe("R1");
    expect(opposites.get("L1")).toBe("L0");
    expect(opposites.get("R1")).toBe("R0");
  });
});

describe("swingKfs", () => {
  test("smoke", () => {
    const state = initImproper(1);
    console.log("L0 starts at", state.get("L0"));
    const end = swingKfs(state).map((kfs) => kfs.last()?.end);
    expect(end.get("L0")).toMatchObject({
      posn: new Victor(-1, 2),
      ccw: -1,
    });
    expect(end.get("R0")).toMatchObject({
      posn: new Victor(1, 2),
      ccw: -3 / 2,
    });
    expect(end.get("L1")).toMatchObject({
      posn: new Victor(1, 0),
      ccw: -3 / 2,
    });
    expect(end.get("R1")).toMatchObject({
      posn: new Victor(-1, 0),
      ccw: -2,
    });
  });

  test("throws if dancers are across the set", () => {
    const state = initBeckett(1);
    expect(() => swingKfs(state)).toThrow(/across the set/);
  });
});

describe("robinsChainAcrossKfs", () => {
  test("smoke", () => {
    const state = initBeckett(1);
    const end = robinsChainAcrossKfs(state).map((kfs) => kfs.last()?.end);
    expect(end.get("L0") ?? state.get("L0")).toEqual({
      ...state.get("L0"),
      ccw: state.get("L0")!.ccw + 1,
    });
    expect(end.get("L1") ?? state.get("L1")).toEqual({
      ...state.get("L1"),
      ccw: state.get("L1")!.ccw + 1,
    });

    expect(end.get("R0")).toMatchObject({
      posn: state.get("R1")!.posn,
      ccw: state.get("R0")!.ccw + 1 / 2,
    });
    expect(end.get("R1")).toMatchObject({
      posn: state.get("R0")!.posn,
      ccw: state.get("R1")!.ccw + 1 / 2,
    });
  });
});
