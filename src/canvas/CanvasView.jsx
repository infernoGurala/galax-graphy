import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Excalidraw } from '@excalidraw/excalidraw';
import SaveStatusIndicator from '../components/SaveStatusIndicator';

export default function CanvasView() {
  const { currentCanvasId, canvases, updateCanvasData, renameCanvas, navigateToWorkspace } = useStore();
  const canvas = canvases.find(c => c.id === currentCanvasId);
  const [title, setTitle] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const saveTimeoutRef = useRef(null);
  const renameTimeoutRef = useRef(null);

  // Sync title from store
  useEffect(() => {
    if (canvas) {
      setTitle(canvas.title);
    }
    return () => {
      if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentCanvasId, canvas]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!canvas) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-text-muted font-sans uppercase text-xs">
        Canvas board not found.
      </div>
    );
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSaveStatus('saving');

    if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
    renameTimeoutRef.current = setTimeout(async () => {
      await renameCanvas(canvas.id, newTitle);
      setSaveStatus('saved');
    }, 500);
  };

  const handleExcalidrawChange = (elements, appState) => {
    if (!currentCanvasId) return;

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      await updateCanvasData(currentCanvasId, {
        elements: elements.map(el => ({
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          angle: el.angle,
          strokeColor: el.strokeColor,
          backgroundColor: el.backgroundColor,
          fillStyle: el.fillStyle,
          strokeWidth: el.strokeWidth,
          strokeStyle: el.strokeStyle,
          roughness: el.roughness,
          opacity: el.opacity,
          groupIds: el.groupIds,
          roundness: el.roundness,
          seed: el.seed,
          version: el.version,
          versionNonce: el.versionNonce,
          isDeleted: el.isDeleted,
          boundElements: el.boundElements,
          updated: el.updated,
          link: el.link,
          locked: el.locked,
          text: el.text,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          textAlign: el.textAlign,
          verticalAlign: el.verticalAlign,
          containerId: el.containerId,
          originalText: el.originalText,
          lineHeight: el.lineHeight
        })),
        appState: {
          theme: appState.theme,
          viewBackgroundColor: appState.viewBackgroundColor,
        }
      });
      setSaveStatus('saved');
    }, 1000); // 1s save debounce
  };

  const initialElements = canvas?.data?.elements || [];
  const initialAppState = canvas?.data?.appState || {};

  return (
    <div className="w-full h-[calc(100vh-68px)] bg-bg flex flex-col font-sans select-none">
      {/* Title & Navigation Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-surface/30">
        <button
          onClick={() => navigateToWorkspace(canvas.workspace_id)}
          className="text-xs text-text-muted hover:text-text font-bold uppercase tracking-wider border border-border hover:bg-surface py-1.5 px-3 rounded transition-colors cursor-pointer"
        >
          &larr; Back
        </button>

        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Canvas"
          className="bg-transparent border-none text-base font-bold text-text outline-none placeholder:text-text-muted flex-1 py-1"
        />
        
        <SaveStatusIndicator status={saveStatus} />

        <span className="text-[10px] text-text-muted px-2 py-0.5 rounded bg-surface border border-border uppercase font-semibold tracking-wider">
          Canvas
        </span>
      </div>

      {/* Full-width Excalidraw Area */}
      <div className="flex-1 bg-bg relative">
        {isReady ? (
          <Excalidraw
            initialData={{
              elements: initialElements,
              appState: {
                ...initialAppState,
                theme: 'dark',
                viewBackgroundColor: '#1A191C' // Matches --bg
              }
            }}
            onChange={handleExcalidrawChange}
            theme="dark"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted uppercase tracking-wider font-semibold">
            Initialising drawings board...
          </div>
        )}
      </div>
    </div>
  );
}
