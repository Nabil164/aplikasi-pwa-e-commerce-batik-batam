"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { resolveImageUrl } from "../lib/image";
import api from "../lib/axios";

export default function CardProduk({ produk }) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
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

  // Cek apakah produk sudah ada di wishlist saat component mount
  useEffect(() => {
    const checkWishlist = async () => {
      if (!produk?.id) return;
      
      const token = localStorage.getItem("token");
      if (!token) {
        setIsFavorite(false);
        return;
      }

      try {
        const response = await api.get("/wishlist");
        if (response.data.status && response.data.data) {
          const exists = response.data.data.some(
            (item) => (item.productId || item.product?.id) === produk.id
          );
          setIsFavorite(exists);
        }
      } catch (error) {
        setIsFavorite(false);
      }
    };

    checkWishlist();

    // Listen untuk perubahan wishlist dari komponen lain
    const handleWishlistUpdate = () => {
      checkWishlist();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [produk?.id]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang");
      router.push("/login");
      return;
    }

    setAddingToCart(true);

    try {
      // Get product details with sizes
      let productData = produk;
      let productSizeId = null;

      // If product has sizes array, use first available size
      if (produk?.sizes && Array.isArray(produk.sizes) && produk.sizes.length > 0) {
        productSizeId = produk.sizes[0].id;
      } else {
        // Fetch product details to get sizes
        try {
          const response = await api.get(`/products/${produk.id}`);
          productData = response.data?.data || response.data || produk;
          
          if (productData?.sizes && Array.isArray(productData.sizes) && productData.sizes.length > 0) {
            productSizeId = productData.sizes[0].id;
          }
        } catch (err) {
          console.error("Error fetching product details:", err);
        }
      }

      if (!productSizeId) {
        // Redirect to product detail page to select size manually
        router.push(`/detail_produk/${produk.id}`);
        return;
      }

      // Add to cart via API
      const response = await api.post("/cart", {
        productId: parseInt(produk.id),
        productSizeId: parseInt(productSizeId),
        quantity: 1,
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
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!produk?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Anda harus login terlebih dahulu untuk menambahkan ke wishlist");
      return;
    }

    try {
      if (isFavorite) {
        // Remove from wishlist
        const response = await api.delete(`/wishlist?productId=${produk.id}`);
        if (response.data.status) {
          setIsFavorite(false);
          window.dispatchEvent(new Event('wishlistUpdated'));
        }
      } else {
        // Add to wishlist
        const response = await api.post("/wishlist", {
          productId: parseInt(produk.id),
        });
        if (response.data.status) {
          setIsFavorite(true);
          window.dispatchEvent(new Event('wishlistUpdated'));
        } else if (response.data.message?.includes("already")) {
          // Already in wishlist, just update state
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      // Don't show alert for "already in wishlist" errors
      if (!error.response?.data?.message?.includes("already")) {
        alert(error.response?.data?.message || "Gagal mengupdate wishlist");
      }
    }
  };

  const productName = produk.name || produk.nama || "Nama Produk";
  const productPrice = Number(produk.price || produk.harga || 0);
  const productImage = resolveImageUrl(
    produk.image_url || 
    produk.image || 
    produk.gambar || 
    produk.images?.[0]?.imageUrl
  );
  const productStock = produk.stock ?? produk.stok;

  return (
    <Link
      href={`/detail_produk/${produk.id}`}
      className="group block h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#e3d6c5]/70 bg-white/80 backdrop-blur-[6px] shadow-[0_22px_55px_-30px_rgba(91,55,23,0.6)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_40px_90px_-45px_rgba(91,55,23,0.65)]">
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#f4e5d3] via-[#fff6eb] to-[#fffdfa]">
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={productImage?.startsWith("http") || productImage?.startsWith("/storage/")}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/logo_batik.jpg";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="floating-badge bg-white/85 border-white/70 text-[#7b4d2a]">
              Koleksi baru
            </span>
            {typeof productStock !== "undefined" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-[#5c3316] shadow-sm border border-white/70">
                Stok {productStock}
              </span>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-md transition ${
              isFavorite ? "text-[#c45e3a]" : "text-[#7b4d2a]"
            }`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e]">
              Batik Signature
            </p>
            <h3 className="text-base font-semibold text-[#5c3316] leading-snug line-clamp-2">
              {productName}
            </h3>
          </div>
          <div className="mt-auto space-y-3">
            <p className="text-lg font-semibold text-[#7b4d2a]">
              Rp {productPrice.toLocaleString("id-ID")}
            </p>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full luxury-button primary-button text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
              {addingToCart ? "Menambahkan..." : "Tambahkan ke keranjang"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

