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

// Shared Types & Utilities

interface ComponentInfo {
  name: string;
  isDefault: boolean;
    declarationStart: number;
    nameStart: number;
    nameEnd: number;
}

interface TransformContext {
  code: string;
  s: MagicString;
  relPath: string;
  getLineCol: (offset: number) => string;
}

function createLineColHelper(code: string): (offset: number) => string {
  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "\n") lineStarts.push(i + 1);
  }
  return (offset: number) => {
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
}

// Common Transformations (both entry & submodule)

/** Transform van.state() → __VAN_HMR__.createState() */
function transformVanState(ctx: TransformContext): void {
  const { code, s, relPath, getLineCol } = ctx;
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
}

/** Transform van.derive() → __VAN_HMR__.createDerived() */
function transformVanDerive(ctx: TransformContext): void {
  const { code, s, relPath, getLineCol } = ctx;
  const derivePattern = /van\.derive\s*\(/g;
  let match;
  while ((match = derivePattern.exec(code)) !== null) {
    const start = match.index;
    const hmrId = `${relPath}:${getLineCol(start)}`;
    s.overwrite(
      start,
      start + match[0].length,
      `__VAN_HMR__.createDerived('${hmrId}', `
    );
  }
}

/** Detect VanJS components in the file */
function detectComponents(code: string): ComponentInfo[] {
  const components: ComponentInfo[] = [];
  let match;

  // Extract tag names from van.tags destructuring
  const tagNames = new Set<string>();
  const tagsDestructurePattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*van\.tags/g;
  while ((match = tagsDestructurePattern.exec(code)) !== null) {
    const names = match[1].split(",").map((s) => s.trim());
    for (const name of names) {
      if (name) tagNames.add(name);
    }
  }

  // Helper: check if a function body uses van.tags
  const usesVanTags = (body: string): boolean => {
    for (const tag of tagNames) {
      const tagCallPattern = new RegExp(`\\b${tag}\\s*[(\`]`);
      if (tagCallPattern.test(body)) return true;
    }
    return false;
  };

  // Helper: extract function body from a position after =>
  const extractFunctionBody = (startPos: number): string => {
    let depth = 0;
    let bodyStart = startPos;
    let bodyEnd = startPos;
    let inBody = false;

    for (let i = startPos; i < code.length; i++) {
      const char = code[i];
      if (!inBody && /\s/.test(char)) continue;

      if (!inBody) {
        inBody = true;
        bodyStart = i;
      }

      if (char === "(" || char === "{" || char === "[") depth++;
      if (char === ")" || char === "}" || char === "]") depth--;

      if (depth === 0 && (char === ";" || char === "\n")) {
        bodyEnd = i;
        break;
      }
      if (depth < 0) {
        bodyEnd = i;
        break;
      }
    }
    return code.slice(bodyStart, bodyEnd);
  };

  // Detect `export default Name` at end of file
  let defaultExportName: string | null = null;
  const defaultExportPattern = /export\s+default\s+([A-Z][a-zA-Z0-9]*)\s*;?/g;
  while ((match = defaultExportPattern.exec(code)) !== null) {
    defaultExportName = match[1];
  }

  // Pattern 1: export const Name = (...) => ...
  const exportConstPattern =
      /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:async\s+)?(?:<[^>]*>\s*)?(\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*[^{=>][^=>]*?)?\s*=>/g;
  while ((match = exportConstPattern.exec(code)) !== null) {
    const name = match[1];
    const body = extractFunctionBody(match.index + match[0].length);
    if (usesVanTags(body)) {
      const isDefault = name === defaultExportName;
      const nameStart = match.index + match[0].indexOf(match[1]);
      components.push({
              name,
              isDefault,
              declarationStart: match.index,
              nameStart,
              nameEnd: nameStart + name.length,
            });
    }
  }

  // Pattern 2: const Name = (...) => ... (for default exports only)
  if (defaultExportName) {
    if (!components.some((c) => c.name === defaultExportName)) {
    const constPattern = new RegExp(
            `const\\s+(${defaultExportName})\\s*=\\s*(?:async\\s+)?(?:<[^>]*>\\s*)?(\\([^)]*\\)|[a-zA-Z_][a-zA-Z0-9_]*)(?:\\s*:\\s*[^{=>][^=>]*?)?\\s*=>`,
            "g"
          );
      while ((match = constPattern.exec(code)) !== null) {
        const name = match[1];
        const body = extractFunctionBody(match.index + match[0].length);
        if (usesVanTags(body)) {
                  const nameStart = match.index + match[0].indexOf(match[1]);
                  components.push({
                    name,
                    isDefault: true,
                    declarationStart: match.index,
                    nameStart,
                    nameEnd: nameStart + name.length,
                  });
                }
      }
    }
  }

  return components;
}

/** Inject the HMR runtime import */
function injectHmrImport(s: MagicString): void {
  s.prepend(`import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';\n`);
}

// ============================================
// Entry File Transform
// ============================================

interface EntryTransformResult {
  componentProps: Map<string, string>;
}

/**
 * Transform entry files (e.g., main.ts)
 * - Wraps van.add() calls with registerRender() for HMR slot tracking
 * - Generates hot.accept() that passes props to rerender
 */
function transformEntryFile(
  ctx: TransformContext,
  components: ComponentInfo[]
): EntryTransformResult {
  const { code, s, relPath } = ctx;
  const componentProps: Map<string, string> = new Map();

  if (components.length === 0) {
    return { componentProps };
  }

  // Transform van.add(target, Component(props)) calls
  const vanAddPattern =
    /van\.add\s*\(\s*([^,]+)\s*,\s*([A-Z][a-zA-Z0-9]*)\s*\(([^)]*)\)\s*\)/g;
  let match;

  while ((match = vanAddPattern.exec(code)) !== null) {
    const fullMatch = match[0];
    const target = match[1].trim();
    const componentName = match[2];
    const propsArg = match[3].trim();

    const comp = components.find((c) => c.name === componentName);
    if (!comp) continue;

    const slotId = `${relPath}:${componentName}`;
    const start = match.index;
    const end = start + fullMatch.length;

    if (propsArg) {
      componentProps.set(componentName, propsArg);
    }

    // Build replacement with guard + registerRender
    let replacement = `(function() {\n`;
    replacement += `  if (!__VAN_HMR__.renderSlots.has('${slotId}:0')) {\n`;
    if (propsArg) {
      replacement += `    van.add(${target}, __VAN_HMR__.registerRender('${slotId}', ${componentName}, ${propsArg}));\n`;
    } else {
      replacement += `    van.add(${target}, __VAN_HMR__.registerRender('${slotId}', ${componentName}));\n`;
    }
    replacement += `  }\n`;
    replacement += `}())`;

    s.overwrite(start, end, replacement);
  }

  return { componentProps };
}

