using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models.ViewModels
{
    public class DocumentationPageViewModel
    {
        public int PageId { get; set; }

        [Required(ErrorMessage = "Page name is required")]
        [StringLength(100, ErrorMessage = "Page name cannot exceed 100 characters")]
        public string PageName { get; set; }

        [Required(ErrorMessage = "Version is required")]
        [StringLength(20, ErrorMessage = "Version cannot exceed 20 characters")]
        public string Version { get; set; }

        [Required(ErrorMessage = "Content is required")]
        public string Content { get; set; }

        public string BlobUrl { get; set; }
        public int CreatedById { get; set; }
        public string CreatorName { get; set; }
        public string ProjectName { get; set; }
        public string ModuleName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }

        // Properties for saving
        public int ProjectId { get; set; }
        public int ModuleId { get; set; }
        public int ProjModuleMappId { get; set; }
        public string? CreatedByName { get; internal set; }
    }
}
