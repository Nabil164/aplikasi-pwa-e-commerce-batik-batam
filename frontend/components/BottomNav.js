"use client";
import { Home, Folder, ShoppingCart, Heart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import api from "../lib/axios";

export default function BottomNav() {
  const pathname = usePathname();
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
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  // Don't show on auth pages or payment pages
  const hideOnPages = ["/login", "/register", "/pembayaran", "/pembayaran-berhasil"];
  if (hideOnPages.some(page => pathname.startsWith(page))) {
    return null;
  }

  const navItems = [
    { name: "Beranda", icon: Home, href: "/Beranda" },
    { name: "Kategori", icon: Folder, href: "/kategori" },
    { name: "Keranjang", icon: ShoppingCart, href: "/keranjang", count: cartCount },
    { name: "Wishlist", icon: Heart, href: "/wishlist" },
    { name: "Profil", icon: User, href: "/profil" },
  ];

  return (
    <div className="md:hidden fixed inset-x-0 bottom-3 z-50 px-4">
      <nav className="relative bg-white/90 backdrop-blur-2xl border border-[#e3d6c5] shadow-[0_18px_40px_-24px_rgba(91,55,23,0.65)] rounded-3xl px-3 py-2 flex items-center justify-between safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center text-center text-[11px] font-medium relative px-2 py-2 min-w-[54px]"
            >
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow"
                    : "text-[#7b4d2a]/70"
                }`}
              >
                <Icon size={20} />
                {item.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#c45e3a] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                )}
              </div>
              <span
                className={`mt-1 transition ${
                  isActive ? "text-[#5c3316] font-semibold" : "text-[#5c3316]/70"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
