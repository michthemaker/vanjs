// this file can be used in a browser
// let's us it to test vanjs (nearby folder) types and all things.
import van from "@michthemaker/vanjs";

const { div, h1, p, input } = van.tags;
const { svg } = van.tags("http://www.w3.org/2000/svg");

const Home = () => {
	const details = van.state(["John Doe", 30, "Developer"] as const);
	return div(
		h1(
			{
				class: "px-1 text-2xl",
				onclick: (e) => console.log(e.currentTarget),
			},
			input({
				type: "text",
				placeholder: "Enter your name",
				oninput: (e) => console.log(e.currentTarget.value),
			}),
			"Hello, World!",
			() => p(),
			() => details.val.map((_) => p(_)),
		),
		p("This is a test of the vanjs types."),
		svg(),
	);
};

van.add(document.body, Home());
