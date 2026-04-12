import van, { type Ref } from "@michthemaker/vanjs";
import {
  QueryContextProvider,
  ThemeContextProvider,
  useQueryFt,
  useTheme,
} from "./context-test";
import { GifModal } from "./GifModal";

const { div, h1, p, span, button } = van.tags;

// Edge case 1: nested providers (ThemeContext inside QueryContext)
// Expected: both contexts available to deep children on rerender
export const App = (props: { name: string }) => {
  const myName = van.state("Mich");
  const ref: Ref<HTMLHeadingElement> = { current: null };

  return QueryContextProvider(() =>
    ThemeContextProvider(() =>
      div(
        {
          style:
            "padding-inline: 4px; font-family: sans-serif; margin: 0; overflow: auto;",
          class: "no-scrollbar",
        },
        h1(
          {
            style:
              "width: 90%; color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;",
            ref: ref,
          },
          "VanJS HMR Context Edge Cases — ",
          props.name,
          " ",
          myName
        ),

        // Edge case 1: child component using ONE context (QueryContext)
        // Save GifModal.ts → should rerender fine with QueryContext snapshot
        GifModal(),

        // Edge case 2: inline fn using BOTH contexts simultaneously
        // Save App.ts → should have both QueryContext + ThemeContext in snapshot
        () => {
          const query = useQueryFt();
          const theme = useTheme();
          return span(
            { style: `color: ${theme.color};` },
            `query=${query.name} dark=${theme.dark}`
          );
        },

        // Edge case 3: same context used twice in same tree
        // Both reads should return same value
        () => {
          const a = useQueryFt();
          const b = useQueryFt();
          return p(`same context yeah twice: ${a.name} === ${b.name}`);
        }
      )
    )
  );
};
