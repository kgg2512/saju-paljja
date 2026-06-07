/**
 * shared/saju-engine/saju.js
 * 사주팔자 계산 엔진 — CF Workers 환경에서 실행
 *
 * 의존성: lunar-calendar (npm) — CF Workers 번들링 필요
 * 저장 금지: 이 모듈은 어떤 데이터도 저장하지 않음 (CISO 원칙)
 */

// ──────────────────────────────────────────
// 천간 (天干, Heavenly Stems)
// ──────────────────────────────────────────
const HEAVENLY_STEMS = [
  { kanji: '甲', reading: 'きのえ', element: '木', polarity: '陽', en: 'Jiǎ' },
  { kanji: '乙', reading: 'きのと', element: '木', polarity: '陰', en: 'Yǐ' },
  { kanji: '丙', reading: 'ひのえ', element: '火', polarity: '陽', en: 'Bǐng' },
  { kanji: '丁', reading: 'ひのと', element: '火', polarity: '陰', en: 'Dīng' },
  { kanji: '戊', reading: 'つちのえ', element: '土', polarity: '陽', en: 'Wù' },
  { kanji: '己', reading: 'つちのと', element: '土', polarity: '陰', en: 'Jǐ' },
  { kanji: '庚', reading: 'かのえ', element: '金', polarity: '陽', en: 'Gēng' },
  { kanji: '辛', reading: 'かのと', element: '金', polarity: '陰', en: 'Xīn' },
  { kanji: '壬', reading: 'みずのえ', element: '水', polarity: '陽', en: 'Rén' },
  { kanji: '癸', reading: 'みずのと', element: '水', polarity: '陰', en: 'Guǐ' },
];

// ──────────────────────────────────────────
// 지지 (地支, Earthly Branches)
// ──────────────────────────────────────────
const EARTHLY_BRANCHES = [
  { kanji: '子', reading: 'ね', animal: '鼠', element: '水', hours: '23-1' },
  { kanji: '丑', reading: 'うし', animal: '牛', element: '土', hours: '1-3' },
  { kanji: '寅', reading: 'とら', animal: '虎', element: '木', hours: '3-5' },
  { kanji: '卯', reading: 'う', animal: '兎', element: '木', hours: '5-7' },
  { kanji: '辰', reading: 'たつ', animal: '龍', element: '土', hours: '7-9' },
  { kanji: '巳', reading: 'み', animal: '蛇', element: '火', hours: '9-11' },
  { kanji: '午', reading: 'うま', animal: '馬', element: '火', hours: '11-13' },
  { kanji: '未', reading: 'ひつじ', animal: '羊', element: '土', hours: '13-15' },
  { kanji: '申', reading: 'さる', animal: '猿', element: '金', hours: '15-17' },
  { kanji: '酉', reading: 'とり', animal: '鶏', element: '金', hours: '17-19' },
  { kanji: '戌', reading: 'いぬ', animal: '犬', element: '土', hours: '19-21' },
  { kanji: '亥', reading: 'い', animal: '猪', element: '水', hours: '21-23' },
];

// 시지 (時支) 매핑 — 한자 시각 표기 → 지지 인덱스
const HOUR_BRANCH_MAP = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
  '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11,
  '不明': null,
};

// ──────────────────────────────────────────
// 연주 (年柱) 계산
// 기준: 1924년 = 甲子년 (갑자년)
// ──────────────────────────────────────────
function getYearPillar(lunarYear) {
  const BASE_YEAR = 1924; // 甲子
  const offset = ((lunarYear - BASE_YEAR) % 60 + 60) % 60;
  const stemIdx = offset % 10;
  const branchIdx = offset % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanji: HEAVENLY_STEMS[stemIdx].kanji + EARTHLY_BRANCHES[branchIdx].kanji,
    reading: HEAVENLY_STEMS[stemIdx].reading + EARTHLY_BRANCHES[branchIdx].reading,
  };
}

