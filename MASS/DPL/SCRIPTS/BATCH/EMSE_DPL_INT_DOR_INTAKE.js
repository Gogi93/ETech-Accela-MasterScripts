var myCapId;
var myUserId = "BATCHUSER";

//wfProcess = "DPL_APPLICATION_WITH_EXAM";
//wfTask = "Pre-Hearing"; //
wfStatus = "Motion Filed"; 
aa.env.setValue("EventName","WorkflowTaskUpdateAfter");
//aa.env.setValue("EventName","ApplicationSpecificInfoUpdateAfter");
//aa.env.setValue("EventName","ApplicationSubmitAfter");
//aa.env.setValue("EventName","RenewalInfoUpdateAfter");
//aa.env.setValue("EventName","ConvertToRealCAPAfter");
//aa.env.setValue("EventName","PaymentReceiveAfter");


var runEvent = true; // set to false if you want to roll your own code here in script test
/* master script code don't touch */ var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); aa.env.setValue("PermitId2",tmpID.getID2()); aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { useSA = true; SA = bzr.getOutput().getDescription(); bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); } }if (SA) { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA)); eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA)); /* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA)); }else { eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS")); eval(getScriptText("INCLUDES_ACCELA_GLOBALS")); } eval(getScriptText("INCLUDES_CUSTOM"));if (documentOnly) { doStandardChoiceActions(controlString,false,0); aa.env.setValue("ScriptReturnCode", "0"); aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed."); aa.abortScript(); }var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) { var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE"); doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT"); doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I"; } function getScriptText(vScriptName){ var servProvCode = aa.getServiceProviderCode(); if (arguments.length > 1) servProvCode = arguments[1]; vScriptName = vScriptName.toUpperCase(); var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); try { var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN"); return emseScript.getScriptText() + ""; } catch(err) { return ""; }} logGlobals(AInfo); if (runEvent && doStdChoices) doStandardChoiceActions(controlString,true,0); if (runEvent && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z);
//
// User code goes here

/*********************************************************************************************************************
* The purpose of this script is to extract records from the Accela DB to send to the DOR Tax Check System.The 		 *
* script will retrieve records with a license type that is determined in the configuration file. It will extract all *
* license records with the specified license type, place a condition on them, and insert them into the underlying    *
* staging table. It will also re-process records that were already sent to the DOR system but were returned with    *
* negative conditions.                                                                                               *
*                                                                                                                    *
* @author Amol Surjuse 01/07/2014                                                                                         *
*********************************************************************************************************************/


