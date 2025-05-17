using MS_DOCS.Services.Interfaces;
using System.Text;

namespace MS_DOCS.Services.Implementations
{
    public class ErrorLoggingService : IErrorLoggingService
    {
        private readonly ILogger<ErrorLoggingService> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly ISQLHelper _sqlHelper;
        private readonly string _logDirectory;

        public ErrorLoggingService(
            ILogger<ErrorLoggingService> logger,
            IWebHostEnvironment environment,
            ISQLHelper sqlHelper)
        {
            _logger = logger;
            _environment = environment;
            _sqlHelper = sqlHelper;
            _logDirectory = Path.Combine(_environment.ContentRootPath, "Logs");
            
            // Ensure log directory exists
            if (!Directory.Exists(_logDirectory))
            {
                Directory.CreateDirectory(_logDirectory);
            }
        }

        public Task<bool> IsProductionEnvironmentAsync()
        {
            return Task.FromResult(_environment.IsProduction());
        }

        public async Task ForceLogToDatabase(Exception ex, string source, string additionalInfo = null)
        {
            // Log to database regardless of environment
            await LogToDatabaseAsync(ex, source, additionalInfo);
        }

        public async Task ForceLogToDatabase(string errorMessage, string source, string additionalInfo = null)
        {
            // Log to database regardless of environment
            await LogToDatabaseAsync(errorMessage, source, additionalInfo);
        }

        public async Task LogErrorAsync(Exception ex, string source, string additionalInfo = null)
        {
            // Always log to built-in logger
            _logger.LogError(ex, $"Source: {source}, Additional Info: {additionalInfo}");
            
            // Always log to file
            //await LogToFileAsync(ex, source, additionalInfo);
            
            // Only log to database in production
            //if (await IsProductionEnvironmentAsync())
            //{
                await LogToDatabaseAsync(ex, source, additionalInfo);
            //}
        }

        public async Task LogErrorAsync(string errorMessage, string source, string additionalInfo = null)
        {
            // Always log to built-in logger
            _logger.LogError($"Error: {errorMessage}, Source: {source}, Additional Info: {additionalInfo}");
            
            // Always log to file
         //   await LogToFileAsync(errorMessage, source, additionalInfo);
            
            // Only log to database in production
          //  if (await IsProductionEnvironmentAsync())
           // {
                await LogToDatabaseAsync(errorMessage, source, additionalInfo);
          //  }
        }

        private async Task LogToFileAsync(Exception ex, string source, string additionalInfo)
        {
            string errorMessage = ex.ToString();
            await LogToFileAsync(errorMessage, source, additionalInfo);
        }

        private async Task LogToFileAsync(string errorMessage, string source, string additionalInfo)
        {
            try
            {
                string logFileName = $"error_log_{DateTime.Now:yyyyMMdd}.txt";
                string logFilePath = Path.Combine(_logDirectory, logFileName);
                
                StringBuilder sb = new StringBuilder();
                sb.AppendLine("==================================================");
                sb.AppendLine($"Timestamp: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
                sb.AppendLine($"Source: {source}");
                if (!string.IsNullOrEmpty(additionalInfo))
                {
                    sb.AppendLine($"Additional Info: {additionalInfo}");
                }
                sb.AppendLine($"Error: {errorMessage}");
                sb.AppendLine("==================================================");
                sb.AppendLine();
                
                await File.AppendAllTextAsync(logFilePath, sb.ToString());
            }
            catch (Exception fileEx)
            {
                // If we can't log to file, at least log to the built-in logger
                _logger.LogError(fileEx, "Error while logging to file");
            }
        }

        private async Task LogToDatabaseAsync(Exception ex, string source, string additionalInfo)
        {
            string errorMessage = ex.ToString();
            await LogToDatabaseAsync(errorMessage, source, additionalInfo);
        }

        private async Task LogToDatabaseAsync(string errorMessage, string source, string additionalInfo)
        {
            try
            {
                var parameters = new System.Data.SqlClient.SqlParameter[]
                {
                    new System.Data.SqlClient.SqlParameter("@ErrorMessage", errorMessage),
                    new System.Data.SqlClient.SqlParameter("@Source", source),
                    new System.Data.SqlClient.SqlParameter("@AdditionalInfo", additionalInfo ?? string.Empty),
                    new System.Data.SqlClient.SqlParameter("@CreatedDate", DateTime.Now)
                };
                
                await _sqlHelper.ExecuteNonQuerySPAsync("sp_LogError", parameters);
            }
            catch (Exception dbEx)
            {
                // If we can't log to database, at least log to the built-in logger
                _logger.LogError(dbEx, "Error while logging to database");
            }
        }
    }
}
