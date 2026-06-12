import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Kanban, LayoutGrid, List, Video, Grid, Layers, Plus, Trash2, Edit3, GripVertical } from 'lucide-react';

const YoutubeIcon = ({ className = '', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

export default function WorkspaceScreen() {
  const {
    workspaces,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    navigateToWorkspace,
    updateItemPosition,
    getItemPosition,
    saveGroups,
    getGroups,
    getPluginData,
    savePluginData,
    getWorkspaceType,
    saveWorkspaceMetadata,
    showConfirm,
    workspaceViewMode: viewMode,
    setWorkspaceViewMode: setViewMode,
    logout,
    isSupabaseConnected
  } = useStore();
  const pluginData = useStore(state => state.pluginData);
  const [groups, setGroups] = useState([]);
  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null); // 'top' | 'bottom'
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Get custom order of workspaces from pluginData
  const orderedWorkspaces = React.useMemo(() => {
    const orderRecord = pluginData.find(
      p => p.plugin_id === 'workspace-order' && p.ref_id === 'root' && p.namespace === 'list'
    );
    const customOrder = orderRecord?.data?.order || [];

    const sorted = [...workspaces];
    if (customOrder && customOrder.length > 0) {
      sorted.sort((a, b) => {
        const idxA = customOrder.indexOf(a.id);
        const idxB = customOrder.indexOf(b.id);
        
        const valA = idxA !== -1 ? idxA : Infinity;
        const valB = idxB !== -1 ? idxB : Infinity;
        
        if (valA === valB) {
          return new Date(a.created_at) - new Date(b.created_at);
        }
        return valA - valB;
      });
    }
    return sorted;
  }, [workspaces, pluginData]);

  const handleDragStart = (e, wsId) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', wsId);
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const handleDragOver = (e, wsId) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const isTopHalf = relativeY < rect.height / 2;
    const position = isTopHalf ? 'top' : 'bottom';
    
    if (dragOverId !== wsId) {
      setDragOverId(wsId);
    }
    if (dragOverPosition !== position) {
      setDragOverPosition(position);
    }
  };

  const handleDragEnter = (e, wsId) => {
    e.preventDefault();
    setDragOverId(wsId);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverId(null);
      setDragOverPosition(null);
    }
  };

  const handleDrop = async (e, targetWsId) => {
    e.preventDefault();
    setDragOverId(null);
    setDragOverPosition(null);
    const draggedWsId = e.dataTransfer.getData('text/plain');
    if (!draggedWsId || draggedWsId === targetWsId) return;

    const wsIds = orderedWorkspaces.map(w => w.id);
    const draggedIdx = wsIds.indexOf(draggedWsId);
    const targetIdx = wsIds.indexOf(targetWsId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const isTopHalf = relativeY < rect.height / 2;

      const newIds = [...wsIds];
      newIds.splice(draggedIdx, 1);

      let insertIdx;
      if (isTopHalf) {
        insertIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
      } else {
        insertIdx = draggedIdx < targetIdx ? targetIdx : targetIdx + 1;
      }

      newIds.splice(insertIdx, 0, draggedWsId);
      
      await savePluginData('workspace-order', 'list', 'root', { order: newIds });
    }
  };
  const [isCreating, setIsCreating] = useState(false);
  const [creationType, setCreationType] = useState('workspace'); // 'workspace' or 'group'
  const [newName, setNewName] = useState('');
  const [creationPos, setCreationPos] = useState({ x: 150, y: 150 });
  const [workspaceType, setWorkspaceType] = useState('regular');
  const [groupColor, setGroupColor] = useState('default'); // 'default', 'red', 'blue', 'green', 'yellow'

  useEffect(() => {
    setGroups(getGroups('workspaces-root'));
  }, [pluginData, getGroups]);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

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
    // Update spotlight position only — no 3D tilt (3D perspective blurs text)
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleTiltMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = '';
  };

  const boardRef = useRef(null);
  const contentRef = useRef(null);

  // Refs for zero-latency 60 FPS animations
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

  // Keep card positions transient (in-memory) for the active session
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
          const matches = workspaces.filter(ws =>
            ws.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (matches.length === 1) {
            navigateToWorkspace(matches[0].id);
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
  }, [searchQuery, workspaces, navigateToWorkspace]);

  // Get position of workspace (dynamically centering grid and sliding matched cards)
  const getWorkspacePos = (wsId, index, filteredWorkspaces = workspaces) => {
    if (positionsRef.current[wsId]) {
      return positionsRef.current[wsId];
    }

    const savedPos = getItemPosition('workspaces-root', wsId);
    if (savedPos) {
      positionsRef.current[wsId] = savedPos;
      return savedPos;
    }

    const displayIndex = filteredWorkspaces.findIndex(ws => ws.id === wsId);
    const useIndex = displayIndex !== -1 ? displayIndex : index;

    const cols = 2;
    const col = useIndex % cols;
    const row = Math.floor(useIndex / cols);
    
    const cardWidth = 288;
    const gapX = 52;
    const activeCols = Math.min(filteredWorkspaces.length, cols);
    const gridWidth = activeCols * cardWidth + (activeCols - 1) * gapX;
    
    const startX = Math.max(100, (boardWidth - (gridWidth || 628)) / 2);
    return { x: startX + col * 340, y: 150 + row * 180 };
  };



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

  // Pointer Down on Board (Panning)
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

    // Move all member cards (cardIds)
    const insideCards = [];
    const memberCardIds = group.cardIds || [];
    if (contentRef.current) {
      memberCardIds.forEach(id => {
        const el = contentRef.current.querySelector(`[data-workspace-id="${id}"]`);
        const wsIdx = workspaces.findIndex(w => w.id === id);
        if (el && wsIdx !== -1) {
          const pos = getWorkspacePos(id, wsIdx);
          insideCards.push({
            id,
            startX: pos.x,
            startY: pos.y,
            element: el
          });
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

  // Pointer Down on Card (Dragging)
  const handleCardPointerDown = (e, wsId, index, element) => {
    e.preventDefault();
    draggedIdRef.current = wsId;
    draggedTypeRef.current = 'card';
    draggedElementRef.current = element;
    hasMovedRef.current = false;
    
    element.setPointerCapture(e.pointerId);
    element.classList.add('ring-1', 'ring-white/30', 'shadow-[0_0_30px_rgba(255,255,255,0.08)]', 'z-50');
    element.setAttribute('data-dragging', 'true');

    const pos = getWorkspacePos(wsId, index);
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
      element.classList.remove('ring-1', 'ring-white/30', 'shadow-[0_0_30px_rgba(255,255,255,0.08)]', 'z-50');
      element.removeAttribute('data-dragging');

      if (hasMovedRef.current) {
        if (type === 'card') {
          const finalX = parseInt(element.style.left, 10);
          const finalY = parseInt(element.style.top, 10);
          
          positionsRef.current = {
            ...positionsRef.current,
            [id]: { x: finalX, y: finalY }
          };
          await updateItemPosition('workspaces-root', id, finalX, finalY);

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
          await saveGroups('workspaces-root', updatedGroups);
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
          await saveGroups('workspaces-root', updatedGroups);

          // Update position for each card inside group
          for (const card of draggedGroupCardsRef.current) {
            const cardFinalX = parseInt(card.element.style.left, 10);
            const cardFinalY = parseInt(card.element.style.top, 10);

            positionsRef.current = {
              ...positionsRef.current,
              [card.id]: { x: cardFinalX, y: cardFinalY }
            };
            await updateItemPosition('workspaces-root', card.id, cardFinalX, cardFinalY);
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
          await saveGroups('workspaces-root', updatedGroups);
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
      const idx = workspaces.findIndex(w => w.id === id);
      if (idx !== -1) {
        const pos = getWorkspacePos(id, idx);
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
    await saveGroups('workspaces-root', updatedGroups);
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
    
    // Scale double-click creation coordinates
    const x = (e.clientX - rect.left - panOffsetRef.current.x) / zoomRef.current;
    const y = (e.clientY - rect.top - panOffsetRef.current.y) / zoomRef.current;
    
    setCreationPos({ x, y });
    setIsCreating(true);
    setCreationType('workspace');
    setNewName('');
    setWorkspaceType('regular');
    setGroupColor('default');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setIsCreating(false);
      return;
    }

    if (creationType === 'workspace') {
      const newWs = await createWorkspace(newName.trim(), workspaceType);
      positionsRef.current = {
        ...positionsRef.current,
        [newWs.id]: { x: creationPos.x, y: creationPos.y }
      };
      await updateItemPosition('workspaces-root', newWs.id, creationPos.x, creationPos.y);
    } else {
      const newGroup = {
        id: 'group-' + Math.random().toString(36).substring(2, 11),
        title: newName.trim(),
        x: creationPos.x,
        y: creationPos.y,
        width: 400,
        height: 300,
        color: groupColor
      };
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups);
      await saveGroups('workspaces-root', updatedGroups);
    }

    setIsCreating(false);
    setNewName('');
    setWorkspaceType('regular');
    setGroupColor('default');
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

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    showConfirm({
      title: 'Delete Workspace',
      message: 'Are you sure you want to permanently delete this workspace? All its folders, notes, drawings, and custom data will be deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: () => deleteWorkspace(id)
    });
  };

  const handleCreateButtonHUD = () => {
    const boardEl = boardRef.current;
    const x = boardEl ? boardEl.clientWidth / 2 - 144 - panOffsetRef.current.x : 150;
    const y = boardEl ? boardEl.clientHeight / 2 - 72 - panOffsetRef.current.y : 150;
    setCreationPos({ x: x / zoomRef.current, y: y / zoomRef.current });
    setIsCreating(true);
    setNewName('');
    setWorkspaceType('regular');
  };

  const matchingWorkspaces = searchQuery
    ? orderedWorkspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : orderedWorkspaces;

  // Convert zoom scale to display percent
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
              <span>Inferno Gurala // {time}</span>
            </div>
            <h1 className="font-outfit-tight text-3xl sm:text-4.5xl font-extrabold tracking-[-0.03em] text-text bg-gradient-to-b from-title-from to-title-to bg-clip-text text-transparent animate-logo-glide">
              GALAX GRAPHY
            </h1>
          </header>

          {/* Cards Stack */}
          <div className="flex flex-col gap-6">
            {matchingWorkspaces.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-xs text-text-dim uppercase font-mono tracking-wider">No workspaces found</p>
              </div>
            ) : (
              (() => {
                const regularWorkspaces = matchingWorkspaces.filter(ws => getWorkspaceType(ws.id) !== 'youtube');
                const youtubeWorkspaces = matchingWorkspaces.filter(ws => getWorkspaceType(ws.id) === 'youtube');
                return (
                  <>
                    {regularWorkspaces.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <h2 className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] mb-1">Workspaces</h2>
                        <div className="flex flex-col gap-4.5">
                          {regularWorkspaces.map((ws, index) => {
                            const idxStr = `[0${index + 1}/0${regularWorkspaces.length}]`;
                            return (
                              <div
                                key={ws.id}
                                className="relative"
                                onDragOver={(e) => handleDragOver(e, ws.id)}
                                onDragEnter={(e) => handleDragEnter(e, ws.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, ws.id)}
                              >
                                {dragOverId === ws.id && dragOverPosition && (
                                  <div 
                                    className="absolute left-0 right-0 h-[2px] bg-accent-hover z-30 pointer-events-none animate-in fade-in duration-100"
                                    style={{
                                      top: dragOverPosition === 'top' ? '-10px' : 'auto',
                                      bottom: dragOverPosition === 'bottom' ? '-10px' : 'auto',
                                    }}
                                  >
                                    <div className="absolute -left-1.5 -top-[3px] w-2 h-2 rounded-full bg-accent-hover shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                                  </div>
                                )}
                                <div
                                  onClick={() => navigateToWorkspace(ws.id)}
                                  onMouseMove={handleTiltMouseMove}
                                  onMouseLeave={handleTiltMouseLeave}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, ws.id)}
                                  onDragEnd={handleDragEnd}
                                  className="premium-card p-6 flex flex-col gap-3.5 cursor-grab active:cursor-grabbing relative overflow-hidden transition-all duration-300 group hover:scale-[1.005]"
                                >
                                  <div className="card-glare-overlay" />

                                  <div className="flex items-center justify-between relative z-10 text-[9px] font-mono text-text-dim uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                      <GripVertical className="w-3 h-3 text-text-dim/60 group-hover:text-text/60 transition-colors cursor-grab active:cursor-grabbing" />
                                      <span>{idxStr}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider text-[8px] border-border bg-surface/30 text-text-muted">
                                      Workspace
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between relative z-10 mt-1">
                                    <h3 className="font-extrabold text-base text-text tracking-tight group-hover:text-accent-hover transition-colors font-sans">
                                      {ws.name}
                                    </h3>
                                    <span className="text-text-muted group-hover:text-accent-hover transition-all transform group-hover:translate-x-1.5 duration-200 text-lg">&rarr;</span>
                                  </div>
                                  <p className="text-[11px] text-text-muted leading-relaxed relative z-10">
                                    Multi-layer document studio containing text files, folders, and standalone graphics boards.
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {youtubeWorkspaces.length > 0 && (
                      <div className="flex flex-col gap-4 mt-2">
                        <h2 className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em] mb-1">YouTube Studios</h2>
                        <div className="flex flex-col gap-4.5">
                          {youtubeWorkspaces.map((ws, index) => {
                            const idxStr = `[0${index + 1}/0${youtubeWorkspaces.length}]`;
                            return (
                              <div
                                key={ws.id}
                                className="relative"
                                onDragOver={(e) => handleDragOver(e, ws.id)}
                                onDragEnter={(e) => handleDragEnter(e, ws.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, ws.id)}
                              >
                                {dragOverId === ws.id && dragOverPosition && (
                                  <div 
                                    className="absolute left-0 right-0 h-[2px] bg-accent-hover z-30 pointer-events-none animate-in fade-in duration-100"
                                    style={{
                                      top: dragOverPosition === 'top' ? '-10px' : 'auto',
                                      bottom: dragOverPosition === 'bottom' ? '-10px' : 'auto',
                                    }}
                                  >
                                    <div className="absolute -left-1.5 -top-[3px] w-2 h-2 rounded-full bg-accent-hover shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
                                  </div>
                                )}
                                <div
                                  onClick={() => navigateToWorkspace(ws.id)}
                                  onMouseMove={handleTiltMouseMove}
                                  onMouseLeave={handleTiltMouseLeave}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, ws.id)}
                                  onDragEnd={handleDragEnd}
                                  className="premium-card p-6 flex flex-col gap-3.5 cursor-grab active:cursor-grabbing relative overflow-hidden transition-all duration-300 group hover:scale-[1.005]"
                                >
                                  <div className="card-glare-overlay" />

                                  <div className="flex items-center justify-between relative z-10 text-[9px] font-mono text-text-dim uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                      <GripVertical className="w-3 h-3 text-text-dim/60 group-hover:text-text/60 transition-colors cursor-grab active:cursor-grabbing" />
                                      <span>{idxStr}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider text-[8px] border-red-500/20 bg-red-500/5 text-red-400">
                                      YouTube
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between relative z-10 mt-1">
                                    <h3 className="font-extrabold text-base text-text tracking-tight group-hover:text-accent-hover transition-colors font-sans">
                                      {ws.name}
                                    </h3>
                                    <span className="text-text-muted group-hover:text-accent-hover transition-all transform group-hover:translate-x-1.5 duration-200 text-lg">&rarr;</span>
                                  </div>
                                  <p className="text-[11px] text-text-muted leading-relaxed relative z-10">
                                    Integrated YouTube workspace with interactive video player, custom notes manager, and progress trackers.
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Conditionally Render Layout Views */}
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
              const matchedCards = workspaces.filter(ws => ws.name.toLowerCase().includes(searchQuery.toLowerCase()));
              const hasMatchedCardInside = matchedCards.some(ws => {
                const pos = getWorkspacePos(ws.id, workspaces.indexOf(ws));
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
                  contextId="workspaces-root"
                  zoom={zoom}
                  isHovered={hoveredGroupId === group.id}
                  onFitContent={() => handleFitGroupContent(group.id)}
                />
              </div>
            );
          })}

          {/* Spatial Workspace Cards */}
          {workspaces.map((ws, index) => {
            const isEditing = editingId === ws.id;
            const isSearching = searchQuery.length > 0;
            const isMatched = isSearching && ws.name.toLowerCase().includes(searchQuery.toLowerCase());
            
            const pos = getWorkspacePos(
              ws.id,
              index,
              isMatched ? matchingWorkspaces : workspaces
            );

            const parentGroup = groups.find(g => (g.cardIds || []).includes(ws.id));
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
              if (isCollapsed) {
                // Keep scale(0)
              } else if (isMatched) {
                cardStyle.transform = 'scale(1.01) translateY(-2px)';
                cardStyle.opacity = 1;
                extraClass = 'border-accent/40 shadow-xl shadow-accent/5 ring-1 ring-accent/30';
              } else {
                cardStyle.transform = 'scale(0)';
                cardStyle.opacity = 0;
              }
            }

            return (
              <WorkspaceCard
                key={ws.id}
                ws={ws}
                index={index}
                isEditing={isEditing}
                editingName={editingName}
                setEditingName={setEditingName}
                handleSaveRename={handleSaveRename}
                handleCancelRename={handleCancelRename}
                handleStartRename={handleStartRename}
                handleDelete={handleDelete}
                getWorkspaceType={getWorkspaceType}
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

      {viewMode === 'grid' && (
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          {matchingWorkspaces.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-text-muted uppercase font-mono tracking-wider">No matching workspaces found</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {groups.map(group => {
                const groupWorkspaces = matchingWorkspaces.filter(ws => (group.cardIds || []).includes(ws.id));
                if (groupWorkspaces.length === 0) return null;

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
                        {groupWorkspaces.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {groupWorkspaces.map((ws) => {
                        const index = workspaces.indexOf(ws);
                        const isEditing = editingId === ws.id;
                        return (
                          <WorkspaceCard
                            key={ws.id}
                            ws={ws}
                            index={index}
                            isEditing={isEditing}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            handleSaveRename={handleSaveRename}
                            handleCancelRename={handleCancelRename}
                            handleStartRename={handleStartRename}
                            handleDelete={handleDelete}
                            getWorkspaceType={getWorkspaceType}
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
                const unassignedWorkspaces = matchingWorkspaces.filter(ws => {
                  return !groups.some(g => (g.cardIds || []).includes(ws.id));
                });
                if (unassignedWorkspaces.length === 0) return null;

                return (
                  <div className="animate-in fade-in duration-200">
                    <div className="border-b border-border/40 pb-2 mb-6 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-text/20" />
                      <h2 className="text-xs font-black uppercase tracking-wider font-mono text-text-muted">Unassigned</h2>
                      <span className="text-[9px] text-text-muted font-bold bg-surface border border-border px-2.5 py-0.5 rounded-lg ml-1 font-mono">
                        {unassignedWorkspaces.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {unassignedWorkspaces.map((ws) => {
                        const index = workspaces.indexOf(ws);
                        const isEditing = editingId === ws.id;
                        return (
                          <WorkspaceCard
                            key={ws.id}
                            ws={ws}
                            index={index}
                            isEditing={isEditing}
                            editingName={editingName}
                            setEditingName={setEditingName}
                            handleSaveRename={handleSaveRename}
                            handleCancelRename={handleCancelRename}
                            handleStartRename={handleStartRename}
                            handleDelete={handleDelete}
                            getWorkspaceType={getWorkspaceType}
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

      {viewMode === 'list' && (
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          {matchingWorkspaces.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-text-muted uppercase font-mono tracking-wider">No matching workspaces found</p>
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
                      const groupWorkspaces = matchingWorkspaces.filter(ws => (group.cardIds || []).includes(ws.id));
                      if (groupWorkspaces.length === 0) return null;

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
                                <span className={`w-2 h-2 rounded-full ${bullets[group.color || 'default']}`} />
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-text">{group.title}</span>
                              </div>
                            </td>
                          </tr>
                          {/* Member rows */}
                          {groupWorkspaces.map(ws => {
                            const isEditing = editingId === ws.id;
                            const wsType = getWorkspaceType(ws.id);
                            return (
                              <tr 
                                key={ws.id}
                                onClick={() => editingId !== ws.id && navigateToWorkspace(ws.id)}
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
                                      <button onClick={(e) => handleSaveRename(e, ws.id)} className="px-3 py-1 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm">
                                        Save
                                      </button>
                                      <button onClick={handleCancelRename} className="px-3 py-1 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-surface cursor-pointer transition-all">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 pl-4">
                                      {wsType === 'youtube' ? (
                                        <YoutubeIcon className="w-4 h-4 text-red-500" />
                                      ) : (
                                        <Layers className="w-4 h-4 text-accent" />
                                      )}
                                      <span className="font-bold text-sm tracking-wide font-sans">{ws.name}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                                    wsType === 'youtube' 
                                      ? 'border-red-500/20 bg-red-500/10 text-red-500' 
                                      : 'border-accent/20 bg-accent/10 text-accent'
                                  }`}>
                                    {wsType === 'youtube' ? 'YouTube' : 'Workspace'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : 'Recent'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  {!isEditing && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
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
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}

                    {/* Unassigned Workspaces */}
                    {(() => {
                      const unassignedWorkspaces = matchingWorkspaces.filter(ws => {
                        return !groups.some(g => (g.cardIds || []).includes(ws.id));
                      });
                      if (unassignedWorkspaces.length === 0) return null;

                      return (
                        <React.Fragment>
                          {/* Unassigned Header Row */}
                          <tr className="bg-surface/20 border-y border-border/10">
                            <td colSpan="4" className="py-2 px-6">
                              <div className="flex items-center gap-2 select-none">
                                <span className="w-2.5 h-2.5 rounded-full bg-text/20" />
                                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-text-muted">Unassigned</span>
                              </div>
                            </td>
                          </tr>
                          {unassignedWorkspaces.map(ws => {
                            const isEditing = editingId === ws.id;
                            const wsType = getWorkspaceType(ws.id);
                            return (
                              <tr 
                                key={ws.id}
                                onClick={() => editingId !== ws.id && navigateToWorkspace(ws.id)}
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
                                      <button onClick={(e) => handleSaveRename(e, ws.id)} className="px-3 py-1 bg-text hover:opacity-90 text-bg text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm">
                                        Save
                                      </button>
                                      <button onClick={handleCancelRename} className="px-3 py-1 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-surface cursor-pointer transition-all">
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2.5 pl-4">
                                      {wsType === 'youtube' ? (
                                        <YoutubeIcon className="w-4 h-4 text-red-500" />
                                      ) : (
                                        <Layers className="w-4 h-4 text-accent" />
                                      )}
                                      <span className="font-bold text-sm tracking-wide font-sans">{ws.name}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${
                                    wsType === 'youtube' 
                                      ? 'border-red-500/20 bg-red-500/10 text-red-500' 
                                      : 'border-accent/20 bg-accent/10 text-accent'
                                  }`}>
                                    {wsType === 'youtube' ? 'YouTube' : 'Workspace'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-mono text-text-muted">
                                  {ws.created_at ? new Date(ws.created_at).toLocaleDateString() : 'Recent'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  {!isEditing && (
                                    <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
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

      {/* Creation form mounted spatial-ly (Board View) */}
      {isCreating && viewMode === 'board' && (
        <div 
          style={{ 
            position: 'absolute',
            left: creationPos.x * zoom + panOffset.x,
            top: creationPos.y * zoom + panOffset.y,
            zIndex: 100
          }}
          className="p-5 bg-surface/90 border border-border/80 hover:border-accent/40 rounded-xl shadow-2xl w-64 animate-in zoom-in-95 duration-100 backdrop-blur-xl transition-[border-color] duration-200"
        >
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
            <div className="flex gap-1.5 p-0.5 bg-bg/60 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setCreationType('workspace')}
                className={`flex-1 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded transition-all cursor-pointer border-none ${
                  creationType === 'workspace' ? 'bg-text text-bg' : 'text-text-muted hover:text-text'
                }`}
              >
                Workspace
              </button>
              <button
                type="button"
                onClick={() => setCreationType('group')}
                className={`flex-1 py-1 text-[9px] font-extrabold uppercase tracking-wider rounded transition-all cursor-pointer border-none ${
                  creationType === 'group' ? 'bg-text text-bg' : 'text-text-muted hover:text-text'
                }`}
              >
                Group
              </button>
            </div>

            <span className="text-[9px] uppercase tracking-wider font-bold text-accent font-mono">
              New {creationType === 'workspace' ? 'Workspace' : 'Group Section'}
            </span>
            <input
              type="text"
              placeholder="Name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-bg/40 border border-border text-text text-xs rounded-lg p-2.5 outline-none focus:border-accent/60 w-full font-sans transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            
            {creationType === 'workspace' ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Type</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceType('regular')}
                    className={`flex-1 py-1.5 border text-[10px] font-extrabold uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                      workspaceType === 'regular' 
                        ? 'border-accent bg-accent/10 text-accent font-extrabold' 
                        : 'border-border hover:border-accent text-text-muted hover:text-text'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceType('youtube')}
                    className={`flex-1 py-1.5 border text-[10px] font-extrabold uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                      workspaceType === 'youtube' 
                        ? 'border-red-500 bg-red-500/10 text-red-500 font-extrabold' 
                        : 'border-border hover:border-red-500 text-text-muted hover:text-text'
                    }`}
                  >
                    YouTube
                  </button>
                </div>
              </div>
            ) : (
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
                onClick={() => setIsCreating(false)}
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
        </div>
      )}

      {/* Creation form mounted as a Centered Modal (Grid & List Views) */}
      {isCreating && viewMode !== 'board' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-surface border border-border/80 hover:border-accent/40 rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-150 backdrop-blur-xl transition-[border-color] duration-200">
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex gap-1.5 p-0.5 bg-bg/60 rounded-lg border border-border/40">
                <button
                  type="button"
                  onClick={() => setCreationType('workspace')}
                  className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-wider rounded transition-all cursor-pointer border-none ${
                    creationType === 'workspace' ? 'bg-text text-bg' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setCreationType('group')}
                  className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-wider rounded transition-all cursor-pointer border-none ${
                    creationType === 'group' ? 'bg-text text-bg' : 'text-text-muted hover:text-text'
                  }`}
                >
                  Group
                </button>
              </div>

              <span className="text-[10px] uppercase tracking-wider font-bold text-accent font-mono">
                New {creationType === 'workspace' ? 'Workspace' : 'Group Section'}
              </span>
              <input
                type="text"
                placeholder="Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-bg/40 border border-border text-text text-sm rounded-lg p-2.5 outline-none focus:border-accent/60 w-full font-sans transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsCreating(false);
                }}
              />
              
              {creationType === 'workspace' ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted font-mono">Type</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWorkspaceType('regular')}
                      className={`flex-1 py-2 border text-[10px] font-extrabold uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                        workspaceType === 'regular' 
                          ? 'border-accent bg-accent/10 text-accent font-extrabold' 
                          : 'border-border hover:border-accent text-text-muted hover:text-text'
                      }`}
                    >
                      Regular
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceType('youtube')}
                      className={`flex-1 py-2 border text-[10px] font-extrabold uppercase tracking-wider rounded-lg cursor-pointer transition-all ${
                        workspaceType === 'youtube' 
                          ? 'border-red-500 bg-red-500/10 text-red-500 font-extrabold' 
                          : 'border-border hover:border-red-500 text-text-muted hover:text-text'
                      }`}
                    >
                      YouTube
                    </button>
                  </div>
                </div>
              ) : (
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
                  onClick={() => setIsCreating(false)}
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
          </div>
        </div>
      )}

      {/* Empty State */}
      {workspaces.length === 0 && !isCreating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-surface/60 border border-border flex items-center justify-center mb-4 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="9"/><line x1="9" x2="15" y1="13" y2="13"/><line x1="9" x2="13" y1="17" y2="17"/></svg>
          </div>
          <p className="text-xs text-text font-bold uppercase tracking-wider mb-2">No workspaces found</p>
          <p className="text-[10px] text-text-muted uppercase tracking-wider max-w-xs leading-relaxed font-mono">
            {viewMode === 'board' 
              ? "Double-click anywhere to create your first workspace."
              : "Press 'Create Workspace' to create your first workspace."
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
            {matchingWorkspaces.length} match{matchingWorkspaces.length !== 1 ? 'es' : ''}
          </span>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg border border-border px-2 py-0.5 rounded select-none font-mono">
            Esc to Clear
          </span>
          {matchingWorkspaces.length === 1 && (
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
            onClick={() => {
              setViewMode('dashboard');
              localStorage.setItem('galax_workspace_view_mode', 'dashboard');
            }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'dashboard' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setViewMode('board');
              localStorage.setItem('galax_workspace_view_mode', 'board');
            }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'board' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Board
          </button>
          <button
            onClick={() => {
              setViewMode('grid');
              localStorage.setItem('galax_workspace_view_mode', 'grid');
            }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'grid' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => {
              setViewMode('list');
              localStorage.setItem('galax_workspace_view_mode', 'list');
            }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer border-none ${
              viewMode === 'list' ? 'bg-text text-bg shadow-md font-extrabold' : 'text-text-muted hover:text-text hover:bg-surface/50'
            }`}
          >
            List
          </button>
        </div>

        {/* HUD Create Button */}
        <button
          onClick={handleCreateButtonHUD}
          className="bg-text hover:opacity-90 text-bg px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-1 font-sans border-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

    </div>
  );
}

function WorkspaceCard({
  ws,
  index,
  isEditing,
  editingName,
  setEditingName,
  handleSaveRename,
  handleCancelRename,
  handleStartRename,
  handleDelete,
  getWorkspaceType,
  cardStyle,
  extraClass,
  handleCardPointerDown,
  handleCardClick,
  isAbsolute = true
}) {
  const cardRef = useRef(null);
  const wsType = getWorkspaceType(ws.id);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Spotlight tracking only — no 3D tilt (perspective blurs GPU-composited text)
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
      data-workspace-id={ws.id}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onPointerDown={(e) => {
        if (!isAbsolute) return;
        if (e.target.closest('button') || e.target.closest('input')) return;
        if (!isEditing) handleCardPointerDown(e, ws.id, index, e.currentTarget);
      }}
      onClick={(e) => handleCardClick(e, ws.id)}
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
                className="bg-bg border border-border text-text text-xs rounded-lg px-2.5 py-1.5 w-full outline-none font-sans font-medium"
                autoFocus
              />
              <button onClick={(e) => handleSaveRename(e, ws.id)} className="px-3 py-1.5 bg-white hover:bg-white/90 text-black text-[10px] font-extrabold rounded-lg uppercase cursor-pointer transition-all active:scale-95 border-none shadow-sm shadow-white/5">
                Save
              </button>
              <button onClick={handleCancelRename} className="px-3 py-1.5 border border-border text-text-muted text-[10px] rounded-lg uppercase hover:bg-bg cursor-pointer transition-all font-medium">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-outfit-tight font-extrabold text-text text-base leading-snug truncate group-hover:text-white transition-colors duration-150 tracking-[-0.01em]">
                {ws.name}
              </h3>
              <div className="mt-1.5">
                <span className={`px-2 py-0.5 rounded border font-mono font-bold uppercase tracking-wider text-[8px] ${
                  wsType === 'youtube'
                    ? 'border-red-500/10 bg-red-500/5 text-red-400'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}>
                  {wsType === 'youtube' ? 'YouTube' : 'Workspace'}
                </span>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-[9px] text-text-dim uppercase tracking-wider font-semibold font-mono">
              {ws.created_at 
                ? new Date(ws.created_at).toLocaleDateString() 
                : 'Recent'}
            </span>
            
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider font-mono" onClick={(e) => e.stopPropagation()}>
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
      border: 'border-white/10 hover:border-white/20',
      bg: 'bg-white/[0.015]',
      glow: 'shadow-[0_0_15px_rgba(255,255,255,0.01)]',
      text: 'text-text-muted',
      bullet: 'bg-white/40'
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
                className={`w-2.5 h-2.5 rounded-full border border-white/5 cursor-pointer ${
                  cName === 'default' ? 'bg-white/20' : 
                  cName === 'red' ? 'bg-red-500' :
                  cName === 'blue' ? 'bg-blue-500' :
                  cName === 'green' ? 'bg-emerald-500' : 'bg-yellow-500'
                } ${group.color === cName ? 'ring-1 ring-white' : ''}`}
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
