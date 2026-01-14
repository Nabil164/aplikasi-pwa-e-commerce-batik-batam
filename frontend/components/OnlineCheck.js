"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function OnlineCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip offline check for offline page itself
    if (pathname === "/offline") {
      return;
    }

    // Check if user is offline
    if (typeof window !== "undefined" && !navigator.onLine) {
      router.push("/offline");
      return;
    }

    // Listen for online/offline events
    const handleOnline = () => {
      // User is back online, can stay on current page or redirect to home
      if (pathname === "/offline") {
        router.push("/Beranda");
      }
    };

    const handleOffline = () => {
      // User went offline, redirect to offline page
      if (pathname !== "/offline") {
        router.push("/offline");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [router, pathname]);

  return null; // This component doesn't render anything
}

