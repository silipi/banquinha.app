import type { ReactNode } from 'react';

export type LegalSection = { title: string; body: ReactNode };

/** Shared layout for the terms and privacy pages. */
export function LegalPage({
  title,
  updatedAt,
  intro,
  sections,
}: {
  title: string;
  updatedAt: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Última atualização: {updatedAt}
      </p>
      <div className="mt-8 text-lg leading-relaxed text-pretty">{intro}</div>
      <ol className="mt-12 space-y-10">
        {sections.map((section, index) => (
          <li key={section.title}>
            <h2 className="font-display text-2xl font-bold">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 leading-relaxed text-pretty text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
              {section.body}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
