import { createRoot } from "../core/root.js";
import { beginRootRender, finishRootRender, flushPostCommitEffects } from "./hookRuntime.js";
import { cleanupEffectHooks } from "./hooks.js";
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
    this.resetRuntimeState();
    this.wasUnmounted = false;
    this.setState = this.setState.bind(this);
  }

  resetRuntimeState() {
    this.hooks = [];
    this.state = createInitialState(this.component, this.props);
    this.prevTree = null;
    this.domRoot = null;
    this.root = null;
    this.container = null;
    this.pendingPostCommitEffects = [];
  }

  renderTree() {
    beginRootRender(this);

    try {
      return resolveComponentTree(
        this.component(this.props, {
          state: this.state,
          setState: this.setState,
        }),
      );
    } finally {
      finishRootRender();
    }
  }

  setState(updater) {
    if (this.wasUnmounted) {
      return this.state;
    }

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

    this.wasUnmounted = false;
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
    flushPostCommitEffects(this);
    return this.domRoot;
  }

  unmount() {
    if (!this.container || !this.root) {
      return null;
    }

    cleanupEffectHooks(this);
    this.pendingPostCommitEffects = [];
    this.container.replaceChildren();
    this.wasUnmounted = true;
    this.resetRuntimeState();
    return null;
  }
}
