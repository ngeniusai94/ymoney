# 가계부 톡톡 · 기술 구조

기준일: 2026-09-27. 실제 현재 구현과 앞으로 필요한 파일의 책임을 함께 관리한다. 제품 정책은 [PRD.md](PRD.md), 진행 상태는 [Tasks.md](Tasks.md)가 관리한다.

## 1. 최소 구조

```text
React 화면 → 기능별 TypeScript API → supabase-js → 기존 Supabase Auth / Data API / PostgreSQL
```

- React + TypeScript + Vite, React Router, CSS 변수로 시작한다. 웹 배포는 Vercel을 목표로 한다.
- Supabase DB는 계속 사용한다. 별도 API 서버, Edge Function, ORM, 복잡한 계층을 선행 추가하지 않는다.
- 일반 조회/저장은 `supabase.from(...).select/insert/update/delete`로 처리한다. 첫 개인 가계부 생성·멤버 연결과 본인 가계부 목록은 각각 별도 RPC로 처리한다. 생성 시 두 테이블을 함께 저장해야 하고 기존 멤버 INSERT 정책에 재귀 오류가 있기 때문이다.
- 아이디 가입에서는 과거 이메일 중복 확인 RPC를 사용하지 않는다. M 번호 발급은 `fn_mon_next_user_srno` RPC를 사용하며, 나머지 회원정보는 `tb_user` 직접 CRUD로 처리한다.
다만, 보안적으로 RPC가 필요할것같은부분은 주석을 꼭달아둔다 ex) RPC로 보안성 강화 필요 항목
- UI 상태, 입력 검사, 필터 조합, 정렬, 월·일 합계는 TypeScript가 담당한다. 컴포넌트에 요청 로직을 흩뿌리지 않고 기능 API 파일에 모은다.
- 여러 요청은 하나의 DB 트랜잭션이 아니다. M 번호 채번, 개인 가계부 중복 방지, 그룹 정원, 마지막 멤버 정리는 해당 화면 구현 때 원자성 필요를 검토한다. 필요성이 확인되면 최소 DB 변경을 사용자에게 먼저 제안한다.
- PostgreSQL의 DECLARE/BEGIN/IF 프로시저 코드를 기본 개발 방식으로 사용하지 않는다. 개인 가계부의 두 RPC는 단순 SQL 함수로 작성한다. 기존 공유 함수의 무조건 제거·대체도 하지 않는다.
- 가계부 전용 6개 테이블은 공유 `public.tb_user`와 분리하기 위해 원격 `ymoney` 스키마에 둔다. `tb_user`와 Auth 객체는 계속 `public`에 둔다. Supabase 클라이언트의 일반 인증 요청은 기존처럼 `public`을 사용하고, 가계부 API에서만 `supabase.schema('ymoney').from(...)`으로 호출한다. 커스텀 스키마를 Data API에서 쓰려면 Supabase Dashboard의 API settings > Exposed schemas에 `ymoney`를 추가해야 한다.
- 원격 캐시가 필요해지는 월간 조회 단계에서 TanStack Query를 사용한다. TanStack Query에 대해 개발자가 잘모르니 자세한 설명과 사용이유등을 상세히 설명해준다. 폼 라이브러리·추가 상태관리 도구는 실제 필요가 생길 때만 도입한다. 과거 계획의 모든 레이어/19개 파일을 만들 의무는 없다.

## 2. 파일 지도 — 필요할 때만 생성

아래는 전체 목표 파일의 위치와 책임이다. **최종 파일 수를 고정하지 않는다.** 아직 쓰지 않는 빈 파일을 만들지 말고 추가/통합 시 이 표를 함께 고친다. `.env`와 생성 산출물은 가이드가 아니므로 현재 정리본에는 없다.
파일명은 기능 폴더 아래에서 해당 기능 접두어를 사용한다. 화면 렌더링과 화면 상태/동작은 분리하고, API는 여러 화면에서 공유할 수 있도록 기능 루트에 둔다. 실제로 공유되는 타입 등 필요한 파일만 추가한다.

