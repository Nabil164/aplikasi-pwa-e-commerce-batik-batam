"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { Eye, EyeOff, LogIn, User, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import api from "../../lib/axios";

// Spinner loading dengan animasi yang lebih smooth
const Spinner = () => (
  <div className="relative w-5 h-5">
    <div className="absolute inset-0 border-2 border-white/30 rounded-full"></div>
    <div className="absolute inset-0 border-2 border-t-white border-r-white rounded-full animate-spin"></div>
  </div>
);

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [success, setSuccess] = useState(false);

  // Animation trigger on mount dengan delay bertahap
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load rememberMe & stored email
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle Login dengan animasi success
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !password) {
      setError("Email dan Kata Sandi wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });

      const { token, access_token, user, role } = response.data;
      const finalToken = token || access_token;

      if (finalToken) localStorage.setItem("token", finalToken);
      if (user) localStorage.setItem("userData", JSON.stringify(user));

      const userRole = role || user?.role || "user";
      localStorage.setItem("userRole", userRole);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("userEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("userEmail");
      }

      // Show success animation
      setSuccess(true);
      setLoading(false);

      // Redirect after short delay to show success animation
      setTimeout(() => {
        if (userRole === "admin") router.push("/admin/dashboard");
        else router.push("/Beranda");
      }, 800);
    } catch (error) {
      let errorMessage = "Login gagal! Periksa kembali email dan kata sandi Anda.";

      if (error.code === "ERR_NETWORK") {
        errorMessage = "Tidak bisa terhubung ke backend! Pastikan server Laravel berjalan.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors)
          .flat()
          .join("; ");
        errorMessage = `Validasi Gagal: ${validationErrors}`;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fefaf6] via-[#fff8f0] to-[#f5ebe0] overflow-hidden">
      <Navbar />

      {/* Enhanced Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs with smoother animation */}
        <div
          className={`absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#c08a3e]/20 to-[#7b4d2a]/10 blur-3xl rounded-full transition-all duration-[3000ms] ease-out ${
            mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-20 scale-90"
          }`}
        ></div>
        <div
          className={`absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-[#7b4d2a]/15 to-[#c08a3e]/10 blur-3xl rounded-full transition-all duration-[3500ms] delay-300 ease-out ${
            mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-20 scale-90"
          }`}
        ></div>
        <div
          className={`absolute top-1/4 left-1/4 w-64 h-64 bg-[#d4a574]/10 blur-2xl rounded-full transition-all duration-[4000ms] delay-500 ease-out ${
            mounted ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-45"
          }`}
        ></div>

        {/* Enhanced floating particles dengan lebih banyak variasi */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-${2 + (i % 3)} h-${2 + (i % 3)} bg-[#c08a3e]/${
              20 + i * 5
            } rounded-full transition-all duration-[${2000 + i * 500}ms] delay-${i * 200} ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            style={{
              top: `${15 + i * 12}%`,
              left: `${10 + i * 15}%`,
              animation: `float ${6 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          ></div>
        ))}

        {/* Decorative batik pattern overlay dengan fade in */}
        <div
          className={`absolute inset-0 opacity-[0.02] transition-opacity duration-[3000ms] delay-700 ${
            mounted ? "opacity-[0.02]" : "opacity-0"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%237b4d2a' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
          }}
        ></div>
      </div>

      {/* CENTERED CONTAINER */}
      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12">
        {/* LOGIN CARD with enhanced entrance animation */}
        <div
          className={`w-full max-w-md transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
          }`}
        >
          {/* Enhanced glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#c08a3e]/20 via-[#7b4d2a]/10 to-[#c08a3e]/20 blur-2xl rounded-3xl transform scale-105 animate-pulse-slow"></div>

          <div className="relative px-8 py-10 bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(123,77,42,0.3)] border border-white/60 overflow-hidden group">
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[3000ms]"></div>

            {/* Header with enhanced staggered animation */}
            <div
              className={`text-center space-y-3 mb-8 transition-all duration-700 delay-200 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <div className="relative p-3 bg-gradient-to-br from-[#7b4d2a] to-[#5c3316] rounded-2xl shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300 group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#c08a3e] to-[#7b4d2a] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <LogIn
                    className="relative text-white group-hover:animate-bounce transition-transform duration-300"
                    size={26}
                  />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#5c3316] via-[#7b4d2a] to-[#5c3316] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    Selamat Datang
                  </h2>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#c08a3e] font-medium">
                      Batik Cindur Batam
                    </span>
                    <Sparkles size={12} className="text-[#c08a3e] animate-pulse" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#5c3316]/70 max-w-sm mx-auto leading-relaxed">
                Masuk untuk menikmati pengalaman berbelanja batik eksklusif
              </p>
            </div>

            {/* Success Message dengan animasi */}
            {success && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 animate-slide-down">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                <span className="text-sm font-medium text-green-700">
                  Login berhasil! Mengalihkan...
                </span>
              </div>
            )}

            {/* FORM with enhanced staggered animations */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field dengan animasi focus yang lebih smooth */}
              <div
                className={`transition-all duration-700 delay-300 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <label className="text-sm font-medium text-[#5c3316] flex items-center gap-2 mb-2 transition-colors duration-300">
                  <User
                    className={`transition-all duration-300 ${
                      focusedField === "email" ? "text-[#7b4d2a] scale-110" : "text-[#c08a3e]"
                    }`}
                    size={17}
                  />
                  Email atau Username
                </label>

                <div
                  className={`relative flex items-center border-2 rounded-2xl px-4 py-3.5 bg-white/90 shadow-sm transition-all duration-300 group ${
                    focusedField === "email"
                      ? "border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)] scale-[1.02]"
                      : "border-[#e3d6c5] hover:border-[#c08a3e]"
                  }`}
                >
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="nama@email.com"
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50 transition-all duration-300"
                    required
                    disabled={loading || success}
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7b4d2a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                      focusedField === "email" ? "opacity-100" : ""
                    }`}
                  ></div>
                </div>
              </div>

              {/* Password Field dengan animasi focus yang lebih smooth */}
              <div
                className={`transition-all duration-700 delay-400 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <label className="text-sm font-medium text-[#5c3316] flex items-center gap-2 mb-2 transition-colors duration-300">
                  <Lock
                    className={`transition-all duration-300 ${
                      focusedField === "password"
                        ? "text-[#7b4d2a] scale-110"
                        : "text-[#c08a3e]"
                    }`}
                    size={17}
                  />
                  Kata Sandi
                </label>

                <div
                  className={`relative flex items-center border-2 rounded-2xl px-4 py-3.5 bg-white/90 shadow-sm transition-all duration-300 group ${
                    focusedField === "password"
                      ? "border-[#7b4d2a] shadow-[0_0_0_4px_rgba(123,77,42,0.1)] scale-[1.02]"
                      : "border-[#e3d6c5] hover:border-[#c08a3e]"
                  }`}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-[#5c3316] placeholder:text-[#c08a3e]/50 transition-all duration-300"
                    required
                    disabled={loading || success}
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#7b4d2a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                      focusedField === "password" ? "opacity-100" : ""
                    }`}
                  ></div>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#c08a3e] hover:text-[#7b4d2a] transition-all duration-300 hover:scale-110 transform active:scale-95"
                    disabled={loading || success}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error dengan animasi yang lebih smooth */}
              {error && (
                <div className="text-sm text-red-600 bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-2xl border-2 border-red-200 animate-slide-down flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <strong className="block mb-1">Error:</strong>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Remember me & Forgot password dengan animasi */}
              <div
                className={`flex items-center justify-between transition-all duration-700 delay-500 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <label className="flex items-center gap-2 text-sm text-[#5c3316] cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 accent-[#7b4d2a] rounded transition-all duration-200 group-hover:scale-110 cursor-pointer"
                      disabled={loading || success}
                    />
                    <div className="absolute inset-0 rounded bg-[#7b4d2a]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  </div>
                  <span className="group-hover:text-[#7b4d2a] transition-colors duration-200">
                    Ingat saya
                  </span>
                </label>

                <a
                  href="/forgot-password"
                  className="text-sm text-[#7b4d2a] hover:text-[#5c3316] relative group transition-all duration-200"
                >
                  Lupa kata sandi?
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#7b4d2a] group-hover:w-full transition-all duration-300"></span>
                </a>
              </div>

              {/* Submit Button dengan enhanced hover effects */}
              <div
                className={`transition-all duration-700 delay-600 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <button
                  type="submit"
                  disabled={loading || success}
                  className="group relative w-full bg-gradient-to-r from-[#7b4d2a] via-[#8f5c33] to-[#5c3316] text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7b4d2a]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden transform hover:-translate-y-1 active:translate-y-0 disabled:hover:translate-y-0"
                >
                  {/* Enhanced button shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>

                  {/* Ripple effect on click */}
                  <span className="absolute inset-0 bg-white/20 rounded-2xl scale-0 group-active:scale-100 transition-transform duration-300"></span>

                  {loading ? (
                    <>
                      <Spinner />
                      <span className="relative">Memproses...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 size={18} className="relative animate-scale-in" />
                      <span className="relative">Berhasil!</span>
                    </>
                  ) : (
                    <>
                      <LogIn
                        size={18}
                        className="relative group-hover:rotate-12 transition-transform duration-300"
                      />
                      <span className="relative">Masuk ke Akun</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer dengan enhanced animation */}
            <div
              className={`text-center mt-8 pt-6 border-t border-[#e3d6c5]/50 transition-all duration-700 delay-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="text-sm text-[#5c3316]/70">Belum memiliki akun?</span>
              <a
                href="/register"
                className="ml-2 font-semibold text-[#7b4d2a] hover:text-[#5c3316] relative group transition-all duration-200 inline-block"
              >
                Daftar sekarang
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7b4d2a] to-[#c08a3e] group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom animation styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-25px) rotate(5deg) scale(1.1);
            opacity: 1;
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px) rotate(-5deg) scale(1.05);
            opacity: 0.9;
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-30px) scale(1.15) rotate(10deg);
            opacity: 0.8;
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-15deg);
          }
          100% {
            transform: translateX(200%) skewX(-15deg);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0) rotate(0deg);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-8px) rotate(-2deg);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(8px) rotate(2deg);
          }
        }
        @keyframes slide-down {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-slide-down {
          animation: slide-down 0.4s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
