# @michthemaker/vanjs

## 0.2.0

### Minor Changes

- ec3a2b0: Tags can now be created with a **ref** prop to get a reference to the underlying DOM element.

  ```ts
  import { van, type Ref } from "@michthemaker/vanjs";

  const { div } = van.tags;

  const ref: Ref<HTMLDivElement> = { current: null };
  return div({ ref });
  ```

  A ref is just a plain JavaScript object with a `current` property that holds the DOM element.

### Patch Changes

- d300d21: - Added repository subdirectory in package.json
  - Use `dist` folder in dev to mirror production build output
- 28b734b: Added necessary files to `files` field in package `package.json`

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
