-- Debug script to check project data

-- Check if Projects table exists and has IsActive column
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Projects')
BEGIN
    PRINT 'Projects table exists';
    
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Projects' AND COLUMN_NAME = 'IsActive')
    BEGIN
        PRINT 'IsActive column exists in Projects table';
    END
    ELSE
    BEGIN
        PRINT 'ERROR: IsActive column does NOT exist in Projects table';
    END
END
ELSE
BEGIN
    PRINT 'ERROR: Projects table does NOT exist';
END

-- Check project data
SELECT 
    p.ProjectId,
    p.ProjectName,
    p.Description,
    p.CreatedBy,
    u.Username as CreatorName,
    p.CreatedDate,
    p.IsActive,
    pu.AccessLevel
FROM Projects p
LEFT JOIN Users u ON p.CreatedBy = u.UserId
LEFT JOIN ProjectUsers pu ON p.ProjectId = pu.ProjectId AND pu.UserId = p.CreatedBy
ORDER BY p.CreatedDate DESC;

-- Check if any projects exist
IF NOT EXISTS (SELECT 1 FROM Projects)
BEGIN
    PRINT 'WARNING: No projects found in the database';
END
ELSE
BEGIN
    PRINT 'Projects found in the database';
END

-- Check if any project users exist
IF NOT EXISTS (SELECT 1 FROM ProjectUsers)
BEGIN
    PRINT 'WARNING: No project users found in the database';
END
ELSE
BEGIN
    PRINT 'Project users found in the database';
END
