import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function ConfirmationModal() {
  const { confirmDialog, hideConfirm } = useStore();
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!confirmDialog) return;

    // Focus confirm button for quick keyboard navigation
    confirmButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hideConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, hideConfirm]);

  if (!confirmDialog) return null;

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm
  } = confirmDialog;

  const handleConfirm = () => {
    onConfirm?.();
    hideConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-card/70 border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar with thin accent indicator */}
        <div className={`h-[2px] w-full ${isDestructive ? 'bg-red-500' : 'bg-white/60'}`} />

        <div className="p-6 flex flex-col gap-3.5">
          <span className="text-[9px] font-mono font-bold text-text-dim uppercase tracking-[0.15em]">
            [Confirm Action]
          </span>
          <h2 className="text-base font-extrabold tracking-tight text-text">
            {title}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Buttons footer */}
        <div className="bg-surface/50 border-t border-border/60 px-6 py-4.5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={hideConfirm}
            className="px-4 py-2 border border-border/80 hover:border-text text-text-muted hover:text-text text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer active:scale-95 outline-none bg-surface/30 hover:bg-surface"
          >
            {cancelLabel}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer active:scale-95 outline-none border-none ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/20' 
                : 'bg-white hover:bg-white/90 text-black shadow-md shadow-white/5 font-extrabold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
