/**
 * Database types for the Supabase client, matching supabase/migrations.
 * Regenerate with `npx supabase gen types typescript --project-id <ref>` once the
 * schema grows; keep this file's name so imports don't change.
 */
export type AppRole = "super_admin" | "admin" | "member";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          must_change_password: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: { full_name?: string | null };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: { app_role: AppRole };
    CompositeTypes: Record<never, never>;
  };
};
