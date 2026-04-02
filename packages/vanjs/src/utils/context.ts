import type { ChildDom, State, StateView } from "../van.ts";

const IS_CONTEXT_OBJECT = Symbol("vanjs_is_context_object");

export type Context<T> = {
  Provider: (
    stateValue: State<T>,
    childrenFn: () => Exclude<ChildDom, undefined>
  ) => ChildDom;
};

const contextStacks = new Map<Context<any>, StateView<any>[]>();

export let createContext = <T>(): Context<T> => {
  return {
    // @ts-ignore
    [IS_CONTEXT_OBJECT]: true,
    Provider: function provider(stateValue, childrenFn) {
      // 1. Get or create stack for this context
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

export let useContext = <T>(context: Context<T>): State<T> => {
  // @ts-ignore
  if (!context[IS_CONTEXT_OBJECT]) throw new Error("Object is not a `Context`");
  const stack = contextStacks.get(context);
  if (!stack || stack.length === 0)
    throw new Error("useContext must be called within a Provider");
  return stack[stack.length - 1];
};
