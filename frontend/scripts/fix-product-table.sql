-- SQL Script to add missing columns to Product table
-- Run this directly in your database (via psql, pgAdmin, or Neon console)

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN slug VARCHAR(255);
        
        -- Generate slugs for existing products
        UPDATE "Product" 
        SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL OR slug = '';
        
        -- Make slug NOT NULL and unique
        ALTER TABLE "Product" ALTER COLUMN slug SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);
        
        RAISE NOTICE 'Kolom slug berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom slug sudah ada';
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
        RAISE NOTICE 'Kolom discount berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom discount sudah ada';
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
        RAISE NOTICE 'Kolom subcategory berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom subcategory sudah ada';
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
        RAISE NOTICE 'Kolom sku berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom sku sudah ada';
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
        RAISE NOTICE 'Kolom weight berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom weight sudah ada';
    END IF;
END $$;

-- Add createdAt column (if using camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Kolom createdAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom createdAt sudah ada';
    END IF;
END $$;

-- Add updatedAt column (if using camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Product" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Kolom updatedAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE 'Kolom updatedAt sudah ada';
    END IF;
END $$;

-- Update existing products to set createdAt and updatedAt if they're NULL
UPDATE "Product" 
SET "createdAt" = COALESCE("createdAt", created_at, CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", updated_at, CURRENT_TIMESTAMP)
WHERE "createdAt" IS NULL OR "updatedAt" IS NULL;

SELECT 'Migration selesai! Semua kolom sudah ditambahkan.' as status;

