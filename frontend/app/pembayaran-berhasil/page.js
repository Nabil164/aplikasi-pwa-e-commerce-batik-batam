"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { CheckCircle, Receipt, Package, Home, Loader2, Sparkles } from "lucide-react";
import api from "../../lib/axios";

function PembayaranBerhasilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  const status = searchParams.get("status");

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!orderId) {
      router.push("/riwayat-pesanan");
      return;
    }

    const loadOrderData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // First, check payment status from Midtrans API and update database
        if (transactionId || orderId) {
          try {
            const checkStatusResponse = await api.post("/payments/check-status", {
              transactionId: transactionId || null,
              orderId: orderId || null,
            });
            
            if (checkStatusResponse.data.status && checkStatusResponse.data.data) {
              const { payment: updatedPayment, order: orderData, midtransStatus } = checkStatusResponse.data.data;
              
              // Handle case when payment exists
              if (updatedPayment) {
                setPayment(updatedPayment);
                
                // If payment failed or cancelled, redirect to failed page
                if (updatedPayment.status === "failed" || updatedPayment.status === "cancelled") {
                  router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(updatedPayment.failureReason || "Pembayaran gagal atau dibatalkan")}`);
                  return;
                }
                
                // Update order from payment data
                if (updatedPayment.order) {
                  setOrder(updatedPayment.order);
                }
              }
              
              // Handle case when only order exists (payment record not found)
              if (!updatedPayment && orderData) {
                setOrder(orderData);
                
                // Check order status for cancelled payments
                if (midtransStatus === "cancel" || midtransStatus === "expire" || orderData.status === "DIBATALKAN") {
                  router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent("Pembayaran dibatalkan")}`);
                  return;
                }
              }
            }
          } catch (error) {
            console.error("Error checking payment status:", error);
            // Continue to load order data even if check-status fails
          }
        }

        // Get order details
        const orderResponse = await api.get(`/orders/${orderId}`);
        if (orderResponse.data.status && orderResponse.data.data) {
          const orderData = orderResponse.data.data;
          setOrder(orderData);

          // Get payment details from order if not already set
          if (!payment && orderData.paymentId) {
            try {
              const paymentResponse = await api.get(`/payments/${orderData.paymentId}`);
              if (paymentResponse.data.status && paymentResponse.data.data) {
                const paymentData = paymentResponse.data.data;
                setPayment(paymentData);
                
                // If payment failed, redirect to failed page
                if (paymentData.status === "failed" || paymentData.status === "cancelled") {
                  router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(paymentData.failureReason || "Pembayaran gagal atau dibatalkan")}`);
                  return;
                }
              }
            } catch (error) {
              console.error("Error loading payment:", error);
            }
          } else if (!payment && transactionId) {
            // Try to find payment by transactionId
            try {
              const paymentsResponse = await api.get(`/payments?orderId=${orderId}`);
              if (paymentsResponse.data.status && paymentsResponse.data.data) {
                const paymentData = paymentsResponse.data.data.find(
                  p => p.transactionId === transactionId || p.orderId === parseInt(orderId)
                ) || paymentsResponse.data.data[0];
                if (paymentData) {
                  setPayment(paymentData);
                  
                  // If payment failed, redirect to failed page
                  if (paymentData.status === "failed" || paymentData.status === "cancelled") {
                    router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(paymentData.failureReason || "Pembayaran gagal atau dibatalkan")}`);
                    return;
                  }
                }
              }
            } catch (error) {
              console.error("Error loading payment:", error);
            }
          } else if (!payment) {
            // Try to get payment by orderId
            try {
              const paymentsResponse = await api.get(`/payments?orderId=${orderId}`);
              if (paymentsResponse.data.status && paymentsResponse.data.data && paymentsResponse.data.data.length > 0) {
                const paymentData = paymentsResponse.data.data[0];
                setPayment(paymentData);
                
                // If payment failed, redirect to failed page
                if (paymentData.status === "failed" || paymentData.status === "cancelled") {
                  router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(paymentData.failureReason || "Pembayaran gagal atau dibatalkan")}`);
                  return;
                }
              }
            } catch (error) {
              console.error("Error loading payment:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error loading order:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();

    // Poll payment status every 2 seconds if status is pending (check from Midtrans API)
    let pollInterval;
    if (orderId && (status === "pending" || !status || !payment || payment?.status === "pending")) {
      pollInterval = setInterval(async () => {
        try {
          // Check status from Midtrans API and update database
          const checkStatusResponse = await api.post("/payments/check-status", {
            transactionId: transactionId || payment?.transactionId || null,
            orderId: orderId || null,
          });
          
          if (checkStatusResponse.data.status && checkStatusResponse.data.data) {
            const { payment: updatedPayment, order: orderData, midtransStatus } = checkStatusResponse.data.data;
            
            // Handle case when payment exists
            if (updatedPayment) {
              setPayment(updatedPayment);
              
              // Update order from payment data
              if (updatedPayment.order) {
                setOrder(updatedPayment.order);
              }

              // If payment is now paid, stop polling and reload
              if (updatedPayment.status === "paid") {
                clearInterval(pollInterval);
                window.location.reload();
              }
              // If payment failed or cancelled, redirect to failed page
              else if (updatedPayment.status === "failed" || updatedPayment.status === "cancelled") {
                clearInterval(pollInterval);
                router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(updatedPayment.failureReason || "Pembayaran gagal atau dibatalkan")}`);
              }
            }
            
            // Handle case when only order exists (payment record not found)
            if (!updatedPayment && orderData) {
              setOrder(orderData);
              
              // Check for cancelled/failed status
              if (midtransStatus === "cancel" || midtransStatus === "expire" || orderData.status === "DIBATALKAN") {
                clearInterval(pollInterval);
                router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent("Pembayaran dibatalkan")}`);
              }
              // Check for paid status
              else if (orderData.status === "DIBAYAR" || orderData.paymentStatus === "paid") {
                clearInterval(pollInterval);
                window.location.reload();
              }
            }
          }
        } catch (error) {
          console.error("Error polling payment status:", error);
          // Fallback: try to get order status from database
          try {
            const orderResponse = await api.get(`/orders/${orderId}`);
            if (orderResponse.data.status && orderResponse.data.data) {
              const orderData = orderResponse.data.data;
              setOrder(orderData);
              
              // Check for cancelled status
              if (orderData.status === "DIBATALKAN" || orderData.paymentStatus === "cancelled") {
                clearInterval(pollInterval);
                router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent("Pembayaran dibatalkan")}`);
              }
              // If order status changed to DIBAYAR, stop polling
              else if (orderData.status === "DIBAYAR" && orderData.paymentStatus === "paid") {
                clearInterval(pollInterval);
                window.location.reload();
              }
            }
          } catch (fallbackError) {
            console.error("Error in fallback polling:", fallbackError);
          }
        }
      }, 2000); // Poll every 2 seconds (more aggressive)

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }, 300000); // 5 minutes
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [orderId, transactionId, status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  // Determine payment status from payment record or order status
  const paymentStatus = payment?.status || status || "pending";
  const orderStatus = order?.status;
  const orderPaymentStatus = order?.paymentStatus;
  
  // Check various failure conditions
  const isPending = paymentStatus === "pending" && orderStatus !== "DIBATALKAN";
  const isPaid = paymentStatus === "paid" || orderStatus === "DIBAYAR" || orderPaymentStatus === "paid";
  const isFailed = paymentStatus === "failed" || 
                   paymentStatus === "cancelled" || 
                   orderStatus === "DIBATALKAN" || 
                   orderStatus === "GAGAL" ||
                   orderPaymentStatus === "cancelled";

  // Only show success page if payment is paid or pending (not failed)
  if (isFailed) {
    router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(payment?.failureReason || "Pembayaran dibatalkan")}`);
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0] overflow-hidden">
      <Navbar showBack />

      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs with smoother animation */}
        <div className={`absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#c08a3e]/20 to-[#7b4d2a]/10 blur-3xl rounded-full transition-all duration-[3000ms] ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-20 scale-90'}`}></div>
        <div className={`absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#7b4d2a]/15 to-[#c08a3e]/10 blur-3xl rounded-full transition-all duration-[3500ms] delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-90'}`}></div>
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-[#d4a574]/10 blur-2xl rounded-full transition-all duration-[4000ms] delay-500 ease-out ${mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-45'}`}></div>
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-${2 + (i % 3)} h-${2 + (i % 3)} bg-[#c08a3e]/${20 + (i * 5)} rounded-full transition-all duration-[${2000 + (i * 500)}ms] delay-${i * 200} ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{
              top: `${15 + (i * 12)}%`,
              left: `${10 + (i * 15)}%`,
              animation: `float ${6 + (i * 2)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          ></div>
        ))}
        
        {/* Decorative batik pattern overlay */}
        <div className={`absolute inset-0 opacity-[0.02] transition-opacity duration-[3000ms] delay-700 ${mounted ? 'opacity-[0.02]' : 'opacity-0'}`} 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%237b4d2a' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}
        ></div>
      </div>

      {/* CENTERED CONTAINER */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className={`w-full max-w-2xl transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`}>
          
          {/* Enhanced glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#c08a3e]/20 via-[#7b4d2a]/10 to-[#c08a3e]/20 blur-2xl rounded-3xl transform scale-105 animate-pulse-slow"></div>
          
          <div className="relative px-8 py-10 bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(123,77,42,0.3)] border border-white/60 overflow-hidden group">
            
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[3000ms]"></div>

            {/* Success Icon with animation */}
            <div className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-center mb-6">
                <div className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-500 ${
                  isPending 
                    ? "border-2 border-yellow-300 bg-yellow-50 shadow-[0_30px_80px_-50px_rgba(234,179,8,0.6)]" 
                    : "border-2 border-green-300 bg-green-50 shadow-[0_30px_80px_-50px_rgba(34,197,94,0.6)]"
                }`}>
                  <CheckCircle size={70} className={isPending ? "text-yellow-500 animate-scale-in" : "text-green-500 animate-scale-in"} />
                  <div className={`absolute inset-0 rounded-full ${isPending ? 'bg-yellow-200' : 'bg-green-200'} opacity-20 animate-ping`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="relative p-3 bg-gradient-to-br from-[#7b4d2a] to-[#5c3316] rounded-2xl shadow-lg">
                  <CheckCircle className="text-white" size={26} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#5c3316] via-[#7b4d2a] to-[#5c3316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    {isPending ? "Pembayaran Menunggu Konfirmasi" : "Pembayaran Berhasil"}
                  </h1>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#c08a3e] font-medium">Batik Cindur Batam</span>
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                  </div>
                </div>
              </div>
              
              <p className="mt-3 text-sm text-[#5c3316]/70 md:text-base max-w-md mx-auto leading-relaxed">
                {isPending 
                  ? "Pembayaran Anda sedang diproses. Kami akan mengirimkan notifikasi setelah pembayaran dikonfirmasi."
                  : "Terima kasih telah berbelanja. Kami sedang menyiapkan pesananmu dengan penuh perhatian."
                }
              </p>
            </div>

            {/* Order ID Box */}
            {order && (
              <div className={`mb-6 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="px-4 py-2 rounded-full bg-[#fdf3ec] border border-[#e3d6c5] text-center">
                  <p className="text-sm text-[#5c3316]">
                    ID Pesanan: <span className="font-semibold text-[#7b4d2a]">{order.orderNumber || order.id}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex w-full flex-col gap-3 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {order && (
                <Link 
                  href={`/detail-pesanan/${order.id}`} 
                  className="group relative w-full bg-gradient-to-r from-[#7b4d2a] via-[#8f5c33] to-[#5c3316] text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7b4d2a]/30 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden transform hover:-translate-y-1 active:translate-y-0"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                  <Receipt size={18} className="relative group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative">Lihat Detail & Struk Pembayaran</span>
                </Link>
              )}
              <Link 
                href="/riwayat-pesanan" 
                className="luxury-button text-base justify-center"
              >
                <Package size={18} />
                Riwayat Pesanan
              </Link>
              <Link 
                href="/Beranda" 
                className="luxury-button text-base justify-center border-[#e3d6c5]"
              >
                <Home size={18} />
                Kembali ke Beranda
              </Link>
            </div>

            {/* Order Summary */}
            {order && order.items && order.items.length > 0 && (
              <div className={`mt-8 glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5 transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <h3 className="mb-3 text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em] text-center">
                  Ringkasan pesanan
                </h3>
                <div className="space-y-2 text-sm text-[#5c3316]">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.productName || item.product?.name} (x{item.quantity})</span>
                      <span className="font-semibold text-[#7b4d2a]">
                        Rp {parseFloat(item.subtotal || item.price * item.quantity).toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-[#eadfd0] pt-3 text-sm">
                  <div className="flex justify-between text-[#5c3316]">
                    <span>Subtotal</span>
                    <span>Rp {parseFloat(order.subtotal || 0).toLocaleString("id-ID")}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Diskon</span>
                      <span>- Rp {parseFloat(order.discount).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-[#5c3316]">
                      <span>Pajak</span>
                      <span>Rp {parseFloat(order.tax).toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5c3316]">
                    <span>Ongkos Kirim</span>
                    <span>Rp {parseFloat(order.shippingCost || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-[#7b4d2a] pt-2 border-t border-[#eadfd0]">
                    <span>Total</span>
                    <span>Rp {parseFloat(order.total || 0).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
            opacity: 0.6;
          }
          50% { 
            transform: translateY(-25px) rotate(5deg) scale(1.1); 
            opacity: 1;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.05);
          }
        }
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default function PembayaranBerhasil() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    }>
      <PembayaranBerhasilContent />
    </Suspense>
  );
}
