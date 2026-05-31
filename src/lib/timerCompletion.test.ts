import { describe, expect, it } from "vitest";
import { completeCountdownTimer } from "./timerCompletion";
import type { TimerState } from "./types";

describe("completeCountdownTimer", () => {
  it("completes a focus countdown and returns the focus progress to persist", () => {
    const timer: TimerState = {
      phase: "countdown",
      countdownRole: "focus",
      secondsLeft: 12,
      isRunning: true,
      completedFocusSessions: 2,
      isComplete: false,
      sessionId: "focus-run-1"
    };

    expect(completeCountdownTimer(timer)).toEqual({
      nextTimer: {
        ...timer,
        secondsLeft: 0,
        isRunning: false,
        completedFocusSessions: 3,
        isComplete: true,
        sessionId: null
      },
      focusSeconds: 12,
      treesCompleted: 1,
      completedFocusSessions: 3,
      countdownRole: "focus"
    });
  });

  it("completes a rest countdown without adding focus progress", () => {
    const timer: TimerState = {
      phase: "countdown",
      countdownRole: "rest",
      secondsLeft: 3,
      isRunning: true,
      completedFocusSessions: 2,
      isComplete: false,
      sessionId: "rest-run-1"
    };

    expect(completeCountdownTimer(timer)).toEqual({
      nextTimer: {
        ...timer,
        secondsLeft: 0,
        isRunning: false,
        completedFocusSessions: 2,
        isComplete: true,
        sessionId: null
      },
      focusSeconds: 0,
      treesCompleted: 0,
      completedFocusSessions: 2,
      countdownRole: "rest"
    });
  });
});
