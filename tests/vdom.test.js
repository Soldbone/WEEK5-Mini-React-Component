import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { TEXT_ELEMENT, createDomNode, h, render } from "../src/core/vdom.js";
import { createAppTree } from "../src/demo/App.js";

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

test("h normalizes nested children and converts text values into text elements", () => {
  const vnode = h(
    "section",
    { id: "demo" },
    "hello",
    [1, h("span", null, "inner")],
    false,
    null,
    undefined,
  );

  assert.equal(vnode.type, "section");
  assert.equal(vnode.props.children.length, 3);
  assert.equal(vnode.props.children[0].type, TEXT_ELEMENT);
  assert.equal(vnode.props.children[0].props.nodeValue, "hello");
  assert.equal(vnode.props.children[1].type, TEXT_ELEMENT);
  assert.equal(vnode.props.children[1].props.nodeValue, "1");
  assert.equal(vnode.props.children[2].type, "span");
});

test("createDomNode binds props, attributes, styles, and events", () => {
  const cleanup = installDom();

  try {
    let clicks = 0;

    const vnode = h(
      "button",
      {
        className: "primary",
        id: "demo-button",
        disabled: true,
        title: "Launch",
        "data-role": "action",
        style: { backgroundColor: "tomato" },
        onClick: () => {
          clicks += 1;
        },
      },
      "Run",
    );

    const node = createDomNode(vnode);
    document.querySelector("#root").appendChild(node);

    node.dispatchEvent(new Event("click"));

    assert.equal(node.tagName, "BUTTON");
    assert.equal(node.className, "primary");
    assert.equal(node.id, "demo-button");
    assert.equal(node.disabled, true);
    assert.equal(node.getAttribute("title"), "Launch");
    assert.equal(node.dataset.role, "action");
    assert.equal(node.style.backgroundColor, "tomato");
    assert.equal(node.textContent, "Run");
    assert.equal(clicks, 1);
  } finally {
    cleanup();
  }
});

test("render mounts the static todo/counter board from virtual DOM", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const domNode = render(createAppTree(), root);

    assert.equal(root.children.length, 1);
    assert.equal(domNode.className, "app-shell");
    assert.match(root.textContent, /Learning React Core Clone/);
    assert.match(root.textContent, /Pomodoro count/);
    assert.match(root.textContent, /발표 준비 체크리스트/);
    assert.equal(root.querySelectorAll("button").length, 4);
    assert.equal(root.querySelectorAll(".todo-item").length, 3);
  } finally {
    cleanup();
  }
});
