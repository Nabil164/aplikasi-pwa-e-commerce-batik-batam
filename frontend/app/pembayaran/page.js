"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { Edit2, Wallet, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { resolveImageUrl } from "../../lib/image";
import api from "../../lib/axios";

function PembayaranPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [snapToken, setSnapToken] = useState(null);
  const [midtransClientKey, setMidtransClientKey] = useState("");

  useEffect(() => {
    if (!orderId) {
      router.push("/keranjang");
      return;
    }

    const loadOrderData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Get order details
        const orderResponse = await api.get(`/orders/${orderId}`);
        if (orderResponse.data.status && orderResponse.data.data) {
          setOrder(orderResponse.data.data);
        } else {
          setError("Pesanan tidak ditemukan");
        }

        // Get Midtrans client key from environment
        // Fallback to sandbox key if env not set
        const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "Mid-client-KIgYKIEWHcHYL8uP";
        setMidtransClientKey(clientKey);
      } catch (error) {
        console.error("Error loading order:", error);
        setError(error.response?.data?.message || "Gagal memuat data pesanan");
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, router]);

  useEffect(() => {
    // Load Midtrans Snap script when snapToken is available
    if (snapToken && midtransClientKey) {
      const script = document.createElement("script");
      script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      script.setAttribute("data-client-key", midtransClientKey || "Mid-client-KIgYKIEWHcHYL8uP");
      script.async = true;
      
      script.onload = () => {
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: async function(result) {
              console.log("✅ Payment success:", result);
              // Use order_id (our orderNumber) instead of transaction_id (Midtrans internal ID)
              const midtransOrderId = result.order_id || result.transaction_id;
              // Check status from Midtrans API and update database before redirect
              try {
                await api.post("/payments/check-status", {
                  transactionId: midtransOrderId,
                  orderId: orderId,
                });
              } catch (error) {
                console.error("Error checking payment status:", error);
              }
              // Redirect to success page with orderId and transactionId
              router.push(`/pembayaran-berhasil?orderId=${orderId}&transactionId=${midtransOrderId}&status=paid`);
            },
            onPending: async function(result) {
              console.log("⏳ Payment pending:", result);
              // Use order_id (our orderNumber) instead of transaction_id (Midtrans internal ID)
              const midtransOrderId = result.order_id || result.transaction_id;
              // Check status from Midtrans API and update database before redirect
              try {
                await api.post("/payments/check-status", {
                  transactionId: midtransOrderId,
                  orderId: orderId,
                });
              } catch (error) {
                console.error("Error checking payment status:", error);
              }
              // Redirect to success page with pending status
              router.push(`/pembayaran-berhasil?orderId=${orderId}&transactionId=${midtransOrderId}&status=pending`);
            },
            onError: function(result) {
              console.log("❌ Payment error:", result);
              // Redirect to failed page with error message
              const errorMsg = result.status_message || result.message || "Pembayaran gagal";
              router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(errorMsg)}`);
            },
            onClose: async function() {
              console.log("🚪 Payment popup closed by user");
              // User closed the popup - check payment status from Midtrans API
              try {
                // Check status from Midtrans API and update database
                const checkStatusResponse = await api.post("/payments/check-status", {
                  orderId: orderId,
                });
                
                if (checkStatusResponse.data.status && checkStatusResponse.data.data) {
                  const { payment, order: orderData, midtransStatus } = checkStatusResponse.data.data;
                  
                  // Check from payment if exists
                  if (payment) {
                    if (payment.status === "paid") {
                      router.push(`/pembayaran-berhasil?orderId=${orderId}&transactionId=${payment.transactionId}&status=paid`);
                      return;
                    } else if (payment.status === "failed" || payment.status === "cancelled") {
                      router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(payment.failureReason || "Pembayaran dibatalkan")}`);
                      return;
                    }
                  }
                  
                  // Check from order if payment not found
                  if (orderData) {
                    if (midtransStatus === "cancel" || midtransStatus === "expire" || orderData.status === "DIBATALKAN") {
                      router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent("Pembayaran dibatalkan")}`);
                      return;
                    } else if (orderData.status === "DIBAYAR" || orderData.paymentStatus === "paid") {
                      router.push(`/pembayaran-berhasil?orderId=${orderId}&status=paid`);
                      return;
                    }
                  }
                  
                  // If still pending, stay on page
                  console.log("Payment still pending, staying on page");
                }
              } catch (error) {
                console.error("Error checking payment status:", error);
                // Fallback: try to get order status from database
                try {
                  const orderResponse = await api.get(`/orders/${orderId}`);
                  if (orderResponse.data.status && orderResponse.data.data) {
                    const orderData = orderResponse.data.data;
                    
                    // Check order status directly
                    if (orderData.status === "DIBATALKAN" || orderData.paymentStatus === "cancelled") {
                      router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent("Pembayaran dibatalkan")}`);
                      return;
                    }
                    
                    if (orderData.paymentId) {
                      const paymentResponse = await api.get(`/payments/${orderData.paymentId}`);
                      if (paymentResponse.data.status && paymentResponse.data.data) {
                        const payment = paymentResponse.data.data;
                        if (payment.status === "paid") {
                          router.push(`/pembayaran-berhasil?orderId=${orderId}&transactionId=${payment.transactionId}&status=paid`);
                        } else if (payment.status === "failed" || payment.status === "cancelled") {
                          router.push(`/pembayaran-gagal?orderId=${orderId}&error=${encodeURIComponent(payment.failureReason || "Pembayaran dibatalkan")}`);
                        }
                      }
                    }
                  }
                } catch (fallbackError) {
                  console.error("Error in fallback check:", fallbackError);
                }
              }
            },
          });
        }
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [snapToken, midtransClientKey, orderId, router]);

  const handleKonfirmasi = async () => {
    if (!order) {
      alert("Data pesanan tidak ditemukan!");
      return;
    }

    setCreatingPayment(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Create payment transaction
      const paymentResponse = await api.post("/payments", {
        orderId: order.id,
        amount: parseFloat(order.total),
      });

      if (paymentResponse.data.status && paymentResponse.data.data) {
        const payment = paymentResponse.data.data;
        
        if (payment.snapToken) {
          setSnapToken(payment.snapToken);
          // The useEffect will handle opening Midtrans popup
        } else if (payment.snapUrl) {
          // Redirect to Midtrans URL if token is not available
          window.location.href = payment.snapUrl;
        } else {
          throw new Error("Token pembayaran tidak tersedia");
        }
      } else {
        throw new Error(paymentResponse.data.message || "Gagal membuat transaksi pembayaran");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      setError(error.response?.data?.message || error.message || "Gagal membuat transaksi pembayaran. Silakan coba lagi.");
    } finally {
      setCreatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0]">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0] overflow-hidden">
        <Navbar title="Pembayaran" showBack />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#c08a3e]/20 to-[#7b4d2a]/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#7b4d2a]/15 to-[#c08a3e]/10 blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 flex min-h-[70vh] w-full items-center justify-center px-4 py-12">
          <div className="w-full max-w-md relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#c08a3e]/20 via-[#7b4d2a]/10 to-[#c08a3e]/20 blur-2xl rounded-3xl" />
            <div className="relative px-8 py-10 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(123,77,42,0.3)] border border-white/60 text-center">
              <AlertCircle className="text-red-500 mb-4 mx-auto" size={40} />
              <h2 className="text-xl font-semibold text-[#5c3316] mb-2">Terjadi Kesalahan</h2>
              <p className="text-sm text-[#5c3316]/70 mb-6">{error}</p>
              <button
                onClick={() => router.push("/keranjang")}
                className="luxury-button primary-button"
              >
                Kembali ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0] overflow-hidden">
      <Navbar title="Pembayaran" showBack />

      {/* Background dekoratif mirip halaman login yang Anda kirim */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#c08a3e]/20 to-[#7b4d2a]/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#7b4d2a]/15 to-[#c08a3e]/10 blur-3xl rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#d4a574]/10 blur-2xl rounded-full" />

        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%237b4d2a' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        />
      </div>

      {/* Konten utama dalam kartu tengah */}
      <div className="relative z-10 flex min-h-[80vh] w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#c08a3e]/20 via-[#7b4d2a]/10 to-[#c08a3e]/20 blur-2xl rounded-3xl" />

          <div className="relative px-6 py-7 md:px-8 md:py-8 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(123,77,42,0.3)] border border-white/60 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#7b4d2a] to-[#5c3316] text-white shadow-lg">
                  <Wallet size={22} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-[#5c3316]">
                    Konfirmasi Pembayaran
                  </h2>
                  <div className="flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-[#c08a3e]">
                    <Sparkles size={12} />
                    <span>Pesanan kamu siap diproses</span>
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-[#5c3316]/60">
                <p className="font-semibold">ID Pesanan</p>
                <p className="font-mono text-[11px]">
                  #{order.id}
                </p>
              </div>
            </div>

            {/* Error dalam kartu jika ada */}
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-[1.7fr_1.2fr]">
              {/* Ringkasan pesanan */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-[#5c3316] mb-1">
                  Ringkasan Pesanan
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 pb-3 border-b border-[#e7d9c6] last:border-0 last:pb-0"
                      >
                        <div className="relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-[#eadfd0] bg-white/75 shadow-inner">
                          <img
                            src={resolveImageUrl(
                              item.product?.images?.[0]?.imageUrl ||
                                item.product?.images?.[0]?.image_url ||
                                "/logo_batik.jpg"
                            )}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "/logo_batik.jpg";
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-[#c08a3e] font-semibold">
                            {item.product?.category || "Batik Premium"}
                          </p>
                          <h4 className="text-sm font-semibold text-[#5c3316] mt-1 line-clamp-2">
                            {item.productName}
                          </h4>
                          <p className="text-[11px] text-[#5c3316]/60 mt-1">
                            Size: {item.size?.size || "-"} • Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-[#7b4d2a] mt-1">
                            Rp{" "}
                            {(
                              parseFloat(item.price) * item.quantity
                            ).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#5c3316]/70">
                      Tidak ada item pesanan.
                    </p>
                  )}
                </div>
              </section>

              {/* Alamat + total pembayaran */}
              <section className="space-y-4">
                {order.address && (
                  <div className="rounded-2xl border border-[#e3d6c5] bg-[#fff6eb] px-4 py-4 text-sm text-[#5c3316]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-[#5c3316]">
                        Alamat Pengiriman
                      </h3>
                      <button
                        onClick={() => router.push("/alamat")}
                        className="luxury-button text-[11px] px-2 py-1"
                      >
                        <Edit2 size={14} />
                        <span className="font-semibold">Ubah</span>
                      </button>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em]">
                      {order.address.label || "Alamat utama"}
                    </p>
                    <p className="mt-2 text-[12px] text-[#5c3316]/70">
                      {order.address.recipientName || order.address.recipient_name} •{" "}
                      {order.address.phoneNumber || order.address.recipient_phone}
                    </p>
                    <p className="mt-1 text-[12px] text-[#5c3316]/80">
                      {order.address.streetAddress || order.address.address}
                    </p>
                    <p className="mt-1 text-[11px] text-[#b08968] uppercase tracking-[0.2em]">
                      {order.address.district}, {order.address.city},{" "}
                      {order.address.province}{" "}
                      {order.address.postalCode || order.address.postal_code}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-[#e3d6c5] bg-white px-4 py-4 text-sm text-[#5c3316]">
                  <h3 className="text-sm font-semibold text-[#5c3316] mb-3">
                    Detail Pembayaran
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-[#7b4d2a]">
                        Rp {parseFloat(order.subtotal).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5c3316]/60">
                      {order.items?.length || 0} item
                    </p>
                    <div className="border-t border-[#eadfd0] pt-3 mt-2">
                      <div className="flex items-center justify-between text-base font-semibold text-[#7b4d2a]">
                        <span>Total Pembayaran</span>
                        <span>
                          Rp {parseFloat(order.total).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleKonfirmasi}
                  disabled={creatingPayment}
                  className="w-full luxury-button primary-button justify-center text-sm md:text-base py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingPayment ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    "Bayar dengan Midtrans"
                  )}
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0]">
          <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
        </div>
      }
    >
      <PembayaranPageContent />
    </Suspense>
  );
}
