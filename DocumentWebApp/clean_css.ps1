$content = Get-Content 'c:\Shahbaz\Project Int new\docs.mastersofterp.com\MS-DOCS\MS-DOCS\wwwroot\css\common.css'
$filtered = $content | Where-Object { $_ -notmatch '\.search-|\.navbar-search|\.sidebar-search|\.highlight-match|\.live-search-' }
$filtered | Set-Content 'c:\Shahbaz\Project Int new\docs.mastersofterp.com\MS-DOCS\MS-DOCS\wwwroot\css\common_new.css'
