ALTER TABLE announcements ADD COLUMN type text NOT NULL DEFAULT 'info';
ALTER TABLE live_activity ADD COLUMN user_display_name text;
ALTER TABLE live_activity ADD COLUMN is_real boolean NOT NULL DEFAULT true;