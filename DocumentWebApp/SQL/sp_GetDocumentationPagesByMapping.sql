-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: sp_GetDocumentationPagesByMapping
-- CREATION DATE : 17-03-2025
--===============================================--

-- Get Documentation Pages by Mapping ID
CREATE OR ALTER PROCEDURE sp_GetDocumentationPagesByMapping
    @MappingId INT
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
    WHERE dp.ProjModuleMappId = @MappingId
    ORDER BY dp.CreatedDate DESC;
END;
GO
