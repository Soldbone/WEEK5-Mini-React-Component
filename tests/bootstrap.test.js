import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { attachDemo } from "../src/demo/bootstrap.js";

function installDom() {
  const dom = new JSDOM(
    "<!doctype html><html><body><button id='mount'></button><button id='unmount'></button><p id='status'></p><div id='root'></div></body></html>",
    {
      url: "http://localhost",
    },
  );

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

test("attachDemo starts unmounted when external controls exist and can mount/unmount/remount", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const mountButton = document.querySelector("#mount");
    const unmountButton = document.querySelector("#unmount");
    const statusNode = document.querySelector("#status");

    const controller = attachDemo(root, {
      mountButton,
      unmountButton,
      statusNode,
    });

    assert.equal(controller.isMounted(), false);
    assert.equal(root.childNodes.length, 1);
    assert.match(statusNode.textContent, /unmounted/i);
    assert.match(root.textContent, /Mount App 버튼을 눌러 루트 컴포넌트를 연결하세요/);
    assert.equal(mountButton.disabled, false);
    assert.equal(unmountButton.disabled, true);

    mountButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(controller.isMounted(), true);
    assert.equal(root.childNodes.length, 1);
    assert.match(statusNode.textContent, /mounted/i);
    assert.match(root.firstChild.className, /app-shell/);
    assert.equal(mountButton.disabled, true);
    assert.equal(unmountButton.disabled, false);

    unmountButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(controller.isMounted(), false);
    assert.equal(root.childNodes.length, 1);
    assert.match(statusNode.textContent, /unmounted/i);
    assert.match(root.textContent, /Mount App 버튼을 눌러 루트 컴포넌트를 연결하세요/);
    assert.equal(mountButton.disabled, false);
    assert.equal(unmountButton.disabled, true);

    mountButton.dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(controller.isMounted(), true);
    assert.equal(root.childNodes.length, 1);
    assert.match(statusNode.textContent, /mounted/i);

    controller.detach();
  } finally {
    cleanup();
  }
});

test("attachDemo still auto-mounts when no external controls are provided", () => {
  const cleanup = installDom();

  try {
    const root = document.querySelector("#root");
    const controller = attachDemo(root);

    assert.equal(controller.isMounted(), true);
    assert.equal(root.childNodes.length, 1);
  } finally {
    cleanup();
  }
});
