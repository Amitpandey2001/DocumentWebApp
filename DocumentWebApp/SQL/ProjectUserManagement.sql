-- Stored Procedures for Project User Management

-- Get all users assigned to a project
CREATE OR ALTER PROCEDURE sp_GetProjectUsers
    @ProjectId INT
AS
BEGIN
    SELECT 
        pu.ProjectUserId,
        pu.ProjectId,
        p.ProjectName,
        pu.UserId,
        u.Username,
        u.Email,
        pu.AccessLevel
    FROM 
        ProjectUsers pu
        INNER JOIN Projects p ON pu.ProjectId = p.ProjectId
        INNER JOIN Users u ON pu.UserId = u.UserId
    WHERE 
        pu.ProjectId = @ProjectId
    ORDER BY 
        u.Username;
END
GO

-- Get users not assigned to a specific project
CREATE OR ALTER PROCEDURE sp_GetUsersNotInProject
    @ProjectId INT
AS
BEGIN
    SELECT 
        u.UserId,
        u.Username,
        u.Email,
        u.IsActive,
        STUFF(
            (SELECT ',' + r.RoleName
             FROM UserRoles ur
             JOIN Roles r ON ur.RoleId = r.RoleId
             WHERE ur.UserId = u.UserId
             FOR XML PATH('')), 1, 1, '') AS Roles
    FROM 
        Users u
    WHERE 
        u.IsActive = 1
        AND u.UserId NOT IN (
            SELECT UserId FROM ProjectUsers WHERE ProjectId = @ProjectId
        )
    ORDER BY 
        u.Username;
END
GO

-- Add a user to a project
CREATE OR ALTER PROCEDURE sp_AddUserToProject
    @ProjectId INT,
    @UserId INT,
    @AccessLevel VARCHAR(20)
AS
BEGIN
    -- Check if the user is already in the project
    IF NOT EXISTS (SELECT 1 FROM ProjectUsers WHERE ProjectId = @ProjectId AND UserId = @UserId)
    BEGIN
        INSERT INTO ProjectUsers (ProjectId, UserId, AccessLevel)
        VALUES (@ProjectId, @UserId, @AccessLevel);
    END
    ELSE
    BEGIN
        -- Update the access level if the user is already in the project
        UPDATE ProjectUsers
        SET AccessLevel = @AccessLevel
        WHERE ProjectId = @ProjectId AND UserId = @UserId;
    END
END
GO

-- Update a user's access level in a project
CREATE OR ALTER PROCEDURE sp_UpdateUserProjectAccess
    @ProjectUserId INT,
    @AccessLevel VARCHAR(20)
AS
BEGIN
    UPDATE ProjectUsers
    SET AccessLevel = @AccessLevel
    WHERE ProjectUserId = @ProjectUserId;
END
GO

-- Remove a user from a project
CREATE OR ALTER PROCEDURE sp_RemoveUserFromProject
    @ProjectUserId INT
AS
BEGIN
    DELETE FROM ProjectUsers
    WHERE ProjectUserId = @ProjectUserId;
END
GO
