/**
 * EMSE_MA_INT_LOCKBOX_INTAKE
 */
var myCapId;
var myUserId = "BATCHUSER";
capId = null;
var debugOn = true; // set to true to send debug info by email.
//wfProcess = "DPL_APPLICATION_WITH_EXAM";
//wfTask = "Pre-Hearing"; 
//wfStatus = "Motion Filed"; 
aa.env.setValue("EventName", "WorkflowTaskUpdateAfter");
//aa.env.setValue("EventName","ApplicationSpecificInfoUpdateAfter");
//aa.env.setValue("EventName","ApplicationSubmitAfter");
//aa.env.setValue("EventName","RenewalInfoUpdateAfter");
//aa.env.setValue("EventName","ConvertToRealCAPAfter");
//aa.env.setValue("EventName","PaymentReceiveAfter");


var runEvent = true; // set to false if you want to roll your own code here in script test
/* master script code don't touch */
//var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); aa.env.setValue("PermitId2",tmpID.getID2()); aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { useSA = true; SA = bzr.getOutput().getDescription(); bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); } }if (SA) { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA)); /* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA)); }else { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS")); eval(getScriptText("INCLUDES_ACCELA_GLOBALS")); } eval(getScriptText("INCLUDES_CUSTOM"));if (documentOnly) { doStandardChoiceActions(controlString,false,0); aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed."); aa.abortScript(); }var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) { var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE"); doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT"); doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; } function getScriptText(vScriptName){ var servProvCode = aa.getServiceProviderCode(); if (arguments.length > 1) servProvCode = arguments[1]; vScriptName = vScriptName.toUpperCase(); var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); try { var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN"); return emseScript.getScriptText() + ""; } catch(err) { return ""; }} logGlobals(AInfo); if (runEvent && doStdChoices) doStandardChoiceActions(controlString,true,0); if (runEvent && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z);
//
// User code goes here


/*********************************************************************************************************************
 *The Division of Professional Licensure (DPL) and the Alcoholic Beverages Control Commission (ABCC) both allow       *
 *individuals to pay for their applications/renewals by paper check through the use of a lockbox.                     * *                                                                                                                    *
 * @author Sagar Cheke 25/07/2014                                                                                    *
 *********************************************************************************************************************/

