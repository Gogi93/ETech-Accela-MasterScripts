/***********************************************************************************************************************************
* @Title 		: 	EMSE_DPL_INT_ASWB_INTAKE																						*
* @Author		:	Abhay Tripathi																									*
* @Date			:	02/02/2016																										*
* @Description 	:	The Script will query the staging table to retrieve record information that were loaded from the 				*
*					Association of Social Workers Board inbound file.Script performs check for duplicate records based on 			*
*					licenseNumber, board code, type class. Script will check for the board code to create and update Accela 		*
*					entries for valid records.																						*
*					For SW board : Perform Application record validation [SSN, Phone number, address, license number, 				*
*								license expiration date]. If validation is successful then create Application record,				*
*								license record, reference license record, license professional in the Accela system. 				*
*								Add the application record into the monthly payment set. If validation fails, record 				*
*								will be inserted into error table and email will be triggered for any erroneous record. 			*
***********************************************************************************************************************************/
var selectQueryObj = {
    "selectQuery": {
        "table": "ELP_TBL_ASWB_STG_DPL", 
        "parameters": {
            "list": [
                {
                    "name": "runDate", 
                    "source": "RESULT", 
                    "property": "runDate", 
                    "type": "DATE_TIME", 
                    "parameterType": "IN"
                }, 
                {
                    "name": "intakeStatus", 
                    "source": "RESULT", 
                    "property": "intakeStatus", 
                    "type": "STRING", 
                    "parameterType": "IN"
                }, 
                {
                    "name": "sp_cursor", 
                    "source": "RESULT", 
                    "property": "sp_cursor", 
                    "type": "ResultSet", 
                    "parameterType": "OUT"
                }
            ]
        }, 
        "resultSet": {
            "list": [
                {
                    "name": "rowNumber", 
                    "source": "RESULT", 
                    "property": "ROW_NUMBER", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "batchInterfaceName", 
                    "source": "RESULT", 
                    "property": "BATCH_INTERFACE_NAME", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "serviceProviderCode", 
                    "source": "RESULT", 
                    "property": "SERVICE_PROVIDER_CODE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "transactionGroup", 
                    "source": "RESULT", 
                    "property": "TRANSACTION_GROUP", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "boardCode", 
                    "source": "RESULT", 
                    "property": "BOARD_CODE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "licenseNumber", 
                    "source": "RESULT", 
                    "property": "LICENSE_NUMBER", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "typeClass", 
                    "source": "RESULT", 
                    "property": "TYPE_CLASS", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "socSecNumber", 
                    "source": "RESULT", 
                    "property": "SOC_SEC_NUMBER", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "firstName", 
                    "source": "RESULT", 
                    "property": "FIRST_NAME", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "middleInit", 
                    "source": "RESULT", 
                    "property": "MIDDLE_INIT", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "lastName", 
                    "source": "RESULT", 
                    "property": "LAST_NAME", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "maidenName", 
                    "source": "RESULT", 
                    "property": "MAIDEN_NAME", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "generation", 
                    "source": "RESULT", 
                    "property": "GENERATION", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "cashNumber", 
                    "source": "RESULT", 
                    "property": "CASH_NUMBER", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "cashDate", 
                    "source": "RESULT", 
                    "property": "CASH_DATE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "licIssueDate", 
                    "source": "RESULT", 
                    "property": "LIC_ISSUE_DATE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "licExpiryDate", 
                    "source": "RESULT", 
                    "property": "LIC_EXPIRY_DATE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "addressLine1", 
                    "source": "RESULT", 
                    "property": "ADDRESS_LINE1", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "addressLine2", 
                    "source": "RESULT", 
                    "property": "ADDRESS_LINE2", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "city", 
                    "source": "RESULT", 
                    "property": "CITY", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "state", 
                    "source": "RESULT", 
                    "property": "STATE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "zipCodeA", 
                    "source": "RESULT", 
                    "property": "ZIP_CODEA", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "zipCodeB", 
                    "source": "RESULT", 
                    "property": "ZIP_CODEB", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "dateOfBirth", 
                    "source": "RESULT", 
                    "property": "DATE_OF_BIRTH", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "examDate", 
                    "source": "RESULT", 
                    "property": "EXAM_DATE", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "schoolGraduated", 
                    "source": "RESULT", 
                    "property": "SCHOOL_GRADUATED", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "gradYr", 
                    "source": "RESULT", 
                    "property": "GRAD_YR", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "schoolLocation", 
                    "source": "RESULT", 
                    "property": "SCHOOL_LOCATION", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "businessName", 
                    "source": "RESULT", 
                    "property": "BUSINESS_NAME", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busAddressLine1", 
                    "source": "RESULT", 
                    "property": "BUS_ADDRESS_LINE1", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busAddressLine2", 
                    "source": "RESULT", 
                    "property": "BUS_ADDRESS_LINE2", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busCity", 
                    "source": "RESULT", 
                    "property": "BUS_CITY", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busState", 
                    "source": "RESULT", 
                    "property": "BUS_STATE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busZipA", 
                    "source": "RESULT", 
                    "property": "BUS_ZIP_A", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "busZipB", 
                    "source": "RESULT", 
                    "property": "BUS_ZIP_B", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore1", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_1", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore2", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_2", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore3", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_3", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore4", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_4", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore5", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_5", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "reciprocity", 
                    "source": "RESULT", 
                    "property": "RECIPROCITY", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "scoreIndicator", 
                    "source": "RESULT", 
                    "property": "SCORE_INDICATOR", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "noFeeCollected", 
                    "source": "RESULT", 
                    "property": "NO_FEE_COLLECTED", 
                    "type": "INTEGER", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "intakeStatus", 
                    "source": "RESULT", 
                    "property": "INTAKE_STATUS", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "runDate", 
                    "source": "RESULT", 
                    "property": "RUN_DATE", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "dateLoaded", 
                    "source": "RESULT", 
                    "property": "DATE_LOADED", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "stgErrorMessage", 
                    "source": "RESULT", 
                    "property": "STG_ERROR_MESSAGE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }
            ]
        }
    }
};

try {
	try
	{
        //Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 3.0;
       // ELPLogging.debug("Started loading the external scripts");
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_STRINGBUILDER"));
		eval(getScriptText("EMSE_MA_INT_C_EMAIL"));	
		eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));		
		eval(getScriptText("INCLUDES_CUSTOM"));
		eval(getScriptText("EMSE_MA_INT_C_LICENSE_ASWB"));
        var returnException;
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
	
	try
    {
        // POC
        var processedCount = countStagingRecords(new Date(batchAppResultObj.runDate));

		// // Code to update processed count in the Dynamic table
  //       var processedCount = countImportedRecords(new Date(batchAppResultObj.runDate));
        updateDynamicParams(processedCount);
        dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
        var DPS = JSON.stringify(dynamicParamObj);
        aa.env.setValue("dynamicParameters", DPS);
    }
    catch(ex)
    {
        ELPLogging.debug("Error in updating Dynamic table with processed record count " + ex.toString());
    }
	
	//Global variable declaration
	ELPLogging.debug("*******  Start creating global variables  ***************");
	var licenseParameters = {};	
	licenseParameters.servProvCode = dynamicParamObj.serviceProviderCode;
	var licenseData = new LicenseData(dbConn, licenseParameters);
	// Set the environment variables
	aa.env.setValue("BatchJobName", "ELP.ASWB.INTAKE"); 
	var HOUR_SEC = (60 * 60);
	aa.env.setValue("TIMEOUT", HOUR_SEC);
	// Set the timer
    var TIMER = new ELPTimer(HOUR_SEC);
    ELPLogging.debug("Timer Started");
	
	var CONDITION_TYPE = "ELP Interfaces";
	var BAD_ADDRESS_CONDITION = "Invalid Address";
	var BAD_ADDRESS_CONDITION_COMMENT = "The address failed validation : ";

	var INVALID_SSN_CONDITION_DESC = "Invalid SSN";
	var LICENSE_RECORD_RESENT_CONDITION_DESC =  "License record resent by exam vendor";
	var VENDOR = "ASWB";
	var COUNTRY_CODE= "USA"
	var SOURCE_NAME = "BATCHJOB";
	var RUN_DATE = null;
	var expireLicenseExist = false;
	var applicationRecordID = null;
	
	var INDIVIDUAL_CLINICAL_TYPE_CLASS = "LICSW";
	var CERTIFIED_TYPE_CLASS = "LCSW";
	var LICENSED_TYPE_CLASS = "LSW";
	var ASSOCIATE_TYPE_CLASS = "LSWA";
	
	var linkFlag = false;
	
	var fileName = staticParamObj.filePath;
	ELPLogging.debug("fileName = "+fileName);
	
	ELPLogging.debug("***************  Finished creating global variables  ***************");
	
	//Parsing run date
    var runDateMs = Date.parse(batchAppResultObj.runDate);   
	if (runDateMs != null) 
	{
    	RUN_DATE = new Date(runDateMs);    		
	}
	else
	{
		RUN_DATE = new Date();
	}
	
	//System user has been set
	var systemUserObjResult = aa.person.getUser("BATCHUSER");
	var systemUserObj;
	if (systemUserObjResult.getSuccess())
	{
		systemUserObj = systemUserObjResult.getOutput();
	}

	var queryResult = null;
	var dataSetStg = null;
	var typeClass = "";
	
	try
    {
        // POC
        var stagingQueryParameters = {
            "intakeStatus":"EXTRACTED_FILE",
            "tableName": selectQueryObj.selectQuery.table
        };

        var dataSetStg = getStgRecords(stagingQueryParameters);

    	// POC
		// //Query staging table based on intake status as "EXTRACTED_FILE".
		// //IN parameters to the query stored procedure
		// var emseQueryParameters = {"intakeStatus":"EXTRACTED_FILE" };
		// //Querying staging table
		// dataSetStg = queryStgRecord(emseQueryParameters);
	}
	catch(ex if ex instanceof StoredProcedureException)
    {
        returnException = new ELPAccelaEMSEException("Error querying Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
        ELPLogging.fatal(" Fatal Error "+returnException.toString());
        throw returnException;
    }
	
	// Iterate through the records from the list
	while((queryResult = dataSetStg.next()) != null) 
	{
		linkFlag = false;
		TIMER.checkTimeout();
		expireLicenseExist = false;
		ELPLogging.debug("Processing record with first name : " +queryResult.firstName+ " and last name : " +queryResult.lastName);
		try {
			if(queryResult.boardCode != null) {
				typeClass = "";
				if(queryResult.typeClass == "1"){
					typeClass = "LICSW";
				}
				else if(queryResult.typeClass == "2") {
					typeClass = "LCSW";
				}
				else if(queryResult.typeClass == "3") {
					typeClass = "LSW";
				}
				else if(queryResult.typeClass == "4"){
					typeClass = "LSWA";
				}
				
				// Duplicate check for the record.
				if(!duplicateRecordCheck(queryResult))
				{
					ELPLogging.debug("Duplicate check passed.");
					
					var validationArray = evaluateStgRecord(queryResult, typeClass);
					ELPLogging.debug("Is it a valid record : " + validationArray.validationFlag);
					if(validationArray.validationFlag)
					{
						var newLicenseRecord = validationArray.newLicense;
						ELPLogging.debug("For type Class : " + typeClass);
						// Check for any associated "Social Workers" license based on SSN, DOB and subtype. Link Licenses with parent/Child relationship
						if(typeClass == "LCSW")
						{
							var typeClasses = ["LSWA","LSW"];
							ELPLogging.debug("Find Current/Lapsed licenses having same licensed individual based on SSN and DOB for : " + typeClasses);
							for(subType in typeClasses){
								deactivateExistingLicense(queryResult, "Current", typeClasses[subType], typeClass, newLicenseRecord);
								deactivateExistingLicense(queryResult, "Lapsed", typeClasses[subType], typeClass, newLicenseRecord);
							}
						}
						else if(typeClass == "LICSW") {
							var typeClasses = ["LSWA","LSW", "LCSW"];
							ELPLogging.debug("Find Current/Lapsed licenses having same licensed individual based on SSN and DOB for : " + typeClasses);
							for(subType in typeClasses){
								deactivateExistingLicense(queryResult, "Current", typeClasses[subType], typeClass, newLicenseRecord);
								deactivateExistingLicense(queryResult, "Lapsed", typeClasses[subType], typeClass, newLicenseRecord);
							}
						}
						else if(typeClass == "LSW") {
							ELPLogging.debug("Find Current/Lapsed licenses having same licensed individual based on SSN and DOB for : LSWA");
							deactivateExistingLicense(queryResult, "Current", "LSWA", typeClass, newLicenseRecord);
							deactivateExistingLicense(queryResult, "Lapsed", "LSWA", typeClass, newLicenseRecord);
						}
						// Link Licenses with parent/Child relationship
						//checkForAssociatedLicenses(queryResult, newLicenseRecord);

						// Defect 12300
						if (!linkFlag)
						{
							linkLicenserecords(queryResult, typeClass, newLicenseRecord);
						}
						
						ELPLogging.debug("Starts updating ASWB staging table.");
						
						//IN parameters to update stored procedure
						var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
						updateStgRecord(emseUpdateParameters);
						
						ELPLogging.debug("Finished updating ASWB staging table.");
					}
				}
				else
				{
					ELPLogging.debug("Duplicate record found.");
					var recordID = "";
					
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
					{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
					}
					
					//Inserting record in the error table
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Duplicate Record "+queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass+" found.";
					
					updateSWErrorTable(recordID, errorDescription);
					
					//Deleting record from staging table
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
				}
			}
			else {
				ELPLogging.debug("Board code is null.");
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					var recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode == null) && (typeClass != null))
				{
					var recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
				}
				
				var errorDescription = "File Name : "+fileName+" Board code is null.";
				updateSWErrorTable(recordID, errorDescription);
				
				//Deleting record from staging table
				var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
				deleteStgRecord(emseDeleteParameters);
			}
		}
		catch(ex if ex instanceof StoredProcedureException)
		{
			ELPLogging.debug("Stored procedure exception occurred when trying to update record : "+ex.toString());
			var emseErrorUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus": "PROCESSED_EMSE_ERROR" , "stgErrorMessage" : "Error occurred while processing record"};
			//Updating the ASWB staging table
			updateStgRecord(emseErrorUpdateParameters);
		}
		catch(ex)
		{
			// Update the stgErrorMessage field if there is any exception while updating the staging table
			// IN parameters to the Update stored procedure
			ELPLogging.debug("Error while Updating the data to ASWB staging table: " +ex.toString());
			
			var emseErrorUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus": "PROCESSED_EMSE_ERROR" , "stgErrorMessage" : "Error occurred while processing record"};
			//Updating the ASWB staging table
			updateStgRecord(emseErrorUpdateParameters);
		}
	}
	
	//Triggering mail for erroneous record.
	emailErrorReport(dbConn, stagingConfigObj, RUN_DATE);
}
catch(ex if ex instanceof ELPAccelaEMSEException)
{
	//ELPLogging.debug(ex.message);
    ELPLogging.fatal(ex.toString());
    aa.env.setValue("EMSEReturnCode", ex.getReturnCode()); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_ASWB_INTAKE aborted with " + ex.toString());
}
catch(ex)
{
    ELPLogging.fatal(ex.message);
    aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_ASWB_INTAKE  aborted with " + ex.message);
}
finally
{
    if (!ELPLogging.isFatal()) 
	{    // if fatal then return code already filled in
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
        aa.env.setValue("ScriptReturnCode","0");
        if (ELPLogging.getErrorCount() > 0) 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_ASWB_INTAKE completed with " + ELPLogging.getErrorCount() + " errors.");                    
        }
		else 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_ASWB_INTAKE completed with no errors.");            
        }
    }
    
	if (dbConn)
	{
		dbConn.close();
	}
	
	if (dataSetStg != null) 
	{
    	dataSetStg.close();
    }
    aa.env.setValue("logFile", ELPLogging.toJSON());
    //aa.env.setValue("batchApplicationResult", JSON.stringify(batchAppResultObj));
}

