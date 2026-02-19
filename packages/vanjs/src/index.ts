// This file consistently uses `let` keyword instead of `const` for reducing the bundle size.

import type { State, ChildDom, Van } from "./van.ts";
import type { ListBinding } from "./reactive-lists.ts";
import { createListBinding, updateListBinding } from "./reactive-lists.js";

export type * from "./van.ts";

// Internal types
type ConnectedDom = Node | { isConnected: number };
type Binding = { f: BindingFunc; _dom?: Node; _listBinding?: ListBinding };
type Listener = {
	f: DeriveFunc;
	s: StateInternal<unknown>;
	_dom?: ConnectedDom;
};
type BindingFunc = (dom?: Node) => unknown;
type DeriveFunc = (val?: unknown) => unknown;
type Deps = {
	_getters: Set<StateInternal<unknown>>;
	_setters: Set<StateInternal<unknown>>;
};
type StateInternal<T> = State<T> & {
	rawVal: T;
	_oldVal: T;
	_bindings: Binding[];
	_listeners: Listener[];
};

// Global variables - aliasing some builtin symbols to reduce the bundle size.
let protoOf = Object.getPrototypeOf;
let changedStates: Set<StateInternal<unknown>> | undefined,
	derivedStates: Set<StateInternal<unknown>> | undefined,
	curDeps: Deps | undefined,
	curNewDerives: Listener[] | undefined,
	alwaysConnectedDom: { isConnected: number } = { isConnected: 1 };
let gcCycleInMs = 1000,
	statesToGc: Set<StateInternal<unknown>> | undefined,
	propSetterCache: Record<string, ((v: unknown) => void) | 0> = {};
let objProto = protoOf(alwaysConnectedDom),
	funcProto = protoOf(protoOf),
	_undefined: undefined;

let addAndScheduleOnFirst = <T>(
	set: Set<T> | undefined,
	s: T,
	f: () => void,
	waitMs?: number,
): Set<T> =>
	(
		set ?? (waitMs ? setTimeout(f, waitMs) : queueMicrotask(f), new Set<T>())
	).add(s);

let runAndCaptureDeps = <T>(f: (arg: T) => T, deps: Deps, arg: T): T => {
	let prevDeps = curDeps;
	curDeps = deps;
	try {
		return f(arg);
	} catch (e) {
		console.error(e);
		return arg;
	} finally {
		curDeps = prevDeps;
	}
};

let keepConnected = <T extends { _dom?: ConnectedDom }>(l: T[]): T[] =>
	l.filter((b) => b._dom?.isConnected);

let addStatesToGc = (d: StateInternal<unknown>): Set<StateInternal<unknown>> =>
	(statesToGc = addAndScheduleOnFirst(
		statesToGc,
		d,
		() => {
			for (let s of statesToGc!)
				((s._bindings = keepConnected(s._bindings)),
					(s._listeners = keepConnected(s._listeners)));
			statesToGc = _undefined;
		},
		gcCycleInMs,
	));

let stateProto: StateInternal<unknown> = {
	get val(): unknown {
		curDeps?._getters?.add(this as StateInternal<unknown>);
		return this.rawVal;
	},

	get oldVal(): unknown {
		curDeps?._getters?.add(this as StateInternal<unknown>);
		return this._oldVal;
	},

	set val(v: unknown) {
		curDeps?._setters?.add(this as StateInternal<unknown>);
		if (v !== this.rawVal) {
			this.rawVal = v;
			this._bindings.length + this._listeners.length
				? (derivedStates?.add(this as StateInternal<unknown>),
					(changedStates = addAndScheduleOnFirst(
						changedStates,
						this as StateInternal<unknown>,
						updateDoms,
					)))
				: (this._oldVal = v);
		}
	},
	rawVal: _undefined,
	_oldVal: _undefined,
	_bindings: [],
	_listeners: [],
};

let state = <T>(initVal?: T): State<T> =>
	({
		__proto__: stateProto,
		rawVal: initVal,
		_oldVal: initVal,
		_bindings: [],
		_listeners: [],
	}) as unknown as State<T>;

