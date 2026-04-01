import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

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

function hasFunctionType(vnode) {
  if (!vnode || typeof vnode === "string" || typeof vnode === "number") {
    return false;
  }

  if (typeof vnode.type === "function") {
    return true;
  }

  return (vnode.props?.children ?? []).some((child) => hasFunctionType(child));
}

test("FunctionComponent mount resolves child function components into plain VDOM", () => {
  const cleanup = installDom();

  try {
    function Title({ text }) {
      return h("h1", { className: "title" }, text);
    }

    function Layout({ children }) {
      return h("section", { className: "layout" }, ...children);
    }

    function App({ title, note }) {
      return h(
        Layout,
        null,
        h(Title, { text: title }),
        h("p", { className: "note" }, note),
      );
    }

    const instance = new FunctionComponent(App, {
      title: "Component step",
      note: "stateless child components only",
    });
    const root = document.querySelector("#root");
    const domNode = instance.mount(root);

    assert.equal(domNode, root.firstChild);
    assert.equal(instance.hooks.length, 0);
    assert.equal(instance.prevTree.type, "section");
    assert.equal(hasFunctionType(instance.prevTree), false);
    assert.equal(root.querySelector(".title").textContent, "Component step");
    assert.equal(root.querySelector(".note").textContent, "stateless child components only");
  } finally {
    cleanup();
  }
});

test("FunctionComponent update re-renders through diff and preserves unchanged DOM nodes", () => {
  const cleanup = installDom();

  try {
    function Badge({ status }) {
      return h("span", { className: "badge" }, status);
    }

    function App({ title, status }) {
      return h(
        "div",
        { className: "shell" },
        h("h1", null, title),
        h(Badge, { status }),
      );
    }

    const instance = new FunctionComponent(App, {
      title: "First title",
      status: "ready",
    });
    const root = document.querySelector("#root");

    instance.mount(root);

    const shellBefore = root.firstChild;
    const headingBefore = root.querySelector("h1");
    const badgeBefore = root.querySelector(".badge");

    instance.update({
      title: "Updated title",
      status: "ready",
    });

    assert.equal(instance.domRoot, shellBefore);
    assert.equal(root.firstChild, shellBefore);
    assert.equal(root.querySelector("h1"), headingBefore);
    assert.equal(root.querySelector(".badge"), badgeBefore);
    assert.equal(root.querySelector("h1").textContent, "Updated title");
    assert.equal(root.querySelector(".badge").textContent, "ready");
  } finally {
    cleanup();
  }
});
