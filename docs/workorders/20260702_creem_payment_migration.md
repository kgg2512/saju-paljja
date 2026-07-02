# 작업지시서 — 사주팔자 Stripe→Creem 결제 마이그레이션 (골모드 일차완성)

> **단일 진실 원천.** Alpha 작성 → g2-cto(코드)·g2-clo(법률문구)·QA가 같은 파일에 append.
> **작성:** 2026-07-02 Alpha · **레포:** kgg2512/saju-paljja (브랜치 **main**) · **로컬:** `C:\Users\kgg25\Desktop\saju-paljja`

---

## 0. 회장 요청 원문 (그대로 인용)

> "현재 MoR Creem이 가허락은 해줬거든? 이제는 미런칭이라서 [서비스 준비 중]이라고 막아놨었던 부분이야. 그런데 이제 MoR 부분이 풀렸으니까, 이제 그 추후에 결제 부분까지도 이어져도 된다. 이제 [골모드]를 활용해서 추후에 블로킹하고 있던 부분들을 업그레이드 하고 사주팔자 프로젝트를 일차적으로 완성을 시켜라"

**해석:** Creem이 사주 콘텐츠를 **사전승인(AUP 통과, 06-26 커밋 실증)**. 이전 세션이 "서비스 준비 중" 가드로 막아둔 결제를 이제 **Stripe→Creem으로 코드 전환**하여 배포준비완료 상태까지 끌어올린다. 골모드 = 풀 검증 게이트.

## 0.1 냉정한 경계 (진짜 벽 = 회장 자격증명, 헌법 § 에스컬레이션 ①)

**이 작업이 완성하는 것:** 코드·법률·배포 스크립트를 Creem 100% 준비완료 + 검증 → 회장이 Creem 온보딩만 끝내면 "단 1회 배포"로 라이브.
**회장만 가능(코드 밖):** ①Creem 스토어 생성 ②KYB/KYC+한국은행 심사(24~48h) ③라이브 `CREEM_API_KEY` ④product 생성 후 `prod_id`. → **이 4개는 실행자가 하지 않는다. placeholder/env로 주입점만 만든다.**

---

## 1. 검증 가능한 완료 기준 (criteria-first — 작업 전 확정, QA가 항목별 채점)

### A. 백엔드 Worker (`markets/web/worker/index.js`)
- [ ] A1. `handleCheckout`이 Stripe가 아닌 **Creem** `POST {BASE}/v1/checkouts` 호출. 헤더 `x-api-key: env.CREEM_API_KEY` (Bearer 아님).
- [ ] A2. body에 `product_id: env.CREEM_PRODUCT_ID` (필수), `success_url`, `request_id`(고유값), `metadata: {market, type}` 포함. Stripe `line_items[*][price_data]` 인라인 가격 블록 **제거**.
- [ ] A3. BASE URL이 mode로 분기: `env.CREEM_MODE==='prod'` → `https://api.creem.io/v1`, 그 외 → `https://test-api.creem.io/v1` (기본 test — 안전).
- [ ] A4. KV 레코드 키가 Creem checkout id(`ch_...`) 기준. 응답 = `{ checkoutUrl: resp.checkout_url, sessionId: resp.id }`.
- [ ] A5. `handleFortune` 세션 검증이 Creem GET `{BASE}/v1/checkouts?checkout_id=${sessionId}` (`x-api-key`) → `status==='completed' && order?.status==='paid'`만 통과. 그 외 402.
- [ ] A6. sessionId 정규식이 Stripe `^cs_...$` → **Creem `^ch_[A-Za-z0-9]+$`**로 교체.
- [ ] A7. CISO 불변식 **전부 보존**: KV fail-closed(503), rate-limit 선행, TOCTOU used 선마킹+실패 롤백, EU 차단, no-store, 생년월일 원본 미저장(파생 명식만 KV TTL 1h), CORS 화이트리스트. **회귀 0.**
- [ ] A8. 코드/주석/docstring의 Stripe 잔재 → Creem으로 갱신 (오해 유발 주석 0).
- [ ] A9. `env.STRIPE_SECRET_KEY` 참조 0건 (grep 증빙).