| 시점 | 파일 경로 | 책임 |
|---|---|---|
| 첫 화면 | `package.json`, `package-lock.json` | 의존성·실행 명령 |
| 첫 화면 | `index.html`, `vite.config.ts` | 웹 진입점·개발 서버 |
| 웹 배포 | `vercel.json` | Vite 빌드와 dist 출력, SPA 직접 접근/새로고침을 index.html로 연결 |
| 첫 화면 | `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | 공식 Vite 템플릿의 TypeScript 설정 |
| 첫 화면 | `.gitignore` | 환경값·의존성·빌드 결과 제외 |
| 첫 화면 | `eslint.config.js` | 공식 템플릿의 기본 정적 검사 설정 |
| 첫 화면 | `src/main.tsx`, `src/App.tsx` | React 시작, 라우트와 필요한 Provider 조립 |
| 첫 화면 | `src/styles.css` | 모바일 앱 프레임·공통 색상/간격·테마 |
| 첫 화면 | `public/intro-illustration.svg` | 로그인 인트로의 달력·지폐 일러스트 |
| 인증 | `.env.example`, `.env`, `src/vite-env.d.ts` | URL/공개 키의 이름과 로컬 값·타입 |
| 인증 | `src/lib/supabase.ts` | Supabase 클라이언트 1개 생성 |
| 인증 | `src/features/auth/IntroPage.tsx` | 승인된 로그인 인트로 |
| 인증 | `src/features/auth/pages/AuthIdPage/AuthIdPage.tsx` | 모드별 폼을 조립하는 아이디 인증 화면 |
| 인증 | `src/features/auth/pages/AuthIdPage/AuthIdLogin.tsx`, `AuthIdCreate.tsx` | 로그인·회원가입 UI 각각 렌더링 |
| 인증 | `src/features/auth/pages/AuthIdPage/useAuthIdPage.ts` | 화면 모드, 제출 상태, 가입·로그인 동작과 이동 |
| 인증 | `src/features/auth/pages/AuthIdPage/AuthIdPage.css`, `AuthIdPage.type.ts` | 화면 전용 스타일과 두 폼이 공유하는 타입 |
| 인증 | `src/features/auth/id-credentials.ts` | 아이디를 내부 이메일 주소로 변환 |
| 인증 | `src/features/auth/AuthCallbackPage.tsx` | 향후 OAuth 복귀와 오류 처리 |
| 인증 | `src/features/auth/NicknamePage.tsx` | 최초 선택 닉네임 |
| 인증 | `src/features/auth/AuthProvider.tsx` | 세션 복원·변경·로그아웃 상태 |
| 인증 | `src/features/auth/auth.api.ts` | 인증 요청·기존 프로필 확인/가입 준비 |
| 달력 | `src/components/AppLayout.tsx` | 중앙 한 열 앱·아이콘 탭바 |
| 달력 | `src/features/calendar/pages/CalendarPage/CalendarPage.tsx`, `useCalendarPage.ts`, `CalendarPage.css`, `CalendarHeader.tsx`, `CalendarMonth.tsx`, `CalendarDaily.tsx`, `useCalendarSwipe.ts` | 상단/월 달력/일별 목록 분리. Pointer Events 드래그 추적·거리/속도 판단·월 전환/복귀 애니메이션은 useCalendarSwipe에 집중, 타이머/프레임 해제. 둘러보기는 공용 UI만 재사용 |
| 달력 | `src/features/calendar/calendar.utils.ts` | 날짜 셀·일별/월별 집계 |
| 가계부 초기화·목록 | `src/features/ledgers/ledgers.api.ts` | 개인 가계부와 본인 연결 준비 RPC, 본인 목록 조회 RPC 호출 |
| 가계부 표시 | `src/features/ledgers/ledgers.utils.ts` | 개인 가계부 닉네임/기본 이름과 공유 가계부 이름 공통 규칙 |
| 달력 | `src/features/transactions/transactions.api.ts` | 월 조회·지출 저장/수정·소프트 삭제 |
| 원격 데이터 | `src/lib/queryClient.ts` | TanStack Query 클라이언트 기본 설정 |
| 지출 | `src/features/transactions/pages/ExpensePage/ExpensePage.tsx`, `useExpensePage.ts`, `ExpensePage.css` | 새 지출과 기존 지출 수정에 공용으로 쓰는 폼 UI·상태·화면 스타일 |
| 지출 시트 | `src/features/transactions/pages/ExpensePage/ExpenseSheet.tsx`, `useExpenseSheet.ts`, `ExpenseSheet.css` | 추가·수정 모두 기존 ExpenseForm과 시트 애니메이션 재사용. 수정 ID로 useExpenseRecord 조회, 로딩/오류는 시트 안에 표시. 80dvh/320ms/배경 스크롤 잠금. 저장·삭제 후 월 캐시 갱신 및 달력 유지 |
| 지출 | `src/features/transactions/expense-options.api.ts`, `expense.utils.ts` | 가계부별 초기 항목·선택 목록, 날짜/금액 입력 규칙 |
| 필터 | `src/features/calendar/components/CalendarFilterSheet/CalendarFilterSheet.tsx`, `useCalendarFilterSheet.ts`, `CalendarFilterSheet.css` | 가계부별 접기/선택 UI·임시 선택/조회 훅·시트 스타일 |
| 필터 | `src/features/calendar/filter.api.ts`, `filter.utils.ts` | 기존 가계부/분류/결제수단 읽기 API 조립, 선택 상태·URL 검증·OR/AND 조건 |
| 관리 | `src/features/settings/pages/SettingsPage/SettingsPage.tsx`, `SettingsPage.css` | 설정 메뉴와 카테고리 관리 이동 |
| 분류 | `src/features/categories/pages/CategoriesPage/CategoriesPage.tsx`, `useCategoriesPage.ts`, `CategoriesPage.css`, `src/features/categories/categories.api.ts`, `categories.utils.ts` | 가계부별 그룹·상하위 조회/추가/수정/활성화. 관리 아이콘 UI·선택 상태 제거, 신규 icon_key=null/수정 기존 값 보존 |
| 결제 | `src/features/payment-methods/pages/PaymentMethodsPage/PaymentMethodsPage.tsx`, `usePaymentMethodsPage.ts`, `PaymentMethodsPage.css`, `src/features/payment-methods/payment-methods.api.ts` | 카드/현금 목록·추가·이름/유형 수정·비활성화. 화면/훅/API 분리 |
| 그룹 | `src/features/groups/pages/GroupsPage/{GroupsPage.tsx,useGroupsPage.ts,GroupsPage.css}`, `pages/GroupDetailPage/{GroupDetailPage.tsx,useGroupDetailPage.ts,GroupDetailPage.css}`, `groups.api.ts` | 목록·상세·생성/참여·멤버 표시·이름 변경·코드 복사·나가기. 코드 재발급은 후속 |
| 내 정보 | `src/features/settings/pages/SettingsProfilePage/SettingsProfilePage.tsx`, `useSettingsProfilePage.ts`, `SettingsProfilePage.css`, `src/features/settings/profile.api.ts` | 닉네임·본인 로그인 정보·현재 기기 로그아웃 |
| 소셜 인증 | `src/features/auth/useIntroPage.ts`, `useAuthCallbackPage.ts`, `auth.api.ts` | 카카오 OAuth 시작→SDK 세션 복원→인증 서버 getUser 확인→기존 tb_user 재사용 또는 M 프로필 생성→달력 이동. 키는 Supabase Dashboard에만 보관 |
| 계정 삭제 | `src/features/settings/pages/SettingsProfilePage/SettingsAccountDelete.tsx`, `useSettingsAccountDelete.ts`, `src/features/settings/profile.api.ts`, `kakao-withdrawal.api.ts`, `src/features/auth/withdrawal-intent.ts`, `supabase/account-withdrawal.sql` | 전체 폼/훅/API 분리. 아이디 비밀번호 또는 카카오 재로그인 후 확인 입력. 카카오 전용 앱 연결 해제 후 기존 M 삭제 함수 호출. Apple 등 미지원 공급자 차단, 기존 yWeather 함수 보존 |
| 테마 | `src/features/settings/pages/SettingsThemePage/SettingsThemePage.tsx`, `SettingsThemePage.css` | 승인 B안 팔레트 목록과 즉시 선택 |
| 테마 | `src/features/theme/ThemeProvider.tsx`, `useTheme.ts`, `theme.const.ts`, `theme.css` | Context·기기 저장/복원·저장 실패 안내·CSS 변수. 인트로도 테마 적용, 소셜 브랜드 색은 유지 |
| 통계 | `src/features/statistics/StatisticsPage.tsx` | 준비 중 화면 |
| 둘러보기 | `src/features/preview/preview-data.ts`, `src/features/preview/pages/PreviewCalendarPage/PreviewCalendarPage.tsx`, `usePreviewCalendarPage.ts` | CalendarView와 AppLayout 탭 모양만 재사용. 고정 예시 합계와 공통 로그인 안내; URL/선택 상태/필터 시트/다른 화면 없음. 가계부 원격 요청 없음 |
| 재사용 발생 시 | `src/components/BottomSheet.tsx`, `ConfirmDialog.tsx` | 공통 시트·확인 팝업 |
| 타입 공유 시 | `src/types.ts` | 실제 사용하는 DB/화면 공통 타입 |
| 필요 승인 후 | `supabase/migrations/<timestamp>_<purpose>.sql` | 승인된 DB 변경만 기록 |
| MVP 검토 | `eslint.config.js`, `tests/<feature>.test.ts`, `tests/app.spec.ts` | 실제 선택한 최소 검증 도구·핵심 회귀. 미리 생성하지 않음 |
| 웹 배포 | `vercel.json` | SPA 직접 경로 새로고침 대응 |
| 앱 배포 | 추후 결정 | 포장 방식 선택 전 네이티브 파일·플러그인 생성 금지 |

축약한 API 파일 경로는 같은 행의 화면 파일과 동일한 폴더를 사용한다. 예: `categories.api.ts`는 `src/features/categories/categories.api.ts`이다. 화면이 과도하게 커지면 해당 기능 폴더 내부에서 시트/폼만 분리하고 이 지도를 갱신한다.

지출 목록 조회 모델은 `category_name`(전체 접근성 이름)과 `parent_category_name`/`child_category_name`(배치용 이름)을 따로 전달한다. 화면에서 구분 문자열을 다시 분해하지 않는다. 시트는 opening→open→closing 상태를 사용하며 두 requestAnimationFrame 뒤 열기 전환을 시작한다. CSS 전환과 닫기 지연은 320ms로 맞춘다.

월 지출 조회는 거래에 참조된 결제수단 ID와 접근 가능한 ledger_id로 결제수단 이름·유형을 함께 읽고 `payment_method_name`을 전달한다. 비활성 항목도 과거 기록에 표시한다. 상세 이름이 비었으면 CARD/CASH를 카드/현금으로 표시하며 참조 항목 자체가 없으면 임의로 유형을 추정하지 않고 `결제수단 없음`으로 표시한다. 기존 SELECT 권한을 사용하며 새 DB 객체는 필요하지 않다.

## 3. 라우트와 상태

### 카카오 탈퇴 설정과 경계

- 별도 서버/Edge Function/DB 객체를 추가하지 않는다. `kakao-withdrawal.api.ts`가 공식 JavaScript SDK 2.8.3을 필요할 때만 로드하며 고정 버전/SHA384 무결성 검사를 사용한다.
- `.env`와 Vercel에 `VITE_KAKAO_JAVASCRIPT_KEY`를 입력한다. Kakao Developers → 앱 → 플랫폼 키 → JavaScript 키에서 확인하는 공개용 키다. Admin/REST API 키/Client Secret은 넣지 않는다. 같은 키의 JavaScript SDK 도메인에 `http://localhost:5173`, `https://ymoney.vercel.app`를 등록한다. 환경값 변경 후 로컬 서버 재시작 및 배포 환경 재배포는 사용자가 한다. Supabase Redirect URL은 기존 `/auth/callback`을 그대로 사용한다.
- `withdrawal-intent.ts`는 OAuth 왕복용 원래 UUID·시작/확인 시각만 sessionStorage에 보관한다. 자체 권한 증명이 아니며 토큰/비밀번호/삭제 입력은 별도로 저장하지 않는다. 인증 서버 getUser, 기존 활성 M 프로필, 원래 UUID, 공급자 토큰을 확인한다. 탈퇴 콜백은 일반 가입 완료 로직을 호출하지 않는다.
- 본인 확인 후 `/app/settings/profile?withdrawal=ready`에서 삭제 확인 모달을 연다. 확인 입력/실제 삭제는 별도 사용자 액션이다. DB의 최근 세션 검사와 기존 공유 서비스 보호 제한을 유지한다.
- Kakao API의 `/v2/user/me` 회원번호를 getUser의 Kakao identity.id(서버 provider_id)에 대조하고 `/v1/user/unlink`를 호출한다. 토큰은 SDK 메모리에만 할당(`persist=false`)하고 호출 후 Auth.cleanup으로 비운다. 사용자 수정 가능한 user_metadata는 판정에 쓰지 않는다.
- 연결 해제 성공 후 DB 오류면 같은 모달에서는 연결 해제를 반복하지 않고 DB 삭제를 다시 시도할 수 있다. 응답 유실은 성공/실패로 단정하지 않는다. 모달 종료/재로그인으로 다시 시도할 수 있지만 두 외부 시스템 사이 원자성은 없으며 종합 오류 검증은 MVP 게이트에 남긴다.

