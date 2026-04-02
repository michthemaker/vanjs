---
"@michthemaker/vanjs": minor
---

Add Context API for logical state sharing across component trees

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
