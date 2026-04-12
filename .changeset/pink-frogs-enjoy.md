---
"@michthemaker/vite-plugin-vanjs": patch
---

Fixed duplicate export statements during hot reload

The Vite plugin was incorrectly duplicating export statements like `export { App }` when processing components for hot module replacement. This has been resolved, ensuring clean exports without duplication.
