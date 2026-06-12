/**
 * shared/saju-engine/saju-v2.js
 * 사주팔자 계산 엔진 v2 — 절기(節氣) 기반 정밀 계산
 *
 * v1 대비 변경 (2026-06-12 사주아이 갭 해소 스프린트):
 *  - 연주: 입춘(立春, 태양황경 315°) 경계 기준 (v1: 음력 설 기준 — 명리학 비표준)
 *  - 월주: 절기(節) 경계 기준 — 태양황경 직접 계산 (v1: 음력 월 30일 고정 근사 → 다발성 오류)
 *  - 일주: 앵커 교정 — (JDN + 49) % 60, 검증 앵커 1949-10-01 = 甲子日 (v1: 1924-01-01=甲子 가정 → -1일 오프셋)
 *  - 신규: 십성(十神) · 지장간(藏干) · 대운(大運: 방향/기운나이/8柱) · 일간 강약 근사
 *  - 음력 변환 의존성 완전 제거 (사주 계산에 음력 불필요 — 절기/일진은 모두 태양력 기반)
 *
 * 천문 계산: Meeus 저정밀 태양황경 (오차 ~0.01° ≈ 절기 시각 ±15분).
 * 절기 경계 ±15분 이내 출생만 영향 — 시간대(2시간 단위) 입력 제품 특성상 허용.
 * 입력 시각은 JST(UTC+9) 기준. ΔT(≤2분) 무시 — 허용 오차 내.
 *
 * 저장 금지: 이 모듈은 어떤 데이터도 저장하지 않음 (CISO 원칙)
 * CF Workers 호환: 외부 의존성 0, 순수 계산만.
 */

const DEG = Math.PI / 180;

// ──────────────────────────────────────────
// 천간 (天干) / 지지 (地支)
// ──────────────────────────────────────────
export const HEAVENLY_STEMS = [
  { kanji: '甲', reading: 'きのえ',   element: '木', yang: true  },
  { kanji: '乙', reading: 'きのと',   element: '木', yang: false },
  { kanji: '丙', reading: 'ひのえ',   element: '火', yang: true  },
  { kanji: '丁', reading: 'ひのと',   element: '火', yang: false },
  { kanji: '戊', reading: 'つちのえ', element: '土', yang: true  },
  { kanji: '己', reading: 'つちのと', element: '土', yang: false },
  { kanji: '庚', reading: 'かのえ',   element: '金', yang: true  },
  { kanji: '辛', reading: 'かのと',   element: '金', yang: false },
  { kanji: '壬', reading: 'みずのえ', element: '水', yang: true  },
  { kanji: '癸', reading: 'みずのと', element: '水', yang: false },
];

export const EARTHLY_BRANCHES = [
  { kanji: '子', reading: 'ね',     element: '水', yang: true  },
  { kanji: '丑', reading: 'うし',   element: '土', yang: false },
  { kanji: '寅', reading: 'とら',   element: '木', yang: true  },
  { kanji: '卯', reading: 'う',     element: '木', yang: false },
  { kanji: '辰', reading: 'たつ',   element: '土', yang: true  },
  { kanji: '巳', reading: 'み',     element: '火', yang: false },
  { kanji: '午', reading: 'うま',   element: '火', yang: true  },
  { kanji: '未', reading: 'ひつじ', element: '土', yang: false },
  { kanji: '申', reading: 'さる',   element: '金', yang: true  },
  { kanji: '酉', reading: 'とり',   element: '金', yang: false },
  { kanji: '戌', reading: 'いぬ',   element: '土', yang: true  },
  { kanji: '亥', reading: 'い',     element: '水', yang: false },
];

// 지장간 (藏干) — 본기(本氣) 우선 순서
const HIDDEN_STEMS = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
};

const STEM_IDX = Object.fromEntries(HEAVENLY_STEMS.map((s, i) => [s.kanji, i]));
const BRANCH_IDX = Object.fromEntries(EARTHLY_BRANCHES.map((b, i) => [b.kanji, i]));
const ELEMENTS = ['木', '火', '土', '金', '水'];
const ELEM_IDX = { 木: 0, 火: 1, 土: 2, 金: 3, 水: 4 };

// 십성 (十神) — [관계][음양동이] / 관계: 0=동일오행 1=일간이 生 2=일간이 剋 3=일간을 剋 4=일간을 生
const TEN_GODS = [
  ['比肩', '劫財'],
  ['食神', '傷官'],
  ['偏財', '正財'],
  ['偏官', '正官'],
  ['偏印', '印綬'],
];

