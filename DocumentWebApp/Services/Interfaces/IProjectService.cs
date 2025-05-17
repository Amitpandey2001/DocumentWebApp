using MS_DOCS.Models;
using MS_DOCS.Models.ViewModels;
using System.Collections.Generic;

namespace MS_DOCS.Services.Interfaces
{
    public interface IProjectService
    {
        // Project methods
        int CreateProject(string projectName, string description, int createdBy, bool isActive = true);
        List<Project> GetUserProjects(int userId);
        List<Project> GetPublicProjects();
        Project GetProjectById(int projectId);
        void UpdateProject(Project project);
        void DeleteProject(int projectId);

        // Module methods
        int CreateModule(string moduleName, string description, int createdBy, bool isActive = true);
        List<Module> GetUserModules(int userId);
        List<Module> GetAllModules();
        Module GetModuleById(int moduleId);
        void UpdateModule(Module module);
        void DeleteModule(int moduleId);

        // Project-Module Mapping methods
        List<ProjectModuleMapping> GetProjectModuleMappings(int userId);
        List<ProjectModuleMapping> GetProjectModuleMappingsByProject(int projectId);
        int CreateModuleMapping(ProjectModuleMapping mapping);
        void DeleteModuleMapping(int mappingId, int userId);
        bool ToggleMappingStatus(int mappingId, int userId);

        // Project User methods
        List<ProjectUserViewModel> GetProjectUsers(int projectId);
        List<UserViewModel> GetUsersNotInProject(int projectId);
        void AddUserToProject(int projectId, int userId, string accessLevel);
        void UpdateUserProjectAccess(int projectUserId, string accessLevel);
        void RemoveUserFromProject(int projectUserId);

        // Additional methods
        List<Module> GetAvailableModules(int projectId);
    }
}