try {
    try {
        //Import the utility script which contains functions that will be used later
        var SCRIPT_VERSION = 2.0;
        eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
        eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
        eval(getScriptText("INCLUDES_CUSTOM"));
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
        var returnException;
        // var original_func = logDebug;

        // logDebug = function(dstr) {
        //     if (debugOn) {
        //         aa.print(dstr);
        //         return original_func(dstr);
        //     }
        // }

        // Print only Error logs
        ELPLogging.setLogLevel(5);
        ELPLogging.debug("Finished loading the external scripts");
        logDebug("Finished loading the external scripts");
    } catch (ex) {
        returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
        aa.print(returnException.toString());
        throw returnException;
    }

    var stagingConfigurationString = '{\
        "supplemental":   [{\
                "tag":"insert",\
            "procedure":{\
                  "name":"ELP_SP_ERROR_INT_INSERT",\
                  "parameters":{"list":[\
                                   {"source":"RESULT","name":"BatchInterfaceName","parameterType":"IN","property":"BatchInterfaceName","type":"STRING"},\
                                   {"source":"RESULT","name":"RecordID","parameterType":"IN","property":"RecordID","type":"STRING"},\
                                   {"source":"RESULT","name":"ErrorDescription","parameterType":"IN","property":"errorMessage","type":"STRING"}]}}}]}';

    // POC
    var selectQueryConfiguration = '{\
        "selectQuery":{\
            "table":"ELP_TBL_LOCKBOX_STG_MA",\
            "parameters":{\
                "list":[{\
                    "source":"STATIC",\
                    "name":"serviceProviderCode",\
                    "parameterType":"IN",\
                    "property":"serviceProviderCode",\
                    "type":"STRING"},\
                    {"source":"STATIC","name":"batchInterfaceName","parameterType":"IN","property":"interface_name","type":"STRING"},\
                    {"source":"RESULT","name":"runDate","parameterType":"IN","property":"runDate","type":"DATE_TIME"}\
                    ]},\
                    "resultSet":{\
                        "list":[\
                        {\
                            "source":"RESULT",\
                            "name":"rowNumber",\
                            "parameterType":"OUT",\
                            "property":"ROW_NUMBER",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"batchInterfaceName",\
                            "parameterType":"OUT",\
                            "property":"BATCH_INTERFACE_NAME",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"serviceProviderCode",\
                            "parameterType":"OUT",\
                            "property":"SERVICE_PROVIDER_CODE",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"transactionGroup",\
                            "parameterType":"OUT",\
                            "property":"TRANSACTION_GROUP",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"batchNumber",\
                            "parameterType":"OUT",\
                            "property":"BATCH_NUMBER",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"sequenceNumber",\
                            "parameterType":"OUT",\
                            "property":"SEQUENCE_NUMBER",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"paymentAmt",\
                            "parameterType":"OUT",\
                            "property":"PAYMENT_AMT",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"boardCode",\
                            "parameterType":"OUT",\
                            "property":"BOARD_CODE",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"typeClass",\
                            "parameterType":"OUT",\
                            "property":"TYPE_CLASS",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"licenseNumber",\
                            "parameterType":"OUT",\
                            "property":"LICENSE_NUMBER",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"renewDate",\
                            "parameterType":"OUT",\
                            "property":"RENEW_DATE",\
                            "type":"DATE_TIME"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"dueDate",\
                            "parameterType":"OUT",\
                            "property":"DUE_DATE",\
                            "type":"DATE_TIME"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"amountDue",\
                            "parameterType":"OUT",\
                            "property":"AMOUNT_DUE",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"lateAmtDue",\
                            "parameterType":"OUT",\
                            "property":"LATE_AMT_DUE",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"lockboxNumber",\
                            "parameterType":"OUT",\
                            "property":"LOCKBOX_NUMBER",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"boardCode2",\
                            "parameterType":"OUT",\
                            "property":"BOARD_CODE2",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"typeClass2",\
                            "parameterType":"OUT",\
                            "property":"TYPE_CLASS2",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"changeCode",\
                            "parameterType":"OUT",\
                            "property":"CHANGE_CODE",\
                            "type":"INTEGER"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"depositDate",\
                            "parameterType":"OUT",\
                            "property":"DEPOSIT_DATE",\
                            "type":"DATE_TIME"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"recordId",\
                            "parameterType":"OUT",\
                            "property":"RECORD_ID",\
                            "type":"STRING"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"runDate",\
                            "parameterType":"OUT",\
                            "property":"RUN_DATE",\
                            "type":"DATE_TIME"\
                        },\
                        {\
                            "source":"RESULT",\
                            "name":"dateLoaded",\
                            "parameterType":"OUT",\
                            "property":"DATE_LOADED",\
                            "type":"DATE_TIME"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"stgErrorMessage",\
                            "parameterType":"OUT",\
                            "property":"STG_ERROR_MESSAGE",\
                            "type":"STRING"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"intakeStatus",\
                            "parameterType":"OUT",\
                            "property":"INTAKE_STATUS",\
                            "type":"STRING"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"recordType",\
                            "parameterType":"OUT",\
                            "property":"RECORD_TYPE",\
                            "type":"INTEGER"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"checkDigit",\
                            "parameterType":"OUT",\
                            "property":"CHECK_DIGIT",\
                            "type":"INTEGER"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"checkDigit1",\
                            "parameterType":"OUT",\
                            "property":"CHECK_DIGIT1",\
                            "type":"INTEGER"\
                        },\
                            {\
                                "source":"RESULT",\
                            "name":"checkDigit2",\
                            "parameterType":"OUT",\
                            "property":"CHECK_DIGIT2",\
                            "type":"INTEGER"\
                        },\
                            {\
                                "source":"RESULT",\
                                "name":"remitCode",\
                                "parameterType":"OUT",\
                                "property":"REMIT_CODE",\
                                "type":"STRING"\
                            },\
                            {\
                                "source":"RESULT",\
                                "name":"deptID",\
                                "parameterType":"OUT",\
                                "property":"DEPT_ID",\
                                "type":"STRING"\
                            },\
                            {\
                                "source":"RESULT",\
                                "name":"rntpCode",\
                                "parameterType":"OUT",\
                                "property":"RNTP_CODE",\
                                "type":"STRING"\
                            }\
                            ]\
                        }\
                    }\
                }';

    try {
        //load all of the input parameters into objects
        var stagingConfigObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("stagingConfiguration"));
        var staticParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));
        var dynamicParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("dynamicParameters"));
        var batchAppResultObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));
        var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

        // POC
        var selectQueryObj = datatypeHelper.loadObjectFromParameter(selectQueryConfiguration);

        ELPLogging.debug("Finished loading the input parameters into JSON objects");
        logDebug("Finished loading the input parameters into JSON objects");
        
        logDebug("stagingConfigObj: " + aa.env.getValue("stagingConfiguration"));
        logDebug("staticParamObj: " + aa.env.getValue("staticParameters"));
        logDebug("dynamicParamObj: " + aa.env.getValue("dynamicParameters"));
        logDebug("batchAppResultObj: " + aa.env.getValue("batchApplicationResult"));

    } catch (ex) {
        returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
        ELPLogging.fatal(returnException.toString(), ex);
        logDebug(returnException.toString() + " " + ex);
        throw returnException;
    }

    try {
        //Create a connection to the Staging Table Database
        var dbConn = DBUtils.connectDB(stagingConfigObj.connectionInfo);
        ELPLogging.debug("Established a Database Connection");
        logDebug("Established a Database Connection");
    } catch (ex) {
        returnException = new ELPAccelaEMSEException("Error Connecting to Staging Table Database " + ex.message, ScriptReturnCodes.STAGING_CONNECTION);
        ELPLogging.fatal(returnException.toString(), ex);
        logDebug(returnException.toString() + " " + ex);
        throw returnException;
    }

    var maxSeconds = 60 * 59 * 1;
    var timeExpired = false;
    // Global variables
    var batchStartDate = new Date();
    // System Date
    var batchStartTime = batchStartDate.getTime();

    // Added because updateTask (used in functions in INCLUDES_CUSTOM, requires this
    var systemUserObj = aa.person.getCurrentUser().getOutput();
    var currentUserID = systemUserObj.getUserID();
    ELPLogging.debug("USER", systemUserObj);    
    logDebug("USER: " + currentUserID);
    //Create the global variables that will be used throughout the script
    var HOUR_SEC = (60 * 60);
    var paymenType = "Check";
    var conditionType = "ELP Interfaces";
    var STDCHOICE_ACTIVEBOARDCODES = "INT_ACTIVE_BOARDS";
    var stdcActiveBoardCodeArray = getSharedDropDownList(STDCHOICE_ACTIVEBOARDCODES);

    var stdChoiceBoard = "BOARDS";
    var stdChoiceBoardArray = getSharedDropDownList(stdChoiceBoard);
    var servProvCode = staticParamObj.serviceProviderCode;
    var runDateMs = Date.parse(dynamicParamObj.lastRunDate);
    var runDt = new Date(runDateMs);
    var runDtStr = jsDateToMMDDYYYY(runDt);
    var lastRunDate = new java.util.Date(runDateMs);
    var batchInterfaceName = staticParamObj.interface_name;

    var abccWfTask = "Intake";
    var abccWfStatus = "Under Review";
    var dplWfTask = "Intake";
    var dplWfStatus = "Under Review";
    var dplMatchFeePayment = false;
    var gracePeriodFlag = false;
    var updateWorkflowTaskFlag = true;

    try {
        // POC
        var processedCount = countStagingRecords(dynamicParamObj.serviceProviderCode, dynamicParamObj.batchInterfaceName, new Date(batchAppResultObj.runDate));

        // POC
        // var processedCount = countImportedRecords(new Date(batchAppResultObj.runDate));
        updateDynamicParams(processedCount);
        dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
        var DPS = JSON.stringify(dynamicParamObj);
        aa.env.setValue("dynamicParameters", DPS);
        logDebug("DPS: " + DPS);
    } catch (ex) {
        ELPLogging.notify("Error in updating Dynamic table with processed record count " + ex.toString(), ex);
    }

    try {
        // POC
        var stagingQueryParameters = {
            "serviceProviderCode": dynamicParamObj.serviceProviderCode,
            "batchInterfaceName": dynamicParamObj.batchInterfaceName,
            "runDate": new Date(batchAppResultObj.runDate),
            "tableName": selectQueryObj.selectQuery.table
        };

        var dataSetStg = getStgRecords(stagingQueryParameters);

        // POC
        // var emseQueryParameters = {
        //     "serviceProviderCode": servProvCode,
        //     "batchInterfaceName": batchInterfaceName,
        //     "runDate": lastRunDate
        // };
        // var dataSetStg = queryStgRecord(emseQueryParameters);
    } catch (ex) {
        returnException = new ELPAccelaEMSEException("Error while getStgRecords  : " + ex.message);
        ELPLogging.fatal(returnException.toString(), ex);
        logDebug(returnException.toString() + " " + ex);
        throw returnException;
    }

    var queryForDBFields = "";
    var skipRecordCount = 0;
    while ((queryForDBFields = dataSetStg.next()) != null) {
        if (elapsed() > maxSeconds) // Only continue if time hasn't expired
        {
            ELPLogging.error("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " 
                + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
            ELPLogging.debug("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " 
                + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
            logDebug("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " 
                + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
            timeExpired = true;
            break;
        }

        try {
            //ELPLogging.error("Query DB Fields", queryForDBFields);
            var batchInterfaceName = queryForDBFields.batchInterfaceName;
            var batchNumber = queryForDBFields.batchNumber;
            var sequenceNumber = queryForDBFields.sequenceNumber; // Assumption sequenceNumber = sequenceNumber;
            var paymentAmount = queryForDBFields.paymentAmt;
            //ELPLogging.error("Payment Amount is: "+paymentAmount);

            //Unique for DPL
            var boardCode = queryForDBFields.boardCode;
            var typeClass = queryForDBFields.typeClass;

            ELPLogging.error("Processing License # " + queryForDBFields.licenseNumber + "-" + queryForDBFields.boardCode + "-" + queryForDBFields.typeClass);
            logDebug("Processing License # " + queryForDBFields.licenseNumber + "-" + queryForDBFields.boardCode + "-" + queryForDBFields.typeClass);

            // Defect #9890
            if (boardCode == "SW") {
                ELPLogging.debug("Retrieveing the typeClass information from std choice for SW board.");
                logDebug("Retrieveing the typeClass information from std choice for SW board.");
                typeClass = getSharedDropDownDescriptionDetails(typeClass, "LOCKBOX_TYPECLASS");
            }

            // Defect # 10300 - Start
            // JIRA 1747 
            if (boardCode == "OP" && (typeClass == "TP" || typeClass == "DP")) {
                ELPLogging.debug("Retrieveing the typeClass information from std choice for OP board.");
                logDebug("Retrieveing the typeClass information from std choice for OP board.");
                typeClass = getSharedDropDownDescriptionDetails(typeClass, "LOCKBOX_TYPECLASS");
            }
            // Defect # 10300 - End

            var strLicenseNumber = queryForDBFields.licenseNumber;
            var rowNumber = queryForDBFields.rowNumber;
            if ((servProvCode == "DPL") && (!exists(boardCode, stdcActiveBoardCodeArray))) {
                skipRecordCount++;
                ELPLogging.error("SKIP (boardCode) " + strLicenseNumber + "-" + boardCode);
                logDebug("SKIP (boardCode) " + strLicenseNumber + "-" + boardCode);
                var errorParameters = {
                    "RecordID": strLicenseNumber + "-" + boardCode + "-" + typeClass,
                    "errorMessage": "Invalid Board Code",
                    "BatchInterfaceName": staticParamObj.interface_name
                };
                insertErrRecord(errorParameters);
                var updateParameters = {
                    "intakeStatus": "PROCESSED_EMSE",
                    "rowNumber": rowNumber,
                    "stgErrorMessage": "Invalid Board Code"
                };
                updateStgRecord(updateParameters);
                continue;
            }
            var renewDate = queryForDBFields.renewDate;
            var dueDate = queryForDBFields.dueDate;
            var amountDue = queryForDBFields.amountDue;
            var lateAmtDue = queryForDBFields.lateAmtDue;
            var lockboxNumber = queryForDBFields.lockboxNumber;
            var boardCode2 = queryForDBFields.boardCode2;
            var typeClass2 = queryForDBFields.typeClass2;
            var changeCode = queryForDBFields.changeCode; //Change of address field
            var depositDate = queryForDBFields.depositDate;
            var rowNumber = queryForDBFields.rowNumber;
            var recordID = queryForDBFields.recordId;
            var licenseNumber;

            if (servProvCode == "DPL") {
                if (boardCode != null) {
                    licenseNumber = strLicenseNumber.trim() + "-" + boardCode;

                    if (typeClass != null) {
                        licenseNumber = licenseNumber + "-" + typeClass.trim();
                    }
                }

                var capId = aa.cap.getCapID(licenseNumber);

                if (capId.getSuccess()) {
                    var capIDStr = capId.getOutput();

                    if (capIDStr) {
                        var CapModel = aa.cap.getCap(capIDStr).getOutput();
                        var tempCapId = CapModel.getCapID();

                        logDebug("Cap Id # " + capIDStr + " License # " + licenseNumber + " - " + CapModel.getCapType().toString());
                        //promoteTempCap(tempCapId);
                    }
                } else {
                    //ELPLogging.error("getCapID Error", capId);
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "LICENSE_NUMBER_NOT_FOUND",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                    // Update Staging table with PROCESSED_EMSE_ERROR
                    var updateParameters = {
                        "intakeStatus": "PROCESSED_EMSE_ERROR",
                        "rowNumber": rowNumber,
                        "stgErrorMessage": "Invalid License Number"
                    };
                    updateStgRecord(updateParameters);
                    ELPLogging.error("License # " + licenseNumber + " not exist in Accela");
                    logDebug("License # " + licenseNumber + " not exist in Accela");
                    continue;
                }
            }

            //Unique for ABCC
            //var recordID = queryForDBFields.recordId;                   // recordID = capID
            //logDebug("The Record ID is: "+recordID);

            var runDate = queryForDBFields.runDate;

            //Based on serviceProviderCode evaluating the records from the transmission file
            if (servProvCode == "DPL") {
                if (exists(boardCode, stdcActiveBoardCodeArray)) {
                    /************************** Start CR 212 *************************/
                    //Fetch the record id for license record.
                    var processRenewalFlg = true;
                    var recordID = aa.cap.getCapID(licenseNumber).getOutput();
                    //ELPLogging.error("Record Id: "+recordID+" fetched for License#: "+licenseNumber)
                    var capResult = aa.cap.getCap(recordID);
                    var parentCap = capResult.getOutput();
                    var parentCapStatus = parentCap.getCapStatus();
                    //ELPLogging.error("License Status : "+parentCapStatus);

                    //var eligibleCndtnFlag = true ;
                    var eligibleCndtnFlag = eligibilityCheck(licenseNumber);

                    if (eligibleCndtnFlag == false) {
                        ELPLogging.debug("License Record # " + licenseNumber + " not eligible for Renewal");
                        logDebug("License Record # " + licenseNumber + " not eligible for Renewal");
                    }
                    var renewDate = queryForDBFields.renewDate;
                    var depositDate = queryForDBFields.depositDate;
                    var isGracePeriod = checkForGracePeriod(renewDate, depositDate);
                    //ELPLogging.error("License Status ? " + parentCapStatus);
                    ELPLogging.debug("License Status Expired? " + (parentCapStatus =="Expired"));
                    logDebug("License Status Expired? " + (parentCapStatus == "Expired"));
                    //ELPLogging.error("WF Task Status Expired: " + checkWFTaskStatus("License", "Expired", recordID) );
                    // If License status is in Expired state and and License Workflow is Expired, 
                    // Process the Reinstatement record
                    if (parentCapStatus == "Expired" && checkWFTaskStatus("License", "Expired", recordID)) {
                        logDebug("Process Lockbox as Reinstatement");
                        //If a Reinstatement record exists for a License then apply the payment to the Reinstatement record, not the Renewal record
                        //Set processRenewalFlg to false to avoid the execution of Renewal process
                        processRenewalFlg = false;

                        //Processing Reinstatement record
                        var capIDForDPL = getReinstatementRecord(licenseNumber);
                        ELPLogging.debug("reinstatementCapIDForDPL: "+ capIDForDPL);
                        logDebug("reinstatementCapIDForDPL: " + capIDForDPL);
                        if (capIDForDPL) {
                            evaluateDPLRecords(eligibleCndtnFlag, capIDForDPL, recordID);
                        }
                    } {
                        ELPLogging.debug("Process Lockbox as Renewal");                     
                        logDebug("Process Lockbox as Renewal");
                    }

                    //Process Renewal record if there is no Reinstatement record associated to the License.
                    if (processRenewalFlg) {
                        logDebug("Processing as Renewal " + licenseNumber);
                        //Get capID by licenseNumber = ALT_ID for DPL
                        var capIDForDPL = getCapIDForDPL(boardCode, typeClass, licenseNumber);
                        //Add ASI condition
                        if (capIDForDPL) {
                            evaluateDPLRecords(eligibleCndtnFlag, capIDForDPL, recordID);
                        }
                    }
                    /************************** End CR 212 *************************/
                } else {
                    if (licenseNumber && licenseNumber.split("-").length == 1) {
                        licenseNumber = licenseNumber + "-" + boardCode + "-" + typeClass;
                    }
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "Invalid Board Code",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                    var updateParameters = {
                        "intakeStatus": "PROCESSED_EMSE_ERROR",
                        "rowNumber": rowNumber,
                        "stgErrorMessage": "Invalid Board Code"
                    };
                    updateStgRecord(updateParameters);
                }
            } else {
                //Unique for ABCC
                ELPLogging.debug("The Record ID is: "+recordID);

                if (recordID) {
                    recordID = recordID.trim();

                    var scanner = new Scanner(recordID, "-");
                    var ID1 = scanner.next();
                    var ID2 = scanner.next();
                    var ID3 = scanner.next();

                    var tempCapID = aa.cap.getCapID(ID1, ID2, ID3).getOutput();

                    if (!tempCapID) {
                        try {
                            var errorParameters = {
                                "RecordID": recordID,
                                "errorMessage": "LICENSE_NUMBER_NOT_FOUND",
                                "BatchInterfaceName": staticParamObj.interface_name
                            };
                            insertErrRecord(errorParameters);
                            var updateParameters = {
                                "intakeStatus": "PROCESSED_EMSE_ERROR",
                                "rowNumber": rowNumber,
                                "stgErrorMessage": "Record not exist in Accela"
                            };
                            updateStgRecord(updateParameters);
                            continue;
                        } catch (exception) {
                            ELPLogging.notify("Error occured when trying to update record: " + capIDModel + ": " + exception.toString(), exception);
                        }
                    }

                    var capIDModel = getCapIDForABCC(tempCapID);
                    if (capIDModel == null) {
                        continue;
                    }
                    ELPLogging.debug("capIDModel for ABCC record : " +capIDModel);
                    try {
                        evaluateABCCRecords(capIDModel);
                    } catch (ex) {
                        ELPLogging.notify(ex.toString(), ex);
                        try {
                            var updateParameters = {
                                "intakeStatus": "PROCESSED_EMSE_ERROR",
                                "rowNumber": rowNumber,
                                "stgErrorMessage": ex.toString()
                            };
                            updateStgRecord(updateParameters);
                        } catch (exception) {
                            ELPLogging.notify("Error occured when trying to update record: " + capIDModel + ": " + exception.toString(), exception);
                        }
                    }
                } else {
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "LICENSE_NUMBER_NOT_FOUND",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                    var updateParameters = {
                        "intakeStatus": "PROCESSED_EMSE_ERROR",
                        "rowNumber": rowNumber,
                        "stgErrorMessage": "Invalid Record ID"
                    };
                    updateStgRecord(updateParameters);
                }
            }
        } catch (ex) {
            returnException = new ELPAccelaEMSEException("Error in getting queryForDBFields : " + ex.message);
            ELPLogging.error(returnException.toString(), ex);
            if (licenseNumber && licenseNumber.split("-").length == 1) {
                licenseNumber = licenseNumber + "-" + boardCode + "-" + typeClass;
            }
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": returnException.toString(),
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": returnException.toString()
            };
            updateStgRecord(updateParameters);
            //throw returnException;
        }
    }
    ELPLogging.error("SKIP " + skipRecordCount + " for Release C boards.");
} catch (ex
    if ex instanceof ELPAccelaEMSEException) {
    logDebug(ex.toString(), ex);
    aa.env.setValue("EMSEReturnCode", ex.getReturnCode());
    aa.env.setValue("EMSEReturnMessage", "EMSE_MA_INT_LOCKBOX_INTAKE  aborted with " + ex.toString());
} catch (ex) {
    logDebug(ex.message, ex);
    aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE);
    aa.env.setValue("EMSEReturnMessage", "EMSE_MA_INT_LOCKBOX_INTAKE  aborted with " + ex.message);
} finally {
    var timeStep = new Date();
    logDebug("In Final Cleanup: " + timeStep.toString());
    if (!ELPLogging.isFatal()) { // if fatal then return code already filled in
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
        aa.env.setValue("ScriptReturnCode", "0");
        if (ELPLogging.getErrorCount() > 0) {
            aa.env.setValue("EMSEReturnMessage", "EMSE_MA_INT_LOCKBOX_INTAKE  completed with " + ELPLogging.getErrorCount() + " errors.");
        } else {
            aa.env.setValue("EMSEReturnMessage", "EMSE_MA_INT_LOCKBOX_INTAKE  completed with no errors.");
        }
    }
    var timeStep = new Date();
    logDebug("Before DataSet Close: " + timeStep.toString());
    if (dataSetStg != null) {
        dataSetStg.close();
    }
    var timeStep = new Date();
    logDebug("Between DataSet and Connection Close: " + timeStep.toString());
    if (dbConn != null) {
        dbConn.close();
    }
    var timeStep = new Date();
    logDebug("After Connection Close: " + timeStep.toString());
    var firstLogF = ELPLogging.toJSON();
    var timeStep = new Date();
    ELPLogging.debug("After JSON Log: " + timeStep.toString());     
    logDebug("After JSON Log: " + timeStep.toString());
    aa.env.setValue("logFile", ELPLogging.toJSON());
    logDebug("logFile: " + ELPLogging.toJSON());

    if (debugOn)
        aa.sendMail("noreply@elicensing.state.ma.us", "domingo.dejesus@mass.gov", "", "EMSE_MA_INT_LOCKBOX_INTAKE", debug);
}

