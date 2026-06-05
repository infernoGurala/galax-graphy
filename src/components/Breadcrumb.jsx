import React from 'react';
import { useStore } from '../store/useStore';

export default function Breadcrumb() {
  const {
    currentWorkspaceId,
    currentFolderId,
    currentNoteId,
    currentCanvasId,
    workspaces,
    folders,
    notes,
    canvases,
    navigateToWorkspaces,
    navigateToWorkspace,
    navigateToFolder
  } = useStore();

  const workspace = workspaces.find(w => w.id === currentWorkspaceId);
  const folder = folders.find(f => f.id === currentFolderId);
  const note = notes.find(n => n.id === currentNoteId);
  const canvas = canvases.find(c => c.id === currentCanvasId);

  const crumbs = [];

  // Home segment
  crumbs.push({
    label: <span className="text-text-muted hover:text-text transition-colors duration-150 font-medium">Home</span>,
    onClick: navigateToWorkspaces
  });

  // Workspace segment
  if (workspace) {
    crumbs.push({
      label: <span className="hover:text-text transition-colors duration-150">{workspace.name}</span>,
      onClick: () => navigateToWorkspace(workspace.id)
    });
  }

  // Folder segment
  if (folder) {
    crumbs.push({
      label: <span className="hover:text-text transition-colors duration-150">{folder.name}</span>,
      onClick: () => navigateToFolder(folder.id)
    });
  }

  // Note segment
  if (note) {
    crumbs.push({
      label: <span className="text-text font-medium">{note.title || 'Untitled Note'}</span>,
      onClick: null
    });
  }

  // Canvas segment
  if (canvas) {
    crumbs.push({
      label: <span className="text-text font-medium">{canvas.title || 'Untitled Canvas'}</span>,
      onClick: null
    });
  }

  return (
    <nav className="flex items-center space-x-2.5 text-xs text-text-muted select-none font-sans font-normal py-1">
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-border">/</span>}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="cursor-pointer outline-none focus:text-text"
            >
              {crumb.label}
            </button>
          ) : (
            <span>{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
