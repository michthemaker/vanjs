import van from "@michthemaker/vanjs";

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
    )
    // MembersSection({ buttonTitle: "Add Member" }),
    // CounterSection()
  );

van.add(document.body, App());
