import { createRoot } from "../core/root.js";
import { resolveComponentTree } from "./resolveComponentTree.js";

export class FunctionComponent {
  constructor(component, props = {}) {
    if (typeof component !== "function") {
      throw new Error("FunctionComponent requires a function component.");
    }

    this.component = component;
    this.props = props;
    this.hooks = [];
    this.prevTree = null;
    this.domRoot = null;
    this.root = null;
    this.container = null;
  }

  renderTree() {
    return resolveComponentTree(this.component(this.props));
  }

  mount(container) {
    if (!container) {
      throw new Error("mount(container) requires a valid DOM container.");
    }

    this.container = container;
    this.root = createRoot(container);

    return this.commitRender();
  }

  update(nextProps = this.props) {
    if (!this.root) {
      throw new Error("Component must be mounted before update().");
    }

    this.props = nextProps;
    return this.commitRender();
  }

  commitRender() {
    const nextTree = this.renderTree();
    this.domRoot = this.root.render(nextTree);
    this.prevTree = nextTree;
    return this.domRoot;
  }
}
