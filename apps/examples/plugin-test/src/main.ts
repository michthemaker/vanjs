import van from "@michthemaker/vanjs";

const { div, h1, button } = van.tags;

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
      myName
    ),
    button(
      {
        onclick(e) {
          myName.val = "Michthemaker";
        },
      },
      "Click me"
    )
  );
};
van.add(document.body, App({ name: "Mich" }));

export default App
