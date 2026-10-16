$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$jdkCandidates = @(
    Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot '.tools') -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue
    Get-ChildItem -LiteralPath 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue
)
$jdk = $jdkCandidates | Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin\java.exe') } | Sort-Object Name -Descending | Select-Object -First 1
if ($jdk) { $env:JAVA_HOME = $jdk.FullName }
$javaExe = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else { $null }
if (-not $javaExe -or -not (Test-Path -LiteralPath $javaExe)) { throw 'Java 17 is missing. Run the downloaded Temurin JDK 17 installer, then try again.' }
$mavenExe = Join-Path $PSScriptRoot '.tools\apache-maven-3.10.0\bin\mvn.cmd'
if (-not (Test-Path -LiteralPath $mavenExe)) { throw 'Maven 3.10.0 is missing. Extract apache-maven-3.10.0-bin.zip into .tools.' }
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

function Open-LoginPage([string]$url) {
    try {
        Start-Process $url -ErrorAction Stop
    } catch {
        Write-Host "Could not open a browser automatically. Open $url"
    }
}

$databaseUrl = 'jdbc:mysql://127.0.0.1:3306/samved'
$envFile = Join-Path $PSScriptRoot 'backend\.env'
if (Test-Path -LiteralPath $envFile) {
    $configuredUrl = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*SAMVED_DB_URL=' } | Select-Object -Last 1
    if ($configuredUrl) { $databaseUrl = ($configuredUrl -split '=', 2)[1].Trim() }
}
if ($databaseUrl -match '^jdbc:mysql://(?:127\.0\.0\.1|localhost)(?::\d+)?/') {
    $mysqlServices = if ($env:SAMVED_MYSQL_SERVICE) {
        @(Get-Service -Name $env:SAMVED_MYSQL_SERVICE -ErrorAction SilentlyContinue)
    } else {
        @(Get-Service -Name 'MySQL*', 'MariaDB*' -ErrorAction SilentlyContinue)
    }
    if ($mysqlServices.Count -eq 0) {
        throw 'No local MySQL service was found. Install MySQL Server or set SAMVED_MYSQL_SERVICE to its Windows service name.'
    }
    if ($mysqlServices.Count -gt 1) {
        throw 'Multiple MySQL services were found. Set SAMVED_MYSQL_SERVICE to the service name used by SAMVED.'
    }
    $mysqlService = $mysqlServices[0]
    if ($mysqlService.Status -ne 'Running') {
        Write-Host "Starting MySQL service $($mysqlService.Name)..."
        try {
            Start-Service -Name $mysqlService.Name -ErrorAction Stop
        } catch {
            Write-Host 'Windows administrator approval may be needed to start MySQL.'
            $helper = Join-Path $PSScriptRoot 'start-mysql-service.ps1'
            try {
                $elevated = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $helper + '"'), '-ServiceName', ('"' + $mysqlService.Name + '"')) -Verb RunAs -WindowStyle Hidden -Wait -PassThru
            } catch {
                throw "MySQL service $($mysqlService.Name) could not be started. Approve the Windows administrator prompt and try again."
            }
            if ($elevated.ExitCode -ne 0) { throw "MySQL service $($mysqlService.Name) did not start. Check Windows Services." }
        }
        $mysqlService = Get-Service -Name $mysqlService.Name
        $mysqlService.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
    }
    Write-Host "MySQL service $($mysqlService.Name) is running."
}

$appPort = if ($env:SAMVED_PORT) { $env:SAMVED_PORT } else { '8080' }
$appUrl = "http://127.0.0.1:$appPort"
try {
    $running = Invoke-RestMethod "$appUrl/api/v1/auth/csrf" -TimeoutSec 2
    if ($running.token) { Open-LoginPage "$appUrl/login.html"; Write-Host "SAMVED is already running at $appUrl"; exit 0 }
} catch { }
$portBindings = & netstat.exe -ano -p TCP | Select-String "^\s*TCP\s+\S+:$appPort\s+\S+\s+LISTENING\s+\d+\s*$"
if ($portBindings) {
    throw "Port $appPort is in use. Stop the previous app in its terminal (Ctrl+C), then try again."
}
Write-Host 'Building SAMVED. backend/.env must contain your database credentials.'
& $mavenExe -f backend/pom.xml "-Dmaven.repo.local=$PSScriptRoot/.tools/m2" -DskipTests clean package -q
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
        if ($health.status -eq 'UP' -and $authReady.token -and -not $serverProcess.HasExited) { Open-LoginPage "$appUrl/login.html"; Write-Host "SAMVED is ready: $appUrl"; Write-Host "Server process: $($serverProcess.Id). Logs: $outLog"; exit 0 }
    } catch { }
    Start-Sleep -Seconds 1
}
Write-Host "Startup is taking longer than usual. Check $outLog and open $appUrl when it reports Started SamvedApplication."
