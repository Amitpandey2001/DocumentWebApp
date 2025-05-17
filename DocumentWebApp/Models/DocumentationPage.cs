using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models
{
    public class DocumentationPage
    {
        public int PageId { get; set; }

        public int ProjModuleMappId { get; set; }
        
        public int ProjectId { get; set; }
        
        public int ModuleId { get; set; }

        public string PageName { get; set; }


        public string Version { get; set; }

        public string Content { get; set; }

        public string BlobUrl { get; set; }

        public int CreatedBy { get; set; }
        public string CreatorName { get; set; }
        public string ProjectName { get; set; }

        public string ModuleName { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }
    }
}