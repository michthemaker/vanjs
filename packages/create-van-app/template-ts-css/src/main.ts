import van from "@michthemaker/vanjs";
import "./index.css";
import App from "./App.ts";

const root = document.getElementById("root")!;

van.add(root, App());
