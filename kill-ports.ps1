$conn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($conn) {
  $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep 1
$remaining = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Output "Remaining connections on 5173: $remaining"

# Also clean 3456 just in case
$conn2 = Get-NetTCPConnection -LocalPort 3456 -ErrorAction SilentlyContinue
if ($conn2) {
  $conn2 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
$remaining2 = (Get-NetTCPConnection -LocalPort 3456 -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Output "Remaining connections on 3456: $remaining2"
