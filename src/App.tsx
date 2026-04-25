import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { AnomalyFeedPage } from './pages/AnomalyFeedPage';
import { DemandForecastingPage } from './pages/DemandForecastingPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import type { NavId } from './data/syntheticData';

/**
 * App — Root layout with Header + Sidebar + Page content
 */

const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavId>('overview');
  const [currentTime, setCurrentTime] = useState('');
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset selected meter when switching nav
  const handleNavChange = (id: NavId) => {
    setActiveNav(id);
    setSelectedMeterId(null);
  };

  const renderPage = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewPage />;
      case 'anomaly-feed':
        return (
          <AnomalyFeedPage
            selectedMeterId={selectedMeterId}
            onSelectMeter={setSelectedMeterId}
            onClose={() => setSelectedMeterId(null)}
          />
        );
      case 'demand-forecasting':
        return <DemandForecastingPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header currentTime={currentTime} />
      <div className="flex">
        <Sidebar activeNav={activeNav} onNavChange={handleNavChange} />
        <main className="flex-1 min-h-[calc(100vh-56px)] overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
