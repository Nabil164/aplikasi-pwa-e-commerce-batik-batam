/**
 * Script to run SQL migration for creating ProductSize and related tables
 * Run with: node scripts/run-product-size-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load DATABASE_URL from .env.local
const envPath = path.join(__dirname, '../.env.local');
let DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
  if (match) {
    DATABASE_URL = match[1];
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL tidak ditemukan!');
  console.error('📝 Pastikan DATABASE_URL ada di .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000,
  keepAlive: true,
});

async function runMigration() {
  // Retry logic for connection
  let client;
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      client = await pool.connect();
      break;
    } catch (connectError) {
      lastError = connectError;
      retries--;
      
      if (connectError.code === 'ENOTFOUND' || 
          connectError.code === 'EAI_AGAIN' || 
          connectError.code === 'ETIMEDOUT') {
        
        if (retries > 0) {
          console.warn(`⚠️  Koneksi gagal, mencoba lagi... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
      
      throw connectError;
    }
  }
  
  if (!client) {
    throw lastError || new Error('Failed to connect to database');
  }
  
  try {
    console.log('🔄 Menjalankan migration untuk membuat tabel ProductSize dan tabel terkait...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/003_create_product_size_and_related_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('\n✅ Migration berhasil! Tabel ProductSize dan tabel terkait sudah dibuat.');
    
    // Verify tables exist
    const tablesToCheck = ['ProductSize', 'ProductImage', 'Cart', 'CartItem'];
    
    for (const tableName of tablesToCheck) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`   ✅ Tabel ${tableName} ditemukan`);
        
        // Check columns for ProductSize
        if (tableName === 'ProductSize') {
          const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'ProductSize'
            ORDER BY column_name
          `);
          
          console.log(`   📋 Kolom di ${tableName}:`);
          columnsResult.rows.forEach(col => {
            console.log(`      - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
          });
        }
      } else {
        console.log(`   ❌ Tabel ${tableName} TIDAK ditemukan!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error saat menjalankan migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Beberapa tabel mungkin sudah ada, ini normal.');
    } else {
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Selesai!');
    console.log('💡 Jangan lupa regenerate Prisma Client: npx prisma generate');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration gagal:', error);
    process.exit(1);
  });

