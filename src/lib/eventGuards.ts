export type Unlisten = () => void | Promise<void>;

export function createDeferredUnlistenRegistry() {
  let unlisteners: Unlisten[] = [];
  let disposed = false;

  return {
    register(nextUnlisteners: Unlisten[]) {
      if (disposed) {
        for (const unlisten of nextUnlisteners) {
          void unlisten();
        }
        return;
      }

      unlisteners = nextUnlisteners;
    },
    dispose() {
      disposed = true;
      for (const unlisten of unlisteners) {
        void unlisten();
      }
      unlisteners = [];
    }
  };
}

export function createEventBurstGuard(windowMs: number) {
  let lastHandledAt = Number.NEGATIVE_INFINITY;

  return {
    shouldHandle(now = Date.now()) {
      if (now - lastHandledAt < windowMs) {
        return false;
      }

      lastHandledAt = now;
      return true;
    }
  };
}
