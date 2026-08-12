# saju-paljja (The Fate) — 작업 규칙

**언어: 항상 한국어.** 기준 브랜치 = **main** (G2 유일 예외). 회사 헌법 `Desktop/G2 Company Ltd/CLAUDE.md`.

## 🎭 데모/스토어 이원화 (회장 지시 2026-07-10 — 위반 금지)

| 슬롯 | URL | 갱신 |
|------|-----|------|
| **데모 웹(작업용 스테이징)** | https://kgg2512.github.io/saju-paljja/markets/web-demo/app.html | `markets/web-demo/` 수정 → push |
| **스토어 웹(운영 — 고객에게 보내는 링크)** | https://kgg2512.github.io/saju-paljja/markets/web/app.html | 데모 검증 PASS 후 복사 승격만 |
| **데모 워커** | the-fate-web-demo.workers.dev | `cd markets/web/worker && wrangler deploy --env demo` |
| **스토어 워커** | the-fate-web.kgg2512.workers.dev | 데모 워커 검증 PASS 후 `wrangler deploy` |

**작업 절차 (기본):**
1. 웹 수정은 **`markets/web-demo/`에 먼저** → push → 데모 URL 검증
2. PASS 후 승격: `cp markets/web-demo/app.html markets/web/app.html` (demo.html 동일) → push
3. **`markets/web/` 직접 수정 금지.** 데모 슬롯은 언제 망가져도 된다.
4. 워커(백엔드) 수정은 `--env demo` 선배포·검증 → 프로덕션 배포. (⚠️ env.demo secrets 1회 등록 선행 — wrangler.toml 주석 참조. 등록 전까지 데모 웹은 프로덕션 워커(CREEM_MODE=test)를 바라봄)
5. 데모 경로는 robots.txt로 크롤러 차단됨.

## 기존 주의사항
- Pages 배포 = deploy-pages.yml (build_type=workflow 필수 — legacy로 되돌리면 실패 메일 폭탄 재발)
- japan worker는 ARCHIVED — web worker(the-fate-web)가 JP 단일 서빙. deploy-cf.ps1 참조.
