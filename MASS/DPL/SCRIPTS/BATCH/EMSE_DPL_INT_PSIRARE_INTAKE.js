/***********************************************************************************************************************************
* @Title 		: 	EMSE_DPL_INT_PSIRARE_INTAKE
* @Author		:	Sagar Cheke / Paul Berube (PSV to PSI)
* @Date			:	03/11/2016
* @Description 	:	The Script will query the staging table to retrieve record information that were loaded from the 
					PSI inbound file.Script performs check for duplicate records based on SSN, board code, type class, license number.
					Script will check for the board code to create and update Accela entries for valid records.
					1) For RE board : Perform Application record validation [SSN, Phone number, address, license number, 
									  license expiration date]. If validation is successful then create Application record,
									  license record, reference license record, license professional in the Accela system. 
									  Add the application record into the monthly payment set. If validation fails, record 
									  will be inserted into error table and email will be triggered for any erroneous record.
					2) For RA board : Validation will be performed for required fields, license number and license expiration
									  date. If validation is successful, then script will create license record, reference license
									  record, license professional in the Accela system. Add the application record into 
									  the monthly payment set. If validation fails, record will be inserted into error 
									  table and email will be triggered for any erroneous record. 
***********************************************************************************************************************************/

// POC
var selectQueryObj = {
    "selectQuery": {
        "table": "ELP_TBL_PSIRARE_STG_DPL", 
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
                    "name": "recordID", 
                    "source": "RESULT", 
                    "property": "RECORD_ID", 
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
                    "type": "STRING", 
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
                    "name": "prefferedComm", 
                    "source": "RESULT", 
                    "property": "PREFERRED_COMM", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "emailID", 
                    "source": "RESULT", 
                    "property": "EMAIL_ID", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "primaryPhone", 
                    "source": "RESULT", 
                    "property": "PRIMARY_PHONE", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "cashNumber", 
                    "source": "RESULT", 
                    "property": "CASH_NUMBER", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "cashDate", 
                    "source": "RESULT", 
                    "property": "CASH_DATE", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "licIssueDate", 
                    "source": "RESULT", 
                    "property": "LIC_ISSUE_DATE", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "licExpiryDate", 
                    "source": "RESULT", 
                    "property": "LIC_EXPIRY_DATE", 
                    "type": "DATE_TIME", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "buildingNum", 
                    "source": "RESULT", 
                    "property": "BUILDING_NUM", 
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
                    "type": "DATE_TIME", 
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
                    "name": "busBuildingNum", 
                    "source": "RESULT", 
                    "property": "BUS_BUILDING_NUM", 
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
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore2", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_2", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore3", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_3", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore4", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_4", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "writtenScore5", 
                    "source": "RESULT", 
                    "property": "WRITTEN_SCORE_5", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "practicalScore", 
                    "source": "RESULT", 
                    "property": "PRACTICAL_SCORE", 
                    "type": "STRING", 
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
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "crossReferenceNo", 
                    "source": "RESULT", 
                    "property": "CROSS_REFERENCE_NO", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "applicationNo", 
                    "source": "RESULT", 
                    "property": "APPLICATION_NO", 
                    "type": "STRING", 
                    "parameterType": "OUT"
                }, 
                {
                    "name": "serialNumber", 
                    "source": "RESULT", 
                    "property": "SERIAL_NUMBER", 
                    "type": "STRING", 
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

try
{
    try
	{
        //Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 3.0;
        eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_STRINGBUILDER"));
		eval(getScriptText("EMSE_MA_INT_C_EMAIL"));	
		eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));		
		eval(getScriptText("INCLUDES_CUSTOM"));
		eval(getScriptText("EMSE_MA_INT_C_LICENSE_PSI"));
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

        // POC
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
	
	aa.env.setValue("BatchJobName", "ELP.PSI.RARE.INTAKE"); 
	var HOUR_SEC = (60 * 60);
	aa.env.setValue("TIMEOUT", HOUR_SEC);
    var TIMER = new ELPTimer(HOUR_SEC);
    ELPLogging.debug("Timer Started");
	
	var CONDITION_TYPE = "ELP Interfaces";
	var LICENSE_RECORD_RESENT_CONDITION_DESC =  "License record resent by exam vendor";
	var INVALID_SSN_CONDITION_DESC = "Invalid SSN";
    var VENDOR = "PSI";
	var RE_PASSING_SCORE = 70;
	var RA_PASSING_SCORE = 75;
 	var BROKER_TYPE_CLASS = "B";
	var SOURCE_NAME = "BATCHJOB";
	var COUNTRY_CODE= "USA"
	var RUN_DATE = null;
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
	
	//Iterating through the records from the list.
	while((queryResult = dataSetStg.next()) != null)
	{
		TIMER.checkTimeout();
		ELPLogging.debug("Processing record with first name : " +queryResult.firstName+ " and last name : " +queryResult.lastName);
		try
		{
			//Check for boardCode is  not null
			if(queryResult.boardCode != null)
			{
				// Duplicate check for the record.
				if(!duplicateRecordCheck(queryResult))
				{
					ELPLogging.debug("Duplicate check passed.");
					
					var validRecord = EvaluateStgRecord(queryResult);
					
					if(validRecord)
					{
						ELPLogging.debug("Starts updating PSI-RARE staging table.");
						
						//IN parameters to update stored procedure
						var emseUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
						updateStgRecord(emseUpdateParameters);
						
						ELPLogging.debug("Finished updating PSI-RARE staging table.");
					}
				}
				else
				{
					ELPLogging.debug("Duplicate record found.");
					var recordID = "";
					if(queryResult.boardCode == "RE")
					{
						//Fix for PROD Defect 7497 : error log entries have no way to map to source file
						if((queryResult.firstName != null) && (queryResult.lastName != null))
						{
							recordID = queryResult.firstName+ " " +queryResult.lastName;
						}
						else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
						{
							recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
						}
						
					}
					else if(queryResult.boardCode == "RA")
					{
						recordID = queryResult.recordID;
					}
					
					//Inserting record in the error table
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Duplicate Record "+queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass+" found.";
					
					updateErrorTable(recordID, errorDescription);
					
					//Deleting record from staging table
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
				}
			}
			else
			{
				ELPLogging.debug("Board code is null.");
				//Fix for PROD Defect 7497 : error log entries have no way to map to source file
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					var recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode == null) && (queryResult.typeClass != null))
				{
					var recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}
				
				var errorDescription = "File Name : "+fileName+" | Board code is null.";
				updateErrorTable(recordID, errorDescription);
				
				//Deleting record from staging table
				var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
				deleteStgRecord(emseDeleteParameters);
			}
		}
		catch(ex if ex instanceof StoredProcedureException)
		{
			ELPLogging.debug("Stored procedure exception occurred when trying to update record : "+ex.toString());
			var emseErrorUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus": "PROCESSED_EMSE_ERROR" , "stgErrorMessage" : "Error occurred while processing record : "+ex.toString()};
			//Updating the PSI-RARE staging table
			updateStgRecord(emseErrorUpdateParameters);
		}
		catch(ex)
		{
			// Update the stgErrorMessage field if there is any exception while updating the staging table
			// IN parameters to the Update stored procedure
			ELPLogging.debug("Error while Updating the data to PSI-RARE staging table: " +ex.message);
			
			var emseErrorUpdateParameters = {"rowNumber" :queryResult.rowNumber, "intakeStatus": "PROCESSED_EMSE_ERROR" , "stgErrorMessage" : "Error occurred while processing record : "+ex.message};
			//Updating the PSI-RARE staging table
			updateStgRecord(emseErrorUpdateParameters);
		}
	}
	
	//Triggering mail for erroneous record.
	emailErrorReport(dbConn, stagingConfigObj, RUN_DATE);
}	
catch(ex if ex instanceof ELPAccelaEMSEException)
{
	aa.print(ex.message);
    ELPLogging.fatal(ex.toString());
    aa.env.setValue("EMSEReturnCode", ex.getReturnCode()); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSIRARE_INTAKE aborted with " + ex.toString());
}
catch(ex)
{
    ELPLogging.fatal(ex.message);
    aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE); 
    aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSIRARE_INTAKE  aborted with " + ex.message);
}
finally
{
    if (!ELPLogging.isFatal()) 
	{    // if fatal then return code already filled in
        aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
        aa.env.setValue("ScriptReturnCode","0");
        if (ELPLogging.getErrorCount() > 0) 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSIRARE_INTAKE completed with " + ELPLogging.getErrorCount() + " errors.");                    
        }
		else 
		{
            aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSIRARE_INTAKE completed with no errors.");            
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
    aa.env.setValue("batchApplicationResult", JSON.stringify(batchAppResultObj));
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
	var emseDupCheckParameters = { "socSecNumber": queryResult.socSecNumber , "boardCode":queryResult.boardCode, "typeClass":queryResult.typeClass, "licenseNumber":queryResult.licenseNumber, "rowNumber":queryResult.rowNumber};
	
	var duplicateCheckResult = callToStoredProcedure(emseDupCheckParameters, "duplicateRecordCheck");
	duplicateFlag = duplicateCheckResult.duplicateFlag;
	ELPLogging.debug("Duplicate record flag = "+duplicateFlag);
	
	return duplicateFlag;
}

/**
* @desc This method is processing staging record based on board code. 
* 1) For RE board : Perform Application record validation [SSN, Phone number, address, license number]
*	    		  If validation is successful then create Application record,
*				  license record, reference license record, license professional in the Accela system. 
*				  Add Application record to the monthly payment set. When validation fails, record 
*				  will be inserted into error table, delete from staging table
*			  	  and email will be triggered for any erroneous record.
* 2) For RA board : Validation will performed for required fields and license number and license expiration
*				date. If validation is successful then it will create license record, reference license
*				record, license	professional in the Accela system. Add the application record into 
*				the monthly payment set. When validation fails, record will be inserted into error 
*				table and email will be triggered for any erroneous record. 
 * @param queryResult
 * @return {validationFlag} boolean value
 */
function EvaluateStgRecord(queryResult)
{
	ELPLogging.debug("Evaluating staging record for board code : " +queryResult.boardCode);
	//Local variable declaration
	var validationFlag = true;
	
	// Processing the record based on board code [RA or RE] 
	switch (String(queryResult.boardCode)) 
	{
		case 'RE':
		{
			if(validateREForReqdFields(queryResult))
			{
				ELPLogging.debug("Required field validation is successful for row number : " +queryResult.rowNumber);
				
				//Combination of board code and type class to retrieve application configuration information from
				//"INTERFACE_CAP_TYPE" standard choice
				var boardTypeClass = queryResult.boardCode+ "-" +queryResult.typeClass;
				ELPLogging.debug("board code and Type class is  : " +boardTypeClass);
				
				//Application configuration is License/Real Estate/Broker/Application
				var appConfigInfo = getSharedDropDownDescriptionDetails(boardTypeClass, "INTERFACE_CAP_TYPE");
				ELPLogging.debug("Application configuration information : " +appConfigInfo);
				
				//Separating group, type, sub type and category from License/Real Estate/Broker/Application 
				var scanner = new Scanner(appConfigInfo, "/");
				var group = scanner.next();
				var type = scanner.next();
				var subType = scanner.next();
				var category = scanner.next();
				
				// Creating key value to load the masking, sequence number and expiration code information from view (ELP_VW_LICENSE_CONFIG_DPL)
				var capTypeAlias = type + " " + subType;
			
				//Performing validation for SSN
				var SSNValidationArray = validateSSN(queryResult.socSecNumber);
				ELPLogging.debug("SSN validation flag = " +SSNValidationArray.validationFlag);
				
				//Address validation 
				var contactAddressDetailsArray = new Array();
								
				if(queryResult.zipCodeB != null)
				{
					var zip = queryResult.zipCodeA+"-"+queryResult.zipCodeB;
				}
				else
				{
					var zip = queryResult.zipCodeA;
				}
				
				var addressLine1="";
				if (queryResult.buildingNum != null)
				{
					addressLine1 = queryResult.buildingNum + " " + queryResult.addressLine1;
				}
				else
				{
					addressLine1 = queryResult.addressLine1;
				}
				
				
				var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PSI-RARE ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
				if(isEnabledAddressValidation.toLowerCase()=='true')
				{
					ELPLogging.debug("Start Address Validation");
					contactAddressDetailsArray = validateAddress(addressLine1, queryResult.addressLine2, queryResult.city, queryResult.state, zip, queryResult.buildingNum, COUNTRY_CODE, queryResult.serviceProvoiderCode, SOURCE_NAME);
				}
				else
				{
					contactAddressDetailsArray.addressLine1 = addressLine1;
					contactAddressDetailsArray.addressLine2 = queryResult.addressLine2;
					contactAddressDetailsArray.city = queryResult.city;
					contactAddressDetailsArray.state = queryResult.state;
					contactAddressDetailsArray.zipCodeB = queryResult.zipCodeB
					contactAddressDetailsArray.zipCodeA = queryResult.zipCodeA;
				}
				
				//validation check for address, SSN and phone number
				if(contactAddressDetailsArray && (SSNValidationArray.validationFlag == true) &&(validatePhoneNumber(queryResult.primaryPhone)))
				{	
					//Performing validation for license number
					var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo)
					ELPLogging.debug("license validation result : " +licenseValidationArray.validationResult);
					
					//Validation check for license number
					//Fix for PROD Defect 7500 : interface showing wrong expiration date error when the expiration date send by vendor is correct. Expiration date validation has been removed as per the boards confirmation.
					if(licenseValidationArray.validationResult == true)
					{
						ELPLogging.debug("All validations are successful for RE board.");
						
						//Creating Application record
						var capId = createApplicationRecord(queryResult, group, type, subType, category, contactAddressDetailsArray);
						ELPLogging.debug("Application record # " +capId+ " has been created successfully ");
						
						//Record exam information on Application record
						getExamDetailsForREBoard(capId);
					
						/*****   Updating ASI values on the Application record starts   *****/
						updateASIandASITofREBoardForAppRecord(queryResult, capId);					
						/*****   Updating ASI values on the Application record Ends   *****/
						
						//Add fee on Application record
						feeOnApplicationRecord(capId, 2);
						
						//Updating EXAM VENDOR CASH INFO ASIT on Application record
						if((String(queryResult.noFeeCollected) != "1") && (String(queryResult.noFeeCollected) != "2") && (String(queryResult.noFeeCollected) != "3"))
						{
							updateExamVendorCashInfo(capId);
						}
						
						
						//Add condition on reference contact for invalid SSN for regular expression
						ELPLogging.debug("Condition on reference contact for SSN flag : " +SSNValidationArray.conditionFlag);
						if(SSNValidationArray.conditionFlag == true) 
						{
							ELPLogging.debug("Add condition on reference contact for invalid SSN.");
							var conditionComment = "First Name : " +queryResult.firstName+ ", Last Name : " + queryResult.lastName;
							//add condition on reference contact
							addContactStdConditionOnRefContact(CONDITION_TYPE, INVALID_SSN_CONDITION_DESC, conditionComment, capId);
							
							//Log entry to error table for invalid SSN							
							var recordID;
							//Fix for PROD Defect 7497 : error log entries have no way to map to source file
							if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid SSN number.";
							
							//Log entry to error table for invalid SSN
							updateErrorTable(recordID, errorDescription);
						}
						
						//Check if license record already exists in Accela system
						if(licenseData.checkLicenseNumber(queryResult, capId))
						{
							//Creating license record for Application record
							ELPLogging.debug("Creating license record for Application # " +capId);
							var newLicID = licenseData.issueLicense(capId, queryResult); 
							ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system." );
							
							/*****   Updating ASI values on the Application record starts   *****/
							updateASIandASITForREBoardOnLicRecord(queryResult, newLicID);
							/*****   Updating ASI values on the Application record Ends   *****/
							
							//Add license fee on Application record
							feeOnApplicationRecord(capId, 3);
							
							//Add a condition - License record resent by exam vendor on ref license for input license
							//number is less than the next sequence number	
							ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
							if(licenseValidationArray.resendFlag == true)
							{
								ELPLogging.debug("Add a condition - License record resent by exam vendor on ref license.");
								addResendConditionOnLicenseRecord(newLicID);
							}
							
							/***************** Related Salesperson license processing starts*******************/
							
							/*	1.	finding related Salesperson license associated with contact.
								2.	Update work flow status as UPGRADED.
								3.	Set the related license professional status as Inactive
								4.	Set Salesperson license status to close.
								5.	If the salesperson license has an active Renewal record, then set the renewal status of the license record as pending.
							*/	
							
							if(queryResult.typeClass == BROKER_TYPE_CLASS)
							{
								retrieveSalespersonLicense(newLicID);
							}
							
							/***************** Related Salesperson license processing End*******************/
							
							//Creating and adding Application record to monthly payment set
							createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
						}
						else
						{
							ELPLogging.debug("License record is already exists in Accela system.");						
							var recordID;
							//Fix for PROD Defect 7497 :  error log entries have no way to map to source file
							if((queryResult.firstName != null) && (queryResult.lastName != null))
							{
								recordID = queryResult.firstName+ " " +queryResult.lastName;
							}
							else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
							{
								recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
							
							updateErrorTable(recordID, errorDescription);
							
							//Delete record from staging table
							var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
							deleteStgRecord(emseDeleteParameters);
						}
						
					}
					else if (licenseValidationArray.validationResult == false) 
					{
						ELPLogging.debug("Validation for license number failed."); 
						validationFlag = false;
						var recordID;
						
						//Fix for PROD Defect 7497 :  error log entries have no way to map to source file
						if((queryResult.firstName != null) && (queryResult.lastName != null))
						{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
						}
						else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
						{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
						}
						
						var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
						
						//Insert record in error table
						updateErrorTable(recordID, errorDescription); 
						//Delete record from staging table
						var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
						deleteStgRecord(emseDeleteParameters);
					}
				}
				else
				{
					//insert record into error log and delete it from staging table
					ELPLogging.debug("Validation for phone number OR SSN OR Address failed.");
					validationFlag = false;
					var recordID;
				
					//Fix for PROD Defect 7497 : error log entries have no way to map to source file
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
					{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
					}
					
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | SSN contains alpha characters or invalid phone number = "+queryResult.primaryPhone+" or Address validation failed.";
					
					//Insert record in error table
					updateErrorTable(recordID, errorDescription);
					
					//Delete record from staging table
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
				}
			}
			else
			{
				//Insert record into error log and delete it from staging table
				ELPLogging.debug("Missing required fields for RE board record.");
				validationFlag = false;
				var recordID;
				
				//Fix for PROD Defect 7497 : error log entries have no way to map to source file
				if((queryResult.firstName != null) && (queryResult.lastName != null))
				{
					recordID = queryResult.firstName+ " " +queryResult.lastName;
				}
				else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
				{
					recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
				}

				var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | PSI-RARE record missing required fields - boardCode, licenseNumber, typeClass, socSecNumber, firstName, lastName, cashNumber, cashDate, licIssueDate, licExpiryDate, addressLine1, city, state, zipCodeA, dateOfBirth, examDate, writtenScore1, writtenScore2, scoreIndicator ,serialNumber ";
				
				//Insert record in error table
				updateErrorTable(recordID, errorDescription);
				
				//Delete record from the staging table
				var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
				deleteStgRecord(emseDeleteParameters);
			}
			break;
		}
		case "RA":
		{
			//Perform validation for required fields
			if(validateRAForReqdFields(queryResult))
			{	
				//Retrieve record ID from Accela system.
				var capListResult = aa.cap.getCapID(queryResult.recordID); 
				
				if (capListResult.getSuccess())
				{ 
					var capId = capListResult.getOutput();
					ELPLogging.debug("capId retrieved from Accela # " +capId);
					
					//Record exam information on Application record
					getExamDetailsForRABoard(capId);
					
					//Add fee on Application record
					feeOnApplicationRecord(capId, 3);
					
					//Updating EXAM VENDOR CASH INFO ASIT on Application record
					if((queryResult.noFeeCollected != "1") || (queryResult.noFeeCollected != 2) || (queryResult.noFeeCollected != 3))
					{
						/*****   Updating ASI values on the Application record starts   *****/
						updateASIandASITofRABoardForAppRecord(queryResult, capId);					
						/*****   Updating ASI values on the Application record Ends   *****/
					}
					
					
					var capModelResult = aa.cap.getCap(capId);
					
					if (capModelResult.getSuccess()) 
					{
						var capModel = capModelResult.getOutput();		
						var appConfigInfo = capModel.capType;
						appConfigInfo = appConfigInfo.toString();
						ELPLogging.debug("Application configuration information for RA board : " +appConfigInfo);
						
						var scanner = new Scanner(appConfigInfo, "/");
						var group = scanner.next();
						var type = scanner.next();
						var subType = scanner.next();
						var category = scanner.next();
						
						// Creating key value to load the masking, sequence number and expiration code information from view (ELP_VW_LICENSE_CONFIG_DPL)
						var capTypeAlias = type + " " + subType;
						
						//Performing validation for license number
						var licenseValidationArray = licenseData.validateLicenseNumber(queryResult, appConfigInfo);
						ELPLogging.debug("license number validation result : " +licenseValidationArray.validationResult);
					
						//Validation check for license number
						//Fix for PROD Defect 7500 : interface showing wrong expiration date error when the expiration date send by vendor is correct. Expiration date validation has been removed as per the boards confirmation.
						if(licenseValidationArray.validationResult == true)
						{
							ELPLogging.debug("All validations are successful for RA board.");
							
							//Check if license record already exists in Accela system
							if(licenseData.checkLicenseNumber(queryResult, capId))
							{
								ELPLogging.debug("Creating license record for Application # " +capId);
								
								//Creating license record for Application record
								var newLicID = licenseData.issueLicense(capId, queryResult);
								ELPLogging.debug("New license # "+newLicID +" successfully created in Accela system for RA board." );
								
								/*****   Updating ASI values on the Application record starts   *****/
								updateASIandASITForRABoardOnLicRecord(queryResult, newLicID);
								/*****   Updating ASI values on the Application record Ends   *****/
								ELPLogging.debug("Updating Type Class on record : "+newLicID);
								updateASIValues(newLicID, "TYPE CLASS", "Type Class", getTypeClassForRABoard(capId));
							
								//Add a condition - License record resend by exam vendor on ref license for input license
								//number is less than the next sequence number
								ELPLogging.debug("License record resend flag : " +licenseValidationArray.resendFlag);
								
								if(licenseValidationArray.resendFlag == true)
								{
									ELPLogging.debug("Add a condition - License record resend by exam vendor on ref license");
									
									addResendConditionOnLicenseRecord(newLicID);
								}
								
								//Creating and adding Application record to monthly payment set
								createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
							}
							else
							{
								ELPLogging.debug("License record is already exists in Accela system.");
								//Fix for PROD Defect 7497 : error log entries have no way to map to source file
								var recordID;
								if(queryResult.recordID != null)
								{
									recordID = queryResult.recordID;
								}
								else
								{
									if((queryResult.firstName != null) && (queryResult.lastName != null))
									{
										recordID = queryResult.firstName+ " " +queryResult.lastName;
									}
									else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
									{
										recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
									}
								}
								
								var errorDescription =  "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | License record "+queryResult.licenseNumber+"-"+queryResult.boardCode+"-"+queryResult.typeClass +" is already exists in Accela system.";
								
								updateErrorTable(recordID, errorDescription);
								
								//Delete record from staging table
								var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
								deleteStgRecord(emseDeleteParameters);
							
							}
						}
						else if(licenseValidationArray.validationResult == false) 
						{
							ELPLogging.debug("Validation for license number failed."); 
							validationFlag = false;
							
							//Add record to error table
							//Fix for PROD Defect 7497 : error log entries have no way to map to source file
							var recordID;
							if(queryResult.recordID != null)
							{
								recordID = queryResult.recordID;
							}
							else
							{
								if((queryResult.firstName != null) && (queryResult.lastName != null))
								{
									recordID = queryResult.firstName+ " " +queryResult.lastName;
								}
								else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
								{
									recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
								}
							}
							
							var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid license number = " +queryResult.licenseNumber;
							
							updateErrorTable(recordID, errorDescription);
							
							//Delete record from staging table
							var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
							deleteStgRecord(emseDeleteParameters);
							
							//Creating and adding Application record to monthly payment set
							createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
						}
					}
				} 
				else
				{
					ELPLogging.debug("Invalid record ID "+queryResult.recordID +" found.");
					validationFlag = false;
					
					//Add record to error table
					var recordID;
					if(queryResult.recordID != null)
					{
						recordID = queryResult.recordID;
					}
					else
					{
						if((queryResult.firstName != null) && (queryResult.lastName != null))
						{
							recordID = queryResult.firstName+ " " +queryResult.lastName;
						}
						else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
						{
							recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
						}
					}
					
					var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid record ID "+queryResult.recordID +" found.";
					
					updateErrorTable(recordID, errorDescription);
					
					//Delete record from staging table
					var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
					deleteStgRecord(emseDeleteParameters);
				}
			}
			else
			{
				ELPLogging.debug("Record missing required fields for RA board.");
				validationFlag = false;
				
				if(queryResult.recordID != null)
				{
					//Get cap ID from record ID
					var capListResult = aa.cap.getCapID(queryResult.recordID); 
				
					if (capListResult.getSuccess())
					{ 
						var capId = capListResult.getOutput();
						ELPLogging.debug("capId retrieved from Accela # " +capId);
						
						//Creating and adding Application record to monthly payment set
						createAndUpdateMonthlyPaymentSetForApplicationRecord(queryResult, VENDOR, capId);
					}
				}		
				
				//Add record to error table
				//Fix for PROD Defect 7497 : error log entries have no way to map to source file
				var recordID;
				if(queryResult.recordID != null)
				{
					recordID = queryResult.recordID;
				}
				else
				{
					if((queryResult.firstName != null) && (queryResult.lastName != null))
					{
						recordID = queryResult.firstName+ " " +queryResult.lastName;
					}
					else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
					{
						recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
					}
				}
				
				var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | PSI-RARE record missing one or more required fields - recordID, boardCode, licenseNumber, typeClass, socSecNumber, firstName, lastName, cashNumber, cashDate, licIssueDate, licExpiryDate, addressLine1, city, state, zipCodeA, dateOfBirth, examDate, writtenScore1, reciprocity, serialNumber, applicationNo.";
				
				updateErrorTable(recordID, errorDescription);
				
				//Delete record from staging table
				var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
				deleteStgRecord(emseDeleteParameters);
			}
		 break;	
		}
		default:
			ELPLogging.notify("Invalid board code found.");
			validationFlag = false;
			
			//Add record to error table			
			var recordID;
			//Fix for PROD Defect 7497 : error log entries have no way to map to source file
			if((queryResult.firstName != null) && (queryResult.lastName != null))
			{
				recordID = queryResult.firstName+ " " +queryResult.lastName;
			}
			else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
			{
				recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
			}
			
			var errorDescription = "Board Code : "+queryResult.boardCode+" | File Name : "+fileName+" | Invalid board code found.";
			updateErrorTable(recordID, errorDescription);
			
			//Delete record from the staging table
			var emseDeleteParameters = {"rowNumber" : queryResult.rowNumber};
			deleteStgRecord(emseDeleteParameters);			
		break;
	}
	
	return validationFlag;
}

/**
 * @desc This method is performing validation for required fields for RE board.
 * @param {queryResult} contains query result from staging table.
 * @returns {boolean} - boolean value
 */
function validateREForReqdFields(queryResult) 
{
	ELPLogging.debug("Performing validations for required fields for RE board.");
	var addrLine1 = queryResult.buildingNum + " " + queryResult.addressLine1;
	if (queryResult.boardCode == null ||
		queryResult.boardCode.trim().length == 0 ||
		queryResult.licenseNumber == null || 
		queryResult.licenseNumber.trim().length == 0 ||
		queryResult.typeClass == null || 
		queryResult.typeClass.trim().length == 0 ||
		queryResult.socSecNumber == null ||
		queryResult.socSecNumber.trim().length != 9 ||	
		queryResult.firstName == null ||
		queryResult.firstName.trim().length == 0 ||
		queryResult.lastName == null ||
		queryResult.lastName.trim().length == 0 ||
		queryResult.cashNumber == null ||
		queryResult.cashNumber.trim().length != 6 ||
		queryResult.cashDate == null ||
		queryResult.licIssueDate == null ||
		queryResult.licExpiryDate == null ||
		addrLine1 == null ||
		addrLine1.trim().length == 0 ||
		queryResult.city == null ||
		queryResult.city.trim().length == 0 ||
		queryResult.state == null ||
		queryResult.state.trim().length == 0 ||
		queryResult.zipCodeA == null ||
		queryResult.zipCodeA.trim().length == 0 ||
		queryResult.dateOfBirth == null ||
		queryResult.examDate == null ||
		queryResult.writtenScore1 == null ||
		queryResult.writtenScore2 == null ||
		queryResult.scoreIndicator == null ||
		queryResult.scoreIndicator.trim().length == 0 ||
		queryResult.serialNumber == null ||
		queryResult.serialNumber.trim().length == 0) 
	{
		return false;
	} 
	else
	{
		return true;
	}
}

/**
 * @desc This method is performing validation for required fields for RA board.
 * @param {queryResult} contains query result from staging table.
 * @returns {boolean} - boolean value
 */
function validateRAForReqdFields(queryResult) 
{
	ELPLogging.debug("Performing validations for required fields for RA board.");
	var addrLine1 = queryResult.buildingNum + " " + queryResult.addressLine1;
	if (queryResult.recordID == null ||
		queryResult.recordID.trim().length == 0 ||
		queryResult.boardCode == null ||
		queryResult.boardCode.trim().length == 0 ||
		queryResult.licenseNumber == null || 
		queryResult.licenseNumber.trim().length == 0 ||
		queryResult.typeClass == null || 
		queryResult.typeClass.trim().length == 0 ||
		queryResult.socSecNumber == null ||
		queryResult.socSecNumber.trim().length != 9 ||	
		queryResult.firstName == null ||
		queryResult.firstName.trim().length == 0 ||
		queryResult.lastName == null ||
		queryResult.lastName.trim().length == 0 ||
		queryResult.cashNumber == null ||
		queryResult.cashNumber.trim().length != 6 ||
		queryResult.cashDate == null ||
		queryResult.licIssueDate == null ||
		queryResult.licExpiryDate == null ||
		addrLine1 == null ||
		addrLine1.trim().length == 0 ||
		queryResult.city == null ||
		queryResult.city.trim().length == 0 ||
		queryResult.state == null ||
		queryResult.state.trim().length == 0 ||
		queryResult.zipCodeA == null ||
		queryResult.zipCodeA.trim().length == 0 ||
		queryResult.dateOfBirth == null ||
		queryResult.examDate == null ||
		queryResult.writtenScore1 == null ||
		queryResult.serialNumber == null ||
		queryResult.serialNumber.trim().length == 0 ||
		queryResult.applicationNo == null ||				
		queryResult.applicationNo.trim().length == 0) 
	{
		return false;
	} 
	else
	{
		return true;
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
	
	createCapContactForRecord(capIDModel, queryResult, contactAddressDetailsArray);
	ELPLogging.debug("Successfully cap contact created ");
		
	//Create the Premise address            
	/* createPremiseAddress(capIDModel, queryResult);	
	ELPLogging.debug("Successfully created Premise address for record ID : " +capIDModel); */
	
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
	var preffComm = 0;
	var contactType = "Applicant";
	
	if(queryResult.prefferedComm != null)
	{
		if (queryResult.prefferedComm.toUpperCase() == "EMAIL")
		{
			preffComm = 1;
		}
		else
		{
			preffComm = 0;
		}
		ELPLogging.debug("preff comm : " +preffComm);
	}
	
	
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
		/* Fix for defect #5350 */
		var ssn = formatSSN(queryResult.socSecNumber);
		peopleModel.setSocialSecurityNumber(ssn);
		peopleModel.setServiceProviderCode(queryResult.serviceProviderCode);
        peopleModel.setPhone1(queryResult.primaryPhone);
        peopleModel.setEmail(queryResult.emailID);
        peopleModel.setBusinessName(queryResult.businessName);
        peopleModel.setAuditStatus("A");
        peopleModel.setStartDate(new java.util.Date());
        peopleModel.setAuditID("BATCHUSER");
        peopleModel.setPreferredChannel(preffComm);
        capContactModel.setPeople(peopleModel);
       
		capContactModel.setBirthDate(queryResult.dateOfBirth);
		capContactModel.setNamesuffix(queryResult.generation);
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
		// parameters.batchInterfaceName = "ELP.PSI.RARE.INTAKE";
		// errorReportProcedure.prepareStatement();
		// var inputParameters = errorReportProcedure.prepareParameters(null,null,parameters);
		// ELPLogging.debug("InputParameters for errorReportProcedure: ", inputParameters);
		
		// errorReportProcedure.setParameters(inputParameters);
		// var dataSet = errorReportProcedure.queryProcedure();

		// POC
		var parameters = {
            "runDate": runDate,
            "batchInterfaceName": "ELP.PSI.RARE.INTAKE",
            "tableName": "ELP_VW_PSI_ERROR"
        };
        var dataSet = getErrorReportRecords(errorReportProcedure, parameters);

		ELPLogging.debug("*** Finished getErrorReportRecords() ***");
		
		// loop through all license configuration records
		var licenseConfiguration = null;
		var emailBodyRE = [];
		var emailBodyRA = [];
		
		var boardCode = null;
		var firstLine = "The following are input errors in the PSI Intake File that prevented processing of that application.";
		emailBodyRE.push(firstLine);
		emailBodyRA.push(firstLine);		
		
		var emailAddressCodeRE = "PSI ERRORS-RE";
		var emailAddressCodeRA = "PSI ERRORS-RA";
		
		var flagRE = false;
		var flagRA = false;
		ELPLogging.debug("runDate  : " + runDate);
		
		while ((errorData = dataSet.next()) != null)
		{
			var processingDateS = errorData.runDate.toDateString();			
			
			var errorLine = errorData.errorDescription;
			
			var scanner = new Scanner(errorLine, ":");
			
			var boardCode = scanner.next();
			var errorMessage = scanner.next();
			
			ELPLogging.debug ( " Board : " +boardCode + " errorMessage : " +errorMessage );
			
			var errorLine = processingDateS + ":" + errorData.recordID + ":	" + errorMessage;
			
			if (boardCode == "RE")
			{
				emailBodyRE.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagRE = true;
			}
			else
			{
				emailBodyRA.push(errorLine);
				ELPLogging.debug("errorLine : " +errorLine);
				flagRA = true;
			}
			
			ELPLogging.debug(errorLine);
		}
			
		if (flagRE)
		{
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeRE, "Batch PSI-RARE File Errors", emailBodyRE);
		}
		
		if (flagRA)
		{
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeRA, "Batch PSI-RARE File Errors", emailBodyRA);
		}
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

/***************************   Salesperson license record processing starts     **********************************/

/**
 * @desc This method retrieve salesperson license associated with the reference contact of the new license.
 * @param {newLicID} newLicID - contains the capID of the new license record.
 */
function retrieveSalespersonLicense(newLicID)
{
	ELPLogging.debug("Retrieve salesperson license associated with record : " +newLicID);
	
	//Retrieve contact sequence number
	var socialSecurityNumber = getSocialSecurityNumber(newLicID);
	ELPLogging.debug("Social security number for salesperson license record  = " +socialSecurityNumber);
	
	//Retrieving record ID from the social security number
	retrieveCapIDfromPPLModel(socialSecurityNumber);
	
	ELPLogging.debug("Processing for Salesperson person license associated with contact is completed.");
}

/**
 * @desc This method retrieve social security number of the record.
 * @param {capIDModel} capIDModel - contains the record ID.
 */
function getSocialSecurityNumber(capIDModel)
{
	ELPLogging.debug("Retrieve social security number for record : " +capIDModel);
	//Local variable declaration
	var socialSecurityNumber = null;
	
	//This method retrieves contact details	
	var capContactResult = aa.people.getCapContactByCapID(capIDModel);
	if(capContactResult.getSuccess())
	{
		var capContactArray = capContactResult.getOutput();
	
		if(capContactArray)
		{
			for(capContactIndex in capContactArray)
			{
				//Get social security number
				socialSecurityNumber = capContactArray[capContactIndex].getPeople().getSocialSecurityNumber();
			}
		}
	}
	return socialSecurityNumber;
}

/**
 * @desc This method retrieve record ID of the salesperson license from social security number.
 * @param {socialSecurityNumber} socialSecurityNumber - contains the contact sequence number.
 */
function retrieveCapIDfromPPLModel(socialSecurityNumber)
{
	ELPLogging.debug(" Retrieving record ID from Social security number : " +socialSecurityNumber);
	//Local variable declaration
	var licDetailsArray = new Array();
	var capID;
	var altID;
	
	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode("DPL");
	peopleScriptModel.setContactType("Licensed Individual");
	peopleScriptModel.setSocialSecurityNumber(socialSecurityNumber);

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if(peopleResult.getSuccess())
	{
		var capIDScriptModel = peopleResult.getOutput();
		
		for(index in capIDScriptModel)
		{
			capID = capIDScriptModel[index].getCapID();	
			capID = aa.cap.getCapID(capID.getID1(),capID.getID2(),capID.getID3()).getOutput();
			
			//Adding ALTID and capID to licDetailsArray
			licDetailsArray.altID = capID.getCustomID();
			licDetailsArray.capID = capID;
			
			//Retrieving record details from licDetailsArray
			retrieveCapDetailsAndProcessSalespersonLicense(licDetailsArray);
		}
		
	}
	else
	{	
		ELPLogging.debug("WARNING: error searching for people : " + peopleResult.getErrorMessage());
	}
}

/**
 * @desc This method update salesperson license task status to Upgraded and close the salesperson license record. 
 * Also renewal record associated with the salesperson license. If found then update renewal status to pending.
 * @param {licDetailsArray} licDetailsArray - contains altID and capID.
 */
function retrieveCapDetailsAndProcessSalespersonLicense(licDetailsArray)
{
	ELPLogging.debug("Retrieve cap details for record : " +licDetailsArray.capID);
	//Local variable declaration
	var WFNAME_LICENSE = "License";
	var WFSTATUS_UPGRADED = "Upgraded";
	var REF_LICENSE_INACTIVE = "Inactive";
	var APP_STATUS_CLOSE = "close";
	var RENEWAL_STATUS_PENDING = "pending";
	var SALESPERSON_LICENSE_CONFIGURATION = "License/Real Estate/Salesperson/License";
	var capId = licDetailsArray.capID;
	
	var capModelResult = aa.cap.getCap(capId);
	if(capModelResult.getSuccess())
	{
		var capScriptModel = capModelResult.getOutput();
		var capType = capScriptModel.getCapType();
		
		if(capType == SALESPERSON_LICENSE_CONFIGURATION)
		{
			ELPLogging.debug("Cap type is : " +capType);
			ELPLogging.debug("Salesperson license found.");
			
			//Update work flow task status to UPGRADED
			ELPLogging.debug("Updating work flow task status to Upgraded for record ID # " +capId);
			updateTaskStatus(WFNAME_LICENSE, WFSTATUS_UPGRADED, "", "", "", capId);
			
			//Retrieve reference license associated with the record ID and set status to "Inactive".
			var salespersonLP = getRefLicenseProfForSalesperson(licDetailsArray.altID);
			ELPLogging.debug("Reference license number : " +salespersonLP);
			
			if (salespersonLP)
			{
				ELPLogging.debug("Salesperson reference license found.");
				
				salespersonLP.setPolicy(REF_LICENSE_INACTIVE);
				//Fix for PROD Defect 7146 : DPL_real estate broker - license not showing up online
				salespersonLP.setWcExempt("N");
				var myResult = aa.licenseScript.editRefLicenseProf(salespersonLP);
				if(myResult.getSuccess())
				{
					ELPLogging.debug("Successfully added/updated License No. " + salespersonLP.getStateLicense() + ", License Board: " + salespersonLP.getLicenseBoard() + ", Type: " + salespersonLP.getLicenseType());
					//refLicFlag = true;
				}
				else
				{
					ELPLogging.debug("**ERROR: can't edit reference license professional status to Inactive : " + myResult.getErrorMessage());
				}
			}
			
			//Fix for PROD defect 7416 : DPL_real estate broker - license not showing up online
			//Adding salesperson license to License Sync set
			ELPLogging.debug("Adding salesperson license to License Sync set = "+capId);
			addToLicenseSyncSet(capId);
				
			//Update Salesperson license status to "close"
			ELPLogging.debug("Updating record status to Close.");
			updateAppStatus(APP_STATUS_CLOSE, "", capId);
			
			//Check for Active Renewal record
			var renewalRecordID = checkRenewalRecord(capId);
			
			if(renewalRecordID)
			{
				ELPLogging.debug("Updating record status to pending.");
				updateAppStatus(RENEWAL_STATUS_PENDING, "", renewalRecordID);
			}	
		}
	}
	else
	{
		ELPLogging.debug("ERROR  : " + capModelResult.getErrorMessage());
	}
}

/**
 * @desc This method retrieve reference license professional associated with the altID.
 * @param {altID} altID - contains altID from accela system.
 */
function getRefLicenseProfForSalesperson(altID)
{
	ELPLogging.debug("Retrieve reference license professional for ALT ID : " +altID);
	//Local variable declaration
	var licNumberArray = altID.split("-");
	var licenseNumber = licNumberArray[0];
	var boardName = licNumberArray[1];
	var licenseType = licNumberArray[2];
	var refLicObj = null;
	
	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr("DPL", licenseNumber);
	
	if(refLicenseResult.getSuccess())
	{
		var newLicArray = refLicenseResult.getOutput();
		ELPLogging.debug("List of Reference Licenses : " +newLicArray);
		
		if (newLicArray == null) 
		{	
			ELPLogging.debug("List of Reference Licenses is null. ");
			return null;
		}
		for (var thisLic in newLicArray)  
		{
			ELPLogging.debug("Reference license professional Number : " + newLicArray[thisLic].getStateLicense());
			refLicObj = newLicArray[thisLic];
		}
	}
	else
	{
		ELPLogging.debug("**ERROR retrieving Reference License Professional : " + refLicenseResult.getErrorMessage());
	}
	return refLicObj;
}

/**
 * @desc This method will check for Active renewal record.
 * @param {tempCapID} tempCapID - contains record ID of the renewal record.
 */
function checkRenewalRecord(tempCapID)
{
	ELPLogging.debug("check Renewal Record : " +tempCapID);
	//Local variable declaration
	var CATEGORY = "Renewal";
	var renewalRecordID = null;
    var capArray =  new Array();
	
	var childRecordsResult = aa.cap.getProjectByMasterID(tempCapID, CATEGORY, "Incomplete");
	if(childRecordsResult.getSuccess())
    {
		ELPLogging.debug("Child record found");
		var childRecordslist = childRecordsResult.getOutput(); 
		if(childRecordslist)
		{
			for (counter in childRecordslist)
			{
				capArray[counter] = childRecordslist[counter].getCapID();
			}
			
			if(capArray.length > 0)
			{
				ELPLogging.debug("Get latest Renewal record");
				//Get Latest Renewal record
				var latestRenewalRec = null;
				var latestRenewalRecDate = null;
				
				for (thisCapCounter in capArray)
				{
					ELPLogging.debug("this Cap Counter length : " +thisCapCounter);
					ELPLogging.debug("latestRenewalRec = "+latestRenewalRec);
					if(!latestRenewalRec)
					{
						renewalRec = capArray[thisCapCounter];
						ELPLogging.debug("thisCap " + thisCapCounter + " renewalRec " +  renewalRec);
						
						var capModelResult = aa.cap.getCap(renewalRec).getOutput();   
						var recordStatus = capModelResult.getCapStatus();
						ELPLogging.debug("recordStatus = "+recordStatus);
						
						//Fix for PROD Defect 7146 : DPL_real estate broker - license not showing up online
						if(recordStatus != "Closed")
						{
							latestRenewalRec = renewalRec;
							latestRenewalRecDate = capModelResult.getFileDate();
							var latestRenewalDate = new Date(latestRenewalRecDate.getMonth()+"/"+latestRenewalRecDate.getDayOfMonth()+"/"+latestRenewalRecDate.getYear());
						}
					}
					else
					{
						var tempCapID = capArray[thisCapCounter];
						var capModelResult = aa.cap.getCap(tempCapID).getOutput();  
						var tempDate = capModelResult.getFileDate();
						var newLicDate = new Date(tempDate.getMonth()+"/"+tempDate.getDayOfMonth()+"/"+tempDate.getYear());
						ELPLogging.debug("newLicDate : "+newLicDate +" ## "+"latestRenewalDate: "+latestRenewalDate);
						if((newLicDate > latestRenewalDate) == 1)
						{
							latestRenewalDate = newLicDate;
							latestRenewalRec = tempCapID;
							ELPLogging.debug("latestRenewalRec = "+latestRenewalRec);
						}
					}
				}
				renewalRecordID = latestRenewalRec;
				ELPLogging.debug("renewalRecordID : " +renewalRecordID);
			}
		}
		else
		{
			ELPLogging.debug("child Records list is null");
		}
	}
	else
	{
		ELPLogging.debug("No child record found.");
	}
	return renewalRecordID;
}

/***************************   Salesperson license record processing Ends     **********************************/

/***************************   Exam information mapping starts    *********************************************/
/**
 * @desc This method retrieve exam information and based on written score1 and 2, it will create Exam record for
 * the Application record.
 * @param {capId} Cap ID - contains record ID.
 */
function getExamDetailsForREBoard(capId)
{
	ELPLogging.debug("Retrieving Exam information for Application record : " +capId);
	var examType = null;
	var writtenScore = null;
	ELPLogging.debug("Written Score1 : "+queryResult.writtenScore1);
	//Written score 1 is for National exam
	if(queryResult.writtenScore1 != null)
	{	
		examType = "NATIONAL";
		writtenScore = queryResult.writtenScore1;
		//Retrieve exam name
		var examName = getExamName(queryResult, examType);
		ELPLogging.debug("National Exam Name : " +examName);
		//Create exam record
		createExamRecord(queryResult, capId, examName, writtenScore);
	}
	//Written score 2 is for State exam
	if(queryResult.writtenScore2 != null)
	{
		examType = "STATE";
		writtenScore = queryResult.writtenScore2;
		//Retrieve exam name
		var examName = getExamName(queryResult, examType);
		ELPLogging.debug("State Exam Name : " +examName);
		//Create exam record
		createExamRecord(queryResult, capId, examName, writtenScore);
	}
}

/**
 * @desc This method retrieves exam details for RA board.
 * @param {capId} Cap ID - contains record ID.
 */
function getExamDetailsForRABoard(capId)
{
	ELPLogging.debug("Retrieving exam details for RA board Application : " +capId);
	//Local variable declaration
	var examName = null;
	var writtenScore = queryResult.writtenScore1;
	
	//This API retrieves ASI details on the record
	var asiDetailResult = aa.appSpecificInfo.getByCapID(capId); 

	if(asiDetailResult.getSuccess())
	{
		var asiDetailsModel = asiDetailResult.getOutput();
		if(asiDetailsModel)
		{
			for(ASI in asiDetailsModel)
			{
				if(asiDetailsModel[ASI].getFieldLabel() == "Please select application type")
				{
					var checklistComment = asiDetailsModel[ASI].getChecklistComment();
					
					if(checklistComment == "State-Certified General Real Estate Appraiser")
					{
						examName = "Certified General Exam";
					}
					else if(checklistComment == "State-Licensed Real Estate Appraisers")
					{
						examName = "State Licensed Exam";
					}
					
					ELPLogging.debug("Exam Name of RA board : " +examName);
					createExamRecord(queryResult, capId, examName, writtenScore);
				}
			}
		}	
	}
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
	var passingScore = null;
	var providerName = "PSI";
	
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
    examModel.setFinalScore(aa.util.parseDouble(writtenScore));
    
    // Update Exam Status based on final score
	if(queryResult.boardCode == "RE")
	{
		passingScore = RE_PASSING_SCORE;
	}
	else if(queryResult.boardCode == "RA")
	{
		passingScore = RA_PASSING_SCORE;
	}
	
	ELPLogging.debug("Passing Score : " +passingScore);
	
    if (writtenScore >= passingScore)
    {
        examModel.setExamStatus("PCOMPLETED");
		ELPLogging.debug("Exam is completed.");
    }
    else
    {
        examModel.setExamStatus("PENDING");
		ELPLogging.debug("Exam is pending.");
    }
    
    examModel.setPassingScore(passingScore);
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
 * @desc This Method takes the typeClass and return the corresponding Exam Name.
 * @param {queryResult} queryResult - contains the query result. 
 * @param {examType} examType - contains the exam type.
 */
function getExamName(queryResult, examType)
{
    var examName = null;
		
	// Creating 'BOARD CODE-TYPE CLASS-NATIONAL/STATE' key to get exam name.
	var examCode = queryResult.boardCode+ "-" + queryResult.typeClass+ "-" +examType;
	
	var STDCHOICE_EXAM_NAME = "EXAM_NAME_STD_CHOICE";
	
	// Load the exam name store in EXAM_NAME_STD_CHOICE standard choice.
	examName = getSharedDropDownDescriptionDetails(examCode, STDCHOICE_EXAM_NAME);
	ELPLogging.debug("Exam Name = " +examName);
	
    return examName;
}

/***************************   Exam information mapping Ends     ********************************************/

function updateASIandASITofRABoardForAppRecord(queryResult, capId)
{
	ELPLogging.debug("Updating ASI and ASIT on Application record : "+capId);
	var feeAmount = null;
	
	//Fix for defect 5486 : Retrieve Fee info
	feeAmount = retrieveFeeAmountFromApplicationRecordForRABoard(capId);
	
	var tableValuesArray = new Array();
	tableValuesArray["Cash Date"] = jsDateToMMDDYYYY(queryResult.cashDate);
	tableValuesArray["Cash Number"] = String(queryResult.cashNumber);
	tableValuesArray["Fee Type"] = String("A");
	tableValuesArray["Fee Amount"] = String(feeAmount);
	
	// Updating ASIT on application record.
	addASITValueToRecord("EXAM VENDOR CASH INFO", tableValuesArray, capId);
}

/**
 * @desc This method update ASI and ASIT [Military Status , Reciprocal State, Serial Number, Record ID, Issue Date, Reason  ] on RA board license record.
 * @param {capIDModel} capID Model - contains record ID.
 */
function updateASIandASITForRABoardOnLicRecord(queryResult, capIDModel)
{
	ELPLogging.debug("Updating ASI and ASIT on record : "+capIDModel);
	//Local variable declaration
	var noFeeCollected;
			
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A"
	}
	ELPLogging.debug("Military Status : " +noFeeCollected);
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);
	updateASIValues(capIDModel, "APPRAISER INFORMATION", "Reciprocal State", queryResult.reciprocity);	
}


