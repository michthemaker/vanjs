import van, { type Ref } from "@michthemaker/vanjs";
import {} from "./context-test";

const { svg, path } = van.svgTags;
const { div, h1, button } = van.tags;

// Component with props - using named export
export const App = (props: { name: string }) => {
  const myName = van.state("Mich");
  const ref: Ref<HTMLHeadingElement> = { current: null };
  return div(
    {
      style:
        "padding-inline: 4px; font-family: sans-serif;; margin: 0; overflow: auto;",
      class: "no-scrollbar",
    },
    // okaythen,
    svg(
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        color: "currentColor",
        class: "rotate-180 text-white",
        "stroke-width": "2",
      },
      path({
        d: "M12 4V20M20 12H4",
        stroke: "currentColor",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "1.5",
        key: "0",
        opacity: "undefined",
      })
    ),
    h1(
      {
        style:
          "width: 90%; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
        ref: ref,
      },
      "VanJS Multi-File HMR Test - me us ",
      props.name,
      myName
    ),
    button(
      {
        onclick() {
          myName.val = "Michthemaker";
        },
      },
      "Click them"
    )
  );
};

const Foo = () => {
  return h1("name");
};

export { Foo as Bar };
