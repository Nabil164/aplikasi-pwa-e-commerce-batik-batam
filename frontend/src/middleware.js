import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token"); // ambil token dari cookie

  // Proteksi rute untuk halaman pembeli
  if (!token && req.nextUrl.pathname.startsWith("/beranda_pembeli")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Terapkan middleware hanya pada rute tertentu
export const config = {
  matcher: ["/beranda_pembeli/:path*"],
};
