$(document).ready(function () {
    // Add overlay div for mobile sidebar
    $('body').append('<div class="sidebar-overlay"></div>');

    // Restore sidebar state from localStorage
    const sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (sidebarCollapsed) {
        $('.sidebar').addClass('collapsed');
        $('body').addClass('sidebar-collapsed');
        $('#sidebarToggle').html('<i class="bi bi-layout-sidebar"></i>');
    }
    
    // Toggle sidebar on button click
    $('#sidebarToggle').on('click', function() {
        $('.sidebar').toggleClass('collapsed');
        $('body').toggleClass('sidebar-collapsed');
        
        // Update icon
        if ($('.sidebar').hasClass('collapsed')) {
            $(this).html('<i class="bi bi-layout-sidebar"></i>');
            localStorage.setItem('sidebar_collapsed', 'true');
        } else {
            $(this).html('<i class="bi bi-layout-sidebar-inset"></i>');
            localStorage.setItem('sidebar_collapsed', 'false');
        }
    });
    
    // Close mobile navbar when clicking outside
    $(document).on('click', function(e) {
        // If navbar is expanded and click is outside navbar
        if ($('.navbar-collapse').hasClass('show') && 
            !$(e.target).closest('.navbar-collapse').length && 
            !$(e.target).closest('.navbar-toggler').length) {
            $('.navbar-toggler').click();
        }
    });
    
    // Fix for flyout menus in collapsed sidebar
    $(document).on('mouseenter', '.sidebar.collapsed .project-item', function() {
        const moduleList = $(this).next('.module-list');
        if (moduleList.length) {
            // Store original display state to restore later
            moduleList.data('original-display', moduleList.css('display'));
            moduleList.css('display', 'block');
            
            // Load modules if they haven't been loaded yet
            const projectId = $(this).data('id');
            const projectName = $(this).data('name');
            if (moduleList.find('.loading-modules').length > 0) {
                loadProjectModules(projectId, projectName);
            }
        }
    });
    
    $(document).on('mouseleave', '.sidebar.collapsed .project-item', function() {
        const moduleList = $(this).next('.module-list');
        if (!moduleList.is(':hover')) {
            // Only hide if the mouse isn't over the module list
            moduleList.css('display', moduleList.data('original-display') || 'none');
        }
    });
    
    $(document).on('mouseleave', '.sidebar.collapsed .module-list', function() {
        if (!$(this).prev('.project-item').is(':hover')) {
            // Only hide if the mouse isn't over the project item
            $(this).css('display', $(this).data('original-display') || 'none');
        }
    });
    
    // Similar handling for module items and page lists
    $(document).on('mouseenter', '.sidebar.collapsed .module-item', function() {
        const pageList = $(this).next('.page-list');
        if (pageList.length) {
            pageList.data('original-display', pageList.css('display'));
            pageList.css('display', 'block');
        }
    });
    
    $(document).on('mouseleave', '.sidebar.collapsed .module-item', function() {
        const pageList = $(this).next('.page-list');
        if (!pageList.is(':hover')) {
            pageList.css('display', pageList.data('original-display') || 'none');
        }
    });
    
    $(document).on('mouseleave', '.sidebar.collapsed .page-list', function() {
        if (!$(this).prev('.module-item').is(':hover')) {
            $(this).css('display', $(this).data('original-display') || 'none');
        }
    });
    
    // Load projects for both desktop and mobile views
    loadUserProjects();
    
    // Refresh projects when clicking the refresh button
    $('#refreshProjects').on('click', function(e) {
        e.preventDefault();
        loadUserProjects();
    });
});

