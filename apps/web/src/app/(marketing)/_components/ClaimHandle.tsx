'use client';

import { ArrowRight, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { storesCheckHandle } from '@/lib/api';
import { brandDomain } from '@/lib/site';
import { formatStoreHandleInput } from '@/lib/store-handle-input';
import { cn } from '@/lib/utils';

export function ClaimHandle({ className }: { className?: string }) {
  const router = useRouter();
  const inputId = useId();
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const { data } = await storesCheckHandle({ query: { handle } }).catch(
      () => ({ data: undefined }),
    );
    setPending(false);

    if (!data) {
      setError('Não conseguimos verificar agora. Tente de novo.');
      return;
    }
    if (!data.available) {
      setError(data.message ?? 'Esse endereço não está disponível');
      return;
    }
    router.push(`/cadastro?loja=${data.handle}`);
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full max-w-md', className)}>
      <label htmlFor={inputId} className="sr-only">
        Endereço da sua loja
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border bg-surface p-1.5 pl-5 shadow-sm transition-colors focus-within:border-foreground/40',
          error && 'border-red-400',
        )}
      >
        <div className="flex min-w-0 flex-1 items-baseline overflow-hidden text-base">
          <span className="shrink-0 text-muted-foreground">{brandDomain}/</span>
          <input
            id={inputId}
            value={handle}
            onChange={(event) => {
              setHandle(formatStoreHandleInput(event.target.value));
              setError(null);
            }}
            style={{ width: `${Math.max(handle.length, 7) + 0.5}ch` }}
            placeholder="sualoja"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="max-w-full min-w-0 bg-transparent font-medium outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <Button
          type="submit"
          size="md"
          disabled={pending}
          aria-label="Criar loja grátis"
        >
          <span className="hidden sm:inline">Criar loja grátis</span>
          {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
        </Button>
      </div>
      <p
        id={`${inputId}-error`}
        role="alert"
        className="mt-2 min-h-5 pl-5 text-left text-sm text-red-600"
      >
        {error}
      </p>
    </form>
  );
}
