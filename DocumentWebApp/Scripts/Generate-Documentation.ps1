param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$true)]
    [string]$ModuleId,
    
    [Parameter(Mandatory=$true)]
    [string]$UserId,
    
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString,
    
    [Parameter(Mandatory=$true)]
    [string]$BlobStorageConnectionString,
    
    [Parameter(Mandatory=$true)]
    [string]$BlobContainerName,
    
    [Parameter(Mandatory=$true)]
    [string]$SourcePath
)

# Function to log messages
function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
    Add-Content -Path "documentation_generation.log" -Value "[$timestamp] $Message"
}

try {
    Write-Log "Starting documentation generation process..."
    
    # Install required modules if not present
    if (-not (Get-Module -ListAvailable -Name Az.Storage)) {
        Write-Log "Installing Az.Storage module..."
        Install-Module -Name Az.Storage -Force -AllowClobber
    }
    
    if (-not (Get-Command docfx -ErrorAction SilentlyContinue)) {
        Write-Log "Installing DocFX..."
        dotnet tool install -g docfx
    }

    # Create temp directory for documentation
    $tempDir = Join-Path $env:TEMP "doc_generation_$(Get-Date -Format 'yyyyMMddHHmmss')"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    # Create DocFX config
    $docfxConfig = @"
{
  "metadata": [
    {
      "src": [
        {
          "files": ["**/*.cs"],
          "src": "$SourcePath"
        }
      ],
      "dest": "api",
      "disableGitFeatures": false,
      "disableDefaultFilter": false
    }
  ],
  "build": {
    "content": [
      {
        "files": [
          "api/**.yml",
          "api/index.md"
        ]
      },
      {
        "files": [
          "articles/**.md",
          "articles/**/toc.yml",
          "toc.yml",
          "*.md"
        ]
      }
    ],
    "resource": [
      {
        "files": [
          "images/**"
        ]
      }
    ],
    "dest": "_site",
    "globalMetadataFiles": [],
    "fileMetadataFiles": [],
    "template": [
      "default"
    ],
    "postProcessors": [],
    "markdownEngineName": "markdig",
    "noLangKeyword": false,
    "keepFileLink": false,
    "cleanupCacheHistory": false,
    "disableGitFeatures": false
  }
}
"@

    # Save DocFX config
    $docfxConfigPath = Join-Path $tempDir "docfx.json"
    $docfxConfig | Out-File $docfxConfigPath -Encoding UTF8
    
    # Generate documentation
    Write-Log "Generating documentation using DocFX..."
    Push-Location $tempDir
    docfx $docfxConfigPath
    Pop-Location
    
    # Zip the generated documentation
    $zipPath = Join-Path $tempDir "documentation.zip"
    Compress-Archive -Path (Join-Path $tempDir "_site\*") -DestinationPath $zipPath
    
    # Upload to Azure Blob Storage
    Write-Log "Uploading to Azure Blob Storage..."
    $storageContext = New-AzStorageContext -ConnectionString $BlobStorageConnectionString
    $blobName = "docs/$ProjectId/$ModuleId/$Version/documentation.zip"
    $blob = Set-AzStorageBlobContent -Container $BlobContainerName -File $zipPath -Blob $blobName -Context $storageContext -Force
    $blobUrl = $blob.ICloudBlob.Uri.AbsoluteUri
    
    # Get mapping ID from database
    $getMappingIdQuery = @"
    SELECT ProjModuleMappId 
    FROM ProjectModuleMapping 
    WHERE ProjectId = $ProjectId 
    AND ModuleId = $ModuleId
"@
    
    $sqlConnection = New-Object System.Data.SqlClient.SqlConnection
    $sqlConnection.ConnectionString = $ConnectionString
    $sqlConnection.Open()
    
    $command = New-Object System.Data.SqlClient.SqlCommand($getMappingIdQuery, $sqlConnection)
    $mappingId = $command.ExecuteScalar()
    
    if (-not $mappingId) {
        throw "No mapping found for ProjectId $ProjectId and ModuleId $ModuleId"
    }
    
    # Insert into DocumentationPages
    $insertQuery = @"
    INSERT INTO DocumentationPages (
        ProjModuleMappId,
        PageName,
        Version,
        BlobUrl,
        CreatedBy,
        CreatedDate,
        ModifiedDate
    ) VALUES (
        $mappingId,
        'Documentation',
        '$Version',
        '$blobUrl',
        $UserId,
        GETDATE(),
        GETDATE()
    )
"@
    
    $command = New-Object System.Data.SqlClient.SqlCommand($insertQuery, $sqlConnection)
    $command.ExecuteNonQuery()
    
    Write-Log "Documentation generation and upload completed successfully!"
    Write-Log "Blob URL: $blobUrl"
    
} catch {
    Write-Log "Error: $_"
    throw
} finally {
    if ($sqlConnection -and $sqlConnection.State -eq 'Open') {
        $sqlConnection.Close()
    }
    
    # Cleanup
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
}
