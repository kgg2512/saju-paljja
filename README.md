# 무릎팍도사 (Mureupak Dosa)

**G2 Company Ltd 공식 프로젝트**

> AI가 당신의 사주를 읽어드립니다 — LINE, KakaoTalk, WhatsApp, 그 어디서든.

글로벌 AI 사주/운세 플랫폼. 한국 사주아이의 성공 모델을 전 세계로.

---

## 마켓별 출시 계획

| 마켓 | 플랫폼 | 브랜드명 | 상태 |
|------|--------|---------|------|
| 🇯🇵 Japan | LINE OA + LIFF | 命星AI (Meisei AI) | Phase 1 — 개발 중 |
| 🇰🇷 Korea | KakaoTalk Channel | 무릎팍도사 | Phase 2 — 예정 |
| 🌏 SE Asia | LINE (TH/TW/ID) | Meisei AI | Phase 3 — 예정 |
| 🌎 Global | Web App + WhatsApp | Mureupak Dosa | Phase 4 — 예정 |

## 프로젝트 구조

```
mureupak-dosa/
├── docs/           # GitHub Pages (글로벌 랜딩페이지)
├── markets/
│   ├── japan/      # Phase 1 — LINE OA + LIFF
│   ├── korea/      # Phase 2 — KakaoTalk
│   └── global/     # Phase 4 — Web App
├── shared/
│   └── saju-engine/ # 사주 계산 엔진 (전 마켓 공통)
└── legal/          # 마켓별 법무 페이지
```

## 핵심 기술 스택

- **Backend**: Cloudflare Workers (서버리스, 글로벌 엣지)
- **Frontend**: Vanilla JS + LIFF v2 (Japan) / KakaoTalk SDK (Korea) / Web (Global)
- **LLM**: GPT-4o mini (운세 해석)
- **사주 계산**: lunar-calendar (정확한 만세력 기반)
- **결제**: Stripe (글로벌)
- **Hosting**: GitHub Pages

## 수익 모델

단건 결제 모델 — 마켓별 현지 가격:
- Japan: ¥200/쿼리
- Korea: ₩990/쿼리
- Global: $1.50/쿼리

---

**G2 Company Ltd** | CEO: 강경구 | github.com/kgg2512
