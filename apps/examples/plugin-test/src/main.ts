import van from "@michthemaker/vanjs";

const { div, h1, p, button, input, } = van.tags;

// ============================================
// HMR Runtime (What the plugin would inject)
// ============================================
class VanJSHMRRuntime {
  stateRegistry = new Map<string, any>();
  renderRegistry = new Map<string, { fn: () => void; container: Element | null }>();
  currentStateContext: string | null = null;
  currentRenderContext: string | null = null;
  originalVanState: any = null;
  originalVanAdd: any = null;

  init() {
    console.log('[VanJS HMR] Initializing runtime...');

    // Wrap van.state to preserve states across reloads
    this.originalVanState = van.state;
    (van as any).state = (initial?: any) => {
      const hmrId = this.currentStateContext;

      // Check if we have a preserved state
      if (hmrId && this.stateRegistry.has(hmrId)) {
        console.log('[VanJS HMR] Restoring state:', hmrId, 'with value:', this.stateRegistry.get(hmrId).val);
        return this.stateRegistry.get(hmrId);
      }

      // Create new state
      const state = this.originalVanState(initial);

      // Register for future HMR
      if (hmrId) {
        console.log('[VanJS HMR] Registering new state:', hmrId, 'with value:', initial);
        this.stateRegistry.set(hmrId, state);
      }

      return state;
    };

    // Wrap van.add to track containers
    this.originalVanAdd = van.add;
    (van as any).add = (container: Element, ...children: any[]) => {
      const currentRender = this.currentRenderContext;
      if (currentRender) {
        const renderInfo = this.renderRegistry.get(currentRender);
        if (renderInfo) {
          renderInfo.container = container;
          console.log('[VanJS HMR] Tracked container for:', currentRender);
        }
      }

      return this.originalVanAdd(container, ...children);
    };
  }

  // Helper to create state with HMR context
  createState<T>(id: string, initialValue: T) {
    this.currentStateContext = id;
    const state = (van as any).state(initialValue);
    this.currentStateContext = null;
    return state;
  }

  // Helper to register render function
  registerRender(id: string, fn: () => void) {
    const existing = this.renderRegistry.get(id);

    if (existing && existing.container) {
      // HMR reload: update function and re-render immediately
      console.log('[VanJS HMR] Updating render function for:', id);
      this.renderRegistry.set(id, { fn, container: existing.container });

      // Clear and re-render with new function
      existing.container.innerHTML = '';
      this.currentRenderContext = id;
      fn();
      this.currentRenderContext = null;
    } else {
      // Initial render
      console.log('[VanJS HMR] Initial render for:', id);
      this.renderRegistry.set(id, { fn, container: null });
      this.currentRenderContext = id;
      const result = fn();
      this.currentRenderContext = null;
      return result;
    }
  }

  // Reload all registered renders (called by HMR accept handler)
  reload() {
    console.log('[VanJS HMR] Reload triggered');
    console.log('[VanJS HMR] State registry:', Array.from(this.stateRegistry.entries()).map(([k, v]) => [k, v.val]));
    // Note: reload is now handled in registerRender when the module re-executes
  }
}

// Persist runtime across module reloads - this is the key!
const __VAN_HMR__: VanJSHMRRuntime = (window as any).__VAN_HMR__ ?? new VanJSHMRRuntime();
if (!(window as any).__VAN_HMR__) {
  (window as any).__VAN_HMR__ = __VAN_HMR__;
  __VAN_HMR__.init();
}

// ============================================
// Application Code (manually wrapped for now)
// ============================================

const Home = () => {
  // These would be auto-wrapped by the plugin
  const cellMembers = __VAN_HMR__.createState('main.ts:Home:cellMembers', [
    { name: "Jane", age: 25 },
    { name: "Joy", age: 18 },
  ]);

  const cars = __VAN_HMR__.createState('main.ts:Home:cars', [
    { name: "Toyota", year: 2020 },
    { name: "Honda", year: 2019 },
  ]);

  const counter = __VAN_HMR__.createState('main.ts:Home:counter', 0);
  const textInput = __VAN_HMR__.createState('main.ts:Home:textInput', 'Edit me!');

  return div(
    { style: "padding: 20px; font-family: sans-serif;" },

    // Counter section
    div(
      { style: "margin-bottom: 20px; border: 2px solid #4CAF50; border-radius: 8px;" },
      h1("Counter Test"),
      p(() => `Count: ${counter.val}`),
      p(() => counter.val * 4 * 2),
      button(
        {
          onclick: () => counter.val++,
          style: "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: yellow;"
        },
        () => "Increment" + counter.val,
        () => "Increment" + (counter.val * 2)
      ),
      button(
        {
          onclick: () => counter.val--,
          style: "margin: 5px; padding: 10px 20px; cursor: pointer;"
        },
        "Decrement"
      ),
      button(
        {
          onclick: () => counter.val = 0,
          style: "margin: 5px; padding: 10px 20px; cursor: pointer; background: #f44336; color: white;"
        },
        "Reset"
      ),
    ),


  );
};

// This would be auto-wrapped by the plugin
__VAN_HMR__.registerRender('main', () => {
  van.add(document.body, Home());
});

// HMR accept handler
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('[VanJS HMR] Hot update received!');
    console.log('[VanJS HMR] New module:', newModule);

    // The new module has already executed and registered its render function
    // We just need to trigger the reload
    __VAN_HMR__.reload();
  });
}
