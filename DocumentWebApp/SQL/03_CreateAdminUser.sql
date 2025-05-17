USE DB_MS_DOCS
GO

-- Delete existing admin if exists
DELETE FROM UserRoles WHERE UserId IN (SELECT UserId FROM Users WHERE Email = 'admin@msdocs.com');
DELETE FROM Users WHERE Email = 'admin@msdocs.com';

-- Create admin role if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Admin');
END

-- Create viewer role if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Viewer')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Viewer');
END

-- Create editor role if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'Editor')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Editor');
END

-- Insert admin user
INSERT INTO Users (Username, Email, PasswordHash, IsActive)
VALUES ('admin', 'admin@msdocs.com', '$2a$11$d689vsrhyu/iWzExvMkHGeekIV4bkwzHevFjTmOkjEHt9GwPZ9/v6', 1);

DECLARE @AdminUserId INT = SCOPE_IDENTITY();

-- Assign admin role
INSERT INTO UserRoles (UserId, RoleId)
SELECT @AdminUserId, RoleId FROM Roles WHERE RoleName = 'Admin';
