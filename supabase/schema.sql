-- Supabase Database Schema for Agile Dashboard
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL
);

-- Sprints
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  state TEXT DEFAULT 'planned'
);

-- Priorities (Field Config)
CREATE TABLE IF NOT EXISTS priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Statuses (Field Config)
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  bg_color TEXT,
  text_color TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Issue Types (Field Config)
CREATE TABLE IF NOT EXISTS issue_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  bg_color TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Labels (Field Config)
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT
);

-- Issues (Main table)
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  story_points INTEGER,
  original_estimate INTEGER,
  labels JSONB DEFAULT '[]',
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  start_date DATE,
  due_date DATE,
  work_logs JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  is_deleted BOOLEAN DEFAULT FALSE,
  -- Bug-specific fields (used when type = 'bug')
  tis_impact INTEGER,           -- 1-3: Low, Medium, High impact
  tis_size INTEGER,             -- 1-3: Small, Medium, Large fix size
  tis_time INTEGER,             -- 1-3: Quick, Normal, Long estimated fix time
  retest_status TEXT,           -- pending, passed, failed
  found_in_build TEXT,          -- AAB version where bug was found
  fixed_in_build TEXT,          -- AAB version where bug was fixed
  linked_test_case_id UUID,     -- Reference to test_case that found this bug
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Filters
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Settings (shared view preferences, card field visibility, etc.)
CREATE TABLE IF NOT EXISTS team_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, setting_key)
);

-- ============================================
-- QA SYSTEM TABLES
-- ============================================

-- Test Suites (groups of test cases)
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Cases (individual test scenarios)
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  steps JSONB DEFAULT '[]',  -- [{step: 1, action: "...", expected: "..."}]
  status TEXT DEFAULT 'pending',  -- pending, passed, failed, blocked
  linked_issue_ids JSONB DEFAULT '[]',  -- Array of issue UUIDs this case tests
  found_bug_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  tested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  tested_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bug Statuses (separate workflow for bugs)
CREATE TABLE IF NOT EXISTS bug_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  bg_color TEXT,
  text_color TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_sprint_id ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_parent_id ON issues(parent_id);

-- QA System indexes
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_issues_retest_status ON issues(retest_status);
CREATE INDEX IF NOT EXISTS idx_test_suites_sprint_id ON test_suites(sprint_id);
CREATE INDEX IF NOT EXISTS idx_test_suites_project_id ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON test_cases(suite_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);

-- Enable Row Level Security (RLS) - optional for now
-- ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to issues table
DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to test_suites table
DROP TRIGGER IF EXISTS update_test_suites_updated_at ON test_suites;
CREATE TRIGGER update_test_suites_updated_at
    BEFORE UPDATE ON test_suites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to test_cases table
DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
CREATE TRIGGER update_test_cases_updated_at
    BEFORE UPDATE ON test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed bug statuses
INSERT INTO bug_statuses (key, label, bg_color, text_color, sort_order) VALUES
  ('new', 'New', '#FEE2E2', '#DC2626', 1),
  ('confirmed', 'Confirmed', '#FEF3C7', '#D97706', 2),
  ('assigned', 'Assigned', '#DBEAFE', '#2563EB', 3),
  ('in_dev', 'In Development', '#E0E7FF', '#4F46E5', 4),
  ('ready_retest', 'Ready for Retest', '#D1FAE5', '#059669', 5),
  ('retesting', 'Retesting', '#CFFAFE', '#0891B2', 6),
  ('passed', 'Passed', '#BBF7D0', '#16A34A', 7),
  ('failed', 'Failed', '#FECACA', '#DC2626', 8),
  ('closed', 'Closed', '#E5E7EB', '#6B7280', 9)
ON CONFLICT (key) DO NOTHING;
