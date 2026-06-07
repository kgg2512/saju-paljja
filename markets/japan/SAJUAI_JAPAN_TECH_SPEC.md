# 사주아이 일본판 — CTO 기술 스펙 (v1.0)

작성일: 2026-06-07  
작성자: g2-cto  
상태: MVP 착수 가능  

---

## 0. 결정적 사실 확인 (웹 검색 결과 기반)

### LINE Pay Japan — 완전 종료 확인
> **LINE Pay Japan 서비스는 2025년 4월 30일부로 완전 종료되었다.**  
> LY Corporation 공식 발표. PayPay로 통합. 신규 머천트 접수는 2024년 7월 30일 마감.  
> **결론: LINE Pay 결제 옵션은 기술적으로 불가능. Stripe Japan 단독 선택.**

### LIFF 외부 결제 정책
> LINE 공식 문서에 외부 결제 SDK(Stripe Elements 등)를 LIFF WebView에서 명시적으로 차단하는 조항 없음.  
> LIFF는 일반 WebView 기반 — Stripe.js는 HTTPS + iframe 방식으로 작동하므로 기술적으로 허용.  
> **결론: Stripe Elements는 LIFF 내 사용 가능 (단, HTTPS 필수 — GitHub Pages 충족).**

### LLM 비용 결정
| 모델 | Input | Output | 쿼리당 비용 (est. 2K tokens) |
|------|-------|--------|--------------------------|
| Claude Haiku 3.5 (레거시) | $0.25/M | $1.25/M | ~$0.0028 |
| Claude Haiku 4.5 (현행) | $1.00/M | $5.00/M | ~$0.011 |
| GPT-4o mini | $0.15/M | $0.60/M | ~$0.0009 |

> **CFO 제약 월 $10 기준:**  
> - GPT-4o mini: 월 11,111 쿼리 가능  
> - Claude Haiku 4.5: 월 909 쿼리 가능  
> **결론: GPT-4o mini 선택. 월 $10으로 11K+ 쿼리 — 사실상 스케일 제약 없음.**  
> (Claude Haiku 4.5는 품질 좋지만 사주 콘텐츠 특성상 GPT-4o mini도 충분)

---

## 1. 확정 기술 스택

```
┌─────────────────────────────────────────────────────┐
│                   사용자 (LINE 앱)                    │
└──────────────┬──────────────────────────────────────┘
               │ LINE Messaging API (Webhook)
               ▼
┌─────────────────────────────────────────────────────┐
│          Cloudflare Workers (메인 백엔드)              │
│  - LINE Webhook 수신 + 서명 검증 (HMAC-SHA256)        │
│  - 메시지 라우팅 + Rate Limiting (5회/분/LINE ID)      │
│  - OpenAI API 호출 (GPT-4o mini)                     │
│  - Stripe 결제 세션 생성                              │
│  - CF Workers Secrets: 모든 API 키 관리               │
│  - CF Workers KV: 결제 상태 임시 저장 (TTL 1시간)      │
└──────┬───────────────────────┬───────────────────────┘
       │ LIFF URL 전달          │ 결과 메시지 전달
       ▼                       ▼
┌──────────────┐    ┌──────────────────────────────────┐
│ GitHub Pages │    │      LINE Platform               │
│ (LIFF 앱)    │    │  (메시지 전달, 친구 추가 등)        │
│              │    └──────────────────────────────────┘
│ - 동의 팝업   │
│ - 생년월일 입력│
│ - 메뉴 선택   │
│ - Stripe 결제 │    ┌──────────────────────────────────┐
│ - 결과 표시   │    │      Stripe Japan                │
│              │◄───│  - ¥200/쿼리 결제 처리             │
└──────────────┘    │  - Stripe Elements (HTTPS iframe) │
                    └──────────────────────────────────┘
```

### 최종 스택 결정

| 레이어 | 선택 | 근거 |
|--------|------|------|
| 메시지 플랫폼 | LINE Messaging API | 요구사항 |
| 프론트엔드 | LIFF v2 + Vanilla JS | React 불필요 (단순 폼 UI), 번들 크기 최소화 |
| 호스팅 | GitHub Pages (kgg2512.github.io/saju-japan) | $0, HTTPS 자동, CLO 정책 페이지 함께 호스팅 |
| 백엔드 | Cloudflare Workers | $0 (무료 플랜 10만 req/일), Secrets, KV |
| LLM | GPT-4o mini (OpenAI) | 월 $10으로 11K 쿼리 처리 가능 |
| 결제 | Stripe Japan | LINE Pay Japan 종료 확인, Stripe Japan 활성 |
| 보안 | HMAC-SHA256 서명 검증 + CF Rate Limit | M1, S5 충족 |

