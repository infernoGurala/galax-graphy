import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useStore } from '../store/useStore';
import { ExcalidrawNode, PluginBlockNode, SlashCommand, getSuggestionItems } from './CustomExtensions';
import { Heading1, Heading2, List, Code, HelpCircle, Paintbrush, Minus, Image } from 'lucide-react';

export default function NovelEditor({ noteId }) {
  const notes = useStore(state => state.notes);
  const updateNoteContent = useStore(state => state.updateNoteContent);
  const currentWorkspaceId = useStore(state => state.currentWorkspaceId);
  const currentNoteId = useStore(state => state.currentNoteId);
  const createCanvas = useStore(state => state.createCanvas);
  const savePluginData = useStore(state => state.savePluginData);

  const note = notes.find(n => n.id === noteId);
  const [menuState, setMenuState] = useState({
    show: false,
    x: 0,
    y: 0,
    query: '',
    range: null
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Setup the TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for blocks and canvas drawings...",
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
      }),
      ExcalidrawNode,
      PluginBlockNode,
      SlashCommand
    ],
    content: note?.content || { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      updateNoteContent(noteId, json);
      handleSelectionOrTextUpdate(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      handleSelectionOrTextUpdate(editor);
    }
  }, [noteId]);

  // Sync content if noteId changes
  useEffect(() => {
    if (editor && note) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(note.content)) {
        editor.commands.setContent(note.content, false);
      }
    }
  }, [noteId, editor]);

  // Handle embedded canvas insertion event from TipTap
  useEffect(() => {
    if (!editor) return;

    const handleInsertCanvas = async (e) => {
      const { editor: evtEditor, range } = e.detail;
      const newCanvas = await createCanvas(
        currentWorkspaceId,
        currentNoteId,
        'Embedded board',
        false, // standalone: false
        { elements: [], appState: {} }
      );

      evtEditor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'excalidrawCanvas',
          attrs: { id: newCanvas.id }
        })
        .run();
    };

    const handleInsertPlugin = async (e) => {
      const { editor: evtEditor, range, pluginId } = e.detail;
      // Generate a new reference ID for plugin storage namespace
      const pluginRefId = 'plug-' + Math.random().toString(36).substring(2, 12);
      
      // Initialize empty data for plugin
      await savePluginData(pluginId, 'pureref_data', pluginRefId, { images: [] });

      evtEditor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'pluginBlock',
          attrs: { id: pluginRefId, pluginId }
        })
        .run();
    };

    window.addEventListener('insert-embedded-canvas', handleInsertCanvas);
    window.addEventListener('insert-embedded-plugin', handleInsertPlugin);
    
    return () => {
      window.removeEventListener('insert-embedded-canvas', handleInsertCanvas);
      window.removeEventListener('insert-embedded-plugin', handleInsertPlugin);
    };
  }, [editor, currentWorkspaceId, currentNoteId, createCanvas, savePluginData]);

  const handleSelectionOrTextUpdate = (editor) => {
    const { selection } = editor.state;
    const { $from, empty } = selection;

    if (!empty) {
      setMenuState(prev => ({ ...prev, show: false }));
      return;
    }

    const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 20), $from.parentOffset, null, '\n');
    const match = textBefore.match(/\/(\w*)$/);

    if (match) {
      const query = match[1];
      const pos = $from.pos - query.length - 1;
      
      try {
        const coords = editor.view.coordsAtPos(pos);
        const scrollEl = document.documentElement;
        
        setMenuState({
          show: true,
          x: coords.left + window.scrollX,
          y: coords.bottom + window.scrollY,
          query,
          range: { from: pos, to: $from.pos }
        });
        setSelectedIndex(0);
      } catch (err) {
        console.warn('Failed to calculate cursor coordinates:', err);
      }
    } else {
      setMenuState(prev => ({ ...prev, show: false }));
    }
  };

  const menuItems = getSuggestionItems({ query: menuState.query });

  const executeMenuItem = (item) => {
    if (!editor || !menuState.range) return;
    item.command({ editor, range: menuState.range });
    setMenuState(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (!menuState.show || !editor) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (menuItems[selectedIndex]) {
          executeMenuItem(menuItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMenuState(prev => ({ ...prev, show: false }));
        editor.commands.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [menuState.show, menuItems, selectedIndex, editor]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuState(prev => ({ ...prev, show: false }));
      }
    };

    if (menuState.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuState.show]);

  const getIcon = (title) => {
    switch (title) {
      case 'Heading 1': return <Heading1 className="w-4 h-4 text-text" />;
      case 'Heading 2': return <Heading2 className="w-4 h-4 text-text" />;
      case 'Bullet List': return <List className="w-4 h-4 text-text" />;
      case 'Code Block': return <Code className="w-4 h-4 text-text" />;
      case 'Horizontal Rule': return <Minus className="w-4 h-4 text-text" />;
      case 'Excalidraw Canvas': return <Paintbrush className="w-4 h-4 text-accent" />;
      case 'Mood Board (PureRef)': return <Image className="w-4 h-4 text-accent" />;
      default: return <HelpCircle className="w-4 h-4 text-text" />;
    }
  };

  return (
    <div className="w-full relative py-6">
      <EditorContent editor={editor} className="font-sans text-text leading-relaxed select-text" />

      {menuState.show && menuItems.length > 0 && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: `${menuState.y}px`,
            left: `${menuState.x}px`,
            zIndex: 1000,
          }}
          className="w-72 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="px-3 py-1 text-[10px] text-text-muted font-semibold tracking-wider uppercase font-sans">
            Blocks
          </div>
          {menuItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.title}
                onClick={() => executeMenuItem(item)}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left cursor-pointer transition-colors duration-150 ${
                  isSelected ? 'bg-bg' : ''
                }`}
              >
                <div className="p-1.5 bg-bg border border-border rounded-lg mt-0.5">
                  {getIcon(item.title)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text font-sans">{item.title}</div>
                  <div className="text-[10px] text-text-muted font-sans line-clamp-1">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
