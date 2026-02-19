import { defineConfig } from "vite";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@src": resolve("./src/"),
		},
	},
	plugins: [],
});
