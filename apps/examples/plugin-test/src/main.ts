import van from "@michthemaker/vanjs";
import { App } from "./App.ts";
import { QueryContextProvider } from "./context-test.ts";

const root = document.body!;

van.add(
  root,
  // QueryContextProvider(() => App({ name: "okolo" }))
  App({ name: "okolo" })
);
