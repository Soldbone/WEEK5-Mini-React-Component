import { App } from "./App.js";
import { FunctionComponent } from "../runtime/FunctionComponent.js";

function createUnmountedPlaceholder() {
  const wrapper = document.createElement("section");
  wrapper.className = "app-placeholder";
  wrapper.setAttribute("aria-live", "polite");

  const eyebrow = document.createElement("p");
  eyebrow.className = "app-placeholder__eyebrow";
  eyebrow.textContent = "App is not mounted";

  const title = document.createElement("strong");
  title.className = "app-placeholder__title";
  title.textContent = "Mount App 버튼을 눌러 루트 컴포넌트를 연결하세요";

  const description = document.createElement("p");
  description.className = "app-placeholder__description";
  description.textContent =
    "지금은 전체 앱이 DOM에서 분리된 상태입니다. Mount App을 누르면 앱이 렌더되고, Unmount App을 누르면 다시 이 안내 화면으로 돌아옵니다.";

  wrapper.append(eyebrow, title, description);
  return wrapper;
}

export function attachDemo(root, controls = {}) {
  if (!root) {
    throw new Error("attachDemo(root) requires a root container.");
  }

  const {
    mountButton = null,
    unmountButton = null,
    statusNode = null,
    autoMount = mountButton || unmountButton ? false : true,
  } = controls;

  let app = null;

  function isMounted() {
    return Boolean(app?.root);
  }

  function syncControls() {
    if (!isMounted()) {
      root.replaceChildren(createUnmountedPlaceholder());
    }

    if (statusNode) {
      statusNode.textContent = isMounted()
        ? "현재 상태: mounted"
        : "현재 상태: unmounted. Mount App 버튼을 눌러 시작하세요.";
    }

    if (mountButton) {
      mountButton.disabled = isMounted();
    }

    if (unmountButton) {
      unmountButton.disabled = !isMounted();
    }
  }

  function mountApp() {
    if (isMounted()) {
      return app.domRoot;
    }

    app = new FunctionComponent(App);
    const domRoot = app.mount(root);
    syncControls();
    return domRoot;
  }

  function unmountApp() {
    if (!isMounted()) {
      return null;
    }

    const result = app.unmount();
    syncControls();
    return result;
  }

  mountButton?.addEventListener("click", mountApp);
  unmountButton?.addEventListener("click", unmountApp);

  if (autoMount) {
    mountApp();
  } else {
    syncControls();
  }

  return {
    mountApp,
    unmountApp,
    isMounted,
    getApp() {
      return app;
    },
    detach() {
      mountButton?.removeEventListener("click", mountApp);
      unmountButton?.removeEventListener("click", unmountApp);
    },
  };
}
