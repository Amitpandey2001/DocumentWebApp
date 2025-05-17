/**
 * Global Loader Management
 * Handles showing/hiding the loader during AJAX requests and page loads
 */

// Track AJAX requests that should not show the global loader
const excludedAjaxUrls = [
    '/Project/GetUserProjects',
    '/Project/GetProjectModules',
    '/Documentation/GetModulePages'
];

// Initialize the loader when the DOM is ready
$(document).ready(function() {
    // Hide the loader when the page is fully loaded
    $(window).on('load', function() {
        hideLoader();
    });

    // Show loader on page unload (navigation)
    $(window).on('beforeunload', function() {
        showLoader();
    });

    // Handle AJAX requests - with exclusions for sidebar operations
    $(document).ajaxSend(function(event, jqXHR, ajaxOptions) {
        // Check if the request URL is in the excluded list
        const isExcluded = excludedAjaxUrls.some(url => 
            ajaxOptions.url && ajaxOptions.url.includes(url)
        );
        
        // Only show the loader for non-excluded requests
        if (!isExcluded) {
            showLoader();
        }
    });

    $(document).ajaxStop(function() {
        hideLoader();
    });

    // Hide loader initially if the page is already loaded
    if (document.readyState === 'complete') {
        hideLoader();
    }
});

/**
 * Shows the global loader
 */
function showLoader() {
    $('#global-loader').removeClass('hidden');
}

/**
 * Hides the global loader with a smooth transition
 */
function hideLoader() {
    $('#global-loader').addClass('hidden');
}

/**
 * Shows the loader for a specific container
 * @param {string} containerId - The ID of the container to show loader in
 */
function showContainerLoader(containerId) {
    const container = $(containerId);
    if (container.length) {
        container.html(`
            <div class="container-loader">
                <div class="loader-circle"></div>
                <div class="loader-circle"></div>
                <div class="loader-circle"></div>
                <span class="loader-text">Loading...</span>
            </div>
        `);
    }
}

/**
 * Manual control functions for specific operations
 */
const Loader = {
    show: showLoader,
    hide: hideLoader,
    showInContainer: showContainerLoader
};
