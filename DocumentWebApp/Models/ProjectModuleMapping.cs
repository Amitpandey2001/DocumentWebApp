using System;
using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models
{
    public class ProjectModuleMapping
    {
        public int ProjModuleMappId { get; set; }
        public int ProjectId { get; set; }
        public int ModuleId { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public string CreatorName { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? ModifiedDate { get; set; }

        // Display properties
        public string ProjectName { get; set; }
        public string ModuleName { get; set; }
        public string Description { get; set; }
        public bool ModuleIsActive { get; set; }
    }
}
