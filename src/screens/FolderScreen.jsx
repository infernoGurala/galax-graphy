import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function FolderScreen() {
  const {
    currentWorkspaceId,
    currentFolderId,
    folders,
    notes,
    canvases,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    createCanvas,
    renameCanvas,
    deleteCanvas,
    deleteNote,
    renameNote,
    navigateToFolder,
    navigateToCanvas,
    navigateToNote,
    updateItemPosition,
    getPluginData,
    showConfirm
  } = useStore();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [creationType, setCreationType] = useState('');
  const [creationName, setCreationName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 150, y: 150 });

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('');

  const boardRef = useRef(null);
  const contentRef = useRef(null);

  // Dragging & Panning Refs (avoiding React state re-renders for fluid 60 FPS motion)
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);

  const draggedIdRef = useRef(null);
  const draggedElementRef = useRef(null);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const syncTimeoutRef = useRef(null);

  // Filter items
  const workspaceFolders = folders.filter(f => f.workspace_id === currentWorkspaceId);
  const workspaceCanvases = canvases.filter(c => c.workspace_id === currentWorkspaceId && c.is_standalone);
  
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const folderNotes = notes.filter(n => n.folder_id === currentFolderId);

  // Combine items for workspace level
  const workspaceItems = [
    ...workspaceFolders.map(f => ({ ...f, type: 'folder' })),
    ...workspaceCanvases.map(c => ({ ...c, type: 'canvas', name: c.title }))
  ];

  const currentItems = currentFolderId === null ? workspaceItems : folderNotes.map(n => ({ ...n, type: 'note', name: n.title }));

  // Active Context ID
  const activeContextId = currentFolderId ? currentFolderId : currentWorkspaceId;

  // Keep item positions transient (in-memory) for the active session
  const positionsRef = useRef({});

  // Spotlight search states & screen width tracking
  const [searchQuery, setSearchQuery] = useState('');
  const [boardWidth, setBoardWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Spotlight global typing listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable ||
        activeEl.closest('.ProseMirror')
      );
      if (isInput) return;

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        setSearchQuery('');
        return;
      }

      if (e.key === 'Enter') {
        if (searchQuery) {
          const matches = currentItems.filter(item =>
            (item.name || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (matches.length === 1) {
            const match = matches[0];
            if (match.type === 'folder') {
              navigateToFolder(match.id);
            } else if (match.type === 'canvas') {
              navigateToCanvas(match.id);
            } else if (match.type === 'note') {
              navigateToNote(match.id);
            }
            setSearchQuery('');
          }
        }
        return;
      }

      if (e.key === 'Backspace') {
        setSearchQuery(prev => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1 && !e.repeat) {
        if (e.key === ' ' && !searchQuery) return;
        e.preventDefault();
        setSearchQuery(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, currentItems, navigateToFolder, navigateToCanvas, navigateToNote]);

  useEffect(() => {
    // Reset transient positions when activeContextId changes (switching folders/workspace view)
    positionsRef.current = {};
    setSearchQuery('');

    // Reset panning and zoom on context change
    setPanOffset({ x: 0, y: 0 });
    setZoom(1);
    panOffsetRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate(0px, 0px) scale(1)`;
    }
  }, [activeContextId]);

  // Keyboard shortcut 'n' to trigger creation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCreatingMenu || creationType || editingId) return;
      if (e.key === 'n' || e.key === 'N') {
        const activeEl = document.activeElement;
        const isFormInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable
        );
        if (!isFormInput) {
          e.preventDefault();
          const boardEl = boardRef.current;
          const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
          const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
          setCreationPos({ x: x / zoomRef.current, y: y / zoomRef.current });
          if (currentFolderId === null) {
            setIsCreatingMenu(true);
          } else {
            setCreationType('note');
            setCreationName('');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingMenu, creationType, editingId, currentFolderId]);

  // Bind Non-Passive Wheel Event for Zooming (keeps mouse cursor centered during zoom)
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomIntensity = 0.08;
      const rect = boardEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Current mouse position on board relative space
      const boardX = (mouseX - panOffsetRef.current.x) / zoomRef.current;
      const boardY = (mouseY - panOffsetRef.current.y) / zoomRef.current;

      const delta = -e.deltaY;
      let newZoom = zoomRef.current + (delta > 0 ? 1 : -1) * zoomIntensity;
      newZoom = Math.min(Math.max(0.25, newZoom), 2.5); // Zoom boundary [0.25, 2.5]

      const newPanX = mouseX - boardX * newZoom;
      const newPanY = mouseY - boardY * newZoom;

      panOffsetRef.current = { x: newPanX, y: newPanY };
      zoomRef.current = newZoom;

      // Apply style transform in DOM directly
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${newPanX}px, ${newPanY}px) scale(${newZoom})`;
      }

      // Debounced State Sync
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        setPanOffset(panOffsetRef.current);
        setZoom(zoomRef.current);
      }, 100);
    };

    boardEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      boardEl.removeEventListener('wheel', handleWheel);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  // Get position of items (dynamically centering grid and sliding matched cards)
  const getItemPos = (itemId, index, filteredItems = currentItems) => {
    if (positionsRef.current[itemId]) {
      return positionsRef.current[itemId];
    }
    const displayIndex = filteredItems.findIndex(item => item.id === itemId);
    const useIndex = displayIndex !== -1 ? displayIndex : index;

    const cols = 2;
    const col = useIndex % cols;
    const row = Math.floor(useIndex / cols);
    
    const cardWidth = 288;
    const gapX = 52;
    const activeCols = Math.min(filteredItems.length, cols);
    const gridWidth = activeCols * cardWidth + (activeCols - 1) * gapX;
    
    const startX = Math.max(100, (boardWidth - (gridWidth || 628)) / 2);
    return { x: startX + col * 340, y: 150 + row * 180 };
  };

  // Background Pointer Down (Panning)
  const handleBoardPointerDown = (e) => {
    if (e.target !== boardRef.current) return;
    isPanningRef.current = true;
    boardRef.current.setPointerCapture(e.pointerId);
    panStartRef.current = {
      x: e.clientX - panOffsetRef.current.x,
      y: e.clientY - panOffsetRef.current.y
    };
    if (searchQuery) setSearchQuery('');
  };

  // Card Pointer Down (Dragging)
  const handleCardPointerDown = (e, itemId, index, element) => {
    e.preventDefault();
    draggedIdRef.current = itemId;
    draggedElementRef.current = element;
    hasMovedRef.current = false;

    element.setPointerCapture(e.pointerId);
    element.classList.add('ring-2', 'ring-accent', 'shadow-[0_0_25px_rgba(2,132,199,0.35)]', 'z-50');

    const pos = getItemPos(itemId, index);
    dragStartPosRef.current = pos;
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panOffsetRef.current = { x: dx, y: dy };
      
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(${zoomRef.current})`;
      }
    } else if (draggedIdRef.current && draggedElementRef.current) {
      const dx = e.clientX - dragStartMouseRef.current.x;
      const dy = e.clientY - dragStartMouseRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        const newX = Math.max(10, dragStartPosRef.current.x + dx / zoomRef.current);
        const newY = Math.max(10, dragStartPosRef.current.y + dy / zoomRef.current);
        
        draggedElementRef.current.style.left = `${newX}px`;
        draggedElementRef.current.style.top = `${newY}px`;
      }
    }
  };

  // Pointer Up
  const handlePointerUp = async (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      if (boardRef.current) {
        boardRef.current.releasePointerCapture(e.pointerId);
      }
      setPanOffset(panOffsetRef.current);
    } else if (draggedIdRef.current && draggedElementRef.current) {
      const id = draggedIdRef.current;
      const element = draggedElementRef.current;
      
      draggedIdRef.current = null;
      draggedElementRef.current = null;
      element.releasePointerCapture(e.pointerId);
      element.classList.remove('ring-2', 'ring-accent', 'shadow-[0_0_25px_rgba(2,132,199,0.35)]', 'z-50');

      if (hasMovedRef.current) {
        const finalX = parseInt(element.style.left, 10);
        const finalY = parseInt(element.style.top, 10);
        
        positionsRef.current = {
          ...positionsRef.current,
          [id]: { x: finalX, y: finalY }
        };
        // Card coordinates are transient (in-session only). Do not persist in backend database.
      }
    }
  };

  const handleCardClick = (e, item) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else if (item.type === 'canvas') {
      navigateToCanvas(item.id);
    } else if (item.type === 'note') {
      navigateToNote(item.id);
    }
  };

  const handleBoardDoubleClick = (e) => {
    if (e.target !== boardRef.current || isCreatingMenu || creationType) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
    const y = (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;
    
    setCreationPos({ x, y });
    
    if (currentFolderId === null) {
      setIsCreatingMenu(true);
    } else {
      setCreationType('note');
      setCreationName('');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!creationName.trim()) {
      setCreationType('');
      return;
    }

    const type = creationType;
    setCreationType('');

    if (type === 'folder') {
      const folder = await createFolder(currentWorkspaceId, creationName.trim(), '');
      // Put new folder in local positionsRef so it shows up at creation position in this session
      positionsRef.current = {
        ...positionsRef.current,
        [folder.id]: { x: creationPos.x, y: creationPos.y }
      };
    } else if (type === 'canvas') {
      const canvas = await createCanvas(currentWorkspaceId, null, creationName.trim(), true, {});
      // Put new canvas in local positionsRef so it shows up at creation position in this session
      positionsRef.current = {
        ...positionsRef.current,
        [canvas.id]: { x: creationPos.x, y: creationPos.y }
      };
      navigateToCanvas(canvas.id);
    } else if (type === 'note') {
      const note = await createNote(currentWorkspaceId, currentFolderId, creationName.trim());
      // Put new note in local positionsRef so it shows up at creation position in this session
      positionsRef.current = {
        ...positionsRef.current,
        [note.id]: { x: creationPos.x, y: creationPos.y }
      };
      navigateToNote(note.id);
    }
    
    setCreationName('');
  };

  const handleStartRename = (e, id, name, type) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
    setEditingType(type);
  };

  const handleSaveRename = async (e, id) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    
    if (editingType === 'folder') {
      await renameFolder(id, editingName.trim());
    } else if (editingType === 'canvas') {
      await renameCanvas(id, editingName.trim());
    } else if (editingType === 'note') {
      await renameNote(id, editingName.trim());
    }
    
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, id, type) => {
    e.stopPropagation();
    showConfirm({
      title: `Delete ${type}`,
      message: `Are you sure you want to permanently delete this ${type}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        if (type === 'folder') {
          await deleteFolder(id);
        } else if (type === 'canvas') {
          await deleteCanvas(id);
        } else if (type === 'note') {
          await deleteNote(id);
        }
      }
    });
  };

  const handleCreateHUD = (type) => {
    const boardEl = boardRef.current;
    const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
    const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
    setCreationPos({ x: x / zoomRef.current, y: y / zoomRef.current });
    setCreationType(type);
    setCreationName('');
  };

  const renderCreationNode = () => (
    <div 
      style={{ 
        position: 'absolute',
        left: creationPos.x * zoom + panOffset.x,
        top: creationPos.y * zoom + panOffset.y,
        zIndex: 100
      }}
      className="p-4 bg-surface border border-accent rounded-lg shadow-2xl w-64 animate-in zoom-in-95 duration-100"
    >
      {isCreatingMenu ? (
        <div className="flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-wider font-bold text-accent">Create Element</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('folder');
              }}
              className="flex-1 py-1.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
            >
              Folder
            </button>
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('canvas');
              }}
              className="flex-1 py-1.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded cursor-pointer transition-colors"
            >
              Canvas
            </button>
          </div>
          <button
            onClick={() => setIsCreatingMenu(false)}
            className="text-[9px] uppercase font-bold text-text-muted hover:text-text tracking-wider text-center mt-1 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-2">
          <span className="text-[9px] uppercase tracking-wider font-bold text-accent">
            New {creationType}
          </span>
          <input
            type="text"
            placeholder="Name..."
            value={creationName}
            onChange={(e) => setCreationName(e.target.value)}
            className="bg-bg border border-border text-text text-xs rounded p-2 outline-none focus:border-accent w-full font-sans"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCreationType('');
            }}
          />
          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setCreationType('')}
              className="px-2 py-1 border border-border text-text-muted text-[10px] uppercase rounded hover:bg-bg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-2 py-1 bg-accent text-white text-[10px] font-bold uppercase rounded cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const matchingItems = searchQuery
    ? currentItems.filter(item => (item.name || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase()))
    : currentItems;

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div 
      ref={boardRef}
      onPointerDown={handleBoardPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleBoardDoubleClick}
      style={{ 
        backgroundImage: 'radial-gradient(#2E2D31 1.5px, transparent 1.5px)', 
        backgroundSize: '32px 32px',
        touchAction: 'none'
      }}
      className="w-full h-[calc(100vh-68px)] bg-bg relative overflow-hidden select-none font-sans cursor-grab active:cursor-grabbing"
    >
      {/* Top HUD Controls */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10 gap-4">
        <div className="bg-surface/85 border border-border px-3.5 py-2 rounded-lg backdrop-blur-md flex items-center gap-4">
          {currentFolderId !== null && (
            <button
              onClick={() => navigateToFolder(null)}
              className="pointer-events-auto text-[10px] text-text-muted hover:text-text font-bold uppercase tracking-wider border border-border hover:bg-surface py-1 px-2.5 rounded transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[11px] font-bold uppercase tracking-wider text-text">
              {currentFolderId === null ? 'Workspace board' : `${currentFolder?.name || 'Folder'} board`}
            </h1>
            <p className="text-[9px] text-text-muted uppercase font-semibold">
              Scroll to Zoom ({zoomPercent}%) · Double-click board or press 'N' to create
            </p>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          {currentFolderId === null ? (
            <>
              <button
                onClick={() => handleCreateHUD('folder')}
                className="py-2 px-3 bg-surface hover:bg-border border border-border text-text text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer"
              >
                New Folder
              </button>
              <button
                onClick={() => handleCreateHUD('canvas')}
                className="py-2 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer"
              >
                New Canvas
              </button>
            </>
          ) : (
            <button
              onClick={() => handleCreateHUD('note')}
              className="py-2 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all cursor-pointer"
            >
              New Note
            </button>
          )}
        </div>
      </div>

      {/* Spatial Board Content Container */}
      <div 
        ref={contentRef}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }}
      >
        {/* Spatial Draggable Cards */}
        {currentItems.map((item, index) => {
          const isEditing = editingId === item.id && editingType === item.type;
          const isSearching = searchQuery.length > 0;
          const isMatched = isSearching && (item.name || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase());
          
          const pos = getItemPos(
            item.id,
            index,
            isMatched ? matchingItems : currentItems
          );

          let cardStyle = {
            position: 'absolute',
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            pointerEvents: isSearching && !isMatched ? 'none' : 'auto',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.4s cubic-bezier(0.25, 1, 0.5, 1), top 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            zIndex: isMatched ? 30 : 10,
          };

          let extraClass = '';
          if (isSearching) {
            if (isMatched) {
              cardStyle.transform = 'scale(1.08) translateY(-10px)';
              cardStyle.opacity = 1;
              extraClass = 'border-accent/80 shadow-[0_20px_50px_rgba(2,132,199,0.35)] ring-2 ring-accent/40';
            } else {
              cardStyle.transform = 'scale(0)';
              cardStyle.opacity = 0;
            }
          }

          return (
            <div
              key={item.id}
              style={cardStyle}
              onPointerDown={(e) => {
                if (e.target.closest('button') || e.target.closest('input')) return;
                const cardEl = e.currentTarget;
                if (!isEditing) handleCardPointerDown(e, item.id, index, cardEl);
              }}
              onClick={(e) => handleCardClick(e, item)}
              className={`group w-72 bg-surface/90 border border-border/80 hover:border-accent/40 rounded-lg shadow-md hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:-translate-y-[2px] transition-[border-color,box-shadow,background-color,transform] duration-200 select-none flex flex-col justify-between h-36 cursor-pointer relative overflow-hidden ${extraClass}`}
            >
              {/* Top Accent Line */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] transition-colors duration-200 ${
                item.type === 'canvas' 
                  ? 'bg-accent/40 group-hover:bg-accent' 
                  : item.type === 'folder'
                  ? 'bg-yellow-500/40 group-hover:bg-yellow-500'
                  : 'bg-text-muted/40 group-hover:bg-text'
              }`} />

              <div className="p-5 pt-6 flex-1 flex flex-col justify-between h-full">
                <div className="min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-bg border border-border text-text text-xs rounded px-2 py-1 w-full outline-none"
                        autoFocus
                      />
                      <button onClick={(e) => handleSaveRename(e, item.id)} className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded uppercase cursor-pointer">
                        Save
                      </button>
                      <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-[10px] rounded uppercase hover:bg-bg cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-text text-lg leading-snug truncate group-hover:text-accent transition-colors duration-150">
                        {item.name || 'Untitled'}
                      </h3>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold block mt-1 ${
                        item.type === 'canvas' ? 'text-accent' : item.type === 'folder' ? 'text-yellow-500' : 'text-text-muted'
                      }`}>
                        {item.type}
                      </span>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">
                      {item.created_at || item.updated_at 
                        ? new Date(item.created_at || item.updated_at).toLocaleDateString() 
                        : 'Recent'}
                    </span>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-200 text-[10px] font-bold uppercase tracking-wider">
                      <button
                        onClick={(e) => handleStartRename(e, item.id, item.name, item.type)}
                        className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id, item.type)}
                        className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Node Overlay */}
      {(isCreatingMenu || creationType) && renderCreationNode()}

      {/* Empty State */}
      {currentItems.length === 0 && !isCreatingMenu && !creationType && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none">
          <div className="w-12 h-12 rounded-2xl bg-surface/60 border border-border flex items-center justify-center mb-4 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          </div>
          <p className="text-xs text-text font-bold uppercase tracking-wider mb-2">This board is empty</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider max-w-xs leading-relaxed">
            Double-click anywhere or press <span className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-[9px] text-text">N</span> to create folders, drawings, or notes.
          </p>
        </div>
      )}
      {/* Spotlight Search HUD Panel */}
      {searchQuery && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface/90 border-2 border-accent/70 px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto">
          <span className="text-accent text-xs font-bold uppercase tracking-wider select-none">SEARCHING FOR:</span>
          <span className="text-text font-bold text-base tracking-wide border-r-2 border-accent/70 pr-1.5 animate-pulse font-mono">
            {searchQuery}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg border border-border px-2 py-0.5 rounded ml-2 select-none">
            {matchingItems.length} match{matchingItems.length !== 1 ? 'es' : ''}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg border border-border px-2 py-0.5 rounded select-none">
            Esc to Clear
          </span>
          {matchingItems.length === 1 && (
            <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded animate-bounce">
              Press Enter to Open
            </span>
          )}
        </div>
      )}
      {/* Shortcuts HUD Panel */}
      <div className="absolute bottom-4 right-6 bg-surface/85 border border-border px-3.5 py-2 rounded-lg backdrop-blur-md flex items-center gap-3 z-10 pointer-events-auto text-[10px] text-text-muted font-bold uppercase tracking-wider select-none shadow-md">
        <span>shortcuts:</span>
        <span className="flex items-center gap-1">
          <span className="bg-bg px-1.5 py-0.5 rounded border border-border font-mono text-[9px] text-text">Ctrl+Space</span>
          <span>Home</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-bg px-1.5 py-0.5 rounded border border-border font-mono text-[9px] text-text">Alt+Space</span>
          <span>Search</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-bg px-1.5 py-0.5 rounded border border-border font-mono text-[9px] text-text">N</span>
          <span>New</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="bg-bg px-1.5 py-0.5 rounded border border-border font-mono text-[9px] text-text">Esc</span>
          <span>Back</span>
        </span>
      </div>
    </div>
  );
}
