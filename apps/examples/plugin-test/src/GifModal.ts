// just a file using dummy context to test context with hmr

import van from "@michthemaker/vanjs";
import { useQueryFt } from "./context-test";

const { p } = van.tags;

const GifModal = () => {
  const queryContext = useQueryFt();
  return p(queryContext.name, "name is usss and them four");
};

export { GifModal };
