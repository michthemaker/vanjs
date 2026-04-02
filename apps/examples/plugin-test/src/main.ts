import van, { type Ref } from "@michthemaker/vanjs";
import { Counter } from "./barrel-export";
import { ContextTest } from "./context-test";

const { div, h1, button } = van.tags;

// Component with props - using named export
const App = (props: { name: string }) => {
  const myName = van.state("Mich");
  const ref: Ref<HTMLHeadingElement> = { current: null };
  return div(
    {
      style:
        "padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto;",
    },
    ContextTest(),
    h1(
      {
        style:
          "color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
        ref: ref,
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

van.add(document.body, App({ name: "Mice" }));

export default App;
