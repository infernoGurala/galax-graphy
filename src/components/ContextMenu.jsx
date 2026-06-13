import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List as ListIcon, ListOrdered, Code, Trash2, Lock, RefreshCw, ToggleLeft, ToggleRight,
  Settings, Check, Plus, FolderPlus, FilePlus, Palette, Grid, LayoutGrid
} from 'lucide-react';

export default function ContextMenu({ x, y, onClose, onOpenAuth }) {
  const menuRef = useRef(null);
  const [position, setPosition] = React.useState({ left: x, top: y });

  const {
    isAuthenticated,
    isSupabaseConnected,
    currentScreen,
    loadData,
    toggleSupabaseSync,
    logout,
    workspaceViewMode,
    setWorkspaceViewMode,
    folderViewMode,
    setFolderViewMode
  } = useStore();

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Check right edge
    if (x + rect.width > winWidth) {
      adjustedX = winWidth - rect.width - 16;
    }
    // Check bottom edge
    if (y + rect.height > winHeight) {
      adjustedY = winHeight - rect.height - 16;
    }

    // Check bounds
    adjustedX = Math.max(16, adjustedX);
    adjustedY = Math.max(16, adjustedY);

    setPosition({ left: adjustedX, top: adjustedY });
  }, [x, y]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [onClose]);

  const handleFormat = (format, value) => {
    window.dispatchEvent(new CustomEvent('format-text', { detail: { format, value } }));
    onClose();
  };

  const handleSync = () => {
    loadData();
    onClose();
  };

  const handleTriggerCreateWorkspace = (type) => {
    window.dispatchEvent(new CustomEvent('trigger-create-workspace', { detail: { type } }));
    onClose();
  };

  const handleTriggerCreateFolderItem = (type) => {
    window.dispatchEvent(new CustomEvent('trigger-create-folder-item', { detail: { type } }));
    onClose();
  };

  const handleOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('open-settings'));
    onClose();
  };

  // Locked context menu
  if (!isAuthenticated) {
    return (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: `${position.left}px`,
          top: `${position.top}px`,
          zIndex: 9999,
        }}
        className="w-[170px] p-1.5 bg-surface/85 border border-border/30 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col text-text animate-in zoom-in-95 duration-100 select-none font-sailec font-light"
      >
        <button
          onClick={onOpenAuth}
          className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
        >
          <Lock className="w-3.5 h-3.5 stroke-[1.5] text-accent" />
          <span>Unlock Studio</span>
        </button>
      </div>
    );
  }

  // Active view states
  const isWorkspacesScreen = currentScreen === 'workspaces';
  const isFoldersScreen = currentScreen === 'folders';
  const activeViewMode = isWorkspacesScreen ? workspaceViewMode : isFoldersScreen ? folderViewMode : null;
  const setViewMode = isWorkspacesScreen ? setWorkspaceViewMode : isFoldersScreen ? setFolderViewMode : null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        zIndex: 9999,
      }}
      className="w-[230px] p-2.5 bg-surface/85 border border-border/30 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col gap-3 text-text animate-in zoom-in-95 duration-100 select-none font-sailec font-light animate-fade-in"
    >
      {/* SECTION 1: CREATION CONTROLS (Only Workspace/Folders screens) */}
      {(isWorkspacesScreen || isFoldersScreen) && (
        <div className="flex flex-col gap-1">
          <div className="px-2.5 py-0.5 text-[8px] font-mono tracking-[0.25em] text-text-muted/40 uppercase select-none">
            Create
          </div>
          
          {isWorkspacesScreen && (
            <>
              <button
                onClick={() => handleTriggerCreateWorkspace('workspace')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <Plus className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Workspace</span>
              </button>
              <button
                onClick={() => handleTriggerCreateWorkspace('group')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <Grid className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Board Group</span>
              </button>
            </>
          )}

          {isFoldersScreen && (
            <>
              <button
                onClick={() => handleTriggerCreateFolderItem('folder')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <FolderPlus className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => handleTriggerCreateFolderItem('canvas')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <Palette className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Canvas Board</span>
              </button>
              <button
                onClick={() => handleTriggerCreateFolderItem('note')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <FilePlus className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Document</span>
              </button>
              <button
                onClick={() => handleTriggerCreateFolderItem('group')}
                className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
              >
                <Grid className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
                <span>New Board Group</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* SECTION 2: VIEW MODES Switcher (Only Workspace/Folders screens) */}
      {(isWorkspacesScreen || isFoldersScreen) && activeViewMode && setViewMode && (
        <>
          <div className="h-[1px] bg-border/20 my-0.5 mx-2" />
          <div className="flex flex-col gap-1">
            <div className="px-2.5 py-0.5 text-[8px] font-mono tracking-[0.25em] text-text-muted/40 uppercase select-none">
              View
            </div>

            {[
              { id: 'dashboard', name: 'Dashboard Layout', icon: LayoutGrid },
              { id: 'board', name: 'Infinite Board', icon: Grid },
              { id: 'grid', name: 'Grid Layout', icon: LayoutGrid },
              { id: 'list', name: 'List Layout', icon: ListIcon }
            ].map(mode => {
              const isActive = activeViewMode === mode.id;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setViewMode(mode.id);
                    onClose();
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide rounded-md transition-all cursor-pointer flex items-center justify-between border-none ${
                    isActive 
                      ? 'text-accent bg-surface/30' 
                      : 'text-text/70 hover:text-text hover:bg-surface/20 bg-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 stroke-[1.5] opacity-80" />
                    {mode.name}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 stroke-[1.5] text-accent" />}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* SECTION 3: STUDIO MANAGEMENT (Available always) */}
      <>
        <div className="h-[1px] bg-border/20 my-0.5 mx-2" />
        <div className="flex flex-col gap-1">
          <div className="px-2.5 py-0.5 text-[8px] font-mono tracking-[0.25em] text-text-muted/40 uppercase select-none">
            Control
          </div>

          <button
            onClick={handleSync}
            className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center justify-between text-text/80 hover:text-text bg-transparent border-none"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
              <span>Sync Database</span>
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500/80 animate-pulse' : 'bg-accent/80'}`} />
          </button>

          {isSupabaseConfigured && (
            <button
              onClick={() => {
                toggleSupabaseSync();
                onClose();
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center justify-between text-text/80 hover:text-text bg-transparent border-none"
            >
              <span className="flex items-center gap-2">
                {isSupabaseConnected ? <ToggleRight className="w-4 h-4 stroke-[1.5] text-emerald-400" /> : <ToggleLeft className="w-4 h-4 stroke-[1.5] text-text-dim" />}
                <span>Supabase Sync</span>
              </span>
              <span className="text-[9px] text-text-muted/80 font-mono font-light">{isSupabaseConnected ? 'ON' : 'OFF'}</span>
            </button>
          )}

          <button
            onClick={handleOpenSettings}
            className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center gap-2 text-text/80 hover:text-text bg-transparent border-none"
          >
            <Settings className="w-3.5 h-3.5 stroke-[1.5] text-text-muted/80" />
            <span>Preferences</span>
          </button>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 text-xs font-sailec font-light tracking-wide hover:bg-red-500/5 text-red-400 hover:text-red-500 rounded-md transition-all cursor-pointer flex items-center gap-2 bg-transparent border-none"
          >
            <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Lock Workspace</span>
          </button>
        </div>
      </>

      {/* SECTION 4: TEXT FORMATTING OPTIONS (Only inside Notes editor) */}
      {currentScreen === 'note' && (
        <>
          <div className="h-[1px] bg-border/20 my-0.5 mx-2" />
          <div className="flex flex-col gap-3">
            <div className="px-2.5 py-0.5 text-[8px] font-mono tracking-[0.25em] text-text-muted/40 uppercase select-none">
              Format
            </div>

            {/* Styles */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted/40 uppercase block px-2.5">Style</span>
              <div className="grid grid-cols-4 gap-1 px-1">
                {[
                  { icon: Bold, format: 'bold', value: true, title: 'Bold' },
                  { icon: Italic, format: 'italic', value: true, title: 'Italic' },
                  { icon: Underline, format: 'underline', value: true, title: 'Underline' },
                  { icon: Strikethrough, format: 'strike', value: true, title: 'Strikethrough' }
                ].map((s, idx) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleFormat(s.format, s.value)}
                      className="p-1.5 hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center justify-center text-text/70 hover:text-text bg-transparent border-none"
                      title={s.title}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Headings */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted/40 uppercase block px-2.5">Headings</span>
              <div className="grid grid-cols-4 gap-1 px-1">
                {[
                  { label: 'H1', value: 1, title: 'Heading 1' },
                  { label: 'H2', value: 2, title: 'Heading 2' },
                  { label: 'H3', value: 3, title: 'Heading 3' },
                  { label: 'Normal', value: false, title: 'Paragraph' }
                ].map(h => (
                  <button
                    key={h.title}
                    onClick={() => handleFormat('header', h.value)}
                    className="py-1 hover:bg-surface/30 rounded-md text-[9px] font-mono text-center cursor-pointer transition-all text-text/70 hover:text-text bg-transparent border-none"
                    title={h.title}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted/40 uppercase block px-2.5">Fonts</span>
              <div className="grid grid-cols-3 gap-1 px-1 text-[9px] font-mono">
                {[
                  { id: false, name: 'Sailec', title: 'Sailec (Default)' },
                  { id: 'georgia', name: 'Georgia', title: 'Georgia' },
                  { id: 'sofia', name: 'Sofia', title: 'Sofia Pro' },
                  { id: 'slabo', name: 'Slabo', title: 'Slabo 13px' },
                  { id: 'roboto-slab', name: 'Roboto', title: 'Roboto Slab' },
                  { id: 'inconsolata', name: 'Inco', title: 'Inconsolata' }
                ].map(f => (
                  <button
                    key={f.title}
                    onClick={() => handleFormat('font', f.id)}
                    className="py-1 hover:bg-surface/30 rounded-md text-center cursor-pointer transition-all text-text/70 hover:text-text bg-transparent border-none"
                    title={f.title}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted/40 uppercase block px-2.5">Alignment</span>
              <div className="grid grid-cols-4 gap-1 px-1">
                {[
                  { icon: AlignLeft, value: false, title: 'Align Left' },
                  { icon: AlignCenter, value: 'center', title: 'Align Center' },
                  { icon: AlignRight, value: 'right', title: 'Align Right' },
                  { icon: AlignJustify, value: 'justify', title: 'Align Justify' }
                ].map((a, idx) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleFormat('align', a.value)}
                      className="p-1.5 hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center justify-center text-text/70 hover:text-text bg-transparent border-none"
                      title={a.title}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lists & Code */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-mono tracking-[0.2em] text-text-muted/40 uppercase block px-2.5">Formatting</span>
              <div className="grid grid-cols-3 gap-1 px-1">
                {[
                  { icon: ListIcon, format: 'list', value: 'bullet', title: 'Bullet List' },
                  { icon: ListOrdered, format: 'list', value: 'ordered', title: 'Numbered List' },
                  { icon: Code, format: 'code-block', value: true, title: 'Code Block' }
                ].map((l, idx) => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleFormat(l.format, l.value)}
                      className="p-1.5 hover:bg-surface/30 rounded-md transition-all cursor-pointer flex items-center justify-center text-text/70 hover:text-text bg-transparent border-none"
                      title={l.title}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear Formatting */}
            <div className="pt-1 px-1">
              <button
                onClick={() => handleFormat('clean', null)}
                className="w-full py-1.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-md text-[10px] font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border-none"
                title="Clear Formatting"
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Clear Formatting</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
