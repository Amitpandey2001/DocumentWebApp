namespace MS_DOCS.Models
{
    public class ErrorViewModel
    {
        public string? RequestId { get; set; }

        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);

        public string? ErrorMessage { get; set; }
        public bool IsProduction { get; set; }
        public string? ReferenceCode { get; set; }
    }
}
