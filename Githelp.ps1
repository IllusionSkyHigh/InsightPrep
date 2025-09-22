<#
GitHelp.ps1 — Simplified Git Operations Helper (exit after any command)
This for use in D:\Projects\InsightPrep
#>

param(
    [Parameter(Position=0)]
    [string]$Subcommand,
    [Parameter(Position=1)]
    [string]$Param1,
    [Parameter(Position=2)]
    [string]$Param2
)

function Show-Help {
    Write-Host "`nGitHelp.ps1 — Simplified Git Operations"
    Write-Host "USAGE:  GitHelp <subcommand> [parameters...]`n"
    Write-Host "SUBCOMMANDS:`n"
    Write-Host "  pull-main"
    Write-Host "      Merge remote 'main' into your current branch."
    Write-Host "      Description: Safely update your current branch with changes from the remote main branch."
    Write-Host "                   Keeps your local changes. May require merging if there are conflicts."
    Write-Host "      Example: GitHelp pull-main`n"
    Write-Host "  fetch-latest"
    Write-Host "      Force reset your code to match the remote 'main' branch exactly."
    Write-Host "      Description: WARNING: This will OVERWRITE ALL your local changes (even uncommitted and unpushed commits)."
    Write-Host "                   Use only if you want to discard all local work and make your code match the remote repository."
    Write-Host "      Example: GitHelp fetch-latest`n"
    Write-Host "  fetch-file <filename>"
    Write-Host "      Get the latest of a specific file from the repo."
    Write-Host "      Example: GitHelp fetch-file main.py`n"
    Write-Host "  tag-checkout <tag>"
    Write-Host "      Get all code from a specific tag."
    Write-Host "      Example: GitHelp tag-checkout v1.2.0`n"
    Write-Host "  tag-file <tag> <filename>"
    Write-Host "      Get a specific source file from a specific tag."
    Write-Host "      Example: GitHelp tag-file v1.2.0 main.py`n"
    Write-Host "  commit-push <commit message>"
    Write-Host "      Commit and push all latest source in local folder with a description."
    Write-Host "      Example: GitHelp commit-push `"Fixed right-click handler`"`n"
    Write-Host "  tag-create <tag> <description>"
    Write-Host "      Create a tag with a description."
    Write-Host "      Example: GitHelp tag-create v1.3.0 `"Release: right-click preview support`"`n"
    Write-Host "For help, use: GitHelp /?   or   GitHelp /h   or   GitHelp -h`n"
}

function Confirm-Yes($Summary, $GitCommands) {
    Write-Host ""
    if ($Summary -is [array]) {
        foreach ($line in $Summary) {
            Write-Host $line -ForegroundColor Red
        }
    } elseif ($Summary -like "WARNING*") {
        Write-Host $Summary -ForegroundColor Red
    } else {
        Write-Host "Operation: $Summary"
    }
    Write-Host "Will run:" -ForegroundColor Yellow
    foreach ($cmd in $GitCommands) {
        Write-Host "  $cmd" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Type YES to proceed, [b]ack to menu, or [e]xit:"
    $response = Read-Host
    if ($response -eq "b") { return "back" }
    if ($response -eq "e" -or $response -eq "exit") { exit 0 }
    if ($response -ne "YES") {
        Write-Host "Aborted. No changes made."
        exit 0
    }
    return "ok"
}

function Test-FileName($filename) {
    if ([string]::IsNullOrWhiteSpace($filename)) {
        Write-Host "ERROR: No filename supplied."
        return $false
    }
    return $true
}

function Test-Tag($tag) {
    if ([string]::IsNullOrWhiteSpace($tag)) {
        Write-Host "ERROR: No tag supplied."
        return $false
    }
    $tagExists = git tag | Select-String -Pattern "^$tag$"
    if (-not $tagExists) {
        Write-Host "WARNING: Tag '$tag' does not exist locally. Fetching tags from origin..." -ForegroundColor Yellow
        git fetch --tags
        $tagExists = git tag | Select-String -Pattern "^$tag$"
        if (-not $tagExists) {
            Write-Host "ERROR: Tag '$tag' does not exist in this repo."
            return $false
        }
    }
    return $true
}

function Test-NewTag($tag) {
    if ([string]::IsNullOrWhiteSpace($tag)) {
        Write-Host "ERROR: No tag supplied."
        return $false
    }
    # Check if tag already exists locally
    $tagExists = git tag | Select-String -Pattern "^$tag$"
    if ($tagExists) {
        Write-Host "ERROR: Tag '$tag' already exists locally."
        return $false
    }
    # Check if tag exists on remote
    Write-Host "Checking if tag exists on remote..." -ForegroundColor Yellow
    git fetch --tags 2>$null
    $remoteTagExists = git tag | Select-String -Pattern "^$tag$"
    if ($remoteTagExists) {
        Write-Host "ERROR: Tag '$tag' already exists on remote repository."
        return $false
    }
    return $true
}

function Test-Message($msg) {
    if ([string]::IsNullOrWhiteSpace($msg)) {
        Write-Host "ERROR: Commit/tag message cannot be empty."
        return $false
    }
    return $true
}

# Trap Ctrl+C for clean exit
$eventHandler = {
    Write-Host "`nExiting GitHelp. No changes made."
    exit
}
$null = Register-EngineEvent PowerShell.Exiting -Action $eventHandler

# Must be in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "ERROR: This folder is not a git repository. Please run from your project root."
    exit 1
}

