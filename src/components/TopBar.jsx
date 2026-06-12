import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';

export default function TopBar() {
  const { isSupabaseConnected, logout, isAuthenticated } = useStore();
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/50 backdrop-blur-md border-b border-border py-4 px-6 select-none flex items-center justify-between font-sans transition-all duration-300">
      <div className="flex items-center space-x-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-text-muted bg-surface/80 border border-border px-3 py-1.5 rounded-xl select-none shadow-sm">
          <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse-dot" />
          <span>Inferno // {time}</span>
        </div>
        
        <Breadcrumb />
      </div>

      <div className="flex items-center space-x-3.5">
        {/* Supabase Status Indicator */}
        <div 
          className="px-3 py-1.5 rounded-xl bg-surface/80 border border-border text-[9px] uppercase tracking-wider font-semibold transition-all duration-200"
          title={isSupabaseConnected ? 'Connected to Supabase' : 'Running locally'}
        >
          {isSupabaseConnected ? (
            <span className="text-white font-bold">Cloud Sync</span>
          ) : (
            <span className="text-text-muted font-bold">Local</span>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn-glass px-3 py-1.5 text-[9px] font-bold tracking-wider"
          title="Sign out of workspace"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
