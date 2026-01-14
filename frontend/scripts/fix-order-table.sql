-- SQL Script to fix Order table columns
-- This script adds missing columns to Order table

-- Add orderNumber column (CRITICAL - this is causing the error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'orderNumber'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "orderNumber" VARCHAR(255);
        -- Generate order numbers for existing orders
        -- Use CURRENT_TIMESTAMP since createdAt might not exist yet
        UPDATE "Order" 
        SET "orderNumber" = 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(id::text, 3, '0')
        WHERE "orderNumber" IS NULL OR "orderNumber" = '';
        -- Make it unique
        CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
        ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
        RAISE NOTICE '✅ Kolom orderNumber berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom orderNumber sudah ada';
    END IF;
END $$;

-- Add addressId column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'addressId'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "addressId" INTEGER;
        -- If there's an old address_id column, copy it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'address_id'
        ) THEN
            UPDATE "Order" SET "addressId" = address_id WHERE "addressId" IS NULL;
        END IF;
        -- Add foreign key if addressId is not null
        IF EXISTS (SELECT 1 FROM "Order" WHERE "addressId" IS NOT NULL) THEN
            ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" 
            FOREIGN KEY ("addressId") REFERENCES "Address"(id);
        END IF;
        CREATE INDEX IF NOT EXISTS "Order_addressId_idx" ON "Order"("addressId");
        RAISE NOTICE '✅ Kolom addressId berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom addressId sudah ada';
    END IF;
END $$;

-- Add paymentId column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'paymentId'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "paymentId" INTEGER;
        CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentId_key" ON "Order"("paymentId") WHERE "paymentId" IS NOT NULL;
        CREATE INDEX IF NOT EXISTS "Order_paymentId_idx" ON "Order"("paymentId");
        RAISE NOTICE '✅ Kolom paymentId berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom paymentId sudah ada';
    END IF;
END $$;

-- Add paymentStatus column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'paymentStatus'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "paymentStatus" VARCHAR(50) DEFAULT 'unpaid';
        UPDATE "Order" SET "paymentStatus" = 'unpaid' WHERE "paymentStatus" IS NULL;
        ALTER TABLE "Order" ALTER COLUMN "paymentStatus" SET NOT NULL;
        RAISE NOTICE '✅ Kolom paymentStatus berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom paymentStatus sudah ada';
    END IF;
END $$;

-- Add subtotal column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN subtotal DECIMAL(12, 2);
        -- If there's total_price, use it as subtotal
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'total_price'
        ) THEN
            UPDATE "Order" SET subtotal = total_price WHERE subtotal IS NULL;
        END IF;
        ALTER TABLE "Order" ALTER COLUMN subtotal SET NOT NULL;
        ALTER TABLE "Order" ALTER COLUMN subtotal SET DEFAULT 0;
        RAISE NOTICE '✅ Kolom subtotal berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom subtotal sudah ada';
    END IF;
END $$;

-- Add discount column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'discount'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN discount DECIMAL(12, 2) DEFAULT 0;
        ALTER TABLE "Order" ALTER COLUMN discount SET NOT NULL;
        RAISE NOTICE '✅ Kolom discount berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom discount sudah ada';
    END IF;
END $$;

-- Add tax column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'tax'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN tax DECIMAL(12, 2) DEFAULT 0;
        ALTER TABLE "Order" ALTER COLUMN tax SET NOT NULL;
        RAISE NOTICE '✅ Kolom tax berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom tax sudah ada';
    END IF;
END $$;

-- Add shippingCost column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'shippingCost'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippingCost" DECIMAL(12, 2) DEFAULT 0;
        ALTER TABLE "Order" ALTER COLUMN "shippingCost" SET NOT NULL;
        RAISE NOTICE '✅ Kolom shippingCost berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom shippingCost sudah ada';
    END IF;
END $$;

