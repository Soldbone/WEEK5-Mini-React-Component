import { createRoot } from "../core/root.js";
import { resolveComponentTree } from "./resolveComponentTree.js";

function createInitialState(component, props) {
  if (typeof component.createInitialState === "function") {
    const initialState = component.createInitialState(props);

    if (initialState && typeof initialState === "object" && !Array.isArray(initialState)) {
      return initialState;
    }
  }

  return {};
}

export class FunctionComponent {
  constructor(component, props = {}) {
    if (typeof component !== "function") {
      throw new Error("FunctionComponent requires a function component.");
    }

    this.component = component;
    this.props = props;
    this.hooks = [];
    this.state = createInitialState(component, props);
    this.prevTree = null;
    this.domRoot = null;
    this.root = null;
    this.container = null;
    this.setState = this.setState.bind(this);
  }

  renderTree() {
    return resolveComponentTree(
      this.component(this.props, {
        state: this.state,
        setState: this.setState,
      }),
    );
  }

  setState(updater) {
    const partialState = typeof updater === "function" ? updater(this.state) : updater;

    if (partialState === null || partialState === undefined) {
      return this.state;
    }

    if (typeof partialState !== "object" || Array.isArray(partialState)) {
      throw new Error("setState() expects an object patch or an updater that returns one.");
    }

    this.state = {
      ...this.state,
      ...partialState,
    };

    if (this.root) {
      this.update();
    }

    return this.state;
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
