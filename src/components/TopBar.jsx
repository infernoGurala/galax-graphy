import React from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';

export default function TopBar() {
  const { isSupabaseConnected, logout, isAuthenticated } = useStore();

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/85 backdrop-blur-md border-b border-border py-4 px-6 select-none flex items-center justify-between font-sans">
      <div className="flex items-center space-x-4">
        <Breadcrumb />
      </div>

      <div className="flex items-center space-x-4">
        {/* Supabase Status Indicator (Text Only) */}
        <div 
          className="px-2.5 py-1 rounded bg-surface border border-border text-[10px] uppercase tracking-wider font-semibold"
          title={isSupabaseConnected ? 'Connected to Supabase' : 'Running locally'}
        >
          {isSupabaseConnected ? (
            <span className="text-accent">Cloud Sync</span>
          ) : (
            <span className="text-text-muted">Local</span>
          )}
        </div>

        {/* Logout (Text Link) */}
        <button
          onClick={logout}
          className="text-xs text-text-muted hover:text-text hover:underline transition-all duration-150 cursor-pointer font-medium uppercase tracking-wider"
          title="Sign out of workspace"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