---

## 2. MVP 기능 스코프 결정

### 포함 (Week 1-4 구현)

| 기능 | 일본어명 | 이유 |
|------|---------|------|
| **사주** | 四柱推命 | 핵심 기능, LLM 프롬프트 가장 단순, 즉각적 가치 |
| **궁합** | 相性占い | 카카오 채널 2위 수익원, 구현 복잡도 낮음 |

### 제외 (MVP 이후)

| 기능 | 이유 |
|------|------|
| 大運 (대운) | 10년 운세 = 복잡한 사주 계산 로직 필요, Week 1-4 불가 |
| 택일 | 달력 기반 알고리즘 + 일본 카렌더 변환 필요, 별도 스프린트 |

> MVP = **四柱推命 + 相性占い** 2가지. 이것만으로도 결제 검증 충분.

---

## 3. LLM 프롬프트 설계

### 3-1. 四柱推命 (사주) 프롬프트

```
SYSTEM:
あなたは日本の四柱推命の専門家です。ユーザーの生年月日と生まれた時間から
四柱（年柱・月柱・日柱・時柱）を算出し、性格、才能、2024年の運勢を
日本語で丁寧にお伝えします。

重要なルール:
- 結果は必ず「参考情報」として提示し、予言ではないことを明記する
- 生年月日のみ使用し、個人を特定できる情報は一切使用しない
- 回答は400文字以内にまとめる
- 最後に「※本結果はアルゴリズムによる自動計算です。人生の重要な決断は
  専門家にご相談ください。」を必ず追記する

USER:
生年月日: {YYYY}年{MM}月{DD}日
生まれた時間帯: {時間帯} ※不明な場合は「不明」
```

**입력 검증 (M6 프롬프트 인젝션 방어):**
```javascript
// CF Workers에서 user input 전처리
function sanitizeInput(birthdate) {
  // 숫자와 날짜 형식만 허용
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) throw new Error('Invalid date');
  const date = new Date(birthdate);
  if (isNaN(date)) throw new Error('Invalid date');
  if (date > new Date()) throw new Error('Future date not allowed');
  if (date < new Date('1900-01-01')) throw new Error('Too old');
  return birthdate; // 검증된 날짜만 반환
}
// user role만 전달, system role에 사용자 입력 절대 포함 금지
```

### 3-2. 相性占い (궁합) 프롬프트

```
SYSTEM:
あなたは日本の占い師として、二人の生年月日から相性を占います。
干支、五行のバランスから相性スコア（100点満点）と
関係のポイントを日本語でお伝えします。
回答は300文字以内。末尾に免責文を必ず追記。

USER:
あなた: {YYYY1}年{MM1}月{DD1}日生まれ
お相手: {YYYY2}年{MM2}月{DD2}日生まれ
```

---

## 4. UX 플로우 — LINE Messaging API vs LIFF 역할 구분

```
LINE Messaging API 담당             LIFF 담당
────────────────────                ─────────────────────────────────
① 친구 추가 감지 (follow event)
② 웰컴 메시지 발송                  
   "ようこそ！四柱推命AI へ🌿"
   [占いを始める] 버튼              → ③ LIFF 앱 오픈 (liff.init())
                                    ④ 연령 확인 팝업 (18세 미만 차단)
                                    ⑤ 개인정보 동의 팝업
                                       (체크박스 필수, 건너뛰기 불가)
                                    ⑥ 메뉴 선택
                                       [四柱推命] [相性占い]
                                    ⑦ 생년월일 입력 폼
                                    ⑧ Stripe 결제 (¥200)
                                       → Stripe Elements iframe
                                    ⑨ 결제 성공 → CF Workers 호출
                                    ⑩ LLM 결과 표시
                                    ⑪ [LINEでシェア] 버튼
                                       → liff.sendMessages() 호출

⑫ 결과 공유 메시지 수신 (선택)
⑬ 텍스트 질문 수신 → 안내 메시지
   (자유 질문 미지원, 메뉴 유도)
```

