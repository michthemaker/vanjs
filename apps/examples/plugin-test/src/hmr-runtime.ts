import van from "@michthemaker/vanjs";

// ============================================
// HMR Runtime (What the plugin would inject as a virtual module)
// ============================================
class VanJSHMRRuntime {
  stateRegistry = new Map<string, any>();
  derivedRegistry = new Map<string, any>();
  // Stores comment marker pairs keyed by render slot ID - persists across module reloads
  renderSlots = new Map<
    string,
    { startMarker: Comment; endMarker: Comment; props?: any; hasRendered?: boolean }
  >();
  currentStateContext: string | null = null;
  currentDerivedContext: string | null = null;
  currentInstanceId: string | null = null;
  originalVanState: any = null;
  originalVanDerive: any = null;
  initialized = false;
  gcIntervalId: any = null;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Wrap van.state to preserve states across reloads
    this.originalVanState = van.state;
    (van as any).state = (initial?: any) => {
      const hmrId = this.currentStateContext;

      if (hmrId && this.stateRegistry.has(hmrId)) {
        return this.stateRegistry.get(hmrId);
      }

      const state = this.originalVanState(initial);

      if (hmrId) {
        this.stateRegistry.set(hmrId, state);
      }

      return state;
    };

    // Wrap van.derive to preserve derived states across reloads
    this.originalVanDerive = van.derive;
    (van as any).derive = (fn: () => any) => {
      const hmrId = this.currentDerivedContext;

      if (hmrId && this.derivedRegistry.has(hmrId)) {
        // Return existing derived state - don't recreate to avoid double listeners
        // The derivation function is already set up from initial creation
        return this.derivedRegistry.get(hmrId);
      }

      const derived = this.originalVanDerive(fn);

      if (hmrId) {
        this.derivedRegistry.set(hmrId, derived);
      }

      return derived;
    };

