
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Search,
  Bell,
  BarChart3,
  RefreshCw,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

interface AnalyticsProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: string) => void;
}

interface Transaction {
  id: string;
  flow?: string;
  amount: string | number;
  type: string;
  riskScore: string | number;
  riskLevel: string;
}

interface AnalyticsResponse {
  kpis: {
    total_alerts: number;
    high_risk_alerts: number;
    transactions_monitored: number;
    escalated_cases: number;
  };
  transactions: Transaction[];
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

const NAV_ITEMS = [
  { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { name: "Transactions", view: "transactions", icon: ArrowLeftRight },
  { name: "Transaction Analysis", view: "analysis", icon: Search },
  { name: "Alerts", view: "alerts", icon: Bell },
  { name: "Analytics", view: "analytics", icon: BarChart3 },
];

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);

const toAmount = (amount: string | number): number => {
  if (typeof amount === "number") return Number.isFinite(amount) ? amount : 0;

  const parsed = Number(amount.replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const normaliseRisk = (risk: string) => risk.toUpperCase();

export default function Analytics({
  onBackToLanding,
  onNavigate,
}: AnalyticsProps) {
  const [activeNav, setActiveNav] = useState("Analytics");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!API_BASE_URL) {
      setError("VITE_API_BASE_URL is not configured.");
      setData(null);
      return;
    }

    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts?limit=500`);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result: AnalyticsResponse = await response.json();

      if (
        !result ||
        !result.kpis ||
        !Array.isArray(result.transactions) ||
        !result.risk_distribution
      ) {
        throw new Error("The backend returned an unexpected response.");
      }

      setData(result);
    } catch (err) {
      console.error("Analytics API error:", err);
      setError(
        err instanceof Error
          ? `Unable to load analytics data: ${err.message}`
          : "Unable to load analytics data."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const handleNavClick = (name: string, view: string) => {
    setActiveNav(name);
    onNavigate?.(view);
  };

  const transactions = data?.transactions ?? [];
  const totalTx = data?.kpis.transactions_monitored ?? transactions.length;
  const highRiskCount = data?.risk_distribution.high ?? 0;
  const mediumRiskCount = data?.risk_distribution.medium ?? 0;
  const lowRiskCount = data?.risk_distribution.low ?? 0;
  const riskTotal = lowRiskCount + mediumRiskCount + highRiskCount;

  const highRiskRate =
    totalTx > 0 ? ((highRiskCount / totalTx) * 100).toFixed(2) : "0.00";

  const numericAmounts = useMemo(
    () => transactions.map((transaction) => toAmount(transaction.amount)),
    [transactions]
  );

  const totalAmount = numericAmounts.reduce((sum, amount) => sum + amount, 0);
  const averageAmount =
    numericAmounts.length > 0 ? totalAmount / numericAmounts.length : 0;

  const flaggedAmount = transactions.reduce((sum, transaction) => {
    const risk = normaliseRisk(transaction.riskLevel);
    return risk === "HIGH" || risk === "MEDIUM"
      ? sum + toAmount(transaction.amount)
      : sum;
  }, 0);

  const transactionTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      CASH_IN: 0,
      CASH_OUT: 0,
      DEBIT: 0,
      PAYMENT: 0,
      TRANSFER: 0,
    };

    transactions.forEach((transaction) => {
      const type = transaction.type?.toUpperCase();
      if (type) counts[type] = (counts[type] ?? 0) + 1;
    });

    return counts;
  }, [transactions]);

  const txTypes = [
    { label: "CASH_IN", value: transactionTypeCounts.CASH_IN },
    { label: "CASH_OUT", value: transactionTypeCounts.CASH_OUT },
    { label: "DEBIT", value: transactionTypeCounts.DEBIT },
    { label: "PAYMENT", value: transactionTypeCounts.PAYMENT },
    { label: "TRANSFER", value: transactionTypeCounts.TRANSFER },
  ];

  const maxTxType = Math.max(...txTypes.map((item) => item.value), 1);

  const amountBuckets = useMemo(() => {
    const buckets = [
      { range: "0–10K", min: 0, max: 10000, count: 0 },
      { range: "10–50K", min: 10000, max: 50000, count: 0 },
      { range: "50–100K", min: 50000, max: 100000, count: 0 },
      { range: "100–500K", min: 100000, max: 500000, count: 0 },
      { range: "500K–1M", min: 500000, max: 1000000, count: 0 },
      { range: "1M+", min: 1000000, max: Infinity, count: 0 },
    ];

    numericAmounts.forEach((amount) => {
      const bucket = buckets.find(
        (item) => amount >= item.min && amount < item.max
      );
      if (bucket) bucket.count += 1;
    });

    return buckets;
  }, [numericAmounts]);

  const maxAmountBucket = Math.max(
    ...amountBuckets.map((bucket) => bucket.count),
    1
  );

  const sampleRiskSequence = useMemo(() => {
    const chunkCount = 8;
    const result = Array.from({ length: chunkCount }, (_, index) => ({
      label: `Group ${index + 1}`,
      count: 0,
    }));

    transactions.forEach((transaction, index) => {
      const risk = normaliseRisk(transaction.riskLevel);
      if (risk === "HIGH" || risk === "MEDIUM") {
        const groupIndex = Math.min(
          Math.floor((index / Math.max(transactions.length, 1)) * chunkCount),
          chunkCount - 1
        );
        result[groupIndex].count += 1;
      }
    });

    return result;
  }, [transactions]);

  const maxSampleRisk = Math.max(
    ...sampleRiskSequence.map((item) => item.count),
    1
  );

  const lowDeg = riskTotal > 0 ? (lowRiskCount / riskTotal) * 360 : 0;
  const mediumDeg =
    riskTotal > 0 ? (mediumRiskCount / riskTotal) * 360 : 0;
  const mediumEnd = lowDeg + mediumDeg;

  const sampleChartWidth = 700;
  const sampleChartHeight = 200;
  const samplePoints = sampleRiskSequence.map((item, index) => ({
    x: (index / (sampleRiskSequence.length - 1)) * sampleChartWidth,
    y:
      sampleChartHeight -
      (item.count / maxSampleRisk) * (sampleChartHeight - 30),
  }));

  const sampleLinePath = samplePoints
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = samplePoints[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `Q ${controlX} ${previous.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  return (
    <div
      className="relative flex h-screen overflow-hidden bg-[#061F22] text-[#F5F2EB]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Sidebar */}
      <aside
        className={`absolute inset-y-0 left-0 z-30 flex h-full w-64 shrink-0 flex-col justify-between border-r border-[#2A4845]/50 bg-[#061F22]/95 backdrop-blur-xl transition-transform duration-300 lg:relative ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-[#2A4845]/40 p-6">
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex cursor-pointer flex-col overflow-hidden text-left"
              title="Return to Landing Page"
              disabled={!onBackToLanding}
            >
              <span
                className="block whitespace-nowrap text-2xl font-bold leading-none tracking-wider text-[#F5F2EB]"
                style={{ fontFamily: "VeryVogue, sans-serif" }}
              >
                {isSidebarOpen ? "InsightFlow" : "IF"}
              </span>
              {isSidebarOpen && (
                <span className="mt-1 whitespace-nowrap font-mono text-[10px] tracking-wider text-[#F5F2EB]/60">
                  FRAUD DETECTION
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="shrink-0 cursor-pointer rounded-xl border border-[#2A4845]/50 bg-[#2A4845]/30 p-1.5 text-[#F5F2EB] hover:bg-[#2A4845]/50 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 p-4" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.name, item.view)}
                  title={item.name}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-all ${
                    isActive
                      ? "border-[#2A4845] bg-[#2A4845]/50 text-[#F5F2EB] shadow-lg shadow-[#061F22]/50"
                      : "border-transparent text-[#F5F2EB]/70 hover:bg-[#2A4845]/20 hover:text-[#F5F2EB]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#F5F2EB]" />
                  {isSidebarOpen && (
                    <span className="whitespace-nowrap">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#2A4845]/40 p-4">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3.5 py-2.5 text-sm text-[#F5F2EB]/70 transition-colors hover:border-[#2A4845]/50 hover:bg-[#2A4845]/30 hover:text-[#F5F2EB]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              {isSidebarOpen && (
                <span className="whitespace-nowrap">Back to Home</span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-[#061F22]">
        <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-[#2A4845]/40 bg-[#061F22]/90 px-6 shadow-lg backdrop-blur-xl lg:px-8">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((open) => !open)}
            className="cursor-pointer rounded-2xl border border-[#2A4845]/60 bg-[#061F22]/40 p-2.5 text-[#F5F2EB] shadow-lg transition-all hover:border-[#F5F2EB]/40"
            title="Toggle Sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => void fetchAnalytics()}
              disabled={isRefreshing}
              title="Refresh Data"
              aria-label="Refresh analytics"
              className="cursor-pointer rounded-2xl border border-[#2A4845]/60 bg-[#061F22]/40 p-2.5 text-[#F5F2EB] shadow-lg transition-all hover:border-[#F5F2EB]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-medium text-emerald-400 shadow-lg sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {error ? "Connection issue" : data ? "System Operational" : "Connecting"}
            </div>

            <div className="flex items-center gap-3 border-l border-[#2A4845]/60 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#F5F2EB]/30 bg-[#2A4845]/40 text-sm font-bold text-[#F5F2EB] shadow-lg">
                IN
              </div>
              <span className="hidden text-sm font-medium text-[#F5F2EB] sm:inline">
                Investigator
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[100rem] space-y-8 bg-transparent p-6 lg:p-8">
          {/* Page heading */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F2EB] md:text-3xl">
              Analytics
            </h1>
            <p className="mt-1 text-sm text-[#F5F2EB]/70">
              Aggregated fraud activity across the monitored transaction stream.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void fetchAnalytics()}
                className="w-fit cursor-pointer rounded-lg border border-red-400/30 px-3 py-1.5 text-xs hover:bg-red-500/10"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading */}
          {!data && !error && (
            <div className="rounded-2xl border border-[#2A4845]/60 bg-[#061F22]/40 p-8 text-center text-sm text-[#F5F2EB]/60">
              <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin" />
              Loading analytics from backend...
            </div>
          )}

          {/* Metrics */}
          <section className="space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-[#F5F2EB]/60">
              Key Metrics
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Transactions Monitored"
                value={String(totalTx)}
                note="Transactions reported by the API"
              />
              <MetricCard
                label="High-Risk Transactions"
                value={String(highRiskCount)}
                note="Classified as high risk by the model"
              />
              <MetricCard
                label="High-Risk Rate"
                value={`${highRiskRate}%`}
                note="High-risk count / monitored transactions"
                valueClass="text-red-400"
              />
              <MetricCard
                label="Medium + High-Risk Amount"
                value={`₹${formatINR(flaggedAmount)}`}
                note="Amount for medium- and high-risk sample records"
              />
              <MetricCard
                label="Average Transaction Amount"
                value={`₹${formatINR(averageAmount)}`}
                note="Mean amount in the returned API sample"
              />
              <MetricCard
                label="Escalated Cases"
                value={String(data?.kpis.escalated_cases ?? 0)}
                note="Escalations reported by the API"
              />
            </div>
          </section>

          {/* Sample risk activity */}
          <section className="space-y-6 rounded-3xl border border-[#2A4845]/60 bg-[#061F22]/40 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-[#F5F2EB]">
                  Risk Activity in Returned Sample
                </h2>
                <p className="mt-1 text-xs text-[#F5F2EB]/50">
                  Medium- and high-risk records grouped by their order in the API response
                </p>
              </div>
              <span className="font-mono text-xs text-[#F5F2EB]/50">
                {transactions.length} records
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#F5F2EB]/50">
                No transaction records available to chart.
              </div>
            ) : (
              <>
                <div className="relative h-56 border-b border-l border-[#2A4845]/60">
                  <svg
                    className="absolute inset-0 h-full w-full overflow-visible p-4"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${sampleChartWidth} ${sampleChartHeight}`}
                    role="img"
                    aria-label="Medium- and high-risk transaction counts grouped by response order"
                  >
                    {[40, 80, 120, 160].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2={sampleChartWidth}
                        y2={y}
                        stroke="#2A4845"
                        strokeWidth="1"
                        opacity="0.45"
                      />
                    ))}
                    <path
                      d={sampleLinePath}
                      fill="none"
                      stroke="#E6DFD5"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {samplePoints.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#E6DFD5"
                      />
                    ))}
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                    {sampleRiskSequence.map((item) => (
                      <span
                        key={item.label}
                        className="text-[9px] text-[#F5F2EB]/50 sm:text-[10px]"
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#F5F2EB]/40">
                  This is not a time-based chart; timestamps are not included in the current API response.
                </p>
              </>
            )}
          </section>

          {/* Distribution charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Risk distribution */}
            <section className="space-y-6 rounded-3xl border border-[#2A4845]/60 bg-[#061F22]/40 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-[#F5F2EB]">
                  Risk Distribution
                </h2>
                <span className="font-mono text-xs text-[#F5F2EB]/50">
                  Live model scoring
                </span>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        riskTotal > 0
                          ? `conic-gradient(
                              #E6DFD5 0deg ${lowDeg}deg,
                              #F59E0B ${lowDeg}deg ${mediumEnd}deg,
                              #EF4444 ${mediumEnd}deg 360deg
                            )`
                          : "#2A4845",
                      maskImage:
                        "radial-gradient(transparent 60%, black 61%)",
                      WebkitMaskImage:
                        "radial-gradient(transparent 60%, black 61%)",
                    }}
                  />
                  <div className="z-10 text-center">
                    <span className="font-mono text-2xl font-extrabold text-[#F5F2EB]">
                      {riskTotal}
                    </span>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[#F5F2EB]/60">
                      Records
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 font-mono text-xs">
                <RiskLegend color="bg-[#E6DFD5]" label="LOW" count={lowRiskCount} />
                <RiskLegend color="bg-[#F59E0B]" label="MEDIUM" count={mediumRiskCount} />
                <RiskLegend color="bg-[#EF4444]" label="HIGH" count={highRiskCount} />
              </div>
            </section>

            {/* Transaction types */}
            <section className="space-y-6 rounded-3xl border border-[#2A4845]/60 bg-[#061F22]/40 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-[#F5F2EB]">
                  Transactions by Type
                </h2>
                <span className="font-mono text-xs text-[#F5F2EB]/50">
                  API sample
                </span>
              </div>

              <div className="flex h-48 items-end justify-between gap-3 border-b border-l border-[#2A4845]/60 px-2 pt-6 sm:px-4">
                {txTypes.map((bar) => (
                  <div
                    key={bar.label}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="font-mono text-[10px] text-[#F5F2EB]/60">
                      {bar.value}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-[#E6DFD5] transition-all duration-500"
                      style={{
                        height: `${
                          bar.value > 0
                            ? Math.max((bar.value / maxTxType) * 75, 5)
                            : 0
                        }%`,
                      }}
                      title={`${bar.label}: ${bar.value}`}
                    />
                    <span className="whitespace-nowrap font-mono text-[8px] text-[#F5F2EB]/70 sm:text-[9px]">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Amount distribution */}
          <section className="space-y-6 rounded-3xl border border-[#2A4845]/60 bg-[#061F22]/40 p-6 shadow-2xl backdrop-blur-xl lg:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#F5F2EB]">
                Transaction Amount Distribution
              </h2>
              <span className="font-mono text-xs text-[#F5F2EB]/50">
                API sample
              </span>
            </div>

            <div className="flex h-52 items-end justify-between gap-2 border-b border-l border-[#2A4845]/60 px-2 pt-6 sm:gap-4 sm:px-4">
              {amountBuckets.map((item) => (
                <div
                  key={item.range}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="font-mono text-[10px] text-[#F5F2EB]/60">
                    {item.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-[#E6DFD5] transition-all duration-500"
                    style={{
                      height: `${
                        item.count > 0
                          ? Math.max((item.count / maxAmountBucket) * 75, 5)
                          : 0
                      }%`,
                    }}
                    title={`${item.range}: ${item.count}`}
                  />
                  <span className="whitespace-nowrap font-mono text-[8px] text-[#F5F2EB]/70 sm:text-[10px]">
                    {item.range}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Sample summary */}
          <p className="text-xs text-[#F5F2EB]/40">
            Analytics are calculated from the records returned by the backend
            endpoint. They may represent a limited API sample rather than the
            complete transaction dataset.
          </p>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  valueClass = "text-[#F5F2EB]",
}: {
  label: string;
  value: string;
  note: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-[#2A4845]/60 bg-[#061F22]/40 p-6 shadow-2xl backdrop-blur-xl">
      <span className="block font-mono text-[10px] uppercase text-[#F5F2EB]/60">
        {label}
      </span>
      <div className="mt-3">
        <h3 className={`break-words font-mono text-2xl font-bold ${valueClass}`}>
          {value}
        </h3>
        <p className="mt-1 font-mono text-[10px] text-[#F5F2EB]/50">{note}</p>
      </div>
    </div>
  );
}

function RiskLegend({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[#F5F2EB]/80">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label} {count}
    </div>
  );
}

