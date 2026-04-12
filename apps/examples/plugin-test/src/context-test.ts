import van, { createContext, useContext } from "@michthemaker/vanjs";

const QueryContext = createContext<{ name: string }>();
const ThemeContext = createContext<{ color: string; dark: boolean }>();

const QueryContextProvider = (childrenFn: () => any) => {
  const state = van.state({ name: "omaeba" });
  return QueryContext.Provider(state, childrenFn);
};

const ThemeContextProvider = (childrenFn: () => any) => {
  const state = van.state({ color: "blue", dark: false });
  return ThemeContext.Provider(state, childrenFn);
};

const useQueryFt = () => {
  const { val: queryContext } = useContext(QueryContext);
  return queryContext;
};

const useTheme = () => {
  const { val: theme } = useContext(ThemeContext);
  return theme;
};

export { QueryContextProvider, ThemeContextProvider, useQueryFt, useTheme };
