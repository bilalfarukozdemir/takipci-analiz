# APK üretir.
#
# Neden bu betik var: proje yolu hem boşluk içeriyor ("Claude Projelerim",
# "instagram followers") hem de uzun. Android NDK'nın kullandığı CMake/ninja bu
# yollarda native modülleri derleyemiyor ("manifest 'build.ninja' still dirty").
# Bu yüzden kaynak kısa bir yola aynalanıp derleme orada yapılıyor, APK geri
# kopyalanıyor.
#
# Kullanım:  npm run apk

$ErrorActionPreference = 'Stop'

$src = Split-Path -Parent $PSScriptRoot
$mirror = if ($env:TAKIPCI_BUILD_DIR) { $env:TAKIPCI_BUILD_DIR } else { 'C:\rnb\takipci' }

Write-Host "Kaynak : $src"
Write-Host "Derleme: $mirror"
Write-Host ''

# 1) kaynağı aynala (node_modules ve android hariç — onlar aynada üretilir)
New-Item -ItemType Directory -Force $mirror | Out-Null
robocopy $src $mirror /MIR /XD node_modules android .git .expo .testbuild /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy başarısız (kod $LASTEXITCODE)" }

Push-Location $mirror
try {
  # 2) bağımlılıklar (lock dosyası değişmediyse atla)
  $lockHash = (Get-FileHash "$mirror\package-lock.json").Hash
  $stamp = "$mirror\node_modules\.lockhash"
  if (-not (Test-Path "$mirror\node_modules") -or -not (Test-Path $stamp) -or
      (Get-Content $stamp -Raw).Trim() -ne $lockHash) {
    Write-Host '--> npm ci'
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { npm install --no-audit --no-fund }
    Set-Content -Path $stamp -Value $lockHash -Encoding ascii
  } else {
    Write-Host '--> bağımlılıklar güncel'
  }

  # 3) native proje
  Write-Host '--> expo prebuild'
  npx expo prebuild -p android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'prebuild başarısız' }

  # 4) derleme
  Write-Host '--> gradle assembleRelease'
  Set-Location "$mirror\android"
  .\gradlew.bat assembleRelease --console=plain
  if ($LASTEXITCODE -ne 0) { throw 'gradle derlemesi başarısız' }
} finally {
  Pop-Location
}

# 5) APK'yı proje köküne al
$apk = "$mirror\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) { throw "APK bulunamadı: $apk" }
$hedef = Join-Path $src 'takipci-analiz.apk'
Copy-Item $apk $hedef -Force

$mb = [math]::Round((Get-Item $hedef).Length / 1MB, 1)
Write-Host ''
Write-Host "APK hazır: $hedef ($mb MB)" -ForegroundColor Green
