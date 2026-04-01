import { diff } from "./diff.js";
import { patch } from "./patch.js";

export function createRoot(container) {
  let previousTree = null;

  return {
    render(nextTree) {
      const patches = diff(previousTree, nextTree);
      const domNode = patch(container, patches);

      previousTree = nextTree;
      return domNode;
    },
    getTree() {
      return previousTree;
    },
    getDomNode() {
      return container.firstChild;
    },
  };
}
