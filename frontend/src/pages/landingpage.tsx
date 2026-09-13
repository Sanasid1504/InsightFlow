import { ArrowRight, Radar, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import bgImage from '../assets/bg.jpg';
import moneyImg from '../assets/money.png';

interface LandingProps {
  onGetStarted?: () => void;
  onTryAnalysis?: () => void;
  onLogin?: () => void;
}

export default function Landing({ onGetStarted, onTryAnalysis, onLogin }: LandingProps) {
  return (
    <div className="min-h-screen text-[#C8D7CD] selection:bg-[#2A4845] selection:text-[#C8D7CD] relative overflow-hidden">
      
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center opacity-15 mix-blend-overlay"
        style={{ backgroundImage: `url(${moneyImg})` }}
      />

      <div className="relative z-10">
        
        <header className="max-w-[100rem] mx-auto px-6 h-20 flex items-center justify-between border-b border-[#2A4845]/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="font-bold tracking-wider text-2xl md:text-3xl text-[#061F22]" style={{ fontFamily: 'VeryVogue, sans-serif' }}>
              InsightFlow
            </span>
          </div>
          
          <button 
            onClick={onLogin}
            className="px-5 py-2.5 rounded-lg border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/30 transition-colors text-sm font-medium backdrop-blur-md cursor-pointer">
               Investigator Login
          </button>
        </header>

        {/* HERO SECTION */}
        <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061F22]/80 border border-[#2A4845] text-xs text-[#C8D7CD] opacity-90 mb-8 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#C8D7CD] animate-pulse"></span>
            ML-powered fraud detection · PaySim dataset
          </div>

          {/* Main Heading */}
          <h1 
            className="text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-tight text-[#061F22] drop-shadow-[0_0_20px_rgba(200,215,205,0.3)]"
            style={{ fontFamily: "'Poppins', sans-serif" }}>

            <span className="drop-shadow-[0_0_15px_rgba(200,215,205,0.3)]">
              Detect Fraud.
            </span>
            {' '}
            <span className="text-white drop-shadow-[0_0_15px_rgba(200,215,205,0.3)]">Investigate Faster.</span>
          </h1>

          <p 
            className="max-w-4xl mx-auto text-base md:text-lg tracking-wider mb-10 leading-relaxed bg-gradient-to-r from-[#061F22] via-[#2A4845] to-[#C8D7CD] bg-clip-text text-transparent font-medium"
            style={{ fontFamily: 'VeryVogue, sans-serif' }}
          >
            InsightFlow uses machine learning to analyze financial transactions and identify suspicious activity — scoring every transfer, flagging what matters, and giving investigators the context to act.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2A4845] text-[#C8D7CD] font-medium hover:bg-[#355854] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(6,31,34,0.5)] border border-[#C8D7CD]/25 cursor-pointer">
               Get Started <ArrowRight className="w-4 h-4" />
            </button>
            
            <button 
            onClick={onTryAnalysis}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#061F22]/70 backdrop-blur-md border border-[#2A4845] text-[#C8D7CD] font-medium hover:border-[#C8D7CD]/50 transition-colors cursor-pointer"
          >
            Try Live Analysis
          </button>
          </div>

          {/* FEATURE / METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            
  {/* Card 1 */}
  <div className="p-5 rounded-2xl bg-[#061F22]/25 backdrop-blur-xl border border-[#2A4845]/40 hover:border-[#C8D7CD]/50 transition-all shadow-[0_8px_32px_0_rgba(6,31,34,0.37)] relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
    <div className="w-9 h-9 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/60 flex items-center justify-center mb-3 group-hover:border-[#C8D7CD]/30 transition-colors">
      <Radar className="w-4 h-4 text-[#C8D7CD]" />
    </div>
    <h3 className="font-semibold text-base text-[#C8D7CD] mb-1 tracking-wide">Live Monitoring</h3>
    <p className="text-xs text-[#C8D7CD]/70 font-mono whitespace-nowrap tracking-wider">Stream Analysis Active</p>
  </div>

  {/* Card 2 */}
  <div className="p-5 rounded-2xl bg-[#061F22]/25 backdrop-blur-xl border border-[#2A4845]/40 hover:border-[#C8D7CD]/50 transition-all shadow-[0_8px_32px_0_rgba(6,31,34,0.37)] relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
    <div className="w-9 h-9 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/60 flex items-center justify-center mb-3 group-hover:border-[#C8D7CD]/30 transition-colors">
      <ShieldCheck className="w-4 h-4 text-[#C8D7CD]" />
    </div>
    <h3 className="font-semibold text-base text-[#C8D7CD] mb-1 tracking-wide">Security Engine</h3>
    <p className="text-xs text-[#C8D7CD]/70 font-mono whitespace-nowrap tracking-wider">PaySim Verified</p>
  </div>

  {/* Card 3 */}
  <div className="p-5 rounded-2xl bg-[#061F22]/25 backdrop-blur-xl border border-[#2A4845]/40 hover:border-[#C8D7CD]/50 transition-all shadow-[0_8px_32px_0_rgba(6,31,34,0.37)] relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
    <div className="w-9 h-9 rounded-xl bg-[#2A4845]/30 border border-[#2A4845]/60 flex items-center justify-center mb-3 group-hover:border-[#C8D7CD]/30 transition-colors">
      <Activity className="w-4 h-4 text-[#C8D7CD]" />
    </div>
    <h3 className="font-semibold text-base text-[#C8D7CD] mb-1 tracking-wide">Risk Analysis</h3>
    <p className="text-xs text-[#C8D7CD]/70 font-mono whitespace-nowrap tracking-wider">Fraud probability 98%</p>
  </div>

  {/* Card 4 */}
  <div className="p-5 rounded-2xl bg-[#061F22]/35 backdrop-blur-xl border border-[#2A4845] hover:border-[#C8D7CD]/60 transition-all shadow-[0_8px_32px_0_rgba(6,31,34,0.45)] relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-[#C8D7CD]/[0.04] to-transparent pointer-events-none" />
    <div className="w-9 h-9 rounded-xl bg-[#2A4845]/50 border border-[#C8D7CD]/30 flex items-center justify-center mb-3 group-hover:border-[#C8D7CD]/60 transition-colors">
      <AlertTriangle className="w-4 h-4 text-[#C8D7CD]" />
    </div>
    <h3 className="font-semibold text-base text-[#C8D7CD] mb-1 tracking-wide">Fraud Alert</h3>
    <p className="text-xs text-[#C8D7CD] font-mono font-medium whitespace-nowrap tracking-wider">HIGH risk · investigate</p>
  </div>

</div>

        </main>
      </div>
    </div>
  );
}