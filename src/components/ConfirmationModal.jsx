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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar with accent indicator */}
        <div className={`h-[3px] w-full ${isDestructive ? 'bg-red-500' : 'bg-accent'}`} />

        <div className="p-6 flex flex-col gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-text">
            {title}
          </h2>
          <p className="text-xs text-text-muted leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Buttons footer */}
        <div className="bg-bg border-t border-border px-6 py-4 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={hideConfirm}
            className="px-3.5 py-2 border border-border hover:border-text-muted text-text-muted hover:text-text text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer active:scale-95 outline-none focus:border-text-muted"
          >
            {cancelLabel}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            className={`px-3.5 py-2 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer active:scale-95 outline-none ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-500 focus:ring-2 focus:ring-red-500/35' 
                : 'bg-accent hover:bg-accent-hover focus:ring-2 focus:ring-accent/35'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
