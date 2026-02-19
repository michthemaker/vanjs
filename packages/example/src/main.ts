import van from "@michthemaker/vanjs";

const { div, h1, p } = van.tags;
const { svg } = van.tags("http://www.w3.org/2000/svg");

const base = 2000;
const Home = () => {
	const details = van.state(["John Doe", 30]);
	setTimeout(() => {
		details.val = ["Jane Doe", 25];
	}, base * 3);
	setTimeout(() => {
		details.val = [24, "Developer"];
	}, base * 4);
	setTimeout(() => {
		details.val = ["Jane Doe", "jakub krehel", "joela", 30, "james"];
	}, base * 5);
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
