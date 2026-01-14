"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { XCircle, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import api from "../../lib/axios";

function PembayaranGagalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const errorMessage = searchParams.get("error");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (orderId) {
      const loadOrderData = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem("token");
          if (!token) {
            return;
          }

          const orderResponse = await api.get(`/orders/${orderId}`);
          if (orderResponse.data.status && orderResponse.data.data) {
            const orderData = orderResponse.data.data;
            setOrder(orderData);

            // Get payment details to show more info
            if (orderData.paymentId) {
              try {
                const paymentResponse = await api.get(`/payments/${orderData.paymentId}`);
                if (paymentResponse.data.status && paymentResponse.data.data) {
                  const payment = paymentResponse.data.data;
                  // Update error message if payment has failure reason
                  if (payment.failureReason && !errorMessage) {
                    // Could set a state for payment details if needed
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
    }
  }, [orderId, errorMessage]);

  const handleRetryPayment = () => {
    if (orderId) {
      router.push(`/pembayaran?orderId=${orderId}`);
    } else {
      router.push("/keranjang");
    }
  };

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

            {/* Error Icon with animation */}
            <div className={`text-center mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center justify-center mb-6">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 shadow-[0_30px_80px_-50px_rgba(239,68,68,0.5)] transition-all duration-500">
                  <XCircle size={70} className="text-red-500 animate-scale-in" />
                  <div className="absolute inset-0 rounded-full bg-red-200 opacity-20 animate-ping"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="relative p-3 bg-gradient-to-br from-[#7b4d2a] to-[#5c3316] rounded-2xl shadow-lg">
                  <XCircle className="text-white" size={26} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#5c3316] via-[#7b4d2a] to-[#5c3316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    Pembayaran Gagal
                  </h1>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#c08a3e] font-medium">Batik Cindur Batam</span>
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                  </div>
                </div>
              </div>
              
              <p className="mt-3 text-sm text-[#5c3316]/70 md:text-base max-w-md mx-auto leading-relaxed">
                {errorMessage 
                  ? errorMessage 
                  : "Kami belum dapat memproses pembayaranmu. Periksa kembali koneksi dan metode pembayaran, lalu coba lagi."
                }
              </p>
            </div>

            {/* Order ID Box */}
            {order && (
              <div className={`mb-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="px-4 py-2 rounded-full bg-[#fdf3ec] border border-[#e3d6c5] text-center">
                  <p className="text-sm text-[#5c3316]">
                    ID Pesanan: <span className="font-semibold text-[#7b4d2a]">{order.orderNumber || order.id}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className={`mb-6 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="glass-card rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 max-w-md mx-auto">
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-left">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={`flex w-full flex-col gap-3 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <button
                onClick={handleRetryPayment}
                disabled={loading}
                className="group relative w-full bg-gradient-to-r from-[#7b4d2a] via-[#8f5c33] to-[#5c3316] text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7b4d2a]/30 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                {loading ? (
                  <>
                    <Loader2 className="relative animate-spin" size={18} />
                    <span className="relative">Memuat...</span>
                  </>
                ) : (
                  <span className="relative">Coba Lagi</span>
                )}
              </button>
              {order && (
                <Link 
                  href={`/detail-pesanan/${order.id}`} 
                  className="luxury-button text-base justify-center"
                >
                  Lihat Detail Pesanan
                </Link>
              )}
              <Link 
                href="/keranjang" 
                className="luxury-button text-base justify-center border-[#e3d6c5]"
              >
                Kembali ke Keranjang
              </Link>
            </div>

            {/* Tips Card */}
            <div className={`mt-8 glass-card rounded-[20px] border border-[#e3d6c5] bg-white/90 px-5 py-4 max-w-md mx-auto transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-sm font-semibold text-[#5c3316] mb-2 text-center">Tips</h3>
              <ul className="text-xs text-[#5c3316]/70 text-left space-y-1">
                <li>• Pastikan koneksi internet Anda stabil</li>
                <li>• Periksa saldo atau limit kartu Anda</li>
                <li>• Pastikan data pembayaran sudah benar</li>
                <li>• Coba gunakan metode pembayaran lain</li>
                <li>• Hubungi customer service jika masalah berlanjut</li>
              </ul>
            </div>
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

export default function PembayaranGagal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    }>
      <PembayaranGagalContent />
    </Suspense>
  );
}
