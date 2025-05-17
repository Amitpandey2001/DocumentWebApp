using System;

namespace MS_DOCS.Models
{
    /// <summary>
    /// Represents a document search result item
    /// </summary>
    public class DocumentSearchResult
    {
        /// <summary>
        /// The ID of the document
        /// </summary>
        public int DocumentId { get; set; }

        /// <summary>
        /// The title of the document
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// A snippet of the document content that matches the search query
        /// </summary>
        public string Snippet { get; set; }

        /// <summary>
        /// The URL to view the document
        /// </summary>
        public string Url { get; set; }

        /// <summary>
        /// The path to the document within the project/module structure
        /// </summary>
        public string Path { get; set; }

        /// <summary>
        /// The CSS icon class to represent the document type
        /// </summary>
        public string Icon { get; set; }

        /// <summary>
        /// The name of the project the document belongs to
        /// </summary>
        public string ProjectName { get; set; }

        /// <summary>
        /// The name of the module the document belongs to
        /// </summary>
        public string ModuleName { get; set; }

        /// <summary>
        /// The last modified date of the document
        /// </summary>
        public DateTime LastModified { get; set; }
    }
}