**핵심 구분 원칙:**
- LINE Messaging API: 알림성 메시지, 친구 추가/제거 이벤트, 폴백 안내
- LIFF: 모든 인터랙티브 UI (입력, 결제, 결과 표시)
- 결제는 반드시 LIFF 내에서 처리 (외부 브라우저 이탈 최소화)

---

## 5. CF Workers 백엔드 아키텍처

### 엔드포인트 설계

```
POST /webhook          — LINE Webhook 수신 (서명 검증 필수)
POST /api/payment      — Stripe 결제 세션 생성
POST /api/fortune      — LLM 점괘 생성 (결제 확인 후)
GET  /api/health       — 헬스체크
```

### 서명 검증 코드 (M1 구현)

```javascript
// worker.js
async function verifyLineSignature(body, signature, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

export default {
  async fetch(request, env) {
    if (request.url.endsWith('/webhook')) {
      const body = await request.text();
      const sig = request.headers.get('x-line-signature');
      if (!await verifyLineSignature(body, sig, env.LINE_CHANNEL_SECRET)) {
        return new Response('Unauthorized', { status: 401 });
      }
      // ... webhook 처리
    }
  }
}
```

### Rate Limiting (S5 구현)

```javascript
// CF Workers KV로 Rate Limit 구현
async function checkRateLimit(env, lineUserId) {
  const key = `rl:${lineUserId}:${Math.floor(Date.now() / 60000)}`; // 분 단위
  const count = parseInt(await env.KV.get(key) || '0');
  if (count >= 5) return false; // 분당 5회 초과
  await env.KV.put(key, String(count + 1), { expirationTtl: 120 });
  return true;
}
```

### Secrets 관리 (M2)

```bash
# wrangler로 등록 (코드에 절대 하드코딩 금지)
wrangler secret put LINE_CHANNEL_SECRET
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
wrangler secret put OPENAI_API_KEY
wrangler secret put STRIPE_SECRET_KEY
```

---

## 6. LIFF 프론트엔드 핵심 구조

### 세션 처리 (M3, M4)

```javascript
// LIFF 초기화 및 토큰 처리
async function initLiff() {
  await liff.init({ liffId: env.LIFF_ID });
  
  // M3: accessToken은 세션 내에서만 사용, localStorage 저장 금지
  const token = liff.getAccessToken();
  // API 호출 시 Authorization 헤더로만 사용
  // 절대로: localStorage.setItem('token', token) 금지
  
  // M4: 생년월일은 서버로 전송 후 즉시 폐기
  // KV에 저장 안 함. LLM 응답 생성 후 즉시 소멸
}
```

### 동의 팝업 (CLO 요구사항)

```html
<!-- 건너뛸 수 없는 구조 — 체크박스 미체크 시 버튼 비활성 -->
<div id="consent-modal" class="modal">
  <h2>プライバシーポリシーへの同意</h2>
  <p>占い結果の生成のため、生年月日を一時的に利用します。
     データは処理後即時削除され、保存されません。</p>
  <label>
    <input type="checkbox" id="age-check" required>
    18歳以上であることを確認しました
  </label>
  <label>
    <input type="checkbox" id="privacy-check" required>
    <a href="https://kgg2512.github.io/saju-japan/privacy" target="_blank">
      プライバシーポリシー</a>に同意します
  </label>
  <label>
    <input type="checkbox" id="terms-check" required>
    <a href="https://kgg2512.github.io/saju-japan/tokushoho" target="_blank">
      特定商取引法に基づく表示</a>を確認しました
  </label>
  <button id="consent-btn" disabled>占いを始める 🌿</button>
</div>

<script>
// 3개 체크박스 모두 체크 시에만 버튼 활성화
['age-check','privacy-check','terms-check'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    const allChecked = ['age-check','privacy-check','terms-check']
      .every(i => document.getElementById(i).checked);
    document.getElementById('consent-btn').disabled = !allChecked;
  });
});
</script>
```

### 결과 면책 문구 (CLO 요구사항)

```html
<div class="disclaimer">
  ※本結果は四柱推命アルゴリズムによる自動計算です。
  予言・保証ではございません。人生の重要な決断には
  専門家のご意見をお求めください。
</div>
```

---

## 7. 법적 필수 페이지 (GitHub Pages, 론칭 블로커)

### 필요 파일 구조

