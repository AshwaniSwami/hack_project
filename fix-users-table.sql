
-- Fix users table to match schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password varchar;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar DEFAULT 'member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_responses jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Add unique constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_username_unique' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END $$;

-- Check current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
