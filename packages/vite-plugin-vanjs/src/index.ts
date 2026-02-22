import type { PluginOption } from "vite";
import { hmrPlugin, type VanJSHMROptions } from "./plugin";

type Options = {
  hmr?: boolean | VanJSHMROptions | undefined;
};

export default function vanjs(options: Options = {}) {
  const plugins: PluginOption[] = [];
  if (options.hmr)
    plugins.push(
      hmrPlugin(typeof options.hmr === "boolean" ? undefined : options.hmr)
    );

  return plugins;
}