    // Schedule periodic GC to clean up disconnected components (every 30 seconds)
    if (!this.gcIntervalId) {
      this.gcIntervalId = setInterval(() => this.cleanup(), 30000);
    }
  }

  // Scope state by instance if within a component context
  createState<T>(id: string, initialValue: T) {
    const scopedId = this.currentInstanceId
      ? `${this.currentInstanceId}:${id}`
      : id;
    this.currentStateContext = scopedId;
    const state = (van as any).state(initialValue);
    this.currentStateContext = null;
    return state as { val: T; readonly oldVal: T };
  }

  // Scope derived state by instance if within a component context
  createDerived<T>(id: string, fn: () => T) {
    const scopedId = this.currentInstanceId
      ? `${this.currentInstanceId}:${id}`
      : id;
    this.currentDerivedContext = scopedId;
    const derived = (van as any).derive(fn);
    this.currentDerivedContext = null;
    return derived as { val: T; readonly oldVal: T };
  }

  // Create render slot with comment markers. Assigns instance index for multi-instance support.
  registerRender(
    id: string,
    fn: (props?: any) => Node,
    props?: any
  ): [Comment, Node, Comment] {
    const baseId = id;

    // Find next available instance index
    // Reuse disconnected slots that were previously rendered (orphaned by parent re-render)
    // Skip disconnected slots that haven't rendered yet (initial mount, not connected)
    let index = 0;
    while (this.renderSlots.has(`${baseId}:${index}`)) {
      const slot = this.renderSlots.get(`${baseId}:${index}`);
      if (slot && !slot.startMarker.isConnected && slot.hasRendered) {
        // Reuse this orphaned slot
        break;
      }
      index++;
    }
    id = `${baseId}:${index}`;

    // Set instance context for state scoping
    const prevInstanceId = this.currentInstanceId;
    this.currentInstanceId = id;

    const existingSlot = this.renderSlots.get(id);
    if (existingSlot) {
      if (!existingSlot.startMarker.isConnected) {
        this.clearBetweenMarkers(existingSlot);
        existingSlot.props = props; // update stored props
        const element = fn(props);
        this.currentInstanceId = prevInstanceId;
        return [existingSlot.startMarker, element, existingSlot.endMarker];
      }
      // Markers connected, hot.accept handles re-render
      this.currentInstanceId = prevInstanceId;
      return [
        existingSlot.startMarker,
        existingSlot.startMarker,
        existingSlot.endMarker,
      ];
    }

    const startMarker = new Comment(`hmr:${id}:start`);
    const endMarker = new Comment(`hmr:${id}:end`);
    this.renderSlots.set(id, { startMarker, endMarker, props, hasRendered: false });

    const element = fn(props);
    this.currentInstanceId = prevInstanceId;
    return [startMarker, element, endMarker];
  }

  // Helper to clear all nodes between markers (even if detached)
  private clearBetweenMarkers(slot: {
    startMarker: Comment;
    endMarker: Comment;
  }) {
    let cur = slot.startMarker.nextSibling;
    while (cur && cur !== slot.endMarker) {
      const next = cur.nextSibling;
      cur.remove();
      cur = next;
    }
  }

  // Re-render component(s) with new code. Finds all instances by ID prefix.
  rerender(id: string, fn: (props?: any) => Node, props?: any) {
    // Find all matching instances
    const matchingSlots: Array<
      [string, { startMarker: Comment; endMarker: Comment; props?: any; hasRendered?: boolean }]
    > = [];

    for (const [slotId, slot] of this.renderSlots.entries()) {
      // Match exact ID or instance-prefixed ID (e.g., "counter.ts:CounterSection:0")
      if (slotId === id || slotId.startsWith(`${id}:`)) {
        matchingSlots.push([slotId, slot]);
      }
    }

    if (matchingSlots.length === 0) {
      console.warn(`[VanJS HMR] rerender: no slot found for "${id}"`);
      return;
    }

    // Rerender all matching instances
    for (const [slotId, slot] of matchingSlots) {
      const { startMarker, endMarker } = slot;
      const parent = startMarker.parentNode;
      if (!parent) {
        console.warn(
          `[VanJS HMR] rerender: markers for "${slotId}" are not in the DOM`
        );
        continue;
      }

      this.clearBetweenMarkers(slot);

      // Set instance context for state restoration
      const prevInstanceId = this.currentInstanceId;
      this.currentInstanceId = slotId;

      // Update props if provided, render with restored state
      if (props !== undefined) {
        slot.props = props;
      }
      const newElement = fn(slot.props);
      this.currentInstanceId = prevInstanceId;
      parent.insertBefore(newElement, endMarker);

      // Mark as rendered so it can be reused if orphaned later
      slot.hasRendered = true;
    }
  }

  // GC disconnected components (runs every 30s)
  cleanup() {
    const disconnectedSlots: string[] = [];

    for (const [slotId, slot] of this.renderSlots.entries()) {
      if (!slot.startMarker.isConnected) {
        disconnectedSlots.push(slotId);
      }
    }

    if (disconnectedSlots.length === 0) return;

    console.log(`[VanJS HMR] Cleaning up ${disconnectedSlots.length} disconnected component(s)`);

    for (const slotId of disconnectedSlots) {
      this.renderSlots.delete(slotId);

      const statesToDelete: string[] = [];
      for (const key of this.stateRegistry.keys()) {
        if (key === slotId || key.startsWith(`${slotId}:`)) {
          statesToDelete.push(key);
        }
      }
      for (const key of statesToDelete) {
        this.stateRegistry.delete(key);
      }

      const derivedToDelete: string[] = [];
      for (const key of this.derivedRegistry.keys()) {
        if (key === slotId || key.startsWith(`${slotId}:`)) {
          derivedToDelete.push(key);
        }
      }
      for (const key of derivedToDelete) {
        this.derivedRegistry.delete(key);
      }
    }
  }
}

// Persist runtime on window so it survives Vite module re-execution
const __VAN_HMR__: VanJSHMRRuntime =
  (window as any).__VAN_HMR__ ?? new VanJSHMRRuntime();

if (!(window as any).__VAN_HMR__) {
  (window as any).__VAN_HMR__ = __VAN_HMR__;
}

__VAN_HMR__.init();

export { __VAN_HMR__ };
export type { VanJSHMRRuntime };
