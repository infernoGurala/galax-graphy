import React from 'react';
import { useStore } from '../store/useStore';

export default function SaveStatusIndicator({ status }) {
  const { isSupabaseConnected } = useStore();

  const isSaving = status === 'saving';
  
  return (
    <div className="flex items-center gap-2 select-none">
      <span className="relative flex h-2 w-2">
        {isSaving ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </>
        ) : (
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-accent'}`}></span>
        )}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        {isSaving 
          ? 'Saving changes...' 
          : isSupabaseConnected 
            ? 'Synced' 
            : 'Saved locally'}
      </span>
    </div>
  );
}