### B. Worker 설정 (`markets/web/worker/wrangler.toml`)
- [ ] B1. Secrets 주석 목록 `STRIPE_SECRET_KEY` → `CREEM_API_KEY`.
- [ ] B2. `[vars]`에 `CREEM_PRODUCT_ID = "REPLACE_WITH_CREEM_PRODUCT_ID"` + `CREEM_MODE = "test"` 추가 (product_id는 비밀 아님).
- [ ] B3. 배포 전 체크리스트 주석이 Creem 절차 반영.

### C. 프론트엔드 (`markets/web/app.html` + `docs/app.html` 동기화)
- [ ] C1. `window.STRIPE_PK` 死변수 **제거** (리다이렉트 모델이라 미사용 — line 15).
- [ ] C2. `window.WORKER_URL` config-driven 가드 **유지** (placeholder면 "서비스 준비 중" — 정상 설계, 건드리지 말 것).
- [ ] C3. `handlePaymentReturn`이 Creem 리다이렉트 파라미터 `checkout_id`를 우선 read (기존 `session_id` fallback + sessionStorage 유지). Creem은 성공 시 `?...&checkout_id=ch_...&signature=...` append.
- [ ] C4. 6개 로케일(jp/th/tw/ph/vn/my) × `payDesc`+`paySecurity` 문구의 "Stripe" → "Creem" (예: `Stripe による安全な決済` → `Creem による安全な決済`). MARKET_I18N + 하드코딩 HTML(line 638-644) 둘 다.
- [ ] C5. `docs/app.html`이 `markets/web/app.html`과 동기화 (legal 링크 `../japan/legal/`→`japan/legal/`만 차이. deploy-cf.ps1 로직과 동일하게).

### D. 법률 (g2-clo 담당 — MoR 신규 판단) — `markets/japan/legal/*` + `docs/japan/legal/*` (양쪽 사본)
- [ ] D1. `tokushoho.html` 支払方法 "Stripe により…" → Creem + **MoR(등록판매자) 관계 반영**. Creem이 결제처리·판매대행자임을 特商法 제11조 준거로 명기.
- [ ] D2. `privacy.html`에 결제처리자로서 **Creem** 명시 + 국외이전(결제·과세 목적 이름/이메일/위치) 고지. 기존 Stripe 언급 있으면 교체.
- [ ] D3. `terms.html` Stripe 언급 → Creem.
- [ ] D4. 환불·표시 규정이 Creem MoR·디지털콘텐츠 특칙과 정합 (기존 "구매 후 환불 불가 + 시스템 장애 예외" 유지 가부 CLO 확인).
- [ ] D5. 販売業者(G2)·대표자·최종갱신일 정합성 확인.

### E. 배포 스크립트 (`deploy-cf.ps1`)
- [ ] E1. STEP 4 + 완료 메시지의 `STRIPE_SECRET_KEY` → `CREEM_API_KEY`, `STRIPE_PK` 단계 제거.
- [ ] E2. Creem 선결(스토어+prod_id+KYB) 안내 + `CREEM_PRODUCT_ID`를 wrangler.toml에 넣는 절차 추가.

### F. 코드측 검증 증빙 (라이브 Creem 키 없이 가능한 것)
- [ ] F1. Worker 번들 유효성: `wrangler deploy --dry-run` 또는 `node --check` 통과 출력.
- [ ] F2. grep 증빙: 활성 경로(web worker+app.html)에 `STRIPE`/`stripe`/`cs_` 잔재 0 (주석·문서 제외).
- [ ] F3. 회귀: CISO 불변식 A7 항목별 코드 위치 재확인.

