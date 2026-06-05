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
    getPluginData
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

  // Active Context ID
  const activeContextId = currentFolderId ? currentFolderId : currentWorkspaceId;

  // Load layout positions
  const savedLayout = getPluginData('spatial-layout', activeContextId, 'positions') || {};
  const itemPositions = savedLayout.positions || {};
  const positionsRef = useRef(itemPositions);

  useEffect(() => {
    positionsRef.current = itemPositions;
  }, [JSON.stringify(itemPositions)]);

  useEffect(() => {
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

  // Get position of items
  const getItemPos = (itemId, index) => {
    if (positionsRef.current[itemId]) {
      return positionsRef.current[itemId];
    }
    const cols = 2;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 100 + col * 340, y: 150 + row * 180 };
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
  };

  // Card Pointer Down (Dragging)
  const handleCardPointerDown = (e, itemId, index, element) => {
    e.preventDefault();
    draggedIdRef.current = itemId;
    draggedElementRef.current = element;
    hasMovedRef.current = false;

    element.setPointerCapture(e.pointerId);

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

      if (hasMovedRef.current) {
        const finalX = parseInt(element.style.left, 10);
        const finalY = parseInt(element.style.top, 10);
        
        positionsRef.current = {
          ...positionsRef.current,
          [id]: { x: finalX, y: finalY }
        };
        await updateItemPosition(activeContextId, id, finalX, finalY);
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
      await updateItemPosition(currentWorkspaceId, folder.id, creationPos.x, creationPos.y);
    } else if (type === 'canvas') {
      const canvas = await createCanvas(currentWorkspaceId, null, creationName.trim(), true, {});
      await updateItemPosition(currentWorkspaceId, canvas.id, creationPos.x, creationPos.y);
      navigateToCanvas(canvas.id);
    } else if (type === 'note') {
      const note = await createNote(currentWorkspaceId, currentFolderId, creationName.trim());
      await updateItemPosition(currentFolderId, note.id, creationPos.x, creationPos.y);
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

  const handleDelete = async (e, id, type) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'folder') {
        await deleteFolder(id);
      } else if (type === 'canvas') {
        await deleteCanvas(id);
      } else if (type === 'note') {
        await deleteNote(id);
      }
    }
  };

  const handleCreateHUD = (type) => {
    const boardEl = boardRef.current;
    const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
    const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
    setCreationPos({ x: x / zoomRef.current, y: y / zoomRef.current });
    setCreationType(type);
    setCreationName('');
  };

  // Combine items for workspace level
  const workspaceItems = [
    ...workspaceFolders.map(f => ({ ...f, type: 'folder' })),
    ...workspaceCanvases.map(c => ({ ...c, type: 'canvas', name: c.title }))
  ];

  const currentItems = currentFolderId === null ? workspaceItems : folderNotes.map(n => ({ ...n, type: 'note', name: n.title }));

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
              {currentFolderId === null ? 'Workspace board' : `${currentFolder.name} board`}
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
          const pos = getItemPos(item.id, index);

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                pointerEvents: 'auto'
              }}
              onPointerDown={(e) => {
                const cardEl = e.currentTarget;
                if (!isEditing) handleCardPointerDown(e, item.id, index, cardEl);
              }}
              onClick={(e) => handleCardClick(e, item)}
              className={`group w-72 p-5 bg-surface/75 border-l-2 border-y border-r border-y-border border-r-border rounded-r-lg rounded-l-xs shadow-md hover:shadow-[0_0_20px_rgba(2,132,199,0.12)] transition-all duration-150 select-none flex flex-col justify-between h-36 cursor-pointer ${
                item.type === 'canvas' 
                  ? 'border-l-accent' 
                  : item.type === 'folder'
                  ? 'border-l-yellow-500'
                  : 'border-l-text-muted'
              }`}
            >
              <div className="flex-1 min-w-0">
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] text-text-muted tracking-widest">
                        {item.type.toUpperCase()} // {(index + 1).toString().padStart(2, '0')}
                      </span>
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

                    <h3 className="font-bold text-text text-lg leading-snug truncate mt-2 group-hover:text-accent transition-colors duration-150">
                      {item.name || 'Untitled'}
                    </h3>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center justify-between mt-4 border-t border-border/30 pt-3">
                  <span className="font-mono text-[8px] text-text-muted">
                    LOC // {pos.x}, {pos.y}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider">
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
          );
        })}
      </div>

      {/* Creation Node Overlay */}
      {(isCreatingMenu || creationType) && renderCreationNode()}

      {/* Empty State */}
      {currentItems.length === 0 && !isCreatingMenu && !creationType && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <p className="text-xs text-text-muted uppercase tracking-wider max-w-sm leading-relaxed">
            The board is clean. Double-click anywhere or click the buttons above to create folders, drawings, or notes.
          </p>
        </div>
      )}
    </div>
  );
}
