-- Migration: Create ProductSize and related tables
-- This migration creates tables that exist in Prisma schema but missing in database

-- Drop ProductSize table if it exists with wrong structure
DROP TABLE IF EXISTS "ProductSize" CASCADE;

-- Create ProductSize table
CREATE TABLE "ProductSize" (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  size VARCHAR(255) NOT NULL,
  stock INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on productId for faster lookups
CREATE INDEX idx_product_size_product_id ON "ProductSize"("productId");

-- Drop ProductImage table if it exists with wrong structure
DROP TABLE IF EXISTS "ProductImage" CASCADE;

-- Create ProductImage table
CREATE TABLE "ProductImage" (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "imageUrl" VARCHAR(255) NOT NULL,
  "altText" VARCHAR(255),
  "isPrimary" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on productId for ProductImage
CREATE INDEX idx_product_image_product_id ON "ProductImage"("productId");

-- Drop Cart table if it exists with wrong structure
DROP TABLE IF EXISTS "Cart" CASCADE;

-- Create Cart table
CREATE TABLE "Cart" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on userId for Cart
CREATE INDEX idx_cart_user_id ON "Cart"("userId");

-- Drop CartItem table if it exists with wrong structure
DROP TABLE IF EXISTS "CartItem" CASCADE;

-- Create CartItem table
CREATE TABLE "CartItem" (
  id SERIAL PRIMARY KEY,
  "cartId" INTEGER NOT NULL REFERENCES "Cart"(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "productSizeId" INTEGER NOT NULL REFERENCES "ProductSize"(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for CartItem
CREATE INDEX idx_cart_item_cart_id ON "CartItem"("cartId");
CREATE INDEX idx_cart_item_product_id ON "CartItem"("productId");
CREATE INDEX idx_cart_item_product_size_id ON "CartItem"("productSizeId");

