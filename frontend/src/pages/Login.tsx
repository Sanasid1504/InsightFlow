import { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Mail } from 'lucide-react';
import bgImage from '../assets/bg.jpg';
import moneyImg from '../assets/money.png';

interface LoginProps {
  onLoginSuccess?: () => void;
  onBackToLanding?: () => void;
}

export default function Login({ onLoginSuccess, onBackToLanding }: LoginProps) {
  const [email, setEmail] = useState('investigator@insightflow.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen text-[#C8D7CD] selection:bg-[#2A4845] selection:text-[#C8D7CD] relative overflow-hidden flex flex-col justify-between" style={{ fontFamily: "'Poppins', sans-serif" }}>
      
      {/* BACKGROUND IMAGES */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center opacity-15 mix-blend-overlay"
        style={{ backgroundImage: `url(${moneyImg})` }}
      />

      {/* HEADER */}
      <header className="max-w-[100rem] w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-[#2A4845]/40 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wider text-2xl md:text-3xl text-[#061F22]" style={{ fontFamily: 'VeryVogue, sans-serif' }}>
            InsightFlow
          </span>
        </div>
        
        {onBackToLanding && (
          <button 
            onClick={onBackToLanding}
            className="px-4 py-2 rounded-xl border border-[#2A4845] text-[#C8D7CD] hover:bg-[#2A4845]/30 transition-colors text-xs font-mono backdrop-blur-md flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        )}
      </header>

      {/* LOGIN CARD CONTAINER */}
      <main className="max-w-md w-full mx-auto px-6 py-12 relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full p-8 rounded-3xl bg-[#061F22]/40 backdrop-blur-2xl border border-[#2A4845]/80 shadow-[0_16px_40px_0_rgba(6,31,34,0.5)] space-y-6">
          
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-[#C8D7CD] tracking-tight">Investigator Portal</h1>
            <p className="text-xs text-[#C8D7CD]/70 font-mono">Authenticate to access secure fraud queues.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[#C8D7CD]/70 uppercase">INVESTIGATOR EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#C8D7CD]/40" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#061F22]/60 border border-[#2A4845] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <label className="text-[#C8D7CD]/70 uppercase">SECURE PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#C8D7CD]/40" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#061F22]/60 border border-[#2A4845] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#C8D7CD] focus:outline-none focus:border-[#C8D7CD]/50 shadow-inner"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#2A4845] border border-[#C8D7CD]/30 text-[#C8D7CD] font-bold hover:bg-[#355854] hover:text-white transition-all flex items-center justify-center gap-2 shadow-xl text-xs font-mono uppercase tracking-wider disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="text-center pt-2 border-t border-[#2A4845]/40">
            <span className="text-[10px] font-mono text-[#C8D7CD]/50">Secured via InsightFlow PaySim Engine</span>
          </div>

        </div>
      </main>

      <footer className="py-6 text-center text-xs font-mono text-[#C8D7CD]/40 relative z-10">
        InsightFlow Fraud Detection Platform · Secure Session
      </footer>

    </div>
  );
}