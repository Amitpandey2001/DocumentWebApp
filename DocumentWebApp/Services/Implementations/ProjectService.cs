using MS_DOCS.Models;
using MS_DOCS.DAL.Common;
using MS_DOCS.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading;
using Microsoft.Extensions.Logging;
using MS_DOCS.Models.ViewModels;

namespace MS_DOCS.Services.Implementations
{
    public class ProjectService : IProjectService
    {
        private readonly ISQLHelper _sqlHelper;
        private readonly ILogger<ProjectService> _logger;

        public ProjectService(ISQLHelper sqlHelper, ILogger<ProjectService> logger)
        {
            _sqlHelper = sqlHelper;
            _logger = logger;
        }

        private DateTime? GetNullableDateTime(SqlDataReader reader, string columnName)
        {
            try
            {
                var ordinal = reader.GetOrdinal(columnName);
                return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                _logger.LogDebug("{ColumnName} column not found in result set", columnName);
                return null;
            }
        }

        private string GetStringOrDefault(SqlDataReader reader, string columnName, string defaultValue = "")
        {
            try
            {
                var ordinal = reader.GetOrdinal(columnName);
                return reader.IsDBNull(ordinal) ? defaultValue : reader.GetString(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                _logger.LogDebug("{ColumnName} column not found in result set", columnName);
                return defaultValue;
            }
        }

        private int GetInt32OrDefault(SqlDataReader reader, string columnName, int defaultValue = 0)
        {
            try
            {
                var ordinal = reader.GetOrdinal(columnName);
                return reader.IsDBNull(ordinal) ? defaultValue : reader.GetInt32(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                _logger.LogDebug("{ColumnName} column not found in result set", columnName);
                return defaultValue;
            }
        }

        private bool GetBooleanOrDefault(SqlDataReader reader, string columnName, bool defaultValue = false)
        {
            try
            {
                var ordinal = reader.GetOrdinal(columnName);
                return reader.IsDBNull(ordinal) ? defaultValue : reader.GetBoolean(ordinal);
            }
            catch (IndexOutOfRangeException)
            {
                _logger.LogDebug("{ColumnName} column not found in result set", columnName);
                return defaultValue;
            }
        }

        public int CreateProject(string projectName, string description, int createdBy, bool isActive = true)
        {
            var projectIdParam = new SqlParameter
            {
                ParameterName = "@ProjectId",
                SqlDbType = SqlDbType.Int,
                Direction = ParameterDirection.Output
            };

            var parameters = new[]
            {
        new SqlParameter("@ProjectName", projectName),
        new SqlParameter("@Description", description),
        new SqlParameter("@CreatedBy", createdBy),
        new SqlParameter("@IsActive", isActive),
        projectIdParam
    };
            try
            {
                _logger.LogInformation("Creating new project: {ProjectName}", projectName);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_CreateProject", parameters).Wait();
                var result = (int)projectIdParam.Value;
                _logger.LogInformation("Project created successfully with ID: {ProjectId}", result);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create project: {ProjectName}", projectName);
                throw new Exception("Failed to create project", ex);
            }
        }

        public List<Project> GetUserProjects(int userId)
        {
            var parameters = new[] { new SqlParameter("@UserId", userId) };
            try
            {
                _logger.LogInformation("Getting projects for user: {UserId}", userId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetUserProjects", parameters).Result;
                var projects = new List<Project>();

                while (reader.Read())
                {
                    var project = new Project
                    {
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    projects.Add(project);
                }
                _logger.LogInformation("Retrieved {Count} projects for user {UserId}", projects.Count, userId);
                return projects;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get projects for user: {UserId}", userId);
                throw new Exception("Failed to get user projects", ex);
            }
        }

        public List<Project> GetPublicProjects()
        {
            try
            {
                _logger.LogInformation("Getting public projects");
                // Use the existing sp_GetUserProjects stored procedure with a special userId (-1)
                // to indicate we want public projects
                var parameters = new[] { new SqlParameter("@UserId", -1) };
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetUserProjects", parameters).Result;
                var projects = new List<Project>();

                while (reader.Read())
                {
                    var project = new Project
                    {
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    projects.Add(project);
                }
                _logger.LogInformation("Retrieved {Count} public projects", projects.Count);
                return projects;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get public projects");
                // Return an empty list instead of throwing an exception for anonymous users
                return new List<Project>();
            }
        }

        public Project GetProjectById(int projectId)
        {
            var parameters = new[] { new SqlParameter("@ProjectId", projectId) };
            try
            {
                _logger.LogInformation("Getting project by ID: {ProjectId}", projectId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetProjectById", parameters).Result;

                if (reader.Read())
                {
                    var project = new Project
                    {
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    _logger.LogInformation("Retrieved project: {ProjectName}", project.ProjectName);
                    return project;
                }
                _logger.LogWarning("Project not found: {ProjectId}", projectId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get project by id: {ProjectId}", projectId);
                throw new Exception("Failed to get project by id", ex);
            }
        }

        public void UpdateProject(Project project)
        {
            var parameters = new[]
            {
                new SqlParameter("@ProjectId", project.ProjectId),
                new SqlParameter("@ProjectName", project.ProjectName),
                new SqlParameter("@Description", project.Description),
                new SqlParameter("@IsActive", project.IsActive)
            };
            try
            {
                _logger.LogInformation("Updating project: {ProjectId}", project.ProjectId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_UpdateProject", parameters).Wait();
                _logger.LogInformation("Project updated successfully: {ProjectId}", project.ProjectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update project: {ProjectId}", project.ProjectId);
                throw new Exception("Failed to update project", ex);
            }
        }

        public void DeleteProject(int projectId)
        {
            var parameters = new[] { new SqlParameter("@ProjectId", projectId) };
            try
            {
                _logger.LogInformation("Deleting project: {ProjectId}", projectId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_DeleteProject", parameters).Wait();
                _logger.LogInformation("Project deleted successfully: {ProjectId}", projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete project: {ProjectId}", projectId);
                throw new Exception("Failed to delete project", ex);
            }
        }

        public int CreateModule(string moduleName, string description, int createdBy, bool isActive = true)
        {
            var moduleIdParam = new SqlParameter
            {
                ParameterName = "@ModuleId",
                SqlDbType = SqlDbType.Int,
                Direction = ParameterDirection.Output
            };

            var parameters = new[]
            {
                 new SqlParameter("@ModuleName", moduleName),
                 new SqlParameter("@Description", description),
                 new SqlParameter("@CreatedBy", createdBy),
                 new SqlParameter("@IsActive", isActive),
                 moduleIdParam
              };
            try
            {
                _logger.LogInformation("Creating new module: {ModuleName}", moduleName);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_CreateModule", parameters).Wait();
                var result = (int)moduleIdParam.Value;
                _logger.LogInformation("Module created successfully with ID: {ModuleId}", result);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create module: {ModuleName}", moduleName);
                throw new Exception("Failed to create module", ex);
            }
        }

        public List<Module> GetUserModules(int userId)
        {
            var parameters = new[] { new SqlParameter("@UserId", userId) };
            try
            {
                _logger.LogInformation("Getting modules for user: {UserId}", userId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetUserModules", parameters).Result;
                var modules = new List<Module>();

                while (reader.Read())
                {
                    var module = new Module
                    {
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    modules.Add(module);
                }
                _logger.LogInformation("Retrieved {Count} modules for user {UserId}", modules.Count, userId);
                return modules;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get modules for user: {UserId}", userId);
                throw new Exception("Failed to get user modules", ex);
            }
        }

        public List<Module> GetAllModules()
        {
            try
            {
                _logger.LogInformation("Getting all modules");
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetAllModules").Result;
                var modules = new List<Module>();

                while (reader.Read())
                {
                    var module = new Module
                    {
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    modules.Add(module);
                }
                _logger.LogInformation("Retrieved {Count} total modules", modules.Count);
                return modules;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get all modules");
                throw new Exception("Failed to get all modules", ex);
            }
        }

        public Module GetModuleById(int moduleId)
        {
            var parameters = new[] { new SqlParameter("@ModuleId", moduleId) };
            try
            {
                _logger.LogInformation("Getting module by ID: {ModuleId}", moduleId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetModuleById", parameters).Result;

                if (reader.Read())
                {
                    var module = new Module
                    {
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    _logger.LogInformation("Retrieved module: {ModuleName}", module.ModuleName);
                    return module;
                }
                _logger.LogWarning("Module not found: {ModuleId}", moduleId);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get module by id: {ModuleId}", moduleId);
                throw new Exception("Failed to get module by id", ex);
            }
        }

        public void UpdateModule(Module module)
        {
            var parameters = new[]
            {
                new SqlParameter("@ModuleId", module.ModuleId),
                new SqlParameter("@ModuleName", module.ModuleName),
                new SqlParameter("@Description", module.Description),
                new SqlParameter("@IsActive", module.IsActive)
            };
            try
            {
                _logger.LogInformation("Updating module: {ModuleId}", module.ModuleId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_UpdateModule", parameters).Wait();
                _logger.LogInformation("Module updated successfully: {ModuleId}", module.ModuleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update module: {ModuleId}", module.ModuleId);
                throw new Exception("Failed to update module", ex);
            }
        }

        public void DeleteModule(int moduleId)
        {
            var parameters = new[] { new SqlParameter("@ModuleId", moduleId) };
            try
            {
                _logger.LogInformation("Deleting module: {ModuleId}", moduleId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_DeleteModule", parameters).Wait();
                _logger.LogInformation("Module deleted successfully: {ModuleId}", moduleId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete module: {ModuleId}", moduleId);
                throw new Exception("Failed to delete module", ex);
            }
        }

        public List<ProjectModuleMapping> GetProjectModuleMappings(int userId)
        {
            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID: {UserId}", userId);
                throw new ArgumentException("Invalid user ID", nameof(userId));
            }

            var parameters = new[] { new SqlParameter("@UserId", userId) };
            try
            {
                _logger.LogInformation("Getting project module mappings for user: {UserId}", userId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetProjectModuleMappings", parameters).Result;
                var mappings = new List<ProjectModuleMapping>();

                while (reader.Read())
                {
                    var mapping = new ProjectModuleMapping
                    {
                        ProjModuleMappId = GetInt32OrDefault(reader, "ProjModuleMappId"),
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        ModuleIsActive = GetBooleanOrDefault(reader, "ModuleIsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    mappings.Add(mapping);
                }
                _logger.LogInformation("Retrieved {Count} mappings for user {UserId}", mappings.Count, userId);
                return mappings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get project module mappings for user: {UserId}", userId);
                throw new Exception("Failed to get project module mappings", ex);
            }
        }

        public List<ProjectModuleMapping> GetProjectModuleMappingsByProject(int projectId)
        {
            if (projectId <= 0)
            {
                _logger.LogWarning("Invalid project ID: {ProjectId}", projectId);
                throw new ArgumentException("Invalid project ID", nameof(projectId));
            }

            var parameters = new[]
            {
                new SqlParameter("@ProjectId", projectId)
            };

            try
            {
                _logger.LogInformation("Getting module mappings for project: {ProjectId}", projectId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetProjectModuleMappingsByProject", parameters).Result;
                var mappings = new List<ProjectModuleMapping>();

                while (reader.Read())
                {
                    var mapping = new ProjectModuleMapping
                    {
                        ProjModuleMappId = GetInt32OrDefault(reader, "ProjModuleMappId"),
                        ProjectId = GetInt32OrDefault(reader, "ProjectId"),
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ProjectName = GetStringOrDefault(reader, "ProjectName"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        ModuleIsActive = GetBooleanOrDefault(reader, "ModuleIsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    mappings.Add(mapping);
                }
                _logger.LogInformation("Retrieved {Count} module mappings for project {ProjectId}", mappings.Count, projectId);
                return mappings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get module mappings for project: {ProjectId}", projectId);
                throw new Exception("Failed to get project module mappings by project", ex);
            }
        }
        public int CreateModuleMapping(ProjectModuleMapping mapping)
        {
            var parameters = new[]
            {
        new SqlParameter("@ProjectId", mapping.ProjectId),
        new SqlParameter("@ModuleId", mapping.ModuleId),
        new SqlParameter("@CreatedBy", mapping.CreatedBy),
        new SqlParameter("@CreatedDate", DateTime.Now),
        new SqlParameter("@IsActive", mapping.IsActive)
    };
            try
            {
                _logger.LogInformation("Creating module mapping for Project {ProjectId} and Module {ModuleId}",
                    mapping.ProjectId, mapping.ModuleId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_CreateProjectModuleMapping", parameters).Wait();

                // Since we don't have a direct way to get the ID, we'll return a success code
                _logger.LogInformation("Module mapping created successfully");
                return 1; // Success
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create module mapping for Project {ProjectId} and Module {ModuleId}",
                    mapping.ProjectId, mapping.ModuleId);
                throw new Exception("Failed to create module mapping", ex);
            }
        }

        private int GetMappingId(int projectId, int moduleId)
        {
            var parameters = new[]
            {
                new SqlParameter("@ProjectId", projectId),
                new SqlParameter("@ModuleId", moduleId)
            };

            try
            {
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetMappingId", parameters).Result;
                if (reader.Read())
                {
                    return reader.GetInt32(0);
                }
                return 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get mapping ID for Project {ProjectId} and Module {ModuleId}",
                    projectId, moduleId);
                return 0;
            }
        }

        public void DeleteModuleMapping(int mappingId, int userId)
        {
            var parameters = new[]
            {
                new SqlParameter("@MappingId", mappingId),
                new SqlParameter("@UserId", userId)
            };
            try
            {
                _logger.LogInformation("Deleting module mapping: {MappingId} by user {UserId}", mappingId, userId);
                _sqlHelper.ExecuteNonQuerySPAsync("sp_DeleteProjectModuleMapping", parameters).Wait();
                _logger.LogInformation("Module mapping deleted successfully: {MappingId}", mappingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete module mapping: {MappingId}", mappingId);
                throw new Exception("Failed to delete module mapping", ex);
            }
        }

        public bool ToggleMappingStatus(int mappingId, int userId)
        {
            if (mappingId <= 0)
            {
                _logger.LogWarning("Invalid mapping ID: {MappingId}", mappingId);
                throw new ArgumentException("Invalid mapping ID", nameof(mappingId));
            }

            if (userId <= 0)
            {
                _logger.LogWarning("Invalid user ID: {UserId}", userId);
                throw new ArgumentException("Invalid user ID", nameof(userId));
            }

            var parameters = new[]
            {
                new SqlParameter("@ProjModuleMappId", mappingId),
                new SqlParameter("@UserId", userId)
            };

            try
            {
                _logger.LogInformation("Toggling mapping status: {MappingId} by user {UserId}", mappingId, userId);
                var result = _sqlHelper.ExecuteScalarSPAsync<int>("sp_ToggleProjectModuleMappingStatus", parameters).Result;

                if (result <= 0)
                {
                    _logger.LogWarning("No mapping found or user not authorized: {MappingId}, {UserId}", mappingId, userId);
                    return false;
                }

                _logger.LogInformation("Module mapping status toggled successfully: {MappingId}", mappingId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to toggle mapping status: {MappingId}", mappingId);
                throw new Exception("Failed to toggle mapping status", ex);
            }
        }

        public List<Module> GetAvailableModules(int projectId)
        {
            var parameters = new[] { new SqlParameter("@ProjectId", projectId) };
            try
            {
                _logger.LogInformation("Getting available modules for project: {ProjectId}", projectId);
                using var reader = _sqlHelper.ExecuteReaderSPAsync("sp_GetAvailableModules", parameters).Result;
                var modules = new List<Module>();

                while (reader.Read())
                {
                    var module = new Module
                    {
                        ModuleId = GetInt32OrDefault(reader, "ModuleId"),
                        ModuleName = GetStringOrDefault(reader, "ModuleName"),
                        Description = GetStringOrDefault(reader, "Description"),
                        IsActive = GetBooleanOrDefault(reader, "IsActive", true),
                        CreatedBy = GetInt32OrDefault(reader, "CreatedBy"),
                        CreatorName = GetStringOrDefault(reader, "CreatorName"),
                        CreatedDate = reader.GetDateTime(reader.GetOrdinal("CreatedDate")),
                        ModifiedDate = GetNullableDateTime(reader, "ModifiedDate")
                    };
                    modules.Add(module);
                }
                _logger.LogInformation("Retrieved {Count} available modules for project {ProjectId}", modules.Count, projectId);
                return modules;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get available modules for project: {ProjectId}", projectId);
                throw new Exception("Failed to get available modules", ex);
            }
        }

        #region Project User Management

        public List<ProjectUserViewModel> GetProjectUsers(int projectId)
        {
            var projectUsers = new List<ProjectUserViewModel>();

            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@ProjectId", projectId)
            };

            try
            {
                using (SqlDataReader reader = _sqlHelper.ExecuteReaderSP("sp_GetProjectUsers", parameters))
                {
                    while (reader.Read())
                    {
                        projectUsers.Add(new ProjectUserViewModel
                        {
                            ProjectUserId = reader.GetInt32(reader.GetOrdinal("ProjectUserId")),
                            ProjectId = reader.GetInt32(reader.GetOrdinal("ProjectId")),
                            ProjectName = reader.GetString(reader.GetOrdinal("ProjectName")),
                            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            AccessLevel = reader.GetString(reader.GetOrdinal("AccessLevel"))
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project users for project ID: {ProjectId}", projectId);
                throw;
            }

            return projectUsers;
        }

        public List<UserViewModel> GetUsersNotInProject(int projectId)
        {
            var users = new List<UserViewModel>();

            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@ProjectId", projectId)
            };

            try
            {
                using (SqlDataReader reader = _sqlHelper.ExecuteReaderSP("sp_GetUsersNotInProject", parameters))
                {
                    while (reader.Read())
                    {
                        var user = new UserViewModel
                        {
                            UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                            Username = reader.GetString(reader.GetOrdinal("Username")),
                            Email = reader.GetString(reader.GetOrdinal("Email")),
                            IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                        };

                        // Add roles if available in the result set
                        if (!reader.IsDBNull(reader.GetOrdinal("Roles")))
                        {
                            string roles = reader.GetString(reader.GetOrdinal("Roles"));
                            if (!string.IsNullOrEmpty(roles))
                            {
                                user.Roles = roles.Split(',').ToList();
                            }
                        }

                        users.Add(user);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users not in project ID: {ProjectId}", projectId);
                throw;
            }

            return users;
        }

        public void AddUserToProject(int projectId, int userId, string accessLevel)
        {
            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@ProjectId", projectId),
                new SqlParameter("@UserId", userId),
                new SqlParameter("@AccessLevel", accessLevel)
            };

            try
            {
                _sqlHelper.ExecuteNonQuerySP("sp_AddUserToProject", parameters, true);
                _logger.LogInformation("User {UserId} added to project {ProjectId} with access level {AccessLevel}", userId, projectId, accessLevel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding user {UserId} to project {ProjectId}", userId, projectId);
                throw;
            }
        }

        public void UpdateUserProjectAccess(int projectUserId, string accessLevel)
        {
            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@ProjectUserId", projectUserId),
                new SqlParameter("@AccessLevel", accessLevel)
            };

            try
            {
                _sqlHelper.ExecuteNonQuerySP("sp_UpdateUserProjectAccess", parameters, true);
                _logger.LogInformation("Updated access level to {AccessLevel} for project user {ProjectUserId}", accessLevel, projectUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating access level for project user {ProjectUserId}", projectUserId);
                throw;
            }
        }

        public void RemoveUserFromProject(int projectUserId)
        {
            SqlParameter[] parameters = new SqlParameter[]
            {
                new SqlParameter("@ProjectUserId", projectUserId)
            };

            try
            {
                _sqlHelper.ExecuteNonQuerySP("sp_RemoveUserFromProject", parameters, true);
                _logger.LogInformation("Removed user from project, ProjectUserId: {ProjectUserId}", projectUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing user from project, ProjectUserId: {ProjectUserId}", projectUserId);
                throw;
            }
        }

        #endregion
    }
}