// ──────────────────────────────────────────
// 월주 (月柱) 계산
// 기준: 연간(年干)에 따라 인월(寅月=1월)의 천간 결정
// 오호둔두법 (五虎遁頭法)
// ──────────────────────────────────────────
function getMonthPillar(lunarYear, lunarMonth) {
  // 연간 기준 인월 천간 시작 인덱스
  const yearStemIdx = ((lunarYear - 1924) % 10 + 10) % 10;
  // 오호둔두법: 甲己년=丙寅, 乙庚년=戊寅, 丙辛년=庚寅, 丁壬년=壬寅, 戊癸년=甲寅
  const monthStemStarts = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 인월 천간 시작 (甲=0 기준)
  const inmonthStemStart = monthStemStarts[yearStemIdx % 5 === 0 ? 0 :
    yearStemIdx % 5 === 1 ? 1 :
    yearStemIdx % 5 === 2 ? 2 :
    yearStemIdx % 5 === 3 ? 3 : 4];

  // 음력 월 → 지지 인덱스 (寅月=1월=인덱스2 기준)
  // 음력 1월 = 寅(2), 2월 = 卯(3), ..., 12월 = 丑(1)
  const monthBranchBase = 2; // 寅
  const branchIdx = (monthBranchBase + lunarMonth - 1) % 12;

  // 천간 인덱스
  const stemStartMap = { 甲: 2, 乙: 4, 丙: 6, 丁: 8, 戊: 0, 己: 2, 庚: 4, 辛: 6, 壬: 8, 癸: 0 };
  const yearStemKanji = HEAVENLY_STEMS[yearStemIdx].kanji;
  const stemBase = stemStartMap[yearStemKanji] ?? 2;
  const stemIdx = (stemBase + lunarMonth - 1) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanji: HEAVENLY_STEMS[stemIdx].kanji + EARTHLY_BRANCHES[branchIdx].kanji,
    reading: HEAVENLY_STEMS[stemIdx].reading + EARTHLY_BRANCHES[branchIdx].reading,
  };
}

// ──────────────────────────────────────────
// 일주 (日柱) 계산
// 기준일: 1924년 1월 1일 = 甲子일 (JD 2423892 기준)
// 실제 정확한 일주는 만세력 DB 필요하나,
// 60일 주기 계산은 근사값으로 충분
// ──────────────────────────────────────────
function getDayPillar(year, month, day) {
  // Julian Day Number 계산
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
    Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // 기준일: 1924-01-01 = JDN 2423892 = 甲子 (인덱스 0)
  const BASE_JDN = 2423892;
  const offset = ((jdn - BASE_JDN) % 60 + 60) % 60;
  const stemIdx = offset % 10;
  const branchIdx = offset % 12;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanji: HEAVENLY_STEMS[stemIdx].kanji + EARTHLY_BRANCHES[branchIdx].kanji,
    reading: HEAVENLY_STEMS[stemIdx].reading + EARTHLY_BRANCHES[branchIdx].reading,
  };
}

// ──────────────────────────────────────────
// 시주 (時柱) 계산
// 오자둔두법 (五子遁頭法) — 일간 기준
// ──────────────────────────────────────────
function getTimePillar(dayPillar, hourBranchKanji) {
  if (hourBranchKanji === '不明' || !hourBranchKanji) {
    return { kanji: '不明', reading: 'ふめい', stem: null, branch: null };
  }

  const branchIdx = HOUR_BRANCH_MAP[hourBranchKanji];
  if (branchIdx === null || branchIdx === undefined) {
    return { kanji: '不明', reading: 'ふめい', stem: null, branch: null };
  }

  const dayStemIdx = HEAVENLY_STEMS.findIndex(s => s.kanji === dayPillar.stem.kanji);
  // 오자둔두: 甲己日=甲子시, 乙庚日=丙子시, 丙辛日=戊子시, 丁壬日=庚子시, 戊癸日=壬子시
  const timeStemStarts = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 자시(子時) 천간 시작
  const stemBase = timeStemStarts[dayStemIdx];
  const stemIdx = (stemBase + branchIdx) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    kanji: HEAVENLY_STEMS[stemIdx].kanji + EARTHLY_BRANCHES[branchIdx].kanji,
    reading: HEAVENLY_STEMS[stemIdx].reading + EARTHLY_BRANCHES[branchIdx].reading,
  };
}