| 경로 | 용도 |
|---|---|
| `/auth` | 인트로 |
| `/auth/id` | 아이디 로그인/가입. 기존 `/auth/email`은 이 경로로 이동 |
| `/auth/callback` | 향후 소셜 로그인 복귀 |
| `/auth/nickname` | 최초 닉네임 |
| `/app/calendar` | 로그인 후 기본 달력 |
| `/app/expenses/new`, `/app/expenses/:id/edit` | 지출 폼 |
| `/app/statistics`, `/app/settings` | 나머지 탭 |
| `/app/settings/profile`, `/app/settings/theme` | 내 정보·테마 |
| `/app/settings/categories`, `/app/settings/payment-methods` | 기준정보 |
| `/app/settings/groups`, `/app/settings/groups/:id` | 그룹 목록·상세 |
| `/preview/*` | 같은 UI의 읽기 전용 샘플 경로 |

- Supabase Auth 세션은 신원 확인 결과이고 서비스 로그인 상태는 활성 `tb_user` 프로필 조회까지 성공했을 때 성립한다. `user_uuid = auth.users.id`, `use_yn = 'Y'`를 확인한다. 세션만 있거나 프로필이 없으면 보호 화면에 접근시키지 않는다.
- 세션 복원 중에는 로딩을 표시한다. 비인증 사용자는 `/auth`, 프로필 준비가 필요한 사용자는 가입 흐름으로 이동한다. 보호 콘텐츠를 잠깐 노출하지 않는다.
- 아이디 로그인·회원가입은 모드별 완전한 폼 컴포넌트로 분리한다. 비밀번호 재설정은 제공하지 않는다.
- 세션/테마는 Context, 폼/시트는 가까운 컴포넌트 state, 원격 데이터는 Query 캐시, 적용된 필터는 URL로 소유권을 구분한다.
- 캐시 키는 사용자·가계부·월·필터를 구분한다. 로그아웃/계정 전환 시 이전 데이터 캐시를 비운다. TanStack Query는 서버에 있는 데이터를 React 화면 상태와 분리해 캐시하며, 월 이동 후 돌아왔을 때 재사용하고 요청 중복을 줄이는 용도다.
- 필터에는 개인정보나 토큰을 URL에 넣지 않는다. URL의 가계부 ID가 접근 권한을 부여하는 것은 아니다.
- 달력 상단 콤보박스는 제거하고 상세 필터에서 URL `scope=ALL|PERSONAL|GROUP`을 관리한다. `useCalendarPage`의 사용자·월·scope Query 키와 `get_monthly_transactions`의 ledger_id 범위 조회는 유지한다. 같은 expenses로 월/일 합계·날짜 금액·목록을 계산한다. 기본/잘못된 scope는 ALL이며 DB 객체/정책 변경은 없다.
- 상세 시트는 기존 본인 목록/카테고리 관리/결제수단 조회만 사용하고 초기 항목을 생성하지 않는다. 옵션 Query 키는 calendar/filter-options/사용자 UUID다. 비활성 항목도 과거 지출 검색용으로 표시한다.
- 적용 조건은 URL filters에 가계부 ID별 enabled/category_ids/payment_ids로 저장한다. null은 전체(새 항목 포함), []는 전체 해제다. 시트 내부 draft는 URL과 분리하고 적용 시 scope/filters/date를 함께 기록한다. 닫기는 적용하지 않으며 초기화는 draft 전체 범위/항목으로 복구한다.
- 월 조회에 payment_method_id를 포함하며, 캐시된 해당 범위의 전체 월 내역을 TypeScript에서 가계부별 카테고리 OR·결제수단 OR 사이 AND로 걸러낸다. 월/일 합계·날짜 금액·목록 모두 같은 결과를 사용하므로 별도 상세 필터별 원격 요청/캐시를 만들지 않는다. 선택일 원본에는 지출이 있지만 결과만 0이면 조건 없음 문구를 표시한다.
- 날짜/퀵 범위/상세 조건을 URL에서 복원하며, 지출 추가·수정으로 이동할 때도 scope/filters를 전달해 취소·저장·삭제 후 동일 조건으로 복귀한다. 임의 외부 return URL은 사용하지 않는다. DB·권한 변경은 없다.
- 월 조회 범위는 선택 월 1일 이상, 다음 월 1일 미만이다. 삭제되지 않은 EXPENSE만 집계하고 큰 결과는 페이지 단위로 끝까지 읽어 기본 API 행 제한에 의한 합계 누락을 막는다.
- 거래 발생 날짜/시각은 별도 date/time으로 유지한다. UTC ISO 변환으로 한국 날짜가 하루 밀리지 않게 한다. 감사시각은 timestamptz이다.
- bigint ID는 API 응답 형식을 확인하고 불필요한 숫자 변환을 피한다. 금액은 numeric(14,0) 범위의 양수 정수로 검증한다.

