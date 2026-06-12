import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Kanban, LayoutGrid, List, Plus, Folder, Palette, FileText, ArrowLeft } from 'lucide-react';

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
    getItemPosition,
    saveGroups,
    getGroups,
    getPluginData,
    showConfirm,
    workspaces,
    navigateToWorkspaces,
    folderViewMode: viewMode,
    setFolderViewMode: setViewMode
  } = useStore();

  const [time, setTime] = useState('00:00:00');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTiltMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Spotlight tracking only — no 3D tilt (perspective blurs GPU-composited text)
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleTiltMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = '';
  };

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [creationType, setCreationType] = useState('');
  const [creationName, setCreationName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 150, y: 150 });
  const [groupColor, setGroupColor] = useState('default');
  const pluginData = useStore(state => state.pluginData);
  const [groups, setGroups] = useState([]);
  const [hoveredGroupId, setHoveredGroupId] = useState(null);

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
  const draggedTypeRef = useRef('card'); // 'card' or 'group' or 'group-resize'
  const draggedGroupCardsRef = useRef([]); // [{ id, startX, startY, element }, ...]
  const draggedElementRef = useRef(null);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const syncTimeoutRef = useRef(null);

  // Filter items
  const workspaceFolders = folders.filter(f => f.workspace_id === currentWorkspaceId);
  const workspaceCanvases = canvases.filter(c => c.workspace_id === currentWorkspaceId && c.is_standalone);
  const workspaceNotes = notes.filter(n => n.workspace_id === currentWorkspaceId && n.folder_id === null);
  
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const folderNotes = notes.filter(n => n.folder_id === currentFolderId);

  // Combine items for workspace level
  const workspaceItems = [
    ...workspaceFolders.map(f => ({ ...f, type: 'folder' })),
    ...workspaceCanvases.map(c => ({ ...c, type: 'canvas', name: c.title })),
    ...workspaceNotes.map(n => ({ ...n, type: 'note', name: n.title }))
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

  useEffect(() => {
    setGroups(getGroups(activeContextId));
  }, [pluginData, activeContextId, getGroups]);


  // Bind Non-Passive Wheel Event for Zooming (keeps mouse cursor centered during zoom)
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl || viewMode !== 'board') return;

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
  }, [viewMode]);

  // Get position of items (dynamically centering grid and sliding matched cards)
  const getItemPos = (itemId, index, filteredItems = currentItems) => {
    if (positionsRef.current[itemId]) {
      return positionsRef.current[itemId];
    }

    const savedPos = getItemPosition(activeContextId, itemId);
    if (savedPos) {
      positionsRef.current[itemId] = savedPos;
      return savedPos;
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

  // Pointer Down on Group (Dragging)
  const handleGroupPointerDown = (e, groupId, element) => {
    e.preventDefault();
    draggedIdRef.current = groupId;
    draggedTypeRef.current = 'group';
    draggedElementRef.current = element;
    hasMovedRef.current = false;
    
    element.setPointerCapture(e.pointerId);

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    dragStartPosRef.current = { x: group.x, y: group.y };
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };

    // Find all cards visually inside this group
    const insideCards = [];
    if (contentRef.current) {
      const cardElements = contentRef.current.querySelectorAll('[data-item-id]');
      cardElements.forEach(el => {
        const id = el.getAttribute('data-item-id');
        const itemIdx = currentItems.findIndex(item => item.id === id);
        if (itemIdx !== -1) {
          const pos = getItemPos(id, itemIdx);
          if (
            pos.x >= group.x &&
            pos.x <= group.x + (group.width || 400) &&
            pos.y >= group.y &&
            pos.y <= group.y + (group.height || 300)
          ) {
            insideCards.push({
              id,
              startX: pos.x,
              startY: pos.y,
              element: el
            });
          }
        }
      });
    }
    draggedGroupCardsRef.current = insideCards;
  };

  // Pointer Down on Group Resize Handle
  const handleGroupResizePointerDown = (e, groupId, element) => {
    e.preventDefault();
    draggedIdRef.current = groupId;
    draggedTypeRef.current = 'group-resize';
    draggedElementRef.current = element;
    hasMovedRef.current = false;
    
    element.setPointerCapture(e.pointerId);

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    dragStartPosRef.current = { width: group.width || 400, height: group.height || 300 };
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  // Card Pointer Down (Dragging)
  const handleCardPointerDown = (e, itemId, index, element) => {
    e.preventDefault();
    draggedIdRef.current = itemId;
    draggedTypeRef.current = 'card';
    draggedElementRef.current = element;
    hasMovedRef.current = false;

    element.setPointerCapture(e.pointerId);
    element.classList.add('ring-2', 'ring-accent', 'shadow-[0_0_25px_rgba(2,132,199,0.35)]', 'z-50');
    element.setAttribute('data-dragging', 'true');

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

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        const type = draggedTypeRef.current;
        const zoom = zoomRef.current;

        if (type === 'card') {
          const newX = Math.max(10, dragStartPosRef.current.x + dx / zoom);
          const newY = Math.max(10, dragStartPosRef.current.y + dy / zoom);
          
          draggedElementRef.current.style.left = `${newX}px`;
          draggedElementRef.current.style.top = `${newY}px`;

          // Find if card is hovering over any group
          const cardCenterX = newX + 144;
          const cardCenterY = newY + 72;
          const groupHovered = groups.find(g => {
            const isInsideX = cardCenterX >= g.x && cardCenterX <= g.x + (g.width || 400);
            const isInsideY = cardCenterY >= g.y && cardCenterY <= g.y + (g.height || 300);
            return isInsideX && isInsideY && !g.collapsed;
          });
          setHoveredGroupId(groupHovered ? groupHovered.id : null);
        } else if (type === 'group') {
          const newX = Math.max(10, dragStartPosRef.current.x + dx / zoom);
          const newY = Math.max(10, dragStartPosRef.current.y + dy / zoom);

          draggedElementRef.current.style.left = `${newX}px`;
          draggedElementRef.current.style.top = `${newY}px`;

          // Drag all contained cards
          draggedGroupCardsRef.current.forEach(card => {
            const cardNewX = Math.max(10, card.startX + dx / zoom);
            const cardNewY = Math.max(10, card.startY + dy / zoom);
            card.element.style.left = `${cardNewX}px`;
            card.element.style.top = `${cardNewY}px`;
          });
        } else if (type === 'group-resize') {
          const newW = Math.max(200, dragStartPosRef.current.width + dx / zoom);
          const newH = Math.max(150, dragStartPosRef.current.height + dy / zoom);

          draggedElementRef.current.style.width = `${newW}px`;
          draggedElementRef.current.style.height = `${newH}px`;
        }
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
      const type = draggedTypeRef.current;
      
      draggedIdRef.current = null;
      draggedElementRef.current = null;
      element.releasePointerCapture(e.pointerId);
      element.classList.remove('ring-2', 'ring-accent', 'shadow-[0_0_25px_rgba(2,132,199,0.35)]', 'z-50');
      element.removeAttribute('data-dragging');

      if (hasMovedRef.current) {
        if (type === 'card') {
          const finalX = parseInt(element.style.left, 10);
          const finalY = parseInt(element.style.top, 10);
          
          positionsRef.current = {
            ...positionsRef.current,
            [id]: { x: finalX, y: finalY }
          };
          await updateItemPosition(activeContextId, id, finalX, finalY);

          // Calculate final group membership based on drop coordinates
          const cardCenterX = finalX + 144;
          const cardCenterY = finalY + 72;
          const targetGroup = groups.find(g => {
            return cardCenterX >= g.x && cardCenterX <= g.x + (g.width || 400) &&
                   cardCenterY >= g.y && cardCenterY <= g.y + (g.height || 300) &&
                   !g.collapsed;
          });

          const updatedGroups = groups.map(g => {
            let newCardIds = (g.cardIds || []).filter(cId => cId !== id);
            if (targetGroup && g.id === targetGroup.id) {
              newCardIds = [...newCardIds, id];
            }
            return { ...g, cardIds: newCardIds };
          });
          setGroups(updatedGroups);
          await saveGroups(activeContextId, updatedGroups);
          setHoveredGroupId(null);
        } else if (type === 'group') {
          const finalX = parseInt(element.style.left, 10);
          const finalY = parseInt(element.style.top, 10);

          const updatedGroups = groups.map(g => {
            if (g.id === id) {
              return { ...g, x: finalX, y: finalY };
            }
            return g;
          });
          setGroups(updatedGroups);
          await saveGroups(activeContextId, updatedGroups);

          // Update position for each card inside group
          for (const card of draggedGroupCardsRef.current) {
            const cardFinalX = parseInt(card.element.style.left, 10);
            const cardFinalY = parseInt(card.element.style.top, 10);

            positionsRef.current = {
              ...positionsRef.current,
              [card.id]: { x: cardFinalX, y: cardFinalY }
            };
            await updateItemPosition(activeContextId, card.id, cardFinalX, cardFinalY);
          }
          draggedGroupCardsRef.current = [];
        } else if (type === 'group-resize') {
          const finalW = parseInt(element.style.width, 10);
          const finalH = parseInt(element.style.height, 10);

          const updatedGroups = groups.map(g => {
            if (g.id === id) {
              return { ...g, width: finalW, height: finalH };
            }
            return g;
          });
          setGroups(updatedGroups);
          await saveGroups(activeContextId, updatedGroups);
        }
      } else {
        setHoveredGroupId(null);
      }
    }
  };

  const handleFitGroupContent = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const memberCardIds = group.cardIds || [];
    if (memberCardIds.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    memberCardIds.forEach(id => {
      const idx = currentItems.findIndex(item => item.id === id);
      if (idx !== -1) {
        const pos = getItemPos(id, idx);
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + 288);
        maxY = Math.max(maxY, pos.y + 144);
      }
    });

    if (minX === Infinity) return;

    const padding = 40;
    const headerHeight = 40;
    const newGroup = {
      ...group,
      x: minX - padding,
      y: minY - padding - headerHeight,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2) + headerHeight
    };

    const updatedGroups = groups.map(g => g.id === groupId ? newGroup : g);
    setGroups(updatedGroups);
    await saveGroups(activeContextId, updatedGroups);
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
    setGroupColor('default');
    
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
      positionsRef.current = {
        ...positionsRef.current,
        [folder.id]: { x: creationPos.x, y: creationPos.y }
      };
      await updateItemPosition(activeContextId, folder.id, creationPos.x, creationPos.y);
    } else if (type === 'canvas') {
      const canvas = await createCanvas(currentWorkspaceId, null, creationName.trim(), true, {});
      positionsRef.current = {
        ...positionsRef.current,
        [canvas.id]: { x: creationPos.x, y: creationPos.y }
      };
      await updateItemPosition(activeContextId, canvas.id, creationPos.x, creationPos.y);
      navigateToCanvas(canvas.id);
    } else if (type === 'note') {
      const note = await createNote(currentWorkspaceId, currentFolderId, creationName.trim());
      positionsRef.current = {
        ...positionsRef.current,
        [note.id]: { x: creationPos.x, y: creationPos.y }
      };
      await updateItemPosition(activeContextId, note.id, creationPos.x, creationPos.y);
      navigateToNote(note.id);
    } else if (type === 'group') {
      const newGroup = {
        id: 'group-' + Math.random().toString(36).substring(2, 11),
        title: creationName.trim(),
        x: creationPos.x,
        y: creationPos.y,
        width: 400,
        height: 300,
        color: groupColor
      };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      await saveGroups(activeContextId, updatedGroups);
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
      className="p-5 bg-surface/90 border border-border/80 hover:border-accent/40 rounded-xl shadow-2xl w-64 animate-in zoom-in-95 duration-100 backdrop-blur-xl transition-[border-color] duration-200"
    >
      {isCreatingMenu ? (
        <div className="flex flex-col gap-3">
          <span className="text-[9px] uppercase tracking-wider font-bold text-accent font-mono">Create Element</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('folder');
              }}
              className="py-2 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
            >
              Folder
            </button>
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('canvas');
              }}
              className="py-2 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
            >
              Canvas
            </button>
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('note');
              }}
              className="py-2 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
            >
              File
            </button>
            <button
              onClick={() => {
                setIsCreatingMenu(false);
                setCreationType('group');
              }}
              className="py-2 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
            >
              Group
            </button>
          </div>
          <button
            onClick={() => setIsCreatingMenu(false)}
            className="text-[9px] uppercase font-bold text-text-muted hover:text-text tracking-wider text-center mt-1 cursor-pointer font-mono"
          >
            Cancel
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
          <span className="text-[9px] uppercase tracking-wider font-bold text-accent font-mono">
            New {creationType}
          </span>
          <input
            type="text"
            placeholder="Name..."
            value={creationName}
            onChange={(e) => setCreationName(e.target.value)}
            className="bg-bg/40 border border-border text-text text-xs rounded-lg p-2.5 outline-none focus:border-accent/60 w-full font-sans transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCreationType('');
            }}
          />

          {creationType === 'group' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Color Theme</span>
              <div className="flex gap-1.5 items-center">
                {['default', 'red', 'blue', 'green', 'yellow'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGroupColor(color)}
                    className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${
                      groupColor === color ? 'ring-2 ring-text scale-110' : 'opacity-70 hover:opacity-100'
                    } ${
                      color === 'default' ? 'bg-text/20 border-border' :
                      color === 'red' ? 'bg-red-500 border-red-500/10' :
                      color === 'blue' ? 'bg-blue-500 border-blue-500/10' :
                      color === 'green' ? 'bg-emerald-500 border-emerald-500/10' : 'bg-yellow-500 border-yellow-500/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-1.5 pt-2.5 border-t border-border mt-1">
            <button
              type="button"
              onClick={() => setCreationType('')}
              className="px-3 py-1.5 border border-border hover:border-accent/30 text-text-muted hover:text-text text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 transition-all cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer font-sans border-none"
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
      onPointerDown={viewMode === 'board' ? handleBoardPointerDown : undefined}
      onPointerMove={viewMode === 'board' ? handlePointerMove : undefined}
      onPointerUp={viewMode === 'board' ? handlePointerUp : undefined}
      onDoubleClick={viewMode === 'board' ? handleBoardDoubleClick : undefined}
      style={viewMode === 'board' ? { 
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1.2px, transparent 1.2px)', 
        backgroundSize: '32px 32px',
        touchAction: 'none'
      } : undefined}
      className={`w-full h-full bg-transparent relative select-none font-sans ${
        viewMode === 'board' ? 'overflow-hidden cursor-grab active:cursor-grabbing' : 'overflow-y-auto'
      }`}
    >

      {/* Conditionally Render Layout Views */}
      {viewMode === 'dashboard' && (
        <div className="max-w-2xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8 font-sans select-none relative z-10 animate-in fade-in duration-300">
          <header className="flex flex-col gap-2.5 border-b border-border/60 pb-6">
            <div className="flex items-center gap-2 font-mono text-[9px] text-text-muted uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse-dot" />
              <span>Active Directory // {time}</span>
            </div>
            <h1 className="font-outfit-tight text-3xl sm:text-4.5xl font-extrabold tracking-[-0.03em] text-text bg-gradient-to-b from-title-from to-title-to bg-clip-text text-transparent animate-logo-glide truncate">
              {currentFolderId === null 
                ? (workspaces.find(w => w.id === currentWorkspaceId)?.name || 'Root') 
                : (folders.find(f => f.id === currentFolderId)?.name || 'Folder')}
            </h1>
          </header>

          {/* Folder Items Cards Stack */}
          <div className="flex flex-col gap-4.5">
            {matchingItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-text-dim uppercase font-mono tracking-wider">No elements found inside</p>
              </div>
            ) : (
              matchingItems.map((item, index) => {
                const idxStr = `[0${index + 1}/0${matchingItems.length}]`;
                return (
                  <div
                    key={item.id}
                    onClick={(e) => handleCardClick(e, item)}
                    onMouseMove={handleTiltMouseMove}
                    onMouseLeave={handleTiltMouseLeave}
                    className="premium-card p-6 flex flex-col gap-3.5 cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.005] group"
                  >
                    <div className="card-glare-overlay" />

                    <div className="flex items-center justify-between relative z-10 text-[9px] font-mono text-text-dim uppercase tracking-wider">
                      <span>{idxStr}</span>
                      <span className={`px-2.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider text-[8px] ${
                        item.type === 'canvas' 
                          ? 'border-accent bg-accent/10 text-accent' 
                          : item.type === 'folder'
                          ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
                          : 'border-neutral-500/20 bg-neutral-500/5 text-text-muted'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between relative z-10 mt-1">
                      <h3 className="font-extrabold text-base text-text tracking-tight group-hover:text-accent-hover transition-colors font-sans truncate pr-4">
                        {item.name || 'Untitled'}
                      </h3>
                      <span className="text-text-muted group-hover:text-accent-hover transition-all transform group-hover:translate-x-1.5 duration-200 text-lg">&rarr;</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed relative z-10">
                      {item.type === 'folder' 
                        ? 'Workspace subdirectory containing notes and charts.' 
                        : item.type === 'canvas'
                        ? 'Interactive vector graphics board for sketches, wireframes, and design maps.'
                        : 'Text document supporting markdown styles, code syntax, and checklists.'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Spatial Board Content Container */}
      {viewMode === 'board' && (
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
          {/* Visual Group Cards */}
          {groups.map((group) => {
            const isSearching = searchQuery.length > 0;
            let opacity = 1;
            if (isSearching) {
              const matchedCards = currentItems.filter(item => (item.name || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase()));
              const hasMatchedCardInside = matchedCards.some(item => {
                const pos = getItemPos(item.id, currentItems.indexOf(item));
                return pos.x >= group.x && pos.x <= group.x + (group.width || 400) &&
                       pos.y >= group.y && pos.y <= group.y + (group.height || 300);
              });
              const groupMatched = group.title.toLowerCase().includes(searchQuery.toLowerCase());
              if (!groupMatched && !hasMatchedCardInside) {
                opacity = 0;
              }
            }

            return (
              <div key={group.id} style={{ opacity, transition: 'opacity 0.3s ease' }}>
                <GroupCard
                  group={group}
                  onPointerDown={(e) => handleGroupPointerDown(e, group.id, e.currentTarget)}
                  onResizePointerDown={(e, element) => handleGroupResizePointerDown(e, group.id, element)}
                  saveGroups={saveGroups}
                  groups={groups}
                  setGroups={setGroups}
                  contextId={activeContextId}
                  zoom={zoom}
                  isHovered={hoveredGroupId === group.id}
                  onFitContent={() => handleFitGroupContent(group.id)}
                />
              </div>
            );
          })}

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

            const parentGroup = groups.find(g => (g.cardIds || []).includes(item.id));
            const isCollapsed = parentGroup && parentGroup.collapsed;

            let cardStyle = {
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              pointerEvents: isCollapsed ? 'none' : (isSearching && !isMatched ? 'none' : 'auto'),
              transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), left 0.4s cubic-bezier(0.25, 1, 0.5, 1), top 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              zIndex: isMatched ? 30 : 10,
              opacity: isCollapsed ? 0 : 1,
              transform: isCollapsed ? 'scale(0)' : 'scale(1)'
            };

            let extraClass = '';
            if (isSearching) {
              if (isMatched) {
                cardStyle.transform = 'scale(1.01) translateY(-2px)';
                cardStyle.opacity = 1;
                extraClass = 'border-accent/80 shadow-[0_20px_50px_rgba(2,132,199,0.35)] ring-2 ring-accent/40';
              } else {
                cardStyle.transform = 'scale(0)';
                cardStyle.opacity = 0;
              }
            }

            return (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                isEditing={isEditing}
                editingName={editingName}
                setEditingName={setEditingName}
                handleSaveRename={handleSaveRename}
                handleCancelRename={handleCancelRename}
                handleStartRename={handleStartRename}
                handleDelete={handleDelete}
                cardStyle={cardStyle}
                extraClass={extraClass}
                handleCardPointerDown={handleCardPointerDown}
                handleCardClick={handleCardClick}
                isAbsolute={true}
              />
            );
          })}
        </div>
      )}

      {/* Grid Content Container */}
      {viewMode === 'grid' && (
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          {matchingItems.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-text-muted uppercase font-mono tracking-wider">No items found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {groups.map(group => {
                const groupItems = matchingItems.filter(item => (group.cardIds || []).includes(item.id));
                if (groupItems.length === 0) return null;

                const bullets = {
                  default: 'bg-text/40',
                  red: 'bg-red-500',
                  blue: 'bg-blue-500',
                  green: 'bg-emerald-500',
                  yellow: 'bg-yellow-500'
                };

                return (
                  <div key={group.id} className="animate-in fade-in duration-200">
                    <div className="border-b border-border/40 pb-2 mb-6 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${bullets[group.color || 'default']}`} />
                      <h2 className="text-xs font-black uppercase tracking-wider font-mono text-text">{group.title}</h2>
                      <span className="text-[9px] text-text-muted font-bold bg-surface border border-border px-2.5 py-0.5 rounded-lg ml-1 font-mono">
                        {groupItems.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {groupItems.map((item) => {
                        const index = currentItems.findIndex(i => i.id === item.id);
                        const isEditing = editingId === item.id && editingType === item.type;
                        return (
                          <ItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            isEditing={isEditing}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            handleSaveRename={handleSaveRename}
                            handleCancelRename={handleCancelRename}
                            handleStartRename={handleStartRename}
                            handleDelete={handleDelete}
                            cardStyle={{}}
                            extraClass=""
                            handleCardPointerDown={handleCardPointerDown}
                            handleCardClick={handleCardClick}
                            isAbsolute={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {(() => {
                const unassignedItems = matchingItems.filter(item => {
                  return !groups.some(g => (g.cardIds || []).includes(item.id));
                });
                if (unassignedItems.length === 0) return null;

                return (
                  <div className="animate-in fade-in duration-200">
                    <div className="border-b border-border/40 pb-2 mb-6 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-text/20" />
                      <h2 className="text-xs font-black uppercase tracking-wider font-mono text-text-muted">Unassigned</h2>
                      <span className="text-[9px] text-text-muted font-bold bg-surface border border-border px-2.5 py-0.5 rounded-lg ml-1 font-mono">
                        {unassignedItems.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {unassignedItems.map((item) => {
                        const index = currentItems.findIndex(i => i.id === item.id);
                        const isEditing = editingId === item.id && editingType === item.type;
                        return (
                          <ItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            isEditing={isEditing}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            handleSaveRename={handleSaveRename}
                            handleCancelRename={handleCancelRename}
                            handleStartRename={handleStartRename}
                            handleDelete={handleDelete}
                            cardStyle={{}}
                            extraClass=""
                            handleCardPointerDown={handleCardPointerDown}
                            handleCardClick={handleCardClick}
                            isAbsolute={false}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* List Content Container */}
      {viewMode === 'list' && (
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          {matchingItems.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-text-muted uppercase font-mono tracking-wider">No items found</p>
            </div>
          ) : (
            <div className="bg-surface border border-border/60 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-bg text-[10px] text-text-muted font-bold uppercase tracking-wider font-mono">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Created Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {/* Render grouped rows */}
                    {groups.map(group => {
                      const groupItems = matchingItems.filter(item => (group.cardIds || []).includes(item.id));
                      if (groupItems.length === 0) return null;

                      const bullets = {
                        default: 'bg-white/40',
                        red: 'bg-red-500',
                        blue: 'bg-blue-500',
                        green: 'bg-emerald-500',
                        yellow: 'bg-yellow-500'
                      };

                      return (
                        <React.Fragment key={group.id}>
                          {/* Group Heading Row */}
                          <tr className="bg-surface/30 border-y border-border/10">
                            <td colSpan="4" className="py-2.5 px-6">
                              <div className="flex items-center gap-2 select-none">
                                <span className={`w-2.5 h-2.5 rounded-full ${bullets[group.color || 'default']}`} />
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-text">{group.title}</span>
                              </div>
                            </td>
                          </tr>
                          {/* Member rows */}
                          {groupItems.map(item => {
                            const isEditing = editingId === item.id && editingType === item.type;
                            return (
                              <tr 
                                key={item.id}
                                onClick={() => !isEditing && handleCardClick(null, item)}
                                className="group hover:bg-surface transition-colors duration-150 cursor-pointer"
                              >
                                <td className="py-4 px-6 font-medium text-text">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="bg-bg border border-border text-text text-xs rounded-lg px-2.5 py-1.5 outline-none font-sans"
                                        autoFocus
                                      />
                                      <button onClick={(e) => handleSaveRename(e, item.id)} className="px-3 py-1 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm">
                                        Save
                                      </button>
                                      <button onClick={handleCancelRename} className="px-3 py-1 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-surface cursor-pointer transition-all">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 pl-4">
                                      {item.type === 'folder' ? (
                                        <Folder className="w-4 h-4 text-yellow-500" />
                                      ) : item.type === 'canvas' ? (
                                        <Palette className="w-4 h-4 text-accent" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-text-muted" />
                                      )}
                                      <span className="font-bold text-sm tracking-wide font-sans">{item.name || 'Untitled'}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                                    item.type === 'canvas' 
                                      ? 'border-accent/20 bg-accent/10 text-accent' 
                                      : item.type === 'folder'
                                      ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                      : 'border-neutral-500/20 bg-neutral-500/10 text-text-muted'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  {item.created_at || item.updated_at 
                                    ? new Date(item.created_at || item.updated_at).toLocaleDateString() 
                                    : 'Recent'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  {!isEditing && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => handleStartRename(e, item.id, item.name || 'Untitled', item.type)}
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
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}

                    {/* Unassigned rows */}
                    {(() => {
                      const unassignedItems = matchingItems.filter(item => {
                        return !groups.some(g => (g.cardIds || []).includes(item.id));
                      });
                      if (unassignedItems.length === 0) return null;

                      return (
                        <React.Fragment>
                          {/* Unassigned Heading Row */}
                          <tr className="bg-surface/20 border-y border-border/10">
                            <td colSpan="4" className="py-2 px-6">
                              <div className="flex items-center gap-2 select-none">
                                <span className="w-2.5 h-2.5 rounded-full bg-text/20" />
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-text-muted">Unassigned</span>
                              </div>
                            </td>
                          </tr>
                          {unassignedItems.map(item => {
                            const isEditing = editingId === item.id && editingType === item.type;
                            return (
                              <tr 
                                key={item.id}
                                onClick={() => !isEditing && handleCardClick(null, item)}
                                className="group hover:bg-surface transition-colors duration-150 cursor-pointer"
                              >
                                <td className="py-4 px-6 font-medium text-text">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="bg-bg border border-border text-text text-xs rounded-lg px-2.5 py-1.5 outline-none font-sans"
                                        autoFocus
                                      />
                                      <button onClick={(e) => handleSaveRename(e, item.id)} className="px-3 py-1 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm">
                                        Save
                                      </button>
                                      <button onClick={handleCancelRename} className="px-3 py-1 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-surface cursor-pointer transition-all">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 pl-4">
                                      {item.type === 'folder' ? (
                                        <Folder className="w-4 h-4 text-yellow-500" />
                                      ) : item.type === 'canvas' ? (
                                        <Palette className="w-4 h-4 text-accent" />
                                      ) : (
                                        <FileText className="w-4 h-4 text-text-muted" />
                                      )}
                                      <span className="font-bold text-sm tracking-wide font-sans">{item.name || 'Untitled'}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                                    item.type === 'canvas' 
                                      ? 'border-accent/20 bg-accent/10 text-accent' 
                                      : item.type === 'folder'
                                      ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                      : 'border-neutral-500/20 bg-neutral-500/10 text-text-muted'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  {item.created_at || item.updated_at 
                                    ? new Date(item.created_at || item.updated_at).toLocaleDateString() 
                                    : 'Recent'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  {!isEditing && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => handleStartRename(e, item.id, item.name || 'Untitled', item.type)}
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
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Creation Node Overlay (Board View) */}
      {(isCreatingMenu || creationType) && viewMode === 'board' && renderCreationNode()}

      {/* Creation form mounted as a Centered Modal (Grid & List Views) */}
      {(isCreatingMenu || creationType) && viewMode !== 'board' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-surface border border-border/80 hover:border-accent/40 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-150 backdrop-blur-xl transition-[border-color] duration-200">
            {isCreatingMenu ? (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-accent font-mono">Create Element</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingMenu(false);
                      setCreationType('folder');
                    }}
                    className="py-2.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
                  >
                    Folder
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingMenu(false);
                      setCreationType('canvas');
                    }}
                    className="py-2.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
                  >
                    Canvas
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingMenu(false);
                      setCreationType('note');
                    }}
                    className="py-2.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
                  >
                    File
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingMenu(false);
                      setCreationType('group');
                    }}
                    className="py-2.5 border border-border hover:border-accent text-text text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-surface/50 active:scale-95 cursor-pointer transition-all font-sans text-center"
                  >
                    Group
                  </button>
                </div>
                <button
                  onClick={() => setIsCreatingMenu(false)}
                  className="text-[10px] uppercase font-bold text-text-muted hover:text-text tracking-wider text-center mt-1 cursor-pointer font-mono"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-accent font-mono">
                  New {creationType}
                </span>
                <input
                  type="text"
                  placeholder="Name..."
                  value={creationName}
                  onChange={(e) => setCreationName(e.target.value)}
                  className="bg-bg/40 border border-border text-text text-sm rounded-lg p-2.5 outline-none focus:border-accent/60 w-full font-sans transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setCreationType('');
                  }}
                />

                {creationType === 'group' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted font-mono">Color Theme</span>
                    <div className="flex gap-2 items-center">
                      {['default', 'red', 'blue', 'green', 'yellow'].map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setGroupColor(color)}
                          className={`w-6 h-6 rounded-full border cursor-pointer transition-all ${
                            groupColor === color ? 'ring-2 ring-text scale-110' : 'opacity-70 hover:opacity-100'
                          } ${
                            color === 'default' ? 'bg-text/20 border-border' :
                            color === 'red' ? 'bg-red-500 border-red-500/10' :
                            color === 'blue' ? 'bg-blue-500 border-blue-500/10' :
                            color === 'green' ? 'bg-emerald-500 border-emerald-500/10' : 'bg-yellow-500 border-yellow-500/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCreationType('')}
                    className="px-4 py-2 border border-border hover:border-accent/30 text-text-muted hover:text-text text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-surface hover:text-text transition-all cursor-pointer font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition-all cursor-pointer font-sans border-none"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {currentItems.length === 0 && !isCreatingMenu && !creationType && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-surface/60 border border-border flex items-center justify-center mb-4 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
          </div>
          <p className="text-xs text-text font-bold uppercase tracking-wider mb-2">This board is empty</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider max-w-xs leading-relaxed font-mono">
            {viewMode === 'board'
              ? "Double-click anywhere to create folders, drawings, or files."
              : "Press the buttons above to create folders, drawings, or files."
            }
          </p>
        </div>
      )}
      {/* Spotlight Search HUD Panel */}
      {searchQuery && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-surface/90 border border-border px-6 py-3.5 rounded-2xl shadow-2xl backdrop-blur-lg flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto">
          <span className="text-accent text-xs font-bold uppercase tracking-wider select-none font-mono">SEARCHING FOR:</span>
          <span className="text-text font-bold text-base tracking-wide border-r border-border pr-3 animate-pulse font-mono">
            {searchQuery}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg border border-border px-2 py-0.5 rounded ml-1 select-none font-mono">
            {matchingItems.length} match{matchingItems.length !== 1 ? 'es' : ''}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg border border-border px-2 py-0.5 rounded select-none font-mono">
            Esc to Clear
          </span>
          {matchingItems.length === 1 && (
            <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded animate-bounce font-mono">
              Press Enter to Open
            </span>
          )}
        </div>
      )}

      {/* Floating HUD controls */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-card/85 backdrop-blur-md border border-border/80 p-2 rounded-2xl shadow-2xl pointer-events-auto">
        {/* View mode switcher */}
        <div className="flex bg-surface border border-border/60 p-1 rounded-xl gap-1">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'dashboard' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'board' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'grid' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'list' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            List
          </button>
        </div>

        {/* Zoom controls (Only in Board mode) */}
        {viewMode === 'board' && (
          <div className="flex items-center gap-2 border-l border-border/60 pl-3">
            <span className="text-[10px] font-mono text-text-muted select-none w-10 text-right">
              {zoomPercent}%
            </span>
            <button
              onClick={() => {
                const newZoom = Math.min(2.5, zoomRef.current + 0.1);
                zoomRef.current = newZoom;
                setZoom(newZoom);
                if (contentRef.current) {
                  contentRef.current.style.transform = `translate(${panOffsetRef.current.x}px, ${panOffsetRef.current.y}px) scale(${newZoom})`;
                }
              }}
              className="w-7 h-7 bg-surface border border-border/60 hover:border-accent text-text hover:text-accent rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all active:scale-90"
            >
              +
            </button>
            <button
              onClick={() => {
                const newZoom = Math.max(0.25, zoomRef.current - 0.1);
                zoomRef.current = newZoom;
                setZoom(newZoom);
                if (contentRef.current) {
                  contentRef.current.style.transform = `translate(${panOffsetRef.current.x}px, ${panOffsetRef.current.y}px) scale(${newZoom})`;
                }
              }}
              className="w-7 h-7 bg-surface border border-border/60 hover:border-accent text-text hover:text-accent rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all active:scale-90"
            >
              -
            </button>
            <button
              onClick={() => {
                zoomRef.current = 1;
                panOffsetRef.current = { x: 0, y: 0 };
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
                if (contentRef.current) {
                  contentRef.current.style.transform = `translate(0px, 0px) scale(1)`;
                }
              }}
              className="px-2 py-1 bg-surface border border-border/60 hover:border-accent text-[8px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all active:scale-90"
            >
              Reset
            </button>
          </div>
        )}

        {/* HUD Create Button */}
        <button
          onClick={() => {
            if (currentFolderId === null) {
              const boardEl = boardRef.current;
              const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
              const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
              setCreationPos({ x: x / zoomRef.current, y: y / zoomRef.current });
              setIsCreatingMenu(true);
            } else {
              handleCreateHUD('note');
            }
          }}
          className="bg-text hover:opacity-90 text-bg px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1 font-sans border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

    </div>
  );
}

function ItemCard({
  item,
  index,
  isEditing,
  editingName,
  setEditingName,
  handleSaveRename,
  handleCancelRename,
  handleStartRename,
  handleDelete,
  cardStyle,
  extraClass,
  handleCardPointerDown,
  handleCardClick,
  isAbsolute = true
}) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Spotlight tracking only — no 3D tilt
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = '';
  };

  const mergedStyle = isAbsolute ? {
    ...cardStyle,
  } : {};

  return (
    <div
      ref={cardRef}
      style={mergedStyle}
      data-item-id={item.id}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={(e) => {
        if (!isAbsolute) return;
        if (e.target.closest('button') || e.target.closest('input')) return;
        if (!isEditing) handleCardPointerDown(e, item.id, index, e.currentTarget);
      }}
      onClick={(e) => handleCardClick(e, item)}
      className={`group ${
        isAbsolute ? 'w-72 absolute' : 'w-full'
      } select-none flex flex-col justify-between h-36 cursor-pointer relative overflow-hidden premium-card hover:scale-[1.01] ${extraClass}`}
    >
      {/* Spotlight shine overlay */}
      <div className="card-glare-overlay" />

      <div className="p-5 pt-6 flex-1 flex flex-col justify-between h-full relative z-10 transform translate-z-[20px]">
        <div className="min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="bg-bg border border-border text-text text-xs rounded-lg px-2.5 py-1.5 w-full outline-none font-sans"
                autoFocus
              />
              <button onClick={(e) => handleSaveRename(e, item.id)} className="px-3 py-1.5 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm">
                Save
              </button>
              <button onClick={handleCancelRename} className="px-3 py-1.5 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-surface cursor-pointer transition-all">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-extrabold text-text text-base leading-snug truncate group-hover:text-accent-hover transition-colors duration-150 font-sans tracking-tight">
                {item.name || 'Untitled'}
              </h3>
              <div className="mt-1.5">
                <span className={`px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider text-[8px] ${
                  item.type === 'canvas' 
                    ? 'border-accent bg-accent/10 text-accent font-bold' 
                    : item.type === 'folder'
                    ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
                    : 'border-neutral-500/20 bg-neutral-500/5 text-text-muted'
                }`}>
                  {item.type}
                </span>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-[9px] text-text-dim uppercase tracking-wider font-semibold font-mono">
              {item.created_at || item.updated_at 
                ? new Date(item.created_at || item.updated_at).toLocaleDateString() 
                : 'Recent'}
            </span>
            
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
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
}

function GroupCard({
  group,
  onPointerDown,
  onResizePointerDown,
  saveGroups,
  groups,
  setGroups,
  contextId,
  zoom,
  isHovered,
  onFitContent
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(group.title);
  const containerRef = useRef(null);

  const colors = {
    default: {
      border: 'border-border/60 hover:border-accent/30',
      bg: 'bg-surface/10',
      glow: '',
      text: 'text-text-muted',
      bullet: 'bg-text/40'
    },
    red: {
      border: 'border-red-500/20 hover:border-red-500/30',
      bg: 'bg-red-500/[0.015]',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.02)]',
      text: 'text-red-400',
      bullet: 'bg-red-500'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/30',
      bg: 'bg-blue-500/[0.015]',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.02)]',
      text: 'text-blue-400',
      bullet: 'bg-blue-500'
    },
    green: {
      border: 'border-emerald-500/20 hover:border-emerald-500/30',
      bg: 'bg-emerald-500/[0.015]',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.02)]',
      text: 'text-emerald-400',
      bullet: 'bg-emerald-500'
    },
    yellow: {
      border: 'border-yellow-500/20 hover:border-yellow-500/30',
      bg: 'bg-yellow-500/[0.015]',
      glow: 'shadow-[0_0_15px_rgba(234,179,8,0.02)]',
      text: 'text-yellow-400',
      bullet: 'bg-yellow-500'
    }
  };

  const scheme = colors[group.color || 'default'];

  const handleTitleSubmit = async (e) => {
    e?.preventDefault();
    if (!titleInput.trim()) return;
    const updated = groups.map(g => g.id === group.id ? { ...g, title: titleInput.trim() } : g);
    setGroups(updated);
    await saveGroups(contextId, updated);
    setIsEditingTitle(false);
  };

  const handleColorChange = async (color) => {
    const updated = groups.map(g => g.id === group.id ? { ...g, color } : g);
    setGroups(updated);
    await saveGroups(contextId, updated);
  };

  const handleDeleteGroup = async () => {
    const updated = groups.filter(g => g.id !== group.id);
    setGroups(updated);
    await saveGroups(contextId, updated);
  };

  const handleToggleCollapse = async () => {
    const updated = groups.map(g => g.id === group.id ? { ...g, collapsed: !g.collapsed } : g);
    setGroups(updated);
    await saveGroups(contextId, updated);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${group.x}px`,
        top: `${group.y}px`,
        width: `${group.width || 400}px`,
        height: group.collapsed ? '44px' : `${group.height || 300}px`,
        zIndex: 5,
        pointerEvents: 'auto'
      }}
      className={`rounded-2xl border backdrop-blur-[2px] transition-[border-color,background-color,box-shadow] duration-200 flex flex-col ${
        isHovered
          ? (group.color === 'red' ? 'ring-2 ring-red-500/80 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
             group.color === 'blue' ? 'ring-2 ring-blue-500/80 border-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
             group.color === 'green' ? 'ring-2 ring-emerald-500/80 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
             group.color === 'yellow' ? 'ring-2 ring-yellow-500/80 border-yellow-500/80 shadow-[0_0_20px_rgba(234,179,8,0.2)]' :
             'ring-2 ring-accent border-accent/80 shadow-[0_0_20px_rgba(139,92,246,0.2)]')
          : scheme.border
      } ${scheme.bg} ${scheme.glow}`}
    >
      {/* Header (Drag Handle) */}
      <div
        onPointerDown={(e) => {
          if (e.target.closest('button') || e.target.closest('input')) return;
          onPointerDown(e);
        }}
        className="h-10 border-b border-border/20 px-4 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 max-w-[70%]">
          <button
            onClick={handleToggleCollapse}
            className="text-text-muted hover:text-text transition-colors p-1 rounded cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform duration-200 ${group.collapsed ? '-rotate-90' : ''}`}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <span className={`w-1.5 h-1.5 rounded-full ${scheme.bullet}`} />
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                className="bg-bg border border-border/40 text-text text-[10px] rounded px-1.5 py-0.5 outline-none font-mono"
                autoFocus
              />
            </form>
          ) : (
            <span
              onDoubleClick={() => setIsEditingTitle(true)}
              className={`text-[10px] font-bold uppercase tracking-wider font-mono truncate cursor-text ${scheme.text}`}
            >
              {group.title}
            </span>
          )}
        </div>

        {/* Group Controls (Color palette + Delete) */}
        <div className="flex items-center gap-2">
          {/* Colors */}
          <div className="flex gap-1">
            {Object.keys(colors).map(cName => (
              <button
                key={cName}
                onClick={() => handleColorChange(cName)}
                className={`w-2.5 h-2.5 rounded-full border border-border/40 cursor-pointer ${
                  cName === 'default' ? 'bg-text/20' : 
                  cName === 'red' ? 'bg-red-500' :
                  cName === 'blue' ? 'bg-blue-500' :
                  cName === 'green' ? 'bg-emerald-500' : 'bg-yellow-500'
                } ${group.color === cName ? 'ring-1 ring-text' : ''}`}
              />
            ))}
          </div>

          {!group.collapsed && (
            <button
              onClick={onFitContent}
              title="Fit content"
              className="text-text-muted hover:text-text transition-colors p-1 rounded cursor-pointer border-none bg-transparent flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </button>
          )}
          
          <button
            onClick={handleDeleteGroup}
            className="text-text-muted hover:text-red-500 transition-colors p-1 rounded cursor-pointer border-none bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      {/* Resize Handle in bottom-right corner */}
      {!group.collapsed && (
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onResizePointerDown(e, containerRef.current);
          }}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-30 hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-text-muted"><line x1="22" y1="2" x2="2" y2="22"/><line x1="22" y1="10" x2="10" y2="22"/></svg>
        </div>
      )}
    </div>
  );
}
