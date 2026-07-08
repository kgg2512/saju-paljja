# ⛔ RETIRED — the-fate-japan worker (미배포·비활성)

- **상태(2026-07-07 확증):** CF 계정 배포 워커 목록에 `the-fate-japan` **없음** → 라이브 미배포.
- **사유:** JP 마켓은 `markets/web/worker`(the-fate-web)가 단일 서빙. 이 워커는 엔드포인트
  불일치(/api/payment 구플로우 vs LIFF /api/checkout) + 구 Stripe 결제 흐름으로 아카이브됨(CSO D1 20260611).
- **보안(G2 감사 2026-07-07 F4):** fail-open 레이트리밋 + 구 Stripe 잔재 → 재배포 금지.
  `wrangler.toml`을 `.RETIRED`로 무력화해 `wrangler deploy` 사고를 차단함(소스는 참조용 보존).
- **되살리려면:** 보안 재검(레이트리밋 fail-closed 전환·결제 재설계) 후에만.
