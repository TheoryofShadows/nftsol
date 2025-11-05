# Cleanup temporary and redundant markdown files
# Keep only essential documentation

$essentialDocs = @(
    "README.md",
    "TECHNICAL-DOCS.md",
    "DEPLOYMENT.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "OPTIMIZATION_GUIDE.md",
    "RELEASE_NOTES.md",
    "WHITEPAPER.md",
    "PROJECT_STATUS.md"
)

$filesToDelete = Get-ChildItem -Path . -Filter "*.md" -File | Where-Object {
    $essentialDocs -notcontains $_.Name
}

Write-Host "Found $($filesToDelete.Count) files to delete"
$filesToDelete | ForEach-Object { Write-Host "  - $($_.Name)" }

