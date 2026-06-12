# ARCHITECTURE.md

## Layer Overview

```
┌─────────────────────────────────────────┐
│              UI Shell                   │
│   React + Vite · Breadcrumb · Password  │
├───────────┬─────────────┬───────────────┤
│  Notes    │   Canvas    │ Plugin Slots  │
│  Novel    │ Excalidraw  │ PureRef etc.  │
├───────────┴─────────────┴───────────────┤
│           Plugin Registry               │
│  id · type · icon · render · namespace  │
├───────────┬─────────────┬───────────────┤
│   State   │   Realtime  │ File Pipeline │
│  Zustand  │  Supabase   │  Cloudinary   │
├───────────┴─────────────┴───────────────┤
│        Supabase           Cloudinary    │
│  Notes · Folders · Canvas  Images/Files │
└─────────────────────────────────────────┘
```

---

## Plugin Registry

Every tool (canvas, PureRef board, draw.io, etc.) is a plugin.

Each plugin must register:
```
{
  id: string,
  name: string,
  icon: string,
  panelType: 'full-page' | 'embedded-block' | 'modal',
  render: (props) => ReactNode,
  storageNamespace: string
}
```

- Plugins load at runtime
- No app rebuild needed to add a plugin
- Canvas (Excalidraw) is the first built-in plugin

---

## Data Flow

1. User opens note → Zustand loads note from Supabase
2. User edits → Novel fires onChange → debounced auto-save to Supabase
3. User uploads image → Cloudinary upload → URL returned → stored in note content
4. Canvas edits → Excalidraw onChange → debounced save to Supabase (separate `canvas_data` field)
5. Realtime → Supabase Realtime subscription keeps state fresh

---

## Folder Structure (React app)

```
src/
├── components/
│   ├── TopBar.jsx
│   ├── Breadcrumb.jsx
│   └── PasswordGate.jsx
├── screens/
│   ├── WorkspaceScreen.jsx
│   ├── FolderScreen.jsx
│   └── NoteScreen.jsx
├── editor/
│   └── NovelEditor.jsx
├── canvas/
│   └── CanvasView.jsx
├── plugins/
│   ├── registry.js
│   └── excalidraw/
├── store/
│   └── useStore.js
├── lib/
│   ├── supabase.js
│   └── cloudinary.js
└── App.jsx
```
