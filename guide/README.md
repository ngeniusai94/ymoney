# 가계부 톡톡 프로젝트 가이드

## 로컬 실행

React 웹 앱은 [web/](../web/)에 있다. [환경 변수 예시](../web/.env.example)를 참고해 `web/.env`를 준비한 뒤, 저장소 루트에서 실행한다.

```sh
cd web
npm ci
npm run dev
```

DB SQL은 [web/supabase/](../web/supabase/)에 있다. 네이티브 앱 소스는 별도로 준비해 저장소 루트의 `app/`에 추가한다.

## 문서

- [PRD](PRD.md) — 제품 요구사항과 정책
- [Design](Design.md) — 화면 구성과 상호작용
- [Architecture](Architecture.md) — 코드 구조, 데이터베이스, Vercel 배포 설정
- [Tasks](Tasks.md) — 진행 상태, 날짜별 변경·배포 기록, 후속 확인
- [agent-dev](agent-dev.md) — 개발·검증·협업 규칙
- [화면 목업](../design-mockup/index.html) — 정적 HTML 참고 자료