// Load user projects for both desktop and mobile views
function loadUserProjects() {
    console.log('Loading user projects...');
    
    // Show loading indicators
    $('#projectsList, #mobileProjectsList').html(`
        <div class="text-center py-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="small text-muted mt-2 mb-0">Loading projects...</p>
        </div>
    `);
    
    $.ajax({
        url: '/Project/GetUserProjects',
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            console.log('Projects response:', response);
            if (response.success) {
                // Render projects separately for desktop and mobile
                renderProjects(response.data, '#projectsList');
                renderProjects(response.data, '#mobileProjectsList');
                console.log('Projects rendered for desktop and mobile');
            } else {
                showErrorMessage('#projectsList', response.message || 'Failed to load projects');
                showErrorMessage('#mobileProjectsList', response.message || 'Failed to load projects');
                console.error('Failed to load projects:', response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading projects:', error);
            showErrorMessage('#projectsList', 'An error occurred while loading projects');
            showErrorMessage('#mobileProjectsList', 'An error occurred while loading projects');
        }
    });
}

// Render projects to the specified container
function renderProjects(projects, containerId) {
    console.log(`Rendering projects to ${containerId}`, projects);
    const container = $(containerId);
    
    if (!container.length) {
        console.error(`Container not found: ${containerId}`);
        return;
    }
    
    if (!projects || projects.length === 0) {
        container.html(`
            <div class="empty-state p-3">
                <p class="text-muted small mb-0">No projects available</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    
    projects.forEach(function(project) {
        const isActive = project.isActive;
        const statusClass = isActive ? 'text-success' : 'text-muted';
        const statusIcon = isActive ? 'bi-check-circle-fill' : 'bi-dash-circle-fill';
        
        html += `
            <div class="project-section">
                <div class="project-item d-flex align-items-center" data-id="${project.projectId}" data-name="${project.projectName}">
                    <i class="bi bi-folder me-2"></i>
                    <span class="project-name flex-grow-1">${project.projectName}</span>
                    <i class="bi ${statusIcon} ${statusClass} small ms-1"></i>
                    <i class="bi bi-chevron-right project-expand-icon"></i>
                </div>
                <div class="module-list" style="display: none;">
                    <div class="loading-modules p-2">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <span class="small">Loading modules...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
    console.log(`Projects HTML rendered to ${containerId}`);
    
    // Add click handler for project items
    $(`${containerId} .project-item`).on('click', function() {
        console.log(`Project item clicked in ${containerId}`);
        const projectId = $(this).data('id');
        const projectName = $(this).data('name');
        const moduleList = $(this).next('.module-list');
        
        // Toggle module list visibility
        moduleList.slideToggle(200);
        $(this).find('.project-expand-icon').toggleClass('rotated');
        
        // Load modules if they haven't been loaded yet
        if (moduleList.find('.loading-modules').length > 0) {
            loadProjectModules(projectId, projectName);
        }
    });
}

// Load modules for a project
function loadProjectModules(projectId, projectName) {
    console.log(`Loading modules for project ${projectId}: ${projectName}`);
    const moduleList = $(`.project-item[data-id="${projectId}"]`).next('.module-list');
    
    if (!moduleList.length) {
        console.error(`Module list container not found for project ${projectId}`);
        return;
    }
    
    // Show loading indicator
    moduleList.html(`
        <div class="loading-modules p-2">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="small">Loading modules...</span>
            </div>
        </div>
    `);
    
    $.ajax({
        url: '/Project/GetProjectModules',
        type: 'GET',
        data: { projectId: projectId },
        dataType: 'json',
        success: function(response) {
            console.log(`Modules response for project ${projectId}:`, response);
            if (response.success) {
                renderModules(response.data, moduleList, projectId, projectName);
            } else {
                moduleList.html(`
                    <div class="p-2">
                        <div class="alert alert-warning py-2 px-3 mb-0 small">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            ${response.message || 'Failed to load modules'}
                        </div>
                    </div>
                `);
                console.error(`Failed to load modules for project ${projectId}:`, response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error(`Error loading modules for project ${projectId}:`, error);
            moduleList.html(`
                <div class="p-2">
                    <div class="alert alert-danger py-2 px-3 mb-0 small">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        An error occurred while loading modules
                    </div>
                </div>
            `);
        }
    });
}

// Render modules for a project
function renderModules(modules, moduleList, projectId, projectName) {
    if (!modules || modules.length === 0) {
        moduleList.html(`
            <div class="empty-state p-3">
                <p class="text-muted small mb-0">No modules available</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    
    modules.forEach(function(module) {
        html += `
            <div class="module-section">
                <div class="module-item d-flex align-items-center" data-id="${module.moduleId}" data-name="${module.moduleName}" data-project-id="${projectId}">
                    <i class="bi bi-journal-text me-2"></i>
                    <span class="module-name flex-grow-1">${module.moduleName}</span>
                    <i class="bi bi-chevron-right module-expand-icon"></i>
                </div>
                <div class="page-list" style="display: none;">
                    <div class="loading-pages p-2">
                        <div class="d-flex align-items-center">
                            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <span class="small">Loading pages...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    moduleList.html(html);
    
    // Add click handler for module items
    moduleList.find('.module-item').on('click', function() {
        const moduleId = $(this).data('id');
        const moduleName = $(this).data('name');
        const projectId = $(this).data('project-id');
        const pageList = $(this).next('.page-list');
        
        // Toggle page list visibility
        pageList.slideToggle(200);
        $(this).find('.module-expand-icon').toggleClass('rotated');
        
        // Load pages if they haven't been loaded yet
        if (pageList.find('.loading-pages').length > 0) {
            loadModulePages(moduleId, moduleName, projectId, pageList);
        }
    });
}

// Load pages for a module
function loadModulePages(moduleId, moduleName, projectId, pageList) {
    console.log(`Loading pages for module ${moduleId}: ${moduleName}`);
    
    if (!pageList.length) {
        console.error(`Page list container not found for module ${moduleId}`);
        return;
    }
    
    // Show loading indicator
    pageList.html(`
        <div class="loading-pages p-2">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span class="small">Loading pages...</span>
            </div>
        </div>
    `);
    
    $.ajax({
        url: '/Documentation/GetModulePages',
        type: 'GET',
        data: { moduleId: moduleId },
        dataType: 'json',
        success: function(response) {
            console.log(`Pages response for module ${moduleId}:`, response);
            if (response.success) {
                renderPages(response.data, pageList);
            } else {
                pageList.html(`
                    <div class="p-2">
                        <div class="alert alert-warning py-2 px-3 mb-0 small">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            ${response.message || 'Failed to load pages'}
                        </div>
                    </div>
                `);
                console.error(`Failed to load pages for module ${moduleId}:`, response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error(`Error loading pages for module ${moduleId}:`, error);
            pageList.html(`
                <div class="p-2">
                    <div class="alert alert-danger py-2 px-3 mb-0 small">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        An error occurred while loading pages
                    </div>
                </div>
            `);
        }
    });
}

// Render pages for a module
function renderPages(pages, pageList) {
    if (!pages || pages.length === 0) {
        pageList.html(`
            <div class="empty-state p-3">
                <p class="text-muted small mb-0">No pages available</p>
            </div>
        `);
        return;
    }
    
    let html = '<ul class="nav flex-column page-nav">';
    
    pages.forEach(function(page) {
        html += `
            <li class="nav-item">
                <a class="nav-link page-link" href="/Documentation/View/${page.pageId}">
                    <i class="bi bi-file-text me-2"></i>
                    <span>${page.pageName}</span>
                </a>
            </li>
        `;
    });
    
    html += '</ul>';
    
    pageList.html(html);
}

// Show error message in container
function showErrorMessage(containerId, message) {
    $(containerId).html(`
        <div class="p-2">
            <div class="alert alert-danger py-2 px-3 mb-0 small">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                ${message}
            </div>
        </div>
    `);
}

// Global variables for pagination
let allProjects = [];
let allModules = {};
let allPages = {}; // Will now use composite keys: projectId_moduleId
let allDocuments = []; // For global search
let filteredProjects = [];
const itemsPerPage = 20;
let currentProjectPage = 1;
let userManuallyClosedProject = {}; // Track which projects were manually closed by user
let userManuallyClosedModule = {}; // Track which modules were manually closed by user using composite keys
let pendingRequests = {}; // Track pending AJAX requests to prevent duplicates
let lastRefreshTime = 0; // Track when data was last refreshed
const REFRESH_THRESHOLD = 300000; // 5 minutes in milliseconds

// Function to check and expand the path to the active page
function checkAndExpandActivePagePath() {
    // Only auto-expand if we're on a documentation view page
    const currentPageId = getCurrentPageIdFromUrl();
    
    // If we're not on a documentation page, don't auto-expand anything
    if (!currentPageId) {
        return;
    }
    
    // Store the active page ID
    localStorage.setItem('active_page_id', currentPageId);
    
    // Get stored page info
    const pageInfo = JSON.parse(localStorage.getItem('page_info_' + currentPageId) || '{}');
    
    if (!pageInfo.projectId || !pageInfo.moduleId) {
        return;
    }
    
    // Don't expand if user manually closed this project
    if (userManuallyClosedProject[pageInfo.projectId]) {
        return;
    }
    
    // We need to wait for projects to load first - use a single interval with clear logic
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loops
    
    const checkAndExpandInterval = setInterval(function() {
        attempts++;
        
        // Stop trying after max attempts
        if (attempts >= maxAttempts) {
            clearInterval(checkAndExpandInterval);
            return;
        }
        
        // Check if projects are loaded
        if (allProjects.length > 0) {
            clearInterval(checkAndExpandInterval);
            expandProject();
        }
    }, 100);
    
    // Function to expand the project once projects are loaded
    function expandProject() {
        // Find the project in the current page
        const projectElement = $(`.project-item[data-id="${pageInfo.projectId}"]`);
        if (!projectElement.length) {
            return;
        }
        
        // Expand the project
        const projectModuleList = $('#project-' + pageInfo.projectId);
        const projectToggleIcon = projectElement.find('.toggle-icon');
        
        // Close any other open projects
        $('.module-list.show').not(projectModuleList).each(function() {
            const otherToggleIcon = $(this).prev('.project-item').find('.toggle-icon');
            otherToggleIcon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
            $(this).collapse('hide');
            const otherId = $(this).attr('id').replace('project-', '');
            localStorage.setItem('project_' + otherId, 'collapsed');
        });
        
        // Expand this project
        projectModuleList.collapse('show');
        projectToggleIcon.removeClass('bi-chevron-right').addClass('bi-chevron-down');
        localStorage.setItem('project_' + pageInfo.projectId, 'expanded');
        
        // Load modules if not already loaded and not already loading
        if (!pendingRequests['modules_' + pageInfo.projectId] && 
            !allModules[pageInfo.projectId] && 
            projectModuleList.find('.module-item').length === 0 && 
            projectModuleList.find('.no-modules').length === 0) {
            loadProjectModules(pageInfo.projectId, projectElement.data('name'));
        }
        
        // Check if modules are already loaded or wait for them to load
        if (allModules[pageInfo.projectId]) {
            expandModule();
        } else {
            // Wait for modules to load
            let moduleAttempts = 0;
            const maxModuleAttempts = 30;
            const checkModulesInterval = setInterval(function() {
                moduleAttempts++;
                if (moduleAttempts >= maxModuleAttempts || allModules[pageInfo.projectId]) {
                    clearInterval(checkModulesInterval);
                    if (allModules[pageInfo.projectId]) {
                        expandModule();
                    }
                }
            }, 100);
        }
    }
    
    // Function to expand the module once modules are loaded
    function expandModule() {
        // Find the module in the expanded project
        const moduleElement = $(`.module-item[data-id="${pageInfo.moduleId}"][data-project-id="${pageInfo.projectId}"]`);
        if (!moduleElement.length) {
            return;
        }
        
        // Create composite key for module
        const compositeModuleKey = `${pageInfo.projectId}_${pageInfo.moduleId}`;
        
        // Don't expand if user manually closed this module
        if (userManuallyClosedModule[compositeModuleKey]) {
            return;
        }
        
        // Expand the module
        const modulePageList = $(`#module-${compositeModuleKey}`);
        const moduleToggleIcon = moduleElement.find('.toggle-icon');
        
        // Close any other open modules in this project
        const projectContainer = moduleElement.closest('.modules-container');
        projectContainer.find('.page-list.show').not(modulePageList).each(function() {
            const otherToggleIcon = $(this).prev('.module-item').find('.toggle-icon');
            otherToggleIcon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
            $(this).collapse('hide');
            const otherId = $(this).attr('id').replace('module-', '');
            localStorage.setItem('module_' + otherId, 'collapsed');
        });
        
        // Expand this module
        modulePageList.collapse('show');
        moduleToggleIcon.removeClass('bi-chevron-right').addClass('bi-chevron-down');
        localStorage.setItem('module_' + compositeModuleKey, 'expanded');
        
        // Load pages if not already loaded and not already loading
        const compositeKey = `${pageInfo.projectId}_${pageInfo.moduleId}`;
        if (!pendingRequests['pages_' + compositeKey] && 
            !allPages[compositeKey] && 
            modulePageList.find('.page-item').length === 0 && 
            modulePageList.find('.no-pages').length === 0) {
            loadModulePages(pageInfo.projectId, pageInfo.moduleId, moduleElement.data('name'));
        }
        
        // Scroll to the active page once it's loaded
        if (allPages[compositeKey]) {
            scrollToActivePage(currentPageId);
        } else {
            // Wait for pages to load before scrolling
            let pageAttempts = 0;
            const maxPageAttempts = 30;
            const scrollInterval = setInterval(function() {
                pageAttempts++;
                if (pageAttempts >= maxPageAttempts || allPages[compositeKey]) {
                    clearInterval(scrollInterval);
                    if (allPages[compositeKey]) {
                        scrollToActivePage(currentPageId);
                    }
                }
            }, 100);
        }
    }
}

// Function to scroll to the active page
function scrollToActivePage(pageId) {
    const activePage = $(`.page-item[data-id="${pageId}"]`);
    if (activePage.length) {
        activePage[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Function to get the current page ID from URL
function getCurrentPageIdFromUrl() {
    if (window.location.href.includes('/Documentation/View')) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('Id');
    }
    return null;
}

function displayPaginatedProjects(page) {
    currentProjectPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProjects.length);
    const projectsToShow = filteredProjects.slice(startIndex, endIndex);

    let html = '';

    // Generate HTML for projects
    projectsToShow.forEach(function (project) {
        if (project.isActive) {
            // Always start with collapsed projects
            const expandedClass = '';
            const iconClass = 'bi-chevron-right';

            html += `
                        <div class="project-container">
                            <div class="project-item" data-id="${project.projectId}" data-name="${project.projectName}">
                                <i class="bi bi-folder2 project-icon"></i>
                                <span class="project-name">${project.projectName}</span>
                                <i class="bi ${iconClass} toggle-icon"></i>
                            </div>
                            <div class="module-list collapse ${expandedClass}" id="project-${project.projectId}">
                                <div class="loading-modules text-center py-2">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="small text-muted mt-2 mb-0">Loading modules...</p>
                                </div>
                            </div>
                        </div>
                    `;
        }
    });

    // Add pagination if needed
    if (filteredProjects.length > itemsPerPage) {
        const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

        html += `<div class="pagination-container">`;

        // Previous button
        html += `<button class="pagination-btn" ${page === 1 ? 'disabled' : ''} onclick="displayPaginatedProjects(${page - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>`;

        // Page numbers
        let startPage = Math.max(1, page - 1);
        let endPage = Math.min(totalPages, startPage + 2);

        if (endPage - startPage < 2) {
            startPage = Math.max(1, endPage - 2);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === page ? 'btn-primary' : ''}" onclick="displayPaginatedProjects(${i})">${i}</button>`;
        }

        // Next button
        html += `<button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} onclick="displayPaginatedProjects(${page + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>`;

        html += `</div>`;
        html += `<div class="pagination-info">Showing ${startIndex + 1}-${endIndex} of ${filteredProjects.length} projects</div>`;
    }

    $('#projectsList').html(html);

    // Add click event to project items
    $('.project-item').on('click', function (e) {
        e.stopPropagation(); // Prevent event bubbling
        const projectId = $(this).data('id');
        const projectName = $(this).data('name');
        const moduleList = $('#project-' + projectId);
        const toggleIcon = $(this).find('.toggle-icon');

        // Don't toggle if sidebar is collapsed - let the hover handle it
        if ($('.sidebar').hasClass('collapsed')) {
            // Only load modules if they haven't been loaded yet
            if (moduleList.find('.loading-modules').length > 0) {
                loadProjectModules(projectId, projectName);
            }
            return;
        }

        // Close all other open projects first
        $('.module-list.show').not(moduleList).each(function() {
            const otherToggleIcon = $(this).prev('.project-item').find('.toggle-icon');
            otherToggleIcon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
            $(this).collapse('hide');
            const otherId = $(this).attr('id').replace('project-', '');
            localStorage.setItem('project_' + otherId, 'collapsed');
        });

        // Toggle the module list
        const isCurrentlyShown = moduleList.hasClass('show');
        
        // Toggle the icon based on current state (before toggle)
        if (isCurrentlyShown) {
            // It's currently open, so we're closing it
            toggleIcon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
            localStorage.setItem('project_' + projectId, 'collapsed');
            // User manually closed this project
            userManuallyClosedProject[projectId] = true;
        } else {
            // It's currently closed, so we're opening it
            toggleIcon.removeClass('bi-chevron-right').addClass('bi-chevron-down');
            localStorage.setItem('project_' + projectId, 'expanded');
            // User manually opened this project
            userManuallyClosedProject[projectId] = false;

            // Load modules if not already loaded
            if (moduleList.find('.module-item').length === 0 && moduleList.find('.no-modules').length === 0) {
                loadProjectModules(projectId, projectName);
            }
        }
        
        // Toggle the module list after we've updated the icon
        moduleList.collapse('toggle');
    });

    // Remove auto-expansion of previously expanded projects
}

function loadUserProjects() {
    // Don't reload if we already have projects and they were loaded recently
    const now = Date.now();
    if (allProjects.length > 0 && (now - lastRefreshTime < REFRESH_THRESHOLD)) {
        displayPaginatedProjects(1);
        return;
    }
    
    // Don't make duplicate requests
    if (pendingRequests['projects']) {
        return;
    }
    
    $('#projectsList').html(`
                <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="small text-muted mt-2 mb-0">Loading projects...</p>
                </div>
            `);
    
    // Mark this request as pending
    pendingRequests['projects'] = true;
    
    $.ajax({
        url: '/Project/GetProjects',
        type: 'GET',
        success: function (response) {
            // Request completed, remove from pending
            pendingRequests['projects'] = false;
            lastRefreshTime = Date.now();
            
            if (response.success) {
                // Sort projects alphabetically by projectName
                allProjects = response.data.sort((a, b) => a.projectName.localeCompare(b.projectName));
                filteredProjects = [...allProjects];
                displayPaginatedProjects(1);
                
                // Check if we need to expand to show active page
                checkAndExpandActivePagePath();
            } else {
                $('#projectsList').html('<div class="alert alert-danger mx-3 p-2">Error loading projects</div>');
            }
        },
        error: function () {
            // Request completed with error, remove from pending
            pendingRequests['projects'] = false;
            $('#projectsList').html('<div class="alert alert-danger mx-3 p-2">Error connecting to server</div>');
        }
    });
}

function loadProjectModules(projectId, projectName) {
    // Check if we already have the modules cached
    if (allModules[projectId]) {
        displayModules(projectId, projectName, allModules[projectId]);
        return;
    }
    
    // Don't make duplicate requests
    const requestKey = 'modules_' + projectId;
    if (pendingRequests[requestKey]) {
        return;
    }
    
    // Mark this request as pending
    pendingRequests[requestKey] = true;
    
    $.ajax({
        url: '/Project/GetProjectModules',
        type: 'GET',
        data: { projectId: projectId },
        dataType: 'json',
        success: function(response) {
            // Request completed, remove from pending
            pendingRequests[requestKey] = false;
            
            if (response.success) {
                // Sort modules alphabetically by moduleName and cache them
                allModules[projectId] = response.data.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
                displayModules(projectId, projectName, allModules[projectId]);
            } else {
                $('#project-' + projectId).html('<div class="alert alert-danger mx-3 my-2 p-2">Error loading modules</div>');
            }
        },
        error: function () {
            // Request completed with error, remove from pending
            pendingRequests[requestKey] = false;
            $('#project-' + projectId).html('<div class="alert alert-danger mx-3 my-2 p-2">Error connecting to server</div>');
        }
    });
}

function loadModulePages(projectId, moduleId, moduleName) {
    // Create a composite key for this project-module combination
    const compositeKey = `${projectId}_${moduleId}`;
    
    // Check if we already have the pages cached
    if (allPages[compositeKey]) {
        displayPages(projectId, moduleId, moduleName, allPages[compositeKey]);
        return;
    }
    
    // Don't make duplicate requests
    const requestKey = 'pages_' + compositeKey;
    if (pendingRequests[requestKey]) {
        return;
    }
    
    // Mark this request as pending
    pendingRequests[requestKey] = true;
    
    $.ajax({
        url: '/Documentation/GetModulePages',
        type: 'GET',
        data: { moduleId: moduleId, projectId: projectId },
        dataType: 'json',
        success: function(response) {
            // Request completed, remove from pending
            pendingRequests[requestKey] = false;
            
            if (response.success) {
                // Sort pages alphabetically by pageName and cache them
                allPages[compositeKey] = response.data.sort((a, b) => a.pageName.localeCompare(b.pageName));
                displayPages(projectId, moduleId, moduleName, allPages[compositeKey]);
            } else {
                $(`#module-${compositeKey}`).html('<div class="alert alert-danger mx-3 my-2 p-2">Error loading pages</div>');
            }
        },
        error: function () {
            // Request completed with error, remove from pending
            pendingRequests[requestKey] = false;
            $(`#module-${compositeKey}`).html('<div class="alert alert-danger mx-3 my-2 p-2">Error connecting to server</div>');
        }
    });
}

function displayModules(projectId, projectName, modules) {
    const moduleList = $('#project-' + projectId);

    if (modules.length === 0) {
        moduleList.html('<div class="no-modules text-center py-3 text-muted"><i class="bi bi-journal-x mb-2" style="font-size: 1.2rem;"></i><p class="small">No modules available</p></div>');
        return;
    }

    let html = '';

    // Create a container for modules with a max height
    html += `<div class="modules-container" id="modules-container-${projectId}">`;
    modules.forEach(function (module) {
        // Always start with collapsed modules
        const expandedClass = '';
        const iconClass = 'bi-chevron-right';

        html += `
                    <div class="module-container">
                        <div class="module-item" data-id="${module.moduleId}" data-project-id="${projectId}" data-name="${module.moduleName}" data-mapping-id="${module.projModuleMappId}">
                            <i class="bi bi-journal-text module-icon"></i>
                            <span class="module-name">${module.moduleName}</span>
                            <i class="bi ${iconClass} toggle-icon"></i>
                        </div>
                        <div class="page-list collapse ${expandedClass}" id="module-${projectId}_${module.moduleId}">
                            <div class="loading-pages text-center py-2">
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="small text-muted mt-2 mb-0">Loading pages...</p>
                            </div>
                        </div>
                    </div>
                `;
    });

    html += `</div>`;
    moduleList.html(html);

    // Add click event to module items
    $('.module-item').on('click', function (e) {
        e.stopPropagation(); // Prevent event bubbling
        const moduleId = $(this).data('id');
        const projectId = $(this).data('project-id');
        const moduleName = $(this).data('name');
        const compositeModuleKey = `${projectId}_${moduleId}`;
        const pageList = $(`#module-${compositeModuleKey}`);
        const toggleIcon = $(this).find('.toggle-icon');

        // Don't toggle if sidebar is collapsed - let the hover handle it
        if ($('.sidebar').hasClass('collapsed')) {
            // Only load pages if they haven't been loaded yet
            if (pageList.find('.loading-pages').length > 0) {
                loadModulePages(projectId, moduleId, moduleName);
            }
            return;
        }

        // Toggle page list visibility
        pageList.collapse('toggle');

        // Toggle icon
        if (toggleIcon.hasClass('bi-chevron-right')) {
            toggleIcon.removeClass('bi-chevron-right').addClass('bi-chevron-down');
        } else {
            toggleIcon.removeClass('bi-chevron-down').addClass('bi-chevron-right');
        }

        // Track manually closed modules
        if (pageList.hasClass('show')) {
            delete userManuallyClosedModule[compositeModuleKey];
        } else {
            userManuallyClosedModule[compositeModuleKey] = true;
        }

        // Load pages if they haven't been loaded yet
        if (pageList.find('.loading-pages').length > 0) {
            loadModulePages(projectId, moduleId, moduleName);
        }
    });

    // Remove auto-expansion of previously expanded modules
}

function displayPages(projectId, moduleId, moduleName, pages) {
    const compositeKey = `${projectId}_${moduleId}`;
    const pageList = $(`#module-${compositeKey}`);
    if (pages.length === 0) {
        pageList.html('<div class="no-pages text-center py-3 text-muted"><i class="bi bi-file-x mb-2" style="font-size: 1.2rem;"></i><p class="small">No pages available</p></div>');
        return;
    }

    let html = '';

    // Add search box for pages if there are many
    if (pages.length > 10) {
        html += `
                    <div class="sidebar-search">
                        <i class="bi bi-search search-icon"></i>
                        <input type="text" class="form-control form-control-sm page-search" data-module-id="${moduleId}" data-project-id="${projectId}" placeholder="Search pages...">
                    </div>
                `;
    }

    // Create a container for pages
    html += `<div class="pages-container" id="pages-container-${compositeKey}">`;

    pages.forEach(function (page) {
        const isActive = window.location.href.includes('/Documentation/View') && window.location.href.includes('Id=' + page.pageId);
        const activeClass = isActive ? 'active' : '';

        html += `
                    <div class="page-item" data-id="${page.pageId}" data-project-id="${projectId}" data-module-id="${moduleId}" >
                        <a href="/Documentation/View?Id=${page.pageId}" class="page-link ${activeClass}">
                            <i class="bi bi-file-text page-icon"></i>
                            <span class="page-name">${page.pageName}</span>
                        </a>
                    </div>
                `;
    });

    html += `</div>`;

    // Add pagination if needed
    if (pages.length > 20) {
        html += `
                    <div class="pagination-container">
                        <button class="pagination-btn page-prev" data-module-id="${moduleId}" data-project-id="${projectId}" disabled>
                            <i class="bi bi-chevron-left"></i>
                        </button>
                        <span class="page-indicator" data-module-id="${moduleId}" data-project-id="${projectId}">1/${Math.ceil(pages.length / 20)}</span>
                        <button class="pagination-btn page-next" data-module-id="${moduleId}" data-project-id="${projectId}" ${pages.length <= 20 ? 'disabled' : ''}>
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                `;
    }

    pageList.html(html);

    // Initialize page pagination
    if (pages.length > 20) {
        initPagePagination(moduleId, projectId, pages);
    }

    // Add search functionality for pages
    $(`.page-search[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).on('input', function () {
        const searchTerm = $(this).val().toLowerCase().trim();
        const compositeKey = `${projectId}_${moduleId}`;
        filterPages(moduleId, projectId, searchTerm, compositeKey);
    });

    // Add click event to page links to store the selected page in localStorage
    $('.page-item a').on('click', function(e) {
        const pageItem = $(this).parent();
        const pageId = pageItem.data('id');
        const projectId = pageItem.data('project-id');
        const moduleId = pageItem.data('module-id');
        const compositeModuleKey = `${projectId}_${moduleId}`;
        
        // Store the active page ID
        localStorage.setItem('active_page_id', pageId);
        
        // Store page info for navigation
        const pageInfo = {
            projectId: projectId,
            moduleId: moduleId
        };
        localStorage.setItem('page_info_' + pageId, JSON.stringify(pageInfo));
        
        // Reset manual close flags when navigating to a page
        userManuallyClosedProject[projectId] = false;
        userManuallyClosedModule[compositeModuleKey] = false;
    });

    // Add click event to page links
    $('.page-link').on('click', function (e) {
        // Don't prevent default - allow normal navigation
        // Just handle the active state
        $('.page-link').removeClass('active');
        $(this).addClass('active');
    });
}

function initPagePagination(moduleId, projectId, pages) {
    const container = $(`#pages-container-${projectId}_${moduleId}`);
    const pageItems = container.find('.page-item');
    const itemsPerPage = 20;
    let currentPage = 1;

    // Show only first page initially
    pageItems.hide();
    pageItems.slice(0, itemsPerPage).show();

    // Handle next button click
    $(`.page-next[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).on('click', function () {
        if (currentPage * itemsPerPage < pageItems.length) {
            pageItems.hide();
            currentPage++;
            const start = (currentPage - 1) * itemsPerPage;
            const end = Math.min(start + itemsPerPage, pageItems.length);
            pageItems.slice(start, end).show();

            // Update buttons and indicator
            $(`.page-prev[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', false);
            $(`.page-next[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', currentPage * itemsPerPage >= pageItems.length);
            $(`.page-indicator[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).text(`${currentPage}/${Math.ceil(pageItems.length / 20)}`);
        }
    });

    // Handle prev button click
    $(`.page-prev[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).on('click', function () {
        if (currentPage > 1) {
            pageItems.hide();
            currentPage--;
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            pageItems.slice(start, end).show();

            // Update buttons and indicator
            $(`.page-prev[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', currentPage === 1);
            $(`.page-next[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', false);
            $(`.page-indicator[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).text(`${currentPage}/${Math.ceil(pageItems.length / 20)}`);
        }
    });
}

function filterPages(moduleId, projectId, searchTerm, compositeKey) {
    const pages = allPages[compositeKey];
    const container = $(`#pages-container-${compositeKey}`);

    if (!pages) {
        return; // No pages to filter
    }

    if (!searchTerm) {
        // Reset to show all pages (with pagination if needed)
        if (pages.length > 20) {
            container.find('.page-item').hide();
            container.find('.page-item').slice(0, 20).show();
            $(`.page-indicator[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).text(`1/${Math.ceil(pages.length / 20)}`);
            $(`.page-prev[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', true);
            $(`.page-next[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).prop('disabled', false);
        } else {
            container.find('.page-item').show();
        }
        container.find('.no-results').remove();
        return;
    }

    // Filter pages based on search term
    let foundAny = false;
    container.find('.page-item').each(function () {
        const pageName = $(this).find('.page-name').text().toLowerCase();
        if (pageName.includes(searchTerm)) {
            $(this).show();
            foundAny = true;

            // Highlight the matching text
            const originalText = $(this).find('.page-name').text();
            const highlightedText = originalText.replace(
                new RegExp(searchTerm, 'gi'),
                match => `<span class="highlight-match">${match}</span>`
            );
            $(this).find('.page-name').html(highlightedText);
        } else {
            $(this).hide();
        }
    });

    // Show no results message if needed
    if (!foundAny) {
        if (container.find('.no-results').length === 0) {
            container.append('<div class="no-results"><i class="bi bi-search me-2"></i>No pages found</div>');
        }
    } else {
        container.find('.no-results').remove();
    }

    // Disable pagination when searching
    $(`.pagination-container[data-module-id="${moduleId}"][data-project-id="${projectId}"]`).toggle(!searchTerm);
}

// Helper function to debounce events
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Helper function to refresh the sidebar
function refreshSidebar() {
    // Clear caches to force reload
    allModules = {};
    allPages = {};
    userManuallyClosedModule = {}; // Reset module closed state
    pendingRequests = {};
    lastRefreshTime = 0;
    loadUserProjects();
}

// Add a debounced refresh function for the refresh button
const debouncedRefresh = debounce(function() {
    refreshSidebar();
}, 300);
