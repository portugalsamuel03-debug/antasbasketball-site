// src/admin.ts
import { supabase } from "./lib/supabase";

export type UserRole = "admin" | "reader";

export async function getMyRole(): Promise<UserRole | null> {
  // getSession é local (não depende de rede)
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error("[getMyRole] getSession error:", sessionError);
    return null;
  }

  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getMyRole] profiles select error:", error);
    return null;
  }

  const role = (data?.role ?? null) as UserRole | null;
  return role;
}
