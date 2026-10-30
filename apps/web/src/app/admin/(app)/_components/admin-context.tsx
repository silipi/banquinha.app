'use client';

import type { AdminMeDto } from '@banquinha/api-client';
import { createContext, useContext, type ReactNode } from 'react';

const AdminContext = createContext<AdminMeDto | null>(null);

export function AdminProvider({
  me,
  children,
}: {
  me: AdminMeDto;
  children: ReactNode;
}) {
  return <AdminContext value={me}>{children}</AdminContext>;
}

/** The admin session (environment, expiry). Only inside the (app) layout. */
export function useAdmin(): AdminMeDto {
  const me = useContext(AdminContext);
  if (!me) throw new Error('useAdmin outside AdminProvider');
  return me;
}
