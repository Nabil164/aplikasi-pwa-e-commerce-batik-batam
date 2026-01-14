# API Routes Fix - Error 405 dan CORS

## Perbaikan yang dilakukan:

1. **Menambahkan OPTIONS handler** untuk CORS preflight di semua route
2. **Menambahkan CORS headers** di semua response (error dan success)
3. **Memastikan method diekspor dengan benar** (GET, POST, OPTIONS)

## Route yang sudah diperbaiki:

- ✅ `/api/auth/register` - POST & OPTIONS (sudah ada CORS headers)
- ✅ `/api/auth/login` - POST & OPTIONS (sudah ada CORS headers)
- ✅ `/api/health` - GET & OPTIONS (sudah ada CORS headers)
- ✅ `/api/cart` - GET, POST, DELETE & OPTIONS (CORS headers ditambahkan)
- ✅ `/api/orders` - GET, POST & OPTIONS (CORS headers ditambahkan)
- ✅ `/api/products` - GET, POST & OPTIONS (CORS headers ditambahkan)

## Route yang masih perlu diperbaiki (menambahkan CORS headers ke error responses):

- `/api/wishlist` - GET, POST, DELETE
- `/api/addresses` - GET, POST
- `/api/addresses/[id]` - PUT, DELETE
- `/api/addresses/[id]/set-default` - PUT
- `/api/admin/dashboard` - GET
- `/api/cart/items/[id]` - PUT, DELETE
- `/api/cart/checkout` - POST
- `/api/notifications` - GET, POST, PUT
- `/api/notifications/[id]` - PUT, DELETE
- `/api/orders/[id]` - GET
- `/api/payments` - POST
- `/api/payments/[id]` - GET, POST
- `/api/payments/callback` - POST
- `/api/products/[id]` - GET, PUT, DELETE
- `/api/auth/profile` - GET, PUT
- `/api/auth/change-password` - PUT

## Testing:

Setelah restart Next.js dev server, test dengan:

```bash
# Test health endpoint
curl -X GET http://localhost:3000/api/health

# Test register endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456","password_confirmation":"123456"}'

# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

## Catatan:

- Pastikan Next.js dev server sudah restart setelah perubahan
- Pastikan file `lib/db.js` ada dan DATABASE_URL sudah dikonfigurasi
- Error 405 biasanya terjadi karena method tidak didukung atau route handler tidak ditemukan


