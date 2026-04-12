import van from "@michthemaker/vanjs";
import { App } from "./App.ts";

const root = document.body!;

van.add(root, App({ name: "okolo" }));
