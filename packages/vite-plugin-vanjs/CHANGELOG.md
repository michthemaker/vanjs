# @michthemaker/vite-plugin-vanjs

## 0.2.0

### Minor Changes

- ae65269: Improved error display during hot module replacement

  Error messages during development now display in a better-styled container during hot module replacement, making debugging issues easier to spot and read.

- ae65269: Improved context support during Hot Module Replacement (HMR)

  - **Stable contexts across reloads**: `createContext()` is intercepted and keyed by `hmrId`, so the same context object is reused between HMR updates.
  - **Context snapshot + replay**: active context stacks are captured on `registerRender` and replayed on `rerender`, allowing `useContext` to keep working even when called outside the original render call tree.

- ae65269: Better handling for multiple and aliased exports

  - Multiple named exports like `export { Foo, Bar }` are now correctly preserved during transformation.
  - Aliased exports such as `export { Foo as Bar }` now generate the correct wrapper and transform logic.

### Patch Changes

- ae65269: Fixed duplicate export statements during hot reload

  The Vite plugin was incorrectly duplicating export statements like `export { App }` when processing components for hot module replacement. This has been resolved, ensuring clean exports without duplication.

## 0.1.2

### Patch Changes

- dfbe3a0: Added `vite` to dependency for inclusion in registry downloads

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
