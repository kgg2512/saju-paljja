# COO 운영 계획 — 사주팔자 (The Fate)
**작성일:** 2026-06-07 | **최종 업데이트:** 2026-06-07 | **작성:** G2 COO Agent | **검토:** Alpha CEO

---

## 0. 전팀 완료 작업 현황 (2026-06-07 기준)

전체 C레벨 스프린트 완료. 아래는 각 팀의 확정 완료 항목 (commit 기준 사실).

| 팀 | 완료 항목 | Commit |
|----|---------|--------|
| **CLO** | 法務 4개 파일 수정 (tokushoho/terms/privacy/app.html 링크 정합성) | 별도 |
| **CISO** | EU 차단 + CORS 강화 + LIFF 토큰 격리 | 2b859e1 |
| **CFO** | Stripe 통화 단위 버그 수정 + Japan ¥500 인상 (¥800→¥1,300) | 56d28d2 |
| **CTO** | 11개 기술 버그 수정 (solarToLunar, 멀티마켓 언어 분기, 가격 전역 반영 외) | f36e521 |

**현재 코드베이스 상태:** 배포 가능한 품질. 회장 직접 액션만 남음.

---

## 1. 회장 직접 액션 (우선순위 순) — 배포 블로커 전체 목록

> 아래 항목은 AI 에이전트가 대신 실행할 수 없는 것만 포함. 순서 중요.

| # | 항목 | 소요 시간 | 의존성 | 비고 |
|---|------|---------|--------|------|
| **1** | `wrangler kv:namespace create SAJU_JAPAN_KV` → ID를 wrangler.toml에 입력 | 5분 | 없음 | CF 계정 로그인 필요 |
| **2** | `wrangler kv:namespace create MEISEI_WEB_KV` → ID를 wrangler.toml에 입력 | 5분 | 없음 | 위와 동시 진행 가능 |
| **3** | `wrangler secret put` 4종 × Japan Worker | 10분 | #1 완료 | LINE Channel Secret, LINE Channel Access Token, OpenAI API Key, Stripe Secret |
| **4** | `wrangler secret put` 4종 × Web Worker | 10분 | #2 완료 | 동일 4종, Web Worker 대상 |
| **5** | LINE Developers Console: Provider 생성 → OA Channel(Messaging API) 생성 → LIFF 앱 등록 → LIFF ID 획득 | 20분 | 없음 | https://developers.line.biz |
| **6** | `app.html`의 `REPLACE_WITH_WORKER_URL` → 실제 CF Worker URL로 교체 | 5분 | #1~4 배포 후 | `deploy-cf.ps1` 실행 시 자동화 가능 |
| **7** | `wrangler deploy` — Japan Worker 배포 | 5분 | #1, #3 완료 | `cd workers/japan && wrangler deploy` |
| **8** | `wrangler deploy` — Web Worker 배포 | 5분 | #2, #4 완료 | `cd workers/web && wrangler deploy` |
| **9** | Stripe Japan 계정 신청 (stripe.com/jp) | 15분 | 없음 | 심사 2~4주 — **즉시 신청할수록 유리** |
| **10** | Stripe 웹훅 엔드포인트 등록 | 10분 | Stripe 승인 후 | 승인 이메일 수신 후 즉시 실행 |

**최장 블로커:** Stripe Japan 심사 (2~4주). #9는 오늘 즉시 신청해야 W4 론칭 가능.

---

## 2. 배포 타임라인 (2026-06-07 기준 최신)