### G. 문서
- [ ] G1. `docs/PAYMENT_RAIL_STATUS.md` 체크리스트 갱신 (Stripe→Creem 교체 = 완료 표시, 남은 회장 액션 명확화).
- [ ] G2. CFO 소액수수료 분석 + 묶음 권고를 STATUS에 1블록 기록 (¥500 실효 ~16%).

## 2. 범위 밖 (No silent caps — 명시적 제외)
- **archived/inactive workers 미이전:** `markets/japan/worker/` (deploy-cf.ps1이 아카이브 명시), `markets/korea/worker/` (Phase 2 미착), `markets/japan/liff/`. 활성 배포경로 = **web worker 단독**. 이들의 Stripe 잔재는 이번 범위 밖 (배포 안 됨) — 별도 후속.
- **webhook 미구현:** GET-retrieve 서버사이드 검증이 authoritative(현 Stripe 흐름과 동일 보안). Creem 문서가 "production 권장"하는 webhook(`checkout.completed`, HMAC)은 **Phase-2 하드닝**으로 문서화만.
- **가격 묶음 재설계:** ¥500 단건은 기술적으로 작동. 실효 16% 마진 문제는 **회장 매출결정** → 권고만, 이번 구현 블로커 아님.

## 3. Creem API 사실 (실행자 선로딩 — 재리서치 금지, 출처 docs.creem.io 2026-07-02)

- **Auth:** `x-api-key: creem_...` (Bearer 아님). test/prod 키 분리·상호불가. API키 = 리다이렉트 서명 salt 겸용 → 서버사이드 전용.
- **Base:** prod `https://api.creem.io/v1` · test `https://test-api.creem.io/v1` (완전 격리).
- **Create checkout:** `POST /v1/checkouts` body `{ product_id(필수 prod_...), success_url, request_id?, units?, custom_price?(cents,one-time,≥100), metadata?{}, customer?{email} }`. 응답 `{ id:"ch_...", checkout_url:"https://checkout.creem.io/ch_...", status:"pending", order?, metadata }`.
- **Verify(GET):** `GET /v1/checkouts?checkout_id=ch_...` (`x-api-key`). paid 판정 = `status==="completed" && order.status==="paid"`. order = `{status, amount, currency, amount_paid, tax_amount, transaction:"tran_..."}`.
- **Redirect params:** 성공 시 `success_url`에 `?checkout_id&order_id&customer_id&product_id&request_id&signature` append. signature = SHA-256 hex of `k1=v1|...|salt={apiKey}` (URL 순서, null/빈값 제외). ※UX 확인용 — authoritative는 서버 GET.
- **ID 포맷:** checkout `ch_`+~22 alnum. order `ord_`. (문서에 stale `chk_` placeholder 있으나 실제는 `ch_`.)
- **Webhook(Phase-2):** `POST` endpoint, `creem-signature` 헤더 = HMAC-SHA256(rawBody, **webhook secret**=별개), 이벤트 `checkout.completed`(one-time) → `object.order.status==="paid"`. CF Bot Fight Mode skip 필요.
- **JPY zero-decimal:** unit_amount=액면가(¥500=500). Creem product가 ¥500 고정이면 custom_price 불필요. saju/compat 동가 → product 1개로 커버(type은 metadata).
- **Fee:** 3.9%+$0.40 (세금포함액 기준). ¥500 실효 ~16%. Payout: 은행송금 max($7,1%) or USDC/Polygon 2%, 월 2회(1·15일), 최소 $50, 7~12일 홀드.

## 4. 단일샷 계약
- 이미 찾은 파일경로 = §1에 명시. **주어진 경로 밖 탐색 금지.** 모르면 추측 말고 이 파일에 질문 append.
- 도구예산: g2-cto ~40콜 내 완주, 독립작업 한 메시지 배치. g2-clo ~15콜.
- 막히면 `Skill("systematic-debugging")`. 2회 반복 실패 시 접근법 전환.

