
//================= Loader JS ===================//


//================= Button Loader JS ===================//
function ShowLoader(id) {
    $(id).html('<span class="spinner-border spinner-border-sm"></span> Loading..');
};

function HideLoader(id, name) {
    $(id).html(name);
};
//================= Button Loader JS END ===================//

$(document).ready(function () {
  
    //============================= Session Expire Alert JS Start =========================//

    function ResetSession() {
        window.location = window.location.href;
    }
    //============================= Session Expire Alert JS END =========================//


    //=============== for not redirect user profile page after enter ====================//
    $(':text').bind('keydown', function (e) {
        //on keydown for all textboxes prevent from postback
        if (e.target.className != "searchtextbox") {
            if (e.keyCode == 13) { //if this is enter key
                e.preventDefault();
                return false;
            }
            else
                return true;
        }
        else
            return true;
    });
    //===============================================================================//

    //============================= Search Bar JS Start =========================//
    //$('.jj #ctl00_Panel1 ul li').css({ 'display': 'none' });
    $('.live-search-list #ctl00_Panel1').clone().appendTo('.jj');
    $('.jj #ctl00_Panel1').find('li').each(function () {
        var titleText = $(this).find('a').attr('title').toLowerCase();
        var searchText = $(this).text().toLowerCase();
        $(this).attr('data-search-term', searchText + ' ' + titleText);
        //$(this).attr('data-search-term', $(this).text().toLowerCase());
    });

    $('body').on('keyup', '.live-search-box', function () {

        var NotFountCount = 0;
        var searchTerm = $(this).val().toLowerCase();
        $('.jj').find('li').each(function () {

            if ($(this).filter('[data-search-term *= ' + searchTerm + ']').length > 0 || searchTerm.length < 1) {
                $(this).fadeIn();
                NotFountCount++;
            } else {
                $(this).fadeOut();
            }
            return 0;
        });

        if ($('.live-search-box').val() == '') {
            $('.live-search-area').hide();
            $(this).removeClass('width210');
            $('.cross-btn').fadeOut();
            $('.search-icon').fadeIn();

        } else {
            $('.live-search-area').show();
            $(this).addClass('width210');
            $('.cross-btn').fadeIn();
            $('.search-icon').fadeOut();
        }

        if (NotFountCount > 0) {
            $('.not-found-txt').addClass("d-none");
            $('.jj').find(".menu").removeClass("d-none");
            $('.jj').find(".pullDown").removeClass("d-none");
        }
        else {
            $('.not-found-txt').removeClass("d-none");
            $('.jj').find(".menu").addClass("d-none");
            $('.jj').find(".pullDown").addClass("d-none");
        }
    });

    $(".navbar-toggler").click(function () {
        $(".live-search-box").fadeToggle();
        $('.cross-btn, .live-search-area').fadeOut();
        $('.search-icon').fadeToggle();
    });

    $('body').on('click', '.cross-btn', function () {
        $('.search-box .live-search-area').hide();
        $('.live-search-box').val('');
        $('.live-search-box').removeClass('width210');
        $('.cross-btn').fadeOut();
        $('.search-icon').fadeIn();
    });
    //============================= Search Bar JS Start =========================//

    //============================= Select 2 JS Start =========================//
    $("[data-select2-enable=true]").addClass("select2 select-clik");

    $('.select2').select2({
        dropdownAutoWidth: true,
        width: '100%',
    });

    $(document).on("click", ".select2-search-clear-icon", function () {
        var sel2id = localStorage.getItem("sel2id");
        $('#' + sel2id).select2('close');
        $('#' + sel2id).select2('open');
    });

    $(document).on('click', '.select2', function () {
        var key = $(this).parent().find('.select-clik').attr('id');
        localStorage.setItem("sel2id", key);
    });

    //------------------- Select All Functionality JS ----------------//
    $(document).ready(function () {
        $('.multiple-select').select2();

        // Add an event listener to handle the "Select All" option
        $('.multiple-select').on('select2:open', function () {
            $('.select2-results__option').each(function () {
                $(this).addClass('select-all');
            });
        });

        $('.multiple-select').on('change', function () {
            var selectedValues = $(this).val();

            // Check if "Select All" is selected
            if (selectedValues && selectedValues.includes('all')) {
                // Select all options except "Select All"
                $('.multiple-select option[value!="all"]').prop('selected', true);
                $('.multiple-select option[value="all"]').prop('selected', false);
            } else {
                // Deselect "Select All" if it was previously selected
                $('.multiple-select option[value="all"]').prop('selected', false);
            }

            // Manually trigger the change event to update the select2 control
            $(this).trigger('change.select2');
        });
    });
    //------------------- Select All Functionality JS END ----------------//


    //---------------- Select2 JS for Modal Popup Dropdown ------------------//
    $('.select2Task').select2({
        dropdownParent: $('.modal-select2')
    });

    //============================= Select 2 JS END =========================//

    //============================= ToolTip JS =========================//
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    //============================= ToolTip JS End =========================//

    //========== Add table-responsive class above Data Table JS ============//
    $(".tbl-display").wrap("<div class='table table-responsive table-simple'></div>");

    //=============== Input Text Transform JS ====================//
    $('#ddlTextTransform').on('change', function (e) {
        var optionSelected = $("option:selected", this);
        var valueSelected = this.value;
        if (this.value == '0') {
            $("input:text").css("text-transform", "none");
        }
        if (this.value == '1') {
            $("input:text").css("text-transform", "uppercase");
        }
        if (this.value == '2') {
            $("input:text").css("text-transform", "lowercase");
        }
        if (this.value == '3') {
            $("input:text").css("text-transform", "capitalize");
        }
    });
    //=============== Input Text Transform JS END ====================//
});

