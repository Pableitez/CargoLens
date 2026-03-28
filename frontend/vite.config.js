import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-tab.svg", "icons/**/*.svg"],
      devOptions: { enabled: true },
      manifest: {
        name: "CargoLens",
        short_name: "CargoLens",
        description: "Ocean container tracking — milestones, vessel, route, and timeline.",
        theme_color: "#070a0e",
        background_color: "#070a0e",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["leaflet", "react-leaflet"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
