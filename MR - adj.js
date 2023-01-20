/**
* @NApiVersion 2.0
* @NScriptType MapReduceScript
*/

var record, search, log, format ,runtime,libCode,  setting,file


define(['N/record', 'N/search', 'N/log', 'N/format','N/runtime','N/file','../Library/Libraries Code 2.0.200414.js'],
function(_record, _search, _log, _format,_runtime,_file,_libCode)
{

  record = _record;
  search = _search;
  log = _log;
  format = _format;
  libCode = _libCode;
  file=_file;

  //	setting = _setting;
  runtime  = _runtime;

  var  clientCode, username, password,fileSetting;
  //var fileSetting = 'SuiteScripts/Lib/Setting.js'

  function getInputData(context)
  {
    try {

      var results= new Array();
      var scriptObj = runtime.getCurrentScript();
      var adj_id =  scriptObj.getParameter({name: 'custscript_adj_id'});
          log.debug('getInputData | adj_id', adj_id);

      var scriptObj = runtime.getCurrentScript();
			  recordObj = record.load({
			      type: 'inventoryadjustment',
			      id: adj_id
			  })


        itemCount = recordObj.getLineCount({sublistId:"inventory"});
        // for(var i = 0; i < itemCount; i++ ){
          var log_id = recordObj.getValue('id');
          var adj_type = recordObj.getValue("custbody_thl_adjustmenttype");
          var checkbox_adj = recordObj.getValue("custbody_alreadydoneforinvadj");
          var customer = recordObj.getValue("customer");
          var date = recordObj.getValue("trandate");
          // var item = recordObj.getSublistValue({sublistId : 'inventory',fieldId : 'item',line: i});


          // var date_= format.parse({ value: date, type: format.Type.DATE, timezone: format.Timezone.ASIA_BANGKOK });
          var tmp = new Object();
              tmp['id'] = log_id;
              tmp['itemCount'] = itemCount;
              tmp['adj_type'] = adj_type;
              tmp['checkbox_adj'] = checkbox_adj;
              tmp['customer'] = customer;
              tmp['date'] = date;
              // tmp['item'] = item;
              results.push(tmp);
        // }





      log.error({title:"results",details:results});

      return results
      //return pricelists;
    } catch (e) {
      log.error({
        title : "Exception",
        details : e
      });
      return null;
    }

  }
  function reduce(context)
  {
    var id = context.values;
    for (var i = 0; i < id.length; i++) {
        var data = JSON.parse(id[i]);
    }
        log.error('data', data);


      try {
          var recordObj = record.load({
            type: 'inventoryadjustment',
            id: data.id,
            isDynamic: true
          });
          if(data.adj_type == 5){
              log.error('data.adj_type', JSON.stringify(data.adj_type));
              var id = recordObj.getValue('tranid');
              var date = recordObj.getValue('trandate');

              var dataRec = record.create({ type: 'journalentry', isDynamic: false });

              dataRec.setValue({fieldId:"custbody_je_journalentrytype",value: 1});
              dataRec.setValue({fieldId:"trandate",value: format.parse({ value: date, type: format.Type.DATE, timezone: format.Timezone.ASIA_BANGKOK })});
              dataRec.setValue({fieldId:"approvalstatus",value: 2});
              dataRec.setValue({fieldId:"custbody_refinventoryadjustment",value: data.id});
              dataRec.setValue({fieldId:"custbody_alreadydoneforinvadj",value: true});
              dataRec.setValue({fieldId:"custbody_apc_document_approval_status",value: 3});
              dataRec.setValue({fieldId:"custbody_thl_transactiontype",value: 4});
              dataRec.setValue({fieldId:"custbody_apc_ignore_approval_process",value: true});


              var Filters = new Array();
              var Column = new Array();
              var ssItemList = new Array();
              Filters.push(search.createFilter({ name: 'internalid', join: null , operator: 'anyof', values:  data.customer }));
              var ssItemList = libCode.loadSavedSearch(null ,'customsearch_customer_pricing_group', Filters, Column);
                var sumTable = new Array();
                var serial_obj = new Object();
                if (!!ssItemList && ssItemList.length > 0) {
                    for(var i = 0; ssItemList != null && i < ssItemList.length; i++) {
                        // ################################################################################################
                        var columns = ssItemList[i].columns
                        var pricing_level= (ssItemList[i].getValue({name: 'grouppricinglevel', join: null, summary: null }));
                        var pricelevel= (ssItemList[i].getValue({name: 'pricelevel', join: null, summary: null }));
                        // ################################################################################################

                    }
                }
                log.error('pricing_level', pricing_level);
                log.error('pricelevel', pricelevel);
              // var grouppricing_level = search.lookupFields({ type: 'customer', id: data.customer, columns: ['grouppricinglevel'] });
              // log.error('grouppricing_level', grouppricing_level);
              //
  						// var grouppricing_level_cus = (!!grouppricing_level && !!grouppricing_level['grouppricing_level']) ? pricing_group['grouppricing_level'] : '';
              // log.error('grouppricing_level_cus', grouppricing_level_cus);


              var count_line = 0;
              var level = 'price' + pricelevel;
              log.error('level', level);
              log.error('data.itemCount;', data.itemCount);
              var item_arry = new Array();
              var qty_arry = new Array();
              var item_obj = new Object();
                for (var j = 0; j < data.itemCount; j++){
                  var item = recordObj.getSublistValue({sublistId : 'inventory',fieldId : 'item',line: j});
                  var quantity = recordObj.getSublistValue({sublistId : 'inventory',fieldId : 'adjustqtyby',line: j});

                  item_arry.push(item);
                  qty_arry.push(quantity);

                }

                log.error('item_arry', item_arry);
                log.error('qty_arry', qty_arry);
                //
                // log.error('item_obj[item]', item_obj[item]);

                  var Filters = new Array();
                  var Column = new Array();
                  var ssItemList = new Array();
                  Filters.push(search.createFilter({ name: 'internalid', join: null , operator: 'anyof', values:  item_arry}));
                  var ssItemList = libCode.loadSavedSearch(null ,'customsearch_item_base_price', Filters, Column);
                    var sumTable = new Array();
                    var serial_obj = new Object();
                    if (!!ssItemList && ssItemList.length > 0) {
                      for(var i = 0; ssItemList != null && i < ssItemList.length; i++) {
                        // ################################################################################################
                        var internalid = (ssItemList[i].getValue({name: 'internalid', join: null, summary: null }));

                        if(!item_obj[internalid]){
                          item_obj[internalid] = {
                            internalid : internalid,
                            free_item : (ssItemList[i].getValue({name: 'custitem_freegiftnotbattery', join: null, summary: null })),
                            pricinggroup : (ssItemList[i].getValue({name: 'price' + pricelevel , join: null, summary: null })),
                            baseprice : (ssItemList[i].getValue({name: 'baseprice', join: null, summary: null }))
                          };
                        }
                      }
                    }

                            //
                            log.error('item_obj[item_arry]', item_obj[item_arry]);
                            log.error('item_obj[item_arry[i]].pricinggroup', item_obj.pricinggroup);
                            // log.error('qty_arry[i]', qty_arry[i]);
                            // log.error('item_arry[i]', item_arry[i]);
                            //
                            // log.error('free_item', free_item);
                      for(var i = 0; i < item_arry.length; i++) {
                        if(!!item_obj[item_arry[i]].pricinggroup && item_obj[item_arry[i]].free_item == false ){
                          var sum = ((qty_arry[i]*item_obj[item_arry[i]].pricinggroup));
                          var sum_vat = sum*0.07;
                          log.error('sum', sum);
                          log.error('sum_vat', sum_vat);
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 637});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'debit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 209});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'credit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_vattype', line : count_line, value : 2});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_oritaxcode', line : count_line, value : 9});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_baseamtforeigncurren', line : count_line, value : sum});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_entitylist', line : count_line, value : data.customer});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_enttaxinvoiceno', line : count_line, value : id});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                        }else if(!!item_obj[item_arry[i]].pricinggroup && item_obj[item_arry[i]].free_item == true){
                          var sum = ((qty_arry[i]*item_obj[item_arry[i]].baseprice));
                          var sum_vat = sum*0.07;
                          log.debug('sum', sum);
                          log.debug('sum_vat', sum_vat);
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 637});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'debit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 209});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'credit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_vattype', line : count_line, value : 2});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_oritaxcode', line : count_line, value : 9});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_baseamtforeigncurren', line : count_line, value : sum});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_entitylist', line : count_line, value : data.customer});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_enttaxinvoiceno', line : count_line, value : id});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                        }else if(!item_obj[item_arry[i]].pricinggroup && item_obj[item_arry[i]].free_item == true){
                          var sum = ((qty_arry[i]*item_obj[item_arry[i]].baseprice));
                          var sum_vat = sum*0.07;
                          log.debug('sum', sum);
                          log.debug('sum_vat', sum_vat);
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 637});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'debit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 209});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'credit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_vattype', line : count_line, value : 2});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_oritaxcode', line : count_line, value : 9});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_baseamtforeigncurren', line : count_line, value : sum});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_entitylist', line : count_line, value : data.customer});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_enttaxinvoiceno', line : count_line, value : id});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                        }else if(!!item_obj[item_arry[i]].pricinggroup && item_obj[item_arry[i]].free_item == false){
                          var sum = ((qty_arry[i]*item_obj[item_arry[i]].baseprice));
                          var sum_vat = sum*0.07;
                          log.debug('sum', sum);
                          log.debug('sum_vat', sum_vat);
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 637});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'debit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;

                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'account', line : count_line, value : 209});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'location', line : count_line, value : 1});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'department', line : count_line, value : 13});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'credit', line : count_line, value : sum_vat});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_vattype', line : count_line, value : 2});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_oritaxcode', line : count_line, value : 9});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_baseamtforeigncurren', line : count_line, value : sum});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_entitylist', line : count_line, value : data.customer});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_thl_enttaxinvoiceno', line : count_line, value : id});
                          dataRec.setSublistValue({ sublistId : 'line', fieldId : 'custcol_item_code_jv', line : count_line, value : item_obj[item_arry[i]].internalid});

                          count_line++;
                        }
                      }


                dataId = dataRec.save();
                  if(!!dataId){
                    record.submitFields({
                       type : 'inventoryadjustment',
                       id : data.id,
                       values : {
                         custbody_refjournalentry : dataId,
                         custbody_alreadydoneforinvadj : true
                       }
                     });
                 }
          }
     } catch (e) {
       log.error({
         title : "Exception",
         details : e.message
       });
     }
    // }
  }


  return {
    getInputData: getInputData,
    // map: map,
    reduce : reduce

    //  summarize: summarize
  };
});
