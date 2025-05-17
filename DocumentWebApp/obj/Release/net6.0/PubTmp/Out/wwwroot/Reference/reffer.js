//===============================================//
// MODULE NAME   : RFC ERP Portal
// PAGE NAME     : Organization Masters
// CREATION DATE : 01-05-2023
// CREATED BY    : Gaurav Kalbande
// Modified BY   : Aashna Maladhari
// Modified Date : 04-05-2023
//===============================================//


//========================================== Awarding Degrees tab started =====================================================//

//-------------- clear Awarding Degree started --------------------//
function ClearDegree() {
    try {
        $("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").removeAttr('disabled');
        $('#StatusAwardingDegree').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelAwardingDegree').click(function () {
    try {

        ShowLoader('#btnCancelAwardingDegree');
        ClearDegree();
    }
    catch (ex) {

    }
});
//-------------- clear Awarding Degree End --------------------//

//----------------- Submit Awarding Degree Started --------------------//
$('#btnSubmitAwardingDegree').click(function () {
    try {
        //ShowLoader('#btnSubmitAwardingDegree');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").val() == '0')
            msg += "\r Please Select Awarding Degree !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").val();
        Obj.IsTabFieldActive = $('#StatusAwardingDegree').prop('checked');
        Obj.Command_Type = 1;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearDegree();
                str = '<thead><tr><th>Action </th><th><span class="AwardingDegree"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Awarding Degree Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Awarding Degree Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Awarding Degree Alredy Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditDegree" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditDegree(this)"></a>' +
                        '<input type="hidden" id="hdnTableDegreeno" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="DegreeStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="DegreeStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#BindDynamicOrganizationTable');
                $("#BindDynamicOrganizationTable").append(str);
                var BindDynamicOrganizationTable = $('#BindDynamicOrganizationTable')
                commonDatatable(BindDynamicOrganizationTable)


                    ();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
//----------------submit awarding degree end ------------------//

//-------------- show Awarding Degree Started ----------------//
$(document).ready(function () {
    try {
        var Obj = {};
        Obj.CheckStatus = 1;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#BindDynamicOrganizationTable").find("thead").remove();
                    str = '<thead><tr><th><span class="Action"></span></th><th><span class="AwardingDegree"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditDegree" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditDegree(this)"></a>' +
                        '<input type="hidden" id="hdnTableDegreeno" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="DegreeStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="DegreeStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#BindDynamicOrganizationTable');
                $("#BindDynamicOrganizationTable").append(str);
                var BindDynamicOrganizationTable = $('#BindDynamicOrganizationTable')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
});

// --------------- Show Awarding Degree End -------------------//

//---------------- edit Awarding Degree Started -----------------------//

function EditDegree(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").val($("[id*=hdnTableDegreeno]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        $("#ctl00_ContentPlaceHolder1_ddlAwardingDegree").prop("disabled", "disabled");
        if ($("[id*=DegreeStatus]", td).val() == "false")
            $('#StatusAwardingDegree').prop('checked', false);
        else
            $('#StatusAwardingDegree').prop('checked', true);
    }
    catch (ex) {

    }
}

//-------------- edit Awarding Degree End --------------------//

//====================================== Awarding Degrees tab end =====================================================//

//====================================== Courses tab Started ========================================================//

//------------------ Courses clear started --------------------//
function ClearCourses() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlCourses").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlCourses").removeAttr('disabled');
        $('#StatusCourses').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelCourses').click(function () {
    try {

        ShowLoader('#btnCancelCourses');
        ClearCourses();
    }
    catch (ex) {

    }
});

//-------------------- Courses clear end -------------------//

//------------------ Courses submit started -------------------//
$('#btnSubmitCourses').click(function () {
    try {
        ShowLoader('#btnSubmitCourses');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlCourses").val() == '0')
            msg += "\r Please Select Course!!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlCourses").val();
        Obj.IsTabFieldActive = $('#StatusCourses').prop('checked');
        Obj.Command_Type = 2;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearCourses();

                str = '<thead><tr><th>Action </th><th><span class="Courses"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Courses Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Courses Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Courses Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditCourses" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditCourses(this)"></a>' +
                        '<input type="hidden" id="hdnTableCourses" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="CoursesStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="CoursesStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourses');
                $("#tblCourses").append(str);
                var BindDynamicOrganizationTable = $('#tblCourses')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
//----------------------- Courses submit end -----------------------------//

//---------------------- Courses show end ----------------------------//
function TabCourses(ClickValue) {
    try {
        var Obj = {};
        Obj.CheckStatus = 2;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#tblCourses").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="Courses"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnCourses" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditCourses(this)"></a>' +
                        '<input type="hidden" id="hdnTableCourses" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="CoursesStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="CoursesStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourses');
                $("#tblCourses").append(str);
                var BindDynamicOrganizationTable = $('#tblCourses')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//---------------------------- Courses show end --------------------------//

//--------------------------- Courses edit end --------------------------//
function EditCourses(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlCourses").val($("[id*=hdnTableCourses]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        $("#ctl00_ContentPlaceHolder1_ddlCourses").prop("disabled", "disabled");
        if ($("[id*=CoursesStatus]", td).val() == "false")
            $('#StatusCourses').prop('checked', false);
        else
            $('#StatusCourses').prop('checked', true);
    }
    catch (ex) {

    }
}
//------------------ Courses edit end ----------------------//
//=================================== Courses tab end ==============================================//

//==================================== Discipline tab started ======================================//

//--------------- Discipline clear started ---------------------//
function ClearDiscipline() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlDiscipline").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlDiscipline").removeAttr('disabled');
        $('#StatusDiscipline').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelDiscipline').click(function () {
    try {

        ShowLoader('#btnCancelDiscipline');
        ClearDiscipline();
    }
    catch (ex) {

    }
});

