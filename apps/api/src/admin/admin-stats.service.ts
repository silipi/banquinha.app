import { Inject, Injectable } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import type { Db } from '../database/database.js';
import { DB } from '../database/database.module.js';
import { PLANS, type PlanId } from '../plans/plans.js';
import { ADMIN_SETTINGS, type AdminSettings } from './admin-settings.js';
import type { AdminOverviewDto, CountDto } from './dto/admin.dto.js';

const WEEKS = 12;
const TOP_CITIES = 15;

/**
 * Same rule as effectivePlan() in SQL, for a query over `users`. Enum values compare in
 * declaration order (free < pro), so greatest() is the better plan.
 */
export const effectivePlanSql = sql`case
  when users.plan_override is not null
    and (users.plan_override_expires_at is null or users.plan_override_expires_at > now())
  then greatest(users.plan, users.plan_override)
  else users.plan end`;

const ITEM_KINDS: Record<string, string> = {
  product: 'Produto',
  service: 'Serviço',
};
const PRICE_TYPES: Record<string, string> = {
  fixed: 'Preço fixo',
  hourly: 'Por hora',
  daily: 'Por dia',
  from: 'A partir de',
  quote: 'Sob orçamento',
};
const FULFILLMENT: Record<string, string> = {
  pickup: 'Retirada / no local',
  delivery: 'Entrega / no cliente',
  online: 'Online',
};
const ORDER_STATUSES: Record<string, string> = {
  new: 'Novo',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  canceled: 'Cancelado',
};
const SIGN_IN_METHODS: Record<string, string> = {
  password: 'Só senha',
  google: 'Só Google',
  both: 'Senha e Google',
};

type CountRow = { key: string | null; count: number };

