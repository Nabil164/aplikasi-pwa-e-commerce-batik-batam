"use client";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem("pwa-install-dismissed") === "true") {
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 3 seconds
      setTimeout(() => {
        if (!sessionStorage.getItem("pwa-install-dismissed")) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed (iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.navigator.standalone === true;
    
    if (isIOS && !isInStandaloneMode) {
      // Show iOS install instructions after delay
      setTimeout(() => {
        if (!sessionStorage.getItem("pwa-install-dismissed")) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS instructions
      alert(
        "Untuk menginstall aplikasi:\n\n" +
        "1. Tap tombol Share (kotak dengan panah)\n" +
        "2. Pilih 'Add to Home Screen'\n" +
        "3. Tap 'Add'"
      );
      setShowPrompt(false);
      return;
    }

    // Show install prompt
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true");
    setDeferredPrompt(null);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in">
      <div className="glass-card rounded-[24px] border border-[#e3d6c5] bg-white/95 backdrop-blur-md shadow-lg p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-xl bg-[#fdf3ec]">
            <Download size={20} className="text-[#7b4d2a]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[#5c3316] mb-1">
              Install Aplikasi
            </h3>
            <p className="text-xs text-[#5c3316]/70 mb-3">
              Install aplikasi untuk akses lebih cepat dan bisa digunakan offline
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 luxury-button primary-button text-xs justify-center py-2"
              >
                <Download size={14} />
                Install Sekarang
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-lg border border-[#e3d6c5] text-[#5c3316] hover:bg-[#fefaf6] transition"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






