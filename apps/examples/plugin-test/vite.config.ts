import { defineConfig } from "vite";
import { resolve } from "path";
import vanjs from "@michthemaker/vite-plugin-vanjs";
import inspect from "vite-plugin-inspect";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": resolve("./src/"),
    },
  },
  plugins: [
    inspect(),
    vanjs({
      hmr: {
        smartStateChecking: true,
      },
    }),
  ],
});
