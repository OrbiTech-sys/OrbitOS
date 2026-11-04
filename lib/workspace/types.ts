import type { RecordKey } from "./records";

export interface UsageNumbers {
  bytes: number;
  records: number;
  quotaBytes: number;
}

export interface Rejected extends RecordKey {
  reason: string;
}

/** Outcome of saving a batch of changes. */
export type SaveResult =
  | { ok: true; usage: UsageNumbers; rejected: Rejected[] }
  | {
      ok: false;
      /** auth: signed out; password: a temporary password to replace first; inactive: account deactivated; quota: storage full; failed: anything else (retry). */
      code: "auth" | "password" | "inactive" | "quota" | "failed";
      error: string;
    };