/**
* @desc This method is processing staging record based on board code. 
* Perform Application record validation [SSN, Phone number, address, license number]
* If validation is successful then create Application record,
* license record, reference license record, license professional in the Accela system. 
* Validation will performed for required fields and license number and license expiration
* date. If validation is successful then it will create license record, reference license
* record, license	professional in the Accela system. Add the application record into 
* the monthly payment set. When validation fails, record will be inserted into error 
* table and email will be triggered for any erroneous record. 
* @param queryResult
* @return {validationFlag} boolean value
*/
function evaluateStgRecord(queryResult, typeClass) {
	ELPLogging.debug("Evaluating staging record for board code : " +queryResult.boardCode);
	
	var validationArray = new Array();
	validationArray.validationFlag = true;
	validationArray.newLicense;
	
	if(validateReqdFields(queryResult)) {
		ELPLogging.debug("Required field validation is successful for row number : " +queryResult.rowNumber);

		//Combination of board code and type class to retrieve application configuration information from
		//"INTERFACE_CAP_TYPE" standard choice
		var boardTypeClass = queryResult.boardCode+ "-" +typeClass;
		ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
		
		var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
		ELPLogging.debug("License configuration information : " +appConfigInfo);
		
		//Separating group, type, sub type and category from License/Social Workers/*/* 
		var scanner = new Scanner(appConfigInfo, "/");
		var group = scanner.next();
		var type = scanner.next();
		var subType = scanner.next();
		var category = scanner.next();
		
		// Creating key value to load the masking, sequence number and expiration code information from view (ELP_VW_LICENSE_CONFIG_DPL)
		/* var capTypeAlias = type + " " + subType; */
	
		//Performing validation for SSN
		var SSNValidationArray = validateSSN(queryResult.socSecNumber);
		ELPLogging.debug("SSN validation flag = " +SSNValidationArray.validationFlag);
		
		//Address validation 
		var contactAddressDetailsArray = new Array();
		var contactAddressDetailsArrayTMP=new Array();

		if((queryResult.zipCodeB != null) && (queryResult.zipCodeB != '0' && queryResult.zipCodeB != '00' && queryResult.zipCodeB != '000' && queryResult.zipCodeB != '0000') )
		{
			var zip = queryResult.zipCodeA+"-"+queryResult.zipCodeB;
		}
		else
		{
			var zip = queryResult.zipCodeA;
		}
		
		var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("ASWB ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
		if(isEnabledAddressValidation.toLowerCase()=='true')
		{
			ELPLogging.debug("Start Address Validation");
            contactAddressDetailsArrayTMP =validateAddress(queryResult.addressLine1, queryResult.addressLine2, queryResult.city, queryResult.state, zip, "", COUNTRY_CODE, queryResult.serviceProvoiderCode, SOURCE_NAME);
			
			if (contactAddressDetailsArrayTMP)
			{
				contactAddressDetailsArray = contactAddressDetailsArrayTMP;
				contactAddressDetailsArray.validAddress = true;
			}
			
		}else{
			ELPLogging.debug("Skipped Address validation for Applicant address");
		    contactAddressDetailsArray["addressLine1"] = queryResult.addressLine1;
			contactAddressDetailsArray["addressLine2"] = queryResult.addressLine2;
			contactAddressDetailsArray["city"] = queryResult.city;
			contactAddressDetailsArray["state"] = queryResult.state;
			contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeA
			contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeB;
			contactAddressDetailsArray.validAddress = true;
		}
		
		if(!contactAddressDetailsArrayTMP && isEnabledAddressValidation.toLowerCase()=='true')
		{
			ELPLogging.debug("Invalid Address---");
			
			 contactAddressDetailsArray["addressLine1"] = queryResult.addressLine1;
			 contactAddressDetailsArray["addressLine2"] = queryResult.addressLine2;
			 contactAddressDetailsArray["city"] = queryResult.city;
			 contactAddressDetailsArray["state"] = queryResult.state;
			 contactAddressDetailsArray["zipCodeA"] = queryResult.zipCodeA
			 contactAddressDetailsArray["zipCodeB"] = queryResult.zipCodeB;
			 contactAddressDetailsArray.validAddress = false;
		}
		
		//validation check for address, SSN and phone number
		if(SSNValidationArray.validationFlag == true)
		{	
			ELPLogging.debug("Validation passed for SSN. ");
		
			// Error in the error table in case of an invalid address
			if(contactAddressDetailsArray == null)
			{
				ELPLogging.debug("Invalid Address.");
				//Add to Error Log
				var recordID;
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid Phone Number : "+queryResult.primaryPhone + " | Invalid Address : " + contactAddressDetailsArray;
				
				updateErrorTable(recordID, errorDescription);
			}
			
			//Performing validation for license number
			var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo, typeClass);
			ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
			
			//Validation check for license number
			if(licenseValidationArray.validationResult == true)
			{
				ELPLogging.debug("All validations are successful for SW board. Proeed to create the application record.");
				
				//Creating Application record
				var capId = createApplicationRecord(queryResult, "License", "Social Workers", "Social Workers", "Application", contactAddressDetailsArray);
				applicationRecordID = capId;
				ELPLogging.debug("Application record # " +capId+ " has been created successfully ");
				
						if(!contactAddressDetailsArray.validAddress)
						{
							var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
							addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,capId,CONDITION_TYPE,addressconditionComment); 	
						}

				//Record exam information on Application record
				setExamDetailsForSWBoard(capId, typeClass);
				
				
			
				/*****   Updating ASI values on the Application record starts   *****/
				updateASIandASITForAppRecord(queryResult, capId);
				/*****   Updating ASI values on the Application record Ends   *****/
			
					//Add fee on Application record
				feeOnSWApplicationRecord(capId, typeClass);
			
			
				//Updating EXAM VENDOR CASH INFO ASIT on Application record
				if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
				{
					updateExamVendorCashInfo(capId);
				}
				
				//Creating and adding Application record to monthly payment set
				createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
				
				// Set the conditions of approval as met  #Defect 10030 
				var capIDModel = aa.cap.getCapID(capId.getID1(),capId.getID2(),capId.getID3()).getOutput();
				//var capIDModel = aa.cap.getCapID("16CAP","00000","002UY").getOutput();
				ELPLogging.debug("------capIDModel : "+capIDModel);
				setConditionMet("Passport Type Photograph", capIDModel);
				setConditionMet("Verification of Background Questions", capIDModel);
				setConditionMet("Verification of CORI",capIDModel);
				setConditionMet("Verification of Disciplinary History",capIDModel);

				
				// Set the application workflow task status to "Exam/Passed - Under Review"
				updateTaskStatus("Exam", "Passed - Under Review", "", "", "", capId);
				
				//Add condition on reference contact for invalid SSN for regular expression
				ELPLogging.debug("Condition on reference contact for SSN flag : " +SSNValidationArray.conditionFlag);
				
				// Add a condition in case of an invalid SSN.
				if(SSNValidationArray.conditionFlag == true) 
				{
					ELPLogging.debug("Add condition on reference contact for invalid SSN.");
					var conditionComment = "First Name : " +queryResult.firstName+ ", Last Name : " + queryResult.lastName;
					//add condition on reference contact
					addContactStdConditionOnRefContact(CONDITION_TYPE, INVALID_SSN_CONDITION_DESC, conditionComment, capId);
					
					//Log entry to error table for invalid SSN							
					var recordID;
					
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
					{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
					}
					
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid SSN number.";
					
					//Log entry to error table for invalid SSN
					updateSWErrorTable(recordID, errorDescription);
				}
				
				//Start creation of the license record. Check if license record already exists in Accela system
				if(licenseData.checkLicenseNumber(queryResult, capId, typeClass))
				{
					//Creating license record for Application record
					ELPLogging.debug("Creating license record for Application # " +capId);
					var newLicID = licenseData.issueLicense(capId, queryResult, typeClass); 
					ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
					
					
						if(!contactAddressDetailsArray.validAddress)
						{
							var addressconditionComment = " with adressline1: " + queryResult.addressLine1 + ", addressLine2:" + queryResult.addressLine2 + ", city : " + queryResult.city + ", state: " + queryResult.state + ", zipCodeA : " + queryResult.zipCodeA;
							addInvalidAddressConditionsToLicenseAndRecord(contactAddressDetailsArray,queryResult,newLicID,CONDITION_TYPE,addressconditionComment); 	
						}

					deactivateExistingLicense(queryResult, "Expired", typeClass, typeClass, newLicID);
										
					/*****   Updating ASI values on the Application record starts   *****/
					updateASIandASITOnLicRecord(queryResult, newLicID, typeClass);
					/*****   Updating ASI values on the Application record Ends   *****/
					
					//Add a condition - License record resent by exam vendor on ref license for input license
					//number is less than the next sequence number	
					ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
					if(licenseValidationArray.resendFlag == true)
					{
						ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
						addResendConditionOnLicenseRecord(newLicID, typeClass);
					}
					ELPLogging.debug("Setting the new license value");
					validationArray.newLicense = newLicID;
				}
				else
				{
					ELPLogging.debug("License record is already exists in Accela system.");						
					var recordID;
					
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
					{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
					}
					
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+typeClass +" is already exists in Accela system.";
					
					updateSWErrorTable(recordID, errorDescription);
					
					//Delete record from staging table
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
				}
				
			}
			else if (licenseValidationArray.validationResult == false) 
			{
				ELPLogging.debug("Validation for license number failed."); 
				validationArray.validationFlag = false;
				var recordID;
				
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
				recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
				{
				recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
				}
				
				var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
				
				//Insert record in error table
				updateSWErrorTable(recordID, errorDescription); 
				//Delete record from staging table
				var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
				deleteStgRecord(emseDeleteParameters);
			}
		}
		else
		{
			//insert record into error log and delete it from staging table
			ELPLogging.debug("Validation for SSN failed.");
			validationArray.validationFlag = false;
			var recordID;
			
			if((queryResult.firstName != null) && (queryResult.lastName != null))
			{
				recordID = queryResult.firstName+ " " +queryResult.lastName;
			}
			else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
			{
				recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
			}
			
			var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | SSN contains alpha characters validation failed.";
			
			//Insert record in error table
			updateSWErrorTable(recordID, errorDescription);
			
			//Delete record from staging table
			var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
			deleteStgRecord(emseDeleteParameters);
		}
	}
	else
	{
		//Insert record into error log and delete it from staging table
		ELPLogging.debug("Missing required fields.");
		validationArray.validationFlag = false;
		var recordID;
		
		if((queryResult.firstName != null) && (queryResult.lastName != null))
		{
			recordID = queryResult.firstName+ " " +queryResult.lastName;
		}
		else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
		{
			recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
		}

		//var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | ASWB record missing required fields - boardCode : "+queryResult.boardCode+", licenseNumber : "+queryResult.licenseNumber+", typeClass : "+queryResult.typeClass+", socSecNumber : "+queryResult.socSecNumber+", firstName : "+queryResult.firstName+", lastName : "+queryResult.lastName+", cashNumber : "+queryResult.cashNumber+", cashDate : "+queryResult.cashDate+", licIssueDate : "+queryResult.licIssueDate+", licExpiryDate : "+queryResult.licExpiryDate+", addressLine1 : "+queryResult.addressLine1+", city : "+queryResult.city+", state : "+queryResult.state+", zipCodeA : "+queryResult.zipCodeA+", dateOfBirth : "+queryResult.dateOfBirth+", examDate : "+queryResult.examDate+", writtenScore1 : "+queryResult.writtenScore1; 
		var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | ASWB record missing required fields - boardCode : "+queryResult.boardCode+", licenseNumber : "+queryResult.licenseNumber+", typeClass : "+queryResult.typeClass+", socSecNumber : "+queryResult.socSecNumber+", firstName : "+queryResult.firstName+", lastName : "+queryResult.lastName+", cashNumber : "+queryResult.cashNumber+", cashDate : "+queryResult.cashDate+", licIssueDate : "+queryResult.licIssueDate+", addressLine1 : "+queryResult.addressLine1+", city : "+queryResult.city+", state : "+queryResult.state+", zipCodeA : "+queryResult.zipCodeA+", dateOfBirth : "+queryResult.dateOfBirth+", writtenScore1 : "+queryResult.writtenScore1; 
		// Defect 10009 error message code added
		
		/*var errorDescription = "";	
		if(queryResult.boardCode==null || queryResult.boardCode == "")
		{
			errorDescription = errorDescription+"Board Code :"+queryResult.boardCode+" ,";
		}if(queryResult.licenseNumber==null || queryResult.licenseNumber == "")
		{ 
			errorDescription = errorDescription+"licenseNumber : "+queryResult.licenseNumber+" ,";
		}if(queryResult.typeClass==null || queryResult.typeClass == "")
		{
			errorDescription = errorDescription+"typeClass :"+queryResult.typeClass+" ,";
		}if(queryResult.socSecNumber==null || queryResult.socSecNumber == "")
		{
			errorDescription = errorDescription+"socSecNumber :"+queryResult.socSecNumber+" ,";
		}if(queryResult.firstName==null || queryResult.firstName == "")
		{
			errorDescription = errorDescription+"firstName :"+queryResult.firstName+" ,";
		}if(queryResult.lastName==null || queryResult.lastName == "")
		{
			errorDescription = errorDescription+"lastName :"+queryResult.lastName+" ,";
		}if(queryResult.cashNumber==null || queryResult.cashNumber == "")
		{
			errorDescription = errorDescription+"cashNumber :"+queryResult.cashNumber+" ,";
		}if(queryResult.cashDate==null || queryResult.cashDate == "")
		{
			errorDescription = errorDescription+"cashDate :"+queryResult.cashDate+" ,";
		}if(queryResult.licIssueDate==null || queryResult.licIssueDate == "")
		{
			errorDescription = errorDescription+"licIssueDate :"+queryResult.licIssueDate+" ,";
		}if(queryResult.addressLine1==null || queryResult.addressLine1 == "")
		{
			errorDescription = errorDescription+"addressLine1 :"+queryResult.addressLine1+" ,";
		}if(queryResult.city==null || queryResult.city == "")
		{
			errorDescription = errorDescription+"city :"+queryResult.city+" ,";
		}if(queryResult.state==null || queryResult.state == "")
		{
			errorDescription = errorDescription+"state :"+queryResult.state+" ,";
		}if(queryResult.zipCodeA==null || queryResult.zipCodeA == "")
		{
			errorDescription = errorDescription+"zipCodeA :"+queryResult.zipCodeA+" ,";
		}if(queryResult.dateOfBirth==null || queryResult.dateOfBirth == "")
		{
			errorDescription = errorDescription+"dateOfBirth :"+queryResult.dateOfBirth+" ,";
		}if(queryResult.examDate==null || queryResult.examDate == " ")
		{
			errorDescription = errorDescription+"examDate :"+queryResult.examDate+" ,";
		}if(queryResult.writtenScore1==null || queryResult.writtenScore1 == "")
		{
			errorDescription = errorDescription+"writtenScore1 :"+queryResult.writtenScore1+" ,";
		}
		*/
		//Insert record in error table
		updateSWErrorTable(recordID, errorDescription);
		
		var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "stgErrorMessage" : errorDescription}
		updateStgRecord(emseUpdateParameters);
	
		/* //Delete record from the staging table
		var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
		deleteStgRecord(emseDeleteParameters); */
	}
	ELPLogging.debug("Returning value : " + validationArray.validationFlag + ", with newly created license : "+validationArray.newLicense);
	return validationArray;
}

