# One-time MCP setup for this project (Windows PowerShell).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-mcp.ps1
$ErrorActionPreference = 'Stop'

Write-Host '1) Pre-caching Playwright MCP and browsers...'
npx -y @playwright/mcp@latest --version
npx playwright install chromium

Write-Host '2) Checking GitHub token...'
$token = [Environment]::GetEnvironmentVariable('GITHUB_PERSONAL_ACCESS_TOKEN', 'User')
if (-not $token) {
  Write-Warning 'GITHUB_PERSONAL_ACCESS_TOKEN is not set. Set it with:'
  Write-Host '   setx GITHUB_PERSONAL_ACCESS_TOKEN "<your-token>"   (then restart Claude)'
} else {
  $r = Invoke-RestMethod -Uri 'https://api.github.com/user' -Headers @{ Authorization = "Bearer $token"; 'User-Agent' = 'eventhub-qa-setup' }
  Write-Host "   GitHub token OK for user: $($r.login)"
}

Write-Host '3) MCP servers registered for this project:'
claude mcp list
