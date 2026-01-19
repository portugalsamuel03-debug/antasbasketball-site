// src/admin.ts
import { supabase } from "./lib/supabase";

type Role = "admin" | "reader";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getMyRole(): Promise<Role | null> {
  // 1) pega usuário logado
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) return null;

  const user = userData?.user;
  if (!user) return null;

  // 2) tenta buscar role com retry (token às vezes ainda não “entrou”)
  const tries = [0, 250, 700, 1400]; // delays progressivos
  for (let i = 0; i < tries.length; i++) {
    if (tries[i]) await sleep(tries[i]);

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // achou
    if (!error && data?.role) return (data.role as Role) ?? null;

    // se não existe profile ainda, não adianta insistir muito
    // (mas geralmente o trigger cria — então a 2ª tentativa resolve)
  }

  return null;
}
