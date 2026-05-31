import type { CountdownRole, TimerState } from "./types";

export interface TimerCompletionResult {
  nextTimer: TimerState;
  focusSeconds: number;
  treesCompleted: number;
  completedFocusSessions: number;
  countdownRole: CountdownRole;
}

export function createTimerSessionId(now = Date.now(), random = Math.random()): string {
  return `timer-${now.toString(36)}-${Math.floor(random * 1_000_000).toString(36)}`;
}

export function completeCountdownTimer(current: TimerState): TimerCompletionResult {
  const completedFocusSessions =
    current.countdownRole === "focus" ? current.completedFocusSessions + 1 : current.completedFocusSessions;

  return {
    nextTimer: {
      ...current,
      secondsLeft: 0,
      isRunning: false,
      isComplete: true,
      completedFocusSessions,
      sessionId: null
    },
    focusSeconds: current.countdownRole === "focus" ? current.secondsLeft : 0,
    treesCompleted: current.countdownRole === "focus" ? 1 : 0,
    completedFocusSessions,
    countdownRole: current.countdownRole
  };
}
