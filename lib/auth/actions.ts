"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema, signInSchema, type AuthFormState } from "@/lib/auth/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Only same-site admin paths, so ?next= can never become an open redirect. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return /^\/admin(\/[\w-]+)*$/.test(next) ? next : "/admin";
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { email, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (!isSupabaseConfigured()) return { email, error: "The database isn't connected yet." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) return { email, error: "Too many attempts. Wait a minute and try again." };
    // Supabase only reports a ban once the password is correct.
    if (error.code === "user_banned") return { email, error: "This account has been deactivated. Contact your administrator." };
    // One message for unknown email and wrong password, so accounts can't be probed.
    if (error.status === 400) return { email, error: "Email or password is incorrect." };
    return { email, error: "Sign-in is unavailable right now. Please try again shortly." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/sign-in");
}

export async function changePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?reason=session");
  if (!user.active) redirect("/admin/deactivated");

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
  redirect("/admin?password=updated");
}
