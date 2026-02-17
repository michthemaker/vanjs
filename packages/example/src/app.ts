// this file can be used in a browser
// let's us it to test vanjs (nearby folder) types and all things.
import van from "@michthemaker/vanjs";

const { div, h1, p } = van.tags;
const { svg } = van.tags("http://www.w3.org/2000/svg");

const app = div(
	h1(
		{ class: "px-1 text-2xl", onabort: (e) => console.log("abort") },
		"Hello, World!",
		p({}),
	),
	p("This is a test of the vanjs types."),
	svg(),
);

document.body.appendChild(app);
