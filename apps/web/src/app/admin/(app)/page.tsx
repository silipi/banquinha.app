'use client';

import { adminOverview, type AdminOverviewDto } from '@banquinha/api-client';
import { useEffect, useState } from 'react';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/admin';
import { formatBRL } from '@/lib/utils';
import { apiErrorMessage, panelApi } from '@/lib/panel';
import {
  BarList,
  ColumnChart,
  Loading,
  PageTitle,
  Section,
  Stat,
} from '../_components/admin-ui';

const shortWeek = (week: string) => week.slice(8, 10) + '/' + week.slice(5, 7);

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminOverview({ client: panelApi }).then(({ data, error: failed }) => {
      if (data) setOverview(data);
      else setError(apiErrorMessage(failed, 'Não foi possível carregar.'));
    });
  }, []);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!overview) return <Loading />;
  const { totals, averages, weeks, funnel } = overview;

  const weekly = (
    pick: (week: AdminOverviewDto['weeks'][number]) => number,
    noun: string,
  ) =>
    weeks.map((week) => ({
      label: shortWeek(week.week),
      value: pick(week),
      title: `Semana de ${shortWeek(week.week)}: ${pick(week)} ${noun}`,
    }));

  return (
    <>
      <PageTitle
        aside={
          <span className="text-sm text-muted-foreground">
            Atualizado {formatDateTime(overview.generatedAt)} · lojas de exemplo
            fora das contas
          </span>
        }
      >
        Visão geral
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Contas" value={formatNumber(totals.accounts)} />
        <Stat
          label="Lojas"
          value={formatNumber(totals.stores)}
          hint={
            totals.suspendedStores > 0
              ? `${totals.suspendedStores} suspensa(s)`
              : undefined
          }
        />
        <Stat
          label="Itens"
          value={formatNumber(totals.products + totals.services)}
          hint={`${formatNumber(totals.products)} produtos · ${formatNumber(totals.services)} serviços`}
        />
        <Stat
          label="Fotos"
          value={formatNumber(totals.photos)}
          hint={`${formatNumber(averages.photosPerProduct, 1)} por item`}
        />
        <Stat
          label="Pedidos"
          value={formatNumber(totals.orders)}
          hint={`${formatNumber(totals.ordersLast30Days)} nos últimos 30 dias`}
        />
        <Stat
          label="Lojas ativas (30 dias)"
          value={formatNumber(totals.activeStoresLast30Days)}
          hint={`${formatPercent(totals.activeStoresLast30Days, totals.stores)} das lojas · ${formatNumber(averages.ordersPerActiveStore, 1)} pedidos cada`}
        />
        <Stat
          label="Valor dos pedidos"
          value={formatBRL(totals.orderValueCents / 100)}
          hint={`Média ${formatBRL(averages.orderValueCents / 100)} (só preços fechados)`}
        />
        <Stat
          label="Cortesias ativas"
          value={formatNumber(totals.compedAccounts)}
          hint={`${formatNumber(averages.productsPerStore, 1)} itens por loja`}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Section title="Cadastros por semana">
          <ColumnChart points={weekly((week) => week.signups, 'cadastros')} />
        </Section>
        <Section title="Lojas criadas por semana">
          <ColumnChart points={weekly((week) => week.storesCreated, 'lojas')} />
        </Section>
        <Section title="Pedidos por semana">
          <ColumnChart points={weekly((week) => week.orders, 'pedidos')} />
        </Section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Funil (contas em cada etapa)">
          <ul className="space-y-1.5 text-sm">
            {funnel.map((step, index) => (
              <li key={step.key}>
                <div className="flex justify-between gap-3">
                  <span>{step.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatNumber(step.count)} ·{' '}
                    {formatPercent(step.count, funnel[0]!.count)}
                    {index > 0 &&
                      ` (${formatPercent(step.count, funnel[index - 1]!.count)} da anterior)`}
                  </span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${(step.count / Math.max(1, funnel[0]!.count)) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Onboarding por semana de cadastro">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium">Semana</th>
                <th className="text-right font-medium">Cadastros</th>
                <th className="text-right font-medium">Com loja</th>
                <th className="text-right font-medium">Conclusão</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {weeks
                .filter((week) => week.signups > 0)
                .reverse()
                .map((week) => (
                  <tr key={week.week}>
                    <td>{shortWeek(week.week)}</td>
                    <td className="text-right">{week.signups}</td>
                    <td className="text-right">{week.signupsWithStore}</td>
                    <td className="text-right">
                      {formatPercent(week.signupsWithStore, week.signups)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {weeks.every((week) => week.signups === 0) && (
            <p className="text-sm text-muted-foreground">
              Nenhum cadastro nas últimas 12 semanas
            </p>
          )}
        </Section>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Section title="Planos (em vigor)">
          <BarList rows={overview.plans} />
        </Section>
        <Section title="Forma de entrar">
          <BarList rows={overview.signupMethods} />
        </Section>
        <Section title="Cidades">
          <BarList rows={overview.cities} />
        </Section>
        <Section title="Produto ou serviço">
          <BarList rows={overview.itemKinds} />
        </Section>
        <Section title="Tipo de preço">
          <BarList rows={overview.priceTypes} />
        </Section>
        <Section title="Temas">
          <BarList rows={overview.themes} />
        </Section>
        <Section title="Itens por loja">
          <BarList rows={overview.productsPerStore} />
        </Section>
        <Section title="Fotos por item">
          <BarList rows={overview.photosPerProduct} />
        </Section>
        <Section title="Pedidos por loja">
          <BarList rows={overview.ordersPerStore} />
        </Section>
        <Section title="Status dos pedidos">
          <BarList rows={overview.orderStatuses} />
        </Section>
        <Section title="Entrega dos pedidos">
          <BarList rows={overview.fulfillment} />
        </Section>
      </div>
    </>
  );
}
