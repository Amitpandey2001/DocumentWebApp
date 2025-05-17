/**
 * MS-DOCS Search Functionality
 * Handles the global document search feature
 */

const DocumentSearch = {
    init: function() {
        this.searchInput = $('#globalDocumentSearch');
        //this.searchButton = $('#searchButton');
        this.clearButton = $('#clearSearch');
        this.searchResultsContainer = $('#searchResultsContainer');
        this.searchResults = $('#searchResults');
        this.resultCount = $('#resultCount');
        this.debounceTimeout = null;
        this.minSearchLength = 3;
        this.currentSelectedIndex = -1;
        this.resultItems = [];
        
        this.bindEvents();
    },
    
    bindEvents: function() {
        const self = this;
        
        // Search input keyup event with debounce
        this.searchInput.on('keyup', function(e) {
            const query = $(this).val().trim();
            
            // Show/hide clear button based on input content
            if (query.length > 0) {
                self.clearButton.removeClass('d-none');
            } else {
                self.clearButton.addClass('d-none');
            }
            
            // Skip for navigation keys
            if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13) {
                return;
            }
            
            clearTimeout(self.debounceTimeout);
            
            if (query.length === 0) {
                self.hideResults();
                return;
            }
            
            if (query.length < self.minSearchLength) {
                self.searchInput.val(query);
                return;
            }
            
            self.debounceTimeout = setTimeout(function() {
                self.performSearch(query);
            }, 300);
        });
        
        // Handle keyboard navigation in search results
        this.searchInput.on('keydown', function(e) {
            if (!self.searchResultsContainer.hasClass('d-none')) {
                const resultItems = self.searchResults.find('.search-result-item');
                
                // Down arrow
                if (e.keyCode === 40) {
                    e.preventDefault();
                    if (self.currentSelectedIndex < resultItems.length - 1) {
                        self.currentSelectedIndex++;
                        self.highlightResult(resultItems);
                    }
                }
                
                // Up arrow
                if (e.keyCode === 38) {
                    e.preventDefault();
                    if (self.currentSelectedIndex > 0) {
                        self.currentSelectedIndex--;
                        self.highlightResult(resultItems);
                    }
                }
                
                // Enter key
                if (e.keyCode === 13 && self.currentSelectedIndex >= 0) {
                    e.preventDefault();
                    const selectedItem = resultItems.eq(self.currentSelectedIndex);
                    const link = selectedItem.find('a').attr('href');
                    if (link) {
                        window.location.href = link;
                    }
                }
            } else if (e.keyCode === 13) {
                const query = $(this).val().trim();
                if (query.length >= self.minSearchLength) {
                    e.preventDefault();
                    self.performSearch(query);
                }
            }
        });
        
        // Search button click event
        //this.searchButton.on('click', function() {
        //    const query = self.searchInput.val().trim();
        //    if (query.length >= self.minSearchLength) {
        //        self.performSearch(query);
        //    }
        //});
        
        // Clear button click event
        this.clearButton.on('click', function() {
            self.searchInput.val('').focus();
            self.clearButton.addClass('d-none');
            self.hideResults();
            
            // Clear any "No results found" message that might be displayed
            $('#globalDocumentSearch').attr('placeholder', 'Search documents...');
        });
        
        // Hide search results when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.navbar-search').length) {
                self.hideResults();
            }
        });
        
        // Prevent hiding when clicking inside results
        this.searchResultsContainer.on('click', function(e) {
            e.stopPropagation();
        });
        
        // Close button in header
        $(document).on('click', '.search-close-btn', function(e) {
            self.hideResults();
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Handle Escape key to close search results
        $(document).on('keydown', function(e) {
            if (e.keyCode === 27 && !self.searchResultsContainer.hasClass('d-none')) { // Escape key
                self.hideResults();
                e.preventDefault();
            }
        });
    },
    
    highlightResult: function(resultItems) {
        resultItems.removeClass('search-result-active');
        if (this.currentSelectedIndex >= 0) {
            resultItems.eq(this.currentSelectedIndex).addClass('search-result-active');
            
            // Scroll into view if needed
            const activeItem = resultItems.eq(this.currentSelectedIndex);
            const container = this.searchResultsContainer;
            
            const itemTop = activeItem.position().top;
            const itemBottom = itemTop + activeItem.outerHeight();
            const containerTop = 0;
            const containerBottom = container.height();
            
            if (itemTop < containerTop) {
                container.scrollTop(container.scrollTop() + itemTop - 10);
            } else if (itemBottom > containerBottom) {
                container.scrollTop(container.scrollTop() + itemBottom - containerBottom + 10);
            }
        }
    },
    
    performSearch: function(query) {
        const self = this;
        
        // Reset selected index
        this.currentSelectedIndex = -1;
        
        // Show loading indicator with animation
        this.searchResults.html(`
            <div class="search-loading">
                <div class="search-loading-animation">
                    <div class="search-loading-dot"></div>
                    <div class="search-loading-dot"></div>
                    <div class="search-loading-dot"></div>
                </div>
                <p class="mb-0 mt-3">Searching for "${query}"...</p>
            </div>
        `);
        this.searchResultsContainer.removeClass('d-none');
        
        // Make AJAX request to search endpoint
        $.ajax({
            url: '/Documentation/SearchDocuments',
            type: 'GET',
            data: { query: query },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    self.displayResults(response.data, query);
                } else {
                    self.searchResults.html(`
                        <div class="search-error">
                            <i class="bi bi-exclamation-triangle text-warning fs-4"></i>
                            <p class="mb-0 mt-2">${response.message || 'An error occurred while searching.'}</p>
                        </div>
                    `);
                }
            },
            error: function(xhr, status, error) {
                self.searchResults.html(`
                    <div class="search-error">
                        <i class="bi bi-exclamation-triangle text-warning fs-4"></i>
                        <p class="mb-0 mt-2">An error occurred while searching. Please try again later.</p>
                    </div>
                `);
                
                console.error('Search error:', error);
            }
        });
    },
    
    displayResults: function(results, query) {
        // Update result count
        this.resultCount.text(results.length);
        
        if (results.length === 0) {
            this.searchResults.html(`
                <div class="search-no-results">
                    <i class="bi bi-search text-muted fs-4"></i>
                    <p class="mb-0 mt-2">No results found for "${query}"</p>
                    <p class="text-muted small">Try different keywords or check your spelling</p>
                    <div class="search-suggestions mt-3">
                        <p class="mb-1 fw-medium">Suggestions:</p>
                        <ul class="ps-3 mb-0">
                            <li>Check your spelling</li>
                            <li>Try more general keywords</li>
                            <li>Try different keywords</li>
                        </ul>
                    </div>
                </div>
            `);
            return;
        }
        
        let html = '<div class="search-results-list">';
        
        results.forEach(function(result) {
            // Ensure all properties have default values if they're undefined
            const title = result.title || 'Untitled Document';
            const path = result.path || '';
            const snippet = result.snippet || 'No preview available';
            const url = result.url || '#';
            const icon = result.icon || 'bi-file-text';
            
            html += `
                <div class="search-result-item">
                    <a href="${url}" class="search-result-link">
                        <div class="d-flex align-items-center mb-1">
                            <i class="bi ${icon} me-2 text-primary"></i>
                            <h6 class="mb-0">${this.highlightText(title, query)}</h6>
                        </div>
                        <div class="search-result-path text-muted small mb-1">
                            <i class="bi bi-folder me-1"></i>${path}
                        </div>
                    </a>
                </div>
            `;
        }, this);
        
        html += '</div>';
        
        this.searchResults.html(html);
        
        // Store reference to result items for keyboard navigation
        this.resultItems = this.searchResults.find('.search-result-item');
    },
    
    hideResults: function() {
        this.searchResultsContainer.addClass('d-none');
        this.searchResults.html('');
        this.resultCount.text('0');
        this.currentSelectedIndex = -1;
    },
    
    // Helper function to highlight search terms in text
    highlightText: function(text, query) {
        if (!text) return '';
        
        const words = query.split(' ').filter(word => word.length > 0);
        let result = text;
        
        words.forEach(function(word) {
            const regex = new RegExp('(' + word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
            result = result.replace(regex, '<span class="highlight-match">$1</span>');
        });
        
        return result;
    }
};

// Initialize search functionality when document is ready
$(document).ready(function() {
    DocumentSearch.init();
    
    // Add keyboard shortcut (Ctrl+K or Cmd+K) to focus search
    $(document).on('keydown', function(e) {
        // Check if Ctrl+K or Cmd+K is pressed
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 75) {
            e.preventDefault();
            $('#globalDocumentSearch').focus();
        }
    });
});
