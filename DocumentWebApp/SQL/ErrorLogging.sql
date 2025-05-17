-- Create ErrorLogs table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ErrorLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ErrorLogs] (
        [ErrorLogId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ErrorMessage] NVARCHAR(MAX) NOT NULL,
        [Source] NVARCHAR(255) NOT NULL,
        [AdditionalInfo] NVARCHAR(MAX) NULL,
        [CreatedDate] DATETIME NOT NULL,
        [IsResolved] BIT NOT NULL DEFAULT(0),
        [ResolvedDate] DATETIME NULL,
        [ResolvedBy] NVARCHAR(128) NULL,
        [ResolutionNotes] NVARCHAR(MAX) NULL
    );
    
    PRINT 'ErrorLogs table created successfully';
END
ELSE
BEGIN
    PRINT 'ErrorLogs table already exists';
END
GO

-- Create sp_LogError stored procedure
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_LogError]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [dbo].[sp_LogError];
    PRINT 'Dropped existing sp_LogError procedure';
END
GO

CREATE PROCEDURE [dbo].[sp_LogError]
    @ErrorMessage NVARCHAR(MAX),
    @Source NVARCHAR(255),
    @AdditionalInfo NVARCHAR(MAX),
    @CreatedDate DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ErrorLogs (ErrorMessage, Source, AdditionalInfo, CreatedDate)
    VALUES (@ErrorMessage, @Source, @AdditionalInfo, @CreatedDate);
    
    PRINT 'Error logged successfully';
END
GO

PRINT 'sp_LogError procedure created successfully';
GO
