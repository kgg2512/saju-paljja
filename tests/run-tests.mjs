/**
 * tests/run-tests.mjs
 * 엔진 v2 vs 독립 오라클(lunar-javascript) 대조 테스트
 * 실행: node run-tests.mjs  (사전: node gen-vectors.cjs)
 *
 * 판정 기준 (작업지시서 C3):
 *  - 四柱(년/월/일/시주) 간지 일치율 100% — 단 절기 경계 ±75분 이내 출생은 허용 오차(별도 집계)
 *    (오라클 lunar-javascript는 CST(UTC+8) 프레임, 엔진은 JST(UTC+9) 프레임 → 60분 시프트
 *     + 천문 근사 오차 실측 ~5분 → 여유 포함 75분. 실측: 1905 입춘 오라클 대비 5분 차)
 *  - 대운: 방향 100%, 간지열(8柱) 100%, 기운나이 ±0.6년
 */
import fs from 'node:fs';
import {
  calculateChart, calculateCompatibility, validateAndParseDate,
} from '../shared/saju-engine/saju-v2.js';

const vectors = JSON.parse(fs.readFileSync(new URL('./vectors.json', import.meta.url)));

let pass = 0, fail = 0, tolerated = 0;
const failures = [];

for (const v of vectors) {
  const chart = calculateChart(v.y, v.m, v.d, '不明', {
    gender: v.gender,
    exactHour: v.h + v.min / 60,
    now: new Date('2026-06-12T12:00:00+09:00'),
  });
  const e = v.expect;
  const errs = [];

  if (chart.year.kanji !== e.year) errs.push(`年柱 ${chart.year.kanji}≠${e.year}`);
  if (chart.month.kanji !== e.month) errs.push(`月柱 ${chart.month.kanji}≠${e.month}`);
  if (chart.day.kanji !== e.day) errs.push(`日柱 ${chart.day.kanji}≠${e.day}`);
  if (chart.time.kanji !== e.time) errs.push(`時柱 ${chart.time.kanji}≠${e.time}`);

  if (!chart.daeun) errs.push('대운 미계산');
  else {
    if (chart.daeun.forward !== e.forward) errs.push(`대운방향 ${chart.daeun.forward}≠${e.forward}`);
    const ours = chart.daeun.pillars.map(p => p.kanji).join(',');
    const theirs = e.daYun.join(',');
    if (!ours.startsWith(theirs) && !theirs.startsWith(ours)) errs.push(`대운간지 ${ours} ≠ ${theirs}`);
    if (Math.abs(chart.daeun.startAge - e.startYears) > 0.6) {
      errs.push(`기운나이 ${chart.daeun.startAge}≠${e.startYears.toFixed(2)}`);
    }
  }

  if (errs.length === 0) { pass++; continue; }

  // 허용 오차: 절기 경계 ±75분 이내 출생 (오라클 기준 — CST/JST 프레임 60분 + 근사 오차)
  if (typeof v.minToJie === 'number' && v.minToJie <= 75) {
    tolerated++;
    continue;
  }
  fail++;
  failures.push(`${v.y}-${v.m}-${v.d} ${v.h}:${String(v.min).padStart(2, '0')} ${v.gender}: ${errs.join(' | ')}`);
}

// ── 단위 검증: 일주 앵커 ──
const anchorErrs = [];
{
  // 1949-10-01 = 甲子日 (역사 기록 앵커)
  const c = calculateChart(1949, 10, 1, '不明', { now: new Date('2026-06-12') });
  if (c.day.kanji !== '甲子') anchorErrs.push(`1949-10-01 일주 ${c.day.kanji} ≠ 甲子`);
}
{
  // validateAndParseDate
  let threw = false;
  try { validateAndParseDate('2020-02-30'); } catch { threw = true; }
  if (!threw) anchorErrs.push('validateAndParseDate가 2020-02-30을 통과시킴');
}
{
  // 궁합 점수 범위
  const a = calculateChart(1990, 5, 15, '未', { gender: 'male', now: new Date('2026-06-12') });
  const b = calculateChart(1992, 8, 20, '子', { gender: 'female', now: new Date('2026-06-12') });
  const s = calculateCompatibility(a, b);
  if (!(s >= 10 && s <= 100)) anchorErrs.push(`궁합 점수 범위 밖: ${s}`);
}

console.log('════════════════════════════════════════');
console.log(`총 벡터: ${vectors.length}`);
console.log(`PASS: ${pass} | 허용오차(절기±75분): ${tolerated} | FAIL: ${fail}`);
console.log(`단위 검증 오류: ${anchorErrs.length}`);
console.log('════════════════════════════════════════');
if (failures.length) {
  console.log('실패 상세 (최대 30건):');
  failures.slice(0, 30).forEach(f => console.log('  ✗ ' + f));
}
anchorErrs.forEach(f => console.log('  ✗ [unit] ' + f));

process.exit(fail > 0 || anchorErrs.length > 0 ? 1 : 0);
