import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Search,
  Bell,
  BarChart3,
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
  flow: string;
  amount: string;
  type: string;
  riskScore: string;
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

export default function Analytics({
  onBackToLanding,
  onNavigate,
}: AnalyticsProps) {
  const [activeNav, setActiveNav] = useState("Analytics");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/alerts?limit=500"
      );

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const result: AnalyticsResponse = await response.json();

      setData(result);
    } catch (err) {
      console.error("Analytics API error:", err);

      setError(
        "Unable to load analytics data."
      );
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);


  const handleNavClick = (name: string) => {
    setActiveNav(name);

    if (onNavigate) {
      onNavigate(name);
    }
  };

  const transactions = data?.transactions ?? [];

  const totalTx = data?.kpis.transactions_monitored ?? 0;

  const fraudTx = data?.kpis.high_risk_alerts ?? 0;

  const lowRisk = data?.risk_distribution.low ?? 0;

  const mediumRisk = data?.risk_distribution.medium ?? 0;

  const highRisk = data?.risk_distribution.high ?? 0;

  const fraudRate =
    totalTx > 0 ? ((fraudTx / totalTx) * 100).toFixed(2) : "0.00";

  const numericAmounts = transactions.map((transaction) => {
    const cleaned = transaction.amount
      .replace("₹", "")
      .replace(/,/g, "");

    return Number(cleaned) || 0;
  });

  const totalAmount = numericAmounts.reduce(
    (sum, amount) => sum + amount,
    0
  );

  const averageAmount =
    numericAmounts.length > 0
      ? totalAmount / numericAmounts.length
      : 0;

  const formatCrores = (amount: number) => {
    return (amount / 10000000).toFixed(2);
  };

  const formatLakhs = (amount: number) => {
    return (amount / 100000).toFixed(2);
  };

  const transactionTypeCounts: Record<string, number> = {};

  transactions.forEach((transaction) => {
    const type = transaction.type;

    transactionTypeCounts[type] =
      (transactionTypeCounts[type] || 0) + 1;
  });

  const txTypes = {
    CASH_IN: transactionTypeCounts["CASH_IN"] || 0,
    CASH_OUT: transactionTypeCounts["CASH_OUT"] || 0,
    DEBIT: transactionTypeCounts["DEBIT"] || 0,
    PAYMENT: transactionTypeCounts["PAYMENT"] || 0,
    TRANSFER: transactionTypeCounts["TRANSFER"] || 0,
  };

  const maxTxType = Math.max(
    txTypes.CASH_IN,
    txTypes.CASH_OUT,
    txTypes.DEBIT,
    txTypes.PAYMENT,
    txTypes.TRANSFER,
    1
  );

  const amountBuckets = [
    { range: "0–10K", min: 0, max: 10000, count: 0 },
    { range: "10–50K", min: 10000, max: 50000, count: 0 },
    { range: "50–100K", min: 50000, max: 100000, count: 0 },
    { range: "100–500K", min: 100000, max: 500000, count: 0 },
    { range: "500K–1M", min: 500000, max: 1000000, count: 0 },
    { range: "1M+", min: 1000000, max: Infinity, count: 0 },
  ];

  numericAmounts.forEach((amount) => {
    const bucket = amountBuckets.find(
      (item) => amount >= item.min && amount < item.max
    );

    if (bucket) {
      bucket.count += 1;
    }
  });

  const maxAmountBucket = Math.max(
    ...amountBuckets.map((bucket) => bucket.count),
    1
  );

  const timeBuckets = [
    { label: "00h", count: 0 },
    { label: "03h", count: 0 },
    { label: "06h", count: 0 },
    { label: "09h", count: 0 },
    { label: "12h", count: 0 },
    { label: "15h", count: 0 },
    { label: "18h", count: 0 },
    { label: "21h", count: 0 },
  ];

  transactions.forEach((transaction, index) => {
    const bucketIndex = index % timeBuckets.length;

    if (
      transaction.riskLevel === "HIGH" ||
      transaction.riskLevel === "MEDIUM"
    ) {
      timeBuckets[bucketIndex].count += 1;
    }
  });

  const maxTimeValue = Math.max(
    ...timeBuckets.map((bucket) => bucket.count),
    1
  );

  const chartWidth = 700;
  const chartHeight = 200;

  const chartPoints = timeBuckets.map((bucket, index) => {
    const x =
      (index / (timeBuckets.length - 1)) * chartWidth;

    const y =
      chartHeight -
      (bucket.count / maxTimeValue) *
        (chartHeight - 30);

    return {
      x,
      y,
    };
  });

  const linePath = chartPoints
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = chartPoints[index - 1];

      const controlX =
        (previous.x + point.x) / 2;

      return `Q ${controlX} ${previous.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  const riskTotal =
    lowRisk + mediumRisk + highRisk;

  const lowDeg =
    riskTotal > 0
      ? (lowRisk / riskTotal) * 360
      : 0;

  const mediumDeg =
    riskTotal > 0
      ? (mediumRisk / riskTotal) * 360
      : 0;

  const mediumEnd = lowDeg + mediumDeg;

  return (
    <div
      className="h-screen bg-[#061F22] text-[#F5F2EB] flex overflow-hidden relative"
      style={{
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <aside
        className={`absolute lg:relative z-30 inset-y-0 left-0 w-64 bg-[#061F22]/80 backdrop-blur-xl border-r border-[#2A4845]/50 flex flex-col justify-between shrink-0 h-full transition-transform duration-300 ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        <div>

          <div className="p-6 border-b border-[#2A4845]/40 flex items-center justify-between gap-3">
            <div
              onClick={onBackToLanding}
              className="cursor-pointer flex flex-col overflow-hidden"
              title="Return to Landing Page"
            >
              <span
                className="font-bold tracking-wider text-2xl text-[#F5F2EB] block leading-none whitespace-nowrap"
                style={{
                  fontFamily: "VeryVogue, sans-serif",
                }}
              >
                {isSidebarOpen
                  ? "InsightFlow"
                  : "  "}
              </span>

              {isSidebarOpen && (
                <span className="text-[10px] text-[#F5F2EB]/60 font-mono tracking-wider mt-1 whitespace-nowrap">
                  FRAUD DETECTION
                </span>
              )}
            </div>

            <button
              onClick={() =>
                setIsSidebarOpen(!isSidebarOpen)
              }
              className="p-1.5 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/50 text-[#F5F2EB] hover:bg-[#2A4845]/50 transition-colors lg:hidden shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>


          <div className="p-4 space-y-1">
            {[
              {
                name: "Dashboard",
                icon: LayoutDashboard,
              },
              {
                name: "Transactions",
                icon: ArrowLeftRight,
                badge: null,
              },
              {
                name: "Transaction Analysis",
                icon: Search,
              },
              {
                name: "Alerts",
                icon: Bell,
              },
              {
                name: "Analytics",
                icon: BarChart3,
              },
            ].map((item) => {
              const Icon = item.icon;

              const isActive =
                activeNav === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() =>
                    handleNavClick(item.name)
                  }
                  title={item.name}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#2A4845]/50 text-[#F5F2EB] border border-[#2A4845] shadow-lg shadow-[#061F22]/50"
                      : "text-[#F5F2EB]/70 hover:bg-[#2A4845]/20 hover:text-[#F5F2EB] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#F5F2EB] shrink-0" />

                    {isSidebarOpen && (
                      <span className="whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>


        <div className="p-4 border-t border-[#2A4845]/40 space-y-2">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#F5F2EB]/70 hover:bg-[#2A4845]/30 hover:text-[#F5F2EB] transition-colors border border-transparent hover:border-[#2A4845]/50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />

              {isSidebarOpen && (
                <span className="whitespace-nowrap">
                  Back to Home
                </span>
              )}
            </button>
          )}
        </div>
      </aside>


      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#061F22]">

        <header className="h-20 bg-[#061F22]/70 backdrop-blur-xl border-b border-[#2A4845]/40 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setIsSidebarOpen(!isSidebarOpen)
              }
              className="p-2.5 rounded-2xl bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845]/60 text-[#F5F2EB] hover:border-[#F5F2EB]/40 transition-all shadow-lg cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-3 pl-3 border-l border-[#2A4845]/60">
              <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/40 backdrop-blur-md border border-[#F5F2EB]/30 flex items-center justify-center font-bold text-sm text-[#F5F2EB] shadow-lg">
                IN
              </div>

              <span className="text-sm font-medium text-[#F5F2EB] hidden sm:inline">
                Investigator
              </span>
            </div>
          </div>
        </header>


        <main className="p-6 lg:p-8 max-w-[100rem] w-full mx-auto space-y-8 bg-transparent">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#F5F2EB] tracking-tight">
                Analytics
              </h1>

              <p className="text-sm text-[#F5F2EB]/70 mt-1">
                Aggregated fraud activity across the monitored transaction stream.
              </p>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-mono tracking-widest text-[#F5F2EB]/60 uppercase">
              KEY METRICS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* TOTAL TRANSACTIONS */}

              <div className="p-6 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#F5F2EB]/60 uppercase block">
                  TOTAL TRANSACTIONS
                </span>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold font-mono text-[#F5F2EB]">
                    {totalTx}
                    <span className="text-xs font-normal text-[#F5F2EB]/60">
                      {" "}
                      (API sample)
                    </span>
                  </h3>

                  <p className="text-[10px] font-mono text-[#F5F2EB]/50 mt-1">
                    transactions returned by backend
                  </p>
                </div>
              </div>

              {/* FRAUD TRANSACTIONS */}

              <div className="p-6 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#F5F2EB]/60 uppercase block">
                  HIGH RISK TRANSACTIONS
                </span>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold font-mono text-[#F5F2EB]">
                    {fraudTx}
                  </h3>

                  <p className="text-[10px] font-mono text-[#F5F2EB]/50 mt-1">
                    flagged by fraud model
                  </p>
                </div>
              </div>

              {/* FRAUD RATE */}

              <div className="p-6 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#F5F2EB]/60 uppercase block">
                  FRAUD RATE
                </span>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold font-mono text-red-400">
                    {fraudRate}%
                  </h3>

                  <p className="text-[10px] font-mono text-[#F5F2EB]/50 mt-1">
                    high-risk transactions / monitored
                  </p>
                </div>
              </div>

              {/* TOTAL FLAGGED */}

              <div className="p-6 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#F5F2EB]/60 uppercase block">
                  TOTAL FLAGGED AMOUNT
                </span>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold font-mono text-[#F5F2EB]">
                    ₹{formatCrores(totalAmount)}Cr
                  </h3>

                  <p className="text-[10px] font-mono text-[#F5F2EB]/50 mt-1">
                    sum of current API sample
                  </p>
                </div>
              </div>

              {/* AVERAGE */}

              <div className="p-6 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between">
                <span className="text-[10px] font-mono text-[#F5F2EB]/60 uppercase block">
                  AVERAGE TRANSACTION AMOUNT
                </span>

                <div className="mt-3">
                  <h3 className="text-2xl font-bold font-mono text-[#F5F2EB]">
                    ₹{formatLakhs(averageAmount)}L
                  </h3>

                  <p className="text-[10px] font-mono text-[#F5F2EB]/50 mt-1">
                    mean of current API sample
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F5F2EB]">
                FRAUD ACTIVITY OVER TIME
              </h3>

              <span className="text-xs font-mono text-[#F5F2EB]/50">
                model risk activity
              </span>
            </div>

            <div className="h-64 w-full relative border-b border-l border-[#2A4845]/60">
              <svg
                className="absolute inset-0 w-full h-full p-4 overflow-visible"
                preserveAspectRatio="none"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              >
                {/* GRID */}

                {[40, 80, 120, 160].map(
                  (y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#2A4845"
                      strokeWidth="1"
                      opacity="0.35"
                    />
                  )
                )}

                {/* LINE */}

                <path
                  d={linePath}
                  fill="none"
                  stroke="#E6DFD5"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* POINTS */}

                {chartPoints.map(
                  (point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#E6DFD5"
                    />
                  )
                )}
              </svg>

              {/* TIME LABELS */}

              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                {timeBuckets.map(
                  (bucket) => (
                    <span
                      key={bucket.label}
                      className="text-[10px] font-mono text-[#F5F2EB]/50"
                    >
                      {bucket.label}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RISK DISTRIBUTION */}

            <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F5F2EB]">
                  RISK DISTRIBUTION
                </h3>

                <span className="text-xs font-mono text-[#F5F2EB]/50">
                  live model scoring
                </span>
              </div>

              <div className="flex items-center justify-center py-6">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* DONUT */}

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

                  <div className="text-center z-10">
                    <span className="text-2xl font-extrabold text-[#F5F2EB] font-mono">
                      {riskTotal}
                    </span>

                    <p className="text-[10px] font-mono tracking-widest text-[#F5F2EB]/60 uppercase">
                      ALERTS
                    </p>
                  </div>
                </div>
              </div>

              {/* LEGEND */}

              <div className="flex justify-center gap-6 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E6DFD5]" />
                  LOW {lowRisk}
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  MEDIUM {mediumRisk}
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  HIGH {highRisk}
                </div>
              </div>
            </div>

            {/* TRANSACTIONS BY TYPE */}

            <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#F5F2EB]">
                  TRANSACTIONS BY TYPE
                </h3>

                <span className="text-xs font-mono text-[#F5F2EB]/50">
                  current sample
                </span>
              </div>

              <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-l border-[#2A4845]/60 px-4">
                {[
                  {
                    label: "CASH_IN",
                    val: txTypes.CASH_IN,
                  },
                  {
                    label: "CASH_OUT",
                    val: txTypes.CASH_OUT,
                  },
                  {
                    label: "DEBIT",
                    val: txTypes.DEBIT,
                  },
                  {
                    label: "PAYMENT",
                    val: txTypes.PAYMENT,
                  },
                  {
                    label: "TRANSFER",
                    val: txTypes.TRANSFER,
                  },
                ].map((bar) => (
                  <div
                    key={bar.label}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full bg-[#E6DFD5] rounded-t-lg shadow-[0_0_15px_rgba(230,223,213,0.2)] transition-all duration-500"
                      style={{
                        height: `${Math.max(
                          bar.val > 0
                            ? (bar.val / maxTxType) *
                                100
                            : 0,
                          bar.val > 0 ? 5 : 0
                        )}%`,
                      }}
                      title={`${bar.label}: ${bar.val}`}
                    />

                    <span className="text-[9px] font-mono text-[#F5F2EB]/70 whitespace-nowrap">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F5F2EB]">
                TRANSACTION AMOUNT DISTRIBUTION
              </h3>

              <span className="text-xs font-mono text-[#F5F2EB]/50">
                current API sample
              </span>
            </div>

            <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-l border-[#2A4845]/60 px-4">
              {amountBuckets.map(
                (item) => (
                  <div
                    key={item.range}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <div
                      className="w-full bg-[#E6DFD5] rounded-t-lg shadow-[0_0_15px_rgba(230,223,213,0.2)] transition-all duration-500"
                      style={{
                        height: `${Math.max(
                          item.count > 0
                            ? (item.count /
                                maxAmountBucket) *
                                100
                            : 0,
                          item.count > 0 ? 5 : 0
                        )}%`,
                      }}
                      title={`${item.range}: ${item.count}`}
                    />

                    <span className="text-[10px] font-mono text-[#F5F2EB]/70">
                      {item.range}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}