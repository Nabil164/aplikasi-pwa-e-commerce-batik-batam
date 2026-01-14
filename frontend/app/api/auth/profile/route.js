import { NextResponse } from 'next/server';
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/auth/profile - Get user profile
export async function GET(request) {
  let client;
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    client = await getClient();

    const userResult = await client.query(
      'SELECT id, name, email, role, avatar, "createdAt", "updatedAt" FROM "User" WHERE id = $1',
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
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const user = userResult.rows[0];

    // Get order count
    const orderCountResult = await client.query(
      'SELECT COUNT(*) as count FROM "Order" WHERE "userId" = $1',
      [decoded.id]
    );
    const orderCount = parseInt(orderCountResult.rows[0].count);

    return NextResponse.json({
      status: true,
      message: 'Profile retrieved successfully',
      data: {
        ...user,
        orderCount,
      },
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ 
      status: false, 
      message: 'Internal server error' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// PUT /api/auth/profile - Update user profile
export async function PUT(request) {
  let client;
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    client = await getClient();
    
    // Get update data from request body
    const updateData = await request.json();
    const { name, email, avatar } = updateData;

    console.log('[PROFILE UPDATE] Updating profile for user ID:', decoded.id);
    console.log('[PROFILE UPDATE] Update data (sanitized):', {
      name,
      email,
      avatar,
    });
    
    // NOTE:
    // Schema User (lihat prisma/schema.prisma) hanya memiliki:
    // id, email, name, password, role, avatar, createdAt, updatedAt
    // Jadi kita hanya update kolom yang memang ada agar tidak error di Neon.
    const updateResult = await client.query(
      'UPDATE "User" SET name = $1, email = $2, avatar = $3, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $4',
      [name, email, avatar, decoded.id]
    );

    console.log('[PROFILE UPDATE] Update result:', updateResult);

    if (updateResult.rowCount === 0) {
      console.log('[PROFILE UPDATE] No rows affected, possible issues:');
      console.log('- Update data:', updateData);
      console.log('- User ID:', decoded.id);
      return NextResponse.json({
        status: false,
        message: 'Failed to update profile',
        error: 'No rows affected',
        details: updateData,
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Get updated user data
    const userResult = await client.query(
      'SELECT id, name, email, role, avatar, "createdAt", "updatedAt" FROM "User" WHERE id = $1',
      [decoded.id]
    );

    const updatedUser = userResult.rows[0];

    return NextResponse.json({
      status: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      status: false, 
      message: 'Internal server error' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}