import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: { theme_color: "hsl(131 30% 18%)" },
      devOptions: { enabled: true },
    }),
    tsconfigPaths(),
    tailwindcss(),
    TanStackRouterVite({}),
    react(),
  ],
});
