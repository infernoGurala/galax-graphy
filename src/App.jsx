import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import PasswordGate from './components/PasswordGate';
import TopBar from './components/TopBar';
import WorkspaceScreen from './screens/WorkspaceScreen';
import FolderScreen from './screens/FolderScreen';
import YoutubeWorkspaceScreen from './screens/YoutubeWorkspaceScreen';
import NoteScreen from './screens/NoteScreen';
import CanvasView from './canvas/CanvasView';
import SearchPalette from './components/SearchPalette';
import ErrorBoundary from './components/ErrorBoundary';
import ConfirmationModal from './components/ConfirmationModal';
import { applyTheme, getStoredTheme } from './lib/themes';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const {
    isAuthenticated,
    loadData,
    currentScreen,
    isLoading,
    currentWorkspaceId,
    getWorkspaceType,
    goBack,
    navigateToWorkspaces
  } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Global right-click settings toggle listener
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!isAuthenticated) return;
      e.preventDefault();
      setSettingsOpen(true);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [isAuthenticated]);

  // Apply saved theme immediately on mount (before first paint)
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  // Load data on initial mount once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Intro loader timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  // Bind global keyboard shortcuts (Ctrl+Space = Home, Esc = Back, Alt+Space = Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAuthenticated) return;

      // Ctrl + Space (Home)
      if (e.ctrlKey && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        navigateToWorkspaces();
        return;
      }

      // Escape (Back)
      if (e.key === 'Escape') {
        const activeEl = document.activeElement;
        const isFormInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable ||
          activeEl.classList.contains('ProseMirror')
        );

        if (!isFormInput) {
          e.preventDefault();
          goBack();
        }
        return;
      }

      // Alt + Space (Search Database)
      if (e.altKey && (e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, goBack, navigateToWorkspaces]);

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'workspaces':
        return <WorkspaceScreen />;
      case 'folders': {
        const wsType = currentWorkspaceId ? getWorkspaceType(currentWorkspaceId) : 'regular';
        if (wsType === 'youtube') {
          return <YoutubeWorkspaceScreen />;
        }
        return <FolderScreen />;
      }
      case 'note':
        return <NoteScreen />;
      case 'canvas':
        return <CanvasView />;
      default:
        return <WorkspaceScreen />;
    }
  };

  return (
    <div className="h-screen w-screen bg-bg text-text selection:bg-accent/30 selection:text-text flex flex-col font-sans relative overflow-hidden select-none">


      {/* Cinematic Text-Blur Boot Loader */}
      {showIntro && (
        <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-[10000] pointer-events-none transition-opacity duration-500">
          <div className="text-center flex flex-col items-center gap-[1.2rem]">
            <div className="font-sans text-[clamp(1.5rem,6vw,2.5rem)] font-extrabold text-white uppercase tracking-[0.22em] animate-[cinematicReveal_1.4s_cubic-bezier(0.16,1,0.3,1)_forwards]">
              GALAX GRAPHY
            </div>
            <div className="font-mono text-[0.65rem] text-white/40 tracking-[0.25em] uppercase opacity-0 animate-[fadeIn_1s_ease_forwards_0.4s]">
              Space of Inferno
            </div>
            <div className="w-[110px] h-[1px] bg-white/10 relative overflow-hidden rounded-[1px] opacity-0 animate-[fadeIn_1s_ease_forwards_0.6s]">
              <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-[progressFill_1.3s_cubic-bezier(0.5,0,0.2,1)_forwards_0.5s]" />
            </div>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <PasswordGate />
      ) : (
        <>
          {/* Sleek top navigation styled like macOS Notes toolbar */}
          <TopBar onSearchTrigger={() => setSearchOpen(prev => !prev)} />
          
          {/* Primary content area */}
          <main className="flex-grow w-full relative z-10 min-h-0">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-bg/50 backdrop-blur-sm z-30 select-none">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-muted font-sans font-medium tracking-wide">
                    Retrieving workspace data...
                  </span>
                </div>
              </div>
            ) : null}

            <ErrorBoundary label="Screen Error">
              {renderActiveScreen()}
            </ErrorBoundary>
          </main>

          {/* Global database search palette */}
          <ErrorBoundary>
            <SearchPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          </ErrorBoundary>

          {/* Custom Global Confirmation Dialog */}
          <ConfirmationModal />

          {/* Global right-click settings panel */}
          <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
      )}
    </div>
  );
}
