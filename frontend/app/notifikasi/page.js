"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { Bell, Check, Trash2 } from "lucide-react";
import api from "../../lib/axios";

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Jika API belum tersedia, gunakan dummy data
      setNotifications([
        {
          id: 1,
          title: "Pesanan Diterima",
          message: "Pesanan #ORD001 telah diterima dan sedang diproses",
          type: "order",
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: "Produk Baru",
          message: "Batik motif baru telah tersedia! Cek sekarang",
          type: "product",
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          title: "Pembayaran Berhasil",
          message: "Pembayaran untuk pesanan #ORD002 telah diterima",
          type: "payment",
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      // Update local state saja jika API belum tersedia
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, isRead: true, is_read: true } : notif
        )
      );
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm("Hapus notifikasi ini?")) return;

    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Update local state saja jika API belum tersedia
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all as read by calling API for each unread notification
      const unreadNotifications = notifications.filter((n) => !(n.isRead || n.is_read));
      await Promise.all(
        unreadNotifications.map((notif) => api.put(`/notifications/${notif.id}`))
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Update local state saja jika API belum tersedia
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !(n.isRead || n.is_read)).length;

  return (
    <div className="min-h-screen bg-transparent pb-24 md:pb-0">
      <Navbar showBack />

      <div className="luxury-container space-y-8 md:space-y-10">
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-[#c08a3e]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b4d2a] to-[#c4986c] text-white shadow-lg">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316]">
                Notifikasi
              </h1>
              <p className="text-xs uppercase tracking-[0.4em] text-[#c08a3e] font-semibold">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="luxury-button text-sm">
              Tandai semua dibaca
            </button>
          )}
        </section>

        {loading ? (
          <div className="glass-card flex items-center justify-center rounded-[28px] border border-[#e3d6c5] bg-white/80 px-6 py-12 text-[#c08a3e]">
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="glass-card flex flex-col items-center gap-4 rounded-[28px] border border-[#e3d6c5] bg-white/85 px-6 py-12 text-center">
            <Bell size={48} className="text-[#c08a3e]" />
            <p className="text-lg font-semibold text-[#5c3316]">Tidak ada notifikasi</p>
            <p className="text-sm text-[#5c3316]/70">
              Notifikasi baru akan muncul di sini ketika ada pembaruan penting.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`glass-card rounded-[26px] border border-[#e3d6c5]/80 bg-white/80 px-5 py-5 shadow-[0_20px_60px_-45px_rgba(91,55,23,0.65)] transition hover:-translate-y-[1px] ${
                  !(notification.isRead || notification.is_read) ? "ring-1 ring-[#c08a3e]/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-sm font-semibold ${
                          !(notification.isRead || notification.is_read) ? "text-[#5c3316]" : "text-[#b08968]"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!(notification.isRead || notification.is_read) && (
                        <span className="floating-badge bg-[#7b4d2a] text-white border-transparent">
                          Baru
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#5c3316]/80 leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-[#b08968] uppercase tracking-[0.3em]">
                      {formatDate(notification.createdAt || notification.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!(notification.isRead || notification.is_read) && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="luxury-button text-xs"
                        title="Tandai dibaca"
                      >
                        <Check size={16} />
                        Dibaca
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="luxury-button text-xs text-[#c45e3a]"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>
                  </div>
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

