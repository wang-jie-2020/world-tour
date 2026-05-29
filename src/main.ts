import { bootstrap } from "./app";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error("Cannot find #app root element.");
}

bootstrap(root);

