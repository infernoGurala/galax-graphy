import React, { useState } from 'react';
import { useStore } from '../store/useStore';

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
    navigateToNote
  } = useStore();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('');

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState(''); // 'folder', 'canvas', 'note'

  // Filter items
  const workspaceFolders = folders.filter(f => f.workspace_id === currentWorkspaceId);
  const workspaceCanvases = canvases.filter(c => c.workspace_id === currentWorkspaceId && c.is_standalone);
  
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const folderNotes = notes.filter(n => n.folder_id === currentFolderId);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    await createFolder(currentWorkspaceId, folderName.trim(), '');
    setFolderName('');
    setIsCreatingFolder(false);
  };

  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    if (!canvasTitle.trim()) return;
    const newCanvas = await createCanvas(currentWorkspaceId, null, canvasTitle.trim(), true, {});
    setCanvasTitle('');
    setIsCreatingCanvas(false);
    navigateToCanvas(newCanvas.id);
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const newNote = await createNote(currentWorkspaceId, currentFolderId, noteTitle.trim());
    setNoteTitle('');
    setIsCreatingNote(false);
    navigateToNote(newNote.id);
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

  const handleDelete = async (e, id, type) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'folder') {
        await deleteFolder(id);
      } else if (type === 'canvas') {
        await deleteCanvas(id);
      } else if (type === 'note') {
        await deleteNote(id);
      }
    }
  };

  // 1. Folders and Standalone Canvases List (Folder selection level)
  if (currentFolderId === null) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-8 font-sans select-none">
        
        {/* Canvases Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text uppercase tracking-tight">
                Drawing Canvases
              </h2>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-semibold">
                Visual thinking boards and concept maps
              </p>
            </div>
            {!isCreatingCanvas && (
              <button
                onClick={() => setIsCreatingCanvas(true)}
                className="py-1.5 px-3 border border-border hover:bg-surface text-text text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                New Canvas
              </button>
            )}
          </div>

          {isCreatingCanvas && (
            <form onSubmit={handleCreateCanvas} className="mb-8 p-6 bg-surface border border-border rounded-lg flex flex-col sm:flex-row gap-4 items-end animate-in fade-in duration-150">
              <div className="flex-1 flex flex-col gap-1.5 w-full">
                <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                  Canvas Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. system-architecture, mindmap..."
                  value={canvasTitle}
                  onChange={(e) => setCanvasTitle(e.target.value)}
                  className="bg-bg border border-border text-text text-sm rounded p-2.5 outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreatingCanvas(false)}
                  className="py-2 px-4 border border-border hover:bg-bg text-text-muted text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {workspaceCanvases.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-border rounded-lg">
              <p className="text-xs text-text-muted uppercase tracking-wider">No canvases in this workspace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workspaceCanvases.map((canvas) => {
                const isEditing = editingId === canvas.id && editingType === 'canvas';
                return (
                  <div
                    key={canvas.id}
                    onClick={() => !isEditing && navigateToCanvas(canvas.id)}
                    className="group relative p-6 bg-surface border border-border hover:border-accent/40 rounded-lg transition-all duration-150 cursor-pointer flex flex-col justify-between h-32"
                  >
                    <div>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-bg border border-border text-text text-xs rounded px-2 py-1 flex-1 outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => handleSaveRename(e, canvas.id)} className="px-2 py-1 bg-accent text-white text-xs font-bold rounded uppercase">
                            Save
                          </button>
                          <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-xs rounded uppercase hover:bg-bg">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-text text-base leading-snug truncate">{canvas.title}</h3>
                      )}
                      <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold block mt-1">Canvas</span>
                    </div>

                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider mt-4">
                        <button
                          onClick={(e) => handleStartRename(e, canvas.id, canvas.title, 'canvas')}
                          className="text-text-muted hover:text-accent cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, canvas.id, 'canvas')}
                          className="text-text-muted hover:text-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-text uppercase tracking-tight">
                Folders
              </h2>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-semibold">
                Organize text notes and logs
              </p>
            </div>
            {!isCreatingFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                New Folder
              </button>
            )}
          </div>

          {isCreatingFolder && (
            <div className="mb-8 p-6 bg-surface border border-border rounded-lg animate-in fade-in duration-150">
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. documentation, meeting-notes..."
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="bg-bg border border-border text-text text-sm rounded p-2.5 outline-none focus:border-accent"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="py-1.5 px-3 border border-border text-text-muted hover:bg-bg text-xs uppercase tracking-wider rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}

          {workspaceFolders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-lg">
              <p className="text-xs text-text-muted uppercase tracking-wider">No folders created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workspaceFolders.map((folder) => {
                const isEditing = editingId === folder.id && editingType === 'folder';
                return (
                  <div
                    key={folder.id}
                    onClick={() => !isEditing && navigateToFolder(folder.id)}
                    className="group relative p-6 bg-surface border border-border hover:border-accent/40 rounded-lg transition-all duration-150 cursor-pointer flex flex-col justify-between h-32"
                  >
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-bg border border-border text-text text-xs rounded px-2 py-1 w-full outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => handleSaveRename(e, folder.id)} className="px-2 py-1 bg-accent text-white text-xs font-bold rounded uppercase">
                            Save
                          </button>
                          <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-xs rounded uppercase hover:bg-bg">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-text text-base truncate">{folder.name}</h3>
                      )}
                      <span className="text-[9px] text-text-muted uppercase tracking-wider font-bold block mt-1">Folder</span>
                    </div>

                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider mt-4">
                        <button
                          onClick={(e) => handleStartRename(e, folder.id, folder.name, 'folder')}
                          className="text-text-muted hover:text-accent cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, folder.id, 'folder')}
                          className="text-text-muted hover:text-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Folder detail view: show notes inside active folder
  return (
    <div className="max-w-3xl mx-auto py-12 px-8 font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-10 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateToFolder(null)}
            className="text-xs text-text-muted hover:text-text font-bold uppercase tracking-wider border border-border hover:bg-surface py-1.5 px-3 rounded transition-colors cursor-pointer"
          >
            &larr; Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-text uppercase tracking-tight">
              {currentFolder.name}
            </h1>
            <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">Notes inside this folder</p>
          </div>
        </div>

        {!isCreatingNote && (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
          >
            New Note
          </button>
        )}
      </div>

      {isCreatingNote && (
        <form onSubmit={handleCreateNote} className="mb-8 p-6 bg-surface border border-border rounded-lg flex flex-col sm:flex-row gap-4 items-end animate-in fade-in duration-150">
          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
              Note Title
            </label>
            <input
              type="text"
              placeholder="e.g. system-specification, sprint-planning..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="bg-bg border border-border text-text text-sm rounded p-2.5 outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="py-2 px-4 border border-border hover:bg-bg text-text-muted text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* List of notes */}
      {folderNotes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-lg">
          <p className="text-xs text-text-muted uppercase tracking-wider">No notes in this folder yet.</p>
          <button
            onClick={() => setIsCreatingNote(true)}
            className="mt-4 py-2 px-4 border border-border hover:bg-surface text-text text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
          >
            New Note
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {folderNotes.map((note) => {
            const isEditing = editingId === note.id && editingType === 'note';
            return (
              <div
                key={note.id}
                onClick={() => !isEditing && navigateToNote(note.id)}
                className="group relative p-5 bg-surface border border-border hover:border-accent/40 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-bg border border-border text-text text-sm rounded px-2 py-1 w-full outline-none"
                        autoFocus
                      />
                      <button onClick={(e) => handleSaveRename(e, note.id)} className="px-2 py-1 bg-accent text-white text-xs font-bold rounded uppercase cursor-pointer">
                        Save
                      </button>
                      <button onClick={handleCancelRename} className="px-2 py-1 border border-border text-text-muted text-xs rounded uppercase hover:bg-bg cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-text text-base truncate">{note.title || 'Untitled Note'}</h3>
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold mt-1">
                        Edited {new Date(note.updated_at).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-3 pl-4 transition-opacity duration-150 text-[10px] font-bold uppercase tracking-wider">
                    <button
                      onClick={(e) => handleStartRename(e, note.id, note.title, 'note')}
                      className="text-text-muted hover:text-accent cursor-pointer"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, note.id, 'note')}
                      className="text-text-muted hover:text-red-500 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
