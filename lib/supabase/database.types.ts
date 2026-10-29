/**
 * Database types for the Supabase client, matching supabase/migrations.
 * Regenerate with `npx supabase gen types typescript --project-id <ref>` once the
 * schema grows; keep this file's name so imports don't change.
 * Insert/Update describe the tables; grants and RLS decide what a caller may write.
 */
export type AppRole = "super_admin" | "admin" | "member";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  must_change_password: boolean;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

type AuditLogRow = {
  id: number;
  actor_id: string;
  actor_email: string;
  action: string;
  target_id: string | null;
  target_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Pick<ProfileRow, "id" | "email"> & Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: Pick<AuditLogRow, "actor_id" | "actor_email" | "action"> & Partial<Omit<AuditLogRow, "id">>;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { app_role: AppRole };
    CompositeTypes: Record<never, never>;
  };
};
