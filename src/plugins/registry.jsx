import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

class PluginRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.id, plugin);
  }

  getAll() {
    return Array.from(this.plugins.values());
  }

  get(id) {
    return this.plugins.get(id);
  }
}

export const pluginRegistry = new PluginRegistry();

// --- Mood Board (PureRef Lite) Plugin Implementation ---
const PureRefLite = ({ refId }) => {
  const { savePluginData, getPluginData, pluginData } = useStore();
  const [images, setImages] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [draggedId, setDraggedId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Load saved images on mount/update
  useEffect(() => {
    const saved = getPluginData('pureref-lite', refId, 'pureref_data');
    if (saved && Array.isArray(saved.images)) {
      setImages(saved.images);
    } else {
      setImages([]);
    }
  }, [refId, pluginData]);

  const saveImages = (updatedImages) => {
    setImages(updatedImages);
    savePluginData('pureref-lite', 'pureref_data', refId, { images: updatedImages });
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    const newImg = {
      id: 'img-' + Math.random().toString(36).substring(2, 9),
      url: newUrl.trim(),
      x: 30 + (images.length * 15) % 150,
      y: 30 + (images.length * 15) % 150,
      width: 120,
      height: 120
    };

    saveImages([...images, newImg]);
    setNewUrl('');
  };

  const handlePointerDown = (e, imgId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedId(imgId);
    
    const img = images.find(i => i.id === imgId);
    if (img && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - img.x;
      const clickY = e.clientY - rect.top - img.y;
      setDragOffset({ x: clickX, y: clickY });
    }
  };

  const handlePointerMove = (e) => {
    if (!draggedId || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const updated = images.map(img => 
      img.id === draggedId ? { ...img, x: Math.max(0, x), y: Math.max(0, y) } : img
    );
    saveImages(updated);
  };

  const handlePointerUp = () => {
    setDraggedId(null);
  };

  const handleDeleteImage = (e, imgId) => {
    e.stopPropagation();
    const filtered = images.filter(img => img.id !== imgId);
    saveImages(filtered);
  };

  return (
    <div 
      className="bg-bg border border-border rounded-xl p-4 flex flex-col h-[400px] w-full font-sans select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Header bar with Input */}
      <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
        <div className="text-text text-xs font-bold uppercase tracking-wider mr-4">
          Mood Board
        </div>
        <form onSubmit={handleAddImage} className="flex-1 flex gap-2">
          <input
            type="url"
            placeholder="Paste reference image URL..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="flex-1 text-xs bg-surface border border-border rounded px-3 py-1.5 text-text outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
          >
            Add
          </button>
        </form>
      </div>

      {/* Infinite-like Canvas Board */}
      <div 
        ref={containerRef}
        className="flex-1 bg-surface rounded-lg relative overflow-hidden border border-border"
      >
        {images.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted text-[10px] uppercase font-bold tracking-wider gap-1.5 p-6 text-center">
            <span>Reference Mood Board</span>
            <span className="normal-case font-normal text-text-muted/70">Paste image URLs above and drag them freely on the board</span>
          </div>
        ) : (
          images.map((img) => (
            <div
              key={img.id}
              style={{
                position: 'absolute',
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                cursor: draggedId === img.id ? 'grabbing' : 'grab',
                zIndex: draggedId === img.id ? 20 : 10
              }}
              className="group border border-border hover:border-accent bg-bg p-1 rounded shadow-md transition-shadow duration-150 relative"
              onPointerDown={(e) => handlePointerDown(e, img.id)}
            >
              {/* Image element */}
              <img
                src={img.url}
                alt="Ref image"
                className="w-full h-auto object-contain pointer-events-none rounded select-none min-h-[50px] bg-surface"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120';
                }}
              />
              
              {/* Delete button (Text overlay) */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex items-center bg-bg/90 border border-border rounded px-1.5 py-0.5 transition-opacity duration-150">
                <button
                  onClick={(e) => handleDeleteImage(e, img.id)}
                  className="text-[9px] font-bold uppercase tracking-wider text-text-muted hover:text-red-500 transition-colors"
                  title="Remove reference"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Register the moodboard plugin
pluginRegistry.register({
  id: 'pureref-lite',
  name: 'Mood Board (PureRef)',
  icon: '',
  panelType: 'embedded-block',
  storageNamespace: 'pureref_data',
  render: (props) => <PureRefLite {...props} />
});
