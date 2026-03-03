import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';
import van from "@michthemaker/vanjs";
const { div, h1, p, button, input } = van.tags;

export const $$__hmr__Counter = (): any => {
  const counter = __VAN_HMR__.createState('src/counter.ts:5:19', 0);
  const textInput = __VAN_HMR__.createState('src/counter.ts:6:21', "Edit Me!");

  // Test van.derive - now preserved across HMR with createDerived
  const doubled = __VAN_HMR__.createDerived('src/counter.ts:9:19', () => counter.val * 2);
  const tripled = __VAN_HMR__.createDerived('src/counter.ts:10:19', () => counter.val * 3);

  return div(
    { style: "padding: 80px;" },

    // Counter section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #4CAF50; border-radius: 8px; padding: 16px;",
      },
      h1("Counter testing meee waitng for us "),
      p(() => `Count: ${counter.val} + js`),
      p(() => `Doubled (inline): ${counter.val * 2}`),
      p(() => `derived 😉 Doubled : ${doubled.val}`),
      p(() => `Tripled (derived): ${tripled.val}`),
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
          "margin-bottom: 20px; border: 2px solid #2196F3; border-radius: 8px; padding: 16px; display: none;",
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
      p(() => `You typed: me ls`),
      p(() => `Length: ${textInput.val.length}`)
    )
  );
};

export const Counter = (props) => __VAN_HMR__.registerRender('src/counter.ts:Counter', $$__hmr__Counter, props);

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender('src/counter.ts:Counter', newModule.$$__hmr__Counter);
    }
  });
}
