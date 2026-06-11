# MEI — 디자인 시스템 명세 v1.0

작성일: 2026-06-07
작성자: g2-cdo
상태: 즉시 개발 착수 가능

---

## 1. 브랜드 아이덴티티

### 서비스명 (최종 권장)
- **일본어**: MEI (MEI)
- **영문**: MEI
- **독음**: MEI (Me-i-se-i AI)
- **의미**: 命(운명) + 星(별, 사주의 별자리) + AI

### 슬로건
- **메인**: 「あなたの命、AIが読み解く。」
- **바이럴**: 「みんな最近これで占ってる。」(사주아이 포지셔닝 직접 대응)
- **부제**: 「四柱推命×AI｜LINEで今すぐ」

### 아이콘/비주얼 방향
- 별(★)과 나뭇잎(🌿) 조합 SVG — LINE 초록 기반
- 한자 "命" 글자를 별 형태로 시각화
- 이모지 활용 가능: ✨🌿⭐️🔮

---

## 2. 컬러 시스템

### Primary Palette
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#06C755` | LINE 공식 그린, CTA 버튼 |
| `--color-primary-dark` | `#05A847` | 버튼 hover/active |
| `--color-primary-light` | `#E8F9EE` | 배경 tint, 카드 배경 |
| `--color-primary-muted` | `#B2E6C8` | 보조 강조, 구분선 |

### Neutral Palette
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-bg` | `#FFFFFF` | 기본 배경 |
| `--color-bg-secondary` | `#F7F8FA` | 섹션 배경 |
| `--color-surface` | `#FFFFFF` | 카드/모달 |
| `--color-border` | `#E8ECF0` | 구분선, 입력 테두리 |
| `--color-text-primary` | `#1A1A2E` | 제목, 본문 |
| `--color-text-secondary` | `#6B7280` | 보조 텍스트, 플레이스홀더 |
| `--color-text-muted` | `#9CA3AF` | 면책 문구, 주석 |

### Accent Palette
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-gold` | `#F5A623` | 프리미엄 강조, 별점 |
| `--color-mystical` | `#7C5CBF` | 신비로움 강조 (결과 화면) |
| `--color-mystical-light` | `#F3EEFF` | 결과 카드 배경 |

### 상태 컬러
| 토큰 | 값 |
|------|-----|
| `--color-error` | `#EF4444` |
| `--color-success` | `#10B981` |
| `--color-warning` | `#F59E0B` |

---

## 3. 타이포그래피

### 폰트 스택
```css
/* 일본어 웹 안전 폰트 스택 (Google Fonts 불필요) */
--font-primary: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 
                'Yu Gothic', 'Meiryo', sans-serif;
--font-display: 'Hiragino Mincho ProN', 'Yu Mincho', 
                'HG明朝E', serif; /* 결과 화면 고급감 */
--font-mono: 'Hiragino Kaku Gothic ProN', monospace;
```

선택적 Google Fonts (예산 허용 시):
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet">
```

### 타입 스케일
| 토큰 | 크기 | 줄높이 | 용도 |
|------|------|--------|------|
| `--text-xs` | `11px` | `1.4` | 면책 문구 |
| `--text-sm` | `13px` | `1.5` | 보조 텍스트 |
| `--text-base` | `15px` | `1.6` | 본문 (일본어 가독성) |
| `--text-md` | `17px` | `1.5` | 강조 본문 |
| `--text-lg` | `20px` | `1.4` | 섹션 제목 |
| `--text-xl` | `24px` | `1.3` | 화면 제목 |
| `--text-2xl` | `30px` | `1.2` | 히어로 텍스트 |
| `--text-3xl` | `36px` | `1.1` | 브랜드명 |

### 폰트 웨이트
| 토큰 | 값 |
|------|-----|
| `--weight-normal` | `400` |
| `--weight-medium` | `500` |
| `--weight-bold` | `700` |

---

## 4. 스페이싱 시스템

```css
--space-1:  4px;
--space-2:  8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

---

## 5. 컴포넌트 토큰

### 버튼
```css
--btn-height-sm:   40px;
--btn-height-md:   48px;
--btn-height-lg:   56px;
--btn-radius:      12px;
--btn-radius-full: 100px;
--btn-font-size:   16px;
--btn-font-weight: 700;
```

