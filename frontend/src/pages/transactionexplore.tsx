
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Search,
  Bell,
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  txId: string;
  type: string;
  amount: string;
  rawAmount: number;
  origBal: string;
  newOrigBal: string;
  destBal: string;
  newDestBal: string;
  prob: string;
  risk: string;
  status: string;
}

interface ApiTransaction {
  id?: string;
  txId?: string;
  type?: string;
  amount?: string | number;
  rawAmount?: number;
  oldOrgBal?: string | number;
  newOrgBal?: string | number;
  newbalanceOrig?: string | number;
  oldDestBal?: string | number;
  newDestBal?: string | number;
  newbalanceDest?: string | number;
  riskScore?: number | string;
  fraud_probability?: number;
  riskLevel?: string;
  risk_level?: string;
  status?: string;
}

interface TransactionsProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

const formatCurrency = (value: string | number | undefined) => {
  const numericValue = Number(String(value ?? 0).replace(/[₹,]/g, ''));
  if (!Number.isFinite(numericValue)) return '₹0';
  return `₹${numericValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatProbability = (value: number | string | undefined) => {
  const numericValue = Number(value ?? 0);
  if (!Number.isFinite(numericValue)) return '0.0%';
  // Backend may return a probability from 0 to 1 or a percentage from 0 to 100.
  const percentage = numericValue <= 1 ? numericValue * 100 : numericValue;
  return `${percentage.toFixed(1)}%`;
};

export default function Transactions({ onBackToLanding, onNavigate }: TransactionsProps) {
  const [activeNav, setActiveNav] = useState('Transactions');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All types');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All risk levels');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const fetchTransactions = useCallback(async () => {
    if (!API_BASE_URL) {
      setError('VITE_API_BASE_URL is not configured. Check your frontend environment variables.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts?limit=500`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Unable to fetch transactions (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { transactions?: ApiTransaction[] };
      const alerts = Array.isArray(data.transactions) ? data.transactions : [];

      const mapped: Transaction[] = alerts.map((tx, index) => {
        const txId = String(tx.txId ?? tx.id ?? `UNKNOWN-${index + 1}`);
        const rawAmount = Number(tx.rawAmount ?? tx.amount ?? 0);
        const amountValue = Number.isFinite(rawAmount) ? rawAmount : 0;
        const probability = tx.fraud_probability ?? tx.riskScore ?? 0;
        const risk = String(tx.riskLevel ?? tx.risk_level ?? 'LOW').toUpperCase();

        return {
          id: txId.startsWith('ALT-')
            ? txId
            : `ALT-${txId.replace(/[^a-zA-Z0-9]/g, '').slice(-6) || index + 1}`,
          txId,
          type: String(tx.type ?? 'TRANSFER').toUpperCase(),
          amount: formatCurrency(amountValue),
          rawAmount: amountValue,
          origBal: formatCurrency(tx.oldOrgBal ?? 0),
          newOrigBal: formatCurrency(tx.newOrgBal ?? tx.newbalanceOrig ?? 0),
          destBal: formatCurrency(tx.oldDestBal ?? 0),
          newDestBal: formatCurrency(tx.newDestBal ?? tx.newbalanceDest ?? 0),
          prob: formatProbability(probability),
          risk,
          status: String(tx.status ?? 'NEW').toUpperCase()
        };
      });

      setTransactionsList(mapped);
    } catch (err: unknown) {
      console.error('Failed to fetch transactions:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactionsList.filter(row => {
      const matchesSearch =
        row.id.toLowerCase().includes(query) ||
        row.txId.toLowerCase().includes(query) ||
        row.type.toLowerCase().includes(query) ||
        row.amount.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query);

      const matchesType =
        selectedTypeFilter === 'All types' ||
        row.type === selectedTypeFilter.toUpperCase();

      const matchesRisk =
        selectedRiskFilter === 'All risk levels' ||
        row.risk === selectedRiskFilter.toUpperCase();

      return matchesSearch && matchesType && matchesRisk;
    });
  }, [transactionsList, searchQuery, selectedTypeFilter, selectedRiskFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleNavClick = (name: string) => {
    setActiveNav(name);

    const routes: Record<string, string> = {
      Dashboard: 'dashboard',
      Transactions: 'transactions',
      'Transaction Analysis': 'analysis',
      Alerts: 'alerts',
      Analytics: 'analytics'
    };

    const view = routes[name];
    if (view) onNavigate?.(view);
  };

  return (
    <div className="h-screen bg-[#061F22] text-[#C8D7CD] flex overflow-hidden relative" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <aside className={`absolute lg:relative z-30 inset-y-0 left-0 w-64 bg-[#061F22]/80 backdrop-blur-xl border-r border-[#2A4845]/50 flex flex-col justify-between shrink-0 h-full transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div>
          <div className="p-6 border-b border-[#2A4845]/40 flex items-center justify-between gap-3">
            <div onClick={onBackToLanding} className="cursor-pointer flex flex-col overflow-hidden" title="Return to Landing Page">
              <span className="font-bold tracking-wider text-2xl text-[#C8D7CD] block leading-none whitespace-nowrap" style={{ fontFamily: 'VeryVogue, sans-serif' }}>
                {isSidebarOpen ? 'InsightFlow' : ''}
              </span>
              {isSidebarOpen && <span className="text-[10px] text-[#C8D7CD]/60 font-mono tracking-wider mt-1 whitespace-nowrap">FRAUD DETECTION</span>}
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/50 text-[#C8D7CD] hover:bg-[#2A4845]/50 transition-colors lg:hidden shrink-0 cursor-pointer" aria-label="Close sidebar">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Transactions', icon: ArrowLeftRight },
              { name: 'Transaction Analysis', icon: Search },
              { name: 'Alerts', icon: Bell },
              { name: 'Analytics', icon: BarChart3 }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button key={item.name} onClick={() => handleNavClick(item.name)} title={item.name} className={`w-full flex items-center px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive ? 'bg-[#2A4845]/50 text-[#C8D7CD] border border-[#2A4845] shadow-lg shadow-[#061F22]/50' : 'text-[#C8D7CD]/70 hover:bg-[#2A4845]/20 hover:text-[#C8D7CD] border border-transparent'}`}>
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#C8D7CD] shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#2A4845]/40 space-y-2">
          {onBackToLanding && (
            <button onClick={onBackToLanding} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#C8D7CD]/70 hover:bg-[#2A4845]/30 hover:text-[#C8D7CD] transition-colors border border-transparent hover:border-[#2A4845]/50 cursor-pointer">
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span className="whitespace-nowrap">Back to Home</span>}
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#061F22]">
        <header className="h-20 bg-[#061F22]/70 backdrop-blur-xl border-b border-[#2A4845]/40 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-2xl bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845]/60 text-[#C8D7CD] hover:border-[#C8D7CD]/40 transition-all shadow-lg cursor-pointer" title="Toggle Sidebar" aria-label="Toggle sidebar">
              <Menu className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-3 border-l border-[#2A4845]/60">
              <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/40 backdrop-blur-md border border-[#C8D7CD]/30 flex items-center justify-center font-bold text-sm text-[#C8D7CD] shadow-lg">IN</div>
              <span className="text-sm font-medium text-[#C8D7CD] hidden sm:inline">Investigator</span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-[100rem] w-full mx-auto space-y-8 bg-transparent">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#C8D7CD] tracking-tight">Transaction Explorer</h1>
              <p className="text-sm text-[#C8D7CD]/70 mt-1">Browse and search the live scored transaction dataset.</p>
            </div>
            <button onClick={() => void fetchTransactions()} disabled={loading} className="px-4 py-2.5 rounded-xl border border-[#2A4845] text-xs font-mono text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#C8D7CD]/40" />
                <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search ID, type, amount, status..." className="w-full bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#C8D7CD] placeholder-[#C8D7CD]/40 focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono" />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                <select value={selectedTypeFilter} onChange={e => { setSelectedTypeFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono">
                  <option value="All types" className="bg-[#061F22]">All types</option>
                  <option value="TRANSFER" className="bg-[#061F22]">TRANSFER</option>
                  <option value="PAYMENT" className="bg-[#061F22]">PAYMENT</option>
                  <option value="DEBIT" className="bg-[#061F22]">DEBIT</option>
                  <option value="CASH_OUT" className="bg-[#061F22]">CASH_OUT</option>
                  <option value="CASH_IN" className="bg-[#061F22]">CASH_IN</option>
                </select>
                <select value={selectedRiskFilter} onChange={e => { setSelectedRiskFilter(e.target.value); setCurrentPage(1); }} className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono">
                  <option value="All risk levels" className="bg-[#061F22]">All risk levels</option>
                  <option value="LOW" className="bg-[#061F22]">LOW</option>
                  <option value="MEDIUM" className="bg-[#061F22]">MEDIUM</option>
                  <option value="HIGH" className="bg-[#061F22]">HIGH</option>
                </select>
                <span className="text-xs font-mono text-[#C8D7CD]/50 ml-2">{filteredTransactions.length} results</span>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-red-300 font-mono">{error}</p>
                  <button onClick={() => void fetchTransactions()} className="text-xs text-[#C8D7CD] underline mt-2 cursor-pointer">Try again</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#2A4845]/50 text-xs font-mono text-[#C8D7CD]/50">
                    <th className="py-3 px-4">TRANSACTION ID</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">ORIGIN BALANCE</th>
                    <th className="py-3 px-4">NEW ORIGIN BALANCE</th>
                    <th className="py-3 px-4">DESTINATION BALANCE</th>
                    <th className="py-3 px-4">NEW DESTINATION BALANCE</th>
                    <th className="py-3 px-4">FRAUD PROBABILITY</th>
                    <th className="py-3 px-4">RISK</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A4845]/30 text-sm font-mono">
                  {loading ? (
                    <tr><td colSpan={10} className="py-12 text-center text-[#C8D7CD]/50 text-xs font-mono">Loading transactions...</td></tr>
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map(row => (
                      <tr key={row.txId} className="hover:bg-[#2A4845]/20 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#C8D7CD]">{row.txId}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.type}</td>
                        <td className="py-4 px-4 font-semibold text-[#C8D7CD]">{row.amount}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.origBal}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.newOrigBal}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.destBal}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.newDestBal}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/90">{row.prob}</td>
                        <td className="py-4 px-4">
                          <span className={`text-xs font-semibold ${row.risk === 'HIGH' ? 'text-red-400' : row.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{row.risk}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button onClick={() => setSelectedTransaction(row)} className="px-3 py-1.5 rounded-2xl border border-[#2A4845] text-xs text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer">
                            <Eye className="w-3.5 h-3.5" /> Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={10} className="py-12 text-center text-[#C8D7CD]/50 text-xs font-mono">{error ? 'Unable to display transactions.' : 'No transactions match your search parameters.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#2A4845]/40 font-mono text-xs">
              <span className="text-[#C8D7CD]/60">
                Showing {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length} records
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/40 bg-[#061F22]/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" aria-label="Previous page">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-[#2A4845] text-[#C8D7CD] font-bold border border-[#C8D7CD]/40">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/40 bg-[#061F22]/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" aria-label="Next page">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedTransaction(null)}>
          <div className="bg-[#061F22]/90 backdrop-blur-2xl border border-[#2A4845] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#2A4845]/60 pb-3 gap-3">
              <h3 className="text-lg font-bold text-[#C8D7CD]">Transaction Record</h3>
              <button onClick={() => setSelectedTransaction(null)} className="text-[#C8D7CD]/60 hover:text-[#C8D7CD] text-lg font-bold cursor-pointer" aria-label="Close details"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs font-mono text-[#C8D7CD]/60 break-all">{selectedTransaction.txId}</p>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Type & Amount</span>
                <span className="font-bold text-[#C8D7CD] text-right">{selectedTransaction.type} · {selectedTransaction.amount}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Origin Balance (Old / New)</span>
                <span className="text-[#C8D7CD] text-right">{selectedTransaction.origBal} → {selectedTransaction.newOrigBal}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Destination Balance (Old / New)</span>
                <span className="text-[#C8D7CD] text-right">{selectedTransaction.destBal} → {selectedTransaction.newDestBal}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Fraud Probability</span>
                <span className="text-[#C8D7CD] font-bold text-right">{selectedTransaction.prob}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Risk Level</span>
                <span className={`font-bold ${selectedTransaction.risk === 'HIGH' ? 'text-red-400' : selectedTransaction.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{selectedTransaction.risk}</span>
              </div>
              <div className="flex justify-between gap-4 p-3 rounded-2xl bg-[#2A4845]/20 border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Status</span>
                <span className="text-[#C8D7CD]">{selectedTransaction.status}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
