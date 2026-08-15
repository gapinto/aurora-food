export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-aurora-mist">Aurora Food</p>
      <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">
        Escolha, pague, <span className="text-aurora-glow">pegue</span>.
      </h1>
      <p className="max-w-xl text-balance text-aurora-mist">
        Autoatendimento por QR code para restaurantes e food service. O cliente monta o pedido,
        paga antes de chegar sua vez, e a cozinha começa assim que o pagamento é confirmado.
      </p>
    </main>
  );
}
