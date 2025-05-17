-- Check if IsActive column exists in Projects table
IF NOT EXISTS (
    SELECT 1 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Projects' 
    AND COLUMN_NAME = 'IsActive'
)
BEGIN
    -- Add IsActive column to Projects table
    ALTER TABLE Projects
    ADD IsActive BIT DEFAULT 1 NOT NULL;
    
    PRINT 'IsActive column added to Projects table';
END
ELSE
BEGIN
    PRINT 'IsActive column already exists in Projects table';
END
