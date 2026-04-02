# @michthemaker/vanjs

## 0.3.0

### Minor Changes

- c03c2e5: Add Context API for logical state sharing across component trees

  Introduces `createContext` and `useContext` functions that enable sharing reactive state without prop drilling. Context uses logical scoping (not DOM-based) and integrates seamlessly with VanJS's reactive state system.

  **New exports:**

  - `createContext<T>()`: Creates a new context object with a Provider method
  - `useContext<T>(context)`: Retrieves the current context value (must be called within a Provider)

  **Example usage:**

  ```typescript
  import van, { createContext, useContext } from "@michthemaker/vanjs";

  const { div, button } = van.tags;
  const ThemeContext = createContext<{ color: string }>();

  const theme = van.state({ color: "blue" });

  ThemeContext.Provider(theme, () => {
    const currentTheme = useContext(ThemeContext);
    return div(
      () => `Theme: ${currentTheme.val.color}`,
      button(
        {
          onclick: () => (theme.val = { color: "red" }),
        },
        "Change Theme"
      )
    );
  });
  ```

  **Features:**

  - Shallow reactivity: context values must be VanJS state objects
  - Supports nested providers of the same context
  - Type-safe with TypeScript generics
  - Throws helpful errors when used incorrectly

### Patch Changes

- c03c2e5: Add JSDoc documentation for Context API

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