## 4. 기존 DB 데이터 사전

2026-09-25 조사 기록을 통합했으며 2026-09-26 원격 정리 전후에 테이블·컬럼 보존을 확인했다. 아래는 기존 테이블을 재사용하기 위한 사전이며 테이블을 재생성하는 지시가 아니다. 실제 기능을 연결할 때 필요한 권한은 별도로 검토한다.

공통: identity PK는 DB가 생성한다. 아래 `created_at`/`updated_at`은 timestamptz, 기본 now(). 수정 시각 갱신 주체는 실제 남아 있는 트리거 확인 후 API에서 처리한다.

| 테이블 | 컬럼과 관계 |
|---|---|
| `tb_user` (공유) | `user_srno text PK`, `user_uuid uuid UNIQUE → auth.users.id`, `user_id text UNIQUE NOT NULL`, `nickname text`, `avatar_url text`, `role text`, `use_yn char(1)`, `created_at`, `updated_at` |
| `tb_mon_ledger` | `ledger_id bigint identity PK`, `ledger_type text PERSONAL/GROUP`, `ledger_name varchar(50)`, `invite_code varchar(8) UNIQUE nullable`, `created_by_user_srno text → tb_user nullable`, `created_at`, `updated_at` |
| `tb_mon_ledger_member` | `(ledger_id bigint, user_srno text) 복합 PK/FK`, `joined_at timestamptz`. 역할 컬럼 없음 |
| `tb_mon_category_group` | `category_group_id bigint identity PK`, `ledger_id bigint FK`, `trans_type text`, `group_name varchar(30)`, `color_code char(7) nullable`, `sort_order integer default 0`, `is_active boolean default true`, `created_at`, `updated_at` |
| `tb_mon_category` | `category_id bigint identity PK`, `ledger_id bigint FK`, `category_group_id bigint nullable FK`, `parent_category_id bigint nullable self FK`, `trans_type text`, `category_name varchar(30)`, `icon_key varchar(30) nullable`, `sort_order integer`, `is_active boolean`, `created_at`, `updated_at` |
| `tb_mon_payment_method` | `payment_method_id bigint identity PK`, `ledger_id bigint FK`, `method_type text CARD/CASH`, `method_name varchar(30)`, `sort_order integer`, `is_active boolean`, `created_at`, `updated_at` |
| `tb_mon_transaction` | `transaction_id bigint identity PK`, `ledger_id bigint FK`, `trans_type text`, `category_id bigint FK`, `payment_method_id bigint FK`, `amount numeric(14,0)`, `memo varchar(200) nullable`, `trans_date date`, `trans_time time`, `created_by_user_srno text nullable FK`, `updated_by_user_srno text nullable FK`, `created_at`, `updated_at`, `deleted_at timestamptz nullable` |

- 기존 6개 업무 테이블 외에 새 테이블은 사용자 사전 검토가 필요하다. 동의 이력 테이블은 추가하지 않는다.
- trans_type은 EXPENSE/INCOME을 표현할 수 있으나 MVP는 EXPENSE만 쓴다.
- 상위 category: parent=null, group은 선택. 하위: parent=상위 ID, group=null, icon=null. 거래는 선택한 category_id 하나만 저장한다.
- ledger 삭제 시 하위 행 cascade, category_group 삭제 시 category의 group 참조 null, 거래가 참조한 분류/결제수단 삭제는 restrict인 조사 기록이 있다. 실제 삭제 기능 연결 전에 확인한다.
- 과거 추가한 개인 생성자 유일 인덱스와 월 조회/멤버/정렬 인덱스 5개, 유형/금액 CHECK 6개는 2026-09-26 제거했다. 기존 PK/FK/초대 코드 UNIQUE와 identity 시퀀스는 유지했다. 필요한 보장은 기능 단계에서 검토하며 과거 SQL을 일괄 재적용하지 않는다.
- M 채번에 브라우저 `MAX+1`을 사용하면 동시 가입 충돌이 생긴다. 기능 단계에서 최소 대안을 검토하며 기존 W용 함수는 바꾸지 않는다.
- 아이디는 소문자로 정규화해 Auth와 `tb_user.user_id`에 `아이디@ymoney.com`으로 저장한다. 도메인 소유권 미확인 상태이므로 개발용 임시값이다. 추후 변경 시 기존 두 저장소 값을 함께 이전해야 한다. 소셜 공급자의 이메일은 변환하지 않는다.
- `supabase/migrations/202609270001_check_registered_email.sql`은 이전 이메일 가입안의 미사용 초안이다. 원격 적용 여부가 확인되기 전에는 로컬 파일만 보고 DROP하지 않는다.
- `supabase/migrations/202609270002_mon_user_number.sql`은 승인된 M 전용 시퀀스와 짧은 SQL 함수다. 사용자가 SQL Editor에서 실행했다고 보고했으며 가입 성공으로 검증하기 전이다. 공유 W 채번은 변경하지 않는다.

