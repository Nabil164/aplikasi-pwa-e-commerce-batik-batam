"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import BottomNav from "../../../components/BottomNav";
import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import api from "../../../lib/axios";
import { resolveImageUrl } from "../../../lib/image";

export default function DetailProduk() {
  const { id } = useParams();
  const router = useRouter();
  const [produk, setProduk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    getProduct();
    
    const checkWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsFavorite(false);
        return;
      }

      try {
        const response = await api.get("/wishlist");
        if (response.data.status && response.data.data) {
          const exists = response.data.data.some(
            (item) => (item.productId || item.product?.id) === parseInt(id)
          );
          setIsFavorite(exists);
        }
      } catch (error) {
        setIsFavorite(false);
      }
    };
    
    // Check pertama kali
    checkWishlist();
    
    // Listen untuk perubahan wishlist dari komponen lain
    const handleWishlistUpdate = () => {
      checkWishlist();
    };
    
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [id]);

  const getProduct = async () => {
    try {
      const res = await api.get(`/products/${id}`);
      const productData = res.data?.data || res.data || null;
      
      // Ensure image field is set from images array if not present
      if (productData && !productData.image && productData.images?.length > 0) {
        productData.image = productData.images[0]?.imageUrl;
        productData.image_url = productData.images[0]?.imageUrl;
      }
      
      // Ensure size field is set from sizes array if not present
      if (productData && (!productData.size || productData.size.length === 0) && productData.sizes?.length > 0) {
        productData.size = productData.sizes.map(s => s.size);
      }
      
      setProduk(productData);
      
      // Set initial selected size
      const sizes = productData?.size || productData?.sizes?.map(s => s.size) || [];
      if (sizes.length > 0) {
        setSelectedSize(String(sizes[0]));
      }
    } catch (err) {
      console.error("Gagal ambil produk:", err);
      setProduk({
        id,
        name: "Batik Signature Gonggong",
        price: 249000,
        image: "/logo_batik.jpg",
        description:
          "Batik premium motif Gonggong dengan perpaduan warna hangat khas Kepulauan Riau. Menggunakan bahan katun santun dengan sentuhan modern yang nyaman digunakan sepanjang hari.",
        size: ["S", "M", "L", "XL"],
        sizes: [],
        material: "Katun Premium 40s",
        care: "Cuci tangan, jemur di tempat teduh",
      });
    } finally {
      setLoading(false);
    }
  };

  const sizeOptions = useMemo(() => {
    if (!produk) return [];
    
    // Try multiple sources for size data
    // 1. produk.size (convenience field - array of strings)
    if (Array.isArray(produk.size) && produk.size.length > 0) {
      return produk.size;
    }
    
    // 2. produk.sizes (from API - array of objects with .size property)
    if (Array.isArray(produk.sizes) && produk.sizes.length > 0) {
      return produk.sizes.map(s => s.size);
    }
    
    // 3. produk.ukuran (legacy field)
    if (Array.isArray(produk.ukuran) && produk.ukuran.length > 0) {
      return produk.ukuran;
    }
    
    return [];
  }, [produk]);

  useEffect(() => {
    if (sizeOptions.length > 0 && !selectedSize) {
      setSelectedSize(String(sizeOptions[0]));
    }
  }, [sizeOptions, selectedSize]);

  const getCartStorageKey = () => {
    if (typeof window === "undefined") return "cartData";
    const userDataRaw = localStorage.getItem("userData");
    if (userDataRaw) {
      try {
        const userData = JSON.parse(userDataRaw);
        if (userData?.id) {
          return `cartData_${userData.id}`;
        }
      } catch (error) {
        console.warn("Gagal membaca userData:", error);
      }
    }
    return "cartData";
  };

  const handleAddToCart = async () => {
    // Check if sizes are available
    if (sizeOptions.length === 0) {
      alert("Ukuran produk belum tersedia. Silakan hubungi admin.");
      return;
    }

    if (!selectedSize) {
      alert("Pilih ukuran terlebih dahulu");
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang");
      router.push("/login");
      return;
    }

    // Validasi: Produk harus ada
    if (!produk) {
      alert("Produk tidak tersedia");
      return;
    }

    try {
      // Find ProductSize ID from selected size string
      let productSizeId = null;
      let selectedSizeObj = null;
      if (produk?.sizes && Array.isArray(produk.sizes)) {
        selectedSizeObj = produk.sizes.find(
          (size) => size.size === selectedSize || String(size.size) === String(selectedSize)
        );
        if (selectedSizeObj) {
          productSizeId = selectedSizeObj.id;
        }
      }

      // If no ProductSize found, try to get first available size
      if (!productSizeId && produk?.sizes && produk.sizes.length > 0) {
        selectedSizeObj = produk.sizes[0];
        productSizeId = selectedSizeObj.id;
      }

      if (!productSizeId) {
        alert("Ukuran produk tidak tersedia. Silakan pilih ukuran lain.");
        return;
      }

      // Validasi stok: qty ≤ stok
      const availableStock = selectedSizeObj?.stock || 0;
      if (quantity > availableStock) {
        alert(`Stok tidak mencukupi. Stok tersedia: ${availableStock}`);
        return;
      }

      if (availableStock === 0) {
        alert("Produk ini sedang habis stok");
        return;
      }

      // Add to cart via API
      const response = await api.post("/cart", {
        productId: parseInt(produk.id),
        productSizeId: parseInt(productSizeId),
        quantity: quantity,
      });

      if (response.data.status) {
        alert("Produk berhasil ditambahkan ke keranjang!");
        // Trigger cart update event
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("storage"));
      } else {
        throw new Error(response.data.message || "Gagal menambahkan produk ke keranjang");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      const errorMessage = error.response?.data?.message || error.message || "Gagal menambahkan produk ke keranjang";
      alert(errorMessage);
    }
  };

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu untuk menambahkan ke wishlist");
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        // Remove from wishlist
        const response = await api.delete(`/wishlist?productId=${produk.id}`);
        if (response.data.status) {
          setIsFavorite(false);
          window.dispatchEvent(new Event("wishlistUpdated"));
        }
      } else {
        // Add to wishlist
        const response = await api.post("/wishlist", {
          productId: parseInt(produk.id),
        });
        if (response.data.status) {
          setIsFavorite(true);
          window.dispatchEvent(new Event("wishlistUpdated"));
        } else if (response.data.message?.includes("already")) {
          // Already in wishlist, just update state
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      if (!error.response?.data?.message?.includes("already")) {
        alert(error.response?.data?.message || "Gagal mengupdate wishlist");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(192,138,62,0.12),rgba(254,250,246,0.96))]">
        <div className="glass-card px-10 py-8 text-center text-[#5c3316]">
          <div className="luxury-skeleton mx-auto mb-4 h-12 w-12 rounded-full" />
          <p className="text-sm uppercase tracking-[0.35em] text-[#c08a3e]">
            Batik Cindur Batam
          </p>
          <p className="mt-2 text-lg font-semibold">Memuat detail koleksi...</p>
          <p className="mt-2 text-sm text-[#5c3316]/70">
            Mohon tunggu sejenak, kami sedang menyiapkan detail produk spesial untukmu.
          </p>
        </div>
      </div>
    );
  }

  if (!produk) {
    return (
      <div className="min-h-screen bg-[#fefaf6] flex items-center justify-center">
        <p className="text-[#5a3921]">Produk tidak ditemukan</p>
      </div>
    );
  }

  const description =
    produk.description ||
    produk.deskripsi ||
    "Produk batik berkualitas tinggi dengan motif tradisional yang elegan dan nyaman digunakan.";

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack={true} />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="luxury-section md:flex md:items-start md:gap-10">
          <div className="relative w-full md:w-1/2 overflow-hidden rounded-[32px] border border-[#e3d6c5] bg-white/60 shadow-[0_30px_80px_-40px_rgba(91,55,23,0.6)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(192,138,62,0.08),rgba(255,255,255,0.05))]" />
            <div className="relative aspect-[3/4]">
              <img
                src={resolveImageUrl(
                  produk.image_url || 
                  produk.image || 
                  produk.gambar || 
                  produk.images?.[0]?.imageUrl
                )}
                alt={produk.name || produk.nama || "Produk"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/logo_batik.jpg";
                }}
              />
            </div>
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "Hapus dari wishlist" : "Tambahkan ke wishlist"}
              className="absolute top-5 right-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/85 text-[#7b4d2a] shadow-lg backdrop-blur-md transition hover:scale-105"
            >
              <Heart
                size={22}
                className={isFavorite ? "text-[#c45e3a] fill-[#c45e3a]" : "text-[#7b4d2a]"}
              />
            </button>
            <div className="absolute left-6 top-6">
              <span className="floating-badge bg-white/80 border-white/65 text-[#7b4d2a]">
                Koleksi unggulan
              </span>
            </div>
          </div>

          <div className="mt-6 md:mt-0 md:w-1/2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#c08a3e]">
                <Sparkles size={18} />
                <span className="text-xs uppercase tracking-[0.45em] font-semibold">
                  Batik Cindur Signature
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#5c3316] leading-tight">
                {produk.name || produk.nama || "Nama Produk"}
              </h1>
              <p className="text-2xl md:text-3xl font-semibold text-[#7b4d2a]">
                Rp {Number(produk.price || produk.harga || 0).toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-[#5c3316]/70 leading-relaxed">
                {description}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[#5c3316] mb-3 uppercase tracking-[0.35em]">
                  Pilih ukuran
                </p>
                {sizeOptions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(String(size))}
                        className={`min-w-[58px] rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          selectedSize === size
                            ? "bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow-lg"
                            : "border border-[#d1b799] text-[#5c3316] bg-white/80 hover:border-[#c08a3e]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-700">
                      Ukuran produk belum tersedia. Silakan hubungi admin atau tunggu update stok.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#5c3316] mb-3 uppercase tracking-[0.35em]">
                  Jumlah
                </p>
                <div className="inline-flex items-center rounded-2xl border border-[#d1b799] bg-white/80 shadow-inner">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-11 w-11 text-[#7b4d2a] transition hover:bg-[#fdf3ec]"
                    aria-label="Kurangi jumlah"
                  >
                    −
                  </button>
                  <span className="w-14 text-center text-lg font-semibold text-[#5c3316]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-11 w-11 text-[#7b4d2a] transition hover:bg-[#fdf3ec]"
                    aria-label="Tambah jumlah"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={handleAddToCart}
                className="luxury-button primary-button text-base w-full"
              >
                <ShoppingCart size={18} />
                Masukkan keranjang
              </button>
              <button
                onClick={() => {
                  handleAddToCart();
                  router.push("/checkout");
                }}
                className="luxury-button text-base w-full justify-center"
              >
                Lihat detail pembayaran
              </button>
            </div>
          </div>
        </section>

        <section className="luxury-section space-y-6">
          <div className="section-heading">
            <h3>Detail Produk</h3>
            <span>Ketahui bahan, perawatan, dan kisah di balik motifnya</span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="glass-card px-5 py-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e] font-semibold">
                Deskripsi
              </p>
              <p className="mt-3 text-sm text-[#5c3316]/80 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
            <div className="glass-card px-5 py-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e] font-semibold">
                Material
              </p>
              <p className="mt-3 text-sm text-[#5c3316]/80">
                {produk.material || "Katun premium 40s dengan teknik pewarnaan khas pesisir"}
              </p>
            </div>
            <div className="glass-card px-5 py-6">
              <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e] font-semibold">
                Cara Perawatan
              </p>
              <p className="mt-3 text-sm text-[#5c3316]/80">
                {produk.care || "Cuci dengan tangan, gunakan deterjen khusus, hindari sinar matahari langsung."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
