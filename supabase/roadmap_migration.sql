-- Roadmap Data Migration
-- Allows storing roadmap data in team_settings without requiring project_id
-- Run this in the Supabase SQL Editor

-- 1. Make project_id nullable (roadmap settings are global, not per-project)
ALTER TABLE team_settings ALTER COLUMN project_id DROP NOT NULL;

-- 2. Drop the existing unique constraint and re-create with a more flexible approach
ALTER TABLE team_settings DROP CONSTRAINT IF EXISTS team_settings_project_id_setting_key_key;

-- 3. Create a unique index that handles null project_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_settings_key
    ON team_settings (setting_key) WHERE project_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_settings_project_key
    ON team_settings (project_id, setting_key) WHERE project_id IS NOT NULL;

-- 4. Drop the FK constraint so null project_id works
ALTER TABLE team_settings DROP CONSTRAINT IF EXISTS team_settings_project_id_fkey;
ALTER TABLE team_settings
    ADD CONSTRAINT team_settings_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
