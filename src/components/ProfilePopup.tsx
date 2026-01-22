import React, { useEffect, useState } from "react";
import { X, LogOut, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

type ProfileRow = {
  id: string;
  display_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
};

export default function ProfilePopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      setErr(null);
      setLoading(true);
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u.user;
        if (!user) {
          setErr("Você não está logado.");
          setRow(null);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, nickname, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        setRow({
          id: user.id,
          display_name: data?.display_name ?? null,
          nickname: data?.nickname ?? null,
          avatar_url: data?.avatar_url ?? null,
        });
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  async function save() {
    if (!row) return;
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: row.display_name,
          nickname: row.nickname,
          avatar_url: row.avatar_url,
        })
        .eq("id", row.id);

      if (error) throw error;

      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    onClose();
  }

  const input =
    "w-full bg-[#F0F4F8] border-none rounded-2xl py-4 px-6 text-sm text-[#0B1D33] focus:ring-2 focus:ring-[#0B1D33]/20 outline-none transition-all placeholder:text-gray-400 font-medium";

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-[#0B1D33]/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white rounded-[40px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-[#0B1D33] transition-colors p-2"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="mb-5">
          <div className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400">
            Conta
          </div>
          <div className="text-xl font-black italic tracking-tighter text-[#0B1D33]">
            SEU PERFIL
          </div>
        </div>

        {!!err && (
          <div className="w-full mb-4 text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            {err}
          </div>
        )}

        {loading && !row ? (
          <div className="text-sm text-gray-500 font-bold">Carregando...</div>
        ) : (
          <div className="space-y-3">
            <input
              className={input}
              placeholder="Seu nome"
              value={row?.display_name ?? ""}
              onChange={(e) =>
                setRow((r) => (r ? { ...r, display_name: e.target.value } : r))
              }
            />
            <input
              className={input}
              placeholder="Nickname (pra comentários)"
              value={row?.nickname ?? ""}
              onChange={(e) =>
                setRow((r) => (r ? { ...r, nickname: e.target.value } : r))
              }
            />
            <input
              className={input}
              placeholder="URL da foto (avatar)"
              value={row?.avatar_url ?? ""}
              onChange={(e) =>
                setRow((r) => (r ? { ...r, avatar_url: e.target.value } : r))
              }
            />

            <button
              onClick={save}
              disabled={loading || !row}
              className="w-full bg-[#0B1D33] text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0B1D33]/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? "SALVANDO..." : "SALVAR"}
            </button>

            <button
              onClick={logout}
              disabled={loading}
              className="w-full bg-[#F0F4F8] text-[#0B1D33] py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              SAIR DA CONTA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
