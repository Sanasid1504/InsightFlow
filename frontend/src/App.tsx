import { useState } from 'react';
import Landing from './pages/landingpage';
import Dashboard from './pages/dashboard';
import Transactions from './pages/transactionexplore';
import TransactionAnalysis from './pages/transactionanalysis';
import Alerts from './pages/alerts';
import Analytics from './pages/analytics';
import Login from './pages/login';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'transactions' | 'analysis' | 'alerts' | 'analytics' | 'login'>('landing');

  const handleNavigation = (viewName: string) => {
    const target = viewName.toLowerCase().trim();
    if (target.includes('dashboard')) {
      setCurrentView('dashboard');
    } else if (target.includes('transactions')) {
      setCurrentView('transactions');
    } else if (target.includes('analysis') || target.includes('transaction analysis')) {
      setCurrentView('analysis');
    } else if (target.includes('alerts')) {
      setCurrentView('alerts');
    } else if (target.includes('analytics')) {
      setCurrentView('analytics'); 
    } else if (target.includes('login')) {
      setCurrentView('login');
    }
  };

  return (
    <div>
      {currentView === 'landing' && (
        <Landing 
          onGetStarted={() => setCurrentView('dashboard')} 
          onTryAnalysis={() => setCurrentView('analysis')} 
          onLogin={() => setCurrentView('login')}
        />
      )}

      {currentView === 'login' && (
        <Login 
          onLoginSuccess={() => setCurrentView('dashboard')}
          onBackToLanding={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard 
          onBackToLanding={() => setCurrentView('landing')} 
          onNavigate={handleNavigation}
        />
      )}

      {currentView === 'transactions' && (
        <Transactions 
          onBackToLanding={() => setCurrentView('landing')} 
          onNavigate={handleNavigation}
        />
      )}

      {currentView === 'analysis' && (
        <TransactionAnalysis 
          onBackToLanding={() => setCurrentView('landing')} 
          onNavigate={handleNavigation}
        />
      )}

      {currentView === 'alerts' && (
        <Alerts 
          onBackToLanding={() => setCurrentView('landing')} 
          onNavigate={handleNavigation}
        />
      )}

      {currentView === 'analytics' && (
        <Analytics 
          onBackToLanding={() => setCurrentView('landing')} 
          onNavigate={handleNavigation}
        />
      )}
    </div>
  );
}