## 5. 원격 DB 정리 — 2026-09-26 적용 완료

로컬 초기화와 별도로 사용자의 추가 요청에 따라 원격 DB를 정리했다. 과거 `202609250001_reconcile_money_schema.sql`, `202609250002_harden_category_and_transaction_guards.sql`의 가계부 전용 추가 객체를 제거했다. `202609250003_money_user_profile.sql`은 미적용 초안이었다. 기존 마이그레이션 이력은 감사 기록으로 유지하며 초기 구현에 다시 적용하지 않는다.

실제 존재 객체를 조회하고 정의를 백업한 뒤 한 트랜잭션으로 적용했다. 테이블 및 데이터 DELETE/TRUNCATE는 실행하지 않았다. 정리 전후 가계부 6개 테이블은 모두 0행으로 동일했다.

| 구분 | 확인·처리 결과 |
|---|---|
| 공개 RPC·내부 구현 | 기존 `fn_mon_ensure_user_profile/create_group/join_group/regenerate_invite_code/leave_group/get_group_members`와 mon_private 내부 함수는 작업 전 이미 없었음. 빈 `mon_private` 스키마 제거 |
| 정책 7개 | 가계부 테이블의 select/member/rename 정책 제거. `tb_user` 정책 3개는 유지 |
| 검증 트리거 4개 | `trg_mon_category_guard`, `trg_mon_transaction_guard`, `trg_mon_group_ledger_guard`, `trg_mon_payment_ledger_guard` 제거 |
| 함수 4개 | `fn_mon_guard_category()`, `fn_mon_guard_transaction()`, `fn_mon_guard_ledger_identity()`, `fn_is_ledger_member(bigint)` 제거. 마지막 함수는 가계부 정책에서만 참조됨을 확인 |
| RLS | 가계부 6개 테이블만 비활성화. 공유 `tb_user`의 RLS는 유지 |
| 제약·인덱스 | 추가 CHECK 6개와 추가 인덱스 5개 제거. 기존 테이블 구조/PK/FK/UNIQUE/identity는 보존 |
| API 권한 | 가계부 테이블/컬럼/연결 시퀀스의 PUBLIC·anon·authenticated 권한 회수. postgres·service_role 관리 권한은 유지 |

보존 확인: 모든 public 테이블의 컬럼, 기존 PK/FK/UNIQUE, yWeather 테이블의 RLS/권한/정책, 공용 `fn_withdraw_account`, `fn_next_user_srno`, `fn_next_device_srno`, `fn_next_push_srno` 정의·권한. `auth.users`는 변경하지 않았다. `fn_current_user_srno`는 작업 전 이미 없었으며 재생성하지 않았다.

가계부 함수에 대한 다른 함수·뷰의 참조가 없음을 조회했고 CASCADE 없이 정확한 대상만 삭제했다. 전후 스냅샷·적용 SQL·수동 복구 SQL은 프로젝트 밖 `C:/Users/kkdy0726/Documents/Doyeob/study/react/codex/ymoney-backup-20260926-guide-reset/db-reset-20260926`에 보관한다. 복구 파일은 이번 작업 직전 상태만 복원하며 사용자가 그 전에 삭제한 함수까지 복원하지 않는다.

2026-09-26 초기화 직후에는 클라이언트의 가계부 접근이 차단되어 있었다. 2026-09-27 이후 권한 상태는 아래 전용 스키마 적용 내역을 기준으로 한다. 무제한 클라이언트 권한은 열지 않는다.

## 6. 가계부 전용 스키마 — 2026-09-27 적용

- `tb_mon_ledger`, `tb_mon_ledger_member`, `tb_mon_category_group`, `tb_mon_category`, `tb_mon_payment_method`, `tb_mon_transaction` 6개 테이블은 `public`에서 `ymoney`로 이동했다. 데이터는 이동 전 모두 0행이었다.
- 인증 사용자만 `ymoney` 스키마 USAGE를 갖고, anon은 스키마 접근이 없다. 기존 승인된 네 테이블의 SELECT grants/RLS 정책은 유지했다. `tb_mon_category_group`과 `tb_mon_payment_method`는 RLS를 켰지만 SELECT 권한/정책은 아직 없어 접근할 수 없다.
- 가계부 테이블 간 FK는 `ymoney`를 참조하고 공유 사용자 FK는 `public.tb_user`를 계속 참조한다. 새 테이블·함수·트리거·쓰기 권한은 추가하지 않았다.
- **필수 대시보드 설정:** Supabase Dashboard → Project Settings → API → Exposed schemas에 `ymoney`를 추가하고 저장해야 PostgREST/Data API가 이 스키마를 받을 수 있다. 이 설정 전에는 프론트에서 `supabase.schema('ymoney')` 요청이 동작하지 않는다. `public`은 현재 설정대로 둔다.
- Data API에서 사용할 각 테이블은 계속 최소 grants와 RLS 정책이 모두 필요하다. API 노출 설정만으로 테이블 권한을 주지 않는다. 새 테이블에 대한 default privileges는 설정하지 않았다.

### 기본 가계부 첫 준비 — 2026-09-27 적용

- 사용자당 기본 `PERSONAL` 가계부 하나를 로그인 후 달력 초기 로딩에서 확인/생성하고, 같은 사용자를 멤버로 연결한다. 그룹도 같은 ledger/member 테이블을 사용하며, 그룹 생성·참여 권한은 별도 단계에서 다룬다.
- migration `personal_default_ledger_access` 적용: ledger/member의 `authenticated INSERT`, 본인이 만든 기본 가계부만 조회·생성하는 정책, 본인을 그 가계부에만 연결하는 정책, PERSONAL ledger의 사용자별 중복 방지 부분 unique index.
- 기존 SELECT 권한과 RLS는 유지한다. ledger/member 모두 RLS 활성. INSERT 이외 UPDATE/DELETE는 부여하지 않았다. 새 테이블·함수·트리거는 없다.
- 적용 후 두 테이블 모두 0행임을 재확인했다. 실제 첫 로그인 계정 생성은 브라우저에서 확인 대기. Supabase CLI telemetry 권한 문제로 원격 migration 기록과 대응하는 로컬 SQL mirror는 아직 없다.

