# 가계부 톡톡 · 전체 진행 순서

**목표:** [PRD.md](PRD.md)의 서비스를 웹으로 완성하고 앱으로 배포한다. 2026-09-26에 기존 로컬 구현을 정리하고 문서 기반으로 다시 시작한다.

**구조:** [Architecture.md](Architecture.md)의 React/Vite + 기존 Supabase 직접 CRUD. [Design.md](Design.md)의 승인 화면을 사용한다. 작업자는 루트의 [AGENTS.md](../AGENTS.md)와 [agent-dev.md](agent-dev.md)를 읽고 이 파일의 가장 위 미완료 항목부터 직접 진행한다. 이 문서는 전체 로드맵이며 별도 단계 계획 문서를 계속 늘리지 않는다.

## 진행 방식

- ✅ 완료 / ⬜ 미완료 / ⏸ 사용자 검토 필요. 완료 항목은 지우지 않고 체크로 남긴다.
- **해당 화면 → 실제 기능 연결 → 앞뒤 화면 이동 → 짧은 동작 확인 → 다음 화면** 순서로 한다. 모든 화면 또는 DB 기능을 먼저 일괄 작성하지 않는다.
- 필요한 DB 컬럼·권한만 기능 시점에 확인한다. 원격 삭제나 신규 DB 객체는 별도 기록/검토하며 로컬 완료와 구분한다.
- 개발 중 대규모 자동 테스트·반복 전체 검증은 하지 않는다. RLS/보안/테스트 종합 작업은 12·14단계로 모은다.
- 아래 파일은 생성 예정이다. 단계의 API는 UI에서 호출할 기능 경계를 나타내며 RPC를 만들라는 뜻이 아니다. 파일 전체 지도는 Architecture에만 관리한다.

## 0. 재시작 기준

- ✅ 기존 기획을 PRD / Architecture / Design / Tasks / agent-dev와 design-mockup으로 통합하는 방향 확정.
- ✅ 기획·승인 화면은 유지하고 기존 소스 완료 상태는 초기화.
- ✅ 문서 통합·목업 링크 확인 및 기존 로컬 파일의 복구 가능한 정리 완료. 루트 5개 MD + design-mockup만 보존.
- ✅ 원격 가계부 초기화: 정책 7·트리거 4·함수 4·추가 CHECK 6·인덱스 5·빈 mon_private 제거, 가계부 6개 RLS 해제와 클라이언트 권한 회수. 테이블/컬럼/행 수/기존 키와 yWeather 공용 객체 보존 확인. 상세는 Architecture 5절.



## 1. Vite 공식 템플릿으로 실행 환경 재생성

- ✅ 사용자가 `npm create vite@latest . -- --template react-ts` 방식으로 프로젝트 루트에 공식 React + TypeScript 템플릿을 생성했다.
- ✅ React Router와 `/auth` 라우트를 구성하고 사용자가 인트로 화면을 확인했다.
- ✅ 승인된 인트로 목업을 실제 화면으로 옮겼다. 네이버·Apple 로그인과 둘러보기는 후속 단계 연결 전까지 준비 안내만 표시한다.
- ✅ 모바일 화면을 사용자가 확인했다. 실제 인증은 2단계에서 연결한다.

완료 결과: 공식 Vite 템플릿에서 로그인 인트로를 브라우저로 볼 수 있다.

## 2. 아이디 가입·로그인 기능

- ✅ `/auth/id` 아이디 가입·로그인 폼과 인트로 이동 연결. 로그인/가입 UI는 각각 별도 화면 컴포넌트이며 상태·제출 동작은 화면 전용 훅으로 분리했다. 옛 `/auth/email`은 새 경로로 리다이렉트한다.
- ✅ 아이디 4~20자(영문 소문자·숫자·밑줄)를 `아이디@ymoney.com`으로 변환. 소셜 계정의 실제 이메일은 변환하지 않는다. 이 도메인은 소유권 확인 전 개발용 임시값이다.
- ✅ Confirm Email 비활성화 전제의 `signUp` → M 번호 발급 → `tb_user` 본인 행 저장 → 로그아웃 → 가입 완료/로그인 폼 전환을 연결. 사용자가 실제 `tb_user` INSERT 성공을 확인했다. Auth-only 계정은 비밀번호 로그인 후 프로필 복구를 시도한다.
- ✅ 이전 이메일 확인/재설정 폼과 중복 확인 RPC 호출을 앱 경로에서 제거했다. 아이디 비밀번호 찾기는 제공하지 않고 가입 화면에 안내한다.
- ✅ 사용자가 M 전용 시퀀스 SQL 실행 후 신규 계정의 `tb_user` INSERT 성공을 확인했다. 원격 객체 권한은 별도 조회하지 않았다. `tb_user` 기존 본인 INSERT 정책을 사용한다.
- ⬜ 로그인 후 달력으로 이동하는 실제 계정 흐름, Auth-only 복구, 중복 아이디를 짧게 확인한다. 기존 이메일 중복 확인 SQL의 원격 적용 여부도 확인한 뒤 필요 시 제거를 별도 검토한다.
- ⬜ 세션 복원 때 프로필 확인과 달력 이동은 바로 다음 단계에서 구현한다. 개인 가계부·기본 항목도 달력 기능에 필요할 때 생성한다.

완료 결과: M 번호 SQL 적용과 실제 인증 검증 후 서비스 로그인 세션을 얻는다. 달력 이동은 3단계다.

## 3. 달력 화면 + 로그인 이동 + 실제 목록 조회

- ✅ `AppLayout.tsx`, `CalendarPage.tsx`, `calendar.utils.ts`로 승인된 월 달력·선택일 영역/탭바의 화면 뼈대를 구현. 예시 지출은 하드코딩하지 않고 실제 내역 조회 전 상태를 구분한다.
- ✅ 로그인 성공 후 `/app/calendar`로 이동하고, 앱 진입/세션 복원 시 활성 `tb_user` 행을 확인한다. 통계·설정 탭은 다음 단계 전까지 안내 화면.
- ✅ `transactions.api.ts`에서 본인 가계부 목록 함수가 반환한 `ledger_id`로 월간 지출을 조회한다. RLS가 본인 멤버십/접근 가능한 거래를 제한하고 대량 월 결과는 페이지 단위로 읽는다.
- ✅ TanStack Query 사용자·월별 캐시, 월/일 합계 계산, 날짜 선택, 월 이동 연결. 로그아웃/계정 전환 시 원격 캐시 삭제.
- ✅ 개인/공유 가계부 멤버십 기반 읽기 모델 승인 및 `ymoney` 스키마의 최소 `SELECT` 권한/RLS 적용: `tb_mon_ledger_member`, `tb_mon_ledger`, `tb_mon_transaction`, `tb_mon_category`. 본인 멤버십·멤버 ledger/transaction/category만 읽도록 제한. `anon`은 스키마 접근 불가, `authenticated`만 승인된 4개 테이블 SELECT 가능. 그룹/결제수단 테이블은 현재 접근 불가.
- ✅ 첫 달력 데이터 로딩에서 생성 RPC로 기본 개인 가계부와 본인 멤버십을 멱등하게 준비하고, 별도 목록 RPC로 본인 가계부를 조회하도록 연결. 원격 `personal_ledger_functions` migration과 로컬 SQL 파일을 반영했다. 기존 INSERT 정책의 재귀는 생성 함수 내부에서 우회한다.
- ✅ 로그인된 브라우저에서 기본 가계부와 멤버십 생성 후 달력의 `0원`·`무지출에 성공하셨어요!` 표시를 확인했다. 새로고침 후에도 정상 표시되고 DB 행 수는 ledger 1/member 1로 유지됐다.
- ✅ 조회 로딩/오류/가계부 없음/거래 0건을 구분하고, 거래가 없는 선택일은 `무지출에 성공하셨어요!`를 표시.
- ✅ 사용자가 로그인 후 달력 화면에서 `아직 연결된 가계부가 없어요` 안내를 확인했다. `ymoney` Data API 조회가 오류 없이 완료되어 현재 계정에 연결된 가계부가 없음을 확인한 상태다.

완료 결과: 로그인 후 달력에서 실제 지출 또는 무지출 상태를 본다.

## 4. 지출 추가 → 달력 반영 → 수정·삭제

- ✅ 승인 목업 기준 `ExpensePage.tsx` 단일 폼과 달력 `+` 이동, 가계부/카테고리/결제수단 조회, 날짜·시간/기기 숫자 입력, 하위 선택 생략을 코드와 브라우저에서 확인했다. 첫 폼 진입 시 PRD 기본 항목(생활비·고정비·특별비, 식비·카페·주거·취미, 현금)이 준비되는 것도 확인했다.
- ✅ 사용자가 실제 지출 저장 후 달력 화면에 입력한 내용이 정상 표시됨을 확인했다. `create_expense` INSERT→월간 캐시 무효화→달력 복귀 흐름의 정상 경로를 확인했다.
- ✅ 가계부 전환 시 카테고리·결제수단 선택 해제와 저장 중 재제출 차단을 입력 폼에 구현했다. 실제 그룹 가계부 전환은 7단계에서 확인한다.
- ↪️ 개인별 사용 빈도·최근 사용에 따른 카테고리/결제수단 표시 순서는 기능 개발 완료 후 사용성 개선으로 연기한다. 입력·저장 기능의 선행 조건이 아니다.
- ✅ 달력 목록 클릭→기존 폼에서 수정: 기존 값 표시와 최소 UPDATE 권한/RLS를 적용했고, 사용자가 실제 변경 저장→달력 반영을 확인했다.
- ⏸ 달력 날짜 아래 일별 합계(0원 숨김)를 구현했다. 삭제 확인→소프트 삭제→달력 반영 코드와 최소 DB 권한을 적용했다. 테스트 지출의 실제 삭제와 화면 표시 확인은 사용자 확인 대기.
- ⬜ 테스트 지출 1건 추가→수정→삭제로 금액/목록 반영을 확인. 필요한 DB 변경만 이 시점에 검토.

## 5. 카테고리 관리 화면·기능

- ✅ `SettingsPage.tsx`에서 `CategoriesPage.tsx`로 이동하고 기존 카테고리 그룹·상위·하위를 읽어 표시했다. 사용자가 브라우저에서 실제 목록과 배치를 확인했다.
- ✅ 가계부 선택 상자와 개인 닉네임 표시, 독립 상위 카테고리 추가, 선택 아이콘, 그룹 없는 제목 제거, 그룹 추가를 연결했다. 사용자가 화면을 확인했고 추가 저장 성공을 보고했다. 화면에 새 그룹이 표시됨을 확인했다.
- ✅ `+` 중앙 정렬과 상위 항목의 `+ 하위` 이름 입력/저장 흐름을 연결했다. 부모 검사를 소스로 분리하고 INSERT 정책 재귀를 제거한 뒤 사용자가 실제 하위 저장 성공을 확인했다. 지출 선택→달력 표시는 별도 확인 대기.
- ✅ 그룹·상위·하위 추가와 카테고리 이름/아이콘/그룹 수정 구현. 사용자가 실제 카테고리 변경 성공을 확인했다.
- ⏸ 그룹 제목 클릭→그룹 이름 수정 구현 및 최소 UPDATE 권한 적용. 실제 사용자 저장 확인 대기.
- ⏸ 카테고리 비활성화 및 상위/하위 동시 처리 구현·권한 적용. 실제 사용자 확인 대기.
- ✅ 그룹 비활성화: 소속 카테고리를 그룹 없이 이동→그룹만 비활성화, 비활성 표시/수정/활성화 구현 및 최소 권한 적용. 2026-10-11 사용자 정상 동작 확인. 정렬은 후속.
- ⏸ 비활성 카테고리 표시/⋮ 유지, 수정/활성화 및 하위 부모 검사 구현·정책 적용. 실제 복구 확인 대기.
- ⬜ 그룹 선택/해제·이동, 하위 아이콘 없음, 상위 단독 저장, 최대 2단계 적용.
- ⬜ 관리 변경이 지출 입력 선택 목록에 반영되는지 한 흐름으로 확인. 과거 기록은 유지.

## 6. 결제수단 관리 화면·기능

