import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

import { h } from "../src/core/vdom.js";
import { FunctionComponent } from "../src/runtime/FunctionComponent.js";
import { useEffect, useMemo, useState } from "../src/runtime/hooks.js";

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

test("useState supports lazy initialization and functional updates", () => {
  const cleanup = installDom();

  try {
    let initializerCalls = 0;

    function Root() {
      const [count, setCount] = useState(() => {
        initializerCalls += 1;
        return 2;
      });

      return h(
        "button",
        {
          className: "counter",
          type: "button",
          onClick: () => setCount((currentCount) => currentCount + 1),
        },
        String(count),
      );
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root);

    instance.mount(root);
    root.querySelector(".counter").dispatchEvent(new Event("click", { bubbles: true }));
    root.querySelector(".counter").dispatchEvent(new Event("click", { bubbles: true }));

    assert.equal(initializerCalls, 1);
    assert.equal(root.querySelector(".counter").textContent, "4");
    assert.equal(instance.hooks[0].value.current, 4);
  } finally {
    cleanup();
  }
});

test("useEffect runs after commit and executes cleanup before the next effect", () => {
  const cleanup = installDom();

  try {
    const calls = [];

    function Root(props) {
      useEffect(() => {
        calls.push(`effect:${props.label}`);

        return () => {
          calls.push(`cleanup:${props.label}`);
        };
      }, [props.label]);

      return h("p", { className: "value" }, props.label);
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root, {
      label: "first",
    });

    instance.mount(root);
    instance.update({
      label: "second",
    });
    instance.update({
      label: "second",
    });

    assert.deepEqual(calls, ["effect:first", "cleanup:first", "effect:second"]);
    assert.equal(root.querySelector(".value").textContent, "second");
  } finally {
    cleanup();
  }
});

test("useMemo reuses cached values until dependencies change", () => {
  const cleanup = installDom();

  try {
    let computeCalls = 0;

    function Root(props) {
      const [tick, setTick] = useState(0);
      const summary = useMemo(() => {
        computeCalls += 1;
        return `${props.label}:${props.items.join(",")}`;
      }, [props.label, props.items]);

      return h(
        "section",
        { className: "memo-shell" },
        h("p", { className: "summary" }, summary),
        h(
          "button",
          {
            className: "rerender",
            type: "button",
            onClick: () => setTick((currentTick) => currentTick + 1),
          },
          String(tick),
        ),
      );
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root, {
      label: "alpha",
      items: ["a", "b"],
    });

    instance.mount(root);
    root.querySelector(".rerender").dispatchEvent(new Event("click", { bubbles: true }));
    instance.update({
      label: "beta",
      items: ["a", "b"],
    });

    assert.equal(computeCalls, 2);
    assert.equal(root.querySelector(".summary").textContent, "beta:a,b");
    assert.equal(root.querySelector(".rerender").textContent, "1");
  } finally {
    cleanup();
  }
});

test("unmount runs the latest useEffect cleanup and removes mounted DOM", () => {
  const cleanup = installDom();

  try {
    const calls = [];

    function Root(props) {
      useEffect(() => {
        calls.push(`effect:${props.label}`);

        return () => {
          calls.push(`cleanup:${props.label}`);
        };
      }, [props.label]);

      return h("p", { className: "value" }, props.label);
    }

    const root = document.querySelector("#root");
    const instance = new FunctionComponent(Root, {
      label: "first",
    });

    instance.mount(root);
    instance.update({
      label: "second",
    });
    instance.unmount();

    assert.deepEqual(calls, [
      "effect:first",
      "cleanup:first",
      "effect:second",
      "cleanup:second",
    ]);
    assert.equal(root.childNodes.length, 0);
  } finally {
    cleanup();
  }
});
