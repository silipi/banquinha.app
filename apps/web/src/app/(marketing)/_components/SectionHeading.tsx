import type { ReactNode } from 'react';

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wider text-brand uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-pretty text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
