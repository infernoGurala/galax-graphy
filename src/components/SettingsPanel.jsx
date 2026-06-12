import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import { THEMES, applyTheme, getStoredTheme } from '../lib/themes';

export default function SettingsPanel({ isOpen, onClose }) {
  const [activeTheme, setActiveTheme] = useState(getStoredTheme);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => window.addEventListener('mousedown', handleClick), 80);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSelectTheme = (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Slide-in Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '440px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(14, 14, 20, 0.96)',
          backdropFilter: 'blur(48px) saturate(160%)',
          WebkitBackdropFilter: 'blur(48px) saturate(160%)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '-32px 0 100px rgba(0,0,0,0.7)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ─── Header ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 32px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}
            >
              Appearance
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}
            >
              Choose a colour theme. Saved locally.
            </p>
          </div>

          <button
            id="settings-panel-close"
            onClick={onClose}
            aria-label="Close settings"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'var(--color-text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* ─── Body ─── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--color-text-dim)',
            }}
          >
            Select Theme
          </p>

          {/* ─── Theme Cards ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.values(THEMES).map((theme) => {
              const isActive = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  id={`theme-btn-${theme.id}`}
                  onClick={() => handleSelectTheme(theme.id)}
                  aria-pressed={isActive}
                  aria-label={`Select ${theme.name} theme`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    padding: 0,
                    border: isActive
                      ? '1.5px solid rgba(139,92,246,0.5)'
                      : '1.5px solid rgba(255,255,255,0.06)',
                    background: isActive
                      ? 'rgba(139,92,246,0.07)'
                      : 'rgba(255,255,255,0.02)',
                    boxShadow: isActive
                      ? '0 0 0 4px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)'
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }
                  }}
                >
                  {/* ── Big preview swatch ── */}
                  <div
                    style={{
                      background: theme.bg,
                      height: '130px',
                      position: 'relative',
                      overflow: 'hidden',
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  >
                    {/* Topbar strip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '28px',
                        background: theme.surface,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        gap: '5px',
                      }}
                    >
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#27c93f' }} />
                      {/* Fake breadcrumb */}
                      <div style={{ marginLeft: 10, display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[48, 32, 40].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              width: w,
                              height: 5,
                              borderRadius: 3,
                              background: theme.textMuted,
                              opacity: 0.4 - i * 0.08,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Content body preview */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 38,
                        left: 20,
                        right: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {/* Heading-like line */}
                      <div style={{ width: '65%', height: 8, borderRadius: 4, background: theme.text, opacity: 0.85 }} />
                      {/* Sub lines */}
                      <div style={{ width: '45%', height: 5, borderRadius: 3, background: theme.textMuted, opacity: 0.5 }} />
                      <div style={{ width: '78%', height: 5, borderRadius: 3, background: theme.textMuted, opacity: 0.3 }} />
                      <div style={{ width: '55%', height: 5, borderRadius: 3, background: theme.textMuted, opacity: 0.25 }} />
                    </div>

                    {/* Accent pill bottom-right */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 14,
                        height: 14,
                        width: 36,
                        borderRadius: 7,
                        background: theme.accent,
                        opacity: 0.8,
                      }}
                    />
                  </div>

                  {/* ── Card footer info ── */}
                  <div
                    style={{
                      padding: '16px 20px 18px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Name + active indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '-0.01em',
                            color: 'var(--color-text)',
                          }}
                        >
                          {theme.name}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontFamily: 'JetBrains Mono, monospace',
                              fontSize: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              color: theme.accent,
                              background: `${theme.accent}18`,
                              border: `1px solid ${theme.accent}44`,
                              borderRadius: 4,
                              padding: '2px 6px',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {theme.description}
                      </span>

                      {/* Color palette dots */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                        {[theme.bg, theme.surface, theme.accent, theme.accentCyan, theme.text].map((color, i) => (
                          <div
                            key={i}
                            title={color}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: color,
                              border: '1px solid rgba(255,255,255,0.12)',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '9px',
                            color: 'var(--color-text-dim)',
                            marginLeft: 4,
                          }}
                        >
                          {theme.bg}
                        </span>
                      </div>
                    </div>

                    {/* Right: Check + CR badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      {/* Check circle */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isActive ? theme.accent : 'rgba(255,255,255,0.05)',
                          border: isActive ? 'none' : '1.5px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isActive && <Check size={12} color="#fff" strokeWidth={2.5} />}
                      </div>

                      {/* Contrast ratio */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: 'var(--color-text)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                          }}
                        >
                          {theme.contrastRatio}
                        </span>
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '9px',
                            color: 'var(--color-text-muted)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          CR · AAA
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── WCAG note ─── */}
          <div
            style={{
              borderRadius: '12px',
              padding: '16px 18px',
              background: 'rgba(16,185,129,0.05)',
              border: '1px solid rgba(16,185,129,0.15)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
                marginTop: 5,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: '#10b981',
                  fontWeight: 600,
                }}
              >
                WCAG AAA Certified
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Both themes exceed the WCAG AAA threshold of 7:1. A contrast ratio above 15:1 ensures
                maximum legibility for all users including those with visual impairments.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div
          style={{
            padding: '16px 32px 20px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--color-text-dim)',
            }}
          >
            Galax Graphy
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              color: 'var(--color-text-dim)',
            }}
          >
            Preferences saved locally
          </span>
        </div>
      </div>
    </>
  );
}
