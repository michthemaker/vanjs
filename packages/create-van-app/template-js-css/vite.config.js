import { defineConfig } from "vite";
import { resolve } from "path";
import vanjs from "@michthemaker/vite-plugin-vanjs";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": resolve("./src/"),
      "@components": resolve("./components/"),
    },
  },
  plugins: [
    vanjs({
      hmr: {
        smartStateChecking: true,
      },
    }),
  ],
});
