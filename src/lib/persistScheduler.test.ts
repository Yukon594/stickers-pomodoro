import { describe, expect, it, vi, afterEach } from "vitest";
import { createPersistScheduler } from "./persistScheduler";

describe("persist scheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("coalesces rapid updates and persists only the latest pending value", async () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const scheduler = createPersistScheduler(async (value: string) => {
      writes.push(value);
    }, 1_000);

    await scheduler.schedule("first");
    expect(writes).toEqual(["first"]);

    const secondWrite = scheduler.schedule("second");
    const thirdWrite = scheduler.schedule("third");

    await vi.advanceTimersByTimeAsync(999);
    expect(writes).toEqual(["first"]);

    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([secondWrite, thirdWrite]);

    expect(writes).toEqual(["first", "third"]);
  });

  it("flushes a pending throttled update immediately", async () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const scheduler = createPersistScheduler(async (value: string) => {
      writes.push(value);
    }, 1_000);

    await scheduler.schedule("first");
    expect(writes).toEqual(["first"]);

    const pendingWrite = scheduler.schedule("second");
    await vi.advanceTimersByTimeAsync(400);
    expect(writes).toEqual(["first"]);

    await scheduler.flush();
    await pendingWrite;

    expect(writes).toEqual(["first", "second"]);
  });
});
