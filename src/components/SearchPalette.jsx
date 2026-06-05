import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function SearchPalette({ isOpen, onClose }) {
  const { workspaces, folders, notes, canvases } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);



  // Build searchable items list safely
  const safeFolders = Array.isArray(folders) ? folders.filter(f => f && typeof f === 'object') : [];
  const safeNotes = Array.isArray(notes) ? notes.filter(n => n && typeof n === 'object') : [];
  const safeCanvases = Array.isArray(canvases) ? canvases.filter(c => c && typeof c === 'object') : [];

  const allItems = [
    ...safeFolders.map(f => ({ ...f, type: 'folder', name: f.name || 'Untitled Folder' })),
    ...safeNotes.map(n => ({ ...n, type: 'note', name: n.title || 'Untitled Note' })),
    ...safeCanvases.filter(c => c.is_standalone).map(c => ({ ...c, type: 'canvas', name: c.title || 'Untitled Canvas' }))
  ];

  // Filter items based on query
  const filteredItems = query.trim() === '' 
    ? allItems.slice(0, 8) // Show first 8 items if query is empty
    : allItems.filter(item => 
        (item.name || '').toLowerCase().includes(query.toLowerCase())
      );

  const getPath = (item) => {
    if (!item) return '';
    const wsList = Array.isArray(workspaces) ? workspaces : [];
    const fList = Array.isArray(folders) ? folders : [];

    const ws = wsList.find(w => w && w.id === item.workspace_id);
    const wsName = ws ? (ws.name || 'Untitled Workspace') : 'Unknown Workspace';
    
    if (item.type === 'note') {
      const folder = fList.find(f => f && f.id === item.folder_id);
      return folder ? `${wsName} > ${folder.name || 'Untitled Folder'}` : wsName;
    }
    return wsName;
  };

  const handleSelect = (item) => {
    if (item.type === 'folder') {
      useStore.setState({
        currentWorkspaceId: item.workspace_id,
        currentFolderId: item.id,
        currentNoteId: null,
        currentCanvasId: null,
        currentScreen: 'folders'
      });
    } else if (item.type === 'canvas') {
      useStore.setState({
        currentWorkspaceId: item.workspace_id,
        currentFolderId: null,
        currentNoteId: null,
        currentCanvasId: item.id,
        currentScreen: 'canvas'
      });
    } else if (item.type === 'note') {
      useStore.setState({
        currentWorkspaceId: item.workspace_id,
        currentFolderId: item.folder_id,
        currentNoteId: item.id,
        currentCanvasId: null,
        currentScreen: 'note'
      });
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  };

  // Keep selected item visible in scroll container safely
  useEffect(() => {
    const selectedEl = listRef.current?.children[selectedIndex];
    if (selectedEl && typeof selectedEl.scrollIntoView === 'function') {
      try {
        selectedEl.scrollIntoView({ block: 'nearest' });
      } catch (err) {
        console.warn('scrollIntoView failed:', err);
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50 font-sans p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="border-b border-border p-4 flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest select-none">SEARCH</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search notes, folders, and drawings..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text text-sm outline-none placeholder:text-text-muted border-none p-0 focus:ring-0"
          />
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto max-h-[300px] p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs uppercase tracking-wider select-none">
              No matching elements found
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer select-none transition-all duration-100 ${
                    isSelected ? 'bg-accent/10 border border-accent/30' : 'border border-transparent hover:bg-bg/50'
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className={`font-bold text-xs truncate transition-colors duration-100 ${
                      isSelected ? 'text-accent' : 'text-text'
                    }`}>
                      {item.name || 'Untitled'}
                    </span>
                    <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold truncate">
                      {getPath(item)}
                    </span>
                  </div>

                  <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border ${
                    item.type === 'canvas' 
                      ? 'text-accent border-accent/20 bg-accent/5' 
                      : item.type === 'folder'
                      ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5'
                      : 'text-text-muted border-border bg-bg'
                  }`}>
                    {item.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Help footer */}
        <div className="bg-bg border-t border-border px-4 py-2.5 flex items-center justify-between text-[8px] uppercase tracking-wider text-text-muted font-bold select-none">
          <span>Arrows &darr;&uarr; to Navigate · Enter to Open</span>
          <span>Esc to Close</span>
        </div>
      </div>
    </div>
  );
}
