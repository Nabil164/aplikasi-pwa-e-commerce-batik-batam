"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../../../components/AdminSidebar";
import api from "../../../../lib/axios";

export default function TambahProduk() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    image: null,
    imagePreview: null, // Preview URL gambar
    size: [], // Array ukuran dipilih
    sizeStocks: {}, // Map stok per ukuran
  });

  const sizeOptions = ["S", "M", "L", "XL", "XXL"];

  const handleSizeChange = (size) => {
    setFormData((prev) => {
      if (prev.size.includes(size)) {
        // Hapus ukuran jika sudah dipilih
        const nextSize = prev.size.filter((s) => s !== size);
        const { [size]: _, ...restStocks } = prev.sizeStocks || {};
        return { ...prev, size: nextSize, sizeStocks: restStocks };
      } else {
        // Tambah ukuran jika belum dipilih
        return {
          ...prev,
          size: [...prev.size, size],
          sizeStocks: { ...prev.sizeStocks, [size]: prev.sizeStocks?.[size] ?? 0 },
        };
      }
    });
  };

  const handleSizeStockChange = (size, value) => {
    const numeric = Math.max(0, parseInt(value || 0, 10) || 0);
    setFormData((prev) => ({
      ...prev,
      sizeStocks: { ...prev.sizeStocks, [size]: numeric },
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous preview URL to prevent memory leaks
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      // Create preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: previewUrl,
      }));
    }
  };

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, []);

  const totalStock = formData.size.reduce(
    (sum, size) => sum + (parseInt(formData.sizeStocks?.[size] || 0, 10) || 0),
    0
  );

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin") {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi ukuran
    if (formData.size.length === 0) {
      alert("Pilih minimal satu ukuran produk");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      // Prepare form data
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("category", formData.category);
      submitData.append("price", formData.price);
      // stock total = jumlah stok semua ukuran
      submitData.append("stock", totalStock);
      submitData.append("description", formData.description);
      
      // Append size array - Coba beberapa format untuk kompatibilitas Laravel
      if (Array.isArray(formData.size) && formData.size.length > 0) {
        // Method 1: Append sebagai size[] (Laravel standard)
        formData.size.forEach((size) => {
          submitData.append("size[]", size);
        });
        
        // Method 2: Juga kirim sebagai JSON string untuk backup
        submitData.append("size_json", JSON.stringify(formData.size));

        // Kirim stok per size sebagai JSON
        submitData.append(
          "size_stocks_json",
          JSON.stringify(
            formData.size.reduce((acc, s) => {
              acc[s] = formData.sizeStocks?.[s] ?? 0;
              return acc;
            }, {})
          )
        );
      } else {
        alert("Pilih minimal satu ukuran produk!");
        setLoading(false);
        return;
      }

      // Append image if exists
      if (formData.image) {
        submitData.append("image", formData.image);
        console.log("📷 [Tambah Produk] Image file:", formData.image.name, formData.image.size, "bytes");
      }

      // Log data yang akan dikirim (untuk debugging)
      console.log("📤 [Tambah Produk] Sending data:");
      console.log("  - Name:", formData.name);
      console.log("  - Category:", formData.category);
      console.log("  - Price:", formData.price);
      console.log("  - Stock:", totalStock);
      console.log("  - Size:", formData.size);
      console.log("  - Size Stocks:", formData.sizeStocks);
      console.log("  - Description:", formData.description?.substring(0, 50) + "...");
      console.log("  - Has Image:", !!formData.image);

      // Send to API
      // Note: Don't set Content-Type manually for FormData - axios will set it automatically with boundary
      console.log("📤 [Tambah Produk] Sending request to:", api.defaults.baseURL + "/products");
      console.log("📤 [Tambah Produk] FormData entries:");
      for (let pair of submitData.entries()) {
        if (pair[0] === 'image' && pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File (${pair[1].name}, ${pair[1].size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }
      
      const response = await api.post("/products", submitData, {
        headers: {
          // JANGAN set Content-Type - axios akan otomatis set dengan boundary untuk FormData
          "Authorization": `Bearer ${token}`,
        },
        // Force axios to treat this as FormData
        transformRequest: [(data) => data], // Don't transform FormData
      });
      
      console.log("✅ [Tambah Produk] Response received:", response.status, response.data);

      if (response.data.status) {
        alert("Produk berhasil ditambahkan!");
        // Trigger event untuk refresh halaman lain
        window.dispatchEvent(new Event('productsUpdated'));
        router.push("/admin/produk");
      } else {
        throw new Error(response.data.message || "Gagal menambahkan produk");
      }
    } catch (error) {
      console.error("❌ [Tambah Produk] Error:", error);
      console.error("❌ [Tambah Produk] Error response:", error.response?.data);
      console.error("❌ [Tambah Produk] Error status:", error.response?.status);
      console.error("❌ [Tambah Produk] Error config:", error.config);
      console.error("❌ [Tambah Produk] Request URL:", error.config?.url || error.request?.responseURL);
      console.error("❌ [Tambah Produk] Full error:", JSON.stringify(error, null, 2));
      
      // Log raw response jika ada
      if (error.response) {
        console.error("❌ [Tambah Produk] Raw response headers:", error.response.headers);
        console.error("❌ [Tambah Produk] Raw response status:", error.response.status);
        console.error("❌ [Tambah Produk] Raw response data type:", typeof error.response.data);
        console.error("❌ [Tambah Produk] Raw response data:", error.response.data);
      }
      
      let errorMessage = "Gagal menambahkan produk";
      
      if (error.response?.status === 500) {
        // Server error - show detailed message if available
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = `Server Error: ${error.response.data.error}`;
        } else if (error.response?.data && Object.keys(error.response.data).length > 0) {
          // Try to extract any error message from response
          errorMessage = `Server Error: ${JSON.stringify(error.response.data)}`;
        } else {
          // Empty response - likely backend not returning JSON
          errorMessage = "Terjadi kesalahan di server (500). Response kosong.\n\nKemungkinan penyebab:\n1. File backend belum diupdate di VPS\n2. Exception handler tidak bekerja\n3. Fatal error di backend\n\nSilakan:\n1. Update file ProductController.php dan bootstrap/app.php di VPS\n2. Clear cache: php artisan config:clear\n3. Cek log: tail -f storage/logs/laravel.log";
        }
      } else if (error.response?.status === 422) {
        // Validation error
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          errorMessage = "Validasi gagal:\n" + Object.values(errors).flat().join("\n");
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Tidak memiliki akses. Silakan login ulang.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Tidak bisa terhubung ke server. Pastikan backend Laravel berjalan.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F6F3EC" }}>
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen" style={{ backgroundColor: "#F6F3EC" }}>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#5a3921] mb-6">
            Tambah Produk
          </h1>

          <form onSubmit={handleSubmit} className="rounded-lg shadow-md p-6 space-y-4" style={{ backgroundColor: "#F6F3EC" }}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Produk
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori Produk
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="pria">Pakaian Pria</option>
                <option value="wanita">Pakaian Wanita</option>
                <option value="aksesoris">Aksesoris</option>
                <option value="kain">Kain</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga Produk
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran Produk
              </label>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Isi stok per ukuran. Total stok dihitung otomatis:{" "}
                  <span className="font-semibold text-[#704d31]">{totalStock}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {sizeOptions.map((size) => {
                    const active = formData.size.includes(size);
                    return (
                      <div
                        key={size}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-lg min-w-[150px] ${
                          active
                            ? "bg-[#704d31]/5 border-[#704d31]"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => handleSizeChange(size)}
                            className="h-4 w-4 accent-[#704d31]"
                          />
                          <span className="font-medium text-sm">{size}</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sizeStocks?.[size] ?? 0}
                          onChange={(e) => handleSizeStockChange(size, e.target.value)}
                          disabled={!active}
                          className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                            active
                              ? "border-[#704d31] focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                              : "border-gray-200 bg-gray-100 text-gray-400"
                          }`}
                          placeholder="Stok"
                        />
                      </div>
                    );
                  })}
                </div>
                {formData.size.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    Pilih minimal satu ukuran
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Produk
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gambar Produk
              </label>
              {/* Image Preview */}
              {formData.imagePreview && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Preview gambar:</p>
                  <div className="relative inline-block">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-[#704d31] shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.imagePreview) {
                          URL.revokeObjectURL(formData.imagePreview);
                        }
                        setFormData((prev) => ({
                          ...prev,
                          image: null,
                          imagePreview: null,
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md transition-colors"
                      title="Hapus gambar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#704d31] file:text-white hover:file:bg-[#5a3921] file:cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format yang didukung: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#704d31] hover:bg-[#5a3921] text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/produk")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Kembali
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
