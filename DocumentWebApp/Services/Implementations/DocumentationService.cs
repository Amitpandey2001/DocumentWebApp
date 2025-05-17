using Microsoft.Extensions.Logging;
using MS_DOCS.DAL.Common;
using MS_DOCS.Models;
using MS_DOCS.Models.ViewModels;
using MS_DOCS.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MS_DOCS.Services.Implementations
{
    public class DocumentationService : IDocumentationService
    {
        private readonly ISQLHelper _sqlHelper;
        private readonly ILogger<DocumentationService> _logger;
        private readonly IBlobStorageService _blobStorageService;

        public DocumentationService(ISQLHelper sqlHelper, ILogger<DocumentationService> logger, IBlobStorageService blobStorageService)
        {
            _sqlHelper = sqlHelper;
            _logger = logger;
            _blobStorageService = blobStorageService;
        }

        public async Task<List<Module>> GetProjectModules(int projectID)
        {
            var parameters = new[] { new SqlParameter("@ProjectId", projectID) };
            try
            {
                var result = _sqlHelper.ExecuteDataSetSPAsync("sp_GetModuleMappingByProject", parameters);
                if (result != null && result.Result != null && result.Result.Tables.Count > 0)
                {
                    return MapToModuleViewModels(result.Result.Tables[0]);
                }
                else
                {
                    return new List<Module>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project modules for project {ProjectId}", projectID);
                throw;
            }
        }
        private List<Module> MapToModuleViewModels(DataTable dataTable)
        {
            var modules = new List<Module>();
            if (dataTable == null || dataTable.Rows.Count == 0)
            {
                return modules;
            }
            foreach (DataRow row in dataTable.Rows)
            {
                modules.Add(new Module
                {
                    ModuleId = Convert.ToInt32(row["MappingID"]),
                    ModuleName = row["ModuleName"].ToString()
                });
            }

            return modules;
        }
        public List<DocumentationPageViewModel> GetDocumentationPages(int userId)
        {
            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID: {UserId}", userId);
                throw new ArgumentException("Invalid user ID", nameof(userId));
            }

            var parameters = new[] 
            { 
                new SqlParameter("@UserId", userId)
            };

            try
            {
                _logger.LogInformation("Getting documentation pages for user: {UserId}", userId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetDocumentationPagesByUser", parameters).Result;
                var pages = new List<DocumentationPageViewModel>();
                
                while (reader.Read())
                {
                    var page = new DocumentationPageViewModel
                    {
                        PageId = GetInt32OrDefault(reader, "PageId"),
                        ProjModuleMappId = GetInt32OrDefault(reader, "ProjModuleMappId"),
                        PageName = GetStringOrDefault(reader, "PageName"),
                        Version = GetStringOrDefault(reader, "Version"),
                        BlobUrl = GetStringOrDefault(reader, "BlobUrl"),
                        CreatedById = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate"),
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName")
                    };
                    pages.Add(page);
                }
                _logger.LogInformation("Retrieved {Count} documentation pages for user {UserId}", pages.Count, userId);
                return pages;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get documentation pages for user: {UserId}", userId);
                throw new Exception("Failed to get documentation pages", ex);
            }
        }

        public async Task<DocumentationPage> GetDocumentationPageByIdAsync(int pageId,int userId)
        {
            try
            {
                var parameters = new[] { new SqlParameter("@PageId", pageId), 
                    new SqlParameter("@UserId",userId)
                };
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_GetDocumentationPageByIdUserWise", parameters);
                
                if (result?.Tables.Count == 0 || result?.Tables[0].Rows.Count == 0)
                {
                    return null;
                }

                var row = result.Tables[0].Rows[0];
                var page = new DocumentationPage
                {
                    PageId = Convert.ToInt32(row["PageId"]),
                    ProjModuleMappId = Convert.ToInt32(row["ProjModuleMappId"]),
                    PageName = row["PageName"].ToString(),
                    Version = row["Version"].ToString(),
                    BlobUrl = row["BlobUrl"].ToString(),
                    CreatedBy = Convert.ToInt32(row["CreatedBy"]),
                    CreatedDate = Convert.ToDateTime(row["CreatedDate"]),
                    ModifiedDate = row["ModifiedDate"] != DBNull.Value ? Convert.ToDateTime(row["ModifiedDate"]) : null
                };
                
                // Map optional columns using extension method
                MapColumnIfExists(row, "ProjectId", value => page.ProjectId = Convert.ToInt32(value));
                MapColumnIfExists(row, "ModuleId", value => page.ModuleId = Convert.ToInt32(value));
                MapColumnIfExists(row, "ProjectName", value => page.ProjectName = value.ToString());
                MapColumnIfExists(row, "ModuleName", value => page.ModuleName = value.ToString());
                MapColumnIfExists(row, "CreatorName", value => page.CreatorName = value.ToString());

                // Get the content from blob storage asynchronously
                page.Content = await _blobStorageService.DownloadHtmlContentAsync(page.BlobUrl, false);

                return page;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documentation page by ID {PageId}", pageId);
                throw;
            }
        }

        /// <summary>
        /// Maps a column value to a property if the column exists in the DataRow
        /// </summary>
        private void MapColumnIfExists(DataRow row, string columnName, Action<object> mapAction)
        {
            if (row.Table.Columns.Contains(columnName) && row[columnName] != DBNull.Value)
            {
                mapAction(row[columnName]);
            }
        }

        public async Task<int> CreateDocumentationPageAsync(DocumentationPage page)
        {
            try
            {
                var mappingId = page.ProjModuleMappId;// await GetMappingIdAsync(projectId, moduleId);
                if (mappingId == 0)
                {
                    throw new Exception("Invalid project-module mapping");
                }

                var parameters = new []
                {
                    new SqlParameter("@ProjModuleMappId", page.ProjModuleMappId),
                    new SqlParameter("@PageName", page.PageName),
                    new SqlParameter("@Version", page.Version),
                    new SqlParameter("@BlobUrl", page.BlobUrl),
                    new SqlParameter("@CreatedBy", page.CreatedBy),
                    new SqlParameter("@PageId", SqlDbType.Int) { Direction = ParameterDirection.Output }
                };

                await _sqlHelper.ExecuteNonQuerySPAsync("sp_CreateDocumentationPage", parameters);
                return (int)parameters.First(p => p.ParameterName == "@PageId").Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating documentation page for project {ProjModuleMappId}", page.ProjModuleMappId);
                throw;
            }
        }

        public async Task UpdateDocumentationPageAsync(DocumentationPage page)
        {
            try
            {
                // Update the blob content if provided
                if (!string.IsNullOrEmpty(page.Content))
                {
                    // If we're updating content, upload to blob storage
                    byte[] byteArray = Encoding.UTF8.GetBytes(page.Content);
                    
                    // Either update existing blob or create a new one
                    if (!string.IsNullOrEmpty(page.BlobUrl))
                    {
                        await _blobStorageService.UpdateBlobContentAsync(page.BlobUrl, byteArray, "text/html");
                    }
                    else
                    {
                        var blobName = $"{page.ProjectId}/{page.ProjModuleMappId}/docs_{page.ProjModuleMappId}_{page.PageName}_{page.Version}_{Guid.NewGuid()}.html";
                        string blobUrl = await _blobStorageService.UploadFileAsync(blobName, byteArray, "text/html");
                        page.BlobUrl = blobName;
                    }
                }

                var parameters = new[]
                {
                    new SqlParameter("@PageId", page.PageId),
                    new SqlParameter("@ProjModuleMappId", page.ProjModuleMappId),
                    new SqlParameter("@PageName", page.PageName),
                    new SqlParameter("@Version", page.Version),
                    new SqlParameter("@BlobUrl", page.BlobUrl),
                    new SqlParameter("@ModifiedDate", page.ModifiedDate ?? DateTime.UtcNow)
                };

                await _sqlHelper.ExecuteNonQuerySPAsync("sp_UpdateDocumentationPage", parameters);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating documentation page {PageId}", page.PageId);
                throw;
            }
        }

        //public async Task DeleteDocumentationPageAsync(int pageId)
        //{
        //    try
        //    {
        //        var parameters = new List<SqlParameter>
        //        {
        //            new SqlParameter("@PageId", pageId)
        //        };

        //        await _sqlHelper.ExecuteNonQueryAsync("sp_DeleteDocumentationPage", parameters);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error deleting documentation page {PageId}", pageId);
        //        throw;
        //    }
        //}

        //public async Task<int> GetMappingIdAsync(int projectId, int moduleId)
        //{
        //    try
        //    {
        //        var parameters = new List<SqlParameter>
        //        {
        //            new SqlParameter("@ProjectId", projectId),
        //            new SqlParameter("@ModuleId", moduleId)
        //        };

        //        var result = await _sqlHelper.ExecuteScalarAsync<int>("sp_GetProjectModuleMappingId", parameters);
        //        return result;
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting mapping ID for project {ProjectId} and module {ModuleId}", projectId, moduleId);
        //        throw;
        //    }
        //}

        private List<DocumentationPageViewModel> MapToDocumentationPageViewModels(DataTable dataTable)
        {
            var pages = new List<DocumentationPageViewModel>();

            if (dataTable == null || dataTable.Rows.Count == 0)
            {
                return pages;
            }

            foreach (DataRow row in dataTable.Rows)
            {
                var page = new DocumentationPageViewModel
                {
                    PageId = Convert.ToInt32(row["PageId"]),
                    PageName = row["PageName"].ToString(),
                    Version = GetStringOrDefault(row, "Version", ""),
                    CreatedDate = row.Table.Columns.Contains("CreatedDate") ? 
                        Convert.ToDateTime(row["CreatedDate"]) : DateTime.MinValue,
                    ModifiedDate = GetNullableDateTime(row, "ModifiedDate"),
                    BlobUrl = GetStringOrDefault(row, "BlobUrl", ""),
                    CreatorName = row["CreatedByName"].ToString(),
                    CreatedById = GetInt32OrDefault(row, "CreatedBy")
                };

                //// Set CreatorName from the database (comes from the stored procedure as CreatorName)
                //if (row.Table.Columns.Contains("CreatorName"))
                //{
                //    page.CreatorName = row["CreatorName"].ToString();
                //    // Also set CreatedByName to the same value for consistency
                //    page.CreatedByName = row["CreatorName"].ToString();
                //}

                //// Check for optional columns
                //if (row.Table.Columns.Contains("ProjectName"))
                //{
                //    page.ProjectName = row["ProjectName"].ToString();
                //}

                //if (row.Table.Columns.Contains("ModuleName"))
                //{
                //    page.ModuleName = row["ModuleName"].ToString();
                //}

                //if (row.Table.Columns.Contains("ProjectId"))
                //{
                //    page.ProjectId = GetInt32OrDefault(row, "ProjectId");
                //}

                //if (row.Table.Columns.Contains("ModuleId"))
                //{
                //    page.ModuleId = GetInt32OrDefault(row, "ModuleId");
                //}

                //if (row.Table.Columns.Contains("ProjModuleMappId"))
                //{
                //    page.ProjModuleMappId = GetInt32OrDefault(row, "ProjModuleMappId");
                //}

                //if (row.Table.Columns.Contains("CreatedBy"))
                //{
                //    page.CreatedById = GetInt32OrDefault(row, "CreatedBy");
                //}

                pages.Add(page);
            }

            return pages;
        }
        public async Task<List<DocumentationPageViewModel>> GetDocumentationListAsync(int projectId, int moduleId)
        {
            try
            {
                var parameters = new[]
                {
                    new SqlParameter("@ProjectId", projectId),
                    new SqlParameter("@ModuleId", moduleId)
                };

                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_GetDocumentationList", parameters);
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentationPageViewModels(result.Tables[0]);
                }
                return new List<DocumentationPageViewModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documentation list for project {ProjectId} and module {ModuleId}", projectId, moduleId);
                throw;
            }
        }

        public async Task<List<DocumentationPageViewModel>> GetDocumentationListAsync()
        {
            try
            {
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_GetDocumentationList", null);
                if (result != null && result.Tables.Count > 0)
                {
                    var documents = MapToDocumentationPageViewModels(result.Tables[0]);
                    
                    // Ensure all documents have a creator name
                    //foreach (var doc in documents)
                    //{
                    //    if (string.IsNullOrEmpty(doc.CreatorName))
                    //    {
                    //        doc.CreatorName = "Unknown";
                    //    }
                    //}
                    
                    return documents;
                }
                return new List<DocumentationPageViewModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documentation list");
                throw;
            }
        }

        public async Task<string> GetDocumentContentAsync(int pageId)
        {
            try
            {
                var parameters = new SqlParameter[]
                {
                    new SqlParameter("@PageId", SqlDbType.Int) { Value = pageId }
                };

                var result = await _sqlHelper.ExecuteScalarSPAsync<object>("sp_GetDocumentBlobUrl", parameters);
                if (result == null || result == DBNull.Value)
                {
                    throw new Exception("Document not found");
                }

                string blobUrl = result.ToString();
                if (string.IsNullOrEmpty(blobUrl))
                {
                    throw new Exception("Invalid blob URL");
                }

                try
                {
                    // Download HTML content from blob storage
                    var content = await _blobStorageService.DownloadHtmlContentAsync(blobUrl, false);
                    if (string.IsNullOrEmpty(content))
                    {
                        throw new Exception("Document content is empty");
                    }
                    return content;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error downloading document from blob storage. URL: {BlobUrl}", blobUrl);
                    throw new Exception("Error accessing document storage", ex);
                }
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "Database error retrieving document for PageId: {PageId}", pageId);
                throw new Exception("Error accessing document information", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document content for PageId: {PageId}", pageId);
                throw;
            }
        }
        public List<DocumentationPage> GetDocumentationPagesByMapping(int mappingId)
        {
            try
            {
                var parameters = new[] { new SqlParameter("@MappingId", mappingId) };
                var result = _sqlHelper.ExecuteDataSetSPAsync("sp_GetDocumentationPagesByMapping", parameters).Result;
                
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentationPages(result.Tables[0]);
                }
                
                return new List<DocumentationPage>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documentation pages by mapping ID {MappingId}", mappingId);
                throw;
            }
        }

        private List<DocumentationPage> MapToDocumentationPages(DataTable dataTable)
        {
            var pages = new List<DocumentationPage>();
            if (dataTable == null || dataTable.Rows.Count == 0)
            {
                return pages;
            }

            foreach (DataRow row in dataTable.Rows)
            {
                var page = new DocumentationPage
                {
                    PageId = Convert.ToInt32(row["PageId"]),
                    ProjModuleMappId = Convert.ToInt32(row["ProjModuleMappId"]),
                    PageName = row["PageName"].ToString(),
                    Version = row["Version"].ToString(),
                    BlobUrl = row["BlobUrl"].ToString(),
                    CreatedBy = Convert.ToInt32(row["CreatedBy"]),
                    CreatedDate = Convert.ToDateTime(row["CreatedDate"])
                };

                if (row["ModifiedDate"] != DBNull.Value)
                {
                    page.ModifiedDate = Convert.ToDateTime(row["ModifiedDate"]);
                }

                if (row.Table.Columns.Contains("ProjectName"))
                {
                    page.ProjectName = row["ProjectName"].ToString();
                }

                if (row.Table.Columns.Contains("ModuleName"))
                {
                    page.ModuleName = row["ModuleName"].ToString();
                }

                if (row.Table.Columns.Contains("CreatorName"))
                {
                    page.CreatorName = row["CreatorName"].ToString();
                }

                pages.Add(page);
            }

            return pages;
        }

        public async Task<List<DocumentationPageViewModel>> GetRecentDocumentsByUserAsync(int userId)
        {
            try
            {
                var parameters = new[] { new SqlParameter("@UserId", userId) };
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_GetRecentDocumentsByUser", parameters);
                
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentationPageViewModels(result.Tables[0]);
                }
                
                return new List<DocumentationPageViewModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent documents for user {UserId}", userId);
                throw;
            }
        }

        public async Task<List<DocumentationPageViewModel>> GetModulePages(int moduleId)
        {
            try
            {
                var parameters = new[] { new SqlParameter("@ModuleId", moduleId) };
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_GetDocumentationPagesByModule", parameters);
                
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentationPageViewModels(result.Tables[0]);
                }
                
                return new List<DocumentationPageViewModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pages for module {ModuleId}", moduleId);
                throw;
            }
        }

        public async Task<List<DocumentationPageViewModel>> SearchDocumentsAsync(string searchTerm, int? projectId, int userId)
        {
            try
            {
                var parameters = new List<SqlParameter>
                {
                    new SqlParameter("@SearchTerm", searchTerm),
                    new SqlParameter("@UserId", userId)
                };
                
                if (projectId.HasValue)
                {
                    parameters.Add(new SqlParameter("@ProjectId", projectId.Value));
                }
                else
                {
                    parameters.Add(new SqlParameter("@ProjectId", DBNull.Value));
                }
                
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_SearchDocuments", parameters.ToArray());
                
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentationPageViewModels(result.Tables[0]);
                }
                
                return new List<DocumentationPageViewModel>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching documents with term '{SearchTerm}' for user {UserId}", searchTerm, userId);
                throw;
            }
        }

        public async Task RecordDocumentViewAsync(int pageId, int userId)
        {
            try
            {
                var parameters = new[]
                {
                    new SqlParameter("@PageId", pageId),
                    new SqlParameter("@UserId", userId)
                };
                
                await _sqlHelper.ExecuteNonQuerySPAsync("sp_RecordDocumentView", parameters);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording document view for page {PageId} and user {UserId}", pageId, userId);
                throw;
            }
        }

        public async Task<List<DocumentSearchResult>> SearchDocumentsAsync(string query, int userId)
        {
            try
            {
                var parameters = new List<SqlParameter>
                {
                    new SqlParameter("@SearchTerm", query),
                    new SqlParameter("@UserId", userId)
                };
                
                var result = await _sqlHelper.ExecuteDataSetSPAsync("sp_SearchAllDocuments", parameters.ToArray());
                
                if (result != null && result.Tables.Count > 0)
                {
                    return MapToDocumentSearchResults(result.Tables[0]);
                }
                
                return new List<DocumentSearchResult>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching all documents with query '{Query}' for user {UserId}", query, userId);
                throw;
            }
        }

        private List<DocumentSearchResult> MapToDocumentSearchResults(DataTable dataTable)
        {
            var results = new List<DocumentSearchResult>();
            
            foreach (DataRow row in dataTable.Rows)
            {
                var result = new DocumentSearchResult
                {
                    DocumentId = Convert.ToInt32(row["PageId"]),
                    Title = row["Title"].ToString(),
                    Snippet = $"/{row["ProjectName"]}/{row["ModuleName"]}",
                    Url = $"/Documentation/View/{row["PageId"]}",
                    Path = $"{row["ProjectName"]}/{row["ModuleName"]}",
                    ProjectName = row["ProjectName"].ToString(),
                    ModuleName = row["ModuleName"].ToString(),
                    LastModified = row["LastModified"] != DBNull.Value ? Convert.ToDateTime(row["LastModified"]) : DateTime.MinValue
                };
                
                results.Add(result);
            }
            
            return results;
        }


        private int GetInt32OrDefault(System.Data.IDataReader reader, string columnName, int defaultValue = 0)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? defaultValue : reader.GetInt32(ordinal);
        }

        private int GetInt32OrDefault(DataRow row, string columnName, int defaultValue = 0)
        {
            if (!row.Table.Columns.Contains(columnName) || row[columnName] == DBNull.Value)
            {
                return defaultValue;
            }
            return Convert.ToInt32(row[columnName]);
        }

        private string GetStringOrDefault(System.Data.IDataReader reader, string columnName, string defaultValue = "")
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? defaultValue : reader.GetString(ordinal);
        }

        private string GetStringOrDefault(DataRow row, string columnName, string defaultValue = "")
        {
            if (!row.Table.Columns.Contains(columnName) || row[columnName] == DBNull.Value)
            {
                return defaultValue;
            }
            return row[columnName].ToString();
        }

        private bool GetBooleanOrDefault(System.Data.IDataReader reader, string columnName, bool defaultValue = false)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? defaultValue : reader.GetBoolean(ordinal);
        }

        private bool GetBooleanOrDefault(DataRow row, string columnName, bool defaultValue = false)
        {
            if (!row.Table.Columns.Contains(columnName) || row[columnName] == DBNull.Value)
            {
                return defaultValue;
            }
            return Convert.ToBoolean(row[columnName]);
        }

        private DateTime? GetNullableDateTime(System.Data.IDataReader reader, string columnName)
        {
            var ordinal = reader.GetOrdinal(columnName);
            return reader.IsDBNull(ordinal) ? (DateTime?)null : reader.GetDateTime(ordinal);
        }
        
        private DateTime? GetNullableDateTime(DataRow row, string columnName)
        {
            if (!row.Table.Columns.Contains(columnName) || row[columnName] == DBNull.Value)
            {
                return null;
            }
            return Convert.ToDateTime(row[columnName]);
        }
    }
}
