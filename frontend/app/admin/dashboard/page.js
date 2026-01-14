"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../components/AdminSidebar";
import api from "../../../lib/axios";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProduk: 0,
    totalPesanan: 0,
    totalPenjualan: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek role
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/dashboard");
        const data = response.data.data;
        
        if (data && data.stats) {
          setStats({
            totalProduk: data.stats.totalProducts || 0,
            totalPesanan: data.stats.totalOrders || 0,
            totalPenjualan: data.stats.totalRevenue || 0,
            totalUsers: data.stats.totalUsers || 0,
            pendingOrders: data.stats.pendingOrders || 0,
            processingOrders: data.stats.processingOrders || 0,
          });
        } else {
          // Fallback to old method
          const produkRes = await api.get("/products");
          const produkData = produkRes.data.data || produkRes.data || [];

          setStats({
            totalProduk: produkData.length,
            totalPesanan: 0,
            totalPenjualan: 0,
          });
        }
      } catch (error) {
        console.error("Gagal mengambil statistik dashboard:", error);
        // Fallback to old method on error
        try {
          const produkRes = await api.get("/products");
          const produkData = produkRes.data.data || produkRes.data || [];
          setStats({
            totalProduk: produkData.length,
            totalPesanan: 0,
            totalPenjualan: 0,
          });
        } catch (fallbackError) {
          console.error("Fallback juga gagal:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#704d31]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F6F3EC" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen" style={{ backgroundColor: "#F6F3EC" }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#5a3921] mb-6">
            Dashboard
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Jumlah Produk</h3>
              <p className="text-3xl font-bold text-[#704d31]">
                {stats.totalProduk}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Jumlah Pesanan</h3>
              <p className="text-3xl font-bold text-[#704d31]">
                {stats.totalPesanan}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm mb-2">Total Penjualan</h3>
              <p className="text-3xl font-bold text-[#704d31]">
                {stats.totalPenjualan}
              </p>
            </div>
          </div>

          {/* Pesanan Terbaru */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#5a3921] mb-4">
              Pesanan Terbaru
            </h2>
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada pesanan</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

