# @michthemaker/vite-plugin-vanjs

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@michthemaker/vite-plugin-vanjs.svg?style=flat)](https://www.npmjs.com/package/@michthemaker/vite-plugin-vanjs) [![bundle size](https://img.shields.io/bundlephobia/minzip/@michthemaker/vite-plugin-vanjs)](https://bundlephobia.com/package/@michthemaker/vite-plugin-vanjs) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

The official Vite plugin for [VanJS](https://github.com/michthemaker/vanjs) that brings **Hot Module Replacement** to your components — edit them in a running app without losing state.

---

## Installation

```bash
npm install @michthemaker/vite-plugin-vanjs -D
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vanjs from "@michthemaker/vite-plugin-vanjs";

export default defineConfig({
  plugins: [vanjs()],
});
```

---

## How it works

The plugin transforms your component files at dev time to wire up HMR automatically. When you save a file, only the affected components re-render — state is preserved across updates.

```ts
// What you write
export const Counter = () => {
  const count = van.state(0);
  return div(button({ onclick: () => count.val++ }, count));
};

// What the plugin wires up (simplified)
export const $$__hmr__Counter = () => { ... };
export const Counter = (props) =>
  __VAN_HMR__.registerRender('src/counter.ts:Counter', $$__hmr__Counter, props);

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) __VAN_HMR__.rerender('src/counter.ts:Counter', newModule.$$__hmr__Counter);
  });
}
```

None of this touches your production build — it's dev-only.

---

## Rules for HMR to work

For the plugin to detect and wire up a component, follow these rules:

**1. Components must be arrow functions**

```ts
// ✅ supported
export const Button = (props) => div(...);
export const Button = async (props) => div(...);

// ❌ not supported
export function Button(props) { return div(...); }
```

**2. Components must use `van.tags`**

```ts
const { div, button } = van.tags;

// ✅ detected — uses a van tag
export const Card = () => div("hello");

// ❌ not detected — no van tags used
export const helper = () => ({ foo: "bar" });
```

**3. Use `const`, not `let` or `var`**

```ts
// ✅
const Counter = () => div(...);

// ❌
let Counter = () => div(...);
```

**4. All export styles are supported**

```ts
export const Counter = () => div(...);          // ✅
export default Counter;                          // ✅
export { Counter };                              // ✅
export { Counter as MyCounter };                 // ✅
export { Counter, Button };                      // ✅
```

---

## Options

```ts
vanjs({
  hmr: {
    include: /\.[jt]s$/, // files to transform (default: all .js/.ts)
    exclude: /node_modules/, // files to skip
    entryMatch: /main\.[jt]s$/, // your app entry file(s)
  },
});
```

---

## State preservation

`van.state()` are preserved across HMR updates automatically — no extra setup needed.

```ts
const count = van.state(0); // survives hot reloads
const doubled = van.derive(() => count.val * 2); // not preserved (need to re-run)
```

---

> **Note:** This plugin is for development only. All transforms are stripped in production builds, leaving your original source intact and fully tree-shakeable.
