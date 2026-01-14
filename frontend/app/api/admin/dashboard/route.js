import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Prisma client singleton
import jwt from 'jsonwebtoken';

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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/admin/dashboard - Get dashboard statistics
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ status: false, message: 'Invalid token' }, { status: 401 });
    }

    // Verify admin role - handle missing columns gracefully
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
    } catch (error) {
      // If error is about missing column, provide helpful message
      if (error.message?.includes('does not exist') || 
          error.message?.includes('column') ||
          error.message?.includes('User.avatar')) {
        console.error('[ADMIN DASHBOARD] Database schema mismatch:', error.message);
        return NextResponse.json({
          status: false,
          message: `Database schema tidak sesuai. Kolom 'avatar' belum ada di database.`,
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          hint: `Jalankan: node scripts/run-migration-user.js (atau lihat MIGRATION_INSTRUCTIONS.md)`,
          migrationScript: 'frontend/scripts/run-migration-user.js',
          sqlScript: 'frontend/scripts/fix-user-table.sql',
          migrationGuide: 'Lihat frontend/MIGRATION_INSTRUCTIONS.md untuk instruksi lengkap',
        }, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      throw error; // Re-throw if it's a different error
    }

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { status: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get statistics - handle missing columns gracefully
    let totalUsers, totalProducts, totalOrders, totalRevenue, pendingOrders, processingOrders, recentOrders;
    
    try {
      [
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        processingOrders,
        recentOrders,
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'user' } }),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          where: { paymentStatus: 'paid' },
          _sum: { total: true },
        }),
        prisma.order.count({ where: { status: 'MENUNGGU_PEMBAYARAN' } }),
        prisma.order.count({ where: { status: 'DIPROSES' } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            items: { take: 1 },
          },
        }),
      ]);
    } catch (error) {
      // If error is about missing column, provide helpful message
      if (error.message?.includes('does not exist') || 
          error.message?.includes('column') ||
          error.message?.includes('Order.')) {
        console.error('[ADMIN DASHBOARD] Database schema mismatch:', error.message);
        
        // Extract missing column name from error
        const columnMatch = error.message.match(/Order\.(\w+)/);
        const missingColumn = columnMatch ? columnMatch[1] : 'unknown';
        
        return NextResponse.json({
          status: false,
          message: `Database schema tidak sesuai. Kolom '${missingColumn}' belum ada di database.`,
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
          hint: `Jalankan: node scripts/run-migration-order.js (atau lihat MIGRATION_INSTRUCTIONS.md)`,
          migrationScript: 'frontend/scripts/run-migration-order.js',
          sqlScript: 'frontend/scripts/fix-order-table.sql',
          migrationGuide: 'Lihat frontend/MIGRATION_INSTRUCTIONS.md untuk instruksi lengkap',
        }, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
      throw error; // Re-throw if it's a different error
    }

    return NextResponse.json({
      status: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.total || 0,
          pendingOrders,
          processingOrders,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error('[ADMIN DASHBOARD] Error:', error);
    console.error('[ADMIN DASHBOARD] Error message:', error.message);
    console.error('[ADMIN DASHBOARD] Error stack:', error.stack);
    return NextResponse.json(
      { 
        status: false, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