//----------------- Discipline clear end ------------------------//

//---------------- Discipline submit started --------------------//
$('#btnSubmitDiscipline').click(function () {
    try {
        ShowLoader('#btnSubmitDiscipline');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlDiscipline").val() == '0')
            msg += "\r Please Select Discipline !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlDiscipline").val();
        Obj.IsTabFieldActive = $('#StatusDiscipline').prop('checked');
        Obj.Command_Type = 3;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearDiscipline();

                str = '<thead><tr><th>Action </th><th><span class="Discipline"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Discipline Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Discipline Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Discipline Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditDiscipline" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditDiscipline(this)"></a>' +
                        '<input type="hidden" id="hdnTableDiscipline" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="DisciplineStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="DisciplineStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblDiscipline');
                $("#tblDiscipline").append(str);
                var BindDynamicOrganizationTable = $('#tblDiscipline')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
//------------------- Discipline submit end ------------------------//

//------------------- Discipline show end -------------------------//

function TabDiscipline(ClickValue) {
    try {
        var Obj = {};
        Obj.CheckStatus = 3;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#tblDiscipline").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="Discipline"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnDiscipline" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditDiscipline(this)"></a>' +
                        '<input type="hidden" id="hdnTableDiscipline" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="DisciplineStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="DisciplineStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblDiscipline');
                $("#tblDiscipline").append(str);
                var BindDynamicOrganizationTable = $('#tblDiscipline')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//-------------------- Discipline show end --------------------//

//---------------------- Discipline edit end ------------------//
function EditDiscipline(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlDiscipline").val($("[id*=hdnTableDiscipline]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        $("#ctl00_ContentPlaceHolder1_ddlDiscipline").prop("disabled", "disabled");
        if ($("[id*=DisciplineStatus]", td).val() == "false")
            $('#StatusDiscipline').prop('checked', false);
        else
            $('#StatusDiscipline').prop('checked', true);
    }
    catch (ex) {

    }
}
//-------------- Discipline edit end ------------------//
//======================================== Discipline tab end =================================//

//============================== Study Level tab started =======================================//

//--------------------- Study Level clear started ----------------------//
function ClearStudyLevel() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlStudyLevel").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlStudyLevel").removeAttr('disabled');
        $('#StatusStudyLevel').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelStudyLevel').click(function () {
    try {

        ShowLoader('#btnCancelStudyLevel');
        ClearStudyLevel();
    }
    catch (ex) {

    }
});

//----------------------- Study Level clear end ---------------------//


//------------------------ Study Level submit started ---------------------//
$('#btnSubmitStudyLevel').click(function () {
    try {
        ShowLoader('#btnSubmitStudyLevel');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlStudyLevel").val() == '0')
            msg += "\r Please Select Study Level !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlStudyLevel").val();
        Obj.IsTabFieldActive = $('#StatusStudyLevel').prop('checked');
        Obj.Command_Type = 4;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearStudyLevel();

                str = '<thead><tr><th>Action </th><th><span class="StudyLevel"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Study Level Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Study Level Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Study Level Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditStudyLevel" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditStudyLevel(this)"></a>' +
                        '<input type="hidden" id="hdnTableStudyLevel" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="StudyLevelStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="StudyLevelStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblStudyLevel');
                $("#tblStudyLevel").append(str);
                var BindDynamicOrganizationTable = $('#tblStudyLevel')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
//--------------------------- Study Level submit end ---------------------//

//----------------------------- Study Level show end ------------------------//
function TabStudyLevel(ClickValue) {
    try {
        var Obj = {};
        Obj.CheckStatus = 4;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#tblStudyLevel").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="StudyLevel"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnStudyLevel" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditStudyLevel(this)"></a>' +
                        '<input type="hidden" id="hdnTableStudyLevel" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="StudyLevelStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="StudyLevelStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblStudyLevel');
                $("#tblStudyLevel").append(str);
                var BindDynamicOrganizationTable = $('#tblStudyLevel')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//------------------------ Study Level show end ----------------------------//

//------------------------- Study Level edit end ----------------------------//
function EditStudyLevel(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlStudyLevel").val($("[id*=hdnTableStudyLevel]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_ddlStudyLevel").prop("disabled", "disabled");
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        if ($("[id*=StudyLevelStatus]", td).val() == "false")
            $('#StatusStudyLevel').prop('checked', false);
        else
            $('#StatusStudyLevel').prop('checked', true);
    }
    catch (ex) {

    }
}
//------------------ Study Level edit end ---------------------//

//=================================== Study Level tab end =========================================//

//==================================== Course Classification tab started ==================================//

//----------------------- Course Classification clear started --------------------------//
function ClearClassification() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlCourseClassification").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlCourseClassification").removeAttr('disabled');
        $('#StatusCourseClassification').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelCourseClassification').click(function () {
    try {

        ShowLoader('#btnCancelCourseClassification');
        ClearClassification();
    }
    catch (ex) {

    }
});