### 개인 가계부 생성·목록 함수 — 2026-09-27 적용

- 첫 브라우저 확인에서 `tb_mon_ledger`에 M0001의 PERSONAL 행 1개만 생기고, `tb_mon_ledger_member` INSERT는 정책의 상호 참조로 `42P17` 재귀 오류가 났다.
- `personal_ledger_functions` migration으로 `ymoney.fn_mon_ensure_personal_ledger()`와 `ymoney.fn_mon_list_my_ledgers(p_user_srno text)`를 적용했다. 대응 SQL은 `supabase/migrations/202609270003_personal_ledger_functions.sql`에 둔다.
- 생성 함수는 세션 UUID로 활성 M 계정을 확인하고, 본인 PERSONAL ledger와 멤버십을 중복 없이 준비한 뒤 `ledger_id`를 반환한다. 두 INSERT는 하나의 함수 호출로 실행된다. 멤버 INSERT의 순환 RLS를 피하기 위해 이 함수에만 `SECURITY DEFINER`를 사용하며 `search_path`를 비우고 파라미터는 받지 않는다.
- 목록 함수는 호출자 권한으로 실행한다. 전달한 `user_srno`가 세션 UUID의 활성 회원번호와 같을 때만 개인·그룹 멤버십에 연결된 ledger 목록을 반환한다. 두 함수는 `authenticated`만 실행할 수 있고 `anon`은 실행할 수 없다.
- 달력은 생성 성공 후 목록 함수의 `ledger_id`로 월 지출을 한정한다. 기존 멤버 직접 INSERT 정책은 DB에 남아 있으나 앱에서는 사용하지 않는다. 그룹 생성·참여의 쓰기 경로는 그룹 화면 단계에서 별도 결정한다.

### 지출 추가 최소 접근 — 2026-10-04 적용

- `expense_entry_access` migration으로 기존 `ymoney` 카테고리 그룹·카테고리·결제수단·거래 테이블에 `authenticated`의 필요한 SELECT/INSERT만 열었다. 기존 SELECT 정책은 유지하고 해당 가계부의 활성 멤버만 읽고 추가하도록 RLS 정책을 붙였다. UPDATE/DELETE, anon 권한, 새 테이블·함수·트리거는 추가하지 않았다. SQL mirror는 `supabase/migrations/202610040001_expense_entry_access.sql`이다. Supabase CLI는 사용자 프로필의 telemetry 쓰기 권한 오류로 migration 파일 생성 명령이 실패해 파일명을 수동 지정했다.
- 개인 가계부 준비 RPC 직후와 그룹 생성 성공 직후 `ensure_default_expense_options`를 호출한다. 카테고리가 완전히 비었을 때 그룹 미지정 6개(식비·카페·교통·문화·의료·기타), 결제수단이 완전히 비었을 때 현금을 기존 CRUD로 준비한다. 지출 옵션 조회도 빈 가계부 복구를 위해 같은 함수를 사용한다. 같은 클라이언트의 동시 요청은 Map의 Promise를 공유하며, 그룹 생성 뒤 기본값 준비 실패 재시도는 생성된 ledger_id를 재사용한다. 여러 요청의 원자성·다른 기기의 동시 초기화·일부 생성 후 복구는 MVP 게이트에 남긴다. 기존 항목/그룹을 덮어쓰지 않는다.
- 지출 INSERT 정책은 작성자 본인 번호, 가계부 멤버십, 같은 가계부의 활성 카테고리·결제수단, 양수 금액을 확인한다. 초기값에는 상위 카테고리만 생성한다.

### 하위 카테고리 추가 — 2026-10-05 적용

- 최초 `category_child_insert_access` 정책의 자기 테이블 부모 조회가 `42P17` 재귀 오류를 일으켰다. 사용자 승인 후 `category_child_insert_recursion_fix` migration으로 해당 조회를 제거했다. 현재 적용 SQL은 `supabase/category-child-access.sql`이다. 새 객체/권한은 추가하지 않았다.
- `create_child_category`가 저장 직전 별도 SELECT로 같은 가계부의 활성 EXPENSE 상위(parent=NULL)인지 확인한다. RLS는 기존 가계부 멤버 제한과 하위의 그룹/아이콘 NULL 조건을 유지하며, 부모 존재는 기존 외래키가 확인한다.
- 부모의 가계부·활성·최대 2단계 조건은 소스 검사이므로 직접 API 요청이나 조회/저장 사이 변경까지 DB에서 보장하지 않는다. MVP 최종 보안·일관성 점검에서 보완 여부를 검토한다.
- 달력 월 조회는 하위에 지출이 있으면 필요한 부모도 조회해 `식비 · 외식`과 상위 아이콘으로 표시한다.
- 카테고리 수정은 `open_edit_sheet`→`save_category`→`update_category`로 연결한다. category_id/ledger_id/parent_category_id는 갱신하지 않고 이름, 상위 아이콘/그룹, updated_at만 수정한다. 자기 행을 제외해 중복 이름을 검사하며 0건 UPDATE도 실패로 처리한다. 성공 후 관리·지출 선택·월간 거래 캐시를 무효화한다. 최소 권한 검토 SQL은 `supabase/category-edit-access.sql`이며 원격 적용 여부는 Tasks에 기록한다.

### 카테고리 그룹 이름 수정 — 2026-10-05 적용

- `open_edit_group_sheet`→`save_group`→`update_category_group`가 그룹 ID/소속을 유지하며 이름과 수정시각만 갱신한다. 관리 목록과 지출 옵션 캐시를 갱신한다.
- `category_group_edit_access` migration은 group_name/updated_at 열 UPDATE와 가계부 멤버 범위 정책 한 개만 추가한다. SQL은 `supabase/category-group-edit-access.sql`이며 새 테이블·함수·트리거 및 공유 객체 변경은 없다.

### 카테고리 비활성화 — 2026-10-05 적용

