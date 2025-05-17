-- Get user by email with roles
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @Email VARCHAR(100)
AS
BEGIN
    SELECT 
        u.UserId,
        u.Username,
        u.Email,
        u.PasswordHash,
        u.IsActive,
        r.RoleId,
        r.RoleName
    FROM Users u
    LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.RoleId
    WHERE u.Email = @Email;
END;
GO

-- Create new user
CREATE OR ALTER PROCEDURE sp_CreateUser
    @Username VARCHAR(100),
    @Email VARCHAR(100),
    @PasswordHash VARCHAR(MAX),
    @IsActive BIT,
    @UserId INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check if user already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            RAISERROR('User with this email already exists', 16, 1);
            RETURN;
        END

        -- Insert user
        INSERT INTO Users (Username, Email, PasswordHash, CreatedDate, IsActive)
        VALUES (@Username, @Email, @PasswordHash, GETDATE(), ISNULL(@IsActive, 1));

        SET @UserId = SCOPE_IDENTITY();

        -- Assign default Viewer role
        DECLARE @ViewerRoleId INT;
        SELECT @ViewerRoleId = RoleId FROM Roles WHERE RoleName = 'Viewer';

        INSERT INTO UserRoles (UserId, RoleId)
        VALUES (@UserId, @ViewerRoleId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get user roles
CREATE OR ALTER PROCEDURE sp_GetUserRoles
    @UserId INT
AS
BEGIN
    SELECT r.RoleName
    FROM UserRoles ur
    JOIN Roles r ON ur.RoleId = r.RoleId
    WHERE ur.UserId = @UserId;
END;
GO

-- Create new project
CREATE OR ALTER PROCEDURE sp_CreateProject
    @ProjectName VARCHAR(100),
    @Description VARCHAR(MAX),
    @CreatedBy INT,
    @IsActive BIT,
    @ProjectId INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO Projects (ProjectName, Description, CreatedBy, CreatedDate, IsActive)
        VALUES (@ProjectName, @Description, @CreatedBy, GETDATE(), ISNULL(@IsActive, 1));

        SET @ProjectId = SCOPE_IDENTITY();

        -- Add creator as project admin
        INSERT INTO ProjectUsers (ProjectId, UserId, AccessLevel)
        VALUES (@ProjectId, @CreatedBy, 'Admin');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get user's projects
CREATE OR ALTER PROCEDURE sp_GetUserProjects
    @UserId INT
AS
BEGIN
    SELECT 
        p.ProjectId,
        p.ProjectName,
        p.Description,
        p.CreatedBy,
        u.Username as CreatorName,
        p.CreatedDate,
        pu.AccessLevel,
        ISNULL(p.IsActive, 0) as IsActive
    FROM Projects p
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId
    INNER JOIN Users u ON p.CreatedBy = u.UserId
    WHERE pu.UserId = @UserId
    ORDER BY p.CreatedDate DESC;
END;
GO

-- Get project by ID
CREATE OR ALTER PROCEDURE sp_GetProjectById
    @ProjectId INT
AS
BEGIN
    SELECT 
        p.ProjectId,
        p.ProjectName,
        p.Description,
        p.CreatedBy,
        u.Username as CreatorName,
        p.CreatedDate,
        pu.AccessLevel,
        ISNULL(p.IsActive, 0) as IsActive
    FROM Projects p
    INNER JOIN Users u ON p.CreatedBy = u.UserId
    LEFT JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId AND pu.UserId = p.CreatedBy
    WHERE p.ProjectId = @ProjectId;
END;
GO

-- Update project
CREATE OR ALTER PROCEDURE sp_UpdateProject
    @ProjectId INT,
    @ProjectName VARCHAR(100),
    @Description VARCHAR(MAX),
    @IsActive BIT
AS
BEGIN
    BEGIN TRY
        -- Check if project exists
        IF NOT EXISTS (SELECT 1 FROM Projects WHERE ProjectId = @ProjectId)
        BEGIN
            RAISERROR('Project not found', 16, 1);
            RETURN;
        END

        -- Update existing project
        UPDATE Projects 
        SET ProjectName = @ProjectName,
            Description = @Description,
            IsActive = ISNULL(@IsActive, IsActive) -- Keep existing value if NULL
        WHERE ProjectId = @ProjectId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Delete project
CREATE OR ALTER PROCEDURE sp_DeleteProject
    @ProjectId INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
            -- Delete project users first (due to foreign key constraint)
            DELETE FROM ProjectUsers WHERE ProjectId = @ProjectId;
            
            -- Delete the project
            --DELETE FROM Projects WHERE ProjectId = @ProjectId;
			update Projects set IsActive=0 WHERE ProjectId = @ProjectId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get All Modules with Creator Info
CREATE OR ALTER PROCEDURE sp_GetAllModulesWithCreator
AS
BEGIN
    SELECT 
        m.*,
        u.UserName AS CreatorName
    FROM 
        Modules m
        LEFT JOIN Users u ON m.CreatedBy = u.UserId
    ORDER BY 
        m.ModuleName;
END
GO

-- Get Project Module Mappings By Project
CREATE OR ALTER PROCEDURE sp_GetProjectModuleMappingsByProject
    @ProjectId INT,
    @UserId INT
AS
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM ProjectUsers 
        WHERE ProjectId = @ProjectId 
        AND UserId = @UserId
    )
    BEGIN
        RAISERROR('User not authorized to view this project''s mappings.', 16, 1);
        RETURN;
    END

    SELECT 
        pmm.ProjModuleMappId,
        pmm.ProjectId,
        p.ProjectName,
        pmm.ModuleId,
        m.ModuleName,
        m.Description,
        pmm.CreatedDate,
        pmm.ModifiedDate,
        ISNULL(pmm.IsActive, 0) as IsActive,
        ISNULL(m.IsActive, 0) as ModuleIsActive,
        pmm.CreatedBy,
        u.Name as CreatorName
    FROM ProjectModuleMapping pmm
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON pmm.CreatedBy = u.UserId
    WHERE pmm.ProjectId = @ProjectId
    ORDER BY m.ModuleName;
