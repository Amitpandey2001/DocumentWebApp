-- Create stored procedure for getting recent documents by user
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetRecentDocumentsByUser')
    DROP PROCEDURE sp_GetRecentDocumentsByUser
GO

CREATE PROCEDURE sp_GetRecentDocumentsByUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get the most recent documents viewed by the user
    SELECT 
        dp.PageId,
        dp.PageName,
        dp.Version,
        dp.BlobUrl,
        dp.CreatedDate,
        dp.ModifiedDate,
        u.UserName AS CreatorName,
        p.ProjectId,
        p.ProjectName,
        m.ModuleId,
        m.ModuleName,
        dv.ViewDate AS LastViewedDate
    FROM DocumentationPages dp
    INNER JOIN DocumentViews dv ON dp.PageId = dv.PageId
    INNER JOIN ProjectModuleMapping pmm ON dp.ProjModuleMappId = pmm.ProjModuleMappId
    INNER JOIN Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN Users u ON dp.CreatedBy = u.UserId
    WHERE dv.UserId = @UserId
    ORDER BY dv.ViewDate DESC;
END
GO

-- Create stored procedure for getting documentation pages by module
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDocumentationPagesByModule')
    DROP PROCEDURE sp_GetDocumentationPagesByModule
GO

CREATE PROCEDURE sp_GetDocumentationPagesByModule
    @ModuleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get all documentation pages for a specific module
    SELECT 
        dp.PageId,
        dp.PageName,
        dp.Version,
        dp.BlobUrl,
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
    WHERE m.ModuleId = @ModuleId
    ORDER BY dp.PageName;
END
GO

-- Create stored procedure for searching documents
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SearchDocuments')
    DROP PROCEDURE sp_SearchDocuments
GO

CREATE PROCEDURE sp_SearchDocuments
    @SearchTerm NVARCHAR(100),
    @ProjectId INT = NULL,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Search for documents based on search term and optional project ID
    SELECT 
        dp.PageId,
        dp.PageName,
        dp.Version,
        dp.BlobUrl,
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
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId AND pu.UserId = @UserId
    WHERE 
        (dp.PageName LIKE '%' + @SearchTerm + '%' OR dp.Content LIKE '%' + @SearchTerm + '%')
        AND (@ProjectId IS NULL OR p.ProjectId = @ProjectId)
    ORDER BY dp.ModifiedDate DESC, dp.CreatedDate DESC;
END
GO

-- Create stored procedure for recording document views
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_RecordDocumentView')
    DROP PROCEDURE sp_RecordDocumentView
GO

CREATE PROCEDURE sp_RecordDocumentView
    @PageId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if a view record already exists
    IF EXISTS (SELECT 1 FROM DocumentViews WHERE PageId = @PageId AND UserId = @UserId)
    BEGIN
        -- Update the existing view record
        UPDATE DocumentViews
        SET ViewDate = GETDATE(), ViewCount = ViewCount + 1
        WHERE PageId = @PageId AND UserId = @UserId;
    END
    ELSE
    BEGIN
        -- Insert a new view record
        INSERT INTO DocumentViews (PageId, UserId, ViewDate, ViewCount)
        VALUES (@PageId, @UserId, GETDATE(), 1);
    END
END
GO

-- Create stored procedure for getting document blob URL
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetDocumentBlobUrl')
    DROP PROCEDURE sp_GetDocumentBlobUrl
GO

CREATE PROCEDURE sp_GetDocumentBlobUrl
    @PageId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get the blob URL for a specific document
    SELECT BlobUrl
    FROM DocumentationPages
    WHERE PageId = @PageId;
END
GO