function getScriptText(vScriptName) {
    var servProvCode = aa.getServiceProviderCode();
    if (arguments.length > 1) {
        servProvCode = arguments[1];
    }
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    try {
        var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
        return emseScript.getScriptText() + "";
    } catch (err) {
        return "";
    }
}

// POC
/**
 * @description Get the record count in the staging table to be processed.
 * @param  {string} serviceProviderCode
 * @param  {string} batchInterfaceName
 * @param  {date} runDate
 * @return {int} record count
 */
function countStagingRecords(serviceProviderCode, batchInterfaceName, runDate) {
    var count = 0;
    try {
        var array = [];
        var tableName = selectQueryObj.selectQuery.table;

        var stagingQueryParameters = {
            "serviceProviderCode": serviceProviderCode,
            "batchInterfaceName": batchInterfaceName,
            "runDate": runDate,
            "tableName": tableName
        };
        
        var dataSet = getStgRecords(stagingQueryParameters);

        var queryResult = null;
        while ((queryResult = dataSet.next()) != null) {
            count++;
        }

    } catch (ex) {
        aa.print("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return count;
}

// POC
/**
 * @description Query records from the staging table and returns a DataSet
 * @param  {array} parameters
 * @return {DataSet} DataSet object
 */
function getStgRecords(parameters) {
    var dataSet = null;
    try {
        var sql = "select * from " + parameters["tableName"] + " where service_provider_code = ? and batch_interface_name = ? and run_date = ?";
        var stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["serviceProviderCode"]);
        stmt.setString(2, parameters["batchInterfaceName"]);
        var sql_date = new java.sql.Date(parameters["runDate"].getTime());
        stmt.setDate(3, sql_date);

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        aa.print("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}

/**
 *@desc GetCapID from the BoardCode+TypeClass+LicenseNumber
 *@param {boardCode} boardCode - boardCode from the staging table
 *@param {typeClass} typeClass - typeClass from the staging table
 *@param {licenseNumber} licenseNumber - licenseNumber from the staging table
 */
function getCapIDForDPL(boardCode, typeClass, licenseNumber) {
    var finalCapID;
    var newCapId;
    var capArray = new Array();
    updateWorkflowTaskFlag = true;

    var tempCapID = aa.cap.getCapID(licenseNumber).getOutput();
    var childRecordsResult = aa.cap.getProjectByMasterID(tempCapID, "Renewal", "Incomplete");
    if (childRecordsResult.getSuccess()) {
        ELPLogging.debug("Processing InComplete renewal records.");
        logDebug("Processing InComplete renewal records.");
        var childRecordslist = childRecordsResult.getOutput();

        for (counter in childRecordslist) {
            capArray[counter] = childRecordslist[counter].getCapID();
        }

        if (capArray.length > 0) {
            //Get Latest Renewal record
            var latestRenewalRec = null;
            var latestRenewalRecDate = null;

            for (thisCapCounter in capArray) {
                aa.print(thisCapCounter);
                if (latestRenewalRec == null) {

                    latestRenewalRec = capArray[thisCapCounter];

                    ELPLogging.debug("thisCap" + thisCapCounter + "latestRenewalRec " +  latestRenewalRec);
                    logDebug("thisCap" + thisCapCounter + "latestRenewalRec " + latestRenewalRec);
                    var capModelResult = aa.cap.getCap(latestRenewalRec).getOutput();
                    latestRenewalRecDate = capModelResult.getFileDate();
                    var latestRenewalDate = new Date(latestRenewalRecDate.getMonth() + "/" + latestRenewalRecDate.getDayOfMonth() +
                        "/" + latestRenewalRecDate.getYear());
                } else {
                    var tempCapID = capArray[thisCapCounter];
                    var capModelResult = aa.cap.getCap(tempCapID).getOutput();
                    var tempDate = capModelResult.getFileDate();
                    var newLicDate = new Date(tempDate.getMonth() + "/" + tempDate.getDayOfMonth() +
                        "/" + tempDate.getYear());

                    if ((newLicDate > latestRenewalDate) == 1) {
                        latestRenewalDate = newLicDate;
                        latestRenewalRec = tempCapID;
                    }
                }
            }

            finalCapID = latestRenewalRec;


            var b1PerId1 = finalCapID.getID1();

            if (!(b1PerId1.indexOf("EST") < 0)) {

                newCapId = promoteTempCap(finalCapID);

                if (newCapId) {
                    ELPLogging.error("Renewal record # " + newCapId + " found in License # " + licenseNumber);
                } else {
                    //Added for defect# 7993
                    logDebug("WARNING: Could not promote the temp renewal record to real record in first attempt!");
                    //Give a second attempt to promote temporary renewal record to real record.
                    newCapId = promoteTempCap(finalCapID);
                    if (newCapId) {
                        ELPLogging.error("Renewal record # " + newCapId + " found in License # " + licenseNumber);
                    } else {
                        ELPLogging.debug("WARNING: Could not promote the temp renewal record to real record in second attempt!");
                        logDebug("WARNING: Could not promote the temp renewal record to real record in second attempt!");
                        //End of defect# 7993
                        if (licenseNumber && licenseNumber.split("-").length == 1) {
                            licenseNumber = licenseNumber + "-" + boardCode + "-" + typeClass;
                        }
                        var errorParameters = {
                            "RecordID": licenseNumber,
                            "errorMessage": "Error in promoting Temporary renewal record to Real record",
                            "BatchInterfaceName": staticParamObj.interface_name
                        };
                        insertErrRecord(errorParameters);
                        // Update Staging table with PROCESSED_EMSE_ERROR
                        var updateParameters = {
                            "intakeStatus": "PROCESSED_EMSE_ERROR",
                            "rowNumber": rowNumber,
                            "stgErrorMessage": "Error in promoting Temporary renewal record to Real record"
                        };
                        updateStgRecord(updateParameters);
                    }
                }
            } else {
                newCapId = finalCapID;
            }
        } else {
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "RENEWAL_RECORD_NOT_FOUND",
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            ELPLogging.error("No Renewal record found in License # " + licenseNumber);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "No Renewal record found"
            };
            updateStgRecord(updateParameters);
            return null;
        }
    } else {
        ELPLogging.debug("Processing Complete renewal records.");
        logDebug("Processing Complete renewal records.");
        var childRecordsResult = aa.cap.getProjectByMasterID(tempCapID, "Renewal", "");
        if (childRecordsResult.getSuccess()) {
            var childRecordslist = childRecordsResult.getOutput();
            if (childRecordslist) {
                for (counter in childRecordslist) {
                    capArray[counter] = childRecordslist[counter].getCapID();
                    ELPLogging.debug("childRecordslist[counter].getCapID() = "+childRecordslist[counter].getCapID());
                    logDebug("childRecordslist[counter].getCapID() = " + childRecordslist[counter].getCapID());
                }
                if (capArray.length > 0) {
                    ELPLogging.debug("Get latest Renewal record");
                    logDebug("Get latest Renewal record");
                    //Get Latest Renewal record
                    var latestRenewalRec = null;
                    var latestRenewalRecDate = null;
                    for (thisCapCounter in capArray) {
                        ELPLogging.debug("this Cap Counter length : " +thisCapCounter);
                        ELPLogging.debug("latestRenewalRec = "+latestRenewalRec);
                        logDebug("this Cap Counter length : " + thisCapCounter);
                        logDebug("latestRenewalRec = " + latestRenewalRec);
                        if (latestRenewalRec == null) {
                            renewalRec = capArray[thisCapCounter];
                            logDebug("thisCap " + thisCapCounter + " renewalRec " + renewalRec);
                            var capModelResult = aa.cap.getCap(renewalRec).getOutput();
                            var recordStatus = capModelResult.getCapStatus();
                            //if(recordStatus == "Closed")
                            //{
                            latestRenewalRec = renewalRec;
                            latestRenewalRecDate = capModelResult.getFileDate();
                            var latestRenewalDate = new Date(latestRenewalRecDate.getMonth() + "/" + latestRenewalRecDate.getDayOfMonth() + "/" + latestRenewalRecDate.getYear());
                            //}
                        } else {
                            var tempCapID = capArray[thisCapCounter];
                            var capModelResult = aa.cap.getCap(tempCapID).getOutput();
                            var tempDate = capModelResult.getFileDate();
                            var newLicDate = new Date(tempDate.getMonth() + "/" + tempDate.getDayOfMonth() + "/" + tempDate.getYear());
                            ELPLogging.debug("newLicDate : "+newLicDate +" ## "+"latestRenewalDate: "+latestRenewalDate);
                            logDebug("newLicDate : " + newLicDate + " ## " + "latestRenewalDate: " + latestRenewalDate);
                            if ((newLicDate > latestRenewalDate) == 1) {
                                latestRenewalDate = newLicDate;
                                latestRenewalRec = tempCapID;
                                ELPLogging.debug("latestRenewalRec = "+latestRenewalRec);
                                logDebug("latestRenewalRec = " + latestRenewalRec);
                            }
                        }
                    }
                    newCapId = latestRenewalRec;

                    /*JIRA 1051 : the overpayment condition should be added and payment applied but WF should NOT be opened.*/
                    var capModelResult = aa.cap.getCap(newCapId).getOutput();
                    var recordStatus = capModelResult.getCapStatus();

                    if (recordStatus == "Closed")
                        updateWorkflowTaskFlag = false;

                    /*JIRA 1051*/

                    ELPLogging.debug("newCapId # " +newCapId + " and updateWorkflowTaskFlag : " + updateWorkflowTaskFlag);
                    logDebug("newCapId # " + newCapId + " and updateWorkflowTaskFlag : " + updateWorkflowTaskFlag);
                }
            } else {
                var errorParameters = {
                    "RecordID": licenseNumber,
                    "errorMessage": "RENEWAL_RECORD_NOT_FOUND",
                    "BatchInterfaceName": staticParamObj.interface_name
                };
                insertErrRecord(errorParameters);
                var updateParameters = {
                    "intakeStatus": "PROCESSED_EMSE_ERROR",
                    "rowNumber": rowNumber,
                    "stgErrorMessage": "License does not have renewal record"
                };
                updateStgRecord(updateParameters);
            }
        } else {
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "RENEWAL_RECORD_NOT_FOUND",
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "License does not have renewal record"
            };
            updateStgRecord(updateParameters);
        }
    }
    return newCapId;
}


/**
    Get type class ASI value for the given CAP ID
    
*/
function getTypeClassASIValueForCapId(capID) {
    ELPLogging.debug("Get TypeClass ASI for capID : " +capID);
    logDebug("Get TypeClass ASI for capID : " + capID);

    var typeClassFromCapID;
    var resultSet = aa.appSpecificInfo.getByCapID(capID);
    var typeClassASI;
    if (resultSet.getSuccess()) {
        typeClassASI = resultSet.getOutput();

    } else {
        ELPLogging.debug("ASI resultSet failed");
        ELPLogging.debug(resultSet.getErrorMessage());
        logDebug("ASI resultSet failed");
        logDebug(resultSet.getErrorMessage());
    }
    if (typeClassASI) {
        for (x in typeClassASI) {
            asiModel = typeClassASI[x];
            //Type Class
            if (asiModel.getFieldLabel() == "Type Class") {
                typeClassFromCapID = asiModel.getChecklistComment();
                ELPLogging.debug("typeClassFromCapID: " +typeClassFromCapID);
                logDebug("typeClassFromCapID: " + typeClassFromCapID);
            }
            /*else
            {
                logDebug("Do Nothing for other label " + asiModel.getFieldLabel());
                return null;
            }*/
        }
    }

    return typeClassFromCapID;
}


/**
    special text from the board code.
*/
function evaluateSpecialText(boardCode) {
    ELPLogging.debug("evaluateSpecialText for DPL");
    logDebug("evaluateSpecialText for DPL");
    var bizDomResult = aa.bizDomain.getBizDomainByDescription("DPL", String(stdChoiceBoard), boardCode);
    if (bizDomResult.getSuccess()) {
        var bizDomObj = bizDomResult.getOutput();
    }
    if (bizDomObj) {
        var splText = bizDomObj.getBizdomainValue();
        ELPLogging.debug("splText:" + splText);
        logDebug("splText:" + splText);
    }
    return splText;
}

/**
    Evaluate DPL records
    For DPL only RENEWAl records will take into consideration
    For DPL Unique key will be BoardCode + TypeClass + LicenseNumber
*/
function evaluateDPLRecords(eligibleCndtnFlag, capIDForDPL, recordID) {
    var status;
    ELPLogging.debug("Evaluate the records for DPL : " +capIDForDPL);
    logDebug("Evaluate the records for DPL : " + capIDForDPL);

    // Updating the ASI
    updateLockBoxASIValues(capIDForDPL);

    if (eligibleCndtnFlag == true) {
        var conditionDesc = "Change of Address";

        //Create payment record against the eligible license
        //Apply the payment against the applicable fees
        var paid = createPaymentForDPL(capIDForDPL, recordID);
        ELPLogging.debug("paid : "+paid);
        logDebug("paid : " + paid);
        if (paid) {
            if (changeCode == 1) {
                standardConditions = aa.capCondition.getStandardConditions(conditionType, conditionDesc).getOutput();

                for (i = 0; i < standardConditions.length; i++) {
                    if (standardConditions[i].getConditionType().toUpperCase() == conditionType.toUpperCase() &&
                        standardConditions[i].getConditionDesc().toUpperCase() == conditionDesc.toUpperCase()) {
                        standardCondition = standardConditions[i];
                        var stdConditionComment = standardCondition.getConditionComment()
                        var comment = stdConditionComment + " " + runDate;

                        var alreadySent = conditionCheck(capIDForDPL, conditionType, conditionDesc);
                        if (alreadySent) {
                            editConditionComment(capIDForDPL, conditionDesc, comment);
                            ELPLogging.debug("Change of Address condition updated successfully");
                            logDebug("Change of Address condition updated successfully");
                        } else {
                            addStdConditionByConditionNumber(conditionType, conditionDesc, capIDForDPL);
                            editConditionComment(capIDForDPL, conditionDesc, comment);
                            ELPLogging.debug("New Change of Address condition added and updated successfully");
                            logDebug("New Change of Address condition added and updated successfully");
                        }
                    }
                }

                logDebug("changeCode: " + changeCode);

                deactivateWFTask("Intake", "", capIDForDPL);
                activateWFTask("Validate", "", capIDForDPL);
                assignWFTask("Validate", "", capIDForDPL, "DPL/DPL/LIC/EDP/STAFF/NA/NA");
                updateAppStatus("Under Review", "Task updated by Lockbox", capIDForDPL);
                var errorParameters = {
                    "RecordID": licenseNumber,
                    "errorMessage": "ADDRESS_CHANGE",
                    "BatchInterfaceName": staticParamObj.interface_name
                };
                insertErrRecord(errorParameters);

            } else {
                //Update the work flow task/status to ISSUANCE/Ready for Printing
                /*  deactivateWFTask("Intake", "", capIDForDPL);
                  activateWFTask("ISSUANCE", "", capIDForDPL);
                  assignWFTask("ISSUANCE", "", capIDForDPL, "");   
                  updateWFTask("ISSUANCE", "Ready for Printing", "", "", "", capIDForDPL);*/
                // ELPLogging.debug("Updated work flow task/status to ISSUANCE/Ready for Printing");
            }
            status = true;
        } else {
            ELPLogging.debug("Payment has not been done");
            logDebug("Payment has not been done");
            //JIRA 1051 : Start
            if (updateWorkflowTaskFlag) {
                deactivateWFTask("Intake", "", capIDForDPL);
                activateWFTask("Validate", "", capIDForDPL);
                assignWFTask("Validate", "", capIDForDPL, "DPL/DPL/LIC/EDP/STAFF/NA/NA");
                updateAppStatus("Under Review", "Task updated by Lockbox", capIDForDPL);
            }
            //JIRA 1051 : End

            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "Error while Payment",
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            // Update Staging table with PROCESSED_EMSE_ERROR
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "Error while Payment"
            };
            updateStgRecord(updateParameters);
            return;
        }
    } else {
        //If license is not eligible for RENEWAL
        //Create payment record against the ineligible license 
        //Do not Apply the payment against the applicable fees
        var conditionDesc = "Payment Submitted for Ineligible Renewal";

        standardConditions = aa.capCondition.getStandardConditions(conditionType, conditionDesc).getOutput();

        for (i = 0; i < standardConditions.length; i++) {
            if (standardConditions[i].getConditionType().toUpperCase() == conditionType.toUpperCase() &&
                standardConditions[i].getConditionDesc().toUpperCase() == conditionDesc.toUpperCase()) {
                standardCondition = standardConditions[i];
                var stdConditionComment = standardCondition.getConditionComment()
                var comment = stdConditionComment + " " + runDate;

                var alreadySent = conditionCheck(capIDForDPL, conditionType, conditionDesc);
                if (alreadySent) {
                    editConditionComment(capIDForDPL, conditionDesc, comment);
                    ELPLogging.debug("Payment Submitted for Ineligible Renewal condition updated successfully");
                    logDebug("Payment Submitted for Ineligible Renewal condition updated successfully");
                } else {
                    //add condition (ConditionName = Change of Address ) 
                    addStdConditionByConditionNumber(conditionType, conditionDesc, capIDForDPL);
                    editConditionComment(capIDForDPL, conditionDesc, comment);
                    ELPLogging.debug("New Payment Submitted for Ineligible Renewal condition added and updated successfully");
                    logDebug("New Payment Submitted for Ineligible Renewal condition added and updated successfully");
                }

            }
        }

        status = createPaymentForDPLOnIneligible(capIDForDPL);

        var errorParameters = {
            "RecordID": licenseNumber,
            "errorMessage": "INELIGIBLE_FOR_RENEWAL",
            "BatchInterfaceName": staticParamObj.interface_name
        };
        insertErrRecord(errorParameters);

        ELPLogging.debug("payment for Ineligible Renewal record: ");
        logDebug("payment for Ineligible Renewal record: ");
    }

    ELPLogging.debug("Updating Intake status in staging table");
    logDebug("Updating Intake status in staging table");

    if (status) {
        var updateParameters = {
            "intakeStatus": "PROCESSED_EMSE",
            "rowNumber": rowNumber
        }
        updateStgRecord(updateParameters);
        //ELPLogging.error("changeCode : - " + changeCode + "dplMatchFeePayment : -- " + dplMatchFeePayment);
        if (changeCode != 1 && dplMatchFeePayment) {
            logDebug("Calling processRenewal for " + capIDForDPL + " " + getAppType(capIDForDPL));
            processRenewal(capIDForDPL);
        }
    } else {
        if (licenseNumber && licenseNumber.split("-").length == 1) {
            licenseNumber = licenseNumber + "-" + boardCode + "-" + typeClass;
        }
        var errorParameters = {
            "RecordID": licenseNumber,
            "errorMessage": "Error while applying payment",
            "BatchInterfaceName": staticParamObj.interface_name
        };
        insertErrRecord(errorParameters);
        var updateParameters = {
            "intakeStatus": "PROCESSED_EMSE_ERROR",
            "rowNumber": rowNumber,
            "stgErrorMessage": "Error while applying payment"
        };
        updateStgRecord(updateParameters);
    }

}

/**
    Evaluate ABCC records
    For ABCC both Application and Renewal records will take into consideration
    For ABCC RecordId will be unique key i.e. ALT_ID (License Number)
*/
function evaluateABCCRecords(capIDForABCC) {
    ELPLogging.debug("Evaluate the records for ABCC: " +capIDForABCC);
    //Create Payment record on the renewal record
    var payment = createPaymentForABCC(capIDForABCC);
    //ELPLogging.debug("ABCC payment: " +payment);  
}



/**
 * This function inserts the payment record using the EMSE API for payment when no matching record is found.
 *
 */
function createPaymentForABCC(capID){
    ELPLogging.debug("createPaymentForABCC : " +capID);
    try{

        var customID = aa.cap.getCap(capID).getOutput().getCapID().getCustomID();       
        var payModel = aa.finance.createPaymentScriptModel();
        
        payModel.setAuditDate(aa.date.getCurrentDate());
        payModel.setCcType(paymenType);
        payModel.setAuditStatus("A");
        payModel.setPaymentComment("LockBox payment");
        var scriptDateObj = new Date(depositDate);
        scriptDateObj = aa.date.getScriptDateTime(scriptDateObj); 
        payModel.setPaymentDate(scriptDateObj);                 
        payModel.setPaymentMethod("Lockbox");                   // PaymentMethod = "Lockbox"
        payModel.setPaymentStatus("Paid");
        payModel.setPaymentAmount(paymentAmount);
        payModel.setCapID(capID);
        payModel.setCashierID("BATCHUSER");
        
        payModel.setAmountNotAllocated(paymentAmount);  
        payModel.setPaymentChange(0);
        //payModel.setPaymentRefNbr("14LJK");
        //payModel.setTranCode("MAX");

        
        var feeTotal = getTotalInvoicedFees(capID);
        //ELPLogging.error("The Fee Total is: "+feeTotal);
        //ELPLogging.error("The Payment Amount is: "+paymentAmount);
        
        var scriptResult = aa.finance.makePayment(payModel);
        if(scriptResult.getSuccess())
            ELPLogging.error("Payment Successfully Created");
        else
            ELPLogging.error("Error when creating payment");
        
        var object = scriptResult.getOutput();
        aa.print(object);
        
        // if Payment amount matches the feeTotal
        if(paymentAmount == feeTotal)       
        {
            //ELPLogging.error("paymentAmount and amountDue has been matched for capID: " +capID);
            if (scriptResult.getSuccess()) 
            {
                try
                {
                    applyPayment(capID);  
                    //ELPLogging.error("Successfully created and Applied - : " + batchNumber + "; SequenceNumber: " + sequenceNumber);
                    //Update the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal
                    updateWFTask(abccWfTask,abccWfStatus,"","","",capID);
                    ELPLogging.debug("Updating the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal");
                }
                catch (ex)
                {
                    ELPLogging.error(ex.toString(), ex);
                    throw ex;
                }   
            }
            else 
            {
                ELPLogging.notify("Error making payment for Record ID: " +capID+": "+scriptResult.getErrorMessage());
                return false;
            }   
        }
        else{   
                var conditionDesc = "Incorrect Payment Amount Submitted";
                var comment = "Incorrect Payment Amount processed on "+runDtStr;
                
                var alreadySent = conditionCheck(capID,conditionType,conditionDesc);
                if(alreadySent)
                {
                    editConditionComment(capID,conditionDesc,comment);
                }
                else
                {
                    addStdConditionByConditionNumber(conditionType,conditionDesc,capID);
                    editConditionComment(capID,conditionDesc,comment);
                }
                
                //ELPLogging.error("New Incorrect Payment Amount Submitted condition added and updated successfully");
                
                if(paymentAmount < feeTotal)
                {
                    var errorParameters = {"RecordID":customID,"errorMessage":"UNDERPAYMENT", "BatchInterfaceName" : staticParamObj.interface_name};
                    insertErrRecord(errorParameters);
                }
                else
                {
                    var errorParameters = {"RecordID":customID,"errorMessage":"OVERPAYMENT", "BatchInterfaceName" : staticParamObj.interface_name};
                    insertErrRecord(errorParameters);
                }
        }
        try
        {   
            ELPLogging.debug("Updating Intake status in staging table");
            var updateParameters = {"intakeStatus":"PROCESSED_EMSE", "rowNumber":rowNumber}
            updateStgRecord(updateParameters);  
            ELPLogging.debug("Payment created but not applied - : " + sequenceNumber +" for  batchNumber: " + batchNumber);
        } catch (ex if ex instanceof StoredProcedureException){
                    ELPLogging.error(ex.toString() + " for  SequenceNumber: " + sequenceNumber +" for  batchNumber: " + batchNumber, ex);
                } catch (ex if ex instanceof JavaException) {
                    ELPLogging.error(ex.message + " for  SequenceNumber: " + sequenceNumber +" for  batchNumber: " + batchNumber,ex);                  
                } catch (ex) {
                    // unexpected exception log and break
                    ELPLogging.error(ex.message + " for  SequenceNumber: " + sequenceNumber +" for  batchNumber: " + batchNumber,ex);  
                } 
            return false;
    }
    catch(ex){
        aa.print(ex.message)
        returnException = new ELPAccelaEMSEException("Error in createPaymentForABCC : " + ex.message);
        ELPLogging.error(returnException.toString(), ex);
        throw returnException;
    }
}



/**
 * This function inserts the payment record using the EMSE API for payment when no matching record is found.
 * @param {number} merchantAmt - merchant amount from the staging table
 * @param {number} authCode - authorization code from the staging table
 * @param {number} capID - Cap ID model from the staging table 
 * @param {number} recordID - Cap ID model of license
 * @return {boolean} paid true if the process is completed, otherwise false
 */
function createPaymentForDPL(capID, recordID) {
    ELPLogging.debug("Creating Payment for renewal Record # " +capID);
    logDebug("Creating Payment for renewal Record # " + capID);

    var payModel = aa.finance.createPaymentScriptModel();

    // PaymentModel object
    var paymentModel = new com.accela.aa.finance.cashier.PaymentModel();

    payModel.setAuditDate(aa.date.getCurrentDate());
    payModel.setCcType(paymenType);
    payModel.setAuditStatus("A");
    payModel.setReceivedType(batchNumber);
    payModel.setPaymentComment(sequenceNumber);

    var scriptDateObj = new Date(depositDate);
    scriptDateObj = aa.date.getScriptDateTime(scriptDateObj);
    payModel.setPaymentDate(scriptDateObj);
    payModel.setPaymentMethod("Lockbox"); // PaymentMethod = "Lockbox"
    payModel.setPaymentStatus("Paid");
    payModel.setPaymentAmount(paymentAmount);
    payModel.setCashierID("BATCHUSER");
    payModel.setCapID(capID);
    //var sessionNbr = getSessionNbr();
    //var sessionNbr = 1;
    //payModel.setSessionNbr(sessionNbr);

    payModel.setAmountNotAllocated(paymentAmount);
    payModel.setPaymentChange(0);

    var feeTotal = getTotalInvoicedFeesForDPL(capID);
    //ELPLogging.error("The Fee Total is: "+feeTotal.invoiceTotal);
    //ELPLogging.error("The Payment Amount is: "+paymentAmount);
    //ELPLogging.error("The Renewal Fee is: "+feeTotal.renewalFee);

    var scriptResult = aa.finance.makePayment(payModel);

    if (scriptResult.getSuccess()) {
        //ELPLogging.error("Payment Successfully Created");
    } else {
        ELPLogging.error("Error when creating payment");
        ELPLogging.notify("Error making payment for Record ID: " +capID+": "+scriptResult.getErrorMessage());
        logDebug("Error when creating payment");
        logDebug("Error making payment for Record ID: " + capID + ": " + scriptResult.getErrorMessage());
        var errorParameters = {
            "RecordID": licenseNumber,
            "errorMessage": "PAYMENT ERROR",
            "BatchInterfaceName": staticParamObj.interface_name
        };
        insertErrRecord(errorParameters);
        return false;
    }

    // Check the grace period  true or false
    var isGracePeriod = checkForGracePeriod(renewDate, depositDate);
    ELPLogging.debug("Is within GracePeriod ? " + isGracePeriod);
    logDebug("Is within GracePeriod ? " + isGracePeriod);
    if (!checkDORCondition(capID, strLicenseNumber)) {
        // if Payment amount matches the invoiceTotal
        if (paymentAmount == feeTotal.invoiceTotal) {
            //ELPLogging.error("paymentAmount and amountDue has been matched for Record # " +capID);

            if (scriptResult.getSuccess()) {
                try {
                    applyPayment(capID);
                    //ELPLogging.error("Successfully created and Applied - : " + batchNumber + "; SequenceNumber: " + sequenceNumber);
                    //Update the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal
                    //updateWFTask(dplWfTask,dplWfStatus,"","","",capID);
                    ELPLogging.debug("Updating the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal");
                    logDebug("Updating the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal");
                    dplMatchFeePayment = true;
                    return true;
                } catch (ex) {
                    ELPLogging.error(ex.toString(), ex);
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "APPLY ERROR",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                    return false;
                }
            }
        } else {
            //ELPLogging.error("paymentAmount and amountDue is not matched for Record # " +capID);
            var isIncorrectPayment = true;

            if (isGracePeriod) {
                //ELPLogging.error("Payment done during grace period.");

                // If the payment amount is greater than the invoiced fees (i.e., the renewal fee + late fees)
                if (paymentAmount > feeTotal.invoiceTotal) {
                    //ELPLogging.error("paymentAmount is greater than the total fee.");
                    // Create & Invoice the late fee
                    createLateFees(recordID, capID);
                    // Determine the amount of late fee
                    var feeItemList = aa.finance.getFeeItemByCapID(capID).getOutput();
                    var lateFees = 0;
                    var requiredFee = 0;
                    for (y in feeItemList) {
                        var feeItemModel = feeItemList[y];
                        var feeItemCode = feeItemModel.getFeeCod();
                        //ELPLogging.error("Fee Code(s) : " + feeItemCode);
                        var subStrFeeCode = feeItemCode.substring(2, 4);
                        var feeName = feeItemModel.getFeeDescription().toUpperCase();
                        //ELPLogging.error("Fee Name : " + feeName);
                        // Defect 14353
                        if (subStrFeeCode == "LR" || feeName == "LATE RENEWAL FEE" || feeName == "LATE RENEWAL FEE (ALL TYPE CLASSES EXCEPT S2)" || feeName == "LATE RENEWAL FEE (PUBLIC SCHOOLS)") {
                            lateFees = lateFees + feeItemModel.getFee();
                        }
                    }
                    //ELPLogging.error("Late Fee : " + lateFees);
                    // If late fee is sucessfully created, then get the invoiced fees again.
                    if (lateFees > 0) {
                        feeTotal = getTotalInvoicedFeesForDPL(capID);
                        //ELPLogging.error("New Fee Total is: "+feeTotal.invoiceTotal);
                        //ELPLogging.error("New Renewal Fee is: "+feeTotal.renewalFee);
                        requiredFee = feeTotal.invoiceTotal;
                    } else {
                        requiredFee = feeTotal.invoiceTotal + feeTotal.renewalFee;
                    }
                    //ELPLogging.error("Fee (including Late Fee): " + requiredFee);
                    if (requiredFee == paymentAmount) //Exact payment i.e. apply payment
                    {
                        gracePeriodFlag = true;
                        //ELPLogging.error("Exact payment done.");
                        applyPayment(capID);
                        //ELPLogging.error("Successfully created and Applied - : " + batchNumber + "; SequenceNumber: " + sequenceNumber);
                        //Update the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal
                        //updateWFTask(dplWfTask,dplWfStatus,"","","",capID);
                        ELPLogging.debug("Updating the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal");
                        logDebug("Updating the work flow task/status on the renewal record to Intake/Under Review for both Applications and Renewal");
                        dplMatchFeePayment = true;
                        isIncorrectPayment = false;
                        gracePeriodFlag = false;
                        return true;
                    }
                }
            }

            if (isIncorrectPayment) {
                ELPLogging.debug("Case of an incorrect payment for record ID = "+capIDForDPL);
                logDebug("Case of an incorrect payment for record ID = " + capIDForDPL);
                var conditionDesc = "Incorrect Payment Amount Submitted";
                var comment = "Incorrect Payment Amount processed on " + runDtStr;
                var alreadySent = conditionCheck(capIDForDPL, conditionType, conditionDesc);
                if (alreadySent) {
                    editConditionComment(capIDForDPL, conditionDesc, comment);
                    ELPLogging.debug("Change of Address condition updated successfully");
                    logDebug("Change of Address condition updated successfully");
                } else {
                    addStdConditionByConditionNumber(conditionType, conditionDesc, capIDForDPL);
                    editConditionComment(capIDForDPL, conditionDesc, comment);
                    ELPLogging.debug("New Change of Address condition added and updated successfully");
                    logDebug("New Change of Address condition added and updated successfully");
                }

                ELPLogging.debug("staticParamObj.interface_name -- " +  staticParamObj.interface_name);
                logDebug("staticParamObj.interface_name -- " + staticParamObj.interface_name);
                // If the payment falls outside the grace period, and payment is less than the Invoiced fees
                if (paymentAmount < feeTotal.invoiceTotal) {
                    // Process an UNDERPAYMENT
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "UNDERPAYMENT",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                } else {
                    var errorParameters = {
                        "RecordID": licenseNumber,
                        "errorMessage": "OVERPAYMENT",
                        "BatchInterfaceName": staticParamObj.interface_name
                    };
                    insertErrRecord(errorParameters);
                }

                ELPLogging.debug("New Incorrect Payment Amount Submitted condition added and updated successfully");
                logDebug("New Incorrect Payment Amount Submitted condition added and updated successfully");
                return false;
            }
            return false;
        }
    } else {
        var conditionDesc = "Payment Submitted for Ineligible Renewal";
        /*addStdConditionByConditionNumber(conditionType,conditionDesc,capID);
        editConditionComment(capID,conditionDesc,comment);*/

        var comment = "DOR Condition processed on " + runDtStr;
        var alreadySent = conditionCheck(capIDForDPL, conditionType, conditionDesc);
        if (alreadySent) {
            editConditionComment(capIDForDPL, conditionDesc, comment);

        } else {
            addStdConditionByConditionNumber(conditionType, conditionDesc, capIDForDPL);
            editConditionComment(capIDForDPL, conditionDesc, comment);
        }
        var errorParameters = {
            "RecordID": licenseNumber,
            "errorMessage": "DOR CONDITION",
            "BatchInterfaceName": staticParamObj.interface_name
        };
        insertErrRecord(errorParameters);
        ELPLogging.debug("New Payment Submitted for Ineligible Renewal condition added and updated successfully");      
        logDebug("New Payment Submitted for Ineligible Renewal condition added and updated successfully");
        return false;
    }
}


function getAppType(capID) {
    var matchCap = aa.cap.getCap(capID).getOutput();
    return matchCap.getCapType().toString();
}

/**
 * This function inserts the payment record using the EMSE API for payment when no matching record is found.
 * @param {number} capID - Cap ID model from the staging table 
 * @return {boolean} paid true if the process is completed, otherwise false
 */
function createPaymentForDPLOnIneligible(capID) {
    var status;
    //try
    {
        ELPLogging.debug("create a payment of DPL for Ineligible Record # " +capID );
        logDebug("create a payment of DPL for Ineligible Record # " + capID);
        var payModel = aa.finance.createPaymentScriptModel();

        payModel.setAuditDate(aa.date.getCurrentDate());
        payModel.setCcType(paymenType);
        payModel.setAuditStatus("A");
        payModel.setPaymentComment("LockBox payment");
        var scriptDateObj = new Date(depositDate);
        scriptDateObj = aa.date.getScriptDateTime(scriptDateObj);
        payModel.setPaymentDate(scriptDateObj);
        payModel.setPaymentMethod("Lockbox"); // PaymentMethod = "Lockbox"
        payModel.setPaymentStatus("Paid");
        payModel.setPaymentAmount(paymentAmount);
        payModel.setCashierID("BATCHUSER");
        payModel.setCapID(capID);
        //var sessionNbr = getSessionNbr();
        //var sessionNbr = 1;
        //payModel.setSessionNbr(sessionNbr);

        payModel.setAmountNotAllocated(paymentAmount);
        payModel.setPaymentChange(0);

        var scriptResult = aa.finance.makePayment(payModel);
        if (scriptResult.getSuccess()) {
            ELPLogging.debug("Payment Successfully Created");
            logDebug("Payment Successfully Created");
            status = true;
        } else {
            ELPLogging.debug("Error when creating payment");
            logDebug("Error when creating payment");
            status = false;
        }
    }
    /*catch(ex)
    {
        aa.print(ex.message);
        returnException = new ELPAccelaEMSEException("Error in createPaymentForDPLOnIneligible : " + ex.message);
        logDebug(returnException.toString());
        throw returnException;
    }*/
    return status;
}

/**
 * This function updates the Intake_Status and Processing_Status columns in the staging table.
 *
 * @param {object} updateQry - update query.
 * @param {string} intake - a string added to the field Intake_Status based on the result of 
 *                          matching each fields between the staging table and Accela DB.
 * @param {string} process - a string added to the field Processing_Status based on the result of 
 *                           matching each fields between the staging table and Accela DB.
 *
 * @return {object} INOUT/OUT parameter values
 */
function updateStagingTable(updateQry, intakeStatus) {
    ELPLogging.debug("Updating the staging table");
    logDebug("Updating the staging table");
    try {
        updateQry.prepareStatement();
        var inputParam = updateQry.prepareParameters(stagingConfigObj, dynamicParamObj, batchAppResultObj);
        inputParam.batchInterfaceName = batchInterfaceName;
        inputParam.serviceProviderCode = serviceProviderCode;
        inputParam.batchNumber = batchNumber;
        inputParam.sequenceNumber = sequenceNumber;
        ELPLogging.debug("batchNumber:" +batchNumber);
        logDebug("batchNumber:" + batchNumber);

        var emseUpdateParam = {
            "batchNumber": batchNumber,
            "sequenceNumber": sequenceNumber,
            "batchInterfaceName": batchInterfaceName,
            "serviceProviderCode": serviceProviderCode,
            "intakeStatus": intakeStatus
        };
        inputParam = updateQry.copyEMSEParameters(emseUpdateParam, inputParam);
        ELPLogging.debug("Update Parameters: ", inputParam);
        logDebug("Update Parameters: ", inputParam);
        updateQry.setParameters(inputParam);
        return updateQry.executeProcedure();
    } catch (ex
        if ex instanceof StoredProcedureException) {
        ELPLogging.error(ex.toString(), ex);

        returnException = new ELPAccelaEMSEException("Error update Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
        ELPLogging.error(returnException.toString());
        throw returnException;
    } catch (ex) {
        ELPLogging.error(ex.message, ex);

        returnException = new ELPAccelaEMSEException("Error update Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
        ELPLogging.error(returnException.toString());
        throw returnException;
    }
}

function getTotalInvoicedFees(capIDModel) {
    var feeItemList = aa.finance.getFeeItemByCapID(capIDModel).getOutput();
    var invoiceTotal = 0;

    for (y in feeItemList) {
        var feeItemModel = feeItemList[y];

        if (feeItemModel.getFeeitemStatus() == "INVOICED") {
            invoiceTotal = invoiceTotal + feeItemModel.getFee();
        }
    }

    invoiceTotal = invoiceTotal - getAmtPaidForCapIDModel(capIDModel);

    return invoiceTotal;
}

function getTotalInvoicedFeesForDPL(capIDModel) {
    var feeItemList = aa.finance.getFeeItemByCapID(capIDModel).getOutput();

    var invoicedFeesArray = new Array();
    invoicedFeesArray.invoiceTotal = 0;
    invoicedFeesArray.renewalFee = 0;
    invoicedFeesArray.lateFee = 0;


    for (y in feeItemList) {
        var feeItemModel = feeItemList[y];
        var feeItemCode = feeItemModel.getFeeCod();
        ELPLogging.debug("Fee Code(s) : " + feeItemCode);
        logDebug("Fee Code(s) : " + feeItemCode);
        var subStrFeeCode = feeItemCode.substring(2, 4);
        var feeName = feeItemModel.getFeeDescription().toUpperCase();
        ELPLogging.debug("Fee Name : " + feeName);
        logDebug("Fee Name : " + feeName);
        if (feeItemModel.getFeeitemStatus() == "INVOICED") {
            invoicedFeesArray.invoiceTotal = invoicedFeesArray.invoiceTotal + feeItemModel.getFee();
        }

        if (subStrFeeCode == "LR" || feeName == "LATE RENEWAL FEE") {
            invoicedFeesArray.lateFee = feeItemModel.getFee();
            invoicedFeesArray.renewalFee = invoicedFeesArray.renewalFee + invoicedFeesArray.lateFee;
        }
    }

    invoicedFeesArray.invoiceTotal = invoicedFeesArray.invoiceTotal - getAmtPaidForCapIDModel(capIDModel);

    return invoicedFeesArray;
}

function applyPayment(capIDModel) {
    ELPLogging.debug("Apply payment for Record # "+capIDModel);
    logDebug("Apply payment for Record # " + capIDModel);

    var payResult = aa.finance.getPaymentByCapID(capIDModel, null)

    if (!payResult.getSuccess()) {
        returnException = new ELPAccelaEMSEException("**ERROR: error retrieving payments " + payResult.getErrorMessage());
        ELPLogging.notify(returnException.toString());
        throw returnException;
    }

    var payments = payResult.getOutput();

    for (var paynum in payments) {
        ELPLogging.debug("Payment Found!!!");
        logDebug("Payment Found!!!");
        var payment = payments[paynum];
        var payBalance = payment.getAmountNotAllocated();
        ELPLogging.debug("Payment Balance is: "+payBalance);
        logDebug("Payment Balance is: " + payBalance);

        var payStatus = payment.getPaymentStatus();
        ELPLogging.debug("Payment Status is: "+payStatus);
        logDebug("Payment Status is: " + payStatus);

        if (payBalance <= 0)
            continue; // nothing to allocate

        if (payStatus != "Paid")
            continue; // not in paid status

        var feeResult = aa.finance.getFeeItemByCapID(capIDModel);

        if (!feeResult.getSuccess()) {
            returnException = new ELPAccelaEMSEException("**ERROR: error retrieving fee items " + feeResult.getErrorMessage());
            ELPLogging.notify(returnException.toString());
            throw returnException;
        }

        var feeArray = feeResult.getOutput();

        ELPLogging.debug("Entering Fee Item array");
        logDebug("Entering Fee Item array");
        for (feeNumber in feeArray) {
            logDebug("Fee Found!!!!");
            var feeItem = feeArray[feeNumber];
            var amtPaid = 0;
            var pfResult = aa.finance.getPaymentFeeItems(capIDModel, null);

            if (feeItem.getFeeitemStatus().toUpperCase() != "INVOICED")
                continue; // only apply to invoiced fees
            // this cannot happen, late fee is not invoiced         
            //          if (gracePeriodFlag)
            //          {
            //              var feeItemCode = feeItem.getFeeCod();
            //              var subStrFeeCode = feeItemCode.substring(2, 4);
            //              var feeName = feeItemModel.getFeeDescription().toUpperCase();
            //              
            //              if (subStrFeeCode == "LR" || feeName == "LATE RENEWAL FEE")
            //              {
            //                  ELPLogging.debug("Skipping Payment with lat Renewal Fee within grace period.");
            //                  continue;
            //              }
            //          }

            if (!pfResult.getSuccess()) {
                returnException = new ELPAccelaEMSEException("**ERROR: error retrieving fee payment items items " + pfResult.getErrorMessage());
                ELPLogging.notify(returnException.toString());
                throw returnException;
            }

            var pfObj = pfResult.getOutput();

            for (ij in pfObj)
                if (feeItem.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
                    amtPaid += pfObj[ij].getFeeAllocation();

            var feeBalance = feeItem.getFee() - amtPaid;

            if (feeBalance <= 0)
                continue; // this fee has no balance

            var fseqlist = new Array();
            var finvlist = new Array();
            var fpaylist = new Array();

            var invoiceResult = aa.finance.getFeeItemInvoiceByFeeNbr(capIDModel, feeItem.getFeeSeqNbr(), null);

            if (!invoiceResult.getSuccess()) {
                returnException = new ELPAccelaEMSEException("**ERROR: error retrieving invoice items " + invoiceResult.getErrorMessage());
                ELPLogging.notify(returnException.toString());
                throw returnException;
            }

            var invoiceItem = invoiceResult.getOutput();

            // Should return only one invoice number per fee item

            if (invoiceItem.length != 1)
                ELPLogging.debug("**WARNING: fee item " + feeItem.getFeeSeqNbr() + " returned " + invoiceItem.length + " invoice matches")
            else {
                fseqlist.push(feeItem.getFeeSeqNbr());
                finvlist.push(invoiceItem[0].getInvoiceNbr());

                if (feeBalance > payBalance)
                    fpaylist.push(payBalance);
                else
                    fpaylist.push(feeBalance);

                ELPLogging.debug("About to Apply Payment!!!");
                logDebug("About to Apply Payment!!!");
                applyResult = aa.finance.applyPayment(capIDModel, payment, fseqlist, finvlist, fpaylist, "NA", "NA", "0");

                if (applyResult.getSuccess()) {
                    payBalance = payBalance - fpaylist[0];
                    ELPLogging.debug("Applied $" + fpaylist[0] + " to fee code " + feeItem.getFeeCod() + ".  Payment Balance: $" + payBalance);
                    logDebug("Applied $" + fpaylist[0] + " to fee code " + feeItem.getFeeCod() + ".  Payment Balance: $" + payBalance);
                } else {
                    returnException = new ELPAccelaEMSEException("**ERROR: error applying payment " + applyResult.getErrorMessage());
                    ELPLogging.notify(returnException.toString());
                    throw returnException;
                }
            }

            if (payBalance <= 0)
                break;
        }
    }
}



//var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

/**
 * @desc This method creates Late fees for a scenario where the licensee has payed the renewal fee with the late fee and the payment falls within the grace period
 * @param {array} emseParameters - contains an array of objects to be used as insert parameters
 */
function createLateFees(recordId, capID) {
    var altId = recordId.getCustomID();
    //ELPLogging.error("altID : " + altId);
    var boardCode = altId.split("-")[1];
    var boardName = lookup("BOARD_CODE_INT_RECORD_TYPE", boardCode);
    //ELPLogging.error("boardName : " + boardName);
    if (boardName == null || boardName == "" || boardName == "undefined") {
        ELPLogging.error("Unable to look up Board Name for License: " + altId + ". Verify BOARD_CODE_INT_RECORD_TYPE standard choice contains board code for: " + boardCode);
        return;
    }
    var feeValue = boardCode; //"|" + typeClass;
    //ELPLogging.error("FeeValue: " + feeValue);       
    //3. Get the fee code and fee schedule from Standard choice
    var feeCode;
    var feeSchedule;
    var feeInfo = lookup("Renewal_Late_Fees", feeValue);
    if (feeInfo) {
        feeInfo = feeInfo.toString();
        var fee = new Array();
        fee = feeInfo.split("/");
        feeCode = fee[0];
        feeSchedule = fee[1];
        //ELPLogging.error("From Standard choice: " + feeCode + " "+ feeSchedule);
    } else {
        ELPLogging.error("FeeValue " + feeValue + " not found in Renewal_Late_Fees Standard choice");
        lateFeeNotAdded++;
        return;
    }
    if (feeCode && feeSchedule) {
        if (!doesFeeExists(feeCode, capID)) {
            //ELPLogging.error("Fee Does not exist. Proceed to add the fee.");
            addFee(feeCode, feeSchedule, "STANDARD", 1, "Y", capID);
            //ELPLogging.error("Fee Added on Renewal " + capID + " for License " + altId );
        }
        // Invoice the late fee
        createInvoice(capID);
    }
}
/**
 * @desc : Check if the Late fee already exists on the record.
 */
function doesFeeExists(e, renCapId) {
    var t = false;
    var n = new Array;
    if (arguments.length > 1) {
        t = true;
        for (var r = 1; r < arguments.length; r++) n.push(arguments[r])
    }
    var i = aa.fee.getFeeItems(renCapId);
    if (i.getSuccess()) {
        var s = i.getOutput()
    } else {
        ELPLogging.error("**ERROR: getting fee items: " + capContResult.getErrorMessage());
        return false
    }
    for (ff in s)
        if (e.equals(s[ff].getFeeCod()) && (!t || exists(s[ff].getFeeitemStatus(), n)))
            return true;
    return false;
}
/**
 * @desc : Create an Invoice of the fees created.
 */
function createInvoice(renCapId) {
    //ELPLogging.error("Creating Invoice on Late Fee for Record # : " + renCapId);
    var feeSeqArray = new Array();
    var feeA = new Array();
    var feeResult = aa.fee.getFeeItems(renCapId);
    if (feeResult.getSuccess()) {
        var feeObjArr = feeResult.getOutput();
    } else {
        ELPLogging.error("**ERROR: getting fee items: " + feeResult.getErrorMessage());
        return false;
    }
    for (ff in feeObjArr) {
        fFee = feeObjArr[ff];
        var associatedFee = new Fee();
        var amtPaid = 0;
        var pfResult = aa.finance.getPaymentFeeItems(renCapId, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (fFee.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
                    amtPaid += pfObj[ij].getFeeAllocation()
        }
        associatedFee.sequence = fFee.getFeeSeqNbr();
        associatedFee.code = fFee.getFeeCod();
        associatedFee.description = fFee.getFeeDescription();
        associatedFee.unit = fFee.getFeeUnit();
        associatedFee.amount = fFee.getFee();
        associatedFee.amountPaid = amtPaid;
        if (fFee.getApplyDate())
            associatedFee.applyDate = convertDate(fFee.getApplyDate());
        if (fFee.getEffectDate())
            associatedFee.effectDate = convertDate(fFee.getEffectDate());
        if (fFee.getExpireDate())
            associatedFee.expireDate = convertDate(fFee.getExpireDate());
        associatedFee.status = fFee.getFeeitemStatus();
        associatedFee.period = fFee.getPaymentPeriod();
        associatedFee.display = fFee.getDisplay();
        associatedFee.accCodeL1 = fFee.getAccCodeL1();
        associatedFee.accCodeL2 = fFee.getAccCodeL2();
        associatedFee.accCodeL3 = fFee.getAccCodeL3();
        associatedFee.formula = fFee.getFormula();
        associatedFee.udes = fFee.getUdes();
        associatedFee.UDF1 = fFee.getUdf1();
        associatedFee.UDF2 = fFee.getUdf2();
        associatedFee.UDF3 = fFee.getUdf3();
        associatedFee.UDF4 = fFee.getUdf4();
        associatedFee.subGroup = fFee.getSubGroup();
        associatedFee.calcFlag = fFee.getCalcFlag();;
        associatedFee.calcProc = fFee.getFeeCalcProc();
        associatedFee.version = fFee.getF4FeeItemModel().getVersion();
        feeA.push(associatedFee)
    }
    var feeSeqArray = new Array();
    var paymentPeriodArray = new Array();
    var newStatus = "NEW"
    for (x in feeA) {
        thisFee = feeA[x];
        //ELPLogging.error("Fee Code : " + thisFee.code + " with status : " + thisFee.status);
        var feeStatus = String(thisFee.status);
        if (feeStatus == newStatus) {
            //ELPLogging.error("Including this fee.");
            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
        }
        var invoiceResult_L = aa.finance.createInvoice(renCapId, feeSeqArray, paymentPeriodArray);
        if (!invoiceResult_L.getSuccess()) {
            ELPLogging.error("**ERROR: Invoicing the fee items voided for " + renCapId + " with error " + invoiceResult_L.getErrorMessage(), feeSeqArray);
        }
    }
}
/**
 * @desc This method inserts a record into the underlying staging table using the passed in parameters. It assumes that stagingConfigObj,
         dynamicParamObj, and batchAppResultObj objects are already defined.
 * @param {array} emseParameters - contains an array of objects to be used as insert parameters
 * @throws StoredProcedureException
 */

function insertErrRecord(emseParameters) {
    ELPLogging.debug("The parameters for insertErrRecord are", emseParameters);
    callToStoredProcedure(emseParameters, "insert");
    ELPLogging.debug("Error record inserted into Staging error table");
}

function eligibilityCheck(licenseNumber) {
    var status;

    var capId = aa.cap.getCapID(licenseNumber).getOutput();
    var capModel = aa.cap.getCap(capId).getOutput();

    var capStatus = capModel.getCapStatus();
    aa.print("Status --- " + capStatus);
    switch (String(capStatus)) {
        case "Suspended":
            status = false;
            break;
        case "Revoked":
            status = false;
            break;
        default:
            status = true;
            break;
    }

    return status;
}

function getAmtPaidForCapIDModel(capIDModel) {
    var amtPaid = 0;
    var feeResult = aa.finance.getFeeItemByCapID(capIDModel);

    if (!feeResult.getSuccess()) {
        returnException = new ELPAccelaEMSEException("**ERROR: error retrieving fee items " + feeResult.getErrorMessage());
        ELPLogging.notify(returnException.toString());
        throw returnException;
    }

    var feeArray = feeResult.getOutput();

    aa.print("Entering Fee Item array --" + feeArray[0].getFeeitemStatus());
    for (feeNumber in feeArray) {
        var feeItem = feeArray[feeNumber];
        //var pfResult = aa.finance.getPaymentFeeItems(capIDModel, null);

        if (feeItem.getFeeitemStatus().toUpperCase() != "INVOICED")
            continue; // only apply to invoiced fees
        var pfResult = aa.finance.getPaymentFeeItems(capIDModel, null);

        if (!pfResult.getSuccess()) {
            returnException = new ELPAccelaEMSEException("**ERROR: error retrieving fee payment items items " + pfResult.getErrorMessage());
            aa.print(returnException);
            ELPLogging.notify(returnException.toString());
            throw returnException;
        }

        var pfObj = pfResult.getOutput();

        for (ij in pfObj) {
            aa.print(ij);
            if (feeItem.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr()) {
                amtPaid = pfObj[ij].getFeeAllocation() + amtPaid;
            }

        }
    }

    return amtPaid;
}

function promoteTempCap(tempCapId) {

    var user = "ADMIN";
    //get temporary Cap     
    try {
        var b1PerId1 = tempCapId.getID1();
        //Do not process Temporary CAPs
        if (b1PerId1.indexOf("EST") < 0) {
            aa.print("CapId is not a Temporary CAP: " + tempCapId.toString());
            return null;
        }
        var capResult = aa.cap.getCap(tempCapId); // check format
        if (!capResult.getSuccess()) {
            aa.print("getCap failed for " + tempCapId.toString() + ": " + capResult.getErrorMessage());
            return null;
        }
        var capData = capResult.getOutput();
        aa.print("TMP" + tempCapId);
        aa.print("TMP" + capData);
        var capBusiness = aa.proxyInvoker.newInstance("com.accela.aa.aamain.cap.CapBusiness").getOutput();
        var capIdList = aa.util.newArrayList();
        capIdList.add(tempCapId);

        var resp = capBusiness.createRegularCaps4ACA(capIdList, true, true, user);
        aa.print("resp" + resp);
        if (!resp.isEmpty()) {
            var cmodel = resp.get(0);
            var newCapId = cmodel.capID;
            var capResult = aa.cap.getCap(newCapId); // check format
            if (!capResult.getSuccess()) {
                ELPLogging.notify("getCap failed for " + newCapId.toString() + ": " + capResult.getErrorMessage());
                return null;
            }
            var capData = capResult.getOutput();
            aa.print("CAP" + newCapId);
            aa.print("CAP" + capData);
            return newCapId;
        } else {
            ELPLogging.notify("Regular Cap List is empty for " + tempCapId.toString());
            return null;
        }
    } catch (ex) {
        ELPLogging.error("promoteTempCap: " + tempCapId.toString() + ex.toString(), ex);
        return null;
    }
}

function callToStoredProcedure(emseQueryParameters, queryTag) {
    ELPLogging.debug(" Call to callToStoredProcedure");
    for (var stgObjIterator = 0; stgObjIterator < stagingConfiguration.supplemental.length; stgObjIterator++) {
        var supplementalConfiguration = stagingConfiguration.supplemental[stgObjIterator];
        ELPLogging.debug(" Inside for Loop");
        if (supplementalConfiguration.tag == queryTag) {
            var licenseRecords = new StoredProcedure(supplementalConfiguration.procedure, dbConn);
            break;
        }
    }

    if (licenseRecords == null) {
        var message = "Cannot find procedure queryLicenseRenewals";
        var exception = new Error(message);
        throw exception;
    }

    var staticParameters = {};
    var dynamicParameters = {};
    var batchApplicationResult = {};

    licenseRecords.spCall = "{ CALL " + licenseRecords.procedure.name + " ";

    // add the parameter place holders
    // there is always an out parameter first for the update count
    if ((licenseRecords.procedure.parameters != null) &&
        licenseRecords.procedure.parameters.list.length > 0) {
        var placeHolders = "";

        var parameters = licenseRecords.procedure.parameters.list;

        for (i = 0; i < parameters.length; i++) {
            if (placeHolders.length == 0) {
                placeHolders = placeHolders + "(?";
            } else {
                placeHolders = placeHolders + ", ?";
            }
        }

        placeHolders += ") ";

        licenseRecords.spCall += placeHolders;
    } else {
        var placeHolders = "";
        placeHolders = placeHolders + "(?"; // count out parameter
        placeHolders += ") ";
        licenseRecords.spCall += placeHolders;
    }

    licenseRecords.spCall += "}";
    licenseRecords.statement = licenseRecords.dbConnection.prepareCall(licenseRecords.spCall);

    var inputParameters = licenseRecords.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
    licenseRecords.copyEMSEParameters(emseQueryParameters, inputParameters);

    licenseRecords.setParameters(inputParameters);

    var dataSetResult = licenseRecords.queryProcedure();

    licenseRecords.close();
    return dataSetResult;
}

function getSessionNbr() {
    var sessionNbr;
    var sessionConnection = aa.finance.getCashierSessionFromDB();

    if (sessionConnection.getSuccess()) {
        var sessionConnectionDB = sessionConnection.getOutput();

        if (sessionConnectionDB) {
            sessionNbr = sessionConnectionDB.getSessionNumber();
        }
    }

    return sessionNbr;
}

function performPostProcessing(capIDModel, rowNumber) {
    var controlString = "WorkflowTaskUpdateAfter"; // Standard Choice Starting Point
    var preExecute = "PreExecuteForAfterEvents"; // Standard choice to execute first (for globals, etc) (PreExecuteForAfterEvent or PreExecuteForBeforeEvents)
    aa.env.setValue("PermitId1", capIDModel.getID1());
    aa.env.setValue("PermitId2", capIDModel.getID2());
    aa.env.setValue("PermitId3", capIDModel.getID3());

    aa.env.setValue("CurrentUserID", "BATCHUSER");
    if (preExecute.length)
        doStandardChoiceActions(preExecute, true, 0); // run Pre-execution code

    logGlobals(AInfo);
    showDebug = 3;
    doStandardChoiceActions(controlString, true, 0);

    if (debug.indexOf("**ERROR") > 0) {
        ELPLogging.notify("Error occurred when post processing record " + capIDModel + ": " + debug);

        try {
            var errorUpdateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": debug
            };
            updateStgRecord(errorUpdateParameters);
        } catch (errorException) {
            ELPLogging.notify(errorException.toString(), errorException);
        }
    }
}

/**
 *This method will set ASI for batchNumber and sequenceNumber based on capID for DPL
 *
 */
function updateLockBoxASIValues(capIDForDPL) {
    var asiGroup = "LOCKBOX BATCH INFORMATION";
    var itemNameforbatch = "Lockbox Batch";

    var resultSetForBatch = aa.appSpecificInfo.editSingleAppSpecific(capIDForDPL, itemNameforbatch, batchNumber, asiGroup);
    if (!resultSetForBatch.getSuccess()) {
        ELPLogging.error("Error in updating ASI field");
    }

    var itemNameforSeq = "Lockbox Sequence";

    var resultSetForSeqNbr = aa.appSpecificInfo.editSingleAppSpecific(capIDForDPL, itemNameforSeq, sequenceNumber, asiGroup);
    if (!resultSetForSeqNbr.getSuccess()) {
        ELPLogging.error("Error in updating ASI field");
    }
}

function deactivateWFTask(wfstr, procese, capId) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        aa.print("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        return false;
    }
    // logDebug("Test");
    for (i in wfObj) {
        // logDebug("Test1");
        var fTask = wfObj[i];
        // aa.print(fTask.getTaskDescription()  +"----"+ fTask.getProcessCode() + "---"+ useProcess);
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())); // && (!useProcess || fTask.getProcessCode().equals(processName)))
        {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();
            var completeFlag = fTask.getCompleteFlag();
            if (useProcess) {
                aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
            } else {
                aa.workflow.adjustTask(capId, stepnumber, "N", completeFlag, null, null);
            }
            ELPLogging.debug("deactivating Workflow Task: " + wfstr);
            logDebug("Deactivating Workflow Task: " + wfstr);
            break;
        }
    }
}

function activateWFTask(wfstr, pro, capId) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        return false;
    }
    var procId = wfObj[0].getProcessID();
    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();
            if (useProcess) {
                aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
            } else {
                aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)
            }

            ELPLogging.debug("Activating Workflow Task: " + wfstr.toUpperCase());
            logDebug("Activating Workflow Task: " + wfstr.toUpperCase());
        }
    }
}

