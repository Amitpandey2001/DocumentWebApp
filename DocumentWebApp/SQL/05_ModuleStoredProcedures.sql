--===============================================--
-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: Module Management
-- CREATION DATE : 07-03-2025
--===============================================--

-- Get Modules by Project ID
CREATE OR ALTER PROCEDURE sp_GetModulesByProjectId
    @ProjectId INT
AS
BEGIN
    SELECT DISTINCT
        m.ModuleId,
        m.ModuleName,
        m.Description,
        m.CreatedBy,
        m.CreatedDate,
        m.ModifiedDate,
        m.IsActive
    FROM Modules m
    INNER JOIN ProjectModuleMapping pmm ON m.ModuleId = pmm.ModuleId
    WHERE pmm.ProjectId = @ProjectId
        AND pmm.IsActive = 1
        AND m.IsActive = 1
    ORDER BY m.ModuleName;
END;
GO