/**
 * @desc This method is performing validation for required fields.
 * @param {queryResult} contains query result from staging table.
 * @returns {boolean} - boolean value
 */
function validateReqdFields(queryResult) 
{
	ELPLogging.debug("Performing validations for required fields.");
	
	if (queryResult.boardCode == null ||
		queryResult.boardCode.trim().length == 0 ||
		queryResult.licenseNumber == null || 
		queryResult.licenseNumber.toString().trim().length == 0 ||
		queryResult.typeClass == null || 
		queryResult.typeClass.trim().length == 0 ||
		queryResult.socSecNumber == null ||
		queryResult.socSecNumber.toString().trim().length != 9 ||	
		queryResult.firstName == null ||
		queryResult.firstName.trim().length == 0 ||
		queryResult.lastName == null ||
		queryResult.lastName.trim().length == 0 ||
		queryResult.cashNumber == null ||
		queryResult.cashNumber.toString().trim().length != 6 ||
		queryResult.cashDate == null ||
		queryResult.cashDate.trim().length != 6 ||
		queryResult.addressLine1 == null ||
		queryResult.addressLine1.trim().length == 0 ||
		queryResult.city == null ||
		queryResult.city.trim().length == 0 ||
		queryResult.state == null ||
		queryResult.state.trim().length == 0 ||
		queryResult.zipCodeA == null ||
		queryResult.zipCodeA.toString().trim().length == 0 ||
		queryResult.dateOfBirth == null ||
		queryResult.dateOfBirth.trim().length != 6 || 
		queryResult.writtenScore1 == null ||
		queryResult.writtenScore1.length == 0) 		/* Do not use trim on Numberic values */
	{
		return false;
	} 
	else
	{
		return true;
	}
}

/**
 * @desc This method will check duplicate records. If any duplicate record found it will delete that record from staging table.
 * @param queryResult
 */