END;
GO

-- Get all modules for module master
CREATE OR ALTER PROCEDURE sp_GetAllModulesForModuleMaster
AS
BEGIN
    SELECT 
        m.ModuleId,
        m.ModuleName,
        m.Description,
        m.CreatedBy,
        u.Username as CreatorName,
        m.CreatedDate,
        m.ModifiedDate,
        ISNULL(m.IsActive, 0) as IsActive
    FROM Modules m
    INNER JOIN Users u ON m.CreatedBy = u.UserId
    ORDER BY m.ModuleName;
END;
GO

-- Create new module
CREATE OR ALTER PROCEDURE sp_CreateModule
    @ModuleName VARCHAR(100),
    @Description VARCHAR(500),
    @CreatedBy INT,
    @IsActive BIT,
    @ModuleId INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT INTO Modules (ModuleName, Description, CreatedBy, CreatedDate, ModifiedDate, IsActive)
        VALUES (@ModuleName, @Description, @CreatedBy, GETDATE(), GETDATE(), ISNULL(@IsActive, 1));

        SET @ModuleId = SCOPE_IDENTITY();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get project module mappings
CREATE OR ALTER PROCEDURE sp_GetProjectModuleMappings
    @UserId INT
AS
BEGIN
    SELECT 
        pmm.ProjModuleMappId,
        pmm.ProjectId,
        p.ProjectName,
        pmm.ModuleId,
        m.ModuleName,
        m.Description,
        pmm.CreatedDate,
        pmm.ModifiedDate,
        ISNULL(pmm.IsActive, 0) as IsActive,
        ISNULL(m.IsActive, 0) as ModuleIsActive,
        pmm.CreatedBy,
        u.Name as CreatorName
    FROM ProjectModuleMapping pmm
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId
    INNER JOIN Users u ON pmm.CreatedBy = u.UserId
    WHERE pu.UserId = @UserId
    ORDER BY p.ProjectName, m.ModuleName;
END;
GO

-- Get project module mappings for a user
CREATE OR ALTER PROCEDURE sp_GetProjectModuleMappingsForUser
    @UserId INT
AS
BEGIN
    SELECT 
        pmm.ProjModuleMappId,
        pmm.ProjectId,
        p.ProjectName,
        pmm.ModuleId,
        m.ModuleName,
        m.Description,
        pmm.CreatedDate,
        pmm.ModifiedDate,
        ISNULL(pmm.IsActive, 0) as IsActive,
        ISNULL(m.IsActive, 0) as ModuleIsActive,
        pmm.CreatedBy,
        u.Name as CreatorName
    FROM ProjectModuleMapping pmm
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId
    INNER JOIN Users u ON pmm.CreatedBy = u.UserId
    WHERE pu.UserId = @UserId
    ORDER BY pmm.CreatedDate DESC;