---

## 5. 실행 로그 (실행자·QA append)

### [g2-cto] 구현 내역

**2026-07-02 완료.** 변경: worker/index.js(creemBase 헬퍼·handleCheckout·handleFortune·regex `ch_`·주석 Creem화), wrangler.toml(CREEM_API_KEY/CREEM_PRODUCT_ID/CREEM_MODE), app.html(STRIPE_PK 제거·checkout_id 우선·6로케일 문구), docs/app.html(동기화), deploy-cf.ps1(Creem 시크릿·선결안내).
**증빙:** `node --check` EXIT 0 · `wrangler deploy --dry-run` EXIT 0(번들 46.21KiB) · grep STRIPE/cs_/CHECKOUT_SESSION_ID 잔재 0. A1~F3 전부 충족. CISO 불변식 A7 라인별 보존.
**ponytail lite 대안:** CREEM_MODE 분기 대신 CREEM_BASE_URL 단일 env 가능하나 "prod URL+test 키" 오조합 위험 → 안전기본값(test) 강제 위해 현행 유지 권장.

### [독립검증 — g2-qa-tester, 신선 컨텍스트] CONFIRMED

**2026-07-02.** git diff 직접 열람 + node --check 재실행. 6항목 전부 PASS: ①결제우회 불가(order 필드 누락 시에도 `order?.status!=='paid'`가 안전방향 거부) ②시크릿 누출 0(키는 x-api-key 헤더에만, 응답/로그 미노출) ③URL 정확(/v1/v1 없음, encodeURIComponent) ④CISO 회귀 0 ⑤빌드 EXIT 0 ⑥구현자 flag 3건(success_url 덮어쓰기·cancel_url·폴백체인) 전부 방어. **🔴 블로커 0.**

### [CLO 회장확인 리스크 4건 — 게이트 이월]
①Creem 등록법인 소재국 미확정(privacy §10 국가명 생략) ②카드명세 표시명 미확정(조건부 서술) ③이름/이메일 실수집 → **Alpha 해소: Creem MoR 자체 호스팅 체크아웃이 구매자 정보 직접 수집(코드 무관), 고지 정확** ④MoR 特商法 구조=신규 판단, 상용 전 실변호사 검토 권장.

### [Alpha 최종 게이트] PASS → main 커밋/푸시
🔒 결제 = 자가검증 종료 불가. 실행자 자가보고 + Alpha 직접 diff 검수 + **독립 신선검증 CONFIRMED** 3중 통과. 라이브 E2E만 회장 자격증명(Creem 스토어+prod_id+키) 대기.

### [g2-clo] 법률 문구 산출

**2026-07-02 완료.** 대상 6파일(markets/japan/legal/{tokushoho,privacy,terms}.html + docs/ 동일 사본) 전부 편집.

**핵심 법률 판단 (MoR 표시 방식):** 販売業者(G2 Company Ltd.)는 **변경하지 않음**(콘텐츠 제공·고객대응 주체는 그대로 G2, 환불 문의도 계속 kgg2512@gmail.com). Creem은 결제 트랜잭션의 **Merchant of Record(決済取扱事業者)** 로 명시 — 결제처리·소비세 등 세무 징수·납부를 대행하는 관계로 표시. 근거: 特商法 제11조의 취지는 "소비자가 누구와 거래하는지" 특정하는 것 — 실제 서비스 제공·환불 판단 주체(G2)를 販売業者로 유지하는 게 소비자 혼동을 줄임. 동시에 카드결제 명세서 표시명·세무 대행 사실은 별도 고지해 카드사 이의제기(chargeback) 리스크를 낮춤.

