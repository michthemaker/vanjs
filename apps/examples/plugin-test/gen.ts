import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';
import van from "@michthemaker/vanjs";
import { Counter } from './counter'

const { div, h1, button } = van.tags;

// Component with props - using named export
export const App = (props: { name: string }) => {
  const myName = __VAN_HMR__.createState('src/main.ts:8:18', "Mich");
  return div(
    {
      style:
        "padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto;",
    },
    h1(
      {
        style:
          "color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
      },
      "VanJS Multi-File HMR Test - me us ",
      props.name,
      myName
    ),
    Counter(),
    button(
      {
        onclick() {
          myName.val = "Michthemaker";
        },
      },
      "Click me"
    )
  );
};
(function() {
  if (!__VAN_HMR__.renderSlots.has('src/main.ts:App:0')) {
    van.add(document.body, __VAN_HMR__.registerRender('src/main.ts:App', App, { name: "Mice" }));
  }
}());

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender('src/main.ts:App', newModule.App, { name: "Mice" });
    }
  });
}
