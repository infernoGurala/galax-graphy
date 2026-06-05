import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import NovelEditor from '../editor/NovelEditor';

export default function NoteScreen() {
  const { currentNoteId, notes, renameNote, navigateToFolder } = useStore();
  const note = notes.find(n => n.id === currentNoteId);
  const [title, setTitle] = useState('');

  // Sync title when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
  }, [currentNoteId, note]);

  if (!note) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-text-muted font-sans uppercase text-xs">
        Note not found.
      </div>
    );
  }

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    renameNote(note.id, newTitle);
  };

  return (
    <div className="w-full min-h-screen bg-bg">
      <div className="max-w-[720px] mx-auto px-6 py-12">
        
        {/* Navigation Action */}
        <div className="mb-8 font-sans">
          <button
            onClick={() => navigateToFolder(note.folder_id)}
            className="text-xs text-text-muted hover:text-text font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer"
          >
            &larr; Back to Folder
          </button>
        </div>

        {/* Inline Editable Title */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Note"
            className="w-full bg-transparent border-none text-3xl sm:text-4xl font-bold text-text outline-none placeholder:text-text-muted font-sans py-2"
          />
        </div>

        {/* Separator Line */}
        <div className="h-px bg-border w-full mb-6" />

        {/* TipTap Editor */}
        <NovelEditor noteId={note.id} />
        
      </div>
    </div>
  );
}
