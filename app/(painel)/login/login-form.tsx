"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha inválidos.");
      setEnviando(false);
      return;
    }

    router.push(searchParams.get("next") ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-xl font-semibold">Entrar no painel</h1>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-400">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-neutral-400">Senha</span>
        <input
          type="password"
          required
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          className="rounded-lg border border-white/10 bg-transparent px-3 py-2"
        />
      </label>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-aurora-glow px-4 py-2 font-semibold text-aurora-night disabled:opacity-50"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
