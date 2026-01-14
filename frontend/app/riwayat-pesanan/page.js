"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Search, ChevronRight, CalendarCheck, Loader2 } from "lucide-react";
import { resolveImageUrl } from "../../lib/image";
import api from "../../lib/axios";

export default function RiwayatPesananPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get("/orders");
        if (response.data.status && response.data.data) {
          // Sort by tanggal (createdAt) - terbaru di atas
          const sortedOrders = [...response.data.data].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA; // Descending (terbaru pertama)
          });
          setOrders(sortedOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Auto-refresh orders every 10 seconds for pending payments
    const refreshInterval = setInterval(() => {
      loadOrders();
    }, 10000); // Refresh every 10 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [router]);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.id?.toString().includes(searchLower) ||
      order.items?.some((item) =>
        item.productName?.toLowerCase().includes(searchLower) ||
        item.product?.name?.toLowerCase().includes(searchLower)
      )
    );
  });

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    // Status sesuai logika sistem: MENUNGGU_PEMBAYARAN, DIBAYAR, GAGAL, DIBATALKAN, DIPROSES, DIKIRIM, SELESAI
    if (statusUpper === "SELESAI" || statusUpper.includes("SELESAI")) {
      return "text-green-600 bg-green-50";
    }
    if (statusUpper === "DIBATALKAN" || statusUpper === "GAGAL" || statusUpper.includes("DIBATALKAN") || statusUpper.includes("GAGAL")) {
      return "text-red-600 bg-red-50";
    }
    if (statusUpper === "DIKIRIM" || statusUpper.includes("DIKIRIM")) {
      return "text-blue-600 bg-blue-50";
    }
    if (statusUpper === "DIPROSES" || statusUpper.includes("DIPROSES")) {
      return "text-amber-600 bg-amber-50";
    }
    if (statusUpper === "DIBAYAR" || statusUpper.includes("DIBAYAR")) {
      return "text-green-600 bg-green-50";
    }
    // MENUNGGU_PEMBAYARAN (default)
    return "text-[#7b4d2a] bg-[#fdf3ec]";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar title="Riwayat Pesanan" showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#c08a3e]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow-lg">
              <CalendarCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
                Riwayat Pesanan
              </h1>
              <p className="text-xs uppercase tracking-[0.4em] font-semibold">
                Jejak transaksi kamu
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c08a3e]"
            />
            <input
              type="text"
              placeholder="Cari ID atau nama produk"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="luxury-input pl-12"
            />
          </div>
        </section>

        <section className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="glass-card rounded-[26px] border border-[#e3d6c5] bg-white/85 px-6 py-12 text-center text-[#5c3316]/70">
              {searchQuery ? "Tidak ada pesanan ditemukan dengan kata kunci tersebut." : "Belum ada pesanan. Mulai berbelanja sekarang!"}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="glass-card rounded-[26px] border border-[#e3d6c5]/80 bg-white/80 px-5 py-5 shadow-[0_20px_60px_-45px_rgba(91,55,23,0.65)] transition hover:-translate-y-[1px]"
              >
                <div className="flex items-center justify-between border-b border-[#eadfd0] pb-4">
                  <div>
                    <p className="text-sm font-semibold text-[#5c3316]">
                      {formatDate(order.createdAt) || "Tanggal tidak tersedia"}
                    </p>
                    <p className="text-xs text-[#5c3316]/60 mt-1">
                      ID: {order.orderNumber || order.id}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="space-y-3 py-4">
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
                        <div key={item.id} className="flex gap-4">
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border border-[#eadfd0] bg-white/70 shadow-inner md:h-24 md:w-24">
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
                              Jumlah: {itemQuantity} • Ukuran: {sizeName}
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

                <div className="flex items-center justify-between border-t border-[#eadfd0] pt-4">
                  <div>
                    <p className="text-xs text-[#5c3316]/60 uppercase tracking-[0.3em]">
                      Total
                    </p>
                    <p className="text-lg font-semibold text-[#7b4d2a]">
                      Rp {parseFloat(order.total || 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Link
                    href={`/detail-pesanan/${order.id}`}
                    className="luxury-button text-xs"
                  >
                    Lihat detail
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

