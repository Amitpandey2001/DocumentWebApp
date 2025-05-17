using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models.ViewModels
{
    public class ProjectViewModel
    {
        public int ProjectId { get; set; }

        [Required(ErrorMessage = "Project name is required")]
        [StringLength(100, ErrorMessage = "Project name cannot be longer than 100 characters")]
        [Display(Name = "Project Name")]
        public string ProjectName { get; set; }

        [StringLength(1000, ErrorMessage = "Description cannot be longer than 1000 characters")]
        [Display(Name = "Description")]
        public string Description { get; set; }
        
        [Display(Name = "Status")]
        public bool IsActive { get; set; } = true;
    }
}
