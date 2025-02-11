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
  fwd,
  ROBIN,
  moves,
  right,
  left,
  bak,
  DancerId,
  compose,
  balance,
  boxTheGnat,
  swing,
  robinsChainAcross,
  ringBalance,
  petronellaSpin,
  InstructionDir,
  Subroutine,
  CompositionError,
  rightLeftThrough,
} from "./contra";

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

  const [figures, setFigures] = useState<
    List<Subroutine | { endThatMoveFacing: InstructionDir }>
  >(
    List([
      balance({ withYour: "neighbor" }),
      boxTheGnat({ withYour: "neighbor" }),
      ringBalance(),
      petronellaSpin(),
      ringBalance(),
      petronellaSpin(),
      { endThatMoveFacing: "neighborward" },
      swing({ beats: 8, withYour: "neighbor" }),
      robinsChainAcross({ toYour: "partner" }),
      {
        name: "larks allemande left 1 1/2",
        beats: 8,
        buildKeyframes: (cur) =>
          cur.map((dancer) => {
            if (dancer.role === ROBIN) return List();
            return moves(dancer, [
              {
                beats: 8 / 6,
                dx: fwd().add(right()).add(right(0.3)),
                dccw: 0,
              },
              {
                beats: 8 / 6,
                dx: fwd().add(right()).add(fwd(0.3)),
                dccw: 1 / 4,
              },
              {
                beats: 8 / 6,
                dx: fwd().add(right()).add(left(0.3)),
                dccw: 2 / 4,
              },
              {
                beats: 8 / 6,
                dx: fwd().add(right()).add(bak(0.3)),
                dccw: 3 / 4,
              },
              {
                beats: 8 / 6,
                dx: fwd().add(right()).add(right(0.3)),
                dccw: 4 / 4,
              },
              { beats: 8 / 6, dx: fwd(2).add(right(2)), dccw: 6 / 4 },
            ]);
          }),
      },
      // (cur) => formWaveKfs(cur),
      // (cur) => waveBalanceBellySlideKfs(cur),
    ])
  );
  const [keyframes, compositionError]: [
    ByDancer<List<DancerKeyframe>>,
    CompositionError | null
  ] = useMemo(() => {
    try {
      return [compose(init, figures), null];
    } catch (e) {
      if (e instanceof CompositionError) {
        return [e.partial, e];
      }
      throw e;
    }
  }, [init, figures]);
  const compositionErrorInd = compositionError
    ? figures.findIndex((f) => f === compositionError.subroutine)
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

  // const curKeyframe = useMemo(() => {
  //   let beatsSoFar = 0;
  //   for (const keyframe of keyframes) {
  //     beatsSoFar += keyframe.beats;
  //     if (beatsSoFar > beat) {
  //       return keyframe;
  //     }
  //   }
  //   return keyframes.last()!;
  // }, [keyframes, beat]);

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
      <ul>
        {figures.map((f, i) => (
          <li
            key={i}
            style={{
              fontWeight: curSubroutine?.i === i ? "bold" : "normal",
              color:
                compositionErrorInd != null && i >= compositionErrorInd
                  ? "red"
                  : "",
            }}
          >
            {"endThatMoveFacing" in f ? f.endThatMoveFacing : f.name}{" "}
            <button onClick={() => setFigures((figures) => figures.delete(i))}>
              x
            </button>
          </li>
        ))}
        <li>
          <AddMoveForm
            onAdd={(f) => {
              setFigures((figures) => figures.push(f));
            }}
          />
        </li>
      </ul>
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
                fill={dancer.progressDirection === "up" ? "#00000044" : "none"}
              />
            ) : (
              <Robin
                ref={setDancerRef.get(id)}
                label={id}
                fill={dancer.progressDirection === "up" ? "#00000044" : "none"}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function AddMoveForm({
  onAdd,
}: {
  onAdd: (f: Subroutine | { endThatMoveFacing: InstructionDir }) => void;
}) {
  const [search, setSearch] = useState("");
  const searchRegexp = useMemo(() => {
    const pat = search
      .split("")
      .map((w) => `(?:${w}|.*\\b${w})`)
      .join("");
    return new RegExp(pat);
  }, [search]);
  const searchTest = (s: string) => searchRegexp.test(s.toLowerCase());

  const figures: { text: string; figure: Parameters<typeof onAdd>[0] }[] = [
    { text: "balance neighbor", figure: balance({ withYour: "neighbor" }) },
    { text: "balance partner", figure: balance({ withYour: "partner" }) },
    {
      text: "box the gnat neighbor",
      figure: boxTheGnat({ withYour: "neighbor" }),
    },
    {
      text: "box the gnat partner",
      figure: boxTheGnat({ withYour: "partner" }),
    },
    {
      text: "petronella spin partner/neighbor",
      figure: petronellaSpin({ withYour: ["partner", "neighbor"] }),
    },
    {
      text: "ring balance partner/neighbor",
      figure: ringBalance({ withYour: ["partner", "neighbor"] }),
    },
    {
      text: "robins chain to neighbor",
      figure: robinsChainAcross({ toYour: "neighbor" }),
    },
    {
      text: "robins chain to partner",
      figure: robinsChainAcross({ toYour: "partner" }),
    },
    { text: "face across", figure: { endThatMoveFacing: "across" } },
    { text: "face your partner", figure: { endThatMoveFacing: "partnerward" } },
    {
      text: "face your neighbor",
      figure: { endThatMoveFacing: "neighborward" },
    },
  ];
  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onAdd(figures.find((f) => searchTest(f.text))!.figure);
            setSearch("");
          }
        }}
      />
      {figures
        .filter((f) => searchTest(f.text))
        .map(({ text, figure }) => (
          <button key={text} onClick={() => onAdd(figure)}>
            {text}
          </button>
        ))}
    </div>
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
