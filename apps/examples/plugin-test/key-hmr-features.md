# VanJS HMR — Key Features Tracker

> Strategy: manually prove features work in `plugin-test` first, then move
> the runtime into `vite-plugin-vanjs/src/plugin.ts` as a virtual module + code transform.

---

## Current Implementation (Proven Working)

### Component Pattern (No Props)

Each component file:

1. Imports `__VAN_HMR__` from `./hmr-runtime`
2. Uses `__VAN_HMR__.createState(id, initial)` instead of `van.state()`
3. **Exports the component function** (not a wrapper element)
4. Exports a factory function that calls `__VAN_HMR__.registerRender(id, componentFn)`
5. Uses `hot.accept((newModule) => ...)` to get fresh component reference (avoids closure staleness)

```ts
// counter.ts
export const CounterComponent = () => {
  const count = __VAN_HMR__.createState('counter.ts:count', 0);
  return div(...);
};

export const CounterSection = () =>
  __VAN_HMR__.registerRender('counter.ts:CounterSection', CounterComponent);

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender('counter.ts:CounterSection', newModule.CounterComponent);
    }
  });
}
```

### Component Pattern (With Props)

For components that accept props:

1. Component function accepts props parameter
2. Factory function passes props to `registerRender`
3. Props are stored in render slot and passed through on re-renders
4. Props updates from call site (e.g., `main.ts`) are automatically applied on HMR

```ts
// members.prod.ts
export const MembersComponent = ({ buttonTitle }: { buttonTitle: string }) => {
  const members = __VAN_HMR__.createState('members.prod.ts:members', []);
  return div(
    button({ onclick: ... }, buttonTitle),  // props used here
    ...
  );
};

export const MembersSection = (props: { buttonTitle: string }) =>
  __VAN_HMR__.registerRender('members.prod.ts:MembersSection', MembersComponent, props);

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Props come from stored slot, updated when main.ts changes call site
      __VAN_HMR__.rerender('members.prod.ts:MembersSection', newModule.MembersComponent);
    }
  });
}
```

**Call site in `main.ts`:**

```ts
MembersSection({ buttonTitle: "Add Member" }); // props passed here
```

### Main Entry Pattern

```ts
// main.ts
export const App = () => div(..., CounterSection(), MembersSection());

if (!__VAN_HMR__.renderSlots.has('main.ts:App')) {
  van.add(document.body, ...__VAN_HMR__.registerRender('main.ts:App', App));
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) __VAN_HMR__.rerender('main.ts:App', newModule.App);
  });
}
```

### HMR Runtime (`hmr-runtime.ts`)

Persisted on `window.__VAN_HMR__` across module reloads:

- **`stateRegistry`** — Map of `id → State`, survives HMR
- **`renderSlots`** — Map of `id → { startMarker, endMarker, props }`, stable DOM anchor points + props storage
- **`createState(id, initial)`** — creates or retrieves state by ID
- **`registerRender(id, fn, props?)`** — creates comment markers, stores props, returns `[start, element, end]`
  - On detached markers (parent slot cleared them): re-renders fresh content with stored/new props
- **`rerender(id, fn, props?)`** — clears between markers, updates stored props if provided, inserts new element with props
- **`clearBetweenMarkers(slot)`** — removes nodes between markers (works detached or attached)

---

## Tested & Working ✅

| Feature                               | Where                       | Notes                                                                 |
| ------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| **Primitive state preservation**      | `counter.ts`                | `counter`, `textInput` survive reload                                 |
| **Array state preservation**          | `members.ts`                | `cellMembers`, `cars` arrays survive reload                           |
| **Single-save HMR updates**           | all files                   | No double-save required — `newModule` pattern fixes closure staleness |
| **Nested render slots**               | `main.ts` → `counter.ts`    | Parent clears don't break children — detached markers re-render fresh |
| **Multi-file HMR isolation**          | `counter.ts` / `members.ts` | Editing one doesn't reload the other                                  |
| **Reactive list rendering**           | `members.ts`                | Array children via comment markers (from `reactive-lists.ts`)         |
| **Text input two-way binding**        | `counter.ts`                | Reactive `value` + `oninput`, state preserved                         |
| **Main entry HMR without duplicates** | `main.ts`                   | Guard check prevents re-appending on HMR                              |
| **Scroll position preservation**      | all                         | Granular updates don't touch scroll container                         |
| **Comment marker stability**          | all                         | Markers persist across reloads, enable surgical DOM updates           |
| **Component props support**           | `members.prod.ts`           | Props stored in render slots, updated from call site on HMR           |
| **Props reactivity on HMR**           | `main.ts` → `members.prod`  | Editing props in call site updates component without losing state     |
| **Error boundaries**                  | `hmr-runtime.ts`            | Component throw → old DOM preserved + error overlay, auto-recovers   |
| **Log level control**                 | `hmr-runtime.ts`            | `quiet` / `summary` (default) / `verbose`, runtime-switchable        |

