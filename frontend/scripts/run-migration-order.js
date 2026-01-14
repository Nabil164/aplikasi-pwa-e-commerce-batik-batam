/**
 * Script to run SQL migration for adding missing Order columns
 * Run with: node scripts/run-migration-order.js
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
    console.log('🔄 Menjalankan migration untuk menambahkan kolom Order yang hilang...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'fix-order-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    await client.query(sql);
    
    console.log('\n✅ Migration berhasil! Semua kolom Order sudah ditambahkan.');
    
    // Verify ALL required columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Order' 
      AND column_name IN ('id', 'orderNumber', 'userId', 'addressId', 'paymentId', 'status', 'paymentStatus', 'subtotal', 'discount', 'tax', 'shippingCost', 'total', 'notes', 'trackingNumber', 'shippingProvider', 'shippedAt', 'deliveredAt', 'cancelledAt', 'cancelReason', 'createdAt', 'updatedAt')
      ORDER BY column_name
    `);
    
    console.log('\n📋 Kolom yang tersedia di tabel Order:');
    const requiredColumns = ['id', 'orderNumber', 'userId', 'addressId', 'paymentId', 'status', 'paymentStatus', 'subtotal', 'discount', 'tax', 'shippingCost', 'total', 'notes', 'trackingNumber', 'shippingProvider', 'shippedAt', 'deliveredAt', 'cancelledAt', 'cancelReason', 'createdAt', 'updatedAt'];
    const existingColumns = result.rows.map(r => r.column_name);
    
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`   ✅ ${col}`);
      } else {
        console.log(`   ❌ ${col} - MISSING!`);
      }
    });
    
    // Check specifically for orderNumber and total
    const orderNumberCheck = result.rows.find(r => r.column_name === 'orderNumber');
    const totalCheck = result.rows.find(r => r.column_name === 'total');
    
    if (orderNumberCheck) {
      console.log(`\n✅ Kolom orderNumber ditemukan: ${orderNumberCheck.data_type}, nullable: ${orderNumberCheck.is_nullable}`);
    } else {
      console.log('\n❌ WARNING: Kolom orderNumber TIDAK ditemukan! Migration mungkin gagal.');
    }
    
    if (totalCheck) {
      console.log(`✅ Kolom total ditemukan: ${totalCheck.data_type}, nullable: ${totalCheck.is_nullable}`);
    } else {
      console.log('❌ WARNING: Kolom total TIDAK ditemukan! Migration mungkin gagal.');
    }
    
  } catch (error) {
    console.error('❌ Error saat menjalankan migration:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Beberapa kolom mungkin sudah ada, ini normal.');
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