function duplicateRecordCheck(queryResult)
{
	ELPLogging.debug("Duplicate record check for row number # "+queryResult.rowNumber);
	var duplicateFlag = false;
	
	//IN parameters to duplicate record check procedure
	var emseDupCheckParameters = {"licenseNumber":queryResult.licenseNumber , "boardCode":queryResult.boardCode, "typeClass":queryResult.typeClass};
	
	var duplicateCheckResult = callToStoredProcedure(emseDupCheckParameters, "duplicateRecordCheck");
	duplicateFlag = duplicateCheckResult.duplicateFlag;
	ELPLogging.debug("Duplicate record flag = "+duplicateFlag);
	
	return duplicateFlag;
}

/**
 * @desc This method logs an error in the error table "ELP_TBL_ERROR_STG_MA" in case of an invalid record.
 * @param {recordID} recordID - contains the first name and last name.
 * @param {errorDescription} errorDescription - contains the errorDescription.
 * @throws ELPAccelaEMSEException
 */
function updateSWErrorTable(recordID, errorDescription)
{
	ELPLogging.debug("Updating Error table : " +recordID+ " in ELP_TBL_ERROR_STG_MA table.");
	
	//Error table update parameters
	var errorTableUpdateParameters = {"BatchInterfaceName": "ELP.ASWB.INTAKE", "RecordID" : recordID, "ErrorDescription": errorDescription, "runDate": RUN_DATE};
	
	//Calling ELP_SP_ERROR_INT_INSERT SP to insert data into error table
	callToStoredProcedure(errorTableUpdateParameters, "errorTableInsert");
}

/** 
 * @desc This method creates the DB connection and execute the supplemental stored procedure
 * @param {emseInsertParameters} emseInsertParameters - Input parameters
 * @param {supplementalTag} supplementalTag - Stored procedure name. 
 */
function callToStoredProcedure(emseInsertParameters, supplementalTag)
{
    for (var stgObjIterator = 0; stgObjIterator < stagingConfigObj.supplemental.length; stgObjIterator ++ )
    {
        var supplementalConfiguration = stagingConfigObj.supplemental[stgObjIterator];

        if (supplementalConfiguration.tag == supplementalTag)
        {
            var record = new StoredProcedure(supplementalConfiguration.procedure, dbConn);
            break;
        }
    }

    if (record == null)
    {
        var message = "Cannot find procedure";
        var exception = new Error(message);
        throw exception;
    }
    
    var staticParameters ={};
    var dynamicParameters ={};
    var batchApplicationResult ={};
    
    record.spCall = "{ CALL " + record.procedure.name + " ";
    
    // add the parameter place holders
    // there is always an out parameter first for the update count
    if ((record.procedure.parameters != null) && 
         record.procedure.parameters.list.length > 0)
    {
        var placeHolders = "";

        var parameters = record.procedure.parameters.list;

        for (i = 0; i < parameters.length; i++)
        {
            if (placeHolders.length == 0)
            {
                placeHolders =  placeHolders + "(?";
            }
        else
        {
            placeHolders = placeHolders + ", ?";
        }
    }
    
    placeHolders += ") ";
    
    record.spCall += placeHolders;
    }
    else
    {
        var placeHolders = "";
        placeHolders =  placeHolders + "(?";     // count out parameter
        placeHolders += ") ";
        record.spCall += placeHolders;                
    }

    record.spCall += "}";
	
	ELPLogging.debug("record.spCall -- " + record.spCall);
    record.statement = record.dbConnection.prepareCall(record.spCall);

    var inputParameters = record.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
    record.copyEMSEParameters(emseInsertParameters, inputParameters);

    record.setParameters(inputParameters);
    var queryResult = record.executeProcedure();

    record.close();
	
	return queryResult;
}

/**
 * @desc This method retrieve exam information and based on written score1 and 2, it will create Exam record for
 * the Application record.
 * @param {capId} Cap ID - contains record ID.
 */
function setExamDetailsForSWBoard(capId, typeClass)
{
	ELPLogging.debug("Retrieving Exam information for Application record : " +capId);
	var examType = null;
	var writtenScore = null;
	ELPLogging.debug("Written Score1 : "+queryResult.writtenScore1 + "typeClass : " + typeClass);
	//Written score 1 is for National exam
	if(queryResult.writtenScore1 != null)
	{	
		writtenScore = queryResult.writtenScore1;
		//Retrieve exam name
		var examName = "";
		if(typeClass == "LICSW") {
			examName = "Clinical Exam";
		}
		else if(typeClass == "LCSW") {
			examName = "Masters Level Exam";
		}
		else if(typeClass == "LSW"){
			examName = "Bachelors Level Exam";
		}
		else if(typeClass == "LSWA") {
			examName = "Associates Level Exam";
		}
		ELPLogging.debug("Exam Name : " +examName);
		//Create exam record
		createExamRecord(queryResult, capId, examName, writtenScore);
	}
}

/**
 * This method will create Application record for RE board in Accela system.
 * @param {group} contains group name of the record.
 * @param {type} contains type of the record.
 * @param {subType} contains sub type of the record.
 * @param {category} contains category of the record.
 * @param {queryResult} contains query result from staging table.
 * @param {contactAddressDetailsArray} contains validated contact address details.
 * @return {capIDModel} contains record ID.
 */
function createApplicationRecord(queryResult, group, type, subType, category, contactAddressDetailsArray) 
{
	ELPLogging.debug("Creating Application record.");
	
	//Creating Application record in the Accela system
	var capIDModel = createCAP(group, type, subType, category);
	ELPLogging.debug("Finished creating record with CAP ID: "+capIDModel);
	
	updateCustomID(capIDModel);
	
	createCapContactForRecord(capIDModel, queryResult, contactAddressDetailsArray);
	ELPLogging.debug("Successfully cap contact created ");
	
	//set the channel reported field to Interface
	var capDetailScriptModel = aa.cap.getCapDetail(capIDModel).getOutput();
	var capDetailModel = capDetailScriptModel.getCapDetailModel();
	capDetailModel.setReportedChannel("Interface");
	capDetailModel.setShortNotes(queryResult.boardCode);
	
	var editCapDetailResult = aa.cap.editCapDetail(capDetailModel);

	if(!editCapDetailResult.getSuccess())
	{
	    ELPLogging.debug("Error updating Channel Reported for "+capDetailModel+": "+editCapDetailResult.getErrorMessage());
	}
	ELPLogging.debug("Successfully updated Channel Reported  for record ID : " +capIDModel);
	
	return capIDModel;
}

/**
 * @desc This method update ASI and ASIT [Military Status , School Graduated, School Location, Course Completion Date, Cash Date, Cash Number,  Fee Type, Fee Amount  ] on RE board Application record.
 * @param {capIDModel} capID Model - contains record ID.
 */
function updateASIandASITForAppRecord(queryResult, capIDModel)
{
	ELPLogging.debug("Updating ASI and ASIT on Application record : "+capIDModel);
	//Local variable declaration
	var noFeeCollected;
	var feeAmount = null;
			
	if (queryResult.noFeeCollected == "1" || queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "4") 
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A"
	}
	ELPLogging.debug("No Fee Collected : " +noFeeCollected);
	
	var applyingFor = "";
	if(queryResult.typeClass == "1"){
		applyingFor = "Licensed Independent Clinical Social Worker (LICSW)";
	}
	else if(queryResult.typeClass == "2") {
		applyingFor = "Licensed Certified Social Worker (LCSW)";
	}
	else if(queryResult.typeClass == "3") {
		applyingFor = "Licensed Social Worker (LSW)";
	}
	else if(queryResult.typeClass == "4"){
		applyingFor = "Licensed Social Work Associate (LSWA)";
	}
	
	// Set the Exam name for the type of license issued.
	var examName = "";
	if(typeClass == "LICSW") {
		examName = "Clinical Exam";
	}
	else if(typeClass == "LCSW") {
		examName = "Masters Level Exam";
	}
	else if(typeClass == "LSW"){
		examName = "Bachelors Level Exam";
	}
	else if(typeClass == "LSWA") {
		examName = "Associates Level Exam";
	}
	
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);		
	updateASIValues(capIDModel, "APPLICATION", "Applying For", applyingFor);
     //Defect#12023 fixed
     //updateASIValues(capIDModel, "APPLICATION", "Application Type", "New Applicant");
	
	if (queryResult.reciprocity != null && queryResult.reciprocity != undefined && queryResult.reciprocity != "")
	{
		updateASIValues(capIDModel, "APPLICATION", "Application Type", "Reciprocity Applicant");
	}else{
	updateASIValues(capIDModel, "APPLICATION", "Application Type", "New Applicant");
	}

	updateASIValues(capIDModel, "APPLICATION", "Existing License Number", "");		
	updateASIValues(capIDModel, "SPECIAL ACCOMODATIONS", "Special Accomodations required?", "");	// Not mentioned in interface design
	updateASIValues(capIDModel, "SPECIAL ACCOMODATIONS", "ESL Accomodations Approved?", "");		// Not mentioned in interface design
	updateASIValues(capIDModel, "CURRENT EMPLOYMENT", "Business Name", "");							// Not mentioned in interface design
	updateASIValues(capIDModel, "CURRENT EMPLOYMENT", "Current Position", "");						// Not mentioned in interface design
	updateASIValues(capIDModel, "CURRENT EMPLOYMENT", "Date Started", "");							// Not mentioned in interface design
	updateASIValues(capIDModel, "CURRENT EMPLOYMENT", "Business Address", "");						// Not mentioned in interface design
	
	// Update the ASIT values on the application record
	
	// EDUCATION
	var tableValuesArray = {};
	tableValuesArray["Degree"] ="";
	tableValuesArray["Graduation Date"] = String(queryResult.gradYr);
	tableValuesArray["Major"] = "";
	tableValuesArray["College Name"] =String(queryResult.schoolGraduated);
	tableValuesArray["State"] = "";
	ELPLogging.debug("Updating EDUCATION ASIT for record ID = "+capIDModel);
	addASITValueToRecord("EDUCATION", tableValuesArray, capIDModel); 
	
	
	//LICENSE IN OTHER JURISDICTIONS
	var tableValuesArray = new Array();
	tableValuesArray["License Type"] = "";
	tableValuesArray["License Number"] = "";
	if (queryResult.reciprocity != null)
	{
		tableValuesArray["License Jurisdiction"] = String(queryResult.reciprocity);
	}
	else
	{
		tableValuesArray["License Jurisdiction"] = "";
	}
	tableValuesArray["Issue Date"] = "";
	tableValuesArray["Status"] = "";
	tableValuesArray["Basis for License"] = "";
	addASITValueToRecord("LICENSE IN OTHER JURISDICTIONS", tableValuesArray, capIDModel);
	
	//SUPERVISOR/REFERENCE CONTACT
	var tableValuesArray = new Array();
	tableValuesArray["Name"] = "";
	tableValuesArray["Reference Type"] = "";
	tableValuesArray["Address"] = "";
	tableValuesArray["City"] = "";
	tableValuesArray["State/Province"] = "";
	tableValuesArray["Zip/Postal Code"] = "";
	tableValuesArray["Daytime Phone"] = "";
	tableValuesArray["Email"] = "";
	addASITValueToRecord("SUPERVISOR/REFERENCE CONTACT", tableValuesArray, capIDModel);   

	// Exam Tab
	var tableValuesArray = new Array();
	tableValuesArray["Examination Name"] = examName;
	tableValuesArray["Provider Name"] = "ASWB";
	tableValuesArray["Examination Date"] = queryResult.examDate;
	tableValuesArray["Passing Score"] = queryResult.writtenScore1;
	tableValuesArray["Final Score"] = queryResult.writtenScore1;
	addASITValueToRecord("EXAM TAB", tableValuesArray, capIDModel);
}

