import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Search, 
  Bell, 
  BarChart3, 
  Menu, 
  X, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface TransactionAnalysisProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: string) => void;
}

export default function TransactionAnalysis({ onBackToLanding, onNavigate }: TransactionAnalysisProps) {
  const [activeNav, setActiveNav] = useState('Transaction Analysis');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form input states
  const [txType, setTxType] = useState('TRANSFER');
  const [amount, setAmount] = useState('50000');
  const [step, setStep] = useState('212');
  const [oldOrgBal, setOldOrgBal] = useState('50000');
  const [newOrgBal, setNewOrgBal] = useState('0');
  const [oldDestBal, setOldDestBal] = useState('0');
  const [newDestBal, setNewDestBal] = useState('50000');

  // Analysis Result States
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAlertCreated, setIsAlertCreated] = useState(false);
  const [showAlertToast, setShowAlertToast] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const handleNavClick = (name: string) => {
    setActiveNav(name);
    if (onNavigate) onNavigate(name);
  };

  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Explicitly mapping all fields including newbalanceOrig and oldbalanceDest
    const payload = {
      type: txType,
      amount: parseFloat(amount) || 0,
      step: parseInt(step) || 1,
      oldbalanceOrg: parseFloat(oldOrgBal) || 0,
      newbalanceOrig: parseFloat(newOrgBal) || 0,
      oldbalanceDest: parseFloat(oldDestBal) || 0,
      newbalanceDest: parseFloat(newDestBal) || 0
    };

    try {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Prediction failed: ${errText}`);
      }
      
      const data = await response.json();
      setPredictionResult(data);
      setHasAnalyzed(true);
      setIsAlertCreated(false);
      
      if (data.txId) {
        localStorage.setItem('highlightTxId', data.txId);
      }
    } catch (error: any) {
      console.error('Error running prediction analysis:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlert = () => {
    setIsAlertCreated(true);
    setShowAlertToast(true);
  };

  return (
    <div className="h-screen bg-[#061F22] text-[#C8D7CD] flex overflow-hidden relative" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`absolute lg:relative z-30 inset-y-0 left-0 w-64 bg-[#061F22]/80 backdrop-blur-xl border-r border-[#2A4845]/50 flex flex-col justify-between shrink-0 h-full transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}>
        <div>
          <div className="p-6 border-b border-[#2A4845]/40 flex items-center justify-between gap-3">
            <div 
              onClick={onBackToLanding} 
              className="cursor-pointer flex flex-col overflow-hidden"
              title="Return to Landing Page"
            >
              <span className="font-bold tracking-wider text-2xl text-[#C8D7CD] block leading-none whitespace-nowrap" style={{ fontFamily: 'VeryVogue, sans-serif' }}>
                {isSidebarOpen ? 'InsightFlow' : '  '}
              </span>
              {isSidebarOpen && (
                <span className="text-[10px] text-[#C8D7CD]/60 font-mono tracking-wider mt-1 whitespace-nowrap">FRAUD DETECTION</span>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/50 text-[#C8D7CD] hover:bg-[#2A4845]/50 transition-colors lg:hidden shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Transactions', icon: ArrowLeftRight, badge: null },
              { name: 'Transaction Analysis', icon: Search },
              { name: 'Alerts', icon: Bell, },
              { name: 'Analytics', icon: BarChart3 }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  title={item.name}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
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
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-[#C8D7CD]/70 hover:bg-[#2A4845]/30 hover:text-[#C8D7CD] transition-colors border border-transparent hover:border-[#2A4845]/50"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span className="whitespace-nowrap">Back to Home</span>}
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT SIDE SCROLLABLE CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#061F22]">
        
        <header className="h-20 bg-[#061F22]/70 backdrop-blur-xl border-b border-[#2A4845]/40 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-2xl bg-[#061F22]/40 backdrop-blur-md border border-[#2A4845]/60 text-[#C8D7CD] hover:border-[#C8D7CD]/40 transition-all shadow-lg"
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

        <main className="p-6 lg:p-8 max-w-[100rem] w-full mx-auto space-y-8 bg-transparent">
          
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#C8D7CD] tracking-tight">Transaction Analysis</h1>
            <p className="text-sm text-[#C8D7CD]/70 mt-1">Submit a transaction and let the machine learning model evaluate its fraud risk.</p>
          </div>

          <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-xl border border-[#2A4845]/60 shadow-2xl space-y-6">
            <h3 className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">TRANSACTION INFORMATION</h3>

            <form onSubmit={handleAnalyzeSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#C8D7CD]/70">TRANSACTION TYPE</label>
                  <select 
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg cursor-pointer"
                  >
                    <option value="TRANSFER" className="bg-[#061F22]">TRANSFER</option>
                    <option value="CASH_OUT" className="bg-[#061F22]">CASH_OUT</option>
                    <option value="CASH_IN" className="bg-[#061F22]">CASH_IN</option>
                    <option value="PAYMENT" className="bg-[#061F22]">PAYMENT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#C8D7CD]/70">AMOUNT (₹)</label>
                  <input 
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                  />
                  <p className="text-[10px] text-[#C8D7CD]/50 font-mono">Fraud in this dataset occurs in TRANSFER / CASH_OUT.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#C8D7CD]/70">STEP (HOUR)</label>
                  <input 
                    type="text" 
                    value={step}
                    onChange={(e) => setStep(e.target.value)}
                    className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                  />
                  <p className="text-[10px] text-[#C8D7CD]/50 font-mono">1 step = 1 hour of real time.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A4845]/40 space-y-4">
                <h3 className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">ORIGIN ACCOUNT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#C8D7CD]/70">OLD BALANCE (₹)</label>
                    <input 
                      type="text" 
                      value={oldOrgBal}
                      onChange={(e) => setOldOrgBal(e.target.value)}
                      className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#C8D7CD]/70">NEW BALANCE (₹)</label>
                    <input 
                      type="text" 
                      value={newOrgBal}
                      onChange={(e) => setNewOrgBal(e.target.value)}
                      className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2A4845]/40 space-y-4">
                <h3 className="text-xs font-mono tracking-widest text-[#C8D7CD]/60 uppercase">DESTINATION ACCOUNT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#C8D7CD]/70">OLD BALANCE (₹)</label>
                    <input 
                      type="text" 
                      value={oldDestBal}
                      onChange={(e) => setOldDestBal(e.target.value)}
                      className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-[#C8D7CD]/70">NEW BALANCE (₹)</label>
                    <input 
                      type="text" 
                      value={newDestBal}
                      onChange={(e) => setNewDestBal(e.target.value)}
                      className="w-full bg-[#061F22]/60 backdrop-blur-md border border-[#2A4845] rounded-2xl px-4 py-3 text-sm text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-[#C8D7CD] text-[#061F22] font-bold hover:bg-[#E2EDE6] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                >
                  <Search className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> 
                  {isLoading ? 'Analyzing...' : 'Analyze Transaction'}
                </button>
              </div>
            </form>
          </div>

          {hasAnalyzed && predictionResult && (
            <div className="p-6 lg:p-8 rounded-3xl bg-[#061F22]/60 backdrop-blur-xl border border-[#2A4845] shadow-2xl space-y-8 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2A4845]/30 border border-[#2A4845]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2A4845]/60 border border-[#C8D7CD]/30 flex items-center justify-center text-[#C8D7CD]">
                    <ShieldAlert className={`w-5 h-5 ${predictionResult.risk_level === 'HIGH' ? 'text-red-400' : 'text-amber-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#C8D7CD] tracking-wide">{predictionResult.risk_level} RISK TRANSACTION</h2>
                  </div>
                </div>
                <span className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold border ${
                  predictionResult.risk_level === 'HIGH' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {predictionResult.risk_level}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-[#061F22]/40 border border-[#2A4845]/60 flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-[#2A4845]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-red-500 border-t-transparent"></div>
                    <span className="text-2xl font-extrabold text-red-400 z-10">
                      {(predictionResult.fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C8D7CD]/60 uppercase tracking-wider">FRAUD PROBABILITY</span>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 rounded-2xl bg-[#061F22]/40 border border-[#2A4845]/60">
                    <span className="text-[10px] font-mono text-[#C8D7CD]/60 uppercase block mb-1">FRAUD PROBABILITY</span>
                    <span className="text-base font-bold text-red-400 font-mono">
                      {(predictionResult.fraud_probability * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#061F22]/40 border border-[#2A4845]/60">
                    <span className="text-[10px] font-mono text-[#C8D7CD]/60 uppercase block mb-1">TRANSACTION TYPE</span>
                    <span className="text-sm font-bold text-[#C8D7CD] font-mono">{txType}</span>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div className="p-4 rounded-2xl bg-[#061F22]/40 border border-[#2A4845]/60">
                    <span className="text-[10px] font-mono text-[#C8D7CD]/60 uppercase block mb-1">RISK LEVEL</span>
                    <span className="text-sm font-bold text-red-400">{predictionResult.risk_level}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#061F22]/40 border border-[#2A4845]/60">
                    <span className="text-[10px] font-mono text-[#C8D7CD]/60 uppercase block mb-1">AMOUNT</span>
                    <span className="text-sm font-bold text-[#C8D7CD] font-mono">₹{amount}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#061F22]/50 border border-[#2A4845]/60 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#C8D7CD]">
                  <Info className="w-4 h-4 text-[#C8D7CD]" /> SUPPORTING RISK INDICATORS
                </div>
                <div className="space-y-3 pt-2 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-[#2A4845]/20 border border-[#2A4845]/40 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#C8D7CD] block">Transaction type pattern</span>
                      <span className="text-[#C8D7CD]/70">Evaluated via live backend model prediction.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button 
                  onClick={handleCreateAlert}
                  disabled={isAlertCreated}
                  className="px-6 py-3 rounded-2xl bg-[#C8D7CD] text-[#061F22] font-bold text-xs hover:bg-[#E2EDE6] transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> {isAlertCreated ? 'Alert Saved' : 'Create Alert'}
                </button>
                {isAlertCreated && (
                  <button 
                    onClick={() => handleNavClick('Alerts')}
                    className="text-xs font-mono text-[#E2EDE6] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    Go to Alerts <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}


        </main>
      </div>

      {showAlertToast && (
        <div className="fixed bottom-6 right-6 p-4 rounded-2xl bg-[#061F22]/95 backdrop-blur-2xl border border-emerald-500/40 shadow-2xl z-50 flex items-center justify-between gap-4 max-w-sm text-xs font-mono">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-bold text-[#C8D7CD]">Alert created</h4>
              <p className="text-[10px] text-[#C8D7CD]/70">Custom transaction saved to MongoDB queue.</p>
            </div>
          </div>
          <button onClick={() => setShowAlertToast(false)} className="text-[#C8D7CD]/50 hover:text-[#C8D7CD]">×</button>
        </div>
      )}

    </div>
  );
}