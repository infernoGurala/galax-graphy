import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import PasswordGate from './components/PasswordGate';
import TopBar from './components/TopBar';
import WorkspaceScreen from './screens/WorkspaceScreen';
import FolderScreen from './screens/FolderScreen';
import NoteScreen from './screens/NoteScreen';
import CanvasView from './canvas/CanvasView';

export default function App() {
  const { isAuthenticated, loadData, currentScreen, isLoading, goBack, navigateToWorkspaces } = useStore();

  // Load data on initial mount once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Bind global keyboard shortcuts (Alt+Space = Home, Esc = Back)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isAuthenticated) return;

      // Alt + Space (Home)
      if (e.altKey && e.code === 'Space') {
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, goBack, navigateToWorkspaces]);

  if (!isAuthenticated) {
    return <PasswordGate />;
  }

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'workspaces':
        return <WorkspaceScreen />;
      case 'folders':
        return <FolderScreen />;
      case 'note':
        return <NoteScreen />;
      case 'canvas':
        return <CanvasView />;
      default:
        return <WorkspaceScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent/30 selection:text-text flex flex-col font-sans">
      {/* Sleek top navigation */}
      <TopBar />
      
      {/* Primary content area */}
      <main className="flex-1 w-full relative">
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

        {renderActiveScreen()}
      </main>
    </div>
  );
}
