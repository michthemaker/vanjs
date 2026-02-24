import van from "@michthemaker/vanjs";
import { __VAN_HMR__ } from "./hmr-runtime";

const { div, h1, p, button, input } = van.tags;

// ============================================
// Counter + Text Input Component
// ============================================

export const CounterComponent = () => {
  const counter = __VAN_HMR__.createState("counter.ts:counter", 0);
  const textInput = __VAN_HMR__.createState("counter.ts:textInput", "Edit me!");

  return div(
    { style: "padding: 20px;" },

    // Counter section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #4CAF50; border-radius: 8px; padding: 16px;",
      },
      h1("Counter Test me"),
      p(() => `Count : ${counter.val}`),
      p(() => `Doubled: ${counter.val * 2}`),
      button(
        {
          onclick: () => counter.val++,
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px;",
        },
        "Increment"
      ),
      button(
        {
          onclick: () => counter.val--,
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #FF9800; color: white; border: none; border-radius: 4px;",
        },
        "Decrement"
      ),
      button(
        {
          onclick: () => {
            counter.val = 0;
          },
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;",
        },
        "Reset"
      )
    ),

    // Text input section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #2196F3; border-radius: 8px; padding: 16px;",
      },
      h1("Text Input "),
      input({
        type: "text",
        value: () => textInput.val,
        oninput: (e: any) => {
          textInput.val = e.target.value;
        },
        style:
          "padding: 8px; font-size: 16px; width: 300px; border: 1px solid #ccc; border-radius: 4px;",
      }),
      p(() => `You typed:  ls`),
      p(() => `Length: ${textInput.val.length}`)
    )
  );
};

// Exported as a function — main.ts calls this once on initial mount.
// registerRender returns [startMarker, element, endMarker] which van.add flattens.
export const CounterSection = () =>
  __VAN_HMR__.registerRender("counter.ts:CounterSection", CounterComponent);

// On HMR: module re-executes (CounterComponent is redefined), then hot.accept
// fires. We call rerender with the NEW CounterComponent reference so the fresh
// code runs between the existing comment markers, with state preserved.
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule)
      __VAN_HMR__.rerender(
        "counter.ts:CounterSection",
        newModule.CounterComponent
      );
  });
}
