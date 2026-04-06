"use client";

import { useState, useEffect, useCallback } from "react";
import RevenueChart from "./components/RevenueChart";
import {
  FiBox,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiArrowLeft,
} from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

type FilterMode = "last7days" | "month" | "year";
type MetricType = "products" | "orders" | "revenue" | "growth";

type TopBuyer = {
  id: number;
  name: string;
  company: string;
  orders: number;
  spent: string;
  avatar: string;
};

type AnalyticsModeData = {
  metrics: {
    totalProducts: { value: string; trend: string; note: string };
    totalOrders: { value: string; trend: string; note: string };
    totalRevenue: { value: string; trend: string; note: string };
    growthRate: { value: string; trend: string; note: string };
  };
  chartTitle: string;
  chartValue: string;
  chartChange: string;
  chartCaption: string;
  series: {
    revenue: number[];
    orders: number[];
    products: number[];
    growth: number[];
  };
  labels: string[];
  highlights: {
    bestPeriod: string;
    bestPeriodSub: string;
    bestYear: string;
    bestYearSub: string;
  };
  productBreakdown: { name: string; count: number }[];
  orderBreakdown: { label: string; value: string; sub: string }[];
  revenueBreakdown: { label: string; value: string; sub: string }[];
  growthBreakdown: { label: string; value: string; sub: string }[];
};

type FetchResult = {
  current: AnalyticsModeData;
  recentOrders: { id: string; time: string; amount: string }[];
  topBuyers: TopBuyer[];
  buyerCount: number;
};

