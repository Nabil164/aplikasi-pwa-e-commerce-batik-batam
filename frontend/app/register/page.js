"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { Eye, EyeOff, UserPlus, Sparkles } from "lucide-react";
import api from "../../lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!agree) {
      alert("Kamu harus menyetujui syarat & ketentuan dulu");
      return;
    }

    if (password !== confirmPassword) {
      alert("Password dan konfirmasi password tidak sama!");
      return;
    }

    setLoading(true);

    try {
      console.log("📤 Sending register request:", {
        name,
        email,
        password_length: password.length,
        password_match: password === confirmPassword,
        api_url: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api"
      });
      
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      console.log("✅ Register success:", response.data);
      
      // Jika backend langsung return token setelah register, langsung login
      if (response.data.token || response.data.access_token) {
        const token = response.data.token || response.data.access_token;
        localStorage.setItem("token", token);
        
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }
        
        // Save role (register selalu jadi user)
        if (response.data.role) {
          localStorage.setItem("userRole", response.data.role);
        } else {
          localStorage.setItem("userRole", "user"); // Default user
        }
        
        // Register selalu redirect ke Beranda (karena selalu user)
        alert("Registrasi berhasil! Mengarahkan ke halaman utama...");
        router.push("/Beranda");
      } else {
        // Jika tidak ada token, redirect ke login
        alert("Registrasi berhasil! Silakan login.");
        router.push("/login");
      }
    } catch (error) {
      let errorMessage = "Registrasi gagal!";
      let errorDetails = "";

      // Handle different error types
      if (error.response?.data) {
        // Server returned error response
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Validation errors
          const errors = error.response.data.errors;
          const errorList = Object.entries(errors)
            .map(([field, messages]) => {
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return `${field}: ${msg}`;
            })
            .join("\n");
          errorMessage = errorList || errorMessage;
        } else if (error.response.status === 422) {
          errorMessage = "Data yang dimasukkan tidak valid!";
        } else if (error.response.status >= 500) {
          errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
        }
      } else if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        // Network error
        errorMessage = "Tidak bisa terhubung ke server!";
        errorDetails = "\n\nPastikan:\n1. Backend API sudah berjalan\n2. Koneksi internet stabil\n3. Cek console untuk detail error";
      } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        // Timeout error
        errorMessage = "Request timeout! Server tidak merespons.";
        errorDetails = "\n\nSilakan coba lagi atau periksa koneksi internet Anda.";
      } else if (error.message) {
        // Other errors
        errorMessage = error.message;
      } else {
        errorMessage = "Cek kembali data yang dimasukkan.";
      }

      // Log error for debugging with safe property access
      try {
        const errorLog = {
          message: error?.message || String(error) || "Unknown error",
          code: error?.code || "UNKNOWN",
          status: error?.response?.status || null,
          data: error?.response?.data || null,
          errorInfo: error?.errorInfo || null,
          errorString: String(error),
        };
        console.error("Register Error:", errorLog);
      } catch (logError) {
        // Fallback if logging fails
        console.error("Register Error (fallback):", String(error));
      }

      alert(errorMessage + errorDetails);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0] overflow-hidden">
      <Navbar />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#c08a3e]/20 to-[#7b4d2a]/10 blur-3xl rounded-full transition-all duration-[2000ms] ${mounted ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#7b4d2a]/15 to-[#c08a3e]/10 blur-3xl rounded-full transition-all duration-[2500ms] delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-[#c08a3e]/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-[15%] w-3 h-3 bg-[#7b4d2a]/20 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-32 left-[20%] w-2 h-2 bg-[#d4a574]/40 rounded-full animate-float"></div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-6xl flex-col overflow-hidden px-4 py-8 md:flex-row md:items-center md:justify-between md:px-10 lg:px-12 lg:py-12">
        
        {/* Image Section with animation */}
        <div className={`relative mb-10 flex w-full max-w-xl flex-1 justify-center md:order-2 md:mb-0 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#f6e7d4] via-transparent to-[#c08a3e]/40 blur-3xl animate-pulse-slow" />
          <div className="relative overflow-hidden rounded-[36px] border border-[#e3d6c5] bg-white/30 p-4 shadow-[0_25px_70px_-40px_rgba(91,55,23,0.6)] hover:shadow-[0_30px_80px_-35px_rgba(91,55,23,0.7)] transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-x-10 top-6 h-32 rounded-full bg-white/15 blur-3xl" />
            <Image
              src="/wanita1.jpg"
              alt="Batik Cindur Premium"
              width={600}
              height={720}
              className="relative rounded-[28px] object-cover shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
              priority
            />
            <div className={`absolute bottom-6 left-6 right-6 rounded-2xl border border-white/70 bg-white/90 px-5 py-4 shadow-lg backdrop-blur-md transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#c08a3e] animate-pulse" />
                <p className="text-xs uppercase tracking-[0.3em] text-[#c08a3e] font-semibold">
                  Eksklusif anggota
                </p>
              </div>
              <p className="mt-1 text-base font-semibold text-[#5c3316]">
                Dapatkan poin belanja dan akses pre-order khusus.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section with animation */}
        <div className={`relative w-full max-w-md md:order-1 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/60 to-white/20 blur-3xl" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#c08a3e]/10 via-[#7b4d2a]/5 to-[#c08a3e]/10 blur-2xl rounded-3xl animate-pulse-slow"></div>
          
          <div className="relative glass-card px-6 py-6 md:px-8 md:py-10 bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(123,77,42,0.25)] border border-white/50 overflow-hidden">
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
            
            <div className={`flex flex-col gap-3 text-center md:text-left transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="inline-flex items-center gap-2 self-center md:self-start px-4 py-2 bg-gradient-to-r from-[#7b4d2a] to-[#5c3316] text-white text-xs font-semibold rounded-full shadow-lg">
                <UserPlus size={14} />
                Buat akun baru
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-[#5c3316] to-[#7b4d2a] bg-clip-text text-transparent">
                Mulai perjalanan eksklusifmu bersama Batik Cindur
              </h2>
              <p className="text-sm text-[#5c3316]/70">
                Daftarkan dirimu dan nikmati kurasi batik istimewa serta layanan prioritas.
              </p>
            </div>

            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              {/* Name Field */}
              <div className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <label className="text-sm font-medium text-[#5c3316] mb-2 block">Nama Lengkap</label>
                <div className={`flex items-center gap-3 rounded-2xl border-2 bg-white/90 px-4 py-3.5 shadow-sm transition-all duration-300 ${focusedField === 'name' ? 'border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)]' : 'border-[#e3d6c5] hover:border-[#c08a3e]'}`}>
                  <span className={`text-xl transition-colors duration-300 ${focusedField === 'name' ? 'text-[#7b4d2a]' : 'text-[#c08a3e]'}`}>👤</span>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className={`transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <label className="text-sm font-medium text-[#5c3316] mb-2 block">Email</label>
                <div className={`flex items-center gap-3 rounded-2xl border-2 bg-white/90 px-4 py-3.5 shadow-sm transition-all duration-300 ${focusedField === 'email' ? 'border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)]' : 'border-[#e3d6c5] hover:border-[#c08a3e]'}`}>
                  <span className={`text-xl transition-colors duration-300 ${focusedField === 'email' ? 'text-[#7b4d2a]' : 'text-[#c08a3e]'}`}>📧</span>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className={`transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <label className="text-sm font-medium text-[#5c3316] mb-2 block">Kata Sandi</label>
                <div className={`relative flex items-center gap-3 rounded-2xl border-2 bg-white/90 px-4 py-3.5 shadow-sm transition-all duration-300 ${focusedField === 'password' ? 'border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)]' : 'border-[#e3d6c5] hover:border-[#c08a3e]'}`}>
                  <span className={`text-xl transition-colors duration-300 ${focusedField === 'password' ? 'text-[#7b4d2a]' : 'text-[#c08a3e]'}`}>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Buat kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#c08a3e] hover:text-[#7b4d2a] transition-all duration-300 hover:scale-110"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className={`transition-all duration-700 delay-[600ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <label className="text-sm font-medium text-[#5c3316] mb-2 block">Konfirmasi Kata Sandi</label>
                <div className={`relative flex items-center gap-3 rounded-2xl border-2 bg-white/90 px-4 py-3.5 shadow-sm transition-all duration-300 ${focusedField === 'confirm' ? 'border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)]' : 'border-[#e3d6c5] hover:border-[#c08a3e]'}`}>
                  <span className={`text-xl transition-colors duration-300 ${focusedField === 'confirm' ? 'text-[#7b4d2a]' : 'text-[#c08a3e]'}`}>🔐</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ulangi kata sandi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 text-[#c08a3e] hover:text-[#7b4d2a] transition-all duration-300 hover:scale-110"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className={`mt-2 flex items-start gap-3 rounded-2xl border-2 border-[#e3d6c5] bg-white/70 px-4 py-4 hover:border-[#c08a3e] transition-all duration-300 delay-[700ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={() => setAgree(!agree)}
                  className="mt-1 h-4 w-4 accent-[#7b4d2a] cursor-pointer transition-transform duration-200 hover:scale-110"
                />
                <p className="text-xs md:text-sm text-[#5c3316]/70 leading-relaxed">
                  Saya menyetujui{" "}
                  <span className="font-semibold text-[#7b4d2a] hover:underline cursor-pointer">
                    Syarat &amp; Ketentuan
                  </span>{" "}
                  serta kebijakan privasi Batik Cindur Batam.
                </p>
              </div>

              {/* Submit Button */}
              <div className={`transition-all duration-700 delay-[800ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full bg-gradient-to-r from-[#7b4d2a] to-[#5c3316] text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7b4d2a]/25 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden transform hover:-translate-y-0.5"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  <UserPlus size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                  {loading ? "Memproses..." : "Daftar Sekarang"}
                </button>
              </div>
            </form>

            <p className={`mt-6 text-center text-sm text-[#5c3316]/70 transition-all duration-700 delay-[900ms] ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Sudah punya akun?
              <a
                href="/login"
                className="ml-2 font-semibold text-[#7b4d2a] hover:text-[#5c3316] relative group"
              >
                Masuk di sini
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#7b4d2a] group-hover:w-full transition-all duration-300"></span>
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-5deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
