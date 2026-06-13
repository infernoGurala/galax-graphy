-- Supabase DDL Schema for Galax Graphy

-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) as this is a private single-user app
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

-- 2. Create Folders Table
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE folders DISABLE ROW LEVEL SECURITY;

-- 3. Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY,
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- 4. Create Canvases Table
CREATE TABLE IF NOT EXISTS canvases (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_standalone BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE canvases DISABLE ROW LEVEL SECURITY;

-- 5. Create Plugin Data Table
CREATE TABLE IF NOT EXISTS plugin_data (
    id UUID PRIMARY KEY,
    plugin_id TEXT NOT NULL,
    namespace TEXT NOT NULL,
    ref_id UUID NOT NULL,
    data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE plugin_data DISABLE ROW LEVEL SECURITY;