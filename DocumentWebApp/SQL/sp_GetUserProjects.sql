CREATE PROCEDURE [dbo].[sp_GetUserProjects]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.ProjectId,
        p.ProjectName,
        p.Description,
        p.IsActive,
        p.CreatedBy,
        u.UserName AS CreatorName,
        p.CreatedDate,
        p.ModifiedDate
    FROM 
        Projects p
    INNER JOIN 
        ProjectUsers pu ON p.ProjectId = pu.ProjectId
    LEFT JOIN 
        Users u ON p.CreatedBy = u.UserId
    WHERE 
        pu.UserId = @UserId
    ORDER BY 
        p.ProjectName;
END
