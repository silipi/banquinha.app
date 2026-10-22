import { Check } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

// Pro plan limits and price aren't defined yet.
const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: 'para sempre',
    description: 'Para tirar sua loja do papel.',
    features: [
      'Até 10 produtos',
      'Até 3 fotos por produto',
      'Link sualoja.vendeu.store',
      'Pedidos pelo WhatsApp',
      'Sem taxa por venda',
    ],
    cta: { label: 'Começar grátis', href: '/cadastro' },
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'Em breve',
    period: '',
    description: 'Para lojas que estão crescendo.',
    features: [
      'Tudo do Grátis',
      'Mais produtos e fotos',
      'Pix e cartão na loja',
      'Domínio próprio',
      'Relatórios de vendas',
    ],
    cta: null,
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="precos" className="scroll-mt-24 px-4 py-24">
      <SectionHeading
        eyebrow="Preços"
        title="Comece pequeno. Cresça quando quiser."
        description="Crie sua loja de graça e só mude de plano quando o seu negócio pedir."
      />
      <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'flex flex-col rounded-3xl border p-8',
              plan.highlighted ? 'bg-surface shadow-lg' : 'bg-muted/60',
            )}
          >
            <p className="font-display text-xl font-bold">{plan.name}</p>
            <p className="mt-1 text-muted-foreground">{plan.description}</p>
            <p className="mt-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-muted-foreground">{plan.period}</span>
              )}
            </p>
            <ul className="mt-8 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>
            {plan.cta ? (
              <Link
                href={plan.cta.href}
                className={cn(buttonVariants({ size: 'lg' }), 'mt-8')}
              >
                {plan.cta.label}
              </Link>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'pointer-events-none mt-8 opacity-60',
                )}
              >
                Em breve
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
