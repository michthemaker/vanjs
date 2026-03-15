import van from "@michthemaker/vanjs";
import ViteLogo from "./assets/vite.svg";
import VanJSLogo from "./assets/vanjs.svg";

const { div, h1, h2, p, a, button, code, section, ul, li, img } = van.tags;
const { svg, use } = van.tags("http://www.w3.org/2000/svg");

const App = () => {
  const count = van.state(0);

  return div(
    { class: "app" },

    // ── Center ────────────────────────────────────────────────────────────────
    section(
      { id: "center" },

      // Hero logos
      div(
        { class: "hero" },
        img({ src: VanJSLogo, class: "logo", alt: "VanJS logo", width: "64", height: "64" }),
        img({ src: ViteLogo, class: "logo", alt: "Vite logo", width: "64", height: "64" }),
      ),

      // Headline + subtitle
      div(
        h1("VanJS + Vite"),
        p(
          { class: "subtitle" },
          "Edit ",
          code("src/App.js"),
          " and save to test HMR"
        )
      ),

      // Counter
      button(
        {
          class: "counter",
          onclick: () => count.val++,
        },
        () => `Count is ${count.val}`
      )
    ),

    // ── Ticks ─────────────────────────────────────────────────────────────────
    Ticks(),

    // ── Next steps ────────────────────────────────────────────────────────────
    section(
      { id: "next-steps" },

      // Docs column
      div(
        { class: "column" },
        svg(
          { class: "column-icon", role: "presentation", "aria-hidden": "true" },
          use({ href: "/icons.svg#documentation-icon" })
        ),
        h2("Documentation"),
        p({ class: "column-desc" }, "Your questions, answered"),
        ul(
          { class: "link-list" },
          li(
            a(
              { href: "https://vite.dev/", target: "_blank", class: "link" },
              img({ class: "link-icon", src: ViteLogo, alt: "", width: "18", height: "18" }),
              "Explore Vite"
            )
          ),
          li(
            a(
              { href: "https://github.com/michthemaker/vanjs", target: "_blank", class: "link" },
              img({ class: "link-icon", src: VanJSLogo, alt: "", width: "18", height: "18" }),
              "Learn VanJS"
            )
          )
        )
      ),

      // Social column
      div(
        { class: "column" },
        svg(
          { class: "column-icon", role: "presentation", "aria-hidden": "true" },
          use({ href: "/icons.svg#social-icon" })
        ),
        h2("Connect with us"),
        p({ class: "column-desc" }, "Join the community"),
        ul(
          { class: "link-list" },
          li(
            a(
              { href: "https://github.com/michthemaker/vanjs", target: "_blank", class: "link" },
              svg(
                { class: "link-icon", role: "presentation", "aria-hidden": "true" },
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
    section({ class: "spacer" })
  );
};

// Decorative tick marks at section boundaries
const Ticks = () => div({ class: "ticks" });

export default App;
