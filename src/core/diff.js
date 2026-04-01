import { TEXT_ELEMENT } from "./vdom.js";

export const PATCH_TYPES = Object.freeze({
  REPLACE: "REPLACE",
  TEXT: "TEXT",
  PROPS: "PROPS",
  INSERT: "INSERT",
  REMOVE: "REMOVE",
});

function getChildren(vnode) {
  return vnode?.props?.children ?? [];
}

function getPropsWithoutChildren(vnode) {
  const { children = [], ...props } = vnode?.props ?? {};
  return props;
}

function isObjectLike(value) {
  return value !== null && typeof value === "object";
}

function isEqualValue(previousValue, nextValue) {
  if (Object.is(previousValue, nextValue)) {
    return true;
  }

  if (!isObjectLike(previousValue) || !isObjectLike(nextValue)) {
    return false;
  }

  if (Array.isArray(previousValue) !== Array.isArray(nextValue)) {
    return false;
  }

  const previousKeys = Object.keys(previousValue);
  const nextKeys = Object.keys(nextValue);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  return previousKeys.every((key) => isEqualValue(previousValue[key], nextValue[key]));
}

export function diffProps(previousVNode, nextVNode) {
  const previousProps = getPropsWithoutChildren(previousVNode);
  const nextProps = getPropsWithoutChildren(nextVNode);
  const keys = new Set([...Object.keys(previousProps), ...Object.keys(nextProps)]);
  const set = {};
  const remove = [];

  keys.forEach((key) => {
    if (!(key in nextProps)) {
      remove.push(key);
      return;
    }

    if (!isEqualValue(previousProps[key], nextProps[key])) {
      set[key] = nextProps[key];
    }
  });

  return { set, remove };
}

function hasPropChanges(propPatch) {
  return Object.keys(propPatch.set).length > 0 || propPatch.remove.length > 0;
}

function walk(previousVNode, nextVNode, path, patches) {
  
  if (previousVNode.type !== nextVNode.type) {
    patches.push({
      type: PATCH_TYPES.REPLACE,
      path,
      node: nextVNode,
    });
    return;
  }

  if (
    previousVNode.type === TEXT_ELEMENT &&
    previousVNode.props.nodeValue !== nextVNode.props.nodeValue
  ) {
    patches.push({
      type: PATCH_TYPES.TEXT,
      path,
      value: nextVNode.props.nodeValue,
    });
    return;
  }

  const propPatch = diffProps(previousVNode, nextVNode);

  if (hasPropChanges(propPatch)) {
    patches.push({
      type: PATCH_TYPES.PROPS,
      path,
      props: propPatch,
    });
  }

  const previousChildren = getChildren(previousVNode);
  const nextChildren = getChildren(nextVNode);
  const sharedLength = Math.min(previousChildren.length, nextChildren.length);

  for (let index = 0; index < sharedLength; index += 1) {
    walk(previousChildren[index], nextChildren[index], [...path, index], patches);
  }

  for (let index = previousChildren.length - 1; index >= sharedLength; index -= 1) {
    patches.push({
      type: PATCH_TYPES.REMOVE,
      path: [...path, index],
    });
  }

  for (let index = sharedLength; index < nextChildren.length; index += 1) {
    patches.push({
      type: PATCH_TYPES.INSERT,
      path: [...path, index],
      node: nextChildren[index],
    });
  }
}

export function diff(previousTree, nextTree) {
  if (!previousTree && !nextTree) {
    return [];
  }

  if (!previousTree && nextTree) {
    return [
      {
        type: PATCH_TYPES.REPLACE,
        path: [],
        node: nextTree,
      },
    ];
  }

  if (previousTree && !nextTree) {
    return [
      {
        type: PATCH_TYPES.REMOVE,
        path: [],
      },
    ];
  }

  const patches = [];
  walk(previousTree, nextTree, [], patches);
  return patches;
}
