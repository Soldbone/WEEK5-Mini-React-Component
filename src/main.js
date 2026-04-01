import { attachDemo } from "./demo/bootstrap.js";

const root = document.querySelector("#app");
const mountButton = document.querySelector("#mount-app");
const unmountButton = document.querySelector("#unmount-app");
const statusNode = document.querySelector("#app-status");

if (!root) {
  throw new Error("Root container '#app' was not found.");
}

attachDemo(root, {
  mountButton,
  unmountButton,
  statusNode,
});
