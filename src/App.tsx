import "./App.css";

import anime from "animejs";

import { List, Map } from "immutable";
import {
  HTMLProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ByDancer,
  DancerState,
  initImproper,
  DancerKeyframe,
  LARK,
  DancerId,
  compose,
  balance,
  boxTheGnat,
  swing,
  robinsChainAcross,
  ringBalance,
  petronellaSpin,
  CompositionError,
  rightLeftThrough,
  Call,
  larksRollAway,
  circle,
  passThrough,
  doSiDo1,
  doSiDo112,
} from "./contra";
import { earlyEveningRollaway } from "./dances";

const pxPerPace = 50;

const sqrt3 = Math.sqrt(3);

function Lark(
  props: HTMLProps<SVGSVGElement> & { label: string; fill?: string }
) {
  // empty red-bordered circle with radial red line
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <circle
        cx={pxPerPace / 2}
        cy={pxPerPace / 2}
        r={pxPerPace / 2}
        stroke="red"
        strokeWidth=""
        fill={props.fill}
      />
      <line
        x1={pxPerPace / 2}
        y1={pxPerPace / 2}
        x2={pxPerPace}
        y2={pxPerPace / 2}
        stroke="red"
        strokeWidth="2"
      />
      <text
        x={pxPerPace / 2}
        y={pxPerPace / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="red"
      >
        {props.label}
      </text>
    </svg>
  );
}

function Robin(
  props: HTMLProps<SVGSVGElement> & { label: string; fill?: string }
) {
  // empty blue-bordered equilateral triangle with blue line from center to top
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <polygon
        points={`${pxPerPace},${pxPerPace / 2} ${pxPerPace / 4},${
          pxPerPace / 2 + (pxPerPace / 4) * sqrt3
        } ${pxPerPace / 4},${pxPerPace / 2 - (pxPerPace / 4) * sqrt3}`}
        stroke="blue"
        strokeWidth="1"
        fill={props.fill}
      />
      <line
        x1={pxPerPace / 2}
        y1={pxPerPace / 2}
        x2={pxPerPace}
        y2={pxPerPace / 2}
        stroke="blue"
        strokeWidth="2"
      />
      <text
        x={pxPerPace / 2}
        y={pxPerPace / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="blue"
      >
        {props.label}
      </text>
    </svg>
  );
}

function animeProps(dancer: DancerState) {
  return {
    translateX: dancer.posn.y * pxPerPace,
    translateY: dancer.posn.x * pxPerPace + 2 * pxPerPace,
    rotate: `${2 * Math.PI * (-dancer.ccw + 1 / 4)}rad`,
  };
}

