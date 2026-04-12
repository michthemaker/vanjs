---
"@michthemaker/vite-plugin-vanjs": minor
---

Better handling for multiple and aliased exports

- Multiple named exports like `export { Foo, Bar }` are now correctly preserved during transformation.
- Aliased exports such as `export { Foo as Bar }` now generate the correct wrapper and transform logic.
