import { h } from "../core/vdom.js";
import { useEffect, useMemo, useState } from "../runtime/hooks.js";
import { resolveComponentTree } from "../runtime/resolveComponentTree.js";

const CAT_IMAGE_BASE_URL = "https://cataas.com/cat?type=small&width=360&height=240";
const THEME_STORAGE_KEY = "mini-react-theme";

function Hero({
  eyebrow,
  title,
  description,
  themeMode,
  isDark,
  onSetLightTheme,
  onSetDarkTheme,
}) {
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
      h("span", { className: "hero__note-label" }, "Theme mode"),
      h("strong", { className: "hero__note-value" }, isDark ? "Dark" : "Light"),
      h(
        "p",
        { className: "theme-toggle__meta" },
        isDark
          ? "어두운 발표 환경에 맞게 전체 컬러 변수를 전환했습니다."
          : "기본 밝은 테마로 돌아가 전체 레이아웃을 다시 확인할 수 있습니다.",
      ),
      h(
        "div",
        { className: "theme-toggle__actions", role: "group", "aria-label": "화면 테마 전환" },
        h(
          "button",
          {
            className:
              themeMode === "light"
                ? "theme-toggle__choice theme-toggle__choice--light is-active"
                : "theme-toggle__choice theme-toggle__choice--light",
            type: "button",
            onClick: onSetLightTheme,
            "aria-pressed": themeMode === "light" ? "true" : "false",
          },
          "Light",
        ),
        h(
          "button",
          {
            className:
              themeMode === "dark"
                ? "theme-toggle__choice theme-toggle__choice--dark is-active"
                : "theme-toggle__choice theme-toggle__choice--dark",
            type: "button",
            onClick: onSetDarkTheme,
            "aria-pressed": themeMode === "dark" ? "true" : "false",
          },
          "Dark",
        ),
      ),
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

function TodoRow({
  id,
  title,
  status,
  meta,
  done = false,
  isEditing = false,
  onToggle,
  onStartEdit,
  onDelete,
}) {
  return h(
    "li",
    { className: isEditing ? "todo-item is-editing" : "todo-item" },
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
      "div",
      { className: "todo-item__aside" },
      h(
        "span",
        { className: done ? "todo-item__badge is-done" : "todo-item__badge" },
        isEditing ? "Editing" : status,
      ),
      h(
        "div",
        { className: "todo-item__actions" },
        h(
          "button",
          {
            className: "todo-item__action todo-item__edit",
            type: "button",
            onClick: () => onStartEdit(id),
          },
          isEditing ? "Editing..." : "Edit",
        ),
        h(
          "button",
          {
            className: "todo-item__action todo-item__action--danger todo-item__delete",
            type: "button",
            onClick: () => onDelete(id),
          },
          "Delete",
        ),
      ),
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

function TodoPanel({
  draft,
  placeholder,
  items,
  summary,
  formHint,
  editingTodoId,
  onDraftChange,
  onSubmit,
  onCancelEdit,
  onToggleTodo,
  onStartEditTodo,
  onDeleteTodo,
}) {
  return h(
    "section",
    { className: "panel panel--todo" },
    h(PanelHeader, {
      eyebrow: "Todo snapshot",
      title: "발표 준비 체크리스트",
    }),
    h("p", { className: "panel__summary" }, summary),
    h("p", { className: "todo-form__hint" }, formHint),
    h(
      "form",
      { className: "todo-form", onSubmit },
      h("input", {
        className: "todo-form__input",
        type: "text",
        placeholder,
        value: draft,
        onInput: onDraftChange,
        "aria-label": editingTodoId !== null ? "작업 제목 수정" : "새 작업 입력",
      }),
      h(
        "div",
        { className: "todo-form__actions" },
        h(
          "button",
          { className: "solid-button solid-button--wide", type: "submit" },
          editingTodoId !== null ? "Save changes" : "Add todo",
        ),
        ...(editingTodoId !== null
          ? [
              h(
                "button",
                { className: "ghost-button", type: "button", onClick: onCancelEdit },
                "Cancel",
              ),
            ]
          : []),
      ),
    ),
    h(
      "ul",
      { className: "todo-list" },
      ...items.map((item) =>
        h(TodoRow, {
          ...item,
          isEditing: item.id === editingTodoId,
          onToggle: onToggleTodo,
          onStartEdit: onStartEditTodo,
          onDelete: onDeleteTodo,
        }),
      ),
    ),
  );
}

function CatPhotoWidget({ isVisible, photoUrl, refreshMs, onShow, onHide }) {
  return h(
    "aside",
    { className: isVisible ? "cat-widget is-visible" : "cat-widget" },
    h(
      "div",
      { className: "cat-widget__header" },
      h("p", { className: "cat-widget__eyebrow" }, "Custom hook demo"),
      h("strong", { className: "cat-widget__title" }, "랜덤 고양이 자동 갱신"),
    ),
    h(
      "p",
      { className: "cat-widget__status" },
      isVisible
        ? `${Math.max(1, Math.round(refreshMs / 1000))}초마다 새로운 랜덤 고양이 사진으로 자동 갱신됩니다.`
        : "버튼을 누르면 오른쪽 아래에서 랜덤 고양이 사진이 1초마다 자동으로 바뀝니다.",
    ),
    ...(isVisible
      ? [
          h("img", {
            className: "cat-widget__image",
            src: photoUrl,
            alt: "랜덤 고양이 사진",
          }),
        ]
      : [
          h(
            "div",
            { className: "cat-widget__placeholder" },
            h("span", { className: "cat-widget__placeholder-label" }, "Cat preview"),
            h("strong", null, "지금은 숨김 상태"),
          ),
        ]),
    h(
      "div",
      { className: "cat-widget__actions" },
      h(
        "button",
        {
          className: "solid-button cat-widget__show",
          type: "button",
          onClick: onShow,
        },
        isVisible ? "고양이 갱신 시작됨" : "Show random cat",
      ),
      ...(isVisible
        ? [
            h(
              "button",
              {
                className: "ghost-button cat-widget__hide",
                type: "button",
                onClick: onHide,
              },
              "Hide now",
            ),
          ]
        : []),
    ),
  );
}

function useAutoRefreshingCatPhoto(refreshMs = 1000) {
  const [viewer, setViewer] = useState(() => ({
    seed: 0,
    isVisible: false,
  }));

  const photoUrl = useMemo(
    () => (viewer.seed === 0 ? "" : `${CAT_IMAGE_BASE_URL}&_=${viewer.seed}`),
    [viewer.seed],
  );

  useEffect(() => {
    if (!viewer.isVisible) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setViewer((currentViewer) =>
        currentViewer.isVisible
          ? {
              ...currentViewer,
              seed: Date.now(),
            }
          : currentViewer,
      );
    }, refreshMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [viewer.isVisible, refreshMs]);

  const showRandomCat = () => {
    setViewer({
      seed: Date.now(),
      isVisible: true,
    });
  };

  const hideRandomCat = () => {
    setViewer((currentViewer) => ({
      ...currentViewer,
      isVisible: false,
    }));
  };

  return {
    isVisible: viewer.isVisible,
    photoUrl,
    refreshMs,
    showRandomCat,
    hideRandomCat,
  };
}

function readStoredTheme() {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
}

function useDarkMode(initialThemeMode = "light") {
  const [themeMode, setThemeMode] = useState(() => readStoredTheme() ?? initialThemeMode);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.documentElement.dataset.theme = themeMode;

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    }

    return undefined;
  }, [themeMode]);

  return {
    themeMode,
    isDark: themeMode === "dark",
    setLightMode() {
      setThemeMode("light");
    },
    setDarkMode() {
      setThemeMode("dark");
    },
    toggleThemeMode() {
      setThemeMode((currentThemeMode) => (currentThemeMode === "dark" ? "light" : "dark"));
    },
  };
}

