# Sets up a Windows Task Scheduler entry that opens the TOEFL Trainer
# in your default browser every day at the chosen hour.
#
# Run as your own user (NOT admin). The task runs only when you are logged in.
#
# Usage:
#   .\scripts\setup-toefl-daily-reminder.ps1                 # default: 08:00 + 20:00 local time
#   .\scripts\setup-toefl-daily-reminder.ps1 -Hours 9,21    # custom times
#   .\scripts\setup-toefl-daily-reminder.ps1 -Url "https://puddings-world.com/toefl/"
#   .\scripts\setup-toefl-daily-reminder.ps1 -Remove        # remove the task

param(
    [int[]]$Hours = @(8, 20),
    [string]$Url = "https://puddings-world.com/toefl/",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"
$TaskName = "TOEFL Daily Trainer"

if ($Remove) {
    Get-ScheduledTask -TaskName "$TaskName*" -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
    Write-Host "Removed all TOEFL Daily Trainer scheduled tasks." -ForegroundColor Green
    exit 0
}

# Clean up any existing tasks first
Get-ScheduledTask -TaskName "$TaskName*" -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false

$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c start `"`" `"$Url`""

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive

foreach ($h in $Hours) {
    $TimeStr = "{0:D2}:00" -f $h
    $Trigger = New-ScheduledTaskTrigger -Daily -At $TimeStr
    $SubName = "$TaskName ($TimeStr)"
    Register-ScheduledTask `
        -TaskName $SubName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Opens TOEFL Daily Trainer to enforce daily practice habit." | Out-Null
    Write-Host "Scheduled at $TimeStr daily." -ForegroundColor Green
}

Write-Host ""
Write-Host "Setup complete. URL: $Url"
Write-Host ""
Write-Host "Manage:"
Write-Host "  taskschd.msc                                  # open Task Scheduler GUI"
Write-Host "  .\scripts\setup-toefl-daily-reminder.ps1 -Remove   # remove all"
