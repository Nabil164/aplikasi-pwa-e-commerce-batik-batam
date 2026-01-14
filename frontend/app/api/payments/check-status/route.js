import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import midtransClient from 'midtrans-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-CVdrnxlgQXSGxbUAolNlXh0h';

// Initialize Midtrans Core API
const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'Mid-client-KIgYKIEWHcHYL8uP',
});

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

async function isAdmin(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'admin';
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

// POST /api/payments/check-status - Check payment status from Midtrans and update database
export async function POST(request) {
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

    const { transactionId, orderId } = await request.json();

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { status: false, message: 'TransactionId or orderId is required' },
        { 
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Find payment - try multiple methods
    let payment = null;
    
    // First, try to find by transactionId
    if (transactionId) {
      payment = await prisma.payment.findUnique({
        where: { transactionId },
        include: { order: true },
      });
    }
    
    // If not found by transactionId, try to find by orderId
    if (!payment && orderId) {
      payment = await prisma.payment.findFirst({
        where: { orderId: parseInt(orderId) },
        include: { order: true },
      });
    }

    // If payment still not found but we have orderId, create a "virtual" status from the order
    if (!payment && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
      });
      
      if (order) {
        // Return order status without payment record
        return NextResponse.json({
          status: true,
          message: 'Payment record not found, returning order status',
          data: {
            payment: null,
            order: {
              id: order.id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              orderNumber: order.orderNumber,
            },
            midtransStatus: order.status === 'DIBATALKAN' ? 'cancel' : 
                           order.status === 'DIBAYAR' ? 'settlement' : 'pending',
          },
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }
    }

    if (!payment) {
      return NextResponse.json(
        { status: false, message: 'Payment not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check if user is the payment owner OR an admin
    const userIsAdmin = await isAdmin(decoded.id);
    if (payment.userId !== decoded.id && !userIsAdmin) {
      return NextResponse.json(
        { status: false, message: 'Unauthorized' },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check status from Midtrans API
    let midtransStatus = null;
    try {
      const statusResponse = await core.transaction.status(payment.transactionId);
      midtransStatus = statusResponse;
      console.log('[CHECK STATUS] Midtrans response:', JSON.stringify(statusResponse, null, 2));
    } catch (midtransError) {
      console.error('[CHECK STATUS] Midtrans API error:', midtransError);
      // If Midtrans API fails, return current database status
      return NextResponse.json({
        status: true,
        message: 'Status check failed, returning current status',
        data: {
          payment: {
            id: payment.id,
            status: payment.status,
            transactionId: payment.transactionId,
          },
          order: payment.order ? {
            id: payment.order.id,
            status: payment.order.status,
            paymentStatus: payment.order.paymentStatus,
          } : null,
        },
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Map Midtrans transaction_status to our payment status
    const transactionStatus = midtransStatus.transaction_status;
    let paymentStatus = payment.status;
    let orderStatus = payment.order?.status || 'MENUNGGU_PEMBAYARAN';
    let orderPaymentStatus = payment.order?.paymentStatus || 'unpaid';

    console.log('[CHECK STATUS] Transaction status:', transactionStatus);
    console.log('[CHECK STATUS] Current payment status:', payment.status);
    console.log('[CHECK STATUS] Current order status:', orderStatus);

    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      paymentStatus = 'paid';
      orderPaymentStatus = 'paid';
      orderStatus = 'DIBAYAR';
      console.log('[CHECK STATUS] Payment SETTLED → DIBAYAR');
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'MENUNGGU_PEMBAYARAN';
      console.log('[CHECK STATUS] Payment PENDING → MENUNGGU_PEMBAYARAN');
    } else if (transactionStatus === 'deny') {
      paymentStatus = 'failed';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'GAGAL';
      console.log('[CHECK STATUS] Payment DENIED → GAGAL');
    } else if (transactionStatus === 'expire' || transactionStatus === 'cancel') {
      paymentStatus = 'failed';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'DIBATALKAN';
      console.log('[CHECK STATUS] Payment EXPIRED/CANCELLED → DIBATALKAN');
    }

    // Update payment if status changed
    if (paymentStatus !== payment.status) {
      const updateData = {
        status: paymentStatus,
        paymentMethod: midtransStatus.payment_type || payment.paymentMethod,
        vendorTransactionId: midtransStatus.order_id || payment.transactionId,
        metadata: JSON.stringify(midtransStatus),
      };

      if (paymentStatus === 'paid' && !payment.paidAt) {
        updateData.paidAt = midtransStatus.settlement_time 
          ? new Date(midtransStatus.settlement_time) 
          : new Date();
      }

      if (paymentStatus === 'failed') {
        updateData.failureReason = transactionStatus === 'deny' 
          ? 'Pembayaran ditolak' 
          : transactionStatus === 'expire' 
          ? 'Pembayaran kadaluarsa' 
          : transactionStatus === 'cancel'
          ? 'Pembayaran dibatalkan'
          : 'Pembayaran gagal';
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: updateData,
      });

      // Create payment history
      await prisma.paymentHistory.create({
        data: {
          paymentId: payment.id,
          status: paymentStatus,
          message: `Status checked: ${transactionStatus}`,
          metadata: JSON.stringify(midtransStatus),
        },
      });
    }

    // Update order if status changed
    if (payment.orderId && (orderStatus !== payment.order?.status || orderPaymentStatus !== payment.order?.paymentStatus)) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          paymentStatus: orderPaymentStatus,
        },
      });

      // Create notification if payment is now paid
      if (paymentStatus === 'paid' && payment.status !== 'paid') {
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'payment',
            title: 'Pembayaran Berhasil',
            message: `Pembayaran untuk pesanan ${payment.order?.orderNumber || payment.orderId} berhasil diterima.`,
            relatedOrderId: payment.orderId,
            actionUrl: `/detail-pesanan/${payment.orderId}`,
          },
        });
      }
    }

    // Get updated payment
    const updatedPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    });

    return NextResponse.json({
      status: true,
      message: 'Status checked and updated successfully',
      data: {
        payment: updatedPayment,
        midtransStatus: transactionStatus,
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[CHECK STATUS] Error:', error);
    console.error('[CHECK STATUS] Error message:', error.message);
    console.error('[CHECK STATUS] Error stack:', error.stack);
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
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
