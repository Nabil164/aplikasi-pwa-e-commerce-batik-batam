"use client";
import { useRouter } from "next/navigation";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push("/");
    } else {
      alert("Anda masih offline. Pastikan koneksi internet aktif.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefaf6] p-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-6 rounded-full bg-[#fdf3ec]">
            <WifiOff size={64} className="text-[#7b4d2a]" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#5c3316] mb-3">
          Anda Sedang Offline
        </h1>
        <p className="text-[#5c3316]/70 mb-6">
          Koneksi internet Anda terputus. Beberapa fitur mungkin tidak tersedia.
        </p>
        <button
          onClick={handleRetry}
          className="luxury-button primary-button inline-flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Coba Lagi
        </button>
        <p className="text-xs text-[#5c3316]/60 mt-4">
          Aplikasi akan otomatis tersinkronisasi saat koneksi kembali aktif.
        </p>
      </div>
    </div>
  );
}


