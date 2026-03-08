# VanJS &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@michthemaker/vanjs.svg?style=flat)](https://www.npmjs.com/package/@michthemaker/vanjs) [![bundle size](https://img.shields.io/bundlephobia/minzip/@michthemaker/vanjs)](https://bundlephobia.com/package/@michthemaker/vanjs) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

VanJS is a lightweight reactive UI framework that works directly with the real DOM.

- **No Virtual DOM:** VanJS binds state directly to real DOM nodes. When state changes, only the affected nodes update — no diffing, no reconciliation, no overhead.
- **No Compiler:** Write plain JavaScript or TypeScript. No JSX, no template syntax, no build-time magic. Your components are just functions that return DOM elements.
- **Reactive by Default:** `van.state()` and `van.derive()` give you fine-grained reactivity out of the box. Pass state directly to tags or derive computed values — updates propagate automatically.
- **Tiny by Design:** The entire runtime fits in a few KB. No dependencies, no framework DSL, no abstractions you didn't ask for.

## Documentation

- [Quick Start](#quick-start)
- [Core Primitives](#core-primitives)
- [Reactive State](#reactive-state)
- [Reactive Lists](#reactive-lists)
- [API Reference](#api-reference)
- [Contributing Guide](./CONTRIBUTING.md)

---

## Quick Start

```bash
npm create-van-app
```

```ts
import van from "@michthemaker/vanjs";

const { div, p, button } = van.tags;

const App = () => {
  const count = van.state(0);
  return div(
    p(() => `Count: ${count.val}`),
    button({ onclick: () => count.val++ }, "+")
  );
};

van.add(document.body, App());
```

---

## Core Primitives

VanJS has four primitives. That's it.

```ts
import van from "@michthemaker/vanjs";

const { div, button, p } = van.tags; // create DOM elements
van.state(0); // reactive state
van.derive(() => count.val * 2); // computed values
van.add(document.body, App()); // mount to DOM
```

---

## Reactive State

`van.state(initialValue)` creates a reactive state object. Reading `.val` inside a binding or derive tracks it as a dependency. Writing `.val` triggers updates.

```ts
const count = van.state(0);

count.val; // read — tracked as dependency
count.val = 5; // write — triggers reactive updates
count.oldVal; // previous value before last update
count.rawVal; // raw value, no dependency tracking
```

`van.derive(fn)` creates a computed value that re-runs automatically when its dependencies change.

```ts
const count = van.state(0);
const doubled = van.derive(() => count.val * 2);

count.val = 3;
doubled.val; // 6 — updated automatically
```

---

## Reactive Lists

Arrays returned from bindings are handled as list bindings — efficient DOM updates for dynamic lists using start/end comment markers. Only changed nodes are updated, not the whole container.

```ts
const items = van.state(["apple", "banana", "cherry"]);

van.add(
  document.body,
  div(() => items.val.map((item) => p(item)))
);

// Add an item — only the new node is inserted
items.val = [...items.val, "date"];
```

---

## API Reference

| API                         | Description                     |
| --------------------------- | ------------------------------- |
| `van.state(init)`           | Create reactive state           |
| `van.derive(fn)`            | Create a computed value         |
| `van.tags`                  | Proxy for creating DOM elements |
| `van.add(dom, ...children)` | Mount children to a DOM element |

---

## Examples

Here is a full counter example:

```ts
import van from "@michthemaker/vanjs";

const { div, h1, p, button } = van.tags;

const Counter = () => {
  const count = van.state(0);
  const doubled = van.derive(() => count.val * 2);

  return div(
    h1("Counter"),
    p(() => `Count: ${count.val}`),
    p(() => `Doubled: ${doubled.val}`),
    button({ onclick: () => count.val++ }, "+"),
    button({ onclick: () => count.val-- }, "-")
  );
};

van.add(document.body, Counter());
```

---

## Contributing

Development happens in the open on GitHub. Bug fixes, improvements, and new ideas are welcome. Read the [contributing guide](./CONTRIBUTING.md) to learn about the development process and how to propose changes.

### Good First Issues

New to the codebase? Check out the [good first issues](https://github.com/michthemaker/vanjs/labels/good%20first%20issue) label for bugs with limited scope — a great place to start.

## License

VanJS is [MIT licensed](./LICENSE).
