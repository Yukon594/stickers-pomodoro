import { describe, expect, it, vi } from "vitest";
import { createDeferredUnlistenRegistry, createEventBurstGuard } from "./eventGuards";

describe("createDeferredUnlistenRegistry", () => {
  it("disposes listeners that resolve after cleanup already happened", () => {
    const first = vi.fn();
    const second = vi.fn();
    const registry = createDeferredUnlistenRegistry();

    registry.dispose();
    registry.register([first, second]);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("createEventBurstGuard", () => {
  it("ignores duplicate events inside the guard window", () => {
    const guard = createEventBurstGuard(300);

    expect(guard.shouldHandle(1_000)).toBe(true);
    expect(guard.shouldHandle(1_100)).toBe(false);
    expect(guard.shouldHandle(1_400)).toBe(true);
  });
});
