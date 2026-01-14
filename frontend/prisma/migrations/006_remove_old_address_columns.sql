-- Migration: Remove old snake_case columns from Address table
-- This migration removes the old columns after migration to camelCase is complete

DO $$
BEGIN
    -- Drop old foreign key constraint on user_id if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Address_user_id_fkey'
    ) THEN
        ALTER TABLE "Address" DROP CONSTRAINT "Address_user_id_fkey";
        RAISE NOTICE 'Dropped old foreign key constraint Address_user_id_fkey';
    END IF;

    -- Drop old index on user_id if exists
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'Address' AND indexname = 'idx_address_user_id'
    ) THEN
        DROP INDEX IF EXISTS idx_address_user_id;
        RAISE NOTICE 'Dropped old index idx_address_user_id';
    END IF;

    -- Remove old user_id column if exists (only if userId exists and has data)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'user_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'userId'
    ) THEN
        -- Check if all data has been migrated
        IF NOT EXISTS (
            SELECT 1 FROM "Address" 
            WHERE "userId" IS NULL AND user_id IS NOT NULL
        ) THEN
            ALTER TABLE "Address" DROP COLUMN user_id;
            RAISE NOTICE 'Dropped old column user_id';
        ELSE
            RAISE NOTICE 'Cannot drop user_id: some rows have userId NULL';
        END IF;
    END IF;

    -- Remove other old columns if they exist and new columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'recipient_name'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'recipientName'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS recipient_name;
        RAISE NOTICE 'Dropped old column recipient_name';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'recipient_phone'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'phoneNumber'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS recipient_phone;
        RAISE NOTICE 'Dropped old column recipient_phone';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'postal_code'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'postalCode'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS postal_code;
        RAISE NOTICE 'Dropped old column postal_code';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'address'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'streetAddress'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS address;
        RAISE NOTICE 'Dropped old column address';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'is_default'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'isDefault'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS is_default;
        RAISE NOTICE 'Dropped old column is_default';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'created_at'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS created_at;
        RAISE NOTICE 'Dropped old column created_at';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'updated_at'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Address" DROP COLUMN IF EXISTS updated_at;
        RAISE NOTICE 'Dropped old column updated_at';
    END IF;
END $$;