function ContraDance() {
  const [beatsPerSec, setBeatsPerSec] = useState(4);
  const beatsToMs = useCallback(
    (beats: number) => (beats / beatsPerSec) * 1000,
    [beatsPerSec]
  );

  const [dancerRefs, setDancerRefs] = useState<ByDancer<SVGSVGElement | null>>(
    Map()
  );

  const init = useMemo(() => initImproper(4), []);

  const [calls, setCalls] = useState<List<Call>>(earlyEveningRollaway().calls);
  const [keyframes, compositionError]: [
    ByDancer<List<DancerKeyframe>>,
    CompositionError | null
  ] = useMemo(() => {
    try {
      return [compose(init, calls), null];
    } catch (e) {
      if (e instanceof CompositionError) {
        return [e.partial, e];
      }
      throw e;
    }
  }, [init, calls]);
  const compositionErrorInd = compositionError
    ? calls.findIndex((f) => f === compositionError.subroutine)
    : null;

  const setDancerRef = useMemo(
    () =>
      Map(
        init.keySeq().map((id) => [
          id,
          (el: SVGSVGElement | null) => {
            setDancerRefs((rs) => rs.set(id, el));
          },
        ])
      ),
    [init]
  );

  const totalBeats =
    keyframes
      .valueSeq()
      .first()
      ?.reduce((acc, kf) => {
        return acc + kf.beats;
      }, 0) ?? 0;

  const anim: anime.AnimeInstance = useMemo(() => {
    const anim = anime.timeline({
      duration: beatsToMs(totalBeats),
      easing: "linear",
      autoplay: false,
      update: (anim) => {
        setBeat((anim.progress / 100) * totalBeats);
      },
    });

    for (const [id, kfs] of keyframes.entries()) {
      anim.add(
        {
          targets: dancerRefs.get(id),
          keyframes: kfs
            .map((kf) => ({
              ...animeProps(kf.end),
              duration: beatsToMs(kf.beats),
            }))
            .toArray(),
        },
        0
      );
    }

    return anim;
  }, [dancerRefs, keyframes, totalBeats, beatsToMs]);

  const prevAnim = useRef<anime.AnimeInstance | null>(null);
  useEffect(() => {
    if (prevAnim.current) {
      prevAnim.current.pause();
    }
    prevAnim.current = anim;
  }, [anim]);

  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (beat > totalBeats) {
      setBeat(totalBeats);
    }
  }, [beat, totalBeats]);
  useEffect(() => {
    if (Math.abs(anim.progress / 100 - beat / totalBeats) < 1e-6) {
      return;
    }
    anim.seek(beatsToMs(beat));
  }, [beat, anim, totalBeats, beatsToMs]);

  const [focusedDancerId, setFocusedDancerId] = useState<DancerId | null>(null);
  const focusedDancerBoundingKeyframes:
    | [DancerKeyframe | null, DancerKeyframe | null]
    | null = useMemo(() => {
    if (!focusedDancerId) return null;
    let t = 0;
    let prev = null;
    for (const kf of keyframes.get(focusedDancerId, [])) {
      if (t + kf.beats > beat) {
        return [prev, kf];
      }
      t += kf.beats;
      prev = kf;
    }
    return [prev, null];
  }, [focusedDancerId, keyframes, beat]);

  return (
    <>
      <div>
        <button onClick={() => anim.play()}>Play</button>
        <button onClick={() => anim.pause()}>Pause</button>
        <button onClick={() => anim.restart()}>Restart</button>
        <input
          type="range"
          min="0"
          max={totalBeats}
          step="0.1"
          value={beat}
          onChange={(e) => {
            const newBeat = parseFloat(e.target.value);
            setBeat(newBeat);
            anim.seek(anim.duration * (newBeat / totalBeats));
          }}
        />
      </div>
      <div>
        Beats per second:
        <input
          type="number"
          min="0.5"
          max="8"
          step={0.1}
          value={beatsPerSec}
          onChange={(e) => setBeatsPerSec(parseFloat(e.target.value))}
        />{" "}
        Current beat:
        {beat.toFixed(0)} {/*curKeyframe.happening*/}
      </div>
      {focusedDancerId && (
        <div>
          <div>Focused Dancer: {focusedDancerId}</div>
          <div>Keyframes: {JSON.stringify(focusedDancerBoundingKeyframes)}</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ flex: 1 }}>
          <CallList
            calls={calls}
            setCalls={setCalls}
            highlightAtBeat={beat}
            invalidIndex={compositionErrorInd}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ position: "relative" }}>
            {init.entrySeq().map(([id, dancer]) => (
              <div
                key={id}
                style={{ position: "absolute", top: 0, left: 0 }}
                onClick={() => setFocusedDancerId(id)}
              >
                {dancer.role === LARK ? (
                  <Lark
                    ref={setDancerRef.get(id)}
                    label={id}
                    fill={
                      dancer.progressDirection === "up" ? "#00000044" : "none"
                    }
                  />
                ) : (
                  <Robin
                    ref={setDancerRef.get(id)}
                    label={id}
                    fill={
                      dancer.progressDirection === "up" ? "#00000044" : "none"
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

type AddCallFormProps = {
  onAdd: (f: Call) => void;
};
function AddCallForm({ onAdd }: AddCallFormProps) {
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
        text: "balance with your neighbor",
        call: balance({ withYour: "neighbor" }),
      },
      {
        text: "balance with your partner",
        call: balance({ withYour: "partner" }),
      },
      {
        text: "swing your neighbor (8)",
        call: swing({ beats: 8, withYour: "neighbor" }),
      },
      {
        text: "swing your partner (8)",
        call: swing({ beats: 8, withYour: "partner" }),
      },
      {
        text: "swing your neighbor (12)",
        call: swing({ beats: 12, withYour: "neighbor" }),
      },
      {
        text: "swing your partner (12)",
        call: swing({ beats: 12, withYour: "partner" }),
      },
      {
        text: "swing your neighbor (16)",
        call: swing({ beats: 16, withYour: "neighbor" }),
      },
      {
        text: "swing your partner (16)",
        call: swing({ beats: 16, withYour: "partner" }),
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
        text: "robins chain to your neighbor",
        call: robinsChainAcross({ toYour: "neighbor" }),
      },
      {
        text: "robins chain to your partner",
        call: robinsChainAcross({ toYour: "partner" }),
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

type CallListProps = {
  calls: List<Call>;
  highlightAtBeat: number;
  setCalls: (calls: List<Call>) => void;
  invalidIndex?: number | null;
};
function CallList({
  calls,
  highlightAtBeat,
  setCalls,
  invalidIndex,
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
              color: invalidIndex != null && i >= invalidIndex ? "red" : "",
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

function App() {
  return (
    <>
      <div>
        <ContraDance />
      </div>
    </>
  );
}

export default App;
