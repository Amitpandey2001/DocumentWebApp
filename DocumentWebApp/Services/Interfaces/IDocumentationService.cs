using Microsoft.AspNetCore.Mvc;
using MS_DOCS.Models;
using MS_DOCS.Models.ViewModels;

namespace MS_DOCS.Services.Interfaces
{
    public interface IDocumentationService
    {
        Task<List<Module>> GetProjectModules(int projectID);
        List<DocumentationPageViewModel> GetDocumentationPages(int userId);
        Task<int> CreateDocumentationPageAsync(DocumentationPage page);
        Task<List<DocumentationPageViewModel>> GetDocumentationListAsync();
        Task<string> GetDocumentContentAsync(int pageId);
        Task<DocumentationPage> GetDocumentationPageByIdAsync(int pageId, int userId);
        Task UpdateDocumentationPageAsync(DocumentationPage page);
        List<DocumentationPage> GetDocumentationPagesByMapping(int mappingId);
        Task<List<DocumentationPageViewModel>> GetRecentDocumentsByUserAsync(int userId);
        Task<List<DocumentationPageViewModel>> GetModulePages(int moduleId);
        Task<List<DocumentationPageViewModel>> SearchDocumentsAsync(string searchTerm, int? projectId, int userId);
        Task<List<DocumentSearchResult>> SearchDocumentsAsync(string query, int userId);
        Task RecordDocumentViewAsync(int pageId, int userId);
    }
}