### 카드
```css
--card-radius:      16px;
--card-padding:     20px;
--card-shadow:      0 2px 12px rgba(0,0,0,0.08);
--card-shadow-hover: 0 8px 24px rgba(6,199,85,0.15);
```

### 입력 필드
```css
--input-height:     52px;
--input-radius:     12px;
--input-border:     1.5px solid var(--color-border);
--input-border-focus: 2px solid var(--color-primary);
--input-padding:    0 16px;
--input-font-size:  16px; /* iOS 줌 방지 최소 크기 */
```

### 모달 (동의 팝업)
```css
--modal-radius:     20px;
--modal-padding:    24px;
--modal-shadow:     0 20px 60px rgba(0,0,0,0.3);
--modal-overlay:    rgba(0,0,0,0.6);
```

---

## 6. 화면별 UI 명세

### 화면 1: 동의 팝업 (최초 실행)
- 레이아웃: 전체 화면 오버레이 + 중앙 모달 카드
- 건너뛰기 불가 (X 버튼 없음)
- 3개 체크박스 모두 체크 시에만 CTA 활성화

### 화면 2: 메인 메뉴
- 히어로: 브랜드명 + 슬로건 + 별 파티클 애니메이션
- 2개 대형 선택 카드 (四柱推命 / 相性占い)
- 하단: 법적 링크 (특상법/개인정보)

### 화면 3: 입력 폼
- 四柱推命: 생년월일(년/월/일) + 생시 선택(select)
- 相性占い: 두 사람 생년월일
- 하단 고정 CTA 버튼

### 화면 4: 결제 화면
- Stripe Elements 임베드 (카드 입력)
- 금액 명시: ¥500
- 보안 뱃지 표시

### 화면 5: 결과 화면
- 결과 카드 (신비로운 그라데이션)
- 면책 문구 (CLO 필수)
- LINE 공유 버튼 (고대비, 전체 너비)

### 화면 6-7: 법적 페이지
- 특상법 (tokushoho.html)
- 개인정보처리방침 (privacy.html)
- 단순 타이포그래피, 백링크 포함

---

## 7. LIFF 레이아웃 제약

```css
/* LIFF 모바일 전용 기본값 */
body { 
  max-width: 480px; 
  margin: 0 auto;
  min-height: 100vh;
  /* safe area 대응 */
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 8. LINE 공유 카드 명세

### Flex Message 구조 (JSON)
- hero: 브랜드 컬러 배경 + 별 SVG 이미지
- body: 결과 요약 (1~2줄), 상성 스코어 (궁합의 경우 XX점/100)
- footer: [詳細を見る] 버튼 → LIFF URL 링크

### 텍스트 기반 공유 메시지 (fallback)
```
✨ MEIで四柱推命しました！

🌿 あなたの運命の星：[결과 요약 1줄]

▶ 今すぐ無料診断 → [LIFF URL]
#MEI #四柱推命 #運勢
```

---

## 9. 웰컴 메시지 설계

### 친구 추가 시 자동 발송 (LINE Messaging API follow event)

**방식: Flex Message** (텍스트보다 클릭률 3배 이상)

구조:
```
[헤더] 명성AI 환영 배너 (초록 배경, 별 아이콘)
[바디] 
  ようこそ、MEIへ！✨
  あなたの四柱推命をAIが瞬時に読み解きます。
  
  🔮 四柱推命 — 性格・才能・運勢を分析
  💞 相性占い — ふたりの縁を数値化
  
  1回 ¥500 | 決済後すぐ表示
[フッター]
  [占いを始める →] (CTA, #06C755 배경)
```

---

## 10. 사주아이 대비 포지셔닝

| 요소 | 사주아이 (카카오) | MEI (LINE) |
|------|-----------------|--------------|
| 브랜드 컬러 | 노란색 | LINE 초록 (#06C755) |
| 슬로건 | "요즘 다들 이걸로" | 「みんな最近これで」 |
| 결제 | 990원 | ¥500 |
| 플랫폼 | 카카오톡 | LINE |
| 대상 | 한국 | 일본 |
| 비주얼 | 캐릭터 중심 | 신비로운 별/자연 |
