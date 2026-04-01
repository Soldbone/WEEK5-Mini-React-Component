export const TEXT_ELEMENT = "TEXT_ELEMENT";
const DOM_LISTENERS = Symbol("domListeners");

export function createTextElement(value) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: String(value),
      children: [],
    },
  };
}

export function h(type, props = {}, ...children) {
  const normalizedChildren = children
    .flat(Infinity)
    .filter((child) => child !== null && child !== undefined && child !== false && child !== true)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return createTextElement(child);
      }

      return child;
    });

  return {
    type,
    props: {
      ...props,
      children: normalizedChildren,
    },
  };
}

function isEventProp(key, value) {
  return key.startsWith("on") && typeof value === "function";
}

function isAttrProp(key) {
  return key.startsWith("data-") || key.startsWith("aria-");
}

function setEventProp(node, key, handler) {
  const eventName = key.slice(2).toLowerCase();
  const listeners = node[DOM_LISTENERS] ?? (node[DOM_LISTENERS] = {});

  if (listeners[eventName]) {
    node.removeEventListener(eventName, listeners[eventName]);
  }

  node.addEventListener(eventName, handler);
  listeners[eventName] = handler;
}

function removeEventProp(node, key) {
  const eventName = key.slice(2).toLowerCase();
  const listeners = node[DOM_LISTENERS];

  if (!listeners?.[eventName]) {
    return;
  }

  node.removeEventListener(eventName, listeners[eventName]);
  delete listeners[eventName];
}

export function setDomProp(node, key, value) {
  if (key === "children") {
    return;
  }

  if (isEventProp(key, value)) {
    setEventProp(node, key, value);
    return;
  }

  if (key === "style" && value && typeof value === "object") {
    Object.assign(node.style, value);
    return;
  }

  if (key === "className") {
    node.setAttribute("class", value);
    return;
  }

  if (typeof value === "boolean") {
    if (key in node) {
      node[key] = value;
    }

    if (value) {
      node.setAttribute(key, "");
    } else {
      node.removeAttribute(key);
    }

    return;
  }

  if (value === null || value === undefined) {
    return;
  }

  if (key in node && !isAttrProp(key)) {
    node[key] = value;
    return;
  }

  node.setAttribute(key, value);
}

export function removeDomProp(node, key) {
  if (key === "children") {
    return;
  }

  if (key.startsWith("on")) {
    removeEventProp(node, key);
    return;
  }

  if (key === "style") {
    node.removeAttribute("style");
    return;
  }

  if (key === "className") {
    node.removeAttribute("class");
    return;
  }

  if (key in node) {
    if (typeof node[key] === "boolean") {
      node[key] = false;
    } else if (typeof node[key] === "string") {
      node[key] = "";
    } else {
      node[key] = null;
    }
  }

  node.removeAttribute(key);
}

export function createDomNode(vnode) {
  if (vnode.type === TEXT_ELEMENT) {
    return document.createTextNode(vnode.props.nodeValue);
  }

  const node = document.createElement(vnode.type);

  Object.entries(vnode.props).forEach(([key, value]) => {
    setDomProp(node, key, value);
  });

  vnode.props.children.forEach((child) => {
    node.appendChild(createDomNode(child));
  });

  return node;
}

export function render(vnode, container) {
  const domNode = createDomNode(vnode);
  container.replaceChildren(domNode);
  return domNode;
}
