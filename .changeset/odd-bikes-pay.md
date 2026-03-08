---
"@michthemaker/vanjs": minor
"@michthemaker/vite-plugin-vanjs": minor
---

Initial release of VanJS — a lightweight reactive UI framework that works directly with the real DOM.

- Fine-grained reactivity via van.state() and van.derive()
- Real DOM element creation via van.tags proxy
- Reactive list bindings with efficient DOM diffing using start/end comment markers
- van.add() for mounting children to existing DOM elements
- Automatic GC — disconnected nodes stop tracking state changes automatically
- Reactive lists support
- Strong types for attributes and event handlers
- No virtual DOM, no compiler, no lifecycle hooks, no build step required

Initial release of the official VanJS Vite plugin providing Hot Module Replacement for VanJS components.

- Automatic HMR wiring for named exports, default exports, and export { } syntax including aliases
- State preservation across hot reloads using van.state() identity tracking
- Shape-based state reset — when state initial value type changes across reloads, stale state is discarded automatically
- van.derive() always re-runs fresh on every HMR update
- Supports async arrow functions, TypeScript return type annotations, and generic components
- Error overlay with DOM preservation when a component throws during HMR
- Automatic GC for disconnected render slots
- Entry file and submodule transforms handled separately
