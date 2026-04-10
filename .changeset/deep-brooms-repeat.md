---
"@michthemaker/vanjs": minor
---

Separate functions for SVG and MathML Elements added

```typescript
const { svg, path } = van.svgTags;
const { div, h1, button } = van.tags;

svg({
  viewBox: "0 0 24 24",
  width: "15",
});
```