/**
 * 십성 계산: 일간(dayStemIdx) 기준 대상 천간(targetStemIdx)의 십성
 */
export function tenGodOf(dayStemIdx, targetStemIdx) {
  const eD = ELEM_IDX[HEAVENLY_STEMS[dayStemIdx].element];
  const eT = ELEM_IDX[HEAVENLY_STEMS[targetStemIdx].element];
  const samePolarity = HEAVENLY_STEMS[dayStemIdx].yang === HEAVENLY_STEMS[targetStemIdx].yang;
  let rel;
  if (eT === eD) rel = 0;                       // 동일
  else if (eT === (eD + 1) % 5) rel = 1;        // 일간이 생함 (食傷)
  else if (eT === (eD + 2) % 5) rel = 2;        // 일간이 극함 (財)
  else if (eT === (eD + 3) % 5) rel = 3;        // 일간을 극함 (官殺)
  else rel = 4;                                  // 일간을 생함 (印)
  return TEN_GODS[rel][samePolarity ? 0 : 1];
}

// ──────────────────────────────────────────
// 율리우스일 / 태양황경 (Meeus 저정밀)
// ──────────────────────────────────────────
export function jdnFromYmd(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy +
    Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** JST 시각 → JD(UT 근사) */
export function jdFromJst(y, m, d, hourJst) {
  return jdnFromYmd(y, m, d) - 0.5 + (hourJst - 9) / 24;
}

/** 태양 시황경 (apparent longitude, 도 단위 0~360) */
export function solarLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * DEG;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lambda % 360) + 360) % 360;
}

/** 각도차 정규화 [-180, 180) */
function angDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

/**
 * [jdLo, jdHi] 구간에서 태양황경이 target(도)을 통과하는 시각(JD) — 이분 탐색
 * 전제: 구간 내 단조 증가 통과 1회 (구간 ≤ 33일)
 */
