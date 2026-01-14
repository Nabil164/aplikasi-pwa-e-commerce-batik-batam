"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import BottomNav from "../../../components/BottomNav";
import { 
  Package, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Clock, 
  Receipt, 
  Download, 
  Printer,
  ChevronRight,
  CheckCircle,
  XCircle,
  Truck,
  Box,
  Loader2
} from "lucide-react";
import { resolveImageUrl } from "../../../lib/image";
import api from "../../../lib/axios";

export default function DetailPesananPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef(null);

  useEffect(() => {
    const loadOrder = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get(`/orders/${params.id}`);
        if (response.data.status && response.data.data) {
          setOrder(response.data.data);
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error("Error loading order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [params.id, router]);

  const getStatusIcon = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    // Status sesuai logika sistem
    if (statusUpper === "SELESAI" || statusUpper.includes("SELESAI")) {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    if (statusUpper === "DIBATALKAN" || statusUpper === "GAGAL" || statusUpper.includes("DIBATALKAN") || statusUpper.includes("GAGAL")) {
      return <XCircle size={20} className="text-red-500" />;
    }
    if (statusUpper === "DIKIRIM" || statusUpper.includes("DIKIRIM")) {
      return <Truck size={20} className="text-blue-500" />;
    }
    if (statusUpper === "DIPROSES" || statusUpper.includes("DIPROSES")) {
      return <Box size={20} className="text-amber-500" />;
    }
    if (statusUpper === "DIBAYAR" || statusUpper.includes("DIBAYAR")) {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    // MENUNGGU_PEMBAYARAN (default)
    return <Package size={20} className="text-[#7b4d2a]" />;
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    // Status sesuai logika sistem: MENUNGGU_PEMBAYARAN, DIBAYAR, GAGAL, DIBATALKAN, DIPROSES, DIKIRIM, SELESAI
    if (statusUpper === "SELESAI" || statusUpper.includes("SELESAI")) {
      return "text-green-600 bg-green-50 border-green-200";
    }
    if (statusUpper === "DIBATALKAN" || statusUpper === "GAGAL" || statusUpper.includes("DIBATALKAN") || statusUpper.includes("GAGAL")) {
      return "text-red-600 bg-red-50 border-red-200";
    }
    if (statusUpper === "DIKIRIM" || statusUpper.includes("DIKIRIM")) {
      return "text-blue-600 bg-blue-50 border-blue-200";
    }
    if (statusUpper === "DIPROSES" || statusUpper.includes("DIPROSES")) {
      return "text-amber-600 bg-amber-50 border-amber-200";
    }
    if (statusUpper === "DIBAYAR" || statusUpper.includes("DIBAYAR")) {
      return "text-green-600 bg-green-50 border-green-200";
    }
    // MENUNGGU_PEMBAYARAN (default)
    return "text-[#7b4d2a] bg-[#fdf3ec] border-[#e3d6c5]";
  };

  const getStatusLabel = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    // Mapping status sesuai logika sistem
    const statusMap = {
      "MENUNGGU_PEMBAYARAN": "Menunggu Pembayaran",
      "DIBAYAR": "Pembayaran Berhasil",
      "GAGAL": "Pembayaran Gagal",
      "DIBATALKAN": "Pesanan Dibatalkan",
      "DIPROSES": "Sedang Diproses",
      "DIKIRIM": "Sedang Dikirim",
      "SELESAI": "Pesanan Selesai",
      // Fallback untuk status lama (backward compatibility)
      "PENDING": "Menunggu Pembayaran",
      "PROCESSING": "Sedang Diproses",
      "SHIPPED": "Sedang Dikirim",
      "DELIVERED": "Pesanan Selesai",
      "CANCELLED": "Pesanan Dibatalkan",
    };
    return statusMap[statusUpper] || status || "Menunggu Pembayaran";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("id-ID", { 
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-transparent pb-24 md:pb-0">
        <Navbar title="Detail Pesanan" showBack />
        <div className="luxury-container flex min-h-[60vh] flex-col items-center justify-center text-center">
          <Package size={80} className="text-[#e3d6c5] mb-4" />
          <h2 className="text-xl font-semibold text-[#5c3316]">Pesanan tidak ditemukan</h2>
          <p className="text-sm text-[#5c3316]/70 mt-2">
            Pesanan dengan ID {params.id} tidak ada dalam riwayat.
          </p>
          <Link href="/riwayat-pesanan" className="luxury-button primary-button mt-6">
            Kembali ke Riwayat
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Calculate totals
  const subtotal = order.items?.reduce(
    (acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)),
    0
  ) || parseFloat(order.subtotal || 0);
  const tax = parseFloat(order.tax || 0);
  const shipping = parseFloat(order.shippingCost || order.shipping || 0);
  const total = parseFloat(order.total || 0);

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar title="Detail Pesanan" showBack />

      <div className="luxury-container space-y-6">
        {/* Order Header */}
        <section className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-[#5c3316]/60 uppercase tracking-[0.3em]">ID Pesanan</p>
              <p className="text-lg font-semibold text-[#5c3316]">{order.orderNumber || order.id}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="text-sm font-semibold">{getStatusLabel(order.status)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#eadfd0]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#fdf3ec]">
                <Calendar size={18} className="text-[#7b4d2a]" />
              </div>
              <div>
                <p className="text-xs text-[#5c3316]/60">Tanggal</p>
                <p className="text-sm font-medium text-[#5c3316]">
                  {formatDate(order.createdAt) || "Tanggal tidak tersedia"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#fdf3ec]">
                <Clock size={18} className="text-[#7b4d2a]" />
              </div>
              <div>
                <p className="text-xs text-[#5c3316]/60">Waktu</p>
                <p className="text-sm font-medium text-[#5c3316]">
                  {formatTime(order.createdAt) || "Waktu tidak tersedia"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5">
          <h3 className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Package size={18} className="text-[#7b4d2a]" />
            Produk Dipesan
          </h3>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => {
                const productName = item.productName || item.product?.name || "Product";
                const productImage = item.product?.images?.[0]?.imageUrl || 
                                   item.product?.images?.[0]?.image_url || 
                                   item.product?.image || 
                                   "/logo_batik.jpg";
                const itemPrice = parseFloat(item.price || 0);
                const itemQuantity = parseInt(item.quantity || 1);
                const sizeName = item.size?.size || item.size || "-";
                
                return (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-[#eadfd0] last:border-0 last:pb-0">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-[#eadfd0] bg-white/70">
                      <img
                        src={resolveImageUrl(productImage)}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/logo_batik.jpg";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#5c3316]">{productName}</h4>
                      <p className="text-xs text-[#5c3316]/60 mt-1">
                        Ukuran: {sizeName} • Qty: {itemQuantity}
                      </p>
                      <p className="text-sm font-semibold text-[#7b4d2a] mt-2">
                        Rp {(itemPrice * itemQuantity).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-[#5c3316]/70">Tidak ada item</p>
            )}
          </div>
        </section>

        {/* Shipping Address */}
        <section className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5">
          <h3 className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-[#7b4d2a]" />
            Alamat Pengiriman
          </h3>
          <div className="bg-[#fdf3ec] rounded-2xl p-4">
            <p className="font-semibold text-[#5c3316]">
              {order.address?.recipientName || order.address?.recipient_name || "Nama Penerima"}
            </p>
            <p className="text-sm text-[#5c3316]/70 mt-1">
              {order.address?.phoneNumber || order.address?.recipient_phone || "08xxxxxxxxxx"}
            </p>
            <p className="text-sm text-[#5c3316]/70 mt-2">
              {order.address?.streetAddress || order.address?.address || "Alamat lengkap pengiriman"}
            </p>
            <p className="text-xs text-[#5c3316]/60 mt-1">
              {order.address?.district || "Kecamatan"}, {order.address?.city || "Kota"}, {order.address?.province || "Provinsi"} {order.address?.postalCode || order.address?.postal_code || "00000"}
            </p>
          </div>
        </section>

        {/* Payment Method */}
        <section className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5">
          <h3 className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-[#7b4d2a]" />
            Metode Pembayaran
          </h3>
          <div className="bg-[#fdf3ec] rounded-2xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border border-[#e3d6c5]">
              <CreditCard size={24} className="text-[#7b4d2a]" />
            </div>
            <div>
              <p className="font-semibold text-[#5c3316]">
                {order.payment?.paymentMethod || order.paymentMethod || "Transfer Bank"}
              </p>
              <p className="text-sm text-[#5c3316]/70">
                {(() => {
                  const paymentStatus = order.payment?.status || order.paymentStatus || "unpaid";
                  const orderStatus = order.status?.toUpperCase() || "";
                  
                  if (paymentStatus === "paid" || orderStatus === "DIBAYAR") {
                    return "Sudah Dibayar";
                  } else if (paymentStatus === "failed" || orderStatus === "GAGAL" || orderStatus === "DIBATALKAN") {
                    return "Pembayaran Gagal";
                  } else if (paymentStatus === "pending" || orderStatus === "MENUNGGU_PEMBAYARAN") {
                    return "Menunggu Pembayaran";
                  }
                  return "Menunggu Pembayaran";
                })()}
              </p>
            </div>
          </div>
        </section>

        {/* Payment Summary */}
        <section className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/90 px-5 py-5">
          <h3 className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em] mb-4">
            Ringkasan Pembayaran
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-[#5c3316]">
              <span>Subtotal ({order.items?.length || 0} produk)</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-[#5c3316]">
                <span>Diskon</span>
                <span className="text-green-600">- Rp {parseFloat(order.discount || 0).toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-[#5c3316]">
              <span>Pajak (11%)</span>
              <span>Rp {tax.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm text-[#5c3316]">
              <span>Ongkos Kirim</span>
              <span>Rp {shipping.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#eadfd0] text-base font-semibold text-[#7b4d2a]">
              <span>Total Pembayaran</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowReceipt(true)}
            className="luxury-button primary-button justify-center"
          >
            <Receipt size={18} />
            Lihat Struk Pembayaran
          </button>
          <Link href="/riwayat-pesanan" className="luxury-button justify-center">
            Kembali ke Riwayat
          </Link>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Receipt Content */}
            <div ref={receiptRef} className="p-6 print:p-4">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h2 className="text-xl font-bold text-[#5c3316]">BATIK CINDUR BATAM</h2>
                <p className="text-xs text-gray-500 mt-1">Jl. Batik Cindur No. 123, Batam</p>
                <p className="text-xs text-gray-500">Telp: (0778) 123-4567</p>
              </div>

              {/* Receipt Info */}
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">No. Transaksi:</span>
                  <span className="font-semibold">{order.id}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Tanggal:</span>
                  <span>{order.date || "29 Sep 2024"}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Waktu:</span>
                  <span>{order.time || "14:30 WIB"}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Kasir:</span>
                  <span>System</span>
                </div>
              </div>

              {/* Items */}
              <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">DAFTAR BELANJA:</p>
                {order.items.map((item, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{item.quantity} x Rp {item.price.toLocaleString("id-ID")}</span>
                      <span>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                    <p className="text-xs text-gray-500">Ukuran: {item.size}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pajak (10%):</span>
                  <span>Rp {tax.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ongkir:</span>
                  <span>Rp {shipping.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
                  <span>TOTAL:</span>
                  <span>Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="border-t border-dashed border-gray-300 pt-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Metode Bayar:</span>
                  <span>{order.paymentMethod || "Transfer Bank"}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Status:</span>
                  <span className={order.status === "Pesanan Selesai" ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {(() => {
                      const statusUpper = order.status?.toUpperCase() || "";
                      if (statusUpper === "SELESAI" || statusUpper.includes("SELESAI")) {
                        return "LUNAS";
                      } else if (statusUpper === "DIBAYAR" || statusUpper.includes("DIBAYAR")) {
                        return "LUNAS";
                      } else {
                        return statusUpper || "PENDING";
                      }
                    })()}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center border-t border-dashed border-gray-300 pt-4">
                <p className="text-sm font-medium text-[#5c3316]">Terima Kasih</p>
                <p className="text-xs text-gray-500 mt-1">Atas Kunjungan Anda</p>
                <p className="text-xs text-gray-400 mt-2">
                  Simpan struk ini sebagai bukti pembayaran
                </p>
                <div className="mt-4 p-2 bg-gray-100 rounded-lg">
                  <p className="text-xs text-gray-600 font-mono">{order.id}</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-gray-200 flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#7b4d2a] text-white rounded-xl font-semibold hover:bg-[#5c3316] transition"
              >
                <Printer size={18} />
                Cetak
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 px-4 py-3 border-2 border-[#e3d6c5] text-[#5c3316] rounded-xl font-semibold hover:bg-[#fdf3ec] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed {
            position: absolute;
            inset: 0;
            background: white !important;
          }
          .fixed > div {
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
          }
          .fixed > div > div:first-child,
          .fixed > div > div:first-child * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

