#Requires -Version 7.0
<#
.SYNOPSIS
    Builds the ChatApp container image and pushes it to Azure Container Registry.

.DESCRIPTION
    Uses 'az acr build' so the image is built in the cloud (no local Docker required).
    All values can be provided as parameters or environment variables.

.PARAMETER RegistryName
    The Azure Container Registry name (without the .azurecr.io suffix).

.PARAMETER ImageName
    The repository/image name. Defaults to 'chatapp'.

.PARAMETER Tag
    The image tag. Defaults to the short git commit, or 'latest'.

.EXAMPLE
    ./scripts/build-and-push.ps1 -RegistryName myregistry -Tag v1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RegistryName,

    [string]$ImageName = "chatapp",

    [string]$Tag = $(try { (git rev-parse --short HEAD) } catch { "latest" })
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$image = "{0}:{1}" -f $ImageName, $Tag

Write-Host "Building image '$image' in registry '$RegistryName'..." -ForegroundColor Cyan

az acr build `
    --registry $RegistryName `
    --image $image `
    --file (Join-Path $repoRoot "Dockerfile") `
    $repoRoot

Write-Host "Pushed $RegistryName.azurecr.io/$image" -ForegroundColor Green
