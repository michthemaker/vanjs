import type { PluginOption } from "vite";
import { hmrPlugin, type VanJSHMROptions } from "./plugin.ts";

type Options = {
  hmr?: boolean | VanJSHMROptions | undefined;
};

export default function vanjs(options: Options = { hmr: true }) {
  const plugins: PluginOption[] = [];
  if (options.hmr)
    plugins.push(
      hmrPlugin(typeof options.hmr === "boolean" ? undefined : options.hmr)
    );

  return plugins;
}
