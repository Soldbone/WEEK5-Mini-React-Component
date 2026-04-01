import { createTextElement } from "../core/vdom.js";
import { withChildComponentScope } from "./hookRuntime.js";

function isRenderablePrimitive(node) {
  return typeof node === "string" || typeof node === "number";
}

function cloneResolvedElement(vnode, children) {
  return {
    ...vnode,
    props: {
      ...vnode.props,
      children,
    },
  };
}

export function resolveComponentTree(node) {
  if (isRenderablePrimitive(node)) {
    return createTextElement(node);
  }

  if (node === null || node === undefined || node === false || node === true) {
    return createTextElement("");
  }

  if (typeof node.type === "function") {
    return withChildComponentScope(() => resolveComponentTree(node.type(node.props ?? {})));
  }

  const resolvedChildren = (node.props?.children ?? []).map((child) => resolveComponentTree(child));
  return cloneResolvedElement(node, resolvedChildren);
}
