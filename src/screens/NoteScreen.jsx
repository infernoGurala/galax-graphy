import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import NovelEditor from '../editor/NovelEditor';
import SaveStatusIndicator from '../components/SaveStatusIndicator';

export default function NoteScreen() {
  const { currentNoteId, notes, renameNote, navigateToFolder } = useStore();
  const note = notes.find(n => n.id === currentNoteId);
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving'
  const renameTimeoutRef = useRef(null);

  // Sync title when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
    }
    return () => {
      if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
    };
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
    setSaveStatus('saving');

    if (renameTimeoutRef.current) clearTimeout(renameTimeoutRef.current);
    renameTimeoutRef.current = setTimeout(async () => {
      await renameNote(note.id, newTitle);
      setSaveStatus('saved');
    }, 500);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent">
      <div className="max-w-[720px] mx-auto px-6 py-12">
        
        {/* Navigation Action & Save Status Indicator */}
        <div className="mb-8 font-sans flex items-center justify-between">
          <button
            onClick={() => navigateToFolder(note.folder_id)}
            className="text-xs text-text-muted hover:text-text font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer"
          >
            &larr; Back to Folder
          </button>

          <SaveStatusIndicator status={saveStatus} />
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
        <NovelEditor noteId={note.id} setSaveStatus={setSaveStatus} />
        
      </div>
    </div>
  );
}
