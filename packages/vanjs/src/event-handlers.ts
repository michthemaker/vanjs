// event-handlers.ts
// Strongly typed event handlers extracted from DOM element types

import type { StateView } from "./van.ts";

/**
 * Extracts the event type from an event handler property.
 *
 * The `[T]` tuple syntax prevents TypeScript from distributing over union types,
 * ensuring we get a single specific event type (e.g., `PointerEvent`) instead of
 * a union of event types (e.g., `Event | PointerEvent`).
 *
 * @example `((e: MouseEvent) => any) | null` -> `MouseEvent`
 */

type ExtractEventType<T> = [T] extends [
	((e: infer E extends Event) => any) | null,
]
	? E
	: Event;

/**
 * An event handler that can be:
 * - A direct function
 * - A reactive State containing a function
 * - A derive function that returns a function
 */
export type ReactiveEventHandler<E extends Event, Target extends Element> =
	| ((e: E & { currentTarget: Target }) => void)
	| StateView<((e: E) => void) | null>
	| (() => ((e: E) => void) | null);

/**
 * Extracts all `on*` event handler properties from an element type
 * and properly types them with:
 * - The correct Event subtype (MouseEvent, KeyboardEvent, etc.)
 * - The correct `currentTarget` type (the element itself)
 * - Support for reactive handlers (State and derive functions)
 */
export type ElementEventHandlers<E extends Element> = {
	[K in keyof E as K extends `on${string}`
		? // this means can we assign an function with event parameter to the event handler property?
			((ev: Event) => any) | null extends E[K]
			? K
			: never
		: never]?: ReactiveEventHandler<ExtractEventType<E[K]>, E>;
};