/**
 * @desc This method creates a cap contact for the record.
 * @param {capIdModel} capIDModel - contains the record ID from Accela system.
 * @param {queryResult} contains query result from staging table.
 * @param {contactAddressDetailsArray} contains contact address details array.
 * @throws ELPAccelaEMSEException
 */
function createCapContactForRecord(capIDModel, queryResult, contactAddressDetailsArray)
 {
	ELPLogging.debug("Creating cap contact for record ID : " +capIDModel);
	//Local variable declaration
	var contactType = "Applicant";
	
	var capContactModel = new com.accela.aa.aamain.people.CapContactModel(); 
	var peopleScriptModelResult = aa.people.createPeopleModel();
	var peopleScriptModel = peopleScriptModelResult.getOutput();
	
	if (peopleScriptModel)
	{
		//create PeopleModel and populate
        var peopleModel = peopleScriptModel.getPeopleModel();
        peopleModel.setContactType(contactType);
        peopleModel.setFlag("Y");
        peopleModel.setFirstName(queryResult.firstName);
        peopleModel.setMiddleName(queryResult.middleInit);
        peopleModel.setLastName(queryResult.lastName);
		var ssn = formatSSN((queryResult.socSecNumber).toString());
		peopleModel.setSocialSecurityNumber(ssn);
		peopleModel.setServiceProviderCode(queryResult.serviceProviderCode);
        peopleModel.setBusinessName(queryResult.businessName);
        peopleModel.setAuditStatus("A");
		peopleModel.setPreferredChannel(2); // Preferred channel is default to Postal mail.
        peopleModel.setStartDate(new java.util.Date());
        peopleModel.setAuditID("BATCHUSER");
        capContactModel.setPeople(peopleModel);
       
		capContactModel.setBirthDate(formatBirthDate(queryResult.dateOfBirth));
        capContactModel.setCapID(capIDModel);
		
		//Creating cap contact
		var createContactResult = aa.people.createCapContact(capContactModel);
		if(!createContactResult.getSuccess())
		{
			var returnException = new ELPAccelaEMSEException("Error creating the Complainant for record "+capIDModel+": "+createContactResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
		}
		
		var contactSeqNumber = getContactSeqNumber(capIDModel);
		ELPLogging.debug("contact sequence number = " +contactSeqNumber);
		
		//create the contact address
		createContactAddress(capIDModel, contactSeqNumber, contactAddressDetailsArray);
		ELPLogging.debug("Successfully created contact address for record ID : " +capIDModel);
		
		ELPLogging.debug("*********  Creating reference contact from transaction contact starts  *********");
		
		//Creating reference contacts from cap contact and link it to the record
		var refSeqNumber = createRefContactsFromCapContactsAndLinkForExam(capIDModel, null, null, false, false, peopleDuplicateCheck);
		ELPLogging.debug("refSeqNumber : " +refSeqNumber);	
		setContactsSyncFlag("N");
		
		//Update maiden name
		updateMaidenName(refSeqNumber, capIDModel);
	}
	else
	{
		var returnException = new ELPAccelaEMSEException("Error creating a people model for "+capIDModel+": "+peopleScriptModelResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/** 
 * @desc This method add standard condition on reference contact. 
 * @param {conditionType} contains condition type
 * @param {conditionDesc} contains condition description
 * @param {capID} contains the record ID
 * @throws N/A
 */ 
function addContactStdConditionOnRefContact(conditionType, conditionDesc, comment, capId) 
{
	ELPLogging.debug("Add condition on reference contact.");
	var addContactConditionResult = null;
	var foundCondition = false;
	var javascriptDate = new Date()
	var javautilDate = aa.date.transToJavaUtilDate(javascriptDate.getTime());
	cStatus = "Applied";

	if (arguments.length > 3)
	cStatus = arguments[3]; // use condition status in args
	
	if (!aa.capCondition.getStandardConditions) 
	{
		ELPLogging.debug("addAddressStdCondition function is not available in this version of Accela Automation.");
	}
	else
	{
		standardConditions = aa.capCondition.getStandardConditions(conditionType, conditionDesc).getOutput();

		for (index = 0; index < standardConditions.length; index++)
		{
		  if (standardConditions[index].getConditionType().toUpperCase() == conditionType.toUpperCase() 
				&& standardConditions[index].getConditionDesc().toUpperCase() == conditionDesc.toUpperCase())
		  {
			standardCondition = standardConditions[index]; // add the last one found
			ELPLogging.debug("cComment = " +standardCondition.getConditionComment());
			foundCondition = true;
			
			  var capContactResult = aa.people.getCapContactByCapID(capId);
			  if (capContactResult.getSuccess()) 
			  {
				var Contacts = capContactResult.getOutput();
				for (var contactIdx in Contacts)
				{
				  var refContactNumber = Contacts[contactIdx].getCapContactModel().refContactNumber;
				  if (refContactNumber)
				  {
					var conditionComment = standardCondition.getConditionComment() + " with License# : " + refContactNumber + ", "+ comment;
					var newCondition = aa.commonCondition.getNewCommonConditionModel().getOutput();
					newCondition.setServiceProviderCode(aa.getServiceProviderCode());
					newCondition.setEntityType("CONTACT");
					newCondition.setEntityID(refContactNumber);
					newCondition.setConditionDescription(standardCondition.getConditionDesc());
					newCondition.setConditionGroup(standardCondition.getConditionGroup());
					newCondition.setConditionType(standardCondition.getConditionType());
					newCondition.setConditionComment(conditionComment);
					newCondition.setImpactCode(standardCondition.getImpactCode());
					newCondition.setConditionStatus(cStatus)
					newCondition.setAuditStatus("A");
					newCondition.setIssuedByUser(systemUserObj);
					newCondition.setIssuedDate(javautilDate);
					newCondition.setEffectDate(javautilDate);
					newCondition.setAuditID(currentUserID);

					var addContactConditionResult = aa.commonCondition.addCommonCondition(newCondition);
					if (addContactConditionResult.getSuccess())
					{
					  ELPLogging.debug("Successfully added reference contact (" + refContactNumber + ") condition: " + conditionDesc);
					}
					else 
					{
					  ELPLogging.debug("**ERROR: adding reference contact (" + refContactNumber + ") condition: " + addContactConditionResult.getErrorMessage());
					}
				  }
				  else
				  {
					ELPLogging.debug("No contact sequence number associated with the record.");
				  }
				}
			  }
		  }
		}
	}
	
	if (!foundCondition)
	{
		ELPLogging.debug("**WARNING: couldn't find standard condition for " + conditionType + " / " + conditionDesc);
	}
  return addContactConditionResult;
}

/**
 * @desc This method create exam record.
 * @param {capId} Cap ID - contains record ID.
 * @param {queryResult} queryResult - contains queryResult from staging table.
 * @param {examName} exam name - contains exam name.
 * @param {writtenScore} written Score - contains written score.
 */
function createExamRecord(queryResult, capId, examName, writtenScore)
{
	ELPLogging.debug("Creating exam record of board = " +queryResult.boardCode + " for Application : " +capId);
	//Local variable declaration
	var providerName = "ASWB";
	
	//Retrieve provider name
	var providerNumber = getProviderNumber(examName, providerName);
	ELPLogging.debug("Provider Number : " +providerNumber);
	
	var newExamScriptModel = aa.examination.getExaminationModel().getOutput();
    newExamScriptModel.setServiceProviderCode(queryResult.serviceProviderCode);
    newExamScriptModel.setRequiredFlag("Y");

    var examModel =  newExamScriptModel.getExaminationModel();

    // Create Exam model for new record.
    examModel.setB1PerId1(capId.getID1());
    examModel.setB1PerId2(capId.getID2());
    examModel.setB1PerId3(capId.getID3());
    examModel.setExamName(examName);	
    examModel.setProviderNo(providerNumber);	
    examModel.setProviderName(providerName);					
    newExamScriptModel.setAuditStatus("A");
	
	//Assume that only passing scores are available via the intake file
    examModel.setExamStatus("PCOMPLETED");
	ELPLogging.debug("Exam is completed.");
	
	// For ASWB records, The exam results should be recorded as 'Pass'
    examModel.setGradingStyle("passfail");
	examModel.setFinalScore(1);
    /* examModel.setPassingScore(); */
    examModel.setExamDate(queryResult.examDate);
    examModel.setEntityType("CAP_EXAM");

    // Creating Exam record.
    var statusResult = aa.examination.createExaminationModel(newExamScriptModel);
    if (!statusResult.getSuccess())
	{
		returnException = new ELPAccelaEMSEException("Error Creating Examination "+ statusResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.error(returnException.toString());
    }

}

/** 
 * @desc This method creates or update Application record monthly payment set
 * @param {queryResult} queryResult - contains query result from staging table.
 * @param {VENDOR} VENDOR - contains vendor name [ASWB]. 
 * @param {capId} capId - contains record id.
 */
function createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId)
{
	ELPLogging.debug("Updating set details for Application record : " +capId);
	
	var setName = getMonthlyPaymentSet(queryResult.boardCode, VENDOR);
	ELPLogging.debug("Set Name : " +setName);
	
	//Add application record to monthly payment set
	var addToPaymentSet = addApplicationRecordToMonthlyPaymentSet(setName, capId);
	
	if (addToPaymentSet)
	{
		ELPLogging.debug("Record # "+capId +" has been added to monthly payment set");
	}
	else
	{
		ELPLogging.debug("Error occurred while adding record " +capId +" to the payment set");
	}
}

/** 
 * @desc This method will add and update condition on the reference license
 * @param {licSeqNbr} contains a license sequence number
 * @param {conditionType} contains the condition type "ELP Interfaces"
 * @param {conditionName} contains the condition name "Renewal stayed by DUA"
 * @param {conditionComment} contains the condition comment "Non-compliant with DUA on <First time non compliant Run Date>,
 * Non-compliant again on <Run Date>"
 * @param {runDate} contains the runDate from the dynamic parameters
 * @throws  N/A
 */ 
function addUpdateCondOnRefLicForResendRecord(licSeqNbr, conditionType, conditionName, conditionComment)
{
	ELPLogging.debug("Add update condition on reference license for licSeqNbr : " +licSeqNbr);
	
	//Retrieve the conditions on the reference license
	var conditionList = aa.caeCondition.getCAEConditions(licSeqNbr);

	//This boolean variable is used to check the condition exists on the reference license or not
	var condExistFlag = false;
	
	if (conditionList.getSuccess())
	{
		var conditionModel = conditionList.getOutput();
		
		if (conditionModel)
		{
			for (index in conditionModel)
			{
				var condition = conditionModel[index];
				
				//Check if the condition type and condition name both exists on the reference license
				if ((condition.getConditionType() == conditionType) && (condition.getConditionDescription() == conditionName))
				{
					//Condition details object
					var toEditCapCondition = condition;
					
					//if condition exists then set condExistFlag to true
					condExistFlag = true;
					break;	
				}
	
			}
		}
		
		//If condition already exists on the reference license then update the comment
		if(condExistFlag)
		{
			ELPLogging.debug("Editing condition on license number : " + licSeqNbr);

			//Merging the condition comment
			//conditionComment = conditionComment+runDate;

			//Setting the updated conditionComment
			condition.setConditionComment(conditionComment);
			
			//Editing the condition condition comment on the reference license
			var editCaeCondResult = aa.caeCondition.editCAECondition(condition);
			
			//Logging the message in the log file if the conditionComment has been successfully updated 
			if(editCaeCondResult.getSuccess())
			{
				ELPLogging.debug("Successfully edited condition comment : "+ condition.getConditionComment());
			}
			else
			{
				//Logging message if there is any exception occurs while updating the conditionComment
				var errorMessage = "Error editing condition on reference license : " +toEditCapCondition.getConditionDescription()+" : "+editCaeCondResult.getErrorMessage();
				ELPLogging.debug(errorMessage);

				//Throwing an exception if there is any exception occurs while updating the conditionComment
				returnException = new ELPAccelaEMSEException(errorMessage, ScriptReturnCodes.EMSE_PROCEDURE);
				ELPLogging.notify(returnException.toString());
				throw returnException;
			}
		}
		else
		{
			ELPLogging.debug("Add a new condition on the license sequence number : " +licSeqNbr);
				
			//conditionComment = conditionComment + runDate;
			ELPLogging.debug("New condition with condition comment : " +conditionComment);
			
			//Adding new condition on the reference license
			var addCaeCondResult = aa.caeCondition.addCAECondition(licSeqNbr, conditionType, conditionName, conditionComment, null, null, null, null, null, null, null, null, null, null);
			
			//Logging the message in the log file if the condition added successfully
			if(addCaeCondResult.getSuccess())
			{
				ELPLogging.debug("Successfully Added condition "+conditionName);
			}
			else
			{
				//Logging the message if there is any exception occurs while adding the CAE condition
				var errorMessage = "Error adding condition on reference license : " +  conditionName+" : "+addCaeCondResult.getErrorMessage();
				ELPLogging.debug(errorMessage);

				//Throwing an exception if there is any exception occurs while updating the conditionComment
				returnException = new ELPAccelaEMSEException(errorMessage, ScriptReturnCodes.EMSE_PROCEDURE);
				ELPLogging.notify(returnException.toString());
				throw returnException;
			}						
		}
	}
}

/** 
 * @desc This method adds condition - License record resend by exam vendor on license record
 * @param {newLicID} capId - contains record id.
 */
function addResendConditionOnLicenseRecord(newLicID, typeClass)
{
	ELPLogging.debug("Adding resend condition.");
	
	//Retrieving the standard condition comment from condition type and name
	var standardConditions = aa.capCondition.getStandardConditions(CONDITION_TYPE, LICENSE_RECORD_RESENT_CONDITION_DESC).getOutput();
		
	//Get standard condition details
	var standardCondition = standardConditions[0];
		
	//Get condition comment associated with the condition type and name
	var conditionComment = standardCondition.getConditionComment() + RUN_DATE;
	
	//Retrieve reference license number
	var licenseSequenceNumber = retrieveLicSeqNumber(newLicID);
	ELPLogging.debug("License sequence number # " +licenseSequenceNumber);
	conditionCommentRef = " with License# : "+licenseSequenceNumber+", First Name : " + queryResult.firstName+ ", Last Name : " +queryResult.lastName;
	
	conditionComment = conditionComment +  conditionCommentRef;
	//Add condition on reference license number
	addUpdateCondOnRefLicForResendRecord(licenseSequenceNumber, CONDITION_TYPE, LICENSE_RECORD_RESENT_CONDITION_DESC, conditionComment);
	
	//Insert record in error table
	var recordID = queryResult.firstName+ " " +queryResult.lastName;
	var errorDescription =  queryResult.boardCode +" : " +" License number resend by exam vendor.";
	
	var recordID = "";

	if((queryResult.firstName != null) && (queryResult.lastName != null))
	{
		recordID = queryResult.firstName+ " " +queryResult.lastName;
	}
	else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (typeClass != null))
	{
		recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+typeClass;
	}
		
	//Inserting record in the error table
	updateSWErrorTable(recordID, errorDescription);
}

/** 
 * @desc This Method will update maiden name on the record.
 * @param {capIDModel} capIDModel - Unique Record ID.
 * @param {refSeqNumber} refSeqNumber - contains reference contact number.
 */
function updateMaidenName(refSeqNumber, capIDModel)
{
	ELPLogging.debug(" Updating maiden name on the reference contact for record ID : " +capIDModel);
	var startDate = new Date();
	var endDate = null;
	
	if (!refSeqNumber)
	{
		ELPLogging.debug("contactObj: Cannot add AKA name for non-reference contact");
		return false;
	}
	
	var akaPeopleModel = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAKABusiness").getOutput();
	var args = new Array();
	var akaModel = aa.proxyInvoker.newInstance("com.accela.orm.model.contact.PeopleAKAModel", args).getOutput();
	var auditModel = aa.proxyInvoker.newInstance("com.accela.orm.model.common.AuditModel", args).getOutput();
	var akaScriptObject = akaPeopleModel.getPeopleAKAListByContactNbr(aa.getServiceProviderCode(), String(refSeqNumber));
	akaModel.setServiceProviderCode(aa.getServiceProviderCode());
	akaModel.setContactNumber(parseInt(refSeqNumber));
	akaModel.setFullName(queryResult.maidenName);
	akaModel.setStartDate(startDate);
	akaModel.setEndDate(endDate);
	auditModel.setAuditDate(new Date());
	auditModel.setAuditStatus("A");
	auditModel.setAuditID("ADMIN");
	akaModel.setAuditModel(auditModel);
	akaScriptObject.add(akaModel);
	akaPeopleModel.saveModels(aa.getServiceProviderCode(), refSeqNumber, akaScriptObject);	
}




/**
 * @desc This method update ASI and ASIT [Type Class, License In Other Jurisdictions, Applicant Type , Military Status] on SW board License record.
 * @param {capIDModel} capID Model - contains record ID.
 */
function updateASIandASITOnLicRecord(queryResult, capIDModel, typeClassItem)
{
	ELPLogging.debug("Updating ASI and ASIT on license record for RE board : "+capIDModel);
	//Local variable declaration
	var typeClass = typeClassItem;
	var noFeeCollected;
	
	// Set the military status value
	if (queryResult.noFeeCollected == "1" || queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "4")
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A";
	}
	
	// Set the ASI values for type class
	ELPLogging.debug("No Fee Collected : " +noFeeCollected);
	ELPLogging.debug("ASI - Type Class : " +typeClass);
	
	// Update the ASI values
	updateASIValues(capIDModel, "TYPE CLASS", "Type Class", typeClass);
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);
	
	if (queryResult.reciprocity != null && queryResult.reciprocity != undefined && queryResult.reciprocity != "")
	{
		updateASIValues(capIDModel, "TYPE CLASS", "Applicant Type", "Reciprocity");
	}
	// If Expired License exists 
	else if (expireLicenseExist)
	{
		updateASIValues(capIDModel, "TYPE CLASS", "Applicant Type", "Re-Licensure");
	}
	else
	{
		updateASIValues(capIDModel, "TYPE CLASS", "Applicant Type", "Examination");
	}
	
	// Update the ASIT values
	var tableValuesArray = {};
	tableValuesArray["License Type"] = "";
	tableValuesArray["License Number"] = "";
	if (queryResult.reciprocity != null)
	{
		tableValuesArray["License Jurisdiction"] = String(queryResult.reciprocity);
	}
	else
	{
		tableValuesArray["License Jurisdiction"] = "";
	}
	tableValuesArray["Issue Date"] = "";
	tableValuesArray["Status"] = "";
	tableValuesArray["Basis for License"] = "";
	
	addASITValueToRecord("LICENSE IN OTHER JURISDICTIONS", tableValuesArray, capIDModel);
	
	var tableValuesArray = new Array();
	tableValuesArray["Serial Number"] = "";
	tableValuesArray["Record ID"] = "";
	tableValuesArray["Issue Date"] = "";
	tableValuesArray["Reason"] = "";
	
	addASITValueToRecord("DUPLICATE LICENSE HISTORY", tableValuesArray, capIDModel);
}


function feeOnSWApplicationRecord(capId, typeClass) {
	ELPLogging.debug("Adding Fee on record : "+capId);
	var feeInfo;
	var feeCode;
	var feeSchedule;
	
	//Obtain Military Status values
	var militaryStatus = getAppSpecific("Military Status", capId);
	ELPLogging.debug("Military Status : " + militaryStatus);
	if(militaryStatus == "N/A")
	{
		var capIDModel = aa.cap.getCap(capId).getOutput();
		var capType = capIDModel.getCapType().toString();
		ELPLogging.debug(" Adding fee on Cap Type = "+capType);
		if (capType.toUpperCase() == "LICENSE/SOCIAL WORKERS/SOCIAL WORKERS/APPLICATION")
		{
			if (typeClass == "LICSW")
			{
				feeInfo = lookup("LKUP_Application_Fees", "SW-LICSW-L");
			}
			else if (typeClass == "LCSW")
			{
				feeInfo = lookup("LKUP_Application_Fees", "SW-LCSW-L");
			}
			else if (typeClass == "LSW")
			{
				feeInfo = lookup("LKUP_Application_Fees", "SW-LSW-L");
			}
			else if (typeClass == "LSWA")
			{
				feeInfo = lookup("LKUP_Application_Fees", "SW-LSWA-L");
			}
		}
		if (feeInfo)
		{
			feeInfo = feeInfo.toString();
			var fee =new Array();
			fee = feeInfo.split("/");
			feeCode = fee[0];
			feeSchedule = fee[1].split("-");
			ELPLogging.debug("The fee Code is : " + feeCode + " with fee schedule as : " + feeSchedule);
			addFeeToApplicationRecord(feeCode, feeSchedule[0], "STANDARD", 1, "Y", capId);
		}
	}
}


/**
 * @desc This method will trigger an email for any invalid record.
 * @param {dbConnection} contains dbConnection object.
 * @param {procedureConfiguration} contains procedureConfiguration object.
 * @param {RUN_DATE} contains RUN_DATE.
 */
function emailErrorReport(dbConnection, procedureConfiguration, runDate) 
{
	ELPLogging.debug("Triggering error report.");
	for (var ii = 0; ii < procedureConfiguration.supplemental.length; ii++)
	{
		var supplementalConfiguration = procedureConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "errorQuery")
		{
			var errorReportProcedure = new StoredProcedure(supplementalConfiguration.procedure, dbConnection); 
			break;
		}
	}

	if (errorReportProcedure == null ) 
	{
		var message = "Cannot find supplemental stored procedure for Error Query.";
	    returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
	    ELPLogging.error(returnException.toString());
	    return;		
	}	
	try
	{
		ELPLogging.debug("*** Start getErrorReportRecords() ***");
		
		// POC
		// var parameters = {};
		// parameters.runDate = runDate;
		// parameters.batchInterfaceName = "ELP.ASWB.INTAKE";
		// errorReportProcedure.prepareStatement();
		// var inputParameters = errorReportProcedure.prepareParameters(null,null,parameters);
		// ELPLogging.debug("InputParameters for errorReportProcedure: ", inputParameters);
		
		// errorReportProcedure.setParameters(inputParameters);
		// var dataSet = errorReportProcedure.queryProcedure();

		// POC
		var parameters = {
            "runDate": runDate,
            "batchInterfaceName": "ELP.ASWB.INTAKE",
            "tableName": "ELP_VW_PSI_ERROR"
        };
        var dataSet = getErrorReportRecords(errorReportProcedure, parameters);

		ELPLogging.debug("*** Finished getErrorReportRecords() ***");
		
		// loop through all license configuration records
		var licenseConfiguration = null;
		var emailBody = [];
		
		var boardCode = null;
		var firstLine = "The following are input errors in the ASWB Intake File that prevented processing of that application.";
		emailBody.push(firstLine);		
		
		var emailAddressCode = "ASWB ERRORS-SW";
		
		ELPLogging.debug("runDate  : " + runDate);
		
		while ((errorData = dataSet.next()) != null)
		{
			var processingDateS = errorData.runDate.toDateString();			
			
			var errorLine = errorData.errorDescription;
			
			var scanner = new Scanner(errorLine, "|");
			
			var boardCode = scanner.next();
			var errorMessage = scanner.next();
			
			ELPLogging.debug (boardCode + " errorMessage : " +errorMessage );
			
			var errorLine = processingDateS + ":" + errorData.recordID + ":	" + errorMessage;
			
			ELPLogging.debug(errorLine);
			emailBody.push(errorLine);
		}
		
		
		ELPLogging.debug("Sending batch status email");
		sendBatchStatusEmail(emailAddressCode, "Batch ASWB File Errors", emailBody);
	}
	catch (ex) 
	{
		ELPLogging.error("Send Error Email Error : ", ex);
	} 
	finally 
	{
		if (dataSet != null)
		{
			dataSet.close();
		}
		if (errorReportProcedure != null)
		{
			errorReportProcedure.close();
		}
	}
	ELPLogging.debug("emailErrorReport End.");
}

