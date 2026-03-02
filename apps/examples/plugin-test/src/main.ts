import van from "@michthemaker/vanjs";
// import { Counter } from './counter'

const { div, h1, button } = van.tags;

const Name = () => {
  return div("Named ls");
};

// Component with props - using named export
const App = (props: { name: string }) => {
  const myName = van.state("Mich");
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
    Name(),
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
