import type { ElementEventHandlers } from "./event-handlers.ts";

export type {
	ElementEventHandlers,
	ReactiveEventHandler,
} from "./event-handlers.ts";

export interface State<T> {
	val: T;
	readonly oldVal: T;
	readonly rawVal: T;
}

// Defining readonly view of State<T> for covariance.
// Basically we want StateView<string> to implement StateView<string | number>
export type StateView<T> = Readonly<State<T>>;

export type Val<T> = State<T> | T;

export type Primitive = string | number | boolean | bigint;

export type PropValue = Primitive | ((e: any) => void) | null;

export type PropValueOrDerived =
	| PropValue
	| StateView<PropValue>
	| (() => PropValue);

export type Props = Record<string, PropValueOrDerived> & {
	class?: PropValueOrDerived;
	is?: string;
};

export type PropsWithKnownKeys<ElementType> = Partial<{
	[K in keyof ElementType as K extends `on${string}`
		? ((ev: Event) => any) | null extends ElementType[K]
			? never
			: K
		: K]: PropValueOrDerived;
}>;

export type ValidChildDomValue = Primitive | Node | null | undefined;

export type BindingFunc =
	| ((dom?: Node) => ValidChildDomValue)
	| ((dom?: Element) => Element);

export type ChildDom =
	| ValidChildDomValue
	| StateView<Primitive | null | undefined>
	| BindingFunc
	| readonly ChildDom[];

export type TagFunc<Result extends Element> = (
	first?:
		| (Props & PropsWithKnownKeys<Result> & ElementEventHandlers<Result>)
		| ChildDom,
	...rest: readonly ChildDom[]
) => Result;

// HTML Tags - typed for all known HTML elements
type HTMLTags = Readonly<Record<string, TagFunc<Element>>> & {
	[K in keyof HTMLElementTagNameMap]: TagFunc<HTMLElementTagNameMap[K]>;
};

// SVG Tags - typed for all known SVG elements
type SVGTags = Readonly<Record<string, TagFunc<SVGElement>>> & {
	[K in keyof SVGElementTagNameMap]: TagFunc<SVGElementTagNameMap[K]>;
};

// MathML Tags - typed for all known MathML elements
type MathMLTags = Readonly<Record<string, TagFunc<MathMLElement>>> & {
	[K in keyof MathMLElementTagNameMap]: TagFunc<MathMLElementTagNameMap[K]>;
};

// Namespace URIs
type SVGNamespaceURI = "http://www.w3.org/2000/svg";
type MathMLNamespaceURI = "http://www.w3.org/1998/Math/MathML";

// Namespace function overloads
type NamespacedTags = {
	(namespaceURI: SVGNamespaceURI): SVGTags;
	(namespaceURI: MathMLNamespaceURI): MathMLTags;
	(namespaceURI: string): Readonly<Record<string, TagFunc<Element>>>;
};

declare function state<T>(): State<T>;
declare function state<T>(initVal: T): State<T>;

export interface Van {
	readonly state: typeof state;
	readonly derive: <T>(f: () => T) => State<T>;
	readonly add: (
		dom: Element | DocumentFragment,
		...children: readonly ChildDom[]
	) => Element;
	readonly tags: HTMLTags & NamespacedTags;
	readonly hydrate: <T extends Node>(
		dom: T,
		f: (dom: T) => T | null | undefined,
	) => T;
}

declare const van: Van;

export default van;
