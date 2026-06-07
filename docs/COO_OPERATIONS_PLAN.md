# COO 운영 계획 — 무릎팍도사 (Mureupak Dosa)
**작성일:** 2026-06-07 | **작성:** G2 COO Agent | **검토:** Alpha CEO

---

## 1. 주간 마일스톤 표 (2026-06-07 ~ 2026-08-02)

| Week | 기간 | 핵심 목표 | 회장 직접 액션 (≤30분) | AI 에이전트 처리 | 완료 기준 (Done Criteria) |
|------|------|---------|----------------------|----------------|--------------------------|
| **W1** | 06/07–06/13 | Japan 배포 인프라 착수 | LINE Developers Console: Provider 생성 + OA 등록 + LIFF App 생성 (20분) | wrangler.toml 최종 검토, CF Workers 배포 스크립트 준비 | LINE OA 채널 ID + LIFF ID 발급 완료 |
| **W2** | 06/14–06/20 | CF Workers 배포 + Stripe 신청 착수 | ① CF Workers KV namespace 생성 (5분) ② 4개 Secrets 등록 (10분) ③ Stripe Japan 계정 신청 이메일 발송 (15분) | CF Workers 배포 자동화 스크립트 실행, 엔드포인트 동작 테스트 | Workers URL에서 사주 API 정상 응답 확인 |
| **W3** | 06/21–06/27 | LIFF 연결 + LINE OA 웰컴메시지 설정 | LINE OA 관리자 콘솔 — 웹훅 URL 등록 (5분), 리치메뉴 설정 (15분) | LIFF 앱 연결 검증, 웰컴메시지 JSON 배포, E2E 플로우 테스트 | LINE 친구추가 → 생년월일 입력 → 사주 결과 수신 전 플로우 동작 |
| **W4** | 06/28–07/04 | 소프트런치 + 첫 유료 사용자 획득 | Stripe 심사 결과 확인 (대기) — 승인 시 즉시 결제 연동 활성화 | 운세 결과 품질 QA 10건, 랜딩페이지 SEO 기본 설정 | 유료 결제 1건 이상 완료 OR Stripe 미승인 시 W5로 이월 |
| **W5** | 07/05–07/11 | Japan PMF 검증 시작 | LINE 공식 계정 친구에게 메시지 발송 (5분) | 10명 베타 사용자 피드백 수집 분석, 재방문율 추적 | 베타 10명 완료, 재방문율 측정 기준 수립 |
| **W6** | 07/12–07/18 | Japan 안정화 + Korea Phase 2 설계 착수 | KakaoTalk 비즈니스 채널 신청 (15분) | Japan 운영 자동화 모니터링 설정, Korea 카카오 SDK 연동 설계 | Japan 주간 수익 ¥2,000 이상 OR 10건 이상 달성 |
| **W7** | 07/19–07/25 | Korea Phase 2 개발 착수 | 브랜드명 최종 결정 (무릎팍도사 상표 리스크 검토 후) | Korea worker/index.js 스켈레톤 → 완성본 개발, 카카오페이 연동 설계 | Korea CF Workers 로컬 테스트 통과 |
| **W8** | 07/26–08/02 | Korea 베타 배포 + Japan 수익 안정화 | 카카오톡 채널 웹훅 등록 (10분) | Korea 베타 배포, Japan 월간 리포트 작성, Phase 3 (SE Asia) 설계 시작 | Korea 베타 사용자 5명 이상, Japan BEP(33건/월) 달성 여부 확인 |

---

## 2. 블로커 대응 계획

### 2-1. Stripe Japan 심사 대기 (2~4주) — 병렬 진행 목록

Stripe 심사는 가장 긴 블로커(2~4주)이므로, 대기 기간 동안 아래를 병렬로 완료한다.

| 작업 | 담당 | 예상 기간 | 비고 |
|------|------|---------|------|
| LINE OA + LIFF 완전 설정 | 회장 + AI | W1~W2 | Stripe와 독립 |
| CF Workers 배포 + 동작 검증 | AI | W2 | Stripe와 독립 |
| 사주 응답 품질 테스트 50건 | AI | W2~W3 | 프롬프트 튜닝 포함 |
| 랜딩페이지(docs/index.html) 완성 | AI | W2~W3 | SEO, OG태그, 일본어 최적화 |
| LINE 리치메뉴 디자인 완성 | AI | W2 | 명성AI 브랜드 적용 |
| Korea Phase 2 설계 문서 작성 | AI | W3~W4 | 상표 리스크 포함 |
| 특商法 페이지 Japan 최종 검토 | AI | W2 | 이미 존재, 링크 연결만 |
| 수익 추적 대시보드 설계 | AI | W3 | CF Workers Analytics 활용 |

### 2-2. 블로커 해제 즉시 실행 액션

| 블로커 | 해제 조건 | 즉시 시작할 작업 |
|--------|---------|----------------|
| **Stripe Japan 승인** | 이메일 수신 | Stripe publishable key + secret key → CF Workers Secrets 등록 → 결제 엔드포인트 활성화 → 테스트 결제 1건 |
| **LINE OA 승인** | LINE Console에서 채널 상태 "Approved" | 웹훅 URL 등록 → 웰컴메시지 활성화 → 리치메뉴 발행 |
| **LIFF App 생성** | LIFF ID 발급 | wrangler.toml LIFF_ID 값 업데이트 → Workers 재배포 |
| **KV namespace 생성** | Cloudflare 대시보드 ID 확인 | wrangler.toml kv_namespaces.id 업데이트 → Workers 배포 실행 |

