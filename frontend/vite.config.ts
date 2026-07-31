import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Local dev builds into the Spring static dir so `mvn spring-boot:run` serves the
// SPA. In Docker we override VITE_BUILD_OUTDIR to keep the frontend build isolated
// in its own stage.
const outDir = process.env.VITE_BUILD_OUTDIR ?? "../src/main/resources/static";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
      "/oauth2": "http://localhost:8080",
      "/login": "http://localhost:8080",
    },
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
});
