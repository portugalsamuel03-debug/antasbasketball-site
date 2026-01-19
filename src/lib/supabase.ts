// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigError =
  !url ? "Faltou VITE_SUPABASE_URL" : !anon ? "Faltou VITE_SUPABASE_ANON_KEY" : null;

export const supabase: SupabaseClient | null =
  supabaseConfigError ? null : createClient(url!, anon!);