---

## 3. Phase 2→3→4 진입 조건

### Phase 1 → Phase 2 (Japan → Korea) 진입 조건

**아래 기준 중 2개 이상 충족 시 Korea 착수 확정:**

| 기준 | 수치 | 측정 방법 |
|------|------|---------|
| 월 유료 거래 | ≥ 50건/월 | Stripe 대시보드 |
| 재방문율 | ≥ 30% (30일 이내 재구매) | CF Workers Analytics |
| 월 수익 | ≥ ¥10,000 (약 $65) | Stripe 대시보드 |
| 사용자 피드백 | NPS ≥ 7/10 (베타 10명 기준) | 수동 설문 |

**현실 기준:** Stripe 결제 50건이 핵심. 나머지는 보조 지표.
**예상 진입 시점:** 2026년 8월 (W7~W8)

---

### Phase 2 → Phase 3 (Korea → SE Asia) 진입 조건

| 기준 | 수치 |
|------|------|
| Japan + Korea 합산 월 수익 | ≥ $200/월 |
| Korea 월 유료 거래 | ≥ 100건/월 |
| 운영 안정성 | CF Workers 99% uptime 30일 연속 |
| 상표 리스크 | 무릎팍도사 브랜드 결정 완료 |

**예상 진입 시점:** 2026년 10월~11월 (현실적 추정)

---

### Phase 3 → Phase 4 (SE Asia → Global) 진입 조건

| 기준 | 수치 |
|------|------|
| 3개 마켓 합산 월 수익 | ≥ $500/월 |
| 법인 설립 OR 해외 법인 제휴 | EU GDPR 대응 가능한 구조 확보 |
| WhatsApp Business API 심사 통과 | Meta Business 계정 승인 |

**주의:** EU 진입은 법인 없이 불가. Phase 4는 US/APAC 우선, EU는 Phase 4.5 이후.

---

## 4. 회장 Daily Checklist (2026-06-07 ~ 2026-06-13)

### Day 1 — 2026-06-07 (오늘)
- [ ] LINE Developers Console 접속: https://developers.line.biz
- [ ] Provider 생성: "G2 Company Ltd" 이름으로

### Day 2 — 2026-06-08
- [ ] LINE OA (Messaging API 채널) 생성: 채널명 "命星AI"
- [ ] Channel Secret + Channel Access Token 복사해서 안전한 곳에 보관

### Day 3 — 2026-06-09
- [ ] LIFF App 생성: Endpoint URL = CF Workers URL (임시는 https://example.com 가능)
- [ ] LIFF ID 복사 보관

### Day 4 — 2026-06-10
- [ ] Cloudflare 대시보드 → Workers & Pages → KV 탭 → namespace 생성: "MEISEI_AI_KV"
- [ ] Namespace ID 복사 보관

### Day 5 — 2026-06-11
- [ ] CF Workers Secrets 등록 (4개):
  - `LINE_CHANNEL_SECRET`
  - `LINE_CHANNEL_ACCESS_TOKEN`
  - `OPENAI_API_KEY`
  - `STRIPE_SECRET_KEY` (Stripe 신청 전이면 임시값)

### Day 6 — 2026-06-12
- [ ] Stripe Japan 계정 신청: https://stripe.com/jp
  - 사업자 형태: Individual (개인)
  - 사업 설명: "AI Fortune Telling Service via LINE messaging platform"

### Day 7 — 2026-06-13
- [ ] CF Workers 배포 실행 (AI 에이전트가 준비한 스크립트 실행)
- [ ] LINE 웹훅 URL 등록: OA 설정 → Webhook settings → URL 입력

---

## 5. 리스크 매트릭스

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Stripe 심사 거절 | 낮음 | 높음 | 거절 시 PayPay API 또는 LINE Pay 대안 검토 |
| LINE OA 승인 지연 | 중간 | 중간 | 검증용 계정으로 개발 진행 후 나중에 전환 |
| GPT-4o mini 비용 초과 | 낮음 | 중간 | 월 $50 한도 설정, 초과 시 Gemini Flash 전환 |
| 무릎팍도사 상표 분쟁 | 중간 | 낮음 | Korea 브랜드는 별도명으로 출시 (Phase 2까지 시간 있음) |
| Japan 수요 미달 (BEP 미도달) | 중간 | 중간 | 1개월 데이터 후 판단, SE Asia로 우선순위 이동 가능 |

---

## 6. 운영 KPI 대시보드 (주간 추적)

| 지표 | 목표 (W4 기준) | 목표 (W8 기준) | 측정 도구 |
|------|--------------|--------------|---------|
| Japan 월 거래 건수 | 10건 | 33건 (BEP) | Stripe |
| Japan 월 수익 | ¥2,000 | ¥6,600 | Stripe |
| LINE OA 친구 수 | 50명 | 200명 | LINE Official Account Manager |
| 사주 API 응답 성공률 | 99% | 99.5% | CF Workers Analytics |
| 평균 응답 시간 | <3초 | <2초 | CF Workers Analytics |
| Korea 대기 등록 | — | 50명 | 랜딩페이지 이메일 수집 |

---

*COO 운영 계획 v1.0 — G2 Company Ltd*
*다음 업데이트: W4 완료 후 (2026-07-04)*
