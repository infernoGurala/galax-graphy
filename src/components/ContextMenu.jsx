import React, { useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Code, Trash2 
} from 'lucide-react';

export default function ContextMenu({ x, y, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = React.useState({ left: x, top: y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    // Check right edge
    if (x + rect.width > winWidth) {
      adjustedX = winWidth - rect.width - 16;
    }
    // Check bottom edge
    if (y + rect.height > winHeight) {
      adjustedY = winHeight - rect.height - 16;
    }

    // Check bounds
    adjustedX = Math.max(16, adjustedX);
    adjustedY = Math.max(16, adjustedY);

    setPosition({ left: adjustedX, top: adjustedY });
  }, [x, y]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => document.removeEventListener('pointerdown', handleOutsideClick, true);
  }, [onClose]);

  const handleFormat = (format, value) => {
    window.dispatchEvent(new CustomEvent('format-text', { detail: { format, value } }));
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        zIndex: 9999,
      }}
      className="w-[280px] p-4 bg-surface/90 border border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col gap-4 text-text animate-in zoom-in-95 duration-100 select-none font-sans"
    >
      {/* Tools Options Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-0.5">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-accent font-mono">Tools Options</span>
      </div>

      {/* Styles */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Style</span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleFormat('bold', true)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('italic', true)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('underline', true)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('strike', true)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Headings</span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleFormat('header', 1)}
            className="py-1 px-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 text-[10px] font-extrabold uppercase font-mono tracking-wider text-center cursor-pointer transition-all text-text bg-transparent"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => handleFormat('header', 2)}
            className="py-1 px-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 text-[10px] font-extrabold uppercase font-mono tracking-wider text-center cursor-pointer transition-all text-text bg-transparent"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => handleFormat('header', 3)}
            className="py-1 px-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 text-[10px] font-extrabold uppercase font-mono tracking-wider text-center cursor-pointer transition-all text-text bg-transparent"
            title="Heading 3"
          >
            H3
          </button>
          <button
            onClick={() => handleFormat('header', false)}
            className="py-1 px-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 text-[10px] font-bold uppercase font-mono tracking-wider text-center cursor-pointer transition-all text-text bg-transparent"
            title="Paragraph"
          >
            Normal
          </button>
        </div>
      </div>

      {/* Fonts */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Fonts</span>
        <div className="grid grid-cols-3 gap-1.5 text-[8.5px] uppercase font-mono font-bold tracking-wider">
          <button
            onClick={() => handleFormat('font', false)}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Default Font"
          >
            Sailec
          </button>
          <button
            onClick={() => handleFormat('font', 'georgia')}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Georgia"
          >
            Georgia
          </button>
          <button
            onClick={() => handleFormat('font', 'sofia')}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Sofia Pro"
          >
            Sofia
          </button>
          <button
            onClick={() => handleFormat('font', 'slabo')}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Slabo 13px"
          >
            Slabo
          </button>
          <button
            onClick={() => handleFormat('font', 'roboto-slab')}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Roboto Slab"
          >
            Roboto
          </button>
          <button
            onClick={() => handleFormat('font', 'inconsolata')}
            className="py-1.5 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 cursor-pointer transition-all text-text text-center bg-transparent"
            title="Inconsolata"
          >
            Inco
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Alignment</span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleFormat('align', false)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('align', 'center')}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('align', 'right')}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('align', 'justify')}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lists & Code */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] uppercase tracking-wider font-bold text-text-muted font-mono">Lists & Formatting</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleFormat('list', 'bullet')}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('list', 'ordered')}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleFormat('code-block', true)}
            className="p-2 border border-border/40 hover:border-accent/40 rounded-lg hover:bg-surface/50 transition-all cursor-pointer flex items-center justify-center text-text bg-transparent"
            title="Code Block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Clear Formatting */}
      <div className="border-t border-border/40 pt-3">
        <button
          onClick={() => handleFormat('clean', null)}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans"
          title="Clear Formatting"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Formatting</span>
        </button>
      </div>
    </div>
  );
}
