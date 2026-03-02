import MagicString from "magic-string";
import { type Plugin } from "vite";
import { posix } from "node:path";
import { writeFileSync } from "node:fs";

export interface VanJSHMROptions {
  include?: RegExp;
  exclude?: RegExp;
  /** Match entry files (mount to document.body). Matched against relative path. */
  entryMatch?: RegExp;
}

export function hmrPlugin(options: VanJSHMROptions = {}): Plugin {
  const {
    include = /\.[jt]s?$/,
    exclude = /node_modules/,
    entryMatch = /main\.[jt]s?$/,
  } = options;

  let projectRoot = "";

  return {
    name: "vite-plugin-vanjs-hmr",
    enforce: "pre",

    configResolved(config) {
      projectRoot = config.root;
    },

    transform(code, id) {
      if (!include.test(id) || exclude.test(id)) return null;
      if (
        !code.includes("van.state") &&
        !code.includes("van.tags") &&
        !code.includes("van.derive")
      ) {
        return null;
      }

      const s = new MagicString(code);
      const relPath = posix
        .normalize(id.replace(projectRoot, "").replace(/\\/g, "/"))
        .replace(/^\//, "");
      const isEntry = entryMatch.test(relPath);

      // Line start offsets for file:line:col IDs
      const lineStarts = [0];
      for (let i = 0; i < code.length; i++) {
        if (code[i] === "\n") lineStarts.push(i + 1);
      }
      const getLineCol = (offset: number) => {
        let line = 1;
        for (let i = lineStarts.length - 1; i >= 0; i--) {
          if (offset >= lineStarts[i]) {
            line = i + 1;
            break;
          }
        }
        const col = offset - lineStarts[line - 1] + 1;
        return `${line}:${col}`;
      };

      // --- 1. Transform van.state() → __VAN_HMR__.createState() ---
      const statePattern = /van\.state\s*\(/g;
      let match;
      while ((match = statePattern.exec(code)) !== null) {
        const start = match.index;
        const hmrId = `${relPath}:${getLineCol(start)}`;
        s.overwrite(
          start,
          start + match[0].length,
          `__VAN_HMR__.createState('${hmrId}', `
        );
      }

      // --- 2. Transform van.derive() → __VAN_HMR__.createDerived() ---
      const derivePattern = /van\.derive\s*\(/g;
      while ((match = derivePattern.exec(code)) !== null) {
        const start = match.index;
        const hmrId = `${relPath}:${getLineCol(start)}`;
        s.overwrite(
          start,
          start + match[0].length,
          `__VAN_HMR__.createDerived('${hmrId}', `
        );
      }

      // --- 3. Detect PascalCase exported component functions ---
      const componentPattern = /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/g;
      const components: string[] = [];
      while ((match = componentPattern.exec(code)) !== null) {
        components.push(match[1]);
      }

      // --- 4. Inject __VAN_HMR__ import ---
      s.prepend(`import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';\n`);

      // --- 5. Append registerRender wrappers + hot.accept ---
      if (components.length > 0) {
        let appendCode = "\n";

        if (isEntry) {
          // Entry: guard mount, registerRender the App root
          const appComponent = components[0];
          const slotId = `${relPath}:${appComponent}`;
          appendCode += `\n// [VanJS HMR] Entry mount guard`;
          appendCode += `\n// use 0 as the slot index for the App root\n`;
          appendCode += `if (!__VAN_HMR__.renderSlots.has('${slotId}:0')) {\n`;
          appendCode += `  van.add(document.body, __VAN_HMR__.registerRender('${slotId}', ${appComponent}));\n`;
          appendCode += `}\n`;
        } else {
          // Non-entry: export Section factory for each component
          for (const name of components) {
            const slotId = `${relPath}:${name}`;
            appendCode += `export const ${name}Section = (props) => __VAN_HMR__.registerRender('${slotId}', ${name}, props);\n`;
          }
        }

        // hot.accept for all files with components
        appendCode += `\nif (import.meta.hot) {\n`;
        appendCode += `  import.meta.hot.accept((newModule) => {\n`;
        appendCode += `    if (newModule) {\n`;
        for (const name of components) {
          const slotId = `${relPath}:${name}`;
          appendCode += `      __VAN_HMR__.rerender('${slotId}', newModule.${name});\n`;
        }
        appendCode += `    }\n`;
        appendCode += `  });\n`;
        appendCode += `}\n`;

        s.append(appendCode);
      }
      // write to a file the generated code
      writeFileSync("./gen.ts", s.toString());

      return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
      };
    },

    resolveId(id) {
      if (id === "virtual:vanjs-hmr-runtime") {
        return "\0virtual:vanjs-hmr-runtime";
      }
    },

    load(id) {
      if (id === "\0virtual:vanjs-hmr-runtime") {
        return HMR_RUNTIME_CODE;
      }
    },
  };
}

// ============================================
// HMR Runtime — served as virtual:vanjs-hmr-runtime
// Plain JS (no TypeScript) — Vite serves this directly to the browser.
// Source of truth: apps/examples/plugin-test/src/hmr-runtime.ts
// ============================================
const HMR_RUNTIME_CODE = `
import van from "@michthemaker/vanjs";

class VanJSHMRRuntime {
  stateRegistry = new Map();
  derivedRegistry = new Map();
  renderSlots = new Map();
  currentStateContext = null;
  currentDerivedContext = null;
  currentInstanceId = null;
  originalVanState = null;
  originalVanDerive = null;
  initialized = false;
  gcIntervalId = null;
  reusedThisCycle = new Set();
  errorOverlay = null;
  logLevel = 'summary';

  log(level, ...args) {
    if (this.logLevel === 'quiet') return;
    if (level === 'verbose' && this.logLevel !== 'verbose') return;
    console.log(...args);
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.originalVanState = van.state;
    van.state = (initial) => {
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

    this.originalVanDerive = van.derive;
    van.derive = (fn) => {
      const hmrId = this.currentDerivedContext;
      if (hmrId && this.derivedRegistry.has(hmrId)) {
        return this.derivedRegistry.get(hmrId);
      }
      const derived = this.originalVanDerive(fn);
      if (hmrId) {
        this.derivedRegistry.set(hmrId, derived);
      }
      return derived;
    };

    if (!this.gcIntervalId) {
      this.gcIntervalId = setInterval(() => this.cleanup(), 30000);
    }
  }

  createState(id, initialValue) {
    const scopedId = this.currentInstanceId ? this.currentInstanceId + ':' + id : id;
    this.currentStateContext = scopedId;
    const state = van.state(initialValue);
    this.currentStateContext = null;
    return state;
  }

  createDerived(id, fn) {
    const scopedId = this.currentInstanceId ? this.currentInstanceId + ':' + id : id;
    this.currentDerivedContext = scopedId;
    const derived = van.derive(fn);
    this.currentDerivedContext = null;
    return derived;
  }

  registerRender(id, fn, props) {
    const baseId = id;
    let index = 0;
    while (this.renderSlots.has(baseId + ':' + index)) {
      const slot = this.renderSlots.get(baseId + ':' + index);
      const slotId = baseId + ':' + index;
      if (slot && !slot.startMarker.isConnected && slot.freshlyDisconnected && !this.reusedThisCycle.has(slotId)) {
        this.reusedThisCycle.add(slotId);
        break;
      }
      index++;
    }
    id = baseId + ':' + index;

    const prevInstanceId = this.currentInstanceId;
    this.currentInstanceId = id;

    const existingSlot = this.renderSlots.get(id);
    if (existingSlot) {
      if (!existingSlot.startMarker.isConnected) {
        this.clearBetweenMarkers(existingSlot);
        existingSlot.props = props;
        const element = fn(props);
        this.currentInstanceId = prevInstanceId;
        return [existingSlot.startMarker, element, existingSlot.endMarker];
      }
      this.currentInstanceId = prevInstanceId;
      return [existingSlot.startMarker, existingSlot.startMarker, existingSlot.endMarker];
    }

    const startMarker = new Comment('hmr:' + id + ':start');
    const endMarker = new Comment('hmr:' + id + ':end');
    this.renderSlots.set(id, { startMarker, endMarker, props });

    const element = fn(props);
    this.currentInstanceId = prevInstanceId;
    return [startMarker, element, endMarker];
  }

  clearBetweenMarkers(slot) {
    let cur = slot.startMarker.nextSibling;
    while (cur && cur !== slot.endMarker) {
      const next = cur.nextSibling;
      cur.remove();
      cur = next;
    }
  }

  showErrorOverlay(slotId, error) {
    this.dismissErrorOverlay();
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack || '') : '';
    const overlay = document.createElement('div');
    overlay.id = '__vanjs-hmr-error-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);color:#fff;z-index:99999;font-family:monospace;padding:40px;box-sizing:border-box;overflow:auto;display:flex;flex-direction:column;';
    overlay.innerHTML = '<div style="max-width:900px;margin:0 auto;width:100%;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
      + '<h2 style="margin:0;color:#ff5555;font-size:20px;">HMR Error in <code>' + slotId + '</code></h2>'
      + '<button id="__vanjs-hmr-dismiss" style="background:none;border:1px solid #666;color:#ccc;padding:6px 16px;cursor:pointer;border-radius:4px;font-family:monospace;font-size:14px;">Dismiss (Esc)</button>'
      + '</div>'
      + '<p style="color:#ccc;margin:0 0 8px 0;font-size:13px;">Old DOM preserved. Fix the error and save to retry.</p>'
      + '<pre style="background:#1a1a2e;color:#ff6b6b;padding:20px;border-radius:8px;overflow:auto;font-size:14px;line-height:1.6;white-space:pre-wrap;border:1px solid #333;margin:0;">'
      + this.escapeHtml(message) + '\\n\\n' + this.escapeHtml(stack) + '</pre></div>';
    const dismiss = () => this.dismissErrorOverlay();
    overlay.querySelector('#__vanjs-hmr-dismiss')?.addEventListener('click', dismiss);
    const onKey = (e) => { if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    this.errorOverlay = overlay;
  }

  dismissErrorOverlay() {
    if (this.errorOverlay) { this.errorOverlay.remove(); this.errorOverlay = null; }
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  rerender(id, fn, props) {
    const matchingSlots = [];
    for (const [slotId, slot] of this.renderSlots.entries()) {
      if (slotId === id || slotId.startsWith(id + ':')) {
        matchingSlots.push([slotId, slot]);
      }
    }
    if (matchingSlots.length === 0) {
      console.warn('[VanJS HMR] rerender: no slot found for "' + id + '"');
      return;
    }
    this.log('summary', '[VanJS HMR] ♻️  ' + id + ' (' + matchingSlots.length + ' instance' + (matchingSlots.length > 1 ? 's' : '') + ')');

    for (const [slotId, slot] of matchingSlots) {
      const { startMarker, endMarker } = slot;
      const parent = startMarker.parentNode;
      if (!parent) {
        console.warn('[VanJS HMR] rerender: markers for "' + slotId + '" are not in the DOM');
        continue;
      }
      this.log('verbose', '[VanJS HMR]   → rendering ' + slotId);

      const savedNodes = [];
      let cur = startMarker.nextSibling;
      while (cur && cur !== endMarker) { savedNodes.push(cur); cur = cur.nextSibling; }

      this.clearBetweenMarkers(slot);

      for (const [, childSlot] of this.renderSlots.entries()) {
        if (!childSlot.startMarker.isConnected) childSlot.freshlyDisconnected = true;
      }

      const prevInstanceId = this.currentInstanceId;
      this.currentInstanceId = slotId;
      if (props !== undefined) slot.props = props;

      try {
        const newElement = fn(slot.props);
        this.currentInstanceId = prevInstanceId;
        parent.insertBefore(newElement, endMarker);
        this.dismissErrorOverlay();
      } catch (error) {
        this.currentInstanceId = prevInstanceId;
        for (const node of savedNodes) parent.insertBefore(node, endMarker);
        console.error('[VanJS HMR] Error rendering "' + slotId + '":', error);
        this.showErrorOverlay(slotId, error);
      }
    }

    queueMicrotask(() => {
      for (const [, slot] of this.renderSlots.entries()) {
        if (slot.freshlyDisconnected) slot.freshlyDisconnected = false;
      }
      this.reusedThisCycle.clear();
    });
  }

  cleanup() {
    const disconnectedSlots = [];
    for (const [slotId, slot] of this.renderSlots.entries()) {
      if (!slot.startMarker.isConnected) disconnectedSlots.push(slotId);
    }
    if (disconnectedSlots.length === 0) return;
    this.log('summary', '[VanJS HMR] 🧹 GC: ' + disconnectedSlots.length + ' disconnected component(s)');
    for (const slotId of disconnectedSlots) {
      this.renderSlots.delete(slotId);
      for (const key of [...this.stateRegistry.keys()]) {
        if (key === slotId || key.startsWith(slotId + ':')) this.stateRegistry.delete(key);
      }
      for (const key of [...this.derivedRegistry.keys()]) {
        if (key === slotId || key.startsWith(slotId + ':')) this.derivedRegistry.delete(key);
      }
    }
  }
}

const __VAN_HMR__ = window.__VAN_HMR__ || new VanJSHMRRuntime();
if (!window.__VAN_HMR__) window.__VAN_HMR__ = __VAN_HMR__;
__VAN_HMR__.init();

export { __VAN_HMR__ };
`;