try
{
    try
    {   
        //Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 2.0
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
		eval(getScriptText("INCLUDES_CUSTOM"));
        var returnException;
        ELPLogging.debug("DOR VERSION 2.0");
        ELPLogging.debug("Finished loading the external scripts");
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
    try
    {
        //load all of the input parameters into objects
        var stagingConfigObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("stagingConfiguration"));
        var staticParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));
        var dynamicParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("dynamicParameters"));
        var batchAppResultObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));
        ELPLogging.debug("Finished loading the input parameters into JSON objects");
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
    try
    {
        //Create a connection to the Staging Table Database
        var dbConn = DBUtils.connectDB(stagingConfigObj.connectionInfo);
        ELPLogging.debug("Established a Database Connection");
    }
    catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Connecting to Staging Table Database " + ex.message, ScriptReturnCodes.STAGING_CONNECTION);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }

    // POC
	var selectQueryObj = {
		"selectQuery": {
			"table": "ELP_TBL_DOR_STG_DPL",
			"parameters": {
				"list": [{
					"name": "ssn",
					"source": "RESULT",
					"property": "ssn",
					"type": "STRING",
					"parameterType": "IN"
				}, {
					"name": "fId",
					"source": "RESULT",
					"property": "fId",
					"type": "STRING",
					"parameterType": "IN"
				}, {
					"name": "intakeStatus",
					"source": "RESULT",
					"property": "intakeStatus",
					"type": "STRING",
					"parameterType": "IN"
				}, {
					"name": "extractStatus",
					"source": "RESULT",
					"property": "extractStatus",
					"type": "STRING",
					"parameterType": "IN"
				}, {
					"name": "runDate",
					"source": "RESULT",
					"property": "runDate",
					"type": "DATE_TIME",
					"parameterType": "IN"
				}, {
					"name": "sp_cursor",
					"source": "RESULT",
					"property": "sp_cursor",
					"type": "ResultSet",
					"parameterType": "OUT"
				}]
			},
			"resultSet": {
				"list": [{
					"name": "rowNumber",
					"source": "RESULT",
					"property": "ROW_NUMBER",
					"type": "INTEGER",
					"parameterType": "OUT"
				}, {
					"name": "accelaId",
					"source": "RESULT",
					"property": "ACCELA_ID",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "recordId",
					"source": "RESULT",
					"property": "RECORD_ID",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "extractStatus",
					"source": "RESULT",
					"property": "EXTRACT_STATUS",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "intakeStatus",
					"source": "RESULT",
					"property": "INTAKE_STATUS",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "runDate",
					"source": "RESULT",
					"property": "RUN_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "batchInterfaceName",
					"source": "RESULT",
					"property": "BATCH_INTERFACE_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "serviceProviderCode",
					"source": "RESULT",
					"property": "SERVICE_PROVIDER_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "transactionGroup",
					"source": "RESULT",
					"property": "TRANSACTION_GROUP",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "dateLoaded",
					"source": "RESULT",
					"property": "DATE_LOADED",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "stgErrorMessage",
					"source": "RESULT",
					"property": "STG_ERROR_MESSAGE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "ssn",
					"source": "RESULT",
					"property": "SSN",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "firstName",
					"source": "RESULT",
					"property": "FIRST_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "middleInit",
					"source": "RESULT",
					"property": "MIDDLE_INITIAL",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "lastName",
					"source": "RESULT",
					"property": "LAST_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "generation",
					"source": "RESULT",
					"property": "GENERATION",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "maidenName",
					"source": "RESULT",
					"property": "MAIDEN_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "addressLine1",
					"source": "RESULT",
					"property": "ADDRESS_LINE_1",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "addressLine2",
					"source": "RESULT",
					"property": "ADDRESS_LINE_2",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "city",
					"source": "RESULT",
					"property": "CITY",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "state",
					"source": "RESULT",
					"property": "STATE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "zipCode",
					"source": "RESULT",
					"property": "ZIP_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "fId",
					"source": "RESULT",
					"property": "FID",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessName",
					"source": "RESULT",
					"property": "BUSINESS_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessAddressLine1",
					"source": "RESULT",
					"property": "BUSINESS_ADDRESS_LINE_1",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessAddressLine2",
					"source": "RESULT",
					"property": "BUSINESS_ADDRESS_LINE_2",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessCity",
					"source": "RESULT",
					"property": "BUSINESS_CITY",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessState",
					"source": "RESULT",
					"property": "BUSINESS_STATE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "businessZipCode",
					"source": "RESULT",
					"property": "BUSINESS_ZIP_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "boardCode",
					"source": "RESULT",
					"property": "BOARD_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "licenseNumber",
					"source": "RESULT",
					"property": "LICENSE_NUMBER",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "typeClass",
					"source": "RESULT",
					"property": "TYPE_CLASS",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "issueDate",
					"source": "RESULT",
					"property": "ISSUE_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "licenseExpDate",
					"source": "RESULT",
					"property": "LICENSE_EXPIRATION_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "eligibilityDate",
					"source": "RESULT",
					"property": "ELIGIBILITY_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "statusCode",
					"source": "RESULT",
					"property": "STATUS_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "entityType",
					"source": "RESULT",
					"property": "ENTITY_TYPE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "agency",
					"source": "RESULT",
					"property": "AGENCY",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "startingExpDate",
					"source": "RESULT",
					"property": "STARTING_EXPIRATION_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "endingExpDate",
					"source": "RESULT",
					"property": "ENDING_EXPIRATION_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "complianceFlg",
					"source": "RESULT",
					"property": "COMPLIANT_FLG",
					"type": "STRING",
					"parameterType": "OUT"
				}]
			}
		}
	};

	//Create the global variables that will be used throughout the script
	var conditionName = "Right to Renew Stayed by DOR";
	var conditionType = "ELP Interfaces";
	//Query the staging table for records with an intake status of "EXTRACTED_FILE"
	ELPLogging.debug("Query Starts here------------");
	var emseQueryParameters = {"intakeStatus":"EXTRACTED_FILE"};
	
	try
	{
		ELPLogging.debug("Test -111 " + new Date(dynamicParamObj.lastRunDate) + " ---" +dynamicParamObj.lastRunDate);
		// POC
	    var processedCount = countStagingRecords(new Date(dynamicParamObj.lastRunDate));

	    // POC
        // var processedCount = countImportedRecords(new Date(dynamicParamObj.lastRunDate));
        // 
        ELPLogging.debug("Test -222 : processedCount -  " +  processedCount);
        updateDynamicParams(processedCount);	
        dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
        var DPS = JSON.stringify(dynamicParamObj);
        aa.env.setValue("dynamicParameters", DPS);
	}
	catch(ex)
	{
		ELPLogging.debug("Test -333 ");
		ELPLogging.notify("Error in updating Dynamic table with processed record count: "+ex.toString());
	}

	try
    {
    	// create DOR_NOTIFICATION_REPORT Set
    	var notificationSet = callDORNotificationReport();
    	// POC
    	var dataSet = getStgRecords(emseQueryParameters);
    	// POC
		// var dataSet = queryStgRecord(emseQueryParameters);
		evaluateStgRecords(dataSet, notificationSet);
	}
	catch(ex if ex instanceof StoredProcedureException)
    {
        returnException = new ELPAccelaEMSEException("Error querying Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
        ELPLogging.fatal(" Fatal Error "+returnException.toString());
        throw returnException;
    }
	//Evaluate the record and place condition on it
	
}
catch(ex if ex instanceof ELPAccelaEMSEException)
{
        ELPLogging.fatal(ex.toString());
        aa.env.setValue("EMSEReturnCode", ex.getReturnCode()); 
        aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_DOR_INTAKE aborted with " + ex.toString());
}
catch(ex)
{
        ELPLogging.fatal(ex.message);
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE); 
        aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_DOR_INTAKE aborted with " + ex.message);
}
finally
{
    if (!ELPLogging.isFatal()) {    // if fatal then return code already filled in
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
        aa.env.setValue("ScriptReturnCode","0");
        if (ELPLogging.getErrorCount() > 0) {
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_DOR_INTAKE completed with " + ELPLogging.getErrorCount() + " errors.");                    
        } else {
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_DOR_INTAKE completed with no errors.");            
        }
    }
    if(dbConn){
     dbConn.close();
    }
    aa.env.setValue("logFile", ELPLogging.toJSON());
}

