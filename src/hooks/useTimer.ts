import { useEffect, useRef } from "react";
import { useSyncedRef } from "./useSyncedRef";
import { durationForPhase } from "../lib/timer";
import { completeCountdownTimer, createTimerSessionId } from "../lib/timerCompletion";
import type { AppSettings, CountdownRole, FocusOverride, Phase, TimerState } from "../lib/types";

interface UseTimerOptions {
  settingsRef: { current: AppSettings };
  onTick: (focusSeconds: number, treesCompleted: number) => void;
  onComplete: (completedFocusSessions: number, countdownRole: CountdownRole) => void;
}

export type { FocusOverride };

export function useTimer({ settingsRef, onTick, onComplete }: UseTimerOptions) {
  const [timer, setTimer, timerRef] = useSyncedRef<TimerState>({
    phase: "countdown",
    countdownRole: "focus",
    secondsLeft: durationForPhase("countdown", settingsRef.current.timer),
    isRunning: false,
    completedFocusSessions: 0,
    isComplete: false,
    sessionId: null
  });

  const [focusOverride, setFocusOverride, focusOverrideRef] = useSyncedRef<FocusOverride | null>(null);
  const lastTimerTickAtRef = useRef<number | null>(null);
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);
  onTickRef.current = onTick;
  onCompleteRef.current = onComplete;

  function finalizeCountdown(current: TimerState): TimerState {
    const completion = completeCountdownTimer(current);
    if (completion.focusSeconds > 0 || completion.treesCompleted > 0) {
      onTickRef.current(completion.focusSeconds, completion.treesCompleted);
    }
    window.setTimeout(
      () => onCompleteRef.current(completion.completedFocusSessions, completion.countdownRole),
      0
    );
    return completion.nextTimer;
  }

  function currentTimerDuration(timerState: TimerState): number {
    if (timerState.phase === "countdown" && timerState.countdownRole === "focus" && focusOverrideRef.current) {
      return focusOverrideRef.current.seconds;
    }
    return durationForPhase(timerState.phase, settingsRef.current.timer, timerState.countdownRole);
  }

  function currentTimerDurationFromRefs(timerState: TimerState): number {
    const override = focusOverrideRef.current;
    if (timerState.phase === "countdown" && timerState.countdownRole === "focus" && override) {
      return override.seconds;
    }
    return durationForPhase(timerState.phase, settingsRef.current.timer, timerState.countdownRole);
  }

  useEffect(() => {
    if (!timer.isRunning) {
      lastTimerTickAtRef.current = null;
      return;
    }

    lastTimerTickAtRef.current = Date.now();

    const applyElapsedTime = () => {
      const now = Date.now();
      const lastTickAt = lastTimerTickAtRef.current ?? now;
      const elapsedSeconds = Math.floor((now - lastTickAt) / 1000);

      if (elapsedSeconds <= 0) {
        return;
      }

      lastTimerTickAtRef.current = lastTickAt + elapsedSeconds * 1000;

      setTimer((current) => {
        if (!current.isRunning) {
          return current;
        }

        const currentSettings = settingsRef.current;

        if (current.phase === "countup") {
          const nextSeconds = current.secondsLeft + elapsedSeconds;
          const focusDuration = Math.max(60, currentSettings.timer.focusMinutes * 60);
          const completedTrees = Math.floor(nextSeconds / focusDuration) - Math.floor(current.secondsLeft / focusDuration);
          onTickRef.current(elapsedSeconds, completedTrees);
          return { ...current, secondsLeft: nextSeconds };
        }

        if (elapsedSeconds >= current.secondsLeft) {
          return finalizeCountdown(current);
        }

        if (current.countdownRole === "focus") {
          onTickRef.current(elapsedSeconds, 0);
        }
        return { ...current, secondsLeft: current.secondsLeft - elapsedSeconds };
      });
    };

    const id = window.setInterval(applyElapsedTime, 250);
    document.addEventListener("visibilitychange", applyElapsedTime);
    window.addEventListener("focus", applyElapsedTime);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", applyElapsedTime);
      window.removeEventListener("focus", applyElapsedTime);
    };
  }, [timer.isRunning, timer.countdownRole, timer.phase, settingsRef, setTimer]);

  function toggleTimer() {
    const current = timerRef.current;
    const wasRunning = current.isRunning;
    const startRole: CountdownRole =
      current.phase === "countdown" && current.isComplete
        ? current.countdownRole === "focus"
          ? "rest"
          : "focus"
        : current.phase === "countdown"
          ? current.countdownRole
          : "focus";

    if (current.isComplete && current.phase === "countdown") {
      advanceCountdown(true);
    } else {
      setTimer((cur) => ({
        ...cur,
        isRunning: !cur.isRunning,
        sessionId: cur.isRunning ? null : createTimerSessionId()
      }));
    }

    return { wasRunning, startRole };
  }

  function advanceCountdown(shouldRun: boolean) {
    const current = timerRef.current;
    const nextRole: CountdownRole = current.countdownRole === "focus" ? "rest" : "focus";
    setFocusOverride(null);
    setTimer((cur) => ({
      ...cur,
      countdownRole: nextRole,
      secondsLeft: durationForPhase("countdown", settingsRef.current.timer, nextRole),
      isRunning: shouldRun,
      isComplete: false,
      sessionId: shouldRun ? createTimerSessionId() : null
    }));
  }

  function resetTimer() {
    setTimer((current) => ({
      ...current,
      secondsLeft: currentTimerDuration(current),
      isRunning: false,
      isComplete: false,
      sessionId: null
    }));
  }

  function skipPhase() {
    if (timerRef.current.phase === "countdown") {
      advanceCountdown(false);
    } else {
      resetTimer();
    }
  }

  function changePhase(phase: Phase, shouldRun = false) {
    setFocusOverride(null);
    setTimer((current) => ({
      ...current,
      phase,
      countdownRole: "focus",
      secondsLeft: durationForPhase(phase, settingsRef.current.timer, "focus"),
      isRunning: shouldRun,
      isComplete: false,
      sessionId: shouldRun ? createTimerSessionId() : null
    }));
  }

  function startRestCountdown() {
    setFocusOverride(null);
    setTimer((current) => ({
      ...current,
      phase: "countdown",
      countdownRole: "rest",
      secondsLeft: durationForPhase("countdown", settingsRef.current.timer, "rest"),
      isRunning: true,
      isComplete: false,
      sessionId: createTimerSessionId()
    }));
  }

  function startFocusCountdown(overrideSeconds?: number, overridePresetId?: string) {
    const nextOverride = overrideSeconds && overridePresetId
      ? { seconds: overrideSeconds, presetId: overridePresetId, trackForest: true }
      : null;
    setFocusOverride(nextOverride);
    setTimer((current) => ({
      ...current,
      phase: "countdown",
      countdownRole: "focus",
      secondsLeft: nextOverride?.seconds ?? durationForPhase("countdown", settingsRef.current.timer, "focus"),
      isRunning: true,
      isComplete: false,
      sessionId: createTimerSessionId()
    }));
  }

  function startQuickStart(seconds: number, presetId: string, trackForest: boolean) {
    setFocusOverride({ seconds, presetId, trackForest });
    setTimer((current) => ({
      ...current,
      phase: "countdown",
      countdownRole: "focus",
      secondsLeft: seconds,
      isRunning: true,
      isComplete: false,
      sessionId: createTimerSessionId()
    }));
  }

  function completeTimerFromNative(sessionId: string) {
    setTimer((current) => {
      if (
        !current.isRunning ||
        current.phase !== "countdown" ||
        current.isComplete ||
        current.sessionId !== sessionId
      ) {
        return current;
      }

      return finalizeCountdown(current);
    });
  }

  return {
    timer,
    timerRef,
    focusOverride,
    focusOverrideRef,
    currentTimerDuration,
    currentTimerDurationFromRefs,
    setFocusOverride,
    setTimer,
    toggleTimer,
    advanceCountdown,
    resetTimer,
    skipPhase,
    changePhase,
    startRestCountdown,
    startFocusCountdown,
    startQuickStart,
    completeTimerFromNative
  };
}
