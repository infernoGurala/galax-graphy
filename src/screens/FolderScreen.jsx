import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Check, X, Folder, FileText, ArrowLeft, Paintbrush } from 'lucide-react';

const EMOJI_OPTIONS = ['📁', '📂', '📝', '⚡', '🔒', '💡', '🎨', '🚀', '🔥', '⚙️'];

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
    navigateToWorkspace,
    navigateToNote,
    navigateToCanvas
  } = useStore();

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderIcon, setFolderIcon] = useState('📁');

  const [isCreatingCanvas, setIsCreatingCanvas] = useState(false);
  const [canvasTitle, setCanvasTitle] = useState('');

  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState(''); // 'folder', 'canvas', 'note'

  // Filter items for current workspace
  const workspaceFolders = folders.filter(f => f.workspace_id === currentWorkspaceId);
  const workspaceCanvases = canvases.filter(c => c.workspace_id === currentWorkspaceId && c.is_standalone);
  
  // Filter items for current folder
  const currentFolder = folders.find(f => f.id === currentFolderId);
  const folderNotes = notes.filter(n => n.folder_id === currentFolderId);

  // Folder CRUD handlers
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    await createFolder(currentWorkspaceId, folderName.trim(), folderIcon);
    setFolderName('');
    setFolderIcon('📁');
    setIsCreatingFolder(false);
  };

  // Canvas CRUD handlers
  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    if (!canvasTitle.trim()) return;
    const newCanvas = await createCanvas(currentWorkspaceId, null, canvasTitle.trim(), true, {});
    setCanvasTitle('');
    setIsCreatingCanvas(false);
    navigateToCanvas(newCanvas.id);
  };

  // Note CRUD handlers
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const newNote = await createNote(currentWorkspaceId, currentFolderId, noteTitle.trim());
    setNoteTitle('');
    setIsCreatingNote(false);
    navigateToNote(newNote.id);
  };

  // Rename handlers
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

  // Root view: list of folders and canvases
  if (currentFolderId === null) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
        
        {/* Canvases Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-accent" />
                Drawing Canvases
              </h2>
              <p className="text-xs text-text-muted">Visual thinking boards and concept maps</p>
            </div>
            {!isCreatingCanvas && (
              <button
                onClick={() => setIsCreatingCanvas(true)}
                className="flex items-center gap-1 py-1.5 px-3 bg-surface hover:bg-border border border-border text-text text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Canvas
              </button>
            )}
          </div>

          {isCreatingCanvas && (
            <form onSubmit={handleCreateCanvas} className="mb-6 p-4 bg-surface border border-border rounded-xl flex gap-3 items-end">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-text-muted">Canvas Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Design, Flowchart, Mindmap..."
                  value={canvasTitle}
                  onChange={(e) => setCanvasTitle(e.target.value)}
                  className="bg-bg border border-border text-text text-sm rounded-lg p-2 outline-none focus:border-accent"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCanvas(false)}
                  className="py-2 px-3 border border-border hover:bg-bg text-text-muted text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {workspaceCanvases.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-muted">No standalone canvases in this workspace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaceCanvases.map((canvas) => {
                const isEditing = editingId === canvas.id && editingType === 'canvas';
                return (
                  <div
                    key={canvas.id}
                    onClick={() => !isEditing && navigateToCanvas(canvas.id)}
                    className="group relative p-4 bg-surface border border-border rounded-xl hover:border-accent/40 transition-all duration-150 cursor-pointer select-none"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-bg border border-border rounded-lg text-accent">
                        <Paintbrush className="w-4 h-4" />
                      </div>
                      {!isEditing && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(e, canvas.id, canvas.title, 'canvas')}
                            className="p-1 hover:bg-bg rounded text-text-muted hover:text-accent"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, canvas.id, 'canvas')}
                            className="p-1 hover:bg-bg rounded text-text-muted hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-bg border border-border text-text text-xs rounded p-1 flex-1 outline-none"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveRename(e, canvas.id)} className="p-1 bg-accent text-white rounded">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={handleCancelRename} className="p-1 border border-border text-text-muted rounded">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-text text-sm truncate">{canvas.title}</h3>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                <Folder className="w-5 h-5 text-accent" />
                Folders
              </h2>
              <p className="text-xs text-text-muted">Organize your text documents and logs</p>
            </div>
            {!isCreatingFolder && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> New Folder
              </button>
            )}
          </div>

          {isCreatingFolder && (
            <div className="mb-6 p-4 bg-surface border border-border rounded-xl">
              <form onSubmit={handleCreateFolder} className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted">Icon</label>
                    <select
                      value={folderIcon}
                      onChange={(e) => setFolderIcon(e.target.value)}
                      className="bg-bg border border-border text-text text-sm rounded-lg p-2 outline-none"
                    >
                      {EMOJI_OPTIONS.map((emoji) => (
                        <option key={emoji} value={emoji}>
                          {emoji}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs text-text-muted">Folder Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Design plans, Scratchpad, Meeting logs..."
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      className="bg-bg border border-border text-text text-sm rounded-lg p-2 outline-none focus:border-accent"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFolder(false)}
                    className="py-1.5 px-3 border border-border text-text-muted hover:bg-bg text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          )}

          {workspaceFolders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-muted">No folders created yet. Set one up to write notes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaceFolders.map((folder) => {
                const isEditing = editingId === folder.id && editingType === 'folder';
                return (
                  <div
                    key={folder.id}
                    onClick={() => !isEditing && navigateToFolder(folder.id)}
                    className="group relative p-5 bg-surface border border-border rounded-xl hover:border-accent/40 transition-all duration-150 cursor-pointer select-none flex items-center gap-3"
                  >
                    <div className="text-2xl bg-bg border border-border w-10 h-10 rounded-lg flex items-center justify-center">
                      {folder.icon || '📁'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-bg border border-border text-text text-xs rounded p-1 w-full outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => handleSaveRename(e, folder.id)} className="p-1 bg-accent text-white rounded">
                            <Check className="w-3 h-3" />
                          </button>
                          <button onClick={handleCancelRename} className="p-1 border border-border text-text-muted rounded">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-text text-sm truncate">{folder.name}</h3>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="absolute right-3 opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 bg-surface pl-2 transition-opacity duration-150">
                        <button
                          onClick={(e) => handleStartRename(e, folder.id, folder.name, 'folder')}
                          className="p-1 hover:bg-bg rounded text-text-muted hover:text-accent"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, folder.id, 'folder')}
                          className="p-1 hover:bg-bg rounded text-text-muted hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

  // Folder detail view: show notes inside active folder
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateToFolder(null)}
            className="p-1.5 hover:bg-surface border border-border rounded-lg text-text-muted hover:text-text transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-1.5">
              <span>{currentFolder.icon || '📁'}</span>
              <span>{currentFolder.name}</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Notes and documents inside this folder</p>
          </div>
        </div>

        {!isCreatingNote && (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Note
          </button>
        )}
      </div>

      {isCreatingNote && (
        <form onSubmit={handleCreateNote} className="mb-6 p-4 bg-surface border border-border rounded-xl flex gap-3 items-end">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs text-text-muted">Note Title</label>
            <input
              type="text"
              placeholder="e.g. Design system brief, Draft roadmap..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="bg-bg border border-border text-text text-sm rounded-lg p-2.5 outline-none focus:border-accent"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="py-2.5 px-3 border border-border hover:bg-bg text-text-muted text-xs rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* List of notes */}
      {folderNotes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-xs text-text-muted">No notes in this folder yet.</p>
          <button
            onClick={() => setIsCreatingNote(true)}
            className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3 bg-surface hover:bg-border border border-border text-text text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add a note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {folderNotes.map((note) => {
            const isEditing = editingId === note.id && editingType === 'note';
            return (
              <div
                key={note.id}
                onClick={() => !isEditing && navigateToNote(note.id)}
                className="group relative p-4 bg-surface border border-border rounded-xl hover:border-accent/40 transition-all duration-150 cursor-pointer flex items-center justify-between select-none"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-bg border border-border rounded-lg text-text-muted group-hover:text-accent transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-bg border border-border text-text text-sm rounded px-2 py-1 w-full outline-none focus:border-accent"
                          autoFocus
                        />
                        <button onClick={(e) => handleSaveRename(e, note.id)} className="p-1.5 bg-accent text-white rounded cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelRename} className="p-1.5 border border-border text-text-muted rounded cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-text text-sm truncate">{note.title || 'Untitled Note'}</h3>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          Edited {new Date(note.updated_at).toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 pl-4 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, note.id, note.title, 'note')}
                      className="p-1.5 hover:bg-bg rounded text-text-muted hover:text-accent transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, note.id, 'note')}
                      className="p-1.5 hover:bg-bg rounded text-text-muted hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
