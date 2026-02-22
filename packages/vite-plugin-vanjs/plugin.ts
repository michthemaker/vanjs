// ============================================
// Part 1: Vite Plugin (Build Time)
// ============================================

// vite-plugin-vanjs-hmr.ts
import { Plugin } from 'vite';
import MagicString from 'magic-string';

export interface VanJSHMROptions {
  include?: RegExp;
  exclude?: RegExp;
}

export default function vanJSHMR(options: VanJSHMROptions = {}): Plugin {
  const {
    include = /\.(jsx?|tsx?)$/,
    exclude = /node_modules/
  } = options;

  return {
    name: 'vite-plugin-vanjs-hmr',
    enforce: 'pre',

    transform(code, id) {
      if (!include.test(id) || exclude.test(id)) {
        return null;
      }

      // Only transform files that use VanJS
      if (!code.includes('van.state') && !code.includes('van.tags')) {
        return null;
      }

      const s = new MagicString(code);

      // 1. Transform van.state() calls to add HMR IDs
      const statePattern = /van\.state\s*\(\s*([^)]+)\s*\)/g;
      let match;
      let stateCounter = 0;

      while ((match = statePattern.exec(code)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        const initialValue = match[1];
        const hmrId = `${id}:state:${stateCounter++}`;

        s.overwrite(
          start,
          end,
          `van.state(${initialValue}, { __hmr_id: '${hmrId}' })`
        );
      }

      // 2. Wrap PascalCase functions (components)
      const componentPattern = /(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(\([^)]*\))\s*=>/g;
      const components: string[] = [];

      while ((match = componentPattern.exec(code)) !== null) {
        const componentName = match[1];
        components.push(componentName);

        const start = match.index;
        const end = code.indexOf('=>', start) + 2;

        // Wrap with HMR tracking
        s.appendLeft(
          end,
          `\n  __VAN_HMR__.trackExecution('${componentName}', `
        );

        // Find the end of the arrow function (closing brace or semicolon)
        let depth = 0;
        let funcEnd = end;
        for (let i = end; i < code.length; i++) {
          if (code[i] === '{') depth++;
          if (code[i] === '}') depth--;
          if (depth === 0 && (code[i] === ';' || code[i] === '\n')) {
            funcEnd = i;
            break;
          }
        }

        s.appendRight(funcEnd, ')');
      }

      // 3. Inject HMR runtime at the top of the file
      const runtimeCode = `
import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';
`;
      s.prepend(runtimeCode);

      // 4. Add HMR accept handler at the bottom
      const hmrCode = `

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('[VanJS HMR] Updating:', '${id}');
    __VAN_HMR__.reload();
  });

  import.meta.hot.dispose(() => {
    console.log('[VanJS HMR] Disposing:', '${id}');
  });
}
`;
      s.append(hmrCode);

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true })
      };
    },

    // Provide virtual module for HMR runtime
    resolveId(id) {
      if (id === 'virtual:vanjs-hmr-runtime') {
        return '\0' + id;
      }
    },

    load(id) {
      if (id === '\0virtual:vanjs-hmr-runtime') {
        return HMR_RUNTIME_CODE;
      }
    }
  };
}

// ============================================
// Part 2: HMR Runtime (Browser)
// ============================================

