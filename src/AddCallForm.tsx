import { useMemo, useState } from "react";
import { Call } from "./types";
import { List } from "immutable";

const callMenu = List<{ text: string; call: Call }>([
  {
    text: "partner balance",
    call: { name: "balance", beats: 8, relation: "partner" },
  },
  {
    text: "neighbor balance",
    call: { name: "balance", beats: 8, relation: "neighbor" },
  },
  {
    text: "partner swing",
    call: { name: "swing", beats: 8, relation: "partner" },
  },
  {
    text: "neighbor swing",
    call: { name: "swing", beats: 8, relation: "neighbor" },
  },
  {
    text: "partner box the gnat",
    call: { name: "boxTheGnat", beats: 4, relation: "partner" },
  },
  {
    text: "neighbor box the gnat",
    call: { name: "boxTheGnat", beats: 4, relation: "neighbor" },
  },
  {
    text: "petronella spin",
    call: {
      name: "petronellaSpin",
      beats: 4,
    },
  },
  {
    text: "balance the ring",
    call: { name: "ringBalance", beats: 4 },
  },
  {
    text: "robins chain to your partner",
    call: { name: "robinsChain", beats: 8, relation: "partner" },
  },
  {
    text: "robins chain to your neighbor",
    call: { name: "robinsChain", beats: 8, relation: "neighbor" },
  },
  {
    text: "larks roll away your partner",
    call: { name: "larksRollAway", beats: 4, relation: "partner" },
  },
  {
    text: "larks roll away your neighbor",
    call: { name: "larksRollAway", beats: 4, relation: "neighbor" },
  },
  {
    text: "do si do once with your partner",
    call: { name: "doSiDo1", beats: 8, relation: "partner" },
  },
  {
    text: "do si do once with your neighbor",
    call: { name: "doSiDo1", beats: 8, relation: "neighbor" },
  },
  {
    text: "do si do 1 1/2 with your partner",
    call: { name: "doSiDo112", beats: 8, relation: "partner" },
  },
  {
    text: "do si do 1 1/2 with your neighbor",
    call: { name: "doSiDo112", beats: 8, relation: "neighbor" },
  },
  {
    text: "circle left 3",
    call: {
      name: "circle",
      beats: 8,
      handedness: "left",
      spots: 3,
    },
  },
  {
    text: "circle right 3",
    call: {
      name: "circle",
      beats: 8,
      handedness: "right",
      spots: 3,
    },
  },
  {
    text: "circle left 4",
    call: {
      name: "circle",
      beats: 8,
      handedness: "left",
      spots: 4,
    },
  },
  {
    text: "circle right 4",
    call: {
      name: "circle",
      beats: 8,
      handedness: "right",
      spots: 4,
    },
  },
  { text: "pass through", call: { name: "passThrough", beats: 2 } },
  {
    text: "right left through",
    call: { name: "rightLeftThrough", beats: 8 },
  },
  { text: "face across", call: { endThatMoveFacing: "acrossTheSet" } },
  {
    text: "face your partner",
    call: { endThatMoveFacing: "towardsYourPartner" },
  },
  {
    text: "face your neighbor",
    call: { endThatMoveFacing: "towardsYourNeighbor" },
  },
  {
    text: "you are now facing your new neighbor!",
    call: { youAreNowFacingYourNewNeighbor: true },
  },
]);

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

  return (
    <div>
      <input
        value={search}
        placeholder="search"
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(callMenu.find((f) => searchTest(f.text))!.call);
            setSearch("");
          }
        }}
      />
      {callMenu
        .filter((f) => searchTest(f.text))
        .map(({ text, call }) => (
          <button key={text} onClick={() => onAdd(call)}>
            {text}
          </button>
        ))}
    </div>
  );
}
