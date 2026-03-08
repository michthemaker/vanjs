import type { PluginOption } from "vite";
import { vanjsRefresh, type VanJSHMROptions } from "./plugin";

type Options = {
  hmr?: boolean | VanJSHMROptions | undefined;
};

export default function vanjs(options: Options = { hmr: {
	smartStateChecking: true
} }) {
  const plugins: PluginOption[] = [];
  if (options.hmr)
    plugins.push(
      vanjsRefresh(typeof options.hmr === "boolean" ? undefined : options.hmr)
    );

  return plugins;
}
