import { Logo } from '@/components/logo';
import { absoluteUrl } from '@/lib/site';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center px-4 py-5">
        <a href={absoluteUrl('/')} aria-label="banquinha.app, página inicial">
          <Logo />
        </a>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-6 pb-16 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