//------------------------------------------------------------------------------------------------------------------------------------------------

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText()+"";
}

/**
 * @desc This method evaluates the return values from the DOTF system for the result set of the query. Depending
 *       the values returned, it will either create or update a condition depending on whether or not the staging
 *       table record has been already sent, or expire the condition and delete the staging table record.
 * @param {DataSet} dataSet - contains the result set of a query of the staging table
 */

function evaluateStgRecords(dataSet, notificationSet)
{
 	ELPLogging.debug("evaluateStgRecords Starts-----");
	var queryResult = null;
	ELPLogging.debug("Read evaluateStgRecords");
	while ((queryResult = dataSet.next()) != null) 
    {
		try
		{
			ELPLogging.debug("WHILE evaluateStgRecords ", queryResult);
			//Retrieve the DOTF return values
			var accelaId = queryResult.accelaId;
			ELPLogging.debug("accelaId-----"+accelaId);
			ELPLogging.debug("Read the result set");
			//update varibales
			var licenseNumber = queryResult.licenseNumber;
			ELPLogging.debug("licenseNumber-----"+licenseNumber);
			var ssn = queryResult.ssn;
			ELPLogging.debug("ssn-----"+ssn);
			var fID = queryResult.fId;
			ELPLogging.debug("fID-----"+fID);
			var complianceFlg = queryResult.complianceFlg;
			var runDate = queryResult.runDate;
			var intakeStatus = queryResult.intakeStatus;
			var extractStatus = queryResult.extractStatus;
			var stgErrorMessage = queryResult.stgErrorMessage;
			var comment = "License was found non-tax compliant by DOR on " +runDate;
			var sevirity = "Hold";
			//Create a CapIdModel
			var scanner = new Scanner(accelaId,"-");
			var id1 = scanner.next();
			var id2 = scanner.next();
			var id3 = scanner.next();
			var capIDModel = aa.cap.getCapID(id1,id2,id3).getOutput();
			notificationSet.add(capIDModel, false);
			var refLicProf = getRefLicenseProf(capIDModel.getCustomID());
			ELPLogging.debug("LIC MODEL", refLicProf);
			var licSeqNum =0;
			if(refLicProf != null)
			{
				licSeqNum = refLicProf.getLicSeqNbr();		
				ELPLogging.debug("LICSEQNUM " + licSeqNum + " typeof " + (typeof licSeqNum), licSeqNum);	
			}
			
			
			if(licSeqNum && capIDModel)
			{
				//Create Investigation Intake record.
				//removed for defect 3240
				//createInvestigationRecord(capIDModel,refLicProf);			
				
				ELPLogging.debug("Create Investigation Intake record for capID: " + capIDModel +" with ref License no: "+licenseNumber);
				//Create a condition on reference license and update the staging table record
	
				//Defect : 5046 fixes - to add additional comment on LP
				
				var additionalComment = " with License# : " +Number(licenseNumber).toString()+ " , First Name : " +queryResult.firstName+ " , Last Name : " + queryResult.lastName;
				
				addLicenseStandardCondition(capIDModel, licSeqNum, conditionType, conditionName, additionalComment, runDate);
				ELPLogging.debug("Adding conditions ------conditionType: " + conditionType +",conditionName: "+ conditionName+" ,licSeqNum : "+ licSeqNum);
				
				//editConditionComment(capIDModel,conditionName,comment);
				var updateParameters = {"licenseNumber":licenseNumber, "ssn":ssn, "fID":fID, "complianceFlg":"N", "intakeStatus":"PROCESSED_EMSE","runDate":runDate, "extractStatus":extractStatus,"stgErrorMessage":stgErrorMessage};
				try
				{
					updateStgRecord(updateParameters);
				}
				catch(ex if ex instanceof StoredProcedureException)
				{
					ELPLogging.notify("StoredProcedureException Occurred when trying to update record "+capIDModel+": "+ex.toString());
				}
			}
			else
			{
				ELPLogging.notify("Cannot Locate Reference License for capID :"+capIDModel);
			}
		}
		catch(ex)
		{
			ELPLogging.debug(ex.toString());
			var updateParameters = {"licenseNumber":licenseNumber, "ssn":ssn, "fID":fID, "complianceFlg":"N", "intakeStatus":"PROCESSED_EMSE_ERROR","runDate":runDate, "stgErrorMessage" : "Error occurred while processing record"}
			updateStgRecord(updateParameters);
		}
	}
}