// WeakMap to track list bindings by their start markers
let listBindingMap = new WeakMap<Comment, ListBinding>();

let bind = (f: BindingFunc, dom?: Node): Node => {
	let deps: Deps = { _getters: new Set(), _setters: new Set() },
		binding: Binding = { f },
		prevNewDerives = curNewDerives;
	curNewDerives = [];
	let newDom: unknown = runAndCaptureDeps(
		f as (arg: unknown) => unknown,
		deps as Deps,
		dom,
	);

	// Handle array of nodes (including nested arrays)
	if (Array.isArray(newDom)) {
		// Flatten nested arrays and filter to only Node instances
		let flatNodes = (newDom as unknown[])
			.flat(Infinity)
			.map((n) => (typeof n === "string" ? new Text(n) : n))
			.filter((n) => n instanceof Node) as Node[];
		let listBinding = createListBinding(flatNodes);
		binding._listBinding = listBinding;
		listBindingMap.set(listBinding.startMarker, listBinding);
		for (let d of deps._getters)
			deps._setters.has(d) || (addStatesToGc(d), d._bindings.push(binding));
		for (let l of curNewDerives) l._dom = listBinding.startMarker;
		curNewDerives = prevNewDerives;
		return (binding._dom = listBinding.startMarker);
	}

	// Handle single node or text node
	newDom = ((newDom ?? document) as Node).nodeType
		? newDom
		: new Text(newDom as string);

	for (let d of deps._getters)
		deps._setters.has(d) || (addStatesToGc(d), d._bindings.push(binding));
	for (let l of curNewDerives) l._dom = newDom as Node;
	curNewDerives = prevNewDerives;
	return (binding._dom = newDom as Node);
};

let derive = <T>(
	f: () => T,
	s: StateInternal<T> = state() as StateInternal<T>,
	dom?: ConnectedDom,
): State<T> => {
	let deps: Deps = { _getters: new Set(), _setters: new Set() },
		listener: Listener = { f: f as DeriveFunc, s: s as StateInternal<unknown> };
	listener._dom = (dom ??
		curNewDerives?.push(listener) ??
		alwaysConnectedDom) as ConnectedDom;
	s.val = runAndCaptureDeps(f as (arg: T) => T, deps as Deps, s.rawVal);
	for (let d of deps._getters)
		deps._setters.has(d) || (addStatesToGc(d), d._listeners.push(listener));
	return s;
};

let add = (dom: Element, ...children: readonly ChildDom[]): Element => {
	for (let c of (children as unknown[]).flat(Infinity)) {
		let protoOfC = protoOf(c ?? 0);
		let child =
			protoOfC === stateProto
				? bind(() => (c as StateInternal<unknown>).val)
				: protoOfC === funcProto
					? bind(c as BindingFunc)
					: c;
		if (child != _undefined) {
			if (Array.isArray(child)) {
				add(dom, ...child);
			} else {
				// Check if this is a list binding start marker
				let listBinding = listBindingMap.get(child as Comment);
				if (listBinding) {
					// Append start marker, all nodes, and end marker
					dom.append(listBinding.startMarker);
					for (let node of listBinding.nodes) {
						dom.append(node);
					}
					dom.append(listBinding.endMarker);
				} else {
					// Regular node
					dom.append(child as Node);
				}
			}
		}
	}
	return dom;
};

