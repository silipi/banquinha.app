'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loading } from '../../_components/admin-ui';
import { StoreDetail } from './_components/StoreDetail';
import { StoreList } from './_components/StoreList';

// /lojas lists the stores; /lojas?id=<uuid> opens one.
export default function AdminStoresPage() {
  return (
    <Suspense fallback={<Loading />}>
      <StoresRoute />
    </Suspense>
  );
}

function StoresRoute() {
  const id = useSearchParams().get('id');
  return id ? <StoreDetail key={id} id={id} /> : <StoreList />;
}
