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
} from "./contra";
import { Map } from "immutable";
import Victor from "victor";

const PI = Math.PI;

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
            progressDirection: "up",
            posn: new Victor(-1, 0),
            facing: PI / 2,
          },
        ],
        [
          "R0",
          {
            role: ROBIN,
            progressDirection: "up",
            posn: new Victor(1, 0),
            facing: PI / 2,
          },
        ],
        [
          "L1",
          {
            role: LARK,
            progressDirection: "down",
            posn: new Victor(1, 2),
            facing: -PI / 2,
          },
        ],
        [
          "R1",
          {
            role: ROBIN,
            progressDirection: "down",
            posn: new Victor(-1, 2),
            facing: -PI / 2,
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
            progressDirection: "up",
            posn: new Victor(-1, 2),
            facing: 0,
          },
        ],
        [
          "R0",
          {
            role: ROBIN,
            progressDirection: "up",
            posn: new Victor(-1, 0),
            facing: 0,
          },
        ],
        [
          "L1",
          {
            role: LARK,
            progressDirection: "down",
            posn: new Victor(1, 0),
            facing: PI,
          },
        ],
        [
          "R1",
          {
            role: ROBIN,
            progressDirection: "down",
            posn: new Victor(1, 2),
            facing: PI,
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
          progressDirection: "up",
          posn: new Victor(0, 0),
          facing: 0,
        },
      ],
      [
        "Bob",
        {
          role: LARK,
          progressDirection: "up",
          posn: new Victor(1, 0),
          facing: PI,
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
    const kfs = swingKfs(state);
    const { end } = kfs.last()!;
    expect(end.get("L0")).toMatchObject({
      posn: new Victor(-1, 2),
      facing: 0,
    });
    expect(end.get("R0")).toMatchObject({
      posn: new Victor(1, 2),
      facing: PI,
    });
    expect(end.get("L1")).toMatchObject({
      posn: new Victor(1, 0),
      facing: PI,
    });
    expect(end.get("R1")).toMatchObject({
      posn: new Victor(-1, 0),
      facing: 0,
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
    const kfs = robinsChainAcrossKfs(state);
    const { end } = kfs.last()!;
    expect(end.get("L0")).toEqual(state.get("L0"));
    expect(end.get("L1")).toEqual(state.get("L1"));

    expect(end.get("R0")).toMatchObject({
      posn: state.get("R1")!.posn,
      facing: state.get("R1")!.facing,
    });
    expect(end.get("R1")).toMatchObject({
      posn: state.get("R0")!.posn,
      facing: state.get("R0")!.facing,
    });
  });
});
