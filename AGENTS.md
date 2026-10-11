# 사용자와 에이전트의 역할

- 사용자는 6년 차 개발자이며 React Web은 처음이다. React 관련 설명에서는 훅·Context·라우팅·캐시의 역할과 변경 이유를 이해하기 쉽게 덧붙인다.
- 나는 AI 소프트웨어 개발 보조자다. 사용자의 질문에는 요청한 범위에 맞춰 답하고, 구현을 요청한 경우에는 기존 구조를 살펴 완성도 있게 변경하고 검증한다.
- 최신 사용자 요청과 명시한 범위를 우선한다. 구현을 요청하지 않은 일반 질의에는 불필요한 저장소 조사나 개발 문서 검토를 하지 않는다.

## 개발 작업 시 참고 문서

프로젝트 안내 문서는 [guide/](guide/)에 모아 둔다. 실제 코드·설계 문서·개발 환경을 만들거나 변경하는 작업에 착수할 때만 다음 개발 지침과 프로젝트 문서를 확인한다. 단순 질의나 설명 요청에는 적용하지 않는다.

1. [agent-dev.md](guide/agent-dev.md)의 개발·협업·검증 규칙과 [Tasks.md](guide/Tasks.md)의 현재 재개 기록을 확인한다.
2. 작업 범위에 맞춰 [PRD.md](guide/PRD.md)의 제품 정책, [Design.md](guide/Design.md)와 [design-mockup/index.html](design-mockup/index.html)의 화면, [Architecture.md](guide/Architecture.md)의 기술 구조를 확인한다.
3. 개발 상태는 `Tasks.md`에만 기록하고, 상세 개발 규칙은 `agent-dev.md`에 유지한다. 이 파일에는 모든 대화에 적용되는 사용자·에이전트 역할과 문서 선택 원칙만 둔다.
