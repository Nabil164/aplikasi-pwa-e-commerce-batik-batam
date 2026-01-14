/**
 * Seed sample products using images already in /public.
 * Jalankan dari folder frontend:
 *   node scripts/seed-sample-products.js
 *
 * Pastikan DATABASE_URL dan JWT_SECRET sudah di-set.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper sederhana untuk buat slug tanpa perlu package tambahan
function toSlug(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // hapus aksen
    .replace(/[^a-z0-9\s-]/g, '') // buang karakter aneh
    .trim()
    .replace(/\s+/g, '-'); // spasi -> -
}

const sampleProducts = [
  {
    name: 'Blus Pesona Cindur',
    price: 350000,
    category: 'Pakaian Wanita',
    description:
      'Blus batik premium dengan motif khas Cindur, nyaman untuk acara formal maupun kasual.',
    imageUrl: '/wanita1.jpg',
    sizes: [
      { size: 'S', stock: 5 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 6 },
    ],
  },
  {
    name: 'Dress Batik Seruni',
    price: 480000,
    category: 'Pakaian Wanita',
    description:
      'Dress batik elegan dengan potongan modern, cocok untuk acara spesial.',
    imageUrl: '/wanita2.jpg',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 7 },
      { size: 'L', stock: 5 },
    ],
  },
  {
    name: 'Batik Gonggong 2025',
    price: 520000,
    category: 'Pakaian Wanita',
    description:
      'Capsule collection dengan motif Gonggong khas Kepulauan Riau, edisi terbatas.',
    imageUrl: '/wanita4.jpg',
    sizes: [
      { size: 'S', stock: 3 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 4 },
    ],
  },
  {
    name: 'Kemeja Batik Lengan Pendek',
    price: 320000,
    category: 'Pakaian Pria',
    description:
      'Kemeja batik modern lengan pendek, breathable dan ringan untuk aktivitas harian.',
    imageUrl: '/pria1.jpg',
    sizes: [
      { size: 'M', stock: 10 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 6 },
    ],
  },
  {
    name: 'Kemeja Batik Modern Pria',
    price: 340000,
    category: 'Pakaian Pria',
    description:
      'Motif kontemporer dengan sentuhan tradisional, cocok untuk tampilan smart casual.',
    imageUrl: '/pria2.jpg',
    sizes: [
      { size: 'M', stock: 9 },
      { size: 'L', stock: 7 },
      { size: 'XL', stock: 5 },
    ],
  },
  {
    name: 'Kemeja Batik Formal Pria',
    price: 360000,
    category: 'Pakaian Pria',
    description:
      'Pilihan formal dengan bahan premium, nyaman dipakai sepanjang hari.',
    imageUrl: '/pria3.jpg',
    sizes: [
      { size: 'M', stock: 8 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 6 },
    ],
  },
  {
    name: 'Tas Batik Klasik',
    price: 280000,
    category: 'Aksesoris',
    description:
      'Tas batik elegan dengan motif klasik, cocok untuk melengkapi tampilan formal maupun kasual.',
    imageUrl: '/tas.jpg',
    sizes: [
      { size: 'All Size', stock: 15 },
    ],
  },
  {
    name: 'Blus Batik Anggun',
    price: 390000,
    category: 'Pakaian Wanita',
    description:
      'Blus batik wanita dengan potongan anggun dan warna lembut, nyaman dipakai seharian.',
    imageUrl: '/wanita3.jpg',
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 4 },
    ],
  },
];

async function upsertProduct(data) {
  const baseSlug = toSlug(data.name);
  let slug = baseSlug;
  let counter = 1;

  // Pastikan slug unik
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const totalStock = data.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      stock: totalStock,
    },
  });

  // Simpan sizes
  if (data.sizes?.length) {
    for (const s of data.sizes) {
      await prisma.productSize.create({
        data: {
          productId: product.id,
          size: s.size,
          stock: s.stock || 0,
        },
      });
    }
  }

  // Simpan primary image
  await prisma.productImage.create({
    data: {
      productId: product.id,
      imageUrl: data.imageUrl || '/logo_batik.jpg',
      altText: data.name,
      isPrimary: true,
    },
  });

  return product;
}

async function main() {
  console.log('🚀 Seeding sample products...');
  for (const p of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
    });
    if (existing) {
      console.log(`ℹ️  Skip (sudah ada): ${p.name}`);
      continue;
    }

    await upsertProduct(p);
    console.log(`✅ Inserted: ${p.name}`);
  }
  console.log('🎉 Selesai seeding sample products.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
