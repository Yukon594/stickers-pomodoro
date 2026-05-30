type Deferred = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

export interface PersistScheduler<T> {
  schedule(value: T): Promise<void>;
  flush(): Promise<void>;
  cancel(): void;
}

export function createPersistScheduler<T>(
  persist: (value: T) => Promise<void>,
  minIntervalMs: number
): PersistScheduler<T> {
  let lastPersistedAt = Number.NEGATIVE_INFINITY;
  let pendingValue: T | null = null;
  let pendingDeferreds: Deferred[] = [];
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;

  const scheduleNext = () => {
    if (inFlight || pendingValue === null) {
      return;
    }

    const waitMs = Math.max(0, lastPersistedAt + minIntervalMs - Date.now());
    if (waitMs === 0) {
      void persistPending();
      return;
    }

    if (timerId !== null) {
      return;
    }

    timerId = setTimeout(() => {
      timerId = null;
      void persistPending();
    }, waitMs);
  };

  const persistPending = async () => {
    if (inFlight || pendingValue === null) {
      return inFlight ?? Promise.resolve();
    }

    const value = pendingValue;
    const deferreds = pendingDeferreds;
    pendingValue = null;
    pendingDeferreds = [];

    const write = persist(value)
      .then(() => {
        lastPersistedAt = Date.now();
        deferreds.forEach(({ resolve }) => resolve());
      })
      .catch((error) => {
        deferreds.forEach(({ reject }) => reject(error));
        throw error;
      })
      .finally(() => {
        inFlight = null;
        scheduleNext();
      });

    inFlight = write;
    return write;
  };

  return {
    schedule(value: T) {
      pendingValue = value;
      return new Promise<void>((resolve, reject) => {
        pendingDeferreds.push({ resolve, reject });
        scheduleNext();
      });
    },
    async flush() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }

      if (pendingValue !== null) {
        await persistPending();
        return;
      }

      if (inFlight) {
        await inFlight;
      }
    },
    cancel() {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }

      pendingValue = null;
      pendingDeferreds = [];
    }
  };
}
