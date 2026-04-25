import React from 'react';
import { navItems, type NavId } from '../data/syntheticData';

/**
 * Sidebar — Government-style vertical navigation
 */

interface SidebarProps {
  activeNav: NavId;
  onNavChange: (id: NavId) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  'alert-triangle': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  'trending-up': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  'file-text': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
};

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange }) => {
  return (
    <aside className="w-56 bg-gov-navy min-h-[calc(100vh-56px)] flex-shrink-0 flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavChange(item.id)}
            className={`sidebar-link w-full text-left ${
              activeNav === item.id ? 'sidebar-link-active' : 'sidebar-link-inactive'
            }`}
          >
            {iconMap[item.icon]}
            <span>{item.label}</span>
            {item.id === 'anomaly-feed' && (
              <span className="ml-auto bg-alert-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                43
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white border-opacity-10">
        <p className="text-blue-200 text-opacity-40 text-[10px] leading-relaxed text-center">
          Government of Karnataka<br />
          Energy Department<br />
          v2.1.0 — April 2026
        </p>
      </div>
    </aside>
  );
};