function checkWFTaskStatus(taskName, status, capId) {
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        ELPLogging.debug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
        logDebug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
        return false;
    }
    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(taskName.toUpperCase())) {
            if (fTask.getDisposition().toUpperCase().equals(status.toUpperCase())) {
                return true;
            } else {
                return false;
            }
        }
    }
    return false;
}

function assignWFTask(wfstr, pro, capId, deptOfUser) // optional process name
{
    var useProcess = false;
    var processName = "";
    if (arguments.length == 2) {
        processName = arguments[1]; // subprocess
        useProcess = true;
    }
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        var wfObj = workflowResult.getOutput();
    else {
        ELPLogging.debug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
        return false;
    }
    var procId = wfObj[0].getProcessID();
    for (i in wfObj) {
        var fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
            var stepnumber = fTask.getStepNumber();
            var processID = fTask.getProcessID();
            // Assign the user
            var taskUserObj = fTask.getTaskItem().getAssignedUser();
            taskUserObj.setDeptOfUser(deptOfUser);

            fTask.setAssignedUser(taskUserObj);
            var taskItem = fTask.getTaskItem();

            var adjustResult = aa.workflow.assignTask(taskItem);
            if (adjustResult.getSuccess()) {
                ELPLogging.debug("Updated Workflow Task : " + wfstr + " Department Set to " + "DPL/DPL/LIC/EDP/STAFF/NA/NA");
                logDebug("Updated Workflow Task : " + wfstr + " Department Set to " + "DPL/DPL/LIC/EDP/STAFF/NA/NA");
            } else {
                ELPLogging.debug("Error updating wfTask : " + adjustResult.getErrorMessage());
                logDebug("Error updating wfTask : " + adjustResult.getErrorMessage());
            }

            ELPLogging.debug("Assigning Workflow Task: " + wfstr.toUpperCase());
            logDebug("Assigning Workflow Task: " + wfstr.toUpperCase());
        }
    }
}