```
kgg2512.github.io/saju-japan/
├── index.html          — LIFF 앱 메인
├── privacy.html        — プライバシーポリシー (M5, CLO)
└── tokushoho.html      — 特定商取引法に基づく表示 (CLO 론칭 블로커)
```

### 특상법 필수 기재 항목

```
販売業者: G2 Company Ltd.
代表者: 강경구 (Kyunggu Kang)
所在地: 申請により開示
電話番号: 申請により開示（メールにて対応）
メールアドレス: kgg2512@gmail.com
販売価格: 1占い ¥200（税込）
支払方法: クレジットカード（Stripe）
サービス提供時期: 決済完了後即時
返品・キャンセル: デジタルコンテンツのため返品不可
```

---

## 8. GitHub 레포 구조

### 레포명: `kgg2512/saju-japan`

```
saju-japan/
├── .github/
│   └── workflows/
│       └── deploy.yml          — GitHub Pages 자동 배포
├── docs/                       — GitHub Pages 루트
│   ├── index.html              — LIFF 앱 메인
│   ├── privacy.html            — 프라이버시 정책
│   ├── tokushoho.html          — 특상법 페이지
│   └── assets/
│       ├── style.css           — LINE 초록 브랜딩
│       └── app.js              — LIFF 로직
├── workers/
│   └── saju-worker/
│       ├── worker.js           — CF Workers 메인
│       ├── wrangler.toml       — CF 설정
│       └── package.json
├── .gitignore                  — .env, node_modules
└── README.md
```

**GitHub Pages 설정:** Settings → Pages → Source: `docs/` 폴더

---

## 9. 개발 로드맵 (주 단위)

### Week 1 — 인프라 + 법적 기반 (론칭 블로커 제거)
**목표:** LINE OA 연결 + 법적 페이지 완성

| 작업 | 담당 | 시간 |
|------|------|------|
| GitHub 레포 생성 (`saju-japan`) | Alpha+CTO | 30분 |
| LINE Developers Console — OA 생성 | 회장 직접 | 1시간 |
| LIFF 앱 등록 (developers.line.biz) | 회장 직접 | 30분 |
| `privacy.html` 작성 (일본어) | CTO/CDO | 2시간 |
| `tokushoho.html` 작성 (일본어) | CLO확인 | 2시간 |
| CF Workers 프로젝트 초기화 | CTO | 1시간 |
| Webhook 서명 검증 구현 (M1) | CTO | 2시간 |
| 웰컴 메시지 + LIFF 링크 발송 | CTO | 1시간 |

**완료 기준:** LINE OA 친구 추가 시 LIFF 링크 수신 확인

### Week 2 — 핵심 기능 구현
**목표:** 사주 + 궁합 LLM 결과 (결제 전 테스트)

| 작업 | 담당 | 시간 |
|------|------|------|
| LIFF 동의 팝업 + 연령 확인 | CTO | 3시간 |
| 생년월일 입력 폼 (UI) | CDO | 3시간 |
| CF Workers GPT-4o mini 연동 | CTO | 3시간 |
| 四柱推命 프롬프트 튜닝 | CTO | 2시간 |
| 相性占い 프롬프트 튜닝 | CTO | 2시간 |
| Rate Limiting 구현 (S5) | CTO | 1시간 |
| M6 프롬프트 인젝션 방어 | CTO | 1시간 |

**완료 기준:** 생년월일 입력 → LLM 결과 표시 (결제 없이)

### Week 3 — 결제 연동 + 보안 강화
**목표:** Stripe ¥200 결제 완성

| 작업 | 담당 | 시간 |
|------|------|------|
| Stripe Japan 계정 생성 | 회장 직접 | 1시간 |
| Stripe 본인 확인 제출 | 회장 직접 | 2시간 |
| Stripe Elements LIFF 연동 | CTO | 4시간 |
| 결제 성공 → LLM 호출 플로우 | CTO | 2시간 |
| KV 결제 상태 임시 저장 (TTL 1h) | CTO | 1시간 |
| Webhook 결제 이벤트 처리 | CTO | 2시간 |
| E2E 테스트 (Stripe 테스트 모드) | CTO | 2시간 |

**완료 기준:** ¥200 결제 → 결과 표시 전체 플로우 성공

### Week 4 — 일본어 검수 + 소프트 론칭
**목표:** 5명 베타 테스터 실사용

