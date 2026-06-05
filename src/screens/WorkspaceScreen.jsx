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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggedId, setDraggedId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 0, y: 0 });

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const boardRef = useRef(null);

  // Load layout positions
  const savedLayout = getPluginData('spatial-layout', 'workspaces-root', 'positions') || {};
  const itemPositions = savedLayout.positions || {};

  // Dragging states
  const [activePositions, setActivePositions] = useState({});

  // Sync state positions with database/localstore positions
  useEffect(() => {
    setActivePositions(itemPositions);
  }, [pluginDataHash(itemPositions)]);

  // Simple hash function to watch for changes in positions object
  function pluginDataHash(obj) {
    return JSON.stringify(obj || {});
  }

  // Get position of workspace
  const getWorkspacePos = (wsId, index) => {
    if (activePositions[wsId]) {
      return activePositions[wsId];
    }
    // Calculate default grid position if not positioned
    const cols = 2;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 100 + col * 340, y: 150 + row * 180 };
  };

  // Background pointer handlers for Panning
  const handleBoardPointerDown = (e) => {
    // Only pan if clicking direct background or boardRef
    if (e.target !== boardRef.current) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  // Card pointer handlers for Dragging
  const handleCardPointerDown = (e, wsId, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedId(wsId);
    
    const pos = getWorkspacePos(wsId, index);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  // General Pointer Move
  const handlePointerMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedId) {
      const newX = Math.max(20, e.clientX - dragOffset.x);
      const newY = Math.max(20, e.clientY - dragOffset.y);
      
      // Update local layout state in real-time
      setActivePositions(prev => ({
        ...prev,
        [draggedId]: { x: newX, y: newY }
      }));
    }
  };

  // General Pointer Up
  const handlePointerUp = async (e) => {
    if (isPanning) {
      setIsPanning(false);
    } else if (draggedId) {
      const pos = activePositions[draggedId];
      if (pos) {
        await updateItemPosition('workspaces-root', draggedId, pos.x, pos.y);
      }
      setDraggedId(null);
    }
  };

  // Double Click Board to Create Workspace
  const handleBoardDoubleClick = (e) => {
    if (e.target !== boardRef.current || isCreating) return;
    const rect = boardRef.current.getBoundingClientRect();
    
    // Compute creation coordinates adjusted for panning offset
    const x = e.clientX - rect.left - panOffset.x;
    const y = e.clientY - rect.top - panOffset.y;
    
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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workspace and all its contents?')) {
      await deleteWorkspace(id);
    }
  };

  return (
    <div 
      ref={boardRef}
      onPointerDown={handleBoardPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleBoardDoubleClick}
      style={{ 
        backgroundImage: 'radial-gradient(#2E2D31 1.5px, transparent 1.5px)', 
        backgroundSize: '32px 32px',
        cursor: isPanning ? 'grabbing' : draggedId ? 'grabbing' : 'grab'
      }}
      className="w-full h-[calc(100vh-68px)] bg-bg relative overflow-hidden select-none font-sans"
    >
      {/* HUD Info banner */}
      <div className="absolute top-4 left-6 bg-surface/80 border border-border px-3.5 py-2 rounded-lg backdrop-blur-md pointer-events-none z-10 flex flex-col gap-0.5">
        <h1 className="text-[11px] font-bold uppercase tracking-wider text-text">Workspace Board</h1>
        <p className="text-[9px] text-text-muted uppercase font-semibold">
          Double-click anywhere to create · Drag cards to arrange · Drag empty space to pan
        </p>
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
              className="bg-bg border border-border text-text text-xs rounded p-2 outline-none focus:border-accent w-full"
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

      {/* Spatial Workspace Cards */}
      {workspaces.map((ws, index) => {
        const isEditing = editingId === ws.id;
        const pos = getWorkspacePos(ws.id, index);

        return (
          <div
            key={ws.id}
            style={{
              position: 'absolute',
              left: `${pos.x + panOffset.x}px`,
              top: `${pos.y + panOffset.y}px`,
              zIndex: draggedId === ws.id ? 50 : 10
            }}
            onPointerDown={(e) => !isEditing && handleCardPointerDown(e, ws.id, index)}
            onClick={() => !isEditing && draggedId === null && navigateToWorkspace(ws.id)}
            className={`group w-72 p-5 bg-surface border ${
              draggedId === ws.id ? 'border-accent shadow-2xl scale-[1.02]' : 'border-border hover:border-accent/40'
            } rounded-lg transition-all duration-150 ease-out select-none flex flex-col justify-between h-36`}
          >
            {/* Card Content */}
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

            {/* Hover Actions (Text links) */}
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

      {/* Empty Board Placeholder */}
      {workspaces.length === 0 && !isCreating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <p className="text-xs text-text-muted uppercase tracking-wider max-w-sm leading-relaxed">
            The board is clean. Double-click anywhere to create your first workspace.
          </p>
        </div>
      )}
    </div>
  );
}
