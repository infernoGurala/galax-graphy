import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';

export default function PasswordGate({ onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const login = useStore(state => state.login);
  const cardRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      setError(false);
      if (onClose) onClose();
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Spotlight tracking only — no 3D tilt
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-[380px] p-8 bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col items-center premium-card backdrop-blur-xl transition-[border-color,background-color,transform] duration-200 relative z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg border border-border/40 bg-surface/50 text-text-muted hover:text-text cursor-pointer hover:bg-surface transition-all"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Card spotlight reflection shine */}
        <div className="card-glare-overlay" />

        {/* Identity tag */}
        <span className="text-[9px] font-mono text-text-dim uppercase tracking-[0.15em] mb-4 select-none">
          [Authorization Required]
        </span>

        <h2 className="text-2xl font-black text-text mb-2 tracking-tight font-sans text-center">
          Workspace Gate
        </h2>
        <p className="text-xs text-text-muted text-center mb-8 font-sans leading-relaxed px-2">
          Verify credentials to access secure note archives and canvas directories.
        </p>

        <form onSubmit={handleSubmit} className="w-full relative z-10">
          <div className="relative">
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-3 text-text text-center text-sm placeholder:text-text-dim font-mono input-glass ${
                error 
                  ? 'border-red-500/80 focus:border-red-500/90' 
                  : ''
              }`}
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-[10px] text-red-400 text-center mt-2.5 font-mono uppercase tracking-wider animate-pulse">
              Invalid credentials. Try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-6 h-11 btn-glass text-xs font-black uppercase tracking-widest"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
