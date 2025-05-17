USE DB_MS_DOCS
GO

-- Roles Table 
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE
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
    UserId INT NOT NULL,
    RoleId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId)
)

-- Projects Table
CREATE TABLE Projects (
    ProjectId INT PRIMARY KEY IDENTITY(1,1),
    ProjectName VARCHAR(100) NOT NULL,
    Description VARCHAR(MAX),
    CreatedBy INT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
)

-- Project Users Table
CREATE TABLE ProjectUsers (
    ProjectUserId INT PRIMARY KEY IDENTITY(1,1),
    ProjectId INT NOT NULL,
    UserId INT NOT NULL,
    AccessLevel VARCHAR(20) NOT NULL CHECK (AccessLevel IN ('Admin', 'Editor', 'Viewer')),
    FOREIGN KEY (ProjectId) REFERENCES Projects(ProjectId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
)

-- Modules Table
CREATE TABLE Modules (
    ModuleId INT PRIMARY KEY IDENTITY(1,1),
    ModuleName VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserId),
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
)

-- Project Module Mapping 
CREATE TABLE ProjectModuleMapping (
    ProjModuleMappId INT PRIMARY KEY IDENTITY(1,1),
    ProjectId INT FOREIGN KEY REFERENCES Projects(ProjectId),
    ModuleId INT FOREIGN KEY REFERENCES Modules(ModuleId),
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserId),
    ModifiedBy INT NULL,
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE()
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
('Editor'),
('Viewer')

-- Add ModifiedBy column to ProjectModuleMapping table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ProjectModuleMapping') AND name = 'ModifiedBy')
BEGIN
    ALTER TABLE ProjectModuleMapping
    ADD ModifiedBy INT NULL;
END
GO