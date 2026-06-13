# STACK.md

## Frontend
- **Framework:** React + Vite
- **Editor:** Novel (TipTap-based Notion-like editor)
- **Canvas:** Excalidraw (standalone pages + embeddable blocks inside notes)
- **State:** Zustand (simple global store, no Redux, no Context API)
- **Styling:** Tailwind CSS

## Backend / Cloud
- **Database + Realtime:** Supabase (notes, folders, workspaces, canvas data)
- **File Storage:** Cloudinary (images, attachments — URL stored in Supabase)

## Hosting
- **Platform:** Cloudflare Pages
- **Domain:** galax.superwave.space

## Auth
- Single password gate 
- Password stored as environment variable
- Session persists via localStorage
- No user accounts, no OAuth, no Supabase auth

## Plugin System
- Custom plugin registry built into the app
- Each plugin registers: `id`, `panel type`, `icon`, `render function`, `storage namespace`
- Plugins load/unload at runtime — no rebuild required
- Initial plugins: Excalidraw canvas, future slots for PureRef-style boards, Draw.io, etc.
