import { useState } from 'react';
import Landing from './pages/landingpage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/transactionexplore';
import TransactionAnalysis from './pages/transactionanalysis';
import Alerts from './pages/alerts';
import Analytics from './pages/analytics';
import Login from './pages/Login';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'transactions' | 'analysis' | 'alerts' | 'analytics' | 'login'>('landing');

const handleNavigation = (viewName: string) => {
  const target = viewName.toLowerCase().trim();
  console.log("Clicked navigation:", viewName);
  console.log("Target view:", target);

  if (target === "dashboard") setCurrentView("dashboard");
  else if (target === "transactions") setCurrentView("transactions");
  else if (target === "transaction analysis" || target === "analysis") setCurrentView("analysis");
  else if (target === "alerts") setCurrentView("alerts");
  else if (target === "analytics") setCurrentView("analytics");
  else if (target === "login") setCurrentView("login");
  else if (target === "landing") setCurrentView("landing");
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