END;
GO

-- Create project module mapping
CREATE OR ALTER PROCEDURE sp_CreateProjectModuleMapping
    @ProjectId INT,
    @ModuleId INT,
    @CreatedBy INT,
    @CreatedDate DATETIME,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if mapping already exists
    IF EXISTS (
        SELECT 1 
        FROM ProjectModuleMapping 
        WHERE ProjectId = @ProjectId 
        AND ModuleId = @ModuleId
    )
    BEGIN
        RAISERROR('A mapping for this project and module already exists.', 16, 1);
        RETURN;
    END
    
    INSERT INTO ProjectModuleMapping (
        ProjectId,
        ModuleId,
        CreatedBy,
        CreatedDate,
        IsActive
    )
    VALUES (
        @ProjectId,
        @ModuleId,
        @CreatedBy,
        @CreatedDate,
        @IsActive
    );
END
GO

-- Update project module mapping
CREATE OR ALTER PROCEDURE sp_UpdateProjectModuleMapping
    @MappingId INT,
    @IsActive BIT,
    @ModifiedBy INT,
    @ModifiedDate DATETIME
AS
BEGIN
    BEGIN TRY
        -- Check if mapping exists
        IF NOT EXISTS (SELECT 1 FROM ProjectModuleMapping WHERE ProjModuleMappId = @MappingId)
        BEGIN
            RAISERROR('Mapping not found', 16, 1);
            RETURN;
        END

        -- Update mapping
        UPDATE ProjectModuleMapping
        SET IsActive = ISNULL(@IsActive, IsActive), -- Keep existing value if NULL
            ModifiedBy = @ModifiedBy,
            ModifiedDate = @ModifiedDate
        WHERE ProjModuleMappId = @MappingId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Soft Delete Project Module Mapping
CREATE OR ALTER PROCEDURE sp_DeleteProjectModuleMapping
    @MappingId INT,
    @ModifiedBy INT,
    @ModifiedDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM ProjectModuleMapping WHERE ProjModuleMappId = @MappingId)
    BEGIN
        RAISERROR('Mapping not found.', 16, 1);
        RETURN;
    END
    
    -- Perform soft delete by setting IsActive to false and updating audit fields
    UPDATE ProjectModuleMapping
    SET 
        IsActive = 0,
        ModifiedBy = @ModifiedBy,
        ModifiedDate = @ModifiedDate
    WHERE 
        ProjModuleMappId = @MappingId;
END
GO

-- Toggle Project Module Mapping Status
CREATE OR ALTER PROCEDURE sp_ToggleProjectModuleMappingStatus
    @ProjModuleMappId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF NOT EXISTS (SELECT 1 FROM ProjectModuleMapping WHERE ProjModuleMappId = @ProjModuleMappId)
    BEGIN
        RAISERROR('Mapping not found.', 16, 1);
        RETURN 0;
    END

    -- Check if user has access to the project
    IF NOT EXISTS (
        SELECT 1 
        FROM ProjectModuleMapping pmm
        INNER JOIN ProjectUsers pu ON pmm.ProjectId = pu.ProjectId
        WHERE pmm.ProjModuleMappId = @ProjModuleMappId 
        AND pu.UserId = @UserId
    )
    BEGIN
        RAISERROR('User not authorized to modify this mapping.', 16, 1);
        RETURN 0;
    END
    
    -- Toggle IsActive status and update audit fields
    UPDATE ProjectModuleMapping
    SET 
        IsActive = ~IsActive,
        ModifiedBy = @UserId,
        ModifiedDate = GETDATE()
    WHERE 
        ProjModuleMappId = @ProjModuleMappId;

    RETURN 1;
END
GO

-- Get user's modules
CREATE OR ALTER PROCEDURE sp_GetUserModules
    @UserId INT
AS
BEGIN
    SELECT DISTINCT
        m.ModuleId,
        m.ModuleName,
        m.Description,
        m.CreatedBy,
        u.Username as CreatorName,
        m.CreatedDate,
        m.ModifiedDate,
        m.IsActive
    FROM Modules m
    INNER JOIN Users u ON m.CreatedBy = u.UserId
    WHERE m.CreatedBy = @UserId OR EXISTS (
        SELECT 1 
        FROM ProjectModuleMapping pmm
        INNER JOIN ProjectUsers pu ON pmm.ProjectId = pu.ProjectId
        WHERE pmm.ModuleId = m.ModuleId AND pu.UserId = @UserId
    )
    ORDER BY m.CreatedDate DESC;
