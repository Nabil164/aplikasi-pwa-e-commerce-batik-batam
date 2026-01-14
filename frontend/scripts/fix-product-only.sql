-- SQL Script to fix ONLY Product table columns
-- This script ONLY adds missing columns to Product table, doesn't touch other tables

-- Add stock column (CRITICAL - this is causing the error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'stock'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN stock INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE '✅ Kolom stock berhasil ditambahkan';
    ELSE
        -- Ensure stock is NOT NULL
        BEGIN
            ALTER TABLE "Product" ALTER COLUMN stock SET NOT NULL;
            ALTER TABLE "Product" ALTER COLUMN stock SET DEFAULT 0;
            UPDATE "Product" SET stock = 0 WHERE stock IS NULL;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
        RAISE NOTICE '✓ Kolom stock sudah ada (diperbarui)';
    END IF;
END $$;

-- Add slug column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN slug VARCHAR(255);
        UPDATE "Product" 
        SET slug = LOWER(REGEXP_REPLACE(COALESCE(name, 'product-' || id::text), '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL OR slug = '';
        ALTER TABLE "Product" ALTER COLUMN slug SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);
        RAISE NOTICE '✅ Kolom slug berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom slug sudah ada';
    END IF;
END $$;

-- Add discount column
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

-- Add subcategory column
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

-- Add sku column
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

-- Add weight column
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

-- Add createdAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
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

-- Add updatedAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
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

-- Verify all required columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Product' 
AND column_name IN ('id', 'name', 'slug', 'description', 'price', 'discount', 'category', 'subcategory', 'stock', 'sku', 'weight', 'createdAt', 'updatedAt')
ORDER BY column_name;

