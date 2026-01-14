"use client";
import { useEffect, useState } from "react";

/**
 * Komponen Push Notification untuk PWA
 * Opsional - hanya aktif jika user mengizinkan
 */
export default function PushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Cek apakah browser mendukung service worker dan push notification
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      checkPermission();
    }
  }, []);

  const checkPermission = async () => {
    if ("Notification" in window) {
      const perm = Notification.permission;
      setPermission(perm);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser Anda tidak mendukung notifikasi");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === "granted") {
        // Register service worker untuk push notification
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Subscribe untuk push notification
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
            ),
          });

          setSubscription(sub);
          
          // Simpan subscription ke localStorage (untuk demo)
          localStorage.setItem("pushSubscription", JSON.stringify(sub));
          
          alert("✅ Notifikasi berhasil diaktifkan! Anda akan menerima update tentang produk baru dan promo.");
        }
      } else if (permission === "denied") {
        alert("❌ Notifikasi ditolak. Anda bisa mengaktifkannya lagi melalui pengaturan browser.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      alert("Terjadi error saat mengaktifkan notifikasi.");
    }
  };

  // Helper function untuk convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    if (!base64String) return null;
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Jangan render jika tidak didukung
  if (!isSupported) {
    return null;
  }

  // Jangan tampilkan jika sudah granted
  if (permission === "granted") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-green-800">
            🔔 Notifikasi aktif
          </p>
        </div>
      </div>
    );
  }

  // Tampilkan tombol untuk request permission
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-[#e3d6c5] rounded-lg p-4 shadow-lg">
        <p className="text-sm text-[#5c3316] mb-3">
          🔔 Aktifkan notifikasi untuk mendapatkan update produk baru dan promo?
        </p>
        <div className="flex gap-2">
          <button
            onClick={requestPermission}
            className="flex-1 bg-[#7b4d2a] text-white text-sm py-2 px-4 rounded-lg hover:bg-[#5c3316] transition-colors"
          >
            Aktifkan
          </button>
          <button
            onClick={() => {
              const el = document.querySelector(".push-notification-banner");
              if (el) el.style.display = "none";
            }}
            className="px-4 py-2 text-sm text-[#5c3316] hover:text-[#7b4d2a] transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}

