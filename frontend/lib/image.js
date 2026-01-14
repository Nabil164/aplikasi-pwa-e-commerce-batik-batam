const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://127.0.0.1:8000";

export function resolveImageUrl(path, fallback = "/logo_batik.jpg") {
  if (!path) return fallback;

  // Sudah URL absolut atau data URI
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Path ke storage Laravel
  if (path.startsWith("/storage/")) {
    return `${BACKEND_BASE_URL}${path}`;
  }

  // Path relatif lainnya (misal /images/..)
  if (path.startsWith("/")) {
    return path;
  }

  // Path tanpa leading slash, anggap berasal dari storage publik
  return `${BACKEND_BASE_URL}/${path}`;
}


