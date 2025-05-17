--===============================================--
-- MODULE NAME   : MS-DOCS
-- SCRIPT NAME   : Create Documentation Tables
-- CREATION DATE : 07-03-2025
--===============================================--

-- Create DocumentationPages table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentationPages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DocumentationPages] (
        [PageId] INT IDENTITY(1,1) PRIMARY KEY,
        [ProjModuleMappId] INT NOT NULL,
        [PageName] NVARCHAR(100) NOT NULL,
        [Version] NVARCHAR(20) NOT NULL,
        [BlobUrl] NVARCHAR(MAX) NOT NULL,
        [CreatedBy] INT NOT NULL,
        [CreatedDate] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        [ModifiedDate] DATETIME NULL,
        CONSTRAINT [FK_DocumentationPages_ProjectModuleMapping] FOREIGN KEY ([ProjModuleMappId]) 
            REFERENCES [dbo].[ProjectModuleMapping]([MappingId]),
        CONSTRAINT [FK_DocumentationPages_Users] FOREIGN KEY ([CreatedBy]) 
            REFERENCES [dbo].[Users]([UserId])
    );

    -- Add index for faster lookups
    CREATE NONCLUSTERED INDEX [IX_DocumentationPages_ProjModuleMappId] 
        ON [dbo].[DocumentationPages]([ProjModuleMappId]);

    -- Add index for faster user-based queries
    CREATE NONCLUSTERED INDEX [IX_DocumentationPages_CreatedBy] 
        ON [dbo].[DocumentationPages]([CreatedBy]);

    PRINT 'DocumentationPages table created successfully.';
END
ELSE
BEGIN
    PRINT 'DocumentationPages table already exists.';
END

-- Add unique constraint to prevent duplicate page names within the same project-module mapping
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_DocumentationPages_PageName_ProjModuleMappId' AND object_id = OBJECT_ID('DocumentationPages'))
BEGIN
    ALTER TABLE [dbo].[DocumentationPages]
    ADD CONSTRAINT [UQ_DocumentationPages_PageName_ProjModuleMappId] 
    UNIQUE ([PageName], [ProjModuleMappId]);

    PRINT 'Unique constraint added to DocumentationPages table.';
END
ELSE
BEGIN
    PRINT 'Unique constraint already exists on DocumentationPages table.';
END