//---------------- Theme Setting Modal Popup JS ---------------//
$("#theme-setting").hover(function () {
    $("body").find('.modal-backdrop').css('opacity', '0.2');
});
//================= Theme Setting JS END =========================//

//=================== Data Table JS Start ======================//
function RemoveTableDynamically(tableID) {
    $(tableID).find("thead").remove();
    $(tableID).find("tbody").remove();
}

function commonDatatable(tableID) {
    //-- Set time out function for dynamic column visibility --// 
    setTimeout(function () {

        var table = $(tableID).DataTable({
            responsive: true,
            lengthChange: true,
            //scrollY: 320,
            //scrollX: true,
            //scrollCollapse: true,
            //paging: false,
            fixedColumns: {
                left: 0,
                right: 1
            },
            dom: 'lBfrtip',
            buttons: [
                //{
                //    extend: 'colvis',
                //    text: 'Column Visibility',
                //    columns: function (idx, data, node) {
                //        var arr = [0];
                //        if (arr.indexOf(idx) !== -1) {
                //            return false;
                //        } else {
                //            return $(tableID).DataTable().column(idx).visible();
                //        }
                //    }
                //},
                {
                    extend: 'collection',
                    text: '<i class="glyphicon glyphicon-export icon-share"></i> Export',

                    extend: 'excelHtml5',
                    exportOptions: {
                        columns: function (idx, data, node) {
                            var arr = [0];
                            if (arr.indexOf(idx) !== -1) {
                                return false;
                            } else {
                                return $(tableID).DataTable().column(idx).visible();
                            }
                        },
                        format: {
                            body: function (data, column, row, node) {
                                var nodereturn;
                                if ($(node).find("input:text").length > 0) {
                                    nodereturn = "";
                                    nodereturn += $(node).find("input:text").eq(0).val();
                                }
                                else if ($(node).find("textarea").length > 0) {
                                    nodereturn = "";
                                    $(node).find("textarea").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("input:checkbox").length > 0) {
                                    nodereturn = "";
                                    $(node).find("input:checkbox").each(function () {
                                        if ($(this).is(':checked')) {
                                            nodereturn += "On";
                                        } else {
                                            nodereturn += "Off";
                                        }
                                    });
                                }
                                else if ($(node).find("input:image").length > 0) {
                                    nodereturn = "";
                                    nodereturn += $(node).find("input:image").eq(0).val();
                                }
                                else if ($(node).find("b").length > 0) {
                                    nodereturn = "";
                                    $(node).find("b").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("a").length > 0) {
                                    nodereturn = "";
                                    $(node).find("a").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("span").length > 0 && !($(node).find(".select2").length > 0)) {
                                    nodereturn = "";
                                    $(node).find("span").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("select").length > 0) {
                                    nodereturn = "";
                                    $(node).find("select").each(function () {
                                        var thisOption = $(this).find("option:selected").text();
                                        if (thisOption !== "Please Select") {
                                            nodereturn += thisOption;
                                        }
                                    });
                                }
                                else if ($(node).find("img").length > 0) {
                                    nodereturn = "";
                                }
                                else if ($(node).find("input:hidden").length > 0) {
                                    nodereturn = "";
                                }
                                else {
                                    nodereturn = data;
                                }
                                return nodereturn;
                            },
                        },
                    }
                },
            ],
            "bDestroy": true,
        });

        //------------ preloader hide after data table load -------------//
        $("[id*=preloader]").hide();
        //return true;

        //-----------------------------------------------------------//
        $(tableID).wrap("<div class='table-responsive'></div>");

    }, 10);

}
//=================== Data Table JS END ======================//

