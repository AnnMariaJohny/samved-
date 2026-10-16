param([Parameter(Mandatory = $true)][string]$ServiceName)

$ErrorActionPreference = 'Stop'
Start-Service -Name $ServiceName
$service = Get-Service -Name $ServiceName
$service.WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
