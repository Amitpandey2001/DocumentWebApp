using System.Threading.Tasks;

namespace MS_DOCS.Services.Interfaces
{
    public interface IBlobStorageService
    {
        Task<string> UploadFileAsync(string fileName, byte[] fileData, string contentType);
        Task<object> DownloadFileAsync(string fileName, bool returnAsBase64 = true, bool isSaSUri = false);
        Task<string> GenerateSasUriAsync(string fileName, int validMinutes);
        Task<string> DownloadHtmlContentAsync(string fileName, bool isSaSUri = false);
        Task<string> UpdateBlobContentAsync(string fileName, byte[] fileData, string contentType);
    }
}
