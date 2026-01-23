// src/admin.ts
import { supabase } from "./lib/supabase";

type Role = "admin" | "reader";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(p: Promise<T>, ms: number, label = "timeout") {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`${label} (${ms}ms)`)), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function getMyRole(): Promise<Role | null> {
  // 1) sessão local (mais rápido e confiável)
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id ?? null;
  if (!userId) return null;

  // 2) retry curto pra role (às vezes profiles demora alguns ms pós-login)
  const tries = [0, 150, 350, 700];

  for (let i = 0; i < tries.length; i++) {
    if (tries[i]) await sleep(tries[i]);

    try {
      const query = supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      const { data: row, error } = await withTimeout(query, 6000, "getMyRole");

      if (!error && row?.role) {
        return row.role === "admin" ? "admin" : "reader";
      }

      if (error) console.warn("getMyRole try error:", error.message);
    } catch (e: any) {
      console.warn("getMyRole try crash:", e?.message ?? e);
    }
  }

  return null;
}
