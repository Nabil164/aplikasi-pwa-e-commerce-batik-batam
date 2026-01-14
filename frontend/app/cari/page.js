"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import CardProduk from "../../components/CardProduk";
import { Search, X } from "lucide-react";
import api from "../../lib/axios";

function CariContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Baca query dari URL saat pertama kali load
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }

    getProducts();
  }, [searchParams, router]);

  useEffect(() => {
    // Filter products berdasarkan search query
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = products.filter((product) => {
        const name = (product.name || product.nama || "").toLowerCase();
        const category = (product.category || "").toLowerCase();
        const description = (product.description || "").toLowerCase();
        
        return (
          name.includes(query) ||
          category.includes(query) ||
          description.includes(query)
        );
      });
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const getProducts = async () => {
    try {
      const res = await api.get("/products", {
        timeout: 30000,
      });
      const productList = res.data.data || res.data || [];
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (err) {
      console.error("❌ Gagal ambil produk:", err);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Update URL dengan query parameter
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/cari");
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar title="Cari Produk" showBack />

      <div className="luxury-container space-y-6 md:space-y-8">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search
            size={18}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-[#c08a3e]"
          />
          <input
            type="text"
            placeholder="Cari produk, kategori, atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="luxury-input pl-12 pr-12 text-sm md:text-base"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b08968] hover:text-[#7b4d2a] transition"
            >
              <X size={18} />
            </button>
          )}
        </form>

        {loading ? (
          <div className="glass-card flex flex-col items-center justify-center gap-3 rounded-[26px] border border-[#e3d6c5] bg-white/80 px-6 py-12">
            <div className="luxury-skeleton h-12 w-12 rounded-full" />
            <p className="text-sm text-[#5c3316]/70">Memuat produk...</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-[#5c3316]">
              {searchQuery.trim() ? (
                <span>
                  Menampilkan <strong>{filteredProducts.length}</strong> hasil untuk{" "}
                  <strong>{searchQuery}</strong>
                </span>
              ) : (
                <span>
                  Semua produk (<strong>{products.length}</strong>)
                </span>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="glass-card flex flex-col items-center gap-3 rounded-[26px] border border-[#e3d6c5] bg-white/85 px-6 py-12 text-center">
                <Search size={48} className="text-[#c08a3e]" />
                <p className="text-[#5c3316] text-lg font-semibold">
                  {searchQuery.trim() ? "Produk tidak ditemukan" : "Belum ada produk tersedia"}
                </p>
                {searchQuery.trim() && (
                  <p className="text-sm text-[#5c3316]/70">
                    Coba gunakan kata kunci lain atau hapus filter pencarian.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((produk) => (
                  <CardProduk key={produk.id} produk={produk} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function CariPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent pb-24 md:pb-0">
        <Navbar title="Cari Produk" showBack />
        <div className="luxury-container flex items-center justify-center py-20">
          <div className="luxury-skeleton h-64 w-full max-w-md rounded-3xl" />
        </div>
        <BottomNav />
      </div>
    }>
      <CariContent />
    </Suspense>
  );
}

