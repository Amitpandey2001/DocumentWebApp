CREATE PROCEDURE [dbo].[sp_GetProjectModuleMappingsByProject]
    @ProjectId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pm.ProjModuleMappId,
        pm.ProjectId,
        pm.ModuleId,
        p.ProjectName,
        m.ModuleName,
        m.Description,
        p.IsActive,
        m.IsActive AS ModuleIsActive,
        pm.CreatedBy,
        u.UserName AS CreatorName,
        pm.CreatedDate,
        pm.ModifiedDate
    FROM 
        ProjectModuleMapping pm
    INNER JOIN 
        Projects p ON pm.ProjectId = p.ProjectId
    INNER JOIN 
        Modules m ON pm.ModuleId = m.ModuleId
    LEFT JOIN 
        Users u ON pm.CreatedBy = u.UserId
    WHERE 
        pm.ProjectId = @ProjectId
    ORDER BY 
        m.ModuleName;
END