---

## Key Learnings

### 1. Closure Staleness in `hot.accept`

**Problem:** Callbacks close over OLD function references from previous module execution.

**Solution:** Use `hot.accept((newModule) => ...)` and reference `newModule.ComponentFn`.

### 2. Nested Render Slots

**Problem:** Parent `rerender` clears between markers, detaching child markers + content.

**Solution:** `registerRender` detects detached markers (`!startMarker.isConnected`) and re-renders fresh content.

### 3. Main Entry Duplication

**Problem:** `main.ts` re-executes on HMR, `van.add` appends duplicate DOM.

**Solution:** Guard initial mount with `if (!__VAN_HMR__.renderSlots.has(id))`.

### 4. Comment Markers > Wrapper Divs

**Why:** Plugin can inject comment-marker logic universally. Can't inject `document.getElementById` patterns.

### 5. Scroll Restoration Is Free

Granular DOM updates (replace nodes between markers) don't touch scroll containers. Parent scroll offset preserved automatically.

### 6. Component Props Flow

**Problem:** Props change between HMR updates (e.g., editing call site in `main.ts`).

**Solution:** Store props in `renderSlots` alongside markers. On `registerRender`, store props. On `rerender`, update stored props if provided, else use existing. Component always renders with latest props from call site or stored props.

**Flow:**

```
Initial: main.ts calls MembersSection({ buttonTitle: "Add" })
  → registerRender stores props in slot
  → component renders with props

Edit main.ts: change to { buttonTitle: "Add New" }
  → main.ts re-executes
  → registerRender called with NEW props
  → props updated in slot
  → component re-renders with NEW props + OLD state ✓

Edit members.prod.ts: change component code
  → hot.accept fires
  → rerender called WITHOUT props (uses stored props from slot)
  → component re-renders with OLD props + OLD state ✓
```

---

## Known Gaps / Planned Features

### Phase 1 — Correctness ✅

- [x] **`van.derive` preservation** — Derived states tracked in `derivedRegistry`, return existing to avoid double-listeners
- [x] **Multiple component instances** — Auto-increment instance index (`:0`, `:1`), reuse orphaned slots via `freshlyDisconnected` flag
- [x] **State cleanup/GC** — Periodic cleanup (30s) removes disconnected slots + associated state/derived entries

### Phase 2 — Developer Experience ✅

- [x] **Error boundaries during HMR** — try/catch in `rerender()`, old DOM restored on error, styled error overlay (dismissible via Esc/button), auto-dismissed on next successful save
- [x] **Console log cleanup** — `logLevel` property (`'quiet'` | `'summary'` | `'verbose'`), default `'summary'`, controllable at runtime via `__VAN_HMR__.logLevel`
- [x] **Dynamic composition changes** — Reordering, replacing, conditional rendering, deeply nested add/remove all working

### Phase 3 — Plugin Automation

- [ ] **Auto-inject `virtual:vanjs-hmr-runtime`** — Remove manual import from every file
- [ ] **Auto-wrap `van.state()` calls** → `__VAN_HMR__.createState('file:line:col', ...)`
  - Stable positional IDs: hash of file path + AST node position
- [ ] **Auto-wrap component exports** — Detect `export const Component = () => ...` and inject `registerRender`
- [ ] **Auto-append `hot.accept` with `newModule` pattern**
- [ ] **Inline runtime as virtual module string** in `plugin.ts`

---

## Current File Structure

```
apps/examples/plugin-test/src/
  hmr-runtime.ts       ← Manual runtime (source of truth)
  counter.ts           ← Counter + TextInput (primitive states, no props)
  members.ts           ← Members + Cars (array states, reactive lists, no props)
  members.prod.ts      ← Members with props (buttonTitle)
  main.ts              ← App composition with nested slots + props passing

packages/vite-plugin-vanjs/src/
  plugin.ts            ← Target for Phase 3 automation
  index.ts             ← Plugin entry
```

---

## Next Steps

1. Test `van.derive` preservation (add derived state to counter)
2. Test multiple component instances (render `Counter()` twice)
3. Document plugin injection patterns for Phase 3
4. Move working runtime to `plugin.ts` as `HMR_RUNTIME_CODE` string
