"use server";

import { createHash } from "node:crypto";

import { clientAddress } from "@/lib/auth/rate-limit";
import { contactFormSchema, waitlistSchema } from "@/lib/demo/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/*
 * The website's public forms. Anyone can call these, so they validate everything,
 * quietly ignore bots that fill the hidden field, and limit how much one network
 * address can send. They insert with the secret key because visitors have no access
 * to the table at all (see supabase/migrations/20261104110000_site_submissions.sql).
 */

export type SubmitResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const MAX_PER_HOUR = 5;
/** Holds even if someone forges a new network address for every message. */
const MAX_PER_HOUR_FROM_ANYONE = 200;
const UNAVAILABLE: SubmitResult = { ok: false, error: "We couldn't send that just now. Please try again in a few minutes." };

/** One-way, salted with the secret key, so the stored value can't be turned back into an address. */
async function networkFingerprint() {
  return createHash("sha256").update(`${process.env.SUPABASE_SECRET_KEY ?? ""}:${await clientAddress()}`).digest("hex");
}

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
}

async function store(row: { kind: "contact" | "waitlist"; name: string; email: string; company?: string; topic: string; message: string; team_size?: string }): Promise<SubmitResult> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SECRET_KEY) return UNAVAILABLE;
  try {
    const admin = createSupabaseAdminClient();
    const ipHash = await networkFingerprint();

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin.from("site_submissions").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= MAX_PER_HOUR) return { ok: false, error: "That's a lot of messages from one place. Please try again later." };
    const { count: everyone, error: everyoneError } = await admin.from("site_submissions").select("id", { count: "exact", head: true }).gte("created_at", since);
    if (everyoneError) throw new Error(everyoneError.message);
    if ((everyone ?? 0) >= MAX_PER_HOUR_FROM_ANYONE) return UNAVAILABLE;

    const { error } = await admin.from("site_submissions").insert({ ...row, ip_hash: ipHash });
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (error) {
    console.error(`Saving a website form failed: ${error instanceof Error ? error.message : String(error)}`);
    return UNAVAILABLE;
  }
}

/** Real people never see or fill the "website" field, so anything in it marks a bot. It gets a success so it moves on. */
const isBot = (input: unknown) => !!input && typeof input === "object" && "website" in input && !!(input as { website?: unknown }).website;

export async function submitContactForm(input: unknown): Promise<SubmitResult> {
  if (isBot(input)) return { ok: true };
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const { name, email, company, topic, message } = parsed.data;
  return store({ kind: "contact", name, email: email.toLowerCase(), company, topic, message });
}

export async function submitWaitlistForm(input: unknown): Promise<SubmitResult> {
  if (isBot(input)) return { ok: true };
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error.issues) };
  const { name, email, businessType, teamSize, interest } = parsed.data;
  return store({ kind: "waitlist", name, email: email.toLowerCase(), topic: businessType, team_size: teamSize, message: interest });
}
