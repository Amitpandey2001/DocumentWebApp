
USE DB_MS_DOCS
GO

-- Roles Table 
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL
)

-- Users Table
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(MAX) NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
)

-- User Roles Mapping
CREATE TABLE UserRoles (
    UserRoleId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT FOREIGN KEY REFERENCES Users(UserId),
    RoleId INT FOREIGN KEY REFERENCES Roles(RoleId)
)

-- Projects Table
CREATE TABLE Projects (
    ProjectId INT PRIMARY KEY IDENTITY(1,1),
    ProjectName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserId),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
)

-- Modules Table
CREATE TABLE Modules (
    ModuleId INT PRIMARY KEY IDENTITY(1,1),
    ModuleName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserId),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
)

-- Project Module Mapping 
CREATE TABLE ProjectModuleMapping (
    ProjModuleMappId INT PRIMARY KEY IDENTITY(1,1),
    ProjectId INT FOREIGN KEY REFERENCES Projects(ProjectId),
    ModuleId INT FOREIGN KEY REFERENCES Modules(ModuleId)
)

-- Documentation Pages
CREATE TABLE DocumentationPages (
    PageId INT PRIMARY KEY IDENTITY(1,1),
    ProjModuleMappId INT FOREIGN KEY REFERENCES ProjectModuleMapping(ProjModuleMappId),
    PageName VARCHAR(100) NOT NULL,
    Version VARCHAR(20) NOT NULL,
    BlobUrl VARCHAR(500) NOT NULL,
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserId),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
)

-- Insert Default Roles
INSERT INTO Roles (RoleName) VALUES 
('Admin'),
('Developer'),
('Viewer')
GO

-- Create stored procedures
-- Get user by email with roles
CREATE OR ALTER PROCEDURE sp_GetUserByEmail
    @Email VARCHAR(100)
AS
BEGIN
    SELECT 
        u.UserId,
        u.Username,
        u.Email,
        u.PasswordHash,
        u.CreatedDate,
        u.IsActive,
        r.RoleName
    FROM Users u
    LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
    LEFT JOIN Roles r ON ur.RoleId = r.RoleId
    WHERE u.Email = @Email;
END;
GO

-- Create new user
CREATE OR ALTER PROCEDURE sp_CreateUser
    @Username VARCHAR(100),
    @Email VARCHAR(100),
    @PasswordHash VARCHAR(MAX),
    @IsActive BIT,
    @UserId INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check if email already exists
        IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
        BEGIN
            THROW 50000, 'Email already exists.', 1;
        END

        -- Insert user
        INSERT INTO Users (Username, Email, PasswordHash, IsActive)
        VALUES (@Username, @Email, @PasswordHash, @IsActive);

        SET @UserId = SCOPE_IDENTITY();

        -- Assign default 'Viewer' role
        INSERT INTO UserRoles (UserId, RoleId)
        SELECT @UserId, RoleId FROM Roles WHERE RoleName = 'Viewer';

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- Get user roles
CREATE OR ALTER PROCEDURE sp_GetUserRoles
    @UserId INT
AS
BEGIN
    SELECT r.RoleName
    FROM UserRoles ur
    JOIN Roles r ON ur.RoleId = r.RoleId
    WHERE ur.UserId = @UserId;
END;
GO

-- Create admin user
DECLARE @AdminEmail VARCHAR(100) = 'admin@msdocs.com';
DECLARE @AdminUsername VARCHAR(100) = 'admin';
DECLARE @AdminPasswordHash VARCHAR(MAX) = '$2a$11$rKN1DkXvGCuOGjsD4CyPU.vnC0w3LVCfKnlI5CGbfykCu0Sk.kmQi'; -- Password: Admin@123

-- Insert admin user
INSERT INTO Users (Username, Email, PasswordHash, IsActive)
VALUES (@AdminUsername, @AdminEmail, @AdminPasswordHash, 1);

DECLARE @AdminUserId INT = SCOPE_IDENTITY();

-- Assign admin role
INSERT INTO UserRoles (UserId, RoleId)
SELECT @AdminUserId, RoleId FROM Roles WHERE RoleName = 'Admin';
GO
