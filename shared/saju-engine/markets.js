/**
 * shared/saju-engine/markets.js
 * 마켓별 설정 — 단가, 플랫폼, 언어, 통화, 결제 수단
 *
 * 기준: CFO 확정값 + CISO X-Market 헤더 분기 체계
 * 변경 시 CFO + CISO 재승인 필요
 */

// ──────────────────────────────────────────
// 마켓 설정 맵
// ──────────────────────────────────────────
export const MARKETS = {

  japan: {
    id: 'japan',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'line',          // LINE Messaging API + LIFF
    language: 'ja',
    currency: 'jpy',
    currencySymbol: '¥',
    priceUnit: 200,            // 1쿼리 단가 (CFO 확정)
    bep: 8,                    // 손익분기 쿼리 수
    payment: 'stripe',         // Stripe Japan (LINE Pay Japan 2025-04-30 종료)
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=jp',
    liffEndpoint: 'https://kgg2512.github.io/saju-paljja/markets/japan/liff/',
    workerRoute: '/japan/*',
    region: 'JP',
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    legalRequired: ['tokushoho', 'privacy', 'terms'],
    stripeLocale: 'ja',
    minAge: 18,
    llmLang: 'ja',
    // 마켓별 UX 텍스트
    ui: {
      consentBtn: '占いを始める 🌿',
      payBtn: '¥200 を支払って占う ✨',
      shareMsg: (label, preview) =>
        `✨ MEIで${label}しました！\n\n🌿 ${preview}\n▶ 今すぐ試す\nhttps://lin.ee/REPLACE_ME\n#MEI #四柱推命`,
    },
  },

  korea: {
    id: 'korea',
    name: '사주AI',             // 브랜드명 미확정 — Phase 2 확정 후 변경
    nameLatin: 'SajuAI',
    platform: 'kakao',         // KakaoTalk Messaging API
    language: 'ko',
    currency: 'krw',
    currencySymbol: '₩',
    priceUnit: 990,            // 1쿼리 단가 (CFO 확정)
    bep: 11,
    payment: 'stripe',         // KakaoPay or Stripe Korea — 브랜드 확정 후 선택
    liffEndpoint: 'https://kgg2512.github.io/saju-paljja/markets/korea/',
    workerRoute: '/korea/*',
    region: 'KR',
    locale: 'ko-KR',
    timezone: 'Asia/Seoul',
    legalRequired: ['privacy', 'terms'],  // PIPA 기준
    stripeLocale: 'ko',
    minAge: 19,                // 한국: 19세 미만 금지
    status: 'phase2',         // Phase 2 — 브랜드명 미확정, 사업자등록 필요
    ui: {
      consentBtn: '사주 보기 시작 🌿',
      payBtn: '₩990 결제하고 보기 ✨',
      shareMsg: (label, preview) =>
        `✨ 사주AI로 ${label} 봤어요!\n\n🌿 ${preview}\n▶ 지금 확인하기\n#사주AI #사주팔자`,
    },
  },

  taiwan: {
    id: 'taiwan',
    name: 'MEI',             // Japan과 동일 브랜드 — 언어만 다름
    nameLatin: 'MEI',
    platform: 'line',
    language: 'zh-TW',
    currency: 'twd',
    currencySymbol: 'NT$',
    priceUnit: 45,             // NT$45 (CFO 확정)
    bep: 12,
    payment: 'stripe',         // LINE Pay Taiwan 활성 여부 확인 필요 (Taiwan = LINE Pay OK)
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=tw',
    liffEndpoint: 'https://kgg2512.github.io/saju-paljja/markets/taiwan/liff/',
    workerRoute: '/taiwan/*',
    region: 'TW',
    locale: 'zh-TW',
    timezone: 'Asia/Taipei',
    legalRequired: ['privacy', 'terms'],  // PIPL 기준
    stripeLocale: 'zh',
    minAge: 18,
    status: 'phase3',         // Phase 3 예정
    llmLang: 'zh-TW',
    ui: {
      consentBtn: '開始算命 🌿',
      payBtn: 'NT$45 付款算命 ✨',
      shareMsg: (label, preview) =>
        `✨ 用MEI算了${label}！\n\n🌿 ${preview}\n▶ 立即體驗\n#MEI #八字`,
    },
  },

  thailand: {
    id: 'thailand',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'line',
    language: 'th',
    currency: 'thb',
    currencySymbol: '฿',
    priceUnit: 39,             // ฿39 (CFO 확정)
    bep: 14,
    payment: 'stripe',         // LINE Pay Thailand 확인 필요
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=th',
    liffEndpoint: 'https://kgg2512.github.io/saju-paljja/markets/thailand/liff/',
    workerRoute: '/thailand/*',
    region: 'TH',
    locale: 'th-TH',
    timezone: 'Asia/Bangkok',
    legalRequired: ['privacy', 'terms'],  // PDPA 기준
    stripeLocale: 'th',
    minAge: 18,
    status: 'phase3',         // Phase 3 예정
    llmLang: 'th',
    ui: {
      consentBtn: 'เริ่มดูดวง 🌿',
      payBtn: '฿39 ชำระเงินดูดวง ✨',
      shareMsg: (label, preview) =>
        `✨ ดู${label}กับ MEI แล้ว!\n\n🌿 ${preview}\n▶ ลองเลย\n#MeiSeiAI #ดูดวง`,
    },
  },

  // ── K-pop 확장 마켓 (범용 웹앱, LIFF 없음) ───────────────────────────────

  philippines: {
    id: 'philippines',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'web',           // 범용 웹앱 — 어떤 메신저 링크도 동작
    language: 'en',
    currency: 'php',
    currencySymbol: '₱',
    priceUnit: 59,             // ₱59 (CFO 확정)
    bep: 10,
    payment: 'stripe',
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=ph',
    workerRoute: '/web/*',
    region: 'PH',
    locale: 'en-PH',
    timezone: 'Asia/Manila',
    legalRequired: ['privacy', 'terms'],  // DPA 2012 기준
    stripeLocale: 'en',
    minAge: 18,
    status: 'phase3',
    llmLang: 'en',
    ui: {
      consentBtn: 'Start Reading 🌿',
      payBtn: '₱59 Pay & Read ✨',
      shareMsg: (label, preview) =>
        `✨ Got my ${label} on MEI!\n\n🌿 ${preview}\n▶ Try it now\n#MeiSeiAI #BaZi`,
    },
  },

  vietnam: {
    id: 'vietnam',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'web',           // 범용 웹앱
    language: 'vi',
    currency: 'vnd',
    currencySymbol: '₫',
    priceUnit: 25000,          // ₫25,000 (CFO 확정)
    bep: 9,
    payment: 'stripe',
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=vn',
    workerRoute: '/web/*',
    region: 'VN',
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
    legalRequired: ['privacy', 'terms'],  // PDPD 기준
    stripeLocale: 'vi',
    minAge: 18,
    status: 'phase3',
    llmLang: 'vi',
    ui: {
      consentBtn: 'Bắt đầu xem bói 🌿',
      payBtn: '₫25.000 Thanh toán ✨',
      shareMsg: (label, preview) =>
        `✨ Đã xem ${label} với MEI!\n\n🌿 ${preview}\n▶ Thử ngay\n#MeiSeiAI #TứTrụ`,
    },
  },

  malaysia: {
    id: 'malaysia',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'web',           // 범용 웹앱
    language: 'ms',
    currency: 'myr',
    currencySymbol: 'RM',
    priceUnit: 6,              // RM6 (CFO 확정)
    bep: 10,
    payment: 'stripe',
    webAppUrl: 'https://kgg2512.github.io/saju-paljja/markets/web/app.html?market=my',
    workerRoute: '/web/*',
    region: 'MY',
    locale: 'ms-MY',
    timezone: 'Asia/Kuala_Lumpur',
    legalRequired: ['privacy', 'terms'],  // PDPA 2010 기준
    stripeLocale: 'ms',
    minAge: 18,
    status: 'phase3',
    llmLang: 'ms',
    ui: {
      consentBtn: 'Mula Bacaan 🌿',
      payBtn: 'RM6 Bayar & Baca ✨',
      shareMsg: (label, preview) =>
        `✨ Dapat ${label} di MEI!\n\n🌿 ${preview}\n▶ Cuba sekarang\n#MeiSeiAI #BaZi`,
    },
  },

  global: {
    id: 'global',
    name: 'MEI',
    nameLatin: 'MEI',
    platform: 'web',           // 직접 웹 접근 (Stripe)
    language: 'en',
    currency: 'usd',
    currencySymbol: '$',
    priceUnit: 200,            // $2.00 in cents (Stripe 기준) (CFO 확정)
    priceDisplay: '$2.00',
    bep: 6,
    payment: 'stripe',
    liffEndpoint: 'https://kgg2512.github.io/saju-paljja/',
    workerRoute: '/global/*',
    region: 'GLOBAL',
    locale: 'en-US',
    timezone: 'UTC',
    legalRequired: ['privacy', 'terms'],
    stripeLocale: 'en',
    minAge: 18,
    status: 'phase3',         // Phase 3 예정
    ui: {
      consentBtn: 'Start Reading 🌿',
      payBtn: '$2.00 Pay & Read ✨',
      shareMsg: (label, preview) =>
        `✨ Got my ${label} on MEI!\n\n🌿 ${preview}\n▶ Try it now\n#MeiSeiAI #BaZi`,
    },
  },
};

