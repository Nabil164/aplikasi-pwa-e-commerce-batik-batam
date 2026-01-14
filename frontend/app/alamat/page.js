"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { MapPin, Plus, Edit2, Trash2, Check, Home, Building2 } from "lucide-react";
import api from "../../lib/axios";

export default function AlamatPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: "",
    recipientName: "",
    phoneNumber: "",
    province: "",
    city: "",
    district: "",
    postalCode: "",
    streetAddress: "",
    isDefault: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchAddresses();
  }, []);

  const syncDefaultAddress = (list) => {
    if (typeof window === "undefined") return;

    if (!list || list.length === 0) {
      localStorage.removeItem("defaultAddress");
      window.dispatchEvent(new Event("defaultAddressUpdated"));
      return;
    }

    const defaultAddress = list.find((item) => item.is_default) || list[0];
    localStorage.setItem("defaultAddress", JSON.stringify(defaultAddress));
    window.dispatchEvent(new Event("defaultAddressUpdated"));
  };

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/addresses");
      const fetchedAddresses = response.data.data || [];
      setAddresses(fetchedAddresses);
      syncDefaultAddress(fetchedAddresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      // Jika API belum tersedia, gunakan dummy data
      const fallback = [
        {
          id: 1,
          label: "Rumah",
          recipient_name: "Muhammad Nabil",
          recipient_phone: "081234567890",
          province: "Kepulauan Riau",
          city: "Batam",
          district: "Sekupang",
          postal_code: "29425",
          address: "Jl. Soekarno Hatta No. 123, RT 001 RW 002",
          is_default: true,
        },
      ];
      setAddresses(fallback);
      syncDefaultAddress(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update address
        await api.put(`/addresses/${editingId}`, formData);
        alert("Alamat berhasil diperbarui ✅");
      } else {
        // Create new address
        await api.post("/addresses", formData);
        alert("Alamat berhasil ditambahkan ✅");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({
        label: "",
        recipientName: "",
        phoneNumber: "",
        province: "",
        city: "",
        district: "",
        postalCode: "",
        streetAddress: "",
        isDefault: false,
      });
      fetchAddresses();
    } catch (error) {
      console.error("Error saving address:", error);
      alert(
        error.response?.data?.message || "Gagal menyimpan alamat. Silakan coba lagi."
      );
    }
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label,
      recipientName: address.recipientName || address.recipient_name,
      phoneNumber: address.phoneNumber || address.recipient_phone,
      province: address.province,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode || address.postal_code,
      streetAddress: address.streetAddress || address.address,
      isDefault: address.isDefault || address.is_default || false,
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus alamat ini?")) return;

    try {
      await api.delete(`/addresses/${id}`);
      alert("Alamat berhasil dihapus ✅");
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Gagal menghapus alamat. Silakan coba lagi.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/set-default`);
      alert("Alamat default berhasil diubah ✅");
      fetchAddresses();
    } catch (error) {
      console.error("Error setting default:", error);
      alert("Gagal mengubah alamat default. Silakan coba lagi.");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      label: "",
      recipientName: "",
      phoneNumber: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
      streetAddress: "",
      isDefault: false,
    });
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#c08a3e]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow-lg">
              <MapPin size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] font-semibold">
                Alamat pengiriman
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
                Kelola lokasi favoritmu
              </h1>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="luxury-button primary-button text-sm"
            >
              <Plus size={18} />
              Tambah alamat
            </button>
          )}
        </section>

        {showForm && (
          <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/90 px-6 py-6 backdrop-blur-md md:px-8 md:py-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[#5c3316]">
                {editingId ? "Edit alamat" : "Tambah alamat baru"}
              </h2>
              <span className="floating-badge bg-white/70 border-white/60 text-[#7b4d2a]">
                Wajib lengkap
              </span>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                <span>Label alamat *</span>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Rumah, Kantor"
                  className="luxury-input"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                  <span>Nama penerima *</span>
                  <input
                    type="text"
                    name="recipientName"
                    value={formData.recipientName}
                    onChange={handleChange}
                    required
                    className="luxury-input"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                  <span>No. HP penerima *</span>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="luxury-input"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                <span>Provinsi *</span>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                  className="luxury-input"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                  <span>Kota/Kabupaten *</span>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="luxury-input"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                  <span>Kecamatan *</span>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                    className="luxury-input"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                <span>Kode Pos *</span>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="luxury-input"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-[#5c3316]">
                <span>Alamat lengkap *</span>
                <textarea
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="luxury-input"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[#e3d6c5] bg-white/70 px-4 py-3 text-sm text-[#5c3316]">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#704d31] border-[#b08968] rounded focus:ring-[#b08968]"
                />
                <span>Jadikan sebagai alamat default</span>
              </label>

              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="submit"
                  className="luxury-button primary-button flex-1 justify-center"
                >
                  Simpan alamat
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="luxury-button flex-1 justify-center"
                >
                  Batal
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="glass-card flex items-center justify-center rounded-[28px] border border-[#e3d6c5] bg-white/80 px-6 py-10 text-[#c08a3e]">
            Memuat daftar alamat...
          </div>
        ) : addresses.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-4 rounded-[28px] border border-[#e3d6c5] bg-white/85 px-6 py-12 text-center">
            <MapPin size={48} className="text-[#c08a3e]" />
            <p className="text-lg font-semibold text-[#5c3316]">
              Belum ada alamat pengiriman
            </p>
            <p className="text-sm text-[#5c3316]/70">
              Tambahkan alamat baru untuk mempercepat proses checkout dan pengiriman.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="luxury-button primary-button text-sm"
            >
              <Plus size={18} />
              Tambah alamat
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="glass-card rounded-[26px] border border-[#e3d6c5]/80 bg-white/80 px-5 py-5 shadow-[0_20px_60px_-45px_rgba(91,55,23,0.65)] transition hover:-translate-y-[1px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf3ec] text-[#7b4d2a]">
                      {address.label?.toLowerCase().includes("rumah") ? (
                        <Home size={20} />
                      ) : (
                        <Building2 size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#5c3316]">
                          {address.label}
                        </h3>
                        {(address.isDefault || address.is_default) && (
                          <span className="floating-badge bg-[#7b4d2a] text-white">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5c3316]/70 mt-1">
                        {address.recipientName || address.recipient_name} • {address.phoneNumber || address.recipient_phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!(address.isDefault || address.is_default) && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="luxury-button text-xs"
                        title="Jadikan default"
                      >
                        <Check size={16} />
                        Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="luxury-button text-xs"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="luxury-button text-xs text-[#c45e3a]"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-4 border-t border-[#eadfd0] pt-3 text-sm text-[#5c3316]">
                  <p>{address.streetAddress || address.address}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#b08968] mt-1">
                    {address.district}, {address.city}, {address.province} {address.postalCode || address.postal_code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

