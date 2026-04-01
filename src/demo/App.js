import { h } from "../core/vdom.js";
import { useEffect, useMemo, useState } from "../runtime/hooks.js";
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
    eyebrow: "Step 7-9 · Hooks",
    title: "Learning React Core Clone",
    description:
      "useState, useEffect, useMemo를 루트 훅 슬롯 위에 올려서 상태, 부수효과, 메모이제이션이 실제 보드에 연결되는 단계입니다.",
    focusLabel: "Current focus",
    focusText: "useState, useEffect, useMemo on top of root hook slots",
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

function createInitialTodos() {
  return [
    {
      id: 1,
      title: "VNode 구조 설명 연습",
      status: "Done",
      meta: "README에 핵심 흐름 정리",
      done: true,
    },
    {
      id: 2,
      title: "Hook 슬롯 흐름 정리",
      status: "Open",
      meta: "useState가 같은 슬롯을 다시 찾는지 확인",
      done: false,
    },
    {
      id: 3,
      title: "Effect / Memo 데모 연결",
      status: "Open",
      meta: "문서 제목과 요약 계산을 훅으로 연결",
      done: false,
    },
  ];
}

function createCounterGoals(count, todos, weeklyTarget) {
  const completionRate = Math.round((count / weeklyTarget) * 100);
  const completedTodos = todos.filter((todo) => todo.done).length;

  return [
    {
      label: "이번 주 목표",
      value: `${count}/${weeklyTarget} cycles`,
      hint: "카운터 값은 useState 슬롯에 저장됩니다.",
    },
    {
      label: "완료율",
      value: `${completionRate}%`,
      hint: `완료된 todo ${completedTodos}개가 useMemo 결과에 반영됩니다.`,
    },
  ];
}

function createTodoSummary(todos) {
  const completedCount = todos.filter((todo) => todo.done).length;
  const openCount = todos.length - completedCount;

  return `총 ${todos.length}개 · 완료 ${completedCount}개 · 진행 중 ${openCount}개`;
}

function buildAppView({
  hero,
  count,
  counterHint,
  counterGoals,
  todoDraft,
  todoPlaceholder,
  todos,
  todoSummary,
  onDecrement,
  onIncrement,
  onReset,
  onDraftChange,
  onSubmit,
  onToggleTodo,
}) {
  return h(
    "div",
    { className: "app-shell" },
    h(Hero, hero),
    h(
      "main",
      { className: "board" },
      h(CounterPanel, {
        count,
        hint: counterHint,
        goals: counterGoals,
        onDecrement,
        onIncrement,
        onReset,
      }),
      h(TodoPanel, {
        draft: todoDraft,
        placeholder: todoPlaceholder,
        items: todos,
        summary: todoSummary,
        onDraftChange,
        onSubmit,
        onToggleTodo,
      }),
    ),
  );
}

export function App(props = defaultViewProps) {
  const appData = mergeAppProps(props);
  const [count, setCount] = useState(() => 3);
  const [todoDraft, setTodoDraft] = useState("");
  const [todos, setTodos] = useState(createInitialTodos);
  const [nextTodoId, setNextTodoId] = useState(() => 4);

  const counterGoals = useMemo(
    () => createCounterGoals(count, todos, appData.weeklyTarget),
    [count, todos, appData.weeklyTarget],
  );
  const todoSummary = useMemo(() => createTodoSummary(todos), [todos]);
  const completedTodoCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.title = `Mini React · ${String(count).padStart(2, "0")} cycles · ${completedTodoCount}/${todos.length} todos`;

    return undefined;
  }, [count, completedTodoCount, todos.length]);

  const handleDecrement = () => {
    setCount((currentCount) => Math.max(0, currentCount - 1));
  };

  const handleIncrement = () => {
    setCount((currentCount) => currentCount + 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleDraftChange = (event) => {
    setTodoDraft(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = todoDraft.trim();

    if (!title) {
      return;
    }

    const todoId = nextTodoId;

    setTodos((currentTodos) => [
      ...currentTodos,
      {
        id: todoId,
        title,
        status: "Open",
        meta: "루트 useState 슬롯에서 새로 추가된 작업",
        done: false,
      },
    ]);
    setNextTodoId((currentId) => currentId + 1);
    setTodoDraft("");
  };

  const handleToggleTodo = (todoId) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) => {
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
    );
  };

  return buildAppView({
    hero: appData.hero,
    count: String(count).padStart(2, "0"),
    counterHint: "카운터 값은 root useState 슬롯에서 관리됩니다.",
    counterGoals,
    todoDraft,
    todoPlaceholder: appData.todoPlaceholder,
    todos,
    todoSummary,
    onDecrement: handleDecrement,
    onIncrement: handleIncrement,
    onReset: handleReset,
    onDraftChange: handleDraftChange,
    onSubmit: handleSubmit,
    onToggleTodo: handleToggleTodo,
  });
}

export function createAppTree(props = defaultViewProps) {
  const appData = mergeAppProps(props);
  const initialTodos = createInitialTodos();
  const initialCount = 3;

  return resolveComponentTree(
    buildAppView({
      hero: appData.hero,
      count: String(initialCount).padStart(2, "0"),
      counterHint: "카운터 값은 root useState 슬롯에서 관리됩니다.",
      counterGoals: createCounterGoals(initialCount, initialTodos, appData.weeklyTarget),
      todoDraft: "",
      todoPlaceholder: appData.todoPlaceholder,
      todos: initialTodos,
      todoSummary: createTodoSummary(initialTodos),
      onDecrement: () => {},
      onIncrement: () => {},
      onReset: () => {},
      onDraftChange: () => {},
      onSubmit: (event) => event.preventDefault(),
      onToggleTodo: () => {},
    }),
  );
}
