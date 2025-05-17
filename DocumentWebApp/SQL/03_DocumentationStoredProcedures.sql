--===============================================--
-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: Documentation Pages Management
-- CREATION DATE : 07-03-2025
--===============================================--

-- Get Documentation Pages
CREATE OR ALTER PROCEDURE sp_GetDocumentationPages
    @UserId INT
AS
BEGIN
    SELECT 
        dp.PageId,
        dp.ProjModuleMappId,
        dp.PageName,
        dp.Version,
        dp.BlobUrl,
        dp.CreatedBy,
        dp.CreatedDate,
        dp.ModifiedDate,
        u.UserName AS CreatorName,
        p.ProjectId,
        p.ProjectName,
        m.ModuleId,
        m.ModuleName
    FROM DocumentationPages dp
    INNER JOIN ProjectModuleMapping pmm ON dp.ProjModuleMappId = pmm.ProjModuleMappId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON dp.CreatedBy = u.UserId
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId
    WHERE pu.UserId = @UserId
    ORDER BY dp.CreatedDate DESC;
END;
GO

-- Get Documentation Page by ID
CREATE OR ALTER PROCEDURE sp_GetDocumentationPageById
    @PageId INT
AS
BEGIN
    SELECT 
        dp.PageId,
        dp.ProjModuleMappId,
        dp.PageName,
        dp.Version,
        dp.BlobUrl,
        dp.CreatedBy,
        dp.CreatedDate,
        dp.ModifiedDate,
        u.UserName AS CreatorName,
        p.ProjectId,
        p.ProjectName,
        m.ModuleId,
        m.ModuleName
    FROM DocumentationPages dp
    INNER JOIN ProjectModuleMapping pmm ON dp.ProjModuleMappId = pmm.ProjModuleMappId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON dp.CreatedBy = u.UserId
    WHERE dp.PageId = @PageId;
END;
GO

-- Create Documentation Page
CREATE OR ALTER PROCEDURE sp_CreateDocumentationPage
    @ProjModuleMappId INT,
    @PageName NVARCHAR(100),
    @Version NVARCHAR(20),
    @BlobUrl NVARCHAR(MAX),
    @CreatedBy INT,
    @PageId INT OUTPUT
AS
BEGIN
    -- Check if mapping exists and is active
    IF NOT EXISTS (
        SELECT 1 
        FROM ProjectModuleMapping 
        WHERE ProjModuleMappId = @ProjModuleMappId 
        AND IsActive = 1
    )
    BEGIN
        RAISERROR('Invalid or inactive project-module mapping', 16, 1);
        RETURN;
    END

    -- Check for duplicate page name within the same project-module mapping
    IF EXISTS (
        SELECT 1 
        FROM DocumentationPages 
        WHERE ProjModuleMappId = @ProjModuleMappId 
        AND PageName = @PageName
        AND Version = @Version
    )
    BEGIN
        RAISERROR('A page with the same name and version already exists for this project-module combination', 16, 1);
        RETURN;
    END

    INSERT INTO DocumentationPages (
        ProjModuleMappId,
        PageName,
        Version,
        BlobUrl,
        CreatedBy,
        CreatedDate,
        ModifiedDate
    )
    VALUES (
        @ProjModuleMappId,
        @PageName,
        @Version,
        @BlobUrl,
        @CreatedBy,
        GETUTCDATE(),
        GETUTCDATE()
    );

    SET @PageId = SCOPE_IDENTITY();
END;
GO

-- Update Documentation Page
CREATE OR ALTER PROCEDURE sp_UpdateDocumentationPage
    @PageId INT,
    @ProjModuleMappId INT,
    @PageName NVARCHAR(100),
    @Version NVARCHAR(20),
    @BlobUrl NVARCHAR(MAX),
    @ModifiedDate DATETIME
AS
BEGIN
    -- Check if page exists
    IF NOT EXISTS (SELECT 1 FROM DocumentationPages WHERE PageId = @PageId)
    BEGIN
        RAISERROR('Documentation page not found', 16, 1);
        RETURN;
    END

    -- Check if mapping exists and is active
    IF NOT EXISTS (
        SELECT 1 
        FROM ProjectModuleMapping 
        WHERE ProjModuleMappId = @ProjModuleMappId 
        AND IsActive = 1
    )
    BEGIN
        RAISERROR('Invalid or inactive project-module mapping', 16, 1);
        RETURN;
    END

    -- Check for duplicate page name within the same project-module mapping
    IF EXISTS (
        SELECT 1 
        FROM DocumentationPages 
        WHERE ProjModuleMappId = @ProjModuleMappId 
        AND PageName = @PageName
        AND Version = @Version
        AND PageId != @PageId
    )
    BEGIN
        RAISERROR('A page with the same name and version already exists for this project-module combination', 16, 1);
        RETURN;
    END

    UPDATE DocumentationPages
    SET ProjModuleMappId = @ProjModuleMappId,
        PageName = @PageName,
        Version = @Version,
        BlobUrl = @BlobUrl,
        ModifiedDate = @ModifiedDate
    WHERE PageId = @PageId;
END;
GO

-- Delete Documentation Page
CREATE OR ALTER PROCEDURE sp_DeleteDocumentationPage
    @PageId INT
AS
BEGIN
    -- Check if page exists
    IF NOT EXISTS (SELECT 1 FROM DocumentationPages WHERE PageId = @PageId)
    BEGIN
        RAISERROR('Documentation page not found', 16, 1);
        RETURN;
    END

    DELETE FROM DocumentationPages WHERE PageId = @PageId;
END;
GO

-- Get Project Module Mapping ID
CREATE OR ALTER PROCEDURE sp_GetProjectModuleMappingId
    @ProjectId INT,
    @ModuleId INT
AS
BEGIN
    SELECT TOP 1 ProjModuleMappId
    FROM ProjectModuleMapping
    WHERE ProjectId = @ProjectId
    AND ModuleId = @ModuleId
    AND IsActive = 1;
END;
GO
