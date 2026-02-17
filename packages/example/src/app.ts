// this file can be used in a browser
// let's us it to test vanjs (nearby folder) types and all things.
import van from "@michthemaker/vanjs";

const { div, h1, p } = van.tags;

const app = div(
	h1("Hello, World!", p({})),
	p("This is a test of the vanjs types."),
);

document.body.appendChild(app);