// ──────────────────────────────────────────
// 헬퍼 함수
// ──────────────────────────────────────────

/**
 * X-Market 헤더에서 마켓 설정 가져오기
 * @param {string} marketHeader - 'japan'|'korea'|'taiwan'|'thailand'|'global'
 * @returns {object} 마켓 설정
 */
export function getMarketConfig(marketHeader) {
  const market = marketHeader?.toLowerCase();
  // 단축 코드(jp/th/tw/ph/vn/my) → 전체 키 매핑
  const shortToFull = {
    jp: 'japan', th: 'thailand', tw: 'taiwan',
    ph: 'philippines', vn: 'vietnam', my: 'malaysia',
    ko: 'korea',
  };
  const resolved = shortToFull[market] || market;
  return MARKETS[resolved] || MARKETS.global;
}

/**
 * 마켓별 Stripe 단가 (센트 단위로 반환)
 * @param {string} market
 * @returns {number} amount in smallest currency unit
 */
export function getStripeAmount(market) {
  const config = getMarketConfig(market);
  // JPY, KRW, TWD, THB는 소수점 없는 통화
  const noDecimalCurrencies = ['jpy', 'krw'];
  if (noDecimalCurrencies.includes(config.currency)) {
    return config.priceUnit; // 그대로 반환
  }
  // USD 등은 cents 단위
  return config.priceUnit; // 이미 cents 단위 (USD: 200 = $2.00)
}

/**
 * X-Market 헤더 유효성 검증
 */
export function isValidMarket(market) {
  const shortCodes = ['jp', 'th', 'tw', 'ph', 'vn', 'my', 'ko'];
  const m = market?.toLowerCase();
  return Object.keys(MARKETS).includes(m) || shortCodes.includes(m);
}

/**
 * 활성화된 마켓 목록 (Phase 1만)
 */
export const ACTIVE_MARKETS = Object.values(MARKETS)
  .filter(m => !m.status || m.status === 'active' || m.id === 'japan')
  .map(m => m.id);
