using Microsoft.AspNetCore.Mvc;
using MS_DOCS.Services.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace MS_DOCS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        private readonly IErrorLoggingService _errorLoggingService;
        private readonly ISQLHelper _sqlHelper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<TestController> _logger;

        public TestController(
            IErrorLoggingService errorLoggingService,
            ISQLHelper sqlHelper,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<TestController> logger)
        {
            _errorLoggingService = errorLoggingService;
            _sqlHelper = sqlHelper;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        [HttpGet("test-error-logging")]
        public async Task<IActionResult> TestErrorLogging()
        {
            try
            {
                // Deliberately throw an exception
                throw new Exception("This is a test exception to verify error logging");
            }
            catch (Exception ex)
            {
                // Log the error to file
                await _errorLoggingService.LogErrorAsync(ex, "TestController.TestErrorLogging", "Test additional info");
                
                // Force log to database regardless of environment
                await _errorLoggingService.ForceLogToDatabase(ex, "TestController.TestErrorLogging", "Test database logging");
                
                // Return a success message to indicate the test was performed
                return Ok(new { 
                    message = "Error logging test completed. Check the logs to verify.", 
                    logFileLocation = Path.Combine(Directory.GetCurrentDirectory(), "Logs", $"error_log_{DateTime.Now:yyyyMMdd}.txt"),
                    isProduction = await _errorLoggingService.IsProductionEnvironmentAsync(),
                    databaseLoggingForced = true
                });
            }
        }

        [HttpGet("test-error-page")]
        public IActionResult TestErrorPage()
        {
            // This will trigger the global error handler
            throw new Exception("This is a test exception to verify the error page");
        }

        [HttpGet("test-db-logging")]
        public async Task<IActionResult> TestDatabaseLogging()
        {
            try
            {
                // 1. Test direct database access
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                bool canConnectToDb = false;
                string dbError = null;
                
                try
                {
                    using (var connection = new SqlConnection(connectionString))
                    {
                        await connection.OpenAsync();
                        canConnectToDb = true;
                    }
                }
                catch (Exception ex)
                {
                    dbError = ex.Message;
                }

                // 2. Test stored procedure existence
                bool spExists = false;
                try
                {
                    var parameters = new SqlParameter[]
                    {
                        new SqlParameter("@ProcedureName", "sp_LogError")
                    };
                    
                    var result = await _sqlHelper.ExecuteScalarSPAsync<int>("sp_CheckProcedureExists", parameters);
                    spExists = result > 0;
                }
                catch (Exception)
                {
                    // If the sp_CheckProcedureExists doesn't exist, we'll create it
                    spExists = false;
                }

                // 3. Create test procedure if needed
                if (!spExists)
                {
                    try
                    {
                        using (var connection = new SqlConnection(connectionString))
                        {
                            await connection.OpenAsync();
                            using (var command = connection.CreateCommand())
                            {
                                command.CommandText = @"
                                    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckProcedureExists]') AND type in (N'P'))
                                    BEGIN
                                        EXEC('
                                        CREATE PROCEDURE [dbo].[sp_CheckProcedureExists]
                                            @ProcedureName NVARCHAR(128)
                                        AS
                                        BEGIN
                                            SELECT COUNT(*) FROM sys.objects 
                                            WHERE object_id = OBJECT_ID(N''[dbo].[''+@ProcedureName+'']'') AND type in (N''P'')
                                        END
                                        ')
                                    END";
                                await command.ExecuteNonQueryAsync();
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        return BadRequest(new { message = "Failed to create check procedure", error = "A database error occurred. Check the logs for details." });
                    }
                }

                // 4. Force a direct database log entry
                try
                {
                    var parameters = new SqlParameter[]
                    {
                        new SqlParameter("@ErrorMessage", "Test error message from direct database test"),
                        new SqlParameter("@Source", "TestController.TestDatabaseLogging"),
                        new SqlParameter("@AdditionalInfo", "Direct database test"),
                        new SqlParameter("@CreatedDate", DateTime.Now)
                    };
                    
                    await _sqlHelper.ExecuteNonQuerySPAsync("sp_LogError", parameters);
                    
                    return Ok(new
                    {
                        message = "Database logging test completed",
                        databaseConnection = new { success = canConnectToDb, error = dbError != null ? "Connection error" : null },
                        storedProcedureExists = spExists,
                        directLogAttempted = true
                    });
                }
                catch (Exception ex)
                {
                    return BadRequest(new
                    {
                        message = "Failed to log directly to database",
                        error = "A database error occurred. Check the logs for details.",
                        databaseConnection = new { success = canConnectToDb, error = dbError != null ? "Connection error" : null },
                        storedProcedureExists = spExists
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Test failed", error = "An internal server error occurred" });
            }
        }

        [HttpGet]
        [Route("api/test/auth-diagnostics")]
        public IActionResult AuthDiagnostics()
        {
            try
            {
                var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
                var username = User.Identity?.Name;
                var claims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList();
                var roles = User.Claims
                    .Where(c => c.Type == ClaimTypes.Role)
                    .Select(c => c.Value)
                    .ToList();

                return Ok(new
                {
                    isAuthenticated,
                    username,
                    claims,
                    roles,
                    environment = _environment.EnvironmentName,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in auth diagnostics");
                return StatusCode(500, new { message = "Error running auth diagnostics", error = "An internal server error occurred" });
            }
        }
    }
}
