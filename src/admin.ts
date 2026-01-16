import { supabase } from "../lib/supabase";

export type Role = "user" | "admin";

export async function getMyRole(): Promise<Role> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "user";

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getMyRole error:", error);
    return "user";
  }
  return (data?.role as Role) ?? "user";
}
