# VanJS &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@michthemaker/vanjs.svg?style=flat)](https://www.npmjs.com/package/@michthemaker/vanjs) [![bundle size](https://img.shields.io/bundlephobia/minzip/@michthemaker/vanjs)](https://bundlephobia.com/package/@michthemaker/vanjs) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

VanJS is a lightweight reactive UI framework that works directly with the real DOM.

- **No Virtual DOM:** VanJS binds state directly to real DOM nodes. When state changes, only the affected nodes update — no diffing, no reconciliation, no overhead.
- **No Compiler:** Write plain JavaScript or TypeScript. No JSX, no template syntax, no build-time magic. Your components are just functions that return DOM elements.
- **Reactive by Default:** `van.state()` and `van.derive()` give you fine-grained reactivity out of the box. Pass state directly to tags or derive computed values — updates propagate automatically.
- **Tiny by Design:** The entire runtime fits in a few KB. No dependencies, no framework DSL, no abstractions you didn't ask for.

## Installation

```bash
npx create-van-app
```

## Documentation

The documentation is divided into several sections:

- [Quick Start](#)
- [Core Primitives](#)
- [Reactive State](#)
- [Reactive Lists](#)
- [API Reference](#)
- [Contributing Guide](./CONTRIBUTING.md)

## Examples

Here is a simple counter to get you started:

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

This renders a live counter into the page. Notice there is no JSX, no compiler, and no framework runtime — just functions and real DOM.

## Contributing

Development happens in the open on GitHub. Bug fixes, improvements, and new ideas are welcome. Read the [contributing guide](./CONTRIBUTING.md) to learn about the development process and how to propose changes.

### Good First Issues

New to the codebase? Check out the [good first issues](https://github.com/michthemaker/vanjs/labels/good%20first%20issue) label for bugs with limited scope — a great place to start.

## License

VanJS is [MIT licensed](./LICENSE).
