import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display text-xl font-bold tracking-tight text-foreground',
        className,
      )}
    >
      vendeu<span className="text-brand">.</span>store
    </span>
  );
}
