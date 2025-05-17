using System;
using System.Threading.Tasks;

namespace MS_DOCS.Services.Interfaces
{
    public interface IErrorLoggingService
    {
        Task LogErrorAsync(Exception ex, string source, string additionalInfo = null);
        Task LogErrorAsync(string errorMessage, string source, string additionalInfo = null);
        Task<bool> IsProductionEnvironmentAsync();
        Task ForceLogToDatabase(Exception ex, string source, string additionalInfo = null);
        Task ForceLogToDatabase(string errorMessage, string source, string additionalInfo = null);
    }
}
