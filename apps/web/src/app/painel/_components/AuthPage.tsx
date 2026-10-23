import type { ReactNode } from 'react';

/** Heading, form and the link to the other auth page ("Já tem conta? Entrar"). */
export function AuthPage({
  badge,
  heading,
  description,
  children,
  footer,
}: {
  badge?: ReactNode;
  heading: string;
  description: string;
  children: ReactNode;
  footer?: { text: string; link: string; href: string };
}) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        {badge}
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
          {heading}
        </h1>
        <p className="mt-2 text-pretty text-muted-foreground">{description}</p>
      </header>
      {children}
      {footer && (
        <p className="text-center text-sm text-muted-foreground">
          {footer.text}{' '}
          {/* Relative, so it works both on the app. host and under /painel. */}
          <a
            href={footer.href}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {footer.link}
          </a>
        </p>
      )}
    </div>
  );
}
