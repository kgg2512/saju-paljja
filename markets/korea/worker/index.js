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

// 명식 계산 엔진 (JP와 동일 단일 소스, wrangler가 번들링)
import { calculateChart, buildMeishikiSummary } from '../../../shared/saju-engine/saju-v2.js';

// 사주 웹앱 "나도 만들기" 랜딩 (G1 결과 공유 URL 확정 전 임시 링크 — 결과 토큰 URL 준비되면 교체)
const SAJU_WEB_LANDING = 'https://kgg2512.github.io/saju-paljja/?market=kr&utm_source=kakao_bot';

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
  // 엔진 v2 지원 범위(1900~2099)와 일치. 기존 '> 2010'은 복붙 오류로 2011년 이후 출생자를 전원 거부했음.
  if (y < 1900 || y > 2099) throw new Error('Year out of range');
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
// /skill/saju — 카카오 i 오픈빌더 스킬 서버 (LLM 불필요, 명식 계산만)
//   오픈빌더 skill 요청 → 생년월일 파싱 → 사주 요약 + 전체 풀이 링크를
//   오픈빌더 응답 JSON(simpleText/basicCard)으로 반환. Secrets 불요(순수 계산).
// ──────────────────────────────────────────

/** 24시각(0~23) → 지지 시주 (23~01=子). 미상이면 '不明'. */
function hourToBranch(h) {
  if (h == null || Number.isNaN(h)) return '不明';
  const B = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return B[Math.floor(((h + 1) % 24) / 2)];
}

const EL_KO = { 木: '목(木)', 火: '화(火)', 土: '토(土)', 金: '금(金)', 水: '수(水)' };
const elKo = (e) => EL_KO[e] || e;

/** 오픈빌더 요청 → { year, month, day, hour } 또는 null. action.params 우선, 없으면 utterance 파싱. */
function parseBirth(body) {
  const params = (body && body.action && body.action.params) || {};
  const cand = [params.birthdate, params.birthDate, params.date, params.sys_date, params.bday];
  let dstr = '';
  for (const c of cand) {
    if (!c) continue;
    let v = c;
    // sys.date 엔티티는 {"value":"YYYY-MM-DD"} JSON 문자열로 올 수 있음
    if (typeof v === 'string' && v.trim().startsWith('{')) {
      try { v = JSON.parse(v).value || ''; } catch { /* 원문 유지 */ }
    }
    if (typeof v === 'string' && v.trim()) { dstr = v.trim(); break; }
  }
  const utter = (body && body.userRequest && body.userRequest.utterance) || '';
  const mt =
    dstr.match(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/) ||
    dstr.match(/^(\d{4})(\d{2})(\d{2})$/) ||
    utter.match(/(\d{4})\D{1,3}(\d{1,2})\D{1,3}(\d{1,2})/);
  if (!mt) return null;
  const y = +mt[1], m = +mt[2], d = +mt[3];
  if (y < 1900 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  let hour = null;
  const hm = (params.hour != null ? String(params.hour) : '').match(/(\d{1,2})/) || utter.match(/(\d{1,2})\s*시/);
  if (hm) hour = +hm[1];
  return { year: y, month: m, day: d, hour };
}

/** chart → 한국어 챗봇 요약(티저). 전체 풀이는 웹으로 유도. */
function buildKoreanSummary(chart) {
  const ec = chart.elementCount;
  return [
    `· 일간(日主): ${chart.dayMaster.kanji} · ${elKo(chart.dayMaster.element)} ${chart.dayMaster.yang ? '양(陽)' : '음(陰)'}`,
    `· 오행: 목${ec.木} 화${ec.火} 토${ec.土} 금${ec.金} 수${ec.水}`,
    `· 강한 기운 ${elKo(chart.dominant)} / 약한 기운 ${elKo(chart.lacking)}`,
    `· 올해(${chart.annual.year}) ${chart.annual.kanji}년의 흐름은 전체 풀이에서 확인하세요.`,
  ].join('\n');
}

function obSimpleText(text) {
  return {
    version: '2.0',
    template: {
      outputs: [{ simpleText: { text } }],
      quickReplies: [{ label: '전체 풀이 보기', action: 'webLink', webLinkUrl: SAJU_WEB_LANDING }],
    },
  };
}

function obCard(title, description, link) {
  return {
    version: '2.0',
    template: {
      outputs: [{
        basicCard: {
          title,
          description,
          buttons: [{ action: 'webLink', label: '전체 풀이 보기', webLinkUrl: link }],
        },
      }],
      quickReplies: [{ label: '나도 만들기', action: 'webLink', webLinkUrl: link }],
    },
  };
}

async function handleSkillSaju(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== 'POST') return corsResponse(obSimpleText('POST로 호출해주세요.'), 405);

  let body = {};
  try { body = await request.json(); } catch { /* 빈 본문 허용 */ }

  const birth = parseBirth(body);
  if (!birth) {
    return corsResponse(obSimpleText('생년월일을 알려주세요. 예) 1990-03-15 (양력)\n태어난 시간을 알면 더 정확해요.'));
  }

  let chart;
  try {
    chart = calculateChart(birth.year, birth.month, birth.day, hourToBranch(birth.hour));
  } catch {
    return corsResponse(obSimpleText('입력한 날짜를 확인해주세요. (1900~2099년, 양력 YYYY-MM-DD)'));
  }

  const summary = buildKoreanSummary(chart);
  const title = `${birth.year}.${String(birth.month).padStart(2, '0')}.${String(birth.day).padStart(2, '0')} 사주 요약`;
  const description = `${summary}\n\n※ 사주 알고리즘 자동 계산 · 참고 정보이며 예언·보장이 아닙니다.`;
  return corsResponse(obCard(title, description, SAJU_WEB_LANDING));
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

    if (path.endsWith('/skill/saju') || path.endsWith('/skill')) return handleSkillSaju(request, env);
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
