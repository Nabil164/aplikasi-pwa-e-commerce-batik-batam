 "use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import {
  User,
  Bell,
  MapPin,
  Lock,
  LogOut,
  ChevronRight,
  Edit2,
  Sparkles,
  Loader2,
  Package,
} from "lucide-react";
import api from "../../lib/axios";

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "Nama Pengguna",
    email: "user@email.com",
    avatar: "/logo_batik.jpg",
  });
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);

  // Fungsi untuk refresh data user
  const refreshUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Hapus cache dengan timestamp yang berbeda
      const timestamp = new Date().getTime();
      const response = await api.get(`/auth/profile?_t=${timestamp}`);
      if (response.data.status && response.data.data) {
        const userData = {
          name: response.data.data.name,
          email: response.data.data.email,
          avatar: response.data.data.avatar || "/logo_batik.jpg",
        };
        setUser(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
        // Trigger custom event untuk update komponen lain
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: userData }));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Try to get user from API
        const response = await api.get("/auth/profile");
        if (response.data.status && response.data.data) {
          setUser({
            name: response.data.data.name,
            email: response.data.data.email,
            avatar: response.data.data.avatar || "/logo_batik.jpg",
          });
          // Update localStorage dengan data terbaru
          localStorage.setItem("userData", JSON.stringify({
            name: response.data.data.name,
            email: response.data.data.email,
            avatar: response.data.data.avatar || "/logo_batik.jpg",
          }));
        } else {
          // Fallback to localStorage
          const savedUser = localStorage.getItem("userData");
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Fallback to localStorage
        const savedUser = localStorage.getItem("userData");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Hanya dijalankan sekali saat component mount

  // Event listener untuk refresh data user ketika kembali dari tab lain
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUserData();
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'userData') {
        refreshUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const loadOrderCount = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setOrderCount(0);
        return;
      }

      try {
        const response = await api.get("/orders");
        if (response.data.status && Array.isArray(response.data.data)) {
          setOrderCount(response.data.data.length);
        } else {
          setOrderCount(0);
        }
      } catch (error) {
        console.error("Error loading order count:", error);
        setOrderCount(0);
      }
    };

    loadOrderCount();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Call logout API if available
        try {
          await api.post("/auth/logout");
        } catch (error) {
          // Ignore logout API errors
          console.error("Logout API error:", error);
        }
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("cartData");
      alert("Anda telah keluar dari akun");
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#7b4d2a]" size={32} />
      </div>
    );
  }

  const menuItems = [
    {
      icon: User,
      title: "Edit Profil",
      link: "/edit-profil",
    },
    {
      icon: Package,
      title: "Riwayat Pesanan",
      link: "/riwayat-pesanan",
    },
    {
      icon: Bell,
      title: "Notifikasi",
      link: "/notifikasi",
    },
    {
      icon: MapPin,
      title: "Alamat Pengiriman",
      link: "/alamat",
    },
    {
      icon: Lock,
      title: "Ganti Password",
      link: "/ganti-password",
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="luxury-section flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-4 border-[#e3d6c5] bg-white/80 shadow-[0_20px_60px_-40px_rgba(91,55,23,0.75)] md:mx-0 md:h-32 md:w-32">
            <Image
              src={user.avatar || "/logo_batik.jpg"}
              alt="Foto Profil"
              fill
              className="object-cover"
            />
            <button
              onClick={() => router.push("/edit-profil")}
              className="group absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-[#7b4d2a] text-white shadow-lg transition hover:translate-y-[1px]"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={refreshUserData}
              className="group absolute top-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-[#c08a3e] text-white shadow-lg transition hover:translate-y-[1px]"
              title="Refresh profil"
            >
              <Loader2 size={16} />
            </button>
          </div>
          <div className="space-y-2">
            <span className="floating-badge bg-white/70 border-white/60 text-[#7b4d2a]">
              Akun eksklusif
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
              {user.name || "Nama Pengguna"}
            </h2>
            <p className="text-sm text-[#5c3316]/70">
              Kelola profilmu, atur notifikasi, dan simpan alamat favorit untuk pengalaman berbelanja yang mulus.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-[#c08a3e]">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.4em] font-semibold">
              Pengaturan utama
            </span>
          </div>
          <div className="space-y-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isOrderHistory = item.link === "/riwayat-pesanan";
              return (
                <Link
                  key={`menu-${item.link}-${index}`}
                  href={item.link}
                  className="glass-card flex items-center justify-between rounded-[26px] border border-[#e3d6c5]/80 bg-white/80 px-5 py-4 transition hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl relative flex-shrink-0 ${
                        isOrderHistory
                          ? "bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white"
                          : "bg-[#fdf3ec] text-[#7b4d2a]"
                      }`}
                    >
                      <Icon size={20} />
                      {isOrderHistory && orderCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c45e3a] text-xs font-bold text-white shadow-md">
                          {orderCount > 9 ? "9+" : orderCount}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className={`text-sm font-semibold ${
                          isOrderHistory ? "text-[#7b4d2a]" : "text-[#5c3316]"
                        }`}
                      >
                        {item.title}
                      </span>
                      {isOrderHistory && orderCount > 0 && (
                        <span className="text-xs text-[#c08a3e] mt-0.5">
                          {orderCount} pesanan
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#c08a3e] flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>

        <button
          onClick={handleLogout}
          className="luxury-button primary-button flex w-full items-center justify-center gap-2 text-base"
        >
          <LogOut size={18} />
          <span>Keluar dari akun</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
