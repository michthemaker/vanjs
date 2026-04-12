# @michthemaker/vanjs

## 0.4.0

### Minor Changes

- ae65269: Added dedicated SVG and MathML element support

  VanJS now provides specialized tag creation for SVG and MathML elements through `van.svgTags` and `van.mathmlTags`, giving you proper type safety and element creation for graphics and mathematical markup alongside regular HTML elements.

  ```typescript
  const { svg, path, circle } = van.svgTags;
  const { div, h1, button } = van.tags;
  const { math, mi, mo } = van.mathmlTags;

  // Create SVG graphics
  svg(
    {
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
    },
    path({ d: "M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" })
  );

  // Create mathematical notation
  math(mi("x"), mo("+"), mi("y"));
  ```

- ae65269: Improved type definitions for DOM element properties

  Rewrote the VanJS type system to provide better type resolution when setting attributes and properties on DOM elements. This gives you more accurate autocompletion and compile-time checks when using `van.tags`.

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
