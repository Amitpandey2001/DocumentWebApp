-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: sp_GetDocumentationPagesByUser
-- CREATION DATE : 17-03-2025
--===============================================--

-- Get Documentation Pages accessible by a specific user
CREATE OR ALTER PROCEDURE sp_GetDocumentationPagesByUser
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
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId AND pu.UserId = @UserId
    WHERE p.IsActive = 1 AND pmm.IsActive = 1
    ORDER BY dp.CreatedDate DESC;
END;
GO
