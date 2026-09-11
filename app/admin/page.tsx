import { count, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { products, profiles, dealerProfiles, orders, orderItems } from "@/db/schema";
import DashboardClient from "./DashboardClient";
import type { DailyStat, TopProduct, DashboardStats, Period } from "./DashboardClient";

const VALID_PERIODS: Period[] = ["1m", "3m", "12m", "all"];

function parsePeriod(raw: string | undefined): Period {
  if (raw && VALID_PERIODS.includes(raw as Period)) return raw as Period;
  return "1m";
}

function periodStart(period: Period): Date | null {
  if (period === "all") return null;
  const d = new Date();
  const months = period === "1m" ? 1 : period === "3m" ? 3 : 12;
  d.setMonth(d.getMonth() - months);
  return d;
}

function usesMonthlyBuckets(period: Period): boolean {
  return period === "12m" || period === "all";
}

async function getDashboardData(period: Period) {
  const db = getDb();
  const from = periodStart(period);
  const monthly = usesMonthlyBuckets(period);

  const dailyQuery = monthly
    ? from
      ? sql`
          SELECT
            TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome'), 'MM/YYYY') AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total::numeric), 0)::float AS revenue
          FROM orders
          WHERE created_at >= ${from} AND status != 'cancelled'
          GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome')
          ORDER BY DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome') ASC
        `
      : sql`
          SELECT
            TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome'), 'MM/YYYY') AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total::numeric), 0)::float AS revenue
          FROM orders
          WHERE status != 'cancelled'
          GROUP BY DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome')
          ORDER BY DATE_TRUNC('month', created_at AT TIME ZONE 'Europe/Rome') ASC
        `
    : from
      ? sql`
          SELECT
            TO_CHAR(DATE(created_at AT TIME ZONE 'Europe/Rome'), 'DD/MM') AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total::numeric), 0)::float AS revenue
          FROM orders
          WHERE created_at >= ${from} AND status != 'cancelled'
          GROUP BY DATE(created_at AT TIME ZONE 'Europe/Rome')
          ORDER BY DATE(created_at AT TIME ZONE 'Europe/Rome') ASC
        `
      : sql`
          SELECT
            TO_CHAR(DATE(created_at AT TIME ZONE 'Europe/Rome'), 'DD/MM') AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total::numeric), 0)::float AS revenue
          FROM orders
          WHERE status != 'cancelled'
          GROUP BY DATE(created_at AT TIME ZONE 'Europe/Rome')
          ORDER BY DATE(created_at AT TIME ZONE 'Europe/Rome') ASC
        `;

  const topQuery = from
    ? sql`
        SELECT
          oi.product_name AS name,
          SUM(oi.quantity)::int AS qty,
          COALESCE(SUM(oi.quantity * oi.unit_price::numeric), 0)::float AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${from} AND o.status != 'cancelled'
        GROUP BY oi.product_name
        ORDER BY qty DESC
        LIMIT 5
      `
    : sql`
        SELECT
          oi.product_name AS name,
          SUM(oi.quantity)::int AS qty,
          COALESCE(SUM(oi.quantity * oi.unit_price::numeric), 0)::float AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY oi.product_name
        ORDER BY qty DESC
        LIMIT 5
      `;

  const statsQuery = from
    ? sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total::numeric), 0)::float AS revenue
        FROM orders
        WHERE created_at >= ${from} AND status != 'cancelled'
      `
    : sql`
        SELECT
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total::numeric), 0)::float AS revenue
        FROM orders
        WHERE status != 'cancelled'
      `;

  const [p, prof, deal, ords, daily, top, monthStats] = await Promise.all([
    db.select({ n: count() }).from(products).then((r) => r[0]),
    db.select({ n: count() }).from(profiles).then((r) => r[0]),
    db.select({ n: count() }).from(dealerProfiles).where(eq(dealerProfiles.status, "pending")).then((r) => r[0]),
    db.select({ n: count() }).from(orders).then((r) => r[0]),
    db.execute(dailyQuery),
    db.execute(topQuery),
    db.execute(statsQuery),
  ]);

  const stats: DashboardStats = {
    totalProducts: Number(p.n),
    totalUsers: Number(prof.n),
    pendingDealers: Number(deal.n),
    totalOrders: Number(ords.n),
    revenueThisMonth: Number((monthStats.rows[0] as { revenue: number })?.revenue ?? 0),
    ordersThisMonth: Number((monthStats.rows[0] as { order_count: number })?.order_count ?? 0),
  };

  const dailyData: DailyStat[] = (daily.rows as { day: string; orders: number; revenue: number }[]).map((r) => ({
    day: r.day,
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));

  const topProducts: TopProduct[] = (top.rows as { name: string; qty: number; revenue: number }[]).map((r) => ({
    name: r.name,
    qty: Number(r.qty),
    revenue: Number(r.revenue),
  }));

  return { stats, dailyData, topProducts };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const { stats, dailyData, topProducts } = await getDashboardData(period);

  return (
    <DashboardClient
      stats={stats}
      dailyData={dailyData}
      topProducts={topProducts}
      period={period}
    />
  );
}