//---------------------- Course Classification clear end -------------------------//

//----------------------Course Classification submit started-----------------------//
$('#btnSubmitCourseClassification').click(function () {
    try {
        ShowLoader('#btnSubmitCourseClassification');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlCourseClassification").val() == '0')
            msg += "\r Please Select Course Classification !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlCourseClassification").val();
        Obj.IsTabFieldActive = $('#StatusCourseClassification').prop('checked');
        Obj.Command_Type = 5;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearClassification();

                str = '<thead><tr><th>Action </th><th><span class="CourseClassification"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Course Classification Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Course Classification Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Course Classification Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnEditCourseClassification" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditCourseClassification(this)"></a>' +
                        '<input type="hidden" id="hdnTableCourseClassification" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="CourseClassificationStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="CourseClassificationStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourseClassification');
                $("#tblCourseClassification").append(str);
                var BindDynamicOrganizationTable = $('#tblCourseClassification')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
//----------------------------- Course Classification submit end------------------------------//

//------------------------------ Course Classification show end -------------------------------//
function TabCourseClassification(ClickValue) {
    try {
        var Obj = {};
        Obj.CheckStatus = 5;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#tblDiscipline").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="CourseClassification"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnCourseClassification" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditCourseClassification(this)"></a>' +
                        '<input type="hidden" id="hdnTableCourseClassification" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="CourseClassificationStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="CourseClassificationStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourseClassification');
                $("#tblCourseClassification").append(str);
                var BindDynamicOrganizationTable = $('#tblCourseClassification')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
// ------------------------------Course Classification show end ------------------------------------//

// --------------------------  Course Classification edit end -------------------------------------//
function EditCourseClassification(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlCourseClassification").val($("[id*=hdnTableCourseClassification]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_ddlCourseClassification").prop("disabled", "disabled");
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        if ($("[id*=CourseClassificationStatus]", td).val() == "false")
            $('#StatusCourseClassification').prop('checked', false);
        else
            $('#StatusCourseClassification').prop('checked', true);
    }
    catch (ex) {

    }
}
// --------------------- Course Classification edit end -----------------------------------------//
//==========================================Course Classification  tab end ==================================================//


//============================================Course Board Classification tab started =========================================//

//--------------------------------- course board classification clear started ----------------------------------------------//
function ClearBoardClassification() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").removeAttr('disabled');
        $('#StatusCourseBoardClass').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelCourseBoardClass').click(function () {
    try {

        ShowLoader('#btnCancelCourseBoardClass');
        ClearBoardClassification();
    }
    catch (ex) {

    }
});

// ------------------------------------- course board classification clear end -------------------------//