-- Add total column (CRITICAL - this is causing the error)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'total'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN total DECIMAL(12, 2);
        -- If there's total_price, use it as total
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'total_price'
        ) THEN
            UPDATE "Order" SET total = total_price WHERE total IS NULL;
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'subtotal'
        ) THEN
            UPDATE "Order" SET total = COALESCE(subtotal, 0) + COALESCE(discount, 0) + COALESCE(tax, 0) + COALESCE("shippingCost", 0) WHERE total IS NULL;
        END IF;
        ALTER TABLE "Order" ALTER COLUMN total SET NOT NULL;
        ALTER TABLE "Order" ALTER COLUMN total SET DEFAULT 0;
        RAISE NOTICE '✅ Kolom total berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom total sudah ada';
    END IF;
END $$;

-- Make legacy total_price column optional and safe (to avoid NOT NULL errors)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'total_price'
    ) THEN
        -- Backfill from total if possible
        UPDATE "Order"
        SET total_price = COALESCE(total_price, COALESCE(total, 0))
        WHERE total_price IS NULL;

        -- Allow NULL and set a default so new inserts from Prisma don't fail
        ALTER TABLE "Order" ALTER COLUMN total_price DROP NOT NULL;
        ALTER TABLE "Order" ALTER COLUMN total_price SET DEFAULT 0;

        RAISE NOTICE '✅ Kolom legacy total_price kini optional dengan default 0';
    ELSE
        RAISE NOTICE '✓ Kolom legacy total_price tidak ditemukan (aman)';
    END IF;
END $$;

-- Add notes column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'notes'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN notes TEXT;
        RAISE NOTICE '✅ Kolom notes berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom notes sudah ada';
    END IF;
END $$;

-- Add trackingNumber column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'trackingNumber'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "trackingNumber" VARCHAR(255);
        RAISE NOTICE '✅ Kolom trackingNumber berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom trackingNumber sudah ada';
    END IF;
END $$;

-- Add shippingProvider column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'shippingProvider'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippingProvider" VARCHAR(255);
        RAISE NOTICE '✅ Kolom shippingProvider berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom shippingProvider sudah ada';
    END IF;
END $$;

-- Add shippedAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'shippedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP;
        RAISE NOTICE '✅ Kolom shippedAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom shippedAt sudah ada';
    END IF;
END $$;

-- Add deliveredAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'deliveredAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP;
        RAISE NOTICE '✅ Kolom deliveredAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom deliveredAt sudah ada';
    END IF;
END $$;

-- Add cancelledAt column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'cancelledAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "cancelledAt" TIMESTAMP;
        RAISE NOTICE '✅ Kolom cancelledAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom cancelledAt sudah ada';
    END IF;
END $$;

-- Add cancelReason column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'cancelReason'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;
        RAISE NOTICE '✅ Kolom cancelReason berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom cancelReason sudah ada';
    END IF;
END $$;

-- Add createdAt column (if using camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Copy from created_at if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'created_at'
        ) THEN
            UPDATE "Order" SET "createdAt" = created_at WHERE "createdAt" IS NULL;
        END IF;
        RAISE NOTICE '✅ Kolom createdAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom createdAt sudah ada';
    END IF;
END $$;

-- Add updatedAt column (if using camelCase)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "Order" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        -- Copy from updated_at if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'Order' AND column_name = 'updated_at'
        ) THEN
            UPDATE "Order" SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL;
        END IF;
        RAISE NOTICE '✅ Kolom updatedAt berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom updatedAt sudah ada';
    END IF;
END $$;

-- Update userId column name if needed (from user_id to userId)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'user_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Order' AND column_name = 'userId'
    ) THEN
        ALTER TABLE "Order" RENAME COLUMN user_id TO "userId";
        RAISE NOTICE '✅ Kolom user_id diubah menjadi userId';
    ELSE
        RAISE NOTICE '✓ Kolom userId sudah ada';
    END IF;
END $$;

