CREATE PROCEDURE [dbo].[sp_GetModuleById]
    @ModuleId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        m.ModuleId,
        m.ModuleName,
        m.Description,
        m.IsActive,
        m.CreatedBy,
        u.UserName AS CreatorName,
        m.CreatedDate,
        m.ModifiedDate
    FROM 
        Modules m
    LEFT JOIN 
        Users u ON m.CreatedBy = u.UserId
    WHERE 
        m.ModuleId = @ModuleId;
END
