using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models.ViewModels
{
    public class ProjectModuleMappingViewModel
    {
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public int ModuleId { get; set; }
        
        public bool IsActive { get; set; }
    }
}
