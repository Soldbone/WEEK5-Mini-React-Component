# Mini React Clone for Jungle Demo
Virtual DOM, `diff/patch`, function component, state, hooks(`useState`, `useEffect`, `useMemo`)를 바이브 코딩으로 구현한 Mini React 프로젝트입니다.

## 핵심 구조
전체 흐름은 아래 한 줄로 요약할 수 있습니다.


## 핵심 구현
### Function Component
- function component를 호출해 vnode를 만든 뒤, 다시 재귀적으로 plain vnode tree로 해석합니다.
- child component는 지원하지만, 현재 hooks는 root component에서만 허용합니다.

### State
- `FunctionComponent.setState()`는 object patch merge 방식으로 동작합니다.
- 별도로 hooks 기반 `useState()`도 지원합니다.
- 상태가 바뀌면 root instance가 `update()`를 호출해 다시 렌더링합니다.

### Hooks
- `useState`
  - lazy initializer 지원
  - functional update 지원
- `useEffect`
  - render 중 바로 실행하지 않고 DOM commit 이후 실행
  - deps가 바뀌면 이전 cleanup을 먼저 호출
- `useMemo`
  - dependency array가 같으면 캐시값 재사용

## 회고



## React와의 차이
- `key` 기반 reconciliation 없음
- `Fiber` / concurrent rendering 없음
- batched update 없음
- child component hooks 미지원
- synthetic event system 없음
- scheduler / priority 제어 없음

## 테스트
### 단위 테스트
- `tests/component.test.js`
  - function component 해석
  - update 시 기존 DOM 유지
- `tests/state.test.js`
  - `setState` merge
  - demo app의 counter / todo 상호작용
- `tests/hooks-runtime.test.js`
  - hook slot 재사용
  - hook 사용 위치 제한
  - post-commit effect queue
- `tests/hooks-api.test.js`
  - `useState` lazy init / functional update
  - `useEffect` cleanup
  - `useMemo` cache 재사용
