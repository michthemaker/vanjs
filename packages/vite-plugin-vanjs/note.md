## How It Works:

**1. Build Time (Vite Plugin)**

- Detects `van.state()` calls → injects unique HMR IDs
- Wraps PascalCase functions (components) → tracks execution
- Injects HMR runtime and accept handlers

**2. Runtime (Browser)**

- Wraps `van.state` → preserves state across reloads using HMR IDs
- Wraps `van.add` → tracks which components were added where
- On HMR update → re-executes component functions and replaces old DOM elements

**3. Key Insights**

- State lives in a registry by ID → survives module reload
- Component instances track their container and element → enables precise replacement
- We track the factory function (`fn`) not just the result → can re-execute with new code

## The Flow:

```
User edits counter.ts
  ↓
Vite detects change
  ↓
Plugin transforms code (adds IDs, wraps components)
  ↓
Browser reloads module
  ↓
van.state checks registry → restores old values
  ↓
Component re-executes with new code + old state
  ↓
van.add replacement → swaps old DOM with new
  ↓
✅ UI updated, state preserved!
```
