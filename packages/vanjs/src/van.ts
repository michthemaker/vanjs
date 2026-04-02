import type { ElementEventHandlers } from "./event-handlers.ts";

export type {
  ElementEventHandlers,
  ReactiveEventHandler,
} from "./event-handlers.ts";

/**
 * A reactive state object that automatically triggers updates when its value changes.
 *
 * @template T The type of the state's value.
 *
 * @example
 *
 * ```ts
 * const count = van.state(0);
 * count.val = 5; // triggers reactive updates
 * ```
 */
export interface State<T> {
  /**
   * The current value of the state. Reading tracks it as a dependency, writing triggers updates.
   */
  val: T;

  /**
   * The previous value before the last update.
   */
  readonly oldVal: T;

  /**
   * The raw value without dependency tracking.
   */
  readonly rawVal: T;
}

/**
 * Readonly view of State<T> for covariance.
 */
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

/**
 * A mutable ref object that holds a current value.
 *
 * @template T The type of the ref's value.
 */
export type Ref<T> = { current: T | null };

export type RefProp<T> = { ref?: Ref<T> };

export type ValidChildDomValue =
  | Primitive
  | Node
  | null
  | undefined
  | ValidChildDomValue[];

export type BindingFunc = () => ValidChildDomValue;

export type ChildDom =
  | ValidChildDomValue
  | StateView<Primitive | null | undefined>
  | BindingFunc
  | readonly ChildDom[];

export type TagFunc<Result extends Element> = (
  first?:
    | (Props & PropsWithKnownKeys<Result> & ElementEventHandlers<Result>)
    | ChildDom
    | RefProp<Result>,
  ...rest: readonly ChildDom[]
) => Result;

/**
 * HTML tag functions typed for all known HTML elements.
 */
type HTMLTags = Readonly<Record<string, TagFunc<Element>>> & {
  [K in keyof HTMLElementTagNameMap]: TagFunc<HTMLElementTagNameMap[K]>;
};

/**
 * SVG tag functions typed for all known SVG elements.
 */
type SVGTags = Readonly<Record<string, TagFunc<SVGElement>>> & {
  [K in keyof SVGElementTagNameMap]: TagFunc<SVGElementTagNameMap[K]>;
};

/**
 * MathML tag functions typed for all known MathML elements.
 */
type MathMLTags = Readonly<Record<string, TagFunc<MathMLElement>>> & {
  [K in keyof MathMLElementTagNameMap]: TagFunc<MathMLElementTagNameMap[K]>;
};

type SVGNamespaceURI = "http://www.w3.org/2000/svg";
type MathMLNamespaceURI = "http://www.w3.org/1998/Math/MathML";

/**
 * Creates tag functions for elements in a specific namespace.
 */
type NamespacedTags = {
  (namespaceURI: SVGNamespaceURI): SVGTags;
  (namespaceURI: MathMLNamespaceURI): MathMLTags;
  (namespaceURI: string): Readonly<Record<string, TagFunc<Element>>>;
};

/**
 * Creates a reactive state object.
 *
 * @template T The type of the state's value.
 *
 * @example
 *
 * ```ts
 * const count = van.state(0);
 * const name = van.state("Alice");
 * ```
 */
declare function state<T>(): State<T>;
declare function state<T>(initVal: T): State<T>;

/**
 * The main VanJS interface.
 */
export interface Van {
  /**
   * Creates a reactive state object.
   */
  readonly state: typeof state;

  /**
   * Creates derived state from a function.
   */
  readonly derive: <T>(f: () => T) => State<T>;

  /**
   * Adds child elements to a DOM node.
   */
  readonly add: (
    dom: Element | DocumentFragment,
    ...children: readonly ChildDom[]
  ) => Element;

  /**
   * Tag functions for creating HTML, SVG, and MathML elements.
   */
  readonly tags: HTMLTags & NamespacedTags;

  /**
   * Hydrates existing DOM with VanJS reactivity.
   */
  readonly hydrate: <T extends Node>(
    dom: T,
    f: (dom: T) => T | null | undefined
  ) => T;
}

declare const van: Van;

export default van;
