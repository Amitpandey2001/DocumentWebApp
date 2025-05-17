using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MS_DOCS.Models;
using MS_DOCS.Models.ViewModels;
using MS_DOCS.Services.Interfaces;

namespace MS_DOCS.Controllers
{
    public class ProjectController : Controller
    {
        private readonly IProjectService _projectService;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(IProjectService projectService, ILogger<ProjectController> logger)
        {
            _projectService = projectService;
            _logger = logger;
        }
        [Authorize(Policy = "RequireAdmin")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult GetProjects()
        {
            try
            {
                // Check if user is authenticated
                if (User.Identity?.IsAuthenticated == true)
                {
                    var userIdClaim = User.FindFirst("UserId");
                    if (userIdClaim != null)
                    {
                        var userId = int.Parse(userIdClaim.Value);
                        _logger.LogInformation("Getting projects for user: {UserId}", userId);

                        var projects = _projectService.GetUserProjects(userId);
                        _logger.LogInformation("Retrieved {Count} projects", projects.Count);

                        return Json(new { success = true, data = projects });
                    }
                }

                // For anonymous users or if UserId claim is missing, return public projects
                var publicProjects = _projectService.GetPublicProjects();
                _logger.LogInformation("Retrieved {Count} public projects for anonymous user", publicProjects.Count);

                return Json(new { success = true, data = publicProjects });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting projects");
                return Json(new { success = false, message = "An error occurred while retrieving projects. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult Create([FromBody] ProjectViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var userId = int.Parse(User.FindFirst("UserId").Value);
                    var projectId = _projectService.CreateProject(model.ProjectName, model.Description, userId, model.IsActive);
                    var newProject = _projectService.GetProjectById(projectId);
                    return Json(new { success = true, data = newProject });
                }

                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, message = "Validation failed", errors = errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project");
                return Json(new { success = false, message = "An error occurred while creating the project. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetProject(int id)
        {
            try
            {
                var project = _projectService.GetProjectById(id);
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found" });
                }
                return Json(new { success = true, data = project });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project by ID: {ProjectId}", id);
                return Json(new { success = false, message = "An error occurred while retrieving the project. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult ToggleStatus(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                var project = _projectService.GetProjectById(id);
                
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found" });
                }

                if (project.CreatedBy != userId && !User.IsInRole("Admin"))
                {
                    return Json(new { success = false, message = "Unauthorized to update this project" });
                }

                // Toggle the active status
                project.IsActive = !project.IsActive;
                _projectService.UpdateProject(project);
                
                return Json(new { success = true, data = project });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling project status: {ProjectId}", id);
                return Json(new { success = false, message = "An error occurred while updating the project status. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult Delete(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                var project = _projectService.GetProjectById(id);
                
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found" });
                }

                if (project.CreatedBy != userId && !User.IsInRole("Admin"))
                {
                    return Json(new { success = false, message = "Unauthorized to delete this project" });
                }

                _projectService.DeleteProject(id);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project: {ProjectId}", id);
                return Json(new { success = false, message = "An error occurred while deleting the project. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult Update([FromBody] ProjectViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var userId = int.Parse(User.FindFirst("UserId").Value);
                    var existingProject = _projectService.GetProjectById(model.ProjectId);

                    if (existingProject == null)
                    {
                        return Json(new { success = false, message = "Project not found" });
                    }

                    if (existingProject.CreatedBy != userId && !User.IsInRole("Admin"))
                    {
                        return Json(new { success = false, message = "Unauthorized to update this project" });
                    }

                    var project = new Project
                    {
                        ProjectId = model.ProjectId,
                        ProjectName = model.ProjectName,
                        Description = model.Description,
                        IsActive = model.IsActive,
                        CreatedBy = existingProject.CreatedBy,
                        CreatedDate = existingProject.CreatedDate,
                        CreatorName = existingProject.CreatorName
                    };

                    _projectService.UpdateProject(project);
                    var updatedProject = _projectService.GetProjectById(model.ProjectId);
                    return Json(new { success = true, data = updatedProject });
                }

                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, message = "Validation failed", errors = errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project: {ProjectId}", model.ProjectId);
                return Json(new { success = false, message = "An error occurred while updating the project. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetModules()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                _logger.LogInformation("Getting modules for user: {UserId}", userId);
                
                var modules = _projectService.GetUserModules(userId);
                _logger.LogInformation("Retrieved {Count} modules", modules.Count);
                
                return Json(new { success = true, data = modules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user modules");
                return Json(new { success = false, message = "An error occurred while retrieving modules. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetModule(int id)
        {
            try
            {
                var module = _projectService.GetModuleById(id);
                if (module == null)
                {
                    return Json(new { success = false, message = "Module not found" });
                }
                return Json(new { success = true, data = module });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting module by ID: {ModuleId}", id);
                return Json(new { success = false, message = "An error occurred while retrieving the module. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult CreateModule([FromBody] ModuleViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var userId = int.Parse(User.FindFirst("UserId").Value);
                    var moduleId = _projectService.CreateModule(model.ModuleName, model.Description, userId, model.IsActive);
                    var newModule = _projectService.GetModuleById(moduleId);
                    return Json(new { success = true, data = newModule });
                }

                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, message = "Validation failed", errors = errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating module");
                return Json(new { success = false, message = "An error occurred while creating the module. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult ToggleModuleStatus(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                var module = _projectService.GetModuleById(id);
                
                if (module == null)
                {
                    return Json(new { success = false, message = "Module not found" });
                }

                if (module.CreatedBy != userId && !User.IsInRole("Admin"))
                {
                    return Json(new { success = false, message = "Unauthorized to update this module" });
                }

                // Toggle the active status
                module.IsActive = !module.IsActive;
                _projectService.UpdateModule(module);
                
                return Json(new { success = true, data = module });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling module status: {ModuleId}", id);
                return Json(new { success = false, message = "An error occurred while updating the module status. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult UpdateModule([FromBody] ModuleViewModel model)
        {
            try
            {
                if (ModelState.IsValid)
                {
                    var userId = int.Parse(User.FindFirst("UserId").Value);
                    var existingModule = _projectService.GetModuleById(model.ModuleId);

                    if (existingModule == null)
                    {
                        return Json(new { success = false, message = "Module not found" });
                    }

                    if (existingModule.CreatedBy != userId && !User.IsInRole("Admin"))
                    {
                        return Json(new { success = false, message = "Unauthorized to update this module" });
                    }

                    var module = new Module
                    {
                        ModuleId = model.ModuleId,
                        ModuleName = model.ModuleName,
                        Description = model.Description,
                        IsActive = model.IsActive,
                        CreatedBy = existingModule.CreatedBy,
                        CreatedDate = existingModule.CreatedDate,
                        CreatorName = existingModule.CreatorName
                    };

                    _projectService.UpdateModule(module);
                    var updatedModule = _projectService.GetModuleById(model.ModuleId);
                    return Json(new { success = true, data = updatedModule });
                }

                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, message = "Validation failed", errors = errors });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating module: {ModuleId}", model.ModuleId);
                return Json(new { success = false, message = "An error occurred while updating the module. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetAllModules()
        {
            try
            {
                // Check if user is authenticated
                //if (User.Identity?.IsAuthenticated == true)
                //{
                //    var userIdClaim = User.FindFirst("UserId");
                //    if (userIdClaim != null)
                //    {
                //        var userId = int.Parse(userIdClaim.Value);
                //        _logger.LogInformation("Getting all modules for user: {UserId}", userId);

                //        var modules = _projectService.GetUserModules(userId);
                //        _logger.LogInformation("Retrieved {Count} modules", modules.Count);

                //        return Json(new { success = true, data = modules });
                //    }
                //}

                // For anonymous users or if UserId claim is missing, return all public modules
                var publicModules = _projectService.GetAllModules();
                _logger.LogInformation("Retrieved {Count} public modules for anonymous user", publicModules.Count);

                return Json(new { success = true, data = publicModules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting modules");
                return Json(new { success = false, message = "An error occurred while retrieving modules. Please try again later." });
            }
        }
        [HttpGet]
        public IActionResult GetActiveProjects()
        {
            try
            {
                // Check if user is authenticated
                if (User.Identity.IsAuthenticated)
                {
                    var userIdClaim = User.FindFirst("UserId");
                    if (userIdClaim != null)
                    {
                        var userId = int.Parse(userIdClaim.Value);
                        var projects = _projectService.GetUserProjects(userId)
                            .Where(p => p.IsActive)
                            .ToList();
                        
                        return Json(new { success = true, data = projects });
                    }
                }
                
                // For anonymous users or if UserId claim is missing, return public projects
                var publicProjects = _projectService.GetPublicProjects()
                    .Where(p => p.IsActive)
                    .ToList();
                
                return Json(new { success = true, data = publicProjects });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active projects");
                return Json(new { success = false, message = "An error occurred while retrieving active projects. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetProjectModuleMappings()
        {
            try
            {
                if (!User.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("Unauthorized access attempt to get project module mappings");
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                {
                    _logger.LogWarning("Invalid user ID from claims");
                    return Json(new { success = false, message = "Invalid user session" });
                }

                _logger.LogInformation("Getting project module mappings for user: {UserId}", userId);
                var mappings = _projectService.GetProjectModuleMappings(userId);
                _logger.LogInformation("Retrieved {Count} project module mappings", mappings.Count);
                
                return Json(new { success = true, data = mappings });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to project module mappings");
                return Json(new { success = false, message = "Unauthorized access" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument when getting project module mappings");
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project module mappings");
                return Json(new { success = false, message = "An error occurred while retrieving project module mappings. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetProjectModuleMappingsByProject(int projectId)
        {
            try
            {
                if (!User.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("Unauthorized access attempt to get project module mappings");
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                {
                    _logger.LogWarning("Invalid user ID from claims");
                    return Json(new { success = false, message = "Invalid user session" });
                }

                if (projectId <= 0)
                {
                    _logger.LogWarning("Invalid project ID: {ProjectId}", projectId);
                    return Json(new { success = false, message = "Invalid project ID" });
                }

                var mappings = _projectService.GetProjectModuleMappingsByProject(projectId);
                _logger.LogInformation("Retrieved {Count} module mappings for project {ProjectId}", mappings.Count, projectId);
                
                return Json(new { success = true, data = mappings });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Unauthorized access to project {ProjectId} module mappings", projectId);
                return Json(new { success = false, message = "Unauthorized access" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument when getting project {ProjectId} module mappings", projectId);
                return Json(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting module mappings for project {ProjectId}", projectId);
                return Json(new { success = false, message = "An error occurred while retrieving project module mappings. Please try again later." });
            }
        }

        [HttpGet]
        public IActionResult GetAvailableModules(int projectId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                
                // Get all active modules
                var allModules = _projectService.GetAllModules()
                    .Where(m => m.IsActive)
                    .ToList();
                
                // Get modules already mapped to this project
                var mappedModules = _projectService.GetProjectModuleMappingsByProject(projectId)
                    .Where(m => m.IsActive)
                    .Select(m => m.ModuleId)
                    .ToList();
                
                // Filter out modules that are already mapped to this project
                var availableModules = allModules
                    .Where(m => !mappedModules.Contains(m.ModuleId))
                    .ToList();
                
                return Json(new { success = true, data = availableModules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available modules for project: {ProjectId}", projectId);
                return Json(new { success = false, message = "An error occurred while retrieving available modules. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult CreateModuleMapping([FromBody] ProjectModuleMappingViewModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Invalid input data" });
                }

                var userId = int.Parse(User.FindFirst("UserId").Value);
                
                var mapping = new ProjectModuleMapping
                {
                    ProjectId = model.ProjectId,
                    ModuleId = model.ModuleId,
                    IsActive = model.IsActive,
                    CreatedBy = userId,
                    CreatedDate = DateTime.Now
                };

                _projectService.CreateModuleMapping(mapping);
                
                return Json(new { success = true, data = mapping });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating module mapping");
                return Json(new { success = false, message = "An error occurred while creating the module mapping. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult DeleteModuleMapping(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId").Value);
                _projectService.DeleteModuleMapping(id, userId);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting module mapping");
                return Json(new { success = false, message = "An error occurred while deleting the module mapping. Please try again later." });
            }
        }

        [HttpPost]
        public IActionResult ToggleMappingStatus(int id)
        {
            try
            {
                if (id <= 0)
                {
                    _logger.LogWarning("Invalid mapping ID provided: {Id}", id);
                    return Json(new { success = false, message = "Invalid mapping ID" });
                }

                var userId = int.Parse(User.FindFirst("UserId").Value);
                var result = _projectService.ToggleMappingStatus(id, userId);
                
                if (!result)
                {
                    _logger.LogWarning("Failed to toggle mapping status: {Id}", id);
                    return Json(new { success = false, message = "Failed to update mapping status" });
                }

                _logger.LogInformation("Successfully toggled mapping status: {Id}", id);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error toggling mapping status for ID: {Id}", id);
                return Json(new { success = false, message = "An error occurred while updating the mapping status. Please try again later." });
            }
        }
        [HttpGet]
        public IActionResult GetProjectModules(int projectId)
        {
            try
            {
                var userIdClaim = User.FindFirst("UserId");
                if (userIdClaim == null)
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }
                
                var userId = int.Parse(userIdClaim.Value);
                _logger.LogInformation("Getting modules for project: {ProjectId}", projectId);

                var mappings = _projectService.GetProjectModuleMappingsByProject(projectId);
                var modules = new List<Module>();

                foreach (var mapping in mappings)
                {
                    var module = _projectService.GetModuleById(mapping.ModuleId);
                    if (module != null)
                    {
                        modules.Add(module);
                    }
                }

                _logger.LogInformation("Retrieved {Count} modules for project {ProjectId}", modules.Count, projectId);

                return Json(new { success = true, data = modules });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project modules");
                return Json(new { success = false, message = "An error occurred while retrieving project modules. Please try again later." });
            }
        }
        #region Project User Management

        [HttpGet]
        //[Authorize(Roles = "Admin")]
        public IActionResult ManageUsers(int projectId)
        {
            try
            {
                var project = _projectService.GetProjectById(projectId);
                if (project == null)
                {
                    _logger.LogWarning("Project not found for ID: {ProjectId}", projectId);
                    return NotFound();
                }
                
                ViewBag.ProjectId = projectId;
                ViewBag.ProjectName = project.ProjectName ?? "Unknown Project";
                return View();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading project users management page for project ID: {ProjectId}", projectId);
                return RedirectToAction("Index", "Project");
            }
        }

        [HttpGet]
        //[Authorize(Roles = "Admin")]
        public IActionResult GetProjectUsers(int projectId)
        {
            try
            {
                var projectUsers = _projectService.GetProjectUsers(projectId);
                return Json(new { success = true, data = projectUsers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users for project ID: {ProjectId}", projectId);
                return Json(new { success = false, message = "An error occurred while retrieving project users. Please try again later." });
            }
        }

        [HttpGet]
       // [Authorize(Roles = "Admin")]
        public IActionResult GetAvailableUsers(int projectId)
        {
            try
            {
                var users = _projectService.GetUsersNotInProject(projectId);
                return Json(new { success = true, data = users });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available users for project ID: {ProjectId}", projectId);
                return Json(new { success = false, message = "An error occurred while retrieving available users. Please try again later." });
            }
        }

        [HttpPost]
        //[Authorize(Roles = "Admin")]
        public IActionResult AddUserToProject([FromBody] ProjectUserViewModel model)
        {
            try
            {
                _projectService.AddUserToProject(model.ProjectId, model.UserId, model.AccessLevel);
                var projectUsers = _projectService.GetProjectUsers(model.ProjectId);
                return Json(new { success = true, data = projectUsers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding user to project");
                return Json(new { success = false, message = "An error occurred while adding the user to the project. Please try again later." });
            }
        }

        [HttpPost]
       // [Authorize(Roles = "Admin")]
        public IActionResult UpdateUserAccess([FromBody] ProjectUserViewModel model)
        {
            try
            {
                _projectService.UpdateUserProjectAccess(model.ProjectUserId, model.AccessLevel);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user access");
                return Json(new { success = false, message = "An error occurred while updating user access. Please try again later." });
            }
        }

        [HttpPost]
        //[Authorize(Roles = "Admin")]
        public IActionResult RemoveUserFromProject(int projectUserId)
        {
            try
            {
                _projectService.RemoveUserFromProject(projectUserId);
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from project");
                return Json(new { success = false, message = "An error occurred while removing the user from the project. Please try again later." });
            }
        }

        #endregion
    }
}
