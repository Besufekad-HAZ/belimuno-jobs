$ErrorActionPreference = "Stop"

$port = 5000
$healthUrl = "http://127.0.0.1:$port/api/health"
$serverRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$logRoot = "C:\tmp"
$stdoutLog = Join-Path $logRoot "belimuno-server.log"
$stderrLog = Join-Path $logRoot "belimuno-server.err.log"

try {
  $health = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
  if ($health.StatusCode -eq 200) {
    Write-Host "Belimuno API is already running at $healthUrl"
    exit 0
  }
} catch {
  # Start the server when the health endpoint is unavailable.
}

New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$process = Start-Process `
  -FilePath $nodePath `
  -ArgumentList @("server.js") `
  -WorkingDirectory $serverRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

for ($attempt = 1; $attempt -le 15; $attempt++) {
  Start-Sleep -Seconds 1
  try {
    $health = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 2
    if ($health.StatusCode -eq 200) {
      Write-Host "Belimuno API started at $healthUrl (PID $($process.Id))"
      exit 0
    }
  } catch {
    if ($process.HasExited) {
      throw "Belimuno API exited early. Check $stderrLog"
    }
  }
}

throw "Belimuno API did not become ready within 15 seconds. Check $stdoutLog and $stderrLog"
