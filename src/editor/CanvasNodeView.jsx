import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useStore } from '../store/useStore';
import { Excalidraw } from '@excalidraw/excalidraw';
import { Maximize2, Minimize2, Trash, Check } from 'lucide-react';

export default function CanvasNodeView({ node, deleteNode }) {
  const canvasId = node.attrs.id;
  const canvases = useStore(state => state.canvases);
  const updateCanvasData = useStore(state => state.updateCanvasData);
  
  const canvasRecord = canvases.find(c => c.id === canvasId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Initialize canvas with saved elements or empty array
  const initialElements = canvasRecord?.data?.elements || [];
  const initialAppState = canvasRecord?.data?.appState || {};

  useEffect(() => {
    // Small delay to ensure container dimensions are computed before Excalidraw renders
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Handle drawing updates with debouncing to prevent lags
  const handleExcalidrawChange = (elements, appState) => {
    if (!canvasId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      // Filter out deleted elements or keep all
      updateCanvasData(canvasId, {
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
    }, 1000); // 1s save debounce
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!canvasRecord) {
    return (
      <NodeViewWrapper className="my-6 p-4 border border-dashed border-red-500 rounded-lg text-center text-xs text-red-500 font-sans">
        Canvas record not found: {canvasId}
      </NodeViewWrapper>
    );
  }

  const excalidrawTheme = {
    theme: 'dark',
  };

  const renderEditor = () => (
    <Excalidraw
      initialData={{
        elements: initialElements,
        appState: {
          ...initialAppState,
          theme: 'dark',
          viewBackgroundColor: '#242328' // Matches --surface
        }
      }}
      onChange={handleExcalidrawChange}
      theme="dark"
    />
  );

  return (
    <NodeViewWrapper className="my-8 select-none">
      {/* Inline Block Container */}
      <div 
        className={`bg-surface border border-border rounded-xl overflow-hidden shadow-md transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 z-50 flex flex-col w-screen h-screen m-0 rounded-none border-none' 
            : 'w-full h-[380px] flex flex-col'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-text tracking-wide font-sans">
              {isFullscreen ? `Full Screen: ${canvasRecord.title}` : canvasRecord.title}
            </span>
            <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-bg border border-border font-sans">
              Canvas
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {isFullscreen ? (
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1 hover:bg-surface border border-border text-text-muted hover:text-text rounded-md transition-colors cursor-pointer"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1 hover:bg-bg border border-transparent hover:border-border text-text-muted hover:text-text rounded-md transition-colors cursor-pointer"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={deleteNode}
                  className="p-1 hover:bg-bg border border-transparent hover:border-border text-text-muted hover:text-red-500 rounded-md transition-colors cursor-pointer"
                  title="Delete Drawing Block"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Excalidraw Component Container */}
        <div className="flex-1 bg-bg relative">
          {isReady ? (
            renderEditor()
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-text-muted font-sans">
              Preparing drawing canvas...
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
