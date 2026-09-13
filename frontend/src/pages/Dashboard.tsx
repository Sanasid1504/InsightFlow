import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Search, 
  Bell, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Eye, 
  Target, 
  Menu,
  X,
  ArrowLeft,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: string) => void;
}

interface TransactionItem {
  id: string;
  txId: string;
  type: string;
  amount: string;
  rawAmount: number;
  prob: string;
  risk: string;
  status: string;
  step?: string;
}

interface DashboardData {
  kpis: {
    total_alerts: number;
    high_risk_alerts: number;
    transactions_monitored: number;
    escalated_cases: number;
  };
  transactions: TransactionItem[];
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export default function Dashboard({ onBackToLanding, onNavigate }: DashboardProps) {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [simStep, setSimStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    kpis: {
      total_alerts: 0,
      high_risk_alerts: 0,
      transactions_monitored: 0,
      escalated_cases: 0
    },
    transactions: [],
    risk_distribution: { low: 0, medium: 0, high: 0 }
  });

  const [selectedTransaction, setSelectedTransaction] = useState<null | TransactionItem>(null);

  // Filter states for the table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('All risk levels');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All types');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/alerts?limit=500');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const mappedTransactions: TransactionItem[] = data.transactions.map((tx: any) => ({
        id: tx.id.startsWith('ALT-') ? tx.id : `ALT-${tx.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`,
        txId: tx.id,
        type: tx.type,
        amount: tx.amount,
        rawAmount: tx.rawAmount || 0,
        prob: `${Number(tx.riskScore || 0).toFixed(1)}%`,
        risk: (tx.riskLevel || 'LOW').toUpperCase(),
        status: (tx.status || 'NEW').toUpperCase(),
        step: tx.step || '1'
      }));

      setDashboardData({
        kpis: data.kpis || { total_alerts: mappedTransactions.length, high_risk_alerts: 0, transactions_monitored: mappedTransactions.length, escalated_cases: 0 },
        transactions: mappedTransactions,
        risk_distribution: data.risk_distribution || { low: 0, medium: 0, high: 0 }
      });
    } catch (error) {
      console.error('Failed to fetch backend metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filter logic for dashboard table
  const filteredTransactions = useMemo(() => {
    return dashboardData.transactions.filter((row) => {
      const matchesSearch = row.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            row.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.txId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRisk = selectedRiskFilter === 'All risk levels' || row.risk === selectedRiskFilter;
      const matchesType = selectedTypeFilter === 'All types' || row.type === selectedTypeFilter;

      return matchesSearch && matchesRisk && matchesType;
    });
  }, [dashboardData.transactions, searchQuery, selectedRiskFilter, selectedTypeFilter]);

  const handleNavClick = (name: string) => {
    setActiveNav(name);
    if (!onNavigate) return;

    if (name === 'Transactions') {
      onNavigate('transactions');
    } else if (name === 'Transaction Analysis') {
      onNavigate('analysis');
    } else if (name === 'Dashboard') {
      onNavigate('dashboard');
    } else if (name === 'Alerts') {
      onNavigate('alerts');
    } else if (name === 'Analytics') {
      onNavigate('analytics');
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimStep(1);
    setShowToast(false);

    try {
      setTimeout(() => setSimStep(2), 800);

      const payload = {
        type: "TRANSFER",
        amount: 85000,
        step: 42,
        oldbalanceOrg: 85000,
        newbalanceOrig: 0,
        oldbalanceDest: 0,
        newbalanceDest: 85000
      };

      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Simulation prediction failed');
      
      const resData = await response.json();
      setTimeout(() => setSimStep(3), 1600);

      setTimeout(() => {
        setSimStep(4);
        setIsSimulating(false);
        setToastMessage(`Simulated transaction evaluated: ${resData.risk_level} Risk (${(resData.fraud_probability * 100).toFixed(1)}%)`);
        setShowToast(true);
        fetchDashboardData();
      }, 2400);
    } catch (err) {
      console.error(err);
      setIsSimulating(false);
      setToastMessage('Simulation failed to connect with FastAPI backend.');
      setShowToast(true);
    }
  };

  const totalCount = dashboardData.kpis.total_alerts || dashboardData.transactions.length;
  const highRiskCount = dashboardData.risk_distribution.high || dashboardData.transactions.filter(t => t.risk === 'HIGH').length;
  const mediumRiskCount = dashboardData.risk_distribution.medium || dashboardData.transactions.filter(t => t.risk === 'MEDIUM').length;
  const lowRiskCount = dashboardData.risk_distribution.low || dashboardData.transactions.filter(t => t.risk === 'LOW').length;

  // Dynamic SVG Donut Arc Math Calculation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  
  const highPct = totalCount > 0 ? highRiskCount / totalCount : 0;
  const medPct = totalCount > 0 ? mediumRiskCount / totalCount : 0;
  const lowPct = totalCount > 0 ? lowRiskCount / totalCount : 0;

  const highDash = highPct * circumference;
  const medDash = medPct * circumference;
  const lowDash = lowPct * circumference;

  const highOffset = 0;
  const medOffset = -highDash;
  const lowOffset = -(highDash + medDash);

  return (
    <div className="h-screen bg-[#061F22] text-[#C8D7CD] flex overflow-hidden relative" style={{ fontFamily: "'Poppins', sans-serif" }}>

      <aside className={`absolute lg:relative z-30 inset-y-0 left-0 w-64 bg-[#061F22]/80 backdrop-blur-xl border-r border-[#2A4845]/50 flex flex-col justify-between shrink-0 h-full transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div>
          <div className="p-6 border-b border-[#2A4845]/40 flex items-center justify-between gap-3">
            <div 
              onClick={onBackToLanding} 
              className="cursor-pointer flex flex-col overflow-hidden"
              title="Return to Landing Page"
            >
              <span className="font-bold tracking-wider text-2xl text-[#C8D7CD] block leading-none whitespace-nowrap" style={{ fontFamily: 'VeryVogue, sans-serif' }}>
                {isSidebarOpen ? 'InsightFlow' : ' '}
              </span>
              {isSidebarOpen && (
                <span className="text-[10px] text-[#C8D7CD]/60 font-mono tracking-wider mt-1 whitespace-nowrap">FRAUD DETECTION</span>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/50 text-[#C8D7CD] hover:bg-[#2A4845]/50 transition-colors lg:hidden shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {[
              { name: 'Dashboard', icon: LayoutDashboard, badge: null },
              { name: 'Transactions', icon: ArrowLeftRight, badge: null },
              { name: 'Transaction Analysis', icon: Search, badge: null },
              { name: 'Alerts', icon: Bell, badge: null },
              { name: 'Analytics', icon: BarChart3, badge: null }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  title={item.name}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#2A4845]/50 text-[#C8D7CD] border border-[#2A4845] shadow-lg shadow-[#061F22]/50' 
                      : 'text-[#C8D7CD]/70 hover:bg-[#2A4845]/20 hover:text-[#C8D7CD] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#C8D7CD] shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
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
              {isSidebarOpen && <span className="whitespace-nowrap">Back to Home</span>}
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#061F22]">
        
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
              <span className="text-sm font-medium text-[#C8D7CD] hidden sm:inline">Investigator</span>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 bg-transparent">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#C8D7CD] tracking-tight">Investigator Dashboard</h1>
              <p className="text-sm text-[#C8D7CD]/70 mt-1">Monitor transaction activity and review live backend model telemetry.</p>
            </div>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">Total Transactions</p>
                  <h3 className="text-2xl font-bold text-[#C8D7CD] mt-0.5">
                    {loading ? '...' : dashboardData.kpis.transactions_monitored}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/30 backdrop-blur-md border border-[#2A4845]/80 flex items-center justify-center text-[#C8D7CD] shadow-lg">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">Total Alerts</p>
                  <h3 className="text-2xl font-bold text-[#C8D7CD] mt-0.5">
                    {loading ? '...' : totalCount}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/30 backdrop-blur-md border border-[#2A4845]/80 flex items-center justify-center text-[#C8D7CD] shadow-lg">
                  <Bell className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-[#C8D7CD]/60">Scored active queue</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">High Risk</p>
                  <h3 className="text-2xl font-bold text-red-400 mt-0.5">
                    {loading ? '...' : highRiskCount}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-red-400/80 font-medium">Requires immediate action</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">Medium Risk</p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-0.5">
                    {loading ? '...' : mediumRiskCount}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-amber-400/80 font-medium">Moderate anomaly level</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">Low Risk</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-0.5">
                    {loading ? '...' : lowRiskCount}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-[#C8D7CD]/60">Normal traffic profile</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative overflow-hidden group hover:border-[#C8D7CD]/30 transition-all">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">Escalated Cases</p>
                  <h3 className="text-2xl font-bold text-[#C8D7CD] mt-0.5">
                    {loading ? '...' : dashboardData.kpis.escalated_cases}
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-[#2A4845]/30 backdrop-blur-md border border-[#2A4845]/80 flex items-center justify-center text-[#C8D7CD] shadow-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-[#C8D7CD]/60 font-mono">Under active investigation</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* DYNAMIC SVG DONUT CHART */}
            <div className="p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold tracking-tight text-[#C8D7CD]">RISK DISTRIBUTION</h3>
                  <span className="text-xs font-mono text-[#C8D7CD]/50">live calculated telemetry</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-around py-4 gap-6">
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#2A4845"
                        strokeWidth="16"
                        opacity="0.3"
                      />
                      {/* Low Risk Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="16"
                        strokeDasharray={`${lowDash} ${circumference}`}
                        strokeDashoffset={lowOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                      {/* Medium Risk Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#F59E0B"
                        strokeWidth="16"
                        strokeDasharray={`${medDash} ${circumference}`}
                        strokeDashoffset={medOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                      {/* High Risk Segment */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#EF4444"
                        strokeWidth="16"
                        strokeDasharray={`${highDash} ${circumference}`}
                        strokeDashoffset={highOffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-extrabold text-[#C8D7CD] font-mono">{totalCount}</span>
                      <p className="text-[10px] font-mono tracking-widest text-[#C8D7CD]/60 uppercase mt-0.5">ALERTS</p>
                    </div>
                  </div>

                  <div className="space-y-3 min-w-[200px]">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="text-[#C8D7CD]/80 font-medium text-xs">High Risk</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="font-bold text-[#C8D7CD]">{highRiskCount}</span>
                        <span className="text-[10px] text-[#C8D7CD]/50">{(highPct * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-[#C8D7CD]/80 font-medium text-xs">Medium Risk</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="font-bold text-[#C8D7CD]">{mediumRiskCount}</span>
                        <span className="text-[10px] text-[#C8D7CD]/50">{(medPct * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[#C8D7CD]/80 font-medium text-xs">Low Risk</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="font-bold text-[#C8D7CD]">{lowRiskCount}</span>
                        <span className="text-[10px] text-[#C8D7CD]/50">{(lowPct * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* SIMULATE TRANSACTION SECTION */}
            <div className="p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-[#C8D7CD] flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#C8D7CD]" /> SIMULATE TRANSACTION
                    </h3>
                    <p className="text-xs font-mono text-[#C8D7CD]/50 mt-1">live endpoint sample</p>
                  </div>
                  <button 
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="px-4 py-2.5 rounded-2xl bg-[#2A4845]/60 backdrop-blur-md text-[#C8D7CD] text-xs font-medium hover:bg-[#2A4845] transition-all flex items-center justify-center gap-2 shadow-lg border border-[#C8D7CD]/30 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" /> Simulate
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  
                  <div className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${simStep >= 1 ? 'bg-[#2A4845]/40 border-[#C8D7CD]/50 shadow-lg' : 'bg-[#061F22]/40 border-[#2A4845]/60'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8D7CD]/60 mb-1">
                      <span className="w-4 h-4 rounded-full bg-[#2A4845] flex items-center justify-center text-[10px] text-[#C8D7CD]">1</span>
                      INCOMING
                    </div>
                    <p className="text-xs font-medium text-[#C8D7CD]">
                      {simStep >= 1 ? 'TRANSFER · ₹85.0K' : 'Waiting...'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${simStep >= 2 ? 'bg-[#2A4845]/40 border-[#C8D7CD]/50 shadow-lg' : 'bg-[#061F22]/40 border-[#2A4845]/60'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8D7CD]/60 mb-1">
                      <span className="w-4 h-4 rounded-full bg-[#2A4845] flex items-center justify-center text-[10px] text-[#C8D7CD]">2</span>
                      ANALYZING
                    </div>
                    <p className="text-xs font-medium text-[#C8D7CD]">
                      {simStep >= 2 ? 'FastAPI model' : '—'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${simStep >= 3 ? 'bg-[#2A4845]/40 border-[#C8D7CD]/50 shadow-lg' : 'bg-[#061F22]/40 border-[#2A4845]/60'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8D7CD]/60 mb-1">
                      <span className="w-4 h-4 rounded-full bg-[#2A4845] flex items-center justify-center text-[10px] text-[#C8D7CD]">3</span>
                      RISK
                    </div>
                    <p className="text-xs font-medium text-[#C8D7CD]">
                      {simStep >= 3 ? 'Evaluated' : '—'}
                    </p>
                  </div>

                  <div className={`p-3 rounded-2xl border backdrop-blur-md transition-all ${simStep >= 4 ? 'bg-[#2A4845]/40 border-[#C8D7CD]/50 shadow-lg' : 'bg-[#061F22]/40 border-[#2A4845]/60'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#C8D7CD]/60 mb-1">
                      <span className="w-4 h-4 rounded-full bg-[#2A4845] flex items-center justify-center text-[10px] text-[#C8D7CD]">4</span>
                      QUEUED
                    </div>
                    <p className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      {simStep >= 4 ? <><CheckCircle2 className="w-3.5 h-3.5" /> Logged</> : '—'}
                    </p>
                  </div>

                </div>
              </div>

              {showToast && (
                <div className="p-3 rounded-2xl bg-[#061F22]/90 backdrop-blur-xl border border-emerald-500/40 flex items-center justify-between shadow-2xl animate-fade-in text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-[#C8D7CD]">Simulation Complete</h4>
                      <p className="text-[10px] text-[#C8D7CD]/70">{toastMessage}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowToast(false)} className="text-[#C8D7CD]/50 hover:text-[#C8D7CD] cursor-pointer">×</button>
                </div>
              )}
            </div>

          </div>

          <div className="p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-[#C8D7CD]">RECENT ALERTS</h3>
              <button 
                onClick={() => handleNavClick('Alerts')}
                className="text-sm font-medium text-[#C8D7CD] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {dashboardData.transactions.slice(0, 5).map((alert, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845]/60 flex items-center justify-between hover:border-[#2A4845] transition-all shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#2A4845]/30 backdrop-blur-md border border-[#2A4845] flex items-center justify-center text-[#C8D7CD] shadow-md">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-[#C8D7CD] font-mono">{alert.txId}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#2A4845]/50 text-[#C8D7CD]/80 border border-[#2A4845]">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-[#C8D7CD]/60 mt-1 font-mono">{alert.amount} · {alert.prob} fraud probability · Step {alert.step}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${
                    alert.risk === 'HIGH' ? 'text-red-400' : alert.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {alert.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold tracking-tight text-[#C8D7CD]">RECENT TRANSACTION ACTIVITY</h3>
              <span className="text-xs font-mono text-[#C8D7CD]/50">{filteredTransactions.length} rows</span>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#C8D7CD]/40" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, type..." 
                  className="w-full bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-[#C8D7CD] placeholder-[#C8D7CD]/40 focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedRiskFilter}
                  onChange={(e) => setSelectedRiskFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono"
                >
                  <option value="All risk levels" className="bg-[#061F22] text-[#C8D7CD]">All risk levels</option>
                  <option value="LOW" className="bg-[#061F22] text-[#C8D7CD]">LOW</option>
                  <option value="MEDIUM" className="bg-[#061F22] text-[#C8D7CD]">MEDIUM</option>
                  <option value="HIGH" className="bg-[#061F22] text-[#C8D7CD]">HIGH</option>
                </select>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-[#061F22]/80 backdrop-blur-md border border-[#2A4845] text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer font-mono"
                >
                  <option value="All types" className="bg-[#061F22] text-[#C8D7CD]">All types</option>
                  <option value="CASH_IN" className="bg-[#061F22] text-[#C8D7CD]">CASH_IN</option>
                  <option value="CASH_OUT" className="bg-[#061F22] text-[#C8D7CD]">CASH_OUT</option>
                  <option value="DEBIT" className="bg-[#061F22] text-[#C8D7CD]">DEBIT</option>
                  <option value="PAYMENT" className="bg-[#061F22] text-[#C8D7CD]">PAYMENT</option>
                  <option value="TRANSFER" className="bg-[#061F22] text-[#C8D7CD]">TRANSFER</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2A4845]/50 text-xs font-mono text-[#C8D7CD]/50">
                    <th className="py-3 px-4">TRANSACTION ID</th>
                    <th className="py-3 px-4">TYPE</th>
                    <th className="py-3 px-4">AMOUNT</th>
                    <th className="py-3 px-4">FRAUD PROBABILITY</th>
                    <th className="py-3 px-4">RISK</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A4845]/30 text-sm font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#C8D7CD]/50 text-xs font-mono">
                        Loading telemetry...
                      </td>
                    </tr>
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#2A4845]/20 transition-colors">
                        <td className="py-4 px-4 font-bold text-[#C8D7CD]">{row.txId}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.type}</td>
                        <td className="py-4 px-4 font-semibold text-[#C8D7CD]">{row.amount}</td>
                        <td className="py-4 px-4 text-[#C8D7CD]/80">{row.prob}</td>
                        <td className={`py-4 px-4 font-semibold ${
                          row.risk === 'HIGH' ? 'text-red-400' : row.risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {row.risk}
                        </td>
                        <td className="py-4 px-4 text-[#C8D7CD] font-semibold">
                          {row.status}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => setSelectedTransaction(row)}
                            className="px-3.5 py-1.5 rounded-2xl border border-[#2A4845] text-xs text-[#C8D7CD] hover:bg-[#2A4845]/40 transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#C8D7CD]/50 text-xs font-mono">
                        No transactions match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2A4845]/40 font-mono text-xs">
              <span className="text-[#C8D7CD]/60">Showing {filteredTransactions.length} records</span>
              <button 
                onClick={() => handleNavClick('Alerts')}
                className="text-[#C8D7CD] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Go to Full Alerts Queue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </main>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#061F22]/90 backdrop-blur-2xl border border-[#2A4845] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A4845]/60 pb-3">
              <h3 className="text-lg font-bold text-[#C8D7CD]">Transaction Investigation</h3>
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="text-[#C8D7CD]/60 hover:text-[#C8D7CD] text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Transaction ID:</span>
                <span className="font-bold text-[#C8D7CD]">{selectedTransaction.txId}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Type:</span>
                <span className="text-[#C8D7CD]">{selectedTransaction.type}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Amount:</span>
                <span className="text-[#C8D7CD]">{selectedTransaction.amount}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Fraud Probability:</span>
                <span className="text-red-400 font-bold">{selectedTransaction.prob}</span>
              </div>
              <div className="flex justify-between p-3 rounded-2xl bg-[#2A4845]/20 backdrop-blur-md border border-[#2A4845]/40">
                <span className="text-[#C8D7CD]/60">Risk Level:</span>
                <span className="text-[#C8D7CD] font-bold">{selectedTransaction.risk}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button 
                onClick={() => {
                  setSelectedTransaction(null);
                  handleNavClick('Alerts');
                }}
                className="px-4 py-2 rounded-2xl bg-[#2A4845]/40 border border-[#2A4845] text-[#C8D7CD] text-xs font-mono hover:bg-[#2A4845] transition-colors cursor-pointer"
              >
                Open in Alerts
              </button>
              <button 
                onClick={() => setSelectedTransaction(null)}
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