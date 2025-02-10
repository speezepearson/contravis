import "./App.css";

import anime from "animejs";

import { List, Map } from "immutable";
import { HTMLProps, useEffect, useMemo, useRef, useState } from "react";
import {
  ByDancer,
  DancerId,
  DancerState,
  findPersonInDirection,
  fwd,
  initImproper,
  Keyframe,
  LARK,
  partnerward,
  ROBIN,
  robinsChainAcrossKfs,
  swingKfs,
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
    rotate: `${-dancer.facing + Math.PI / 2}rad`,
  };
}

function ContraDance() {
  const [dancerRefs, setDancerRefs] = useState<ByDancer<SVGSVGElement | null>>(
    Map()
  );

  const init = useMemo(() => initImproper(4), []);
  const keyframes = useMemo(() => {
    let res: List<Keyframe & { happening: string }> = List.of();
    res = res.concat(
      swingKfs(init).map((kf) => ({
        happening: "neighbor swing",
        ...kf,
      }))
    );
    res = res.concat(
      robinsChainAcrossKfs(res.last()!.end).map((kf) => ({
        happening: "robins chain across",
        ...kf,
      }))
    );
    const counterlarks = findPersonInDirection(res.last()!.end, ({ role }) =>
      role === LARK ? fwd(2).add(partnerward({ role }, 2)) : null
    );
    res = res.push({
      happening: "larks allemande left 1 1/2",
      beats: 8,
      end: res.last()!.end.map((dancer, id) => ({
        ...dancer,
        posn:
          dancer.role === ROBIN
            ? dancer.posn
            : res.last()!.end.get(counterlarks.get(id)!)!.posn,
        facing:
          dancer.role === ROBIN
            ? dancer.facing
            : res.last()!.end.get(counterlarks.get(id)!)!.facing,
      })),
    });
    res = res.push({
      happening: "turn",
      beats: 1,
      end: res.last()!.end.map((dancer) => ({
        ...dancer,
        facing: dancer.facing + (Math.PI / 2) * (dancer.role === LARK ? -1 : 1),
      })),
    });
    res = res.concat(
      swingKfs(res.last()!.end, { beats: 3 }).map((kf) => ({
        happening: "neighbor swing",
        ...kf,
      }))
    );
    return res;
  }, []);

  const setDancerRef = useMemo(
    () =>
      Map(
        keyframes
          .first()!
          .end.keySeq()
          .map((id) => [
            id,
            (el: SVGSVGElement | null) => {
              setDancerRefs((rs) => rs.set(id, el));
            },
          ])
      ),
    [keyframes]
  );

  const totalBeats = useMemo(
    () => keyframes.reduce((b, { beats }) => b + beats, 0),
    [keyframes]
  );

  const anim = useMemo(() => {
    const anim = anime.timeline({
      duration: beatsToMs(totalBeats),
      easing: "easeInOutSine",
      autoplay: false,
      update: (anim) => {
        setBeat((anim.progress / 100) * totalBeats);
      },
    });

    for (const [dancerId, dancer] of init.entries()) {
      if (dancerRefs.get(dancerId)) {
        anime.set(dancerRefs.get(dancerId)!, animeProps(dancer));
      }
    }

    let lastBeat = 0;
    for (const [, keyframe] of keyframes.entries()) {
      for (const [dancerId, dancer] of keyframe.end.entries()) {
        anim.add(
          {
            targets: dancerRefs.get(dancerId),
            ...animeProps(dancer),
            duration: beatsToMs(keyframe.beats),
          },
          beatsToMs(lastBeat)
        );
      }
      lastBeat += keyframe.beats;
    }
    return anim;
  }, [dancerRefs, keyframes, totalBeats]);

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
    if (Math.abs(anim.progress - 100 * (beat / totalBeats)) > 1) {
      // rounding errors
      anim.seek(anim.duration * (beat / totalBeats));
    }
  }, [beat, anim, totalBeats]);

  const curKeyframe = useMemo(() => {
    let beatsSoFar = 0;
    for (const keyframe of keyframes) {
      beatsSoFar += keyframe.beats;
      if (beatsSoFar > beat) {
        return keyframe;
      }
    }
    return keyframes.last()!;
  }, [keyframes, beat]);

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
        {beat.toFixed(0)} {curKeyframe.happening}
      </div>
      <div style={{ position: "relative" }}>
        {keyframes
          .first()!
          .end.entrySeq()
          .map(([id, dancer]) => (
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