const defaultViewProps = {
  hero: {
    eyebrow: "Mini React demo",
    title: "Learning React Core Clone",
    description:
      "직접 만든 mini React 위에서 카운터, 발표 체크리스트, 그리고 커스텀 훅으로 1초마다 갱신되는 랜덤 고양이 위젯을 다루는 데모입니다.",
  },
  weeklyTarget: 12,
  todoPlaceholder: "새 발표 체크 항목을 입력하세요",
  catPhotoRefreshMs: 1000,
  initialThemeMode: "light",
};

function mergeAppProps(props = {}) {
  return {
    hero: {
      ...defaultViewProps.hero,
      ...props.hero,
    },
    weeklyTarget: props.weeklyTarget ?? defaultViewProps.weeklyTarget,
    todoPlaceholder: props.todoPlaceholder ?? defaultViewProps.todoPlaceholder,
    catPhotoRefreshMs: props.catPhotoRefreshMs ?? defaultViewProps.catPhotoRefreshMs,
    initialThemeMode: props.initialThemeMode ?? defaultViewProps.initialThemeMode,
  };
}

function createInitialTodos() {
  return [
    {
      id: 1,
      title: "README 데모 순서 점검",
      status: "Done",
      meta: "핵심 흐름을 4분 안에 설명할 수 있도록 정리",
      done: true,
    },
    {
      id: 2,
      title: "상태 변경 시연 연습",
      status: "Open",
      meta: "카운터와 체크리스트가 어떻게 다시 렌더되는지 말하기",
      done: false,
    },
    {
      id: 3,
      title: "Q&A 대비 질문 정리",
      status: "Open",
      meta: "실제 React와 차이점을 짧게 답할 수 있게 준비",
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
      label: "체크 완료",
      value: `${completedTodos}/${todos.length} items`,
      hint: "체크리스트 요약은 useMemo로 다시 계산됩니다.",
    },
    {
      label: "완료율",
      value: `${completionRate}%`,
      hint: "발표 준비 페이스를 한눈에 확인합니다.",
    },
  ];
}

