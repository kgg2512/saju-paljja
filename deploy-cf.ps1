# deploy-cf.ps1
# MEI — Cloudflare Workers 자동 배포 스크립트
# 실행: cd "C:\Users\kgg25\Desktop\사주팔자" ; .\deploy-cf.ps1
#
# 전제 조건: Node.js / npm 설치됨
#
# ⚠️ ARCHIVED — markets/japan/worker 는 배포하지 않는다 (CSO D1 20260611).
#    web worker(the-fate-web, markets/web/worker)가 JP 마켓을 단일 서빙한다.
#    japan worker는 LIFF(/api/checkout)와 엔드포인트 불일치(/api/payment 구플로우)로 아카이브 처리.
#    이 스크립트는 web worker만 배포한다 — japan worker 배포 단계를 추가하지 말 것.

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }

function Write-Step { param([string]$n, [string]$msg) Write-Host "`n[$n] $msg" -ForegroundColor Yellow }
function Write-OK   { param([string]$msg) Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) Write-Host "    ERROR: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MEI — Cloudflare Workers 배포 도우미  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ─────────────────────────────────────────────
# STEP 1 — wrangler 설치 확인
# ─────────────────────────────────────────────
Write-Step "1/6" "wrangler CLI 확인 중..."

$ver = wrangler --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "    wrangler 없음 — 설치 중 (npm install -g wrangler)..." -ForegroundColor Yellow
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "설치 실패. https://nodejs.org 에서 Node.js 먼저 설치 후 재실행."
        exit 1
    }
    $ver = wrangler --version 2>&1
}
Write-OK $ver

# ─────────────────────────────────────────────
# STEP 2 — Cloudflare 로그인
# ─────────────────────────────────────────────
Write-Step "2/6" "Cloudflare 계정 로그인 (브라우저가 열립니다)"
Write-Host "    이미 로그인 상태면 바로 성공 메시지가 뜹니다." -ForegroundColor Gray

wrangler login
if ($LASTEXITCODE -ne 0) {
    Write-Fail "로그인 실패. 인터넷 연결과 Cloudflare 계정 확인 후 재시도."
    exit 1
}
Write-OK "로그인 완료"

# ─────────────────────────────────────────────
# STEP 3 — KV Namespace 생성 → wrangler.toml 자동 업데이트
# ─────────────────────────────────────────────
Write-Step "3/6" "KV Namespace 생성 (결제 세션 임시 저장소)"

$workerDir = Join-Path $RepoRoot "markets\web\worker"
$tomlPath  = Join-Path $workerDir "wrangler.toml"

Push-Location $workerDir

$kvRaw = (wrangler kv:namespace create MEISEI_WEB_KV 2>&1) -join "`n"
$kvMatch = [regex]::Match($kvRaw, 'id\s*=\s*"([a-f0-9A-F]{32})"')
$kvId = $kvMatch.Groups[1].Value

if ($kvId) {
    Write-OK "KV ID: $kvId"

    $toml = Get-Content $tomlPath -Raw -Encoding UTF8
    $toml = $toml -replace 'REPLACE_WITH_KV_NAMESPACE_ID', $kvId
    $toml = $toml -replace 'REPLACE_WITH_KV_PREVIEW_ID',   $kvId   # preview에도 동일 ID 사용
    $toml | Set-Content $tomlPath -Encoding UTF8
    Write-OK "wrangler.toml 자동 업데이트 완료"
} else {
    Write-Fail "KV ID 자동 파싱 실패."
    Write-Host "    아래 출력에서 id 값을 찾아 wrangler.toml의 REPLACE_WITH_KV_NAMESPACE_ID에 수동 입력:"
    Write-Host $kvRaw -ForegroundColor Gray
    Read-Host "`n    수동 입력 완료 후 Enter"
}

Pop-Location

# ─────────────────────────────────────────────
# STEP 4 — Secrets 등록 (OpenAI + LINE)
# ─────────────────────────────────────────────
Write-Step "4/6" "API Secrets 등록 (입력값은 화면에 표시되지 않음)"

Push-Location $workerDir

Write-Host ""
Write-Host "  [4-1] OpenAI API Key 입력 (sk-...)" -ForegroundColor Cyan
Write-Host "        → https://platform.openai.com/api-keys 에서 발급" -ForegroundColor Gray
wrangler secret put OPENAI_API_KEY

