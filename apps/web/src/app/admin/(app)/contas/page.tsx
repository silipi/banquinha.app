'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading } from '../../_components/admin-ui';
import { AccountDetail } from './_components/AccountDetail';
import { AccountList } from './_components/AccountList';

// /contas lists merchant accounts; /contas?id=<uuid> opens one.
export default function AdminAccountsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AccountsRoute />
    </Suspense>
  );
}

function AccountsRoute() {
  const id = useSearchParams().get('id');
  return id ? <AccountDetail key={id} id={id} /> : <AccountList />;
}
