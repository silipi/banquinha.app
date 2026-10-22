import type { Metadata } from 'next';
import { BagView } from './BagView';

export const metadata: Metadata = {
  title: 'Sacola',
  robots: { index: false },
};

export default function BagPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
      <BagView />
    </main>
  );
}
