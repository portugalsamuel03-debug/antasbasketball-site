import { supabase } from "./lib/supabase";

export async function getMyRole(): Promise<"admin" | "reader" | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) return null;

  return (data?.role ?? null) as "admin" | "reader" | null;
}
