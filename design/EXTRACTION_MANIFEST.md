# 사주 4개국 디자인 추출 매니페스트 (골모드 P3 G0-D · 2026-07-24)

> 출처: Claude Design (★신규 세트) — MCP(claude-design)로 추출. Chrome 자동화 대신 인증된 MCP 직접 접근 사용(더 안정적).
> **추출 방식 정정:** 프롬프트는 Chrome MCP 브라우저 조작을 제안했으나, `mcp__claude-design__*`가 인증돼 있어 로그인 벽 없이 직접 파일 read 가능 → 그 경로로 전환.

## 이번 세션 추출 완료 (토큰 레이어 = 재사용 핵심)
| 파일 | 위치 | 내용 |
|------|------|------|
| `saju-core.css` | `design/_core/` | 구조 계약(간격/반경/타이포 스케일, --sj-* 시맨틱 훅, 컴포넌트 클래스). 테마 중립 |
| `skin-jp.css` | `design/jp/` | MEI 다크 네이비(bg #070b12, accent #c8503c, Noto JP) |
| `skin-kr.css` | `design/kr/` | MYEONG 라이트 페이퍼(bg #f1e8d6, accent #a8311f, Noto KR) |
| `skin-tw.css` | `design/tw/` | MING 라이트 페이퍼(KR과 색 동일, Noto TC) |

**아키텍처:** core(구조 강제) + skin(국가 팔레트) = A안. core는 색 미정의, skin이 --sj-* 훅 재정의. 이미 [saju-design-bridge] 스킬이 하드코딩 화면을 이 core+skin에 브리지하는 절차 소유.

## 2회전 이월 (예산상 이번 세션 미추출 — 풀 스크린 HTML은 4×60KB로 컨텍스트 과중)
아래는 claude-design MCP `read_file`로 즉시 추출 가능. **프로젝트 ID·파일·etag 확정 제공:**

| 국가 | 프로젝트 ID | 메인 디자인 파일(size) | 비고 |
|------|-------------|----------------------|------|
| JP (MEI) | `5db18d01-edd8-4ae3-8cd4-b79c2e4e3290` | `MEI.dc.html`(67KB), `MEI v2 (core).dc.html`(67KB), `MEI - All Screens.dc.html`(8KB) | +`support.js`(52KB)·`image-slot.js`·`muse.webp` |
| KR (MYEONG) | `c57677f0-d0e1-4ca4-8803-c67b17c79592` | `MYEONG.dc.html`(63KB), `MYEONG v2 (core).dc.html`(63KB) | +`kr-face/kr-side/kr-upper/kr-figure-flip.webp`·`muse.webp` |
| TH (DUANG) | `388e6176-c816-41d3-99a9-4c8b44ae093b` | `DUANG.dc.html`(59KB), `DUANG - All Screens.dc.html`(8KB) | **skin-th.css 없음 → 팔레트가 DUANG.dc.html 인라인**(추출 시 분리 필요) |
| TW (MING) | `5256d32f-756c-44ee-8c8b-5a8fd9d284a6` | `MING.dc.html`(60KB), `MING v2 (core).dc.html`(60KB) | +`muse.webp` |
| Core DS | `5c563e39-5a02-4aaf-a2c9-76b9c77e86cc` | "G2 Saju — Core Design System" | 공유 토큰 원본 |

**2회전 작업:** ① 4개 `.dc.html` read→`design/{jp,kr,th,tw}/`에 착지 ② TH 인라인 팔레트→`skin-th.css` 분리 ③ 각 화면 텍스트 추출→G1 i18n 번역 초안(검수 필요 표시) ④ `.webp` 이미지는 read_file base64 또는 Chrome 다운로드로 회수 ⑤ core+skin을 markets/web 실화면에 브리지([saju-design-bridge] 스킬).