/** 
 * @desc This Method creates Investigation record for every record returned in the DOR input file.
 * @param {capID} capID -  Record ID.
 * @throws  N/A
 */
function createInvestigationRecord(capID,refLP)
{
	ELPLogging.debug("In side createInvetigationRecord--------------");
    var enforCapId = createCap("Enforce/Investigation/Intake/NA");
    copyAddresses(capID,enforCapId);
    copyContacts(capID,enforCapId);
    copyLicensedProf(capID,enforCapId);
    ELPLogging.debug("copyLicensedProf--------------");
    // Link the License record with new Investigation record
    aa.cap.createAppHierarchy(capID,enforCapId);
    
    capModel = aa.cap.getCap(capID).getOutput();

    capModel.setCapStatus("Active");
    aa.cap.editCapByPK(capModel.getCapModel()); 
	
	// Associate LP with CapId

	ELPLogging.debug("associating CAP to LP: -------------"+ "licScriptModel: " + refLP + " with enforCapId : " +enforCapId);
	/*
	try{
	
		ELPLogging.debug("Script  LP Started: -------------");
		var asCapResult = aa.licenseScript.associateLpWithCap(enforCapId, refLP);
		
		if (!asCapResult.getSuccess()) {
			ELPLogging.debug("WARNING error associating CAP to LP: -------------"+ asCapResult.getErrorMessage());
			
		} else {
			ELPLogging.debug("Associated the CAP to the new LP");
			
		}

		ELPLogging.debug("Script  LP Finished: -------------");
		
	}
	catch(ex)
	{
		ELPLogging.notify("Script Aborted LP: -------------"+ ex.message);
	}	
	*/
	
}

