$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:JAVA_HOME = Join-Path $PSScriptRoot '.tools\jdk-17.0.20.1+1'
$javaExe = Join-Path $env:JAVA_HOME 'bin\java.exe'
$mavenExe = Join-Path $PSScriptRoot '.tools\apache-maven-3.9.11\bin\mvn.cmd'
if (-not (Test-Path -LiteralPath $javaExe)) { throw 'Java 17 is missing from .tools. Install Java 17 and update JAVA_HOME in start-local.ps1.' }
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$appPort = if ($env:SAMVED_PORT) { $env:SAMVED_PORT } else { '8080' }
$appUrl = "http://127.0.0.1:$appPort"
try {
    $running = Invoke-RestMethod "$appUrl/api/v1/auth/csrf" -TimeoutSec 2
    if ($running.token) { Start-Process "$appUrl/auth/login.html"; Write-Host "SAMVED is already running at $appUrl"; exit 0 }
} catch { }
$portBindings = & netstat.exe -ano -p TCP | Select-String "^\s*TCP\s+\S+:$appPort\s+\S+\s+LISTENING\s+\d+\s*$"
if ($portBindings) {
    throw "Port $appPort is in use. Stop the previous app in its terminal (Ctrl+C), then try again."
}
Write-Host 'Building SAMVED. MySQL must be running and backend/.env must contain your database credentials.'
& $mavenExe -f backend/pom.xml "-Dmaven.repo.local=$PSScriptRoot/.tools/m2" -DskipTests package -q
if ($LASTEXITCODE -ne 0) { throw 'Build failed. Review the error above.' }
Set-Location -LiteralPath (Join-Path $PSScriptRoot 'backend')
$outLog = Join-Path $PSScriptRoot '.tools\samved-local.log'
$errLog = Join-Path $PSScriptRoot '.tools\samved-local-errors.log'
$jarPath = Join-Path $PSScriptRoot 'backend\target\samved-backend-0.1.0-SNAPSHOT.jar'
$serverProcess = Start-Process -FilePath $javaExe -ArgumentList @('-jar', ('"' + $jarPath + '"')) -WorkingDirectory (Get-Location).Path -WindowStyle Hidden -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
Set-Content -LiteralPath (Join-Path $PSScriptRoot '.tools\samved-local.pid') -Value $serverProcess.Id
Write-Host 'Starting the local server...'
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    $serverProcess.Refresh()
    if ($serverProcess.HasExited) { Get-Content -LiteralPath $outLog -Tail 35; Get-Content -LiteralPath $errLog -Tail 10; throw 'Server could not start. Check the database credentials in backend/.env.' }
    try {
        $health = Invoke-RestMethod "$appUrl/actuator/health" -TimeoutSec 2
        $authReady = Invoke-RestMethod "$appUrl/api/v1/auth/csrf" -TimeoutSec 2
        $serverProcess.Refresh()
        if ($health.status -eq 'UP' -and $authReady.token -and -not $serverProcess.HasExited) { Start-Process "$appUrl/auth/login.html"; Write-Host "SAMVED is ready: $appUrl"; Write-Host "Server process: $($serverProcess.Id). Logs: $outLog"; exit 0 }
    } catch { }
    Start-Sleep -Seconds 1
}
Write-Host "Startup is taking longer than usual. Check $outLog and open $appUrl when it reports Started SamvedApplication."
