# 사주팔자 (The Fate)

**G2 Company Ltd 공식 프로젝트**

> 당신의 사주팔자, AI가 읽어드립니다.  
> *Your fate, decoded by AI.*

글로벌 AI 사주 플랫폼. 국가별 현지 브랜드로 진출.

---

## 브랜드 아키텍처

| 마켓 | 브랜드 | 플랫폼 | 상태 |
|------|--------|--------|------|
| 🇯🇵 Japan | **MEI (命)** | LINE OA + 웹앱 | Phase 1 — 개발 완료, 배포 대기 |
| 🇰🇷 Korea | **MYEONG (명)** | KakaoTalk | Phase 2 — 예정 |
| 🇹🇭 Thailand | **DUANG (ดวง)** | LINE OA | Phase 3 — 예정 |
| 🇹🇼 Taiwan | **MING (命)** | LINE OA | Phase 3 — 예정 |
| 🌎 Global | **MEI** | Web App | Phase 4 — 예정 |

**브랜드 컨셉:** 한자 "命" — 한국어 명(MYEONG) · 일본어 메이(MEI) · 중국어 밍(MING). 같은 운명, 각자의 언어로.

---

## 프로젝트 구조

```
saju-paljja/
├── docs/                    # GitHub Pages 글로벌 랜딩페이지
├── markets/
│   ├── japan/               # Phase 1 — MEI Japan
│   │   ├── worker/          # Cloudflare Workers (the-fate-japan)
│   │   ├── liff/            # LINE LIFF UI
│   │   └── legal/           # 특상법 · 개인정보 · 이용약관
│   ├── korea/               # Phase 2 — MYEONG Korea
│   ├── web/                 # 범용 웹앱 (멀티마켓)
│   │   ├── app.html         # 프론트엔드 (6개국)
│   │   └── worker/          # Cloudflare Workers (the-fate-web)
│   ├── taiwan/              # Phase 3 — MING Taiwan
│   └── thailand/            # Phase 3 — DUANG Thailand
└── shared/
    └── saju-engine/         # 사주 계산 엔진 (전 마켓 공통)
```

## 기술 스택

| 영역 | 스택 |
|------|------|
| Backend | Cloudflare Workers (서버리스 글로벌 엣지) |
| Frontend | Vanilla JS + 범용 웹앱 |
| LLM | GPT-4o mini (마켓별 현지어 운세 해석) |
| 사주 계산 | JDN 기반 만세력 엔진 (shared/saju-engine) |
| 결제 | Stripe (글로벌) |
| Hosting | GitHub Pages + Cloudflare Workers |

## 수익 모델

| 마켓 | 가격 | BEP |
|------|------|-----|
| Japan (MEI) | ¥500/쿼리 | 월 1~2건 |
| Korea (MYEONG) | ₩990/쿼리 | — |
| SE Asia (DUANG/MING) | $1.50/쿼리 | — |

---

## 배포

```powershell
# Cloudflare Workers 원클릭 배포
.\deploy-cf.ps1
```

## 보안 원칙 (CISO M1~M8)

- API 키 하드코딩 금지 → CF Secrets만
- 생년월일 KV 영속 저장 금지 (세션 TTL 1h만)
- EU 진입 금지 (GDPR Art.9 리스크)
- 결제 확인 전 운세 결과 제공 금지

---

**G2 Company Ltd** | CEO: 강경구 | [github.com/kgg2512](https://github.com/kgg2512)
