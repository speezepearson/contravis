import "./App.css";

import anime from "animejs";

import { List, Map } from "immutable";
import { HTMLProps, useEffect, useMemo, useRef, useState } from "react";
import {
  ByDancer,
  DancerState,
  initImproper,
  DancerKeyframe,
  LARK,
  robinsChainAcrossKfs,
  swingKfs,
  fwd,
  ROBIN,
  extendKeyframes,
  moves,
  right,
  left,
  bak,
} from "./contra";

const pxPerPace = 50;
const beatsPerSec = 2;
const beatsToMs = (beats: number) => (beats / beatsPerSec) * 1000;

const sqrt3 = Math.sqrt(3);

function Lark(props: HTMLProps<SVGSVGElement> & { label: string }) {
  // empty red-bordered circle with radial red line
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <circle
        cx={pxPerPace / 2}
        cy={pxPerPace / 2}
        r={pxPerPace / 2}
        stroke="red"
        strokeWidth=""
        fill="none"
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

function Robin(props: HTMLProps<SVGSVGElement> & { label: string }) {
  // empty blue-bordered equilateral triangle with blue line from center to top
  return (
    <svg width={pxPerPace} height={pxPerPace} {...props}>
      <polygon
        points={`${pxPerPace},${pxPerPace / 2} ${pxPerPace / 4},${
          pxPerPace / 2 + (pxPerPace / 4) * sqrt3
        } ${pxPerPace / 4},${pxPerPace / 2 - (pxPerPace / 4) * sqrt3}`}
        stroke="blue"
        strokeWidth="1"
        fill="none"
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
  const [dancerRefs, setDancerRefs] = useState<ByDancer<SVGSVGElement | null>>(
    Map()
  );

  const init = useMemo(() => initImproper(4), []);
  const keyframes: ByDancer<List<DancerKeyframe>> = useMemo(() => {
    let res: ByDancer<List<DancerKeyframe>> = init.map(() => List());

    res = extendKeyframes(res, (cur) => swingKfs(cur), { fallback: init });
    res = extendKeyframes(res, (cur) => robinsChainAcrossKfs(cur));
    res = extendKeyframes(res, (cur) => {
      return cur.map((dancer) => {
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
      });
    });
    return res;
  }, [init]);

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
    for (const [dancerId, dancer] of init.entries()) {
      if (dancerRefs.get(dancerId)) {
        anime.set(dancerRefs.get(dancerId)!, animeProps(dancer));
      }
    }

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
    anim.seek(beatsToMs(10));
    return anim;
  }, [init, dancerRefs, keyframes, totalBeats]);

  const prevAnim = useRef<anime.AnimeInstance | null>(null);
  useEffect(() => {
    if (prevAnim.current) {
      prevAnim.current.seek(0);
      prevAnim.current.pause();
    }
    prevAnim.current = anim;
  }, [anim]);

  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (Math.abs(anim.progress - 100 * (beat / totalBeats)) > 0.1) {
      // rounding errors
      anim.seek(anim.duration * (beat / totalBeats));
    }
  }, [beat, anim, totalBeats]);

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

  return (
    <>
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
          setBeat(parseFloat(e.target.value));
        }}
      />
      <div>
        {beat.toFixed(0)} {/*curKeyframe.happening*/}
      </div>
      <div style={{ position: "relative" }}>
        {init.entrySeq().map(([id, dancer]) => (
          <div key={id} style={{ position: "absolute", top: 0, left: 0 }}>
            {dancer.role === LARK ? (
              <Lark ref={setDancerRef.get(id)} label={id} />
            ) : (
              <Robin ref={setDancerRef.get(id)} label={id} />
            )}
          </div>
        ))}
      </div>
    </>
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
