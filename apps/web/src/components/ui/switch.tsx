import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** On/off row with a label and a line of explanation, as a native checkbox. */
export function SwitchRow({
  label,
  description,
  checked,
  disabled,
  onChange,
  className,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-surface px-4 py-3 has-disabled:cursor-not-allowed has-disabled:opacity-60',
        className,
      )}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="block text-sm text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:after:translate-x-5"
      />
    </label>
  );
}
