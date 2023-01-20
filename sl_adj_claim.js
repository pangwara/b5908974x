/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 *
 * @summary     Plan Load
 * @author      Rakop M.  [2022/05/18] <@teibto.com>
 *
 * @version     1.0
 */

var CS_SCRIPTID_PATH = '../Client/sl_adj_claim_cs.js';
var SL_SCRIPT_ID = 'customscript_adj_claim';
var MR_SCRIPT_ID = 'customscript_sl_plan_load_mr';
var TABLE_DATA;
var DOC_TYPE, REC_DATA;
var REQUEST, PARAMS, USE_SUB, USER_ROLE_ID, USER_ID;

var config, email, format, record, runtime, search, task, ui, redirect, url ;
define(['N/ui/serverWidget', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/error', 'N/redirect', 'N/url', 'N/format'],
    function(_ui,  _record, _runtime, _search, _task, _error, _redirect, _url, _format ) {

        ui = _ui;
        record = _record;
        runtime = _runtime;
        search = _search;
        task = _task;
        error = _error;
        redirect = _redirect;
        url = _url;
        format = _format;

        USE_SUB = runtime.isFeatureInEffect('SUBSIDIARIES');
        USER_ROLE_ID = runtime.getCurrentUser().role;
        USER_ID = runtime.getCurrentUser().id;
        TABLE_DATA = {};
        DOC_TYPE = [ 'ALL', 'เคลมได้', 'เคลมไม่ได้ & ใช้ได้ให้ส่งคืน'];
        REC_DATA = {};

        return{
            onRequest: onRequest
        };
    }
);

// ################################################################################################
// ===== Suitelet Function
// ################################################################################################
function onRequest(context, request, response) {
    request = context.request;
    PARAMS = request.parameters;
    formName = 'CLAIM';

    var form = ui.createForm(formName);
    form.clientScriptModulePath = CS_SCRIPTID_PATH;
    if (!PARAMS['step']) {

        log.debug('Start | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);


        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });

        //===================================== Add Filter Field ==============================
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information Filters' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

				//
        var uiField = form.addField({ id: 'claim_result', type: 'select', label: 'Claim Result', source: null,  container : 'primary_information' }).updateDisplayType({ displayType : 'normal' });
            uiField.isMandatory = true;
            // uiField.addSelectOption({ value: '', text: '' });

        for (i = 0; !!DOC_TYPE && i < DOC_TYPE.length; i++) {
            var value = i;
            var text = DOC_TYPE[i];

            uiField.addSelectOption({ value: value, text: text });
        }

        // var uiField = form.addField({ id: 'claim_result', type: 'select', label: 'Claim Result', source: null,  container : 'primary_information' }).updateDisplayType({ displayType : 'normal' });
        //     uiField.isMandatory = false;
        //     uiField.addSelectOption({ value: '', text: '' });

        // var filterSearch = [];
        //     // filterSearch.push( search.createFilter({ name: 'isquarter', join: null, operator: 'is', values: 'F' }) );
        // var columnSearch = [];
        //     columnSearch.push( search.createColumn({ name: 'internalid' }) );
        //     columnSearch.push( search.createColumn({ name: 'name' , sort: 'ASC'}) ); // DESC
        // var ssResult = getSearch('customlist_claim_result', null, columnSearch, filterSearch);
        //
        // for (i = 0; !!ssResult && i < ssResult.length; i++) {
        //     var value = ssResult[i].getValue('internalid');
        //     var text = ssResult[i].getValue('name');
        //
        //     uiField.addSelectOption({ value: value, text: text });
        // }

        var uiField = form.addField({ id: 'customer_select', type: 'select', label: 'Customer Name', source: 'customer',  container : 'primary_information' }).updateDisplayType({ displayType : 'normal' });
            uiField.isMandatory = false;

        var uiField = form.addField({ id: 'date_select', type: 'date', label: 'Date', container : 'primary_information' }).updateDisplayType({ displayType : 'normal' });
            uiField.isMandatory = true;
            uiField.defaultValue = new Date();

        // var uiField = form.addField({ id: 'doc_no_select', type: 'text', label: 'Document No.', source: null,  container : 'primary_information' }).updateDisplayType({ displayType : 'normal' });
        //     uiField.isMandatory = false;


        form.updateDefaultValues({
            step: 'search',
        });

        form.addSubmitButton({ label: 'Search' });
        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'search') {

        log.debug('In Progress | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID);

        form.clientScriptModulePath = CS_SCRIPTID_PATH;
        form.addField({ id: 'step', type: 'text', label: 'Step' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' }).defaultValue = showLoading();
        form.addField({ id: 'teble_data', type: 'inlinehtml', label: 'TABLE_DATA' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'params', type: 'inlinehtml', label: 'PARAMS' }).updateDisplayType({ displayType: 'hidden' });
        form.addField({ id: 'is_next', type: 'checkbox', label: 'Is Next' }).updateDisplayType({ displayType: 'hidden' });


        //===================================== Add Body Field ==============================
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information Filters' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        var fieldGroup = form.addFieldGroup({ id: 'summary_information', label: 'Summary' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = false;

        // var fieldGroup = form.addFieldGroup({ id: 'plan_load_information', label: 'Plan Load Information' });
        //     fieldGroup.isBorderHidden = false;
        //     fieldGroup.isSingleColumn = false;


        var uiField = form.addField({ id: 'claim_result', type: 'select', label: 'Claim Result', source: null,  container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        for (i = 0; !!DOC_TYPE && i < DOC_TYPE.length; i++) {
            var value = i;
            var text = DOC_TYPE[i];
            uiField.addSelectOption({ value: value, text: text });
        }
            uiField.defaultValue = PARAMS['claim_result'];

        var uiField = form.addField({ id: 'date_select', type: 'date', label: 'Date', container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = PARAMS['date_select'];

        // var uiField = form.addField({ id: 'claim_result', type: 'select', label: 'Claim Result ', source: 'customlist_claim_result',  container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
        //     uiField.defaultValue = PARAMS['claim_result'];

        var uiField = form.addField({ id: 'customer_select', type: 'select', label: 'Customer Name', source: 'customer',  container : 'primary_information' }).updateDisplayType({ displayType : 'inline' });
            uiField.defaultValue = PARAMS['customer_select'];
        log.debug('PARAMS', PARAMS);


        //==================================================== Load Saved Search : SCRIPT - Select Transaction to Create PlanLoad ======================================

        var filterSearch = [];
        var columnSearch = [];

          filterSearch.push( search.createFilter({ name: 'createddate', join: "CUSTRECORDREF_CLAIM_MANAGEMENT", operator: 'on', values: PARAMS['date_select'] }) );
        //if (!!PARAMS['claim_result']) filterSearch.push( search.createFilter({ name: 'custrecord_crm_claim_result', join: null, operator: 'anyof', values: PARAMS['claim_result'] }) );
          // if (!!PARAMS['claim_result']) filterSearch.push( search.createFilter({ name: 'custrecord_crm_claim_result', join: null, operator: 'anyof', values: PARAMS['claim_result'] }) );
          // if (!!PARAMS['claim_result']) filterSearch.push( search.createFilter({ name: 'tranid', join: null, operator: 'anyof', values: PARAMS['doc_no_select'] }) );
        if ( PARAMS['claim_result'] == 1) {
            filterSearch.push( search.createFilter({ name: 'custrecord_crm_claim_result', join: null, operator: 'anyof', values: 1 }) );


        }
         else if  ( PARAMS['claim_result'] == 2) {
           filterSearch.push( search.createFilter({ name: 'custrecord_crm_claim_result', join: null, operator: 'anyof', values: [2 , 3] }) );
        }
          //  columnSearch.push( search.createColumn({ name: 'internalid' }) );
          //  columnSearch.push( search.createColumn({ name: 'recordtype' }) );


        var ssResult = getSearch(null, 'customsearch_ss_case_management_item',  columnSearch, filterSearch)
        for (i = 0; !!ssResult && i < ssResult.length; i++) {
            var rec_id = ssResult[i].getValue('name');
            var columns = ssResult[i].columns

            var key = rec_id;
            if (!REC_DATA[key]) {
                REC_DATA[key] = {};
                REC_DATA[key]['rec_item'] = ssResult[i].getText('custrecord_crm_item');
                REC_DATA[key]['rec_item_id'] = ssResult[i].getValue('custrecord_crm_item');
                REC_DATA[key]['rec_date'] = ssResult[i].getValue({name: 'custevent_crm_date_claim', join: 'CUSTRECORDREF_CLAIM_MANAGEMENT'});
                REC_DATA[key]['rec_id'] = ssResult[i].getValue('name');
                REC_DATA[key]['rec_name'] = ssResult[i].getValue({name: 'company', join: 'CUSTRECORDREF_CLAIM_MANAGEMENT'});
                REC_DATA[key]['rec_claim_result'] = ssResult[i].getValue('custrecord_crm_claim_result');
                REC_DATA[key]['claim_issue'] = ssResult[i].getValue('custrecord_crm_case_issue_type');

            }

        }

        log.debug('REC_DATA', REC_DATA);


        TABLE_DATA['tab'] = [];
        TABLE_DATA['body'] = PARAMS;

        var tab = {};
            tab['name'] = formName;
            tab['data'] = [];

        for (var key in REC_DATA) {
            var data = {};
                data = JSON.parse(JSON.stringify(REC_DATA[key]));

            tab['data'].push(data);

        }

        TABLE_DATA['tab'].push(tab);

        log.debug(tab['name'], TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]);


        //===================================== Add Sublist & Fields & Get Item (Plan Load Information) =============================
        var field_format = [];

        var sublist = form.addSublist({ id: 'list1', type: 'list', label: 'Claim Management ('+TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'].length+')' });
            sublist.addButton({ id: 'bt_mark_all', label: 'Mark All', functionName: 'markAll' });
            sublist.addButton({ id: 'bt_unmark_all', label: 'Unmark All', functionName: 'unmarkAll' });
        var field = { id: 'is_select', label: 'Selected', type: 'checkbox', source: 'item' };
            sublist.addField(field).updateDisplayType({ displayType: 'entry' });

        var field = { id: 'rec_item', label: 'รุ่น', type: 'text' };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        var field = { id: 'rec_item_id', label: 'รุ่น ID', type: 'select' };
            sublist.addField(field).updateDisplayType({ displayType: 'hidden' }); field_format.push(field);
        var field = { id: 'rec_date', label: 'วันที่รับ', type: 'date' };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        var field = { id: 'rec_id', label: 'Document No.', type: 'text', source: null };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        var field = { id: 'rec_name', label: 'Customer Name<br>(ร้านค้า)', type: 'select', source: 'customer' };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        var field = { id: 'rec_claim_result', label: 'Claim Result', type: 'select', source: 'customlist_claim_result' };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        // var field = { id: 'rec_claim_result_name', label: 'Claim Result', type: 'text', source: null };
        //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
        var field = { id: 'claim_issue', label: 'ผลการตรวจสอบ', type: 'select', source: 'customrecord_mapping_issue' };
            sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);

        log.debug('field_format', field_format);

        TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['columns_format'] = field_format;

        var ignoreValue = ['entry'];
        var line = 0;
        for (var index in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data']) {
            for (var column in TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index]) {
                var type = 'text';
                var value = TABLE_DATA['tab'][TABLE_DATA['tab'].length-1]['data'][index][column];
                for (var n in field_format) {
                    if (field_format[n]['id'] == column) {
                        type = field_format[n]['type'];
                        continue;
                    }
                }
                if (ignoreValue.indexOf(value) == -1) {
                    if (type == 'text' || type == 'select') {
                        value = nvlNull(value);
                    }
                    else {
                        value = nvlNull(value);
                    }


                    sublist.setSublistValue({ id: column, line: line, value: value });
                }
            }
            line++;
        }

        form.updateDefaultValues({
            step: 'summary',
            teble_data: JSON.stringify(TABLE_DATA),
            params: JSON.stringify(PARAMS),
        });


        form.addSubmitButton({ label: 'Save' });
        form.addButton({ id: 'bt_back', label: 'Back', functionName: 'startPage' });

        context.response.writePage(form);
    }
    else if (PARAMS['step'] == 'inProcess') {

        form.clientScriptModulePath = CS_SCRIPTID_PATH;

        //========================================== Add Primary Field =================================================
        var fieldGroup = form.addFieldGroup({ id: 'primary_information', label: 'Primary Information' });
            fieldGroup.isBorderHidden = false;
            fieldGroup.isSingleColumn = true;

        LOG_ID = PARAMS['LOG_ID'];
      ////////////////////////////////////////////////////////////////////////////////var sublist_id = 'tran_sublist';
        var group_inadj_customer = new Object();
        var sublist_id = 'list1';
        var tran_linecount = request.getLineCount(sublist_id);
        for(var i = 0; i < tran_linecount; i++){
            var check_select = reREQUESTquest.getSublistValue({group: sublist_id, name: 'is_select', line: i});
            if(check_select == 'T'){

                  var customer = request.getSublistValue({ group :sublist_id, name :'rec_name', line :i });
                   if( !group_inadj_customer[customer]){
                     group_inadj_customer[customer] = new Array();
                   }
                     group_inadj_customer[customer].push({
                       customer:customer,
                       item : request.getSublistValue({group: sublist_id, name: 'rec_item', line: i}),
                       item_id : request.getSublistValue({group: sublist_id, name: 'rec_item_id', line: i}),
                       location : 5 ,
                     });
            }
        }
        log.debug('request', JSON.stringify(request));
        log.debug('tran_linecount', (tran_linecount));

        log.debug('group_inadj_customer', JSON.stringify(group_inadj_customer));
      ///////////////////////////////////////////////////////////////////////////////////////////////////

        if (PARAMS['isStart'] == 'T') {
            var message = '';
            var data_parameter = {};
            var run_count = 1;
            var run_max = 5;
            do {
                try {
                    message = '';
                    data_parameter['custscript_process_rec_main_log_id'] = LOG_ID;
                    var script_task = task.create({ taskType: task.TaskType.MAP_REDUCE });
                        script_task.scriptId = MR_SCRIPT_ID;
                        script_task.deploymentId = 'customdeploy_manually'+run_count;
                        script_task.params = data_parameter;
                    var script_task_id = script_task.submit();

                    var task_status = task.checkStatus(script_task_id);
                        log.debug('taskStatus', task_status);

                } catch(ex) {
                    log.error('Error in script_task', ex);
                    message = 'ERROR: function is already running and cannot be started until it has completed. Please, Try again later';
                }
                run_count++;
            } while (run_count <= run_max && !!message)
        }

        LOG_REC = record.load({ type: 'customrecord_process_rec_main_log', id: LOG_ID });

        var showPecent = LOG_REC.getValue('custrecord_process_rec_percent_completed');

        if (showPecent.toString().indexOf('100') < 0) {
            showPecent = Number(showPecent) + '%';
            var uiField = form.addField({ id: 'custpage_html_loading', label: ' ', type: 'inlinehtml' });
                uiField.defaultValue = showLoadingRefresh(showPecent, LOG_ID);
        }
        else {
            var adj_id = '';
            var line_count = LOG_REC.getLineCount('recmachcustrecord_process_rec_main');
            var data_obj = LOG_REC.getSublistValue('recmachcustrecord_process_rec_main', 'custrecord_process_rec_data_object', 0);
                data_obj = JSON.parse(data_obj);
            // if (data_obj['status_select'] == 1) {
                adj_id = data_obj['custrecord_adl_refplanload'];
                    redirect.toRecord({
                    type: 'customrecord_claim_adjustment_84_85_log',
                    id: adj_id
                })
            // }
            // else {

                // var list_name = 'Plan Load Information';
                // if (data_obj['status_select'] == 6) {
                //     list_name = 'Hold Invoice';
                // }
                // else if (data_obj['status_select'] == 7) {
                //     list_name = 'Unhold Invoice';
                // }

                // var field_format = [];
                // var field = { id: 'rec_item', label: 'รุ่น', type: 'text' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
                // var field = { id: 'rec_item_id', label: 'รุ่น ID', type: 'select' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'hidden' }); field_format.push(field);
                // var field = { id: 'rec_date', label: 'วันที่รับ', type: 'date' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
                // var field = { id: 'rec_id', label: 'Document No.', type: 'text', source: null };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
                // var field = { id: 'rec_name', label: 'Customer Name<br>(ร้านค้า)', type: 'select', source: 'customer' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
                // var field = { id: 'rec_claim_result', label: 'Claim Result', type: 'select', source: 'customlist_claim_result' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);
                // var field = { id: 'claim_issue', label: 'ผลการตรวจสอบ', type: 'select', source: 'customrecord_mapping_issue' };
                //     sublist.addField(field).updateDisplayType({ displayType: 'inline' }); field_format.push(field);

                for (var i = 0; i < line_count; i++) {
                    var data_obj = LOG_REC.getSublistValue('recmachcustrecord_process_rec_main', 'custrecord_process_rec_data_object', i);
                        data_obj = JSON.parse(data_obj);
                    for (var key in data_obj) {
                        // sublist.setSublistValue({ id: key, line: i, value: nvlNull(data_obj[key]) });
                    }
                }
            // }
        }

        context.response.writePage(form);

        log.debug('END | step = '+PARAMS['step'], 'USE_SUB = '+USE_SUB+' | USER_ROLE_ID = '+USER_ROLE_ID+ ' | USER_ID = '+USER_ID+' | rec_list = '+PARAMS['rec_list']);
    }
}
// ################################################################################################
// ===== Library Function
// ################################################################################################
Date.shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getSearch(recordType, searchId, columns, filters) {
    var searchResults = [],
    searchOptions = {},
    searchObj = {};

    if(!!searchId){
        searchObj = search.load( {id: searchId} );

        //Copy the filters from objSearch into default Filters, Columns
        searchOptions.columns = searchObj.columns;
        searchOptions.filters = searchObj.filters

        //Push the new filter, column into default Filters, Columns
        for(var i in columns){
            searchOptions.columns.push(columns[i]);
        }

        for(var i in filters){
            searchOptions.filters.push(filters[i]);
        }

        //Copy the modified default Filters, Columns back into searchObj
        searchObj.columns = searchOptions.columns;
        searchObj.filters = searchOptions.filters;
    }else{
        if(!!recordType){ searchOptions.type = recordType; }
        if(!!columns){ searchOptions.columns = columns; }
        if(!!filters){ searchOptions.filters = filters; }

        searchObj = search.create( searchOptions );
    }

    var myPagedData = {};
    var myPage = {};
    var i = 0;

    myPagedData = searchObj.runPaged({pageSize: 1000});
    myPagedData.pageRanges.forEach(function(pageRange){
        myPage = myPagedData.fetch({index: pageRange.index});
        myPage.data.forEach(function(result){
            searchResults.push(result);
        });
    });

    return searchResults;
}

function addMinutes(dt, minutes, seconds) {
    if (!seconds) seconds = 0
    dt = new Date(dt.getTime() + (minutes*60000));
    dt = new Date(dt.getTime() + (seconds*1000));
    return dt;
}

function showLoading(percent) {
    if (!percent) percent = '';
    var loadingHTML = '';
        loadingHTML += '<div id="loadingScreen" style="position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(127, 140, 141, 0.75); z-index: 1001; cursor:wait;">';// display:none
        loadingHTML += ' <table border="0" width="100%" height="100%"><tr><td align="center" valign="middle">';
        loadingHTML += ' <table border="0" width="200px" height="100px" style="border-radius: 5px; background-color: rgba(10,10,10, 0.8); color: rgba(149, 165, 166, 1.0);">';
        loadingHTML += ' <tr><td align=center valign="middle" style="padding:0px 20px;font-weight: bold; font-size:13pt;">';
        loadingHTML += '  <br>In Progress ... '+percent+'<br><img width="220" height="25" src="' + getImageLoading() + '"/>';
        loadingHTML += ' </td>';
        loadingHTML += ' </tr>';
        loadingHTML += ' </table>';
        loadingHTML += ' </td></tr></table>';
        loadingHTML += '</div>';
    return loadingHTML;
}

function showLoadingRefresh(percent, LOG_ID) {

    var slUrl = url.resolveScript({ scriptId: SL_SCRIPT_ID, deploymentId: 'customdeploy1', returnExternalUrl: false });
        slUrl += '&step=inProcess';
        slUrl += '&LOG_ID='+LOG_ID;

    if (!percent) percent = '';
    var loadingHTML = '';
        loadingHTML += '<head><META HTTP-EQUIV="Refresh" CONTENT="10;URL='+slUrl+'"></head><div id="loadingScreen" style="position: fixed; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(127, 140, 141, 0.75); z-index: 1001; cursor:wait;">';// display:none
        loadingHTML += ' <table border="0" width="100%" height="100%"><tr><td align="center" valign="middle">';
        loadingHTML += ' <table border="0" width="200px" height="100px" style="border-radius: 5px; background-color: rgba(10,10,10, 0.8); color: rgba(149, 165, 166, 1.0);">';
        loadingHTML += ' <tr><td align=center valign="middle" style="padding:0px 20px;font-weight: bold; font-size:13pt;">';
        loadingHTML += '  <br>In Progress ... '+percent+'<br><img width="220" height="25" src="' + getImageLoading() + '"/>';
        loadingHTML += ' </td>';
        loadingHTML += ' </tr>';
        loadingHTML += ' </table>';
        loadingHTML += ' </td></tr></table>';
        loadingHTML += '</div>';
    return loadingHTML;
}

function getImageLoading() {
    return 'data:image/gif;base64,R0lGODlh3AATAMQAAMjIyL+/v6SkpLCwsK2trdHR0dra2t3d3ebm5tPT08LCwsbGxrm5ubW1tcDAwM7OzvHx8ezs7O/v77y8vMzMzJmZmdbW1qioqOHh4cTExOnp6Z6enpSUlPT09PX19f///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCAAfACwAAAAA3AATAAAF/+AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEj8TASVpHLJbDqf0Kh0Sq1ar9isdiqYtCaNAWHAKIMFl7F63A2438f0ms1Q2O8OuXhPaOPtaHx7fn96goR4hmuId4qDdX95c4+RAYGCA4yAjpmQhZN0YGYNXitdZAAUDwUFoq4TAaQJsxa1Fg5kcG6ytrYKubq8vbfAcMK9v7q7DMO1ycrHvsW6zcTKsczNz8HZw9vG3cjTsMIPqRYCLBUDCgUGBxgIBg0LqfYAGQzxCPz88/X38Onr1++Ap4ADCco7eC8hQYMAEe57yNCew4IVBU7EGNDiRn8Z831cGLHhSIgdFf9chPeggroJ7gjaWUWT1QQDEnLqjDCTlc9WOHfm7PkTqNCh54rePCqB6M+lR536hCpUqs2gVZM+xbrTqtGoWqdy1emValeXKyosMIBA5y1acFN1mEu3g4F2cGfJrTv3bl69FPj2xZt3L1+/fw3XRVw4sGDGcR0fJhxZsF3KtBTThZxZ8mLMgC3fRatC7QENEDrwLEorgE4PsD2s/tvqdezZf13Hvh2A9Szdu2X3pg18N+68xXn7rh1c+PLksI/Dhe6cuO3ow3NfV92bdArTqDuEbX3A8vjf5QWfT6Bg7Nz17c2fj69+fnq+8N2Lty+fuP78/eV2X13neIcCeBBwxorbZrAdAFoBDHrgoG8RTshahQ9iSCEAzUmYIYfNWViUhheCGJyIP5E4oom7WWjgCeAhAJNv1DVV01MRdJhhjdkplWNzO/5oXI846njjVEIqR2OS2B1pE5PVscajkw9MycqLJghQCwL40PjfAl4GqNSXYdZXJn5gSkmmmmJu1aZYb14V51do+pTOCmBg0AqVC4hG5IJ9PvYnhIFOxmdqhpaI6GeHCtpooisuutmg+Eg62KOMKuqoTaXgicQWoIYq6qiklmoqFV0UoeqqrLbq6quwxirrrLTWauutJ4QAACH5BAUIAB8ALAAAAADcABMAAAX/4CeOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8jkjsAhkAJQwaVEIAgaz+iUNBhcs4rLVtT1MsBiqvWclaq/7THZXFKE5Z8uXGS/c6t7Hw52aX+BggFuhmwjhHiAAzMbeAUJAZFZDYwiFhYOmI2Xmx+dCqB8oiWlp4iaqp6sUK4kq3WptLC2syO1maO9obucub6vprpYMpMUJAgIBg0LJADUDBjNzwzSjdXXI84Ho9QZ1tjhdd3m4unf2dt87CLg6+Te8u7T8R/z6PXq/eXahXv3YVxATi42OCAhoaEdXA8mGGDoEICxiRQf4pJIMYJGXgU4ZrS4EaOIhh5J/4IUOaLixY4fh7E8KSEmqZAmP6C0WWnmTpUyc+5z4YSiJ2PMjCpAWqJDBwNLISZt+TQqSGpNqzJVupUq1K40v0rNKvbq1LBWh2HlOpaiiwwwK4EM2ZCqR7nD6MaFGCDC3rl9/+YNbDcA3pt6Cx9OwJgwzbt86z42HFkwYsc6PUAGLDmzhhlO1648kFV00NJAbyoQGjp1Y9IjX8YuiVo2VdOqYd92bYl1B9yva9POKMPpgbSqU3vwcBxs5uZtvSKvhHs5dLNkpxeozlw79+tqlXd3bt27ePDJs8eA0GHzYL+KK8fnbJk65uU1H8ifrJ/+/Pf19QQff/t5Rpl/BCJoYHR/LzT0AEG5CTeahKdR9KBtNF043G4YZqbhhBZC2JNvH1bI4YYZiogThS0gIAF69mXHYHLsSTejfTWideN2C+T43IHh+WgckDQqtSM1QlZ1ZI9GSpXkcUs+SSSOTSph5ZVYZqnlllx26eWXYIYp5phklllECAAh+QQFCAAfACwAAAAA3AATAAAF/+AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IJG8jqAxIgajgUiIQBA2oIzCtDrAlheJCJQ2+DO3YOjqj1WQvWNs1v+nl9n0kjtvnImJrdnsfWw5+eoCBXHkfVhcbBDFTF1kkBQkBT1oNaZgWDpx8m58jFqGjjJ4lqAqqhqWtqWGyoK+1rLewUbqntJ2mIq68tr+4wbPIpGeUBA0DBiQICAYNCyQA2gwY09UM2Hzb3SPUB8If2hnc3udh4+3o6uzl3+/r5CLm4Nnw9e798MW7R0+fvYAFP+wLF8jfC0sNEpCQQFEMqAcTpI2gGMHiLY0bJXg8BvIDx5HDCv9kLFERgLKSJ11+ZClSJsmJLV/SRPkh08qQHW2m/Ckips4YZxTQDKWMwlKlt5ziNAD1mNSQVJs+1Tq1akptW6OGtTr269WiHbKK7coVaQMEODtm+qWSItAAc1PWjYv3YoAIfPP2TLD3rmDChdHK9WtXcV+6fwMzlgwZsOHJlytPdHFBqMkOYGfiDH1ztGfCCmB2AH1a04GdrVPDPhqS9FDVrGmjtT1Ytmndn3mjfr25xSS2a7F67e3Zg4cDyzPxdg69Ldrqya9HLzD9+fbu2MkiF6/c+ufwZmm6CEBZb+TM7i07foB5fv3PNe87z68Z/mCM8uH3WHzt/feeff0hSCB2UDOs9gBDt9H0IHAOQtgbbhOKVpuFPmHIoUoeUpibhrt96NuGImZYWm0yQJAWe9mdNyBzLipHn1U1anejWTnKuCONXf0o3QI9rgadkNwRGWRURb6IpDZNHsnkkjhOpcSVWGap5ZZcdunll2CGKeaYZJZpphEhAAAh+QQFCAAfACwAAAAA3AATAAAF/+AnjmRpnmiqrmzrvnAsz3Rt33iu73zv/8CgcEgsGo/IpE+waZQCE8HFRBA4SY6AlGo1KT7T0qD7vBC4jOc3PBpU01jHVkzGzknjq/1Mh+/RamZib4FsI0x+L256IwkBA14NiSIWDpBPkiaVl1iZJZuRkx+gmKKknaYKnCOPqasirZqqobKvH7GfliYMBLYsDBMNByUIBg0LJQAZDBjExl7LzSTFosrMztXR2NDX0wfZ3SPU3NLi3+Tbydre4OUi1MhxwjIKDBYlEhEKAJ8PEwb49PHLBRDfPlkFR+Q7SNCEBIYkCvwLCLHRRIMDI15UKBChw4qUNopYmNFiwpEdG//GgFJyZCVZFBwa+NIvJr6ZMGXSjAjAJokOOGvqzHlzZ6OeQ4UWJfozKE+fCp0ehfoCigaKBfoFkIBVK9ef+rJGlBih69itZhuRTUtpLdgAYtWifRu37VyOcL2yHeUWb12+dxU1SPCx5SgFwzB6VKzy5wfDjhI7hoy48OLJlxU+zjxyc2PNlCWD5uzigigPB4xS8txU9WHDqF1nhZ2aaVTZrG/bdombdu+kT4FPFb7acOm/HsLqpbvcb3OUec+WZS59bwF/051Xpy43O/QHzz8kj97dOnZ8LqiKfxBP48mR7El3iP8ZfnuTDum7z38/5Pv1/R3233wBSjSgfvjhg6BRf/zJRwNQ5FGijE7gPQVBURVOdWFrGUq4wIa3dfgaiLyJeN2HGOaCIocqkiheaiYq4yKEMa4YYovoKaHjjjz26OOPQAYp5JBEFmnkkUgmWUQIACH5BAUIAB8ALAAAAADcABMAAAX/4CeOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ik78LcNEiBqIBJIhAEz5FjOy0NroySQtGtDrBistWMhqq957B2TGXL5+XRt41f6+NpdX98InR+Int3H1sBeR9MWTEMDAOKHwkJAZVuDZYWFg6bc50lnwqihZqeoKiLqqWsaaQkpq1RsyO1squnu7C9nLy2r7SxUA0XC5IZCgwHJAgIBg3KIwDXztDSltfNGNoHkYXY3yPR4WkZ2ebb6esi59zk4PLe9O7l8O0k3e8f8fjoVRunKQEMZhQmGCAhoeGYYg8UMnQI4NfCiQ+LSRzRMELGXAU2cpTwUUSBkBdF/3QseQllCYoWJ3qsqDGlSpI0QYr8sDKnSZcjZ5aKaCFGNwovO4D6hXSiAQVMkz6N6hQqxKYjp16VahXkNa5Us3b9+bVq2JtavWJFO7Zl2RcKKERsGNTBSZAh6d70ePdnXpkB+rb8W1cwJsJ7A0MMEAGwYUyMHS9uXHiyZLyRK2PWy9MDX8sHE9rs/JbsM4w+3Z4eWVp10taQV9+EnWl0hw60FcgmnTr26961f8dEPZw1cN0xKgVI7cHDgbYnWzd/frYz9a1msYutPh16AenOvYO/rhasdrbcw1dvUakBgst+Myd+AHp+/c447zfPvxn+YPn4xaWfZ4r1p1l8lNlnoHOCCMoAwAAFCFeThDrZhttAplGY4UQPYOgahx5GZ2GHQyEHYokjhgiUcShq+KGD5pVXFX1qQTDjVTaKRSNZC+TI1o5u9XhjjUPy6KN1BRpZZJBH3vYckNEJqSOOSlRp5ZVYZqnlllx26eWXYIYp5phkKhECACH5BAUIAB8ALAAAAADcABMAAAX/4CeOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8jk7lIiXDYNUmAqYJKcguhIwb0Qmk5GyeGogrNjhfk6QEvV1tGgLX57z3URF45Pr+VhfnEic25bfGyGH2QTfzFahwN5IgkWAZJvDZMfFpaYkZudDp96l6GeaZoloqSLpquomacKrVOqJKyps7WvuLGgsL2EAC5QhwoMByQICAYMCyQA0snLzZvSGdQjzAfX0xjV3SXY2iLc3tng29bj3+Ho5R/n7cjq5uzR7uvi+env0Ic2tXhAcIIBEhIScvH1wCBChcR8OXy4UOLBEQkjVBxRoMBEjBI2UvJ4UURGkZxI/5aAGKzkh5MROaqkGHPkx5csLT7UWPMDBQoCWXSUtrKDJVhEHxpQgJRC0aVNnzJl6FTpVJlJQUKlKjWqVa9ar47MatKo2JRkcW7F2lNoJQUJQWrsKNNj3LJzGQa4izNv3b07A9AdaTfw4JSF5QrWy9eDB7+EASs+XCkx3sV/IxhmvDlzjKHKaLYsmvZtaJClEyhwiTP1atI9TcMeLVpnbayny7pm3aHD7tm2X2Dr6fjA2aHEPRgHW3Y516/PwzJXe7xA2uLVryvPntw5267Rm3N/NE3zZM7nPaePbP4yQfXu0ceH31fBe/ad8a9HLHm+fv/8tefCBAvc1BpAuAGX4GlDDyBoE2++OejTTKhJCJqCD2I44WsMWkihbh5yWCFtIwYn3BTgfWfVfRsuAMGKVL0YFovIySgejda5CCNbNlKHozQ99mbcjzrOGOOOYxV545FKNOnkk1BGKeWUVFZp5ZVYZqnlllweEQIAIfkEBQgAHwAsAAAAANwAEwAABf/gJ45kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyOSuUdmQCNBNgxSoCi6lKKOkUFygz4FgO+p6seEx13HNEtTUsxtelqfJ9e8c/zHr72ttgHGCIwNifFUThS92dQN8HwkJAZBxDZEWFgqWj5mbnSKKnw6hfZWkpqMlmpxrmKygr6mzsaW1JK2qqLYEM29cAAoMByQICAYMCyTCGcTGyJHNzyPHB9LC1CLW2MMY0NfBzt/V0eLaH9zn5NvmzNns6e513uBT7+P2y2UuAgOsDyYYICGhYJdcBQIOHFEwwkGEAksYBAAwIsOJFRdefDgioUURDTmK8KgRpASRkgr/fPwQkiLEkixPuuyosmTLjAQxMutni4LEDptiAfCZ04ACoUQvGkX6cynCoU2PPk1q0ilNqEWlXqUa0+rIBFiVav0aturYlGW7nk04Y5LKghcdsv36NqdchHXjBpibMq/JuzT9xgRMN0AEu3vxGkbM1+1ivY0nPf6bOPDkwZULw6Uc+UFbSsVyppUceuNMsqVNjgb9c7WC1DFdw+zQQXbr02hn18ZN+rYt3bZF86YkI2FaDx4OrDUelWlW52Khm5Wuljpy5daTLz+uPTv2qc3Bw3jg8TBkxeY5o2e8/rzl9Jg9v2c/371m+vft972MXGZ79fW9QIFCvr1U4FXA7YPgXoGoMZibgyRBWJOEr1GYIE7CYdgIBQsoOJ14YslH1gIQZCUiWiSaOFWJIa6o4lYsmnWicSm2COOLI8ao1ozG6UibcjwKo6MSRBZp5JFIJqnkkkw26eSTUEYp5ZRChAAAIfkEBQgAHwAsAAAAANwAEwAABf/gJ45kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyCSPMNgISsxNgxSoCi5QgoBRUiguTNKgyaV+sWKy+Zzddh3XdnnkjafdZrD8rb/PP15sfnxhI2N4dAxOMQMTDQRvDX8fCQkBjWaSJRYWCpiJmiScnpGTo58iVaEjp6WbnaiAl6awrqK1mbSkua8Osaq6aC+NALEAxwwYJAgIBgwLJMcZycvNk9LUI8wH18jK2tZd3tXc4grZIttT0ePg5ezT3+nh8Ogf6ub2+PXy99aBLyY8eNbLAAkJCL3cGmhwBMIICm9NaOhQQkRWBSYeTAigYAmOHitC7CiRogiQJTf/jgxZ8aKIAhlNPnRJKaZKmi0WnOtF4WOHTq+O+TSgIGjPjUSNDi268GjFpE2XKkXKFKNQqlOfVn2Z4KrWrCd/bg04gCTXjAhFOoCJEe1NtmcDpA0LEW5Nt2rtVsJLN4DeSnLfLgycd3AEwW0J9/3L94MHD3UNI37pgoCuAz69clWAeaPmmpwzm90ss0OHz4A7txwNuvRp1qlFswyL2pJq2rBty07pGbaLJ1GxBv86POyBsTA/Pz4O1rEH5sWdQ7fKejnyAsqfX88+fXN17c2tv6osuXDiw+bjol9cnv35yXcVO7f4oP18BfXfp4+//n5+9fAlJ99j9C00Q3KuPQANbW8VKTibcw4yiNuDpkVoVYILXribhr1R+JqHFpK24WYyPIBdhsb5FZ1px/0H2gIQUOWigDFqNeOJNaZ44zE5SqcidT2y+KN3QYq1I4wyNlVki0omaZUSUEYp5ZRUVmnllVhmqeWWXHbp5ZdGhAAAIfkEBQgAHwAsAAAAANwAEwAABf/gJ45kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKSvsRGYCJtGKTARXJ4ChklxuZYG2e3HSwJrp13seaRwjNVbKxxNHpnjhDmJWxfd9w5pX2F7UgMyAAx5Uw1rIwkOh4yOIhYKkoWUH5aYbI0mnFufJaGToJeimqWZp50iVKqopqSyrKSKMgUFAxklAG0YJQgGDQu+GQzBJMMMxoDJwgeav9DL0lvIyiPM2NXbxN3aIszObNnR0+fW6d7j18ftH9wxBdK9JLoTBiUSEW2kD/Tx8wfg1D5+/24dHNEvIT6BCAsqHOjwEUQSEipWuiiiocSHCxlq3MTxg0eDFO//wTAQ8BQFEx0suYRpQMFMfjVvYsxJ6yVOmz1pAsUHwOfOoY+KCtXJkCdRo02RVlL6ExGkBwAVSKCoC1+BAFsx+uv66GtYhmOzRuCqlq1XsG7LwhUbgGwls3HvzkVbty1du5vw/kX0QSrJAzALo4y4GKNiWiE7PgaZ+KPFyCYnX67cWKTljYgZQ+Y8WnSMUU+XBq26+ijTjgcMF9AMWzZtk7Ff47b9ebduD7lbR/0dXAYhuWsHv03OF+vyvIH3dszoHDn0fMyn932u3Hp3vdlNUvfbnLz26pVcyFaAucODcpv5ve/ccX5pjPYpy4cPGmb++Pjxd5h/An7V3n/97UefSkkIbkJDAb+oltpP6G3yCwQU9oThURVCuMCGUXV4YYZPgVibiB+SmFSKHGqo4lQshniLEjTWaOONOOao44489ujjj0AGKeSQRYQAACH5BAUIAB8ALAAAAADcABMAAAX/4CeOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikj8EUXEoEwqZBClidUCmjpAhgSYOBYFtVXJ5gMXnUPWfHZTNaFFbH3Wl4+TsK69lyb2sibXN0doCBeVQjTAEzFA8fA1wTDRMlFhYOlGWXmZudgJ8kmgqihAGkI6aoH1arIq2VsR+znoO2obS5t6O9u7igp7wlDwC1LAYHFg0LJADRDBgkCAgGDM+J09XXudEZ3CPWB9nQ0tTj3sbo3eXs4eki5N/t6tjw4vPe2oT2++/OxXNXr4u8DxgwJBiACYa1LvAMkJBAUQGAUgUeTJA4gmIEi8YKbCxR8SLGkR1L/4ZEmRLkSY4iPLpkJRJmTAkzZdWcqPIlSZwmabL8IDOozqFFYyCQsGkYhZ9NMUaDqsApVas8DVSV+jTrVppTvWJNqXXszbJcr6YVu5bsVxcHNCAIkJGmSIopP9bVeZenXox989IFHCCC38F2Cx/eqyvwzb+J8T5GzFexYMYJMluejFmz4cuEJRP1APlF3LBCD/xEfVQ1T9a6FLhuaTS2zdGwNc++mTuB7NW1dQMfdrtDh96/Xwf3Xfz48uS0YwAwINLs6ANvY9f24AG7de7e257NnhE2ePLl1YLd3h29+fbf4Yu/7p59eBgLRHat/Jlz6MX/gRYZgAMKyB+BBxrY2HhmowEVoH8FQpighKYxsVJzx1w4nE/KadghhyllCCJv/bS2YWonmvghiiuqGGKJ+IX03n06zUiZdhB4Jcl6Obq1Y40L9DjejzjqyJWQ9BFZXpBG8tgkkEgah52S5UXZwZRKZKnlllx26eWXYIYp5phklmnmmWgqEQIAOw==';
}

function nvl(input, output) {
    if (input === 0) return Number(input).toFixed(2);
    if (!!input && !isNaN(input)) return Number(input).toFixed(2);
    if (!!input || input === 0) return input;
    if (!!output || output === 0) return output;
    return null;
}

function nvl8(input, output) {
    if (!!input && !isNaN(input)) return Number(input).toFixed(8);
    if (!!input || input === 0) return input;
    if (!!output || output === 0) return output;
    return null;
}

function nvlNull(input, output) {
    if (!!input || input === 0) return input.toString();
    if (!!output || output === 0) return output;
    return null;
}
