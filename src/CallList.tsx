import { List } from "immutable";
import { useMemo } from "react";
import { AddCallForm } from "./AddCallForm";
import { Call } from "./types";
import { CompositionError } from "./contra";

type CallListProps = {
  calls: List<Call>;
  highlightAtBeat: number;
  setCalls: (calls: List<Call>) => void;
  compositionError?: CompositionError | null;
};
export function CallList({
  calls,
  highlightAtBeat,
  setCalls,
  compositionError,
}: CallListProps) {
  const curFigure = useMemo(() => {
    let beatsSoFar = 0;
    for (const [i, f] of calls.entries()) {
      if (!("beats" in f)) continue;
      beatsSoFar += f.beats;
      if (beatsSoFar > highlightAtBeat) {
        return i;
      }
    }
  }, [calls, highlightAtBeat]);

  const timestamps = useMemo(
    () =>
      calls.reduce(
        (acc, call) =>
          acc.push(acc.last()! + ("beats" in call ? call.beats : 0)),
        List.of(0)
      ),
    [calls]
  );
  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Dur</th>
          <th>Call</th>
          <th style={{ minWidth: "5em" }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {calls.map((call, i) => (
          <tr
            key={i}
            style={{
              fontWeight: curFigure === i ? "bold" : "normal",
              color: call === compositionError?.call ? "red" : "",
            }}
          >
            <td>{timestamps.get(i)}</td>
            <td>{"beats" in call ? call.beats : ""}</td>
            <td>
              <CallElem call={call} />
              {call === compositionError?.call &&
                ` -- ${compositionError.message}`}
            </td>
            <td>
              <button
                onClick={() => setCalls(calls.delete(i).insert(i - 1, call))}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                onClick={() => setCalls(calls.delete(i).insert(i + 1, call))}
                disabled={i === calls.size - 1}
              >
                ↓
              </button>
              <button onClick={() => setCalls(calls.delete(i))}>x</button>
            </td>
          </tr>
        ))}
        <tr>
          <td>{timestamps.last()}</td>
          <td></td>
          <td>
            <AddCallForm
              onAdd={(call) => {
                setCalls(calls.push(call));
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function CallElem({ call }: { call: Call }) {
  if ("endThatMoveFacing" in call)
    return `(end that move facing ${call.endThatMoveFacing})`;
  if ("youAreNowFacingYourNewNeighbor" in call)
    return `You are now facing your new neighbor!`;

  switch (call.name) {
    case "swing":
      return "swing";
    case "robinsChain":
      return "robins chain";
    case "formWave":
      return "form wave";
    case "waveBalanceBellySlide":
      return "slide to the right";
    case "ringBalance":
      return "balance the ring";
    case "petronellaSpin":
      return "petronella spin";
    case "balance":
      return "balance";
    case "boxTheGnat":
      return "box the gnat";
    case "rightLeftThrough":
      return "right left through";
    case "larksRollAway":
      return "larks roll away";
    case "circle":
      return "circle";
    case "passThrough":
      return "pass through";
    case "doSiDo1":
      return "do si do";
    case "doSiDo112":
      return "do si do 1 1/2";
    case "custom":
      return "<custom>";
  }
  call satisfies never;
}
