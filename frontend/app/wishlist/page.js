"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Trash2, Sparkles, ShoppingBag, ShoppingCart, Loader2 } from "lucide-react";
import { resolveImageUrl } from "../../lib/image";
import api from "../../lib/axios";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/wishlist");
        if (response.data.status && response.data.data) {
          setWishlist(response.data.data);
        } else {
          setWishlist([]);
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();

    const handleWishlistUpdate = () => {
      loadWishlist();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);

    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, []);

  const totalSelected = useMemo(() => selectedItems.length, [selectedItems]);

  const handleRemove = async (productId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await api.delete(`/wishlist?productId=${productId}`);
      if (response.data.status) {
        // Remove from local state
        setWishlist((prev) => prev.filter((item) => item.productId !== productId && item.product?.id !== productId));
        // Trigger update event
        window.dispatchEvent(new Event("wishlistUpdated"));
      } else {
        throw new Error(response.data.message || "Gagal menghapus dari wishlist");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      alert(error.response?.data?.message || error.message || "Gagal menghapus dari wishlist");
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = async () => {
    if (selectedItems.length === 0) {
      alert("Pilih produk terlebih dahulu untuk ditambahkan ke keranjang.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu");
      router.push("/login");
      return;
    }

    try {
      // Get selected products
      const selectedProducts = wishlist.filter((item) => 
        selectedItems.includes(item.productId || item.product?.id || item.id)
      );

      // Add each product to cart
      for (const item of selectedProducts) {
        const productId = item.productId || item.product?.id || item.id;
        const product = item.product || item;
        
        // Get first available size
        let productSizeId = null;
        if (product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
          productSizeId = product.sizes[0].id;
        } else {
          // Try to fetch product details
          try {
            const productResponse = await api.get(`/products/${productId}`);
            const productData = productResponse.data?.data || productResponse.data;
            if (productData?.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
              productSizeId = productData.sizes[0].id;
            }
          } catch (err) {
            console.error("Error fetching product:", err);
          }
        }

        if (productSizeId) {
          await api.post("/cart", {
            productId: parseInt(productId),
            productSizeId: parseInt(productSizeId),
            quantity: 1,
          });
        }
      }

      alert("Produk pilihan berhasil ditambahkan ke keranjang!");
      window.dispatchEvent(new Event("cartUpdated"));
      router.push("/keranjang");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(error.response?.data?.message || error.message || "Gagal menambahkan ke keranjang");
    }
  };

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      alert("Pilih produk terlebih dahulu untuk checkout.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu");
      router.push("/login");
      return;
    }

    try {
      // First add to cart, then redirect to checkout
      await handleAddToCart();
      // After adding to cart, redirect will happen in handleAddToCart
      // But we want to go to checkout, so let's modify the flow
      router.push("/keranjang");
    } catch (error) {
      console.error("Error in checkout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-28 md:pb-0">
      <Navbar title="Wishlist" showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="luxury-section space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-[#c08a3e]">
              <Sparkles size={18} />
              <p className="text-xs uppercase tracking-[0.4em] font-semibold">
                Koleksi favoritmu
              </p>
            </div>
            {wishlist.length > 0 && (
              <span className="text-sm text-[#5c3316]/70">
                {totalSelected > 0
                  ? `${totalSelected} produk dipilih`
                  : "Pilih produk yang ingin kamu proses"}
              </span>
            )}
          </div>

          {wishlist.length === 0 ? (
            <div className="glass-card mx-auto max-w-lg px-8 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fdf3ec] text-[#c08a3e]">
                <ShoppingBag size={28} />
              </div>
              <h2 className="mt-6 text-xl font-semibold text-[#5c3316]">
                Wishlist kamu masih kosong
              </h2>
              <p className="mt-3 text-sm text-[#5c3316]/70 leading-relaxed">
                Jelajahi koleksi batik eksklusif kami dan simpan produk favoritmu di sini agar
                mudah ditemukan nanti.
              </p>
              <button
                onClick={() => router.push("/Beranda")}
                className="mt-6 luxury-button primary-button text-sm px-6"
              >
                Jelajahi katalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => {
                const product = item.product || item;
                const productId = item.productId || product?.id || item.id;
                const productName = product?.name || item.name || "Product";
                const productImage = product?.images?.[0]?.imageUrl || product?.images?.[0]?.image_url || product?.image || item.image || "/logo_batik.jpg";
                const productPrice = parseFloat(product?.price || item.price || item.harga || 0);
                const productCategory = product?.category || item.category || "Batik Premium";
                
                return (
                  <div
                    key={item.id || productId}
                    className="glass-card flex flex-col gap-4 rounded-[26px] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6"
                  >
                    <div className="flex items-start gap-4 md:items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(productId)}
                        onChange={() => toggleSelect(productId)}
                        className="mt-2 h-5 w-5 rounded border-[#d1b799] text-[#7b4d2a] focus:ring-[#c08a3e] md:mt-0"
                      />
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[#eadfd0] bg-white/70 shadow-inner">
                        <img
                          src={resolveImageUrl(productImage)}
                          alt={productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/logo_batik.jpg";
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[#c08a3e] font-semibold">
                          {productCategory}
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-[#5c3316]">
                          {productName}
                        </h3>
                        <p className="mt-1 text-xs text-[#5c3316]/60">
                          {product?.sizes && product.sizes.length > 0 
                            ? `Ukuran: ${product.sizes.map(s => s.size).join(", ")}`
                            : "Ukuran: Tersedia"
                          } • Stok: {product?.stock || "Tersedia"}
                        </p>
                        <p className="mt-3 text-lg font-semibold text-[#7b4d2a]">
                          Rp {productPrice.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(productId)}
                      className="self-end rounded-full border border-transparent p-3 text-[#c45e3a] transition hover:border-[#f3c7b8] hover:bg-[#fff0eb]"
                      aria-label="Hapus dari wishlist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {wishlist.length > 0 && (
          <div className="sticky bottom-24 z-30 mx-auto w-full md:static md:bottom-auto">
            <div className="glass-card flex flex-col gap-3 rounded-[26px] border border-[#e3d6c5] bg-white/85 px-5 py-4 backdrop-blur-md md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#5c3316]">
                  {totalSelected > 0
                    ? `${totalSelected} produk siap diproses`
                    : "Pilih produk untuk melanjutkan"}
                </p>
                <p className="text-xs text-[#5c3316]/60">
                  Kamu bisa menambahkan ke keranjang atau checkout langsung.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button onClick={handleAddToCart} className="luxury-button primary-button text-sm">
                  <ShoppingCart size={16} />
                  Tambah ke keranjang
                </button>
                <button onClick={handleCheckout} className="luxury-button text-sm">
                  Lanjutkan checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