function getCapIDForABCC(tempCapID) {
    var finalCapID;
    var newCapId;
    var capArray = new Array();

    var childRecordsResult = aa.cap.getProjectByMasterID(tempCapID, "Renewal", "");
    if (childRecordsResult.getSuccess()) {
        var childRecordslist = childRecordsResult.getOutput();

        for (counter in childRecordslist) {
            capArray[counter] = childRecordslist[counter].getCapID();
        }

        if (capArray.length > 0) {
            //Get Latest Renewal record
            var latestRenewalRec = null;
            var latestRenewalRecDate = null;

            for (thisCapCounter in capArray) {
                aa.print(thisCapCounter);
                if (!latestRenewalRec) {

                    latestRenewalRec = capArray[thisCapCounter];

                    aa.print("thisCap" + thisCapCounter + "latestRenewalRec " + latestRenewalRec);
                    var capModelResult = aa.cap.getCap(latestRenewalRec).getOutput();
                    latestRenewalRecDate = capModelResult.getFileDate();
                    var latestRenewalDate = new Date(latestRenewalRecDate.getMonth() + "/" + latestRenewalRecDate.getDayOfMonth() +
                        "/" + latestRenewalRecDate.getYear());
                } else {
                    var tempCapID = capArray[thisCapCounter];
                    var capModelResult = aa.cap.getCap(tempCapID).getOutput();
                    var tempDate = capModelResult.getFileDate();
                    var newLicDate = new Date(tempDate.getMonth() + "/" + tempDate.getDayOfMonth() +
                        "/" + tempDate.getYear());

                    if ((newLicDate > latestRenewalDate) == 1) {
                        latestRenewalDate = newLicDate;
                        latestRenewalRec = tempCapID;
                    }
                }
            }

            finalCapID = latestRenewalRec;

            var b1PerId1 = finalCapID.getID1();

            if (!(b1PerId1.indexOf("EST") < 0)) {

                newCapId = promoteTempCap(finalCapID);

                if (newCapId) {
                    ELPLogging.error("Renewal record # " + newCapId + " found in License # " + licenseNumber);
                } else {
                    // Update Staging table with PROCESSED_EMSE_ERROR
                    var updateParameters = {
                        "intakeStatus": "PROCESSED_EMSE_ERROR",
                        "rowNumber": rowNumber,
                        "stgErrorMessage": "Error in promoting Temporary renewal record to Real record"
                    };
                    updateStgRecord(updateParameters);
                }
            } else {
                newCapId = finalCapID;
            }
        } else {
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "RENEWAL_RECORD_NOT_FOUND",
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            ELPLogging.error("No Renewal record found in License # " + licenseNumber);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "No Renewal record found"
            };
            updateStgRecord(updateParameters);
            return null;
        }
    } else {
        var capScriptModel = aa.cap.getCapList(tempCapID, null).getOutput();

        if (capScriptModel[0].getCapType().getCategory() != "License") {
            finalCapID = tempCapID;

            var b1PerID1 = finalCapID.getID1();

            if (!(b1PerID1.indexOf("EST") < 0)) {

                newCapId = promoteTempCap(finalCapID);

                if (newCapId) {
                    ELPLogging.error("Renewal record # " + newCapId + " found in License # " + licenseNumber);
                } else {
                    // Update Staging table with PROCESSED_EMSE_ERROR
                    var updateParameters = {
                        "intakeStatus": "PROCESSED_EMSE_ERROR",
                        "rowNumber": rowNumber,
                        "stgErrorMessage": "Error in promoting Temporary renewal record to Real record"
                    };
                    updateStgRecord(updateParameters);
                }
            } else {
                newCapId = finalCapID;
            }
        } else {
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "RENEWAL_RECORD_NOT_FOUND",
                "BatchInterfaceName": staticParamObj.interface_name
            };
            insertErrRecord(errorParameters);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "License does not have renewal record"
            };
            updateStgRecord(updateParameters);
            newCapId = null;
        }
    }
    return newCapId;
}

