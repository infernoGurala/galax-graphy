-- ============================================================================
-- SUPABASE SCHEMA SETUP FOR GALAX-GRAPHY
-- ============================================================================
-- How to configure:
-- 1. Open your Supabase Project Dashboard.
-- 2. Go to the SQL Editor and create a new query.
-- 3. Paste the contents of this file and click "Run".
-- 4. In your local development env, copy `.env.example` to `.env` and define:
--    - VITE_SUPABASE_URL=your-supabase-project-url
--    - VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
-- ============================================================================

-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create canvases table
CREATE TABLE IF NOT EXISTS public.canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_standalone BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create plugin_data table
CREATE TABLE IF NOT EXISTS public.plugin_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    ref_id UUID NOT NULL,
    data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable realtime subscriptions for database synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.folders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.plugin_data;

-- Disable Row Level Security (RLS) for simple single-user edge sync
ALTER TABLE public.workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvases DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_data DISABLE ROW LEVEL SECURITY;
