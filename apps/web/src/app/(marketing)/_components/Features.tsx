import {
  BarChart3,
  CreditCard,
  MessageCircle,
  Palette,
  Smartphone,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

type Feature = {
  icon: LucideIcon;
  title: string;
  text: string;
  soon?: boolean;
  className?: string;
};

const features: Feature[] = [
  {
    icon: Smartphone,
    title: 'Gerencie tudo pelo celular',
    text: 'Cadastre produtos, troque fotos e acompanhe pedidos de onde estiver. O painel foi pensado para a tela do celular.',
    className: 'md:col-span-2 bg-ink text-ink-foreground',
  },
  {
    icon: MessageCircle,
    title: 'Pedidos no WhatsApp',
    text: 'O pedido chega organizado no seu WhatsApp, com itens, total e contato do cliente.',
    className: 'bg-surface',
  },
  {
    icon: Palette,
    title: 'Sua loja, sua cara',
    text: 'Logo, cores e fotos do seu jeito. Fica bonita em qualquer tela.',
    className: 'bg-surface',
  },
  {
    icon: CreditCard,
    title: 'Pix e cartão',
    text: 'Receba pagamentos na própria loja, com o dinheiro direto na sua conta.',
    soon: true,
    className: 'bg-surface',
  },
  {
    icon: Truck,
    title: 'Frete e retirada',
    text: 'Cálculo de frete ou retirada combinada. Você escolhe como entregar.',
    soon: true,
    className: 'bg-surface',
  },
  {
    icon: BarChart3,
    title: 'Relatórios de vendas',
    text: 'Saiba o que mais vende, quem compra e quando. Dados simples para decidir melhor.',
    soon: true,
    className: 'md:col-span-3 bg-brand-soft',
  },
];

export function Features() {
  return (
    <section id="recursos" className="scroll-mt-24 px-4 py-24">
      <SectionHeading
        eyebrow="Recursos"
        title="Tudo que você precisa para vender online."
        description="Começa simples e cresce junto com o seu negócio."
      />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, text, soon, className }) => (
          <li key={title} className={cn('rounded-3xl border p-7', className)}>
            <div className="flex items-center justify-between">
              <Icon className="size-6" />
              {soon && (
                <span className="rounded-full border border-current/20 px-2.5 py-0.5 text-xs font-medium opacity-70">
                  Em breve
                </span>
              )}
            </div>
            <h3 className="mt-8 font-display text-xl font-bold">{title}</h3>
            <p className="mt-2 opacity-70">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