/** Numbers for the admin dashboard. Example stores (no owner) are left out of every metric. */
@Injectable()
export class AdminStatsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(ADMIN_SETTINGS) private readonly settings: AdminSettings,
  ) {}

  async overview(): Promise<AdminOverviewDto> {
    const [
      totals,
      averages,
      weeks,
      funnel,
      plans,
      signupMethods,
      itemKinds,
      priceTypes,
      cities,
      themes,
      fulfillment,
      orderStatuses,
      productsPerStore,
      photosPerProduct,
      ordersPerStore,
    ] = await Promise.all([
      this.totals(),
      this.averages(),
      this.weeks(),
      this.funnel(),
      this.counts(sql`
        select ${effectivePlanSql}::text as key, count(*)::int as count
        from users group by 1`),
      this.counts(sql`
        select case
            when password_hash is not null and google_sub is not null then 'both'
            when google_sub is not null then 'google'
            else 'password' end as key,
          count(*)::int as count
        from users group by 1`),
      this.counts(sql`
        select p.kind::text as key, count(*)::int as count
        from products p join stores s on s.id = p.store_id
        where s.owner_id is not null group by 1`),
      this.counts(sql`
        select p.price_type::text as key, count(*)::int as count
        from products p join stores s on s.id = p.store_id
        where s.owner_id is not null group by 1`),
      this.counts(sql`
        select nullif(trim(city), '') as key, count(*)::int as count
        from stores where owner_id is not null
        group by 1 order by 2 desc limit ${TOP_CITIES}`),
      this.counts(sql`
        select t.name as key, count(*)::int as count
        from stores s join themes t on t.id = s.theme_id
        where s.owner_id is not null group by 1`),
      this.counts(sql`
        select o.fulfillment::text as key, count(*)::int as count
        from orders o join stores s on s.id = o.store_id
        where s.owner_id is not null group by 1`),
      this.counts(sql`
        select o.status::text as key, count(*)::int as count
        from orders o join stores s on s.id = o.store_id
        where s.owner_id is not null group by 1`),
      this.buckets(
        sql`select count(p.id)::int as n
          from stores s left join products p on p.store_id = s.id
          where s.owner_id is not null group by s.id`,
        [0, 1, [2, 5], [6, 10], [11, 50], 51],
      ),
      this.buckets(
        sql`select count(i.id)::int as n
          from products p
          join stores s on s.id = p.store_id
          left join product_images i on i.product_id = p.id
          where s.owner_id is not null group by p.id`,
        [0, 1, 2, 3, [4, 8]],
      ),
      this.buckets(
        sql`select count(o.id)::int as n
          from stores s left join orders o on o.store_id = s.id
          where s.owner_id is not null group by s.id`,
        [0, 1, [2, 5], [6, 20], 21],
      ),
    ]);

    return {
      environment: this.settings.environment,
      generatedAt: new Date().toISOString(),
      totals,
      averages,
      weeks,
      funnel,
      plans: labeled(plans, (key) => PLANS[key as PlanId]?.name ?? key),
      signupMethods: labeled(signupMethods, (key) => SIGN_IN_METHODS[key]),
      itemKinds: labeled(itemKinds, (key) => ITEM_KINDS[key]),
      priceTypes: labeled(priceTypes, (key) => PRICE_TYPES[key]),
      cities: labeled(cities, (key) => key, 'Sem cidade'),
      themes: labeled(themes, (key) => key),
      fulfillment: labeled(fulfillment, (key) => FULFILLMENT[key]),
      orderStatuses: labeled(orderStatuses, (key) => ORDER_STATUSES[key]),
      productsPerStore,
      photosPerProduct,
      ordersPerStore,
    };
  }

  private async totals(): Promise<AdminOverviewDto['totals']> {
    const [row] = await this.rows<AdminOverviewDto['totals']>(sql`
      select
        (select count(*) from users)::int as "accounts",
        (select count(*) from stores where owner_id is not null)::int as "stores",
        (select count(*) from stores
          where owner_id is not null and suspended_at is not null)::int as "suspendedStores",
        (select count(*) from products p join stores s on s.id = p.store_id
          where s.owner_id is not null and p.kind = 'product')::int as "products",
        (select count(*) from products p join stores s on s.id = p.store_id
          where s.owner_id is not null and p.kind = 'service')::int as "services",
        (select count(*) from product_images i
          join products p on p.id = i.product_id
          join stores s on s.id = p.store_id
          where s.owner_id is not null)::int as "photos",
        (select count(*) from orders o join stores s on s.id = o.store_id
          where s.owner_id is not null)::int as "orders",
        (select count(*) from orders o join stores s on s.id = o.store_id
          where s.owner_id is not null
            and o.created_at > now() - interval '30 days')::int as "ordersLast30Days",
        (select count(distinct o.store_id) from orders o join stores s on s.id = o.store_id
          where s.owner_id is not null
            and o.created_at > now() - interval '30 days')::int as "activeStoresLast30Days",
        (select count(*) from users where plan_override is not null
          and (plan_override_expires_at is null
            or plan_override_expires_at > now()))::int as "compedAccounts",
        (select coalesce(sum(o.total_cents), 0) from orders o
          join stores s on s.id = o.store_id
          where s.owner_id is not null)::bigint::float8 as "orderValueCents"
    `);
    return row!;
  }

  private async averages(): Promise<AdminOverviewDto['averages']> {
    const [row] = await this.rows<AdminOverviewDto['averages']>(sql`
      with merchant_stores as (select id from stores where owner_id is not null),
      per_store as (
        select ms.id,
          (select count(*) from products p where p.store_id = ms.id) as products,
          (select count(*) from orders o where o.store_id = ms.id
            and o.created_at > now() - interval '30 days') as recent_orders
        from merchant_stores ms
      ),
      per_product as (
        select count(i.id) as photos from products p
        join merchant_stores ms on ms.id = p.store_id
        left join product_images i on i.product_id = p.id
        group by p.id
      )
      select
        coalesce((select avg(products) from per_store), 0)::float8 as "productsPerStore",
        coalesce((select avg(photos) from per_product), 0)::float8 as "photosPerProduct",
        coalesce((select avg(recent_orders) from per_store
          where recent_orders > 0), 0)::float8 as "ordersPerActiveStore",
        coalesce((select avg(o.total_cents) from orders o
          join merchant_stores ms on ms.id = o.store_id), 0)::float8 as "orderValueCents"
    `);
    return row!;
  }

  private weeks(): Promise<AdminOverviewDto['weeks']> {
    const week = (column: SQL) =>
      sql`date_trunc('week', ${column} at time zone 'America/Sao_Paulo')::date`;
    return this.rows(sql`
      with weeks as (
        select generate_series(
          date_trunc('week', now() at time zone 'America/Sao_Paulo')::date
            - ${(WEEKS - 1) * 7}::int,
          date_trunc('week', now() at time zone 'America/Sao_Paulo')::date,
          interval '1 week'
        )::date as week
      ),
      signups as (
        select ${week(sql`u.created_at`)} as week, count(*) as signups,
          count(*) filter (where exists (
            select 1 from stores s where s.owner_id = u.id)) as with_store
        from users u group by 1
      ),
      created as (
        select ${week(sql`created_at`)} as week, count(*) as stores
        from stores where owner_id is not null group by 1
      ),
      placed as (
        select ${week(sql`o.created_at`)} as week, count(*) as orders
        from orders o join stores s on s.id = o.store_id
        where s.owner_id is not null group by 1
      )
      select to_char(w.week, 'YYYY-MM-DD') as "week",
        coalesce(su.signups, 0)::int as "signups",
        coalesce(su.with_store, 0)::int as "signupsWithStore",
        coalesce(c.stores, 0)::int as "storesCreated",
        coalesce(p.orders, 0)::int as "orders"
      from weeks w
      left join signups su on su.week = w.week
      left join created c on c.week = w.week
      left join placed p on p.week = w.week
      order by w.week
    `);
  }

  private async funnel(): Promise<AdminOverviewDto['funnel']> {
    const [row] = await this.rows<Record<string, number>>(sql`
      select
        count(*)::int as "signedUp",
        count(*) filter (where exists (
          select 1 from stores s where s.owner_id = u.id))::int as "createdStore",
        count(*) filter (where exists (
          select 1 from stores s where s.owner_id = u.id
            and (s.logo_url is not null or s.bio is not null)))::int as "customized",
        count(*) filter (where exists (
          select 1 from stores s
          join products p on p.store_id = s.id
          join product_images i on i.product_id = p.id
          where s.owner_id = u.id))::int as "addedPhoto",
        count(*) filter (where exists (
          select 1 from stores s join orders o on o.store_id = s.id
          where s.owner_id = u.id))::int as "gotOrder",
        count(*) filter (where (
          select count(*) from stores s join orders o on o.store_id = s.id
          where s.owner_id = u.id) >= 5)::int as "gotFiveOrders"
      from users u
    `);
    const steps: [string, string][] = [
      ['signedUp', 'Criou a conta'],
      ['createdStore', 'Criou a loja'],
      ['customized', 'Pôs logo ou descrição'],
      ['addedPhoto', 'Pôs foto em um item'],
      ['gotOrder', 'Recebeu um pedido'],
      ['gotFiveOrders', 'Recebeu 5 pedidos'],
    ];
    return steps.map(([key, label]) => ({ key, label, count: row![key]! }));
  }

  private counts(query: SQL): Promise<CountRow[]> {
    return this.rows<CountRow>(query);
  }

  /** Groups per-row values `n` into ranges: a number is itself, [a, b] is a..b, the last is "n+". */
  private async buckets(
    query: SQL,
    ranges: (number | [number, number])[],
  ): Promise<CountDto[]> {
    const values = (await this.rows<{ n: number }>(query)).map((row) => row.n);
    return ranges.map((range, index) => {
      const last = index === ranges.length - 1;
      const [min, max] = Array.isArray(range)
        ? range
        : [range, last ? Infinity : range];
      const label = Array.isArray(range)
        ? `${min}–${max}`
        : last && index > 0
          ? `${min}+`
          : String(min);
      return {
        key: label,
        label,
        count: values.filter((n) => n >= min && n <= max).length,
      };
    });
  }

  private async rows<T>(query: SQL): Promise<T[]> {
    return (await this.db.execute(query)) as unknown as T[];
  }
}

function labeled(
  rows: CountRow[],
  label: (key: string) => string | undefined,
  nullLabel = '—',
): CountDto[] {
  return rows
    .map((row) => ({
      key: row.key ?? '',
      label: row.key === null ? nullLabel : (label(row.key) ?? row.key),
      count: row.count,
    }))
    .sort((a, b) => b.count - a.count);
}
