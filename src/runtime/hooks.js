import { claimHookSlot, queuePostCommitEffect } from "./hookRuntime.js";

function cloneDeps(deps) {
  return Array.isArray(deps) ? [...deps] : undefined;
}

function validateDeps(name, deps) {
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error(`${name}() expects dependencies to be an array or undefined.`);
  }
}

export function areHookDepsEqual(previousDeps, nextDeps) {
  if (!Array.isArray(previousDeps) || !Array.isArray(nextDeps)) {
    return false;
  }

  if (previousDeps.length !== nextDeps.length) {
    return false;
  }

  return previousDeps.every((dependency, index) => Object.is(dependency, nextDeps[index]));
}

export function useState(initialValue) {
  const slot = claimHookSlot("useState", (instance) => {
    const state =
      typeof initialValue === "function"
        ? initialValue()
        : initialValue;

    const stateSlot = {
      current: state,
      setValue: null,
    };

    stateSlot.setValue = (nextValue) => {
      if (instance.wasUnmounted) {
        return stateSlot.current;
      }

      const resolvedValue =
        typeof nextValue === "function"
          ? nextValue(stateSlot.current)
          : nextValue;

      stateSlot.current = resolvedValue;

      if (instance.root) {
        instance.update();
      }

      return stateSlot.current;
    };

    return stateSlot;
  });

  return [slot.value.current, slot.value.setValue];
}

export function useEffect(effect, deps) {
  validateDeps("useEffect", deps);

  const slot = claimHookSlot("useEffect", () => ({
    cleanup: undefined,
    deps: undefined,
    initialized: false,
  }));

  const shouldRun =
    !slot.value.initialized ||
    deps === undefined ||
    !areHookDepsEqual(slot.value.deps, deps);

  if (!shouldRun) {
    return;
  }

  queuePostCommitEffect(() => {
    if (typeof slot.value.cleanup === "function") {
      slot.value.cleanup();
    }

    slot.value.deps = cloneDeps(deps);
    slot.value.initialized = true;

    const cleanup = effect();

    slot.value.cleanup = typeof cleanup === "function" ? cleanup : undefined;
  });
}

export function useMemo(factory, deps) {
  validateDeps("useMemo", deps);

  const slot = claimHookSlot("useMemo", () => ({
    deps: undefined,
    initialized: false,
    value: undefined,
  }));

  const shouldRecompute =
    !slot.value.initialized ||
    deps === undefined ||
    !areHookDepsEqual(slot.value.deps, deps);

  if (shouldRecompute) {
    slot.value.value = factory();
    slot.value.deps = cloneDeps(deps);
    slot.value.initialized = true;
  }

  return slot.value.value;
}

export function cleanupEffectHooks(instance) {
  let firstError = null;

  instance.hooks.forEach((slot) => {
    if (slot?.kind !== "useEffect") {
      return;
    }

    if (typeof slot.value.cleanup !== "function") {
      return;
    }

    try {
      slot.value.cleanup();
    } catch (error) {
      if (!firstError) {
        firstError = error;
      }
    }

    slot.value.cleanup = undefined;
    slot.value.deps = undefined;
    slot.value.initialized = false;
  });

  if (firstError) {
    throw firstError;
  }
}
