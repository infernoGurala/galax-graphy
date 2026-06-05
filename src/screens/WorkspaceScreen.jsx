import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit2, Check, X, FolderKanban } from 'lucide-react';

const EMOJI_OPTIONS = ['📁', '🚀', '💡', '🧠', '🎨', '📚', '🛠️', '🧬', '📊', '✍️'];

export default function WorkspaceScreen() {
  const { workspaces, createWorkspace, renameWorkspace, deleteWorkspace, navigateToWorkspace } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createWorkspace(newName.trim(), newIcon);
    setNewName('');
    setNewIcon('📁');
    setIsCreating(false);
  };

  const handleStartRename = (e, id, name) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveRename = async (e, id) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    await renameWorkspace(id, editingName.trim());
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workspace and all its folders/notes?')) {
      await deleteWorkspace(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-accent" />
            Workspaces
          </h1>
          <p className="text-sm text-text-muted mt-1">Select a workspace to view folders and canvases</p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 py-2 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg shadow-md transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Workspace
          </button>
        )}
      </div>

      {/* Creation Modal/Form */}
      {isCreating && (
        <div className="mb-8 p-6 bg-surface border border-border rounded-xl">
          <h2 className="text-sm font-semibold text-text mb-4">Create New Workspace</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted">Icon</label>
                <select
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="bg-bg border border-border text-text text-sm rounded-lg p-2.5 outline-none focus:border-accent cursor-pointer"
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <option key={emoji} value={emoji}>
                      {emoji}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs text-text-muted">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g. Work, Personal project, Novel draft..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-bg border border-border text-text text-sm rounded-lg p-2.5 outline-none focus:border-accent"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-2 px-4 border border-border hover:bg-bg text-text-muted hover:text-text text-xs rounded-lg transition-colors cursor-pointer"
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
        </div>
      )}

      {/* Grid List */}
      {workspaces.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-xl">
          <p className="text-sm text-text-muted">No workspaces created yet.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 inline-flex items-center gap-1.5 py-2 px-4 bg-surface hover:bg-border border border-border text-text text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Set up your first workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const isEditing = editingId === ws.id;

            return (
              <div
                key={ws.id}
                onClick={() => !isEditing && navigateToWorkspace(ws.id)}
                className="relative group p-6 bg-surface border border-border rounded-xl hover:border-accent/50 transition-all duration-200 cursor-pointer flex flex-col select-none"
              >
                {/* Workspace Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl bg-bg border border-border w-12 h-12 rounded-lg flex items-center justify-center">
                    {ws.icon || '📁'}
                  </div>
                  
                  {/* Actions */}
                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity duration-150">
                      <button
                        onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                        className="p-1.5 hover:bg-bg rounded text-text-muted hover:text-accent transition-colors"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, ws.id)}
                        className="p-1.5 hover:bg-bg rounded text-text-muted hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Name & Content */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="bg-bg border border-border text-text text-xs rounded p-1.5 flex-1 outline-none focus:border-accent"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleSaveRename(e, ws.id)}
                      className="p-1.5 bg-accent hover:bg-accent-hover text-white rounded cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="p-1.5 border border-border hover:bg-bg rounded cursor-pointer text-text-muted"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <h3 className="font-semibold text-text text-base leading-snug truncate">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </p>
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
