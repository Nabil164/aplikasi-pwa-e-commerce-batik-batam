'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Selalu redirect ke login, tidak peduli sudah login atau belum
    // Setelah login/register selesai, akan redirect ke /Beranda
    router.push('/login');
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fefaf6]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#704d31]"></div>
      <p className="mt-4 text-[#5a3921]">Mengarahkan ke halaman login...</p>
    </main>
  );
}
