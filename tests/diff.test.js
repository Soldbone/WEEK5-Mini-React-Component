import test from "node:test";
import assert from "node:assert/strict";

import { PATCH_TYPES, diff } from "../src/core/diff.js";
import { h } from "../src/core/vdom.js";

test("diff returns no patches for structurally identical trees", () => {
  const previousTree = h(
    "section",
    { className: "panel", style: { color: "tomato", padding: "12px" } },
    h("h2", null, "Title"),
    h("p", null, "Body"),
  );

  const nextTree = h(
    "section",
    { className: "panel", style: { color: "tomato", padding: "12px" } },
    h("h2", null, "Title"),
    h("p", null, "Body"),
  );

  assert.deepEqual(diff(previousTree, nextTree), []);
});

test("diff emits a TEXT patch when a text node changes", () => {
  const previousTree = h("div", null, "before");
  const nextTree = h("div", null, "after");

  assert.deepEqual(diff(previousTree, nextTree), [
    {
      type: PATCH_TYPES.TEXT,
      path: [0],
      value: "after",
    },
  ]);
});

test("diff emits a PROPS patch with set and remove operations", () => {
  const previousTree = h("button", {
    className: "ghost-button",
    disabled: true,
    style: { color: "tomato" },
  });

  const nextTree = h("button", {
    className: "solid-button",
    title: "Save",
    style: { color: "teal" },
  });

  assert.deepEqual(diff(previousTree, nextTree), [
    {
      type: PATCH_TYPES.PROPS,
      path: [],
      props: {
        set: {
          className: "solid-button",
          title: "Save",
          style: { color: "teal" },
        },
        remove: ["disabled"],
      },
    },
  ]);
});

test("diff emits a REPLACE patch when node types differ", () => {
  const previousTree = h("div", { className: "card" }, h("p", null, "hello"));
  const nextTree = h("section", { className: "card" }, h("p", null, "hello"));

  assert.deepEqual(diff(previousTree, nextTree), [
    {
      type: PATCH_TYPES.REPLACE,
      path: [],
      node: nextTree,
    },
  ]);
});

test("diff emits INSERT patches for appended child nodes", () => {
  const previousTree = h("ul", null, h("li", null, "A"));
  const nextTree = h("ul", null, h("li", null, "A"), h("li", null, "B"), h("li", null, "C"));

  assert.deepEqual(diff(previousTree, nextTree), [
    {
      type: PATCH_TYPES.INSERT,
      path: [1],
      node: h("li", null, "B"),
    },
    {
      type: PATCH_TYPES.INSERT,
      path: [2],
      node: h("li", null, "C"),
    },
  ]);
});

test("diff emits REMOVE patches from the end of the child list", () => {
  const previousTree = h("ul", null, h("li", null, "A"), h("li", null, "B"), h("li", null, "C"));
  const nextTree = h("ul", null, h("li", null, "A"));

  assert.deepEqual(diff(previousTree, nextTree), [
    {
      type: PATCH_TYPES.REMOVE,
      path: [2],
    },
    {
      type: PATCH_TYPES.REMOVE,
      path: [1],
    },
  ]);
});
