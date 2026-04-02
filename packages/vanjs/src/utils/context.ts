import type { ChildDom, State, StateView } from "../van.ts";

const IS_CONTEXT_OBJECT = Symbol("vanjs_is_context_object");

/**
 * A context object for sharing reactive state across the component tree.
 *
 * @template T The type of the context's value.
 */
export type Context<T> = {
  Provider: (
    stateValue: State<T>,
    childrenFn: () => Exclude<ChildDom, undefined>
  ) => ChildDom;
};

const contextStacks = new Map<Context<any>, StateView<any>[]>();

/**
 * Creates a context object for sharing state without prop drilling.
 *
 * @template T The type of value this context will hold
 *
 * @example
 *
 * ```ts
 * const ThemeContext = createContext<{ color: string }>();
 * const theme = van.state({ color: "blue" });
 *
 * ThemeContext.Provider(theme, () => {
 *   const currentTheme = useContext(ThemeContext);
 *   return div(() => `Color: ${currentTheme.val.color}`);
 * });
 * ```
 */
export let createContext = <T>(): Context<T> => {
  return {
    // @ts-ignore
    [IS_CONTEXT_OBJECT]: true,
    Provider: function provider(stateValue, childrenFn) {
      if (!contextStacks.has(this)) {
        contextStacks.set(this, []);
      }
      const stack = contextStacks.get(this)!;
      stack.push(stateValue);
      const result = childrenFn();
      stack.pop();
      return result;
    },
  };
};

/**
 * Returns the current context value from the nearest Provider.
 *
 * @template T The type of the context's value
 *
 * @example
 *
 * ```ts
 * const theme = useContext(ThemeContext);
 * div(() => `Color: ${theme.val.color}`);
 * ```
 */
export let useContext = <T>(context: Context<T>): State<T> => {
  // @ts-ignore
  if (!context[IS_CONTEXT_OBJECT]) throw new Error("Object is not a `Context`");
  const stack = contextStacks.get(context);
  if (!stack || stack.length === 0)
    throw new Error("useContext must be called within a Provider");
  return stack[stack.length - 1];
};