function addLicenseStandardCondition(capId, licSeqNum, cType, cDesc, additionalComment,runDate) {
	var foundCondition = false;
	var cStatus = "Applied";
	if (!aa.capCondition.getStandardConditions) {
		ELPLogging.debug("addLicenseStdCondition function is not available in this version of Accela Automation.");
	} else {
		standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
		for (i = 0; i < standardConditions.length; i++) {
			ELPLogging.debug("CONDITION", standardConditions[i]);
			if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() && standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase()) //EMSE Dom function does like search, needed for exact match
			{
				standardCondition = standardConditions[i]; // add the last one found
				
				//Defect : 5046 fixes - to add additional comment on LP
				var standardCondComment = standardCondition.getConditionComment()+ " "+runDate +additionalComment;
				ELPLogging.debug("standardCondComment: "+ standardCondComment)
				foundCondition = true;
                
                // JIRA 4153 : DOR Interface should not add DOR condition if it is already exists.
                if (licSeqNum)
                {
                    var condArr = aa.caeCondition.getCAEConditions(licSeqNum).getOutput();
                    
                    for (c in condArr)
                    {
                        if (condArr[c].getConditionDescription() == cDesc && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
                        {
                            ELPLogging.debug("DOR condition already exists : " + capId.getCustomID());
                            return;
                        }
                    }
                }
				
                if (!licSeqNum) // add to all reference licenses on the current capId
				{
					var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
					if (capLicenseResult.getSuccess()) {
						var refLicArr = capLicenseResult.getOutput();
					} else {
						ELPLogging.debug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage());
						return false;
					}
					for (var refLic in refLicArr) {
						if (refLicArr[refLic].getLicenseProfessionalModel().getLicSeqNbr()) {
							licSeq = refLicArr[refLic].getLicenseProfessionalModel().getLicSeqNbr();
							var addCAEResult = aa.caeCondition.addCAECondition(licSeq, standardCondition.getConditionType(), standardCondition.getConditionDesc(), standardCondComment, null, null, standardCondition.getImpactCode(), cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
							if (addCAEResult.getSuccess()) {
								ELPLogging.debug("Successfully added licensed professional (" + licSeq + ") condition: " + cDesc);
							} else {
								ELPLogging.debug("**ERROR: adding licensed professional (" + licSeq + ") condition: " + addCAEResult.getErrorMessage());
							}
						}
					}
				} else {
					var addCAEResult = aa.caeCondition.addCAECondition(licSeqNum, standardCondition.getConditionType(), standardCondition.getConditionDesc(), standardCondComment, null, null, standardCondition.getImpactCode(), cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
					if (addCAEResult.getSuccess()) {
						ELPLogging.debug("Successfully added licensed professional (" + licSeqNum + ") condition: " + cDesc);
					} else {
						ELPLogging.debug("**ERROR: adding licensed professional (" + licSeqNum + ") condition: " + addCAEResult.getErrorMessage());
					}
				}
			}
			}
	}
	if (!foundCondition)
		ELPLogging.debug("**WARNING: couldn't find standard condition for " + cType + " / " + cDesc);
}

function callDORNotificationReport()
{
	var itemcap = capId;
	if (arguments.length > 4)
		itemcap = arguments[4];
	var reportToBe = "DOR|DOR_NOTIFICATION_REPORT";
	var setType = "DOR Notification Report";
	var myHashMap=aa.util.newHashMap();
	var dDate=new Date();
	var dateString =null;
	var setToBePrinted=null;
	var setName=null;
	var dateString=null;
	var lkupResult = null;
	var setFrequency =null;
	var setDate=null;

	setName=generateBatchPrintSetName(reportToBe);

	if (setName!='undefined' && setName!=null) {
		setToBePrinted = new capSet(setName.toUpperCase());
	}

	if (setToBePrinted){
		setToBePrinted.updateRecordSetType(setType);
		setToBePrinted.updateSetStatus("Created");
	}
	return setToBePrinted;
}

function countStagingRecords(runDate) {
    var count = 0;
    try {
        var array = [];
        var tableName = selectQueryObj.selectQuery.table;

        var stagingQueryParameters = {
            "runDate": runDate,
            "tableName": tableName
        };

        var dataSet = getStgRecords(stagingQueryParameters);

        var queryResult = null;
        while ((queryResult = dataSet.next()) != null) {
            count++;
        }

    } catch (ex) {
        ELPLogging.debug("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return count;
}

function getStgRecords(parameters) {
    ELPLogging.debug("**INFO: getStgRecords.");
    var dataSet = null;
    try {

        for (p in parameters) {
            ELPLogging.debug("**INFO: " + p + ": " + parameters[p]);
        }

        if (parameters["ssn"] == null && parameters["intakeStatus"] == null && parameters["runDate"] == null && parameters["extractStatus"] == null && parameters["fId"] == null) {
            ELPLogging.debug("**ERROR: Expected parameters are all null.");
            return null;
        }

        var stmt = null;
        var sql = "select * from " + parameters["tableName"];

        if (parameters["ssn"] && parameters["ssn"] != null) {
            sql += " WHERE SSN = ?";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["ssn"]);
        }

        if (parameters["intakeStatus"] && parameters["intakeStatus"] != null) {
            sql += " WHERE INTAKE_STATUS = ?";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["intakeStatus"]);
        }

        if (parameters["runDate"] && parameters["runDate"] != null) {
            sql += " WHERE RUN_DATE like ?";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            var sql_date = new java.sql.Date(parameters["runDate"].getTime());
            stmt.setDate(1, sql_date);
        }

        if (parameters["extractStatus"] && parameters["extractStatus"] != null) {
            sql += " WHERE EXTRACT_STATUS = ?";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["extractStatus"]);
        }

        if (parameters["fId"] && parameters["fId"] != null) {
            sql += " WHERE FID = ?";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["fId"]);
        }

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.debug("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}


// end user code
//aa.env.setValue("ScriptReturnCode", "1"); aa.env.setValue("ScriptReturnMessage", debug)

