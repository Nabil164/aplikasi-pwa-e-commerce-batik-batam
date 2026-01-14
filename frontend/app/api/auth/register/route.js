import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClient } from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Validators
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  let client;
  try {
    const { name, email, password, password_confirmation } = await request.json();

    console.log('[REGISTER] Incoming request:', {
      name,
      email,
      hasPassword: !!password,
    });

    // Validation
    const errors = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = ['The name field is required.'];
    }

    if (!email || !validateEmail(email)) {
      errors.email = ['The email must be a valid email address.'];
    } else if (email.length > 255) {
      errors.email = ['The email must not be greater than 255 characters.'];
    }

    if (!password || password.length < 6) {
      errors.password = ['The password must be at least 6 characters.'];
    }

    if (password !== password_confirmation) {
      errors.password_confirmation = ['The password confirmation does not match.'];
    }

    if (Object.keys(errors).length > 0) {
      console.log('[REGISTER] Validation failed:', errors);
      return NextResponse.json({
        status: false,
        message: 'Validation failed',
        errors,
      }, { 
        status: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Get DB connection with retry logic
    client = await getClient();

    // Check if email already exists
    const existingUserResult = await client.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json({
        status: false,
        message: 'Email sudah terdaftar',
        errors: {
          email: ['Email sudah terdaftar'],
        },
      }, { 
        status: 422,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const userResult = await client.query(
      'INSERT INTO "User" (name, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, name, email, role',
      [name.trim(), email, hashedPassword, 'user']
    );

    const user = userResult.rows[0];
    console.log('[REGISTER] User created:', { id: user.id, email: user.email });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Response
    return NextResponse.json({
      status: true,
      message: 'Registrasi berhasil!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      access_token: token,
      role: user.role,
    }, { 
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('[REGISTER] Error:', error.message);
    console.error('[REGISTER] Stack:', error.stack);

    // Determine error type for better user feedback
    let errorMessage = 'Terjadi kesalahan server';
    let statusCode = 500;

    if (error.message?.includes('DATABASE_URL')) {
      errorMessage = 'Konfigurasi database belum diatur. Hubungi administrator.';
      console.error('❌ DATABASE_URL tidak ditemukan! Buat file .env.local');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || error.message?.includes('getaddrinfo')) {
      errorMessage = 'Tidak dapat terhubung ke database server. Periksa koneksi internet atau konfigurasi database.';
      console.error('❌ DNS resolution failed. Check DATABASE_URL or network connection.');
      statusCode = 503; // Service Unavailable
    } else if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Tidak dapat terhubung ke database. Pastikan PostgreSQL sudah berjalan.';
      console.error('❌ Database connection refused. Is PostgreSQL running?');
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = 'Koneksi database timeout. Coba lagi dalam beberapa saat.';
      statusCode = 503; // Service Unavailable
    } else if (error.code === '28P01' || error.message?.includes('password authentication')) {
      errorMessage = 'Autentikasi database gagal. Periksa kredensial database.';
    } else if (error.code === '3D000' || error.message?.includes('does not exist')) {
      errorMessage = 'Database tidak ditemukan. Jalankan migrasi terlebih dahulu.';
    } else if (error.code === '23505' || error.message?.includes('unique constraint')) {
      errorMessage = 'Email sudah terdaftar.';
      statusCode = 422;
    }

    return NextResponse.json({
      status: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      hint: process.env.NODE_ENV === 'development' ? 'Periksa console server untuk detail error' : undefined,
    }, { 
      status: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } finally {
    if (client) client.release();
  }
}
