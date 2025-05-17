using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using MS_DOCS.Services.Interfaces;
using System.Data.SqlClient;

namespace MS_DOCS.Services.Implementations
{
    public class AzureBlobStorageService : IBlobStorageService
    {
        private string _tenantId;
        private string _clientId;
        private string _clientSecret;
        private string _storageAccountName;
        private string _containerName;
        private readonly ILogger<AzureBlobStorageService> _logger;
        private readonly ISQLHelper _sqlHelper;

        public AzureBlobStorageService(ISQLHelper sqlHelper, ILogger<AzureBlobStorageService> logger)
        {
            _sqlHelper = sqlHelper;
            _logger = logger;
            
            // Load blob storage details from database on initialization
            LoadBlobStorageDetails();
        }
        
        /// <summary>
        /// Loads the Azure Blob Storage connection details from the database
        /// </summary>
        private void LoadBlobStorageDetails(int blobId = 1)
        {
            try
            {
                _logger.LogInformation("Loading blob storage details from database for blob ID: {BlobId}", blobId);
                
                SqlParameter[] parameters = new SqlParameter[]
                {
                    new SqlParameter("@BlobId", blobId)
                };
                
                using (SqlDataReader reader = _sqlHelper.ExecuteReaderSP("sp_GetBlobStorageDetails", parameters))
                {
                    if (reader.Read())
                    {
                        _tenantId = GetStringValue(reader, "TENANT_ID");
                        _clientId = GetStringValue(reader, "CLIENT_ID");
                        _clientSecret = GetStringValue(reader, "CLIENT_SECRET");
                        _storageAccountName = GetStringValue(reader, "STORAGE_NAME");
                        _containerName = GetStringValue(reader, "CONTAINER_NAME");
                        
                        _logger.LogInformation("Successfully loaded blob storage details for account: {StorageAccountName}", _storageAccountName);
                    }
                    else
                    {
                        _logger.LogError("No blob storage details found for blob ID: {BlobId}", blobId);
                        throw new Exception($"No blob storage details found for blob ID: {blobId}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading blob storage details from database");
                throw new Exception("Failed to load blob storage configuration", ex);
            }
        }
        
        /// <summary>
        /// Helper method to safely get string values from SqlDataReader
        /// </summary>
        private string GetStringValue(SqlDataReader reader, string columnName, string defaultValue = "")
        {
            try
            {
                int ordinal = reader.GetOrdinal(columnName);
                return reader.IsDBNull(ordinal) ? defaultValue : reader.GetString(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                _logger.LogWarning("{ColumnName} column not found in result set", columnName);
                return defaultValue;
            }
         }

        private BlobServiceClient GetBlobServiceClient()
        {
            try
            {
                var credential = new ClientSecretCredential(_tenantId, _clientId, _clientSecret);
                var serviceUri = new Uri($"https://{_storageAccountName}.blob.core.windows.net");
                return new BlobServiceClient(serviceUri, credential);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating BlobServiceClient");
                throw;
            }
        }

        public async Task<string> UploadFileAsync(string fileName, byte[] fileContent, string contentType)
        {
            try
            {
                var blobServiceClient = GetBlobServiceClient();
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                if (!await containerClient.ExistsAsync())
                    await containerClient.CreateAsync();

                var blobClient = containerClient.GetBlobClient(fileName);
                var httpHeaders = new BlobHttpHeaders { ContentType = contentType };
                
                using (var stream = new MemoryStream(fileContent))
                {
                    await blobClient.UploadAsync(stream, httpHeaders);
                }
                var sasUri = await GenerateSasUriAsync(fileName, 10);
                return sasUri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file to blob storage: {FileName}", fileName);
                return null;
            }
        }

        public async Task<object> DownloadFileAsync(string fileName, bool returnAsBase64 = true, bool isSaSUri = false)
        {
            try
            {
                string fileUrl;
                if (!isSaSUri)
                {
                    var sasUri = await GenerateSasUriAsync(fileName, 10); // SAS valid for 10 minutes
                    if (sasUri == null)
                        return null;
                    fileUrl = sasUri;
                }
                else
                    fileUrl = fileName;

                using (var httpClient = new HttpClient())
                {
                    var fileBytes = await httpClient.GetByteArrayAsync(fileUrl);
                    
                    // Check if it's an HTML file
                    if (fileName.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
                    {
                        return System.Text.Encoding.UTF8.GetString(fileBytes);
                    }
                    
                    return returnAsBase64 ? Convert.ToBase64String(fileBytes) : fileBytes;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file from blob storage: {FileName}", fileName);
                return null;
            }
        }

        public async Task<string> DownloadHtmlContentAsync(string fileName, bool isSaSUri = false)
        {
            try
            {
                string fileUrl;
                if (!isSaSUri)
                {
                    var sasUri = await GenerateSasUriAsync(fileName, 1); // SAS valid for 1 minutes
                    if (sasUri == null)
                        return null;
                    fileUrl = sasUri;
                }
                else
                    fileUrl = fileName;
                _logger.LogInformation("Downloading HTML content from blob storage: {fileUrl}", fileUrl);
                using (var httpClient = new HttpClient())
                {
                    var fileBytes = await httpClient.GetByteArrayAsync(fileUrl);
                    return System.Text.Encoding.UTF8.GetString(fileBytes);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading HTML content from blob storage: {FileName}", fileName);
                throw new Exception("Failed to download document content", ex);
            }
        }

        public async Task<string> GenerateSasUriAsync(string blobName, int expiresInMinutes = 10)
        {
            try
            {
                var blobServiceClient = GetBlobServiceClient();
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(blobName);

                if (!(await blobClient.ExistsAsync()).Value)
                    return null;

                var startTime = DateTimeOffset.UtcNow;
                var expiryTime = startTime.AddMinutes(expiresInMinutes);
                var userDelegationKey = (await blobServiceClient.GetUserDelegationKeyAsync(startTime, expiryTime)).Value;

                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _containerName,
                    BlobName = blobName,
                    Resource = "b",
                    StartsOn = startTime,
                    ExpiresOn = expiryTime
                };
                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                var sasToken = sasBuilder.ToSasQueryParameters(userDelegationKey, _storageAccountName).ToString();
                return blobClient.Uri + "?" + sasToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SAS URI for blob: {BlobName}", blobName);
                return null;
            }
        }

        public async Task<string> UpdateBlobContentAsync(string fileName, byte[] fileContent, string contentType)
        {
            try
            {
                var blobServiceClient = GetBlobServiceClient();
                var containerClient = blobServiceClient.GetBlobContainerClient(_containerName);
                var blobClient = containerClient.GetBlobClient(fileName);

                // Check if blob exists
                if (!(await blobClient.ExistsAsync()).Value)
                {
                    _logger.LogWarning("Blob {FileName} does not exist. Creating new blob.", fileName);
                }

                // Set content type and upload
                var httpHeaders = new BlobHttpHeaders { ContentType = contentType };
                
                using (var stream = new MemoryStream(fileContent))
                {
                    // This will overwrite the existing blob if it exists
                    await blobClient.UploadAsync(stream, new BlobUploadOptions { HttpHeaders = httpHeaders }, default);
                }

                // Generate and return SAS URI
                var sasUri = await GenerateSasUriAsync(fileName, 10);
                return sasUri;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blob content: {FileName}", fileName);
                throw new Exception($"Failed to update document content for {fileName}", ex);
            }
        }
    }
}