/**
 * @desc This method checks for 5 days grace period for late fee.
 * @param {capIDModel} capIDModel - contains capID model.
 */
function checkForGracePeriod(renewDate, paymentDate) {
    ELPLogging.debug("Checking for grace period " + renewDate + " : " + paymentDate);
    logDebug("Checking for grace period " + renewDate + " : " + paymentDate);
    var isGracePeriod = false;
    var graceDaysToAdd = 5;
    var gracePeriod = new Date(renewDate);
    var paymentDate = new Date(paymentDate);
    gracePeriod = new Date(gracePeriod.setDate(gracePeriod.getDate() + graceDaysToAdd));

    if ((paymentDate > renewDate) && (gracePeriod >= paymentDate)) {
        isGracePeriod = true;
    }

    return isGracePeriod;
}

/************************************ Start CR 212 ****************************************/
/**
 * @desc This method is used to get the latest Reinstatement record by licenseNumber
 * @param {licenseNumber} licenseNumber - contains capID model.
 */
function getReinstatementRecord(licenseNumber) {
    ELPLogging.debug("check Reinstatement Record for License#: " +licenseNumber);
    logDebug("check Reinstatement Record for License#: " + licenseNumber);
    var finalCapID;
    var newCapId;
    var capArray = new Array();
    var reinstatementCapID = aa.cap.getCapID(licenseNumber).getOutput();
    //Reinstatement
    var childRecordsResult = aa.cap.getProjectByMasterID(reinstatementCapID, "R", "");
    if (childRecordsResult.getSuccess()) {
        ELPLogging.debug("Child record found");
        logDebug("Child record found");
        var childRecordslist = childRecordsResult.getOutput();
        if (childRecordslist) {
            var ctr = 0;
            for (counter in childRecordslist) {

                var capScriptModel = aa.cap.getCap(childRecordslist[counter].getCapID()).getOutput();
                if (capScriptModel != null) {
                    var capType = capScriptModel.getCapType();
                    //ELPLogging.debug("capType : " +capType);

                    var scanner = new Scanner(capType.toString(), "/");
                    var group = scanner.next();
                    var type = scanner.next();
                    var subType = scanner.next();
                    var category = scanner.next();
                    //ELPLogging.debug("category : " +category);

                    if ("Reinstatement" == category) {
                        capArray[ctr] = childRecordslist[counter].getCapID();
                        ctr = ctr + 1;
                    }
                }
            }
            if (capArray.length > 0) {
                ELPLogging.debug("Get latest Reinstatement record");
                logDebug("Get latest Reinstatement record");
                //Get Latest Reinstatement record
                var latestRenewalRec = null;
                var latestRenewalRecDate = null;

                for (thisCapCounter in capArray) {
                    ELPLogging.debug("this Cap Counter length : " +thisCapCounter);
                    logDebug("this Cap Counter length : " + thisCapCounter);
                    if (!latestRenewalRec) {
                        latestRenewalRec = capArray[thisCapCounter];

                        ELPLogging.debug("thisCap " + thisCapCounter + " latestRenewalRec " +  latestRenewalRec);
                        logDebug("thisCap " + thisCapCounter + " latestRenewalRec " + latestRenewalRec);
                        var capModelResult = aa.cap.getCap(latestRenewalRec).getOutput();
                        var latestRenewalDate = new Date();
                        if (capModelResult.getCapStatus() == "Closed") {
                            latestRenewalRec = null;
                            latestRenewalDate = null;
                        }
                        //latestRenewalRecDate = capModelResult.getFileDate();
                        //var latestRenewalDate = new Date(latestRenewalRecDate.getMonth()+"/"+latestRenewalRecDate.getDayOfMonth()+
                        //                                "/"+latestRenewalRecDate.getYear());
                    } else {
                        var tempCapID = capArray[thisCapCounter];

                        var capModelResult = aa.cap.getCap(tempCapID).getOutput();
                        var tempDate = capModelResult.getFileDate();
                        var newLicDate = new Date(tempDate.getMonth() + "/" + tempDate.getDayOfMonth() +
                            "/" + tempDate.getYear());
                        ELPLogging.debug("thisCap " + capModelResult.getCapStatus() + " latestRenewalRec " +  tempCapID);
                        logDebug("thisCap " + capModelResult.getCapStatus() + " latestRenewalRec " + tempCapID);
                        if (((newLicDate > latestRenewalDate) == 1) && (capModelResult.getCapStatus() != "Closed")) {
                            latestRenewalDate = newLicDate;
                            latestRenewalRec = tempCapID;
                        }
                    }
                }
                finalCapID = latestRenewalRec;
                ELPLogging.debug("finalCapID 1 : " +finalCapID);
                logDebug("finalCapID 1 : " + finalCapID);
            } else {
                ELPLogging.debug("No Reinstatement record found in License # " + licenseNumber);
                logDebug("No Reinstatement record found in License # " + licenseNumber);
                var errorParameters = {
                    "RecordID": licenseNumber,
                    "errorMessage": "No Reinstatement record found",
                    "BatchInterfaceName": staticParamObj.interface_name,
                    "runDate": batchAppResultObj.runDate
                };
                insertErrRecord(errorParameters);
                var updateParameters = {
                    "intakeStatus": "PROCESSED_EMSE_ERROR",
                    "rowNumber": rowNumber,
                    "stgErrorMessage": "No Reinstatement record found"
                };
                updateStgRecord(updateParameters);
                return null;
            }
        } else {
            ELPLogging.debug("No Reinstatement record found in License # " + licenseNumber);
            logDebug("No Reinstatement record found in License # " + licenseNumber);
            var errorParameters = {
                "RecordID": licenseNumber,
                "errorMessage": "No Reinstatement record found",
                "BatchInterfaceName": staticParamObj.interface_name,
                "runDate": batchAppResultObj.runDate
            };
            insertErrRecord(errorParameters);
            var updateParameters = {
                "intakeStatus": "PROCESSED_EMSE_ERROR",
                "rowNumber": rowNumber,
                "stgErrorMessage": "No Reinstatement record found"
            };
            updateStgRecord(updateParameters);
            return null;
        }
    } else {
        var errorParameters = {
            "RecordID": licenseNumber,
            "errorMessage": "No Reinstatement record found",
            "BatchInterfaceName": staticParamObj.interface_name,
            "runDate": batchAppResultObj.runDate
        };
        insertErrRecord(errorParameters);
        var updateParameters = {
            "intakeStatus": "PROCESSED_EMSE_ERROR",
            "rowNumber": rowNumber,
            "stgErrorMessage": "No Reinstatement record found"
        };
        updateStgRecord(updateParameters);
        return null;
    }

    return finalCapID;
}

