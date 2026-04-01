import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { diff } from "../src/core/diff.js";
import { patch } from "../src/core/patch.js";
import { createRoot } from "../src/core/root.js";
import { h, render } from "../src/core/vdom.js";

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

test("patch updates text in place and preserves unchanged sibling nodes", () => {
  const cleanup = installDom();

  try {
    const previousTree = h(
      "section",
      { className: "card" },
      h("h2", null, "Stable title"),
      h("p", null, "before"),
    );
    const nextTree = h(
      "section",
      { className: "card" },
      h("h2", null, "Stable title"),
      h("p", null, "after"),
    );
    const root = document.querySelector("#root");

    render(previousTree, root);

    const titleNodeBefore = root.querySelector("h2");
    const paragraphNodeBefore = root.querySelector("p");
    const textNodeBefore = paragraphNodeBefore.firstChild;

    patch(root, diff(previousTree, nextTree));

    assert.equal(root.querySelector("h2"), titleNodeBefore);
    assert.equal(root.querySelector("p"), paragraphNodeBefore);
    assert.equal(root.querySelector("p").firstChild, textNodeBefore);
    assert.equal(root.querySelector("p").textContent, "after");
  } finally {
    cleanup();
  }
});

test("patch updates props in place and replaces changed event handlers", () => {
  const cleanup = installDom();

  try {
    let oldClicks = 0;
    let newClicks = 0;

    const previousTree = h("button", {
      className: "ghost-button",
      title: "Before",
      onClick: () => {
        oldClicks += 1;
      },
    });
    const nextTree = h("button", {
      className: "solid-button",
      disabled: true,
      onClick: () => {
        newClicks += 1;
      },
    });
    const root = document.querySelector("#root");

    render(previousTree, root);

    const buttonBefore = root.querySelector("button");

    patch(root, diff(previousTree, nextTree));

    const buttonAfter = root.querySelector("button");
    buttonAfter.dispatchEvent(new Event("click"));

    assert.equal(buttonAfter, buttonBefore);
    assert.equal(buttonAfter.className, "solid-button");
    assert.equal(buttonAfter.disabled, true);
    assert.equal(buttonAfter.getAttribute("title"), null);
    assert.equal(oldClicks, 0);
    assert.equal(newClicks, 1);
  } finally {
    cleanup();
  }
});

test("patch inserts and removes children while preserving existing nodes", () => {
  const cleanup = installDom();

  try {
    const previousTree = h("ul", null, h("li", null, "A"), h("li", null, "B"));
    const nextTree = h("ul", null, h("li", null, "A"), h("li", null, "C"), h("li", null, "D"));
    const root = document.querySelector("#root");

    render(previousTree, root);

    const firstItemBefore = root.querySelectorAll("li")[0];

    patch(root, diff(previousTree, nextTree));

    const items = Array.from(root.querySelectorAll("li"));

    assert.equal(items.length, 3);
    assert.equal(items[0], firstItemBefore);
    assert.deepEqual(
      items.map((item) => item.textContent),
      ["A", "C", "D"],
    );
  } finally {
    cleanup();
  }
});

test("createRoot uses diff plus patch so unchanged DOM nodes stay mounted across renders", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const appRoot = createRoot(root);
    const previousTree = h(
      "div",
      { className: "shell" },
      h("h1", null, "Dashboard"),
      h("p", null, "first pass"),
    );
    const nextTree = h(
      "div",
      { className: "shell" },
      h("h1", null, "Dashboard"),
      h("p", null, "second pass"),
    );

    const firstDomNode = appRoot.render(previousTree);
    const titleNodeBefore = root.querySelector("h1");

    const secondDomNode = appRoot.render(nextTree);

    assert.equal(firstDomNode, secondDomNode);
    assert.equal(root.querySelector("h1"), titleNodeBefore);
    assert.equal(root.querySelector("p").textContent, "second pass");
  } finally {
    cleanup();
  }
});
