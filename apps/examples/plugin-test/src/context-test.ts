import van, { createContext, useContext } from "@michthemaker/vanjs";
const { div, button } = van.tags;

const PopoverContext = createContext<number>();

const ContextTest = (): any => {
  const value = van.state(2);
  const value2 = van.state(89);

  return div(
    { style: "padding: 2px;" },
    PopoverContext.Provider(value, () => {
      const value = useContext(PopoverContext);
      return [
        value.val,
        PopoverContext.Provider(value2, () => {
          const value = useContext(PopoverContext);
          return [
            () => value.val,
            button(
              {
                onclick: () => (value.val = Math.random() * 200),
              },
              "Change Second one"
            ),
          ];
        }),
      ];
    })
  );
};

export { ContextTest };
