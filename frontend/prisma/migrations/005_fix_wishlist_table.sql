-- Migration: Fix Wishlist table column names to match Prisma schema (camelCase)
-- This migration renames columns from snake_case to camelCase

-- Check if columns exist before renaming
DO $$
BEGIN
    -- Rename user_id to userId
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Wishlist' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE "Wishlist" RENAME COLUMN "user_id" TO "userId";
        RAISE NOTICE 'Renamed user_id to userId';
    END IF;

    -- Rename product_id to productId
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Wishlist' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE "Wishlist" RENAME COLUMN "product_id" TO "productId";
        RAISE NOTICE 'Renamed product_id to productId';
    END IF;

    -- Rename created_at to createdAt
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Wishlist' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "Wishlist" RENAME COLUMN "created_at" TO "createdAt";
        RAISE NOTICE 'Renamed created_at to createdAt';
    END IF;
END $$;

-- Recreate indexes with new column names
DROP INDEX IF EXISTS idx_wishlist_user_id;
CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx" ON "Wishlist"("userId");
CREATE INDEX IF NOT EXISTS "Wishlist_productId_idx" ON "Wishlist"("productId");

-- Recreate unique constraint with new column names
DO $$
BEGIN
    -- Drop old unique constraint if exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Wishlist_user_id_product_id_key'
    ) THEN
        ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_user_id_product_id_key";
    END IF;
    
    -- Create new unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Wishlist_userId_productId_key'
    ) THEN
        ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_productId_key" UNIQUE ("userId", "productId");
    END IF;
END $$;

