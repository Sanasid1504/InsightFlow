
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Search,
  Bell,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Menu,
  X,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface AlertsProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: string) => void;
}

interface AlertItem {
  id: string;
  txId: string;
  type: string;
  amount: string;
  rawAmount: number;
  prob: string;
  rawProb: number;
  risk: string;
  status: string;
  step?: string;
  timestamp?: string;
  description?: string;
}

interface ApiTransaction {
  id?: string;
  _id?: string;
  alert_id?: string;
  transaction_id?: string;
  type?: string;
  amount?: string | number;
  rawAmount?: number;
  riskScore?: number;
  risk_score?: number;
  fraud_probability?: number;
  riskLevel?: string;
  risk_level?: string;
  status?: string;
  step?: string | number;
  timestamp?: string;
  created_at?: string;
  description?: string;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const PAGE_SIZE = 10;

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatTimestamp = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const normalizeAlert = (
  tx: ApiTransaction,
  index: number
): AlertItem => {
  const rawId = String(
    tx.id ?? tx._id ?? tx.alert_id ?? tx.transaction_id ?? `TXN-${index + 1}`
  );

  const rawScore = Number(
    tx.riskScore ?? tx.risk_score ?? tx.fraud_probability ?? 0
  );

  const score = rawScore > 1 && rawScore <= 100
    ? rawScore / 100
    : rawScore;

  const riskText = String(
    tx.riskLevel ?? tx.risk_level ?? ""
  ).toUpperCase();

  let risk = "LOW";
  if (riskText.includes("HIGH") || score >= 0.7) {
    risk = "HIGH";
  } else if (
    riskText.includes("MEDIUM") ||
    riskText.includes("MODERATE") ||
    score >= 0.3
  ) {
    risk = "MEDIUM";
  }

  const amount = Number(tx.rawAmount ?? tx.amount ?? 0);
  const probability = Number.isFinite(score)
    ? Math.max(0, Math.min(score, 1))
    : 0;

  return {
    id: rawId.startsWith("ALT-")
      ? rawId
      : `ALT-${rawId.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || index + 1}`,
    txId: String(tx.transaction_id ?? tx.id ?? tx._id ?? rawId),
    type: String(tx.type ?? "UNKNOWN").toUpperCase(),
    amount: formatAmount(amount),
    rawAmount: amount,
    prob: `${(probability * 100).toFixed(1)}%`,
    rawProb: probability,
    risk,
    status: String(tx.status ?? "NEW").toUpperCase(),
    step: tx.step == null ? "—" : String(tx.step),
    timestamp: tx.timestamp ?? tx.created_at,
    description: tx.description,
  };
};

export default function Alerts({
  onBackToLanding,
  onNavigate,
}: AlertsProps) {
  const [activeNav, setActiveNav] = useState("Alerts");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] =
    useState("All risk levels");
  const [selectedTypeFilter, setSelectedTypeFilter] =
    useState("All types");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState("All statuses");
  const [selectedAlert, setSelectedAlert] =
    useState<AlertItem | null>(null);
  const [page, setPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/alerts?limit=500`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: unknown = await response.json();
      let rows: ApiTransaction[] = [];

      if (Array.isArray(data)) {
        rows = data as ApiTransaction[];
      } else if (data && typeof data === "object") {
        const result = data as {
          alerts?: ApiTransaction[];
          transactions?: ApiTransaction[];
          data?: ApiTransaction[] | { alerts?: ApiTransaction[]; transactions?: ApiTransaction[] };
        };

        if (Array.isArray(result.alerts)) {
          rows = result.alerts;
        } else if (Array.isArray(result.transactions)) {
          rows = result.transactions;
        } else if (Array.isArray(result.data)) {
          rows = result.data;
        } else if (result.data && typeof result.data === "object") {
          rows = result.data.alerts ?? result.data.transactions ?? [];
        }
      }

      setAlerts(rows.map(normalizeAlert));
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch alerts from backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const handleNavClick = (name: string) => {
    setActiveNav(name);
    if (!onNavigate) return;

    if (name === "Transactions") onNavigate("transactions");
    else if (name === "Transaction Analysis") onNavigate("analysis");
    else if (name === "Dashboard") onNavigate("dashboard");
    else if (name === "Alerts") onNavigate("alerts");
    else if (name === "Analytics") onNavigate("analytics");
  };

  const handleUpdateStatus = async (alert: AlertItem, status: string) => {
    setUpdatingStatus(true);
    setShowToast(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/investigations/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            alert_id: alert.id,
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.status}`);
      }

      setAlerts((previous) =>
        previous.map((item) =>
          item.id === alert.id ? { ...item, status } : item
        )
      );

      setSelectedAlert((previous) =>
        previous?.id === alert.id
          ? { ...previous, status }
          : previous
      );

      setToastMessage(`Alert status updated to ${status}.`);
      setShowToast(true);
    } catch (err) {
      console.error("Failed to update alert:", err);
      setToastMessage(
        err instanceof Error ? err.message : "Status update failed."
      );
      setShowToast(true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredAlerts = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();

    return alerts.filter((row) => {
      const matchesSearch =
        row.id.toLowerCase().includes(term) ||
        row.txId.toLowerCase().includes(term) ||
        row.type.toLowerCase().includes(term) ||
        row.status.toLowerCase().includes(term);

      const matchesRisk =
        selectedRiskFilter === "All risk levels" ||
        row.risk === selectedRiskFilter;

      const matchesType =
        selectedTypeFilter === "All types" ||
        row.type === selectedTypeFilter;

      const matchesStatus =
        selectedStatusFilter === "All statuses" ||
        row.status === selectedStatusFilter;

      return (
        matchesSearch &&
        matchesRisk &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    alerts,
    searchQuery,
    selectedRiskFilter,
    selectedTypeFilter,
    selectedStatusFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAlerts.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRiskFilter("All risk levels");
    setSelectedTypeFilter("All types");
    setSelectedStatusFilter("All statuses");
    setPage(1);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, badge: null },
    { name: "Transactions", icon: ArrowLeftRight, badge: null },
    { name: "Transaction Analysis", icon: Search, badge: null },
    { name: "Alerts", icon: Bell, badge: null },
    { name: "Analytics", icon: BarChart3, badge: null },
  ];

  return (
    <div
      className="h-screen bg-[#061F22] text-[#C8D7CD] flex overflow-hidden relative"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Sidebar — matching the Dashboard reference */}
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
                className="font-bold tracking-wider text-2xl text-[#C8D7CD] block leading-none whitespace-nowrap"
                style={{ fontFamily: "VeryVogue, sans-serif" }}
              >
                {isSidebarOpen ? "InsightFlow" : " "}
              </span>
              {isSidebarOpen && (
                <span className="text-[10px] text-[#C8D7CD]/60 font-mono tracking-wider mt-1 whitespace-nowrap">
                  FRAUD DETECTION
                </span>
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/50 text-[#C8D7CD] hover:bg-[#2A4845]/50 transition-colors lg:hidden shrink-0 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  title={item.name}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#2A4845]/50 text-[#C8D7CD] border border-[#2A4845] shadow-lg shadow-[#061F22]/50"
                      : "text-[#C8D7CD]/70 hover:bg-[#2A4845]/20 hover:text-[#C8D7CD] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#C8D7CD] shrink-0" />
                    {isSidebarOpen && (
                      <span className="whitespace-nowrap">{item.name}</span>
                    )}
                  </div>
                  {isSidebarOpen && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#2A4845]/40 space-y-2">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#C8D7CD]/70 hover:bg-[#2A4845]/30 hover:text-[#C8D7CD] transition-colors border border-transparent hover:border-[#2A4845]/50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <span className="whitespace-nowrap">Back to Home</span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#061F22]">
        {/* Header — matching the Dashboard reference */}
        <header className="h-20 bg-[#061F22]/70 backdrop-blur-xl border-b border-[#2A4845]/40 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-2xl bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845]/60 text-[#C8D7CD] hover:border-[#C8D7CD]/40 transition-all shadow-lg cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 border-l border-[#2A4845]/60">
              <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/40 backdrop-blur-md border border-[#C8D7CD]/30 flex items-center justify-center font-bold text-sm text-[#C8D7CD] shadow-lg">
                IN
              </div>
              <span className="text-sm font-medium text-[#C8D7CD] hidden sm:inline">
                Investigator
              </span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 bg-transparent">
          {/* Page heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#C8D7CD] tracking-tight">
                Alerts
              </h1>
              <p className="text-sm text-[#C8D7CD]/70 mt-1">
                Review flagged transactions and manage active investigations.
              </p>
            </div>

            <button
              onClick={() => void fetchAlerts()}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl bg-[#2A4845]/40 backdrop-blur-md text-[#C8D7CD] text-xs font-medium hover:bg-[#2A4845]/70 transition-all flex items-center justify-center gap-2 shadow-lg border border-[#2A4845]/60 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh Alerts
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Alert list */}
          <div className="p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">

            {/* Filters — same style as Dashboard table */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#C8D7CD]/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search alert ID, transaction, type..."
                  className="w-full bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#C8D7CD] placeholder-[#C8D7CD]/40 focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedRiskFilter}
                  onChange={(event) => {
                    setSelectedRiskFilter(event.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono"
                >
                  <option value="All risk levels" className="bg-[#061F22] text-[#C8D7CD]">
                    All risk levels
                  </option>
                  <option value="LOW" className="bg-[#061F22] text-[#C8D7CD]">LOW</option>
                  <option value="MEDIUM" className="bg-[#061F22] text-[#C8D7CD]">MEDIUM</option>
                  <option value="HIGH" className="bg-[#061F22] text-[#C8D7CD]">HIGH</option>
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(event) => {
                    setSelectedTypeFilter(event.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono"
                >
                  <option value="All types" className="bg-[#061F22] text-[#C8D7CD]">All types</option>
                  <option value="CASH_IN" className="bg-[#061F22] text-[#C8D7CD]">CASH_IN</option>
                  <option value="CASH_OUT" className="bg-[#061F22] text-[#C8D7CD]">CASH_OUT</option>
                  <option value="DEBIT" className="bg-[#061F22] text-[#C8D7CD]">DEBIT</option>
                  <option value="PAYMENT" className="bg-[#061F22] text-[#C8D7CD]">PAYMENT</option>
                  <option value="TRANSFER" className="bg-[#061F22] text-[#C8D7CD]">TRANSFER</option>
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(event) => {
                    setSelectedStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono"
                >
                  <option value="All statuses" className="bg-[#061F22] text-[#C8D7CD]">All statuses</option>
                  <option value="NEW" className="bg-[#061F22] text-[#C8D7CD]">NEW</option>
                  <option value="INVESTIGATING" className="bg-[#061F22] text-[#C8D7CD]">INVESTIGATING</option>
                  <option value="RESOLVED" className="bg-[#061F22] text-[#C8D7CD]">RESOLVED</option>
                  <option value="CLOSED" className="bg-[#061F22] text-[#C8D7CD]">CLOSED</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="px-2 py-2 text-xs text-[#C8D7CD]/60 hover:text-[#C8D7CD] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                <tr className="border-b border-[#2A4845]/50 text-[10px] font-mono text-[#C8D7CD]/50">                    <th className="py-3 px-4">ALERT ID</th>
                    <th className="py-3 px-4">TRANSACTION ID</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">FRAUD PROBABILITY</th>
                    <th className="py-3 px-4">RISK</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">TIMESTAMP</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#2A4845]/30 text-sm font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#C8D7CD]/50 text-xs font-mono">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Loading alerts...
                      </td>
                    </tr>
                  ) : paginatedAlerts.length > 0 ? (
                    paginatedAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="hover:bg-[#2A4845]/20 transition-colors"
                      >
                        <td className="py-4 px-4 font-bold text-[#C8D7CD]">
                          {alert.id}
                        </td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">
                          {alert.txId}
                        </td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">
                          {alert.type}
                        </td>
                        <td className="py-4 px-4 font-semibold text-[#C8D7CD]">
                          ₹{alert.amount}
                        </td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">
                          {alert.prob}
                        </td>
                        <td className={`py-4 px-4 font-semibold ${
                          alert.risk === "HIGH"
                            ? "text-red-400"
                            : alert.risk === "MEDIUM"
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}>
                          {alert.risk}
                        </td>
                        <td className="py-4 px-4 text-[#C8D7CD]">
                          {alert.status}
                        </td>
                        <td className="py-4 px-4 text-xs text-[#C8D7CD]/60">
                          {formatTimestamp(alert.timestamp)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowToast(false);
                            }}
                            className="px-3.5 py-1.5 rounded-2xl border border-[#2A4845] text-xs text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-[#C8D7CD]/50 text-xs font-mono">
                        {error ? "Unable to load alerts." : "No alerts match the selected filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#2A4845]/40 font-mono text-xs">
              <span className="text-[#C8D7CD]/60">
                Showing{" "}
                {filteredAlerts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(currentPage * PAGE_SIZE, filteredAlerts.length)} of{" "}
                {filteredAlerts.length} records
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                  className="p-2 rounded-xl border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-[#C8D7CD]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  className="p-2 rounded-xl border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Alert details modal — matching Dashboard modal styling */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#061F22]/90 backdrop-blur-2xl border border-[#2A4845] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#2A4845]/60 pb-3">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-[#C8D7CD]/50 uppercase">
                  Alert Investigation
                </p>
                <h3 className="text-lg font-bold text-[#C8D7CD] mt-1">
                  {selectedAlert.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                aria-label="Close details"
                className="text-[#C8D7CD]/60 hover:text-[#C8D7CD] text-lg font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {[
                ["Transaction ID", selectedAlert.txId],
                ["Transaction Type", selectedAlert.type],
                ["Amount", `₹${selectedAlert.amount}`],
                ["Fraud Probability", selectedAlert.prob],
                ["Risk Level", selectedAlert.risk],
                ["Timestamp", formatTimestamp(selectedAlert.timestamp)],
                ["Step", selectedAlert.step ?? "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40"
                >
                  <span className="text-[#C8D7CD]/60">{label}:</span>
                  <span className="font-semibold text-[#C8D7CD] text-right break-all">
                    {value}
                  </span>
                </div>
              ))}

              <div className="p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <label className="block text-[#C8D7CD]/60 mb-2">
                  Investigation Status
                </label>
                <select
                  value={selectedAlert.status}
                  disabled={updatingStatus}
                  onChange={(event) =>
                    void handleUpdateStatus(selectedAlert, event.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#061F22] border border-[#2A4845] text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 cursor-pointer"
                >
                  {["NEW", "INVESTIGATING", "RESOLVED", "CLOSED"].map((status) => (
                    <option key={status} value={status} className="bg-[#061F22]">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAlert.description && (
                <div className="p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                  <p className="text-[#C8D7CD]/60 mb-2">Description</p>
                  <p className="text-[#C8D7CD]">{selectedAlert.description}</p>
                </div>
              )}
            </div>

            {showToast && (
              <div className="p-3 rounded-2xl bg-[#061F22]/90 border border-[#2A4845] flex items-center gap-2 text-xs text-[#C8D7CD]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                {toastMessage}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-5 py-2.5 rounded-2xl bg-[#2A4845] backdrop-blur-md text-[#C8D7CD] text-xs font-medium hover:bg-[#355854] transition-colors border border-[#C8D7CD]/30 shadow-lg cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
