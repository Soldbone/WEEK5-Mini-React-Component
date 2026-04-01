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

function TodoRow({ id, title, status, meta, done = false, onToggle }) {
  return h(
    "li",
    { className: "todo-item" },
    h(
      "button",
      {
        className: "todo-item__toggle",
        type: "button",
        onClick: () => onToggle(id),
        "aria-label": done ? `${title} 작업을 다시 진행 중으로 변경` : `${title} 작업을 완료로 변경`,
      },
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

function CounterPanel({ count, hint, goals, onDecrement, onIncrement, onReset }) {
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
      h("button", { className: "ghost-button", type: "button", onClick: onDecrement }, "-1"),
      h("button", { className: "solid-button", type: "button", onClick: onIncrement }, "+1"),
      h("button", { className: "ghost-button", type: "button", onClick: onReset }, "Reset"),
    ),
    h(
      "div",
      { className: "metrics-grid" },
      ...goals.map((goal) => h(MetricCard, goal)),
    ),
  );
}

function TodoPanel({ draft, placeholder, items, summary, onDraftChange, onSubmit, onToggleTodo }) {
  return h(
    "section",
    { className: "panel panel--todo" },
    h(PanelHeader, {
      eyebrow: "Todo snapshot",
      title: "발표 준비 체크리스트",
    }),
    h("p", { className: "panel__summary" }, summary),
    h(
      "form",
      { className: "todo-form", onSubmit },
      h("input", {
        className: "todo-form__input",
        type: "text",
        placeholder,
        value: draft,
        onInput: onDraftChange,
        "aria-label": "새 작업 입력",
      }),
      h(
        "button",
        { className: "solid-button solid-button--wide", type: "submit" },
        "Add todo",
      ),
    ),
    h(
      "ul",
      { className: "todo-list" },
      ...items.map((item) =>
        h(TodoRow, {
          ...item,
          onToggle: onToggleTodo,
        }),
      ),
    ),
  );
}

const defaultViewProps = {
  hero: {
    eyebrow: "Step 5 · State",
    title: "Learning React Core Clone",
    description:
      "루트 FunctionComponent의 state bag과 setState가 다시 렌더를 유발하고, 그 결과가 diff·patch를 통해 화면에 반영되는 단계입니다.",
    focusLabel: "Current focus",
    focusText: "state bag, setState(), root-only state ownership",
  },
  weeklyTarget: 12,
  todoPlaceholder: "새 작업을 입력하세요",
};

function mergeAppProps(props = {}) {
  return {
    hero: {
      ...defaultViewProps.hero,
      ...props.hero,
    },
    weeklyTarget: props.weeklyTarget ?? defaultViewProps.weeklyTarget,
    todoPlaceholder: props.todoPlaceholder ?? defaultViewProps.todoPlaceholder,
  };
}

export function createInitialState() {
  return {
    count: 3,
    todoDraft: "",
    nextTodoId: 4,
    todos: [
      {
        id: 1,
        title: "VNode 구조 설명 연습",
        status: "Done",
        meta: "README에 핵심 흐름 정리",
        done: true,
      },
      {
        id: 2,
        title: "Root state 흐름 정리",
        status: "Open",
        meta: "setState가 update를 부르는 지점 확인",
        done: false,
      },
      {
        id: 3,
        title: "Hooks 슬롯 준비",
        status: "Open",
        meta: "다음 step에서 hooks 배열을 실제로 연결",
        done: false,
      },
    ],
  };
}

function createCounterGoals(state, weeklyTarget) {
  const completionRate = Math.round((state.count / weeklyTarget) * 100);
  const completedTodos = state.todos.filter((todo) => todo.done).length;

  return [
    {
      label: "이번 주 목표",
      value: `${state.count}/${weeklyTarget} cycles`,
      hint: "카운터 버튼이 root state를 직접 갱신합니다.",
    },
    {
      label: "완료율",
      value: `${completionRate}%`,
      hint: `완료된 todo ${completedTodos}개가 보드에 함께 반영됩니다.`,
    },
  ];
}

function createTodoSummary(todos) {
  const completedCount = todos.filter((todo) => todo.done).length;
  const openCount = todos.length - completedCount;

  return `총 ${todos.length}개 · 완료 ${completedCount}개 · 진행 중 ${openCount}개`;
}

export function App(
  props = defaultViewProps,
  runtime = {
    state: createInitialState(),
    setState: () => {},
  },
) {
  const appData = mergeAppProps(props);
  const state = runtime.state ?? createInitialState();
  const setState = runtime.setState ?? (() => {});

  const handleDecrement = () => {
    setState((currentState) => ({
      count: Math.max(0, currentState.count - 1),
    }));
  };

  const handleIncrement = () => {
    setState((currentState) => ({
      count: currentState.count + 1,
    }));
  };

  const handleReset = () => {
    setState({
      count: 0,
    });
  };

  const handleDraftChange = (event) => {
    setState({
      todoDraft: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setState((currentState) => {
      const title = currentState.todoDraft.trim();

      if (!title) {
        return null;
      }

      return {
        todoDraft: "",
        nextTodoId: currentState.nextTodoId + 1,
        todos: [
          ...currentState.todos,
          {
            id: currentState.nextTodoId,
            title,
            status: "Open",
            meta: "루트 state bag에서 새로 추가된 작업",
            done: false,
          },
        ],
      };
    });
  };

  const handleToggleTodo = (todoId) => {
    setState((currentState) => ({
      todos: currentState.todos.map((todo) => {
        if (todo.id !== todoId) {
          return todo;
        }

        const nextDone = !todo.done;

        return {
          ...todo,
          done: nextDone,
          status: nextDone ? "Done" : "Open",
          meta: nextDone ? "토글로 완료 처리됨" : "다시 진행 중으로 전환",
        };
      }),
    }));
  };

  return h(
    "div",
    { className: "app-shell" },
    h(Hero, appData.hero),
    h(
      "main",
      { className: "board" },
      h(CounterPanel, {
        count: String(state.count).padStart(2, "0"),
        hint: "카운터 값은 FunctionComponent의 root state bag에서 관리됩니다.",
        goals: createCounterGoals(state, appData.weeklyTarget),
        onDecrement: handleDecrement,
        onIncrement: handleIncrement,
        onReset: handleReset,
      }),
      h(TodoPanel, {
        draft: state.todoDraft,
        placeholder: appData.todoPlaceholder,
        items: state.todos,
        summary: createTodoSummary(state.todos),
        onDraftChange: handleDraftChange,
        onSubmit: handleSubmit,
        onToggleTodo: handleToggleTodo,
      }),
    ),
  );
}

App.createInitialState = createInitialState;

export function createAppTree(props = defaultViewProps) {
  return resolveComponentTree(h(App, props));
}
