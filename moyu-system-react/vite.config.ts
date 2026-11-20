import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function strip(value?: string) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = strip(env.VITE_API_URL) || "/admin";
  const baseUrl = strip(env.VITE_BASE_URL) || "http://localhost:3000";

  return {
    base: strip(env.VITE_BASE_PATH) || "/",
    css: {
      devSourcemap: true,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".json"],
    },
    server: {
      host: true,
      port: Number(env.VITE_PORT) || 5173,
      open: env.VITE_OPEN === "true",
      proxy: {
        [apiUrl]: {
          target: baseUrl.replace(/:\/\/localhost\b/i, "://127.0.0.1"),
          changeOrigin: true,
          secure: false,
          timeout: 0,
          proxyTimeout: 0,
          // 页面与接口同属 /admin：浏览器打开页面时不要转到后端
          bypass(req) {
            const accept = req.headers.accept || "";
            if (accept.includes("text/html")) return req.url || "/index.html";
          },
          configure: (proxy) => {
            proxy.on("proxyReq", (_proxyReq, req) => {
              req.socket?.setTimeout(0);
              req.socket?.setNoDelay(true);
              req.socket?.setKeepAlive(true);
            });
            proxy.on("error", (err, _req, res) => {
              console.error("[vite proxy]", err.message);
              if (
                res &&
                "headersSent" in res &&
                !res.headersSent &&
                typeof res.writeHead === "function"
              ) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ code: 502, message: "proxy error" }));
              }
            });
          },
        },
      },
    },
    preview: {
      host: true,
      port: Number(env.VITE_PORT) || 4173,
    },
    build: {
      outDir: strip(env.VITE_OUT_DIR) || "dist",
      sourcemap: env.VITE_SOURCEMAP === "true",
    },
  };
});
