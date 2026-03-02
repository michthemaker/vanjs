import { __VAN_HMR__ } from 'virtual:vanjs-hmr-runtime';
import van from "@michthemaker/vanjs";

const { div, h1 } = van.tags;

// Wrap the entire composition in a render slot so HMR updates replace
// instead of append. Export the component for hot.accept to use newModule.
export const Name = (props: {name: string}) =>
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
      "VanJS Multi-File HMR Test"
    )
    // MembersSection({ buttonTitle: "Add Member" }),
    // CounterSection()
// van.add line should wrapped in render slots check with the __VAN_HMR__ registerRender line, if the component definition has props and  van.add component call is passed an argument we want to pass that as the third argument to the regiserRender
  );

van.add(document.body, App({ name: 'me' }));


// [VanJS HMR] Entry mount guard
// use 0 as the slot index for the App root
if (!__VAN_HMR__.renderSlots.has('src/main.ts:Name:0')) {
  van.add(document.body, __VAN_HMR__.registerRender('src/main.ts:Name', Name));
}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      __VAN_HMR__.rerender('src/main.ts:Name', newModule.Name);
    }
  });
}
