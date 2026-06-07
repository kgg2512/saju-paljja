/**
 * markets/korea/worker/index.js
 * 사주AI — Korea CF Workers 스켈레톤 (Phase 2)
 *
 * 상태: Phase 2 대기 중
 * 블로커:
 *   - 브랜드명 미확정 (CLO: "사주팔자" 상표권 리스크)
 *   - 사업자등록 필요
 *   - 통신판매업신고 필요
 *   - KakaoPay vs Stripe Korea 결제 수단 미확정
 *
 * 아키텍처: Japan과 동일 구조, 카카오톡 Messaging API webhook만 다름
 * X-Market 헤더: 'korea'
 *
 * Secrets 필요 (Phase 2 확정 후 등록):
 *   wrangler secret put KAKAO_CLIENT_SECRET  (or 미사용)
 *   wrangler secret put OPENAI_API_KEY
 *   wrangler secret put STRIPE_SECRET_KEY    (또는 KAKAO_PAY_SECRET)
 *
 * 참고: Japan worker (markets/japan/worker/index.js) 패턴 그대로 재사용
 * 변경 포인트: webhook 서명 검증, 결제 플랫폼, 메시지 API, 법무 링크
 */

// ──────────────────────────────────────────
// CORS 헤더 (CISO: 캐싱금지)
// ──────────────────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://kgg2512.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache',
};

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ──────────────────────────────────────────
// TODO (Phase 2):
// 1. 카카오톡 Messaging API webhook 서명 검증 구현
//    - 카카오 채널: 카카오 개발자 콘솔에서 채널 생성
//    - Webhook URL: https://saju-ai-korea.{CF_ACCOUNT}.workers.dev/webhook
//    - 검증 방식: 카카오 공식 문서 참조
//
// 2. 결제 플랫폼 확정 후 구현
//    Option A: Stripe Korea (사업자 카드 결제)
//    Option B: KakaoPay (간편결제, 전환율 높음)
//    - KakaoPay: 사업자등록 필수, 계약 2~4주 소요
//
// 3. GPT-4o mini 한국어 프롬프트
//    → shared/saju-engine/prompts.js KOREA_PROMPTS 사용
//
// 4. 법무 페이지 (PIPA 기준)
//    - 개인정보처리방침 (privacy.html)
//    - 이용약관 (terms.html)
//    - 환불정책 (refund.html) — 전자상거래법 준수
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// 입력 검증 (Japan과 동일)
// ──────────────────────────────────────────
function validateDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error('Invalid date format');
  const [y, m, d] = dateStr.split('-').map(Number);
  if (y < 1900 || y > 2010) throw new Error('Year out of range');
  if (m < 1 || m > 12) throw new Error('Invalid month');
  if (d < 1 || d > 31) throw new Error('Invalid day');
  return { year: y, month: m, day: d };
}

// ──────────────────────────────────────────
// /api/health — 헬스체크
// ──────────────────────────────────────────
function handleHealth() {
  return corsResponse({
    status: 'ok',
    market: 'korea',
    service: '사주AI (Phase 2 대기)',
    phase: 2,
    blockers: [
      '브랜드명 미확정 (CLO 검토 필요)',
      '사업자등록 미완료',
      '통신판매업신고 미완료',
      '결제 수단 미확정 (KakaoPay vs Stripe)',
    ],
    timestamp: new Date().toISOString(),
  });
}

// ──────────────────────────────────────────
// /api/payment — 스켈레톤 (Phase 2 미구현)
// ──────────────────────────────────────────
async function handlePayment(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  // Phase 2: Stripe Korea or KakaoPay 구현 예정
  // Japan worker handlePayment 패턴 재사용, 통화만 'krw'로 변경
  // KRW 단가: 990 (CFO 확정)
  return corsResponse({
    error: 'Korea market is in Phase 2 preparation. Not yet active.',
    phase: 2,
  }, 503);
}

// ──────────────────────────────────────────
// /api/fortune — 스켈레톤 (Phase 2 미구현)
// ──────────────────────────────────────────
async function handleFortune(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  // Phase 2: Japan worker handleFortune 패턴 재사용
  // KOREA_PROMPTS (shared/saju-engine/prompts.js) 사용
  // 차이점: systemPrompt 한국어, maxAge 19세
  return corsResponse({
    error: 'Korea market is in Phase 2 preparation. Not yet active.',
    phase: 2,
  }, 503);
}

// ──────────────────────────────────────────
// /webhook — 카카오톡 Webhook 스켈레톤
// ──────────────────────────────────────────
async function handleWebhook(request, env) {
  // Phase 2: 카카오톡 채널 Webhook 처리 구현 예정
  // 1. 카카오 서명 검증 (카카오 공식 방식)
  // 2. 팔로우/메시지 이벤트 처리
  // 3. 사주AI LIFF URL 발송 (카카오 챗봇 메시지)
  return new Response('Korea Phase 2 - Not yet implemented', {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}

// ──────────────────────────────────────────
// 메인 라우터
// ──────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (path.endsWith('/webhook')) return handleWebhook(request, env);
    if (path.endsWith('/api/payment')) return handlePayment(request, env);
    if (path.endsWith('/api/fortune')) return handleFortune(request, env);
    if (path.endsWith('/api/health')) return handleHealth();

    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  },
};

/*
 * Korea Phase 2 체크리스트:
 * [ ] 브랜드명 확정 (CLO 승인 필수)
 * [ ] 사업자등록 (국세청)
 * [ ] 통신판매업신고 (공정거래위원회)
 * [ ] KakaoPay 파트너 신청 OR Stripe Korea 계정
 * [ ] 카카오 채널 생성 (비즈 채널 신청)
 * [ ] 카카오 i 오픈빌더 OR Messaging API 선택
 * [ ] 개인정보처리방침 작성 (PIPA/개인정보보호법)
 * [ ] 이용약관 작성 (전자상거래법 준수)
 * [ ] 환불정책 작성 (14일 청약철회권 고지)
 * [ ] CF Workers KV 네임스페이스 생성
 * [ ] Secrets 등록
 */