END;
GO

-- Get module by ID
CREATE OR ALTER PROCEDURE sp_GetModuleById
    @ModuleId INT
AS
BEGIN
    SELECT 
        m.ModuleId,
        m.ModuleName,
        m.Description,
        m.CreatedBy,
        u.Username as CreatorName,
        m.CreatedDate,
        m.ModifiedDate,
        m.IsActive
    FROM Modules m
    INNER JOIN Users u ON m.CreatedBy = u.UserId
    WHERE m.ModuleId = @ModuleId;
END;
GO

-- Update module
CREATE OR ALTER PROCEDURE sp_UpdateModule
    @ModuleId INT,
    @ModuleName VARCHAR(100),
    @Description VARCHAR(500),
    @IsActive BIT,
    @ModifiedBy INT,
    @ModifiedDate DATETIME
AS
BEGIN
    BEGIN TRY
        -- Check if module exists
        IF NOT EXISTS (SELECT 1 FROM Modules WHERE ModuleId = @ModuleId)
        BEGIN
            RAISERROR('Module not found', 16, 1);
            RETURN;
        END

        -- Update existing module
        UPDATE Modules 
        SET ModuleName = @ModuleName,
            Description = @Description,
            ModifiedDate = @ModifiedDate,
            ModifiedBy = @ModifiedBy,
            IsActive = ISNULL(@IsActive, IsActive)
        WHERE ModuleId = @ModuleId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO

-- Delete module (Soft delete)
CREATE OR ALTER PROCEDURE sp_DeleteModule
    @ModuleId INT,
    @ModifiedBy INT,
    @ModifiedDate DATETIME
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Soft delete the module and its mapping
        UPDATE Modules 
        SET IsActive = 0,
            ModifiedDate = @ModifiedDate,
            ModifiedBy = @ModifiedBy
        WHERE ModuleId = @ModuleId;

        UPDATE ProjectModuleMapping
        SET IsActive = 0,
            ModifiedDate = @ModifiedDate,
            ModifiedBy = @ModifiedBy
        WHERE ModuleId = @ModuleId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get documentation list
CREATE PROCEDURE [dbo].[sp_GetDocumentationList]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        dp.PageId,
        dp.PageName,
        dp.Version,
        dp.CreatedDate,
        dp.BlobUrl,
        u.FirstName + ' ' + u.LastName AS CreatorName
    FROM DocumentationPages dp
    INNER JOIN ProjectModuleMapping pmm ON dp.ProjModuleMappId = pmm.MappingID
    INNER JOIN Users u ON dp.CreatedBy = u.UserId
    ORDER BY dp.CreatedDate DESC;
END
GO

-- =============================================
-- Author:      Cascade
-- Create date: 2025-03-11
-- Description: Get blob URL for a document by its page ID
-- =============================================
CREATE PROCEDURE [dbo].[sp_GetDocumentBlobUrl]
    @PageId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if page exists
    IF NOT EXISTS (SELECT 1 FROM DocumentationPages WHERE PageId = @PageId)
    BEGIN
        RAISERROR('Document not found', 16, 1);
        RETURN;
    END

    -- Get blob URL
    SELECT BlobUrl
    FROM DocumentationPages dp
    WHERE dp.PageId = @PageId;
END
GO

-- Get documentation page by ID
CREATE OR ALTER PROCEDURE sp_GetDocumentationPageById
    @PageId INT
AS
BEGIN
    SELECT 
        d.PageId,
        d.ProjModuleMappId,
        d.PageName,
        d.Version,
        d.BlobUrl,
        d.CreatedBy,
        d.CreatedDate,
        d.ModifiedDate,
        p.ProjectId,
        p.ProjectName,
        m.ModuleId,
        m.ModuleName,
        u.FullName AS CreatorName
    FROM DocumentationPages d
    INNER JOIN ProjectModuleMapping pmm ON d.ProjModuleMappId = pmm.ProjModuleMappId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    LEFT JOIN Users u ON d.CreatedBy = u.UserId
    WHERE d.PageId = @PageId
END
GO