/** 
 * @desc This method will update EXAM VENDOR CASH INFO on the record
 * @param {capId} capId - contains Application record id.
 */
function updateExamVendorCashInfo(capId)
{
	ELPLogging.debug("Updating exam cash vendor info ASIT for record ID = "+capId);
	feeAmount = retrieveFeeAmountFromApplicationRecord(capId);
		
	var tableValuesArray = new Array();
	tableValuesArray["Cash Date"] = jsDateToMMDDYYYY(formatIntoDate(queryResult.cashDate));
	tableValuesArray["Cash Number"] = String(queryResult.cashNumber);
	tableValuesArray["Fee Type"] = String("A");
	tableValuesArray["Fee Amount"] = String(feeAmount);
	
	// Updating ASIT on application record.
	addASITValueToRecord("EXAM VENDOR CASH INFO", tableValuesArray, capId);
}

/** 
 * @desc This method retrieves fee amount on Application to update Fee Amount ASIT
 * @param {capIDModel} capId - contains Application record id.
 */
function retrieveFeeAmountFromApplicationRecord(capIDModel)
{
	ELPLogging.debug("Retrieving Fee amount for Application record = "+capIDModel);
	var feeAmount = null;
	
	var feeItemScriptModel = aa.finance.getFeeItemByCapID(capIDModel).getOutput();
	for(index in feeItemScriptModel)
	{
		var feeCode = feeItemScriptModel[index].getFeeCod();
		
		var recordTypeFeeCode = retrieveFeeCode(capIDModel, null);
		
		if(feeCode == recordTypeFeeCode)
		{
			feeAmount = feeItemScriptModel[index].getFee();
		}
	}

	return feeAmount;
}

