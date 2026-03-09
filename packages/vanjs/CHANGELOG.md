# @michthemaker/vanjs

## 0.1.0

### Minor Changes

- 3570fc5: Initial release of VanJS — a lightweight reactive UI framework that works directly with the real DOM.
  - Fine-grained reactivity via van.state() and van.derive()
  - Real DOM element creation via van.tags proxy
  - Reactive list bindings with efficient DOM diffing using start/end comment markers
  - van.add() for mounting children to existing DOM elements
  - Automatic GC — disconnected nodes stop tracking state changes automatically
  - Reactive lists support
  - Strong types for attributes and event handlers
  - No virtual DOM, no compiler, no lifecycle hooks, no build step required
