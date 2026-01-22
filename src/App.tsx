import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { getMyRole } from "./admin";

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setAdminError(null);

      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;

        if (!mounted) return;

        setSessionUserId(userId);

        if (!userId) {
          setRole(null);
          return;
        }

        const r = await getMyRole();
        if (!mounted) return;

        setRole(r ?? null);
      } catch (e: any) {
        console.error("boot auth error:", e);
        if (!mounted) return;
        setSessionUserId(null);
        setRole(null);
        setAdminError(e?.message ?? "Erro ao validar sessão (Supabase).");
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    load();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);

      if (!userId) {
        setRole(null);
        return;
      }

      try {
        const r = await getMyRole();
        if (!mounted) return;
        setRole(r ?? null);
      } catch (e) {
        console.error("role check error:", e);
        if (!mounted) return;
        setRole(null);
        setAdminError("Erro ao validar sessão (Supabase).");
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!authReady) return <div>Carregando...</div>;
  if (adminError) return <div>Erro: {adminError}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Antas Basketball</h1>
      <p>
        <strong>User ID:</strong> {sessionUserId ?? "—"}
      </p>
      <p>
        <strong>Role:</strong> {role ?? "—"}
      </p>
    </div>
  );
}
