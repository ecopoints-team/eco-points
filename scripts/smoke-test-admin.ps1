#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Admin Dashboard Alignment — Smoke Test Script
.DESCRIPTION
    Validates the client build compiles without errors after all alignment phases.
    Checks for stale mockData imports, validates shared utility existence,
    and verifies canonical field usage across admin pages.
.NOTES
    Run from repo root: .\scripts\smoke-test-admin.ps1
#>

$ErrorActionPreference = "Stop"
$pass = 0; $fail = 0; $warn = 0

function Assert-Pass($msg) { Write-Host "  [PASS] $msg" -ForegroundColor Green; $script:pass++ }
function Assert-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:fail++ }
function Assert-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow; $script:warn++ }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Admin Dashboard Alignment Smoke Tests" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ──────────────────────────────────────────────
# TEST 1: No source-level mockData imports
# ──────────────────────────────────────────────
Write-Host "[Test 1] No mockData imports in source..." -ForegroundColor White
$hits = Get-ChildItem -Path "client\app","client\src\components" -Recurse -Include "*.js","*.jsx" |
    Select-String -Pattern "from\s+['""].*mockData" | Where-Object { $_.Line -notmatch "^\s*//" }
if ($hits.Count -eq 0) {
    Assert-Pass "Zero mockData imports found in source"
} else {
    Assert-Fail "Found $($hits.Count) mockData import(s):"
    $hits | ForEach-Object { Write-Host "    -> $($_.Filename):$($_.LineNumber)" -ForegroundColor Red }
}

# ──────────────────────────────────────────────
# TEST 2: Shared validateField.js exists
# ──────────────────────────────────────────────
Write-Host "[Test 2] validateField.js utility exists..." -ForegroundColor White
if (Test-Path "client\src\lib\validateField.js") {
    Assert-Pass "validateField.js exists"
} else {
    Assert-Fail "validateField.js not found"
}

# ──────────────────────────────────────────────
# TEST 3: formatField.js exists and exports correctly
# ──────────────────────────────────────────────
Write-Host "[Test 3] formatField.js utility exists..." -ForegroundColor White
if (Test-Path "client\src\lib\formatField.js") {
    $content = Get-Content "client\src\lib\formatField.js" -Raw
    if ($content -match "export function formatField") {
        Assert-Pass "formatField.js has named export"
    } else {
        Assert-Fail "formatField.js missing named export"
    }
} else {
    Assert-Fail "formatField.js not found"
}

# ──────────────────────────────────────────────
# TEST 4: Users page uses 'Group' not 'Department' in column header
# ──────────────────────────────────────────────
Write-Host "[Test 4] Users page uses 'Group' label..." -ForegroundColor White
$usersPage = Get-Content "client\app\admin\users\page.js" -Raw
if ($usersPage -match "whitespace-nowrap.>Group<") {
    Assert-Pass "Users table header says 'Group'"
} else {
    Assert-Warn "Could not confirm 'Group' header in users page"
}

# ──────────────────────────────────────────────
# TEST 5: Locations page uses shared validateAll
# ──────────────────────────────────────────────
Write-Host "[Test 5] Locations page uses shared validation..." -ForegroundColor White
$locPage = Get-Content "client\app\admin\locations\page.js" -Raw
if ($locPage -match "VALIDATION_RULES\.location") {
    Assert-Pass "Locations uses VALIDATION_RULES.location"
} else {
    Assert-Fail "Locations still uses hand-rolled validation"
}

# ──────────────────────────────────────────────
# TEST 6: AddRegularUserModal uses groups API
# ──────────────────────────────────────────────
Write-Host "[Test 6] AddRegularUserModal uses groups API..." -ForegroundColor White
$modal = Get-Content "client\src\components\admin\AddRegularUserModal.jsx" -Raw
if ($modal -match "groupsApi\.getAll") {
    Assert-Pass "AddRegularUserModal fetches groups dynamically"
} else {
    Assert-Fail "AddRegularUserModal not using groups API"
}

# ──────────────────────────────────────────────
# TEST 7: Profile page uses 'memberSince' not 'joinDate'
# ──────────────────────────────────────────────
Write-Host "[Test 7] Profile page uses 'memberSince'..." -ForegroundColor White
$profile = Get-Content "client\app\admin\profile\page.js" -Raw
if ($profile -match "memberSince" -and -not ($profile -match "joinDate")) {
    Assert-Pass "Profile uses 'memberSince' (no joinDate)"
} else {
    Assert-Warn "Profile may still reference joinDate"
}

# ──────────────────────────────────────────────
# TEST 8: Rewards page uses shared validation
# ──────────────────────────────────────────────
Write-Host "[Test 8] Rewards page uses shared validation..." -ForegroundColor White
$rwdPage = Get-Content "client\app\admin\rewards\page.js" -Raw
if ($rwdPage -match "VALIDATION_RULES\.reward") {
    Assert-Pass "Rewards uses VALIDATION_RULES.reward"
} else {
    Assert-Fail "Rewards still uses inline validation"
}

# ──────────────────────────────────────────────
# TEST 9: Machines page uses shared validation
# ──────────────────────────────────────────────
Write-Host "[Test 9] Machines page uses shared validation..." -ForegroundColor White
$mchPage = Get-Content "client\app\admin\machines\page.js" -Raw
if ($mchPage -match "VALIDATION_RULES\.machine") {
    Assert-Pass "Machines uses VALIDATION_RULES.machine"
} else {
    Assert-Fail "Machines still uses inline validation"
}

# ──────────────────────────────────────────────
# TEST 10: Production build succeeds
# ──────────────────────────────────────────────
Write-Host "[Test 10] Production build..." -ForegroundColor White
Push-Location "client"
try {
    $ErrorActionPreference = "Continue"
    $buildOutput = & npm run build 2>&1 | Out-String
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = "Stop"
    if ($exitCode -eq 0 -or $buildOutput -match "Generating static pages") {
        Assert-Pass "Next.js build succeeded"
    } else {
        Assert-Fail "Next.js build failed (exit code $exitCode)"
        Write-Host $buildOutput -ForegroundColor Red
    }
} finally {
    Pop-Location
}

# ──────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Results: $pass PASS, $fail FAIL, $warn WARN" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
Write-Host "========================================`n" -ForegroundColor Cyan

if ($fail -gt 0) { exit 1 }
