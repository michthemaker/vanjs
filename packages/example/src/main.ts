import van from "@michthemaker/vanjs";

const { div, h1, p, video, button } = van.tags;

const Home = () => {
	const cellMembers = van.state([
		{ name: "Jane", age: 25 },
		{ name: "Joy", age: 18 },
	]);
	const cars = van.state([
		{ name: "Toyota", year: 2020 },
		{ name: "Honda", year: 2019 },
	]);
	return div(
		div(
			// render nested list
			() =>
				cellMembers.val.map((member) => [
					h1(member.name),
					p(`${member.age} years old`),
				]),
		),
		div(
			// render list
			() => cars.val.map((car) => div(h1(car.name), p(`${car.year} model`))),
		),
		Video(),
	);
};

export const Video = () => {
	return div(
		video({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }),
		button(
			{
				onclick: (e) /* e is typed as PointerEvent */ =>
					console.log("Button clicked!", e.currentTarget),
			},
			"This is a video.",
		),
	);
};

van.add(document.body, Home());
