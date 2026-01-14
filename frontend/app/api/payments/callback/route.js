import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-CVdrnxlgQXSGxbUAolNlXh0h';

// Verify Midtrans notification signature
function verifySignature(orderId, statusCode, grossAmount, signatureKey) {
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY)
    .digest('hex');
  return hash === signatureKey;
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
  try {
    const body = await request.json();

    const {
      transaction_status,
      order_id,
      gross_amount,
      signature_key,
      status_code,
      payment_type,
      transaction_time,
      fraud_status,
    } = body;

    // Verify signature
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.error('[PAYMENT CALLBACK] Invalid signature');
      return NextResponse.json(
        { status: false, message: 'Invalid signature' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Find payment by transaction ID
    const payment = await prisma.payment.findUnique({
      where: { transactionId: order_id },
      include: { order: true },
    });

    if (!payment) {
      console.error('[PAYMENT CALLBACK] Payment not found:', order_id);
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

    // Determine payment status based on Midtrans transaction_status
    // Mapping sesuai dengan alur logika sistem:
    // settlement → DIBAYAR
    // pending → MENUNGGU_PEMBAYARAN
    // deny → GAGAL
    // cancel → DIBATALKAN
    // expire → DIBATALKAN
    let paymentStatus = payment.status; // Keep current status as default
    let orderStatus = payment.order?.status || 'MENUNGGU_PEMBAYARAN';
    let orderPaymentStatus = payment.order?.paymentStatus || 'unpaid';

    console.log('[PAYMENT CALLBACK] Transaction status:', transaction_status);
    console.log('[PAYMENT CALLBACK] Current payment status:', payment.status);
    console.log('[PAYMENT CALLBACK] Current order status:', orderStatus);

    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      paymentStatus = 'paid';
      orderPaymentStatus = 'paid';
      orderStatus = 'DIBAYAR'; // Settlement → DIBAYAR
      console.log('[PAYMENT CALLBACK] Payment SETTLED/CAPTURED → DIBAYAR');
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'MENUNGGU_PEMBAYARAN'; // Pending → MENUNGGU_PEMBAYARAN
      console.log('[PAYMENT CALLBACK] Payment PENDING → MENUNGGU_PEMBAYARAN');
    } else if (transaction_status === 'deny') {
      paymentStatus = 'failed';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'GAGAL'; // Deny → GAGAL
      console.log('[PAYMENT CALLBACK] Payment DENIED → GAGAL');
    } else if (transaction_status === 'expire') {
      paymentStatus = 'failed';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'DIBATALKAN'; // Expire → DIBATALKAN
      console.log('[PAYMENT CALLBACK] Payment EXPIRED → DIBATALKAN');
    } else if (transaction_status === 'cancel') {
      paymentStatus = 'failed';
      orderPaymentStatus = 'unpaid';
      orderStatus = 'DIBATALKAN'; // Cancel → DIBATALKAN
      console.log('[PAYMENT CALLBACK] Payment CANCELLED → DIBATALKAN');
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      paymentStatus = 'refunded';
      orderPaymentStatus = 'refunded';
      console.log('[PAYMENT CALLBACK] Payment REFUNDED');
    }

    // Update payment
    const updateData = {
      status: paymentStatus,
      paymentMethod: payment_type || payment.paymentMethod,
      vendorTransactionId: order_id,
      metadata: JSON.stringify(body),
    };

    // Set paidAt only if payment is now paid
    if (paymentStatus === 'paid' && !payment.paidAt) {
      updateData.paidAt = transaction_time ? new Date(transaction_time) : new Date();
    }

    // Set failureReason if payment failed
    if (paymentStatus === 'failed') {
      updateData.failureReason = transaction_status === 'deny' 
        ? 'Pembayaran ditolak' 
        : transaction_status === 'expire' 
        ? 'Pembayaran kadaluarsa' 
        : transaction_status === 'cancel'
        ? 'Pembayaran dibatalkan'
        : 'Pembayaran gagal';
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: updateData,
    });

    // Update payment history
    await prisma.paymentHistory.create({
      data: {
        paymentId: payment.id,
        status: paymentStatus,
        message: `Transaction ${transaction_status}`,
        metadata: JSON.stringify(body),
      },
    });

    // Update order
    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          paymentStatus: orderPaymentStatus,
        },
      });

      // Jika pembayaran berhasil (settlement), kosongkan keranjang user
      // Catatan: Stok sudah dikurangi saat order dibuat, jadi tidak perlu dikurangi lagi di sini
      if (paymentStatus === 'paid') {
        // Kosongkan keranjang user
        const cart = await prisma.cart.findUnique({
          where: { userId: payment.userId },
        });

        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'payment',
            title: 'Pembayaran Berhasil',
            message: `Pembayaran untuk pesanan ${payment.order.orderNumber} berhasil diterima.`,
            relatedOrderId: payment.orderId,
            actionUrl: `/detail-pesanan/${payment.orderId}`,
          },
        });
      } else if (paymentStatus === 'failed') {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'payment',
            title: 'Pembayaran Gagal',
            message: `Pembayaran untuk pesanan ${payment.order.orderNumber} gagal. Silakan coba lagi.`,
            relatedOrderId: payment.orderId,
            actionUrl: `/pembayaran?orderId=${payment.orderId}`,
          },
        });
      } else if (paymentStatus === 'pending') {
        // Create notification
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'payment',
            title: 'Pembayaran Menunggu Konfirmasi',
            message: `Pembayaran untuk pesanan ${payment.order.orderNumber} sedang diproses.`,
            relatedOrderId: payment.orderId,
            actionUrl: `/detail-pesanan/${payment.orderId}`,
          },
        });
      }
    }

    return NextResponse.json({
      status: true,
      message: 'Callback processed successfully',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[PAYMENT CALLBACK] Error:', error);
    console.error('[PAYMENT CALLBACK] Error message:', error.message);
    console.error('[PAYMENT CALLBACK] Error stack:', error.stack);
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

