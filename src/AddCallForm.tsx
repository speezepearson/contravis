import { useMemo, useState } from "react";
import {
  balance,
  boxTheGnat,
  circle,
  doSiDo1,
  doSiDo112,
  larksRollAway,
  petronellaSpin,
  robinsChain,
  ringBalance,
  rightLeftThrough,
  swing,
  passThrough,
} from "./figures";
import { Call } from "./types";
import { List } from "immutable";

export type AddCallFormProps = {
  onAdd: (f: Call) => void;
};
export function AddCallForm({ onAdd }: AddCallFormProps) {
  const [search, setSearch] = useState("");
  const searchRegexp = useMemo(() => {
    const pat = search
      .split("")
      .map((w) => `(?:${w}|.*\\b${w})`)
      .join("");
    return new RegExp(pat);
  }, [search]);
  const searchTest = (s: string) => searchRegexp.test(s.toLowerCase());

  const calls: List<{ text: string; call: Call }> = useMemo(() => {
    return List([
      {
        text: "balance",
        call: balance(),
      },
      {
        text: "swing (8)",
        call: swing({ beats: 8 }),
      },
      {
        text: "swing (12)",
        call: swing({ beats: 8 }),
      },
      {
        text: "swing (16)",
        call: swing({ beats: 8 }),
      },
      {
        text: "box the gnat with your neighbor",
        call: boxTheGnat({ withYour: "neighbor" }),
      },
      {
        text: "box the gnat with your partner",
        call: boxTheGnat({ withYour: "partner" }),
      },
      {
        text: "petronella spin with your partner/neighbor",
        call: petronellaSpin({ withYour: ["partner", "neighbor"] }),
      },
      {
        text: "balance the ring with your partner/neighbor",
        call: ringBalance({ withYour: ["partner", "neighbor"] }),
      },
      {
        text: "robins chain",
        call: robinsChain(),
      },
      {
        text: "larks roll away your partner",
        call: larksRollAway({ your: "partner" }),
      },
      {
        text: "larks roll away your neighbor",
        call: larksRollAway({ your: "neighbor" }),
      },
      {
        text: "do si do once",
        call: doSiDo1(),
      },
      {
        text: "do si do 1 1/2",
        call: doSiDo112(),
      },
      {
        text: "circle left 3 with your partner and neighbor",
        call: circle({
          handedness: "left",
          spots: 3,
          withYour: ["partner", "neighbor"],
        }),
      },
      {
        text: "circle right 3 with your partner and neighbor",
        call: circle({
          handedness: "right",
          spots: 3,
          withYour: ["partner", "neighbor"],
        }),
      },
      {
        text: "circle left 4 with your partner and neighbor",
        call: circle({
          handedness: "left",
          spots: 4,
          withYour: ["partner", "neighbor"],
        }),
      },
      {
        text: "circle right 4 with your partner and neighbor",
        call: circle({
          handedness: "right",
          spots: 4,
          withYour: ["partner", "neighbor"],
        }),
      },
      { text: "pass through", call: passThrough() },
      { text: "face across", call: { endThatMoveFacing: "across" } },
      {
        text: "face your partner",
        call: { endThatMoveFacing: "partnerward" },
      },
      {
        text: "face your neighbor",
        call: { endThatMoveFacing: "neighborward" },
      },
      {
        text: "right left through",
        call: rightLeftThrough(),
      },
      {
        text: "you are now facing your new neighbor!",
        call: { youAreNowFacingYourNewNeighbor: true },
      },
    ] as const).sortBy(({ text }) => text);
  }, []);
  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(calls.find((f) => searchTest(f.text))!.call);
            setSearch("");
          }
        }}
      />
      {calls
        .filter((f) => searchTest(f.text))
        .map(({ text, call }) => (
          <button key={text} onClick={() => onAdd(call)}>
            {text}
          </button>
        ))}
    </div>
  );
}