while ($true) {
    Show-Help

    $subcommandList = @(
        "pull-main",
        "fetch-latest",
        "fetch-file",
        "tag-checkout",
        "tag-file",
        "commit-push",
        "tag-create"
    )

    Write-Host ""
    Write-Host "Choose a subcommand (number or name), [b]ack to menu, or [e]xit:"
    for ($i=0; $i -lt $subcommandList.Count; $i++) {
        Write-Host "  $($i+1). $($subcommandList[$i])"
    }
    Write-Host "  b. Back to menu"
    Write-Host "  e. Exit"

    $choice = Read-Host "Enter subcommand"
    if ($choice -eq "e" -or $choice -eq "exit") { exit 0 }
    if ($choice -eq "b") { continue }
    if ($choice -match '^\d+$') {
        $choiceIdx = [int]$choice - 1
        if ($choiceIdx -ge 0 -and $choiceIdx -lt $subcommandList.Count) {
            $Subcommand = $subcommandList[$choiceIdx]
        } else {
            Write-Host "Invalid choice."
            continue
        }
    } elseif ($subcommandList -contains $choice) {
        $Subcommand = $choice
    } else {
        Write-Host "Unknown subcommand: $choice"
        continue
    }
    $Param1 = $null
    $Param2 = $null

    switch ($Subcommand.ToLower()) {
        "pull-main" {
            $summary = "Merges remote 'main' branch into your current branch. Keeps all your local changes and tries to merge new changes from remote. You may need to resolve merge conflicts."
            $commands = @("git pull origin main")
            $r = Confirm-Yes $summary $commands
            if ($r -eq "back") { continue }
            git pull origin main
            if ($LASTEXITCODE -ne 0) { Write-Host "git pull failed. (Check for merge conflicts or network issues.)"; exit 0 }
            Write-Host "Remote 'main' merged into your branch."
            exit 0
        }
        "fetch-latest" {
            Write-Host "WARNING: This will OVERWRITE ALL your local changes (even uncommitted and unpushed commits)." -ForegroundColor Red
            Write-Host "Use only if you want to discard all local work and make your code match the remote repository." -ForegroundColor Red
            $summary = "Force reset your code to match the remote 'main' branch exactly."
            $commands = @("git fetch origin", "git reset --hard origin/main")
            $r = Confirm-Yes $summary $commands
            if ($r -eq "back") { continue }
            git fetch origin
            if ($LASTEXITCODE -ne 0) { Write-Host "git fetch failed."; exit 0 }
            git reset --hard origin/main
            if ($LASTEXITCODE -ne 0) { Write-Host "git reset failed."; exit 0 }
            Write-Host "Latest code fetched and local changes overwritten successfully."
            exit 0
        }
        "fetch-file" {
            while ($true) {
                $filename = Read-Host "Enter filename to fetch from remote (e.g. main.py)"
                if ($filename -eq "b") { break }
                if ($filename -eq "e" -or $filename -eq "exit") { exit 0 }
                if (-not (Test-FileName $filename)) { continue }
                $summary = "Fetches latest version of '$filename' from remote and overwrites your local copy."
                $commands = @("git fetch origin", "git checkout origin/main -- $filename")
                $r = Confirm-Yes $summary $commands
                if ($r -eq "back") { break }
                git fetch origin
                if ($LASTEXITCODE -ne 0) { Write-Host "git fetch failed."; exit 0 }
                git checkout origin/main -- $filename
                if ($LASTEXITCODE -ne 0) { Write-Host "git checkout failed."; exit 0 }
                Write-Host "Latest version of $filename fetched from remote successfully."
                exit 0
            }
        }
        "tag-checkout" {
            while ($true) {
                $tag = Read-Host "Enter tag name to checkout (e.g. v1.2.0)"
                if ($tag -eq "b") { break }
                if ($tag -eq "e" -or $tag -eq "exit") { exit 0 }
                if (-not (Test-Tag $tag)) { continue }
                $summary = "Checks out all project files from tag '$tag'."
                $commands = @("git fetch origin", "git checkout tags/$tag")
                $r = Confirm-Yes $summary $commands
                if ($r -eq "back") { break }
                git fetch origin
                if ($LASTEXITCODE -ne 0) { Write-Host "git fetch failed."; exit 0 }
                git checkout tags/$tag
                if ($LASTEXITCODE -ne 0) { Write-Host "git checkout failed."; exit 0 }
                Write-Host "Checked out all files from tag '$tag' successfully."
                exit 0
            }
        }
        "tag-file" {
            while ($true) {
                $tag = Read-Host "Enter tag name (e.g. v1.2.0)"
                if ($tag -eq "b") { break }
                if ($tag -eq "e" -or $tag -eq "exit") { exit 0 }
                if (-not (Test-Tag $tag)) { continue }
                $filename = Read-Host "Enter filename to restore from tag"
                if ($filename -eq "b") { break }
                if ($filename -eq "e" -or $filename -eq "exit") { exit 0 }
                if (-not (Test-FileName $filename)) { continue }
                $summary = "Restores file '$filename' as it existed at tag '$tag'."
                $commands = @("git fetch origin", "git checkout tags/$tag -- $filename")
                $r = Confirm-Yes $summary $commands
                if ($r -eq "back") { break }
                git fetch origin
                if ($LASTEXITCODE -ne 0) { Write-Host "git fetch failed."; exit 0 }
                git checkout tags/$tag -- $filename
                if ($LASTEXITCODE -ne 0) { Write-Host "git checkout failed."; exit 0 }
                Write-Host "'$filename' restored from tag '$tag' successfully."
                exit 0
            }
        }
        "commit-push" {
            while ($true) {
                $msg = Read-Host "Enter commit message:"
                if ($msg -eq "b") { break }
                if ($msg -eq "e" -or $msg -eq "exit") { exit 0 }
                if (-not (Test-Message $msg)) { continue }
                
                # Get list of modified files
                Write-Host "`nChecking for modified files..." -ForegroundColor Yellow
                $modifiedFiles = git status --porcelain
                
                if (-not $modifiedFiles) {
                    Write-Host "No changes detected. Nothing to commit." -ForegroundColor Green
                    continue
                }
                
                # Display modified files
                Write-Host "`nFiles that will be committed:" -ForegroundColor Cyan
                foreach ($line in $modifiedFiles) {
                    $status = $line.Substring(0, 2)
                    $filename = $line.Substring(3)
                    switch ($status.Trim()) {
                        "M" { Write-Host "  Modified: $filename" -ForegroundColor Yellow }
                        "A" { Write-Host "  Added: $filename" -ForegroundColor Green }
                        "D" { Write-Host "  Deleted: $filename" -ForegroundColor Red }
                        "R" { Write-Host "  Renamed: $filename" -ForegroundColor Magenta }
                        "C" { Write-Host "  Copied: $filename" -ForegroundColor Magenta }
                        "??" { Write-Host "  Untracked: $filename" -ForegroundColor White }
                        default { Write-Host "  $status $filename" -ForegroundColor Gray }
                    }
                }
                
                $summary = "Stages all local changes, commits with your message, and pushes to the repo."
                $commands = @("git add .", "git commit -m `"$msg`"", "git push")
                $r = Confirm-Yes $summary $commands
                if ($r -eq "back") { break }
                git add .
                if ($LASTEXITCODE -ne 0) { Write-Host "git add failed."; exit 0 }
                git commit -m "$msg"
                if ($LASTEXITCODE -ne 0) { Write-Host "git commit failed (perhaps nothing to commit)."; exit 0 }
                git push
                if ($LASTEXITCODE -ne 0) { Write-Host "git push failed."; exit 0 }
                Write-Host "All changes committed and pushed successfully."
                exit 0
            }
        }
        "tag-create" {
            while ($true) {
                $tag = Read-Host "Enter tag name (e.g. v1.2.0)"
                if ($tag -eq "b") { break }
                if ($tag -eq "e" -or $tag -eq "exit") { exit 0 }
                if (-not (Test-NewTag $tag)) { continue }
                $desc = Read-Host "Enter tag description"
                if ($desc -eq "b") { break }
                if ($desc -eq "e" -or $desc -eq "exit") { exit 0 }
                if (-not (Test-Message $desc)) { continue }
                $summary = "Creates tag '$tag' with description and pushes it to the remote repository."
                $commands = @("git tag -a $tag -m `"$desc`"", "git push origin $tag")
                $r = Confirm-Yes $summary $commands
                if ($r -eq "back") { break }
                git tag -a $tag -m "$desc"
                if ($LASTEXITCODE -ne 0) { Write-Host "git tag failed (perhaps tag already exists)."; exit 0 }
                git push origin $tag
                if ($LASTEXITCODE -ne 0) { Write-Host "git push failed."; exit 0 }
                Write-Host "Tag '$tag' created and pushed to remote successfully."
                exit 0
            }
        }
        default {
            Write-Host "Unknown subcommand: $Subcommand"
            exit 1
        }
    }
}
