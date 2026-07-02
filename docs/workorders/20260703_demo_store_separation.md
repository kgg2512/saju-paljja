# 작업지시서 — 사주팔자 데모/스토어 물리 분리 (데모 신설)

- **날짜:** 2026-07-03
- **작성:** Alpha (G2 임원)
- **레인:** 신규 데모 파일 신설(중형+) + 🔒 결제 인접(스토어 무접촉 강제) → 독립 검증 필수
- **대상 레포:** `kgg2512/saju-paljja` — **기준 브랜치 `main`** (master 아님, 이 레포만 예외)
- **로컬:** `c:\Users\kgg25\Desktop\saju-paljja`

---

## 1. 회장 요청 원문 (그대로 인용)

> "사주팔자는 ... 특별히 어떤 로그인을 하지 않아도(로그인을 해도 되지만) 결제만 바로 진행하면, 바로 본인의 사주팔자를 입력하면 곧이 곧대로 바로 본인의 사주팔자를 해석하고 풀이하고, 해설해주는 그런 시스템이다. 지금 결제 시스템은 해결이 되었는데, 이 또한 [데모] 버전이랑 [스토어]버전(즉 실제로 구현 버전)을 구별해야 한다. 즉 내가 하는 말은 투자자들 또는 다른 사람들에게 간단하게 보여주고 싶어하는 [데모]버전과 실제로 구현 및 기능들을 구동하려는 [스토어]버전을 명확하게 구별하고 분리해야 한다는 점이다."

## 2. 진단 요약 (격리 탐색 2026-07-03)

- **데모 버전 = 아예 없음** [확인]. `demo`/`isDemoMode`/`mock`/`bypass` 전 레포 grep 0건. 스토어(실결제→실AI) 단일 서비스만 존재.
- **스토어 = 이미 클린·단일 경로** [확인]:
  - 활성 백엔드 `markets/web/worker/index.js` — Creem 결제 + OpenAI 실AI. 라우터(732~735행): `/api/checkout`, `/api/fortune`, `/api/health`, `/webhook/line`.
  - 프론트 `markets/web/app.html` — 준비중 게이트(1362·1424행, `WORKER_URL === 'REPLACE_WITH_WORKER_URL'`), 6로케일.
  - 배포 사본 `docs/app.html` (GitHub Pages용, legal 링크 상대경로만 차이).
  - 결제 우회 경로 없음: `handleFortune`이 `sessionId` → KV → Creem 검증(paid) 전부 통과해야만 AI 호출.
- **위험한 데모 후보** [확인]: `markets/japan/FREE_TRIAL_UX_SPEC.md`가 무료 미리보기를 *"같은 app.html에 `data-mode="free|paid"` 토글 + 같은 worker에 엔드포인트 추가"*로 설계 → **이대로 구현하면 신데렐라식 엉킴 재발.** 이 방침을 뒤집는 것이 이 지시서의 핵심.

## 3. 결정된 방식 = 별도 데모 파일 신설 (스토어 무접촉)

데모를 **스토어와 완전히 별개인 정적 파일**로 신설한다. 데모는 결제·worker·실AI 호출이 **0**이고, 사주 입력 → 미리 준비된 **샘플 풀이**를 보여주는 자기완결 페이지다. 스토어(`app.html`·worker·wrangler·`docs/app.html`)는 **한 줄도 건드리지 않는다.** UI는 app.html을 재현해 투자자에게 실제처럼 보이되, 결제 게이트와 AI fetch만 샘플로 대체한다.

- 채택 이유: 사주는 결제·코어 엔진이 민감(🔒). 스토어를 건드리면 결제 검증·CISO 불변식이 깨질 위험 → 데모는 스토어에 손대지 않는 **별도 파일**이 유일하게 안전. `data-mode` 토글(같은 파일 공존)은 회장이 겪은 엉킴을 재생산하므로 기각.

## 4. 완료 기준 (테스트 가능 체크리스트)