| Week | 기간 | 핵심 목표 | 회장 직접 액션 | AI 에이전트 처리 | 완료 기준 |
|------|------|---------|-------------|----------------|---------|
| **W1** | 06/07–06/14 | 배포 인프라 전체 착수 | #1~#8 (KV 생성 + Secrets + LINE 등록 + wrangler deploy) + **#9 Stripe 즉시 신청** | wrangler.toml 최종 검토, deploy 스크립트 지원, LINE 웹훅 동작 확인 | CF Workers 2개 배포 완료 + LINE 웹훅 응답 확인 + Stripe 신청서 제출 완료 |
| **W2** | 06/14–06/21 | LIFF 연결 + 서비스 E2E 검증 | LINE OA 웹훅 URL 등록 + 리치메뉴 설정 (20분) | LIFF 앱 연결 검증, E2E 플로우 테스트 (LINE 친구추가→사주결과), 품질 QA 30건 | LINE 채팅으로 사주 결과 정상 수신 확인 |
| **W3** | 06/21–06/28 | Stripe 심사 대기 + 품질 완성 | Stripe 심사 진행 중 (대기) | 사주 응답 품질 QA 50건, 랜딩페이지 SEO, LINE 리치메뉴 디자인 완성 | 품질 QA 완료 + 랜딩페이지 배포 완료 |
| **W4** | 06/28–07/05 | 소프트 론칭 + 첫 유료 사용자 | Stripe 심사 결과 확인 → 승인 시 #10 웹훅 등록 → 결제 활성화 | 결제 엔드포인트 활성화 지원, 테스트 결제 검증, 운영 모니터링 설정 | 유료 결제 1건 이상 완료 OR Stripe 미승인 시 W5로 이월 |
| **W5–W6** | 07/05–07/18 | Japan PMF 검증 + Korea 설계 | LINE OA 친구 메시지 발송, KakaoTalk 비즈니스 채널 신청 | 베타 10명 피드백 수집, 재방문율 추적, Korea Phase 2 설계 문서 | 베타 10명 완료, Japan 주간 수익 ¥2,000+ |
| **W7–W8** | 07/19–08/02 | Korea 착수 + PMF 확인 | 카카오톡 채널 웹훅 등록 (10분), 브랜드명 최종 결정 | Korea worker 개발, 카카오페이 연동 설계, Japan 월간 리포트 | Korea 베타 5명+, Japan BEP(33건/월) 달성 여부 확인 |

---

## 3. 블로커 대응 계획

### 3-1. Stripe Japan 심사 대기 (2~4주) — 병렬 진행 목록

Stripe 심사가 최장 블로커. 대기 기간 동안 아래를 병렬로 완료.

| 작업 | 담당 | 기간 | 비고 |
|------|------|------|------|
| LINE OA + LIFF 완전 설정 | 회장 + AI | W1 | Stripe와 독립 |
| CF Workers 배포 + 동작 검증 | 회장 + AI | W1 | Stripe와 독립 |
| 사주 응답 품질 테스트 50건 | AI | W2~W3 | 프롬프트 튜닝 포함 |
| 랜딩페이지(docs/index.html) 완성 | AI | W2~W3 | SEO, OG태그, 일본어 최적화 |
| LINE 리치메뉴 디자인 완성 | AI | W2 | MEI 브랜드 적용 |
| Korea Phase 2 설계 문서 작성 | AI | W3~W4 | 상표 리스크 포함 |
| 특商法 페이지 최종 확인 | AI | W2 | CLO 완료, 링크 연결 확인만 |
| 수익 추적 대시보드 설계 | AI | W3 | CF Workers Analytics 활용 |

### 3-2. 블로커 해제 즉시 실행 액션

| 블로커 | 해제 조건 | 즉시 시작할 작업 |
|--------|---------|----------------|
| **Stripe Japan 승인** | 이메일 수신 | Stripe publishable/secret key → CF Workers Secrets 등록 → 결제 엔드포인트 활성화 → 테스트 결제 1건 |
| **LINE OA 승인** | LINE Console "Approved" | 웹훅 URL 등록 → 웰컴메시지 활성화 → 리치메뉴 발행 |
| **LIFF App 생성** | LIFF ID 발급 | wrangler.toml LIFF_ID 업데이트 → Workers 재배포 |
| **KV namespace 생성** | Cloudflare 대시보드 ID 확인 | wrangler.toml kv_namespaces.id 업데이트 → Workers 배포 |

---

## 4. Phase 진입 조건

### Phase 1 → Phase 2 (Japan → Korea)

**아래 기준 중 2개 이상 충족 시 Korea 착수 확정:**

| 기준 | 수치 | 측정 방법 |
|------|------|---------|
| 월 유료 거래 | ≥ 50건/월 | Stripe 대시보드 |
| 재방문율 | ≥ 30% (30일 이내 재구매) | CF Workers Analytics |
| 월 수익 | ≥ ¥10,000 (약 $65) | Stripe 대시보드 |
| 사용자 피드백 | NPS ≥ 7/10 (베타 10명 기준) | 수동 설문 |

**현실 기준:** Stripe 결제 50건이 핵심. 예상 진입 시점: 2026년 8월 (W7~W8).

### Phase 2 → Phase 3 (Korea → SE Asia)

| 기준 | 수치 |
|------|------|
| Japan + Korea 합산 월 수익 | ≥ $200/월 |
| Korea 월 유료 거래 | ≥ 100건/월 |
| 운영 안정성 | CF Workers 99% uptime 30일 연속 |
| 상표 리스크 | 사주팔자 브랜드 결정 완료 |

예상 진입 시점: 2026년 10월~11월.

### Phase 3 → Phase 4 (SE Asia → Global)

