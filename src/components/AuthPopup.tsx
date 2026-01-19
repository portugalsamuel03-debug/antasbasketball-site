import React, { useState } from "react";
import { X, Dribbble, ChevronDown } from "lucide-react";
import { NBA_TEAMS } from "../constants";
import { supabase } from "../lib/supabase";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthPopup: React.FC<AuthPopupProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [selectedTeam, setSelectedTeam] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isOpen) return null;

  const inputClasses =
    "w-full bg-[#F0F4F8] border-none rounded-2xl py-4 px-6 text-sm text-[#0B1D33] focus:ring-2 focus:ring-[#0B1D33]/20 outline-none transition-all placeholder:text-gray-400 font-medium";

  async function handleLogin() {
    setErr(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) throw error;

      // garante que a sessão foi persistida antes de fechar o modal
      await supabase.auth.getSession();

      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    setErr(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      // trigger cria o profile como 'reader'
      const userId = data.user?.id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            display_name: fullName,
            favorite_team: selectedTeam || null,
          })
          .eq("id", userId);
      }

      // garante sessão pronta (às vezes o browser demora a persistir)
      await supabase.auth.getSession();

      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-[#0B1D33]/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm bg-white rounded-[50px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 p-8 flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-8 text-gray-300 hover:text-[#0B1D33] transition-colors p-2"
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 bg-[#0B1D33] rounded-[25px] flex items-center justify-center shadow-lg mb-6 mt-4">
          <Dribbble size={36} className="text-white" />
        </div>

        <h2 className="text-2xl font-black text-[#0B1D33] uppercase italic tracking-tighter mb-1">
          BORA A NOSSA
        </h2>

        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 text-center px-4 leading-tight">
          {view === "LOGIN"
            ? "Junte-se à maior comunidade de basquete."
            : "Se identifique, meliante"}
        </p>

        {!!err && (
          <div className="w-full mb-4 text-[12px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            {err}
          </div>
        )}

        <div className="w-full space-y-4">
          {view === "LOGIN" ? (
            <>
              <input
                type="email"
                placeholder="E-MAIL"
                className={inputClasses}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="SUA SENHA"
                className={inputClasses}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#0B1D33] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0B1D33]/20 active:scale-95 transition-all mt-2 disabled:opacity-60"
              >
                {loading ? "ENTRANDO..." : "ENTRAR NO TIME"}
              </button>

              <button
                onClick={() => setView("SIGNUP")}
                className="w-full bg-[#F0F4F8] text-[#0B1D33] py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
              >
                CRIAR NOVA CONTA
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="SEU NOME COMPLETO"
                className={inputClasses}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <input
                type="email"
                placeholder="SEU MELHOR E-MAIL"
                className={inputClasses}
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />

              <div className="relative">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className={`${inputClasses} appearance-none cursor-pointer pr-12`}
                >
                  <option value="" disabled>
                    QUAL O SEU TIME?
                  </option>
                  {NBA_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                  <option value="Antas">Antas Basketball (G.O.A.T)</option>
                </select>

                <ChevronDown
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[#0B1D33] pointer-events-none"
                  size={18}
                />
              </div>

              <input
                type="password"
                placeholder="CRIE UMA SENHA"
                className={inputClasses}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-[#0B1D33] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#0B1D33]/20 active:scale-95 transition-all mt-2 disabled:opacity-60"
              >
                {loading ? "CRIANDO..." : "FINALIZAR ESCALAÇÃO"}
              </button>

              <button
                onClick={() => setView("LOGIN")}
                className="w-full text-gray-400 py-2 font-black text-[10px] uppercase tracking-widest hover:text-[#0B1D33] transition-colors"
              >
                Já tenho conta, quero entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;
