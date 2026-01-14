/**
 * Script to run SQL migration for removing old Address table columns
 * Run with: node scripts/run-migration-remove-old-address-columns.js
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
    console.log('🔄 Menjalankan migration untuk menghapus kolom lama Address...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/006_remove_old_address_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('\n✅ Migration berhasil! Kolom lama sudah dihapus.');
    
    // Verify columns
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Address'
      ORDER BY column_name
    `);
    
    console.log('\n📋 Kolom yang tersedia di tabel Address:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
    // Check if old columns still exist
    const oldColumns = result.rows.filter(r => 
      ['user_id', 'recipient_name', 'recipient_phone', 'postal_code', 'address', 'is_default', 'created_at', 'updated_at'].includes(r.column_name)
    );
    
    if (oldColumns.length > 0) {
      console.log('\n⚠️  Kolom lama masih ada:');
      oldColumns.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
    } else {
      console.log('\n✅ Semua kolom lama sudah dihapus!');
    }
    
  } catch (error) {
    console.error('❌ Error saat menjalankan migration:', error.message);
    if (error.message.includes('does not exist') || error.message.includes('already exists')) {
      console.log('ℹ️  Beberapa kolom mungkin sudah dihapus atau tidak ada, ini normal.');
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
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration gagal:', error);
    process.exit(1);
  });

