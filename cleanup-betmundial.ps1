# cleanup-betmundial.ps1
#
# Moves confirmed-dead files/folders out of the betMundial React Native app
# into a timestamped _to_delete folder. NOTHING is permanently deleted by
# this script - it only moves things, so you can look through _to_delete
# afterwards and permanently delete it (or restore anything you want back)
# whenever you're comfortable.
#
# What this removes:
#   - Crash/replay log files (Gradle/JVM crash dumps, safe to regenerate)
#   - A duplicate image file
#   - Leftover "app modernization" tooling scaffolding under .github and .sixth
#     (not part of the app itself - artifacts from an automated Java/Android
#     upgrade assistant that was run against this repo at some point)
#   - An entire "levi" folder and a handful of other files that turned out to
#     belong to a DIFFERENT product (a dairy/milk-collection app - measuring
#     scales, harvest checks, milk sale receipts). These are dead code: none
#     of it is reachable from App.tsx's navigation, and some of it even has
#     broken imports pointing at folders that don't exist in this project.
#   - The same dairy app's KYC/registration wizard (src\components\forms),
#     confirmed dead the same way - not imported by any screen or navigator,
#     and its fields (numberOfCows, membershipNo, route/center pickers) are
#     milk-collection concepts, not betting-app ones.
#   - Two duplicate signing files sitting at the project root (release.keystore,
#     upload-keystore.jks) - byte-for-byte copies of the ones the Android build
#     actually reads from android\app\. Removing the stray root copies reduces
#     how many places your signing key material is exposed.
#   - Three stray web-only casino files (document/window-based React DOM
#     code) that can't run inside a React Native app and aren't imported
#     anywhere.
#   - A couple of empty/orphaned dev-scratch files.
#
# Run this from PowerShell, e.g.:
#   cd C:\betmundial
#   powershell -ExecutionPolicy Bypass -File .\cleanup-betmundial.ps1
#
# By default it targets the folder this script lives in. Pass -ProjectRoot
# to point at a different checkout, e.g.:
#   .\cleanup-betmundial.ps1 -ProjectRoot "C:\Users\ADMIN\Desktop\all\projects\reube\betmundial-mobile"

param(
    [string]$ProjectRoot = $PSScriptRoot
)

$ErrorActionPreference = "Stop"

if (-not $ProjectRoot -or -not (Test-Path $ProjectRoot)) {
    Write-Error "Project root '$ProjectRoot' does not exist. Pass -ProjectRoot <path>."
    exit 1
}

$ProjectRoot = (Resolve-Path $ProjectRoot).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$trashRoot = Join-Path $ProjectRoot "_to_delete\$timestamp"

Write-Host "Project root: $ProjectRoot"
Write-Host "Moving unnecessary files into: $trashRoot"
Write-Host ""

# Relative paths (from project root) to move into _to_delete.
$targets = @(
    # --- Crash / replay logs (root) ---
    "hs_err_pid19372.log",
    "hs_err_pid35744.log",
    "replay_pid19372.log",
    "replay_pid35744.log",

    # --- Crash / replay logs (android/) ---
    "android\hs_err_pid10424.log",
    "android\hs_err_pid21688.log",
    "android\hs_err_pid45708.log",
    "android\replay_pid10424.log",
    "android\replay_pid45708.log",

    # --- Duplicate asset ---
    "assets\bootsplash\logo - Copy (5).png",

    # --- Leftover app-modernization tooling scaffolding (not part of the app) ---
    ".github\appmod",
    ".github\java-upgrade",
    ".github\modernize",
    ".sixth",

    # --- Dairy/milk-collection app leftovers (different product, dead code) ---
    "src\components\levi",
    "src\components\modals\MilkSaleModal.tsx",
    "src\components\modals\StoreSaleModal.tsx",
    "src\components\modals\BluetoothConnectionModal.tsx",
    "src\components\services",
    "src\hooks\useBLEService.ts",
    "src\hooks\useBluetoothService.ts",
    "src\hooks\useClassicService.ts",
    "src\components\utils\printReceipt.ts",
    "src\components\utils\ReceiptPrinter.tsx",
    "src\context\GlobalContext.js",
    "docs\OFFLINE_COLLECTION.md",
    "docs\OFFLINE_COLLECTION_SETUP.md",
    "src\assets\adi-registration.properties",
    "android\app\src\main\assets\adi-registration.properties",

    # --- Dairy-app KYC/registration wizard, also leftover (not wired into any
    #     screen or navigator; DBUInfo.tsx literally has "numberOfCows" and
    #     "membershipNo" fields — this is the milk-collection app's onboarding
    #     form, not betMundial's). imageCompression.ts is only consumed by
    #     the ID-capture screens in this same dead wizard.
    "src\components\forms",
    "src\components\utils\imageCompression.ts",

    # --- Stray duplicate signing files at the project root (the real ones
    #     the Android build actually uses live under android\app\) ---
    "release.keystore",
    "upload-keystore.jks",

    # --- Stray web-only casino files (React DOM, not React Native; unused) ---
    "src\components\casino\homecopy.js",
    "src\components\casino\LiveCasino.js",
    "src\components\casino\no-spaorts-home.js",

    # --- Orphaned / empty dev scratch files ---
    "src\context\global.js",
    "src\components\botNav.tsx",
    "src\components\screenSections\testScreen.tsx",
    "src\components\hooks",
    "src\components\matches\MatchHeader.tsx"
)

$moved = 0
$missing = 0

foreach ($rel in $targets) {
    $src = Join-Path $ProjectRoot $rel
    if (Test-Path $src) {
        $dest = Join-Path $trashRoot $rel
        $destParent = Split-Path $dest -Parent
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Move-Item -Path $src -Destination $dest -Force
        Write-Host "Moved: $rel"
        $moved++
    } else {
        Write-Host "Skipped (not found): $rel" -ForegroundColor DarkYellow
        $missing++
    }
}

Write-Host ""
Write-Host "Done. Moved $moved item(s); $missing item(s) were already missing."
Write-Host "Everything was moved into: $trashRoot"
Write-Host "Review it, then delete that folder yourself once you're happy with the result."
Write-Host ""
Write-Host "Note: this script does NOT touch node_modules, .gradle, android\build, or"
Write-Host "build\ - those are regular build caches, not part of what was cleaned up here."