// --------------------------------- course board classification submit started -----------------------//
$('#btnSubmitCourseBoardClass').click(function () {
    try {
        ShowLoader('#btnSubmitCourseBoardClass');
        var msg = ''; var str = ""; var count = 0;
        if ($("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").val() == '0')
            msg += "\r Please Select Course Board Classification !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.TabInputNo = $("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").val();
        Obj.IsTabFieldActive = $('#StatusCourseBoardClass').prop('checked');
        Obj.Command_Type = 6;
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveMultiTab",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearBoardClassification();

                str = '<thead><tr><th>Action </th><th><span class="CourseBoardClassification"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Course Board Classification Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Course Board Classification Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Course Board Classification Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnBoardClassification" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditBoardClassification(this)"></a>' +
                        '<input type="hidden" id="hdnTableBoardClassification" value="' + GetValue.TabInputNo + '"/></td>'

                    str = str + '<td>' + GetValue.TabInputValue + '</td>'

                    if (GetValue.IsTabFieldActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="BoardClassificationStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="BoardClassificationStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourseBoardClass');
                $("#tblCourseBoardClass").append(str);
                var BindDynamicOrganizationTable = $('#tblCourseBoardClass')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});
// ------------------ course board classification submit end ------------------------//

// --------------------- course board classification show end --------------------------//
function TabCourseBoardClassification(ClickValue) {
    try {
        var Obj = {};
        Obj.CheckStatus = 6;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindMultiMasters",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#tblDiscipline").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="CourseBoardClassification"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnBoardClassification" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditBoardClassification(this)"></a>' +
                        '<input type="hidden" id="hdnTableBoardClassification" value="' + GetValue.MasterId + '"/></td>'
                    str = str + '<td>' + GetValue.MasterName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="BoardClassificationStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="BoardClassificationStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblCourseBoardClass');
                $("#tblCourseBoardClass").append(str);
                var BindDynamicOrganizationTable = $('#tblCourseBoardClass')
                commonDatatable(BindDynamicOrganizationTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
// ---------------------------- course board classification show end ---------------------------//

//   ------------------------ course board classification edit end --------------------------------//
function EditBoardClassification(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").val($("[id*=hdnTableBoardClassification]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_ddlCourseBoardClassification").prop("disabled", "disabled");
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        if ($("[id*=BoardClassificationStatus]", td).val() == "false")
            $('#StatusCourseBoardClass').prop('checked', false);
        else
            $('#StatusCourseBoardClass').prop('checked', true);
    }
    catch (ex) {

    }
}
// --------------------------------- course board classification edit end -----------------------------------//

//------------------------------- course board classification tab end -----------------------------------------------//

//------------------------------- Semester tab submit Started -----------------------------------------------//
$('#btnSubmitSemester').click(function () {

    try {
        ShowLoader('#btnSubmitSemester');
        var msg = ''; var str = ""; var count = 0;

        if ($("#txtSemester").val().trim() == '')
            msg += "\r Please Enter Semester Name !!! <br/>";
        if ($("#txtSemesterShortName").val().trim() == '')
            msg += "\r Please Enter Semester Full Name !!! <br/>";
        if ($("#ctl00_ContentPlaceHolder1_ddlCurricuPattern").val() == '0')
            msg += "\r Please Select Curriculum Pattern !!!";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.CurriculumPatNo = $("#ctl00_ContentPlaceHolder1_ddlCurricuPattern").val();
        Obj.SemesterName = $("#txtSemester").val();
        Obj.SemesteShortName = $("#txtSemesterShortName").val();
        Obj.IsActive = $('#StatusSemester').prop('checked');
        Obj.Check_Edit = $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val();
        Obj.SemesterNo = $("#hdfSemestertNo").val();

        $.ajax({
            url: "../../Organization_Master.aspx/SaveSemester",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearSemester();

                str = '<thead><tr><th>Action </th><th><span class="Semester"></span></th><th><span class="SemesterFullName"></span></th><th><span class="CurriculumPattern"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Semester Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Semester Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Semester Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else if (GetValue.CheckStatus == "7") {
                            Swal.fire({
                                html: 'Semester not more than 30 Please Contact Admin !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnSemester" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditSemester(this)"></a>' +
                        '<input type="hidden" id="hdnTableSemester" value="' + GetValue.SemesterNo + '"/><input type="hidden" id="hdnTableCurricu" value="' + GetValue.CurriculumPatNo + '"/></td>'

                    str = str + '<td>' + GetValue.SemesterName + '</td>'
                    str = str + '<td>' + GetValue.SemesteShortName + '</td>'
                    str = str + '<td>' + GetValue.CurriculumPatName + '</td>'

                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="SemesterStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="SemesterStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#BindDynamicSemesterTable');
                $("#BindDynamicSemesterTable").append(str);
                var BindDynamicSemesterTable = $('#BindDynamicSemesterTable')
                commonDatatable(BindDynamicSemesterTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});

//------------------------------- Semester  tab submit end -----------------------------------------------//

//--------------------------------- Semester Tab Clear started ----------------------------------------------//
function ClearSemester() {

    try {
        $("#ctl00_ContentPlaceHolder1_ddlCurricuPattern").val(0).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(0).change();
        $("#txtSemester").val('');
        $("#hdfSemestertNo").val(0);
        $("#txtSemesterShortName").val('');
        $('#StatusSemester').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelSemester').click(function () {
    try {

        ShowLoader('#btnCancelSemester');
        ClearSemester();
    }
    catch (ex) {

    }
});

// ------------------------------------- Semester Tab clear end -------------------------//

//   ------------------------ Semester Tab edit end --------------------------------//
function EditSemester(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#txtSemester").val(td[1].innerText);
        $("#txtSemesterShortName").val(td[2].innerText);
        $("#ctl00_ContentPlaceHolder1_ddlCurricuPattern").val($("[id*=hdnTableCurricu]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_HdfCheckEdit").val(1);
        $("#hdfSemestertNo").val($("[id*=hdnTableSemester]", td).val());
        if ($("[id*=SemesterStatus]", td).val() == "false")
            $('#StatusSemester').prop('checked', false);
        else
            $('#StatusSemester').prop('checked', true);
    }
    catch (ex) {

    }
}
// --------------------------------- Semester Tab edit end -----------------------------------//

//---------------------- Semester show end ----------------------------//
function TabSemester(ClickValue) {
    try {

        var Obj = {};
        Obj.CheckStatus = 7;
        var str = "";

        $.ajax({
            url: "../../Organization_Master.aspx/BindSemester",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {

                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#BindDynamicSemesterTable").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="Semester"></span></th><th><span class="SemesterFullName"></span></th><th><span class="CurriculumPattern"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnSemester" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditSemester(this)"></a>' +
                        '<input type="hidden" id="hdnTableSemester" value="' + GetValue.SemesterNo + '"/><input type="hidden" id="hdnTableCurricu" value="' + GetValue.CurriculumPatNo + '"/></td>'

                    str = str + '<td>' + GetValue.SemesterName + '</td>'
                    str = str + '<td>' + GetValue.SemesteShortName + '</td>'
                    str = str + '<td>' + GetValue.CurriculumPatName + '</td>'

                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="SemesterStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="SemesterStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#BindDynamicSemesterTable');
                $("#BindDynamicSemesterTable").append(str);
                var BindDynamicSemesterTable = $('#BindDynamicSemesterTable')
                commonDatatable(BindDynamicSemesterTable)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//---------------------------- Semester show end --------------------------//

//---------------------------- Affiliated University Master show Start --------------------------//
function TabAffiliated(ClickValue) {
    try {
        var Obj = {};
        Obj.CommandType = 2;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/BindAffiliated",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#TablBindDynamicAffiliatedTablee").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="ClaDyAffiliatedName"></span></th><th><span class="ShortName"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnCourses" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditAffiliated(this)"></a>' +
                        '<input type="hidden" id="hdnTableAffiliated" value="' + GetValue.AffiliatedNo + '"/></td>'
                    str = str + '<td>' + GetValue.AffiliatedName + '</td>'
                    str = str + '<td>' + GetValue.AffiliatedShortName + '</td>'
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#TablBindDynamicAffiliatedTablee');
                $("#TablBindDynamicAffiliatedTablee").append(str);
                var TablBindDynamicAffiliatedTablee = $('#TablBindDynamicAffiliatedTablee')
                commonDatatable(TablBindDynamicAffiliatedTablee)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//---------------------------- Affiliated University Master show End --------------------------//
//------------------------------- Affiliated University tab submit Start -----------------------------------------------//
$('#btnSubmitAffiliated').click(function () {

    try {
        ShowLoader('#btnSubmitAffiliated');
        var msg = ''; var str = ""; var count = 0;

        if ($("#txtAffiliatedName").val().trim() == '')
            msg += "\r Please Enter Awarding Institute !!! <br/>";
        if ($("#txtAffiliatedShortName").val().trim() == '')
            msg += "\r Please Enter Short Name !!! <br/>";

        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.AffiliatedName = $("#txtAffiliatedName").val();
        Obj.AffiliatedShortName = $("#txtAffiliatedShortName").val();
        Obj.CommandType = 1
        Obj.AffiliatedNo = $("#hdnAffiliated").val();

        $.ajax({
            url: "../../Organization_Master.aspx/InsertUpdateAffiliated",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearAffiliated();

                str = '<thead><tr><th>Action </th><th><span class="ClaDyAffiliatedName"></span></th><th><span class="ShortName"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Record Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Record Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Record Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnCourses" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditAffiliated(this)"></a>' +
                        '<input type="hidden" id="hdnTableAffiliated" value="' + GetValue.AffiliatedNo + '"/></td>'
                    str = str + '<td>' + GetValue.AffiliatedName + '</td>'
                    str = str + '<td>' + GetValue.AffiliatedShortName + '</td>'
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#TablBindDynamicAffiliatedTablee');
                $("#TablBindDynamicAffiliatedTablee").append(str);
                var TablBindDynamicAffiliatedTablee = $('#TablBindDynamicAffiliatedTablee')
                commonDatatable(TablBindDynamicAffiliatedTablee)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});

//------------------------------- Affiliated University submit end -----------------------------------------------//

//--------------------------------- Affiliated University Tab Clear started ----------------------------------------------//
function ClearAffiliated() {

    try {

        $("#txtAffiliatedName").val('');
        $("#hdnAffiliated").val(0);
        $("#txtAffiliatedShortName").val('');
    }
    catch (ex) {

    }
}

$('#btnCancelAffiliated').click(function () {
    try {

        ShowLoader('#btnCancelAffiliated');
        ClearAffiliated();
    }
    catch (ex) {

    }
});

// ------------------------------------- Affiliated University Tab clear end -------------------------//
//   ------------------------ Affiliated Tab edit end --------------------------------//
function EditAffiliated(ClickValue) {
    try {
        var td = $("td", $(ClickValue).closest("tr"));
        $("#txtAffiliatedName").val(td[1].innerText);
        $("#txtAffiliatedShortName").val(td[2].innerText);
        $("#hdnAffiliated").val($("[id*=hdnTableAffiliated]", td).val());
    }
    catch (ex) {

    }
}
// --------------------------------- Affiliated Tab edit end -----------------------------------//

//---------------------------------- Start  Learning Modality Tab---------------------------------------//
//------------------------------- Learning Modality submit Start -----------------------------------------------//
$('#btnSubmitLearningModality').click(function () {

    try {

        ShowLoader('#btnSubmitLearningModality');
        var msg = ''; var str = ""; var count = 0;

        if ($("#ctl00_ContentPlaceHolder1_ddlLearningModality").val() == '0')
            msg += "\r Please Select Learning Modality !!! <br/>";
        if (msg != '') {
            iziToast.warning({
                message: msg,
            });
            return false;
        }
        var Obj = {};
        Obj.LearningModalityPmoNo = $("#ctl00_ContentPlaceHolder1_ddlLearningModality").val();
        Obj.IsActive = $('#StatusLearningModality').prop('checked');
        Obj.CommandType = 1
        Obj.LearningModalityNo = $("#ctl00_ContentPlaceHolder1_hdnLearningModalityNo").val();

        $.ajax({
            url: "../../Organization_Master.aspx/InsertUpdateLearningModality",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                ClearLearningModality();

                str = '<thead><tr><th>Action </th><th><span class="LearningModality"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                $.each(response.d, function (index, GetValue) {
                    if (count == 0) {
                        if (GetValue.CheckStatus == "1") {
                            iziToast.success({
                                message: 'Record Added Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "2") {
                            iziToast.success({
                                message: 'Record Updated Successfully !!!',
                            });
                        }
                        else if (GetValue.CheckStatus == "3") {
                            Swal.fire({
                                html: 'Record Already Exists !!!',
                                icon: 'error'
                            });
                        }
                        else {
                            Swal.fire({
                                html: 'Error Occurred !!!',
                                icon: 'error'
                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    count++;
                    str = str + '<tr>'
                    str = str + '<td><a id="btnLearningModality" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditLearningModality(this)"></a>' +
                        '<input type="hidden" id="hdnTableLearningModality" value="' + GetValue.LearningModalityNo + '"/><input type="hidden" id="hdnTableLearningModalityPmoNo" value="' + GetValue.LearningModalityPmoNo + '"/></td>'
                    str = str + '<td>' + GetValue.LearningModalityName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="LearningModalityStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="LearningModalityStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblLearningModalityList');
                $("#tblLearningModalityList").append(str);
                var tblLearningModalityList = $('#tblLearningModalityList')
                commonDatatable(tblLearningModalityList)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }

});

//------------------------------- Learning Modality University submit end -----------------------------------------------//


//---------------------------- Learning Modality show Start --------------------------//
function TabLearningModality(ClickValue) {
    try {
        var Obj = {};
        Obj.CommandType = 2;
        var str = "";
        $.ajax({
            url: "../../Organization_Master.aspx/ShowLearningModality",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            beforeSend: function () { $("[id*=preloader]").show(); },
            //complete: function () { $("[id*=preloader]").hide(); },
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d == '') {
                    Swal.fire({
                        html: 'Record Not Found !!!',
                        icon: 'question'
                    });
                    $("[id*=preloader]").hide();
                    return false;
                }
                else {
                    $("#TablBindDynamicAffiliatedTablee").find("thead").remove();
                    str = '<thead><tr><th>Action </th><th><span class="LearningModality"></span></th><th><span class="Status"></span></th></tr></thead><tbody>';
                }
                $.each(response.d, function (index, GetValue) {
                    str = str + '<tr>'
                    str = str + '<td><a id="btnLearningModality" class="bi bi-pencil-square text-primary" title="Edit Record" href="#" onclick="EditLearningModality(this)"></a>' +
                        '<input type="hidden" id="hdnTableLearningModality" value="' + GetValue.LearningModalityNo + '"/><input type="hidden" id="hdnTableLearningModalityPmoNo" value="' + GetValue.LearningModalityPmoNo + '"/></td>'
                    str = str + '<td>' + GetValue.LearningModalityName + '</td>'
                    if (GetValue.IsActive == true) {
                        str = str + '<td><span class="badge bg-success">Active</span>' +
                            '<input type="hidden" id="LearningModalityStatus" value="true"/></td>'
                    }
                    else {
                        str = str + '<td><span class="badge bg-danger">Inactive</span>' +
                            '<input type="hidden" id="LearningModalityStatus" value="false"/></td>'
                    }
                    str = str + '</tr>'
                });
                str = str + '</tbody>';
                RemoveTableDynamically('#tblLearningModalityList');
                $("#tblLearningModalityList").append(str);
                var tblLearningModalityList = $('#tblLearningModalityList')
                commonDatatable(tblLearningModalityList)
                BindtableLabelsDyanamically();
            },
            error: function (errResponse) {

            }
        });
    }
    catch (ex) {

    }
};
//---------------------------- Learning Modality show End --------------------------//
//--------------------------------- Learning Modality Tab Clear started ----------------------------------------------//
function ClearLearningModality() {

    try {

        $("#ctl00_ContentPlaceHolder1_ddlLearningModality").val(0).change();
        $("#ctl00_ContentPlaceHolder1_ddlLearningModality").removeAttr('disabled');
        $("#hdnLearningModalityNo").val(0);
        $('#StatusLearningModality').prop('checked', true);
    }
    catch (ex) {

    }
}

$('#btnCancelLearningModality').click(function () {
    try {

        ShowLoader('#btnCancelLearningModality');
        ClearLearningModality();
    }
    catch (ex) {

    }
});

// ------------------------------------- Learning Modality Tab clear end -------------------------//

//   ------------------------ Learning Modality Tab edit end --------------------------------//
function EditLearningModality(ClickValue) {
    try {

        var td = $("td", $(ClickValue).closest("tr"));

        $("#ctl00_ContentPlaceHolder1_ddlLearningModality").val($("[id*=hdnTableLearningModalityPmoNo]", td).val()).change();
        $("#ctl00_ContentPlaceHolder1_ddlLearningModality").prop("disabled", "disabled");
        $("#ctl00_ContentPlaceHolder1_hdnLearningModalityNo").val($("[id*=hdnTableLearningModality]", td).val()).change();
        if ($("[id*=LearningModalityStatus]", td).val() == "false")
            $('#StatusLearningModality').prop('checked', false);
        else
            $('#StatusLearningModality').prop('checked', true);
    }
    catch (ex) {

    }
}
// --------------------------------- Learning Modality Tab edit end -----------------------------------//
//-------------------------------------Bind Label Dynamically Using Cache Start ------------------------------------------------//

$(document).ready(function () {
    CallLabelBindingDynamically();
    var cls = localStorage.getItem('FillBlnkCls');
    if (cls != null) {
        $('#ctl00_ContentPlaceHolder1_bookmarkPage i').removeClass();
        $("#ctl00_ContentPlaceHolder1_bookmarkPage i").addClass(cls);
    }
    GetURLCSS();
    // GetAllLinks();

});

//var Obj = {};
//Obj.PageId = "3169";
function GetURLCSS() {

    try {


        $.ajax({
            url: "../../Organization_Master.aspx/CheckFauorateLink",
            type: "POST",
            data: {},
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (data) {

                if (data['d'] != "") {
                    $("#bookmarkPage i").removeClass();
                    $("#bookmarkPage i").addClass('bi bi-bookmark-fill');
                }

            }
        });
    }
    catch (ex) {

    }
}

//==================================================== Bind Label Dynamically Using Cache End ==============================================//

//==================================================== Semister Display Name Start ===============================================//
//Added By Pushpak Fasate
//Date 12-04-2024

function TabSemesterMapping(ClickValue) {
    $("[id*=preloader]").show();
    $('#ctl00_ContentPlaceHolder1_ddlSemester').val(0).change();
    $("#tbSemester").empty();
    $('#tbSemesterh').hide();
    $("[id*=preloader]").hide();
}

$(document).ready(function () {

    function bind_table() {
        if ($('#ctl00_ContentPlaceHolder1_ddlSemester').val() == 0) {
            $("#tbSemester").empty();
            $('#tbSemesterh').hide()
        }
        else {
            $("#tbSemester").empty();
            $("[id*=preloader]").show();
            $('#tbSemesterh').show()
            //console.log($('#ctl00_ContentPlaceHolder1_ddlSemester').val());
            var Obj = {};
            Obj.SCHEME_NO = $('#ctl00_ContentPlaceHolder1_ddlSemester').val();
            Obj.Command_type = '1';
            var str = "";
            $.ajax({
                url: "../../Organization_Master.aspx/Bind_Semester_table",
                type: "POST",
                data: JSON.stringify(Obj),
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                success: function (response) {

                    if (response.d == '') {
                        Swal.fire({
                            html: 'Record Not Found !!!',
                            icon: 'question'
                        });
                        $("[id*=preloader]").hide();
                        return false;
                    }
                    else {
                        $("#TablBindDynamicAffiliatedTablee").find("thead").remove();
                        str = '<thead><tr ><th>Semester</th><th>Semester Display Name</th><th>Year Display Name</th></tr></thead><tbody>';
                    }

                    whitespaceRegex = /^\s*$/;

                    $.each(response.d, function (index, GetValue) {
                        str = str + '<tr role="row">'
                        str = str + '<td>' + '<input type="hidden" class="SemesterNo" value="' + GetValue.SemesterNo + '"/> ' + GetValue.SemesterName + '</td>';
                        if (whitespaceRegex.test(GetValue.semesterYearDisplayName)) {
                            str = str + '<td>' + ' <input type="text"  placeholder="Enter up to 20 characters" class="form-control col-md-2 Semester_Year_Display_Name" value ="" oninput="validateInput(this)" /> ' + '</td>';
                        }
                        else {
                            str = str + '<td>' + ' <input type="text"  placeholder="Enter up to 20 characters" class="form-control col-md-2 Semester_Year_Display_Name" value = "' + GetValue.semesterYearDisplayName + '" oninput="validateInput(this)" /> ' + '</td>';
                        }

                        if (whitespaceRegex.test(GetValue.yearDisplayName)) {
                            str = str + '<td>' + '<input type="text" placeholder="Enter up to 20 characters" class="form-control col-md-2 Year_Display_Name" value="" oninput="validateInput(this)" />' + '</td>';
                        }
                        else {
                            str = str + '<td>' + '<input type="text" placeholder="Enter up to 20 characters" class="form-control col-md-2 Year_Display_Name" value="' + GetValue.yearDisplayName + '" oninput="validateInput(this)" />' + '</td>';
                        }

                        str = str + '</tr>'
                    });
                    str = str + '</tbody>';
                    $("#tbSemester").empty();
                    //$("#tbSemester").append(str);
                    $("#tbSemester").show();
                    tbSemesterh

                    RemoveTableDynamically('#tbSemester');
                    $("#tbSemester").append(str);
                    var tbSemester = $('#tbSemester')
                    commonDatatables(tbSemester)




                    $(".Year_Display_Name, .Semester_Year_Display_Name").on("input", function () {
                        validateInput(this);
                    });

                    $("[id*=preloader]").hide();
                },
                error: function (errResponse) {
                    //console.log('Error:', errResponse);
                    alert('Error occurred while processing the request.');
                    $("[id*=preloader]").hide();
                }
            });
        }
    }
    $('#ctl00_ContentPlaceHolder1_ddlSemester').change(function () {
        bind_table();
    });

    function validateInput(input) {
        let inputValue = $(input).val(); // Get the value entered by the user
        let sanitizedValue = inputValue.replace(/[^A-Za-z0-9\s]/g, ''); // Remove symbols
        let wordCount = sanitizedValue.length; // Count words


        var error;
        if (wordCount > 20) {
            //input.value = input.value.replace(/.$/, '');
            $("[id*=preloader]").hide();
            error = "Maximum 20 words allowed. !!!";
            if (error != '') {
                iziToast.warning({
                    message: error,

                });
                input.value = "";
                return false;
            }
        }

    }





    $('#btnSubmitCurriculum').click(function () {

        //debugger;
        $("[id*=preloader]").show();
        var semyeardata = [];
        var error;
        $('#tbSemester tbody tr').each(function () {
            var SemesterNo = $(this).find('.SemesterNo').val();
            var yearDisplayName = $(this).find('.Year_Display_Name').val();
            var semesterYearDisplayName = $(this).find('.Semester_Year_Display_Name').val();
            var Scheme_no = $('#ctl00_ContentPlaceHolder1_ddlSemester').val();
            //debugger;
            semyeardata.push({
                Scheme_no: Scheme_no,
                SemesterNo: SemesterNo,
                yearDisplayName: yearDisplayName,
                semesterYearDisplayName: semesterYearDisplayName
            })


        });

        if ($('#ctl00_ContentPlaceHolder1_ddlSemester').val() == 0) {
            $("[id*=preloader]").hide();
            error = "Please Select Curriculum !!!";
            if (error != '') {
                iziToast.warning({
                    message: error,

                });

                return false;
            }
        }
        else if (semyeardata.length == 0 || $('#tbSemester thead').is(':empty')) {
            //alert('Apologies, but it seems there nothing to store at the moment.');
            //$("[id*=preloader]").hide();
            //debugger;
            $("[id*=preloader]").hide();
            error = "Apologies, but it seems there nothing to store at the moment. !!!";
            if (error != '') {
                iziToast.warning({
                    message: error,

                });

                return false;
            }

        }
        else {

            //console.log(semyeardata);
            $.ajax({
                type: "POST",
                url: "../../Organization_Master.aspx/Insert_List_Semester",
                data: JSON.stringify({ tableData: semyeardata }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    var resultValue = res.d;
                    bind_table();
                    if (resultValue == 1) {
                        var error;
                        error = "Submitted successfully.!!!";
                        if (error != '') {
                            iziToast.success({
                                message: error,

                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    else if (resultValue == -999) {
                        var error;
                        error = "Something Went Wrong.!!!";
                        if (error != '') {
                            iziToast.warning({
                                message: error,

                            });
                            $("[id*=preloader]").hide();
                            return false;
                        }
                    }
                    $("[id*=preloader]").hide();


                },
                error: function (errResponse) {


                    var error;
                    error = "Error occurred while processing the request.!!!";
                    if (error != '') {
                        iziToast.warning({
                            message: error,

                        });
                        $("[id*=preloader]").hide();
                        return false;
                    }




                }
            })
        }
    });

    $('#btnCancelCurriculum').click(function () {
        $("[id*=preloader]").show();
        $('#ctl00_ContentPlaceHolder1_ddlSemester').val(0).change();
        $('#tbSemesterh').hide()
        $("#tbSemester").hide();
        RemoveTableDynamically('#tbSemester');
        $('#tbSemesterh').hide()
        $("[id*=preloader]").hide();
    })

    $('#btnExportCurriculum').click(function () {
        $("[id*=preloader]").show();
        var Obj = {};
        Obj.SCHEME_NO = '0';
        Obj.Command_type = '2';
        $.ajax({

            url: "../../Organization_Master.aspx/Bind_Semester_table",
            type: "POST",
            data: JSON.stringify(Obj),
            dataType: "json",
            contentType: "application/json;charset=utf-8",
            success: function (response) {
                if (response.d.length > 0) {
                    var myList = [];
                    for (var i = 0; i < response['d'].length; i++) {
                        var item = {};

                        item['Sr.no'] = i + 1;
                        item['Curriculum Name'] = (response.d[i].SchemeName).toString();
                        item['Semester'] = (response.d[i].SemesterName).toString();
                        item['Semester Name'] = (response.d[i].semesterYearDisplayName).toString();
                        item['Year Name'] = (response.d[i].yearDisplayName).toString();
                        myList.push(item);
                    }
                    exportListToExcel(myList, "Semester_Report");


                    var error;
                    error = "Report Donwload Successfully!!!";
                    if (error != '') {
                        iziToast.success({
                            message: error,

                        });
                        $("[id*=preloader]").hide();
                        return false;
                    }

                }
                else {
                    alert('Unfortunately, there is no data available for generating the report.');
                    $("[id*=preloader]").hide();
                }
            },
            error: function (errResponse) {
                //console.log('Error:', errResponse);
                alert('Error occurred while processing the request.');
                $("[id*=preloader]").hide();
            }
        });
    })




    function exportListToExcel(listData, fileName) {

        var scriptElement = document.createElement('script');
        scriptElement.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.3/xlsx.full.min.js';

        scriptElement.onload = function () {
            //console.log('XLSX library loaded successfully');

            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.json_to_sheet(listData);
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            ws['!cols'] = [
                { width: 7 },
                { width: 70 },
                { width: 20 },
                { width: 20 },
                { width: 20 },

            ];

            // Convert the workbook to a binary string
            var wbBinary = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

            var wbBlob = new Blob([s2ab(wbBinary)], { type: 'application/octet-stream' });

            var downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(wbBlob);
            downloadLink.download = fileName + '.xlsx';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            $("[id*=preloader]").hide();
        };

        document.head.appendChild(scriptElement);
    }

    // Utility function to convert binary string to ArrayBuffer
    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
    }


});

//==================================================== Semister Display Name END ===============================================//