- ✅ 2026-10-18 로고 선택 UX: 선택 로고를 26×22px로 줄이고 로고 미선택 시 기본으로 선택된 것처럼 보이던 상태를 바로잡았다. `선택 안 함`을 제공하며 로고는 선택하지 않아도 저장 가능하다. 카드/현금 유형 필수 규칙과 목록 기본 아이콘 표시는 유지한다. `npx.cmd tsc -b --pretty false` 및 변경 TSX 2개 파일 `npx.cmd eslint ...` 통과. 원격 DB 변경 없음.
- ✅ 2026-10-18 현금 아이콘: 다운로드 폴더의 파주페이 PNG를 확인했으나 이는 파주페이 캐릭터이며 앱 사용 허가를 확인하지 못해 추가하지 않았다. PNG를 SVG로 감싸는 방식도 라이선스 문제를 해결하지 않으므로 보류하고, `cash.svg`를 단순한 자체 지폐 아이콘으로 교체했다. 선택 로고와 결제수단 목록에서 공통 사용한다. `npx.cmd tsc -b --pretty false`, `npx.cmd eslint src/features/payment-methods/payment-icons.ts`, `git diff --check` 통과. 원격 DB 변경 없음.
- ✅ 2026-10-18 기본 결제 이미지 및 카드사 옵션 제거: 다운로드의 `cardpng.png`/`cashpng.png`를 `src/assets/card-brands/card.png`/`cash.png`로 복사해 기본 아이콘으로 연결했다. KB·BC·현대 등 카드사별 선택 옵션 및 해당 SVG 자산은 제거했다. 저장된 과거 카드사 키는 유형 기본 아이콘으로 표시하며 편집 저장 시 NULL로 정리한다. `npx.cmd tsc -b --pretty false`, `npx.cmd eslint src/features/payment-methods/payment-icons.ts src/features/payment-methods/pages/PaymentMethodsPage/usePaymentMethodsPage.ts`, 카드사 SVG/선택 참조 `rg` 검색(일치 없음), `git diff --check` 통과. 원격 DB 변경 없음.
- ✅ 2026-10-18 로고 선택 기능 제거: 결제수단 추가·수정 시트에서 로고 선택 UI를 제거하고 훅의 선택 상태/검증 및 API 입력·수정 저장의 icon_key 처리를 제거했다. 기본 카드·현금 PNG는 관리 목록의 유형 표시용으로 유지한다. 기존 DB icon_key 컬럼과 데이터는 삭제/변경하지 않는다. 원격 DB 변경 없음.
- ✅ 2026-10-18 기본 아이콘 원복: 현재 Git HEAD에는 결제 아이콘 자산이 추적되지 않음을 확인했다. 작업 중 추가했던 다운로드 PNG 대신 기존 기본 카드·현금 SVG 아이콘을 다시 연결했다. 결제수단 추가/수정의 로고 선택 제거는 유지한다. `npx.cmd tsc -b --pretty false`, `npx.cmd eslint src/features/payment-methods`, 두 SVG XML 검증, `git diff --check` 통과. 원격 DB 변경 없음.
- ✅ 2026-10-18 아이콘 표시 방식 재확인: 사용자가 확인한 기존 구현에 맞춰 관리 목록의 카드는 인라인 카드 선 SVG, 현금은 `₩` 문자로 복원했다. 임시 이미지 자산과 helper 참조를 제거했다. 로고 선택 기능 제거는 유지한다. `npx.cmd tsc -b --pretty false`, 변경 TSX ESLint, `git diff --check` 통과.
- ✅ 2026-10-18 새 지출 포커스: 신규 폼의 첫 포커스는 기존 금액 입력 autoFocus를 유지한다. 상위/하위 카테고리를 선택하면 첫 결제수단 버튼으로 포커스하고 선택지가 없을 때 결제수단 그룹으로 이동한다. Design에 흐름을 반영했다. `npx.cmd tsc -b --pretty false`, 변경 TSX ESLint, `git diff --check` 통과. 원격 DB 변경 없음.
- ✅ 2026-10-18 관리 화면 가계부 콤보박스: 카테고리/결제수단 관리 화면의 투명 select를 표시 영역 전체에 겹쳐 현재 이름과 화살표 어디서나 네이티브 콤보박스가 열리게 했다. 키보드 포커스 outline과 비활성화 동작을 유지한다. `npx.cmd eslint`로 두 화면 TSX를 확인했고 `git diff --check` 통과. 원격 DB 변경 없음.
- ⏸ `pages/PaymentMethodsPage/` 화면·훅·CSS와 API 연결. CARD/CASH 고정 유형 목록 및 설정 이동 구현, 사용자 화면 확인 대기.
- ⏸ 추가·이름 변경·유형 이동·비활성화와 유형 변경 안내 구현 및 최소 권한 적용. 실제 저장 확인 대기.
- ⏸ 비활성 결제수단 표시/⋮ 유지, 수정/활성화 및 중복 검사 구현·정책 적용. 실제 복구 확인 대기.
- ⬜ 정렬은 후속. 카테고리와 함께 관리 순서 변경 UX를 검토한다.
- ⬜ 지출 폼에 반영되는지, 기존 거래가 유지되는지 확인.

## 7. 공유 그룹 화면·기능

- ⏸ `pages/GroupsPage/` 목록→`pages/GroupDetailPage/` 상세, 실제 그룹 이름 변경·기존 초대 코드 복사 구현. 타입/린트 확인 완료, 실제 브라우저 저장 확인 대기.
- ⏸ 생성/참여 시트→상세, 멤버 닉네임/마스킹 계정, 확인 후 본인 나가기 구현. 사용자 실제 동작 확인 대기. 코드 재발급만 후속 미구현이다.
- ✅ 사용자 ‘추천대로 진행’ 승인 후 생성/참여/멤버 조회/나가기 함수 4개 적용. 공용 테이블/정책 변경 없이 세션 기반 활성 M 프로필 및 소속 확인, 두 행 생성 원자성, ledger 행 잠금과 2명 정원 검사 연결.
- ⏸ 함수의 authenticated 실행 허용/anon 거부 및 세션 없는 요청 거부·타 그룹 멤버 0건 확인. 두 실제 계정의 정상 생성/참여와 동시 참여 검증은 미실행이며 MVP 게이트에 남긴다.
- ⬜ 그룹 생성 후 1명 사용→다른 테스트 계정 코드 참여→공유 지출 조회 연결. 코드 오류는 제출 후 팝업.
- ↪️ 초대 코드 재발급은 사용자 요청으로 MVP에서 제외하고 후속 개발로 남긴다. 원격 invite_code UPDATE 권한은 미적용 상태로 유지하며 대기 버튼을 제거한다. 복사/저장 닉네임/마스킹 계정 표시는 구현.
- ⏸ 나가기 확인과 마지막 멤버 데이터 삭제 연결. 실제 삭제 검증은 미실행이며 테스트 그룹으로만 확인한다.

## 8. 필터 화면·기능

- ✅ 사용자 요청의 상단 왼쪽 모두/개인 가계부/그룹 가계부 콤보박스 구현과 실제 동작 사용자 확인. 상세 필터도 같은 scope를 사용한다.
- ⏸ `components/CalendarFilterSheet/` UI/hook/CSS와 filter.api.ts/filter.utils.ts로 승인 시트·가계부별 임시 선택 구현. 실제 화면 확인 대기.
- ⏸ 전체·그룹·개인, 접힌 가계부 전체 선택, 카테고리 그룹 체크, 상위+하위/결제 유형 선택, 초기화·닫기·적용 연결. 비활성 항목도 과거 검색용으로 표시한다.
- ⏸ URL scope/filters/date 복원과 지출 취소·저장·삭제 복귀 조건 유지, 동일 필터 결과의 월/일 합계·날짜 금액·목록 연결. 숫자 ID로 동명이인을 구분한다. 실제 브라우저 흐름 확인 대기.
- ⏸ 필터 0건/실제 무지출 문구 분리, 긴 시트 내부 스크롤/배경 고정 구현. 실제 모바일 배치 확인 대기.

## 9. 내 정보·테마·로그아웃

- ⏸ `pages/SettingsProfilePage/` UI/hook/CSS 및 `profile.api.ts`: 닉네임 저장(빈 값 톡톡), 본인 아이디/로그인 정보, 현재 기기 로그아웃 구현. 실제 저장 확인 대기.
- ⏸ `pages/SettingsThemePage/` 및 `features/theme/`: B안 4색 목록, 즉시 반영, localStorage 복원/탭 동기화, 저장 실패 안내 구현. 앱 CSS 변수를 적용하고 인트로/소셜 색은 고정 유지. 실제 화면 확인 대기.
- ⬜ 로그아웃 후 캐시 제거·인트로 이동, 재로그인 시 다른 사용자 데이터가 남지 않는지 짧게 확인.

## 10. 카카오·Apple 로그인 + 둘러보기

- ⬜ 실제 공급자 활성화/지원 방식/redirect URL 확인. 현재 환경에서 지원되지 않으면 사용자에게 필요한 설정과 범위를 검토받는다.
- ⏸ 카카오 인트로 버튼→Supabase OAuth→/auth/callback→활성 tb_user 재사용/신규 M 프로필(톡톡)→달력 연결 코드 구현. 카카오/Supabase 공급자 설정과 실제 로그인 확인 대기. 닉네임은 가입 후 내 정보에서 변경 가능. Apple은 미연결.
- ⬜ 검증된 동일 이메일·기존 프로필 재사용, Apple 릴레이 처리 확인. 임의 계정 병합 금지.
- ✅ `/preview/calendar`에 고정 예시 달력만 표시. 모든 기능 동작과 하단 탭은 `로그인 후 이용 가능합니다.`로 안내하며 로그인 복귀 링크만 이동한다. 이전 예시 필터/설정/통계 경로·상태·보조 데이터 제거. 실제 계정/가계부 생성 및 원격 데이터 조회 없음. 2026-10-11 사용자 정상 확인.

## 11. 계정 삭제 + MVP 기능 마무리

- ⬜ 서비스 기능 완성 후 JSX 렌더링 전면 리팩토링: 중첩 삼항식과 부정 조건으로 UI를 걸러내는 표현을 줄이고, 명시적인 화면 상태와 분리된 폼/렌더링 함수로 정리한다. 현재 동작과 승인 디자인을 유지하며 기능 개발 중 일괄 재작성은 하지 않는다.
- ✅ 공용 fn_withdraw_account/FK 영향 확인 및 사용자 승인으로 별도 M 전용 fn_mon_withdraw_account 추가. 기존 공용 함수/정책/테이블은 수정하지 않았다.
- ✅ 아이디 계정의 비밀번호 재인증→삭제 확인 입력→기존 M 삭제 함수→현재 기기 로그아웃 연결. 사용자 onelogin 생성/삭제 보고와 2026-10-11 가입·재인증·RPC 성공 로그, Auth/identity/session/tb_user 잔여 0건 확인. 개인/그룹 하위 데이터 및 실패·경쟁 경로 종합 검증은 MVP 게이트에 남긴다.
- ⏸ 카카오 재로그인→동일 계정 확인→삭제 입력→전용 앱 연결 해제→M 전용 삭제 코드 구현. 공개 JavaScript 키/SDK 도메인 설정 및 실제 탈퇴 검증 대기. Apple 등 미지원 연결 계정은 차단한다. 별도 서버·새 DB 객체는 추가하지 않았다.
- ⬜ 인트로 디자인 품질 개선을 사용자와 검토. 기존 승인 화면의 나머지 레이아웃은 유지.
- ⬜ 기능 개발 완료 후 사용성 개선: 현재 사용자·현재 가계부의 삭제되지 않은 지출 작성 이력으로 카테고리·결제수단 칩을 사용 횟수→최근 사용→관리 순서로 정렬한다. 하위 사용은 상위 빈도에도 포함하고 빈 폼 자동 선택은 하지 않는다. 4단계에서 사용자 요청으로 연기했다.
- ⬜ PRD 기능 누락을 확인하고 아래 MVP 게이트로 넘어간다.

## 12. MVP 완성 시점: RLS·보안·테스트 집중 검토

- ⬜ 테스트 계정으로 개인/그룹 격리, 탈퇴 후 접근, 직접 API의 권한, 조작한 가계부·분류 ID, 익명 접근을 점검하고 필요한 RLS/권한만 보완.
- ⬜ M 채번/개인 중복/2명 동시 참여/마지막 멤버 삭제의 데이터 일관성 확인. 프런트만 검사하고 끝내지 않는다.
- ⬜ 계정 삭제·공유 프로젝트 영향·토큰/키 노출 여부 확인. 삭제는 일회용 테스트 데이터로 수행.
- ⬜ 로그인→지출→달력→필터→그룹→로그아웃 핵심 흐름을 최소한으로 검증한다. 검증용 테스트 파일은 완료 후 삭제하고 결과만 기록한다.
- ⬜ 타입/빌드, 360·390px/중앙 데스크톱, 키보드/safe-area, 기본 접근성, 오류 상태 확인.
- ⬜ 결과와 남은 위험을 기록. 통과 전 외부 실사용 공개 금지.

## 13. 웹 배포

- ✅ 로컬 Vercel 준비: vercel.json에 Vite/npm run build/dist와 SPA rewrite 추가, .vercel 무시, Architecture에 설정·환경변수·인증 복귀·검증 가이드 작성. 실제 배포와 원격 설정은 별도다.
- ⬜ MVP 게이트 확인 후 배포 방식(GitHub 연결/사용자 CLI)을 선택하고 Vercel 프로젝트·환경변수·시험 접근 보호·Supabase 인증 복귀 URL을 설정. yWeather 설정 유지.
- ⬜ 배포 환경의 직접 URL/새로고침/이메일·소셜 복귀와 최소 핵심 흐름 확인.
- ⬜ 사용자가 실제 모바일 웹에서 px/입력 동작을 확인하고 미세 조정.

## 14. 앱 포장·출시 직전 최종 검토

- ⬜ 앱 포장 방식과 배포 플랫폼을 사용자와 선택한 뒤 필요한 파일만 추가.
- ⬜ 인증 딥링크, 키보드, safe-area, 뒤로가기, 저장/복귀, Apple 인증·탈퇴 기능 연결.
- ⬜ **두 번째 RLS·보안·핵심 회귀 점검**, 실제 기기 테스트와 정책/권한 변화 재확인.
- ⬜ 개인정보/약관/계정 삭제 안내, 심사 계정 또는 둘러보기, 스토어 자료 준비 후 심사·배포.

## 재개 기록 — 이 영역만 계속 갱신

- 2026-10-18 바텀시트 닫기 공통화/카테고리 아이콘 잔여 출력 제거: src/lib/useBottomSheetClose.ts와 bottom-sheet.css에 closing→320ms 슬라이드다운·페이드→제거/이동, 중복 요청 방지·타이머 정리를 모았다. 카테고리/하위/분류 그룹, 결제수단, 달력 필터, 그룹 생성/참여/이름 변경, 지출 native dialog가 같은 닫기 훅을 사용한다. 지출 dialog는 기존 열기/transform/포커스/배경 스크롤 잠금을 보존했다. 배경/×/필터 ESC·적용/저장 성공 닫기를 연결하고 카테고리·그룹 시트 배경 닫기도 추가했다. ExpensePage의 category.icon_key 렌더링을 제거했으며 JSX 내 다른 카테고리 아이콘 출력은 rg 검색 결과 없다. DB 아이콘/카테고리 이름에 사용자가 입력한 이모지는 보존했다. agent-dev에 바텀시트 공통 규칙을 추가하고 PRD/Design/Architecture 갱신. npx tsc -b --pretty false exit0, 관련 변경 경로 npx eslint에서 처음 의존성 경고 2건 후 수정·재실행 0건, git -c core.safecrlf=false diff --check exit0. 브라우저 카테고리 추가와 그룹 이름 변경에서 닫기 직후 시트가 유지되고 전환 후 제거되는 것을 확인했으며 카테고리 닫힘 중 화면을 저장했다. 실제 저장/생성/탈퇴/DB/서버/배포/테스트 파일 변경 없음. 카드사 로고는 삼성카드 공식 자산 탐색 및 공식 홈페이지 읽기를 시도했으나 SVG를 확보하지 못했고 원격 읽기는 호스트 연결 실패했다. 임의 제작/외부 핫링크 없이 보류한다. 다음: 사용자가 적용 카드사 목록과 확보한 공식 SVG/PNG를 제공하면 이름 기반 로고 매칭을 연결한다. 모바일 감속 체감 및 그룹 생성/참여 성공 후 전환은 실데이터를 만들지 않아 미검증.

