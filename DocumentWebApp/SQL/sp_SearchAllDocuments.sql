CREATE PROCEDURE [dbo].[sp_SearchAllDocuments]
    @SearchTerm NVARCHAR(255),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Search for documents matching the search term in title or content
    -- Only return results from projects the user has access to
    SELECT 
        dp.PageId,
        dp.PageName AS Title,
        p.ProjectName,
        m.ModuleName,
        dp.ModifiedDate AS LastModified,
        -- Determine document type based on file extension or content type
        CASE
            WHEN dp.BlobUrl LIKE '%.pdf' THEN 'pdf'
            WHEN dp.BlobUrl LIKE '%.doc%' THEN 'word'
            WHEN dp.BlobUrl LIKE '%.xls%' THEN 'excel'
            WHEN dp.BlobUrl LIKE '%.ppt%' THEN 'powerpoint'
            WHEN dp.BlobUrl LIKE '%.jpg' OR dp.BlobUrl LIKE '%.png' OR dp.BlobUrl LIKE '%.gif' THEN 'image'
            WHEN dp.BlobUrl LIKE '%.mp4' OR dp.BlobUrl LIKE '%.avi' OR dp.BlobUrl LIKE '%.mov' THEN 'video'
            WHEN dp.BlobUrl LIKE '%.mp3' OR dp.BlobUrl LIKE '%.wav' THEN 'audio'
            WHEN dp.BlobUrl LIKE '%.zip' OR dp.BlobUrl LIKE '%.rar' THEN 'zip'
            WHEN dp.BlobUrl LIKE '%.cs' OR dp.BlobUrl LIKE '%.js' OR dp.BlobUrl LIKE '%.html' OR dp.BlobUrl LIKE '%.css' THEN 'code'
            ELSE 'text'
        END AS DocumentType,
        -- Create a snippet of content that contains the search term
        CASE 
            WHEN CHARINDEX(@SearchTerm, dp.Content) > 0 
            THEN 
                SUBSTRING(
                    dp.Content, 
                    CASE 
                        WHEN CHARINDEX(@SearchTerm, dp.Content) - 50 < 1 THEN 1 
                        ELSE CHARINDEX(@SearchTerm, dp.Content) - 50 
                    END, 
                    200
                ) 
            WHEN CHARINDEX(@SearchTerm, dp.BlobUrl) > 0 
            THEN 
                SUBSTRING(
                    dp.BlobUrl, 
                    CASE 
                        WHEN CHARINDEX(@SearchTerm, dp.BlobUrl) - 50 < 1 THEN 1 
                        ELSE CHARINDEX(@SearchTerm, dp.BlobUrl) - 50 
                    END, 
                    200
                ) 
            ELSE 
                LEFT(COALESCE(dp.Content, dp.BlobUrl, ''), 150) 
        END AS ContentSnippet
    FROM 
        DocumentationPages dp
    INNER JOIN 
        ProjectModuleMapping pmm ON dp.ProjModuleMappId = pmm.ProjModuleMappId
    INNER JOIN 
        Modules m ON pmm.ModuleId = m.ModuleId
    INNER JOIN 
        Projects p ON pmm.ProjectId = p.ProjectId
    INNER JOIN
        ProjectUsers pu ON p.ProjectId = pu.ProjectId AND pu.UserId = @UserId
    WHERE 
        (dp.PageName LIKE '%' + @SearchTerm + '%' OR dp.Content LIKE '%' + @SearchTerm + '%' OR dp.BlobUrl LIKE '%' + @SearchTerm + '%')
        AND p.IsActive = 1
    ORDER BY 
        CASE 
            WHEN dp.PageName LIKE '%' + @SearchTerm + '%' THEN 0 
            ELSE 1 
        END,
        dp.ModifiedDate DESC;
END
