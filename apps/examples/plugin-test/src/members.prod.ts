import van from "@michthemaker/vanjs";
import { __VAN_HMR__ } from "./hmr-runtime";

const { div, h1, p, button, ul, li } = van.tags;

const randomNames = [
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
  "Grace",
  "Hank",
];
const randomCars = [
  "Tesla Model 3",
  "BMW M3",
  "Porsche 911",
  "Civic Type R",
  "Mazda MX-5",
  "Ford Mustang",
];

export const MembersComponent = ({ buttonTitle }: { buttonTitle: string }) => {
  const cellMembers = __VAN_HMR__.createState("members.prod.ts:cellMembers", [
    { name: "Jane", age: 15 },
    { name: "Joy", age: 18 },
  ]);

  const cars = __VAN_HMR__.createState("members.prod.ts:cars", [
    { name: "Toyota", year: 2020 },
    { name: "Honda", year: 2019 },
  ]);

  return div(
    { style: "padding: 20px;" },

    // Cell members section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #9C27B0; border-radius: 8px; padding: 16px;",
      },
      h1("These are the Cell Members"),
      p(() => `Total: ${cellMembers.val.length} members`),
      ul(() =>
        cellMembers.val.map((m: any) => li(`${m.name} (age: ${m.age})`))
      ),
      button(
        {
          onclick: () => {
            const name =
              randomNames[Math.floor(Math.random() * randomNames.length)];
            const age = 18 + Math.floor(Math.random() * 40);
            cellMembers.val = [...cellMembers.val, { name, age }];
          },
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #9C27B0; color: white; border: none; border-radius: 4px;",
        },
        buttonTitle
      )
    ),

    // Cars section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #FF5722; border-radius: 8px; padding: 16px;",
      },
      h1("Cars"),
      p(() => `Total: ${cars.val.length} cars`),
      ul(() => cars.val.map((c: any) => li(`${c.name} (${c.year})`))),
      button(
        {
          onclick: () => {
            const name =
              randomCars[Math.floor(Math.random() * randomCars.length)];
            const year = 2018 + Math.floor(Math.random() * 8);
            cars.val = [...cars.val, { name, year }];
          },
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #FF5722; color: white; border: none; border-radius: 4px;",
        },
        "Add New Car"
      )
    )
  );
};

// Exported factory function — main.ts calls this with props
export const MembersSection = (props: { buttonTitle: string }) =>
  __VAN_HMR__.registerRender(
    "members.prod.ts:MembersSection",
    MembersComponent,
    props
  );

// On HMR: module re-executes, hot.accept fires with new component and props from call site
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      // Note: props are passed from the call site (main.ts), not here
      // rerender will use the stored props from the most recent registerRender call
      __VAN_HMR__.rerender(
        "members.prod.ts:MembersSection",
        newModule.MembersComponent
      );
    }
  });
}
