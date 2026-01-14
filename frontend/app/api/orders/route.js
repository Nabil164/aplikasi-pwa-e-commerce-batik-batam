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

// GET /api/orders - Get user's orders with search and filter
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
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let where = { userId: decoded.id };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { include: { images: { where: { isPrimary: true } } } },
            },
          },
          address: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      status: true,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[GET ORDERS] Error:', error);
    console.error('[GET ORDERS] Error message:', error.message);
    console.error('[GET ORDERS] Error stack:', error.stack);
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

// POST /api/orders - Create new order
export async function POST(request) {
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

    const { addressId, items, subtotal, discount, tax, shippingCost, total, notes } = await request.json();

    if (!addressId || !items || items.length === 0) {
      return NextResponse.json(
        { status: false, message: 'AddressId and items are required' },
        { 
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: parseInt(addressId) },
    });

    if (!address || address.userId !== decoded.id) {
      return NextResponse.json(
        { status: false, message: 'Address not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Validate stock availability for all items
    const stockErrors = [];
    for (const item of items) {
      const productSize = await prisma.productSize.findUnique({
        where: { id: parseInt(item.productSizeId) },
        include: { product: true },
      });

      if (!productSize) {
        stockErrors.push(`Ukuran produk untuk ${item.productName} tidak ditemukan`);
        continue;
      }

      if (productSize.stock < parseInt(item.quantity)) {
        stockErrors.push(
          `Stok ${item.productName} ukuran ${productSize.size} tidak mencukupi. Tersedia: ${productSize.stock}, Dibutuhkan: ${item.quantity}`
        );
      }
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        { 
          status: false, 
          message: 'Stok tidak mencukupi',
          errors: stockErrors
        },
        { 
          status: 422,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Generate order number
    const timestamp = Date.now();
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${timestamp % 10000}`;

    // Create order with items and update stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order with status MENUNGGU_PEMBAYARAN (before payment)
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: decoded.id,
          addressId: parseInt(addressId),
          status: "MENUNGGU_PEMBAYARAN", // Order created BEFORE payment
          paymentStatus: "unpaid", // Payment not yet made
          subtotal: parseFloat(subtotal),
          discount: parseFloat(discount) || 0,
          tax: parseFloat(tax) || 0,
          shippingCost: parseFloat(shippingCost) || 0,
          total: parseFloat(total),
          notes,
          items: {
            create: items.map(item => ({
              productId: parseInt(item.productId),
              productSizeId: parseInt(item.productSizeId),
              productName: item.productName,
              quantity: parseInt(item.quantity),
              price: parseFloat(item.price),
              subtotal: parseFloat(item.subtotal),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { include: { images: true } },
              size: true,
            },
          },
          address: true,
        },
      });

      // Update stock for each item
      for (const item of items) {
        await tx.productSize.update({
          where: { id: parseInt(item.productSizeId) },
          data: {
            stock: {
              decrement: parseInt(item.quantity),
            },
          },
        });

        // Update product total stock
        const productSize = await tx.productSize.findUnique({
          where: { id: parseInt(item.productSizeId) },
        });

        if (productSize) {
          // Calculate total stock from all sizes
          const allSizes = await tx.productSize.findMany({
            where: { productId: parseInt(item.productId) },
          });

          const totalStock = allSizes.reduce((sum, size) => sum + size.stock, 0);

          await tx.product.update({
            where: { id: parseInt(item.productId) },
            data: {
              stock: totalStock,
            },
          });
        }
      }

      return newOrder;
    });

    // Clear user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: decoded.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json(
      { status: true, message: 'Order created successfully', data: order },
      { 
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('[CREATE ORDER] Error:', error);
    console.error('[CREATE ORDER] Error message:', error.message);
    console.error('[CREATE ORDER] Error stack:', error.stack);
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
