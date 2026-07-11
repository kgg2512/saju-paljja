# deploy-demo.ps1
# MEI — 데모(작업용 스테이징) Cloudflare Worker 배포 전용 스크립트
# 실행: cd "C:\Users\kgg25\Desktop\saju-paljja" ; .\deploy-demo.ps1
# 시크릿 등록을 이미 확인했고 원격 조회가 불가한 상태(최초 배포 전)를 넘기려면:
#   .\deploy-demo.ps1 -SecretsConfirmed
#
# 회장 지시 2026-07-10 데모/스토어 이원화: 백엔드 변경은 이 스크립트로
# the-fate-web-demo 워커(=markets/web-demo/app.html이 호출)에 먼저 배포·검증한 뒤,
# PASS 확인 후에만 .\deploy-cf.ps1(스토어=the-fate-web)을 실행한다. 스토어 직행 금지.
#
# ⚠️ 전제조건 (미충족 시 이 스크립트가 중단하고 안내만 출력, 강행 배포 안 함):
#   1. wrangler login 완료 (CF 계정 인증)
#   2. 데모 전용 Secrets 등록 (스토어와 별도 — env 미지정 secret put은 프로덕션에만 적용됨):
#      cd markets\web\worker
#      wrangler secret put OPENAI_API_KEY --env demo
#      wrangler secret put CREEM_API_KEY --env demo         # test 키만 사용 (CREEM_MODE=test 고정)
#      wrangler secret put CREEM_WEBHOOK_SECRET --env demo
#      wrangler secret put LINE_CHANNEL_SECRET --env demo
#      wrangler secret put LINE_CHANNEL_ACCESS_TOKEN --env demo
#   3. wrangler.toml [env.demo.kv_namespaces] 의 id/preview_id 가 REPLACE_WITH_DEMO_KV_ID
#      placeholder 가 아닌 실제 데모 전용 KV id 로 교체돼 있을 것
#      (생성: cd markets\web\worker && npx wrangler kv namespace create MEISEI_WEB_KV_DEMO --preview)

param([switch]$SecretsConfirmed)

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }
$workerDir = Join-Path $RepoRoot "markets\web\worker"
$tomlPath  = Join-Path $workerDir "wrangler.toml"

function Write-Step { param([string]$n, [string]$msg) Write-Host "`n[$n] $msg" -ForegroundColor Yellow }
function Write-OK   { param([string]$msg) Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Fail { param([string]$msg) Write-Host "    ERROR: $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  MEI — 데모 Worker(the-fate-web-demo) 배포  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# ─────────────────────────────────────────────
# STEP 1 — KV placeholder 게이트 (추측 id 금지)
# ─────────────────────────────────────────────
Write-Step "1/3" "wrangler.toml 데모 KV id 확인"

$toml = Get-Content $tomlPath -Raw -Encoding UTF8
if ($toml -match 'REPLACE_WITH_DEMO_KV_ID') {
    Write-Fail "env.demo.kv_namespaces 가 아직 placeholder 입니다."
    Write-Host "    회장 CF 인증 후 아래 실행:" -ForegroundColor Gray
    Write-Host "      cd markets\web\worker" -ForegroundColor Gray
    Write-Host "      npx wrangler kv namespace create MEISEI_WEB_KV_DEMO --preview" -ForegroundColor Gray
    Write-Host "    반환된 id/preview_id 를 wrangler.toml [env.demo.kv_namespaces] 에 기입 후 재실행." -ForegroundColor Gray
    exit 1
}
Write-OK "데모 전용 KV id 확인됨 (프로덕션과 분리)"

# ─────────────────────────────────────────────
# STEP 2 — 데모 Secrets 등록 여부 확인 (경고만, 강제 등록 안 함)
# ─────────────────────────────────────────────
Write-Step "2/3" "데모 Secrets 등록 상태 확인 (wrangler secret list --env demo)"

$requiredSecrets = @("OPENAI_API_KEY", "CREEM_API_KEY", "CREEM_WEBHOOK_SECRET", "LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN")

Push-Location $workerDir
# 주의: 네이티브 CLI stderr를 2>&1/2>$null로 리다이렉트하면 PS5.1이 ErrorRecord로 감싸
# $ErrorActionPreference=Stop과 충돌해 스크립트가 크래시한다(실측, "Worker not found" 케이스).
# 리다이렉트 없이 stdout만 변수로 받고 exit code로 성공 여부를 판단한다.
$secretListStr = (npx wrangler secret list --env demo | Out-String)
$queryExit = $LASTEXITCODE
Pop-Location

if ($queryExit -ne 0 -or [string]::IsNullOrWhiteSpace($secretListStr)) {
    # the-fate-web-demo가 최초 배포 전이면 secret list 자체가 "Worker not found"로 실패한다
    # (CF 특성상 정상 — 시크릿은 배포된 워커에 귀속). 이 경우 자동판정 불가 → 사람 확인(-SecretsConfirmed)으로 폴백.
    Write-Host "    참고: 데모 워커 미배포 상태이거나 조회 실패 — 원격으로 시크릿 등록 여부를 확인할 수 없습니다." -ForegroundColor Gray
    Write-Host "    아래 5종이 등록돼 있는지 직접 확인하세요 (미등록이면 배포해도 런타임에서 500/실패 응답):" -ForegroundColor Gray
    foreach ($s in $requiredSecrets) { Write-Host "      - $s (wrangler secret put $s --env demo)" -ForegroundColor Gray }
    Write-Host "    ⚠️ CREEM_API_KEY는 test 키만 사용 (wrangler.toml CREEM_MODE=`"test`" 고정 확인됨)" -ForegroundColor Gray
    if (-not $SecretsConfirmed) {
        Write-Fail "등록 확인 전이라 중단. 확인 후 '.\deploy-demo.ps1 -SecretsConfirmed' 로 재실행하세요."
        exit 1
    }
    Write-OK "-SecretsConfirmed 플래그로 확인됨 — 진행"
} else {
    $missing = @()
    foreach ($s in $requiredSecrets) {
        if ($secretListStr -notmatch $s) { $missing += $s }
    }
    if ($missing.Count -gt 0) {
        Write-Fail "데모 환경에 미등록 Secret 발견: $($missing -join ', ')"
        Write-Host "    등록 후 재실행하세요 (예시):" -ForegroundColor Gray
        foreach ($s in $missing) {
            Write-Host "      wrangler secret put $s --env demo" -ForegroundColor Gray
        }
        exit 1
    }
    Write-OK "필수 Secret 5종 데모 환경에 등록 확인됨"
}

# ─────────────────────────────────────────────
# STEP 3 — 데모 Worker 배포
# ─────────────────────────────────────────────
Write-Step "3/3" "the-fate-web-demo 배포 중 (wrangler deploy --env demo)..."

Push-Location $workerDir
npx wrangler deploy --env demo
$deployExit = $LASTEXITCODE
Pop-Location

if ($deployExit -ne 0) {
    Write-Fail "데모 배포 실패 (exit $deployExit). 위 출력 확인."
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  데모 배포 완료!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Demo Worker : https://the-fate-web-demo.kgg2512.workers.dev" -ForegroundColor White
Write-Host "  Demo App    : markets/web-demo/app.html (GitHub Pages 반영은 git push 필요)" -ForegroundColor White
Write-Host ""
Write-Host "  다음 단계: 데모에서 /api/checkout, /api/fortune 실호출 검증 → PASS 후에만" -ForegroundColor Yellow
Write-Host "  .\deploy-cf.ps1 (스토어=the-fate-web) 실행." -ForegroundColor Yellow
Write-Host ""