export function findTermCrossing(jdLo, jdHi, targetDeg) {
  let lo = jdLo, hi = jdHi;
  let fLo = angDiff(solarLongitude(lo), targetDeg);
  const fHi = angDiff(solarLongitude(hi), targetDeg);
  if (fLo > 0 || fHi < 0) {
    // 창 보정 (드문 경계) — ±3일 확장 후 재시도
    lo -= 3; hi += 3;
    fLo = angDiff(solarLongitude(lo), targetDeg);
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (angDiff(solarLongitude(mid), targetDeg) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 해당 연도 입춘(立春, 황경 315°) 시각 JD */
export function lichunJd(year) {
  return findTermCrossing(jdFromJst(year, 1, 30, 12), jdFromJst(year, 2, 10, 12), 315);
}

// ──────────────────────────────────────────
// 60갑자 헬퍼
// ──────────────────────────────────────────
function cycleIndex(stemIdx, branchIdx) {
  for (let k = 0; k < 60; k++) {
    if (k % 10 === stemIdx && k % 12 === branchIdx) return k;
  }
  return 0;
}

function pillarFromCycle(c) {
  const s = HEAVENLY_STEMS[((c % 10) + 10) % 10];
  const b = EARTHLY_BRANCHES[((c % 12) + 12) % 12];
  return { stem: s, branch: b, kanji: s.kanji + b.kanji, reading: s.reading + b.reading };
}

function makePillar(stemIdx, branchIdx) {
  const s = HEAVENLY_STEMS[stemIdx];
  const b = EARTHLY_BRANCHES[branchIdx];
  return { stem: s, branch: b, kanji: s.kanji + b.kanji, reading: s.reading + b.reading };
}

// 시지 대표 시각 (早子時 관례: 子 = 00:00~01:00 기준)
const BRANCH_REP_HOUR = { 子: 0.5, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };

// ──────────────────────────────────────────
// 메인: 명식(命式) 계산
// ──────────────────────────────────────────
/**
 * @param {number} year  양력 연 (JST)
 * @param {number} month 양력 월 1-12
 * @param {number} day   양력 일
 * @param {string} hourBranchKanji 시지 한자 (子~亥) 또는 '不明'
 * @param {object} [opts]
 * @param {('male'|'female'|null)} [opts.gender] 대운 계산용 (없으면 daeun=null)
 * @param {number} [opts.exactHour] 정확 출생시각 (JST, 0~24 float) — 테스트/정밀용. 지정 시 시지도 이로부터 유도
 * @param {Date}   [opts.now] 현재 시점 (나이/올해 계산 기준, 기본 호출 시점)
 */
export function calculateChart(year, month, day, hourBranchKanji = '不明', opts = {}) {
  if (!year || !month || !day) throw new Error('Invalid date');
  if (year < 1900 || year > 2099) throw new Error('Year out of range');
  if (month < 1 || month > 12) throw new Error('Invalid month');
  if (day < 1 || day > 31) throw new Error('Invalid day');

  const gender = opts.gender === 'male' || opts.gender === 'female' ? opts.gender : null;

  // 출생 시각 결정 (천문 계산용)
  let hourJst;
  let branchIdx = null;
  if (typeof opts.exactHour === 'number') {
    hourJst = opts.exactHour;
    branchIdx = Math.floor(((hourJst + 1) % 24) / 2); // 23시→子(0), 1시→丑(1)...
  } else if (hourBranchKanji && hourBranchKanji !== '不明' && BRANCH_REP_HOUR[hourBranchKanji] !== undefined) {
    hourJst = BRANCH_REP_HOUR[hourBranchKanji];
    branchIdx = BRANCH_IDX[hourBranchKanji];
  } else {
    hourJst = 12; // 시간 미상 → 정오 가정 (절기 경계 영향 최소화)
  }

  const birthJd = jdFromJst(year, month, day, hourJst);

  // ── 연주: 입춘 경계 ──
  const lichun = lichunJd(year);
  const sajuYear = birthJd < lichun ? year - 1 : year;
  const yearStemIdx = ((sajuYear - 1984) % 10 + 10) % 10;   // 1984 = 甲子年
  const yearBranchIdx = ((sajuYear - 1984) % 12 + 12) % 12;
  const yearPillar = makePillar(yearStemIdx, yearBranchIdx);

  // ── 월주: 태양황경 직접 매핑 (寅月 = 315°~345°) ──
  const lambda = solarLongitude(birthJd);
  const monthIdx = Math.floor((((lambda - 315) % 360) + 360) % 360 / 30); // 0=寅 ... 11=丑
  const monthBranchIdx = (2 + monthIdx) % 12;
  const monthStemIdx = ((yearStemIdx % 5) * 2 + 2 + monthIdx) % 10;        // 五虎遁
  const monthPillar = makePillar(monthStemIdx, monthBranchIdx);

  // ── 일주: (JDN + 49) % 60, 앵커 1949-10-01 = 甲子 ──
  const jdn = jdnFromYmd(year, month, day);
  const dayCycle = (jdn + 49) % 60;
  const dayPillar = pillarFromCycle(dayCycle);
  const dayStemIdx = dayCycle % 10;

  // ── 시주: 五鼠遁 (早子時 관례 — 일주 변경 없음) ──
  let timePillar;
  if (branchIdx === null) {
    timePillar = { stem: null, branch: null, kanji: '不明', reading: 'ふめい' };
  } else {
    const zhStarts = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
    const timeStemIdx = (zhStarts[dayStemIdx] + branchIdx) % 10;
    timePillar = makePillar(timeStemIdx, branchIdx);
  }

  // ── 십성 ──
  const tg = (stemKanji) => stemKanji ? tenGodOf(dayStemIdx, STEM_IDX[stemKanji]) : null;
  const branchMain = (b) => b ? HIDDEN_STEMS[b.kanji][0] : null;
  const tenGods = {
    yearStem:  tg(yearPillar.stem.kanji),
    monthStem: tg(monthPillar.stem.kanji),
    timeStem:  timePillar.stem ? tg(timePillar.stem.kanji) : null,
    yearBranch:  tg(branchMain(yearPillar.branch)),
    monthBranch: tg(branchMain(monthPillar.branch)),
    dayBranch:   tg(branchMain(dayPillar.branch)),
    timeBranch:  timePillar.branch ? tg(branchMain(timePillar.branch)) : null,
  };

  // ── 지장간 ──
  const hiddenStems = {
    year:  HIDDEN_STEMS[yearPillar.branch.kanji],
    month: HIDDEN_STEMS[monthPillar.branch.kanji],
    day:   HIDDEN_STEMS[dayPillar.branch.kanji],
    time:  timePillar.branch ? HIDDEN_STEMS[timePillar.branch.kanji] : null,
  };

  // ── 오행 분포 ──
  const chars = [
    yearPillar.stem, yearPillar.branch,
    monthPillar.stem, monthPillar.branch,
    dayPillar.stem, dayPillar.branch,
    timePillar.stem, timePillar.branch,
  ].filter(Boolean);
  const elementCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  chars.forEach(c => { elementCount[c.element]++; });
  const sorted = ELEMENTS.slice().sort((a, b) => elementCount[b] - elementCount[a]);
  const dominant = sorted[0];
  const lacking = sorted[sorted.length - 1];

  // ── 일간 강약 (근사 — 비간·인성 비율) ──
  const eD = ELEM_IDX[HEAVENLY_STEMS[dayStemIdx].element];
  const supportive = chars.filter(c => {
    const e = ELEM_IDX[c.element];
    return e === eD || e === (eD + 4) % 5; // 동일 오행 + 일간을 생하는 오행
  }).length;
  const supportRatio = supportive / chars.length;
  const strength = supportRatio >= 0.5 ? '身強' : supportRatio >= 0.35 ? '中和' : '身弱';

  // ── 대운 (gender 필요) ──
  let daeun = null;
  if (gender) {
    const yangYear = yearStemIdx % 2 === 0;
    const forward = (yangYear && gender === 'male') || (!yangYear && gender === 'female');
    // 다음/이전 節(월 경계 = 315 + 30k°) 시각
    const targetDeg = forward
      ? (315 + 30 * (monthIdx + 1)) % 360
      : (315 + 30 * monthIdx) % 360;
    const termJd = forward
      ? findTermCrossing(birthJd, birthJd + 33, targetDeg)
      : findTermCrossing(birthJd - 33, birthJd, targetDeg);
    const days = Math.abs(termJd - birthJd);
    const startAge = Math.round((days / 3) * 10) / 10; // 3일 = 1년
    const monthCycle = cycleIndex(monthStemIdx, monthBranchIdx);
    const pillars = [];
    for (let i = 1; i <= 8; i++) {
      const c = ((monthCycle + (forward ? i : -i)) % 60 + 60) % 60;
      const p = pillarFromCycle(c);
      const from = Math.round(startAge) + (i - 1) * 10;
      pillars.push({
        kanji: p.kanji,
        startAge: from,
        endAge: from + 9,
        stemTenGod: tenGodOf(dayStemIdx, c % 10),
      });
    }
    daeun = { forward, startAge, pillars };
  }

  // ── 현재 시점 정보 (올해 간지·나이·현재 대운) ──
  const now = opts.now instanceof Date ? opts.now : new Date();
  const nowY = now.getFullYear();
  const nowJd = jdFromJst(nowY, now.getMonth() + 1, now.getDate(), 12);
  const annualSajuYear = nowJd < lichunJd(nowY) ? nowY - 1 : nowY;
  const aStem = ((annualSajuYear - 1984) % 10 + 10) % 10;
  const aBranch = ((annualSajuYear - 1984) % 12 + 12) % 12;
  const annualPillar = makePillar(aStem, aBranch);
  const ageNow = Math.max(0, Math.floor((nowJd - birthJd) / 365.2425));
  let currentDaeun = null;
  if (daeun) {
    currentDaeun = daeun.pillars.find(p => ageNow >= p.startAge && ageNow <= p.endAge) || null;
  }

  return {
    year: yearPillar, month: monthPillar, day: dayPillar, time: timePillar,
    dayMaster: {
      kanji: HEAVENLY_STEMS[dayStemIdx].kanji,
      element: HEAVENLY_STEMS[dayStemIdx].element,
      yang: HEAVENLY_STEMS[dayStemIdx].yang,
    },
    tenGods, hiddenStems, elementCount, dominant, lacking, strength,
    daeun, currentDaeun, ageNow,
    annual: { year: annualSajuYear, kanji: annualPillar.kanji, stemTenGod: tenGodOf(dayStemIdx, aStem) },
    summary: `四柱: ${yearPillar.kanji}(年) ${monthPillar.kanji}(月) ${dayPillar.kanji}(日) ${timePillar.kanji}(時) / 主五行: ${dominant} / 不足: ${lacking}`,
  };
}

// ──────────────────────────────────────────
// LLM용 명식 데이터 블록 (일본어)
// ──────────────────────────────────────────
export function buildMeishikiSummary(chart) {
  const L = [];
  L.push(`【命式】年柱 ${chart.year.kanji}(${chart.tenGods.yearStem}) / 月柱 ${chart.month.kanji}(${chart.tenGods.monthStem}) / 日柱 ${chart.day.kanji}(日主) / 時柱 ${chart.time.kanji}${chart.tenGods.timeStem ? `(${chart.tenGods.timeStem})` : ''}`);
  L.push(`【日主】${chart.dayMaster.kanji}${chart.dayMaster.element}(${chart.dayMaster.yang ? '陽' : '陰'}) — ${chart.strength}`);
  L.push(`【五行】木${chart.elementCount.木} 火${chart.elementCount.火} 土${chart.elementCount.土} 金${chart.elementCount.金} 水${chart.elementCount.水} / 最多: ${chart.dominant} / 最少: ${chart.lacking}`);
  L.push(`【蔵干十神】年支:${chart.tenGods.yearBranch} 月支:${chart.tenGods.monthBranch} 日支:${chart.tenGods.dayBranch}${chart.tenGods.timeBranch ? ` 時支:${chart.tenGods.timeBranch}` : ''}`);
  if (chart.daeun) {
    const dir = chart.daeun.forward ? '順行' : '逆行';
    const list = chart.daeun.pillars.slice(0, 6)
      .map(p => `${p.startAge}〜${p.endAge}歳 ${p.kanji}(${p.stemTenGod})`).join(', ');
    L.push(`【大運】${dir}, ${chart.daeun.startAge}歳起運 — ${list}`);
    if (chart.currentDaeun) {
      L.push(`【現在の大運】${chart.currentDaeun.startAge}〜${chart.currentDaeun.endAge}歳 ${chart.currentDaeun.kanji}(${chart.currentDaeun.stemTenGod}) / 現在 約${chart.ageNow}歳`);
    }
  }
  L.push(`【今年】${chart.annual.year}年 ${chart.annual.kanji}年 — 日主から見て${chart.annual.stemTenGod}の年`);
  return L.join('\n');
}

// ──────────────────────────────────────────
// 궁합 점수 v2 (五行 + 천간합 + 지지 삼합/육합/충)
// ──────────────────────────────────────────
export function calculateCompatibility(chart1, chart2) {
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

  let score = 50;
  const el1 = chart1.dominant, el2 = chart2.dominant;
  if (SHENG[el1] === el2 || SHENG[el2] === el1) score += 20;
  else if (el1 === el2) score += 8;
  else if (KE[el1] === el2 || KE[el2] === el1) score -= 12;

  // 일간 천간합 (甲己 乙庚 丙辛 丁壬 戊癸)
  const s1 = STEM_IDX[chart1.dayMaster.kanji], s2 = STEM_IDX[chart2.dayMaster.kanji];
  if (s1 !== undefined && s2 !== undefined && Math.abs(s1 - s2) === 5) score += 15;

  const b1 = chart1.day.branch?.kanji, b2 = chart2.day.branch?.kanji;
  // 지지 육합
  const LIUHE = { 子: '丑', 寅: '亥', 卯: '戌', 辰: '酉', 巳: '申', 午: '未' };
  const liuhe = (a, b) => LIUHE[a] === b || LIUHE[b] === a;
  if (b1 && b2 && liuhe(b1, b2)) score += 12;
  // 지지 삼합
  const SANHE = [['申', '子', '辰'], ['巳', '酉', '丑'], ['寅', '午', '戌'], ['亥', '卯', '未']];
  if (b1 && b2 && b1 !== b2 && SANHE.some(g => g.includes(b1) && g.includes(b2))) score += 10;
  // 지지 충
  const CHONG = { 子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥' };
  const chong = (a, b) => CHONG[a] === b || CHONG[b] === a;
  if (b1 && b2 && chong(b1, b2)) score -= 12;

  // 오행 보완 (상대가 내 부족 오행을 많이 가짐)
  if (chart2.elementCount[chart1.lacking] >= 2) score += 5;
  if (chart1.elementCount[chart2.lacking] >= 2) score += 5;

  return Math.max(10, Math.min(100, score));
}

/** 'YYYY-MM-DD' 검증 (v1 호환) */
export function validateAndParseDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime()) || d.getMonth() !== month - 1 || d.getDate() !== day) {
    throw new Error('Invalid date');
  }
  if (d > new Date()) throw new Error('Future date not allowed');
  if (year < 1900) throw new Error('Year must be 1900 or later');
  return { year, month, day };
}