let tag = (
	ns: string | undefined,
	name: string,
	...args: unknown[]
): Element => {
	let [{ is, ...props }, ...children] =
		protoOf(args[0] ?? 0) === objProto
			? (args as [{ is?: string } & Record<string, unknown>, ...unknown[]])
			: ([{}, ...args] as [
					{ is?: string } & Record<string, unknown>,
					...unknown[],
				]);
	let dom = ns
		? document.createElementNS(ns, name, { is })
		: document.createElement(name, { is });
	for (let [k, v] of Object.entries(props)) {
		let getPropDescriptor = (
			proto: object | null,
		): PropertyDescriptor | undefined =>
			proto
				? (Object.getOwnPropertyDescriptor(proto, k) ??
					getPropDescriptor(protoOf(proto)))
				: _undefined;
		let cacheKey = name + "," + k;
		let propSetter = (propSetterCache[cacheKey] ??=
			getPropDescriptor(protoOf(dom))?.set ?? 0);
		let setter: (v: unknown, oldV?: unknown) => void = k.startsWith("on")
			? (v, oldV) => {
					let event = k.slice(2);
					dom.removeEventListener(event, oldV as EventListener);
					dom.addEventListener(event, v as EventListener);
				}
			: propSetter
				? (propSetter as (v: unknown) => void).bind(dom)
				: (v: unknown) => dom.setAttribute(k, v as string);
		let protoOfV = protoOf(v ?? 0);
		k.startsWith("on") ||
			(protoOfV === funcProto &&
				((v = derive(v as () => unknown)), (protoOfV = stateProto)));
		protoOfV === stateProto
			? bind(
					() => (
						setter(
							(v as StateInternal<unknown>).val,
							(v as StateInternal<unknown>)._oldVal,
						),
						dom
					),
				)
			: setter(v);
	}
	return add(dom, children as ChildDom[]);
};

type TagHandler = {
	get: (_: unknown, name: string) => (...args: unknown[]) => Element;
};
let handler = (ns?: string): TagHandler => ({
	get: (_, name) => tag.bind(_undefined, ns, name),
});

let update = (dom: ChildNode, newDom: Node | undefined): void => {
	newDom ? newDom !== dom && dom.replaceWith(newDom) : dom.remove();
};

let updateDoms = (): void => {
	let iter = 0,
		derivedStatesArray = [...changedStates!].filter(
			(s) => s.rawVal !== s._oldVal,
		);
	do {
		derivedStates = new Set();
		for (let l of new Set<Listener>(
			derivedStatesArray.flatMap(
				(s) => (s._listeners = keepConnected(s._listeners)),
			),
		))
			(derive(l.f as () => unknown, l.s, l._dom), (l._dom = _undefined));
	} while (++iter < 100 && (derivedStatesArray = [...derivedStates]).length);
	let changedStatesArray = [...changedStates!].filter(
		(s) => s.rawVal !== s._oldVal,
	);
	changedStates = _undefined;
	for (let b of new Set<Binding>(
		changedStatesArray.flatMap(
			(s) => (s._bindings = keepConnected(s._bindings)),
		),
	)) {
		// Check if this is a list binding
		if (b._listBinding) {
			// Re-run the binding function to get new nodes
			let deps: Deps = { _getters: new Set(), _setters: new Set() };
			let newDom: unknown = runAndCaptureDeps(
				b.f as (arg: unknown) => unknown,
				deps as Deps,
				b._dom,
			);
			// Update the list binding with new nodes (flatten nested arrays)
			if (Array.isArray(newDom)) {
				let flatNodes = (newDom as unknown[])
					.flat(Infinity)
					.map((n) => (typeof n === "string" ? new Text(n) : n))
					.filter((n) => n instanceof Node) as Node[];
				updateListBinding(b._listBinding, flatNodes);
			}
			// Restore the DOM reference to the start marker
			b._dom = b._listBinding.startMarker;
		} else {
			// Regular single node update
			update(b._dom as ChildNode, bind(b.f, b._dom));
			b._dom = _undefined;
		}
	}
	for (let s of changedStatesArray) s._oldVal = s.rawVal;
};

let van: Van = {
	tags: new Proxy(
		(ns: string) => new Proxy(tag, handler(ns)),
		handler(),
	) as Van["tags"],
	hydrate: <T extends Node>(dom: T, f: (dom: T) => T | null | undefined): T => (
		update(dom as unknown as ChildNode, bind(f as BindingFunc, dom)),
		dom
	),
	add: (
		dom: Element | DocumentFragment,
		...children: readonly ChildDom[]
	): Element => add(dom as Element, ...children),
	state,
	derive: <T>(f: () => T): State<T> => derive(f),
};

export default van;
