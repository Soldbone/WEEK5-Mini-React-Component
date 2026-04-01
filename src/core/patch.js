import { PATCH_TYPES } from "./diff.js";
import { createDomNode, removeDomProp, setDomProp } from "./vdom.js";

function getNodeAtPath(rootNode, path) {
  if (!rootNode) {
    return null;
  }

  if (path.length === 0) {
    return rootNode;
  }

  return path.reduce((currentNode, childIndex) => currentNode?.childNodes?.[childIndex] ?? null, rootNode);
}

function replaceNode(container, rootNode, path, vnode) {
  const nextNode = createDomNode(vnode);

  if (path.length === 0) {
    container.replaceChildren(nextNode);
    return nextNode;
  }

  const targetNode = getNodeAtPath(rootNode, path);
  targetNode?.replaceWith(nextNode);
  return container.firstChild;
}

function updateTextNode(rootNode, path, value) {
  const textNode = getNodeAtPath(rootNode, path);

  if (!textNode) {
    throw new Error(`Cannot apply TEXT patch. Missing node at path ${path.join(".")}.`);
  }

  textNode.nodeValue = value;
}

function updateProps(rootNode, path, propPatch) {
  const node = getNodeAtPath(rootNode, path);

  if (!node) {
    throw new Error(`Cannot apply PROPS patch. Missing node at path ${path.join(".")}.`);
  }

  propPatch.remove.forEach((key) => {
    removeDomProp(node, key);
  });

  Object.entries(propPatch.set).forEach(([key, value]) => {
    if (key === "style" && value && typeof value === "object") {
      node.removeAttribute("style");
    }

    setDomProp(node, key, value);
  });
}

function insertNode(container, rootNode, path, vnode) {
  if (path.length === 0) {
    const nextNode = createDomNode(vnode);
    container.replaceChildren(nextNode);
    return nextNode;
  }

  const parentPath = path.slice(0, -1);
  const childIndex = path[path.length - 1];
  const parentNode = getNodeAtPath(rootNode, parentPath);

  if (!parentNode) {
    throw new Error(`Cannot apply INSERT patch. Missing parent at path ${parentPath.join(".")}.`);
  }

  const nextNode = createDomNode(vnode);
  const anchorNode = parentNode.childNodes[childIndex] ?? null;
  parentNode.insertBefore(nextNode, anchorNode);
  return container.firstChild;
}

function removeNode(container, rootNode, path) {
  if (path.length === 0) {
    container.replaceChildren();
    return null;
  }

  const targetNode = getNodeAtPath(rootNode, path);

  if (!targetNode) {
    throw new Error(`Cannot apply REMOVE patch. Missing node at path ${path.join(".")}.`);
  }

  targetNode.remove();
  return container.firstChild;
}

export function applyPatch(container, patch) {
  const rootNode = container.firstChild;

  switch (patch.type) {
    case PATCH_TYPES.REPLACE:
      return replaceNode(container, rootNode, patch.path, patch.node);
    case PATCH_TYPES.TEXT:
      updateTextNode(rootNode, patch.path, patch.value);
      return container.firstChild;
    case PATCH_TYPES.PROPS:
      updateProps(rootNode, patch.path, patch.props);
      return container.firstChild;
    case PATCH_TYPES.INSERT:
      return insertNode(container, rootNode, patch.path, patch.node);
    case PATCH_TYPES.REMOVE:
      return removeNode(container, rootNode, patch.path);
    default:
      throw new Error(`Unsupported patch type: ${patch.type}`);
  }
}

export function patch(container, patches) {
  let currentRootNode = container.firstChild;

  patches.forEach((currentPatch) => {
    currentRootNode = applyPatch(container, currentPatch);
  });

  return currentRootNode;
}
