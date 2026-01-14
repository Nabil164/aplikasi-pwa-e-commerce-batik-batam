"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import Banner from "../../components/Banner";
import KategoriList from "../../components/KategoriList";
import CardProduk from "../../components/CardProduk";
import PushNotification from "../../components/PushNotification";
import api from "../../lib/axios";

export default function BerandaPembeli() {
  const router = useRouter();
  const [latestProducts, setLatestProducts] = useState([]); // Produk terbaru
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      getProducts();
    }
    
    // Refresh produk saat halaman mendapat fokus (setelah kembali dari halaman lain)
    const handleFocus = () => {
      getProducts();
    };
    window.addEventListener('focus', handleFocus);
    
    // Listen untuk event productsUpdated
    const handleProductsUpdate = () => {
      getProducts();
    };
    window.addEventListener('productsUpdated', handleProductsUpdate);
    
    // Refresh setiap 30 detik untuk update produk baru
    const interval = setInterval(() => {
      getProducts();
    }, 30000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      clearInterval(interval);
    };
  }, []);

  const getProducts = async () => {
    try {
      console.log("🔍 Mencoba ambil produk dari backend...");
      
      // Get produk terbaru (latest products)
      const latestRes = await api.get("/products?limit=10&orderBy=createdAt");
      const latestData = latestRes.data.data || latestRes.data || [];
      setLatestProducts(latestData.slice(0, 10)); // Ambil 10 terbaru
      
      console.log("✅ Produk berhasil diambil");
    } catch (err) {
      console.error("❌ Gagal ambil produk:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          method: err.config?.method,
        }
      });
      
      // Tampilkan warning jika backend tidak running
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.warn('⚠️ Tidak bisa terhubung ke backend!');
        console.warn('📝 Kemungkinan penyebab:');
        console.warn('   1. Backend tidak running - Cek: http://127.0.0.1:8000/api/products');
        console.warn('   2. File .env.local tidak ada atau salah');
        console.warn('   3. Frontend belum restart setelah edit config');
        console.warn('   4. CORS issue - cek browser console untuk detail');
        console.warn('   5. RESTART FRONTEND dengan: Ctrl+C lalu npm run dev');
      }
      
      // Fallback data sementara jika backend tidak running
      setLatestProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(192,138,62,0.1),rgba(254,250,246,0.95))] flex items-center justify-center">
        <div className="glass-card px-10 py-8 text-center text-[#5c3316]">
          <div className="luxury-skeleton mx-auto mb-4 h-12 w-12 rounded-full" />
          <p className="text-sm uppercase tracking-[0.35em] text-[#c08a3e]">
            Batik Cindur Batam
          </p>
          <p className="mt-2 text-lg font-semibold">Memuat koleksi terbaik kami...</p>
          <p className="mt-2 text-sm text-[#5c3316]/70">
            Mohon tunggu sejenak, kami sedang menyiapkan batik pilihan untukmu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      {/* Navbar */}
      <Navbar title="Beranda pembeli" />

      {/* Content */}
      <div className="luxury-container pt-6 md:pt-8 space-y-8">
        {/* Banner */}
        <Banner />

        {/* Kategori */}
        <KategoriList />

        {/* Produk Terbaru */}
        <section className="luxury-section">
          <div className="flex flex-col gap-2 mb-6">
            <span className="floating-badge">
              Koleksi terbaru
            </span>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <h3 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
                Produk Terbaru
              </h3>
              <p className="text-sm text-[#5c3316]/70 max-w-md">
                Ragam kain batik premium kurasi terkini. Temukan motif segar yang memadukan tradisi dan gaya modern.
              </p>
            </div>
          </div>

          {latestProducts.length === 0 ? (
            <div className="glass-card mx-auto max-w-lg px-6 py-8 text-center">
              <div className="luxury-skeleton mx-auto mb-4 h-12 w-12 rounded-full" />
              <p className="text-lg font-semibold text-[#5c3316] mb-2">
                Belum ada produk tersedia
              </p>
              <p className="text-sm text-[#5c3316]/70 mb-4">
                Database belum memiliki produk atau terjadi error saat memuat data.
              </p>
              <div className="mt-4 rounded-xl border border-[#d1b799] bg-[#fff6eb] px-4 py-3 text-left text-xs text-[#5c3316]">
                <p className="font-semibold mb-2">Cara memperbaiki:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Jalankan migrasi database: <code className="bg-[#e3d6c5] px-1 rounded">npm run migrate</code></li>
                  <li>Pastikan DATABASE_URL di .env.local sudah benar</li>
                  <li>Restart development server</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
              {latestProducts.map((produk) => (
                <CardProduk key={produk.id} produk={produk} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />

      {/* Push Notification Banner (Opsional) */}
      <PushNotification />
    </div>
  );
}
