"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Trash2, Edit2, ShoppingCart, X, MapPin, Sparkles, AlertTriangle, ChevronDown, Ruler } from "lucide-react";
import api from "../../lib/axios";
import { resolveImageUrl } from "../../lib/image";

export default function KeranjangPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState(null);
  const [cartWarnings, setCartWarnings] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
  });
  const [cartStorageKey, setCartStorageKey] = useState("cartData");
  const [loadingCart, setLoadingCart] = useState(true);
  const [productSizes, setProductSizes] = useState({}); // Store available sizes for each product
  const [showSizeSelector, setShowSizeSelector] = useState({}); // Track which item's size selector is open

  const normalizeSize = (size) => String(size || "").trim().toUpperCase();
  const DEFAULT_SIZES = ["S", "M", "L", "XL"];
  const buildItemKey = (item) => {
    const sizeValue =
      item.ukuran ||
      (typeof item.size === "string" ? item.size : item.size?.size) ||
      "";
    return `${item.id}||${normalizeSize(sizeValue)}`;
  };

  const parseSizes = (sizes) => {
    let result = sizes;

    if (typeof result === "string") {
      const trimmed = result.trim();

      // Try JSON first
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          result = parsed;
        } else {
          result = [trimmed];
        }
      } catch {
        // Split by comma, slash, or whitespace
        if (/[,/ ]/.test(trimmed)) {
          result = trimmed
            .split(/[,/ ]+/)
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (trimmed.length > 1 && !trimmed.includes(" ")) {
          // e.g. "SMLXL" => ["S", "M", "L", "XL"]
          result = trimmed.match(/[A-Z]+/g) || [trimmed];
        } else {
          result = [trimmed];
        }
      }
    }

    if (!Array.isArray(result) || result.length === 0) {
      result = DEFAULT_SIZES;
    }

    const normalized = result.map((s) => normalizeSize(s)).filter(Boolean);
    return normalized.length > 0 ? normalized : DEFAULT_SIZES;
  };

  useEffect(() => {
    const loadCart = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingCart(false);
        router.push("/login");
        return;
      }

      try {
        const cartResponse = await api.get("/cart");
        const cartItems = cartResponse.data?.data?.items || [];

        const transformed = cartItems.map((item) => {
          const sizeValue =
            item.size?.size ||
            (typeof item.size === "string" ? item.size : item.ukuran) ||
            "";
          return {
            ...item,
            name: item.product?.name || item.productName || item.name,
            category: item.product?.category || item.category,
            image:
              item.product?.images?.[0]?.imageUrl ||
              item.product?.images?.[0]?.image_url ||
              item.image,
            harga: item.price,
            price: item.price,
            jumlah: item.quantity || item.jumlah || 1,
            ukuran: sizeValue,
            size: sizeValue,
            stock: item.size?.stock ?? item.stock,
            size_stocks: item.product?.sizeStocks || item.product?.size_stocks || {}, // Use sizeStocks from API
          };
        });

        // simpan untuk selector
        const sizesMap = {};
        transformed.forEach((item) => {
          const productId = String(item.id || item.productId || item.product?.id || "");
          if (productId) {
            const sizes =
              item.product?.sizes?.map((s) => s.size) ||
              parseSizes(item.product?.size || item.product?.ukuran || DEFAULT_SIZES);
            sizesMap[productId] = sizes;
          }
        });
        setProductSizes(sizesMap);

        setCart(transformed);
        setSelectedItems(
          transformed.filter((i) => !i.unavailable).map((i) => buildItemKey(i))
        );
      } catch (error) {
        console.error("Gagal memuat keranjang dari API:", error);
        setCart([]);
        setSelectedItems([]);
      }

      // alamat
      try {
        const savedAddress = localStorage.getItem("defaultAddress");
        if (savedAddress) {
          setShippingAddress(JSON.parse(savedAddress));
        }
      } catch (error) {
        console.error("Tidak dapat memuat defaultAddress:", error);
      }

      setLoadingCart(false);
    };

    loadCart();
  }, [router]);

  useEffect(() => {
    const handleAddressUpdate = () => {
      const savedAddress = localStorage.getItem("defaultAddress");
      if (savedAddress) {
        try {
          setShippingAddress(JSON.parse(savedAddress));
        } catch (error) {
          console.error("Tidak dapat memuat defaultAddress:", error);
        }
      } else {
        setShippingAddress(null);
      }
    };

    window.addEventListener("storage", handleAddressUpdate);
    window.addEventListener("defaultAddressUpdated", handleAddressUpdate);

    return () => {
      window.removeEventListener("storage", handleAddressUpdate);
      window.removeEventListener("defaultAddressUpdated", handleAddressUpdate);
    };
  }, []);

  // Close size selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (Object.keys(showSizeSelector).length > 0) {
        const isClickInside = event.target.closest('.size-selector-container');
        if (!isClickInside) {
          setShowSizeSelector({});
        }
      }
    };

    if (Object.keys(showSizeSelector).length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSizeSelector]);

  const syncCartWithProducts = async (initialCart) => {
    setLoadingCart(true);
    try {
      if (!initialCart || initialCart.length === 0) {
        setCart([]);
        setSelectedItems([]);
        setCartWarnings([]);
        return;
      }

      const res = await api.get("/products");
      const products = res.data.data || res.data || [];
      const productMap = new Map(products.map((product) => [String(product.id), product]));

      // Store product sizes for size selector
      const sizesMap = {};
      products.forEach((product) => {
        const normalizedSizes = parseSizes(product.size || product.ukuran || DEFAULT_SIZES);
        sizesMap[String(product.id)] = normalizedSizes;
      });
      setProductSizes(sizesMap);

      const warnings = [];
      const normalizedCart = initialCart.reduce((acc, item) => {
        const product = productMap.get(String(item.id));
        if (!product) {
          warnings.push({
            type: "unavailable",
            message: `${item.name || "Produk"} tidak lagi tersedia dan dihapus dari keranjang.`,
          });
          return acc;
        }

        // Ambil stok total & stok per size (jika ada)
        // Parse size_stocks jika berupa string JSON
        let productSizeStocks = product.sizeStocks || product.size_stocks || {};
        if (typeof productSizeStocks === 'string') {
          try {
            productSizeStocks = JSON.parse(productSizeStocks);
          } catch {
            productSizeStocks = {};
          }
        }
        const stock = Number(product.stock ?? 0);
        const price = Number(product.price ?? product.harga ?? 0);
        let quantity = Number(item.jumlah || 1);
        let unavailable = false;

        if (stock === 0) {
          unavailable = true;
          warnings.push({
            type: "stock",
            message: `${product.name} sedang kehabisan stok.`,
          });
        }

        if (quantity > stock && stock > 0) {
          warnings.push({
            type: "stock",
            message: `Jumlah ${product.name} disesuaikan ke ${stock} karena stok terbatas.`,
          });
          quantity = stock;
        }

        if (price !== item.harga && item.harga !== undefined) {
          warnings.push({
            type: "price",
            message: `Harga ${product.name} diperbarui menjadi Rp ${price.toLocaleString("id-ID")}.`,
          });
        }

        // Normalize size - ensure it's a single valid size
        let normalizedSize = normalizeSize(item.ukuran || item.size || "");
        const availableSizes = sizesMap[String(product.id)] || DEFAULT_SIZES;
        
        // If size is invalid or contains multiple sizes (like "SMLXL"), use first available
        if (
          !normalizedSize ||
          normalizedSize.length > 4 ||
          !availableSizes.includes(normalizedSize)
        ) {
          // Try to extract valid size from string like "SMLXL"
          if (normalizedSize && normalizedSize.length > 1) {
            const extractedSize = availableSizes.find((s) =>
              normalizedSize.includes(String(s))
            );
            normalizedSize = extractedSize || availableSizes[0] || "L";
          } else {
            normalizedSize = availableSizes[0] || "L";
          }
        }

        // Stok per ukuran: jika ada size_stocks, gunakan; fallback ke stok total
        // Cek dengan berbagai format key (uppercase, lowercase, original)
        const sizeStock = Number(
          productSizeStocks?.[normalizedSize] ??
          productSizeStocks?.[normalizedSize.toLowerCase()] ??
          productSizeStocks?.[normalizedSize.charAt(0) + normalizedSize.slice(1).toLowerCase()] ??
          stock
        );

        acc.push({
          ...item,
          name: product.name,
          category: product.category,
          image: product.image,
          harga: price,
          price,
          stock: sizeStock,
          size_stocks: productSizeStocks, // Simpan size_stocks untuk update stok saat ganti size
          jumlah: quantity,
          ukuran: normalizedSize,
          size: normalizedSize,
          unavailable,
        });
        return acc;
      }, []);

      setCart(normalizedCart);
      setSelectedItems(
        normalizedCart
          .filter((item) => !item.unavailable)
          .map((item) => buildItemKey(item))
      );
      setCartWarnings(warnings);
      if (cartStorageKey) {
        localStorage.setItem(cartStorageKey, JSON.stringify(normalizedCart));
      }
    } catch (error) {
      console.error("Gagal sinkronisasi keranjang:", error);
    } finally {
      setLoadingCart(false);
    }
  };

  // Update localStorage when cart changes
  useEffect(() => {
    if (!cartStorageKey) return;
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
  }, [cart, cartStorageKey]);

  useEffect(() => {
    const selected = cart.filter((item) => selectedItems.includes(buildItemKey(item)));
    const subtotal = selected.reduce(
      (acc, item) => acc + Number(item.harga || item.price || 0) * (item.jumlah || 1),
      0
    );
    const discount = 0;
    const tax = 0;
    const shipping = 0;
    const total = subtotal - discount + tax + shipping;

    setCartSummary({
      subtotal,
      discount,
      tax,
      shipping,
      total,
    });
  }, [cart, selectedItems]);

  const addWarning = (message) => {
    setCartWarnings((prev) => {
      if (prev.some((warn) => warn.message === message)) return prev;
      return [...prev, { message }];
    });
  };

  const updateJumlah = (key, type) => {
    const [itemId, itemSize] = String(key).split("||");
    setCart((prev) =>
      prev.map((item) => {
        if (
          String(item.id) === itemId &&
          normalizeSize(item.ukuran || item.size || "") === normalizeSize(itemSize)
        ) {
          const stok = Number(item.stock ?? 99);
          let jumlahBaru =
            type === "tambah"
              ? (item.jumlah || 1) + 1
              : item.jumlah > 1
              ? item.jumlah - 1
              : 1;
          if (jumlahBaru > stok) {
            jumlahBaru = stok;
            addWarning(`Jumlah ${item.name} tidak bisa melebihi stok (${stok}).`);
          }
          return { ...item, jumlah: jumlahBaru };
        }
        return item;
      })
    );
  };

  const toggleSelect = (key, unavailable) => {
    if (unavailable) return;
    setSelectedItems((prev) =>
      prev.includes(key) ? prev.filter((itemId) => itemId !== key) : [...prev, key]
    );
  };

  const handleHapus = (key) => {
    const [deleteId, deleteSize] = String(key).split("||");
    const updatedCart = cart.filter(
      (item) =>
        !(
          String(item.id) === deleteId &&
          normalizeSize(item.ukuran || item.size || "") === deleteSize
        )
    );
    setCart(updatedCart);
    setSelectedItems((prev) => prev.filter((itemId) => itemId !== key));
    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(updatedCart));
    }
    window.dispatchEvent(new Event("storage"));
  };

  const handleChangeSize = (itemId, oldSize, newSize) => {
    const normalizedOld = normalizeSize(oldSize);
    const normalizedNew = normalizeSize(newSize);

    if (normalizedOld === normalizedNew) {
      setShowSizeSelector({});
      return;
    }

    const item = cart.find(
      (i) =>
        String(i.id) === String(itemId) &&
        normalizeSize(i.ukuran || i.size || "") === normalizedOld
    );

    if (!item) return;

    // Check if item with same id and new size already exists
    const existingItem = cart.find(
      (i) =>
        String(i.id) === String(itemId) &&
        normalizeSize(i.ukuran || i.size || "") === normalizedNew
    );

    let updatedCart;
    if (existingItem) {
      // Merge quantities and ensure stock is correct for the merged item
      updatedCart = cart.map((i) => {
        if (
          String(i.id) === String(itemId) &&
          normalizeSize(i.ukuran || i.size || "") === normalizedNew
        ) {
          // Get stock for the new size from size_stocks
          let sizeStocks = i.size_stocks || item.size_stocks || {};
          if (typeof sizeStocks === 'string') {
            try { sizeStocks = JSON.parse(sizeStocks); } catch { sizeStocks = {}; }
          }
          const newSizeStock = Number(
            sizeStocks[normalizedNew] ??
            sizeStocks[normalizedNew.toLowerCase()] ??
            i.stock ??
            0
          );
          
          return { 
            ...i, 
            jumlah: (i.jumlah || 1) + (item.jumlah || 1),
            stock: newSizeStock, // Ensure stock is correct for the size
          };
        }
        return i;
      }).filter(
        (i) =>
          !(
            String(i.id) === String(itemId) &&
            normalizeSize(i.ukuran || i.size || "") === normalizedOld
          )
      );
    } else {
      // Just update the size and stock for the new size
      updatedCart = cart.map((i) => {
        if (
          String(i.id) === String(itemId) &&
          normalizeSize(i.ukuran || i.size || "") === normalizedOld
        ) {
          // Get stock for the new size from size_stocks
          let sizeStocks = i.size_stocks || {};
          if (typeof sizeStocks === 'string') {
            try { sizeStocks = JSON.parse(sizeStocks); } catch { sizeStocks = {}; }
          }
          const newSizeStock = Number(
            sizeStocks[normalizedNew] ??
            sizeStocks[normalizedNew.toLowerCase()] ??
            i.stock ??
            0
          );
          
          return { 
            ...i, 
            ukuran: normalizedNew, 
            size: normalizedNew,
            stock: newSizeStock, // Update stock based on new size
          };
        }
        return i;
      });
    }

    setCart(updatedCart);
    setSelectedItems((prev) => {
      const newSelected = prev.filter((id) => id !== `${itemId}||${normalizedOld}`);
      if (!newSelected.includes(`${itemId}||${normalizedNew}`)) {
        newSelected.push(`${itemId}||${normalizedNew}`);
      }
      return newSelected;
    });

    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(updatedCart));
    }
    setShowSizeSelector({});
    window.dispatchEvent(new Event("storage"));
  };

  const handleCheckout = () => {
    const selectedProducts = cart.filter((item) =>
      selectedItems.includes(buildItemKey(item))
    );
    if (selectedProducts.length === 0) {
      alert("Pilih produk dulu untuk checkout");
      return;
    }
    if (!shippingAddress) {
      alert("Lengkapi alamat pengiriman terlebih dahulu.");
      return;
    }
    const hasUnavailable = selectedProducts.some((item) => item.unavailable);
    if (hasUnavailable) {
      alert("Hapus produk yang stoknya habis sebelum melanjutkan checkout.");
      return;
    }
    const overStock = selectedProducts.some(
      (item) => item.stock !== undefined && item.jumlah > item.stock
    );
    if (overStock) {
      alert("Periksa kembali jumlah produk, ada yang melebihi stok.");
      return;
    }
    localStorage.setItem("checkoutData", JSON.stringify(selectedProducts));
    router.push("/checkout");
  };

  const renderEmptyState = () => (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar title="Keranjang Belanja" showBack />
      <div className="luxury-container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="glass-card flex h-44 w-44 items-center justify-center rounded-[36px] bg-white/85 shadow-[0_30px_70px_-40px_rgba(91,55,23,0.55)]">
          <div className="relative">
            <ShoppingCart size={96} className="text-[#e3d6c5]" />
            <X
              size={56}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#c45e3a]"
            />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-semibold text-[#5c3316]">Keranjangmu masih kosong</h2>
        <p className="mt-3 max-w-md text-sm text-[#5c3316]/70">
          Simpan koleksi favoritmu ke keranjang untuk dilanjutkan ke checkout. Jelajahi motif
          eksklusif kami dan pilih batik yang kamu suka.
        </p>
        <Link href="/Beranda" className="mt-6 luxury-button primary-button text-sm px-8">
          Mulai belanja
        </Link>
      </div>
      <BottomNav />
    </div>
  );

  if (loadingCart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="luxury-skeleton h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (cart.length === 0) {
    return renderEmptyState();
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 md:pb-10">
      <Navbar title="Keranjang Belanja" showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        {cartWarnings.length > 0 && (
          <section className="glass-card rounded-[28px] border border-[#f6d9b5] bg-[#fff7ee] px-5 py-4">
            <div className="flex items-center gap-2 text-[#a5632b] mb-2">
              <AlertTriangle size={18} />
              <p className="font-semibold text-sm uppercase tracking-[0.25em]">
                Perlu perhatian
              </p>
            </div>
            <ul className="space-y-1 text-sm text-[#5c3316]">
              {cartWarnings.map((warning, idx) => (
                <li key={`${warning.message}-${idx}`} className="flex items-start gap-2">
                  <span className="mt-1 text-[#c08a3e]">•</span>
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="luxury-section space-y-6" style={{ overflow: 'visible' }}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-[#c08a3e]">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-[0.4em] font-semibold">
                Koleksi siap checkout
              </span>
            </div>
            <p className="text-sm text-[#5c3316]/70">
              {selectedItems.length === cart.length
                ? "Semua produk dipilih"
                : `${selectedItems.length} dari ${cart.length} produk dipilih`}
            </p>
          </div>

          <div className="space-y-4">
            {cart.map((item, index) => {
              const itemKey = buildItemKey(item);
              // Add index to key to ensure uniqueness even if there are duplicate items
              const uniqueKey = `${itemKey}-${index}`;
              const availableSizes = productSizes[String(item.id)] || DEFAULT_SIZES;
              const currentSize = normalizeSize(
                item.ukuran || item.size || availableSizes[0] || "L"
              );
              const isSizeOpen = !!showSizeSelector[itemKey];

              return (
                <div
                  key={uniqueKey}
                  className="glass-card rounded-[26px] border border-[#e3d6c5]/80 bg-white/80 px-4 py-4 shadow-[0_20px_60px_-40px_rgba(91,55,23,0.65)] transition hover:-translate-y-[2px] md:px-6 md:py-5 relative"
                  style={{ overflow: "visible", zIndex: isSizeOpen ? 50 : 0, position: "relative" }}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemKey)}
                        onChange={() => toggleSelect(itemKey, item.unavailable)}
                        disabled={item.unavailable}
                        className="h-5 w-5 accent-[#7b4d2a]"
                      />
                      {item.unavailable && (
                        <span className="rounded-full bg-[#ffe5e5] px-3 py-1 text-xs font-semibold text-[#c04545]">
                          Stok habis
                        </span>
                      )}
                    </div>

                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-3xl border border-[#eadfd0] bg-white/70 shadow-inner md:h-32 md:w-32">
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/logo_batik.jpg";
                        }}
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.3em] text-[#c08a3e] font-semibold">
                            {item.category || "Batik Premium"}
                          </p>
                          <h3 className="text-lg font-semibold text-[#5c3316] leading-tight">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-[#5c3316]/60">Qty: {item.jumlah || 1}</p>
                            <span className="text-xs text-[#5c3316]/60">•</span>
                            <div
                              className={`relative size-selector-container ${
                                showSizeSelector[itemKey] ? "z-50" : "z-auto"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSizeSelector((prev) => {
                                    const next = {};
                                    next[itemKey] = !prev[itemKey];
                                    return next;
                                  });
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-[#d1b799] bg-white px-3 py-1.5 text-xs font-semibold text-[#5c3316] transition-all hover:bg-[#fdf3ec] hover:border-[#7b4d2a] hover:shadow-sm active:scale-95"
                                title="Klik untuk mengubah ukuran"
                              >
                                <Ruler size={12} className="text-[#7b4d2a]" />
                                <span>
                                  Ukuran: <span className="font-bold text-[#7b4d2a]">{currentSize || "L"}</span>
                                </span>
                                <ChevronDown
                                  size={14}
                                  className={`transition-transform duration-200 text-[#7b4d2a] ${
                                    showSizeSelector[itemKey] ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              {showSizeSelector[itemKey] && (
                                <div
                                  className="absolute top-full left-0 mt-2 rounded-xl border border-[#e3d6c5] bg-white shadow-lg min-w-[160px] max-h-[200px] flex flex-col overflow-hidden z-[1000]"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  style={{ animation: "fadeIn 0.2s ease-in-out" }}
                                >
                                  <div className="px-3 py-2 bg-[#f8f4f0] border-b border-[#e3d6c5] flex-shrink-0">
                                    <p className="text-xs font-semibold text-[#7b4d2a] uppercase tracking-wide">
                                      Pilih Ukuran
                                    </p>
                                  </div>
                                  <div className="overflow-y-auto overscroll-contain flex-1 max-h-[240px]">
                                    {availableSizes.map((size) => {
                                      const normalizedOption = normalizeSize(size);
                                      const isSelected = currentSize === normalizedOption;
                                      // Get stock for this size option
                                      let sizeStocks = item.product?.sizeStocks || item.size_stocks || {};
                                      if (typeof sizeStocks === 'string') {
                                        try { sizeStocks = JSON.parse(sizeStocks); } catch { sizeStocks = {}; }
                                      }
                                      const optionStock = Number(
                                        sizeStocks[normalizedOption] ??
                                        sizeStocks[normalizedOption.toLowerCase()] ??
                                        sizeStocks[normalizedOption.charAt(0) + normalizedOption.slice(1).toLowerCase()] ??
                                        item.stock ??
                                        0
                                      );
                                      const isOutOfStock = optionStock === 0;
                                      return (
                                        <button
                                          key={normalizedOption}
                                          type="button"
                                          disabled={isOutOfStock}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!isOutOfStock) {
                                              handleChangeSize(item.id, currentSize, normalizedOption);
                                            }
                                          }}
                                        onMouseDown={(e) => {
                                          // allow native scrolling while keeping dropdown open
                                          e.stopPropagation();
                                        }}
                                        onTouchStart={(e) => {
                                          e.stopPropagation();
                                        }}
                                          className={`w-full px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer flex-shrink-0 ${
                                            isOutOfStock
                                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                              : isSelected
                                              ? "bg-[#fdf3ec] text-[#7b4d2a]"
                                              : "text-[#5c3316] hover:bg-[#fefaf6] hover:text-[#7b4d2a] active:bg-[#fefaf6]"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between pointer-events-none">
                                            <div className="flex items-center gap-2">
                                              <Ruler
                                                size={14}
                                                className={
                                                  isOutOfStock ? "text-gray-300" : isSelected ? "text-[#7b4d2a]" : "text-[#c08a3e] opacity-50"
                                                }
                                              />
                                              <span className={isSelected ? "font-bold" : ""}>{normalizedOption}</span>
                                              <span className={`text-xs ${isOutOfStock ? "text-gray-400" : "text-[#b08968]"}`}>
                                                ({isOutOfStock ? "Habis" : `Stok: ${optionStock}`})
                                              </span>
                                            </div>
                                            {isSelected && !isOutOfStock && (
                                              <span className="text-[#7b4d2a] font-bold text-base">✓</span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-[#5c3316]/60">
                              Stok tersisa: <span className="font-semibold text-[#7b4d2a]">{item.stock ?? 0}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="text-xl font-semibold text-[#7b4d2a]">
                            Rp {(item.harga || item.price || 0).toLocaleString("id-ID")}
                          </p>
                          <button
                            onClick={() => handleHapus(itemKey)}
                            className="rounded-full border border-transparent p-2 text-[#c45e3a] transition hover:border-[#f3c7b8] hover:bg-[#fff0eb]"
                            aria-label="Hapus produk"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center rounded-2xl border border-[#d1b799] bg-white/75 shadow-inner">
                          <button
                            onClick={() => updateJumlah(itemKey, "kurang")}
                            className="h-10 w-10 text-[#7b4d2a] transition hover:bg-[#fdf3ec]"
                            aria-label="Kurangi jumlah"
                          >
                            −
                          </button>
                          <span className="w-12 text-center text-base font-semibold text-[#5c3316]">
                            {item.jumlah || 1}
                          </span>
                          <button
                            onClick={() => updateJumlah(itemKey, "tambah")}
                            className="h-10 w-10 text-[#7b4d2a] transition hover:bg-[#fdf3ec]"
                            aria-label="Tambah jumlah"
                          >
                            +
                          </button>
                        </div>
                        <button className="rounded-full border border-[#eadfd0] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#c08a3e]">
                          Koleksi terbaik
                        </button>
                        <p className="text-sm font-semibold text-[#5c3316]/70">
                          Total: Rp {((item.harga || item.price || 0) * (item.jumlah || 1)).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/85 px-5 py-5 backdrop-blur-md md:px-7 md:py-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#fdf3ec] text-[#704d31]">
                <MapPin size={18} />
              </div>
              <h3 className="font-semibold text-[#5c3316]">Alamat Pengiriman</h3>
            </div>
            <button
              onClick={() => router.push("/alamat")}
              className="luxury-button text-xs"
            >
              <Edit2 size={14} />
              <span className="text-sm font-semibold">Ubah</span>
            </button>
          </div>
          {shippingAddress ? (
            <div>
              <p className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em]">
                {shippingAddress.label}
              </p>
              <p className="text-sm text-[#5a3921]/70 mt-2">
                {shippingAddress.recipient_name} • {shippingAddress.recipient_phone}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {shippingAddress.address}
              </p>
              <p className="text-xs text-[#b08968] mt-1 uppercase tracking-[0.2em]">
                {shippingAddress.district}, {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#e7d9c6] bg-[#fefaf6] px-4 py-3 text-sm text-[#5a3921]/70">
              Belum ada alamat default. Tambahkan alamat pengiriman di menu profil agar proses checkout lebih cepat.
            </div>
          )}
        </section>

        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/85 px-5 py-5 backdrop-blur-md md:px-7 md:py-6">
          <div className="space-y-2 text-sm text-[#5c3316]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>Rp {cartSummary.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Diskon</span>
              <span>- Rp {cartSummary.discount.toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t border-[#eadfd0] pt-3 flex items-center justify-between text-base font-semibold text-[#7b4d2a]">
              <span>Total Pembayaran</span>
              <span>Rp {cartSummary.total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </section>

        <button
          onClick={handleCheckout}
          className="w-full luxury-button primary-button text-lg justify-center md:text-xl"
        >
          Lanjut ke Pembayaran
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
