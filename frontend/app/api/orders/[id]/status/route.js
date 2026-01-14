import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

async function verifyAdmin(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, role: true }
  });
  
  if (!user || user.role !== 'admin') return null;
  return decoded;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// PUT /api/orders/[id]/status - Update order status (Admin only)
export async function PUT(request, { params }) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const decoded = await verifyAdmin(token);
    if (!decoded) {
      return NextResponse.json({ status: false, message: 'Access denied. Admin only.' }, { 
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const { id } = await params;
    const { status, paymentStatus } = await request.json();

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Order ID is required' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Valid order statuses
    const validStatuses = [
      'MENUNGGU_PEMBAYARAN',
      'DIBAYAR',
      'DIPROSES',
      'DIKIRIM',
      'SELESAI',
      'DIBATALKAN',
      'GAGAL'
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { status: false, message: 'Invalid order status' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { payment: true }
    });

    if (!order) {
      return NextResponse.json(
        { status: false, message: 'Order not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Update order status
    const updateData = {};
    if (status) {
      updateData.status = status;
      
      // Auto-update payment status based on order status
      if (status === 'DIBAYAR' && order.paymentStatus !== 'paid') {
        updateData.paymentStatus = 'paid';
      } else if (status === 'GAGAL' || status === 'DIBATALKAN') {
        updateData.paymentStatus = 'failed';
      }
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true } } } },
            size: true,
          },
        },
        address: true,
        payment: true,
      },
    });

    // If payment exists, update payment status too
    if (order.payment && updateData.paymentStatus) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: updateData.paymentStatus === 'paid' ? 'paid' : 
                  updateData.paymentStatus === 'failed' ? 'failed' : order.payment.status
        }
      });
    }

    return NextResponse.json({
      status: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[UPDATE ORDER STATUS] Error:', error);
    return NextResponse.json(
      { 
        status: false, 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
