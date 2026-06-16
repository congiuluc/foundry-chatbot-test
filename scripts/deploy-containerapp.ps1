#Requires -Version 7.0
<#
.SYNOPSIS
    Creates or updates an Azure Container App running the ChatApp image.

.DESCRIPTION
    Provisions a Container Apps environment (if needed) and deploys the image from ACR.
    A system-assigned managed identity is enabled and granted AcrPull on the registry so
    the app pulls the image without admin credentials. Application configuration is passed
    through environment variables.

.PARAMETER ResourceGroup
    The resource group to deploy into.

.PARAMETER Location
    The Azure region. Defaults to 'westeurope'.

.PARAMETER EnvironmentName
    The Container Apps environment name.

.PARAMETER AppName
    The Container App name.

.PARAMETER RegistryName
    The Azure Container Registry name (without the .azurecr.io suffix).

.PARAMETER ImageName
    The repository/image name. Defaults to 'chatapp'.

.PARAMETER Tag
    The image tag to deploy. Defaults to 'latest'.

.PARAMETER EnvVars
    Hashtable of application environment variables (e.g. AI_MODE, AZURE_OPENAI_ENDPOINT).

.EXAMPLE
    ./scripts/deploy-containerapp.ps1 `
        -ResourceGroup rg-chat -RegistryName myregistry -AppName chatapp `
        -EnvironmentName cae-chat `
        -EnvVars @{ AI_MODE = "model"; AZURE_OPENAI_ENDPOINT = "https://..."; AZURE_OPENAI_DEPLOYMENT_NAME = "gpt-4o-mini" }
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$ResourceGroup,
    [string]$Location = "westeurope",
    [Parameter(Mandatory = $true)][string]$EnvironmentName,
    [Parameter(Mandatory = $true)][string]$AppName,
    [Parameter(Mandatory = $true)][string]$RegistryName,
    [string]$ImageName = "chatapp",
    [string]$Tag = "latest",
    [hashtable]$EnvVars = @{}
)

$ErrorActionPreference = "Stop"

$registryServer = "$RegistryName.azurecr.io"
$image = "$registryServer/${ImageName}:$Tag"

Write-Host "Ensuring resource group '$ResourceGroup'..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location --output none

Write-Host "Ensuring Container Apps environment '$EnvironmentName'..." -ForegroundColor Cyan
$envExists = az containerapp env show --name $EnvironmentName --resource-group $ResourceGroup --query "name" --output tsv 2>$null
if (-not $envExists) {
    az containerapp env create `
        --name $EnvironmentName `
        --resource-group $ResourceGroup `
        --location $Location `
        --output none
}

# Build the --env-vars argument list as "KEY=VALUE" pairs.
$envPairs = @()
foreach ($key in $EnvVars.Keys) {
    $envPairs += ("{0}={1}" -f $key, $EnvVars[$key])
}

$appExists = az containerapp show --name $AppName --resource-group $ResourceGroup --query "name" --output tsv 2>$null

if (-not $appExists) {
    Write-Host "Creating Container App '$AppName'..." -ForegroundColor Cyan
    az containerapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --environment $EnvironmentName `
        --image $image `
        --target-port 8080 `
        --ingress external `
        --system-assigned `
        --registry-server $registryServer `
        --registry-identity system `
        --min-replicas 1 `
        --max-replicas 3 `
        --output none

    if ($envPairs.Count -gt 0) {
        az containerapp update --name $AppName --resource-group $ResourceGroup `
            --set-env-vars $envPairs --output none
    }
}
else {
    Write-Host "Updating Container App '$AppName'..." -ForegroundColor Cyan
    az containerapp update `
        --name $AppName `
        --resource-group $ResourceGroup `
        --image $image `
        --output none

    if ($envPairs.Count -gt 0) {
        az containerapp update --name $AppName --resource-group $ResourceGroup `
            --set-env-vars $envPairs --output none
    }
}

# Grant the app's managed identity AcrPull on the registry.
$principalId = az containerapp show --name $AppName --resource-group $ResourceGroup `
    --query "identity.principalId" --output tsv
$registryId = az acr show --name $RegistryName --query "id" --output tsv
az role assignment create `
    --assignee $principalId `
    --role "AcrPull" `
    --scope $registryId `
    --output none 2>$null

$fqdn = az containerapp show --name $AppName --resource-group $ResourceGroup `
    --query "properties.configuration.ingress.fqdn" --output tsv
Write-Host "Deployed. App URL: https://$fqdn" -ForegroundColor Green
Write-Host "NOTE: grant the app identity '$principalId' access to your Foundry resource (e.g. 'Cognitive Services OpenAI User' or 'Azure AI User')." -ForegroundColor Yellow
