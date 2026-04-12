import van, { type Ref } from "@michthemaker/vanjs";
import { QueryContextProvider, useQueryFt } from "./context-test";
import { GifModal } from "./GifModal";

const { div, h1, p } = van.tags;

// Component with props - using named export
export const App = (props: { name: string }) => {
  const myName = van.state("Mich");
  const ref: Ref<HTMLHeadingElement> = { current: null };
  return QueryContextProvider(() =>
    div(
      {
        style:
          "padding-inline: 4px; font-family: sans-serif;; margin: 0; overflow: auto;",
        class: "no-scrollbar",
      },
      h1(
        {
          style:
            "width: 90%; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
          ref: ref,
        },
        "VanJS Multi-File HMR Test - me usaa and meee ",
        props.name,
        myName
      ),
      GifModal(),
      () => {
        const me = useQueryFt();
        return me.name;
      }
    )
  );
};