/** 
 * @desc This method deactivates the existing license and updates the expiration date 
 * @param {queryResult} queryResult - queryResult from staging table.
 * @param {capStatus} capStatus - Either 'Lapsed' or 'Current'.
 * @param {subType} subType - subType value of the records to be processed.
 * @param {typeClass} typeClass - Current intake records typeClass.
 */
function deactivateExistingLicense(queryResult, capStatus, subType, typeClass, newLicID)
{
	var workflowStatusFlag = false;
	
	var capIDScriptModel = retrieveApplicationRecordViaSSN((queryResult.socSecNumber).toString());

	for(index in capIDScriptModel)
	{
		tmpCapID = capIDScriptModel[index].getCapID();	
		tmpCapID = aa.cap.getCapID(tmpCapID.getID1(),tmpCapID.getID2(),tmpCapID.getID3()).getOutput();
		
		var capContactResult = aa.people.getCapContactByCapID(tmpCapID);
		
		if(capContactResult.getSuccess())
		{
			capContactResult=capContactResult.getOutput();
			
			for(yy in capContactResult)
			{
				try
				{
					thisCapContact = capContactResult[yy];
					refLicense = aa.licenseScript.getRefLicensesProfByName(aa.getServiceProviderCode(),thisCapContact.getPeople().firstName,thisCapContact.getPeople().middleName,thisCapContact.getPeople().lastName);
					masterLicSSN = thisCapContact.getPeople().getSocialSecurityNumber();
					ELPLogging.debug("refLicense :  "+ refLicense);
					ELPLogging.debug("SSN : " + masterLicSSN);
	
					var peopleModel = thisCapContact.getCapContactModel();
					var birthdate = peopleModel.getBirthDate();
					birthdate =  (birthdate.getMonth() + 1) + "/" + birthdate.getDate() + "/" +birthdate.getYear();
					ELPLogging.debug("Date of Birth of applicant: " + birthdate);
					
					var intakeDOB = formatBirthDate(queryResult.dateOfBirth);
					intakeDOB = (intakeDOB.getMonth() + 1) + "/" + intakeDOB.getDate() + "/" +intakeDOB.getYear();
					ELPLogging.debug("Date of Birth from Intake file : " + intakeDOB);
					workflowStatusFlag = false;
					if (capStatus == "Lapsed")
					{
						ELPLogging.debug("Check workflow task status.");
						var workflowResult = aa.workflow.getTasks(tmpCapID).getOutput();
						for (i in workflowResult)
						{
							ELPLogging.debug("Check workflow task status- 1.0.");
							
							var fTask = workflowResult[i];
							
							if (fTask.getDisposition())
							{							
								ELPLogging.debug("fTask.getDisposition().toUpperCase() --" + fTask.getDisposition().toUpperCase() + "--capStatus.toUpperCase() -- "+ capStatus.toUpperCase());
								if (fTask.getDisposition().toUpperCase().equals(capStatus.toUpperCase()))
								{
									workflowStatusFlag = true;
								}
							}
						}
					}
				
					var capModelResult = aa.cap.getCap(tmpCapID);
					if(capModelResult.getSuccess())
					{
						var capScriptModel = capModelResult.getOutput();
						
						ELPLogging.debug("Record's SubType - " + capScriptModel.getCapType().getSubType() + " Passed in getSubType - " + subType);
						ELPLogging.debug("Record's CapStatus - " + capScriptModel.getCapStatus() + " Passed in CapStatus - " + capStatus);
						
						if ((capScriptModel.getCapStatus() == capStatus || workflowStatusFlag) && capScriptModel.getCapType().getSubType() == subType)
						{					
							if ((tmpCapID.toString() != newLicID.toString()) && birthdate == intakeDOB)
							{
								if(capScriptModel.getCapStatus() == "Lapsed" || workflowStatusFlag)
								{								
									updateASIValues(applicationRecordID, "APPLICATION", "Existing License Number", tmpCapID.getCustomID());	
									// Change status to "Upgraded" and do not change the expiration Date
									updateTaskStatus("License", "Upgraded", "","","", tmpCapID);
									ELPLogging.debug("Finished updating the license status to Upgraded for capID: "+tmpCapID);
									// Associate license as child of new License
									linkRecordAsChild(newLicID, tmpCapID);
									linkFlag = true;
								}
								else if(capScriptModel.getCapStatus() == "Current")
								{
									updateASIValues(applicationRecordID, "APPLICATION", "Existing License Number", tmpCapID.getCustomID());	
									//Change the status to Upgraded
									updateTaskStatus("License", "Upgraded", "","","", tmpCapID);
									ELPLogging.debug("Finished updating the license status to Upgraded for capID: "+tmpCapID);
									
									var newExpDate = formatIntoDate(queryResult.licIssueDate);
									newExpDate = new Date(newExpDate.getFullYear() - 2, newExpDate.getMonth(), newExpDate.getDate());
									// Change the expiration date of record to the issue date of new license.
									setLicExpirationDate(tmpCapID, newExpDate);
									// Associate license as child of new License
									linkRecordAsChild(newLicID, tmpCapID);
									linkFlag = true;
								}
								else if (capScriptModel.getCapStatus() == "Expired")
								{
									expireLicenseExist = true;
									// Associate license as child of new License
									linkRecordAsChild(newLicID, tmpCapID);
									linkFlag = true;
								}							
							}
						}
					}
				}
				catch(ex)
				{
					ELPLogging.debug("Exception occured while processing record : " + tmpCapID + " - Error is : " + ex);
				}
			}
		}
	}
}

/** 
 * @desc This method checks for any associated license based on the licensee
 * @param {queryResult} queryResult - queryResult from staging table.
 * @param {newLicID} newLicID - Newly created license ID.
 */
