import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function WorkspaceScreen() {
  const { workspaces, createWorkspace, renameWorkspace, deleteWorkspace, navigateToWorkspace } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createWorkspace(newName.trim(), ''); // Store empty string as icon
    setNewName('');
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
    if (confirm('Are you sure you want to delete this workspace and all its contents?')) {
      await deleteWorkspace(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-8 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 mb-12">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold text-text tracking-tight uppercase">
            Workspaces
          </h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">
            Select a project environment to manage notes and boards
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="py-2 px-4 border border-accent hover:bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded transition-all duration-150 cursor-pointer"
          >
            Create Workspace
          </button>
        )}
      </div>

      {/* Creation Form */}
      {isCreating && (
        <div className="mb-12 p-6 bg-surface border border-border rounded-lg animate-in fade-in duration-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text mb-4">
            New Workspace
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                Workspace Name
              </label>
              <input
                type="text"
                placeholder="e.g. engineering, design-logs, research..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-bg border border-border text-text text-sm rounded p-3 outline-none focus:border-accent font-sans"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="py-1.5 px-3 border border-border text-text-muted hover:text-text hover:bg-bg text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspace Cards Grid */}
      {workspaces.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-lg">
          <p className="text-xs text-text-muted uppercase tracking-wider">No workspaces created yet.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-4 py-2 px-4 border border-border hover:bg-surface text-text text-xs uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workspaces.map((ws) => {
            const isEditing = editingId === ws.id;

            return (
              <div
                key={ws.id}
                onClick={() => !isEditing && navigateToWorkspace(ws.id)}
                className="group relative p-6 bg-surface border border-border hover:border-accent/40 rounded-lg transition-all duration-200 cursor-pointer flex flex-col justify-between h-40"
              >
                {/* Workspace Details */}
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-bg border border-border text-text text-sm rounded px-2 py-1 flex-1 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(e, ws.id)}
                        className="px-2 py-1 bg-accent text-white text-xs font-bold rounded uppercase tracking-wider cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="px-2 py-1 border border-border text-text-muted text-xs rounded uppercase tracking-wider cursor-pointer hover:bg-bg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-text text-lg tracking-tight truncate">
                        {ws.name}
                      </h3>
                      <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-semibold">
                        Added {new Date(ws.created_at).toLocaleDateString()}
                      </p>
                    </>
                  )}
                </div>

                {/* Actions (Text only, visible on card hover) */}
                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-4 transition-opacity duration-150 text-[11px] font-bold uppercase tracking-wider mt-4">
                    <button
                      onClick={(e) => handleStartRename(e, ws.id, ws.name)}
                      className="text-text-muted hover:text-accent transition-colors cursor-pointer"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, ws.id)}
                      className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
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