| 작업 | 담당 | 시간 |
|------|------|------|
| 전체 일본어 문구 네이티브 검수 | CMO (AI번역+검토) | 3시간 |
| LINE OA 인증 신청 (선택) | 회장 | 1시간 |
| Stripe 라이브 모드 전환 | 회장+CTO | 1시간 |
| 모바일 UI 최종 검수 (iPhone/Android) | CDO | 2시간 |
| 베타 테스터 5명 초대 | CMO | 1시간 |
| 첫 결제 모니터링 | CTO | 상시 |

**완료 기준:** 라이브 ¥200 결제 1건 이상 성공

---

## 10. 핵심 기술 리스크 TOP 3

### 리스크 1: Stripe Japan 계정 심사 지연 (HIGH)
- **문제:** Stripe Japan은 일본 사업자 등록 요구 가능성. 한국 사업자로 신청 시 심사 2~4주 소요.
- **현실:** Stripe Japan 공식 사이트는 해외 사업자 수용하나, 개인정보보호법·자금결제법 준수 서류 요구.
- **대응:** Week 1에 즉시 Stripe Japan 계정 생성 시작. 심사 기간 동안 결제 없이 Week 1-2 진행 가능.
- **최악 시나리오:** Stripe Japan 불가 시 → Stripe.com (글로벌) + 엔화 설정으로 대체 가능.

### 리스크 2: LIFF WebView Stripe Elements 렌더링 실패 (MEDIUM)
- **문제:** LINE 인앱 브라우저(LIFF)는 일부 JavaScript API 미지원. Stripe.js iframe이 차단될 가능성.
- **현실:** LIFF는 Chrome 기반이나 일부 제한 있음 (예: liff.openWindow() 정책 변경 이력).
- **대응:** Week 3에 실기기 테스트 필수. 문제 발생 시 → `liff.openWindow(stripe_checkout_url, {external: true})`로 외부 브라우저 결제 fallback.
- **Fallback 구현 비용:** 1일 추가.

### 리스크 3: GPT-4o mini 사주 품질 미달 (LOW~MEDIUM)
- **문제:** GPT-4o mini는 Four Pillars(사주팔자) 계산 정확도가 낮을 수 있음. 특히 시주(時柱) 계산.
- **현실:** 사주는 복잡한 음양력 변환 알고리즘 필요 (단순 LLM 의존 불가).
- **대응:** 사주 계산 로직은 **JS 라이브러리로 먼저 팔자 산출** 후 LLM에 해석만 의뢰.
  ```javascript
  // 사주 계산: lunar-calendar 라이브러리 사용
  // https://www.npmjs.com/package/lunar-calendar
  const pillars = calculateFourPillars(birthdate, birthtime);
  // LLM에는 계산된 팔자 전달, 계산은 LLM이 안 함
  const prompt = `四柱: ${pillars}。この四柱から性格と運勢を解説してください。`;
  ```
- **추가 작업:** lunar-calendar 또는 korean-lunar-calendar npm 패키지 CF Workers에 번들링. (1~2일 추가)

---

## 11. 즉시 실행 체크리스트

### Day 1 (오늘)
- [ ] GitHub 레포 `kgg2512/saju-japan` 생성
- [ ] LINE Developers Console 접속 → Provider + Official Account 생성
- [ ] Stripe Japan 계정 신청 시작 (심사 기간 고려 최우선)

### Day 2-3
- [ ] `wrangler init saju-worker` CF Workers 초기화
- [ ] LINE Webhook URL을 CF Workers로 등록
- [ ] `privacy.html` + `tokushoho.html` 초안 작성

### Day 4-7
- [ ] LIFF 앱 등록 + LIFF ID 확보
- [ ] 동의 팝업 + 생년월일 폼 구현
- [ ] GPT-4o mini 호출 테스트

---

## 12. 비용 시뮬레이션 (월)

| 항목 | 비용 |
|------|------|
| CF Workers | $0 (무료 100K req/일) |
| GitHub Pages | $0 |
| GPT-4o mini (1,000 쿼리/월) | ~$0.75 |
| Stripe 수수료 (¥200 × 100건) | ~$5.60 (3.6%+¥30) |
| **LLM 총계 (CFO 한도 $10 이내)** | **$0.75~$10** |

**손익분기:** 월 20쿼리 결제 = ¥4,000 = ~$27 > 운영비 $0.15 → 즉시 흑자

---

*기술 스펙 완성. 회장 승인 후 Day 1 태스크 즉시 착수 가능.*
