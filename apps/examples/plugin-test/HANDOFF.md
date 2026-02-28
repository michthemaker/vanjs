# VanJS HMR - Session Handoff Document

## Project Overview

Building a **Hot Module Replacement (HMR) system** for VanJS that preserves component state across code edits without full page reloads. Strategy: manually prove features work in `plugin-test`, then automate with Vite plugin.

---

## Current Status: Phase 2 Complete ✅

All core correctness issues solved. System is fully functional for manual HMR.

### What Works

- ✅ **State preservation** (primitives, arrays, objects) across HMR
- ✅ **`van.derive` preservation** - no double-listeners
- ✅ **Multiple component instances** - independent state per instance
- ✅ **Nested render slots** - parent re-render doesn't break children
- ✅ **Component props** - reactive to call-site changes
- ✅ **Dynamic composition** - add/remove components preserves remaining state
- ✅ **State cleanup/GC** - 30s periodic cleanup of disconnected components
- ✅ **Scroll preservation** - automatic via granular DOM updates

---

## Architecture

### Comment Marker System

Instead of wrapper divs, we use comment nodes as stable DOM anchors:

```html
<!-- hmr:counter.ts:CounterSection:0:start -->
<div>counter UI here</div>
<!-- hmr:counter.ts:CounterSection:0:end -->
```

**Why:** Plugin can inject this universally. Can't inject `document.getElementById` patterns.

### Core Components

**`hmr-runtime.ts`** (persisted on `window.__VAN_HMR__`):

- `stateRegistry` - Map of `id → State`, survives HMR
- `derivedRegistry` - Map of `id → Derived`, survives HMR
- `renderSlots` - Map of `id → { startMarker, endMarker, props, freshlyDisconnected }`
- `reusedThisCycle` - Set tracking which slots were reused this render cycle

**Key Methods:**

- `createState(id, initial)` - scopes by `currentInstanceId`
- `createDerived(id, fn)` - scopes by `currentInstanceId`
- `registerRender(id, fn, props)` - creates slot with auto-increment instance index
- `rerender(id, fn, props)` - updates all matching instances
- `cleanup()` - GC for disconnected slots

### Component Pattern

```ts
// Component with state
export const CounterComponent = () => {
  const counter = __VAN_HMR__.createState('counter', 0);
  const doubled = __VAN_HMR__.createDerived('doubled', () => counter.val * 2);
  return div(...);
};

// Factory function
export const CounterSection = () =>
  __VAN_HMR__.registerRender('counter.ts:CounterSection', CounterComponent);

// HMR handler
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender('counter.ts:CounterSection', newModule.CounterComponent);
    }
  });
}
```

### Main Entry Pattern

```ts
export const App = () => div(..., CounterSection(), CounterSection());

// Guard prevents duplicate appends on HMR
if (!__VAN_HMR__.renderSlots.has('main.ts:App:0')) {
  van.add(document.body, ...__VAN_HMR__.registerRender('main.ts:App', App));
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) __VAN_HMR__.rerender('main.ts:App', newModule.App);
  });
}
```

---

## Key Technical Challenges Solved

### 1. Closure Staleness in `hot.accept`

**Problem:** Callbacks close over OLD function references.

**Solution:** Use `hot.accept((newModule) => ...)` and reference `newModule.ComponentFn`.

### 2. Multiple Instance State Collision

**Problem:** Two `CounterSection()` calls share state.

**Solution:**

- Auto-increment instance index (`:0`, `:1`, `:2`)
- Scope all state/derived by `currentInstanceId` during `registerRender`

### 3. Nested Render Slots

**Problem:** Parent `rerender` clears container, detaching child markers.

**Solution:** `registerRender` detects detached markers (`!startMarker.isConnected`) and re-renders fresh.

### 4. Dynamic Composition (Add/Remove Components)

**Problem:** Removing a component creates orphaned slots. Adding back creates new slot instead of reusing existing.

**Solution:** `freshlyDisconnected` flag system:

