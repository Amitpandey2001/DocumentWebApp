// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

/**
 * MS-DOCS Common JavaScript Functions
 */

//// Handle dynamic content loading and Mermaid diagram refreshing
//const MS_DOCS = {
//    // Initialize Mermaid diagrams after dynamic content loading
//    refreshMermaidDiagrams: function() {
//        if (typeof window.refreshMermaidDiagrams === 'function') {
//            window.refreshMermaidDiagrams();
//        } else if (typeof mermaid !== 'undefined' && typeof mermaid.init === 'function') {
//            // Fallback if the global function isn't available
//            try {
//                setTimeout(function() {
//                    mermaid.init(undefined, document.querySelectorAll('.mermaid'));
//                }, 100);
//            } catch (e) {
//                console.error('Error refreshing mermaid diagrams:', e);
//            }
//        } else {
//            console.warn('Mermaid not available');
//        }
//    },
    
//    // Process content after AJAX loading
//    processLoadedContent: function(container) {
//        // Make external links open in new tab
//        $(container).find('a').each(function() {
//            var a = new RegExp('/' + window.location.host + '/');
//            if (!a.test(this.href)) {
//                $(this).attr("target", "_blank");
//            }
//        });
        
//        // Process mermaid code blocks if needed
//        if (typeof window.processMermaidBlocks === 'function') {
//            window.processMermaidBlocks();
//        } else {
//            // Refresh Mermaid diagrams
//            MS_DOCS.refreshMermaidDiagrams();
//        }
//    },
    
//    // Load content via AJAX and process it
//    loadContent: function(url, container, callback) {
//        $.ajax({
//            url: url,
//            type: 'GET',
//            success: function(response) {
//                $(container).html(response);
//                MS_DOCS.processLoadedContent(container);
//                if (typeof callback === 'function') {
//                    callback(response);
//                }
//            },
//            error: function(xhr, status, error) {
//                console.error('Error loading content:', error);
//                $(container).html('<div class="alert alert-danger">Error loading content</div>');
//            }
//        });
//    }
//};

//// Document ready handler
//$(document).ready(function() {
//    // Initialize any global handlers for dynamic content
//    $(document).on('content-loaded', function(e, container) {
//        MS_DOCS.processLoadedContent(container || document);
//    });
//});
