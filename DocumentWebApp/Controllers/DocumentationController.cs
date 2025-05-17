using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MS_DOCS.Models;
using MS_DOCS.Services.Interfaces;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;

namespace MS_DOCS.Controllers
{
    // [Authorize(Roles = "Admin,Editor")]
    public class DocumentationController : Controller
    {
        private readonly IDocumentationService _documentationService;
        private readonly IProjectService _projectService;
        private readonly IBlobStorageService _blobStorageService;
        private readonly IUserService _userService;
        private readonly ILogger<DocumentationController> _logger;
        private readonly IErrorLoggingService _errorLoggingService;

        public DocumentationController(
            IDocumentationService documentationService,
            IProjectService projectService,
            IBlobStorageService blobStorageService,
            IUserService userService,
            ILogger<DocumentationController> logger,
            IErrorLoggingService errorLoggingService)
        {
            _documentationService = documentationService;
            _projectService = projectService;
            _blobStorageService = blobStorageService;
            _userService = userService;
            _logger = logger;
            _errorLoggingService = errorLoggingService;
        }

        private User GetCurrentUser()
        {
            // Ensure the user is authenticated before trying to get user info
            if (!User.Identity.IsAuthenticated)
            {
                throw new UnauthorizedAccessException("User not authenticated");
            }
            
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            if (string.IsNullOrEmpty(userEmail))
            {
                throw new UnauthorizedAccessException("User email not found in claims");
            }

            var user = _userService.GetUserByEmail(userEmail);
            if (user == null)
            {
                throw new UnauthorizedAccessException("User not found");
            }

            return user;
        }

        private string PreserveMermaidFormatting(string content)
        {
            if (string.IsNullOrEmpty(content))
                return content;

            try
            {
                // Use a regular expression to find all Mermaid blocks in the HTML content  
                // This regex looks for <pre class="mermaid"> or <div class="mermaid"> elements and their content  
                var mermaidRegex = new Regex(@"<(pre|div)[^>]*class=([""'])(?: *[^""']*\s)?mermaid(?:\s[^""']*)?\2[^>]*>([\s\S]*?)<\/\1>", RegexOptions.IgnoreCase);

                // Process each Mermaid block to ensure proper formatting  
                return mermaidRegex.Replace(content, match =>
                {
                    var tagName = match.Groups[1].Value; // pre or div  
                    var quoteType = match.Groups[2].Value; // ' or "  
                    var mermaidContent = match.Groups[3].Value; // The content inside the pre/div tag  

                    // Log for debugging  
                    _logger.LogInformation("Found Mermaid content: {Content}", mermaidContent.Substring(0, Math.Min(100, mermaidContent.Length)));

                    // Clean up any HTML entities that might have been added  
                    mermaidContent = HttpUtility.HtmlDecode(mermaidContent);

                    // Trim whitespace at the beginning and end to prevent syntax errors  
                    mermaidContent = mermaidContent.Trim();

                    // Store the original code in a data attribute for better copy functionality  
                    // Escape any quotes in the content to prevent HTML attribute issues  
                    var escapedContent = mermaidContent.Replace("\"", "&quot;");

                    // Ensure the content is properly formatted as a pre.mermaid element  
                    // This ensures consistent handling across the application  
                    return $"<pre class={quoteType}mermaid{quoteType} data-original-code=\"{escapedContent}\">{mermaidContent}</pre>";
                });
            }
            catch (Exception ex)
            {
                // Log the error but don't throw it - we want to continue even if formatting fails  
                _logger.LogError(ex, "Error preserving Mermaid formatting");
                return content;
            }
        }

        [HttpGet]
        [Authorize(Policy = "RequireEditor")]
        public IActionResult Index()
        {
            try
            {
                // For anonymous users, we don't need to get the current user
                if (User.Identity.IsAuthenticated)
                {
                    var user = GetCurrentUser();
                }
                return View();
            }
            catch (UnauthorizedAccessException)
            {
                return RedirectToAction("Login", "Auth");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error accessing Documentation Index");
                return RedirectToAction("Login", "Auth");
            }
        }
        [HttpGet]

