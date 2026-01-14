import axios from "axios";

// ✅ UPDATED: Pakai Next.js API Routes (built-in)
// Development & Production: /api (sama-sama, karena Next.js handle routing)
const API_URL = "/api";

// Debug: Log API URL (hanya di development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🔗 API URL:", API_URL, "(Next.js API Routes)");
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: false, // Disable untuk menghindari CORS issue
  timeout: 30000, // 30 seconds timeout (diperpanjang untuk upload file)
});

// 🔒 Interceptor: tambahkan token auth otomatis kalau ada
api.interceptors.request.use(
  (config) => {
    // Hanya akses localStorage jika di browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Debug log
      if (process.env.NODE_ENV === "development") {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
          token: token ? "✅ Present" : "❌ Missing",
          timestamp: new Date().toISOString(),
        });
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// 🔄 Interceptor response: handle error global
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`📥 ${response.status} - ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    try {
      // Safely extract error properties
      const response = error?.response;
      const config = error?.config;
      const message = error?.message;
      const code = error?.code;
      const request = error?.request;
      
      // Determine error type
      let errorType = "unknown";
      if (code === "ERR_NETWORK" || code === "ECONNABORTED" || code === "ERR_INTERNET_DISCONNECTED" || !response) {
        errorType = "network";
      } else if (response?.status >= 500) {
        errorType = "server";
      } else if (response?.status >= 400) {
        errorType = "client";
      }
      
      // Build error info object safely
      const errorInfo = {
        type: errorType,
        code: code || "UNKNOWN",
        message: message || String(error) || "Unknown error occurred",
        timestamp: new Date().toISOString(),
      };

      // Add response info if available
      if (response) {
        errorInfo.status = response.status;
        errorInfo.statusText = response.statusText;
        try {
          errorInfo.data = response.data;
        } catch (e) {
          errorInfo.data = "Unable to parse response data";
        }
      }

      // Add request info if available
      if (config) {
        errorInfo.url = config.url || "unknown";
        errorInfo.method = config.method?.toUpperCase() || "UNKNOWN";
        errorInfo.baseURL = config.baseURL || "unknown";
      }

      // Add request object info for network errors
      if (request && !response) {
        try {
          errorInfo.requestInfo = {
            readyState: request.readyState,
            status: request.status,
          };
        } catch (e) {
          errorInfo.requestInfo = "Unable to parse request info";
        }
      }

      // Log error with fallback
      try {
        console.error("❌ API Error:", JSON.stringify(errorInfo, null, 2));
      } catch (e) {
        console.error("❌ API Error (fallback):", {
          type: errorType,
          code: code || "UNKNOWN",
          message: String(error),
        });
      }

      // Handle network errors
      if (errorType === "network") {
        try {
          console.error("🌐 Network Error Details:", {
            code: code || "UNKNOWN",
            message: message || "Network error",
            url: config?.url || "unknown",
            baseURL: config?.baseURL || "unknown",
            hint: "Check if the API server is running and accessible",
          });
        } catch (e) {
          console.error("🌐 Network Error (unable to log details)");
        }
      }

      // Jika token expired atau unauthorized, redirect ke login
      if (response?.status === 401) {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("userData");
            localStorage.removeItem("userRole");
            // Jangan redirect di halaman login/register
            if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
              window.location.href = "/login";
            }
          } catch (e) {
            console.error("Error handling 401 redirect:", e);
          }
        }
      }

      // Jika 500 error, log ke console dengan lebih detail
      if (response?.status === 500) {
        try {
          console.error("⚠️ Server Error (500):", JSON.stringify(response.data, null, 2));
          if (response.data?.hint) {
            console.error("💡 Hint:", response.data.hint);
          }
        } catch (e) {
          console.error("⚠️ Server Error (500): Unable to parse error data");
        }
      }

      // Enhance error object with additional info for better error handling
      try {
        error.errorInfo = errorInfo;
      } catch (e) {
        // If we can't add errorInfo, at least ensure error is rejectable
        console.warn("Could not enhance error object with errorInfo");
      }
      
      return Promise.reject(error);
    } catch (handlerError) {
      // Fallback if error handler itself fails
      console.error("❌ Error handler failed:", handlerError);
      console.error("❌ Original error:", String(error));
      return Promise.reject(error);
    }
  }
);

export default api;
