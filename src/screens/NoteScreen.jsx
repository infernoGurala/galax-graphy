import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import NovelEditor from '../editor/NovelEditor';

export default function NoteScreen() {
  const { currentNoteId, notes } = useStore();
  const note = notes.find(n => n.id === currentNoteId);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving'

  if (!note) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-text-muted font-sans uppercase text-xs">
        Note not found.
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent">
      <div className="max-w-[720px] mx-auto px-6 py-12">
        <NovelEditor noteId={note.id} setSaveStatus={setSaveStatus} />
      </div>
    </div>
  );
}