- 2026-10-18 최종 확인: 아래 결제수단 닫기/지출 포커스 변경의 마지막 `npx tsc -b --pretty false`, 변경 TS/TSX 4파일 `npx eslint`, `git -c core.safecrlf=false diff --check` 모두 exit0. 실기기 포커스/닫기 애니메이션은 로그인 후 사용자 확인 대기.

- 2026-10-18 결제수단 닫기/지출 포커스: usePaymentMethodsPage에 closing 상태와 320ms 후 제거/타이머 정리를 추가했다. PaymentMethodsPage/CSS에서 배경 페이드와 ease-in-out 슬라이드다운을 연결하고 ×·바깥 클릭·저장/활성화/비활성화 성공에 동일 적용한다. 저장 중 닫기 방지는 유지한다. ExpensePage의 신규 금액 input에 autoFocus, 결제수단 선택 시 useExpensePage.choose_payment_method로 선택과 메모 DOM focus를 연결하고 라벨을 메모(선택)으로 변경했다. DOM 참조는 화면 컴포넌트가 소유해 ref 객체가 훅 반환 객체에 섞일 때 발생한 React refs 린트 오류를 해결했다. Design 갱신. 최초 린트 실패 후 수정한 4개 TS/TSX eslint exit0; 최종 TypeScript/diff 확인은 아래 결과에 기록한다. 브라우저가 /auth 로그인 화면이어서 시트/포커스 실동작은 미검증이며 로그인·저장·데이터 추가는 실행하지 않았다. DB/서버/배포/테스트 파일 변경 없음. 다음: 로그인 후 결제수단 추가·수정의 ×/바깥 닫기, 새 지출 금액 첫 포커스와 결제수단→메모 이동을 모바일 키보드와 함께 확인한다.

- 2026-10-14 달력 아이콘 자리/결제수단 시트 닫기: CalendarDaily.tsx의 아이콘 span과 빈 값 대체 ‘•’, CalendarPage.css의 전용 스타일을 제거했다. 결제수단 PaymentMethodsPage.tsx의 배경에 target===currentTarget 검사로 close_sheet 연결; 폼 내부 클릭은 유지하고 기존 훅의 saving 닫기 방지를 재사용한다. PRD/Design 갱신. 변경 TSX 2파일 npx eslint와 git -c core.safecrlf=false diff --check exit0. 브라우저에서 결제수단 추가·수정 모두 바깥 클릭 닫기, 내부 입력 클릭 시 유지, 달력 오늘 5,000원 행의 별도 아이콘 영역 제거를 확인했다. 실제 저장/삭제/DB/서버/배포/테스트 파일 변경 없음. 금융사 이름 기반 SVG 자동 매칭은 아직 구현하지 않았으며 사용자에게 적용 금융사 목록을 요청한다. 공식 자산이 없으면 사용자 SVG 제공 여부를 확인하고 미인식 이름은 기존 유형 아이콘을 유지하는 방향이다. 다음: 사용자가 원하는 금융사 이름 목록을 제공한다.

- 2026-10-14 카테고리 아이콘/달력 제스처 요청 반영: 카테고리 관리 목록의 아이콘 자리와 추가·수정 시트 아이콘 선택 영역, 미사용 선택 상태/상수/스타일을 제거했다. 신규 icon_key=null, 기존 수정은 저장된 icon_key 보존; 달력·지출 선택의 아이콘과 DB 초기값은 유지한다. useCalendarSwipe가 가로 드래그 위치를 React 상태로 추적하며 왼쪽 다음 달/오른쪽 이전 달, 거리·속도 기준 전환, 160ms 퇴장/200ms 진입·짧은 드래그 복귀, 세로 스크롤/날짜 탭 보존, 화면 이동 시 타이머/프레임 취소를 담당한다. 화살표도 같은 전환을 사용한다. 카카오 본인 확인 버튼 문구는 ‘가계부 탈퇴하기’로 변경했다. PRD/Design/Architecture 갱신. npx tsc -b --pretty false 및 변경 TS/TSX 5파일 npx eslint exit0. 브라우저에서 왼쪽 드래그 10→11월, 오른쪽 11→10월, 선택일 5일 유지와 카테고리 목록·추가/수정 폼 아이콘 제거/닫기를 확인했다. 실제 저장·DB 변경·탈퇴·서버 제어·배포·테스트 파일 생성 없음. 짧은 드래그 복귀/빠른 플릭/실제 모바일 세로 스크롤 체감은 사용자 확인에 남긴다. 다음: 모바일에서 월 스와이프와 카테고리 이름/그룹 관리 UI를 확인한다.

- 2026-10-14 지출 수정 시트 및 카카오 팝업 UI: 달력 항목 클릭 시 수정 ID를 ExpenseSheet에 전달하여 추가와 같은 80dvh/320ms ease-in-out 열기·닫기를 재사용한다. 기존 useExpenseRecord로 값을 조회하고 로딩/오류도 시트 안에서 표시한다. 저장·삭제 완료 콜백은 월 캐시 갱신 후 달력 날짜 선택 및 시트 닫기로 연결하며 직접 수정 URL은 유지한다. 카카오 본인 확인 팝업의 취소는 우측 상단 ×, 진행은 공식 데모의 노란색 ‘앱 탈퇴하기’ 텍스트 버튼으로 변경했다(해당 데모에는 로고 이미지가 없음). 본인 확인/최종 삭제 흐름은 변경하지 않았다. PRD/Design/Architecture 갱신. npx tsc -b --pretty false 및 변경 TS/TSX 5파일 eslint exit0, git diff --check exit0(LF→CRLF 안내만 있음). 브라우저에서 수정 시트의 기존 금액/메모/선택값과 달력 URL 유지, 카카오 버튼/× 배치를 확인하고 카카오 팝업 ×로 취소했다. 사용자 브라우저 조작과 겹쳐 수정 시트 닫기 애니메이션 체감은 사용자 확인에 남긴다. 실제 저장·지출 삭제·카카오 재인증·계정 삭제·SQL·서버 제어·배포·테스트 파일 생성 없음. 다음: 사용자가 달력 지출 수정 시트의 열기/닫기와 저장 반영을 확인한다.

- 2026-10-13 카카오 탈퇴 최소 확인 마무리: 마지막 SDK Auth.cleanup 변경까지 포함한 `npx tsc -b --pretty false`, 변경 인증/탈퇴 TS/TSX 7파일 `npx eslint`, `git diff --check` 모두 exit0(기존 LF→CRLF 안내만 있음). Kakao 실제 재인증/연결 해제/삭제는 아직 실행하지 않았다. 기존 아이디 본인 확인 모달과 취소를 브라우저에서 확인하고 계정을 유지했다. 다음은 JavaScript 키/SDK 도메인 설정 후 사용자 일회용 계정 검증이다.

- 2026-10-13 카카오 계정 삭제 코드 연결: 사용자가 Kakao 앱의 ymoney 전용 사용을 확인했다. 비밀번호/카카오 본인 확인 폼 분리, prompt=login 재로그인과 기존 /auth/callback 복귀, 원래 UUID/getUser/기존 M 프로필/새 로그인 시각 확인, 탈퇴 콜백의 신규 프로필 생성 차단, 삭제 확인 모달 재진입을 연결했다. 공개 JavaScript 키 기반 SDK 2.8.3(SRI 검증·지연 로드)로 카카오 회원번호 대조 후 전용 앱 연결 해제, 기존 M 삭제 RPC 호출 순서다. 부분 실패 안내/같은 모달에서 해제 재호출 방지, Apple 등 미지원 공급자 차단을 유지한다. 변경: auth/withdrawal-intent.ts, useAuthCallbackPage.ts, auth.api.ts, settings/kakao-withdrawal.api.ts, profile.api.ts, SettingsAccountDelete.tsx/useSettingsAccountDelete.ts, vite-env.d.ts, .env/.env.example 및 PRD/Design/Architecture. .env에는 키 자리만 추가했고 기존 값은 보존했다. 원격은 기존 함수 EXECUTE(authenticated=true/anon=false), auth.uid/auth.sessions 검사를 읽기만 확인했다. SQL/권한/원격 데이터/배포/서버 제어/실제 탈퇴 실행 없음. 첫 npx tsc -b 및 변경 7파일 npx eslint exit0. node --experimental-strip-types --input-type=module -e로 복귀 기록 빈값/왕복/제거/잘못된 JSON 4건 통과; 테스트 파일 생성 없음. 로컬 기존 아이디 계정의 삭제 버튼→비밀번호 확인 폼→취소 정상 확인; 실제 카카오 재인증/해제/삭제는 설정·사용자 테스트 대기. 다음 행동: 사용자가 .env/Vercel에 JavaScript 키와 Kakao SDK 도메인 localhost:5173/ymoney.vercel.app를 설정하고 일회용 카카오 계정에서 탈퇴를 검증한다. 재로그인 취소/다른 계정/시간 만료/해제 후 DB 오류/응답 유실 검증은 MVP 게이트에 남긴다.