| 기준 | 수치 |
|------|------|
| 3개 마켓 합산 월 수익 | ≥ $500/월 |
| 법인 설립 OR 해외 법인 제휴 | EU GDPR 대응 구조 확보 |
| WhatsApp Business API 심사 통과 | Meta Business 계정 승인 |

**주의:** EU 진입은 법인 없이 불가. Phase 4는 US/APAC 우선, EU는 Phase 4.5 이후.

---

## 5. 리스크 매트릭스

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Stripe 심사 거절 | 낮음 | 높음 | PayPay API 또는 LINE Pay 대안 검토 |
| Stripe 심사 지연 (4주 초과) | 중간 | 중간 | W4 론칭 → W5로 이월. 무료 체험 기간으로 사용자 선확보 |
| LINE OA 승인 지연 | 중간 | 중간 | 검증용 계정으로 개발 진행 후 전환 |
| GPT-4o mini 비용 초과 | 낮음 | 중간 | 월 $50 한도 설정, 초과 시 Gemini Flash 전환 |
| 사주팔자 상표 분쟁 | 중간 | 낮음 | Korea 브랜드는 별도명으로 출시 (CLO 검토 완료) |
| Japan 수요 미달 (BEP 미도달) | 중간 | 중간 | 1개월 데이터 후 판단, SE Asia로 우선순위 이동 가능 |

---

## 6. 운영 KPI 대시보드 (주간 추적)

| 지표 | W4 목표 | W8 목표 | 측정 도구 |
|------|--------|--------|---------|
| Japan 월 거래 건수 | 10건 | 33건 (BEP) | Stripe |
| Japan 월 수익 | ¥2,600 (¥1,300×2건/주) | ¥6,600 (BEP) | Stripe |
| LINE OA 친구 수 | 50명 | 200명 | LINE Official Account Manager |
| 사주 API 응답 성공률 | 99% | 99.5% | CF Workers Analytics |
| 평균 응답 시간 | <3초 | <2초 | CF Workers Analytics |
| Korea 대기 등록 | — | 50명 | 랜딩페이지 이메일 수집 |

> **BEP 계산:** Japan ¥1,300/건 × 33건 = ¥42,900/월 ≈ $280 (GPT-4o mini 비용 $50 + 기타 $30 커버)

---

## 7. 회장 W1 Daily Checklist (2026-06-07 ~ 2026-06-14)

### Day 1 — 2026-06-07 (오늘) — 최우선
- [ ] **Stripe Japan 계정 신청** (stripe.com/jp) — 심사 시작이 빠를수록 유리. 오늘 꼭 신청.
- [ ] LINE Developers Console 접속: https://developers.line.biz
- [ ] Provider 생성: "G2 Company Ltd"

### Day 2 — 2026-06-08
- [ ] LINE OA (Messaging API 채널) 생성: 채널명 "MEI"
- [ ] Channel Secret + Channel Access Token 복사 → 안전한 곳 보관

### Day 3 — 2026-06-09
- [ ] LIFF App 생성: Endpoint URL = CF Workers URL (임시 https://example.com 가능)
- [ ] LIFF ID 복사 보관
- [ ] Cloudflare KV namespace 생성: `SAJU_JAPAN_KV` + `MEISEI_WEB_KV`
- [ ] 각 Namespace ID 복사 보관 → wrangler.toml 업데이트

### Day 4 — 2026-06-10
- [ ] CF Workers Secrets 등록 — Japan Worker (4종):
  - `LINE_CHANNEL_SECRET`
  - `LINE_CHANNEL_ACCESS_TOKEN`
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY` (Stripe 미승인 시 임시값 입력 후 나중에 교체)
- [ ] CF Workers Secrets 등록 — Web Worker (동일 4종)

### Day 5 — 2026-06-11
- [ ] `wrangler deploy` — Japan Worker
- [ ] `wrangler deploy` — Web Worker
- [ ] `app.html` REPLACE_WITH_WORKER_URL → 실제 Workers URL로 교체

### Day 6 — 2026-06-12
- [ ] LINE OA 웹훅 URL 등록: OA 설정 → Webhook settings → Workers URL 입력
- [ ] 웹훅 응답 확인 (LINE 테스트 메시지 발송)

### Day 7 — 2026-06-14
- [ ] E2E 테스트: LINE 친구추가 → 생년월일 입력 → 사주 결과 수신 전 플로우 확인
- [ ] Stripe 신청 상태 확인 (이메일 확인)

---

*COO 운영 계획 v2.0 — G2 Company Ltd*
*전팀 스프린트 반영 업데이트: 2026-06-07*
*다음 업데이트: W4 완료 후 (2026-07-05)*
