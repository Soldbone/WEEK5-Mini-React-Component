import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { h } from "../src/core/vdom.js";
import { FunctionComponent } from "../src/runtime/FunctionComponent.js";
import { claimHookSlot, queuePostCommitEffect } from "../src/runtime/hookRuntime.js";

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

test("hook slots are reused by index across root renders", () => {
  const cleanup = installDom();

  try {
    function HookedRoot(props) {
      const counterSlot = claimHookSlot("counter-slot", () => ({ renders: 0 }));
      const labelSlot = claimHookSlot("label-slot", () => ({ renders: 0 }));

      counterSlot.value.renders += 1;
      labelSlot.value.renders += 1;

      return h(
        "section",
        { className: "shell" },
        h("p", { className: "count" }, String(counterSlot.value.renders)),
        h("p", { className: "label" }, `${props.label}:${labelSlot.value.renders}`),
      );
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(HookedRoot, {
      label: "first",
    });

    instance.mount(root);

    const firstSlotRef = instance.hooks[0];
    const secondSlotRef = instance.hooks[1];

    instance.update({
      label: "second",
    });

    assert.equal(instance.hooks.length, 2);
    assert.equal(instance.hooks[0], firstSlotRef);
    assert.equal(instance.hooks[1], secondSlotRef);
    assert.equal(instance.hooks[0].value.renders, 2);
    assert.equal(instance.hooks[1].value.renders, 2);
    assert.equal(root.querySelector(".count").textContent, "2");
    assert.equal(root.querySelector(".label").textContent, "second:2");
  } finally {
    cleanup();
  }
});

test("hooks throw when called outside the root render cycle", () => {
  assert.throws(
    () => {
      claimHookSlot("outside-render");
    },
    /Hooks can only be used while the root component is rendering\./,
  );
});

test("hooks throw when called from child components", () => {
  const cleanup = installDom();

  try {
    function Child() {
      claimHookSlot("child-hook");
      return h("span", null, "child");
    }

    function Root() {
      return h("div", null, h(Child));
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root);

    assert.throws(
      () => {
        instance.mount(root);
      },
      /Hooks are only supported in the root component\. Child components must stay stateless\./,
    );
  } finally {
    cleanup();
  }
});

test("post-commit queue runs after DOM updates are committed", () => {
  const cleanup = installDom();

  try {
    const committedText = [];

    function Root(props) {
      claimHookSlot("slot", () => ({ seen: 0 })).value.seen += 1;
      queuePostCommitEffect(() => {
        committedText.push(document.querySelector(".value")?.textContent ?? "");
      });

      return h("p", { className: "value" }, props.text);
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root, {
      text: "first pass",
    });

    instance.mount(root);
    instance.update({
      text: "second pass",
    });

    assert.deepEqual(committedText, ["first pass", "second pass"]);
  } finally {
    cleanup();
  }
});
