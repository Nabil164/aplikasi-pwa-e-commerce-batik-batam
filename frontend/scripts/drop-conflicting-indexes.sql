-- Script to drop all conflicting indexes/constraints before db push
-- Run this in Neon Console SQL Editor, then run: npx prisma@5.1.0 db push --accept-data-loss

-- Drop all unique constraints/indexes that might conflict
DROP INDEX IF EXISTS "Order_paymentId_key";
DROP INDEX IF EXISTS "Product_sku_key";
DROP INDEX IF EXISTS "Product_slug_key";
DROP INDEX IF EXISTS "Order_orderNumber_key";
DROP INDEX IF EXISTS "Payment_transactionId_key";
DROP INDEX IF EXISTS "Payment_orderId_key";
DROP INDEX IF EXISTS "User_email_key";

-- Drop other indexes that might conflict (optional, but safe)
DROP INDEX IF EXISTS "Order_paymentId_idx";
DROP INDEX IF EXISTS "Order_addressId_idx";
DROP INDEX IF EXISTS "Order_userId_idx";
DROP INDEX IF EXISTS "Order_status_idx";
DROP INDEX IF EXISTS "Order_createdAt_idx";
DROP INDEX IF EXISTS "OrderItem_orderId_idx";
DROP INDEX IF EXISTS "OrderItem_productId_idx";
DROP INDEX IF EXISTS "OrderItem_productSizeId_idx";
DROP INDEX IF EXISTS "ProductImage_productId_idx";
DROP INDEX IF EXISTS "ProductSize_productId_idx";
DROP INDEX IF EXISTS "Cart_userId_key";
DROP INDEX IF EXISTS "Wishlist_userId_productId_key";
DROP INDEX IF EXISTS "Wishlist_userId_idx";
DROP INDEX IF EXISTS "Wishlist_productId_idx";
DROP INDEX IF EXISTS "Address_userId_idx";
DROP INDEX IF EXISTS "Payment_userId_idx";
DROP INDEX IF EXISTS "Payment_transactionId_idx";
DROP INDEX IF EXISTS "Payment_status_idx";
DROP INDEX IF EXISTS "Payment_createdAt_idx";
DROP INDEX IF EXISTS "PaymentHistory_paymentId_idx";
DROP INDEX IF EXISTS "PaymentHistory_createdAt_idx";
DROP INDEX IF EXISTS "Notification_userId_idx";
DROP INDEX IF EXISTS "Notification_isRead_idx";
DROP INDEX IF EXISTS "Notification_createdAt_idx";

-- Note: This will NOT drop the tables or data, only indexes/constraints
-- After running this, run: npx prisma@5.1.0 db push --accept-data-loss
