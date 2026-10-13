"use client";

import { useCallback, useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StoryData } from "@/lib/demo/story-data";
import { cn } from "@/lib/utils";
import { StoryCanvas } from "./canvas";
import { LAYOUTS, SCENES, TOTAL_MS, type Variant } from "./layout";

/* ------------------------------------------------------- State machine ---- */

interface State {
  scene: number;
  status: "playing" | "paused" | "finished";
  /** Bumped on every (re)start so scene animations and the progress bar restart. */
  runId: number;
  /** True once the user interacted; stops the reduced-motion default of jumping to the final scene. */
  picked: boolean;
}

type Action =
  | { type: "advance" }
  | { type: "toggle" }
  | { type: "replay" }
  | { type: "goto"; scene: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "advance":
      return state.scene >= SCENES.length - 1
        ? { ...state, status: "finished" }
        : { ...state, scene: state.scene + 1 };
    case "toggle":
      if (state.status === "finished") return { scene: 0, status: "playing", runId: state.runId + 1, picked: true };
      return { ...state, status: state.status === "playing" ? "paused" : "playing", picked: true };
    case "replay":
      return { scene: 0, status: "playing", runId: state.runId + 1, picked: true };
    case "goto":
      return { scene: action.scene, status: "paused", runId: state.runId + 1, picked: true };
  }
}

/* ------------------------------------------------------ Measuring hook ---- */

function useElementWidth(ref: React.RefObject<HTMLElement | null>): number {
  const subscribe = useCallback(
    (callback: () => void) => {
      const el = ref.current;
      if (!el || typeof ResizeObserver === "undefined") return () => {};
      const observer = new ResizeObserver(callback);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [ref],
  );
  return useSyncExternalStore(
    subscribe,
    () => ref.current?.clientWidth ?? 0,
    () => 0,
  );
}

/* ---------------------------------------------------------- Component ----- */

export function PainToSolutionStory({ data }: { data: StoryData }) {
  const [state, dispatch] = useReducer(reducer, { scene: 0, status: "playing", runId: 0, picked: false });
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { amount: 0.15 });
  const width = useElementWidth(stageRef);

  const variant: Variant = width > 0 && width < 600 ? "tall" : "wide";
  const L = LAYOUTS[variant];
  const scale = width > 0 ? Math.min(width / L.canvas.w, 1.25) : 1;

  // Reduced motion: no autoplay. Show the end state and let people step through scenes.
  const shownScene = reduce && !state.picked ? SCENES.length - 1 : state.scene;
  const playing = state.status === "playing" && inView && !reduce;

  // Remaining time per scene, so pausing (or scrolling away) resumes where it stopped.
  const remaining = useRef<number[]>(SCENES.map((s) => s.duration));
  const startedAt = useRef(0);
  const lastRun = useRef(0);

  useEffect(() => {
    if (lastRun.current !== state.runId) {
      lastRun.current = state.runId;
      remaining.current = SCENES.map((s) => s.duration);
    }
    if (!playing) return;
    const scene = state.scene;
    startedAt.current = performance.now();
    const id = window.setTimeout(() => dispatch({ type: "advance" }), Math.max(60, remaining.current[scene]));
    return () => {
      window.clearTimeout(id);
      remaining.current[scene] -= performance.now() - startedAt.current;
    };
  }, [playing, state.scene, state.runId]);

  const caption = SCENES[shownScene].caption;
  const finished = state.status === "finished";

  return (
    <div ref={wrapRef} role="group" aria-label="Animated product story" className="relative">
      <div className="overflow-hidden rounded-[28px] border bg-gradient-to-b from-slate-50 to-white shadow-float ring-1 ring-black/[0.03]">
        {/* Stage */}
        <div
          ref={stageRef}
          className={cn(
            "relative w-full overflow-hidden bg-[linear-gradient(180deg,#f8fafc,#f1f5f9)]",
            "aspect-[400/560] sm:aspect-[880/520]",
          )}
          style={width > 0 ? { aspectRatio: `${L.canvas.w} / ${L.canvas.h}` } : undefined}
          aria-hidden="true"
        >
          {width > 0 && (
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{ width: L.canvas.w, height: L.canvas.h, transform: `scale(${scale})` }}
            >
              <StoryCanvas key={`${state.runId}-${variant}`} scene={shownScene} variant={variant} data={data} still={!!reduce || !playing} />
            </div>
          )}
        </div>

        {/* Caption + controls */}
        <div className="border-t bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-h-[3.25rem] lg:min-h-0 lg:flex-1">
              <p className="mb-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-primary uppercase">
                Scene {shownScene + 1} of {SCENES.length} · {SCENES[shownScene].label}
              </p>
              <div aria-live="polite" aria-atomic="true">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={caption}
                    className="text-lg leading-snug font-semibold tracking-tight text-balance text-foreground sm:text-xl"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    {caption}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ol className="flex items-center gap-1.5" aria-label="Scenes">
                {SCENES.map((s, i) => {
                  const done = i < shownScene || (finished && !reduce);
                  const current = i === shownScene;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "goto", scene: i })}
                        aria-label={`Go to scene ${i + 1}: ${s.label}`}
                        aria-current={current ? "step" : undefined}
                        className="group/seg flex h-8 w-9 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-11"
                      >
                        <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-slate-200 transition-colors group-hover/seg:bg-slate-300">
                          <span
                            key={current ? `${state.runId}-${i}` : `static-${i}`}
                            className={cn("absolute inset-0 origin-left rounded-full bg-primary", !current && !done && "scale-x-0")}
                            style={
                              current && !reduce
                                ? {
                                    animation: `story-progress ${SCENES[i].duration}ms linear forwards`,
                                    animationPlayState: playing ? "running" : "paused",
                                  }
                                : current
                                  ? { transform: "scaleX(1)" }
                                  : undefined
                            }
                          />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {!reduce && (
                <div className="flex items-center gap-1.5 border-l pl-3">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={state.status === "playing" ? "Pause animation" : finished ? "Replay animation" : "Play animation"}
                    onClick={() => dispatch({ type: "toggle" })}
                  >
                    {state.status === "playing" ? <Pause /> : <Play />}
                  </Button>
                  <Button variant="outline" size="icon-sm" aria-label="Restart animation from the beginning" onClick={() => dispatch({ type: "replay" })}>
                    <RotateCcw />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {reduce && (
            <p className="mt-3 text-xs text-muted-foreground">Animation is paused because your device prefers reduced motion. Use the scene buttons to step through the story.</p>
          )}
        </div>
      </div>

      {/* Text alternative for assistive technology */}
      <div className="sr-only">
        <p>
          Illustrative animation, about {Math.round(TOTAL_MS / 1000)} seconds, using sample data. It shows scattered tools becoming one connected workspace, the
          copilot flagging an overdue invoice, a low-stock product and a lead needing follow-up, and finally a clear dashboard.
        </p>
        <ol>
          {SCENES.map((s) => (
            <li key={s.id}>{s.caption}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
