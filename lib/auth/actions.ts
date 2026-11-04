"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { refresh } from "next/cache";

import { clearSignInFailures, clientAddress, isSignInBlocked, recordSignInFailure } from "@/lib/auth/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema, profileNameSchema, signInSchema, type AuthFormState, type UserActionState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only same-site app paths, so ?next= can never become an open redirect. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return /^\/workspace(\/[\w-]+)*$/.test(next) ? next : null;
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { email, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (!isSupabaseConfigured()) return { email, error: "The database isn't connected yet." };

  const address = await clientAddress();
  if (isSignInBlocked(address, parsed.data.email)) return { email, error: "Too many attempts. Wait 15 minutes and try again, or ask your administrator to reset your password." };

  const supabase = await createSupabaseServerClient();
  const { data: signedIn, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) return { email, error: "Too many attempts. Wait a minute and try again." };
    if (error.status === 400) recordSignInFailure(address, parsed.data.email);
    // Supabase only reports a ban once the password is correct.
    if (error.code === "user_banned") return { email, error: "This account has been deactivated. Contact your administrator." };
    // One message for unknown email and wrong password, so accounts can't be probed.
    if (error.status === 400) return { email, error: "Email or password is incorrect." };
    return { email, error: "Sign-in is unavailable right now. Please try again shortly." };
  }

  clearSignInFailures(address, parsed.data.email);

  // Everyone starts in their workspace (admins manage users from its Settings). A temporary
  // password is replaced first, and a page they asked for is honoured.
  const { data: profile } = await supabase.from("profiles").select("must_change_password").eq("id", signedIn.user.id).maybeSingle();
  if (profile?.must_change_password) redirect("/account/password");
  redirect(safeNext(formData.get("next")) ?? "/workspace");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/");
}

/**
 * Ends the session and leaves the navigation to the caller. Inside the workspace the
 * browser then does a full page load, which clears the member's records from memory
 * so the Back button can't bring them back on a shared computer.
 */
export async function endSession() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
}

/** Anyone may correct their own name. RLS allows this one column and nothing else. */
export async function updateOwnName(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?reason=session");
  if (!user.active) redirect("/account/deactivated");

  const parsed = profileNameSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", user.id);
  if (error) return { ok: false, error: "Your name couldn't be saved. Please try again." };

  refresh();
  return { ok: true, message: parsed.data.fullName };
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?reason=session");
  if (!user.active) redirect("/account/deactivated");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };

  const supabase = await createSupabaseServerClient();

  // Re-check the current password so a hijacked session alone can't take over the account.
  const verify = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword });
  if (verify.error) {
    return verify.error.status === 429
      ? { error: "Too many attempts. Wait a minute and try again." }
      : { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { newPassword: ["Choose a password you haven't used here"] } };
    if (error.code === "weak_password") return { fieldErrors: { newPassword: [error.message] } };
    return { error: "The password couldn't be updated. Please try again." };
  }

  // The on_auth_user_updated trigger clears must_change_password in the database.
  redirect("/account/password?done=1");
}
