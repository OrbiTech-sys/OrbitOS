import "server-only";

import { headers } from "next/headers";

/**
 * Slows down password guessing. Every sign-in reaches Supabase from this server's own
 * address, so its per-address limit is shared by everyone: one attacker could use it
 * up and lock all users out. Counting failures here, per visitor, stops that first.
 *
 * Held in memory, so each server instance counts separately and a restart forgets.
 * Supabase's own limit remains as the backstop across instances.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_ACCOUNT = 8;
const MAX_PER_ADDRESS = 30;

type Bucket = { failures: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function current(key: string, now: number) {
  const bucket = buckets.get(key);
  return bucket && bucket.resetAt > now ? bucket : null;
}

function keysFor(address: string, email: string) {
  return { account: `${address}|${email.trim().toLowerCase()}`, address };
}

export async function clientAddress() {
  const all = await headers();
  return all.get("x-forwarded-for")?.split(",")[0]?.trim() || all.get("x-real-ip") || "unknown";
}

export function isSignInBlocked(address: string, email: string, now = Date.now()) {
  const keys = keysFor(address, email);
  return (current(keys.account, now)?.failures ?? 0) >= MAX_PER_ACCOUNT || (current(keys.address, now)?.failures ?? 0) >= MAX_PER_ADDRESS;
}

export function recordSignInFailure(address: string, email: string, now = Date.now()) {
  // Keep the map from growing without bound under a flood of made-up emails.
  if (buckets.size > 10_000) for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const keys = keysFor(address, email);
  for (const key of [keys.account, keys.address]) {
    const bucket = current(key, now);
    if (bucket) bucket.failures++;
    else buckets.set(key, { failures: 1, resetAt: now + WINDOW_MS });
  }
}

export function clearSignInFailures(address: string, email: string) {
  buckets.delete(keysFor(address, email).account);
}
