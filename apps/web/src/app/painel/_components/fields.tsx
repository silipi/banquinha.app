'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const inputClass =
  'h-13 w-full rounded-2xl border bg-surface px-4 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 aria-invalid:border-red-400';

type FieldProps = ComponentProps<'input'> & {
  label: string;
  error?: string | null;
  hint?: string;
};

/** Labeled input with its error below. Base font size 16px so iOS doesn't zoom in. */
export function Field({ label, error, hint, className, ...input }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(inputClass, className)}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Password input with a show/hide toggle, so people can check what they typed. */
export function PasswordField(props: Omit<FieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Field
        {...props}
        type={visible ? 'text' : 'password'}
        className="pr-13"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute top-7 right-1 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

export function FormError({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {children}
    </p>
  );
}
