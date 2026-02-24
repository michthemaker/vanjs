import van from "@michthemaker/vanjs";

// ============================================
// HMR Runtime (What the plugin would inject as a virtual module)
// ============================================
class VanJSHMRRuntime {
  stateRegistry = new Map<string, any>();
  // Stores comment marker pairs keyed by render slot ID - persists across module reloads
  renderSlots = new Map<string, { startMarker: Comment; endMarker: Comment; props?: any }>();
  currentStateContext: string | null = null;
  originalVanState: any = null;
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
  }

  // Create state with a stable HMR ID so it survives module re-execution
  createState<T>(id: string, initialValue: T) {
    this.currentStateContext = id;
    const state = (van as any).state(initialValue);
    this.currentStateContext = null;
    return state as { val: T; readonly oldVal: T };
  }

  // Initial mount: creates comment markers, renders fn(), returns [start, element, end].
  // van.add flattens the array so all three nodes land as siblings in the parent.
  // On subsequent calls (module re-execution without DOM reset), returns existing markers.
  // The hot.accept callback with newModule handles actual re-rendering.
  registerRender(id: string, fn: (props?: any) => Node, props?: any): [Comment, Node, Comment] {
    const existing = this.renderSlots.get(id);
    if (existing) {
      if (!existing.startMarker.isConnected) {
        this.clearBetweenMarkers(existing); // safety cleanup
        existing.props = props; // update stored props
        const element = fn(props);
        return [existing.startMarker, element, existing.endMarker];
      }
      // Markers are still live in the DOM. hot.accept will handle re-rendering.
      return [existing.startMarker, existing.startMarker, existing.endMarker];
    }

    const startMarker = new Comment(`hmr:${id}:start`);
    const endMarker = new Comment(`hmr:${id}:end`);
    this.renderSlots.set(id, { startMarker, endMarker, props });

    const element = fn(props);
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
  rerender(id: string, fn: (props?: any) => Node, props?: any) {
    const slot = this.renderSlots.get(id);
    if (!slot) {
      console.warn(`[VanJS HMR] rerender: no slot found for "${id}"`);
      return;
    }

    const { startMarker, endMarker } = slot;
    const parent = startMarker.parentNode;
    if (!parent) {
      console.warn(
        `[VanJS HMR] rerender: markers for "${id}" are not in the DOM`
      );
      return;
    }

    // Remove all nodes between markers
    this.clearBetweenMarkers(slot);

    // Update stored props and render with new function (createState inside will restore from stateRegistry)
    if (props !== undefined) {
      slot.props = props;
    }
    const newElement = fn(slot.props);
    parent.insertBefore(newElement, endMarker);
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
