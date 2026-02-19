import van from "@michthemaker/vanjs";

const { div, h1, p } = van.tags;
const { svg } = van.tags("http://www.w3.org/2000/svg");

const Home = () => {
	const details = van.state(["John Doe", 30, "Developer"] as const);
	return div(
		h1(
			() => details.val.map((_) => p(_)),
			"Hello, World!",
			() => p(),
		),
		p("This is a test of the vanjs types."),
		svg(),
	);
};

van.add(document.body, Home());
