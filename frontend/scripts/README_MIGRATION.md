# 🔧 Cara Menambahkan Kolom yang Hilang ke Database

## Masalah
Error: `The column Product.slug does not exist in the current database`

## Solusi

### Opsi 1: Jalankan SQL Script (Paling Mudah)

1. Buka Neon Console atau database client (pgAdmin, DBeaver, dll)
2. Copy isi file `fix-product-table.sql`
3. Jalankan SQL script tersebut di database Anda

**Atau menggunakan psql:**
```bash
cd frontend
psql $DATABASE_URL -f scripts/fix-product-table.sql
```

### Opsi 2: Menggunakan Prisma Migrate

```bash
cd frontend
# Pastikan DATABASE_URL ada di .env.local
npx prisma@5.1.0 migrate dev --name add_missing_columns
```

### Opsi 3: Menggunakan Prisma DB Push (Sync langsung)

```bash
cd frontend
# Pastikan DATABASE_URL ada di .env.local
npx prisma@5.1.0 db push
```

## Verifikasi

Setelah migration, pastikan kolom berikut ada di tabel Product:
- ✅ `slug` (VARCHAR, UNIQUE, NOT NULL)
- ✅ `discount` (DECIMAL)
- ✅ `subcategory` (VARCHAR)
- ✅ `sku` (VARCHAR, UNIQUE)
- ✅ `weight` (FLOAT)
- ✅ `createdAt` (TIMESTAMP)
- ✅ `updatedAt` (TIMESTAMP)

## Catatan

- Script akan otomatis generate slug untuk produk yang sudah ada
- Script aman dijalankan berkali-kali (menggunakan IF NOT EXISTS)
- Tidak akan menghapus data yang sudah ada

