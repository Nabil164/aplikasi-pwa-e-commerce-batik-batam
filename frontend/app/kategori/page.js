"use client";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import CardProduk from "../../components/CardProduk";
import { Filter, ChevronDown, Sparkles } from "lucide-react";
import api from "../../lib/axios";

function KategoriContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryType = searchParams.get("type") || "";
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    kategori: categoryType === "wanita" ? "Kemeja" : "",
    ukuran: "",
  });
  const [categoryCounts, setCategoryCounts] = useState({}); // State untuk menyimpan jumlah produk per kategori

  // Memoized getProducts function untuk prevent infinite re-renders
  const getProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use category query parameter if categoryType is specified
      let apiUrl = "/products";
      let mappedCategory = "";
      
      if (categoryType) {
        // Map categoryType to actual category values (case-sensitive)
        const categoryMap = {
          'wanita': 'Pakaian Wanita',
          'pria': 'Pakaian Pria', 
          'aksesoris': 'Aksesoris',
          'kain': 'Kain Batik',
        };
        mappedCategory = categoryMap[categoryType.toLowerCase()] || categoryType;
        apiUrl = `/products?category=${encodeURIComponent(mappedCategory)}`;
        console.log('[KATEGORI] Mapped category:', categoryType, '->', mappedCategory);
      }
      
      const res = await api.get(apiUrl);
      let productsData = res.data.data || res.data || [];
      
      // Remove client-side filtering since backend now handles it correctly
      setProducts(productsData);
      
      // Hitung jumlah produk per kategori (hanya untuk kategori yang dipilih)
      const counts = {};
      const allCategories = ['Pakaian Wanita', 'Pakaian Pria', 'Aksesoris', 'Kain Batik'];
      
      // Jika tidak ada filter, hitung semua kategori
      if (!categoryType) {
        // Ambil semua produk untuk menghitung semua kategori
        const allRes = await api.get("/products");
        const allProducts = allRes.data.data || allRes.data || [];
        
        allCategories.forEach(cat => {
          const catCount = allProducts.filter(p => p.category === cat).length;
          counts[cat] = catCount;
          console.log(`[KATEGORI] ${cat}: ${catCount} products`);
        });
        
        console.log('[KATEGORI] All categories count:', counts);
      } else {
        // Hitung hanya untuk kategori yang dipilih
        counts[mappedCategory] = productsData.length;
        console.log('[KATEGORI] Set count for', mappedCategory, ':', productsData.length, 'products');
      }
      
      setCategoryCounts(counts);
    } catch (err) {
      console.error("Gagal ambil produk:", err);
      // Set fallback empty array jika backend tidak running
      setProducts([]);
      setCategoryCounts({});
      
      // Tampilkan warning di console
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        console.warn('⚠️ Backend tidak running!');
        console.warn('📝 Cara menjalankan backend:');
        console.warn('   1. Buka terminal baru');
        console.warn('   2. cd frontend');
        console.warn('   3. npm run dev');
        console.warn('   4. Refresh halaman ini');
      }
    } finally {
      setLoading(false);
    }
  }, [categoryType]); // Hanya depend pada categoryType

  useEffect(() => {
    getProducts();
  }, [categoryType]); // Hanya depend pada categoryType

  const categoryTitle = categoryType === "wanita" ? "Pakaian Wanita" 
    : categoryType === "pria" ? "Pakaian Pria"
    : categoryType === "aksesoris" ? "Aksesoris"
    : categoryType === "kain" ? "Kain Batik"
    : "Kategori Produk";

  const ukuranOptions = ["S", "M", "L", "XL", "XXL"];

  // Helper function untuk mendapatkan category type dari nama kategori
  const getCategoryType = (categoryName) => {
    const categoryMap = {
      'Pakaian Wanita': 'wanita',
      'Pakaian Pria': 'pria',
      'Aksesoris': 'aksesoris',
      'Kain Batik': 'kain',
    };
    return categoryMap[categoryName] || '';
  };

  const filterProducts = useMemo(
    () =>
      products.filter((p) => {
        if (
          selectedFilters.kategori &&
          p.category &&
          !p.category.toLowerCase().includes(selectedFilters.kategori.toLowerCase())
        ) {
          return false;
        }
        if (
          selectedFilters.ukuran &&
          Array.isArray(p.size) &&
          !p.size.includes(selectedFilters.ukuran)
        ) {
          return false;
        }
        return true;
      }),
    [products, selectedFilters]
  );

  const filterCount = useMemo(
    () => [selectedFilters.kategori, selectedFilters.ukuran].filter(Boolean).length,
    [selectedFilters]
  );

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar title={categoryTitle} />

      <div className="luxury-container space-y-8 md:space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#5c3316] md:text-4xl">
            {categoryTitle}
          </h1>
          <p className="mt-2 text-sm text-[#5c3316]/70">
            Temukan koleksi batik terbaik kami
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-[#5c3316]/70">
            {loading
              ? "Memuat produk terbaik kami..."
              : filterProducts.length === 0
              ? "0 produk ditemukan"
              : `${filterProducts.length} produk ditemukan`}
          </div>
        </div>

        <div className="luxury-scroll flex items-center gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`luxury-button text-xs font-semibold ${
              showFilter || filterCount > 0 ? "primary-button" : ""
            }`}
          >
            <Filter size={16} />
            Filter
            {filterCount > 0 && (
              <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">
                {filterCount}
              </span>
            )}
            <ChevronDown
              size={16}
              className={`transition ${showFilter ? "rotate-180" : ""}`}
            />
          </button>
          <select
            value={selectedFilters.ukuran}
            onChange={(e) =>
              setSelectedFilters({ ...selectedFilters, ukuran: e.target.value })
            }
            className="luxury-button text-xs font-semibold bg-white/80"
          >
            <option value="">Semua ukuran</option>
            {ukuranOptions.map((ukuran) => (
              <option key={ukuran} value={ukuran}>
                {ukuran}
              </option>
            ))}
          </select>
          {selectedFilters.kategori && (
            <span className="floating-badge bg-[#7b4d2a] text-white border-transparent">
              {selectedFilters.kategori}
            </span>
          )}
        </div>

        {showFilter && (
          <div className="glass-card space-y-4 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e] font-semibold mb-3">
                Pilih kategori
              </p>
              <div className="flex flex-wrap gap-2">
                {["Pakaian Wanita", "Pakaian Pria", "Aksesoris", "Kain Batik"].map((kat) => (
                  <button
                    key={kat}
                    onClick={() => {
                      setSelectedFilters((prev) => ({
                        ...prev,
                        kategori: prev.kategori === kat ? "" : kat,
                      }));
                      // Navigate to filtered category
                      router.push(`/kategori?type=${getCategoryType(kat)}`);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedFilters.kategori === kat
                        ? "bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow"
                        : "border border-[#d1b799] text-[#5c3316] bg-white/80 hover:border-[#c08a3e]"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{kat}</span>
                      <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold">
                        {categoryCounts[kat] || 0} PRODUK
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilter(false)}
                className="luxury-button text-sm flex-1 justify-center"
              >
                Selesai
              </button>
              <button
                onClick={() => {
                  setSelectedFilters({ kategori: "", ukuran: "" });
                  setShowFilter(false);
                }}
                className="luxury-button text-sm flex-1 justify-center"
              >
                Reset filter
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="luxury-skeleton h-64 rounded-3xl" />
            ))}
          </div>
        ) : filterProducts.length === 0 ? (
          <div className="glass-card mx-auto max-w-lg px-8 py-12 text-center">
            <h2 className="text-xl font-semibold text-[#5c3316]">
              Produk tidak ditemukan
            </h2>
            <p className="mt-3 text-sm text-[#5c3316]/70">
              Produk tidak ditemukan
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
            {filterProducts.map((produk) => (
              <CardProduk key={produk.id} produk={produk} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function KategoriPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-transparent pb-24 md:pb-0">
        <Navbar title="Kategori Produk" />
        <div className="luxury-container flex items-center justify-center py-20">
          <div className="luxury-skeleton h-64 w-full max-w-md rounded-3xl" />
        </div>
        <BottomNav />
      </div>
    }>
      <KategoriContent />
    </Suspense>
  );
}
