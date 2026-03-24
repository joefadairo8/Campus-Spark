$sourceDir = "C:\Users\LENOVO PC\.gemini\antigravity\brain\d42b9c83-685a-41d2-ada2-8d60444cdf8f"
$destDir = "c:\Users\LENOVO PC\Documents\Websites\Projects\Campus Spark\public\images"

Write-Host "Copying from $sourceDir to $destDir"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
    Write-Host "Created destination directory"
}

try {
    Copy-Item "$sourceDir\hero_students_1769967015558.png" "$destDir\hero-students.png" -Force
    Write-Host "Copied hero-students.png"
} catch {
    Write-Error "Failed to copy hero-students.png: $_"
}

try {
    Copy-Item "$sourceDir\feature_events_1769967035472.png" "$destDir\feature-events.png" -Force
    Write-Host "Copied feature-events.png"
} catch {
    Write-Error "Failed to copy feature-events.png: $_"
}

try {
    Copy-Item "$sourceDir\feature_ambassador_1769967052835.png" "$destDir\feature-ambassador.png" -Force
    Write-Host "Copied feature-ambassador.png"
} catch {
    Write-Error "Failed to copy feature-ambassador.png: $_"
}

Get-ChildItem $destDir