function checkDORCondition(capId, capLicNbr) {
    var conditionName = "Right to Renew Stayed by DOR";
    var conditionType = "ELP Interfaces";   
    var checkLicNbr = String(capLicNbr);
    var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
    if (!capLicenseResult.getSuccess()) {
        ELPLogging.debug("**WARNING: getting CAP licenses: " + capLicenseResult.getErrorMessage());
        var licArray = new Array();
    } else {
        ELPLogging.debug("License success");
        var licArray = capLicenseResult.getOutput();
        if (!licArray)
            licArray = new Array();
        ELPLogging.debug("Licenses " + licArray.length);        
    }

    for (var thisLic in licArray) {
        if (licArray[thisLic].getLicenseProfessionalModel().getLicSeqNbr()) {
            var licSeq = licArray[thisLic].getLicenseProfessionalModel().getLicSeqNbr();
            var licNbr = String(licArray[thisLic].getLicenseNbr());

            ELPLogging.debug("LIC_NBR " + licNbr);
            ELPLogging.debug("LICENSE", licArray[thisLic]);

            if (licNbr == checkLicNbr) {
                ELPLogging.debug("LIC_SEQ " + licSeq);              
                var licCondResult = aa.caeCondition.getCAEConditions(licSeq);
                if (!licCondResult.getSuccess()) {
                    ELPLogging.debug("**WARNING: getting license Conditions : " + licCondResult.getErrorMessage());
                    var licCondArray = new Array();
                } else {
                    var licCondArray = licCondResult.getOutput();
                    ELPLogging.debug("Conditions: " + licCondArray.length);
                }
                for (var thisLicCond in licCondArray) {
                    var thisCond = licCondArray[thisLicCond];
                    ELPLogging.debug("COND" + thisCond.toString());
                    ELPLogging.debug("COND", thisCond);
                    var cStatusType = String(thisCond.getConditionStatusType());
                    var cStatus = String(thisCond.getConditionStatus());
                    var cDesc = thisCond.getConditionDescription();
                    var cImpact = thisCond.getImpactCode();
                    var cType = thisCond.getConditionType();
                    var cComment = thisCond.getConditionComment();
                    if (thisCond.getConditionType().toUpperCase() == conditionType.toUpperCase() && thisCond.getConditionDescription().toUpperCase() == conditionName.toUpperCase()) //EMSE Dom function does like search, needed for exact match
                    {   
                        ELPLogging.debug("status:Statustype " + cStatus + ":" + cStatusType);
                        //Fix for defect# 11819
                        if (cStatus == "Applied") {
                        ELPLogging.debug("Found DOR Condition");
                        return true;
                        }
                    }
                }
            }   
        }
    }
    ELPLogging.debug("Did not Find DOR Condition");
    return false;
}

function elapsed() {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - batchStartTime) / 1000)
}
// end user code
//aa.env.setValue("ScriptReturnCode", "1"); aa.env.setValue("ScriptReturnMessage", debug)