function createTodoSummary(todos, editingTodo) {
  const completedCount = todos.filter((todo) => todo.done).length;
  const openCount = todos.length - completedCount;
  const baseSummary = `총 ${todos.length}개 · 완료 ${completedCount}개 · 진행 중 ${openCount}개`;

  if (!editingTodo) {
    return baseSummary;
  }

  return `${baseSummary} · "${editingTodo.title}" 수정 중`;
}

function buildAppView({
  hero,
  theme,
  count,
  counterHint,
  counterGoals,
  todoDraft,
  todoPlaceholder,
  todos,
  todoSummary,
  todoFormHint,
  editingTodoId,
  catPhoto,
  onDecrement,
  onIncrement,
  onReset,
  onDraftChange,
  onSubmit,
  onCancelEdit,
  onToggleTodo,
  onStartEditTodo,
  onDeleteTodo,
}) {
  return h(
    "div",
    { className: "app-shell" },
    h(Hero, {
      ...hero,
      themeMode: theme.themeMode,
      isDark: theme.isDark,
      onSetLightTheme: theme.onSetLightTheme,
      onSetDarkTheme: theme.onSetDarkTheme,
    }),
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
        formHint: todoFormHint,
        editingTodoId,
        onDraftChange,
        onSubmit,
        onCancelEdit,
        onToggleTodo,
        onStartEditTodo,
        onDeleteTodo,
      }),
    ),
    h(CatPhotoWidget, catPhoto),
  );
}

