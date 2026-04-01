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
    assert.match(root.querySelector(".todo-list").textContent, /State bag practice/);
    assert.equal(document.title, "Mini React · 04 cycles · 1/4 todos");

    const newTodoToggle = root.querySelectorAll(".todo-item__toggle")[3];

    newTodoToggle.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(root.querySelectorAll(".todo-item__badge")[3].textContent, "Done");
    assert.equal(document.title, "Mini React · 04 cycles · 2/4 todos");
  } finally {
    cleanup();
  }
});

test("demo app supports editing and deleting checklist items", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const instance = new FunctionComponent(App);

    instance.mount(root);

    const editButton = root.querySelectorAll(".todo-item__edit")[1];

    editButton.dispatchEvent(new Event("click", { bubbles: true }));

    const input = root.querySelector(".todo-form__input");
    const form = root.querySelector(".todo-form");

    assert.equal(input.value, "상태 변경 시연 연습");
    assert.match(root.querySelector(".todo-form__hint").textContent, /수정 중/);
    assert.equal(root.querySelectorAll(".todo-form button").length, 2);

    input.value = "상태 변경 시연 리허설";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    assert.match(root.querySelector(".todo-list").textContent, /상태 변경 시연 리허설/);
    assert.equal(root.querySelector(".todo-form__input").value, "");
    assert.equal(root.querySelectorAll(".todo-form button").length, 1);

    const deleteButton = root.querySelectorAll(".todo-item__delete")[1];
    deleteButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(root.querySelectorAll(".todo-item").length, 2);
    assert.doesNotMatch(root.querySelector(".todo-list").textContent, /상태 변경 시연 리허설/);
    assert.equal(document.title, "Mini React · 03 cycles · 1/2 todos");
  } finally {
    cleanup();
  }
});

test("custom hook toggles dark mode and persists the selected theme", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const instance = new FunctionComponent(App);

    instance.mount(root);

    const lightThemeButton = root.querySelector(".theme-toggle__choice--light");
    const darkThemeButton = root.querySelector(".theme-toggle__choice--dark");

    assert.equal(document.documentElement.dataset.theme, "light");
    assert.equal(window.localStorage.getItem("mini-react-theme"), "light");
    assert.equal(lightThemeButton.getAttribute("aria-pressed"), "true");
    assert.equal(darkThemeButton.getAttribute("aria-pressed"), "false");

    darkThemeButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(document.documentElement.dataset.theme, "dark");
    assert.equal(window.localStorage.getItem("mini-react-theme"), "dark");
    assert.match(root.querySelector(".hero__note").textContent, /Dark/);
    assert.equal(lightThemeButton.getAttribute("aria-pressed"), "false");
    assert.equal(darkThemeButton.getAttribute("aria-pressed"), "true");

    lightThemeButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(document.documentElement.dataset.theme, "light");
    assert.equal(window.localStorage.getItem("mini-react-theme"), "light");
    assert.equal(lightThemeButton.getAttribute("aria-pressed"), "true");
    assert.equal(darkThemeButton.getAttribute("aria-pressed"), "false");
  } finally {
    cleanup();
  }
});

test("custom hook keeps refreshing the random cat photo on the configured interval", async () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const instance = new FunctionComponent(App, {
      catPhotoRefreshMs: 20,
    });

    instance.mount(root);

    const showButton = root.querySelector(".cat-widget__show");
    showButton.dispatchEvent(new Event("click", { bubbles: true }));

    const image = root.querySelector(".cat-widget__image");
    assert.ok(image);
    const firstSrc = image.getAttribute("src");
    assert.match(firstSrc, /cataas\.com\/cat/);
    assert.match(root.querySelector(".cat-widget__status").textContent, /자동 갱신됩니다/);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const refreshedImage = root.querySelector(".cat-widget__image");
    assert.ok(refreshedImage);
    assert.notEqual(refreshedImage.getAttribute("src"), firstSrc);

    const hideButton = root.querySelector(".cat-widget__hide");
    hideButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(root.querySelector(".cat-widget__image"), null);
    assert.match(root.querySelector(".cat-widget__status").textContent, /1초마다 자동으로 바뀝니다/);
  } finally {
    cleanup();
  }
});