/**
 * @desc This method update ASI and ASIT [Military Status , School Graduated, School Location, Course Completion Date, Cash Date, Cash Number,  Fee Type, Fee Amount  ] on RE board Application record.
 * @param {capIDModel} capID Model - contains record ID.
 */
function updateASIandASITofREBoardForAppRecord(queryResult, capIDModel)
{
	ELPLogging.debug("Updating ASI and ASIT on Application record : "+capIDModel);
	//Local variable declaration
	var noFeeCollected;
	var feeAmount = null;
			
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A"
	}
	ELPLogging.debug("No Fee Collected : " +noFeeCollected);
	
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);		

	var schoolGraduated = getSharedDropDownDescriptionDetails(queryResult.schoolGraduated, "RE_APPROVED_SCHOOLS");
	updateASIValues(capIDModel, "COURSE COMPLETION", "School Graduated", schoolGraduated);		
	updateASIValues(capIDModel, "COURSE COMPLETION", "School Location", queryResult.schoolLocation);
	
	var courseCompletionDate = queryResult.gradYr;
	updateASIValues(capIDModel, "COURSE COMPLETION", "Course Completion Date", courseCompletionDate);
}

/**
 * @desc This method update ASI and ASIT [Military Status , Serial Number, Record ID, Issue Date, Reason ] on RE board License record.
 * @param {capIDModel} capID Model - contains record ID.
 */
