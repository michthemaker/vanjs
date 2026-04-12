---
"@michthemaker/vanjs": minor
---

Added dedicated SVG and MathML element support

VanJS now provides specialized tag creation for SVG and MathML elements through `van.svgTags` and `van.mathmlTags`, giving you proper type safety and element creation for graphics and mathematical markup alongside regular HTML elements.

```typescript
const { svg, path, circle } = van.svgTags;
const { div, h1, button } = van.tags;
const { math, mi, mo } = van.mathmlTags;

// Create SVG graphics
svg({
  viewBox: "0 0 24 24",
  width: "24",
  height: "24"
},
  path({ d: "M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" })
);

// Create mathematical notation
math(mi("x"), mo("+"), mi("y"));
```