- [ ] **D1. 신규 데모 파일** `markets/web/demo.html` (경로는 g2-cto 판단 가능, 단 스토어 파일과 물리 분리) — `app.html` UI를 재현하되 결제 게이트(`WORKER_URL`/checkout)·worker fetch(`/api/fortune` 등) **전부 제거**. 자기완결(백엔드 호출 0).
- [ ] **D2. 데모 흐름** — 사주 입력 폼 → "풀이 보기" → **미리 준비된 샘플 풀이** 표시(정적 데이터, 실 AI/결제 0). 최소 1개 완성된 그럴듯한 샘플(예시 생년월일 → 성격·운세 풀이). app.html의 실제 결과 화면 구조를 재현.
- [ ] **D3. 데모 명시 배지** — 화면에 "데모 / 샘플" 명시(투자자가 실서비스로 오인 방지, 실제 결제·개인 사주 아님 고지).
- [ ] **D4. 스토어 무접촉 (핵심 게이트)** — `git diff`에서 `markets/web/app.html`·`docs/app.html`·`markets/web/worker/**`·`markets/web/worker/wrangler.toml`·`shared/saju-engine/**` **변경 0**. 데모는 **신규 파일 추가**로만 존재.
- [ ] **D5. 방침 문서 갱신** — `markets/japan/FREE_TRIAL_UX_SPEC.md`의 "같은 app.html data-mode 토글 + 같은 worker 엔드포인트" 방침을 **"별도 데모 파일(demo.html), 스토어 무접촉"** 방침으로 갱신(문서만).
- [ ] **D6. 브라우저 검증 (증빙)** — demo.html 로컬 실행 → 입력→샘플 풀이 렌더, **콘솔 에러 0**, **네트워크에 worker/결제/외부 fetch 0건**(개발자도구 또는 grep으로 fetch 부재 확인). 스크린샷.
- [ ] **D7. 배포 보류** — 실제 배포는 하지 않음(회장 결정). 데모 파일 위치·배포 방법(정적이라 Pages 또는 별도 경로)만 문서에 1문단 기록.

## 5. 제약

- **스토어 절대 무접촉**: `app.html`, `docs/app.html`, `markets/web/worker/**`, `wrangler.toml`, `shared/saju-engine/**`. 결제 검증·CISO 불변식·Creem 로직 보호. 데모는 오직 신규 파일 추가.
- **브랜치 `main`**. 완료 후 `git add`(신규 데모 파일 + FREE_TRIAL_UX_SPEC만 스테이징, 무관 파일 금지) `&& git commit && git push origin main`. **push 없이 완료 보고 금지.**
- 데모는 자기완결 정적(백엔드·API 키·외부 호출 0). 실 개인정보 수집 0.

## 6. 도메인 주입 (§1.5 매트릭스)

- **모든 코딩(공통):** CTO + CSO.
- **결제·구독:** CISO + CLO + CFO → 이 작업에서는 **"데모가 결제/스토어를 건드리지 않음"을 D4 diff 0으로 증명**하는 것으로 충족(데모는 결제 기능 자체를 배제).
- **신규 UI:** CDO — 데모 화면이 실제 흐름을 설득력 있게 재현.
- **개인정보:** 데모는 입력을 서버로 보내지 않음(로컬 표시만) → 수집 0 명시.

## 7. 검증 게이트

- 구현자(g2-cto): D1~D7 구현 + 증빙(git diff, 브라우저 콘솔/네트워크, 스크린샷)을 이 파일 "변경 내역"에 append.
- 독립 검증(Alpha가 투입): **D4(스토어 무접촉 diff 0)**·**D6(worker/결제 호출 0)**이 핵심 게이트 — 독립 재확인.
- FAIL 시 evaluator 루프(PASS까지). 같은 실패 2회 → 접근법 변경.

---

## 변경 내역 (구현자 append)

### 2026-07-03 · g2-cto 구현 완료

**방식:** `markets/web/app.html`을 물리 복사(`cp`) → `markets/web/demo.html` 신설 → 결제·worker fetch 코드만 제거하고 정적 샘플로 직행. UI 100% 재현, 엔진 로직 복제 0, 스토어 무접촉. (ponytail lite)

**신규 파일:** `markets/web/demo.html` (1620행). 신규 외 스토어 파일 변경 0.

**demo.html에서 제거/교체한 결제·worker 지점:**
- 외부 폰트 CDN(`fonts.googleapis.com`) 링크 2줄 + `window.WORKER_URL` 주입 → 제거(자기완결 정적)
- `payment-cta-btn` → `fetch(/api/checkout)` 핸들러 통째 제거
- `handlePaymentReturn()` → `fetch(/api/fortune)` 함수 통째 제거
- `initApp`의 `payment=success` 리턴 분기 제거
- 폼 제출: `showScreen('screen-payment')` → `showDemoResult()` (결제 건너뛰고 정적 샘플 직행)
- 추가: `DEMO_SAMPLES`(saju/compatibility 정적) + `showDemoResult()`
- 데모 배지: viral-bar·hero-badge·폼 CTA(`デモ鑑定を見る`)·결과 상단 배너·title

