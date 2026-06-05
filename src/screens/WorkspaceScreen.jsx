import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export default function WorkspaceScreen() {
  const {
    workspaces,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    navigateToWorkspace,
    updateItemPosition,
    getPluginData
  } = useStore();

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 150, y: 150 });

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const boardRef = useRef(null);
  const contentRef = useRef(null);

  // Dragging & Panning Refs (avoiding React state re-renders for 60 FPS fluid motion)
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  const draggedIdRef = useRef(null);
  const draggedElementRef = useRef(null);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false); // To separate Click from Drag

  // Load layout positions
  const savedLayout = getPluginData('spatial-layout', 'workspaces-root', 'positions') || {};
  const itemPositions = savedLayout.positions || {};
  const positionsRef = useRef(itemPositions);

  useEffect(() => {
    positionsRef.current = itemPositions;
  }, [JSON.stringify(itemPositions)]);

  // Get position of workspace
  const getWorkspacePos = (wsId, index) => {
    if (positionsRef.current[wsId]) {
      return positionsRef.current[wsId];
    }
    const cols = 2;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 100 + col * 340, y: 150 + row * 180 };
  };

  // Keyboard shortcut 'n' to spawn new workspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCreating || editingId) return;
      if (e.key === 'n' || e.key === 'N') {
        const activeEl = document.activeElement;
        const isFormInput = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable
        );
        if (!isFormInput) {
          e.preventDefault();
          // Spawn at center of screen relative to pan offset
          const boardEl = boardRef.current;
          const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
          const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
          setCreationPos({ x, y });
          setIsCreating(true);
          setNewName('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingId]);

  // Pointer Down on Board (Panning)
  const handleBoardPointerDown = (e) => {
    if (e.target !== boardRef.current) return;
    isPanningRef.current = true;
    boardRef.current.setPointerCapture(e.pointerId);
    panStartRef.current = {
      x: e.clientX - panOffsetRef.current.x,
      y: e.clientY - panOffsetRef.current.y
    };
  };

  // Pointer Down on Card (Dragging)
  const handleCardPointerDown = (e, wsId, index, element) => {
    e.preventDefault();
    draggedIdRef.current = wsId;
    draggedElementRef.current = element;
    hasMovedRef.current = false;
    
    // Capture pointer to track dragging outside bounds
    element.setPointerCapture(e.pointerId);

    const pos = getWorkspacePos(wsId, index);
    dragStartPosRef.current = pos;
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  // Shared Pointer Move Handler
  const handlePointerMove = (e) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panOffsetRef.current = { x: dx, y: dy };
      
      // Update DOM transform directly for zero lag
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    } else if (draggedIdRef.current && draggedElementRef.current) {
      const dx = e.clientX - dragStartMouseRef.current.x;
      const dy = e.clientY - dragStartMouseRef.current.y;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        const newX = Math.max(10, dragStartPosRef.current.x + dx);
        const newY = Math.max(10, dragStartPosRef.current.y + dy);
        
        // Update card coordinates in real-time in the DOM
        draggedElementRef.current.style.left = `${newX}px`;
        draggedElementRef.current.style.top = `${newY}px`;
      }
    }
  };

  // Shared Pointer Up Handler
  const handlePointerUp = async (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      if (boardRef.current) {
        boardRef.current.releasePointerCapture(e.pointerId);
      }
      setPanOffset(panOffsetRef.current); // Sync to React state
    } else if (draggedIdRef.current && draggedElementRef.current) {
      const id = draggedIdRef.current;
      const element = draggedElementRef.current;
      
      draggedIdRef.current = null;
      draggedElementRef.current = null;
      element.releasePointerCapture(e.pointerId);

      if (hasMovedRef.current) {
        const finalX = parseInt(element.style.left, 10);
        const finalY = parseInt(element.style.top, 10);
        
        // Save final position in database/store
        positionsRef.current = {
          ...positionsRef.current,
          [id]: { x: finalX, y: finalY }
        };
        await updateItemPosition('workspaces-root', id, finalX, finalY);
      }
    }
  };

  const handleCardClick = (e, wsId) => {
    if (hasMovedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigateToWorkspace(wsId);
  };

  const handleBoardDoubleClick = (e) => {
    if (e.target !== boardRef.current || isCreating) return;
    const rect = boardRef.current.getBoundingClientRect();
    
    const x = e.clientX - rect.left - panOffsetRef.current.x;
    const y = e.clientY - rect.top - panOffsetRef.current.y;
    
    setCreationPos({ x, y });
    setIsCreating(true);
    setNewName('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setIsCreating(false);
      return;
    }
    const newWs = await createWorkspace(newName.trim(), '');
    await updateItemPosition('workspaces-root', newWs.id, creationPos.x, creationPos.y);
    setIsCreating(false);
    setNewName('');
  };

  const handleStartRename = (e, id, name) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveRename = async (e, id) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    await renameWorkspace(id, editingName.trim());
    setEditingId(null);
  };

  const handleCreateButtonHUD = () => {
    const boardEl = boardRef.current;
    const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
    const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
    setCreationPos({ x, y });
    setIsCreating(true);
    setNewName('');
  };

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
        touchAction: 'none' // Prevent browser scrolling
      }}
      className="w-full h-[calc(100vh-68px)] bg-bg relative overflow-hidden select-none font-sans cursor-grab active:cursor-grabbing"
    >
      {/* Top HUD Controls (Zero Friction Buttons) */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-surface/85 border border-border px-3.5 py-2 rounded-lg backdrop-blur-md flex flex-col gap-0.5">
          <h1 className="text-[11px] font-bold uppercase tracking-wider text-text">Workspace Board</h1>
          <p className="text-[9px] text-text-muted uppercase font-semibold">
            Double-click board or press 'N' to create · Drag background to pan
          </p>
        </div>

        <button
          onClick={handleCreateButtonHUD}
          className="pointer-events-auto py-2 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded shadow-md transition-all duration-150 cursor-pointer"
        >
          Create Workspace
        </button>
      </div>

      {/* Spatial Board Content Container */}
      <div 
        ref={contentRef}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }}
      >
        {/* Spatial Workspace Cards */}
        {workspaces.map((ws, index) => {
          const isEditing = editingId === ws.id;
          const pos = getWorkspacePos(ws.id, index);

          return (
            <div
              key={ws.id}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                pointerEvents: 'auto'
              }}
              onPointerDown={(e) => {
                const cardEl = e.currentTarget;
                if (!isEditing) handleCardPointerDown(e, ws.id, index, cardEl);
              }}
              onClick={(e) => handleCardClick(e, ws.id)}
              className="group w-72 p-5 bg-surface border border-border hover:border-accent/40 rounded-lg shadow-md hover:shadow-xl transition-[border-color,box-shadow,background-color] duration-150 select-none flex flex-col justify-between h-36 cursor-pointer"
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
                    <button onClick={(e) => handleSaveRename(e, ws.id)} className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded uppercase cursor-pointer">
                      Save
                    </button>
                    <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-[10px] rounded uppercase hover:bg-bg cursor-pointer">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-text text-base leading-snug truncate group-hover:text-accent transition-colors duration-100">
                      {ws.name}
                    </h3>
                    <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold block mt-1">
                      Added {new Date(ws.created_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-4 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider mt-4">
                  <button
                    onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                    className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                  >
                    Rename
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, ws.id)}
                    className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Creation form mounted spatial-ly */}
      {isCreating && (
        <div 
          style={{ 
            position: 'absolute',
            left: creationPos.x + panOffset.x,
            top: creationPos.y + panOffset.y,
            zIndex: 100
          }}
          className="p-4 bg-surface border border-accent rounded-lg shadow-2xl w-64 animate-in zoom-in-95 duration-100"
        >
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-2">
            <span className="text-[9px] uppercase tracking-wider font-bold text-accent">New Workspace</span>
            <input
              type="text"
              placeholder="Name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-bg border border-border text-text text-xs rounded p-2 outline-none focus:border-accent w-full font-sans"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
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
        </div>
      )}

      {/* Empty Board Placeholder */}
      {workspaces.length === 0 && !isCreating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <p className="text-xs text-text-muted uppercase tracking-wider max-w-sm leading-relaxed">
            The board is clean. Double-click anywhere or click the button above to create your first workspace.
          </p>
        </div>
      )}
    </div>
  );
}