/** Generate hot.accept() block for entry files */
function generateEntryHotAccept(
  relPath: string,
  components: ComponentInfo[],
  componentProps: Map<string, string>
): string {
  let code = `\nif (import.meta.hot) {\n`;
  code += `  import.meta.hot.accept((newModule) => {\n`;
  code += `    if (newModule) {\n`;

  for (const { name, isDefault } of components) {
    const slotId = `${relPath}:${name}`;
    const moduleRef = isDefault ? "newModule.default" : `newModule.${name}`;
    const propsArg = componentProps.get(name);

    if (propsArg) {
      code += `      __VAN_HMR__.rerender('${slotId}', ${moduleRef}, ${propsArg});\n`;
    } else {
      code += `      __VAN_HMR__.rerender('${slotId}', ${moduleRef});\n`;
    }
  }

  code += `    }\n`;
  code += `  });\n`;
  code += `}\n`;

  return code;
}

// ============================================
// Submodule Transform
// ============================================

/**
 * Transform submodule files (non-entry components)
 * - Exports ${ComponentName} factories for each component to register render $$\_\_hmr__ComponentName
 * - Generates hot.accept() for component rerendering
 */
 function transformSubmoduleComponents(
   ctx: TransformContext,
   components: ComponentInfo[]
 ): void {
   const { code, s, relPath } = ctx;

   for (const { name, isDefault, declarationStart, nameStart, nameEnd } of components) {
     const slotId = `${relPath}:${name}`;
     const hmrName = `$$__hmr__${name}`;

     // Rename the original component declaration in-place
     s.overwrite(nameStart, nameEnd, hmrName);

     if (isDefault) {
       // Ensure the renamed declaration is exported (Pattern 2 has no export keyword)
       const isAlreadyExported = code.slice(declarationStart, declarationStart + 6) === 'export';
       if (!isAlreadyExported) {
         s.prependLeft(declarationStart, 'export ');
       }

       // Insert wrapper const right before `export default Name`
       const exportDefaultMatch = new RegExp(`export\\s+default\\s+${name}\\s*;?`).exec(code);
       if (exportDefaultMatch) {
         s.prependLeft(
           exportDefaultMatch.index,
           `const ${name} = (props) => __VAN_HMR__.registerRender('${slotId}', ${hmrName}, props);\n`
         );
       }
     } else {
       // Named export: append new wrapper as a named export
       s.append(
         `\nexport const ${name} = (props) => __VAN_HMR__.registerRender('${slotId}', ${hmrName}, props);\n`
       );
     }
   }
 }

/** Generate hot.accept() block for submodules */
function generateSubmoduleHotAccept(
  relPath: string,
  components: ComponentInfo[]
): string {
  let code = `\nif (import.meta.hot) {\n`;
  code += `  import.meta.hot.accept((newModule) => {\n`;
  code += `    if (newModule) {\n`;

  for (const { name } of components) {
      const slotId = `${relPath}:${name}`;
      code += `      __VAN_HMR__.rerender('${slotId}', newModule.$$__hmr__${name});\n`;
    }

  code += `    }\n`;
  code += `  });\n`;
  code += `}\n`;

  return code;
}

// ============================================
// Plugin Entry Point
// ============================================

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
      // Skip non-matching files
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

      // Build transform context
      const ctx: TransformContext = {
        code,
        s,
        relPath,
        getLineCol: createLineColHelper(code),
      };

      // === Common transformations ===
      transformVanState(ctx);
      transformVanDerive(ctx);
      const components = detectComponents(code);
      injectHmrImport(s);

      // === Entry vs Submodule specific transformations ===
      if (components.length > 0) {
        if (isEntry) {
          // Entry file: transform van.add() calls, generate entry-specific hot.accept
          const { componentProps } = transformEntryFile(ctx, components);
          s.append(generateEntryHotAccept(relPath, components, componentProps));
        } else {
        // Submodule: transform components in-place, generate submodule hot.accept
        transformSubmoduleComponents(ctx, components);
        s.append(generateSubmoduleHotAccept(relPath, components));
        }
      }

      // Debug: write generated code to file
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
