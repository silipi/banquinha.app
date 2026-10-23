import { SectionHeading } from './SectionHeading';

const steps = [
  {
    title: 'Monte sua loja',
    text: 'Adicione seus produtos, fotos e preços, escolha suas cores. Leva uns 10 minutos, tudo pelo celular.',
    bg: 'bg-butter',
  },
  {
    title: 'Compartilhe seu link',
    text: 'Coloque banquinha.app/sualoja na bio do Instagram, no status do WhatsApp ou no TikTok.',
    bg: 'bg-sky',
  },
  {
    title: 'Receba no WhatsApp',
    text: 'O cliente monta o carrinho e o pedido chega pronto no seu WhatsApp. É só combinar a entrega.',
    bg: 'bg-sage',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 px-4 py-24">
      <SectionHeading
        eyebrow="Como funciona"
        title="Da ideia à primeira venda em três passos."
        description="Sem site pra configurar, sem programador. Você cuida do que vende, a gente cuida da vitrine."
      />
      <ol className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className={`rounded-3xl p-7 ${step.bg}`}>
            <span className="font-display text-5xl font-bold text-foreground/20">
              0{index + 1}
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold">
              {step.title}
            </h3>
            <p className="mt-2 text-foreground/70">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