- 2026-10-13 결제수단 표시 및 카카오 탈퇴 조사: CalendarDaily/CalendarPage.css에 메모 간격 3px 추가와 금액 아래 결제수단 이름 표시를 연결했다. transactions.api.ts는 해당 월 거래의 결제수단 ID·접근 가계부로 이름/유형을 조회하고 비활성 항목도 표시한다. 상세 이름이 없으면 카드/현금, 참조 정보 자체가 없으면 결제수단 없음. preview-data.ts와 Architecture/Design을 갱신했다. `npx tsc -b --pretty false`와 변경 TS/TSX 3파일 `npx eslint` exit0; 실제 브라우저 배치/조회는 아직 미검증. 원격 DB는 기존 fn_mon_withdraw_account 정의만 읽었고 변경/삭제/서버 제어/배포 없음. 기존 함수는 M 프로필·5분 이내 새 세션·공유 서비스 보호·Apple 거부를 유지하며 Kakao DB 삭제 자체는 지원하지만 소스의 email-only 검사와 카카오 연결 해제가 미구현이다. 공식 Kakao JS SDK의 /v1/user/unlink로 별도 서버 없이 연결 해제 가능함을 확인했다(https://developers.kakao.com/docs/ko/kakaologin/js#unlink). 다음 행동: Kakao Developers 앱이 ymoney 전용인지 사용자에게 확인한다. 공유 앱이면 연결 해제가 다른 서비스에 영향을 줄 수 있어 먼저 범위를 결정해야 한다. 전용 확인 후 JavaScript 키/SDK 도메인 설정, 같은 계정 재인증·확인 입력·연결 해제와 M 전용 삭제의 부분 실패 재시도 흐름을 구현한다. 실제 탈퇴는 일회용 계정 승인 후만 검증한다.

- 2026-10-13 최소 확인: CSS 변경의 브라우저 재현/수정 비교 및 git diff --check exit0. TypeScript 로직 변경이 없어 전체 빌드·린트는 반복하지 않았다.
- 2026-10-13 간격/시트 위치 튐 수정: CalendarPage.css에서 분류의 90px 고정 폭을 제거하고 실제 글자 폭(최대35%)으로 변경, 식비/외식 옆 메모 간격9px 확인. 시트 열기 문제는 showModal 자동 포커스가 overflow:hidden인 바깥 dialog를 485px 스크롤하는 현상을 직접 재현했다. ExpenseSheet.css의 바깥 overflow만 clip으로 변경하고 내부 폼 스크롤 및 320ms ease-in-out 양방향 전환은 유지했다. 변경 후 scrollTop=0, 열기 중 panelTop331px→완료176.8125px(884px 화면의 80% 높이에 정확히 일치), 취소 후 dialog 제거 확인. 변경 CSS와 Design 갱신, git diff --check 결과는 아래 확인. DB/서버/배포/실제 지출 데이터/테스트 파일 변경 없음. 다음: 사용자가 열기 시 위치 튐이 없어졌는지 체감 확인.
- 2026-10-13 UI 추가 피드백 반영: 인트로 서비스명/소제목 상단, 달력 이미지 정중앙(폭 최대320px), 이미지 강조 배경 제거, 로그인 하단 유지. 짧은 화면의 이미지/버튼 겹침은 최소 높이740px와 작은 이미지로 방지한다. 지출 시트는 기존 열기 240ms 급격한 감속 곡선 대신 opening→open→closing 상태와 두 requestAnimationFrame 뒤 시작하는 320ms ease-in-out transform 전환을 사용하며 닫기 타이머도 일치시켰다. 월 지출 모델에 부모/하위 이름을 별도 전달하고 CalendarDaily에서 대분류 아래 작은 중분류, 그 오른쪽 메모, 최우측 금액으로 렌더링한다. 기존 전체 category_name/수정 클릭/조회 조건은 유지하고 DB 쿼리·권한·데이터는 변경하지 않았다. 변경: index.css, useExpenseSheet/ExpenseSheet.css, CalendarDaily/CalendarPage.css, transactions.api.ts의 결과 매핑·타입, preview-data.ts 및 Design/Architecture. npx tsc -b --pretty false 및 변경 TS/TSX 4파일 eslint exit0. 로컬 로그인 브라우저에서 식비/외식 두 줄과 메모 우측 표시, 시트 시작 transform y=707.188→0 및 취소 후 dialog 제거, 인트로 중심 y442/화면 중심442와 투명 배경을 확인했다. 서버 제어·배포·실제 지출 저장·테스트 파일 생성 없음. 다음: 사용자가 휴대폰에서 로고 크기와 열기/닫기 체감을 검토한다.
- 2026-10-13 마무리 검증: npm run build exit 0(184모듈), 기존 500kB 초과 번들 경고는 후속 코드 분할 대상으로 유지한다. 390×844 모바일 크기에서 인트로 서비스명 중심 y=422/화면 중심 y=422, 가로 넘침 없음; 지출 시트 높이 675.1875px=80%, 내부 본문 스크롤/저장 버튼 표시, 취소 후 dialog 제거를 확인했다. 임시 화면 크기는 복원하고 기존 탭은 달력으로 되돌렸다. 새 지출 저장 및 새 가계부의 초기값 생성은 아직 실제 쓰기 검증하지 않았다.
- 2026-10-13 앱형 UI 개선(10-12 요청): /auth에 공통 테마 색을 적용하고 서비스명 로고를 세로 중앙으로 배치했다. 달력 좌측 범위 콤보박스를 제거하고 기존 상세 필터/URL scope는 유지한다. CalendarHeader/CalendarMonth/CalendarDaily와 useCalendarSwipe로 영역·제스처를 분리했다. 오른쪽 다음 달/왼쪽 이전 달, 날짜 탭/세로 스크롤 구분을 적용했다. 새 지출은 기존 ExpenseForm을 ExpenseSheet/useExpenseSheet에서 재사용하며 80dvh 높이, 240ms 열기/닫기, 내부 스크롤, 저장 중 닫기 방지와 저장 후 달력 갱신을 연결했다. 기존 수정/직접 입력 URL은 유지한다. 새 개인/그룹 가계부 준비에 그룹 미지정 식비·카페·교통·문화·의료·기타(각 아이콘) 및 현금을 기존 CRUD로 연결하고 기존 항목은 덮어쓰지 않는다. 같은 클라이언트 초기값 중복 요청은 Promise 공유, 그룹 생성 뒤 초기값 실패 시 동일 ledger_id로 재시도한다. DB 객체/정책 변경·배포·서버 제어·테스트 파일 생성 없음. PRD/Design/Architecture를 최신 요청에 맞춰 갱신했다. npx tsc -b --pretty false와 변경 TS/TSX eslint exit 0, git diff --check exit 0. 로그인된 로컬 브라우저에서 콤보박스 제거, 양방향 월 이동, 시트 열기/취소·달력 URL 유지, 높이 707.1875px/884px=80%, 인트로 중앙 배치를 확인했다. 실제 신규 가계부 생성/지출 저장은 사용자 데이터를 추가하지 않기 위해 실행하지 않았다. 다음 검토: 모바일 터치/키보드 상태의 시트·저장 반영 및 새 가계부의 그룹 없는 6개 카테고리 확인. 기존 Vercel 카카오 정상 로그인은 사용자 확인이며 이번 수정은 아직 배포하지 않았다.
- 2026-10-11 둘러보기 사용자 정상 확인 및 Vercel 로컬 준비: 공식 Vercel Vite 문서의 SPA rewrite를 확인해 vercel.json(framework=vite/buildCommand=npm run build/outputDirectory=dist/모든 경로→index.html)을 추가하고 .gitignore에 .vercel을 추가했다. Architecture 기존 문서에 배포 방법 선택/루트·빌드/공개 환경변수 두 개/환경별 재배포/접근 보호/정확한 HTTPS callback 허용/yWeather Site URL 유지/최소 모바일 검증을 정리했다. 실제 Git 초기화·CLI 설치·Vercel 프로젝트 생성·업로드·Supabase 변경은 하지 않았다. brainstorming/Supabase 지침을 로컬 준비 범위로 적용했으며 외부 실사용 공개는 MVP 보안 게이트 전 금지한다. node 메모리 JSON/ignore 검사 exit 0. npm run build 최초 실행은 TypeScript 통과 뒤 Vite child-process spawn EPERM으로 exit 1, 동일 명령 권한 확장 재실행은 exit 0(177모듈, dist 생성). minified JS 623.88kB의 500kB 초과 경고 1건은 후속 코드 분할 최적화 대상으로 남기며 경고 기준을 숨기거나 임의 변경하지 않았다. 서버 제어/테스트 파일 생성 없음. 배포 라우팅·OAuth·실제 모바일은 아직 미검증. 다음: 사용자 Vercel/GitHub 저장소 준비 여부와 배포 방식 확인 후 MVP 최소 권한/격리 점검 및 접근 제한 시험 배포 순서 진행.
- 2026-10-11 둘러보기 범위 축소(최신 사용자 결정): 달력만 표시하고 날짜/월/범위/필터/추가/수정/하단 탭 모두 로그인 안내로 통일. PreviewCalendarPage의 click capture가 버튼/선택 상자의 기본 동작을 막고 키보드 변경도 훅의 같은 안내로 처리한다. usePreviewCalendarPage에서 URL·필터·선택 상태를 제거하고 현재 월 11일 고정 예시를 유지했다. 로그인하기 링크만 /auth로 이동. /preview/settings·statistics는 제거하여 직접 접근도 달력으로 복귀한다. 필터의 예시 주입과 설정 preview 분기를 제거하고 사용하지 않는 preview_ledgers 데이터도 정리했다. PRD/Design/Architecture/Tasks 갱신. npx tsc -b --pretty false와 변경 TS/TSX·preview 폴더 npx eslint 모두 exit 0. 브라우저 클릭/키보드 검증은 미실행이며 사용자 확인 대기. 원격 DB/서버/테스트 파일 변경 없음. 다음: 날짜·월·필터·범위·+·지출 행·하단 탭에서 안내만 표시되고 달력은 유지되는지 확인.
- 2026-10-11 onelogin 삭제 검증 및 둘러보기: Supabase 지침에 따라 읽기 전용으로 최근 24시간 로그의 실제 필드명을 확인한 뒤 auth_audit_logs/edge_logs를 조회했다. 한국시간 22:35:15 user_signedup, 22:35:26 login, 22:36:19 재인증 login, 22:36:24 fn_mon_withdraw_account POST 204 확인. 이메일/해당 UUID로 현재 Auth/tb_user 0건, UUID의 identity/session도 0건이다. auth.audit_log_entries 현재 테이블에는 관련 행이 없지만 통합 감사 로그에는 가입/로그인 이벤트가 남아 있다. 직접 SQL 삭제는 별도 Auth user_deleted 이벤트를 생성한다고 가정하지 않는다. 하위 데이터 삭제는 이전 ID/번호 스냅샷이 없어 개별 검증하지 않았다. 다음 승인 기능인 둘러보기는 preview-data.ts, PreviewCalendarPage.tsx/usePreviewCalendarPage.ts를 추가하고 CalendarPage의 CalendarView를 실/예시 공용 렌더링으로 분리했다. AppLayout preview 모드와 필터의 예시 입력은 query enabled=false 및 queryFn 우회로 원격 프로필/가계부 조회를 하지 않는다. 전역 AuthProvider의 기존 세션 복원/갱신은 유지한다. URL 날짜/범위/상세 조건, 금액·목록 반영과 설정/통계 탭을 연결하고 쓰기/설정 메뉴는 로그인 안내로 막는다. 설정 링크도 /preview 범위를 유지한다. npx tsc -b --pretty false, 변경 8파일/preview 폴더 npx eslint, node --experimental-strip-types --input-type=module -e의 예시 합계/개인·그룹/날짜/월 이동/필터 메모리 검증 모두 exit 0. 전체 빌드·브라우저 육안/네트워크 검증 미실행. 테스트 파일/새 패키지/원격 변경/실제 데이터 쓰기/서버 제어 없음. 다음: 인트로 둘러보기→11일 예시 46,000원/월 64,000원→개인·그룹/상세 필터→추가·수정 로그인 안내→로그인 복귀 확인. 관리 세부 화면 예시 조회, Apple 로그인/소셜 삭제, 고지 문서 연결은 미완료다.
- 2026-10-11 변경 요약 확인용 git diff --stat는 현재 폴더가 Git 저장소가 아니어서 exit 1. Git 초기화/설정 변경 없이 중단했다. 코드 타입/변경 파일 lint 통과 결과와는 별개다.
- 2026-10-11 그룹 정리 사용자 정상 확인 후 계정 삭제 UI 연결: SettingsAccountDelete.tsx/useSettingsAccountDelete.ts를 기존 프로필 폴더에 추가하고 profile.api.ts에 본인 getUser/활성 M 확인, email-only identity 검사, signInWithPassword 재인증, 기존 fn_mon_withdraw_account 호출을 분리했다. native dialog로 단계별 전체 폼·중앙 경고·삭제 범위·정확한 삭제 입력을 제공한다. 5분 경과 재인증, ref 연속 제출 차단, 요청 중 취소 차단, 민감 입력 메모리 한정/초기화를 적용했다. 삭제 성공 뒤 로그아웃 오류는 삭제 실패로 처리하거나 삭제 RPC를 재시도하지 않으며 응답 유실은 계정 상태 확인을 안내한다. 카카오/Apple 또는 소셜 연결 계정은 아직 삭제 불가다. 원격 함수 존재/authenticated 실행 권한만 읽기 확인했고 DB 변경·실제 삭제·서버 제어·테스트 파일 생성 없음. npx tsc -b --pretty false 및 변경 TS/TSX 4파일 npx eslint 모두 exit 0. 실제 재인증/삭제 정상·실패/다중 탭 계정 전환은 미검증이며 MVP 게이트에 남긴다. 다음: 일회용 아이디 계정에서 잘못된 비밀번호 거부→정상 재인증→삭제 입력→인트로 복귀/재로그인 불가, 다른 멤버가 남은 그룹 내역 유지 확인. 개인/마지막 그룹 데이터는 영구 삭제되어 복구할 수 없다.
- 2026-10-11 최소 검증 결과: npx tsc -b --pretty false 및 변경 카테고리 TS/TSX 4파일 npx eslint 모두 exit 0. 실제 비활성화/복구 UI 및 데이터 저장은 사용자 확인 대기다. 그룹 상태 변경 정책의 멤버/활성 사용자 검사 유지도 카탈로그에서 확인했다.
- 2026-10-11 그룹 정리 구현: 승인 정책대로 categories.api.ts에 소속 카테고리(비활성 포함) category_group_id=NULL 갱신→그룹 is_active=false 순차 요청을 추가했다. 기존 지출/카테고리 ID·활성 상태·하위 관계는 유지한다. 실패 시 부분 이동 가능성을 알리고 finally에서 관리/지출 선택/상세 필터 캐시를 갱신한다. 그룹 수정 시트에 비활성화/활성화, 목록 비활성 표시를 연결했다. 이름 저장은 현재 활성 상태를 유지하고 복구는 이전 배정을 되돌리지 않는다. category_group_state_access migration으로 기존 UPDATE 정책의 활성 조건만 제거하고 is_active 열 UPDATE를 authenticated에 추가했으며 멤버/활성 사용자 제한·anon 차단은 유지했다. 신규 테이블·함수·트리거 및 공유 객체 변경 없음. SQL은 supabase/category-group-state-access.sql 보존. npx tsc -b --pretty false 통과. 변경 4파일 npx eslint 결과 및 실제 사용자 UI 검증은 후속 확인. 테스트 파일/실제 데이터 수정/서버 제어 없음. 두 요청의 원자성·공유 멤버의 동시 그룹 배정은 MVP 게이트에서 검토한다. 다음: 카테고리 그룹 제목→비활성화 후 항목 유지/그룹 미배정→그룹 활성화 확인.
- 2026-10-11 인증 검증 이관: 카카오 Auth 성공 로그를 확인했지만 IP 복귀는 localhost:3000으로 이동했다. Supabase Auth 공개 URL 검사 구현에서 Site URL과 일치하지 않는 비루프백 IP를 허용 목록 검사 전에 거부하는 흐름을 확인했다. 사용자 결정으로 모바일 카카오 로그인 검증은 Vercel 배포 후 HTTPS 배포도메인/auth/callback을 Redirect URLs에 추가하여 재개한다. 카카오 앱 Callback URL/공용 yWeather 설정은 유지한다. 앱 복귀/tb_user 연결 성공은 별도 사용자 확인 전까지 완료 처리하지 않는다. 대화에 전달된 인증 토큰은 코드/문서에 저장하지 않았다.
- 2026-10-05 카카오 최소 동의: sign_in_with_kakao의 options.queryParams.scope='account_email'로 최종 인증 scope를 지정했다. Supabase 공식 kakao.go는 기본 사진/닉네임/email scopes에 사용자 scopes를 추가하므로 options.scopes 단독 설정으로는 제거되지 않는다. external.go에서 전달 query를 OAuth 인증 URL 옵션으로 적용하는 흐름을 확인했다. 신규 tb_user 닉네임 톡톡/프로필 이미지 미저장은 기존 동작 유지. 사용자는 Kakao Developers 동의 항목에서 프로필 사진/닉네임을 사용 안 함으로 설정해야 하며 기존 제공 동의는 이번 요청 변경만으로 취소되지 않는다. 실제 카카오 authorize URL의 scope/동의 화면 검증은 사용자 확인 대기. DB/공급자 설정/서버 변경 없음.
- 2026-10-05 삭제 함수 Advisor 확인: security advisor 실행. 공용 기존 기기/푸시 RLS 비활성·함수 search_path/anon 실행 경고는 이번 범위 밖이라 변경하지 않았다. 인증 역할에만 공개한 SECURITY DEFINER 삭제 함수는 내부 본인/M/세션/확인값 검사를 유지하며 해당 제한 API 경고는 MVP 게이트에 남긴다(https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). 실제 삭제를 실행하지 않았으므로 FK 정리·동시 요청의 정상 경로 성공을 주장하지 않는다.
- 2026-10-05 M 전용 삭제 함수/카카오 연결: 사용자 승인으로 money_account_withdrawal migration 적용, supabase/account-withdrawal.sql 보존. ymoney.fn_mon_withdraw_account('삭제')는 auth.uid 기반 활성 M 본인/최근 5분 세션/확인값 검사→공용 기기·푸시 및 Apple 연결 보호 검사→개인 데이터 삭제/기존 그룹 나가기 함수 재사용→본인 tb_user/Auth 삭제를 한 트랜잭션으로 수행한다. 남은 공유 거래 작성자 FK SET NULL 유지. 기존 yWeather fn_withdraw_account와 객체는 수정하지 않았다. 카탈로그에서 함수 search_path 빈 값/authenticated EXECUTE=true/anon=false 확인. 세션 없는 거부 검증 호출도 자동 안전 검토가 삭제 함수 실행 위험으로 차단해 재시도하지 않았다. 따라서 정상 삭제·거부 실행 검증 모두 미실행이며 삭제 UI도 아직 연결하지 않았다. 카카오 기본 공급자로 인트로/전용 훅/auth.api/복귀 화면·훅/프로필 표시를 변경했고 네이버 제외를 PRD/Design에 반영했다. tb_user.user_id 필수이므로 신규 카카오 사용자는 이메일 제공이 필요하며 임의 이메일 생성하지 않는다. 실제 OAuth는 사용자 Dashboard 설정 완료 후 확인. npx tsc -b --pretty false exit 0. auth 폴더 전체 lint는 기존 AuthProvider.tsx의 react-refresh/only-export-components 1건 실패, 변경 6파일만 lint는 exit 0. 서버 제어/실제 사용자 데이터 쓰기·삭제 없음. 다음: 카카오 REST API key/Client Secret/Redirect URI/이메일 동의 및 Supabase Kakao/URL allowlist 설정 완료를 확인하고 실제 로그인 검증, 삭제 UI의 재인증/확인은 후속 연결.

### 카카오 설정 가이드 (2026-10-05)

1. Kakao Developers에서 가계부 톡톡 앱 생성→카카오 로그인 ON→REST API key와 Kakao Login Client Secret 활성화.
2. Kakao 로그인 Redirect URI에 https://fenuxlgeyfshztwzdxrb.supabase.co/auth/v1/callback 등록. Supabase Dashboard의 Kakao Callback URL 표시가 다르면 그 표시값을 기준으로 한다.
3. 카카오 동의 항목의 이메일(account_email) 제공 설정. 현재 공용 tb_user.user_id가 NOT NULL이므로 이메일 없는 신규 가입은 오류로 안내한다. 이메일 권한/Biz App 설정이 필요하면 카카오 공식 가이드를 따른다.
4. Supabase Authentication→Sign In / Providers→Kakao ON, Client ID에는 REST API key, Client Secret에는 Kakao Login Client Secret 입력. 프런트 .env/채팅에 secret을 넣지 않는다.
5. Supabase Authentication→URL Configuration→Redirect URLs에 http://localhost:5173/auth/callback 추가. yWeather 기존 Site URL/Redirect 목록을 덮어쓰지 않고 새 URL만 추가한다.
6. 카카오 버튼→동의→앱 복귀→tb_user M 프로필/달력 확인. 취소·이메일 미제공·중복 복귀는 최소 검증 대상으로 남긴다.
공식 참고: https://supabase.com/docs/guides/auth/social-login/auth-kakao
- 2026-10-05 재발급 후속 이관 정리: 사용되지 않는 재발급 API/훅/권한 SQL 초안을 제거하고 복사만 유지했다. 삭제한 로컬 SQL은 grant update(invite_code) 한 줄짜리 미적용 초안으로 후속 구현 시 재작성 가능하다. npx tsc -b --pretty false 및 npx eslint src/features/groups exit 0. 실제 브라우저 확인/DB 변경 없음.
- 2026-10-05 사용자 결정 및 탈퇴 조사: 초대 코드 재발급은 후속으로 연기하고 MVP 대기 버튼을 제거한다. 카테고리 그룹 정리는 소속 카테고리의 category_group_id를 NULL로 옮긴 뒤 그룹 비활성화하는 정책으로 확정했다. 원격 확인에서 그룹 is_active UPDATE 권한이 없고 현재 WITH CHECK도 활성 상태를 강제하여 구현 시 최소 권한/정책 변경이 필요하다. 계정 삭제 진행 요청에 따라 public.fn_withdraw_account 정의/FK를 읽기 전용 조회했다. 함수는 tb_user_device/tb_push_schedule/tb_user/auth.users를 삭제하므로 yWeather 공용 데이터에 영향을 주며 가계부 정리는 없다. tb_user 삭제 시 member CASCADE, ledger 작성자/거래 작성자·수정자 SET NULL이고 개인/마지막 그룹 ledger는 자동 정리되지 않는다. 기존 함수를 연결/수정/호출하지 않았다. 다음 검토: 기존 공용 함수는 보존하고 활성 M 계정만 처리하는 ymoney 전용 삭제 함수 신규 추가와 공용 Auth/tb_user 삭제 허용 범위를 승인받는다. 네이버는 공식 Custom OAuth provider 가용성·네이버 response/id/email 중첩 응답 호환성을 확인한 뒤 경로 결정; Client Secret은 프런트에 저장하지 않는다. 원격 변경/실제 데이터 삭제 없음.
- 2026-10-05 테마 수정 최소 검증: npx tsc -b --pretty false exit 0. Node 메모리 검사로 세 화면 CSS의 고정 색이 흰색/위험/비활성 상태 색뿐이며 인코딩된 고정 SVG가 남지 않음을 확인했다. 검증 파일은 생성하지 않았다. CSS 전용 변경이므로 별도 전체 lint/빌드는 생략했으며 실제 브라우저 색상 전환은 미검증이다.
- 2026-10-05 테마 누락 수정: 설정 아이콘/누름 배경, 카테고리·결제수단 관리의 그룹 배경/보조 글자/선택 상태/추가 버튼/핸들에 남은 고정 민트 색을 기존 테마 변수로 치환했다. 가계부 콤보박스의 색이 인코딩된 SVG를 테마 변수를 사용하는 CSS 장식 화살표로 교체해 실제 select 클릭은 유지한다. 그림자와 시트 뒤 배경은 중립 공통 변수로 분리했다. 변경 파일은 세 화면 CSS와 theme.css뿐이며 기능·DB·서버·목업 변경 없음. 원래 색상이 있는 이모지 아이콘과 위험/비활성 상태 색은 유지한다. 소스 정적 색 검사와 타입 검사 결과는 후속 기록에 남긴다. 실제 브라우저 팔레트 전환 육안 확인은 사용자 확인 대기.
- 2026-10-05 위임 작업 최종 확인: 검토 대기 버튼 반영 후 npx tsc -b --pretty false 및 npx eslint src/features/groups src/features/settings src/features/theme src/App.tsx src/main.tsx src/features/calendar/components/CalendarFilterSheet 모두 exit 0. Node 메모리 실행으로 테마 4값/빈 값·잘못된 값 기본 민트/승인 저장 키 7개 검증 통과. 테스트 파일 생성 없음. 실제 브라우저 검증과 사용자 데이터 쓰기는 하지 않았다. 개발 서버 제어 없음.
- 2026-10-05 초대 코드 재발급 보류: 기존 그룹 멤버 UPDATE 정책(USING/WITH CHECK)과 코드 UNIQUE 인덱스 존재, authenticated/anon invite_code UPDATE=false를 읽기 전용 확인했다. groups.api.ts의 암호학적 난수 8자리 코드 생성→기존 코드 조건 UPDATE→충돌 제한 재시도와 상세 훅/스타일을 준비했다. 로컬 supabase/group-invite-code-access.sql은 열 하나 GRANT만 포함한다. 원격 group_invite_code_access 적용은 자동 안전 검토에서 영구 열 권한 변경의 명시 승인 부족으로 차단되었으며 우회/재시도하지 않았다. 원격 변경 없음. UI는 검토 대기 비활성이며 실제 재발급 성공을 주장하지 않는다. 적용 전 타입 검사/변경 폴더 린트 통과, 버튼 보류 변경 후 최종 검사는 아래 기록 참조. 돌아온 사용자 검토: 기존 그룹 멤버 RLS는 유지한 채 authenticated의 invite_code UPDATE 열 권한만 추가할지 승인 필요. 승인 시 버튼 연결 후 테스트 그룹의 새 코드/기존 코드 무효화 확인.
- 2026-10-05 외출 중 위임 작업: 상세 필터 항목을 아이콘 없는 균등 3열/동일 높이로 정리했다. 검토 없이 가능한 승인 기능으로 내 정보/테마 화면과 라우트·설정 메뉴를 연결했다. 닉네임은 기존 tb_user 본인 UPDATE 정책으로 nickname/updated_at만 수정하고 공백은 톡톡으로 저장한다. 기존 app-profile 캐시 및 개인 가계부 이름/멤버/필터 옵션 캐시를 갱신한다. 로그아웃은 local 범위로 요청하고 Query 캐시를 비우며 인트로로 이동한다. 테마는 승인 B안 민트/라벤더/피치/스카이, 기기 localStorage와 Context/CSS 변수로 처리하며 인트로·소셜 고유색은 유지한다. 변경 경로는 Architecture 파일 지도에 반영. npx tsc -b --pretty false 및 npx eslint src/features/settings src/features/theme src/App.tsx src/main.tsx src/features/calendar/components/CalendarFilterSheet 통과. 브라우저 실제 닉네임 저장/로그아웃/테마 복원은 미검증. tb_user 권한/정책은 읽기 전용 확인했고 원격 SQL·사용자 데이터·서버 변경 없음. 공유 tb_user의 기존 광범위 UPDATE 열 권한은 MVP 보안 게이트에서 별도 검토한다. 소셜 공급자 설정/둘러보기 범위, 공유 계정 삭제는 검토 필요 항목이므로 건너뛰었다. 다음: 돌아온 사용자가 필터 배치→닉네임 저장→테마 선택/새로고침→로그아웃을 확인한다.
- 2026-10-05 상세 필터 최종 검증: `npx tsc -b --pretty false`와 `npx eslint src/features/calendar src/features/transactions/transactions.api.ts src/features/transactions/pages/ExpensePage/useExpensePage.ts` 모두 exit 0. 옵션 Query는 staleTime=0으로 시트 재진입 때 최신 관리 항목을 읽는다. 실제 브라우저/DB 데이터 쓰기 검증은 실행하지 않았다.
- 2026-10-05 상세 필터 연결: 퀵필터 정상 동작을 사용자 확인했다. 기존 승인 filter-final-mobile-360 목업으로 오른쪽 버튼→상세 시트, 범위 탭, 가계부 접기/전체 선택, 그룹·상위/하위·카드/현금 선택, 초기화/닫기/적용을 연결했다. 시트 draft와 URL 적용 조건을 분리하고 null=전체/[]=해제를 구분한다. category OR/payment OR 사이 AND를 가계부별 계산하며 월/일 합계·날짜 금액·목록은 같은 결과를 사용한다. 과거 검색용으로 비활성 항목도 읽고 표시한다. 날짜/조건 URL 복원 및 지출 이동/취소/저장/삭제 후 조건 유지도 적용했다. 새 파일: calendar/filter.api.ts/filter.utils.ts, components/CalendarFilterSheet TSX/hook/CSS. 변경: CalendarPage TSX/hook, transactions.api.ts(payment_method_id 포함), useExpensePage.ts(복귀 URL), Architecture/Design/Tasks. DB·사용자 데이터·서버 변경 없음. 메모리 실행 Node assert로 전체/해제/부분선택·OR/AND·가계부별 분리·URL 왕복 통과; 테스트 파일 생성 없음. 초기 lint 2건은 불필요한 초기 대입/명시적 memo 의존성을 수정했다. 최종 타입/린트 결과는 다음 검증 기록에 남긴다. 브라우저 실제 화면·조회 흐름은 미검증. 다음: 개인/그룹 각 항목 선택→적용→합계/목록 확인, 닫기 취소 및 초기화→적용 확인.
- 2026-10-05 퀵필터 최종 검증: `npx tsc -b --pretty false`, `npx eslint src/features/calendar src/features/transactions/transactions.api.ts src/features/ledgers/ledgers.api.ts` 모두 exit 0. 자동/브라우저 동작 테스트는 생략했으며 임시 테스트 파일은 생성하지 않았다.
- 2026-10-05 공유 확인 및 달력 퀵필터: 사용자가 코드 참여, A 작성 그룹 지출의 A/B 공동 조회, 한 계정 나가기 후 남은 계정 내역 유지를 확인했다. 수정/마지막 멤버 삭제 검증은 아직 확인하지 않았다. 개인/그룹 내역이 함께 보이는 요구로 상단 왼쪽 모두/개인 가계부/그룹 가계부 콤보박스를 추가했다. ledger_scope는 URL scope로 복원하며 범위별 Query 키를 사용한다. transactions.api.ts에서 기존 본인 ledger 목록의 종류를 먼저 고른 후 해당 ledger_id로 조회하므로 월/일 합계·날짜 금액·목록 조건이 일치한다. 선택일 0건 상태와 범위 변경 중 로딩/조회 오류 구분도 반영했다. 변경: CalendarPage TSX/CSS/hook, calendar.utils.ts, transactions.api.ts, ledgers.api.ts(공유 범위 타입), PRD/Design/Architecture/Tasks. DB·서버 변경 및 사용자 데이터 쓰기 없음. npx tsc -b --pretty false와 변경 TS/TSX npx eslint 검증 결과는 아래 최신 기록에 따른다. 브라우저 실제 배치/범위별 금액은 미검증. 다음: 같은 날짜에서 모두→개인→그룹을 바꿔 월/일 합계·날짜 숫자 아래 금액·목록이 함께 바뀌는지 사용자 확인.
- 2026-10-05 그룹 기능 승인 적용: 사용자 ‘추천대로 진행’으로 생성/참여/멤버 조회/나가기를 승인했다. 기존 그룹 API/두 화면 hook·TSX/상세 CSS에 시트·성공 상세 이동·참여 오류 팝업·닉네임/마스킹 계정·나가기 확인/캐시 제거를 연결했다. supabase/group-management-functions.sql 및 원격 group_management_functions로 ymoney 함수 4개 추가; 세션 활성 M 신원과 소속 검사, 생성 두 INSERT 원자성, 참여/나가기 ledger 행 잠금, 마지막 멤버 그룹 범위 삭제 구현. 기존 테이블/RLS/공용 객체 변경·실제 사용자 데이터 쓰기 없음. npx tsc -b --pretty false, npx eslint src/features/groups exit 0. 함수 카탈로그 4개 search_path 빈 값/authenticated 실행=true/anon=false 확인. 세션 없는 create/join/leave 요청의 회원정보 오류 및 비소속 members 0건을 rollback 쿼리로 확인했다. 정상 생성/2계정 참여/실제 나가기/브라우저 배치는 미검증. Advisors에는 새 함수 authenticated SECURITY DEFINER 공개 경고가 있으며 승인된 제한 API로 내부 신원/소속 검사를 유지한다(https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). 공용 기존 RLS 비활성/함수 search_path/anon 실행 및 유출 비밀번호 검사 경고는 이번 범위 밖이라 변경하지 않고 MVP 점검에 남긴다. 새 테스트 파일·서버 제어 없음. 다음: 사용자가 테스트 그룹 생성→코드 복사→다른 계정 참여와 멤버 표시를 확인한다. 나가기는 테스트 데이터에서만 검토하며 코드 재발급은 후속 연결한다.
- 2026-10-05 그룹 관리 첫 연결: 설정→그룹 목록→상세 라우트, 실제 GROUP 목록/이름/기존 초대 코드 조회·복사와 이름 변경 시트를 구현했다. 화면/hook/CSS는 각 pages 폴더, 데이터 요청은 groups.api.ts로 분리했다. 원격 group_rename_access는 ledger_name/updated_at UPDATE와 그룹 멤버 범위 정책만 추가했고 새 테이블/함수/트리거·공용 객체 변경은 없다. authenticated EXPLAIN UPDATE 성공(실제 사용자 데이터 쓰기 없음). npx tsc -b --pretty false 및 npx eslint src/features/groups src/App.tsx src/features/settings/pages/SettingsPage/SettingsPage.tsx exit 0. 브라우저 실제 저장·복사는 미검증, 서버 제어 없음. 생성/참여/멤버 표시/재발급/나가기는 현재 정책과 여러 행 처리 검토가 필요해 명시적으로 보류했다. 현재는 그룹이 없는 사용자에게 빈 목록을 표시한다. 다음: 보류 DB 처리 검토와 별개로 승인 필터 시트 구현 진행.
- 2026-10-05 비활성 항목 복구: 사용자 요청으로 카테고리/결제수단 모두 비활성 배지와 ⋮를 유지하고 수정 시트 진입 제한을 제거했다. 비활성 수정 시 활성화 버튼이 표시되며 현재 입력값 저장과 활성화를 한 UPDATE로 수행하고 활성 이름 중복을 확인한다. 상위는 본인만 복구, 하위는 저장 직전 같은 ledger의 활성 상위 SELECT 확인 후 복구한다. API는 조회 당시 활성 상태 조건으로 동시 상태 변경에 의한 0건 수정도 오류 처리한다. 원격 managed_item_reactivate_access로 기존 두 UPDATE 정책 USING의 활성 조건만 제거하고 멤버 제한/WITH CHECK/열 권한 유지. 두 테이블 authenticated EXPLAIN 활성화 UPDATE 성공, 실제 사용자 데이터 쓰기 없음. npx tsc -b --pretty false 및 npx eslint src/features/categories/categories.api.ts src/features/categories/pages/CategoriesPage src/features/payment-methods exit 0. 브라우저 실제 활성화는 사용자 확인 대기. 변경: 양쪽 API/hook/TSX/CSS, SQL, PRD/Design/Architecture/Tasks. 서버 제어/새 DB 객체/공유 변경 없음. 다음: 비활성 항목 ⋮→활성화 후 지출 선택에 복귀하는지 확인하며 공유 그룹 기능 진행.
- 2026-10-05 결제수단 관리: 기존 승인 목업으로 설정→/app/settings/payment-methods, 가계부 선택, 카드/현금 목록, 독립 + 추가, 항목 수정/유형 이동/비활성화를 구현했다. 이름/유형 필수, 같은 활성 유형 내 중복과 자기 제외 검사, 저장 중 입력/재제출 차단, 실패 입력 유지, 0건 UPDATE 오류, 캐시 갱신을 적용했다. 화면은 명시적인 상태 분기로 렌더링하고 중첩 삼항/boolean JSX 필터를 추가하지 않았다. 원격 payment_method_edit_access 적용: 네 표시/활성 열만 authenticated UPDATE=true, 나머지 열/anon UPDATE=false; authenticated EXPLAIN UPDATE 성공. 실제 사용자 데이터 수정 없음. 실행 명령 npx tsc -b --pretty false 및 npx eslint src/features/payment-methods src/features/settings/pages/SettingsPage/SettingsPage.tsx src/App.tsx 모두 exit 0. 자동 테스트·브라우저 실제 저장은 수행하지 않았고 서버 제어 없음. 새 소스 4개(API/화면/훅/CSS), App/Settings, 검토 SQL, Architecture/Design/Tasks 갱신. 새 테이블/함수/트리거·공유 프로젝트 변경 없음. 다음: 설정→결제수단 관리에서 사용자 확인, 이어서 공유 그룹 목록/생성 기능을 기존 목업 기준으로 구현한다. 순서 변경/재활성화 및 그룹 비활성화 검토는 남긴다.
- 2026-10-05 카테고리 비활성화: 기존 설계 범위 자동 진행 위임에 따라 수정 시트에 비활성화 버튼/확인을 추가했다. 상위는 본인과 하위를 같은 ledger의 한 UPDATE로, 하위는 본인만 is_active=false로 변경한다. 거래 행/분류 ID는 유지하고 관리/지출 옵션/달력 캐시를 갱신한다. 원격 category_deactivate_access 적용: is_active UPDATE=true(authenticated), false(anon), 실제 DELETE=false; 기존 USING 활성·멤버 제한 유지 및 WITH CHECK 활성 강제만 제거. authenticated EXPLAIN UPDATE 성공, 실제 사용자 데이터 UPDATE 없음. npx tsc -b --pretty false 및 변경 TS/TSX 3파일 npx eslint exit 0. 기존 코드의 지출 선택 활성 필터/달력 분류 활성 제한 없음 확인. 브라우저 실제 비활성화는 사용자 확인 대기; 서버 제어 없음. 변경: 카테고리 API/hook/TSX/CSS, SQL, PRD/Design/Architecture/Tasks. 검토 보류: 그룹 비활성화 시 소속 이동·재활성화 UX, 동시 하위 추가 경쟁은 MVP 점검. 다음: 해당 보류와 독립적인 결제수단 관리 화면·기능을 기존 목업 기준으로 진행한다.
- 2026-10-05 빠른 진행 위임 및 그룹 수정: 사용자가 카테고리 변경 성공을 확인하고 기존 설계 기능/필요 SQL은 재승인 없이 진행하도록 위임했다. agent-dev에 범위와 예외를 기록했다. 아이콘 버튼은 toggle_icon으로 재클릭 시 해제하며 없음 버튼도 유지한다. 그룹 제목 클릭→기존 이름 수정, 자기 그룹 제외 중복 검사, 0건 UPDATE 오류, 관리/지출 선택 캐시 갱신을 추가했다. 원격 `category_group_edit_access`는 group_name/updated_at 2열 UPDATE와 멤버 범위 정책 하나만 추가했다. 읽기 전용 확인에서 두 열만 authenticated UPDATE=true, 나머지 열/anon UPDATE=false; authenticated EXPLAIN UPDATE 성공. 실제 사용자 데이터 수정 없음. `npx tsc -b --pretty false`와 카테고리 변경 TS/TSX 3파일 `npx eslint` exit 0. 자동 테스트/브라우저 실제 저장은 생략하고 서버 제어 없음. 변경: 카테고리 API/hook/TSX, SQL, agent-dev/Design/Architecture/Tasks. 다음: 비활성화의 기존 거래 유지 정책을 기준으로 후속 구현하며, 이번 그룹 이름 수정 및 아이콘 해제는 사용자 확인 대기.
- 2026-10-05 카테고리 수정 권한 적용: 사용자 승인으로 `category_edit_access` migration을 적용했다. category_name/icon_key/category_group_id/updated_at 4개 열만 authenticated UPDATE=true이고 나머지 열과 anon의 모든 열 UPDATE=false임을 확인했다. RLS=true, USING/WITH CHECK를 갖춘 멤버 범위 UPDATE 정책 1개를 확인했다. authenticated `EXPLAIN UPDATE ... RETURNING category_id`도 재귀 없이 성공했다. 실제 UPDATE는 실행하지 않아 사용자 데이터 변경 없음. 새 테이블/함수/트리거 및 공유 프로젝트/서버 변경 없음. SQL 주석과 Tasks만 로컬 갱신. 다음: 카테고리 이름 클릭→이름/아이콘/그룹 변경 저장, 하위 이름 수정 및 지출/달력 표시를 사용자가 확인한다.
- 2026-10-05 카테고리 수정 준비: 사용자 승인으로 이름 클릭→기존 값 수정 시트→상위 이름/아이콘/그룹 또는 하위 이름 UPDATE를 연결했다. ID·부모·정렬은 유지하고 자기 행 제외 이름 중복 검사, 저장 실패 입력 유지, 0건 수정 오류, 관리/지출 옵션/달력 캐시 갱신을 추가했다. 변경은 CategoriesPage TSX/CSS·hook·categories.api.ts·Design/Architecture/Tasks와 검토용 `supabase/category-edit-access.sql`. 실행한 `npx tsc -b --pretty false`와 변경 TS/TSX 3개 `npx eslint` 모두 exit 0. 요청한 검증 축소에 따라 자동 테스트/브라우저 저장은 수행하지 않았다. 읽기 전용 원격 확인: category UPDATE 정책 없음, authenticated의 모든 열 UPDATE=false. 원격 변경 및 서버 제어 없음. 다음: 4개 열 UPDATE와 멤버 범위 정책 한 개의 사용자 승인 후 적용 및 실제 수정 확인.
- 2026-10-05 다음 범위 검토: 사용자가 하위 저장 성공을 확인했다. JSX 중첩 삼항/부정 조건 정리는 요청대로 서비스 기능 완성 후 11단계로 연기했다. 다음 범위는 기존 카테고리 클릭→수정 시트→상위 이름/선택 아이콘/그룹 변경 또는 하위 이름 변경이다. 기존 category_id와 parent_category_id를 유지해 과거 거래 연결을 보존한다. 수정 UI 설계 확인 후 소스 구현하며, 필요한 최소 UPDATE 권한/RLS는 적용 전 별도 검토한다. 이번 변경은 Tasks 기록뿐이며 앱 소스·원격 DB·서버 변경 및 자동 검증은 없다.
- 2026-10-05 부모 소스 확인 적용: 사용자 승인으로 `category_child_insert_recursion_fix` migration을 적용해 카테고리 INSERT 정책의 자기 테이블 조회를 제거했다. 부모의 같은 가계부/EXPENSE/활성/상위 조건은 준비된 `create_child_category`의 별도 SELECT에서 확인한다. 멤버 제한·하위 group/icon=NULL·기존 외래키는 유지하며 새 객체/권한 및 공유 프로젝트 변경은 없다. authenticated 역할의 `EXPLAIN INSERT`가 성공해 기존 `42P17` 재귀 해소를 확인했다. EXPLAIN만 실행하여 실제 데이터는 저장하지 않았다. 이전 승인 대기 기록은 이 적용으로 종료한다. 직접 API의 부모 관계와 조회/저장 사이 변경은 MVP 최종 점검 과제로 유지한다. 다음: 사용자가 하위 저장을 재시도하고 지출 선택→달력 표시를 확인한 뒤 카테고리 수정으로 진행.
- 기준: 2026-09-26, 문서 기반 재시작 정리 완료.
- 구현 완료: 1단계 공식 Vite 실행 환경, React Router, `/auth` 로그인 인트로 화면.
- 원격 DB: 2026-09-26 가계부 전용 객체 정리 완료, 2026-09-27 읽기 RLS 적용 및 가계부 전용 `ymoney` 스키마 이동 완료. yWeather 공용 테이블은 보존.
- 다음 작업: 사용자가 설정 탭→카테고리 관리에서 현재 가계부의 그룹·카테고리 목록을 확인한다. 그다음 승인 목업의 우측 하단 +로 독립 카테고리 추가를 연결하고 필요한 최소 쓰기 권한을 검토받는다. 4단계 실제 소프트 삭제 검증은 테스트 지출로 사용자 확인 대기다.
- 로컬 실행: 사용자가 개발 서버와 터미널을 직접 제어한다.
- 초기화 기록: 공식 Vite React + TypeScript 템플릿 생성 후 `src/features/auth/IntroPage.tsx`, `/auth` 라우트, 인트로 CSS·SVG를 반영. `react-router-dom` 설치와 잠금 파일 반영 확인. Supabase/원격 DB는 변경하지 않음.
- 변경 파일: 루트 MD 5개, design-mockup/index.html 및 승인 화면 14개. 이전 구현·설정·테스트·의존성·중복 문서는 프로젝트 밖으로 이동.
- 이번 변경: `EmailAuthPage.tsx`의 회원가입 이메일·비밀번호·닉네임 React 상태/값 복사 로직을 제거했다. 인증 재확인에는 비활성화된 원래 폼의 이메일·비밀번호만 사용하며 닉네임은 재사용하지 않는다. `Tasks.md` 기록 갱신. 원격 Supabase 설정·테이블·함수 변경 없음. 자동 테스트/빌드는 실행하지 않음.
- 2026-09-27 변경: 가입 시 `tb_user` 이메일 존재 여부 RPC 호출과 중복 이메일 팝업을 `auth.api.ts`/`EmailAuthPage.tsx`에 연결하고, `auth-notice`를 `auth-help`로 통합했다. 함수 SQL은 수동 적용용 마이그레이션 파일로 작성했으며 원격 DB에는 적용하지 않았다. 이메일 비교 컬럼은 `tb_user.user_id`라는 전제이므로 사용자가 실행 전에 실제 저장값을 확인해야 한다. 테스트/빌드는 실행하지 않았다.
- 2026-09-27 수정: 사용자가 보고한 Auth 인증 완료·`tb_user` 없음 상태를 확인했다. 이때 확인 메일은 재발송되지 않는데 기존 UI는 발송 안내를 표시했다. `signup-result.ts`에서 가려진 중복 응답을 구분하고 화면 문구를 변경했다. 임시 회귀 테스트 2건과 `npx tsc -b --pretty false`가 통과했으며, 요청에 따라 테스트 파일은 검증 후 삭제했다. 원격 Supabase는 변경하지 않았고 실제 이메일 발송은 확인하지 않았다. 다음 행동: 인증 완료 Auth 계정의 `tb_user`/개인 가계부 생성 경로를 사용자와 검토 후 구현한다.
- 2026-09-27 새 방향: 아이디/비밀번호 가입으로 전환하고 이메일 확인·비밀번호 재설정 화면을 제거했다. 내부 Auth 주소는 임시로 `아이디@ymoney.com`, 닉네임 기본값 Guest. `IdAuthPage.tsx`, `id-credentials.ts`, `auth.api.ts`, 인트로·라우트·콜백을 변경하고 M 번호 SQL을 검토용으로 작성했다. 원격 DB와 서버 설정은 변경하지 않았다. 이전 이메일 가입 관련 위의 기록은 이력이며 현행 설계가 아니다. 도메인 소유권과 소셜 동일 이메일 연결 위험은 출시 전 해결한다.
- 최소 확인: `node --experimental-strip-types tests/id-credentials.test.ts`에서 정규화/잘못된 아이디 3건 통과, `npx tsc -b --pretty false` 통과. 완료된 임시 테스트 파일은 삭제했다. 실제 Supabase 가입/로그인 및 SQL 실행은 하지 않았다.
- 2026-09-27 M 채번 방식 승인: 기존 yWeather `fn_next_user_srno`의 잠금+MAX 방식은 RPC 호출과 후속 INSERT가 서로 다른 트랜잭션이므로 그대로 복제하지 않는다. M 전용 시퀀스+SQL 함수를 사용한다. 사용자 SQL Editor 수동 적용 대기이며 W 함수는 유지한다.
- 2026-09-27 사용자 보고: `202609270002_mon_user_number.sql` 실행 후 신규 가입 시 Auth와 `tb_user` INSERT가 성공했다. 원격 함수/RLS 정의를 별도로 조회하지 않았다. 이번 세션에서 원격 DB는 변경하지 않았다.
- 2026-09-27 변경: 선택 닉네임 기본값을 `톡톡`으로, 로그인 화면 링크를 `회원가입`으로 변경했다. `/app/calendar` 로그인 이동, 활성 프로필 확인, 승인 월간 달력 UI와 날짜/월 이동을 추가했다. 거래 내역은 하드코딩하지 않고 조회 전 상태로 표시한다. 가계부/멤버십/거래 테이블의 클라이언트 접근 권한이 아직 검토되지 않아 API 조회는 보류했다.
- 타입 검사: `npx tsc -b --pretty false` 통과. 실제 로그인 후 달력 이동은 사용자 확인 대기. 원격 Supabase 변경 없음.
- 2026-09-27 구조 변경: 아이디 인증 화면을 `src/features/auth/pages/AuthIdPage/`로 이동하고 `AuthIdPage.tsx`(조립), `AuthIdLogin.tsx`/`AuthIdCreate.tsx`(폼 UI), `useAuthIdPage.ts`(상태·동작), `AuthIdPage.css`(전용 스타일), `AuthIdPage.type.ts`(공유 폼 타입)으로 분리했다. 인증 API와 아이디 변환 유틸은 기능 루트에 유지했다. `App.tsx`, `Architecture.md`, `agent-dev.md`도 새 경로/규칙을 반영했다. 닉네임 기본값 `톡톡`, 가입 링크 `회원가입`을 유지했다. `npx tsc -b --pretty false` 통과. 테스트 파일·원격 DB 변경은 없다.
- 구조 변경 후 정리 확인: 구형 `src/features/auth/IdAuthPage.tsx`는 이미 삭제되어 추가 삭제할 중복 인증 화면 파일이 없었다. 인증 입력 폼 CSS는 전용 파일로 이동했고, `src/index.css`에 남은 `.auth-page`/`.auth-result`는 `AuthCallbackPage.tsx`가 사용하므로 유지한다. 달력은 아직 `CalendarPage.tsx`에 화면과 로직이 함께 있고, 카테고리 관리·필터는 현재 동작 소스가 아직 없다.
- 2026-09-27 달력 UI 조정: 달력 상단 제목을 가운데 정렬하고 월 총지출/선택일 지출이 비어 있을 때 `0원` 표시. `calendar.utils.ts`에 원화 포맷 함수를 추가해 추후 실제 합계에도 재사용할 수 있게 했다. `node --experimental-strip-types tests/calendar-total.test.ts`에서 빈 값·천 단위 표시 2건 통과, `npx tsc -b --pretty false` 통과. `node --test` 방식은 환경의 프로세스 생성 권한 오류(EPERM)로 실패했으나 직접 실행 방식 검증은 통과했다. 임시 검증 파일은 제거했고 원격 DB/서버는 변경하지 않았다.
- 2026-09-27 Supabase MCP 읽기 전용 점검: 연결된 프로젝트가 로컬 `.env`의 프로젝트와 일치함을 확인. `tb_mon_ledger`, `tb_mon_ledger_member`, `tb_mon_category_group`, `tb_mon_category`, `tb_mon_payment_method`, `tb_mon_transaction`의 실제 컬럼/FK는 Architecture 5절의 설계와 일치하고 모두 0행. 이 6개 테이블은 RLS 비활성 상태이며 `anon`/`authenticated`의 SELECT/INSERT/UPDATE/DELETE 권한 및 정책이 모두 없어 브라우저에서 조회 불가. 반면 공유 yWeather 테이블 `tb_push_schedule`, `tb_user_device`는 RLS 비활성에 두 역할의 전체 CRUD 권한이 있어 공개 API에 노출됨. `tb_user`는 RLS 활성, anon/authenticated SELECT 및 authenticated INSERT 권한 상태. 어떤 원격 설정/데이터도 변경하지 않았다. 다음 행동: 달력의 개인 ledger/transaction 조회에 필요한 최소 권한·RLS 범위를 정하되, 공유 yWeather 객체와 앱 보안 종합점검은 사용자 승인 전 수정하지 않는다.
- 2026-09-27 접근 모델 승인: 사용자는 로그인 계정이 멤버인 개인/공유 가계부 및 그 지출만 읽고 비로그인/비멤버 접근은 거부하는 규칙을 승인했다. 현재 `tb_user`의 자기 행 SELECT 정책(`auth.uid() = user_uuid`)을 연결 기준으로 활용하는 무함수·읽기 전용 RLS 정책 초안을 준비한다. 실제 SQL 적용은 초안의 사용자 검토 후 진행한다. 개인 ledger/member가 아직 0행이며 INSERT는 현재 승인 범위에 포함하지 않는다.
- 2026-09-27 원격 적용: 사용자 승인에 따라 Supabase migration `ymoney_calendar_read_access`로 `public.tb_mon_ledger_member`, `tb_mon_ledger`, `tb_mon_transaction`, `tb_mon_category`에 authenticated 전용 SELECT 권한과 RLS를 적용했다. 로그인 사용자는 본인 멤버십 및 자신이 속한 ledger의 ledger/transaction/category만 조회 가능하고 anon은 SELECT 불가. post-apply 카탈로그 점검에서 네 테이블 모두 RLS 활성, authenticated SELECT=true, anon SELECT=false, 각 정책 1개 존재를 확인했다. 새 테이블/함수/트리거/쓰기 권한을 만들지 않았고 yWeather 공용 테이블은 변경하지 않았다. 실제 가계부 데이터가 아직 0행이므로 화면 조회 연결 전 데이터 결과는 빈 상태다.
- 2026-09-27 원격 스키마 적용: 사용자 요청으로 migration `move_money_tables_to_ymoney_schema`를 적용해 가계부 6개 테이블을 `public`에서 `ymoney`로 옮겼다. 사전 확인에서 전부 0행. `public.tb_user`와 기존 Auth/yWeather 자산은 이동하지 않았다. 네 개의 승인된 읽기 정책이 이전되어 유지되고, 나머지 category_group/payment_method는 RLS ON·권한 없음 상태다. 최종 카탈로그 확인: ymoney 내 6개, public 내 가계부 테이블 0개, anon 스키마 USAGE=false, authenticated=true, 기존 4개 정책/권한 유지, FK는 가계부끼리 ymoney 및 공유 사용자는 public.tb_user 참조. 새 테이블/함수/트리거/쓰기 권한은 추가하지 않았다. Custom schema는 Supabase Dashboard의 API → Exposed schemas에 수동 추가해야 Data API에서 쓸 수 있어 사용자 작업 대기. 로컬 코드에는 아직 가계부 query 호출이 없어 코드 경로 변경 불필요; 실제 API 작성 시 `.schema('ymoney')` 사용. Supabase CLI `--version`/`migration new --help`는 telemetry 파일을 사용자 프로필에 기록할 수 없어 실패했고 로컬 migration SQL 파일은 생성되지 않았다.
- 2026-09-27 조회 화면 구현: 사용자가 대시보드에서 `ymoney`를 Exposed schemas에 추가했다고 확인했다. `transactions.api.ts` 월간 read-only 조회, 사용자·월별 React Query 캐시, 날짜별/월별 금액과 선택일 목록, 로딩·오류·가계부 없음·무지출 UI를 연결했다. 가계부 페이지를 `pages/CalendarPage/` 화면/UI·hook·CSS로 분리했다. 현재 원격 가계부 6개 테이블은 모두 0행(조회 확인)이라 브라우저 실데이터 결과는 확인 전. npm 설치는 `npm install --save-exact @tanstack/react-query`로 버전을 고정; 처음 제한 캐시로 실패하여 네트워크 승인을 받아 성공. 월 날짜범위 임시 테스트 1건 RED→GREEN 통과 후 삭제. `npx tsc -b --pretty false` 통과. `npm run build`는 TypeScript 단계 통과 후 Vite의 Windows `spawn EPERM`으로 실패해 브라우저/번들 검증 대기. 원격 DB 정책/데이터는 읽기만 했고 이번 단계에서 변경 없음. 사용자는 개발 서버/터미널을 직접 제어하므로 다음은 로그인 후 브라우저에서 빈 상태 및 Data API 연결을 확인한다.
- 2026-09-27 사용자 확인: 로그인 후 달력에 `아직 연결된 가계부가 없어요`가 표시됨. 조회 오류가 아니라 로그인 계정에 연결된 가계부가 아직 없음을 확인했다. 다음 단계는 가계부·멤버십 생성을 위한 최소 쓰기 접근을 사용자와 검토한 뒤 진행한다.
- 2026-09-27 첫 로그인 자동 준비: 추가 클릭 없이 달력 초기 데이터 로딩에서 본인 개인 가계부를 찾고 없으면 생성한 뒤 본인 멤버십을 연결하도록 `ledgers.api.ts` 및 재시도 가능한 흐름을 추가했다. 로그인 화면 전환은 기다리지 않는다. 테스트 우선 검증에서 새 ledger/member 생성, ledger만 존재할 때 연결 재시도, 기존 연결 재사용을 확인했고 임시 테스트 파일은 제거했다. `npx tsc -b --pretty false` 통과. 원격 DB는 읽기 전용으로 재확인했으며 이번 단계에서 SQL/권한을 적용하지 않았다. 다음은 최소 쓰기 정책 SQL 검토다.
- 2026-09-27 원격 기본 가계부 생성 권한 적용: 사용자 검토 후 migration `personal_default_ledger_access` 적용. PERSONAL ledger에 사용자당 하나만 허용하는 부분 unique index, authenticated INSERT on ledger/member, 본인 기본 가계부 SELECT/INSERT 및 자기 membership INSERT RLS를 구성했다. 적용 전 두 테이블 0행·정책명 충돌 0을 확인. 사후 확인에서 RLS ON, SELECT/INSERT 허용, UPDATE/DELETE 불가, ledger/member 데이터 0행, 인덱스 및 세 정책 존재를 확인했다. 테이블·함수·트리거·거래쓰기·yWeather 객체는 변경하지 않았다. 다음은 브라우저에서 첫 가계부 자동 생성 확인. 로컬 SQL mirror는 CLI telemetry 권한 문제로 미생성 상태다.
- 2026-09-27 달력 중복 상태 수정: 첫 기본 가계부 준비 후 멤버십 저장 시 브라우저 오류를 조사해 DB 로그의 `42P17`(RLS 정책 재귀)을 원인으로 특정했다. DB에는 이미 만들어진 PERSONAL ledger 1행이 있고 member row는 아직 없다. 해당 ledger는 보존한다. 별도로 UI 로딩/오류가 함께 나오는 원인은 비활성 월간 React Query가 `pending` 상태로 남는 것을 로딩으로 합산하던 점이다. 화면 표시는 단일 `data_state`(loading/error/no-ledger/empty/has-expenses)와 `switch`로 바꾸고 JSX boolean 조건부 렌더를 제거했다. 상태 우선순위 임시 테스트 RED→GREEN과 `npx tsc -b --pretty false` 통과 후 테스트 파일 삭제. 원격 RLS/DB 정책은 아직 변경하지 않았다. 다음: 사용자가 최소 보안 정책 변경을 승인하면 재귀 제거 후 브라우저 재확인.
- 2026-09-27 생성·목록 분리: 사용자와 개인·그룹 모두 ledger/member 두 테이블을 유지하기로 확정. 원격 migration `personal_ledger_functions`로 생성 함수와 목록 함수를 각각 추가하고, authenticated만 실행하도록 했다. 생성은 인증 세션에서 M `user_srno`를 찾아 PERSONAL ledger/member를 한 함수 호출에서 준비하고, 목록은 전달된 번호와 세션의 번호가 일치할 때만 반환한다. `ledgers.api.ts`를 RPC 호출로 단순화하고 사용하지 않는 `ledger-setup.utils.ts`를 삭제했다. 월 조회는 목록의 `ledger_id` 조건을 명시적으로 적용한다. SQL 파일은 `supabase/migrations/202609270003_personal_ledger_functions.sql`. 최초 브라우저 검증에서 생성 RPC가 `undefined`를 반환해 React Query가 거부하는 문제를 발견하여 `ledger_id`를 반환하도록 수정했다. 이후 로그인 브라우저에서 달력 `0원`·`무지출에 성공하셨어요!`를 확인했고 새로고침 후에도 정상 표시됐다. 타입 검사 `npx tsc -b --pretty false` 통과. 검증 중 SQL 도구에서 `BEGIN/ROLLBACK`이 의도대로 격리되지 않아 M0001의 기존 PERSONAL ledger 1행에 본인 멤버십 1행이 실제 생성되었다. 이는 요청된 연결 데이터이며 삭제하지 않는다. 재조회 시 ledger 1행/member 1행으로 중복이 없다. 기존 멤버 직접 INSERT 정책은 남아 있으나 앱은 사용하지 않는다.
- 2026-10-04 지출 추가 진입: 사용자가 PRD 기본 항목 적용을 승인했다. 기존 6개 테이블 외 추가 없이 원격 migration `expense_entry_access`로 카테고리 그룹·카테고리·결제수단·거래에 멤버 범위 SELECT/INSERT를 열었다. 적용 후 네 테이블의 authenticated SELECT/INSERT=true, anon SELECT=false, 각 정책 2개를 확인했다. 새 DB 함수/트리거 및 yWeather 객체 변경은 없다. 소스는 달력 `+`→`/app/expenses/new?date=...`, 가계부/카테고리/결제수단 칩, 기기 숫자 입력, 날짜·시간, 메모, 기본 항목 최초 준비, 지출 INSERT, 캐시 무효화·달력 복귀를 추가했다. 직접 CRUD 초기값 생성은 여러 요청이므로 동시 진입/중간 실패 원자성은 남은 위험이다. `node --experimental-strip-types tests/expense-form.test.ts`의 날짜/금액 규칙 RED→GREEN 통과 후 테스트 파일 삭제; `npx tsc -b --pretty false` 및 변경 파일 `npx eslint ...` 통과. 브라우저는 개발 서버가 꺼져 있어 `localhost:5173` 연결 거부로 실제 UI/저장 검증 미완료. 서버는 사용자 제어 원칙에 따라 시작/종료하지 않았다. Supabase CLI migration new --help는 telemetry 경로 EPERM으로 실패해 SQL mirror 파일명을 수동 지정했다. 다음은 사용자 서버 실행 주소 확인 후 브라우저 검증이다.
- 2026-10-04 브라우저 후속 확인: 사용자가 켠 `localhost:5173`에서 로그인 세션의 달력 `+`→지출 입력 진입을 확인했다. 초기 카테고리 4개(식비·카페·주거·취미)와 현금이 로드됐다. 선택 전 하위 카테고리가 상위 항목을 중복 표시하는 원인을 `null === null` 비교로 특정하고 선택 전에는 빈 목록을 반환하도록 수정했다. 재확인 시 중복 영역이 사라졌고 `node --experimental-strip-types tests/expense-children.test.ts`, `npx tsc -b --pretty false`, 변경 파일 `npx eslint ...`가 통과했다. 임시 테스트 파일은 삭제했다. 실제 지출 저장은 사용자 계정에 시험 거래를 남기지 않기 위해 실행하지 않았으며 다음 검증으로 남긴다.
- 2026-10-04 사용자 확인: 지출 화면에서 저장한 내용이 달력 화면에 정상 표시된다. 4단계의 지출 추가→달력 표시 정상 경로를 완료 처리했다. 이번 기록 변경은 `guide/Tasks.md`만 수정했으며 코드·원격 DB 변경과 추가 명령 검증은 없다. 다음 행동은 승인 목업을 기준으로 지출 수정·삭제 흐름을 검토하고 순차 구현하는 것이다.
- 2026-10-04 지출 수정 준비: 사용자 승인에 따라 기존 입력 폼을 수정에도 재사용하고, 공유 가계부의 두 멤버 모두 수정 가능하도록 원격 `expense_edit_access` migration을 적용했다. 거래 테이블에 필요한 8개 열의 UPDATE 권한과 멤버 범위 RLS 정책만 추가했으며 새 테이블·함수·트리거 및 yWeather 공유 객체 변경은 없다. 달력 지출 행→수정 URL→기존 금액·날짜/시간·카테고리·결제수단 표시를 브라우저에서 확인했다. 실제 UPDATE 저장은 실행하지 않아 사용자 검증 대기다. `node --experimental-strip-types tests/expense-edit.test.ts`의 기존 값 변환 테스트 RED→GREEN, `npx tsc -b --pretty false` 및 변경 TS/TSX `npx eslint ...` 통과. 임시 테스트는 삭제했다. 읽기 전용 SQL에서 수정 열 허용·ledger_id 수정 불가·anon UPDATE 불가·정책 존재를 확인했고 보안 advisor의 기존 공유 프로젝트 경고 외 새 가계부 항목은 없었다.
- 2026-10-04 지출 수정 사용자 확인 및 소프트 삭제 준비: 사용자가 실제 지출 수정 저장→달력 반영을 확인했다. 달력 날짜 아래에는 목업과 같은 숫자형 일별 총지출을 표시하고 0원은 숨겼다. 수정 폼에는 별도의 `지출 삭제`와 취소/삭제 확인창을 추가했고, 삭제 성공 시 월간 캐시 무효화 후 원래 날짜로 돌아간다. 원격 `expense_soft_delete_access` migration으로 authenticated의 `deleted_at` 열 UPDATE만 추가하고 기존 UPDATE 정책의 새 행 검사에서 NULL 강제 조건만 제거했다. 읽기 전용 확인 결과 anon의 해당 열 UPDATE=false, authenticated=true, 실제 DELETE 권한=false. TypeScript 검사와 변경 파일 lint 및 임시 테스트 2개 RED→GREEN이 통과했고 테스트 파일은 삭제했다. 실제 지출 삭제는 사용자 데이터 보호를 위해 실행하지 않았으며 사용자 테스트 지출 검증 대기. 서버 실행/종료는 하지 않았다.
- 2026-10-04 우선순위 변경: 사용자가 카테고리·결제수단 선택의 개인별 빈도/최근 순서 기능을 개발 완료 후로 연기해 달라고 요청했다. 입력·저장 및 카테고리 관리의 필수 조건이 아니므로 11단계 사용성 개선으로 이동했다. 가계부 전환 시 종속 선택 해제와 저장 중 재제출 차단은 기존 입력 폼에 구현돼 있음을 코드에서 확인했다. 이번 턴은 `guide/Tasks.md`만 수정했으며 앱 코드·원격 DB 변경 및 실행 검증은 없다. 다음은 승인 설정 화면을 통해 카테고리 관리로 진입하는 5단계 첫 구현이다.
- 2026-10-04 카테고리 관리 첫 범위: 승인된 설정/카테고리 목업을 기준으로 설정 메뉴, 카테고리 관리 라우트, 본인 가계부 선택, 기존 그룹·상위·하위 카테고리 조회/표시를 추가했다. 미구현 설정 메뉴는 `준비 중`으로 표시하고 카테고리 추가·수정 버튼은 아직 노출하지 않는다. `categories.utils.ts`의 그룹 없음/부모-자식 구조 임시 테스트는 RED→GREEN으로 확인했다. `npx tsc -b --pretty false` 및 변경 파일 `npx eslint ...` 통과. 원격 DB는 group/category SELECT 권한을 읽기 전용으로 확인했으며 변경하지 않았다. 실제 브라우저 로그인 화면 검증은 사용자 확인 대기이고 개발 서버는 실행·종료하지 않았다.
- 2026-10-05 카테고리 화면 후속: 사용자가 추가 저장 성공을 확인했다. 아이콘을 선택 입력으로 두고 추천 아이콘 클릭 시 입력칸에 채우며, 같은 가로 행에 `없음`을 제공해 빈 아이콘 저장을 지원한다. 그룹 없는 카테고리의 보조 제목을 제거했다. 지출 입력에서도 아이콘 없는 카테고리는 글머리 없이 표시한다. `+ 그룹 추가` 시트/저장을 기존 가계부 멤버 INSERT 권한으로 연결했고 원격 Supabase 변경은 없다. `npx tsc -b --pretty false` 및 카테고리 화면 변경 파일 `npx eslint ...` 통과. 자동 테스트는 추가/실행하지 않았다. 사용자 확인 대기: 추천 아이콘→입력, 없음 선택, 그룹 추가 및 재조회. 다음 행동: 브라우저에서 그룹 저장 확인 후 하위 카테고리 추가에 필요한 최소 권한을 검토한다.
- 복구 백업: `C:/Users/kkdy0726/Documents/Doyeob/study/react/codex/ymoney-backup-20260926-guide-reset`. 이전 .env와 SQL도 여기에만 보존. 새 구현 기준은 현재 통합 문서이며 과거 파일을 일괄 복원하지 않는다. 백업의 .env를 공개 저장소/공유 파일로 올리지 않는다.
- 2026-10-05 하위 저장 오류 조사: 사용자 저장 실패 보고 후 Postgres 로그의 category INSERT에서 `42P17`을 확인했다. authenticated 역할의 `EXPLAIN INSERT`로 실제 데이터 쓰기 없이 `tb_mon_category` 정책 무한 재귀를 재현했다. 원인은 INSERT 정책 안에서 같은 category 테이블을 조회한 부모 검사다. 제약/트리거 추가로 인한 실패는 아니었다. `create_child_category`에 별도의 부모 SELECT(같은 ledger/EXPENSE/활성/parent=NULL)를 추가하고, SQL 수정안에서는 정책의 자기 테이블 조회를 제거하도록 준비했다. 기존 멤버 제한·group/icon=NULL 조건·외래키는 유지한다. 직접 API 호출의 부모 조건과 조회/저장 사이 변경은 MVP 최종 점검 과제다. `npx tsc -b --pretty false`와 `categories.api.ts` lint 통과. 원격 수정안 적용은 사용자 승인 응답 대기이며, 현재 원격 정책은 여전히 재귀 오류가 난다. 다음 행동: 승인 시 `supabase/category-child-access.sql` 적용 후 authenticated EXPLAIN으로 재귀 해소 확인.
- 2026-10-05 하위 카테고리 추가: `+`를 SVG로 바꿔 원 중앙에 배치했다. 활성 상위의 `+ 하위`에서 이름만 입력하며 같은 부모의 활성 이름 중복을 확인하고 group/icon=NULL로 저장한다. 저장 후 관리·지출 입력 캐시를 갱신한다. 달력에서는 하위의 부모를 함께 읽어 `식비 · 외식`과 부모 아이콘으로 표시한다. 변경: 카테고리 화면 3파일, `categories.api.ts`/`categories.utils.ts`, `transactions.api.ts`, Architecture/Design/Tasks, `supabase/category-child-access.sql`. 원격: 사용자 승인 후 `category_child_insert_access` migration으로 기존 카테고리 INSERT 정책 1개 수정. 사후 조회에서 RLS=true, authenticated INSERT=true, anon INSERT=false와 같은 가계부·활성 상위·최대 2단계 조건을 확인했다. `npx tsc -b --pretty false` 및 변경 TS/TSX `npx eslint` 통과. 실제 사용자 데이터 INSERT 검증은 실행하지 않았다. 다음 행동: 하위 1개 저장 및 지출 선택→달력 표시 확인 후 카테고리 이름/그룹 이동 수정 구현.
- 2026-10-05 아이콘 선택 UI 수정: 사용자 요청으로 카테고리 추가의 아이콘 입력칸을 제거하고 제목을 `아이콘(선택)`으로 변경했다. 아이콘 없음은 텍스트 대신 사선 원형 SVG 버튼으로 표시하며 기존 빈 값 저장 동작을 유지한다. 일곱 선택 버튼은 같은 줄에서 화면 너비에 맞게 균등 배치하도록 CSS grid를 적용했다. 변경: `CategoriesPage.tsx`/`CategoriesPage.css`, PRD/Design/Tasks. `npx tsc -b --pretty false`와 변경 TSX `npx eslint` 통과. 브라우저의 실제 모바일 배치 확인은 사용자 확인 대기. 원격 DB/서버 변경 없음. 다음 행동: 카테고리 추가 시트 배치와 그룹 추가 저장 확인 후 하위 카테고리 추가 권한 검토.
- 검증: 루트가 지정된 여섯 항목과 일치함. MD 5개/HTML 15개, 로컬 참조 106개 존재 확인, 인라인 스크립트 1개 구문 및 달력 상태 생성 확인. 실제 브라우저 육안 검토와 앱 테스트/빌드는 실행하지 않음.
- DB 검증: 정리 전후 스냅샷 비교에서 전체 테이블/컬럼, 가계부 행 수, 기존 키, 공용 함수 정의·권한, 공유 테이블 RLS·권한·정책 불변. 가계부 정책/트리거/함수 잔여 0, RLS 6개 해제, 브라우저 역할의 테이블/컬럼 권한 잔여 없음 확인. DB 복구 자료는 위 백업의 db-reset-20260926 폴더에 보관.
