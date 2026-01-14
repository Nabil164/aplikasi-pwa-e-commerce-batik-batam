-- Migration: Fix Address table to match Prisma schema
-- This migration adds camelCase columns that match Prisma schema and migrates data from snake_case columns

-- Add userId column (from user_id)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "userId" INTEGER;
        
        -- Migrate data from user_id to userId
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'user_id'
        ) THEN
            UPDATE "Address" SET "userId" = user_id WHERE "userId" IS NULL;
        END IF;
        
        -- Add foreign key constraint
        ALTER TABLE "Address" 
        ADD CONSTRAINT "Address_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
        
        -- Make it NOT NULL after migration
        ALTER TABLE "Address" ALTER COLUMN "userId" SET NOT NULL;
        
        -- Create index
        CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address"("userId");
        
        RAISE NOTICE '✅ Kolom userId berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom userId sudah ada';
    END IF;
END $$;

-- Add recipientName column (from recipient_name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'recipientName'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "recipientName" VARCHAR(255);
        
        -- Migrate data from recipient_name to recipientName
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'recipient_name'
        ) THEN
            UPDATE "Address" SET "recipientName" = recipient_name WHERE "recipientName" IS NULL;
        END IF;
        
        -- Make it NOT NULL after migration
        ALTER TABLE "Address" ALTER COLUMN "recipientName" SET NOT NULL;
        
        RAISE NOTICE '✅ Kolom recipientName berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom recipientName sudah ada';
    END IF;
END $$;

-- Add phoneNumber column (from recipient_phone)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'phoneNumber'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "phoneNumber" VARCHAR(255);
        
        -- Migrate data from recipient_phone to phoneNumber
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'recipient_phone'
        ) THEN
            UPDATE "Address" SET "phoneNumber" = recipient_phone WHERE "phoneNumber" IS NULL;
        END IF;
        
        -- Make it NOT NULL after migration
        ALTER TABLE "Address" ALTER COLUMN "phoneNumber" SET NOT NULL;
        
        RAISE NOTICE '✅ Kolom phoneNumber berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom phoneNumber sudah ada';
    END IF;
END $$;

-- Add postalCode column (from postal_code)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'postalCode'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "postalCode" VARCHAR(255);
        
        -- Migrate data from postal_code to postalCode
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'postal_code'
        ) THEN
            UPDATE "Address" SET "postalCode" = postal_code WHERE "postalCode" IS NULL;
        END IF;
        
        -- Make it NOT NULL after migration
        ALTER TABLE "Address" ALTER COLUMN "postalCode" SET NOT NULL;
        
        RAISE NOTICE '✅ Kolom postalCode berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom postalCode sudah ada';
    END IF;
END $$;

-- Add streetAddress column (from address)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'streetAddress'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "streetAddress" TEXT;
        
        -- Migrate data from address to streetAddress
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'address'
        ) THEN
            UPDATE "Address" SET "streetAddress" = address WHERE "streetAddress" IS NULL;
        END IF;
        
        -- Make it NOT NULL after migration
        ALTER TABLE "Address" ALTER COLUMN "streetAddress" SET NOT NULL;
        
        RAISE NOTICE '✅ Kolom streetAddress berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom streetAddress sudah ada';
    END IF;
END $$;

-- Add isDefault column (from is_default)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'isDefault'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "isDefault" BOOLEAN DEFAULT FALSE;
        
        -- Migrate data from is_default to isDefault
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'is_default'
        ) THEN
            UPDATE "Address" SET "isDefault" = is_default WHERE "isDefault" IS NULL;
        END IF;
        
        RAISE NOTICE '✅ Kolom isDefault berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom isDefault sudah ada';
    END IF;
END $$;

-- Add createdAt column (from created_at)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Migrate data from created_at to createdAt
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'created_at'
        ) THEN
            UPDATE "Address" SET "createdAt" = created_at WHERE "createdAt" IS NULL;
        END IF;
        
        RAISE NOTICE '✅ Kolom createdAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom createdAt sudah ada';
    END IF;
END $$;

-- Add updatedAt column (from updated_at)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Address' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Address" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        -- Migrate data from updated_at to updatedAt
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Address' AND column_name = 'updated_at'
        ) THEN
            UPDATE "Address" SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL;
        END IF;
        
        RAISE NOTICE '✅ Kolom updatedAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom updatedAt sudah ada';
    END IF;
END $$;

