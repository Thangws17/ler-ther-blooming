# Chạy server local + in ra link mở trên điện thoại.
# Dùng: bấm phải file này > Run with PowerShell, hoặc trong terminal:  .\serve.ps1
#
# Đổi chỗ làm (wifi khác) thì IP đổi theo — chạy lại script là có link mới,
# KHÔNG cần tạo lại rule tường lửa (rule gắn vào "mạng nội bộ hiện tại").

$port = 8765

# ── Tìm IP nội bộ của máy ─────────────────────────────────────────
# Bỏ 127.0.0.1 (chỉ máy này) và 169.254.x.x (địa chỉ rác khi card mạng không xin được IP)
$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -ne '127.0.0.1' -and
    $_.IPAddress -notlike '169.254.*' -and
    $_.InterfaceAlias -notlike '*Loopback*'
  } |
  Sort-Object { if ($_.InterfaceAlias -like 'Wi-Fi*') { 0 } else { 1 } }

# ── Rule tường lửa còn không ──────────────────────────────────────
$ten = 'Ler Ther local dev 8765'
$rule = Get-NetFirewallRule -DisplayName $ten -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '  Ler & Ther Blooming - server local' -ForegroundColor Green
Write-Host '  ----------------------------------'

if (-not $rule) {
  Write-Host '  [!] Chua co rule tuong lua, dien thoai se KHONG vao duoc.' -ForegroundColor Yellow
  Write-Host '      Mo PowerShell bang quyen Admin roi dan cau nay:' -ForegroundColor Yellow
  Write-Host "      New-NetFirewallRule -DisplayName '$ten' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port -Profile Any -RemoteAddress LocalSubnet" -ForegroundColor DarkGray
} elseif (-not $rule.Enabled) {
  Write-Host '  [!] Rule tuong lua dang bi TAT.' -ForegroundColor Yellow
  Write-Host "      Bat lai: Enable-NetFirewallRule -DisplayName '$ten'  (can quyen Admin)" -ForegroundColor DarkGray
} else {
  Write-Host '  Rule tuong lua: OK' -ForegroundColor DarkGray
}

Write-Host ''
Write-Host '  Tren may nay:'
Write-Host "    http://localhost:$port/"        -ForegroundColor Cyan
Write-Host "    http://localhost:$port/admin/"  -ForegroundColor Cyan

if ($ips) {
  Write-Host ''
  Write-Host '  Tren dien thoai (phai cung mang wifi voi may nay):'
  foreach ($i in $ips) {
    Write-Host ("    http://{0}:{1}/admin/" -f $i.IPAddress, $port) -ForegroundColor Cyan -NoNewline
    Write-Host ("   [{0}]" -f $i.InterfaceAlias) -ForegroundColor DarkGray
  }
  Write-Host ''
  Write-Host '  Neu dien thoai bao khong vao duoc: wifi chung (quan ca phe, toa nha)' -ForegroundColor DarkGray
  Write-Host '  thuong chan may-noi-voi-may. Luc do dung hotspot cua dien thoai:' -ForegroundColor DarkGray
  Write-Host '  bat hotspot tren dien thoai, cho MAY TINH noi vao, roi chay lai script nay.' -ForegroundColor DarkGray
} else {
  Write-Host ''
  Write-Host '  [!] Khong tim thay IP noi bo - may chua noi mang nao.' -ForegroundColor Yellow
}

# ── Server đang chạy rồi thì thôi, khỏi chạy trùng ────────────────
$dangChay = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($dangChay) {
  Write-Host ''
  Write-Host "  Server da chay san o cong $port roi - dung luon link tren." -ForegroundColor Green
  Write-Host ''
  return
}

Write-Host ''
Write-Host '  Dang chay server... (Ctrl+C de dung)' -ForegroundColor Green
Write-Host ''
Set-Location $PSScriptRoot
# serve.py thay cho python -m http.server: hieu duoc URL khong duoi (/san-pham)
python serve.py $port
