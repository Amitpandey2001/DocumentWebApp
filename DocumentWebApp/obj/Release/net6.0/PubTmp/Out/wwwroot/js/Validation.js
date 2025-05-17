//===============================================//
// MODULE NAME   : RFC ERP Portal
// PAGE NAME     : Validation JS
//===============================================//
// MODULE NAME   : RFC ERP Portal
// PAGE NAME     : Validation JS
// CREATION DATE : 12-05-2023
// CREATED BY    : Gaurav Kalbande
// Modified BY   :
// Modified Date :
//===============================================//
/*
  Version  Modified On   Modified By     Purpose
 -------------------------------------------------------------------------------------------------------------------
  1.0.1    26-02-2024    Bhagyashree     Added to restrict application id
 -------------------------------------------------------------------------------------------------------------------
  1.0.2    12-03-2024    Bhagyashree     Added to restrict scholarship title
 -------------------------------------------------------------------------------------------------------------------
 */

$(document).ready(function () {
    restrictChars('.restrict-numbers-only', '1234567890');
    restrictChars('.restrict-numbers-space', '1234567890 ');
    restrictChars('.restrict-numbers-char', '1234567890-');
    restrictChars('.restrict-numbers-space-char', '1234567890- ');
    restrictChars('.restrict-numbers-dot', '1234567890.');
    restrictChars('.restrict-numbers-space-dot', '1234567890. ');
    restrictChars('.retstrict-alphabet-only', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    restrictChars('.restrict-alphabet-space', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ');
    restrictChars('.restrict-lowercase', 'abcdefghijklmnopqrstuvwxyz');
    restrictChars('.resrict-uppercase', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    restrictChars('.restrict-numbers-alphabet', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
    restrictChars('.restrict-numbers-alphabet-spaces', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ');
    restrictChars('.restrict-characters', '`!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~');
    restrictChars('.restrict-numbers-alphabet-characters', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~ ');
    restrictChars('.restrict-numbers-alphabet-characters-notspace', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?~');
    restrictChars('.restrict-Name-space', '.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ, ');
    restrictChars('.restrict-school-name', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()-&"\'. ');
    //<1.0.1>
    restrictChars('.restrict-username', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz\\- ');
    restrictChars('.restrict-ccode', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz- ');
    //</1.0.1>
    //<1.0.2>
    restrictChars('.restrict-scholarship-title', '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz. ');
    //</1.0.2>

    function restrictChars(selector, allowedChars) {
        $(selector).on('keypress', function (event) {
            const chr = String.fromCharCode(event.which);
            if (allowedChars.indexOf(chr) < 0) {
                return false;
            }
        });

        $(selector).on('keydown keyup change', function (event) {
            let val = $(this).val();
            let pattern = '[^' + allowedChars + ']';
            let regexp = new RegExp(pattern, 'g');
            $(this).val($(this).val().replace(regexp, ''));
        });
    }
});
