import van from "@michthemaker/vanjs";

// ============================================
// HMR Runtime (What the plugin would inject as a virtual module)
// ============================================
class VanJSHMRRuntime {
  stateRegistry = new Map<string, any>();
  derivedRegistry = new Map<string, any>();
  // Stores comment marker pairs keyed by render slot ID - persists across module reloads
  renderSlots = new Map<string, { startMarker: Comment; endMarker: Comment; props?: any }>();
  currentStateContext: string | null = null;
  currentDerivedContext: string | null = null;
  currentInstanceId: string | null = null;
  originalVanState: any = null;
  originalVanDerive: any = null;
  initialized = false;

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
  }

  // Create state with a stable HMR ID so it survives module re-execution
  // If inside an instance context, prepend instance ID to make state unique per instance
  createState<T>(id: string, initialValue: T) {
    const scopedId = this.currentInstanceId ? `${this.currentInstanceId}:${id}` : id;
    this.currentStateContext = scopedId;
    const state = (van as any).state(initialValue);
    this.currentStateContext = null;
    return state as { val: T; readonly oldVal: T };
  }

  // Create derived state with a stable HMR ID so it survives module re-execution
  // If inside an instance context, prepend instance ID to make derived unique per instance
  createDerived<T>(id: string, fn: () => T) {
    const scopedId = this.currentInstanceId ? `${this.currentInstanceId}:${id}` : id;
    this.currentDerivedContext = scopedId;
    const derived = (van as any).derive(fn);
    this.currentDerivedContext = null;
    return derived as { val: T; readonly oldVal: T };
  }

  // Initial mount: creates comment markers, renders fn(), returns [start, element, end].
  // van.add flattens the array so all three nodes land as siblings in the parent.
  // On subsequent calls (module re-execution without DOM reset), returns existing markers.
  // Always uses instance index (e.g., id:0, id:1) to support multiple instances from the start.
  registerRender(id: string, fn: (props?: any) => Node, props?: any): [Comment, Node, Comment] {
    const baseId = id;

    // Find next available instance index
    let index = 0;
    while (this.renderSlots.has(`${baseId}:${index}`)) {
      index++;
    }
    id = `${baseId}:${index}`;

    // Set instance context so createState/createDerived can scope IDs per instance
    const prevInstanceId = this.currentInstanceId;
    this.currentInstanceId = id;

    const existingSlot = this.renderSlots.get(id);
    if (existingSlot) {
      if (!existingSlot.startMarker.isConnected) {
        this.clearBetweenMarkers(existingSlot); // safety cleanup
        existingSlot.props = props; // update stored props
        const element = fn(props);
        this.currentInstanceId = prevInstanceId;
        return [existingSlot.startMarker, element, existingSlot.endMarker];
      }
      // Markers are still live in the DOM. hot.accept will handle re-rendering.
      this.currentInstanceId = prevInstanceId;
      return [existingSlot.startMarker, existingSlot.startMarker, existingSlot.endMarker];
    }

    const startMarker = new Comment(`hmr:${id}:start`);
    const endMarker = new Comment(`hmr:${id}:end`);
    this.renderSlots.set(id, { startMarker, endMarker, props });

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

  // Called inside hot.accept with the NEW component function reference.
  // Clears everything between the existing comment markers and inserts the
  // freshly-rendered element, preserving marker positions in the DOM tree.
  // If the component has multiple instances, rerenders all of them.
  rerender(id: string, fn: (props?: any) => Node, props?: any) {
    // Find all slots that match this ID (handles multiple instances like id:0, id:1)
    const matchingSlots: Array<[string, { startMarker: Comment; endMarker: Comment; props?: any }]> = [];

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

      // Remove all nodes between markers
      this.clearBetweenMarkers(slot);

      // Set instance context for state/derived restoration
      const prevInstanceId = this.currentInstanceId;
      this.currentInstanceId = slotId;

      // Update stored props and render with new function (createState inside will restore from stateRegistry)
      if (props !== undefined) {
        slot.props = props;
      }
      const newElement = fn(slot.props);
      this.currentInstanceId = prevInstanceId;
      parent.insertBefore(newElement, endMarker);
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
