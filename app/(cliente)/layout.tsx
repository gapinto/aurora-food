// Layout do fluxo real de pedido (spec seções 2 e 8):
// - tema claro, fonte grande — legibilidade > identidade visual aqui.
// - "chamar atendente" sempre visível, mesmo peso do botão principal.
// - resumo do pedido fica fixo na base, atualiza ao vivo (ver checkout).
export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fluxo-pedido flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <span className="font-semibold">Aurora Food</span>
        <button
          type="button"
          className="rounded-full border border-black/20 px-4 py-2 font-medium"
        >
          Chamar atendente
        </button>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
