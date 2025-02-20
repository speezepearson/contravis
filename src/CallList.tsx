import { List } from "immutable";
import { useMemo } from "react";
import { AddCallForm } from "./AddCallForm";
import { Call, CounterpartRef } from "./types";
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

function CounterpartDropdown({
  value,
  onChange,
}: {
  value: CounterpartRef;
  onChange: (value: CounterpartRef) => void;
}) {
  const relationDropdown = (
    <SimpleDropdown
      value={value.relation}
      options={["partner", "neighbor", "shadow", "opposite"]}
      onChange={(v) => onChange({ ...value, relation: v })}
    />
  );
  switch (value.relation) {
    case "partner":
      return relationDropdown;
    case "neighbor":
      return (
        <>
          <OffsetDropdown
            value={value.h4Offset}
            onChange={(v) => onChange({ ...value, h4Offset: v })}
          />
          {relationDropdown}
        </>
      );
    case "shadow":
      return (
        <>
          <select
            value={value.larkH4Offset || 1}
            onChange={(e) =>
              onChange({ ...value, larkH4Offset: parseInt(e.target.value) })
            }
          >
            <option value={-2}>L--R++</option>
            <option value={-1}>L-R+</option>
            <option value={1}>L+R-</option>
            <option value={2}>L++R--</option>
          </select>
          {relationDropdown}
        </>
      );
    case "opposite":
      return (
        <>
          <OffsetDropdown
            value={value.h4Offset}
            onChange={(v) => onChange({ ...value, h4Offset: v })}
          />
          {relationDropdown}
        </>
      );
  }
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
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
          />
        </>
      );
    case "robinsChain":
      return (
        <>
          robins chain to your{" "}
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
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
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
          />
        </>
      );
    case "boxTheGnat":
      return (
        <>
          box the gnat with your{" "}
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
          />
        </>
      );
    case "rightLeftThrough":
      return "right left through";
    case "larksRollAway":
      return (
        <>
          larks roll away your{" "}
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
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
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
          />
        </>
      );
    case "doSiDo112":
      return (
        <>
          do si do 1 1/2 with your{" "}
          <CounterpartDropdown
            value={call}
            onChange={(v) => setCall({ ...call, ...v })}
          />
        </>
      );
    case "custom":
      return "<custom>";
  }
  call satisfies never;
}
