using System.ComponentModel.DataAnnotations;

namespace MS_DOCS.Models.ViewModels
{
    public class ModuleViewModel
    {
        public int ModuleId { get; set; }

        [Required]
        [StringLength(100)]
        public string ModuleName { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        public bool IsActive { get; set; }
    }
}
