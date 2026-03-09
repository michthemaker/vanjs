---
"@michthemaker/vanjs": minor
---

Tags can now be created with a **ref** prop to get a reference to the underlying DOM element.

```ts
import { van, type Ref } from "@michthemaker/vanjs";

const { div } = van.tags;

const ref: Ref<HTMLDivElement> = { current: null };
return div({ ref });
```
