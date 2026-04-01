import { App } from "./demo/App.js";
import { FunctionComponent } from "./runtime/FunctionComponent.js";

const root = document.querySelector("#app");

if (!root) {
  throw new Error("Root container '#app' was not found.");
}

const app = new FunctionComponent(App);

app.mount(root);