function updateASIandASITForREBoardOnLicRecord(queryResult, capIDModel)
{
	ELPLogging.debug("Updating ASI and ASIT on license record for RE board : "+capIDModel);
	//Local variable declaration
	var noFeeCollected;
			
	if (queryResult.noFeeCollected == "1")
	{
		noFeeCollected = "Active Duty";
	}
	else if(queryResult.noFeeCollected == "2")
	{
		noFeeCollected = "Veteran";
	}
	else if(queryResult.noFeeCollected == "3")
	{
		noFeeCollected = "Spouse";
	}
	else
	{
		noFeeCollected = "N/A"
	}
	ELPLogging.debug("No Fee Collected : " +noFeeCollected);
	updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollected);
	
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
 * @desc This method creates or update Application record monthly payment set
 * @param {queryResult} queryResult - contains query result from staging table.
 * @param {VENDOR} VENDOR - contains vendor name [PSI]. 
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
 * @desc This method adds condition - License record resend by exam vendor on license record
 * @param {newLicID} capId - contains record id.
 */
function addResendConditionOnLicenseRecord(newLicID)
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
	var errorDescription =  queryResult.boardCode +" : " +" License number resent by exam vendor.";
	
	var recordID = "";
	if(queryResult.boardCode == "RE")
	{
		//Fix for PROD Defect 7497 : error log entries have no way to map to source file
		if((queryResult.firstName != null) && (queryResult.lastName != null))
		{
			recordID = queryResult.firstName+ " " +queryResult.lastName;
		}
		else if((queryResult.licenseNumber != null) && (queryResult.boardCode != null) && (queryResult.typeClass != null))
		{
			recordID = queryResult.licenseNumber+ "-" +queryResult.boardCode+"-"+queryResult.typeClass;
		}
		
	}
	else if(queryResult.boardCode == "RA")
	{
		recordID = queryResult.recordID;
	}
	
	//Inserting record in the error table
	// Updated the error description for 7730 as per Paul comments
	var errorDescription = "License number : "+ queryResult.licenseNumber +" is less than the expected license sequence number.";
	updateErrorTable(recordID, errorDescription);
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
 * @desc This method retrieves fee amount on Application to update Fee Amount ASIT
 * @param {capIDModel} capId - contains Application record id.
 */
