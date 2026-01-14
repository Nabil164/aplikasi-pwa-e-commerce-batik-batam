import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClient } from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

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
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ status: false, message: 'Invalid token' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const { currentPassword, newPassword, newPasswordConfirmation } = await request.json();

    // Validation
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = ['Current password is required.'];
    }

    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = ['New password must be at least 6 characters.'];
    }

    if (newPassword !== newPasswordConfirmation) {
      errors.newPasswordConfirmation = ['Password confirmation does not match.'];
    }

    if (Object.keys(errors).length > 0) {
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

    // Get user
    const userResult = await client.query(
      'SELECT id, password FROM "User" WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        status: false,
        message: 'User not found',
      }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({
        status: false,
        message: 'Current password is incorrect',
        errors: {
          currentPassword: ['Current password is incorrect'],
        },
      }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password
    await client.query(
      'UPDATE "User" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
      [hashedPassword, decoded.id]
    );

    return NextResponse.json({
      status: true,
      message: 'Password berhasil diubah!',
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('[CHANGE PASSWORD] Error:', error);
    return NextResponse.json({
      status: false,
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
    }, { 
      status: 500,
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




