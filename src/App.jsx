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
import { Settings } from 'lucide-react';
import ContextMenu from './components/ContextMenu';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Custom event listener for settings panel
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  // Global right-click context menu listener
  useEffect(() => {
    const handleContextMenu = (e) => {
      const activeEl = e.target;
      const isFormInput = activeEl && (
        (activeEl.tagName === 'INPUT' && activeEl.type !== 'submit') ||
        activeEl.tagName === 'TEXTAREA'
      );
      if (isFormInput) return; // Allow browser context menu for input fields

      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setIsContextMenuOpen(true);
    };

    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, []);

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

      {!isAuthenticated ? (
        <>
          {/* Ambient locked screen (no active visible UI) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg z-0 select-none">
            {/* Custom premium design - subtle grid pattern in background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Subtle premium hint */}
            <div className="text-[10px] font-mono text-text-dim/60 uppercase tracking-[0.2em] pointer-events-none animate-pulse">
              Right-click to unlock
            </div>
          </div>

          {/* Authentication Modal */}
          {isAuthModalOpen && (
            <PasswordGate onClose={() => setIsAuthModalOpen(false)} />
          )}
        </>
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

          {/* Floating settings trigger button hidden as it is moved to context menu */}
        </>
      )}

      {/* Custom Right-Click Context Menu (Unified globally) */}
      {isContextMenuOpen && (
        <ContextMenu 
          x={contextMenuPos.x} 
          y={contextMenuPos.y} 
          onClose={() => setIsContextMenuOpen(false)} 
          onOpenAuth={() => {
            setIsContextMenuOpen(false);
            setIsAuthModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
