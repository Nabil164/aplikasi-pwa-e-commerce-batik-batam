import { Pool } from 'pg';

let pool = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL tidak ditemukan!');
      console.error('📝 Buat file .env.local di folder frontend dengan isi:');
      console.error('   DATABASE_URL="postgresql://username:password@localhost:5432/batik_cindur"');
      console.error('   JWT_SECRET="your-secret-key"');
      throw new Error('DATABASE_URL environment variable is not set. Please create .env.local file.');
    }

    // Parse connection string untuk Neon
    const isNeon = connectionString.includes('neon.tech');
    
    pool = new Pool({
      connectionString,
      max: isNeon ? 10 : 20, // Neon recommends max 10 connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: isNeon ? 30000 : 10000, // 30s untuk Neon, 10s untuk local
      // SSL configuration untuk Neon
      ssl: isNeon ? {
        rejectUnauthorized: false, // Neon menggunakan SSL
      } : false,
      // Keep connections alive
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('❌ Database pool error:', err.message);
      console.error('❌ Error code:', err.code);
      // Reset pool on error untuk retry
      if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'ETIMEDOUT') {
        console.error('🔄 DNS/Connection error detected. Pool will be reset on next request.');
        pool = null;
      }
    });

    pool.on('connect', () => {
      console.log('✅ Database connected successfully');
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Get database client with retry logic for network errors
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<import('pg').PoolClient>} Database client
 */
export async function getClient(maxRetries = 3) {
  const pool = getPool();
  let retries = maxRetries;
  let lastError;
  
  while (retries > 0) {
    try {
      const client = await pool.connect();
      return client; // Success, return client
    } catch (connectError) {
      lastError = connectError;
      retries--;
      
      // Check if it's a DNS/network error
      if (connectError.code === 'ENOTFOUND' || 
          connectError.code === 'EAI_AGAIN' || 
          connectError.code === 'ETIMEDOUT' ||
          connectError.message?.includes('getaddrinfo')) {
        
        if (retries > 0) {
          console.warn(`[DB] Connection failed, retrying... (${retries} attempts left)`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (maxRetries + 1 - retries)));
          continue;
        }
      }
      
      // If not a network error or no retries left, throw immediately
      throw connectError;
    }
  }
  
  throw lastError || new Error('Failed to connect to database after retries');
}
