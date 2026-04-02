import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import vitePluginSvgr from "vite-plugin-svgr";

//crear __firname compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginSvgr()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"), //Cunado veas @, interpretalo como /src
    },
  },
});
