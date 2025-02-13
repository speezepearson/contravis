import "./App.css";

import anime from "animejs";

import { List, Map } from "immutable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { executeDance, CompositionError } from "./contra";
import { DancerKeyframe, DancerState, ByDancer, Dance } from "./types";
import { LARK, DancerId } from "./types";
import { earlyEveningRollaway } from "./dances";
import { Lark, Robin } from "./Dancers";
import { CallList } from "./CallList";

const pxPerPace = 50;

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

  const [dance, setDance] = useState<Dance>(earlyEveningRollaway());
  const [keyframes, compositionError]: [
    ByDancer<List<DancerKeyframe>>,
    CompositionError | null
  ] = useMemo(() => {
    try {
      return [executeDance(dance), null];
    } catch (e) {
      if (e instanceof CompositionError) {
        return [e.partial, e];
      }
      throw e;
    }
  }, [dance]);

  const setDancerRef = useMemo(
    () =>
      Map(
        dance.init.keySeq().map((id) => [
          id,
          (el: SVGSVGElement | null) => {
            setDancerRefs((rs) => rs.set(id, el));
          },
        ])
      ),
    [dance.init]
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
            calls={dance.calls}
            setCalls={(calls) => setDance((dance) => ({ ...dance, calls }))}
            highlightAtBeat={beat}
            compositionError={compositionError}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ position: "relative" }}>
            {dance.init.entrySeq().map(([id, dancer]) => (
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
                    pxPerPace={pxPerPace}
                  />
                ) : (
                  <Robin
                    ref={setDancerRef.get(id)}
                    label={id}
                    fill={
                      dancer.progressDirection === "up" ? "#00000044" : "none"
                    }
                    pxPerPace={pxPerPace}
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
