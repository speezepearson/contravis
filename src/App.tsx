import "./App.css";

import anime from "animejs";

import { List, Map } from "immutable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  executeDance,
  CompositionError,
  checkInvalidDanceReason,
} from "./contra";
import {
  DancerKeyframe,
  DancerState,
  ByProto,
  Dance,
  stringifyDancerId,
  PD_UP,
} from "./types";
import { LARK, DancerIdStr } from "./types";
import { earlyEveningRollaway } from "./dances";
import { Lark, Robin } from "./Dancers";
import { CallList } from "./CallList";
import { h4Offset, LENGTH_PERIOD } from "./util";

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
  const msToBeats = useCallback(
    (ms: number) => (ms / 1000) * beatsPerSec,
    [beatsPerSec]
  );

  const [minH4Id, setMinH4Id] = useState(0);
  const [maxH4Id, setMaxH4Id] = useState(0);
  const showH4Ids = useMemo(
    () =>
      List(
        Array.from({ length: maxH4Id + 1 - minH4Id }, (_, i) => minH4Id + i)
      ),
    [minH4Id, maxH4Id]
  );

  const [dancerRefs, setDancerRefs] = useState<
    Map<DancerIdStr, SVGSVGElement | null>
  >(Map());

  const [dance, setDance] = useState<Dance>(earlyEveningRollaway());
  const invalidDanceReason = useMemo(
    () => checkInvalidDanceReason(dance),
    [dance]
  );
  const [keyframes, compositionError]: [
    ByProto<List<DancerKeyframe>>,
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

  const setDancerRef: Map<DancerIdStr, (el: SVGSVGElement | null) => void> =
    useMemo(
      () =>
        Map(
          keyframes.entrySeq().flatMap(([protoId]) =>
            showH4Ids.map((h4Id) => {
              const idStr = stringifyDancerId({ protoId, h4Id });
              return [
                idStr,
                (el: SVGSVGElement | null) => {
                  setDancerRefs((rs) => rs.set(idStr, el));
                },
              ];
            })
          )
        ),
      [keyframes, showH4Ids]
    );

  const nBeatsChoreographed = useMemo(
    () =>
      keyframes
        .valueSeq()
        .first()
        ?.reduce((acc, kf) => {
          return acc + kf.beats;
        }, 0) ?? 0,
    [keyframes]
  );
  const nAnimatedBeats =
    compositionError || invalidDanceReason
      ? nBeatsChoreographed - 0.01
      : 2 * nBeatsChoreographed;

  const anim = useRef(anime.timeline({ autoplay: false }));
  useEffect(() => {
    const prev = anim.current;
    const wasPaused = prev.paused;
    prev.pause();

    anim.current = anime.timeline({
      duration: beatsToMs(nAnimatedBeats),
      easing: "linear",
      autoplay: false,
      loop: true,
      update: (anim) => {
        setBeat(msToBeats(anim.currentTime));
      },
    });

    // To make the animation loop more seamlessly, we want a single loop to actually consist of
    // *two* iterations of the dance. (Because, with a single-progression dance, after one iteration,
    // the larks are standing where the robins used to be. We need to progress twice to get them
    // where their predecessors are.)
    function double(kfs: List<DancerKeyframe>): List<DancerKeyframe> {
      if (kfs.isEmpty()) return kfs;
      const dx = kfs.last()!.end.posn.clone().subtract(kfs.first()!.end.posn);
      return kfs.concat(
        kfs.map((kf) => ({
          ...kf,
          end: { ...kf.end, posn: kf.end.posn.clone().add(dx) },
        }))
      );
    }
    for (const [protoId, kfs] of keyframes.entries()) {
      for (const h4Id of showH4Ids) {
        const idStr = stringifyDancerId({ protoId, h4Id });
        anim.current.add(
          {
            targets: dancerRefs.get(idStr),
            keyframes: double(kfs)
              .map((kf) => ({
                ...animeProps(h4Offset(kf.end, h4Id)),
                duration: beatsToMs(kf.beats),
              }))
              .toArray(),
          },
          0
        );
      }
    }

    anim.current.seek(prev.currentTime);
    if (!wasPaused) {
      anim.current.play();
    }
  }, [
    dancerRefs,
    keyframes,
    nBeatsChoreographed,
    nAnimatedBeats,
    beatsToMs,
    showH4Ids,
    beatsPerSec,
    msToBeats,
  ]);

  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (beat > nAnimatedBeats) {
      setBeat(nAnimatedBeats);
    }
  }, [beat, nAnimatedBeats]);
  useEffect(() => {
    const wantAnimMs = beatsToMs(beat);
    if (Math.abs(anim.current.currentTime - wantAnimMs) < 1) {
      return;
    }
    const wasPaused = anim.current.paused;
    anim.current.pause();
    anim.current.seek(wantAnimMs);
    if (!wasPaused) {
      anim.current.play();
    }
  }, [beat, nBeatsChoreographed, beatsToMs]);

  useEffect(() => {
    setMinH4Id(
      Math.floor(
        keyframes
          .valueSeq()
          .map((d) => d.last()!.end.posn.y)
          .min()! / LENGTH_PERIOD
      ) - 2
    );
  }, [keyframes, beat]);
  useEffect(() => {
    setMaxH4Id(
      Math.ceil(
        keyframes
          .valueSeq()
          .map((d) => d.last()!.end.posn.y)
          .max()! / LENGTH_PERIOD
      ) + 2
    );
  }, [keyframes, beat]);

  // const [focusedDancerId, setFocusedDancerId] = useState<DancerIdStr | null>(
  //   null
  // );
  // const focusedDancerBoundingKeyframes:
  //   | [DancerKeyframe | null, DancerKeyframe | null]
  //   | null = useMemo(() => {
  //   if (!focusedDancerId) return null;
  //   let t = 0;
  //   let prev = null;
  //   for (const kf of keyframes.get(focusedDancerId, [])) {
  //     if (t + kf.beats > beat) {
  //       return [prev, kf];
  //     }
  //     t += kf.beats;
  //     prev = kf;
  //   }
  //   return [prev, null];
  // }, [focusedDancerId, keyframes, beat]);

  return (
    <>
      <div>
        <button onClick={() => anim.current.play()}>Play</button>
        <button onClick={() => anim.current.pause()}>Pause</button>
        <button onClick={() => anim.current.restart()}>Restart</button>
        <input
          type="range"
          min="0"
          max={nAnimatedBeats}
          step="0.01"
          value={beat}
          onChange={(e) => setBeat(parseFloat(e.target.value))}
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
        {beat.toFixed(0)} {/*curKeyframe.happening*/}{" "}
        {invalidDanceReason && (
          <span style={{ color: "red" }}>{invalidDanceReason}</span>
        )}
      </div>
      {/* {focusedDancerId && (
        <div>
          <div>Focused Dancer: {focusedDancerId}</div>
          <div>Keyframes: {JSON.stringify(focusedDancerBoundingKeyframes)}</div>
        </div>
      )} */}
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div style={{ flex: 1 }}>
          <CallList
            calls={dance.calls}
            setCalls={(calls) => setDance((dance) => ({ ...dance, calls }))}
            highlightAtBeat={beat % nBeatsChoreographed}
            compositionError={compositionError}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              width: 4 * LENGTH_PERIOD * pxPerPace,
              height: 1.5 * LENGTH_PERIOD * pxPerPace,
              border: "1px solid black",
            }}
          >
            {dance.init.entrySeq().flatMap(([protoId, dancer]) =>
              showH4Ids.map((h4Id) => {
                const goingUp = dancer.progressDirection === PD_UP;
                return (
                  <div
                    key={`${protoId} ${h4Id}`}
                    style={{ position: "absolute", top: 0, left: 0 }}
                    // onClick={() => setFocusedDancerId(id)}
                  >
                    {dancer.role === LARK ? (
                      <Lark
                        ref={setDancerRef.get(
                          stringifyDancerId({ protoId, h4Id })
                        )}
                        label={stringifyDancerId({ protoId, h4Id })}
                        fill={goingUp ? "#00000044" : "none"}
                        scale={pxPerPace}
                      />
                    ) : (
                      <Robin
                        ref={setDancerRef.get(
                          stringifyDancerId({ protoId, h4Id })
                        )}
                        label={stringifyDancerId({ protoId, h4Id })}
                        fill={goingUp ? "#00000044" : "none"}
                        scale={pxPerPace}
                      />
                    )}
                  </div>
                );
              })
            )}
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
