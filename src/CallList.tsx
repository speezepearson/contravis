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
            <td>
              {"beats" in call ? (
                <input
                  type="number"
                  style={{ width: "3em" }}
                  value={call.beats}
                  onChange={(e) =>
                    setCalls(
                      calls.set(i, {
                        ...call,
                        beats: parseInt(e.target.value),
                      })
                    )
                  }
                />
              ) : (
                ""
              )}
            </td>
            <td>
              <CallElem
                call={call}
                setCall={(call) => setCalls(calls.set(i, call))}
              />
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

function SimpleDropdown<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: T[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function OffsetDropdown({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <select
      value={value ?? 0}
      onChange={(e) => onChange(parseInt(e.target.value))}
    >
      <option value={-4}>prev^4</option>
      <option value={-3}>prev^3</option>
      <option value={-2}>prev^2</option>
      <option value={-1}>prev</option>
      <option value={0}></option>
      <option value={1}>next</option>
      <option value={2}>next^2</option>
      <option value={3}>next^3</option>
      <option value={4}>next^4</option>
    </select>
  );
}

function CallElem({
  call,
  setCall,
}: {
  call: Call;
  setCall: (call: Call) => void;
}) {
  if ("endThatMoveFacing" in call) {
    return (
      <>
        end that move facing
        <SimpleDropdown
          value={call.endThatMoveFacing}
          options={[
            "acrossTheSet",
            "out",
            "upTheSet",
            "downTheSet",
            "towardsYourPartner",
            "towardsYourNeighbor",
            "awayFromYourNeighbor",
          ]}
          onChange={(v) => setCall({ endThatMoveFacing: v })}
        />
      </>
    );
  }
  if ("youAreNowFacingYourNewNeighbor" in call)
    return `You are now facing your new neighbor!`;

  switch (call.name) {
    case "swing":
      return (
        <>
          swing your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "robinsChain":
      return (
        <>
          robins chain to your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "formWave":
      return "form wave";
    case "waveBalanceBellySlide":
      return "slide to the right";
    case "ringBalance":
      return "balance the ring";
    case "petronellaSpin":
      return "petronella spin";
    case "balance":
      return (
        <>
          balance with your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "boxTheGnat":
      return (
        <>
          box the gnat with your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "rightLeftThrough":
      return "right left through";
    case "larksRollAway":
      return (
        <>
          larks roll away from your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "circle":
      return (
        <>
          circle
          <SimpleDropdown
            value={call.handedness}
            options={["left", "right"]}
            onChange={(v) => setCall({ ...call, handedness: v })}
          />
          <input
            type="number"
            min="1"
            max="8"
            step="1"
            value={call.spots}
            onChange={(e) =>
              setCall({ ...call, spots: parseInt(e.target.value) })
            }
          />{" "}
          places
        </>
      );
    case "passThrough":
      return "pass through";
    case "doSiDo1":
      return (
        <>
          do si do with your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "doSiDo112":
      return (
        <>
          do si do 1 1/2 with your{" "}
          <OffsetDropdown
            value={call.h4Offset}
            onChange={(v) => setCall({ ...call, h4Offset: v })}
          />
          <SimpleDropdown
            value={call.relation}
            options={["partner", "neighbor"]}
            onChange={(v) => setCall({ ...call, relation: v })}
          />
        </>
      );
    case "custom":
      return "<custom>";
  }
  call satisfies never;
}