- `disable_category` 확인 후 `deactivate_category`가 is_active=false/updated_at을 갱신한다. 상위는 본인 ID 또는 parent_category_id가 본인 ID인 행을 같은 ledger에서 한 UPDATE로 처리하고, 하위는 본인만 처리한다. 관리/지출 선택/달력 캐시를 갱신한다.
- `category_deactivate_access`는 is_active 열 UPDATE만 추가하고 기존 UPDATE 정책 WITH CHECK의 활성 강제 조건을 제거했다. 후속 `managed_item_reactivate_access`로 USING의 활성 조건도 제거해 비활성 행 수정/복구를 지원하며 멤버 조건과 기존 열 권한은 유지한다. 실제 DELETE 권한은 없다. SQL은 `supabase/category-deactivate-access.sql`과 `supabase/managed-item-reactivate-access.sql`이다.
- 새 지출 옵션은 is_active=true로 조회하고, 월간 지출의 분류 조회에는 활성 조건이 없어 과거 기록의 이름·부모 표시를 유지한다. 상위 비활성화와 동시 하위 추가의 경쟁 조건은 MVP 최종 일관성 점검에서 확인한다.

### 결제수단 관리 — 2026-10-05 적용

- `/app/settings/payment-methods`를 설정 메뉴에 연결한다. 기존 목업의 카드/현금 고정 영역, 가계부 선택 상자, 독립 +와 입력 시트를 사용한다. 조회는 비활성 항목도 포함한다.
- `usePaymentMethodsPage`가 사용자/가계부별 Query, 명시적인 data_state/sheet_state, 입력 검사와 저장 이벤트를 담당한다. 같은 가계부/유형의 활성 이름 중복을 검사하고, 자기 항목을 제외한다. 유형 이동은 과거 거래/필터 영향 안내를 확인한 뒤 처리한다.
- `payment-methods.api.ts`에서 직접 SELECT/INSERT/UPDATE한다. 기존 ID와 ledger를 유지하며 비활성화는 is_active=false로 저장한다. 0건 UPDATE는 성공으로 처리하지 않는다. 관리/지출 선택/월간 캐시를 무효화한다.
- `payment_method_edit_access` migration은 method_name/method_type/is_active/updated_at 네 열과 멤버 범위 UPDATE 정책 하나만 추가한다. 기존 SELECT/INSERT, RLS 및 익명 접근 제한은 유지한다. SQL은 `supabase/payment-method-edit-access.sql`. 후속 `managed_item_reactivate_access`로 USING의 활성 조건만 제거해 비활성 행 수정/복구도 지원한다. 새 객체/공유 프로젝트 변경 없음. 수동 순서 변경은 후속이다.
- 양쪽 활성화는 현재 폼 표시값과 is_active=true를 한 UPDATE로 저장하며 조회 당시 활성 상태를 WHERE에 넣는다. 카테고리 하위 복구의 활성 부모 검사는 소스의 별도 SELECT로 수행하므로 직접 API 우회/조회-저장 간 경쟁은 MVP 최종 점검 대상이다. 상위 활성화 시 하위를 자동 복구하지 않는다.

### 지출 수정 최소 접근 — 2026-10-04 적용

- 달력의 지출 행을 누르면 `/app/expenses/:transaction_id/edit`에서 같은 입력 폼에 원래 값을 채운다. 거래의 `ledger_id`는 고정하며 저장 후 월간 캐시를 무효화하고 수정된 날짜의 달력으로 돌아간다.
- `expense_edit_access` migration은 거래 테이블의 금액·분류·결제수단·날짜·시간·메모·수정자·수정시각 열에만 `authenticated` UPDATE를 허용한다. 작성자·소속 가계부·유형·삭제 상태는 이 경로에서 바꿀 수 없다. RLS는 현재 가계부 멤버의 수정만 허용하며 두 멤버 모두 수정 가능하다. 새 테이블·함수·트리거는 없다. SQL mirror는 `supabase/migrations/202610040002_expense_edit_access.sql`이다.
- 비활성화된 과거 카테고리/결제수단도 기존 거래의 수정 대상일 수 있으므로 UPDATE 정책은 같은 가계부 소속만 확인한다. 새로 선택할 수 있는 목록은 화면에서 활성 항목으로 제한한다. 실제 수정 저장과 달력 반영은 사용자가 확인했다.

### 지출 소프트 삭제 최소 접근 — 2026-10-04 적용

- `expense_soft_delete_access` migration으로 `authenticated`에 거래의 `deleted_at` 열 UPDATE만 추가하고, 기존 멤버 범위 UPDATE 정책의 `WITH CHECK`에서 삭제 시각 NULL 강제 조건만 제거했다. `USING`의 활성 지출·가계부 멤버 확인과 나머지 조건은 유지한다. 두 멤버 모두 소프트 삭제할 수 있으며 실제 DELETE 권한은 열지 않았다.
- 수정 화면에서 확인 후 `deleted_at`, `updated_at`, `updated_by_user_srno`만 갱신한다. 거래 조회는 이미 `deleted_at IS NULL`로 한정하고, 성공 후 월간 캐시를 무효화해 달력 합계·목록을 갱신한다. SQL mirror는 `supabase/migrations/202610040003_expense_soft_delete_access.sql`이다.

### 그룹 목록·상세·이름 변경 — 2026-10-05 적용

- `/app/settings/groups`는 기존 `list_my_ledgers` 결과 중 GROUP만 표시한다. 상세 `/app/settings/groups/:group_id`는 기존 ledger SELECT 정책으로 소속 그룹의 실제 이름과 초대 코드를 읽는다.
- UI/hook/API를 분리하며 이름 변경 후 그룹·달력·카테고리·결제수단·지출 선택 캐시를 갱신한다. 캐시 무효화는 각 화면이 오래된 이름 대신 다시 조회한 값을 표시하게 한다.
- `supabase/group-rename-access.sql` / migration `group_rename_access`: ledger_name/updated_at만 UPDATE하고 그룹 멤버 범위 정책을 적용한다. ID/멤버 연결은 유지하며 새 테이블·함수·트리거 및 공용 객체는 추가/변경하지 않는다.
- 멤버 테이블의 직접 SELECT 정책은 본인 행만 허용한 채 유지한다. 사용자 승인 후 아래 함수로 같은 그룹의 표시 정보와 생성/참여/나가기를 연결했다. 가짜 멤버 수/코드는 표시하지 않는다.

### 그룹 생성·참여·멤버 조회·나가기 — 2026-10-05 승인 및 적용

