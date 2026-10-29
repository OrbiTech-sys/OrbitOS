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
  storage_quota_bytes: number;
  created_at: string;
  updated_at: string;
};

type WorkspaceRecordRow = {
  owner_id: string;
  kind: string;
  id: string;
  data: Record<string, unknown>;
  updated_at: string;
};

type WorkspaceUsageRow = {
  owner_id: string;
  records: number;
  bytes: number;
  last_write_at: string | null;
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
      workspace_records: {
        Row: WorkspaceRecordRow;
        Insert: Pick<WorkspaceRecordRow, "kind" | "id" | "data"> & Partial<WorkspaceRecordRow>;
        Update: Partial<WorkspaceRecordRow>;
        Relationships: [];
      };
      workspace_usage: {
        Row: WorkspaceUsageRow;
        Insert: never;
        Update: never;
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
    Functions: {
      workspace_apply: {
        Args: { p_upserts?: unknown; p_deletes?: unknown };
        Returns: undefined;
      };
      workspace_usage_breakdown: {
        Args: { p_owner: string };
        Returns: { kind: string; records: number; bytes: number }[];
      };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<never, never>;
  };
};
