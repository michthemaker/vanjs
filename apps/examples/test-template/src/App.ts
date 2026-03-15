import van from "@michthemaker/vanjs";
import ViteLogo from "./assets/vite.svg";
import VanJSLogo from "./assets/vanjs.svg";
import { cn } from "./lib/cn";

const { div, h1, h2, p, a, button, code, section, ul, li, img } =
  van.tags;

const { svg, use } = van.tags('http://www.w3.org/2000/svg');

// Shared link class
const linkCls =
  cn("text-gray-800 dark:text-gray-100 text-base rounded-lg bg-gray-100/50 shadow-sm shadow-black/10 ring-1 ring-black/10 dark:bg-gray-800/50 flex px-3 py-1.5 items-center gap-2 no-underline transition-shadow duration-300 hover:shadow-lg max-lg:w-full max-lg:justify-center box-border");

// Shared h2 class
const h2Cls =
  cn("font-sans font-medium text-gray-900 dark:text-gray-100 text-2xl max-lg:text-xl leading-[118%] tracking-[-0.24px] mb-2");

const App = () => {
  const count = van.state(0);

  return div(
    {
      class:
        "w-full max-w-[1126px] mx-auto text-center border-x border-gray-200 dark:border-gray-800 min-h-svh flex flex-col box-border",
    },

    // ── Center ────────────────────────────────────────────────────────────────
    section(
      {
        id: "center",
        class:
          "flex flex-col gap-[18px] lg:gap-[25px] place-content-center place-items-center flex-grow px-5 py-8 lg:px-0",
      },

      // Hero logo
      div(
        { class: "relative flex items-center gap-x-8" },
        img({
          src: VanJSLogo,
          class: "w-16 h-16 mx-auto",
          alt: "Vite logo",
          width: "64",
          height: "64",
        }),
        img({
          src: ViteLogo,
          class: "w-16 h-16 mx-auto",
          alt: "Vite logo",
          width: "64",
          height: "64",
        }),
      ),

      // Headline + subtitle
      div(
        h1(
          {
            class:
              "font-sans font-medium text-gray-900 dark:text-gray-100 text-[36px] lg:text-[56px] tracking-[-1.68px] my-5 lg:my-8",
          },
          "VanJS + Vite + Tailwind"
        ),
        p(
          { class: "text-gray-500 dark:text-gray-400" },
          "Edit ",
          code(
            {
              class:
                "font-mono text-[15px] leading-[135%] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded inline-flex",
            },
            "src/App.ts"
          ),
          " and save to test HMR"
        )
      ),

      // Counter
      button(
        {
          class:
            "font-mono inline-flex rounded text-gray-900 dark:text-gray-100 bg-purple-500/10 dark:bg-purple-400/15 border-2 border-transparent px-[10px] py-[5px] text-base transition-[border-color] duration-300 mb-6 cursor-pointer hover:border-purple-500/50 dark:hover:border-purple-400/50 focus-visible:outline-2 focus-visible:outline-purple-500 dark:focus-visible:outline-purple-400 focus-visible:outline-offset-2",
          onclick: () => count.val++,
        },
        () => `Count is ${count.val}`
      )
    ),

    // ── Ticks ─────────────────────────────────────────────────────────────────
    Ticks(),

    // ── Next steps ────────────────────────────────────────────────────────────
    section(
      {
        id: "next-steps",
        class:
          "flex border-t border-gray-200 dark:border-gray-800 text-left max-lg:flex-col max-lg:text-center",
      },

      // Docs column
      div(
        {
          class:
            "flex-1 p-8 border-r border-gray-200 dark:border-gray-800 max-lg:border-r-0 max-lg:border-b max-lg:p-5",
        },
        svg(
          {
            class: "mb-4 w-[22px] h-[22px]",
            role: "presentation",
            "aria-hidden": "true",
          },
          use({ href: "/icons.svg#documentation-icon" })
        ),
        h2({ class: h2Cls }, "Documentation"),
        p(
          { class: "text-gray-500 dark:text-gray-400" },
          "Your questions, answered"
        ),
        ul(
          {
            class:
              "list-none p-0 flex gap-2 mt-8 max-lg:mt-5 max-lg:flex-wrap max-lg:justify-center",
          },
          li(
            { class: "max-lg:flex-[1_1_calc(50%-8px)]" },
            a(
              { href: "https://vite.dev/", target: "_blank", class: linkCls },
              img({
                class: "h-[18px] w-[18px] hidden min-[360px]:inline",
                src: ViteLogo,
                alt: "",
                width: "18",
                height: "18",
              }),
              "Explore Vite"
            )
          ),
          li(
            { class: "max-lg:flex-[1_1_calc(50%-8px)]" },
            a(
              { href: "https://github.com/michthemaker/vanjs", target: "_blank", class: linkCls },
              img({
                class: "h-[18px] w-[18px] hidden min-[360px]:inline",
                src: VanJSLogo,
                alt: "",
                width: "18",
                height: "18",
              }),
              "Learn VanJS"
            ),
          )
        )
      ),

      // Social column
      div(
        { class: "flex-1 p-8 max-lg:p-5" },
        svg(
          {
            class: "mb-4 w-[22px] h-[22px]",
            role: "presentation",
            "aria-hidden": "true",
          },
          use({ href: "/icons.svg#social-icon" })
        ),
        h2({ class: h2Cls }, "Connect with us"),
        p({ class: "text-gray-500 dark:text-gray-400" }, "Join the community"),
        ul(
          {
            class:
              "list-none p-0 flex gap-2 mt-8 max-lg:mt-5 max-lg:flex-wrap max-lg:justify-center",
          },
          li(
            { class: "max-lg:flex-[1_1_calc(50%-8px)]" },
            a(
              {
                href: "https://github.com/michthemaker/vanjs",
                target: "_blank",
                class: linkCls,
              },
              svg(
                {
                  class: "h-[18px] w-[18px]",
                  role: "presentation",
                  "aria-hidden": "true",
                },
                use({ href: "/icons.svg#github-icon" })
              ),
              "GitHub"
            )
          ),
        )
      )
    ),

    // ── Ticks ─────────────────────────────────────────────────────────────────
    Ticks(),

    // ── Spacer ────────────────────────────────────────────────────────────────
    section({
      class:
        "h-[88px] max-lg:h-12 border-t border-gray-200 dark:border-gray-800",
    })
  );
}

// Decorative tick marks at section boundaries
const Ticks = () => {
  return div({
    class: cn([
      "relative w-full",
      "before:content-[''] before:absolute before:top-[-4.5px] before:left-0",
      "before:border-[5px] before:border-transparent before:border-l-gray-200 dark:before:border-l-gray-800",
      "after:content-[''] after:absolute after:top-[-4.5px] after:right-0",
      "after:border-[5px] after:border-transparent after:border-r-gray-200 dark:after:border-r-gray-800",
    ]),
  });
}

export default App;
