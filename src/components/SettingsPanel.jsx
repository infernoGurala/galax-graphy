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
          width: '35rem',
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
            padding: '2.25rem 2.5rem 1.875rem',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                fontSize: '1.5rem',
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
                margin: '0.5rem 0 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
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
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '0.75rem',
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
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--color-text-dim)',
            }}
          >
            Select Theme
          </p>

          {/* ─── Theme Cards ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    borderRadius: '1rem',
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
                      height: '11.25rem',
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
                        height: '2.25rem',
                        background: theme.surface,
                        borderBottom: `1px solid ${theme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 1rem',
                        gap: '0.4375rem',
                      }}
                    >
                      <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#ff5f56' }} />
                      <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#ffbd2e' }} />
                      <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: '#27c93f' }} />
                      {/* Fake breadcrumb */}
                      <div style={{ marginLeft: '0.875rem', display: 'flex', gap: '0.3125rem', alignItems: 'center' }}>
                        {[56, 38, 48].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              width: w,
                              height: '0.375rem',
                              borderRadius: '0.1875rem',
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
                        top: '3rem',
                        left: '1.5rem',
                        right: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem',
                      }}
                    >
                      {/* Heading-like line */}
                      <div style={{ width: '65%', height: '0.5rem', borderRadius: '0.25rem', background: theme.text, opacity: 0.85 }} />
                      {/* Sub lines */}
                      <div style={{ width: '45%', height: '0.3125rem', borderRadius: '0.1875rem', background: theme.textMuted, opacity: 0.5 }} />
                      <div style={{ width: '78%', height: '0.3125rem', borderRadius: '0.1875rem', background: theme.textMuted, opacity: 0.3 }} />
                      <div style={{ width: '55%', height: '0.3125rem', borderRadius: '0.1875rem', background: theme.textMuted, opacity: 0.25 }} />
                    </div>

                    {/* Accent pill bottom-right */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.75rem',
                        right: '0.875rem',
                        height: '0.875rem',
                        width: '2.25rem',
                        borderRadius: '0.4375rem',
                        background: theme.accent,
                        opacity: 0.8,
                      }}
                    />
                  </div>

                  {/* ── Card footer info ── */}
                  <div
                    style={{
                      padding: '1.25rem 1.5rem 1.375rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {/* Name + active indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '1.0625rem',
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
                              fontSize: '0.5625rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.12em',
                              color: theme.accent,
                              background: `${theme.accent}18`,
                              border: `1px solid ${theme.accent}44`,
                              borderRadius: '0.25rem',
                              padding: '0.1875rem 0.5rem',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.5,
                        }}
                      >
                        {theme.description}
                      </span>

                      {/* Color palette dots */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem', alignItems: 'center' }}>
                        {[theme.bg, theme.surface, theme.accent, theme.accentCyan, theme.text].map((color, i) => (
                          <div
                            key={i}
                            title={color}
                            style={{
                              width: '1.125rem',
                              height: '1.125rem',
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
                            fontSize: '0.625rem',
                            color: 'var(--color-text-dim)',
                            marginLeft: '0.25rem',
                          }}
                        >
                          {theme.bg}
                        </span>
                      </div>
                    </div>

                    {/* Right: Check + CR badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                      {/* Check circle */}
                      <div
                        style={{
                          width: '1.75rem',
                          height: '1.75rem',
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
                          gap: '0.125rem',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '1.375rem',
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
                            fontSize: '0.6875rem',
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
              borderRadius: '0.875rem',
              padding: '1.25rem 1.375rem',
              background: 'color-mix(in srgb, #10b981 8%, transparent)',
              border: '1px solid color-mix(in srgb, #10b981 25%, transparent)',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: '#10b981',
                flexShrink: 0,
                marginTop: '0.375rem',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.6875rem',
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
                  fontSize: '0.8125rem',
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
            padding: '1.25rem 2.5rem 1.5rem',
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
              fontSize: '0.6875rem',
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
              fontSize: '0.6875rem',
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
