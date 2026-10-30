'use client';

import { adminAuditLog, type AuditEntryDto } from '@banquinha/api-client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { panelApi } from '@/lib/panel';
import { Loading, PageTitle, Section } from '../../_components/admin-ui';
import { AuditList } from '../_components/AuditList';

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntryDto[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);

  const load = (before?: string) =>
    adminAuditLog({ client: panelApi, query: { before } }).then(({ data }) => {
      if (!data) return;
      setEntries((current) => [
        ...(before ? (current ?? []) : []),
        ...data.entries,
      ]);
      setNextBefore(data.nextBefore);
    });

  useEffect(() => {
    adminAuditLog({ client: panelApi }).then(({ data }) => {
      if (!data) return;
      setEntries(data.entries);
      setNextBefore(data.nextBefore);
    });
  }, []);

  return (
    <>
      <PageTitle>Auditoria</PageTitle>
      <Section title="Logins e alterações feitas no admin">
        {entries ? <AuditList entries={entries} /> : <Loading />}
        {nextBefore && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => load(nextBefore)}
          >
            Mais antigos
          </Button>
        )}
      </Section>
    </>
  );
}
