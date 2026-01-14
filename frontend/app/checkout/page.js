"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { Edit2, ChevronRight, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { resolveImageUrl } from "../../lib/image";
import api from "../../lib/axios";

export default function CheckoutPage() {
  const router = useRouter();
  const [checkoutData, setCheckoutData] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    id: null,
    label: "",
    recipient_name: "",
    recipient_phone: "",
    address: "",
    district: "",
    city: "",
    province: "",
    postal_code: "",
  });
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("checkoutData");
    if (data) {
      setCheckoutData(JSON.parse(data));
    } else {
      router.push("/keranjang");
    }

    const savedAddress = localStorage.getItem("defaultAddress");
    if (savedAddress) {
      try {
        const parsed = JSON.parse(savedAddress);
        setShippingAddress(parsed);
      } catch (error) {
        console.error("Tidak dapat memuat defaultAddress:", error);
      }
    }
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
        setShippingAddress({
          id: null,
          label: "",
          recipient_name: "",
          recipient_phone: "",
          address: "",
          district: "",
          city: "",
          province: "",
          postal_code: "",
        });
      }
    };

    window.addEventListener("storage", handleAddressUpdate);
    window.addEventListener("defaultAddressUpdated", handleAddressUpdate);

    return () => {
      window.removeEventListener("storage", handleAddressUpdate);
      window.removeEventListener("defaultAddressUpdated", handleAddressUpdate);
    };
  }, []);

  const subtotal = checkoutData.reduce(
    (acc, item) => acc + Number(item.harga || item.price || 0) * (item.jumlah || 1),
    0
  );
  const shipping = 0;
  const total = subtotal + shipping;

  const handlePay = async () => {
    if (creatingOrder) return;
    setError("");

    if (!checkoutData || checkoutData.length === 0) {
      router.push("/keranjang");
      return;
    }

    if (!shippingAddress || !shippingAddress.id) {
      alert("Pilih atau buat alamat default terlebih dahulu.");
      return;
    }

    try {
      setCreatingOrder(true);

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Normalisasi item untuk payload API /orders
      const itemsPayload = checkoutData
        .map((item) => {
          const quantity = parseInt(item.jumlah || item.quantity || 1, 10);
          const price = parseFloat(item.harga || item.price || 0);
          const productId = item.productId || item.product?.id || item.id;
          const productSizeId = item.productSizeId || item.size?.id;

          if (!productId || !productSizeId) return null;

          return {
            productId,
            productSizeId,
            productName: item.name || item.productName || item.product?.name || "Produk",
            quantity,
            price,
            subtotal: quantity * price,
          };
        })
        .filter(Boolean);

      if (itemsPayload.length === 0) {
        throw new Error("Data produk tidak lengkap. Muat ulang keranjang dan coba lagi.");
      }

      const payload = {
        addressId: shippingAddress.id,
        items: itemsPayload,
        subtotal,
        discount: 0,
        tax: 0,
        shippingCost: shipping,
        total,
      };

      const response = await api.post("/orders", payload);
      const createdId = response.data?.data?.id;

      if (!createdId) {
        throw new Error(response.data?.message || "Gagal membuat pesanan.");
      }

      // Hapus data checkout lokal setelah order dibuat
      localStorage.removeItem("checkoutData");

      router.push(`/pembayaran?orderId=${createdId}`);
    } catch (err) {
      console.error("Gagal membuat order:", err);
      setError(err.response?.data?.message || err.message || "Terjadi kesalahan saat membuat pesanan.");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-10">
      <Navbar title="Checkout" showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/85 px-5 py-5 backdrop-blur-md md:px-7 md:py-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#fdf3ec] text-[#704d31]">
                <MapPin size={18} />
              </div>
              <h3 className="font-semibold text-[#5c3316] text-lg">Alamat Pengiriman</h3>
            </div>
            <Link
              href="/alamat"
              className="luxury-button text-xs"
            >
              <Edit2 size={14} />
              <span className="text-sm font-semibold">Ubah</span>
            </Link>
          </div>
          {shippingAddress?.address || shippingAddress?.streetAddress ? (
            <>
              <p className="text-sm font-semibold text-[#5c3316] uppercase tracking-[0.3em]">
                {shippingAddress.label || "Alamat Utama"}
              </p>
              <p className="text-sm text-[#5a3921]/70 mt-2">
                {shippingAddress.recipient_name} • {shippingAddress.recipient_phone}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {shippingAddress.address || shippingAddress.streetAddress}
              </p>
              <p className="text-xs text-[#b08968] mt-1 uppercase tracking-[0.2em]">
                {shippingAddress.district}, {shippingAddress.city}, {shippingAddress.province}{" "}
                {shippingAddress.postal_code}
              </p>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[#e7d9c6] bg-[#fefaf6] px-4 py-3 text-sm text-[#5a3921]/70">
              Belum ada alamat default. Tambahkan alamat pengiriman di menu profil untuk melanjutkan checkout.
            </div>
          )}
        </section>

        <section className="luxury-section space-y-6">
          <div className="section-heading">
            <h3>Pesanan Kamu</h3>
            <span>{checkoutData.length} item siap diproses</span>
          </div>
          <div className="space-y-4">
            {checkoutData.map((item) => (
              <div key={`${item.id}-${item.ukuran || ''}`} className="flex gap-4 pb-4 border-b border-[#e7d9c6] last:border-0 last:pb-0">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-[#eadfd0] bg-white/75 shadow-inner">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/logo_batik.jpg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#c08a3e] font-semibold">
                    {item.category || "Batik Premium"}
                  </p>
                  <h4 className="mt-1 font-semibold text-[#5c3316] mb-1">{item.name}</h4>
                  <p className="text-sm text-[#5a3921]/70 mb-2">
                Ukuran: {item.ukuran || item.size || "L"} | Qty: {item.jumlah || 1}
                {item.stock !== undefined && (
                  <span className="ml-2 text-xs text-[#b08968]">
                    (Stok tersisa: {item.stock})
                  </span>
                )}
                  </p>
                  <p className="text-[#7b4d2a] font-semibold">
                    Rp {(Number(item.harga || item.price || 0) * (item.jumlah || 1)).toLocaleString("id-ID")}
                  </p>
                </div>
                <Link
                  href={`/detail_produk/${item.id}`}
                  className="luxury-button text-xs self-start"
                >
                  Lihat Detail
                  <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/85 px-5 py-5 backdrop-blur-md md:px-7 md:py-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <h3 className="font-semibold text-[#5c3316] text-lg mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-2 mb-4 text-sm text-[#5c3316]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t border-[#e7d9c6] pt-3 mt-3">
              <div className="flex justify-between text-lg font-semibold text-[#7b4d2a]">
                <span>Total Pembayaran:</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={handlePay}
          disabled={creatingOrder}
          className="w-full luxury-button primary-button text-lg justify-center md:text-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creatingOrder ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Membuat pesanan...
            </>
          ) : (
            "Bayar Sekarang"
          )}
        </button>
      </div>
    </div>
  );
}