        public async Task<IActionResult> GetDocumentationList()
        {
            try
            {
                // Only verify authentication if user is logged in
                if (User.Identity.IsAuthenticated)
                {
                    GetCurrentUser();
                }
                
                var documents = await _documentationService.GetDocumentationListAsync();

                // Use camelCase serialization to match JavaScript naming conventions
                return Json(new { success = true, data = documents }, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.GetDocumentationList",
                    $"Unauthorized access attempt"
                );
                return Json(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.GetDocumentationList",
                    $"User: {User.Identity?.Name ?? "Anonymous"}"
                );
                return Json(new { success = false, message = "Error retrieving documentation list. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetProjectModules(int projectID)
        {
            try
            {
                // Only verify authentication if user is logged in
                if (User.Identity.IsAuthenticated)
                {
                    GetCurrentUser();
                }
                
                var modules = await _documentationService.GetProjectModules(projectID);
                return Json(new { success = true, data = modules });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project modules for project {ProjectId}", projectID);
                return Json(new { success = false, message = "Error getting project modules. Please try again later." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> SaveDocumentation(int projectId, int moduleId, string documentName, string documentContent, string version)
        {
            try
            {
                var user = GetCurrentUser();

                if (string.IsNullOrEmpty(documentContent))
                {
                    return Json(new { success = false, message = "Document content cannot be empty" });
                }

                // Process the document content to preserve Mermaid formatting
              //  documentContent = PreserveMermaidFormatting(documentContent);

                var page = new DocumentationPage
                {
                    ProjModuleMappId = moduleId,
                    PageName = documentName,
                    Content = documentContent,
                    Version = version,
                    CreatedBy = user.UserId,
                    CreatedDate = DateTime.UtcNow
                };

                // Upload content to blob storage
                byte[] byteArray = Encoding.UTF8.GetBytes(documentContent);
                string docName = documentName.Replace(" ", "_");
                var blobName = $"{projectId}/{moduleId}/docs_{moduleId}_{docName}_{version}_{Guid.NewGuid()}.html";

                string blobUrl = await _blobStorageService.UploadFileAsync(blobName, byteArray, "text/html");
                page.BlobUrl = blobName;
                // Save to database
                var pageId = await _documentationService.CreateDocumentationPageAsync(page);

                return Json(new { success = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.CreateDocumentationPage",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, Title: {documentName}"
                );
                return Json(new { success = false, message = "Error creating documentation page. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDocumentContent(int pageId)
        {
            try
            {
                GetCurrentUser(); // Verify user is authenticated
                var content = await _documentationService.GetDocumentContentAsync(pageId);
                return Content(content, "text/html");
            }
            catch (UnauthorizedAccessException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.GetDocumentContent",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, PageId: {pageId}"
                );
                return Json(new { success = false, message = "Error retrieving document content. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetDocumentationPageById(int pageId)
        {
            try
            {
                var user = GetCurrentUser(); // Verify user is authenticated
                var page = await _documentationService.GetDocumentationPageByIdAsync(pageId, user.UserId);

                if (page == null)
                {
                    return Json(new { success = false, message = "Documentation page not found" });
                }

                return Json(new { success = true, data = page });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.GetDocumentationPageById",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, PageId: {pageId}"
                );
                return Json(new { success = false, message = "Error retrieving documentation page. Please try again later." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateDocumentation(int pageId, int projectId, int moduleId, string documentName, string documentContent, string version)
        {
            try
            {
                var user = GetCurrentUser();

                if (string.IsNullOrEmpty(documentContent))
                {
                    return Json(new { success = false, message = "Document content cannot be empty" });
                }

                // Process the document content to preserve Mermaid formatting
             //   documentContent = PreserveMermaidFormatting(documentContent);

                // First get the existing page
                var existingPage = await _documentationService.GetDocumentationPageByIdAsync(pageId,user.UserId);
                if (existingPage == null)
                {
                    return Json(new { success = false, message = "Documentation page not found" });
                }

                // Update the page properties
                existingPage.ProjModuleMappId = moduleId;
                existingPage.PageName = documentName;
                existingPage.Content = documentContent;
                existingPage.Version = version;
                existingPage.ModifiedDate = DateTime.UtcNow;

                // Update in database and blob storage
                await _documentationService.UpdateDocumentationPageAsync(existingPage);

                return Json(new { success = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.UpdateDocumentationPage",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, PageId: {pageId}"
                );
                return Json(new { success = false, message = "Error updating documentation page. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetModulePages(int moduleId, int? projectId = null)
        {
            try
            {
                // If projectId is provided, check if the module belongs to the project
                if (projectId.HasValue)
                {
                    // Get the mapping ID for this project-module combination
                    var mappings = _projectService.GetProjectModuleMappingsByProject(projectId.Value);
                    var mapping = mappings.FirstOrDefault(m => m.ModuleId == moduleId);

                    if (mapping == null)
                    {
                        return Json(new { success = false, message = "Project-module mapping not found" });
                    }

                    var pages = _documentationService.GetDocumentationPagesByMapping(mapping.ProjModuleMappId);
                  
                    return Json(new { success = true, data = pages });
                }
                // Otherwise, get pages directly by moduleId
                else
                {
                    var pages = await _documentationService.GetModulePages(moduleId);
                    return Json(new { success = true, data = pages });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access when getting module pages for module {ModuleId}", moduleId);
                return Json(new { success = false, message = "Unauthorized access" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting module pages for module {ModuleId}", moduleId);
                return Json(new { success = false, message = "Error getting module pages. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetRecentDocuments()
        {
            try
            {
                var user = GetCurrentUser();
                // Get the most recent documents viewed by the user
                var recentDocuments = await _documentationService.GetRecentDocumentsByUserAsync(user.UserId);
                return Json(new { success = true, data = recentDocuments });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access when getting recent documents");
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.GetRecentDocuments",
                    $"User: {User.Identity?.Name ?? "Anonymous"}"
                );
                return Json(new { success = false, message = "Error getting recent documents. Please try again later." });
            }
        }

        [HttpGet]
        public async Task<IActionResult> SearchDocuments(string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return Json(new { success = true, data = new List<DocumentSearchResult>() });
                }

                // For authenticated users, we can personalize results
                if (User.Identity.IsAuthenticated)
                {
                    var user = GetCurrentUser();
                    var results = await _documentationService.SearchDocumentsAsync(query, user.UserId);
                    return Json(new { success = true, data = results });
                }
                else
                {
                    // For anonymous users, we'll use a default userId (e.g., -1)
                    var results = await _documentationService.SearchDocumentsAsync(query, -1);
                    return Json(new { success = true, data = results });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access when searching documents with query '{Query}'", query);
                return Json(new { success = false, message = "You are not authorized to perform this action." });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.SearchDocuments",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, Query: {query}"
                );
                return Json(new { success = false, message = "Error searching documents. Please try again later." });
            }
        }

        [HttpGet]
        [Authorize(Policy = "RequireViewer")]
        public async Task<IActionResult> View(int id)
        {
            try
            {
                if (User.Identity.IsAuthenticated)
                {
                    try
                    {
                        var user = GetCurrentUser();
                        var result = await _documentationService.GetDocumentationPageByIdAsync(id, user.UserId);
                        if (result == null)
                        {
                            return NotFound();
                        }
                        await _documentationService.RecordDocumentViewAsync(id, user.UserId);
                        string html = result.Content;
                         //html = PreserveMermaidFormatting(html);
                        result.Content = html;
                        var page = result;
                        return View(page);
                    }
                    catch (UnauthorizedAccessException ex)
                    {
                        // Log the error but don't redirect - allow anonymous viewing
                        _logger.LogWarning(ex, "Unauthorized user attempted to view document {DocumentId}", id);
                        return RedirectToAction("/Auth/Login");
                    }
                    
                }
                else
                {
                    return RedirectToAction("/Auth/Login");
                }                
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.View",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, PageId: {id}"
                );
                return RedirectToAction("Error", "Home");
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireEditor")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return Json(new { success = false, message = "No file uploaded" });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/jpg" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return Json(new { success = false, message = "Only image files (JPG, PNG, GIF) are allowed" });
                }

                // Validate file size (max 5MB)
                if (file.Length > 5 * 1024 * 1024)
                {
                    return Json(new { success = false, message = "File size must be less than 5MB" });
                }

                // Get current user
                var user = GetCurrentUser();

                // Generate a unique filename
                var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                
                // Define the path for storing the image
                var containerName = "documentation-images";
                var filePath = $"{containerName}/{user.UserId}/{fileName}";

                // Upload the file to blob storage
                using (var stream = file.OpenReadStream())
                {
                    //await _blobStorageService.UploadFileAsync(containerName, fileName, stream, file.ContentType);
                }

                // Generate thumbnail URL (you may need to implement this based on your storage setup)
                var thumbnailUrl = "";// await _blobStorageService.GetFileUrlAsync(containerName, fileName);

                return Json(new 
                { 
                    success = true, 
                    filePath = filePath,
                    fileName = fileName,
                    thumbnailUrl = thumbnailUrl
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access when uploading image");
                return Json(new { success = false, message = "You are not authorized to upload images" });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.UploadImage",
                    $"User: {User.Identity?.Name ?? "Anonymous"}"                    
                );
                return Json(new { success = false, message = "Error uploading image. Please try again later." });
            }
        }

        [HttpPost]
        [Authorize(Policy = "RequireEditor")]
        public async Task<IActionResult> DeleteImage(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath))
                {
                    return Json(new { success = false, message = "No file path provided" });
                }

                // Parse the file path to get container and file name
                var pathParts = filePath.Split('/');
                if (pathParts.Length < 3)
                {
                    return Json(new { success = false, message = "Invalid file path format" });
                }

                var containerName = pathParts[0];
                var fileName = pathParts[2]; // Skip the user ID part

                // Delete the file from blob storage
              //  await _blobStorageService.DeleteFileAsync(containerName, fileName);

                return Json(new { success = true });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Unauthorized access when deleting image");
                return Json(new { success = false, message = "You are not authorized to delete images" });
            }
            catch (Exception ex)
            {
                await _errorLoggingService.LogErrorAsync(
                    ex,
                    "DocumentationController.DeleteImage",
                    $"User: {User.Identity?.Name ?? "Anonymous"}, FilePath: {filePath}"
                );
                return Json(new { success = false, message = "Error deleting image. Please try again later." });
            }
        }
    }
}
