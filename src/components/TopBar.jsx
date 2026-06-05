import React from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';
import { LogOut, Cloud, CloudOff } from 'lucide-react';

export default function TopBar() {
  const { isSupabaseConnected, logout, isAuthenticated } = useStore();

  if (!isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/85 backdrop-blur-md border-b border-border py-4 px-6 select-none flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Breadcrumb />
      </div>

      <div className="flex items-center space-x-3">
        {/* Supabase Status Indicator */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-[11px] font-medium"
          title={isSupabaseConnected ? 'Connected to Supabase Realtime' : 'Running locally (LocalStorage Fallback)'}
        >
          {isSupabaseConnected ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-text font-sans">Cloud Sync</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted font-sans">Local Save</span>
            </>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-1.5 hover:bg-surface border border-transparent hover:border-border rounded-lg text-text-muted hover:text-text transition-all duration-150 cursor-pointer"
          title="Authenticate out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
