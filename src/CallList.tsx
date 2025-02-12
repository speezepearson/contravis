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
  const curSubroutine = useMemo(() => {
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
              fontWeight: curSubroutine === i ? "bold" : "normal",
              color: call === compositionError?.subroutine ? "red" : "",
            }}
          >
            <td>{timestamps.get(i)}</td>
            <td>{"beats" in call ? call.beats : ""}</td>
            <td>
              {"endThatMoveFacing" in call
                ? `(end that move facing ${call.endThatMoveFacing})`
                : "youAreNowFacingYourNewNeighbor" in call
                ? `You are now facing your new neighbor!`
                : call.name}
              {call === compositionError?.subroutine &&
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