Write-Host ""
Write-Host "  [4-2] LINE Channel Secret 입력" -ForegroundColor Cyan
Write-Host "        → LINE Developers → 채널 → Basic settings → Channel secret" -ForegroundColor Gray
Write-Host "        아직 LINE 미등록이면 임시로 'placeholder' 입력 후 나중에 재등록 가능" -ForegroundColor Gray
wrangler secret put LINE_CHANNEL_SECRET

Write-Host ""
Write-Host "  [4-3] LINE Channel Access Token 입력" -ForegroundColor Cyan
Write-Host "        → LINE Developers → 채널 → Messaging API → Channel access token → Issue" -ForegroundColor Gray
Write-Host "        미등록이면 임시로 'placeholder' 입력" -ForegroundColor Gray
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN

Write-Host ""
Write-Host "  ⚠️  STRIPE_SECRET_KEY는 Stripe 등록 완료 후 별도 실행:" -ForegroundColor Yellow
Write-Host "      cd markets\web\worker" -ForegroundColor Gray
Write-Host "      wrangler secret put STRIPE_SECRET_KEY" -ForegroundColor Gray

Pop-Location

# ─────────────────────────────────────────────
# STEP 5 — Worker 배포
# ─────────────────────────────────────────────
Write-Step "5/6" "Worker 배포 중 (the-fate-web)..."

Push-Location $workerDir
$deployRaw = (wrangler deploy 2>&1) -join "`n"
Write-Host $deployRaw -ForegroundColor Gray
Pop-Location

$urlMatch  = [regex]::Match($deployRaw, 'https://[a-z0-9\-]+\.workers\.dev')
$workerUrl = $urlMatch.Value

if (-not $workerUrl) {
    Write-Fail "Worker URL 자동 감지 실패."
    $workerUrl = Read-Host "    배포 출력에서 URL 복사 후 여기 붙여넣기 (https://the-fate-web.xxx.workers.dev)"
}

Write-OK "Worker URL: $workerUrl"

# ─────────────────────────────────────────────
# STEP 6 — app.html Worker URL 자동 교체 → git push
# ─────────────────────────────────────────────
Write-Step "6/6" "app.html에 Worker URL 적용 → GitHub Pages 갱신"

$appPath = Join-Path $RepoRoot "markets\web\app.html"
$app = Get-Content $appPath -Raw -Encoding UTF8
$app = $app -replace "window\.WORKER_URL\s*=\s*'REPLACE_WITH_WORKER_URL'", "window.WORKER_URL = '$workerUrl'"
$app | Set-Content $appPath -Encoding UTF8
Write-OK "app.html 업데이트"

# docs/app.html 동기화 (GitHub Pages 서빙 사본 — 법무 링크 상대경로만 다름)
$docsAppPath = Join-Path $RepoRoot "docs\app.html"
$docsApp = $app -replace [regex]::Escape('../japan/legal/'), 'japan/legal/'
$docsApp | Set-Content $docsAppPath -Encoding UTF8
Write-OK "docs/app.html 동기화 완료"

Set-Location $RepoRoot
git add "markets/web/app.html" "docs/app.html" "markets/web/worker/wrangler.toml"
git commit -m "deploy: CF Worker URL + KV namespace 자동 설정"
git push origin main
Write-OK "GitHub push 완료 → GitHub Actions가 Pages 자동 배포"

# ─────────────────────────────────────────────
# 완료 메시지
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  배포 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Worker URL : $workerUrl" -ForegroundColor White
Write-Host "  Landing    : https://kgg2512.github.io/saju-paljja/" -ForegroundColor White
Write-Host "  Web App    : https://kgg2512.github.io/saju-paljja/markets/web/app.html" -ForegroundColor White
Write-Host ""
Write-Host "  ── Stripe 등록 완료 후 해야 할 것 ──────────────────────" -ForegroundColor Yellow
Write-Host "  1. cd markets\web\worker" -ForegroundColor Gray
Write-Host "     wrangler secret put STRIPE_SECRET_KEY" -ForegroundColor Gray
Write-Host "  2. markets\web\app.html 열어서 REPLACE_WITH_STRIPE_PK → 실제 pk_ 키로 교체" -ForegroundColor Gray
Write-Host "  3. git add -A && git commit -m 'deploy: Stripe 설정' && git push origin main" -ForegroundColor Gray
Write-Host ""
