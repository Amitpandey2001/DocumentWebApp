--===============================================--
-- MODULE NAME   : MS-DOCS
-- PROCEDURE NAME: Project Management
-- CREATION DATE : 07-03-2025
--===============================================--

-- Get User Projects
CREATE OR ALTER PROCEDURE sp_GetUserProjects
    @UserId INT
AS
BEGIN
    SELECT DISTINCT
        p.ProjectId,
        p.ProjectName,
        p.Description,
        p.IsActive,
        p.CreatedBy,
        p.CreatedDate,
        p.ModifiedDate
    FROM Projects p
    INNER JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId
    WHERE pu.UserId = @UserId
        AND p.IsActive = 1
    ORDER BY p.ProjectName;
END;
GO

-- Get Project By ID
CREATE OR ALTER PROCEDURE sp_GetProjectById
    @ProjectId INT
AS
BEGIN
    SELECT 
        p.ProjectId,
        p.ProjectName,
        p.Description,
        p.IsActive,
        p.CreatedBy,
        p.CreatedDate,
        p.ModifiedDate,
        u.UserName AS CreatorName
    FROM Projects p
    INNER JOIN Users u ON p.CreatedBy = u.UserId
    WHERE p.ProjectId = @ProjectId;
END;
GO

-- Check User Project Access
CREATE OR ALTER PROCEDURE sp_CheckUserProjectAccess
    @UserId INT,
    @ProjectId INT
AS
BEGIN
    SELECT COUNT(1)
    FROM ProjectUsers pu
    INNER JOIN Projects p ON pu.ProjectId = p.ProjectId
    WHERE pu.UserId = @UserId
        AND pu.ProjectId = @ProjectId
        AND p.IsActive = 1;
END;
GO
