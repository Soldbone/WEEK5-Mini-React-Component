import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { App } from "../src/demo/App.js";
import { h } from "../src/core/vdom.js";
import { FunctionComponent } from "../src/runtime/FunctionComponent.js";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "http://localhost",
  });

  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Node = dom.window.Node;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Event = dom.window.Event;

  return () => {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.Node;
    delete globalThis.HTMLElement;
    delete globalThis.Event;
  };
}

test("FunctionComponent setState merges a partial state patch and re-renders in place", () => {
  const cleanup = installDom();

  try {
    function AppWithState(props, runtime) {
      return h(
        "section",
        { className: "shell" },
        h("p", { className: "count" }, String(runtime.state.count)),
        h("span", { className: "label" }, runtime.state.label),
      );
    }

    AppWithState.createInitialState = () => ({
      count: 2,
      label: "idle",
    });

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(AppWithState);

    instance.mount(root);

    const shellBefore = root.firstChild;
    const countNodeBefore = root.querySelector(".count");
    const labelNodeBefore = root.querySelector(".label");

    instance.setState((currentState) => ({
      count: currentState.count + 1,
      label: "updated",
    }));

    assert.deepEqual(instance.state, {
      count: 3,
      label: "updated",
    });
    assert.equal(root.firstChild, shellBefore);
    assert.equal(root.querySelector(".count"), countNodeBefore);
    assert.equal(root.querySelector(".label"), labelNodeBefore);
    assert.equal(root.querySelector(".count").textContent, "3");
    assert.equal(root.querySelector(".label").textContent, "updated");
  } finally {
    cleanup();
  }
});

test("demo app updates counter and todo state from input and click events", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const instance = new FunctionComponent(App);

    instance.mount(root);

    const counterValue = root.querySelector(".counter-card__value");
    const incrementButton = root.querySelectorAll(".panel--counter button")[1];
    const todoInputBefore = root.querySelector(".todo-form__input");
    const todoForm = root.querySelector(".todo-form");

    incrementButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(counterValue.textContent, "04");
    assert.equal(document.title, "Mini React · 04 cycles · 1/3 todos");

    todoInputBefore.value = "State bag practice";
    todoInputBefore.dispatchEvent(new Event("input", { bubbles: true }));

    assert.equal(root.querySelector(".todo-form__input"), todoInputBefore);
    assert.equal(root.querySelector(".todo-form__input").value, "State bag practice");

    todoForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    assert.equal(root.querySelectorAll(".todo-item").length, 4);
    assert.equal(root.querySelector(".todo-form__input"), todoInputBefore);
    assert.equal(root.querySelector(".todo-form__input").value, "");
    assert.match(root.lastChild.textContent, /State bag practice/);
    assert.equal(document.title, "Mini React · 04 cycles · 1/4 todos");

    const newTodoToggle = root.querySelectorAll(".todo-item__toggle")[3];

    newTodoToggle.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(root.querySelectorAll(".todo-item__badge")[3].textContent, "Done");
    assert.equal(document.title, "Mini React · 04 cycles · 2/4 todos");
  } finally {
    cleanup();
  }
});
