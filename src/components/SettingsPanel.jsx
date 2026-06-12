import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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

  // Portal target — always renders at document.body to avoid parent stacking context issues
  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) return null;

  return ReactDOM.createPortal(
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
          height: '100vh',
          width: '560px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-settings-bg)',
          backdropFilter: 'blur(48px) saturate(160%)',
          WebkitBackdropFilter: 'blur(48px) saturate(160%)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-32px 0 100px rgba(0,0,0,0.35)',
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
            padding: '36px 40px 30px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}
            >
              Appearance
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-card)';
              e.currentTarget.style.color = 'var(--color-text)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--color-surface)';
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
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--color-text-dim)',
            }}
          >
            Select Theme
          </p>

          {/* ─── Theme Cards ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                      ? '1.5px solid var(--color-accent)'
                      : '1.5px solid var(--color-border)',
                    background: isActive
                      ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
                      : 'var(--color-surface)',
                    boxShadow: isActive
                      ? '0 0 0 4px color-mix(in srgb, var(--color-accent) 8%, transparent), inset 0 1px 0 rgba(255,255,255,0.05)'
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.border = '1.5px solid var(--color-accent)';
                      e.currentTarget.style.background = 'color-mix(in srgb, var(--color-text) 4%, transparent)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.border = '1.5px solid var(--color-border)';
                      e.currentTarget.style.background = 'var(--color-surface)';
                    }
                  }}
                >
                  {/* ── Big preview swatch ── */}
                  <div
                    style={{
                      background: theme.bg,
                      height: '180px',
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
                        height: '36px',
                        background: theme.surface,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px',
                        gap: '7px',
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
                      {/* Fake breadcrumb */}
                      <div style={{ marginLeft: 14, display: 'flex', gap: 5, alignItems: 'center' }}>
                        {[56, 38, 48].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              width: w,
                              height: 6,
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
                        top: 48,
                        left: 24,
                        right: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
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
                      padding: '20px 24px 22px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Name + active indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '17px',
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
                              fontSize: '9px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              color: theme.accent,
                              background: `${theme.accent}18`,
                              border: `1px solid ${theme.accent}44`,
                              borderRadius: 4,
                              padding: '3px 8px',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '13px',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {theme.description}
                      </span>

                      {/* Color palette dots */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                        {[theme.bg, theme.surface, theme.accent, theme.accentCyan, theme.text].map((color, i) => (
                          <div
                            key={i}
                            title={color}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: color,
                              border: '1px solid var(--color-border)',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '10px',
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
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isActive ? theme.accent : 'var(--color-surface)',
                          border: isActive ? 'none' : '1.5px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {isActive && <Check size={14} color="#fff" strokeWidth={2.5} />}
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
                            fontSize: '22px',
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
                            fontSize: '11px',
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
              borderRadius: '14px',
              padding: '20px 22px',
              background: 'color-mix(in srgb, #10b981 8%, transparent)',
              border: '1px solid color-mix(in srgb, #10b981 25%, transparent)',
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
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
                  fontSize: '13px',
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
            padding: '20px 40px 24px',
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
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
              fontSize: '11px',
              color: 'var(--color-text-dim)',
            }}
          >
            Preferences saved locally
          </span>
        </div>
      </div>
    </>
  , portalTarget);
}
