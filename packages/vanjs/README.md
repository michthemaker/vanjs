# VanJS

A lightweight reactive UI framework that works directly with the real DOM — no virtual DOM, no compiler, no magic. Just JavaScript.

---

## Core Concepts

VanJS has four primitives. That's it.

```ts
import van from "vanjs";

const { div, button, p } = van.tags;
const state = van.state;
const derive = van.derive;
const add = van.add;
```

---

## `van.state(initialValue)`

Creates a reactive state object. Reading `.val` inside a binding or derive tracks it as a dependency. Writing `.val` triggers updates.

```ts
const count = van.state(0);

count.val; // read
count.val = 5; // write — triggers reactive updates
count.oldVal; // previous value before last update
count.rawVal; // raw value, no dependency tracking
```

---

## `van.derive(fn)`

Creates a computed value that reactively depends on states read inside `fn`. Re-runs automatically when dependencies change.

```ts
const count = van.state(0);
const doubled = van.derive(() => count.val * 2);

count.val = 3;
doubled.val; // 6 — automatically updated
```

Think of it as `useMemo` — not `useEffect`. It's for **computed values**, not side effects. That said, side effects inside `derive` are valid since components run once:

```ts
van.derive(() => {
  document.title = `Count: ${count.val}`;
});
```

---

## `van.tags`

A proxy that creates real DOM elements. Pass an optional props object as the first argument, followed by children.

```ts
const { div, button, h1, input } = van.tags;

// Static
div({ class: "container" }, h1("Hello"));

// Reactive props — pass a function, it auto-derives
div({ class: () => (count.val > 5 ? "high" : "low") });

// Reactive children — pass a state directly
p(count); // re-renders when count changes

// Event handlers
button({ onclick: () => count.val++ }, "Click me");
```

### Namespaced tags

```ts
const { svg, circle } = van.tags("http://www.w3.org/2000/svg");
```

---

## `van.add(dom, ...children)`

Appends children to an existing DOM element. Supports reactive state, functions, strings, nodes, and nested arrays.

```ts
const app = document.getElementById("app");

van.add(
  app,
  h1("Counter"),
  p(() => `Count is: ${count.val}`),
  button({ onclick: () => count.val++ }, "+")
);
```

---

## `van.hydrate(dom, fn)`

Hydrates an existing DOM node with reactive behavior — useful for SSR or pre-rendered HTML.

```ts
const existing = document.getElementById("counter");
van.hydrate(existing, (dom) => p(`Count: ${count.val}`));
```

---

## Reactive Lists

Arrays returned from bindings are handled as **list bindings** — efficient DOM diffing for dynamic lists using start/end comment markers.

```ts
const items = van.state(["a", "b", "c"]);

div(() => items.val.map((item) => p(item)));
// → updates only the changed nodes, not the whole div
```

---

## Garbage Collection

VanJS automatically cleans up bindings and listeners whose DOM nodes are no longer connected. GC runs every **1000ms** by default — disconnected nodes stop tracking state changes automatically. No manual cleanup needed.

---

## No Lifecycle Hooks

By design. Since component functions run **once** and return real DOM, there's no render loop to escape from:

```ts
const UserCard = ({ id }) => {
  const user = van.state(null);

  // Side effects go directly in the component body — runs once on mount
  fetch(`/api/users/${id}`).then((d) => (user.val = d));

  return div(() => (user.val ? p(user.val.name) : p("Loading...")));
};
```

No `useEffect`. No cleanup functions. No rules to break.

---

## Full Example

```ts
import van from "vanjs";

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

> VanJS is intentionally minimal. The entire runtime fits in a few KB — no build step, no compiler, no framework DSL. Just reactive state + real DOM.
