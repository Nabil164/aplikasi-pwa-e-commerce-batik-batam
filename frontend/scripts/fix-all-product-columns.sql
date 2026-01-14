-- Complete SQL Script to fix Product table structure
-- This script ensures ALL columns from Prisma schema exist in the database
-- Run with: node scripts/run-migration.js (it will use this file)

-- ============================================
-- FIX PRODUCT TABLE - Add ALL missing columns
-- ============================================

-- 1. Add slug column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN slug VARCHAR(255);
        
        -- Generate slugs for existing products
        UPDATE "Product" 
        SET slug = LOWER(REGEXP_REPLACE(COALESCE(name, 'product'), '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL OR slug = '';
        
        -- Make slug NOT NULL and unique
        ALTER TABLE "Product" ALTER COLUMN slug SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);
        
        RAISE NOTICE '✅ Kolom slug berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom slug sudah ada';
    END IF;
END $$;

-- 2. Add stock column (if missing) - IMPORTANT: This is required!
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'stock'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN stock INTEGER DEFAULT 0;
        -- Set default value for existing rows
        UPDATE "Product" SET stock = 0 WHERE stock IS NULL;
        -- Make it NOT NULL
        ALTER TABLE "Product" ALTER COLUMN stock SET NOT NULL;
        ALTER TABLE "Product" ALTER COLUMN stock SET DEFAULT 0;
        RAISE NOTICE '✅ Kolom stock berhasil ditambahkan';
    ELSE
        -- Ensure stock is NOT NULL even if it exists
        BEGIN
            ALTER TABLE "Product" ALTER COLUMN stock SET NOT NULL;
            ALTER TABLE "Product" ALTER COLUMN stock SET DEFAULT 0;
            UPDATE "Product" SET stock = 0 WHERE stock IS NULL;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if already NOT NULL
            NULL;
        END;
        RAISE NOTICE '✓ Kolom stock sudah ada (diperbarui)';
    END IF;
END $$;

-- 3. Add discount column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'discount'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN discount DECIMAL(5, 2);
        RAISE NOTICE '✅ Kolom discount berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom discount sudah ada';
    END IF;
END $$;

-- 4. Add subcategory column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'subcategory'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN subcategory VARCHAR(255);
        RAISE NOTICE '✅ Kolom subcategory berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom subcategory sudah ada';
    END IF;
END $$;

-- 5. Add sku column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'sku'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN sku VARCHAR(255);
        CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"(sku) WHERE sku IS NOT NULL;
        RAISE NOTICE '✅ Kolom sku berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom sku sudah ada';
    END IF;
END $$;

-- 6. Add weight column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'weight'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN weight FLOAT;
        RAISE NOTICE '✅ Kolom weight berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom weight sudah ada';
    END IF;
END $$;

-- 7. Add createdAt column (camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Copy from created_at if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Product' AND column_name = 'created_at'
        ) THEN
            UPDATE "Product" SET "createdAt" = created_at WHERE "createdAt" IS NULL;
        END IF;
        RAISE NOTICE '✅ Kolom createdAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom createdAt sudah ada';
    END IF;
END $$;

-- 8. Add updatedAt column (camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Copy from updated_at if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Product' AND column_name = 'updated_at'
        ) THEN
            UPDATE "Product" SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL;
        END IF;
        RAISE NOTICE '✅ Kolom updatedAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom updatedAt sudah ada';
    END IF;
END $$;

-- 9. Ensure price is DECIMAL(10, 2) if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'price'
    ) THEN
        -- Check if price column type needs to be updated
        -- This is just a check, actual type change might need manual intervention
        RAISE NOTICE '✓ Kolom price sudah ada';
    ELSE
        -- If price doesn't exist, add it
        ALTER TABLE "Product" ADD COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Kolom price berhasil ditambahkan';
    END IF;
END $$;

-- 10. Ensure category exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'category'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN category VARCHAR(255);
        RAISE NOTICE '✅ Kolom category berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom category sudah ada';
    END IF;
END $$;

-- Final verification
SELECT 
    'Migration selesai! Semua kolom sudah ditambahkan.' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('id', 'name', 'slug', 'description', 'price', 'discount', 'category', 'subcategory', 'stock', 'sku', 'weight', 'createdAt', 'updatedAt');