-- Verify all required columns exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Order' 
AND column_name IN ('id', 'orderNumber', 'userId', 'addressId', 'paymentId', 'status', 'paymentStatus', 'subtotal', 'discount', 'tax', 'shippingCost', 'total', 'notes', 'trackingNumber', 'shippingProvider', 'shippedAt', 'deliveredAt', 'cancelledAt', 'cancelReason', 'createdAt', 'updatedAt')
ORDER BY column_name;

-- =======================
-- ORDER ITEM TABLE FIXES
-- =======================

-- Ensure OrderItem has camelCase foreign keys to match Prisma schema
DO $$ 
BEGIN
    -- Add orderId column if missing, migrate from order_id, and create FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'orderId'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "orderId" INTEGER;

        -- Copy from legacy order_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderItem' AND column_name = 'order_id'
        ) THEN
            UPDATE "OrderItem" SET "orderId" = order_id WHERE "orderId" IS NULL;
        END IF;

        -- Add foreign key if possible
        IF EXISTS (SELECT 1 FROM "OrderItem" WHERE "orderId" IS NOT NULL) THEN
            ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" 
            FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE;
        END IF;

        CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

        RAISE NOTICE '✅ Kolom orderId di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom orderId di OrderItem sudah ada';
    END IF;

    -- Add productId column if missing, migrate from product_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'productId'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "productId" INTEGER;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderItem' AND column_name = 'product_id'
        ) THEN
            UPDATE "OrderItem" SET "productId" = product_id WHERE "productId" IS NULL;
        END IF;

        CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

        RAISE NOTICE '✅ Kolom productId di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom productId di OrderItem sudah ada';
    END IF;

    -- Add productSizeId column if missing, migrate from product_size_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'productSizeId'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "productSizeId" INTEGER;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'OrderItem' AND column_name = 'product_size_id'
        ) THEN
            UPDATE "OrderItem" SET "productSizeId" = product_size_id WHERE "productSizeId" IS NULL;
        END IF;

        CREATE INDEX IF NOT EXISTS "OrderItem_productSizeId_idx" ON "OrderItem"("productSizeId");

        RAISE NOTICE '✅ Kolom productSizeId di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom productSizeId di OrderItem sudah ada';
    END IF;

    -- Add productName column to match Prisma schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'productName'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "productName" VARCHAR(255);

        -- Optional backfill from Product table if available
        BEGIN
            UPDATE "OrderItem" oi
            SET "productName" = p.name
            FROM "Product" p
            WHERE oi."productId" = p.id
              AND oi."productName" IS NULL;
        EXCEPTION
            WHEN undefined_table THEN
                -- If Product table not available, ignore
                NULL;
        END;

        RAISE NOTICE '✅ Kolom productName di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom productName di OrderItem sudah ada';
    END IF;

    -- Add subtotal column to match Prisma schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'subtotal'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN subtotal DECIMAL(12, 2);

        -- Backfill from quantity * price for existing rows
        UPDATE "OrderItem"
        SET subtotal = COALESCE(subtotal, 0) + (COALESCE(quantity, 0) * COALESCE(price, 0))
        WHERE subtotal IS NULL;

        ALTER TABLE "OrderItem" ALTER COLUMN subtotal SET NOT NULL;
        ALTER TABLE "OrderItem" ALTER COLUMN subtotal SET DEFAULT 0;

        RAISE NOTICE '✅ Kolom subtotal di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom subtotal di OrderItem sudah ada';
    END IF;
END $$;

-- Ensure OrderItem has createdAt column (to match Prisma schema)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'OrderItem' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        -- Copy from legacy created_at if exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'OrderItem' AND column_name = 'created_at'
        ) THEN
            UPDATE "OrderItem" SET "createdAt" = created_at WHERE "createdAt" IS NULL;
        END IF;

        RAISE NOTICE '✅ Kolom createdAt di OrderItem berhasil ditambahkan';
    ELSE
        RAISE NOTICE '✓ Kolom createdAt di OrderItem sudah ada';
    END IF;
END $$;
