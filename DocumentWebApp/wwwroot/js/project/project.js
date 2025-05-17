//===============================================//
// MODULE NAME   : MS-DOCS
// PAGE NAME     : Project Management
// CREATED BY    : Shahbaz Ahmad
// CREATION DATE : 04-03-2025
//===============================================//

// Project Manager Module
const ProjectManager = {
    // Properties
    dataTable: null,
    moduleDataTable: null,
    mappingDataTable: null,
    projectToDelete: null,

    // Initialize
    init: function () {
        this.bindEvents();
        this.loadProjects();
        this.loadModules();
        this.loadMappings();
    },
    
    // Event Bindings
    bindEvents: function () {
        // Form submissions
        $('#saveProject').on('click', () => this.saveProject());
        $('#saveModule').on('click', () => this.saveModule());
        $('#saveMapping').on('click', () => this.saveMapping());
        
        // Modal close events
        $('#projectModal').on('hidden.bs.modal', () => this.resetProjectForm());
        $('#moduleModal').on('hidden.bs.modal', () => this.resetModuleForm());
        $('#mappingModal').on('hidden.bs.modal', () => this.resetMappingForm());
        
        // Tab click events
        $('#projects-tab').on('click', () => this.loadProjects());
        $('#modules-tab').on('click', () => this.loadModules());
        $('#mappings-tab').on('click', () => this.loadMappings());
        
        // Project change event in mapping modal
        $('#mappingProject').on('change', () => this.loadModulesForMapping());
        
        // Delete confirmation
        $('#confirmDelete').on('click', () => {
            if (this.deleteItemId && this.deleteItemType === 'mapping') {
                this.deleteMapping(this.deleteItemId);
            }
            $('#deleteModal').modal('hide');
        });

        // Form validation
        $('#projectForm, #moduleForm, #mappingForm').on('submit', (e) => {
            e.preventDefault();
            const formId = e.target.id;
            if (formId === 'projectForm') this.saveProject();
            else if (formId === 'moduleForm') this.saveModule();
            else if (formId === 'mappingForm') this.saveMapping();
        });
        
        // Bind status toggle events for dynamically added elements
        $(document).on('change', '.status-toggle', function() {
            const projectId = $(this).data('id');
            ProjectManager.toggleStatus(projectId);
        });

        $(document).on('change', '.module-status-toggle', function() {
            const moduleId = $(this).data('id');
            ProjectManager.toggleModuleStatus(moduleId);
        });

        $(document).on('change', '.mapping-status-toggle', function() {
            const mappingId = $(this).data('id');
            ProjectManager.toggleMappingStatus(mappingId);
        });

        // Tab change event
        $('#projectTabs a[data-bs-toggle="tab"]').on('shown.bs.tab', (e) => {
            const tabId = $(e.target).attr('id');
            if (tabId === 'modules-tab') {
                this.loadModules();
            } else if (tabId === 'mappings-tab') {
                this.loadMappings();
            }
        });
    },

    // Load Projects
    loadProjects: function () {
        $.get('/Project/GetProjects')
            .done(response => {
                if (response.success) {
                    var str = '';
                    $.each(response.data, function (index, item) {
                        str += '<tr data-id="' + item.projectId + '">';
                        str += '<td>' + item.projectName + '</td>';
                        str += '<td>' + (item.description || '') + '</td>';
                        str += '<td>' + item.creatorName + '</td>';
                        str += '<td>' + (item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '') + '</td>';
                        str += '<td>' + 
                            '<span class="badge ' + (item.isActive ? 'bg-success' : 'bg-danger') + '">' +
                            (item.isActive ? 'Active' : 'Inactive') + 
                            '</span>' +
                            '</td>';
                        str += '<td>' +
                            '<div  role="group">' +
                            '<button type="button" class="btn btn-sm btn-outline-primary" onclick="ProjectManager.editProject(' + item.projectId + ')" title="Edit Project">' +
                            '<i class="bi bi-pencil"></i></button>' +
                            '<button type="button" class="mx-1 btn btn-sm ' + (item.isActive ? 'btn-outline-danger' : 'btn-outline-success') + '" ' +
                            'data-id="' + item.projectId + '" onclick="ProjectManager.toggleStatus(' + parseInt(item.projectId) + ')" title="' + (item.isActive ? 'Deactivate' : 'Activate') + ' Project">' +
                            '<i class="bi ' + (item.isActive ? 'bi-x-circle' : 'bi-check-circle') + '"></i></button>' +
                            '<button type="button" class="btn btn-sm btn-outline-info" onclick="ProjectManager.manageUsers(' + item.projectId + ')" title="Manage Users">' +
                            '<i class="bi bi-people-fill"></i></button>' +
                            '</div></td>';
                        str += '</tr>';
                    });
                    $("#projectsTable tbody").empty().append(str);
                } else {
                    this.showError(response.message || 'Error loading projects');
                }
            })
            .fail(() => this.showError('Failed to load projects'))
            .always(() => HideLoader('#projectsTable'));
    },

    // Load Modules
    loadModules: function () {
        $.get('/Project/GetAllModules')
            .done(response => {
                if (response.success) {
                    var str = '';
                    $.each(response.data, function (index, item) {
                        str += '<tr data-id="' + item.moduleId + '">';
                        str += '<td>' + item.moduleName + '</td>';
                        str += '<td>' + (item.description || '') + '</td>';
                        str += '<td>' + item.creatorName + '</td>';
                        str += '<td>' + (item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '') + '</td>';
                        str += '<td>' + 
                            '<span class="badge ' + (item.isActive ? 'bg-success' : 'bg-danger') + '">' +
                            (item.isActive ? 'Active' : 'Inactive') + 
                            '</span>' +
                            '</td>';
                        str += '<td>' +
                            '<div role="group">' +
                            '<button type="button" class="btn btn-sm btn-outline-primary me-1" onclick="ProjectManager.editModule(' + item.moduleId + ')" title="Edit Module">' +
                            '<i class="bi bi-pencil "></i></button>' +
                            '<button type="button" class="btn btn-sm ' + (item.isActive ? 'btn-outline-danger' : 'btn-outline-success') + '" ' +
                            'data-id="' + item.moduleId + '" onclick="ProjectManager.toggleModuleStatus(' + item.moduleId + ')" title="' + (item.isActive ? 'Deactivate' : 'Activate') + ' Module">' +
                            '<i class="bi ' + (item.isActive ? 'bi-x-circle' : 'bi-check-circle') + '"></i></button>' +
                            '</div></td>';
                        str += '</tr>';
                    });
                    
                    // Destroy existing DataTable if it exists
                    if (this.moduleDataTable) {
                        this.moduleDataTable.destroy();
                    }
                    
                    // Update table content
                    $("#modulesTable tbody").empty().append(str);
                    
                    // Reinitialize DataTable
                   // this.moduleDataTable = commonDatatable($('#modulesTable'));
                } else {
                    this.showError(response.message || 'Error loading modules');
                }
            })
            .fail(() => this.showError('Failed to load modules'))
            .always(() => HideLoader('#modulesTable'));
    },

    // Load Mappings
    loadMappings: function () {
        $.get('/Project/GetProjectModuleMappings')
            .done(response => {
                if (response.success) {
                    var str = '';
                    $.each(response.data, function (index, item) {
                        str += '<tr data-id="' + item.projModuleMappId + '">';
                        str += '<td>' + item.projectName + '</td>';
                        str += '<td>' + item.moduleName + '</td>';
                        str += '<td>' + (item.createdDate ? new Date(item.createdDate).toLocaleDateString() : '') + '</td>';
                        str += '<td>' + (item.modifiedDate ? new Date(item.modifiedDate).toLocaleDateString() : '') + '</td>';
                        str += '<td>' + 
                            '<span class="badge ' + (item.isActive ? 'bg-success' : 'bg-danger') + '">' +
                            (item.isActive ? 'Active' : 'Inactive') + 
                            '</span>' +
                            '</td>';
                        str += '<td>' +
                            '<button type="button" class="btn btn-sm ' + (item.isActive ? 'btn-outline-danger' : 'btn-outline-success') + '" ' +
                            'data-id="' + item.projModuleMappId + '" onclick="ProjectManager.toggleMappingStatus(' + item.projModuleMappId + ')" title="' + (item.isActive ? 'Deactivate' : 'Activate') + ' Mapping">' +
                            '<i class="bi ' + (item.isActive ? 'bi-x-circle' : 'bi-check-circle') + '"></i></button>' +
                            '</td>';
                        str += '</tr>';
                    });
                    
                    // Destroy existing DataTable
                    if ($.fn.DataTable.isDataTable('#mappingsTable')) {
                        $('#mappingsTable').DataTable().destroy();
                    }
                    
                    // Update table body and reinitialize DataTable
                    $('#mappingsTable tbody').html(str);
                    $('#mappingsTable').DataTable({
                        order: [[2, 'desc']] // Sort by created date descending
                    });
                } else {
                    this.showError(response.message || 'Error loading mappings');
                }
            })
            .fail(() => this.showError('Failed to load mappings'))
            .always(() => HideLoader('#mappingsTable'));
    },

    // Create Module
    createModule: function () {
        this.resetErrors();
        this.resetModuleForm();
        $('#moduleModalTitle').text('Create Module');
        $('#moduleModal').modal('show');
    },

    // Save Module
    saveModule: function () {
        this.resetErrors();

        const moduleId = $('#moduleId').val();
        const moduleName = $('#moduleName').val().trim();
        const moduleDescription = $('#moduleDescription').val().trim();
        const isActive = $('#moduleIsActive').is(':checked');

        const module = {
            moduleId: moduleId ? parseInt(moduleId) : 0,
            moduleName: moduleName,
            description: moduleDescription,
            isActive: isActive
        };

        if (!this.validateModule(module)) {
            return;
        }

        ShowLoader('#saveModule');

        const url = moduleId ? '/Project/UpdateModule' : '/Project/CreateModule';
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(module),
            success: response => {
                if (response.success) {
                    $('#moduleModal').modal('hide');
                    this.loadModules();
                    this.showSuccess(moduleId ? 'Module updated successfully' : 'Module created successfully');
                } else {
                    this.showModalError(response.message || 'Error saving module');
                }
            },
            error: () => this.showModalError('Failed to save module'),
            complete: () => HideLoader('#saveModule', 'Save')
        });
    },

    // Validate Module
    validateModule: function (module) {
        if (!module.moduleName) {
            this.showModalError('Module name is required');
            return false;
        }
        return true;
    },

    // Reset Module Form
    resetModuleForm: function () {
        this.resetErrors();
        $('#moduleForm')[0].reset();
        $('#moduleId').val('');
        $('#moduleName').val('');
        $('#moduleDescription').val('');
        $('#moduleIsActive').prop('checked', true);
    },

    // Edit Module
    editModule: function (id) {
        this.resetErrors();
        $.get('/Project/GetModule', { id: id })
            .done(response => {
                if (response.success) {
                    const module = response.data;
                    $('#moduleId').val(module.moduleId);
                    $('#moduleName').val(module.moduleName);
                    $('#moduleDescription').val(module.description);
                    $('#moduleIsActive').prop('checked', module.isActive);
                    
                    $('#moduleModalTitle').text('Edit Module');
                    $('#moduleModal').modal('show');
                } else {
                    this.showError(response.message || 'Error loading module');
                }
            })
            .fail(() => this.showError('Failed to load module'))
            .always(() => {
                HideLoader('#saveModule', 'Save');
            });
    },

    // Create Project
    createProject: function () {
        this.resetProjectForm();
        $('#projectModalTitle').text('Create Project');
        $('#projectModal').modal('show');
    },

    // Edit Project
    editProject: function (id) {
        this.resetErrors();
        ShowLoader('#saveProject');

        $.get('/Project/GetProject', { id: id })
            .done(response => {
                if (response.success) {
                    const project = response.data;
                    $('#projectId').val(project.projectId);
                    $('#projectName').val(project.projectName);
                    $('#projectDescription').val(project.description);
                    $('#projectIsActive').prop('checked', project.isActive);
                    
                    $('#projectModalTitle').text('Edit Project');
                    $('#projectModal').modal('show');
                } else {
                    this.showError(response.message || 'Error loading project');
                }
            })
            .fail(() => this.showError('Failed to load project'))
            .always(() => {
                HideLoader('#saveProject', 'Save');
            });
    },
    
    // Toggle Status
    toggleStatus: function(id) {
        if (!id) return;
        
        $.ajax({
            url: '/Project/ToggleStatus',
            type: 'POST',
            data: { id: id },
            success: response => {
                if (response.success) {
                    this.showSuccess('Project status updated successfully');
                    this.loadProjects();
                } else {
                    this.showError(response.message || 'Error updating project status');
                }
            },
            error: () => {
                this.showError('Failed to update project status');
            }
        });
    },

    // Save Project
    saveProject: function () {
        this.resetErrors();

        const projectId = $('#projectId').val();
        const projectName = $('#projectName').val().trim();
        const projectDescription = $('#projectDescription').val().trim();
        const isActive = $('#projectIsActive').is(':checked');

        const project = {
            projectId: projectId ? parseInt(projectId) : 0,
            projectName: projectName,
            description: projectDescription,
            isActive: isActive
        };

        if (!this.validateProject(project)) {
            return;
        }

        ShowLoader('#saveProject');

        const url = projectId ? '/Project/Update' : '/Project/Create';
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(project),
            success: response => {
                if (response.success) {
                    $('#projectModal').modal('hide');
                    this.loadProjects();
                    this.showSuccess(projectId ? 'Project updated successfully' : 'Project created successfully');
                } else {
                    this.showModalError(response.message || 'Error saving project');
                }
            },
            error: () => this.showModalError('Failed to save project'),
            complete: () => HideLoader('#saveProject', 'Save')
        });
    },

    // Validation
    validateProject: function (project) {
        if (!project.projectName) {
            this.showModalError('Project name is required');
            return false;
        }
        return true;
    },

    // Reset Project Form
    resetProjectForm: function () {
        this.resetErrors();
        $('#projectId').val('');
        $('#projectName').val('');
        $('#projectDescription').val('');
        $('#projectIsActive').prop('checked', true);
    },

    // Show Success Message
    showSuccess: function(message) {
        iziToast.success({
            title: 'Success',
            message: message,
            position: 'topRight'
        });
    },

    // Show Error Message
    showError: function(message) {
        iziToast.error({
            title: 'Error',
            message: message,
            position: 'topRight'
        });
    },

    // Show Modal Error
    showModalError: function(message) {
        iziToast.error({
            title: 'Error',
            message: message,
            position: 'topRight'
        });
    },

    // Save Mapping
    saveMapping: function () {
        this.resetErrors();

        const projectId = $('#mappingProject').val();
        const moduleId = $('#mappingModule').val();
        const isActive = $('#mappingIsActive').is(':checked');

        if (!projectId || !moduleId) {
            this.showModalError('Please select both project and module');
            return;
        }

        const mapping = {
            projectId: parseInt(projectId),
            moduleId: parseInt(moduleId),
            isActive: isActive
        };

        ShowLoader('#saveMapping');

        $.ajax({
            url: '/Project/CreateModuleMapping',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(mapping),
            success: response => {
                if (response.success) {
                    $('#mappingModal').modal('hide');
                    this.loadMappings();
                    this.showSuccess('Mapping created successfully');
                } else {
                    this.showModalError(response.message || 'Error creating mapping');
                }
            },
            error: () => this.showModalError('Failed to create mapping'),
            complete: () => HideLoader('#saveMapping', 'Save')
        });
    },

    // Delete Mapping
    deleteMapping: function (id) {
        if (confirm('Are you sure you want to delete this mapping?')) {
            $.post('/Project/DeleteModuleMapping', { id: id })
                .done(response => {
                    if (response.success) {
                        this.loadMappings();
                        this.showSuccess('Mapping deleted successfully');
                    } else {
                        this.showError(response.message || 'Error deleting mapping');
                    }
                })
                .fail(() => this.showError('Failed to delete mapping'));
        }
    },

    // Toggle Module Status
    toggleModuleStatus: function(id) {
        if (!id) return;
        
        $.ajax({
            url: '/Project/ToggleModuleStatus',
            type: 'POST',
            data: { id: id },
            success: response => {
                if (response.success) {
                    this.showSuccess('Module status updated successfully');
                    this.loadModules();
                } else {
                    this.showError(response.message || 'Error updating module status');
                }
            },
            error: () => {
                this.showError('Failed to update module status');
            }
        });
    },

    // Toggle Mapping Status
    toggleMappingStatus: function(id) {
        if (!id || id <= 0) {
            this.showError('Invalid mapping ID');
            return;
        }
        
        $.ajax({
            url: '/Project/ToggleMappingStatus',
            type: 'POST',
            data: { id: id },
            success: response => {
                if (response.success) {
                    this.showSuccess('Mapping status updated successfully');
                    this.loadMappings();
                } else {
                    this.showError(response.message || 'Error updating mapping status');
                }
            },
            error: () => {
                this.showError('Failed to update mapping status');
            }
        });
    },

    // Reset Mapping Form
    resetMappingForm: function () {
        this.resetErrors();
        $('#mappingForm')[0].reset();
        $('#mappingId').val('');
        $('#mappingProject').val('');
        $('#mappingModule').val('');
        $('#mappingIsActive').prop('checked', true);
    },

    // Show Mapping Modal Error
    showMappingModalError: function (message) {
        $('#mappingModalError .alert').text(message);
        $('#mappingModalError').show();
    },

    // Reset Errors
    resetErrors: function() {
        $('#modalError').hide();
        $('#modalError .alert').empty();
        $('#moduleModalError').hide();
        $('#moduleModalError .alert').empty();
        $('#mappingModalError').hide();
        $('#mappingModalError .alert').empty();
    },

    // HTML Escape
    escapeHtml: function (unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Load Projects Dropdown
    loadProjectsDropdown: function() {
        $.get('/Project/GetActiveProjects')
            .done(response => {
                if (response.success) {
                    let options = '<option value="">Select Project</option>';
                    response.data.forEach(project => {
                        options += `<option value="${project.projectId}">${project.projectName}</option>`;
                    });
                    $('#mappingProject').html(options);
                } else {
                    this.showError(response.message || 'Error loading projects');
                }
            })
            .fail(() => this.showError('Failed to load projects'));
    },

    // Create Mapping
    createMapping: function () {
        this.resetMappingForm();
        this.loadProjectsDropdown();
        $('#mappingModalTitle').text('Create Project Module Mapping');
        $('#mappingModal').modal('show');
    },

    // Load Modules for Mapping
    loadModulesForMapping: function () {
        const projectId = $('#mappingProject').val();
        if (!projectId) {
            $('#mappingModule').html('<option value="">Select Module</option>');
            return;
        }

        $.get('/Project/GetAvailableModules', { projectId: projectId })
            .done(response => {
                if (response.success) {
                    let options = '<option value="">Select Module</option>';
                    response.data.forEach(module => {
                        options += `<option value="${module.moduleId}">${module.moduleName}</option>`;
                    });
                    $('#mappingModule').html(options);
                }
            });
    },

    // Navigation to manage users page
    manageUsers: function(projectId) {
        window.location.href = '/Project/ManageUsers?projectId=' + projectId;
    },
};

// Initialize when document is ready
$(document).ready(function () {
    ProjectManager.init();
});
