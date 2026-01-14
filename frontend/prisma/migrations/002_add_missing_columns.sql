-- Migration: Add missing columns to Product table
-- This migration adds columns that exist in Prisma schema but missing in database

-- Add slug column to Product table
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- Add discount column
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS discount DECIMAL(5, 2);

-- Add subcategory column
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS subcategory VARCHAR(255);

-- Add sku column
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS sku VARCHAR(255) UNIQUE;

-- Add weight column
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS weight FLOAT;

-- Add createdAt and updatedAt columns (if using camelCase)
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug);

-- Generate slugs for existing products if they don't have one
UPDATE "Product" 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Make slug NOT NULL after setting values
ALTER TABLE "Product" 
ALTER COLUMN slug SET NOT NULL;

