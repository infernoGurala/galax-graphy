import React from 'react';

export default function SaveStatusIndicator({ status }) {
  const isSaving = status === 'saving';
  
  if (!isSaving) return null;
  
  return (
    <div className="flex items-center gap-2 select-none animate-in fade-in duration-150">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-mono">
        Saving...
      </span>
    </div>
  );
}
