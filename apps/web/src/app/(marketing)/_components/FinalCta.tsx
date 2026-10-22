import { ClaimHandle } from './ClaimHandle';

export function FinalCta() {
  return (
    <section className="px-4 pb-24">
      <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-ink px-6 py-16 text-center text-ink-foreground md:py-24">
        <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight text-balance md:text-6xl">
          Faça o que você ama. A gente ajuda a vender.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-foreground/70">
          Escolha o endereço da sua loja e comece agora, de graça.
        </p>
        <ClaimHandle className="mx-auto mt-8 text-foreground" />
      </div>
    </section>
  );
}
