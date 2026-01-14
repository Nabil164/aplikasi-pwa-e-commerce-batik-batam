"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import api from "../../lib/axios";

export default function GantiPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error saat user mengetik
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = "Password lama harus diisi";
    }

    if (!formData.new_password) {
      newErrors.new_password = "Password baru harus diisi";
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Password minimal 6 karakter";
    }

    if (!formData.new_password_confirmation) {
      newErrors.new_password_confirmation = "Konfirmasi password harus diisi";
    } else if (formData.new_password !== formData.new_password_confirmation) {
      newErrors.new_password_confirmation = "Password tidak cocok";
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = "Password baru harus berbeda dengan password lama";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Panggil API backend sesuai route & format field
      await api.post("/auth/change-password", {
        currentPassword: formData.current_password,
        newPassword: formData.new_password,
        newPasswordConfirmation: formData.new_password_confirmation,
      });

      setSuccess(true);
      setFormData({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });

      setTimeout(() => {
        router.push("/profil");
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      const backendErrors = error.response?.data?.errors || {};

      // Mapping error dari backend (camelCase) ke field form (snake_case)
      const mappedErrors = {};
      if (backendErrors.currentPassword) {
        mappedErrors.current_password = backendErrors.currentPassword[0];
      }
      if (backendErrors.newPassword) {
        mappedErrors.new_password = backendErrors.newPassword[0];
      }
      if (backendErrors.newPasswordConfirmation) {
        mappedErrors.new_password_confirmation =
          backendErrors.newPasswordConfirmation[0];
      }

      if (Object.keys(mappedErrors).length > 0) {
        setErrors(mappedErrors);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Gagal mengubah password. Periksa password lama Anda.";
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const getPasswordStrength = (password) => {
    if (!password) return { text: "", color: "" };
    if (password.length < 6) return { text: "Lemah", color: "text-red-500" };
    if (password.length < 8)
      return { text: "Sedang", color: "text-yellow-500" };
    return { text: "Kuat", color: "text-green-500" };
  };

  const strength = getPasswordStrength(formData.new_password);

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack />

      <div className="luxury-container max-w-2xl space-y-8 md:space-y-10">
        <section className="flex items-center gap-3 text-[#c08a3e]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow-lg">
            <Lock size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
              Ganti Password
            </h1>
            <p className="text-xs uppercase tracking-[0.4em] font-semibold">
              Amankan akunmu
            </p>
          </div>
        </section>

        {success && (
          <div className="glass-card flex items-center gap-3 rounded-[22px] border border-[#d1f2d2] bg-[#f2fcf2] px-4 py-4">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-700">
                Password berhasil diubah!
              </p>
              <p className="text-xs text-green-600">
                Mengarahkan ke halaman profil...
              </p>
            </div>
          </div>
        )}

        <section className="glass-card rounded-[28px] border border-[#e3d6c5] bg-white/90 px-6 py-6 backdrop-blur-md md:px-8 md:py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-[#5c3316]">
                Password Lama *
              </label>
              <div className="relative mt-2">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  required
                  className={`luxury-input pr-12 ${
                    errors.current_password ? "border-red-400 focus:ring-red-200" : ""
                  }`}
                  placeholder="Masukkan password lama"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c08a3e] hover:text-[#7b4d2a] transition"
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.current_password && (
                <p className="mt-1 text-xs text-red-500">{errors.current_password}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-[#5c3316]">
                Password Baru *
              </label>
              <div className="relative mt-2">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  required
                  className={`luxury-input pr-12 ${
                    errors.new_password ? "border-red-400 focus:ring-red-200" : ""
                  }`}
                  placeholder="Masukkan password baru (min. 6 karakter)"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c08a3e] hover:text-[#7b4d2a] transition"
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.new_password && (
                <p className="mt-1 text-xs text-red-500">{errors.new_password}</p>
              )}
              {formData.new_password && !errors.new_password && (
                <p className={`mt-1 text-xs ${strength.color}`}>Kekuatan: {strength.text}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-[#5c3316]">
                Konfirmasi Password Baru *
              </label>
              <div className="relative mt-2">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="new_password_confirmation"
                  value={formData.new_password_confirmation}
                  onChange={handleChange}
                  required
                  className={`luxury-input pr-12 ${
                    errors.new_password_confirmation ? "border-red-400 focus:ring-red-200" : ""
                  }`}
                  placeholder="Ulangi password baru"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c08a3e] hover:text-[#7b4d2a] transition"
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.new_password_confirmation && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.new_password_confirmation}
                </p>
              )}
              {formData.new_password_confirmation &&
                formData.new_password === formData.new_password_confirmation &&
                !errors.new_password_confirmation && (
                  <p className="mt-1 text-xs text-green-500">Password cocok</p>
                )}
            </div>

            <div className="rounded-2xl border border-[#e3d6c5] bg-[#fff6eb] px-4 py-4 text-sm text-[#5c3316]">
              <p className="font-semibold">Tips password aman:</p>
              <ul className="mt-2 space-y-1 text-xs text-[#5c3316]/70 list-disc list-inside">
                <li>Minimal 6 karakter, disarankan lebih dari 8</li>
                <li>Gunakan kombinasi huruf besar, kecil, angka, dan simbol</li>
                <li>Hindari informasi pribadi atau password lama</li>
                <li>Perbarui password secara berkala</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="luxury-button primary-button w-full justify-center py-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Ubah Password"}
            </button>
          </form>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}