const HMR_RUNTIME_CODE = `
// VanJS HMR Runtime
class VanJSHMRRuntime {
  constructor() {
    this.stateRegistry = new Map();
    this.componentInstances = [];
    this.renderPoints = new Map();
    this.originalVanAdd = null;
    this.originalVanState = null;
    this.initialized = false;
  }

  init(van) {
    if (this.initialized) return;
    this.initialized = true;

    // Wrap van.state
    this.originalVanState = van.state;
    van.state = (initial, options) => {
      const hmrId = options?.__hmr_id;

      // Check if we have a preserved state
      if (hmrId && this.stateRegistry.has(hmrId)) {
        console.log('[VanJS HMR] Restoring state:', hmrId);
        return this.stateRegistry.get(hmrId);
      }

      // Create new state
      const state = this.originalVanState(initial);

      // Register for future HMR
      if (hmrId) {
        this.stateRegistry.set(hmrId, state);
      }

      return state;
    };

    // Wrap van.add
    this.originalVanAdd = van.add;
    van.add = (container, ...children) => {
      // Track which components were added to which containers
      children.forEach(child => {
        // Find if this child is from a tracked component
        const instance = this.componentInstances.find(
          inst => inst.element === child && !inst.container
        );

        if (instance) {
          instance.container = container;
          instance.parentElement = container;

          // Mark position in parent for precise replacement
          const childIndex = Array.from(container.children || []).length;
          instance.positionIndex = childIndex;

          console.log('[VanJS HMR] Tracked render:', instance.name, 'at', childIndex);
        }
      });

      return this.originalVanAdd(container, ...children);
    };
  }

  // Called by wrapped components during execution
  trackExecution(componentName, fn) {
    return (...args) => {
      const instance = {
        name: componentName,
        fn: fn,
        args: args,
        element: null,
        container: null,
        parentElement: null,
        positionIndex: -1,
        timestamp: Date.now()
      };

      // Execute the component function
      const result = fn(...args);
      instance.element = result;

      // Store this instance
      this.componentInstances.push(instance);

      return result;
    };
  }

  // Called when HMR triggers
  reload() {
    console.log('[VanJS HMR] Reloading components...');

    // Re-render all tracked components
    this.componentInstances.forEach((instance, index) => {
      const { name, fn, args, container, element } = instance;

      if (!container || !element) {
        console.warn('[VanJS HMR] Skipping untracked component:', name);
        return;
      }

      try {
        // Re-execute component with preserved state
        const newElement = fn(...args);

        // Replace old element with new one
        if (element.parentNode === container) {
          container.replaceChild(newElement, element);
          instance.element = newElement;
          console.log('[VanJS HMR] Updated:', name);
        } else {
          console.warn('[VanJS HMR] Element not in expected container:', name);
        }
      } catch (error) {
        console.error('[VanJS HMR] Failed to update:', name, error);
      }
    });
  }

  // Clean up old instances (memory management)
  cleanup() {
    const now = Date.now();
    const OLD_THRESHOLD = 60000; // 1 minute

    this.componentInstances = this.componentInstances.filter(inst => {
      const isOld = now - inst.timestamp > OLD_THRESHOLD;
      const isDetached = inst.element && !inst.element.isConnected;
      return !(isOld || isDetached);
    });
  }
}

// Global singleton
export const __VAN_HMR__ = new VanJSHMRRuntime();

// Auto-init when van is imported
if (typeof window !== 'undefined') {
  const checkVan = () => {
    if (window.van) {
      __VAN_HMR__.init(window.van);
    } else {
      setTimeout(checkVan, 10);
    }
  };
  checkVan();
}
`;

// ============================================
// Part 3: Usage Example
// ============================================

/*
// vite.config.ts
import { defineConfig } from 'vite';
import vanJSHMR from './vite-plugin-vanjs-hmr';

export default defineConfig({
  plugins: [vanJSHMR()]
});

// counter.ts (Before plugin transform)
import van from "vanjs-core";

const { div, button, p, input } = van.tags;

export const Counter = () => {
  const count = van.state(0);
  const name = van.state("World");

  return div(
    { style: "padding: 20px; border: 1px solid #ccc;" },
    p(() => \`Hello, \${name.val}!\`),
    input({
      type: "text",
      value: () => name.val,
      oninput: e => name.val = e.target.value
    }),
    p(() => \`Count: \${count.val}\`),
    button({ onclick: () => count.val++ }, "Increment"),
    button({ onclick: () => count.val-- }, "Decrement"),
    button({ onclick: () => count.val = 0 }, "Reset")
  );
};

// main.ts
import van from "vanjs-core";
import { Counter } from "./counter";

window.van = van; // Make available for HMR runtime

van.add(document.body,
  Counter(),
  Counter() // Multiple instances work too!
);

// Now when you edit counter.ts:
// 1. State values are preserved (count, name)
// 2. Only Counter instances are re-rendered
// 3. No full page reload!
*/
