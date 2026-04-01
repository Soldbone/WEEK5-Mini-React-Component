let currentInstance = null;
let currentHookIndex = 0;
let currentComponentScope = "idle";

function assertHookUsageAllowed() {
  if (!currentInstance || currentComponentScope === "idle") {
    throw new Error("Hooks can only be used while the root component is rendering.");
  }

  if (currentComponentScope !== "root") {
    throw new Error("Hooks are only supported in the root component. Child components must stay stateless.");
  }
}

export function beginRootRender(instance) {
  currentInstance = instance;
  currentHookIndex = 0;
  currentComponentScope = "root";
  instance.pendingPostCommitEffects = [];
}

export function finishRootRender() {
  currentInstance = null;
  currentHookIndex = 0;
  currentComponentScope = "idle";
}

export function withChildComponentScope(renderChild) {
  const previousScope = currentComponentScope;
  currentComponentScope = "child";

  try {
    return renderChild();
  } finally {
    currentComponentScope = previousScope;
  }
}

export function claimHookSlot(kind, createValue = () => undefined) {
  assertHookUsageAllowed();

  const hookIndex = currentHookIndex;
  currentHookIndex += 1;

  const existingSlot = currentInstance.hooks[hookIndex];

  if (!existingSlot) {
    const slot = {
      index: hookIndex,
      kind,
      value: createValue(currentInstance, hookIndex),
    };

    currentInstance.hooks[hookIndex] = slot;
    return slot;
  }

  if (existingSlot.kind !== kind) {
    throw new Error(
      `Hook order changed at slot ${hookIndex}. Expected '${existingSlot.kind}' but received '${kind}'.`,
    );
  }

  return existingSlot;
}

export function queuePostCommitEffect(callback) {
  assertHookUsageAllowed();

  if (typeof callback !== "function") {
    throw new Error("queuePostCommitEffect() expects a callback function.");
  }

  currentInstance.pendingPostCommitEffects.push(callback);
}

export function flushPostCommitEffects(instance) {
  const queue = instance.pendingPostCommitEffects ?? [];
  instance.pendingPostCommitEffects = [];

  queue.forEach((callback) => {
    callback();
  });
}