// ──────────────────────────────────────────
// 음력 변환 (간이 알고리즘)
// 실제 배포 시 lunar-calendar npm 패키지로 교체 권장
// CF Workers에서 lunar-calendar 사용:
//   import LunarCalendar from 'lunar-calendar';
//   const lunar = LunarCalendar.solarToLunar(year, month, day);
// ──────────────────────────────────────────
function solarToLunarApprox(year, month, day) {
  // 양력 → 음력 근사 변환 (±1일 오차 허용)
  // 정확한 변환은 만세력 DB 필요
  // MVP용 간이 알고리즘: 19년 주기(메톤 주기) 기반

  // 음력 새해 양력 날짜 테이블 (2000~2040)
  const lunarNewYear = {
    2000: [2,5], 2001: [1,24], 2002: [2,12], 2003: [2,1], 2004: [1,22],
    2005: [2,9], 2006: [1,29], 2007: [2,18], 2008: [2,7], 2009: [1,26],
    2010: [2,14], 2011: [2,3], 2012: [1,23], 2013: [2,10], 2014: [1,31],
    2015: [2,19], 2016: [2,8], 2017: [1,28], 2018: [2,16], 2019: [2,5],
    2020: [1,25], 2021: [2,12], 2022: [2,1], 2023: [1,22], 2024: [2,10],
    2025: [1,29], 2026: [2,17], 2027: [2,6], 2028: [1,26], 2029: [2,13],
    2030: [2,3], 2031: [1,23], 2032: [2,11], 2033: [1,31], 2034: [2,19],
    2035: [2,8], 2036: [1,28], 2037: [2,15], 2038: [2,4], 2039: [1,24],
    2040: [2,12],
  };

  // 1900~1999 추가 (주요 연도)
  const extTable = {
    1900:[1,31],1901:[2,19],1902:[2,8],1903:[1,29],1904:[2,16],
    1905:[2,4],1906:[1,25],1907:[2,13],1908:[2,2],1909:[1,22],
    1910:[2,10],1911:[1,30],1912:[2,18],1913:[2,6],1914:[1,26],
    1915:[2,14],1916:[2,3],1917:[1,23],1918:[2,11],1919:[2,1],
    1920:[2,20],1921:[2,8],1922:[1,28],1923:[2,16],1924:[2,5],
    1925:[1,25],1926:[2,13],1927:[2,2],1928:[1,23],1929:[2,10],
    1930:[1,30],1931:[2,17],1932:[2,6],1933:[1,26],1934:[2,14],
    1935:[2,4],1936:[1,24],1937:[2,11],1938:[1,31],1939:[2,19],
    1940:[2,8],1941:[1,27],1942:[2,15],1943:[2,5],1944:[1,25],
    1945:[2,13],1946:[2,2],1947:[1,22],1948:[2,10],1949:[1,29],
    1950:[2,17],1951:[2,6],1952:[1,27],1953:[2,14],1954:[2,3],
    1955:[1,24],1956:[2,12],1957:[1,31],1958:[2,18],1959:[2,8],
    1960:[1,28],1961:[2,15],1962:[2,5],1963:[1,25],1964:[2,13],
    1965:[2,2],1966:[1,21],1967:[2,9],1968:[1,30],1969:[2,17],
    1970:[2,6],1971:[1,27],1972:[2,15],1973:[2,3],1974:[1,23],
    1975:[2,11],1976:[1,31],1977:[2,18],1978:[2,7],1979:[1,28],
    1980:[2,16],1981:[2,5],1982:[1,25],1983:[2,13],1984:[2,2],
    1985:[2,20],1986:[2,9],1987:[1,29],1988:[2,17],1989:[2,6],
    1990:[1,27],1991:[2,15],1992:[2,4],1993:[1,23],1994:[2,10],
    1995:[1,31],1996:[2,19],1997:[2,7],1998:[1,28],1999:[2,16],
  };

  const allTable = { ...extTable, ...lunarNewYear };
  const newYearEntry = allTable[year];

  let lunarYear = year;
  let lunarMonth, lunarDay;

  if (newYearEntry) {
    const [nyMonth, nyDay] = newYearEntry;
    const nyDate = new Date(year, nyMonth - 1, nyDay);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate - nyDate) / 86400000);

    if (diffDays < 0) {
      // 음력 설 이전 → 전년도 음력 12월로 매핑 (근사)
      // diffDays가 -1 ~ -30이면 12월, -31 이하면 11월 등으로 역산
      lunarYear = year - 1;
      const absOffset = -diffDays; // 설로부터 며칠 전
      if (absOffset <= 30) {
        lunarMonth = 12;
        lunarDay = 30 - absOffset + 1; // 12월 말에서 거슬러올라감
        if (lunarDay < 1) { lunarMonth = 11; lunarDay += 30; }
      } else {
        lunarMonth = 11;
        lunarDay = 60 - absOffset + 1;
        if (lunarDay < 1) { lunarMonth = 10; lunarDay += 30; }
      }
      lunarDay = Math.max(1, lunarDay);
    } else {
      // 음력 설 이후
      lunarMonth = 1;
      lunarDay = diffDays + 1;
      // 월 조정 (음력 월은 29~30일)
      while (lunarDay > 30) { lunarDay -= 30; lunarMonth++; }
      if (lunarMonth > 12) { lunarMonth = 12; }
    }
  } else {
    // 테이블 없는 연도는 양력 그대로 사용 (근사)
    lunarYear = year;
    lunarMonth = month;
    lunarDay = day;
  }

  return { year: lunarYear, month: lunarMonth, day: lunarDay };
}

// ──────────────────────────────────────────
// 메인 사주 계산 함수
// ──────────────────────────────────────────

/**
 * 생년월일시로 사주팔자 계산
 * @param {number} year - 양력 연도
 * @param {number} month - 양력 월 (1-12)
 * @param {number} day - 양력 일 (1-31)
 * @param {string} hourBranchKanji - 시지 한자 (子|丑|...|亥|不明)
 * @returns {object} pillars - 4기둥 데이터
 */
