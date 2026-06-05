# SCHEMA.md

## Supabase Tables

---

### `workspaces`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Workspace name |
| `icon` | `text` | Emoji or icon string |
| `created_at` | `timestamp` | Auto |
| `updated_at` | `timestamp` | Auto |

---

### `folders`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `workspace_id` | `uuid` | Foreign key → workspaces |
| `name` | `text` | Folder name |
| `icon` | `text` | Emoji or icon string |
| `created_at` | `timestamp` | Auto |
| `updated_at` | `timestamp` | Auto |

---

### `notes`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `folder_id` | `uuid` | Foreign key → folders |
| `workspace_id` | `uuid` | Foreign key → workspaces |
| `title` | `text` | Note title |
| `content` | `jsonb` | TipTap/Novel JSON content |
| `created_at` | `timestamp` | Auto |
| `updated_at` | `timestamp` | Auto |

---

### `canvases`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `workspace_id` | `uuid` | Foreign key → workspaces (nullable for embedded) |
| `note_id` | `uuid` | Foreign key → notes (null if standalone) |
| `title` | `text` | Canvas name |
| `data` | `jsonb` | Excalidraw scene JSON |
| `is_standalone` | `boolean` | True = full page, False = embedded block |
| `created_at` | `timestamp` | Auto |
| `updated_at` | `timestamp` | Auto |

---

### `plugin_data`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `plugin_id` | `text` | Plugin identifier string |
| `namespace` | `text` | Plugin storage namespace |
| `ref_id` | `uuid` | Note or canvas it belongs to |
| `data` | `jsonb` | Plugin-specific JSON data |
| `created_at` | `timestamp` | Auto |
| `updated_at` | `timestamp` | Auto |

---

## Notes
- No Supabase Auth — single password gate on frontend only
- RLS (Row Level Security) disabled — private app, single user
- All timestamps use `now()` default
- `content` in notes is TipTap JSON, not raw markdown
