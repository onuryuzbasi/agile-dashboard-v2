-- QA Workflow: Add Testing status
-- Run this in Supabase SQL Editor to enable the Testing status on the board

-- Insert 'testing' status (adjust 'order' value based on existing statuses)
INSERT INTO statuses (key, label, color, "order", project_id)
SELECT 
    'testing',
    'Testing',
    '#f59e0b',
    4,
    id
FROM projects
WHERE NOT EXISTS (
    SELECT 1 FROM statuses WHERE key = 'testing'
);

-- If you need to update the order of existing statuses to make room:
-- UPDATE statuses SET "order" = "order" + 1 WHERE key = 'done';