export function App(props = defaultViewProps) {
  const appData = mergeAppProps(props);
  const [count, setCount] = useState(() => 3);
  const [todoDraft, setTodoDraft] = useState("");
  const [todos, setTodos] = useState(createInitialTodos);
  const [nextTodoId, setNextTodoId] = useState(() => 4);
  const [editingTodoId, setEditingTodoId] = useState(null);
  const catPhoto = useAutoRefreshingCatPhoto(appData.catPhotoRefreshMs);
  const darkMode = useDarkMode(appData.initialThemeMode);

  const counterGoals = useMemo(
    () => createCounterGoals(count, todos, appData.weeklyTarget),
    [count, todos, appData.weeklyTarget],
  );
  const completedTodoCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);
  const editingTodo = useMemo(
    () => todos.find((todo) => todo.id === editingTodoId) ?? null,
    [todos, editingTodoId],
  );
  const todoSummary = useMemo(() => createTodoSummary(todos, editingTodo), [todos, editingTodo]);
  const todoFormHint = useMemo(
    () =>
      editingTodo
        ? `"${editingTodo.title}" 항목을 수정 중입니다. 저장하거나 취소할 수 있습니다.`
        : "새 발표 체크 항목을 추가하거나, 목록에서 기존 항목을 수정/삭제할 수 있습니다.",
    [editingTodo],
  );

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

    if (editingTodoId !== null) {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === editingTodoId
            ? {
                ...todo,
                title,
                meta: "수정됨 · 발표 흐름에 맞게 항목 내용을 업데이트",
              }
            : todo,
        ),
      );
      setEditingTodoId(null);
      setTodoDraft("");
      return;
    }

    const todoId = nextTodoId;

    setTodos((currentTodos) => [
      ...currentTodos,
      {
        id: todoId,
        title,
        status: "Open",
        meta: "사용자 입력으로 추가된 발표 체크 항목",
        done: false,
      },
    ]);
    setNextTodoId((currentId) => currentId + 1);
    setTodoDraft("");
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
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

  const handleStartEditTodo = (todoId) => {
    const targetTodo = todos.find((todo) => todo.id === todoId);

    if (!targetTodo) {
      return;
    }

    setTodoDraft(targetTodo.title);
    setEditingTodoId(todoId);
  };

  const handleDeleteTodo = (todoId) => {
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== todoId));

    if (editingTodoId === todoId) {
      setEditingTodoId(null);
      setTodoDraft("");
    }
  };

  return buildAppView({
    hero: appData.hero,
    theme: {
      themeMode: darkMode.themeMode,
      isDark: darkMode.isDark,
      onSetLightTheme: darkMode.setLightMode,
      onSetDarkTheme: darkMode.setDarkMode,
    },
    count: String(count).padStart(2, "0"),
    counterHint: "카운터 값은 root useState 슬롯에서 관리됩니다.",
    counterGoals,
    todoDraft,
    todoPlaceholder: appData.todoPlaceholder,
    todos,
    todoSummary,
    todoFormHint,
    editingTodoId,
    catPhoto: {
      isVisible: catPhoto.isVisible,
      photoUrl: catPhoto.photoUrl,
      refreshMs: catPhoto.refreshMs,
      onShow: catPhoto.showRandomCat,
      onHide: catPhoto.hideRandomCat,
    },
    onDecrement: handleDecrement,
    onIncrement: handleIncrement,
    onReset: handleReset,
    onDraftChange: handleDraftChange,
    onSubmit: handleSubmit,
    onCancelEdit: handleCancelEdit,
    onToggleTodo: handleToggleTodo,
    onStartEditTodo: handleStartEditTodo,
    onDeleteTodo: handleDeleteTodo,
  });
}

export function createAppTree(props = defaultViewProps) {
  const appData = mergeAppProps(props);
  const initialTodos = createInitialTodos();
  const initialCount = 3;

  return resolveComponentTree(
    buildAppView({
      hero: appData.hero,
      theme: {
        themeMode: appData.initialThemeMode,
        isDark: appData.initialThemeMode === "dark",
        onSetLightTheme: () => {},
        onSetDarkTheme: () => {},
      },
      count: String(initialCount).padStart(2, "0"),
      counterHint: "카운터 값은 root useState 슬롯에서 관리됩니다.",
      counterGoals: createCounterGoals(initialCount, initialTodos, appData.weeklyTarget),
      todoDraft: "",
      todoPlaceholder: appData.todoPlaceholder,
      todos: initialTodos,
      todoSummary: createTodoSummary(initialTodos, null),
      todoFormHint: "새 발표 체크 항목을 추가하거나, 목록에서 기존 항목을 수정/삭제할 수 있습니다.",
      editingTodoId: null,
      catPhoto: {
        isVisible: false,
        photoUrl: "",
        refreshMs: appData.catPhotoRefreshMs,
        onShow: () => {},
        onHide: () => {},
      },
      onDecrement: () => {},
      onIncrement: () => {},
      onReset: () => {},
      onDraftChange: () => {},
      onSubmit: (event) => event.preventDefault(),
      onCancelEdit: () => {},
      onToggleTodo: () => {},
      onStartEditTodo: () => {},
      onDeleteTodo: () => {},
    }),
  );
}
