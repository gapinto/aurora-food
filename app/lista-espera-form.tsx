"use client";

import { useState } from "react";

type Estado = "idle" | "enviando" | "sucesso" | "erro";

export function ListaEsperaForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [erro, setErro] = useState<string | null>(null);

  async function inscrever(evento: React.FormEvent) {
    evento.preventDefault();
    setEstado("enviando");
    setErro(null);

    try {
      const response = await fetch("/api/lista-espera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, nomeRestaurante: nomeRestaurante || undefined }),
      });

      if (!response.ok) {
        const corpo = await response.json().catch(() => ({}));
        setErro(corpo.error ?? "Não foi possível concluir a inscrição.");
        setEstado("erro");
        return;
      }

      setEstado("sucesso");
    } catch {
      setErro("Não foi possível concluir a inscrição.");
      setEstado("erro");
    }
  }

  if (estado === "sucesso") {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-aurora-glow/30 bg-aurora-night-2 px-6 py-8 text-center">
        <p className="text-lg font-semibold text-aurora-glow">Você está na lista.</p>
        <p className="text-sm text-aurora-mist">
          Convidamos os restaurantes por ordem de inscrição — avisamos por e-mail assim que abrir vaga.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={inscrever} className="flex w-full max-w-sm flex-col gap-3">
      <input
        type="text"
        required
        placeholder="Seu nome"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        className="rounded-lg border border-aurora-mist/30 bg-transparent px-4 py-3 text-aurora-ice placeholder:text-aurora-mist"
      />
      <input
        type="email"
        required
        placeholder="Seu e-mail"
        value={email}
        onChange={(evento) => setEmail(evento.target.value)}
        className="rounded-lg border border-aurora-mist/30 bg-transparent px-4 py-3 text-aurora-ice placeholder:text-aurora-mist"
      />
      <input
        type="text"
        placeholder="Nome do restaurante (opcional)"
        value={nomeRestaurante}
        onChange={(evento) => setNomeRestaurante(evento.target.value)}
        className="rounded-lg border border-aurora-mist/30 bg-transparent px-4 py-3 text-aurora-ice placeholder:text-aurora-mist"
      />
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-full bg-aurora-glow px-6 py-3 font-semibold text-aurora-night disabled:opacity-50"
      >
        {estado === "enviando" ? "Entrando na lista…" : "Entrar na lista de espera"}
      </button>
    </form>
  );
}
