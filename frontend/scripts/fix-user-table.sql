-- SQL Script to fix User table columns
-- This script adds missing columns to User table

-- Add avatar column (CRITICAL - this is causing the error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE "User" ADD COLUMN avatar VARCHAR(255);
        RAISE NOTICE '✅ Kolom avatar berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom avatar sudah ada';
    END IF;
END $$;

-- Verify all required columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('id', 'email', 'name', 'password', 'role', 'avatar', 'createdAt', 'updatedAt')
ORDER BY column_name;

