import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import midtransClient from 'midtrans-client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'Mid-server-CVdrnxlgQXSGxbUAolNlXh0h',
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET /api/payments - Get user's payments
export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ status: false, message: 'Unauthorized' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    let payments;
    if (orderId) {
      payments = await prisma.payment.findMany({
        where: {
          userId: decoded.id,
          orderId: parseInt(orderId),
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                  size: true,
                },
              },
            },
          },
          history: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      payments = await prisma.payment.findMany({
        where: { userId: decoded.id },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true,
                  size: true,
                },
              },
            },
          },
          history: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(
      {
        status: true,
        message: 'Payments retrieved successfully',
        data: payments,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('[GET PAYMENTS] Error:', error);
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
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

// POST /api/payments/create - Create payment transaction
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

    const { orderId, amount } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { status: false, message: 'OrderId and amount are required' },
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

    // Get order details for Midtrans (with verification)
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        items: {
          include: {
            product: true,
            size: true,
          },
        },
        address: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { status: false, message: 'Order not found' },
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

    if (order.userId !== decoded.id) {
      return NextResponse.json(
        { status: false, message: 'Unauthorized - Order does not belong to user' },
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

    // Check if order already has a payment
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: parseInt(orderId) },
    });

    if (existingPayment) {
      // Return existing payment if status is pending
      if (existingPayment.status === 'pending' && existingPayment.snapToken) {
        return NextResponse.json(
          {
            status: true,
            message: 'Payment transaction already exists',
            data: {
              payment: existingPayment,
              snapToken: existingPayment.snapToken,
              snapUrl: existingPayment.snapUrl,
            },
          },
          { 
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
          }
        );
      }
    }

    // Use orderNumber as order_id for Midtrans (must be unique)
    // Format: ORD-YYYYMMDD-XXXX
    const midtransOrderId = order.orderNumber;

    // Create Midtrans Snap transaction
    let snapToken = null;
    let snapUrl = null;

    try {
      const parameter = {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: parseFloat(amount),
        },
        customer_details: {
          first_name: order.address.recipientName || order.address.recipient_name || order.user.name,
          email: order.user.email,
          phone: order.address.phoneNumber || order.address.recipient_phone || '',
          billing_address: {
            first_name: order.address.recipientName || order.address.recipient_name || order.user.name,
            phone: order.address.phoneNumber || order.address.recipient_phone || '',
            address: `${order.address.streetAddress || order.address.address || ''}, ${order.address.district || ''}, ${order.address.city || ''}, ${order.address.province || ''} ${order.address.postalCode || order.address.postal_code || ''}`,
            city: order.address.city || '',
            postal_code: order.address.postalCode || order.address.postal_code || '',
            country_code: 'IDN',
          },
          shipping_address: {
            first_name: order.address.recipientName || order.address.recipient_name || order.user.name,
            phone: order.address.phoneNumber || order.address.recipient_phone || '',
            address: `${order.address.streetAddress || order.address.address || ''}, ${order.address.district || ''}, ${order.address.city || ''}, ${order.address.province || ''} ${order.address.postalCode || order.address.postal_code || ''}`,
            city: order.address.city || '',
            postal_code: order.address.postalCode || order.address.postal_code || '',
            country_code: 'IDN',
          },
        },
        item_details: order.items.map(item => ({
          id: item.product.id.toString(),
          price: parseFloat(item.price),
          quantity: item.quantity,
          name: item.productName || item.product.name,
        })),
      };

      const snapResponse = await snap.createTransaction(parameter);
      snapToken = snapResponse.token;
      snapUrl = snapResponse.redirect_url;
    } catch (midtransError) {
      console.error('[MIDTRANS ERROR]', midtransError);
      console.error('[MIDTRANS ERROR] Message:', midtransError.message);
      console.error('[MIDTRANS ERROR] Response:', midtransError.ApiResponse);
      
      // Return error instead of fallback
      return NextResponse.json(
        { 
          status: false, 
          message: 'Gagal membuat transaksi pembayaran',
          error: process.env.NODE_ENV === 'development' 
            ? (midtransError.message || 'Midtrans API error')
            : 'Silakan coba lagi atau hubungi customer service'
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

    // Create payment record
    // Use orderNumber as transactionId for Midtrans compatibility
    const payment = await prisma.payment.create({
      data: {
        userId: decoded.id,
        transactionId: midtransOrderId,
        orderId: parseInt(orderId),
        amount: parseFloat(amount),
        currency: 'IDR',
        status: 'pending',
        snapToken,
        snapUrl,
      },
    });

    return NextResponse.json(
      {
        status: true,
        message: 'Payment transaction created',
        data: {
          payment,
          snapToken: payment.snapToken,
          snapUrl: payment.snapUrl,
        },
      },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('[CREATE PAYMENT] Error:', error);
    console.error('[CREATE PAYMENT] Error message:', error.message);
    console.error('[CREATE PAYMENT] Error stack:', error.stack);
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