function retrieveFeeAmountFromApplicationRecordForRABoard(capIDModel)
{
	ELPLogging.debug("Retrieving Fee amount for Application record = "+capIDModel);
	var feeAmount = null;
	
	var feeItemScriptModel = aa.finance.getFeeItemByCapID(capIDModel).getOutput();
	for(index in feeItemScriptModel)
	{
		var feeCode = feeItemScriptModel[index].getFeeCod();
		
		if(feeCode == "RASA")
		{
			var feeAmount = feeItemScriptModel[index].getFee();
		}
	}

	return feeAmount;
}

/** 
 * @desc This method will update EXAM VENDOR CASH INFO on the record
 * @param {capId} capId - contains Application record id.
 */
function updateExamVendorCashInfo(capId)
{
	ELPLogging.debug("Updating exam cash vendor info ASIT for record ID = "+capId);
	//Fix for defect 5486 : Retrieve Fee info
	feeAmount = retrieveFeeAmountFromApplicationRecord(capId);
		
	var tableValuesArray = new Array();
	tableValuesArray["Cash Date"] = jsDateToMMDDYYYY(queryResult.cashDate);
	tableValuesArray["Cash Number"] = String(queryResult.cashNumber);
	tableValuesArray["Fee Type"] = String("A");
	tableValuesArray["Fee Amount"] = String(feeAmount);
	
	// Updating ASIT on application record.
	addASITValueToRecord("EXAM VENDOR CASH INFO", tableValuesArray, capId);
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

        if (parameters["intakeStatus"] && parameters["runDate"]) {
            ELPLogging.debug("**ERROR: Parameters can't be null.");
            return null;
        }

        var stmt = null;
        var sql = "select * from " + parameters["tableName"];

        if (parameters["runDate"] != null) {
            sql += " WHERE RUN_DATE LIKE ?";
            stmt = dbConn.prepareStatement(sql);
            var sql_date = new java.sql.Date(parameters["runDate"].getTime());
            stmt.setDate(1, sql_date);
        } else {
            sql += " WHERE Intake_Status = ?";
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["intakeStatus"]);
        }

        ELPLogging.debug("** SQL: " + sql);
        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.debug("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
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
	var startDate = new Date();
	var startTime = startDate.getTime();
	try {
		var stmt = null;
		var sql = "select * from " + parameters["tableName"] + " where batchInterfaceName = ? and run_date like ?";
		stmt = dbConn.prepareStatement(sql);
		stmt.setString(1, parameters["batchInterfaceName"]);
		var sql_date = new java.sql.Date(parameters["runDate"].getTime());
		stmt.setDate(2, sql_date);

		ELPLogging.debug("** SQL: " + sql);

		var rs = stmt.executeQuery();

		var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

		dataSet = ds;

	} catch (ex) {
		ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
	}
	ELPLogging.debug("**INFO: Elapsed time retrieving records: " + elapsed(startTime) + " secs.");
	return dataSet;
}