# Error Logging System for MS-DOCS

This document provides an overview of the error logging system implemented in the MS-DOCS application, specifically designed for production environments.

## Overview

The error logging system captures and logs exceptions that occur during application execution. Errors are logged to multiple destinations:

1. **Built-in ASP.NET Core Logger**: All errors are logged using the standard ILogger interface
2. **File System**: Errors are written to daily log files in the `/Logs` directory in both development and production environments
3. **Database**: Errors are stored in the `ErrorLogs` table for long-term storage and analysis (production environment only)

## Components

### 1. Error Logging Service

The `IErrorLoggingService` interface and its implementation `ErrorLoggingService` provide the core functionality:

- `LogErrorAsync(Exception ex, string source, string additionalInfo)`: Logs an exception with source information and optional context
- `LogErrorAsync(string errorMessage, string source, string additionalInfo)`: Logs a custom error message
- `IsProductionEnvironmentAsync()`: Determines if the application is running in production mode

### 2. Database Schema

The `ErrorLogs` table stores detailed error information:

- `ErrorLogId`: Primary key
- `ErrorMessage`: The full error message or exception details
- `Source`: Where the error occurred (e.g., controller.action)
- `AdditionalInfo`: Context information about the error
- `CreatedDate`: When the error occurred
- `IsResolved`: Flag indicating if the error has been addressed
- `ResolvedDate`: When the error was resolved
- `ResolvedBy`: Who resolved the error
- `ResolutionNotes`: Notes about how the error was resolved

### 3. Enhanced Error Page

The error page has been updated to:

- Show a user-friendly message in production
- Display a reference code for support purposes
- Show detailed error information in development environments

## How to Use

### In Controllers

```csharp
public class SomeController : Controller
{
    private readonly IErrorLoggingService _errorLoggingService;
    
    public SomeController(IErrorLoggingService errorLoggingService)
    {
        _errorLoggingService = errorLoggingService;
    }
    
    public async Task<IActionResult> SomeAction()
    {
        try
        {
            // Your code here
            return View();
        }
        catch (Exception ex)
        {
            await _errorLoggingService.LogErrorAsync(
                ex, 
                "SomeController.SomeAction", 
                $"User: {User.Identity.Name}"
            );
            throw; // Let the global error handler handle it
        }
    }
}
```

### In Services

```csharp
public class SomeService
{
    private readonly IErrorLoggingService _errorLoggingService;
    
    public SomeService(IErrorLoggingService errorLoggingService)
    {
        _errorLoggingService = errorLoggingService;
    }
    
    public async Task DoSomethingAsync()
    {
        try
        {
            // Your code here
        }
        catch (Exception ex)
        {
            await _errorLoggingService.LogErrorAsync(
                ex, 
                "SomeService.DoSomethingAsync"
            );
            throw; // Rethrow to let the caller handle it
        }
    }
}
```

## Log File Location

Error logs are stored in the `Logs` directory in the application root, with filenames in the format `error_log_YYYYMMDD.txt`.

## Database Setup

Before using the error logging system, ensure you have run the SQL script `ErrorLogging.sql` to create the necessary table and stored procedure.

## Viewing Logs

### File Logs

You can view the log files directly in the `Logs` directory.

### Database Logs

You can query the `ErrorLogs` table to view and analyze errors:

```sql
-- View recent errors
SELECT TOP 100 
    ErrorLogId, 
    ErrorMessage, 
    Source, 
    CreatedDate,
    IsResolved
FROM ErrorLogs
ORDER BY CreatedDate DESC

-- View unresolved errors
SELECT * FROM ErrorLogs WHERE IsResolved = 0

-- Mark an error as resolved
UPDATE ErrorLogs 
SET 
    IsResolved = 1, 
    ResolvedDate = GETDATE(), 
    ResolvedBy = 'YourName', 
    ResolutionNotes = 'Fixed by...'
WHERE ErrorLogId = @ErrorId
```

## Best Practices

1. Always include meaningful source information (typically ClassName.MethodName)
2. Include relevant context in the additionalInfo parameter
3. For sensitive operations, consider logging before and after the operation
4. Review logs regularly to identify patterns and recurring issues

## Testing the Error Logging System

To verify that the error logging system is working correctly, you can use the test endpoints provided in the `TestController`:

### 1. Test Error Logging (Caught Exception)

Make a GET request to `/api/test/test-error-logging`. This endpoint:
- Deliberately throws an exception
- Catches it and logs it using the error logging service
- Forces a database log entry regardless of environment
- Returns a success response with information about where to find the logs

This test verifies that manually logged exceptions are properly recorded in both file and database.

### 2. Test Error Page (Uncaught Exception)

Make a GET request to `/api/test/test-error-page`. This endpoint:
- Throws an exception that is not caught
- Triggers the global exception handler
- Redirects to the error page

This test verifies that the global exception handler is working and that uncaught exceptions are properly logged.

### 3. Test Database Logging Directly

Make a GET request to `/api/test/test-db-logging`. This endpoint:
- Tests the database connection
- Checks if the required stored procedure exists
- Creates a helper stored procedure if needed
- Attempts to log directly to the database
- Returns detailed diagnostic information

This test helps identify issues with database logging by providing specific error messages and connection status.

### Verification Steps

After running these tests, check the following:

1. **File Logs**: Look in the `/Logs` directory for the current day's log file (`error_log_YYYYMMDD.txt`). It should contain entries for both test exceptions.

2. **Database Logs**: Query the `ErrorLogs` table:
   ```sql
   SELECT TOP 10 * FROM ErrorLogs ORDER BY CreatedDate DESC
   ```

3. **Error Page**: The second test should display the error page with the appropriate error message and reference code.

### Troubleshooting Database Logging

If entries are not appearing in the database:

1. **Check Database Connection**: Ensure the connection string in `appsettings.json` is correct.

2. **Verify SQL Script Execution**: Make sure you've run the `ErrorLogging.sql` script to create the table and stored procedure.

3. **Run Direct Database Test**: Use the `/api/test/test-db-logging` endpoint to get detailed diagnostic information.

4. **Check SQL Server Logs**: Look for any errors related to the `sp_LogError` stored procedure.

5. **Verify Table Structure**: Ensure the `ErrorLogs` table has the correct columns as defined in the SQL script.

If all these checks pass, your error logging system is working correctly.
