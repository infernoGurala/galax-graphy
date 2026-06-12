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

  // Custom event listener for settings panel
  useEffect(() => {
    const handleOpenSettings = () => setSettingsOpen(true);
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  // Global right-click text styling menu listener
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!isAuthenticated) return;
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setIsContextMenuOpen(true);
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

          {/* Floating settings trigger button at bottom right (rendered when no HUD is active) */}
          {(() => {
            const wsType = currentWorkspaceId ? getWorkspaceType(currentWorkspaceId) : 'regular';
            const showStandaloneSettings = 
              currentScreen === 'note' || 
              currentScreen === 'canvas' || 
              (currentScreen === 'folders' && wsType === 'youtube');
            return showStandaloneSettings && (
              <button 
                onClick={() => setSettingsOpen(true)}
                className="fixed bottom-6 right-6 z-50 p-2.5 rounded-xl bg-surface/85 backdrop-blur-md border border-border/80 text-text-muted hover:text-text hover:bg-surface hover:scale-105 active:scale-95 shadow-2xl transition-all duration-200 cursor-pointer flex items-center justify-center"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            );
          })()}

          {/* Custom Right-Click Context Menu for Text Styling */}
          {isContextMenuOpen && (
            <ContextMenu 
              x={contextMenuPos.x} 
              y={contextMenuPos.y} 
              onClose={() => setIsContextMenuOpen(false)} 
            />
          )}
        </>
      )}
    </div>
  );
}
