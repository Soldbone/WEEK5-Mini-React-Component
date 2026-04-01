import { h } from "../core/vdom.js";
import { resolveComponentTree } from "../runtime/resolveComponentTree.js";

function Hero({ eyebrow, title, description, focusLabel, focusText }) {
  return h(
    "header",
    { className: "hero" },
    h(
      "div",
      { className: "hero__copy" },
      h("p", { className: "hero__eyebrow" }, eyebrow),
      h("h1", { className: "hero__title" }, title),
      h("p", { className: "hero__description" }, description),
    ),
    h(
      "div",
      { className: "hero__note" },
      h("span", { className: "hero__note-label" }, focusLabel),
      h("strong", null, focusText),
    ),
  );
}

function MetricCard({ label, value, hint }) {
  return h(
    "article",
    { className: "metric-card" },
    h("p", { className: "metric-card__label" }, label),
    h("strong", { className: "metric-card__value" }, value),
    h("p", { className: "metric-card__hint" }, hint),
  );
}

function TodoRow({ title, status, meta, done = false }) {
  return h(
    "li",
    { className: "todo-item" },
    h(
      "div",
      { className: "todo-item__check" },
      h("span", { className: done ? "todo-item__indicator is-done" : "todo-item__indicator" }),
    ),
    h(
      "div",
      { className: "todo-item__body" },
      h(
        "strong",
        { className: done ? "todo-item__title is-done" : "todo-item__title" },
        title,
      ),
      h("p", { className: "todo-item__meta" }, meta),
    ),
    h(
      "span",
      { className: done ? "todo-item__badge is-done" : "todo-item__badge" },
      status,
    ),
  );
}

function PanelHeader({ eyebrow, title }) {
  return h(
    "div",
    { className: "panel__header" },
    h("p", { className: "panel__eyebrow" }, eyebrow),
    h("h2", { className: "panel__title" }, title),
  );
}

function CounterPanel({ count, hint, goals }) {
  return h(
    "section",
    { className: "panel panel--counter" },
    h(PanelHeader, {
      eyebrow: "Counter snapshot",
      title: "오늘의 집중 리듬",
    }),
    h(
      "div",
      { className: "counter-card" },
      h("p", { className: "counter-card__label" }, "Pomodoro count"),
      h("strong", { className: "counter-card__value" }, count),
      h("p", { className: "counter-card__hint" }, hint),
    ),
    h(
      "div",
      { className: "button-row" },
      h("button", { className: "ghost-button", type: "button" }, "-1"),
      h("button", { className: "solid-button", type: "button" }, "+1"),
      h("button", { className: "ghost-button", type: "button" }, "Reset"),
    ),
    h(
      "div",
      { className: "metrics-grid" },
      ...goals.map((goal) => h(MetricCard, goal)),
    ),
  );
}

function TodoPanel({ placeholder, items }) {
  return h(
    "section",
    { className: "panel panel--todo" },
    h(PanelHeader, {
      eyebrow: "Todo snapshot",
      title: "발표 준비 체크리스트",
    }),
    h(
      "form",
      { className: "todo-form" },
      h("input", {
        className: "todo-form__input",
        type: "text",
        placeholder,
        value: "",
        readOnly: true,
        "aria-label": "새 작업 입력",
      }),
      h(
        "button",
        { className: "solid-button solid-button--wide", type: "button" },
        "Add todo",
      ),
    ),
    h(
      "ul",
      { className: "todo-list" },
      ...items.map((item) => h(TodoRow, item)),
    ),
  );
}

const sampleData = {
  hero: {
    eyebrow: "Step 4 · Component",
    title: "Learning React Core Clone",
    description:
      "루트 FunctionComponent가 자식 함수형 컴포넌트를 일반 VDOM으로 해소한 뒤 diff·patch에 넘기는 단계입니다.",
    focusLabel: "Current focus",
    focusText: "FunctionComponent, stateless children, resolved VDOM tree",
  },
  counter: {
    count: "03",
    hint: "오전 세션 기준 정적 샘플 값",
    goals: [
      {
        label: "이번 주 목표",
        value: "12 cycles",
        hint: "발표 전까지 집중 세션을 누적합니다.",
      },
      {
        label: "완료율",
        value: "75%",
        hint: "현재 샘플 데이터 기준 진행률입니다.",
      },
    ],
  },
  todo: {
    placeholder: "새 작업을 입력하세요",
    items: [
      {
        title: "VNode 구조 설명 연습",
        status: "Done",
        meta: "README에 핵심 흐름 정리",
        done: true,
      },
      {
        title: "FunctionComponent 흐름 정리",
        status: "Next",
        meta: "mount/update와 resolved tree 관계 설명",
      },
      {
        title: "Hooks 슬롯 준비",
        status: "Queued",
        meta: "다음 step에서 hooks 배열을 실제로 연결",
      },
    ],
  },
};

function mergeAppProps(props = {}) {
  return {
    hero: {
      ...sampleData.hero,
      ...props.hero,
    },
    counter: {
      ...sampleData.counter,
      ...props.counter,
      goals: props.counter?.goals ?? sampleData.counter.goals,
    },
    todo: {
      ...sampleData.todo,
      ...props.todo,
      items: props.todo?.items ?? sampleData.todo.items,
    },
  };
}

export function App(props = sampleData) {
  const appData = mergeAppProps(props);

  return h(
    "div",
    { className: "app-shell" },
    h(Hero, appData.hero),
    h(
      "main",
      { className: "board" },
      h(CounterPanel, appData.counter),
      h(TodoPanel, appData.todo),
    ),
  );
}

export function createAppTree(props = sampleData) {
  return resolveComponentTree(h(App, props));
}