- SQL: `supabase/group-management-functions.sql`, migration `group_management_functions`. 새 테이블/트리거, 공용 정책 변경 없이 ymoney 함수 4개만 추가했다.
- `fn_mon_create_group(p_group_name)`: 세션 UUID의 활성 M 프로필을 확인하고 GROUP 가계부와 첫 멤버를 같은 트랜잭션에 INSERT한다. 그룹명 1~30자, 랜덤 8자리 영문/숫자 코드와 기존 UNIQUE로 코드 충돌을 처리한다. 기본 분류/결제수단은 기존 지출 첫 진입 로직이 준비한다.
- `fn_mon_join_group(p_invite_code)`: 대소문자 구분 없이 코드를 찾고 ledger 행을 잠근 뒤 중복 참여/최대 2명 검사와 멤버 INSERT를 수행한다. 나가기와 같은 ledger 행 잠금을 사용한다. 참여 실패는 팝업, 생성/참여 성공은 상세로 이동한다.
- `fn_mon_group_members(p_ledger_id)`: 호출자가 해당 그룹의 활성 M 멤버일 때만 저장 닉네임·마스킹 계정·본인 여부를 반환한다. 원문 이메일/UUID/회원번호는 응답에 포함하지 않는다. 공용 tb_user/auth.users는 읽기만 하며 직접 SELECT 범위를 넓히지 않는다.
- `fn_mon_leave_group(p_ledger_id)`: GROUP/본인 멤버 확인 후 본인만 제거한다. 남은 멤버가 없으면 해당 그룹의 거래→카테고리→분류 그룹→결제수단→가계부 순으로 영구 삭제한다. 기존 RESTRICT FK를 고려한 순서이며 PERSONAL/다른 그룹/공용 사용자 데이터는 삭제하지 않는다. 앱은 항상 삭제 가능성을 안내하고 확인 후 호출한다.
- 4개 함수는 제한된 SECURITY DEFINER API이며 search_path를 비우고 세션 기반 검사를 내부에 둔다. PUBLIC/anon 실행 권한은 회수하고 authenticated만 실행 가능하다. 테이블의 일반 DELETE 권한이나 RLS 해제를 추가하지 않는다.
- 생성/참여/나가기 후 관련 목록 캐시를 무효화하며, 나가기 후 해당 그룹 상세·분류·결제수단·지출·달력 캐시를 제거한다. 캐시는 재조회 편의 기능이고 접근 제한은 DB가 담당한다.
- 코드 재발급은 아직 미연결이다. 동시 참여/마지막 멤버 삭제/응답 유실 후 생성 재시도의 종합 검증은 MVP 게이트에서 확인한다.

## 7. 연결값·보안·출시

- 나중에 만드는 `.env`의 키 이름: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. 사용자가 직접 값을 입력한다. 이전 `.env`는 프로젝트 밖 백업에만 보존한다.
- publishable key는 브라우저 공개용이다. 기존 anon 키는 같은 용도의 구형 키이며 인증을 위해 둘 다 추가할 필요는 없다. secret/service-role 키는 브라우저에 넣지 않는다.
- 로그인 세션의 JWT가 사용자 신원을 전달한다. 공개 키만으로 다른 사람의 데이터를 읽어도 된다는 뜻이 아니다.
- 공유 프로젝트 RLS는 변경하지 않는다. 가계부는 사용자 승인으로 RLS/정책을 정리하고 클라이언트 권한을 회수한 상태다. 기능 연결 시 필요한 최소 권한과 데이터 격리를 검토받는다.
- 사용자 요청대로 RLS/보안 종합 설계와 테스트는 MVP 완성 및 앱 출시 직전에 모은다. 다만 잘못된 삭제·비밀 노출을 막는 기본 조치는 개발 중에도 적용한다.
- Naver/Apple 공급자 지원과 redirect URL은 인증 단계에 확인한다. Naver가 현재 프로젝트에서 곧바로 지원된다고 가정하지 않으며 별도 서버가 필요해지면 범위 확대 전 검토받는다.
- 앱 포장 방식, 딥링크, 키보드/safe-area, Apple 자격/토큰 해제, 심사/개인정보 고지는 최종 앱 단계에서 확인한다. 그 전에 웹으로 핵심 동작을 완성한다.

### Vercel 배포 준비와 사용자 작업

현재는 로컬 설정 준비 단계다. 실제 업로드·외부 프로젝트 생성·공개 배포는 별도 진행한다. [Tasks.md](Tasks.md)의 MVP 보안/권한 점검 전에는 외부 실사용 공개를 하지 않으며, 시험 배포는 접근을 제한하고 테스트 계정만 사용한다.

1. 배포 방법을 정한다. GitHub 연결 방식은 먼저 사용자가 이 프로젝트의 저장소를 준비한 뒤 Vercel에서 Import한다. Git 없이 직접 올리려면 사용자가 Vercel CLI 방식을 선택한다. 현재 폴더의 Git 초기화/원격 연결/CLI 설치는 에이전트가 임의로 하지 않는다.
2. 프로젝트 루트는 package.json/vercel.json이 있는 폴더다. Framework Preset은 Vite, Build Command는 npm run build, Output Directory는 dist다. npm 잠금 파일을 함께 사용한다.
3. Vercel 프로젝트 Settings → Environment Variables에서 VITE_SUPABASE_URL과 VITE_SUPABASE_PUBLISHABLE_KEY를 직접 입력한다. 테스트용 Preview 환경에 우선 설정하고 실제 공개 시 Production에도 설정한다. 로컬 .env는 업로드하지 않으며 secret/service_role/카카오 Client Secret은 넣지 않는다. VITE_ 값은 브라우저 번들에 포함되므로 공개용 값만 사용한다.
4. 환경변수 변경 후 새 배포/재배포로 빌드에 반영한다. 생성된 HTTPS 주소를 확인하고 시험 배포의 접근 보호 설정을 확인한다. HTTPS 주소만 있다고 비공개 테스트가 보장되는 것은 아니다.
5. 테스트 주소가 확정되면 Supabase Authentication → URL Configuration → Redirect URLs에 정확한 `https://<테스트도메인>/auth/callback`을 추가한다. 기존 yWeather Site URL/Redirect URLs는 유지한다. 배포마다 바뀌는 주소를 포괄적으로 허용하기보다 실제 테스트할 주소만 등록한다. 카카오 Developers의 공급자 Callback URL은 기존 Supabase Auth Callback이며 앱 주소로 바꾸지 않는다.
6. `/preview/calendar`, `/auth/id`, `/app/calendar`, `/auth/callback` 직접 접근/새로고침과 실제 JS/CSS/SVG 로드를 확인한다. 미로그인 /app은 인트로로 이동해야 한다. 카카오 동의→앱 복귀→tb_user 연결→달력은 모바일 HTTPS 환경에서 검증한다. 인증 코드/토큰이 포함된 URL을 채팅에 붙여넣지 않는다.

React Router의 BrowserRouter는 주소별 실제 HTML 파일을 만들지 않는다. vercel.json의 rewrite는 서버가 /app/calendar 같은 요청에도 index.html을 전달하게 하며, 이후 React Router가 해당 화면을 선택한다. 로컬 빌드 성공은 Vercel 라우팅·OAuth 성공을 의미하지 않는다.

공식 참고: [Vite SPA 배포](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas), [배포 환경](https://vercel.com/docs/deployments/environments), [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