**D1 (tokushoho.html)** 支払方法 행 "Stripeにより安全に処理されます" → "Creemにより安全に処理されます" + **신규 행 「決済代行会社」 추가**:
> 「Creem（本サービスの決済処理を代行するMerchant of Record）」+ 소문구「Creemは、本サービスに関する決済の受付・処理、および消費税等関連税務の徴収・納付を、当社に代わって行います。カード利用明細に「Creem」等の名称で表示される場合があります。」

**D2 (privacy.html)** 3箇所 Stripe→Creem 교체 + 신규 이전목적 고지:
- §1 決済情報: 「決済取扱事業者Creem（Merchant of Record）が安全に処理します。決済処理および税務手続のため、氏名・メールアドレス・IPアドレス等に基づく所在地情報（課税国判定目的）がCreemおよびその決済パートナーに共有される場合があります。」
- §2 利用目的: 「決済処理の完了確認（Creemと連携）」
- §3 第三者提供: Stripe 항목 전체를 Creem 항목으로 교체(금액・通貨 외 氏名・メールアドレス・所在地情報 공유 추가 고지 + "決済契約上の当事者" 명시)
- §10 외국사업자: "米国：Stripe, Inc." → "Creem［決済取扱事業者・Merchant of Record］"(국가명 미표기 — 아래 리스크 참조)

**D3 (terms.html)** 第5条: 「決済はStripe, Inc.のシステムを通じて処理されます」→ Creem MoR 관계 전체 재기술 + 반금정책에 "返金が認められる場合、決済取扱事業者Creemを通じて処理されます" 추가(D4 겸함 — Creem이 결제대금을 보유하므로 환불 집행 경로 명확화).

**D4** 기존 반금정책(디지털콘텐츠 구매후 환불불가+시스템장애 예외, 特商法15条の3 인용) **골격 유지**. Creem이 자금을 보유하는 구조이므로 "환불 승인 시 Creem 경로로 처리" 한 문장만 tokushoho·terms 양쪽에 추가 — 소비자 대상 정책(연락처=G2 메일) 불변, 집행 메커니즘만 정확화.

**D5** 販売業者=G2 Company Ltd., 代表者=강경구(Kyunggu Kang) 불변 확인. 最終更新日 3파일 전부 2026年6月11日→**2026年7月2日** 갱신(privacy 制定日 2026年6月7日은 원 제정일이라 불변).

**⚠️ 회장 확인 필요 (미확인 사실 — 지어내지 않음):**
1. **Creem 등록법인 소재국 미확인.** privacy.html §10에서 기존 "米国：Stripe, Inc." 처럼 국가를 명시하던 관행을 Creem에는 적용하지 않고 "決済取扱事業者・Merchant of Record"로만 표시(국가명 생략). Creem 실제 등록국가 확인되면 "［○○：Creem, Inc.］" 식으로 보강 권고.
2. **카드 명세서 표시명("Creem" 등) 미확정.** tokushoho.html 決済代行会社 행에 "「Creem」等の名称で表示される場合があります"로 조건부 서술(단정 안 함) — 실제 Creem 대시보드 statement descriptor 설정값 확인 후 필요시 정확한 표시명으로 보정 권고.
3. **氏名・メールアドレス가 실제 체크아웃에서 수집되는지는 코드범위 밖이라 미검증** — 이번 작업은 Alpha 작업지시서 §3(Creem API 사실, customer?{email} 필드 존재)에 근거해 "공유될 수 있음(場合があります)"으로 고지. g2-cto 구현이 실제로 email을 Creem에 전달하면 이 고지가 사실과 일치 — 구현 확정 후 "場合があります"를 확정형으로 바꿀지 재확인 권고.
4. **신규 법률 판단(정식 변호사 검토 권고 대상):** MoR 도입에 따른 特商法 표시 구조(販売業者=G2 유지 vs Creem 표시) 자체가 이번 세션 첫 판단 — 정식 상용 전환 전 실제 변호사 검토 권장.

### [QA/독립검증] PASS/FAIL
<!-- §1 항목별 독립 재실행 결과 append -->
