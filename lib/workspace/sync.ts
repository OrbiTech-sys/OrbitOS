import type { Changes, RecordKey } from "./records";
import { MAX_CHANGES_PER_REQUEST } from "./schemas";
import type { SaveResult, UsageNumbers } from "./types";

/**
 * The browser side of saving: collects changes as they happen, saves them in
 * the background in small batches, retries when the network or server fails,
 * and says what state it is in. Plain TypeScript with no React, so it can be
 * tested on its own.
 */

export type SyncStatus = "saved" | "saving" | "error";

export interface SyncState {
  status: SyncStatus;
  /** Changes not yet confirmed saved (including any in flight). */
  pending: number;
  error: string | null;
  /** From the last successful save. */
  usage: UsageNumbers | null;
}

export interface SyncQueue {
  add(changes: Changes): void;
  /** Save everything pending now. Resolves when the queue is empty or a save fails. */
  flush(): Promise<void>;
  /** Try again immediately after a failure. */
  retry(): void;
  pending(): number;
  dispose(): void;
}

type Entry = (RecordKey & { data: Record<string, unknown>; del?: undefined }) | (RecordKey & { del: true });

export function createSyncQueue(options: {
  save(changes: Changes): Promise<SaveResult>;
  onState(state: SyncState): void;
  /** Saving can never succeed (signed out, or the account was deactivated). */
  onFatal?(code: "auth" | "inactive"): void;
  initialUsage?: UsageNumbers | null;
  debounceMs?: number;
  /** Delays between automatic retries after a failure; the last one repeats. */
  retryMs?: number[];
  batchSize?: number;
}): SyncQueue {
  const debounceMs = options.debounceMs ?? 600;
  const retryMs = options.retryMs ?? [3_000, 8_000, 20_000, 60_000];
  const batchSize = options.batchSize ?? MAX_CHANGES_PER_REQUEST;

  const pending = new Map<string, Entry>();
  let state: SyncState = { status: "saved", pending: 0, error: null, usage: options.initialUsage ?? null };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;
  let attempt = 0;
  let disposed = false;

  const keyOf = (e: RecordKey) => `${e.kind}:${e.id}`;

  function emit(patch: Partial<SyncState>) {
    state = { ...state, ...patch, pending: pending.size };
    options.onState(state);
  }

  function schedule(ms: number) {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, ms);
  }

  async function run() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending.size === 0) {
      emit({ status: "saved", error: null });
      return;
    }
    emit({ status: "saving", error: null });

    let notice: string | null = null;
    while (pending.size > 0 && !disposed) {
      const batch = [...pending.values()].slice(0, batchSize);
      const changes: Changes = {
        upserts: batch.filter((e): e is Extract<Entry, { data: unknown }> => !e.del).map(({ kind, id, data }) => ({ kind, id, data })),
        deletes: batch.filter((e) => e.del).map(({ kind, id }) => ({ kind, id })),
      };

      let result: SaveResult;
      try {
        result = await options.save(changes);
      } catch {
        result = { ok: false, code: "failed", error: "You appear to be offline. Your changes will be saved when you reconnect." };
      }

      if (!result.ok) {
        emit({ status: "error", error: result.error });
        if (result.code === "auth" || result.code === "inactive") options.onFatal?.(result.code);
        else if (result.code === "failed") {
          schedule(retryMs[Math.min(attempt, retryMs.length - 1)]);
          attempt++;
        }
        return;
      }

      // Accepted and rejected records both leave the queue; one edited again meanwhile stays.
      for (const entry of batch) if (pending.get(keyOf(entry)) === entry) pending.delete(keyOf(entry));
      attempt = 0;
      if (result.rejected.length > 0) {
        notice = `${result.rejected.length} change${result.rejected.length === 1 ? "" : "s"} couldn't be saved because the data wasn't valid.`;
        console.error("Rejected workspace changes", result.rejected);
      }
      emit({ usage: result.usage, status: pending.size > 0 ? "saving" : "saved" });
    }
    emit({ status: notice ? "error" : "saved", error: notice });
  }

  function flush(): Promise<void> {
    if (!running) {
      running = run().finally(() => {
        running = null;
        // Changes that arrived after the last batch was taken.
        if (pending.size > 0 && state.status !== "error" && !disposed) schedule(debounceMs);
      });
    }
    return running;
  }

  return {
    add(changes) {
      if (disposed) return;
      for (const u of changes.upserts) pending.set(keyOf(u), { kind: u.kind, id: u.id, data: u.data });
      for (const d of changes.deletes) pending.set(keyOf(d), { kind: d.kind, id: d.id, del: true });
      emit({});
      schedule(debounceMs);
    },
    flush,
    retry() {
      attempt = 0;
      void flush();
    },
    pending: () => pending.size,
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
    },
  };
}