- Mark slots as `freshlyDisconnected=true` AFTER clearing parent (in `rerender`)
- `registerRender` reuses disconnected slots ONLY if `freshlyDisconnected=true`
- Track `reusedThisCycle` Set to prevent double-reuse in same render cycle
- Clear flags after microtask completes

---

## Critical Files to Review

### Implementation

- `apps/examples/plugin-test/src/hmr-runtime.ts` - Core HMR runtime
- `apps/examples/plugin-test/src/counter.ts` - Example with derived state
- `apps/examples/plugin-test/src/members.prod.ts` - Example with props
- `apps/examples/plugin-test/src/main.ts` - Composition root

### Documentation

- `apps/examples/plugin-test/key-hmr-features.md` - Feature tracker
- `packages/vanjs/src/reactive-lists.ts` - Comment marker pattern origin

### Plugin Target

- `packages/vite-plugin-vanjs/src/plugin.ts` - Where automation will go

---

## Next Steps

### Phase 2 — Developer Experience ✅

- [x] **Error boundaries during HMR** - If new component throws, old DOM is preserved + styled error overlay shown (dismissible via Esc or button). Next successful save auto-dismisses overlay.
- [x] **Console log cleanup** - `logLevel` property: `'quiet'` (errors only), `'summary'` (default, one-line per HMR update), `'verbose'` (full detail). Controllable via `__VAN_HMR__.logLevel = 'verbose'` in console.
- [ ] **Dynamic composition changes** - Test more edge cases

### Phase 3 — Plugin Automation

**Goal:** Auto-inject HMR without manual imports/wrappers.

**Tasks:**

1. **Auto-inject `virtual:vanjs-hmr-runtime`** - Remove manual imports
2. **Auto-wrap `van.state()` calls** → `__VAN_HMR__.createState('file:line:col', ...)`
   - Stable positional IDs: hash of file path + AST node position
3. **Auto-wrap component exports** - Detect `export const Component = () => ...` and inject `registerRender`
4. **Auto-append `hot.accept` with `newModule` pattern**
5. **Inline runtime as virtual module string** in `plugin.ts`

**Plugin Approach:**

- Use MagicString for code transforms
- AST parsing to detect components (PascalCase exports returning DOM)
- Transform at build time, inject at dev time only

---

## Test Scenarios (All Passing)

**Test 1:** Two counters, set to 5 and 10 → edit component code → both preserved ✅

**Test 2:** Two counters (5, 10) → remove second → first stays 5 ✅

**Test 3:** One counter at 5 → add second → first = 5, second = 0 ✅

**Test 4:** Three counters (5, 10, 15) → remove middle → first = 5, third = 15 ✅

---

## Common Pitfalls to Avoid

1. **Don't check `isConnected` too early** - Markers aren't connected until `van.add` completes
2. **Don't clear `freshlyDisconnected` immediately on reuse** - Use microtask + Set tracking
3. **Don't forget to scope state by instance** - Use `currentInstanceId` context
4. **Don't reuse slots without `freshlyDisconnected` check** - Old orphans cause state collision

---

## Development Commands

```bash
cd apps/examples/plugin-test
pnpm dev  # Start dev server with HMR
```

**Console inspection:**

```js
__VAN_HMR__.stateRegistry; // View all state
__VAN_HMR__.renderSlots; // View all slots
__VAN_HMR__.cleanup(); // Manually trigger GC
```

---

## Questions for Next Session

1. **Phase 2 or Phase 3?** Which to tackle first?
2. **Plugin injection strategy** - MagicString + AST or Babel transform?
3. **Stable ID generation** - Hash-based or source-map-based for `createState` IDs?
4. **Component detection heuristics** - PascalCase + returns Node, or require explicit decorator?

---

## Success Metrics

- ✅ No full page reload on component edit
- ✅ State preserved (form inputs, counters, arrays)
- ✅ Scroll position maintained
- ✅ Multiple instances independent
- ✅ Dynamic add/remove works
- ⏳ Zero manual boilerplate (Phase 3 goal)

---

**Last Updated:** End of Phase 2
**Ready For:** Phase 3 (Plugin automation)
