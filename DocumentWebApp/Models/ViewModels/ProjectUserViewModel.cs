using System;

namespace MS_DOCS.Models.ViewModels
{
    public class ProjectUserViewModel
    {
        public int ProjectUserId { get; set; }
        public int ProjectId { get; set; }
        public string ProjectName { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string AccessLevel { get; set; }
    }
}
