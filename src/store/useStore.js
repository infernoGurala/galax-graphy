import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper for generating UUIDs locally when Supabase is not configured
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'local-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
};

// Local storage keys
const LS_PREFIX = 'galax_';
const LS_KEYS = {
  WORKSPACES: `${LS_PREFIX}workspaces`,
  FOLDERS: `${LS_PREFIX}folders`,
  NOTES: `${LS_PREFIX}notes`,
  CANVASES: `${LS_PREFIX}canvases`,
  PLUGIN_DATA: `${LS_PREFIX}plugin_data`,
  AUTH: `${LS_PREFIX}auth_token`
};

export const useStore = create((set, get) => ({
  // Auth State
  isAuthenticated: localStorage.getItem(LS_KEYS.AUTH) === 'true' || !(import.meta.env.VITE_APP_PASSWORD),
  isSupabaseConnected: isSupabaseConfigured,
  isLoading: false,
  error: null,

  // Navigation / Routing State
  currentWorkspaceId: null,
  currentFolderId: null,
  currentNoteId: null,
  currentCanvasId: null,
  currentScreen: 'workspaces', // 'workspaces', 'folders', 'note', 'canvas'
  workspaceViewMode: localStorage.getItem('galax_workspace_view_mode') || 'dashboard',
  folderViewMode: localStorage.getItem('galax_folder_view_mode') || 'dashboard',

  // Custom Confirmation Dialog State
  confirmDialog: null, // { title: string, message: string, confirmLabel: string, cancelLabel: string, isDestructive: boolean, onConfirm: () => void }

  // Data Lists
  workspaces: [],
  folders: [],
  notes: [],
  canvases: [],
  pluginData: [],

  // --- Auth Actions ---
  login: (password) => {
    const correctPassword = import.meta.env.VITE_APP_PASSWORD || 'admin';
    if (password === correctPassword) {
      localStorage.setItem(LS_KEYS.AUTH, 'true');
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(LS_KEYS.AUTH);
    set({
      isAuthenticated: false,
      currentWorkspaceId: null,
      currentFolderId: null,
      currentNoteId: null,
      currentCanvasId: null,
      currentScreen: 'workspaces'
    });
  },

  // --- Navigation Actions ---
  navigateToWorkspaces: () => {
    set({
      currentWorkspaceId: null,
      currentFolderId: null,
      currentNoteId: null,
      currentCanvasId: null,
      currentScreen: 'workspaces'
    });
  },

  navigateToWorkspace: (workspaceId) => {
    set({
      currentWorkspaceId: workspaceId,
      currentFolderId: null,
      currentNoteId: null,
      currentCanvasId: null,
      currentScreen: 'folders'
    });
  },

  navigateToFolder: (folderId) => {
    set({
      currentFolderId: folderId,
      currentNoteId: null,
      currentCanvasId: null,
      currentScreen: 'folders' // folders screen also acts as the display for notes inside that folder
    });
  },

  navigateToNote: (noteId) => {
    set({
      currentNoteId: noteId,
      currentCanvasId: null,
      currentScreen: 'note'
    });
  },

  navigateToCanvas: (canvasId) => {
    set({
      currentCanvasId: canvasId,
      currentNoteId: null,
      currentScreen: 'canvas'
    });
  },

  showConfirm: (dialog) => set({ confirmDialog: dialog }),
  hideConfirm: () => set({ confirmDialog: null }),

  setWorkspaceViewMode: (mode) => {
    localStorage.setItem('galax_workspace_view_mode', mode);
    set({ workspaceViewMode: mode });
  },

  setFolderViewMode: (mode) => {
    localStorage.setItem('galax_folder_view_mode', mode);
    set({ folderViewMode: mode });
  },

  // --- Data Loading & Syncing ---
  loadData: async () => {
    set({ isLoading: true, error: null });

    if (isSupabaseConfigured) {
      try {
        const [wRes, fRes, nRes, cRes, pRes] = await Promise.all([
          supabase.from('workspaces').select('*').order('created_at'),
          supabase.from('folders').select('*').order('created_at'),
          supabase.from('notes').select('*').order('created_at'),
          supabase.from('canvases').select('*').order('created_at'),
          supabase.from('plugin_data').select('*').order('created_at')
        ]);

        if (wRes.error) throw wRes.error;
        if (fRes.error) throw fRes.error;
        if (nRes.error) throw nRes.error;
        if (cRes.error) throw cRes.error;
        if (pRes.error) throw pRes.error;

        set({
          workspaces: wRes.data || [],
          folders: fRes.data || [],
          notes: nRes.data || [],
          canvases: cRes.data || [],
          pluginData: pRes.data || [],
          isLoading: false
        });

        // Set up Realtime listener if supabase is configured
        get().setupRealtimeSubscriptions();

      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage:', err);
        get().loadDataFromLocalStorage();
      }
    } else {
      get().loadDataFromLocalStorage();
    }
  },

  loadDataFromLocalStorage: () => {
    const workspaces = JSON.parse(localStorage.getItem(LS_KEYS.WORKSPACES) || '[]');
    const folders = JSON.parse(localStorage.getItem(LS_KEYS.FOLDERS) || '[]');
    const notes = JSON.parse(localStorage.getItem(LS_KEYS.NOTES) || '[]');
    const canvases = JSON.parse(localStorage.getItem(LS_KEYS.CANVASES) || '[]');
    const pluginData = JSON.parse(localStorage.getItem(LS_KEYS.PLUGIN_DATA) || '[]');

    set({
      workspaces,
      folders,
      notes,
      canvases,
      pluginData,
      isLoading: false,
      isSupabaseConnected: false
    });
  },

  setupRealtimeSubscriptions: () => {
    if (!supabase) return;

    // Clean up any existing channel subscriptions
    supabase.channel('public-db-changes').unsubscribe();

    // Subscribe to all changes in a single channel
    supabase
      .channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        const { table, eventType, new: newRow, old: oldRow } = payload;
        
        set((state) => {
          const listName = table; // e.g. workspaces, folders, notes, canvases, plugin_data
          if (!state[listName]) return {};

          let updatedList = [...state[listName]];

          if (eventType === 'INSERT') {
            if (!updatedList.some(item => item.id === newRow.id)) {
              updatedList.push(newRow);
            }
          } else if (eventType === 'UPDATE') {
            updatedList = updatedList.map(item => item.id === newRow.id ? newRow : item);
          } else if (eventType === 'DELETE') {
            updatedList = updatedList.filter(item => item.id !== oldRow.id);
          }

          return { [listName]: updatedList };
        });
      })
      .subscribe();
  },

  // --- Workspace Actions ---
  createWorkspace: async (name, type = 'regular', icon = '') => {
    const newWorkspace = {
      id: generateUUID(),
      name,
      icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => {
      const workspaces = [...state.workspaces, newWorkspace];
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.WORKSPACES, JSON.stringify(workspaces));
      }
      return { workspaces };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('workspaces').insert([newWorkspace]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync created workspace to Supabase:', err);
      }
    }

    if (type !== 'regular') {
      await get().savePluginData('workspace-properties', 'properties', newWorkspace.id, { type, links: [] });
    }

    return newWorkspace;
  },

  renameWorkspace: async (id, name) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const workspaces = state.workspaces.map(w => w.id === id ? { ...w, name, updated_at } : w);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.WORKSPACES, JSON.stringify(workspaces));
      }
      return { workspaces };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('workspaces').update({ name, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync renamed workspace to Supabase:', err);
      }
    }
  },

  deleteWorkspace: async (id) => {
    set(state => {
      const workspaces = state.workspaces.filter(w => w.id !== id);
      // Clean up orphaned folders/notes/canvases locally
      const folders = state.folders.filter(f => f.workspace_id !== id);
      const notes = state.notes.filter(n => n.workspace_id !== id);
      const canvases = state.canvases.filter(c => c.workspace_id !== id);
      const pluginData = state.pluginData.filter(p => p.ref_id !== id);

      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.WORKSPACES, JSON.stringify(workspaces));
        localStorage.setItem(LS_KEYS.FOLDERS, JSON.stringify(folders));
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
        localStorage.setItem(LS_KEYS.CANVASES, JSON.stringify(canvases));
        localStorage.setItem(LS_KEYS.PLUGIN_DATA, JSON.stringify(pluginData));
      }

      return {
        workspaces,
        folders,
        notes,
        canvases,
        pluginData,
        currentWorkspaceId: state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
        currentScreen: state.currentWorkspaceId === id ? 'workspaces' : state.currentScreen
      };
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('plugin_data').delete().eq('ref_id', id);
        const { error } = await supabase.from('workspaces').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync deleted workspace to Supabase:', err);
      }
    }
  },

  // --- Folder Actions ---
  createFolder: async (workspaceId, name, icon = '') => {
    const newFolder = {
      id: generateUUID(),
      workspace_id: workspaceId,
      name,
      icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => {
      const folders = [...state.folders, newFolder];
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.FOLDERS, JSON.stringify(folders));
      }
      return { folders };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('folders').insert([newFolder]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync created folder to Supabase:', err);
      }
    }
    return newFolder;
  },

  renameFolder: async (id, name) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const folders = state.folders.map(f => f.id === id ? { ...f, name, updated_at } : f);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.FOLDERS, JSON.stringify(folders));
      }
      return { folders };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('folders').update({ name, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync renamed folder to Supabase:', err);
      }
    }
  },

  deleteFolder: async (id) => {
    set(state => {
      const folders = state.folders.filter(f => f.id !== id);
      const notes = state.notes.filter(n => n.folder_id !== id);

      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.FOLDERS, JSON.stringify(folders));
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
      }

      return {
        folders,
        notes,
        currentFolderId: state.currentFolderId === id ? null : state.currentFolderId
      };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('folders').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync deleted folder to Supabase:', err);
      }
    }
  },

  // --- Note Actions ---
  createNote: async (workspaceId, folderId, title) => {
    const newNote = {
      id: generateUUID(),
      workspace_id: workspaceId,
      folder_id: folderId,
      title,
      content: { type: 'doc', content: [] }, // TipTap JSON format
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => {
      const notes = [...state.notes, newNote];
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
      }
      return { notes };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notes').insert([newNote]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync created note to Supabase:', err);
      }
    }
    return newNote;
  },

  updateNoteContent: async (id, content) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const notes = state.notes.map(n => n.id === id ? { ...n, content, updated_at } : n);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
      }
      return { notes };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notes').update({ content, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync note content to Supabase:', err);
      }
    }
  },

  renameNote: async (id, title) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const notes = state.notes.map(n => n.id === id ? { ...n, title, updated_at } : n);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
      }
      return { notes };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notes').update({ title, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync renamed note to Supabase:', err);
      }
    }
  },

  deleteNote: async (id) => {
    set(state => {
      const notes = state.notes.filter(n => n.id !== id);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(notes));
      }
      return {
        notes,
        currentNoteId: state.currentNoteId === id ? null : state.currentNoteId,
        currentScreen: state.currentNoteId === id ? 'folders' : state.currentScreen
      };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync deleted note to Supabase:', err);
      }
    }
  },

  // --- Canvas Actions ---
  createCanvas: async (workspaceId, noteId = null, title, isStandalone = true, data = {}) => {
    const newCanvas = {
      id: generateUUID(),
      workspace_id: workspaceId,
      note_id: noteId,
      title,
      data,
      is_standalone: isStandalone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    set(state => {
      const canvases = [...state.canvases, newCanvas];
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.CANVASES, JSON.stringify(canvases));
      }
      return { canvases };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('canvases').insert([newCanvas]);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync created canvas to Supabase:', err);
      }
    }
    return newCanvas;
  },

  updateCanvasData: async (id, data) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const canvases = state.canvases.map(c => c.id === id ? { ...c, data, updated_at } : c);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.CANVASES, JSON.stringify(canvases));
      }
      return { canvases };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('canvases').update({ data, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync canvas data to Supabase:', err);
      }
    }
  },

  renameCanvas: async (id, title) => {
    const updated_at = new Date().toISOString();
    set(state => {
      const canvases = state.canvases.map(c => c.id === id ? { ...c, title, updated_at } : c);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.CANVASES, JSON.stringify(canvases));
      }
      return { canvases };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('canvases').update({ title, updated_at }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync renamed canvas to Supabase:', err);
      }
    }
  },

  deleteCanvas: async (id) => {
    set(state => {
      const canvases = state.canvases.filter(c => c.id !== id);
      if (!isSupabaseConfigured) {
        localStorage.setItem(LS_KEYS.CANVASES, JSON.stringify(canvases));
      }
      return {
        canvases,
        currentCanvasId: state.currentCanvasId === id ? null : state.currentCanvasId,
        currentScreen: state.currentCanvasId === id ? 'folders' : state.currentScreen
      };
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('canvases').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to sync deleted canvas to Supabase:', err);
      }
    }
  },

  // --- Plugin Data Actions ---
  savePluginData: async (pluginId, namespace, refId, data) => {
    const existing = get().pluginData.find(p => p.plugin_id === pluginId && p.ref_id === refId && p.namespace === namespace);
    const updated_at = new Date().toISOString();

    if (existing) {
      // Update
      set(state => {
        const pluginData = state.pluginData.map(p => p.id === existing.id ? { ...p, data, updated_at } : p);
        if (!isSupabaseConfigured) {
          localStorage.setItem(LS_KEYS.PLUGIN_DATA, JSON.stringify(pluginData));
        }
        return { pluginData };
      });

      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('plugin_data').update({ data, updated_at }).eq('id', existing.id);
          if (error) throw error;
        } catch (err) {
          console.error('Failed to sync plugin data update to Supabase:', err);
        }
      }
    } else {
      // Insert
      const newPluginData = {
        id: generateUUID(),
        plugin_id: pluginId,
        namespace,
        ref_id: refId,
        data,
        created_at: new Date().toISOString(),
        updated_at: updated_at
      };

      set(state => {
        const pluginData = [...state.pluginData, newPluginData];
        if (!isSupabaseConfigured) {
          localStorage.setItem(LS_KEYS.PLUGIN_DATA, JSON.stringify(pluginData));
        }
        return { pluginData };
      });

      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase.from('plugin_data').insert([newPluginData]);
          if (error) throw error;
        } catch (err) {
          console.error('Failed to sync new plugin data to Supabase:', err);
        }
      }
    }
  },

  getPluginData: (pluginId, refId, namespace) => {
    const record = get().pluginData.find(p => p.plugin_id === pluginId && p.ref_id === refId && p.namespace === namespace);
    return record ? record.data : null;
  },

  goBack: () => {
    const { currentScreen, currentFolderId, currentWorkspaceId, navigateToFolder, navigateToWorkspace, navigateToWorkspaces } = get();
    if (currentScreen === 'canvas') {
      if (currentWorkspaceId) {
        navigateToWorkspace(currentWorkspaceId);
      } else {
        navigateToWorkspaces();
      }
    } else if (currentScreen === 'note') {
      if (currentFolderId) {
        navigateToFolder(currentFolderId);
      } else if (currentWorkspaceId) {
        navigateToWorkspace(currentWorkspaceId);
      } else {
        navigateToWorkspaces();
      }
    } else if (currentScreen === 'folders') {
      if (currentFolderId !== null) {
        navigateToFolder(null);
      } else {
        navigateToWorkspaces();
      }
    }
  },

  updateItemPosition: async (contextId, itemId, x, y) => {
    const currentPluginData = get().pluginData;
    const existingRecord = currentPluginData.find(
      p => p.plugin_id === 'spatial-layout' && p.namespace === 'positions' && p.ref_id === contextId
    );

    const currentPositions = existingRecord?.data?.positions || {};
    const updatedPositions = {
      ...currentPositions,
      [itemId]: { x, y }
    };

    await get().savePluginData('spatial-layout', 'positions', contextId, { positions: updatedPositions });
  },

  getItemPosition: (contextId, itemId) => {
    const record = get().getPluginData('spatial-layout', contextId, 'positions');
    return record?.positions?.[itemId] || null;
  },

  saveGroups: async (contextId, groups) => {
    await get().savePluginData('spatial-layout', 'groups', contextId, { groups });
  },

  getGroups: (contextId) => {
    const record = get().getPluginData('spatial-layout', contextId, 'groups');
    return record?.groups || [];
  },

  getWorkspaceType: (workspaceId) => {
    const data = get().getPluginData('workspace-properties', workspaceId, 'properties');
    return data?.type || 'regular';
  },

  getWorkspaceLinks: (workspaceId) => {
    const data = get().getPluginData('workspace-properties', workspaceId, 'properties');
    return data?.links || [];
  },

  saveWorkspaceMetadata: async (workspaceId, type, links) => {
    await get().savePluginData('workspace-properties', 'properties', workspaceId, { type, links });
  },

  getWorkspaceDescription: (workspaceId) => {
    const data = get().getPluginData('workspace-properties', workspaceId, 'properties');
    if (data && data.description !== undefined) {
      return data.description;
    }
    const type = data?.type || 'regular';
    if (type === 'youtube') {
      return "Integrated YouTube workspace with interactive video player, custom notes manager, and progress trackers.";
    }
    return "Multi-layer document studio containing text files, folders, and standalone graphics boards.";
  },

  saveWorkspaceDescription: async (workspaceId, description) => {
    const data = get().getPluginData('workspace-properties', workspaceId, 'properties') || { type: 'regular', links: [] };
    await get().savePluginData('workspace-properties', 'properties', workspaceId, { ...data, description });
  }
}));
