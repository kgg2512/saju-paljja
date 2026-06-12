/**
 * tests/gen-vectors.cjs
 * 독립 오라클(lunar-javascript, 6tail 만세력)로 사주 테스트 벡터 생성
 * 실행: node gen-vectors.cjs  → vectors.json
 *
 * 벡터 구성:
 *  - 랜덤 300건 (1900-2099, 시드 고정 재현 가능)
 *  - 입춘 경계 108건 (2/3~2/5 × 18개 연도 × 2시각)
 *  - 월 절기 경계 88건 (각 월 절입 추정일 ±0 × 4개 연도)
 * 시간은 2~22시 사용 (晚子時 유파 차이 회피 — 제품 입력은 시간대 단위)
 */
const fs = require('fs');
const { Solar } = require('lunar-javascript');

// 시드 고정 PRNG (재현성)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260612);

function makeVector(y, m, d, h, min, gender) {
  const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const yun = ec.getYun(gender === 'male' ? 1 : 0);
  const daYun = yun.getDaYun().filter(x => x.getGanZhi() !== '').slice(0, 8);
  // 가장 가까운 節(월 경계)까지의 분 — 오라클 기준 (경계 허용 오차 판정용)
  const toMs = (s) => new Date(s.toYmdHms().replace(' ', 'T')).getTime();
  const birthMs = new Date(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`).getTime();
  const minToJie = Math.min(
    Math.abs(birthMs - toMs(lunar.getPrevJie().getSolar())),
    Math.abs(birthMs - toMs(lunar.getNextJie().getSolar()))
  ) / 60000;
  return {
    y, m, d, h, min, gender, minToJie: Math.round(minToJie),
    expect: {
      year: ec.getYear(),
      month: ec.getMonth(),
      day: ec.getDay(),
      time: ec.getTime(),
      forward: yun.isForward(),
      startYears: yun.getStartYear() + yun.getStartMonth() / 12 + yun.getStartDay() / 365,
      daYun: daYun.map(x => x.getGanZhi()),
    },
  };
}

const vectors = [];

// 1) 랜덤 300건
for (let i = 0; i < 300; i++) {
  const y = 1900 + Math.floor(rnd() * 200);          // 1900-2099
  const m = 1 + Math.floor(rnd() * 12);
  const d = 1 + Math.floor(rnd() * 28);
  const h = 2 + Math.floor(rnd() * 21);              // 2-22시
  const gender = rnd() < 0.5 ? 'male' : 'female';
  vectors.push(makeVector(y, m, d, h, 30, gender));
}

// 2) 입춘 경계
const lichunYears = [1900, 1924, 1950, 1973, 1984, 1987, 2000, 2008, 2016, 2024, 2026, 2033, 2044, 2050, 2066, 2077, 2088, 2099];
let g = 0;
for (const y of lichunYears) {
  for (const d of [3, 4, 5]) {
    for (const [h, min] of [[2, 30], [12, 0]]) {
      vectors.push(makeVector(y, 2, d, h, min, g++ % 2 === 0 ? 'male' : 'female'));
    }
  }
}

// 3) 월 절기 경계 (절입 추정일)
const termDays = [[1, 5], [1, 6], [3, 5], [3, 6], [4, 4], [4, 5], [5, 5], [5, 6], [6, 5], [6, 6],
  [7, 7], [7, 8], [8, 7], [8, 8], [9, 7], [9, 8], [10, 8], [10, 9], [11, 7], [11, 8], [12, 6], [12, 7]];
for (const y of [1955, 1990, 2026, 2070]) {
  for (const [m, d] of termDays) {
    vectors.push(makeVector(y, m, d, 6, 30, g++ % 2 === 0 ? 'male' : 'female'));
  }
}

fs.writeFileSync(__dirname + '/vectors.json', JSON.stringify(vectors));
console.log(`generated ${vectors.length} vectors → vectors.json`);
