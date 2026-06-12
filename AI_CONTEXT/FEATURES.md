# FEATURES.md

## Core Features (Build First)

### Password Gate
- Single password stored in `.env` as `VITE_APP_PASSWORD`
- Shown on first load
- Session stored in localStorage — no re-entry needed until cleared
- Clean centered input, no branding

### Workspace Selection
- Grid of workspace cards
- Each card: icon + name
- Create / rename / delete workspace
- No nested navigation — click → go to folders

### Folder Selection
- Grid of folder cards inside a workspace
- Each card: icon + name
- Create / rename / delete folder
- Breadcrumb: `Home / Workspace`

### Note Editor
- Full-width Novel editor (max 720px centered)
- Auto-save on change (debounced 1s)
- Title editable inline at top
- Breadcrumb: `Home / Workspace / Folder / Note`
- Slash command `/` opens block menu (built into Novel)

### Canvas (Standalone)
- Full-page Excalidraw canvas
- Accessible from workspace level (not inside a folder)
- Auto-save on change
- Breadcrumb: `Home / Workspace / Canvas`

### Canvas (Embedded)
- Excalidraw block embeddable inside any note via `/canvas` slash command
- Renders inline in the note
- Click to expand to full screen

---

## Plugin System (Build Second)

- Plugin registry in `src/plugins/registry.js`
- Each plugin self-registers on import
- Plugins appear in the `/` slash command menu inside notes
- Plugin data saved to `plugin_data` table in Supabase

---

## Future Features (Do Not Build Now)
- PureRef-style image mood board plugin
- Draw.io diagram plugin
- AI writing assistant
- Daily notes / journal mode
- Search across all notes
- Tags
- Graph view (like Obsidian)
- Mobile PWA
