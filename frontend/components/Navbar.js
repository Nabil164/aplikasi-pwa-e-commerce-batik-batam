"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Menu,
  X,
  Crown,
  ChevronRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import api from "../lib/axios";

const NAV_LINKS = [
  { label: "Beranda", href: "/Beranda" },
  { label: "Kategori", href: "/kategori" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Profil", href: "/profil" },
];

export default function Navbar({ title, showBack = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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

  useEffect(() => {
    const updateCartCount = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCartCount(0);
        return;
      }

      try {
        const response = await api.get("/cart");
        if (response.data.status && response.data.data?.items) {
          setCartCount(response.data.data.items.length);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        // If unauthorized or error, set count to 0
        setCartCount(0);
      }
    };

    updateCartCount();
    // Listen for cart updates
    const handleCartUpdate = () => {
      updateCartCount();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const onAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (onAuthPage) {
    return (
      <header className="w-full sticky top-0 z-50">
        <div className="bg-gradient-to-r from-[#7b4d2a] to-[#c4986c] text-white">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
            <Crown size={16} className="opacity-80" />
            <span>Koleksi premium batik khas Kepulauan Riau</span>
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/90 border-b border-[#e3d6c5] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center">
            <h1 className="text-lg md:text-xl font-bold text-[#5c3316] tracking-[0.2em]">
              BATIK CINDUR BATAM
            </h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-gradient-to-r from-[#7b4d2a] via-[#8f5c33] to-[#c4986c] text-white">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Crown size={18} className="opacity-80" />
            <span className="uppercase tracking-[0.4em] text-xs font-semibold">
              Batik Cindur Batam
            </span>
          </div>
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-2 opacity-90">
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">
                Exclusive Drop
              </span>
              <ChevronRight size={16} />
            </p>
            <span className="text-xs opacity-90">
              Gratis ongkir khusus wilayah Batam &amp; Tj. Pinang
            </span>
          </div>
        </div>
      </div>

      <header className="md:hidden w-full sticky top-0 z-50">
        <div className="backdrop-blur-[18px] bg-white/85 border-b border-[#e3d6c5] shadow-sm flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="text-[#7b4d2a] hover:text-[#5c3316] transition"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {title ? (
              <h1 className="text-base font-semibold text-[#5c3316] truncate">{title}</h1>
            ) : (
              <div className="flex flex-col leading-tight">
                <span className="text-xs uppercase tracking-[0.3em] text-[#c08a3e]">
                  Batik Premium
                </span>
                <span className="text-base font-bold text-[#5c3316]">
                  Cindur Batam
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/cari"
              className="text-[#7b4d2a] hover:text-[#5c3316] transition"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/keranjang"
              className="text-[#7b4d2a] hover:text-[#5c3316] relative transition"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#c45e3a] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <header className="hidden md:block w-full sticky top-0 z-50">
        <div className="backdrop-blur-2xl bg-white/90 border-b border-[#e3d6c5] shadow-[0_20px_45px_-30px_rgba(91,55,23,0.55)]">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
            <div className="flex items-center gap-6 min-w-0">
              {showBack && (
                <button
                  onClick={() => router.back()}
                  className="text-[#7b4d2a] hover:text-[#5c3316] transition rounded-full border border-transparent hover:border-[#d1b799] p-2"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              <Link href="/Beranda" className="flex items-center gap-3 group min-w-0">
                <Image
                  src="/logo_batik.jpg"
                  alt="Batik Cindur Batam"
                  width={48}
                  height={48}
                  className="rounded-xl shadow-sm border border-[#e3d6c5]/70"
                />
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-[0.45em] text-[#c08a3e] font-semibold">
                    Batik Cindur
                  </span>
                  <h1 className="text-xl font-semibold text-[#5c3316] group-hover:text-[#7b4d2a] transition-colors">
                    Klasik &amp; Elegan
                  </h1>
                </div>
              </Link>
            </div>
            <nav className="hidden lg:flex items-center gap-1 bg-white/50 border border-[#e3d6c5]/80 rounded-full p-1 shadow-inner">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      isActive
                        ? "bg-[#7b4d2a] text-white shadow"
                        : "text-[#5c3316] hover:text-[#7b4d2a]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/cari"
                className="text-[#7b4d2a] hover:text-[#5c3316] transition rounded-full border border-transparent hover:border-[#d1b799] p-2"
              >
                <Search size={22} />
              </Link>
              <Link
                href="/keranjang"
                className="text-[#7b4d2a] hover:text-[#5c3316] transition relative rounded-full border border-transparent hover:border-[#d1b799] p-2"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#c45e3a] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden text-[#7b4d2a] hover:text-[#5c3316] transition rounded-full border border-transparent hover:border-[#d1b799] p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="hidden md:block lg:hidden fixed top-[88px] left-0 right-0 bg-white/95 backdrop-blur-2xl border-b border-[#e3d6c5] shadow-2xl z-40">
          <nav className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition ${
                    isActive
                      ? "bg-[#7b4d2a] text-white shadow"
                      : "bg-white/70 border border-transparent hover:border-[#e3d6c5] text-[#5c3316]"
                  }`}
                >
                  <span>{link.label}</span>
                  <ChevronRight size={18} className="opacity-70" />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

