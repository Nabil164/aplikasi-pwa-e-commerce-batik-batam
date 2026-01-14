"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminSidebar from "../../../../../components/AdminSidebar";
import api from "../../../../../lib/axios";
import { resolveImageUrl } from "../../../../../lib/image";

export default function EditProduk() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [originalImageUrl, setOriginalImageUrl] = useState(null); // Store original image URL
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: null,
    imagePreview: null,
    sizes: {
      S: { enabled: false, stock: "" },
      M: { enabled: false, stock: "" },
      L: { enabled: false, stock: "" },
      XL: { enabled: false, stock: "" },
      XXL: { enabled: false, stock: "" },
    },
  });

  const sizeOptions = ["S", "M", "L", "XL", "XXL"];

  // Load product data
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");

    if (!token || role !== "admin") {
      router.push("/login");
      return;
    }

    if (!productId) return;

    const loadProduct = async () => {
      try {
        const response = await api.get(`/products/${productId}`);
        const product = response.data.data || response.data;

        // Parse sizes
        let sizesData = {
          S: { enabled: false, stock: "" },
          M: { enabled: false, stock: "" },
          L: { enabled: false, stock: "" },
          XL: { enabled: false, stock: "" },
          XXL: { enabled: false, stock: "" },
        };

        if (product.sizes && Array.isArray(product.sizes)) {
          product.sizes.forEach(({ size, stock }) => {
            if (sizesData[size]) {
              sizesData[size] = { enabled: true, stock: stock.toString() };
            }
          });
        }

        const imageUrl = product.image_url ? resolveImageUrl(product.image_url) : null;
        setOriginalImageUrl(imageUrl); // Save original image URL
        setFormData({
          name: product.name || "",
          category: product.category || "",
          price: product.price?.toString() || "",
          description: product.description || "",
          image: null,
          imagePreview: imageUrl,
          sizes: sizesData,
        });
      } catch (error) {
        console.error("Gagal load produk:", error);
        alert("Gagal memuat data produk");
        router.push("/admin/produk");
      } finally {
        setLoadingData(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: {
          ...prev.sizes[size],
          enabled: !prev.sizes[size].enabled,
        },
      },
    }));
  };

  const handleStockChange = (size, value) => {
    setFormData((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: {
          ...prev.sizes[size],
          stock: value,
        },
      },
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL for the selected image (more efficient than FileReader)
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: previewUrl,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi ukuran
    const enabledSizes = Object.entries(formData.sizes)
      .filter(([_, data]) => data.enabled)
      .map(([size, data]) => ({ size, stock: parseInt(data.stock) || 0 }));

    if (enabledSizes.length === 0) {
      alert("Pilih minimal satu ukuran produk");
      return;
    }

    if (enabledSizes.some(s => isNaN(s.stock) || s.stock < 0)) {
      alert("Stock harus berupa angka positif");
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

      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("category", formData.category);
      submitData.append("price", formData.price);
      submitData.append("description", formData.description);
      submitData.append("sizes", JSON.stringify(enabledSizes));

      if (formData.image) {
        submitData.append("image", formData.image);
      }

      const response = await api.put(`/products/${productId}`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.data.status) {
        alert("Produk berhasil diperbarui!");
        router.push("/admin/produk");
      } else {
        throw new Error(response.data.message || "Gagal memperbarui produk");
      }
    } catch (error) {
      console.error("Gagal update produk:", error);
      let errorMessage = "Gagal memperbarui produk";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#704d31]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F6F3EC" }}>
      <AdminSidebar />

      <main
        className="flex-1 md:ml-64 p-4 md:p-8 min-h-screen"
        style={{ backgroundColor: "#F6F3EC" }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#5a3921] mb-6">
            Edit Produk
          </h1>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg shadow-md p-6 space-y-4"
            style={{ backgroundColor: "#F6F3EC" }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Produk
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran Produk
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Isi stock per ukuran. Total stock ditambah otomatis.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {sizeOptions.map((size) => (
                  <div
                    key={size}
                    className={`border-2 rounded-lg p-3 transition-colors ${
                      formData.sizes[size].enabled
                        ? "bg-[#704d31] border-[#704d31]"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={formData.sizes[size].enabled}
                        onChange={() => handleSizeToggle(size)}
                        className="w-4 h-4 rounded"
                      />
                      <span
                        className={`font-bold text-lg ${
                          formData.sizes[size].enabled
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {size}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.sizes[size].stock}
                      onChange={(e) => handleStockChange(size, e.target.value)}
                      disabled={!formData.sizes[size].enabled}
                      placeholder="0"
                      className={`w-full px-2 py-1 border rounded text-sm text-center ${
                        formData.sizes[size].enabled
                          ? "bg-white border-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    />
                  </div>
                ))}
              </div>
              {Object.values(formData.sizes).every(s => !s.enabled) && (
                <p className="text-sm text-amber-600 mt-2">
                  Pilih minimal satu ukuran
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Produk
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#704d31] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gambar Produk
              </label>
              {formData.imagePreview && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {formData.image ? "Preview gambar baru:" : "Gambar saat ini:"}
                  </p>
                  <div className="relative inline-block">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-[#704d31] shadow-md"
                    />
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => {
                          // Revoke the blob URL to prevent memory leaks
                          if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(formData.imagePreview);
                          }
                          setFormData((prev) => ({
                            ...prev,
                            image: null,
                            imagePreview: originalImageUrl, // Restore original image
                          }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-md transition-colors"
                        title="Batalkan gambar baru"
                      >
                        ×
                      </button>
                    )}
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
                Kosongkan jika tidak ingin mengubah gambar. Format: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#704d31] hover:bg-[#5a3921] text-white px-6 py-2 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {loading ? "Menyimpan..." : "Perbarui"}
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

