//===============================================//
// MODULE NAME   : MS-DOCS
// PAGE NAME     : Documentation Pages
// CREATED BY    : Shahbaz Ahmad
// CREATION DATE : 07-03-2025
//===============================================//
// Documentation Manager Module
const DocumentationManager = {
    init: function () {
        this.loadProjectsDropdown();
        this.bindEvents();
        this.LoadTinyMCE();
        this.initDocumentationTable();
    },
    // Load Projects Dropdown
    loadProjectsDropdown: function () {
        $.ajax({
            url: '/Project/GetActiveProjects',
            type: 'GET',
            dataType: 'json', // Ensures the response is treated as JSON
            success: function (response) {
                if (response.success) {
                    let options = '<option value="">Please Select</option>';
                    response.data.forEach(project => {
                        options += `<option value="${project.projectId}">${project.projectName}</option>`;
                    });
                    $('#ddlProject').empty().html(options);
                } else {
                    showError(response.message || 'Error loading projects');
                }
            },
            error: function (xhr, status, error) {
                showError('Failed to load projects: ' + error);
            }
        });

    },
    bindModule: function () {
        let projectId = $('#ddlProject').val();
        if (!projectId) {
            $('#ddlModule').empty().html('<option value="">Please Select</option>');
            return;
        }
        $.ajax({
            url: '/Documentation/GetProjectModules',
            type: 'GET',
            dataType: 'json', // Ensures the response is treated as JSON
            data: { projectId: projectId },
            success: function (response) {
                if (response.success) {
                    let options = '<option value="">Please Select</option>';
                    response.data.forEach(module => {
                        options += `<option value="${module.moduleId}">${module.moduleName}</option>`;
                    });
                    $('#ddlModule').empty().html(options);
                } else {
                    showError(response.message || 'Error loading projects');
                }
            },
            error: function (xhr, status, error) {
                showError('Failed to load projects: ' + error);
            }
        });
    },    // Show Error Message

    LoadTinyMCE: function () {
        // Initialize TinyMCE with just the code view button
        $('#default').tinymce({
            height: 500,
            menubar: false,
            plugins: [
                'code'
            ],
            toolbar: 'code',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
            // Preserve HTML formatting
            extended_valid_elements: 'pre[*],code[*],script[*],style[*]',
            custom_elements: 'pre,code',
            valid_children: '+body[style],+body[script],+div[h2|span|p|a|div|pre|code]',
            // Preserve formatting
            preserve_cdata: true,
            // Disable automatic formatting of HTML
            indent: false
        });
    },
    initDocumentationTable: function() {
        var str = '<thead><tr>' +
            '<th>Actions</th>' +
            '<th>Document Name</th>' +
            '<th>Version</th>' +
            '<th>Created Date</th>' +
            '<th>Created By</th>' +
            '</tr></thead><tbody>';
        
        $("#tblDocumentation").append(str);
        
        this.documentTable = $('#tblDocumentation').DataTable({
            processing: true,
            serverSide: false,
            searching: true,
            ordering: true,
            "order": [[3, "desc"]], // Order by Created Date descending
            columns: [
                { 
                    data: null,
                    orderable: false,
                    render: function(data, type, row) {
                        return '<a href="javascript:void(0)" class="view-doc me-3" data-id="' + row.pageId + '" title="View Document">' +
                               '<i class="bi bi-eye-fill text-primary fs-5"></i></a>' +
                               '<a href="javascript:void(0)" class="edit-doc" data-id="' + row.pageId + '" title="Edit Document">' +
                               '<i class="bi bi-pencil-square text-primary fs-5"></i></a>';
                    }
                },
                { data: 'pageName' },
                { data: 'version' },
                { 
                    data: 'createdDate',
                    render: function(data) {
                        return moment(data).format('DD-MM-YYYY HH:mm');
                    }
                },
                { 
                    data: 'creatorName',
                    render: function(data, type, row) {
                        // Use creatorName if available, otherwise try createdByName, or show 'N/A'
                        return data || row.createdByName || 'N/A';
                    }
                }
            ],
            "language": {
                "emptyTable": "No documents found",
                "zeroRecords": "No matching documents found",
                "loadingRecords": "Loading...",
                "processing": "Processing...",
                "search": "Search:",
                "info": "Showing _START_ to _END_ of _TOTAL_ documents",
                "infoEmpty": "Showing 0 to 0 of 0 documents",
                "infoFiltered": "(filtered from _MAX_ total documents)"
            },
            "dom": '<"top"f>rt<"bottom"lip><"clear">'
        });

        // Use event delegation for dynamic elements
        $(document).on('click', '.view-doc', function(e) {
            e.preventDefault();
            let docId = $(this).data('id');
            
            if (!docId) {
                showError('Invalid document ID');
                return;
            }

            // First get the document metadata
            $.ajax({
                url: '/Documentation/GetDocumentationPageById',
                type: 'GET',
                data: { pageId: docId },
                success: function(response) {
                    if (!response.success) {
                        showError(response.message || 'Error loading document metadata');
                        return;
                    }
                    
                    const doc = response.data;
                    let content = doc.content;
                    try {
                        if (typeof content === 'object' && !content.success) {
                            showError(content.message || 'Error loading document');
                            return;
                        }

                        // Create a modal to display the document with metadata
                        let modalHtml = `
                                    <div class="modal fade" id="documentViewModal" tabindex="-1" role="dialog">
                                        <div class="modal-dialog modal-xl">
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 class="modal-title">${doc.pageName} (v${doc.version})</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                                </div>
                                                <div class="modal-body">
                                                    <div class="document-metadata mb-3">
                                                        <div class="row">
                                                            <div class="col-md-6">
                                                                <p><strong>Project:</strong> ${doc.projectName || 'N/A'}</p>
                                                                <p><strong>Module:</strong> ${doc.moduleName || 'N/A'}</p>
                                                            </div>
                                                            <div class="col-md-6">
                                                                <p><strong>Created By:</strong> ${doc.creatorName !== null ? doc.creatorName : doc.createdByName !== null ? doc.createdByName : 'N/A'}</p>
                                                                <p><strong>Created Date:</strong> ${new Date(doc.createdDate).toLocaleString()}</p>
                                                                ${doc.modifiedDate !== null ? `<p><strong>Last Modified:</strong> ${new Date(doc.modifiedDate).toLocaleString()}</p>` : ''}
                                                            </div>
                                                        </div>
                                                        <hr>
                                                    </div>
                                                    <div class="document-content p-3">
                                                        <div class="content-wrapper">
                                                            ${content ? `<div class="preview">${content}</div>` : '<div class="alert alert-warning">No content available</div>'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="btn btn-primary edit-from-view" data-id="${doc.pageId}">Edit</button>
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;

                        // Remove any existing modal
                        $('#documentViewModal').remove();

                        // Add the new modal to the body
                        $('body').append(modalHtml);

                        // Add custom styles for the document content
                        $('<style>')
                            .attr('id', 'document-view-styles')
                            .text(`
                                        
                                        .preview { 
                                            overflow-wrap: break-word; 
                                            word-wrap: break-word; 
                                            hyphens: auto;
                                        }
                                            .html-preview { 
                                                overflow-wrap: break-word; 
                                                word-wrap: break-word; 
                                                hyphens: auto;
                                            }
                                            .html-preview * { max-width: 100%; }
                                            .html-preview pre { white-space: pre-wrap; }
                                            .html-preview code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
                                    `)
                            .appendTo('head');

                        // Show the modal
                        let modal = new bootstrap.Modal(document.getElementById('documentViewModal'));
                        modal.show();

                        // Handle the edit button click
                        $('.edit-from-view').on('click', function () {
                            modal.hide();
                            // Trigger the edit button for this document
                            $(`.edit-doc[data-id="${$(this).data('id')}"]`).click();
                        });

                        // Add explicit click handler for close buttons
                        $('#documentViewModal .btn-close, #documentViewModal .btn-secondary').on('click', function () {
                            modal.hide();
                        });

                        // Clean up when modal is hidden
                        $('#documentViewModal').on('hidden.bs.modal', function () {
                            $('#document-view-styles').remove();
                            $(this).remove(); // Remove the modal from DOM when hidden
                        });
                    } catch (err) {
                        showError('Error displaying document: ' + err.message);
                    }
                    
                    //// Now get the document content
                    //$.ajax({
                    //    url: '/Documentation/GetDocumentContent',
                    //    type: 'GET',
                    //    data: { pageId: docId },
                    //    success: function(content) {
                    //        $("[id*=preloader]").hide();
                            
                           
                    //    },
                    //    error: function(xhr, status, error) {
                    //        $("[id*=preloader]").hide();
                            
                    //        let errorMessage = 'Failed to load document';
                    //        if (xhr.status === 404) {
                    //            errorMessage = 'Document not found';
                    //        } else if (xhr.status === 403) {
                    //            errorMessage = 'You do not have permission to view this document';
                    //        } else if (xhr.status === 500) {
                    //            errorMessage = 'Internal server error';
                    //        }

                    //        if (xhr.responseJSON && xhr.responseJSON.message) {
                    //            errorMessage += ': ' + xhr.responseJSON.message;
                    //        } else if (error) {
                    //            errorMessage += ': ' + error;
                    //        }

                    //        showError(errorMessage);
                    //    }
                    //});
                },
                error: function(xhr, status, error) {
                    showError('Failed to load document metadata: ' + error);
                }
            });
        });

        // Edit document event handler
        $(document).on('click', '.edit-doc', function(e) {
            e.preventDefault();
            let docId = $(this).data('id');
            
            if (!docId) {
                showError('Invalid document ID');
                return;
            }

            // Store the document ID for update operation
            $('#hdnDocId').val(docId);

            // Change button text and action
            $('#btnSubmit').text('Update').data('action', 'update');
            
            
            // Fetch the document details for editing with project and module info included
            $.ajax({
                url: '/Documentation/GetDocumentationPageById',
                type: 'GET',
                data: { pageId: docId },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        const doc = response.data;
                        console.log(doc);
                        // Set document name and content
                        $('#txtDocName').val(doc.pageName);
                        
                        // Set project dropdown first (without triggering change event)
                        if (doc.projectId) {
                            $('#ddlProject').val(doc.projectId).change();
                            
                            // Load modules for this project
                            $.ajax({
                                url: '/Documentation/GetProjectModules',
                                type: 'GET',
                                dataType: 'json',
                                data: { projectId: doc.projectId },
                                success: function(moduleResponse) {
                                    if (moduleResponse.success) {
                                        let options = '<option value="">Please Select</option>';
                                        moduleResponse.data.forEach(module => {
                                            options += `<option value="${module.moduleId}">${module.moduleName}</option>`;
                                        });
                                        $('#ddlModule').empty().html(options);
                                        
                                        // Now set the module value
                                        if (doc.projModuleMappId) {
                                            $('#ddlModule').val(doc.projModuleMappId);
                                        }
                                    }
                                }
                            });
                        }
                        
                        // Set version numbers
                        const versionParts = doc.version.split('.');
                        if (versionParts.length === 3) {
                            $("#txtmajor").val(versionParts[0]);
                            $("#txtminor").val(versionParts[1]);
                            $("#txtbug").val(versionParts[2]);
                        }
                        
                        // Set content in TinyMCE to render HTML preview
                        if (tinymce.get('default')) {
                            // Get the editor instance and set content with proper HTML rendering
                            const editor = tinymce.get('default');
                            
                            // Use the appropriate content format to render HTML properly
                            editor.setContent(doc.content, {format: 'html'});
                            
                            // Make sure we're in visual mode, not code view mode
                            if (editor.plugins.code) {
                                // Check if we're in code view and switch back if needed
                                const codeButton = $('.tox-tbtn[aria-label="Source code"]');
                                if (codeButton.hasClass('tox-tbtn--enabled')) {
                                    editor.execCommand('mceCodeEditor');
                                }
                            }
                        } else {
                            // If TinyMCE isn't initialized yet, wait for it
                            setTimeout(function() {
                                if (tinymce.get('default')) {
                                    const editor = tinymce.get('default');
                                    editor.setContent(doc.content, {format: 'html'});
                                    
                                    // Make sure we're in visual mode, not code view mode
                                    if (editor.plugins.code) {
                                        // Check if we're in code view and switch back if needed
                                        const codeButton = $('.tox-tbtn[aria-label="Source code"]');
                                        if (codeButton.hasClass('tox-tbtn--enabled')) {
                                            editor.execCommand('mceCodeEditor');
                                        }
                                    }
                                }
                            }, 300);
                        }
                        
                        // Scroll to the form - only if it exists
                        if ($("#documentForm").length > 0) {
                            $('html, body').animate({
                                scrollTop: $("#documentForm").offset().top - 100
                            }, 500);
                        }
                    } else {
                        showError(response.message || 'Error loading document for editing');
                    }
                },
                error: function(xhr, status, error) {
                    showError('Failed to load document for editing: ' + error);
                }
            });
        });

        this.loadDocumentationTable();
    },

    loadDocumentationTable: function() {
        $.ajax({
            url: '/Documentation/GetDocumentationList',
            type: 'GET',
            dataType: 'json',
            success: (response) => {
                if (response.success) {
                    console.log("Documentation data:", response.data);
                    if (response.data && response.data.length > 0) {
                        console.log("First row properties:", Object.keys(response.data[0]));
                        console.log("First row data:", response.data[0]);
                    }
                    this.documentTable.clear().rows.add(response.data).draw();
                } else {
                    showError(response.message || 'Error loading documents');
                }
            },
            error: (xhr, status, error) => {
                showError('Failed to load documents: ' + error);
            }
        });
    },

    saveDocument: function () {
        let docId = $('#hdnDocId').val();
        let projectId = $('#ddlProject').val();
        let moduleId = $('#ddlModule').val();
        let documentName = $('#txtDocName').val();
        let documentContent = tinymce.get('default') ? tinymce.get('default').getContent() : $('#default').val();
        let version = $("#txtmajor").val() + "." + $("#txtminor").val() + "." + $("#txtbug").val();

        if (!projectId) {
            showError('Please select a project');
            return;
        }
        if (!moduleId) {
            showError('Please select a module');
            return;
        }
        if (!documentName) {
            showError('Please enter a document name');
            return;
        }
        if (!documentContent) {
            showError('Please enter document content');
            return;
        }
        if (version === "0.0.0") {
            showError('Please enter version');
            return;
        }

        // Determine if this is a create or update operation
        const isUpdate = docId && $('#btnSubmit').data('action') === 'update';
        const url = isUpdate ? '/Documentation/UpdateDocumentation' : '/Documentation/SaveDocumentation';
        const data = {
            projectId: projectId,
            moduleId: moduleId,
            documentName: documentName,
            documentContent: documentContent,
            version: version
        };
        
        // Add pageId for update operations
        if (isUpdate) {
            data.pageId = docId;
        }

        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: data,
            beforeSend: function() {
                ShowLoader('#btnSubmit');
                $('#btnSubmit').prop('disabled', true);
            },
            success: (response) => {
                if (response.success) {
                    iziToast.success({
                        message: isUpdate ? 'Document updated successfully!' : 'Document saved successfully!',
                        position: 'topRight'
                    });
                    // Clear form
                    this.resetForm();
                    // Reload table
                    this.loadDocumentationTable();
                } else {
                    showError(response.message || (isUpdate ? 'Error updating document' : 'Error saving document'));
                }
            },
            error: (xhr, status, error) => {
                showError('Failed to ' + (isUpdate ? 'update' : 'save') + ' document: ' + error);
            },
            complete: function() {
                HideLoader('#btnSubmit', isUpdate ? 'Update' : 'Save');
                $('#btnSubmit').prop('disabled', false);
            }
        });
    },

    resetForm: function() {
        // Reset form fields
        $('#hdnDocId').val('');
        $('#txtDocName').val('');
        if (tinymce.get('default')) {
            tinymce.get('default').setContent('');
        } else {
            $('#default').val('');
        }
        $("#txtmajor, #txtminor, #txtbug").val('0');
        
        // Reset dropdowns to first option (index 0)
        $('#ddlProject').prop('selectedIndex', 0).change();
        $('#ddlModule').prop('selectedIndex', 0);
        
        // Reset button text and action
        $('#btnSubmit').text('Save').data('action', 'save');
    },

    bindEvents: function () {
        $('#ddlProject').on('change', () => this.bindModule());
        $('#btnSubmit').on('click', () => this.saveDocument());
        $('#btnCancel').on('click', () => this.resetForm());
    },
    validateInput: function (input) {
        // Remove any non-numeric characters from the input value
        input.value = input.value.replace(/[^0-9]/g, "");
    }

};

$(document).ready(function () {
    DocumentationManager.init();
    //--------- plus minus number count -------------//
    $('.minus').on('click', function () {
        MinusClick(this); // `this` correctly refers to the clicked `.minus` button
    });
    $('.plus').on('click', function () {
        PlusClick(this);
    });
});
var MinusClick = function (btn) {
    var $input = $(btn).parent().find('input');
    console.log($input.val());
    var count = parseInt($input.val()) - 1;
    count = count < 0 ? 0 : count;
    $input.val(count);
    $input.change();
    return false;
}
var PlusClick = function (btn) {
    var $input = $(btn).parent().find('input');
    $input.val(parseInt($input.val()) + 1);
    $input.change();
    return false;
}
var showError = function (message) {
    iziToast.warning({
        message: message,
    });
}