-- ============================================
-- Supabase Auth Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create invited_emails table (invite-only access control)
CREATE TABLE IF NOT EXISTS invited_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  invited_by TEXT,
  role TEXT DEFAULT 'member',
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add auth_id column to users table (links to auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create index on auth_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- 4. Enable Row Level Security on all tables
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invited_emails ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Allow authenticated users full access
-- (Since this is a team tool with invite-only, all authenticated users can access everything)

-- Issues
CREATE POLICY "Authenticated users can view issues" ON issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert issues" ON issues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update issues" ON issues FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete issues" ON issues FOR DELETE TO authenticated USING (true);

-- Users
CREATE POLICY "Authenticated users can view users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert users" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update users" ON users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Sprints
CREATE POLICY "Authenticated users can view sprints" ON sprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sprints" ON sprints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sprints" ON sprints FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sprints" ON sprints FOR DELETE TO authenticated USING (true);

-- Projects
CREATE POLICY "Authenticated users can view projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update projects" ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Departments
CREATE POLICY "Authenticated users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert departments" ON departments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update departments" ON departments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Games
CREATE POLICY "Authenticated users can view games" ON games FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert games" ON games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update games" ON games FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Field Config tables (priorities, statuses, issue_types, labels) - read/write for authenticated
CREATE POLICY "Authenticated users can view priorities" ON priorities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage priorities" ON priorities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view statuses" ON statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage statuses" ON statuses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view issue_types" ON issue_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage issue_types" ON issue_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view labels" ON labels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage labels" ON labels FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Saved Filters
CREATE POLICY "Authenticated users can view saved_filters" ON saved_filters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage saved_filters" ON saved_filters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Team Settings
CREATE POLICY "Authenticated users can view team_settings" ON team_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage team_settings" ON team_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invited Emails - only authenticated users can view/manage invites
CREATE POLICY "Authenticated users can view invited_emails" ON invited_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage invited_emails" ON invited_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anon to check if email is invited (needed during sign-up flow)
CREATE POLICY "Anon can check invited emails" ON invited_emails FOR SELECT TO anon USING (true);

-- 6. Handle issue_templates table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issue_templates') THEN
    EXECUTE 'ALTER TABLE issue_templates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Authenticated users can view issue_templates" ON issue_templates FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "Authenticated users can manage issue_templates" ON issue_templates FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- ============================================
-- IMPORTANT: After running this migration,
-- add your email to invited_emails:
--
-- INSERT INTO invited_emails (email, invited_by, role)
-- VALUES ('your-email@gmail.com', 'system', 'admin');
-- ============================================
