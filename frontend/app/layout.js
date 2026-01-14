import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "../components/Toast";
import OnlineCheck from "../components/OnlineCheck";

// Font bawaan Next.js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata halaman
export const metadata = {
  title: "Batik Cindur Batam",
  description: "Aplikasi PWA e-Commerce Batik Cindur Batam",
};

// Layout utama
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* ✅ Tambahkan Material Icons agar ikon di form register muncul */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#704d31" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Cindur Batik" />
        {/* Viewport untuk mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#fefaf6] text-[#5a3921]`}
      >
        <OnlineCheck />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
