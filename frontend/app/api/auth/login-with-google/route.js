import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { getClient } from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

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
    const { token } = await request.json();

    console.log('[LOGIN_GOOGLE] Incoming request:', { hasToken: !!token });

    if (!token) {
      return NextResponse.json({
        status: false,
        errors: {
          token: ['The token field is required.'],
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

    // Verify Google token
    try {
      const googleResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      );

      const email = googleResponse.data.email;
      const name = googleResponse.data.name || 'Google User';

      // Get DB connection with retry logic
      client = await getClient();

      // Check if user exists
      const existingUserResult = await client.query(
        'SELECT id, name, email, password, role FROM "User" WHERE email = $1',
        [email]
      );

      let user;
      if (existingUserResult.rows.length === 0) {
        // Create new user
        const hashedPassword = await bcryptjs.hash(Math.random().toString(), 10);
        const newUserResult = await client.query(
          'INSERT INTO "User" (name, email, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, name, email, role',
          [name, email, hashedPassword, 'user']
        );
        user = newUserResult.rows[0];
      } else {
        user = existingUserResult.rows[0];
      }

      // Generate JWT token
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        status: true,
        message: 'Login dengan Google berhasil!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: jwtToken,
        access_token: jwtToken,
        role: user.role,
      }, { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    } catch (googleError) {
      console.error('Google token verification failed:', googleError.message);
      return NextResponse.json({
        status: false,
        message: 'Token Google tidak valid',
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  } catch (error) {
    console.error('[LOGIN_GOOGLE] Error:', error);

    return NextResponse.json({
      status: false,
      message: 'Error verifying Google token: ' + error.message,
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}




