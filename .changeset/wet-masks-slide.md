---
"@michthemaker/vite-plugin-vanjs": minor
---

Improved context support during Hot Module Replacement (HMR)

- **Stable contexts across reloads**: `createContext()` is intercepted and keyed by `hmrId`, so the same context object is reused between HMR updates.
- **Context snapshot + replay**: active context stacks are captured on `registerRender` and replayed on `rerender`, allowing `useContext` to keep working even when called outside the original render call tree.
