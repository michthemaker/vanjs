import van, { createContext, useContext } from "@michthemaker/vanjs";

const QueryContext = createContext<{ name: string }>();

const QueryContextProvider = (childrenFn: () => any) => {
  const state = van.state({ name: "kashiba" });
  return QueryContext.Provider(state, childrenFn);
};

const useQueryFt = () => {
  const { val: queryContext } = useContext(QueryContext);
  return queryContext;
};

export { QueryContextProvider, useQueryFt };
