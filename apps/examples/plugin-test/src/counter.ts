import van from "@michthemaker/vanjs";
const { div, h1, p, button, input } = van.tags;

const Counter = (): any => {
  const counter = van.state(0);
  const textInput = van.state("Edit Me!");

  // Test van.derive - now preserved across HMR with createDerived
  const doubled = van.derive(() => counter.val * 2);
  const tripled = van.derive(() => counter.val * 3);

  return div(
    { style: "padding: 80px;" },

    // Counter section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #4CAF50; border-radius: 8px; padding: 16px;",
      },
      h1("Counter testing meee waitng for us "),
      p(() => `Count: ${counter.val} + name`),
      p(() => `Doubled (inline): ${counter.val * 2}`),
      p(() => `derived 😉 Doubled : ${doubled.val}`),
      p(() => `Tripled (derived): ${tripled.val}`),
      button(
        {
          onclick: () => counter.val++,
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #4CAF50; color: white; border: none; border-radius: 4px;",
        },
        "Increment"
      ),
      button(
        {
          onclick: () => counter.val--,
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background-color: #FF9800; color: white; border: none; border-radius: 4px;",
        },
        "Decrement"
      ),
      button(
        {
          onclick: () => {
            counter.val = 0;
          },
          style:
            "margin: 5px; padding: 10px 20px; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;",
        },
        "Reset"
      )
    ),

    // Text input section
    div(
      {
        style:
          "margin-bottom: 20px; border: 2px solid #2196F3; border-radius: 8px; padding: 16px; display: none;",
      },
      h1("Text Input "),
      input({
        type: "text",
        value: () => textInput.val,
        oninput: (e: any) => {
          textInput.val = e.target.value;
        },
        style:
          "padding: 8px; font-size: 16px; width: 300px; border: 1px solid #ccc; border-radius: 4px;",
      }),
      p(() => `You typed: me ls`),
      p(() => `Length: ${textInput.val.length}`)
    )
  );
};

export const OtherName = (): any => {
  return (
  div('name')
  )
};

export {
	Counter
}
