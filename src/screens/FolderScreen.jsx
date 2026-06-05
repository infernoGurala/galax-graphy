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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [draggedId, setDraggedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isCreatingMenu, setIsCreatingMenu] = useState(false); // For folders vs canvases selection
  const [creationType, setCreationType] = useState(''); // 'folder', 'canvas', 'note'
  const [creationName, setCreationName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 0, y: 0 });

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState(''); // 'folder', 'canvas', 'note'

  const boardRef = useRef(null);

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

  // Dragging states
  const [activePositions, setActivePositions] = useState({});

  useEffect(() => {
    setActivePositions(itemPositions);
    // Reset panning on context change
    setPanOffset({ x: 0, y: 0 });
  }, [activeContextId, JSON.stringify(itemPositions)]);

  // Get position of items
  const getItemPos = (itemId, index, totalItems = 1) => {
    if (activePositions[itemId]) {
      return activePositions[itemId];
    }
    // Calculate default grid position
    const cols = 2;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 100 + col * 340, y: 150 + row * 180 };
  };

  // Background pointer handlers for Panning
  const handleBoardPointerDown = (e) => {
    if (e.target !== boardRef.current) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  // Card pointer handlers for Dragging
  const handleCardPointerDown = (e, itemId, index) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedId(itemId);
    
    const pos = getItemPos(itemId, index);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    });
  };

  // Pointer Move
  const handlePointerMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggedId) {
      const newX = Math.max(20, e.clientX - dragOffset.x);
      const newY = Math.max(20, e.clientY - dragOffset.y);
      
      setActivePositions(prev => ({
        ...prev,
        [draggedId]: { x: newX, y: newY }
      }));
    }
  };

  // Pointer Up
  const handlePointerUp = async (e) => {
    if (isPanning) {
      setIsPanning(false);
    } else if (draggedId) {
      const pos = activePositions[draggedId];
      if (pos) {
        await updateItemPosition(activeContextId, draggedId, pos.x, pos.y);
      }
      setDraggedId(null);
    }
  };

  // Double Click Board to Create Item
  const handleBoardDoubleClick = (e) => {
    if (e.target !== boardRef.current || isCreatingMenu || creationType) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - panOffset.x;
    const y = e.clientY - rect.top - panOffset.y;
    
    setCreationPos({ x, y });
    
    if (currentFolderId === null) {
      // Prompt user to select Folder vs Canvas
      setIsCreatingMenu(true);
    } else {
      // In folder: always note creation
      setCreationType('note');
      setCreationName('');
    }
  };

  // Create Submission Handlers
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

  const renderCreationNode = () => (
    <div 
      style={{ 
        position: 'absolute',
        left: creationPos.x + panOffset.x,
        top: creationPos.y + panOffset.y,
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
            className="bg-bg border border-border text-text text-xs rounded p-2 outline-none focus:border-accent w-full"
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

  // Combine items for workspace level
  const workspaceItems = [
    ...workspaceFolders.map(f => ({ ...f, type: 'folder' })),
    ...workspaceCanvases.map(c => ({ ...c, type: 'canvas', name: c.title }))
  ];

  const currentItems = currentFolderId === null ? workspaceItems : folderNotes.map(n => ({ ...n, type: 'note', name: n.title }));

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
      {/* HUD Info Banner */}
      <div className="absolute top-4 left-6 bg-surface/80 border border-border px-3.5 py-2 rounded-lg backdrop-blur-md pointer-events-none z-10 flex items-center gap-4">
        {currentFolderId !== null && (
          <button
            onClick={() => navigateToFolder(null)}
            className="text-[10px] text-text-muted hover:text-text font-bold uppercase tracking-wider border border-border hover:bg-surface py-1 px-2.5 rounded transition-colors pointer-events-auto cursor-pointer"
          >
            &larr; Back
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[11px] font-bold uppercase tracking-wider text-text">
            {currentFolderId === null ? 'Workspace board' : `${currentFolder.name} board`}
          </h1>
          <p className="text-[9px] text-text-muted uppercase font-semibold">
            Double-click to create · Drag to arrange · Drag empty space to pan
          </p>
        </div>
      </div>

      {/* Creation Node Overlay */}
      {(isCreatingMenu || creationType) && renderCreationNode()}

      {/* Draggable Spatial Cards */}
      {currentItems.map((item, index) => {
        const isEditing = editingId === item.id && editingType === item.type;
        const pos = getItemPos(item.id, index);

        const handleCardClick = () => {
          if (isEditing || draggedId !== null) return;
          if (item.type === 'folder') {
            navigateToFolder(item.id);
          } else if (item.type === 'canvas') {
            navigateToCanvas(item.id);
          } else if (item.type === 'note') {
            navigateToNote(item.id);
          }
        };

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: `${pos.x + panOffset.x}px`,
              top: `${pos.y + panOffset.y}px`,
              zIndex: draggedId === item.id ? 50 : 10
            }}
            onPointerDown={(e) => !isEditing && handleCardPointerDown(e, item.id, index)}
            onClick={handleCardClick}
            className={`group w-72 p-5 bg-surface border ${
              draggedId === item.id ? 'border-accent shadow-2xl scale-[1.02]' : 'border-border hover:border-accent/40'
            } rounded-lg transition-all duration-150 ease-out flex flex-col justify-between h-36`}
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
                  <button onClick={(e) => handleSaveRename(e, item.id)} className="px-2 py-1 bg-accent text-white text-[10px] font-bold rounded uppercase cursor-pointer">
                    Save
                  </button>
                  <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-[10px] rounded uppercase hover:bg-bg cursor-pointer">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-text text-base leading-snug truncate group-hover:text-accent transition-colors duration-100">
                    {item.name || 'Untitled'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Brutalist Text Badge */}
                    <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-border ${
                      item.type === 'canvas' ? 'text-accent border-accent/20 bg-accent/5' : 'text-text-muted bg-bg'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[8px] text-text-muted uppercase tracking-wider font-semibold">
                      {new Date(item.created_at || item.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Hover actions */}
            {!isEditing && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-4 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider mt-4">
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
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {currentItems.length === 0 && !isCreatingMenu && !creationType && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
          <p className="text-xs text-text-muted uppercase tracking-wider max-w-sm leading-relaxed">
            The board is clean. Double-click anywhere to create folders, drawings, or notes.
          </p>
        </div>
      )}
    </div>
  );
}
