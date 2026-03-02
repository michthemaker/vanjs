import van from "@michthemaker/vanjs";
import { __VAN_HMR__ } from "./hmr-runtime";
import { $$__hmr__Counter } from "./counter";
import { $$__hmr__Members } from "./members.prod";

const { div, h1 } = van.tags;

// Wrap the entire composition in a render slot so HMR updates replace
// instead of append. Export the component for hot.accept to use newModule.
export const App = () =>
  div(
    {
      style:
        "padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto;",
    },
    h1(
      {
        style:
          "color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
      },
      "VanJS Multi-File HMR Test us  "
    ),
    $$__hmr__Members({ buttonTitle: "Add Member" }),
    $$__hmr__Counter()
  );

// Only mount if this is the first execution (not HMR reload)
if (!__VAN_HMR__.renderSlots.has("main.ts:App:0")) {
  console.log("yep, mounting app", Array.from(__VAN_HMR__.renderSlots));
  van.add(document.body, __VAN_HMR__.registerRender("main.ts:App", App));
  console.log(
    "these are render slots now",
    Array.from(__VAN_HMR__.renderSlots)
  );
}

// On HMR of main.ts: re-render the app composition with fresh imports
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender("main.ts:App", newModule.App);
    }
  });
}