//=================== Data Table JS END ======================//
function commonDatatables(tablesID) {
    //-- Set time out function for dynamic column visibility --// 
    setTimeout(function () {

        var table = $(tablesID).DataTable({
            responsive: true,
            lengthChange: true,
            scrollY: 320,
            scrollX: true,
            scrollCollapse: true,
            paging: false,
            fixedColumns: {
                left: 0,
                right: 1
            },
            dom: 'lBfrtip',
            buttons: [
                //{
                //    extend: 'colvis',
                //    text: 'Column Visibility',
                //    columns: function (idx, data, node) {
                //        var arr = [0];
                //        if (arr.indexOf(idx) !== -1) {
                //            return false;
                //        } else {
                //            return $(tableID).DataTable().column(idx).visible();
                //        }
                //    }
                //},
                {
                    extend: 'collection',
                    text: '<i class="glyphicon glyphicon-export icon-share"></i> Export',

                    extend: 'excelHtml5',
                    exportOptions: {
                        columns: function (idx, data, node) {
                            var arr = [0];
                            if (arr.indexOf(idx) !== -1) {
                                return false;
                            } else {
                                return $(tablesID).DataTable().column(idx).visible();
                            }
                        },
                        format: {
                            body: function (data, column, row, node) {
                                var nodereturn;
                                if ($(node).find("input:text").length > 0) {
                                    nodereturn = "";
                                    nodereturn += $(node).find("input:text").eq(0).val();
                                }
                                else if ($(node).find("textarea").length > 0) {
                                    nodereturn = "";
                                    $(node).find("textarea").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("input:checkbox").length > 0) {
                                    nodereturn = "";
                                    $(node).find("input:checkbox").each(function () {
                                        if ($(this).is(':checked')) {
                                            nodereturn += "On";
                                        } else {
                                            nodereturn += "Off";
                                        }
                                    });
                                }
                                else if ($(node).find("input:image").length > 0) {
                                    nodereturn = "";
                                    nodereturn += $(node).find("input:image").eq(0).val();
                                }
                                else if ($(node).find("b").length > 0) {
                                    nodereturn = "";
                                    $(node).find("b").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("a").length > 0) {
                                    nodereturn = "";
                                    $(node).find("a").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("span").length > 0 && !($(node).find(".select2").length > 0)) {
                                    nodereturn = "";
                                    $(node).find("span").each(function () {
                                        nodereturn += $(this).text();
                                    });
                                }
                                else if ($(node).find("select").length > 0) {
                                    nodereturn = "";
                                    $(node).find("select").each(function () {
                                        var thisOption = $(this).find("option:selected").text();
                                        if (thisOption !== "Please Select") {
                                            nodereturn += thisOption;
                                        }
                                    });
                                }
                                else if ($(node).find("img").length > 0) {
                                    nodereturn = "";
                                }
                                else if ($(node).find("input:hidden").length > 0) {
                                    nodereturn = "";
                                }
                                else {
                                    nodereturn = data;
                                }
                                return nodereturn;
                            },
                        },
                    }
                },
            ],
            "bDestroy": true,
        });

        //------------ preloader hide after data table load -------------//
        $("[id*=preloader]").hide();
        //return true;

        //-----------------------------------------------------------//
        //$(tablesID).wrap("<div class='table-responsive'></div>");
    }, 10);

}
//=================== Data Table JS END ======================//

