# @michthemaker/vite-plugin-vanjs

## 0.1.1

### Patch Changes

- c9e0bdb: - Fix README.md content to cater to @michthemaker/vite-plugin-vanjs
  - Use .ts file extension for all source imports for consistency
  - Use `dist` folder in dev to mirror production build output
- 28b734b: Added necessary files to `files` field in package `package.json`
- d300d21: Added repository subdirectory in package.json

## 0.1.0

### Minor Changes

- 3570fc5: Initial release of the official VanJS Vite plugin providing Hot Module Replacement for VanJS components.
  - Automatic HMR wiring for named exports, default exports, and export { } syntax including aliases
  - State preservation across hot reloads using van.state() identity tracking
  - Shape-based state reset — when state initial value type changes across reloads, stale state is discarded automatically
  - van.derive() always re-runs fresh on every HMR update
  - Supports async arrow functions, TypeScript return type annotations, and generic components
  - Error overlay with DOM preservation when a component throws during HMR
  - Automatic GC for disconnected render slots
  - Entry file and submodule transforms handled separately
