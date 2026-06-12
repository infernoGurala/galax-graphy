import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';
import SettingsPanel from './SettingsPanel';
import { Search, FolderPlus, FilePlus, PenTool, Cloud, CloudOff, Settings2 } from 'lucide-react';

export default function TopBar({ onSearchTrigger }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { 
    isSupabaseConnected, 
    logout, 
    isAuthenticated,
    currentScreen,
    currentWorkspaceId,
    currentFolderId,
    createNote,
    createCanvas,
    createFolder,
    navigateToNote,
    navigateToCanvas,
    navigateToWorkspaces,
    goBack
  } = useStore();

  if (!isAuthenticated) return null;

  const handleCreateNote = async () => {
    if (!currentWorkspaceId) return;
    const note = await createNote(currentWorkspaceId, currentFolderId || null, 'Untitled Note');
    navigateToNote(note.id);
  };

  const handleCreateCanvas = async () => {
    if (!currentWorkspaceId) return;
    const canvas = await createCanvas(currentWorkspaceId, null, 'Untitled Canvas', true, {});
    navigateToCanvas(canvas.id);
  };

  const handleCreateFolder = async () => {
    if (!currentWorkspaceId) return;
    await createFolder(currentWorkspaceId, 'Untitled Folder');
  };

  const handleToggleView = () => {
    if (currentScreen === 'workspaces') {
      const currentMode = useStore.getState().workspaceViewMode;
      useStore.getState().setWorkspaceViewMode(currentMode === 'board' ? 'dashboard' : 'board');
    } else if (currentScreen === 'folders') {
      const currentMode = useStore.getState().folderViewMode;
      useStore.getState().setFolderViewMode(currentMode === 'board' ? 'dashboard' : 'board');
    }
  };

  return (
    <header className="w-full bg-bg/60 backdrop-blur-md border-b border-white/5 h-14 px-5 select-none flex items-center justify-between font-sans relative z-40 flex-shrink-0">
      {/* Left: macOS Traffic Lights & Navigation Breadcrumbs */}
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-2.5 traffic-lights-group flex-shrink-0">
          <button 
            onClick={goBack}
            className="traffic-btn traffic-btn-close flex items-center justify-center"
            title="Go Back"
          >
            <span className="traffic-icon">&#x2715;</span>
          </button>
          <button 
            onClick={navigateToWorkspaces}
            className="traffic-btn traffic-btn-minimize flex items-center justify-center"
            title="Go Home (Finder)"
          >
            <span className="traffic-icon">&minus;</span>
          </button>
          <button 
            onClick={handleToggleView}
            className="traffic-btn traffic-btn-maximize flex items-center justify-center"
            title="Toggle View Mode"
          >
            <span className="traffic-icon">&#x2b06;</span>
          </button>
        </div>
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center min-w-0">
          <Breadcrumb />
        </div>
      </div>

      {/* Right: Actions Toolbar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Quick Actions (active when workspace is open) */}
        {currentWorkspaceId && (
          <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-1 gap-0.5">
            <button
              onClick={handleCreateFolder}
              className="p-2 hover:bg-white/10 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCreateNote}
              className="p-2 hover:bg-white/10 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
              title="New Note"
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCreateCanvas}
              className="p-2 hover:bg-white/10 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
              title="New Canvas Drawings"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Spotlight Database Search */}
        <button
          onClick={onSearchTrigger}
          className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center"
          title="Spotlight Search (Alt+Space)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          id="topbar-settings-btn"
          onClick={() => setSettingsOpen(prev => !prev)}
          className="p-2 border rounded-lg text-text-muted hover:text-white transition-all duration-150 cursor-pointer flex items-center justify-center"
          title="Settings & Appearance"
          style={{
            background: settingsOpen ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.05)',
            borderColor: settingsOpen ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.05)',
            color: settingsOpen ? 'var(--color-accent)' : undefined,
          }}
          aria-expanded={settingsOpen}
          aria-label="Open settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>

        {/* Sync Indicator */}
        <div 
          className={`px-2.5 py-1 rounded-lg border text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 select-none ${
            isSupabaseConnected 
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
              : 'border-white/10 bg-white/5 text-text-dim'
          }`}
          title={isSupabaseConnected ? 'Synced to Supabase Cloud' : 'Running Offline Database'}
        >
          {isSupabaseConnected ? (
            <>
              <Cloud className="w-3 h-3" />
              <span>Cloud</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3 h-3" />
              <span>Local</span>
            </>
          )}
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          className="btn-glass px-2.5 py-1 text-[9px] font-bold tracking-wider rounded-lg flex items-center justify-center"
          title="Sign out of database"
        >
          Sign Out
        </button>

        {/* Settings Panel */}
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </header>
  );
}