function checkForAssociatedLicenses(queryResult, newLicID) {
	var capModel = new com.accela.aa.aamain.cap.CapModel();
	var capTypeModel = capModel.getCapType();
	capTypeModel.setType("Social Workers");
	capTypeModel.setCategory("License");
	capModel.setCapType(capTypeModel);

	var capListLicAPI = aa.cap.getCapListByCollection(capModel, null, null, null, null, null, new Array()); 
	if(capListLicAPI.getSuccess())
	{	
		capListAPI = capListLicAPI.getOutput();
		if(capListAPI)
		{
			for(thisCAP in capListAPI)
			{
				var capID = capListAPI[thisCAP].getCapID();
				var capIDModel = aa.cap.getCapID(capID.getID1(),capID.getID2(),capID.getID3()).getOutput();
				ELPLogging.debug("Found License : " +capIDModel.getCustomID());
				var capContactResult = aa.people.getCapContactByCapID(capIDModel);
				if(capContactResult.getSuccess())
				{
					capContactResult=capContactResult.getOutput();
					for(yy in capContactResult)
					{
						thisCapContact = capContactResult[yy];
						refLicense = aa.licenseScript.getRefLicensesProfByName(aa.getServiceProviderCode(),thisCapContact.getPeople().firstName,thisCapContact.getPeople().middleName,thisCapContact.getPeople().lastName);
						masterLicSSN = thisCapContact.getPeople().getSocialSecurityNumber();
						ELPLogging.debug("refLicense :  "+ refLicense);
						ELPLogging.debug("SSN : " + masterLicSSN);
						if(masterLicSSN == formatSSN((queryResult.socSecNumber).toString()) && capIDModel.toString() != newLicID.toString()) {
							// Associate license as child of new License
							linkRecordAsChild(newLicID, capIDModel);
						}
					}
				}
			}
		}
	}
}
/* function checkForAssociatedLicenses(queryResult, capStatus, subType, newLicID, typeClass) {
	var capModel = new com.accela.aa.aamain.cap.CapModel();
	var capTypeModel = capModel.getCapType();
	capTypeModel.setType("Social Workers");
	capTypeModel.setSubType(subType);
	capTypeModel.setCategory("License");
	capModel.setCapType(capTypeModel);
	capModel.setCapStatus(capStatus);

	var capListLicAPI = aa.cap.getCapListByCollection(capModel, null, null, null, null, null, new Array()); 
	if(capListLicAPI.getSuccess())
	{	
		capListAPI = capListLicAPI.getOutput();
		if(capListAPI)
		{
			for(thisCAP in capListAPI)
			{
				var capID = capListAPI[thisCAP].getCapID();
				var capIDModel = aa.cap.getCapID(capID.getID1(),capID.getID2(),capID.getID3()).getOutput();
				ELPLogging.debug("Found License : " +capIDModel.getCustomID());
				var capContactResult = aa.people.getCapContactByCapID(capIDModel);
				if(capContactResult.getSuccess())
				{
					capContactResult=capContactResult.getOutput();
					for(yy in capContactResult)
					{
						thisCapContact = capContactResult[yy];
						refLicense = aa.licenseScript.getRefLicensesProfByName(aa.getServiceProviderCode(),thisCapContact.getPeople().firstName,thisCapContact.getPeople().middleName,thisCapContact.getPeople().lastName);
						masterLicSSN = thisCapContact.getPeople().getSocialSecurityNumber();
						ELPLogging.debug("refLicense :  "+ refLicense);
						ELPLogging.debug("SSN : " + masterLicSSN);
						if(masterLicSSN == formatSSN((queryResult.socSecNumber).toString()) && capIDModel.toString() != newLicID.toString()) {
							// Associate license as child of new License
							linkRecordAsChild(newLicID, capIDModel);
							
							// Process the task updates as per the cap status
							if(capStatus == "Lapsed"){
								var capScriptModel = aa.cap.getCap(capIDModel).getOutput();
								var capModel = capScriptModel.getCapModel();
								var capTypeModel = capModel.getCapType();
								if(typeClass != capTypeModel.getSubType()){
									// Change status to "Upgraded" and do not change the expiration Date
									updateTaskStatus("License", "Upgraded", "","","", capIDModel);
									ELPLogging.debug("Finished updating the license status to Upgraded for capID: "+capIDModel);
								}
							}
							else if(capStatus == "Current"){
								//Change the status to Upgraded
								updateTaskStatus("License", "Upgraded", "","","", capIDModel);
								ELPLogging.debug("Finished updating the license status to Upgraded for capID: "+capIDModel);
								
								// Change the expiration date of record to the issue date of new license.
								setLicExpirationDate(capIDModel, formatIntoDate(queryResult.licIssueDate));
							}
						}
					}
				}
			}
		}
	}
} */

/** 
 * @desc This method checks for any associated license based on the licensee
 * @param {parentRecordID} parentRecordID - parent record ID.
 * @param {childRecordID} childRecordID - Child Record ID.
 */
function linkRecordAsChild(parentRecordID, childRecordID)
{
	ELPLogging.debug("Linking record = "+childRecordID +" as child of the record = "+parentRecordID);
	
	var appHierarchyResult = aa.cap.createAppHierarchy(parentRecordID, childRecordID);
	
	if (!appHierarchyResult.getSuccess())
	{
		ELPLogging.debug("**Error*** Could not link record : "+childRecordID +" to the parent record = "+parentRecordID+ " ## " +appHierarchyResult.getErrorMessage());
	}

}

/** 
 * @desc This method load the utility script which contains functions that will be used later.
 * @param {vScriptName} vScriptName - contains the script name 
 * @throws  N/A
 */ 
function getScriptText(vScriptName)
{
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
    return emseScript.getScriptText()+"";
}

function setConditionMet(condname, capID)
{
	ELPLogging.debug("--- in setConditionMet ---");
	var capConds = null;
	var condResult = aa.capCondition.getCapConditions(capID);
	if (condResult.getSuccess()) 
	{
		capConds = condResult.getOutput();
	} 
	else 
	{ 
		ELPLogging.debug("ERROR: getting cap conditions: " + condResult.getErrorMessage());
	}

	if (capConds != null)
	{
		ELPLogging.debug("There are " + capConds.length + " condition(s).");
		for (cc in capConds) 
		{
			var thisCond = capConds[cc];
			var cName = thisCond.getConditionDescription();
			var cStatus = thisCond.getConditionStatus();
			var cStatusType = thisCond.getConditionStatusType();
			if (cName == condname)
			{
			   thisCond.setConditionStatus("Met");
			   thisCond.setConditionStatusType("Not Applied");
			   thisCond.setImpactCode("");
			   aa.capCondition.editCapCondition(thisCond);
			}
		}
	}
}

function retrieveApplicationRecordViaSSN(socialSecurityNumber)
{
	ELPLogging.debug("Retrieving record ID from Social security number");
	//Local variable declaration
	var appDetailsArray = new Array();
	var tmpCapID = null;
	var capID = null;
	var altID;
	var capIDScriptModel =null;
	
	
	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode("DPL");

	var SSN = formatSSN(socialSecurityNumber);
	peopleScriptModel.setSocialSecurityNumber(SSN);
	peopleScriptModel.setContactType("Licensed Individual");

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if(peopleResult.getSuccess())
	{
		capIDScriptModel = peopleResult.getOutput();
	}
	else
	{
		ELPLogging.debug("No License record found for SSN #");
	}
		
	return capIDScriptModel;
}

/**
 * @desc This method logs an error in the error table "ELP_TBL_ERROR_STG_MA" in case of an invalid record.
 * @param {recordID} recordID - contains the first name and last name.
 * @param {errorDescription} errorDescription - contains the errorDescription.
 * @throws ELPAccelaEMSEException
 */
function updateErrorTable(recordID, errorDescription)
{
	ELPLogging.debug("Updating Error table : " +recordID+ " in ELP_TBL_ERROR_STG_MA table.");
	
	//Error table update parameters
	var errorTableUpdateParameters = {"BatchInterfaceName": dynamicParamObj.batchInterfaceName, "RecordID" : recordID, "ErrorDescription": errorDescription, "runDate": RUN_DATE};
	
	//Calling ELP_SP_ERROR_INT_INSERT SP to insert data into error table
	callToStoredProcedure(errorTableUpdateParameters, "errorTableInsert");
}

function linkLicenserecords(queryResult, typeClass, newLicID)
{	
	ELPLogging.debug("Looking for license records with SSN # " + queryResult.socSecNumber);
	
	var capIDScriptModel = retrieveApplicationRecordViaSSN((queryResult.socSecNumber).toString());

	for(index in capIDScriptModel)
	{
		tmpCapID = capIDScriptModel[index].getCapID();	
		tmpCapID = aa.cap.getCapID(tmpCapID.getID1(),tmpCapID.getID2(),tmpCapID.getID3()).getOutput();
		
		var scanner = new Scanner(tmpCapID.getCustomID(), "-");
		var ID1 = scanner.next();
		var ID2 = scanner.next();
		var ID3 = scanner.next();
					
		if (ID2 != "SW")
		{
			continue;
		}
		
		var capContactResult = aa.people.getCapContactByCapID(tmpCapID);
		
		if(capContactResult.getSuccess())
		{
			capContactResult=capContactResult.getOutput();
			
			for(yy in capContactResult)
			{
				thisCapContact = capContactResult[yy];
				refLicense = aa.licenseScript.getRefLicensesProfByName(aa.getServiceProviderCode(),thisCapContact.getPeople().firstName,thisCapContact.getPeople().middleName,thisCapContact.getPeople().lastName);
				masterLicSSN = thisCapContact.getPeople().getSocialSecurityNumber();
				ELPLogging.debug("refLicense :  "+ refLicense);
				ELPLogging.debug("SSN : " + masterLicSSN);

				var peopleModel = thisCapContact.getCapContactModel();
				var birthdate = peopleModel.getBirthDate();
				birthdate =  (birthdate.getMonth() + 1) + "/" + birthdate.getDate() + "/" +birthdate.getYear();
				ELPLogging.debug("Date of Birth of applicant: " + birthdate);
				
				var intakeDOB = formatBirthDate(queryResult.dateOfBirth);
				intakeDOB = (intakeDOB.getMonth() + 1) + "/" + intakeDOB.getDate() + "/" +intakeDOB.getYear();
				ELPLogging.debug("Date of Birth from Intake file : " + intakeDOB);
				
				if ((tmpCapID.toString() != newLicID.toString()) && birthdate == intakeDOB)
				{
					// Associate license as child of new License
					linkRecordAsChild(newLicID, tmpCapID);
				}							
			}			
		}
	}
}

function updateCustomID(capIDModel)
{
	var scanner = new Scanner(capIDModel.getCustomID().toString(),"-");
	
	var year = scanner.next();
	var seq = scanner.next();
	var board = scanner.next();
	var type = scanner.next();
	var app = scanner.next();
	
	var newApplicationID = year + "-"+seq+"-"+board+"-"+typeClass+"-" +app;
	
	var updateCapAltIDResult = aa.cap.updateCapAltID(capIDModel, newApplicationID);
	
	if (updateCapAltIDResult.getSuccess())
		ELPLogging.debug(newApplicationID + " AltID changed from " + capIDModel.getCustomID() + " to " + newApplicationID);
	else
		ELPLogging.debug("**WARNING: AltID was not changed from " + capIDModel.getCustomID() + " to " + newApplicationID + ": " + updateCapAltIDResult.getErrorMessage());
	
}

function countStagingRecords(runDate) {
    var count = 0;
    var startDate = new Date();
    var startTime = startDate.getTime();
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
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    ELPLogging.debug("**INFO: Elapsed time counting records: " + elapsed(startTime) + " secs.");
    return count;
}

function getStgRecords(parameters) {
    ELPLogging.debug("**INFO: getStgRecords.");
    var dataSet = null;
    var startDate = new Date();
    var startTime = startDate.getTime();
    try {

        for (p in parameters) {
            ELPLogging.debug("**INFO: " + p + ": " + parameters[p]);
        }

        var stmt = null;
        var sql = "select * from " + parameters["tableName"];
        if (!parameters["runDate"] || parameters["runDate"] == null) {
            sql += " WHERE INTAKE_STATUS = ? order by LICENSE_NUMBER asc";
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["intakeStatus"]);
        } else {
            sql += " WHERE RUN_DATE like ? order by LICENSE_NUMBER asc";
            stmt = dbConn.prepareStatement(sql);
            var sql_date = new java.sql.Date(parameters["runDate"].getTime());
            stmt.setDate(1, sql_date);
        }

        ELPLogging.debug("** SQL: " + sql);
        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    ELPLogging.debug("**INFO: Elapsed time retrieving records: " + elapsed(startTime) + " secs.");
    return dataSet;
}

function elapsed(startTime) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    return ((thisTime - startTime) / 1000);
}

function getErrorReportRecords(queryProcedure, parameters) {
   var dataSet = null;
    try {
        var stmt = null;
        var sql = "select * from " + parameters["tableName"] + " where batchInterfaceName = ? and run_date like ?";
        stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["batchInterfaceName"]);
        var sql_date = new java.sql.Date(parameters["runDate"].getTime());
        stmt.setDate(2, sql_date);

        var rs = stmt.executeQuery();

        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}