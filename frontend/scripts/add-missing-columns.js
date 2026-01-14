/**
 * Script to add missing columns to Product table
 * Run with: node scripts/add-missing-columns.js
 * 
 * Make sure DATABASE_URL is set in .env.local
 */

const { getPool } = require('../lib/db.js');

async function addMissingColumns() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('🔄 Menambahkan kolom yang hilang ke tabel Product...');
    
    // Check if slug column exists
    const checkSlug = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'slug'
    `);
    
    if (checkSlug.rows.length === 0) {
      console.log('➕ Menambahkan kolom slug...');
      await client.query(`
        ALTER TABLE "Product" 
        ADD COLUMN slug VARCHAR(255)
      `);
      
      // Generate slugs for existing products
      const products = await client.query('SELECT id, name FROM "Product"');
      for (const product of products.rows) {
        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `product-${product.id}`;
        
        await client.query(
          'UPDATE "Product" SET slug = $1 WHERE id = $2',
          [slug, product.id]
        );
      }
      
      // Make slug unique and not null
      await client.query(`
        ALTER TABLE "Product" 
        ALTER COLUMN slug SET NOT NULL
      `);
      
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_product_slug ON "Product"(slug)
      `);
      
      console.log('✅ Kolom slug berhasil ditambahkan');
    } else {
      console.log('✓ Kolom slug sudah ada');
    }
    
    // Add other missing columns
    const columnsToAdd = [
      { name: 'discount', type: 'DECIMAL(5, 2)', nullable: true },
      { name: 'subcategory', type: 'VARCHAR(255)', nullable: true },
      { name: 'sku', type: 'VARCHAR(255)', nullable: true },
      { name: 'weight', type: 'FLOAT', nullable: true },
      { name: '"createdAt"', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', nullable: false },
      { name: '"updatedAt"', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP', nullable: false },
    ];
    
    for (const col of columnsToAdd) {
      const colName = col.name.replace(/"/g, '');
      const check = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = $1
      `, [colName]);
      
      if (check.rows.length === 0) {
        console.log(`➕ Menambahkan kolom ${colName}...`);
        await client.query(`
          ALTER TABLE "Product" 
          ADD COLUMN ${col.name} ${col.type}
        `);
        console.log(`✅ Kolom ${colName} berhasil ditambahkan`);
      } else {
        console.log(`✓ Kolom ${colName} sudah ada`);
      }
    }
    
    // Add unique constraint for sku if it doesn't exist
    const skuIndex = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'Product' AND indexname = 'Product_sku_key'
    `);
    
    if (skuIndex.rows.length === 0) {
      console.log('➕ Menambahkan unique constraint untuk sku...');
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"(sku) WHERE sku IS NOT NULL
      `);
    }
    
    console.log('✅ Semua kolom berhasil ditambahkan!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    // Don't close pool, let it stay open for other connections
  }
}

addMissingColumns()
  .then(() => {
    console.log('🎉 Migration selesai!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration gagal:', error);
    process.exit(1);
  });

