# VanJS HMR — Key Features Tracker

> Strategy: manually prove features work in `plugin-test` first, then move
> the runtime into `vite-plugin-vanjs/src/plugin.ts` as a virtual module + code transform.

---

## Current Approach

Each component file manually:

1. Imports `__VAN_HMR__` from `./hmr-runtime`
2. Uses `__VAN_HMR__.createState(id, initial)` instead of `van.state()`
3. Calls `__VAN_HMR__.registerRender(id, fn)` to mount and re-mount on HMR
4. Creates a stable wrapper `div` with a fixed DOM `id` to avoid re-parenting
5. Exports the wrapper element (not a component call) so `main.ts` appends it once

The runtime (`hmr-runtime.ts`) is persisted on `window.__VAN_HMR__` so it
survives Vite module re-execution during HMR.

---

## Tested & Working ✅

| Feature                                         | Where                       | Notes                                                        |
| ----------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| Primitive state preservation across HMR         | `counter.ts`                | `counter`, `textInput` survive reload                        |
| Array state preservation across HMR             | `members.ts`                | `cellMembers`, `cars` survive reload                         |
| Component re-render on save (clear + re-mount)  | both                        | `registerRender` clears `innerHTML`, re-runs fn              |
| Multi-file HMR isolation                        | `counter.ts` / `members.ts` | each file self-accepts; editing one doesn't reload the other |
| Reactive list rendering (array children)        | `members.ts`                | uses comment-node markers from `reactive-lists.ts`           |
| Text input two-way binding                      | `counter.ts`                | reactive `value` + `oninput`                                 |
| `van.state` monkey-patch via `window` singleton | `hmr-runtime.ts`            | wraps `van.state` + `van.add` once, persists across reloads  |
| Stable wrapper div pattern                      | both                        | fixed DOM `id` prevents element loss on re-render            |

---

## Known Gaps / Bugs 🐛

- **`registerRender` uses `innerHTML = ''`** — nukes all children including reactive
  comment markers; any `van.derive` or reactive binding that references a
  detached node will leak until GC cycle runs.
- **`stateRegistry` never shrinks** — removed components leave dead state in the
  Map forever. Need a cleanup pass keyed on connected-ness.
- **`van.add` wrap tracks `currentRenderContext`** but the context is a single
  string — concurrent/nested renders would corrupt it. Not a Vite HMR concern
  now but will be when the plugin injects this into arbitrary call trees.
- **Manual IDs are fragile** — `'counter.ts:counter'` is a hand-written string;
  rename the file and state is lost. The plugin must auto-generate stable IDs.

---

## Features To Add (Ordered by Priority)

### Phase 1 — Correctness

- [ ] **`van.derive` preservation** — `derive` creates a derived `State`; if the
      source states survive HMR but the derived state is re-created, listeners
      double-up. Need to track derived states by ID too or re-derive after reload.
- [ ] **Multiple instances of the same component** — two `Counter()` calls in
      the same parent currently share the same `registerRender` slot and clobber
      each other. Need per-instance keys (e.g. `counter:0`, `counter:1`).
- [ ] **Proper re-render without `innerHTML = ''`** — replace the wrapper's
      children using DOM diffing or FLIP: record old root element, run component fn,
      `replaceChild(newRoot, oldRoot)`. Preserves sibling nodes and avoids nuking
      unrelated reactive markers.

### Phase 2 — Developer Experience

- [ ] **Error boundaries during HMR** — if the new component fn throws, keep
      the old DOM + state intact and show an overlay error. Currently a throw
      leaves the container empty.
- [ ] **HMR for `main.ts` composition changes** — editing which sections are
      included in `main.ts` should add/remove sections without full reload.
- [ ] **Devtools log consolidation** — noisy `console.log` on every state
      restore; collapse into a single summary line per HMR cycle.
- [ ] **Cross-file state dependencies** — `state` created in one file, read
      in another. Registry key must be file-scoped to avoid collisions.

### Phase 3 — Plugin Automation (move to `plugin.ts`)

- [ ] **Auto-inject `hmr-runtime` import** as `virtual:vanjs-hmr-runtime`
      (MagicString prepend), remove manual import from every file.
- [ ] **Auto-wrap `van.state()` calls** → `__VAN_HMR__.createState('file:N', ...)`
      with stable positional IDs derived from file path + call-site offset.
- [ ] **Auto-wrap `registerRender`** — detect top-level component call patterns
      and inject `registerRender` wrappers so user code stays clean.
- [ ] **Auto-append `import.meta.hot.accept()`** to every transformed file.
- [ ] **Virtual module** — inline current `hmr-runtime.ts` as the
      `HMR_RUNTIME_CODE` string in `plugin.ts` (already stubbed, needs the
      updated runtime from Phase 1–2).

---

## File Map