export function calculateFourPillars(year, month, day, hourBranchKanji = '不明') {
  // 입력 검증
  if (!year || !month || !day) throw new Error('Invalid date');
  if (year < 1900 || year > 2100) throw new Error('Year out of range');
  if (month < 1 || month > 12) throw new Error('Invalid month');
  if (day < 1 || day > 31) throw new Error('Invalid day');

  // 음력 변환 (연주/월주 계산용)
  const lunar = solarToLunarApprox(year, month, day);

  // 4기둥 계산
  const yearPillar  = getYearPillar(lunar.year);
  const monthPillar = getMonthPillar(lunar.year, lunar.month);
  const dayPillar   = getDayPillar(year, month, day);   // 일주는 양력 기준
  const timePillar  = getTimePillar(dayPillar, hourBranchKanji);

  // 오행 분석
  const elements = [
    yearPillar.stem?.element, yearPillar.branch?.element,
    monthPillar.stem?.element, monthPillar.branch?.element,
    dayPillar.stem?.element, dayPillar.branch?.element,
    timePillar.stem?.element, timePillar.branch?.element,
  ].filter(Boolean);

  const elementCount = elements.reduce((acc, el) => {
    acc[el] = (acc[el] || 0) + 1;
    return acc;
  }, {});

  const dominant = Object.entries(elementCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '土';
  const lacking  = Object.entries(elementCount).sort((a, b) => a[1] - b[1])[0]?.[0] || '水';

  return {
    year:  { kanji: yearPillar.kanji,  reading: yearPillar.reading,  stem: yearPillar.stem,  branch: yearPillar.branch },
    month: { kanji: monthPillar.kanji, reading: monthPillar.reading, stem: monthPillar.stem, branch: monthPillar.branch },
    day:   { kanji: dayPillar.kanji,   reading: dayPillar.reading,   stem: dayPillar.stem,   branch: dayPillar.branch },
    time:  { kanji: timePillar.kanji,  reading: timePillar.reading,  stem: timePillar.stem,  branch: timePillar.branch },
    elementCount,
    dominant,
    lacking,
    // LLM 프롬프트용 요약
    summary: `四柱: ${yearPillar.kanji}(年) ${monthPillar.kanji}(月) ${dayPillar.kanji}(日) ${timePillar.kanji}(時) / 主要五行: ${dominant} / 不足五行: ${lacking}`,
  };
}

/**
 * 궁합 점수 계산 (五行 기반)
 * @param {object} pillars1 - 본인 사주
 * @param {object} pillars2 - 상대 사주
 * @returns {number} score - 0~100
 */
export function calculateCompatibility(pillars1, pillars2) {
  // 오행 상생/상극 관계
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 상생
  const KE    = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' }; // 상극

  const el1 = pillars1.dominant;
  const el2 = pillars2.dominant;

  let baseScore = 50;

  if (SHENG[el1] === el2 || SHENG[el2] === el1) {
    baseScore += 25; // 상생: 高 점수
  } else if (el1 === el2) {
    baseScore += 10; // 같은 오행: 보통
  } else if (KE[el1] === el2 || KE[el2] === el1) {
    baseScore -= 15; // 상극: 低 점수
  }

  // 일지(日支) 합충 계산
  const branch1 = pillars1.day.branch?.kanji;
  const branch2 = pillars2.day.branch?.kanji;

  // 지지 삼합
  const SANHE = [['子','辰','申'], ['丑','巳','酉'], ['寅','午','戌'], ['卯','未','亥']];
  for (const group of SANHE) {
    if (group.includes(branch1) && group.includes(branch2)) {
      baseScore += 10;
      break;
    }
  }

  // 지지 충 (対冲)
  const CHONG = { 子:'午', 丑:'未', 寅:'申', 卯:'酉', 辰:'戌', 巳:'亥' };
  const reverseChong = Object.fromEntries(Object.entries(CHONG).map(([k,v]) => [v,k]));
  const allChong = { ...CHONG, ...reverseChong };
  if (branch1 && branch2 && allChong[branch1] === branch2) {
    baseScore -= 10;
  }

  // 0~100 범위 클램핑
  return Math.max(10, Math.min(100, baseScore));
}

/**
 * 입력 날짜 검증 (CF Workers용)
 * @param {string} dateStr - 'YYYY-MM-DD' 형식
 * @returns {object} { year, month, day } 검증된 값
 * @throws Error 유효하지 않은 경우
 */
export function validateAndParseDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) throw new Error('Invalid date');
  if (d > new Date()) throw new Error('Future date not allowed');
  if (year < 1900) throw new Error('Year must be 1900 or later');
  return { year, month, day };
}