const filterOptions: { label: string; value: FilterMode }[] = [
  { label: "Last 7 Days", value: "last7days" },
  { label: "Month-by-Month", value: "month" },
  { label: "Year-on-Year", value: "year" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const metricTitles: Record<MetricType, string> = {
  products: "Total Products Analytics",
  orders: "Total Orders Analytics",
  revenue: "Total Revenue Analytics",
  growth: "Growth Rate Analytics",
};

const metricAccent: Record<MetricType, string> = {
  products: "text-blue-500",
  orders: "text-purple-500",
  revenue: "text-green-500",
  growth: "text-orange-500",
};

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? "s" : ""} ago`;
}

const emptyData: AnalyticsModeData = {
  metrics: {
    totalProducts: { value: "—", trend: "", note: "Loading..." },
    totalOrders:   { value: "—", trend: "", note: "Loading..." },
    totalRevenue:  { value: "—", trend: "", note: "Loading..." },
    growthRate:    { value: "—", trend: "", note: "Loading..." },
  },
  chartTitle: "Sales Snapshot",
  chartValue: "—",
  chartChange: "",
  chartCaption: "Loading data...",
  series: { revenue: [], orders: [], products: [], growth: [] },
  labels: [],
  highlights: { bestPeriod: "—", bestPeriodSub: "—", bestYear: "—", bestYearSub: "—" },
  productBreakdown: [],
  orderBreakdown: [],
  revenueBreakdown: [],
  growthBreakdown: [],
};

export default function AdminDashboard() {
  const [mode, setMode] = useState<FilterMode>("last7days");
  const [detailMetric, setDetailMetric] = useState<MetricType | null>(null);
  const [current, setCurrent] = useState<AnalyticsModeData>(emptyData);
  const [recentOrders, setRecentOrders] = useState<{ id: string; time: string; amount: string }[]>([]);
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [buyerCount, setBuyerCount] = useState<number>(0);

  const fetchDashboardData = useCallback(async (filterMode: FilterMode): Promise<FetchResult> => {
    const supabase = createClient();
    const now = new Date();

    let startCurrent: Date, startPrev: Date, endPrev: Date;
    if (filterMode === "last7days") {
      startCurrent = new Date(now); startCurrent.setDate(now.getDate() - 7);
      startPrev    = new Date(now); startPrev.setDate(now.getDate() - 14);
      endPrev      = startCurrent;
    } else if (filterMode === "month") {
      startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
      startPrev    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endPrev      = startCurrent;
    } else {
      startCurrent = new Date(now.getFullYear(), 0, 1);
      startPrev    = new Date(now.getFullYear() - 1, 0, 1);
      endPrev      = startCurrent;
    }

    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, total_price, created_at, user_id, status");
    const orders = allOrders ?? [];

    const currentOrders = orders.filter(o => new Date(o.created_at) >= startCurrent);
    const prevOrders    = orders.filter(o => new Date(o.created_at) >= startPrev && new Date(o.created_at) < endPrev);

    const { count: productCount } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true });

    const currentRevenue = currentOrders.reduce((s, o) => s + (o.total_price ?? 0), 0);
    const prevRevenue    = prevOrders.reduce((s, o) => s + (o.total_price ?? 0), 0);
    const totalRevenue   = orders.reduce((s, o) => s + (o.total_price ?? 0), 0);
    const totalCount     = orders.length;

    const orderTrend = prevOrders.length > 0
      ? `${currentOrders.length >= prevOrders.length ? "+" : ""}${Math.round(((currentOrders.length - prevOrders.length) / prevOrders.length) * 100)}%`
      : currentOrders.length > 0 ? "+100%" : "—";

    const revenueTrend = prevRevenue > 0
      ? `${currentRevenue >= prevRevenue ? "+" : ""}${Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)}%`
      : currentRevenue > 0 ? "+100%" : "—";

    const growthValue = prevOrders.length > 0
      ? `${Math.abs(Math.round(((currentOrders.length - prevOrders.length) / prevOrders.length) * 100))}%`
      : "—";

    const noteLabel = filterMode === "last7days" ? "vs previous 7 days"
      : filterMode === "month" ? "vs previous month" : "vs previous year";

    let labels: string[] = [];
    let revenueSeries: number[] = [];
    let orderSeries: number[] = [];

    if (filterMode === "last7days") {
      labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
      revenueSeries = Array(7).fill(0);
      orderSeries   = Array(7).fill(0);
      currentOrders.forEach(o => {
        const day = new Date(o.created_at).getDay();
        const idx = day === 0 ? 6 : day - 1;
        revenueSeries[idx] += o.total_price ?? 0;
        orderSeries[idx]   += 1;
      });
    } else if (filterMode === "month") {
      labels = ["W1","W2","W3","W4"];
      revenueSeries = Array(4).fill(0);
      orderSeries   = Array(4).fill(0);
      currentOrders.forEach(o => {
        const day = new Date(o.created_at).getDate();
        const idx = Math.min(Math.floor((day - 1) / 7), 3);
        revenueSeries[idx] += o.total_price ?? 0;
        orderSeries[idx]   += 1;
      });
    } else {
      labels = MONTH_NAMES;
      revenueSeries = Array(12).fill(0);
      orderSeries   = Array(12).fill(0);
      orders.forEach(o => {
        if (new Date(o.created_at).getFullYear() === now.getFullYear()) {
          const idx = new Date(o.created_at).getMonth();
          revenueSeries[idx] += o.total_price ?? 0;
          orderSeries[idx]   += 1;
        }
      });
    }

    const monthRevenue: Record<string, number> = {};
    const yearRevenue:  Record<string, number> = {};
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const mk = MONTH_NAMES[d.getMonth()];
      const yk = String(d.getFullYear());
      monthRevenue[mk] = (monthRevenue[mk] ?? 0) + (o.total_price ?? 0);
      yearRevenue[yk]  = (yearRevenue[yk]  ?? 0) + (o.total_price ?? 0);
    });
    const bestMonth = Object.entries(monthRevenue).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";
    const bestYear  = Object.entries(yearRevenue).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";

    const latest = [...orders]
      .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(o => ({ id: String(o.id), time: timeAgo(o.created_at), amount: `₱${(o.total_price ?? 0).toLocaleString()}` }));

    const spendMap: Record<string, { total: number; count: number }> = {};
    orders.forEach(o => {
      if (!o.user_id) return;
      if (!spendMap[o.user_id]) spendMap[o.user_id] = { total: 0, count: 0 };
      spendMap[o.user_id].total += o.total_price ?? 0;
      spendMap[o.user_id].count += 1;
    });

    const topUserIds = Object.entries(spendMap).sort((a,b) => b[1].total - a[1].total).slice(0,3).map(([id]) => id);
    let buyers: TopBuyer[] = [];
    if (topUserIds.length > 0) {
      const { data: users } = await supabase.from("users").select("id, username").in("id", topUserIds);
      const usernameMap: Record<string, string> = {};
      (users ?? []).forEach(u => { usernameMap[u.id] = u.username; });
      buyers = topUserIds.map((uid, i) => ({
        id: i + 1,
        name: usernameMap[uid] ?? "Anonymous",
        company: "—",
        orders: spendMap[uid].count,
        spent: `₱${spendMap[uid].total.toLocaleString()}`,
        avatar: `https://i.pravatar.cc/100?img=${i + 5}`,
      }));
    }

    const completed = orders.filter(o => o.status === "completed").length;
    const pending   = orders.filter(o => o.status === "pending").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;

    return {
      recentOrders: latest,
      topBuyers: buyers,
      buyerCount: Object.keys(spendMap).length,
      current: {
        metrics: {
          totalProducts: { value: (productCount ?? 0).toLocaleString(), trend: "", note: "Total active items" },
          totalOrders:   { value: totalCount.toLocaleString(), trend: orderTrend, note: noteLabel },
          totalRevenue:  { value: `₱${totalRevenue.toLocaleString()}`, trend: revenueTrend, note: noteLabel },
          growthRate:    { value: growthValue, trend: revenueTrend, note: noteLabel },
        },
        chartTitle: filterMode === "last7days" ? "Sales Snapshot" : filterMode === "month" ? "Monthly Revenue" : "Yearly Revenue",
        chartValue: `₱${currentRevenue.toLocaleString()}`,
        chartChange: revenueTrend,
        chartCaption: filterMode === "last7days" ? "Performance in the last 7 days"
          : filterMode === "month" ? "Performance this month" : "Performance this year",
        series: {
          revenue:  revenueSeries,
          orders:   orderSeries,
          products: Array(labels.length).fill(productCount ?? 0),
          growth:   orderSeries,
        },
        labels,
        highlights: {
          bestPeriod: bestMonth, bestPeriodSub: "Top revenue month",
          bestYear:   bestYear,  bestYearSub:   "Highest revenue year",
        },
        productBreakdown: [],
        orderBreakdown: [
          { label: "Completed Orders", value: completed.toString(), sub: totalCount > 0 ? `${Math.round((completed/totalCount)*100)}% of all orders` : "—" },
          { label: "Pending Orders",   value: pending.toString(),   sub: "Awaiting fulfillment" },
          { label: "Cancelled Orders", value: cancelled.toString(), sub: totalCount > 0 ? `${Math.round((cancelled/totalCount)*100)}% cancellation rate` : "—" },
        ],
        revenueBreakdown: [
          { label: "Total Revenue",    value: `₱${totalRevenue.toLocaleString()}`,                                              sub: "All time" },
          { label: "Current Period",   value: `₱${currentRevenue.toLocaleString()}`,                                            sub: noteLabel },
          { label: "Avg. Order Value", value: totalCount > 0 ? `₱${Math.round(totalRevenue/totalCount).toLocaleString()}` : "—", sub: "Per order" },
        ],
        growthBreakdown: [
          { label: "Growth Rate",   value: growthValue,  sub: noteLabel },
          { label: "Revenue Trend", value: revenueTrend, sub: "Revenue change" },
          { label: "Order Trend",   value: orderTrend,   sub: "Order count change" },
        ],
      },
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData(mode).then(result => {
      if (cancelled) return;
      setCurrent(result.current);
      setRecentOrders(result.recentOrders);
      setTopBuyers(result.topBuyers);
      setBuyerCount(result.buyerCount);
    });
    return () => { cancelled = true; };
  }, [fetchDashboardData, mode]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[#b81d24] tracking-wide">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Unified overview of store performance, activity, and buyers
          </p>
        </div>

        <div className="inline-flex rounded-2xl bg-[#F8F9F4] p-1 border border-gray-200">
          {filterOptions.map((option) => {
            const active = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  active
                    ? "bg-[#C1121F] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#C1121F]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-5 shrink-0">
        <StatCard
          title="Total Products"
          value={current.metrics.totalProducts.value}
          trend={current.metrics.totalProducts.trend}
          note={current.metrics.totalProducts.note}
          icon={<FiBox className="text-xl text-blue-500" />}
          onClick={() => setDetailMetric("products")}
          active={detailMetric === "products"}
        />
        <StatCard
          title="Total Orders"
          value={current.metrics.totalOrders.value}
          trend={current.metrics.totalOrders.trend}
          note={current.metrics.totalOrders.note}
          icon={<FiShoppingBag className="text-xl text-purple-500" />}
          onClick={() => setDetailMetric("orders")}
          active={detailMetric === "orders"}
        />
        <StatCard
          title="Total Revenue"
          value={current.metrics.totalRevenue.value}
          trend={current.metrics.totalRevenue.trend}
          note={current.metrics.totalRevenue.note}
          icon={<FiDollarSign className="text-xl text-green-500" />}
          onClick={() => setDetailMetric("revenue")}
          active={detailMetric === "revenue"}
        />
        <StatCard
          title="Growth Rate"
          value={current.metrics.growthRate.value}
          trend={current.metrics.growthRate.trend}
          note={current.metrics.growthRate.note}
          icon={<FiTrendingUp className="text-xl text-orange-500" />}
          onClick={() => setDetailMetric("growth")}
          active={detailMetric === "growth"}
        />
      </div>

      {/* Main content */}
      {detailMetric ? (
        <MetricDetailView
          metric={detailMetric}
          current={current}
          onBack={() => setDetailMetric(null)}
        />
      ) : (
        <div className="grid grid-cols-[1.35fr_0.95fr] gap-4 min-h-0 flex-1">
          {/* Left side */}
          <div className="grid grid-rows-[1.1fr_0.9fr] gap-4 min-h-0">
            {/* Analytics card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-0 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {current.chartTitle}
                  </h2>
                  <div className="flex items-end gap-3 mt-2">
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">
                      {current.chartValue}
                    </span>
                    <span className="text-sm text-green-500 font-semibold mb-1">
                      {current.chartChange}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {current.chartCaption}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F9F4] border border-gray-200 px-3 py-2 text-xs text-gray-600 font-semibold">
                  {filterOptions.find((f) => f.value === mode)?.label}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end min-h-0">
                {current.series.revenue.length > 0 && (
                  <RevenueChart labels={current.labels} data={current.series.revenue} />
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                  {current.labels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom left row */}
            <div className="grid grid-cols-[1fr_1fr] gap-4 min-h-0">
              <CompactInfoCard
                title="Best Period"
                primary={current.highlights.bestPeriod}
                secondary={current.highlights.bestPeriodSub}
                accent="text-[#8c6b30]"
              />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
                  <span className="text-xs font-semibold text-[#b81d24]">
                    Latest Orders
                  </span>
                </div>

                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <p className="text-gray-400 text-xs">No orders yet.</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Order #{order.id}
                          </p>
                          <p className="text-xs text-gray-500">{order.time}</p>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {order.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="grid grid-rows-[0.75fr_1.25fr] gap-4 min-h-0">
            <div className="grid grid-cols-2 gap-4 min-h-0">
              <CompactInfoCard
                title="Top Year"
                primary={current.highlights.bestYear}
                secondary={current.highlights.bestYearSub}
                accent="text-[#8c6b30]"
              />

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-0 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Buyer Health</h3>
                  <FiUsers className="text-lg text-[#C1121F]" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {buyerCount}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Unique buyers
                  </p>
                </div>
                <p className="text-xs text-green-500 font-semibold">
                  From your orders data
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Top Buyers</h2>
                <span className="text-xs font-semibold text-[#b81d24]">
                  Highest spenders
                </span>
              </div>

              <div className="space-y-3 overflow-hidden">
                {topBuyers.length === 0 ? (
                  <p className="text-gray-400 text-xs">No buyers yet.</p>
                ) : (
                  topBuyers.map((buyer, index) => (
                    <div
                      key={buyer.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#FAFAFA] px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 text-sm font-bold text-gray-400">
                          #{index + 1}
                        </div>
                        <img
                          src={buyer.avatar}
                          alt={buyer.name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {buyer.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {buyer.company}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#003049]">
                          {buyer.spent}
                        </p>
                        <p className="text-xs text-gray-500">
                          {buyer.orders} orders
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricDetailView({
  metric,
  current,
  onBack,
}: {
  metric: MetricType;
  current: AnalyticsModeData;
  onBack: () => void;
}) {
  const breakdown =
    metric === "orders"
      ? current.orderBreakdown
      : metric === "revenue"
      ? current.revenueBreakdown
      : current.growthBreakdown;

  const metricValue =
    metric === "products"
      ? current.metrics.totalProducts.value
      : metric === "orders"
      ? current.metrics.totalOrders.value
      : metric === "revenue"
      ? current.metrics.totalRevenue.value
      : current.metrics.growthRate.value;

  const metricTrend =
    metric === "products"
      ? current.metrics.totalProducts.trend
      : metric === "orders"
      ? current.metrics.totalOrders.trend
      : metric === "revenue"
      ? current.metrics.totalRevenue.trend
      : current.metrics.growthRate.trend;

  const metricNote =
    metric === "products"
      ? current.metrics.totalProducts.note
      : metric === "orders"
      ? current.metrics.totalOrders.note
      : metric === "revenue"
      ? current.metrics.totalRevenue.note
      : current.metrics.growthRate.note;

  return (
    <div className="grid grid-cols-[1.35fr_0.95fr] gap-4 min-h-0 flex-1">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-0 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C1121F] hover:underline mb-3"
            >
              <FiArrowLeft />
              Back to Dashboard
            </button>

            <h2 className="text-xl font-bold text-gray-900">
              {metricTitles[metric]}
            </h2>

            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-bold text-gray-900 tracking-tight">
                {metricValue}
              </span>
              <span className={`text-sm font-semibold mb-1 ${metricAccent[metric]}`}>
                {metricTrend}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">{metricNote}</p>
          </div>
        </div>

        {metric === "products" ? (
          <div className="grid grid-cols-2 gap-4 mt-2 flex-1 min-h-0">
            <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Product Totals
              </h3>
              <div className="space-y-3">
                {current.productBreakdown.length === 0 ? (
                  <p className="text-gray-400 text-xs">No breakdown data yet.</p>
                ) : (
                  current.productBreakdown.map((product) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between rounded-xl bg-white border border-gray-100 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        {product.name}
                      </span>
                      <span className="text-sm font-bold text-[#003049]">
                        {product.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Product Count Trend
              </h3>
              <div className="flex-1 flex flex-col justify-end">
                {current.series.products.length > 0 && (
                  <RevenueChart
                    labels={current.labels}
                    data={current.series.products}
                  />
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                  {current.labels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 mt-2 flex-1 min-h-0">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                {metricTitles[metric]}
              </h3>
              <div className="flex-1 flex flex-col justify-end">
                {current.series[metric].length > 0 && (
                  <RevenueChart
                    labels={current.labels}
                    data={current.series[metric]}
                  />
                )}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                  {current.labels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
                Summary
              </h3>
              <div className="space-y-3">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-white border border-gray-100 px-4 py-3"
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {item.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-rows-[0.75fr_1.25fr] gap-4 min-h-0">
        <CompactInfoCard
          title="Current Filter"
          primary={metricTitles[metric]}
          secondary="Using the same selected dashboard period"
          accent="text-[#8c6b30]"
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">Top Buyers</h2>
            <span className="text-xs font-semibold text-[#b81d24]">
              Highest spenders
            </span>
          </div>

          <div className="space-y-3 overflow-hidden">
            <p className="text-gray-400 text-xs">See main dashboard for top buyers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title, value, trend, note, icon, onClick, active,
}: {
  title: string; value: string; trend: string; note: string;
  icon: React.ReactNode; onClick: () => void; active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border flex flex-col min-h-0 text-left transition-all duration-200 hover:shadow-md ${
        active ? "border-[#C1121F] ring-2 ring-[#C1121F]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h2>
        {icon}
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-900 tracking-tight">
          {value}
        </span>
        {trend && <span className="text-sm text-green-500 font-semibold mb-1">{trend}</span>}
      </div>
      <p className="text-xs text-gray-500">{note}</p>
    </button>
  );
}

function CompactInfoCard({
  title, primary, secondary, accent,
}: {
  title: string; primary: string; secondary: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-0 flex flex-col justify-between">
      <h3 className="text-sm font-bold text-gray-400 uppercase">{title}</h3>
      <div>
        <p className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>
          {primary}
        </p>
        <p className="text-sm text-gray-500 mt-1">{secondary}</p>
      </div>
    </div>
  );
}