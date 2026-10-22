import { Plus } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const faq = [
  {
    question: 'Quanto custa?',
    answer:
      'Criar e manter sua loja é grátis, com até 10 produtos. Também não cobramos taxa sobre as suas vendas. Quando você precisar de mais espaço e recursos, vai poder migrar para o plano Pro.',
  },
  {
    question: 'Preciso saber programar ou montar um site?',
    answer:
      'Não. Você preenche nome, fotos e preços dos produtos e a vitrine fica pronta. Dá pra fazer tudo pelo celular em uns 10 minutos.',
  },
  {
    question: 'Como recebo os pedidos?',
    answer:
      'O cliente escolhe os produtos na sua loja e, ao finalizar, o pedido chega organizado no seu WhatsApp, com itens, total e contato. Aí é só combinar pagamento e entrega com ele.',
  },
  {
    question: 'E pagamento por Pix ou cartão?',
    answer:
      'Está chegando. Em breve você vai poder receber por Pix e cartão direto na loja, com o dinheiro caindo na sua conta.',
  },
  {
    question: 'Como meus clientes encontram minha loja?',
    answer:
      'Toda loja tem um link próprio, como sualoja.vendeu.store. Coloque na bio do Instagram, no TikTok, no status do WhatsApp ou num QR code no balcão.',
  },
  {
    question: 'Posso usar meu próprio domínio?',
    answer:
      'Vai ser possível no plano Pro. Até lá, sua loja usa o endereço sualoja.vendeu.store.',
  },
];

export function Faq() {
  return (
    <section id="perguntas" className="scroll-mt-24 px-4 py-24">
      <SectionHeading eyebrow="Dúvidas" title="Perguntas frequentes." />
      <div className="mx-auto mt-12 max-w-3xl divide-y rounded-3xl border bg-surface">
        {faq.map((item) => (
          <details key={item.question} className="group px-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45" />
            </summary>
            <p className="pb-5 text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
