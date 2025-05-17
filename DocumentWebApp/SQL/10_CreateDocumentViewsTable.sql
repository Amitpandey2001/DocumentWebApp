--===============================================--
-- MODULE NAME   : MS-DOCS
-- SCRIPT NAME   : Create Document Views Table
-- CREATION DATE : 17-03-2025
--===============================================--

-- Create DocumentViews table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[DocumentViews]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[DocumentViews] (
        [ViewId] INT IDENTITY(1,1) PRIMARY KEY,
        [PageId] INT NOT NULL,
        [UserId] INT NOT NULL,
        [ViewDate] DATETIME NOT NULL DEFAULT GETUTCDATE(),
        [ViewCount] INT NOT NULL DEFAULT 1,
        CONSTRAINT [FK_DocumentViews_DocumentationPages] FOREIGN KEY ([PageId]) 
            REFERENCES [dbo].[DocumentationPages]([PageId]),
        CONSTRAINT [FK_DocumentViews_Users] FOREIGN KEY ([UserId]) 
            REFERENCES [dbo].[Users]([UserId]),
        CONSTRAINT [UQ_DocumentViews_PageId_UserId] UNIQUE ([PageId], [UserId])
    );

    -- Add index for faster lookups
    CREATE NONCLUSTERED INDEX [IX_DocumentViews_PageId] 
        ON [dbo].[DocumentViews]([PageId]);

    -- Add index for faster user-based queries
    CREATE NONCLUSTERED INDEX [IX_DocumentViews_UserId] 
        ON [dbo].[DocumentViews]([UserId]);

    -- Add index for faster date-based queries
    CREATE NONCLUSTERED INDEX [IX_DocumentViews_ViewDate] 
        ON [dbo].[DocumentViews]([ViewDate] DESC);

    PRINT 'DocumentViews table created successfully.';
END
ELSE
BEGIN
    PRINT 'DocumentViews table already exists.';
END