//================================================== Bind Dynamic Label Start ========================================================//

function CallLabelBindingDynamically() {
    try {
        $.ajax({
            type: "POST",
            url: layer + "/DynamicLabelHandler.ashx",
            data: {},
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var Bindlabel = data;
                var elem = document.getElementById('DivfetchingForLabels');
                if (!elem) return;
                var alllabel = elem.querySelectorAll('label span');
                var cntrlid; var cntClassName; var str;
                alllabel.forEach(item => {
                    cntrlid = item.id;
                    cntClassName = item.className;
                    if (cntClassName !== 'undefined' && cntClassName != "")
                        str = Bindlabel.find(item => item.DynamicClassName === cntClassName);
                    else
                        str = Bindlabel.find(item => item.DynamiclabelId === cntrlid);
                    var val;
                    if (cntClassName !== 'undefined' && cntClassName != "") {
                        if (typeof str !== 'undefined') {
                            val = (str.DynamiclabelName != undefined || str.DynamiclabelName != "") ? str.DynamiclabelName
                                : document.querySelector('.' + cntClassName).innerHTML;
                            if (val != '') {
                                document.querySelectorAll('.' + cntClassName).forEach(elem => elem.innerHTML = val);
                            }
                        }
                    }
                    else {
                        if (typeof str !== 'undefined') {
                            val = (str.DynamiclabelName != undefined || str.DynamiclabelName != "") ? str.DynamiclabelName
                                : document.querySelector('#' + cntrlid).innerHTML;
                            if (val != '') {
                                document.querySelectorAll('#' + cntrlid).forEach(elem => elem.innerHTML = val);
                            }
                        }
                    }
                })
            },
            error: function (xhr, textStatus, errorThrown) {
            },
            failure: function (xhr, textStatus, errorThrown) {
            }
        });
    }
    catch (ex) {

    }
}
//================================================== Bind Dynamic Label End ========================================================//

//================================================== Bind Dynamic Table label Start ================================================//

function BindtableLabelsDyanamically() {
    try {
        $.ajax({
            type: "POST",
            url: layer + "/DynamicLabelHandler.ashx",
            data: {},
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                var Bindlabel = data;
                var elem = document.getElementById('DivfetchingForLabels');
                if (!elem) return
                var alllabel = elem.querySelectorAll('th span');
                var cntClassName; var str;
                alllabel.forEach(item => {
                    cntClassName = item.className;
                    if (!cntClassName) return;

                    str = Bindlabel.find(item => item.DynamicClassName === cntClassName);
                    var val;
                    if (typeof str !== 'undefined') {
                        val = (str.DynamiclabelName != undefined || str.DynamiclabelName != "") ? str.DynamiclabelName
                            : document.querySelector('.' + cntClassName).innerHTML;
                        if (val != '') {
                            document.querySelectorAll('.' + cntClassName).forEach(elem => elem.innerHTML = val);
                        }
                    }
                })
            },
            error: function (xhr, textStatus, errorThrown) {
            },
            failure: function (xhr, textStatus, errorThrown) {
            }
        });
    }
    catch (ex) {

    }
}

//================================================== Bind Dynamic Table label End ================================================//




//=============================================================================//


