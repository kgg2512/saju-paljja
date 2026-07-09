# Creem 온보딩 절차 (사주 The Fate — JP/MEI)

> 목적: **테스트 모드**로 실질 운영 + 링크 배포. Creem 테스트모드는 계정 심사 불필요(라이브 전환 시에만 24~72h 심사).
> 결제 코드·워커·KV·webhook은 이미 배포 완료(2026-07-09). **남은 것은 회장의 Creem 계정 생성과 키 3종 전달뿐.**

- 워커: `https://the-fate-web.kgg2512.workers.dev` (배포됨, `/api/health` 200)
- 웹앱: `https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=jp`
- 랜딩: `https://kgg2512.github.io/saju-paljja/`
- 상품: ¥500 (JPY, zero-decimal = 액면가 500) 단건 결제, MoR = Creem

---

## A. 회장이 할 일 (약 10분, 브라우저만)

### 1. Creem 계정 생성 (5분)
1. https://creem.io → Sign up (이메일 = kgg2512@gmail.com 권장)
2. 가입 후 대시보드 진입. **우측 상단이 "Test mode"인지 확인** (기본 테스트모드).

### 2. 테스트모드 상품(Product) 생성
- Products → **Create product**
- 이름: `MEI 四柱推命鑑定` (또는 원하는 표시명)
- 가격: **500**, 통화 **JPY** (¥500)
- 과금 유형: **One-time**(단건). 구독 아님.
- 저장 후 생성된 **Product ID (`prod_...`)** 를 복사 → 아래 (전달 1)

### 3. 테스트 API 키 발급
- Developers → **API Keys** (테스트모드 상태에서)
- **Test API Key** 복사 (`creem_test_...` 형태) → 아래 (전달 2)
- ⚠️ 이 키는 시크릿. 채팅/메일 평문 노출 최소화(전달 직후 Alpha가 `wrangler secret`로만 등록).

### 4. Webhook 엔드포인트 등록 + 시크릿 확보
- Developers → **Webhook** → Add endpoint
- URL: `https://the-fate-web.kgg2512.workers.dev/api/webhook/creem`
- 이벤트: **`checkout.completed`** 체크 (구독/환불 이벤트는 단건 모델과 무관, 선택 안 해도 됨)
- 저장 후 표시되는 **Webhook Secret** 복사 → 아래 (전달 3)
  - webhook은 리다이렉트 이탈(결제 후 창 닫힘) 구제용 안전망. 없어도 정상 리다이렉트는 동작하나, **등록 권장**.

### 회장 → Alpha 전달 항목 (3종)
| # | 항목 | 형태 | 용도 |
|---|------|------|------|
| 1 | Product ID | `prod_...` | 결제 상품 지정 (`CREEM_PRODUCT_ID`, 공개 vars) |
| 2 | Test API Key | `creem_test_...` | 결제 생성·검증 (`CREEM_API_KEY`, 시크릿) |
| 3 | Webhook Secret | `whsec_...` 등 | webhook 서명 검증 (`CREEM_WEBHOOK_SECRET`, 시크릿) |

---

## B. Alpha가 할 일 (키 전달 받은 후)

```powershell
cd C:\Users\kgg25\Desktop\saju-paljja\markets\web\worker

# 시크릿 2종 등록 (값은 프롬프트에 입력 — 화면 미표시)
npx wrangler secret put CREEM_API_KEY          # 전달 2
npx wrangler secret put CREEM_WEBHOOK_SECRET   # 전달 3
npx wrangler secret put OPENAI_API_KEY         # 운세 생성용 GPT 키 (별도, sk-...)

# 공개 vars: wrangler.toml [vars] CREEM_PRODUCT_ID 를 전달 1(prod_...) 값으로 교체
#   CREEM_MODE 는 "test" 유지 (테스트모드 운영)

# 반영 배포
npx wrangler deploy
```

### E2E 테스트 결제 검증 (Creem 테스트 카드)
1. 앱 열기: `https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=jp`
2. 생년월일 입력 → 결제 → Creem 테스트 체크아웃에서 **테스트 카드 `4242 4242 4242 4242`** (유효기간 미래, CVC 임의) 결제
3. 리다이렉트 복귀 → 운세 생성 화면 표시되면 통과
4. 서버 확인: Creem 대시보드 → 해당 checkout `completed`, webhook 전송 로그 200

---

## C. 라이브(실결제) 전환 체크리스트 — 나중에

라이브 전환은 Creem 대시보드에서 **Live mode** 활성화 신청 → 심사(24~72h). 심사 통과 요건 및 현재 상태:

| 요건 | 상태 | 위치 |
|------|------|------|
| 개인정보처리방침 노출 | ✅ 있음 | `markets/japan/legal/privacy.html` (앱·랜딩 링크) |
| 이용약관 노출 | ✅ 있음 | `markets/japan/legal/terms.html` |
| 특정상거래법 표시(일본 필수) | ✅ 있음 | `markets/japan/legal/tokushoho.html` (MoR=Creem 명시) |
| 가격 명시 | ✅ 있음 | ¥500 표시 (앱 결제화면·랜딩) |
| **지원 이메일 사이트 표기** | ✅ 있음 | 랜딩 footer + tokushoho `kgg2512@gmail.com` |

라이브 전환 시 Alpha 작업:
```powershell
# 라이브 API 키·webhook 시크릿으로 교체
npx wrangler secret put CREEM_API_KEY          # creem_live_...
npx wrangler secret put CREEM_WEBHOOK_SECRET   # 라이브 webhook secret
# wrangler.toml [vars]: CREEM_PRODUCT_ID = 라이브 prod_... , CREEM_MODE = "prod"
npx wrangler deploy
```
+ Creem 대시보드에 라이브 webhook 엔드포인트도 동일 URL로 재등록.

---

## D. 참고 — 가격 구조 옵션 (회장 결정 대기, 미구현)
현재 = ¥500 단건. mem0 `project_saju_payment_route`에 "단건→묶음 재설계 필요" 기록.
- 옵션: 3회 묶음 ¥1,200 / 월 구독 등. **결정 시 별도 작업** (Creem product 추가 + 코드 분기). 이 문서 범위 아님.

---
_작성: 2026-07-09 (Alpha/CTO). 코드·배포는 완료 상태, 회장 키 전달만 대기._
