--===============================================--
-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: Documentation Management
-- CREATION DATE : 07-03-2025
--===============================================--

-- Get Documentation Pages
CREATE OR ALTER PROCEDURE sp_GetDocumentationPages
AS
BEGIN
    SELECT 
        d.PageId,
        d.ProjModuleMappId,
        d.PageName,
        d.Version,
        d.BlobUrl,
        d.CreatedBy,
        u.UserName AS CreatorName,
        d.CreatedDate,
        d.ModifiedDate,
        p.ProjectName,
        m.ModuleName
    FROM DocumentationPages d
    INNER JOIN ProjectModuleMapping pmm ON d.ProjModuleMappId = pmm.MappingId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON d.CreatedBy = u.UserId
    WHERE pmm.IsActive = 1
    ORDER BY d.CreatedDate DESC;
END;
GO

-- Get Documentation Page by ID
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
        u.UserName AS CreatorName,
        d.CreatedDate,
        d.ModifiedDate,
        p.ProjectId,
        p.ProjectName,
        m.ModuleId,
        m.ModuleName
    FROM DocumentationPages d
    INNER JOIN ProjectModuleMapping pmm ON d.ProjModuleMappId = pmm.MappingId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON d.CreatedBy = u.UserId
    WHERE d.PageId = @PageId;
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
    INSERT INTO DocumentationPages (
        ProjModuleMappId,
        PageName,
        Version,
        BlobUrl,
        CreatedBy,
        CreatedDate
    )
    VALUES (
        @ProjModuleMappId,
        @PageName,
        @Version,
        @BlobUrl,
        @CreatedBy,
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
    @BlobUrl NVARCHAR(MAX)
AS
BEGIN
    UPDATE DocumentationPages
    SET ProjModuleMappId = @ProjModuleMappId,
        PageName = @PageName,
        Version = @Version,
        BlobUrl = @BlobUrl,
        ModifiedDate = GETUTCDATE()
    WHERE PageId = @PageId;
END;
GO

-- Delete Documentation Page
CREATE OR ALTER PROCEDURE sp_DeleteDocumentationPage
    @PageId INT
AS
BEGIN
    DELETE FROM DocumentationPages
    WHERE PageId = @PageId;
END;
GO

-- Get Documentation Pages by Project
CREATE OR ALTER PROCEDURE sp_GetDocumentationPagesByProject
    @ProjectId INT
AS
BEGIN
    SELECT 
        d.PageId,
        d.ProjModuleMappId,
        d.PageName,
        d.Version,
        d.BlobUrl,
        d.CreatedBy,
        u.UserName AS CreatorName,
        d.CreatedDate,
        d.ModifiedDate,
        p.ProjectName,
        m.ModuleName
    FROM DocumentationPages d
    INNER JOIN ProjectModuleMapping pmm ON d.ProjModuleMappId = pmm.MappingId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON d.CreatedBy = u.UserId
    WHERE pmm.ProjectId = @ProjectId
        AND pmm.IsActive = 1
    ORDER BY d.CreatedDate DESC;
END;
GO

-- Get Documentation Pages by Module
CREATE OR ALTER PROCEDURE sp_GetDocumentationPagesByModule
    @ModuleId INT
AS
BEGIN
    SELECT 
        d.PageId,
        d.ProjModuleMappId,
        d.PageName,
        d.Version,
        d.BlobUrl,
        d.CreatedBy,
        u.UserName AS CreatorName,
        d.CreatedDate,
        d.ModifiedDate,
        p.ProjectName,
        m.ModuleName
    FROM DocumentationPages d
    INNER JOIN ProjectModuleMapping pmm ON d.ProjModuleMappId = pmm.MappingId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON d.CreatedBy = u.UserId
    WHERE pmm.ModuleId = @ModuleId
        AND pmm.IsActive = 1
    ORDER BY d.CreatedDate DESC;
END;
GO
