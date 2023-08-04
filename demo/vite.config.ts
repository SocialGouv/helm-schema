import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/helm-schema",
  plugins: [react()],
  define: {
    global: {},
    "process.env": {},
    __dirname: null,
  },
});