**완료 기준 검증 결과:**

| 항목 | 결과 | 증빙 |
|---|---|---|
| D1 신규 demo.html(결제·worker fetch 0) | PASS | `grep 'fetch(\|WORKER_URL\|/api/\|checkout\|handlePaymentReturn\|fonts.googleapis'` → 0건(무해한 주석 1줄만) |
| D2 입력→샘플 풀이(최소 1개) | PASS | saju: 四柱4기둥+五行+大運6칸+3섹션(性格/才能/今年の運勢). 궁합: 82/100★★★★☆+텍스트. 브라우저 실렌더 확인 |
| D3 데모/샘플 명시 배지 | PASS | 메뉴 viral-bar·hero-badge, 폼 CTA, 결과 배너「実際のAI鑑定・決済・個人情報の送信は行われません」 |
| D4 스토어 무접촉(핵심) | PASS | `git diff --stat`에 app.html·docs/app.html·worker/**·wrangler.toml·shared/** 변경 0. demo.html은 신규 untracked |
| D5 FREE_TRIAL_UX_SPEC 방침 갱신 | PASS | 상단에 방침 전환 노트 추가(data-mode 토글 → 별도 demo.html·스토어 무접촉) |
| D6 브라우저 검증(콘솔0·fetch0) | PASS | Playwright 실행. JS 로직 콘솔 에러 0(favicon.ico 404만 — 브라우저 자동요청·앱 무관). 네트워크 요청 = `GET /demo.html` 1건뿐, worker/결제/외부/폰트 0건. 스크린샷 2매(saju·궁합) 촬영·시각 확인, 세션 scratchpad 보관 |
| D7 배포 보류·방법 문서화 | PASS | 아래 기록. 실배포 미실시 |

**D7 배포 위치·방법 (보류 — 실배포 미실시):** demo.html은 외부 호출 0의 자기완결 정적 파일이라 GitHub Pages로 그대로 서빙 가능. 스토어 배포 사본이 `docs/app.html`인 것과 동일하게, 배포 시 `docs/demo.html`로 복사하면 `<Pages도메인>/demo.html`로 접근. legal 링크는 상대경로(`../japan/legal/…`)라 `docs/` 배포 시 경로 재확인 필요(스토어 app.html과 동일 이슈). **회장 결정 전까지 배포하지 않음.**

**미해결·리스크:** 없음. 데모는 정적이라 회귀 위험 0. 메뉴 카드의 `¥500` 가격 표시는 투자자에게 실상품 화면을 보이기 위해 의도적으로 유지(데모임은 배지·배너·CTA 문구로 명시).

## 독립 검증 (Alpha/QA append)

### 2026-07-03 · 별도 컨텍스트 독립 재검증 (CAE g2-auditor)

> CAE 감사 지적 보완: 당초 Alpha가 같은 세션 컨텍스트에서 셀프 채점한 것은 절차 미달(MyFit은 g2-qa-tester 별도 컨텍스트 사용). 아래는 **별도 컨텍스트(g2-auditor)** 가 D4·D6를 독립 재실행한 결과 — SSOT에 기재.

| 항목 | 별도 컨텍스트 재실행 | 결과 |
|---|---|---|
| **D4 스토어 무접촉** | g2-auditor `git show --stat 710e604` 재실행 | 변경 = demo.html(신규)+작업지시서(신규)+FREE_TRIAL_UX_SPEC.md(문서)뿐. `app.html`·`docs/app.html`·`worker/**`·`wrangler.toml`·`shared/**` 변경 **0**. **claim 일치 → PASS** |
| **D6 외부 호출 0** | g2-auditor demo.html grep(fetch/worker/api/checkout/creem) 재실행 | **0건**. **claim 일치 → PASS** |

**가격 표기(¥500) CLO 판단 (감사 지적② 보완):** 데모는 실거래·실결제 없음(결과 배너「実際のAI鑑定・決済・個人情報の送信は行われません」+ 다중 데모 배지) → 표시광고 오인 소지 낮음. **단 실배포 시** demo.html 가격 옆 "サンプル・実際の価格ではありません" 명시 + g2-clo 소환 재확인 권장. 현재 미배포라 실위험 0.

**종합:** D4·D6 별도 컨텍스트 독립검증 PASS. 절차 보완 완료.
