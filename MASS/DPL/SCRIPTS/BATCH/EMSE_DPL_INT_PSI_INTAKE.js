/*********************************************************************************************************************
* The purpose of this script to update the Accela Exam records received from PSI. Frequency for this Interface is    *
* daily. EMSE creates Application, Transaction License and Reference License                                         *
* @file - EMSE_DPL_INT_PSI_INTAKE                                                                                    *
* @author Manoj Parlikar 6/30/14                                 						                             *
* Updated on 03/01/2015 (Manoj Parlikar)																			 *	
*********************************************************************************************************************/

try
{
   try
	{   
		//Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 3.0;
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_EMAIL"));	
		eval(getScriptText("EMSE_MA_INT_C_STRINGBUILDER"));
		eval(getScriptText("EMSE_MA_INT_C_UTILITY"));		
		eval(getScriptText("EMSE_MA_INT_C_LICENSE"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));		
		eval(getScriptText("INCLUDES_CUSTOM"));
		var returnException;
		ELPLogging.debug("Finished loading the external scripts");
	}
	catch(ex)
	{
		returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}

	// POC
    var selectQueryConfiguration = '{\
        "selectQuery": {\
            "table": "ELP_TBL_PSI_STG_DPL", \
            "parameters": {\
                "list": [\
                    {\
                        "name": "intakeStatus", \
                        "source": "RESULT", \
                        "property": "intakeStatus", \
                        "type": "STRING", \
                        "parameterType": "IN"\
                    }, \
                    {\
                        "name": "runDate", \
                        "source": "RESULT", \
                        "property": "runDate", \
                        "type": "DATE_TIME", \
                        "parameterType": "IN"\
                    }\
                ]\
            }, \
            "resultSet": {\
                "list": [\
                    {\
                        "name": "BOARD_CODE", \
                        "source": "RESULT", \
                        "property": "BOARD_CODE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "LICENSE_NUMBER", \
                        "source": "RESULT", \
                        "property": "LICENSE_NUMBER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "TYPE_CLASS", \
                        "source": "RESULT", \
                        "property": "TYPE_CLASS", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "SSN", \
                        "source": "RESULT", \
                        "property": "SSN", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "FNAME", \
                        "source": "RESULT", \
                        "property": "FNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "MNAME", \
                        "source": "RESULT", \
                        "property": "MNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "LNAME", \
                        "source": "RESULT", \
                        "property": "LNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "GENERATION", \
                        "source": "RESULT", \
                        "property": "GENERATION", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "CASH_NUMBER", \
                        "source": "RESULT", \
                        "property": "CASH_NUMBER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "CASH_DATE", \
                        "source": "RESULT", \
                        "property": "CASH_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "ISSUE_DATE", \
                        "source": "RESULT", \
                        "property": "ISSUE_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "LIC_EXP_DATE", \
                        "source": "RESULT", \
                        "property": "LIC_EXP_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "ADDRS_2ND_LN", \
                        "source": "RESULT", \
                        "property": "ADDRS_2ND_LN", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "CITY_TOWN", \
                        "source": "RESULT", \
                        "property": "CITY_TOWN", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "STATE", \
                        "source": "RESULT", \
                        "property": "STATE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "ZIP_CODEA", \
                        "source": "RESULT", \
                        "property": "ZIP_CODEA", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "ZIP_CODEB", \
                        "source": "RESULT", \
                        "property": "ZIP_CODEB", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DATE_BIRTH", \
                        "source": "RESULT", \
                        "property": "DATE_BIRTH", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "EXAM_DATE", \
                        "source": "RESULT", \
                        "property": "EXAM_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "SCHOOL_GRADUATED", \
                        "source": "RESULT", \
                        "property": "SCHOOL_GRADUATED", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "GRAD_YEAR", \
                        "source": "RESULT", \
                        "property": "GRAD_YEAR", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "SCHOOL_LOCATION", \
                        "source": "RESULT", \
                        "property": "SCHOOL_LOCATION", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "BUSINESS_NAME", \
                        "source": "RESULT", \
                        "property": "BUSINESS_NAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_ADDR_LN_2", \
                        "source": "RESULT", \
                        "property": "B_ADDR_LN_2", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_CITY_TOWN", \
                        "source": "RESULT", \
                        "property": "B_CITY_TOWN", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_STATE", \
                        "source": "RESULT", \
                        "property": "B_STATE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_ZIP_A", \
                        "source": "RESULT", \
                        "property": "B_ZIP_A", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_ZIP_B", \
                        "source": "RESULT", \
                        "property": "B_ZIP_B", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "WRITTEN_SCORE", \
                        "source": "RESULT", \
                        "property": "WRITTEN_SCORE", \
                        "type": "INTEGER", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "PRACTICAL_SCORE", \
                        "source": "RESULT", \
                        "property": "PRACTICAL_SCORE", \
                        "type": "INTEGER", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "RECIPROCITY", \
                        "source": "RESULT", \
                        "property": "RECIPROCITY", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "NO_FEE_COLLECTED", \
                        "source": "RESULT", \
                        "property": "NO_FEE_COLLECTED", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "SERIAL_NUMBER", \
                        "source": "RESULT", \
                        "property": "SERIAL_NUMBER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "APPLICATION_NUMBER", \
                        "source": "RESULT", \
                        "property": "APPLICATION_NUMBER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "batchInterfaceName", \
                        "source": "RESULT", \
                        "property": "BATCH_INTERFACE_NAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "errorMessage", \
                        "source": "RESULT", \
                        "property": "ERROR_MESSAGE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "LOADED_DATE", \
                        "source": "RESULT", \
                        "property": "LOADED_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "rowNumber", \
                        "source": "RESULT", \
                        "property": "ROW_NUMBER", \
                        "type": "INTEGER", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "intakeStatus", \
                        "source": "RESULT", \
                        "property": "INTAKE_STATUS", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "OTHER_CLASS", \
                        "source": "RESULT", \
                        "property": "OTHER_CLASS", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "OTHER_FNAME", \
                        "source": "RESULT", \
                        "property": "OTHER_FNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "OTHER_MNAME", \
                        "source": "RESULT", \
                        "property": "OTHER_MNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "OTHER_LNAME", \
                        "source": "RESULT", \
                        "property": "OTHER_LNAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "GENDER", \
                        "source": "RESULT", \
                        "property": "GENDER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "PREF_COMMUNICATION", \
                        "source": "RESULT", \
                        "property": "PREF_COMMUNICATION", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "EMAIL", \
                        "source": "RESULT", \
                        "property": "EMAIL", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "PRIMARY_PHONE", \
                        "source": "RESULT", \
                        "property": "PRIMARY_PHONE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "MOBILE", \
                        "source": "RESULT", \
                        "property": "MOBILE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "BUILDING_NUM", \
                        "source": "RESULT", \
                        "property": "BUILDING_NUM", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "STREET_NAME", \
                        "source": "RESULT", \
                        "property": "STREET_NAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_BUILDING_NUMBER", \
                        "source": "RESULT", \
                        "property": "B_BUILDING_NUMBER", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "B_STREET_NAME", \
                        "source": "RESULT", \
                        "property": "B_STREET_NAME", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "FEE_TYPE", \
                        "source": "RESULT", \
                        "property": "FEE_TYPE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "FEE_AMT", \
                        "source": "RESULT", \
                        "property": "FEE_AMT", \
                        "type": "INTEGER", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "REIN_CODE", \
                        "source": "RESULT", \
                        "property": "REIN_CODE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "EXPIRED_LIC_NUM", \
                        "source": "RESULT", \
                        "property": "EXPIRED_LIC_NUM", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "RE_EXAM", \
                        "source": "RESULT", \
                        "property": "RE_EXAM", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "HS_INDC", \
                        "source": "RESULT", \
                        "property": "HS_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DISC_1_INDC", \
                        "source": "RESULT", \
                        "property": "DISC_1_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DISC_2_INDC", \
                        "source": "RESULT", \
                        "property": "DISC_2_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DISC_3_INDC", \
                        "source": "RESULT", \
                        "property": "DISC_3_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DISC_4_INDC", \
                        "source": "RESULT", \
                        "property": "DISC_4_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "DISC_5_INDC", \
                        "source": "RESULT", \
                        "property": "DISC_5_INDC", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "runDate", \
                        "source": "RESULT", \
                        "property": "RUN_DATE", \
                        "type": "DATE_TIME", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "extractStatus", \
                        "source": "RESULT", \
                        "property": "EXTRACT_STATUS", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }, \
                    {\
                        "name": "RECORD_TYPE", \
                        "source": "RESULT", \
                        "property": "RECORD_TYPE", \
                        "type": "STRING", \
                        "parameterType": "OUT"\
                    }\
                ]\
            }\
        }\
    }';


	try
	{
		//load all of the input parameters into JSON objects
		var stagingConfigObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("stagingConfiguration"));
		var staticParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));
		var dynamicParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("dynamicParameters"));
		var batchAppResultObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));

        // POC
        var selectQueryObj = datatypeHelper.loadObjectFromParameter(selectQueryConfiguration);

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
		var licenseParameters = {};
		licenseParameters.servProvCode = "DPL";
		var licenseData = new LicenseData(dbConn,licenseParameters);
		var runDateMs = Date.parse(batchAppResultObj.runDate);
		
		if (runDateMs != null)
		{
			var runDate = new Date(runDateMs);    		
		}
		else 
		{
			var runDate = new Date();
		}

		ELPLogging.debug("LICENSE DATA", licenseData);
		ELPLogging.debug("CONFIGURATIONS",licenseData.configurations["Sheet Metal"]);     
	}
	catch(ex)
	{
		returnException = new ELPAccelaEMSEException("Error Connecting to Staging Table Database " + ex.message, ScriptReturnCodes.STAGING_CONNECTION);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}
	
	//Create the global variables that will be used throughout the script
	
	var SM_BOARDSTAFF_ID = "SM|BOARDSTAFF";
	var EL_BOARDSTAFF_ID = "EL|BOARDSTAFF";
	var PL_BOARDSTAFF_ID = "PL|BOARDSTAFF";
	var EXAM_PROVIDER_NAME = "PSI";
	var TASK_ASSIGNMENT_STD_CHOICE = "TASK_ASSIGNMENT";
	var EXAM_RECORD = "1";
	var APPLICATION_RECORD = "2";
	var EL_WINDOW_PERIOD = 1;
	var LICENSE_RECORD = "3";
	var DAYS_IN_YEAR = 365;
	var WORKFLOW_STATUS = "Approved to Sit for Exam";
	var HOUR_SEC = (60 * 60);
	var CONDITION_TYPE = "ELP Interfaces";
	var SM_CONDITION_TYPE = "Notice";
	var SM_CONDITION_NAME = "Sheet Metal Exam Failure Limit";
	var WFTASK = "Exam";
	var WFSTATUS = "Board Review";
	var PASSING_SCORE = 70;
	var SM_EXAM_ATTEMPT = 3;
	var EXAM_ATTEMPT_SIX = 6;
	var EXAM_ATTEMPT_THREE = 3;
	var PLGF_CONDITION_NAME = "Plumbers Exam Failure Limit";
	var ELFA_CONDITION_EXAM_FAILURE = "Electricians Exam Failure Limit";
	var ELFA_CONDITION_REGISTRATION_EXPIRED = "Exam registration expired";
	var ELFA_CONDITION_REGISTRATION_EXPIRED_COMMENT = "Exam was taken more than a year from approval to take the exam";
	var RESEND_CONDITION =  "License record resent by exam vendor";
	var RESEND_CONDITION_COMMENT = "The License record was resent by exam vendor on ";
	var SSN_CONDITION = "Invalid SSN";
	var SSN_CONDITION_COMMENT = "SSN provided for the applicant failed validation";
	var CAP_TYPE_STD_CHOICE = "INTERFACE_CAP_TYPE";
	var refContactSeqNumber;
	var contactAddressDetailsArray = new Array();
	var SM_REQUIRED_LICENSE_FIELDS = "Board Code, Type Class, SSN, Exam Date, Written Score, Application Number, License Number ISsue Date, License Expiration Date";
	var EL_REQUIRED_LICENSE_FIELDS = "Board Code, Type Class, SSN, Exam Date, Written Score, Application Number, License Number ISsue Date, License Expiration Date, Date of Birth, Fee Type, Fee Amount, Cash Number, Cash Date, Serial Number, First Name and Last Name ";
	var EL_REQUIRED_APPLICATION_FIELDS = "Board Code, Type Class, SSN, Date of Birth, Fee Type, Fee Amount, Cash Number, Cash Date, First Name and Last Name, Gender, Preferred Communication, HS_INDC, Street Name, City, State, Zip code, Re Exam, Disciplinary code 1, Disciplinary code 2, Disciplinary code 3, Disciplinary code 4, Disciplinary code 5 ";
	var EL_REQUIRED_EXAM_FIELDS = " Board Code, Type Class, SSN, Exam Date, Written Score, Application Number , First Name, Last Name";
	var PL_REQUIRED_LICENSE_FIELDS = "Board Code, Type Class, SSN, Exam Date, Written Score, Application Number, License Number ISsue Date, License Expiration Date, Date of Birth, Fee Type, Fee Amount, Cash Number, Cash Date, Serial Number, First Name and Last Name ";
	var PL_REQUIRED_EXAM_FIELDS = " Board Code, Type Class, SSN, Exam Date, Written Score, Application Number , First Name, Last Name";
	
	var requiredFieldArray = {"SM-3" :SM_REQUIRED_LICENSE_FIELDS, "EL-1" :  EL_REQUIRED_EXAM_FIELDS, "EL-2":EL_REQUIRED_APPLICATION_FIELDS, "EL-3":EL_REQUIRED_LICENSE_FIELDS, "PL-1" : PL_REQUIRED_EXAM_FIELDS, "PL-3":PL_REQUIRED_LICENSE_FIELDS, "FA-1" :  EL_REQUIRED_EXAM_FIELDS, "FA-2":EL_REQUIRED_APPLICATION_FIELDS, "FA-3":EL_REQUIRED_LICENSE_FIELDS};
	
	aa.env.setValue("BatchJobName", "ELP.PSI.INTAKE"); 
	//aa.env.setValue("CurrentUserID","BATCHUSER");
	aa.env.setValue("TIMEOUT", HOUR_SEC);
	var timer = new ELPTimer(HOUR_SEC);
	ELPLogging.debug("Timer Started");
	ELPLogging.debug("Finished creating global variables");
	
	// CR : 358
	var foreignAddressFlag = false;
	var ELFA_FOREIGN_CONDITION = "Foreign Address";
	var contactAddressCondition = false;
	var BAD_ADDRESS_CONDITION = "Invalid Address";
	var BAD_ADDRESS_CONDITION_COMMENT = "PCS Address validation failed for Contact Address : ";
	
	var systemUserObjResult = aa.person.getUser("BATCHUSER");
	var systemUserObj;
	if (systemUserObjResult.getSuccess())
	{
		systemUserObj = systemUserObjResult.getOutput();
	}

	try
	{
        // POC
        var processedCount = countStagingRecords(new Date(batchAppResultObj.runDate));

		// POC
		// // Update the dynamic table with Record processed count.
		// var processedCount = countImportedRecords(new Date(batchAppResultObj.runDate));
		updateDynamicParams(processedCount);
		
		dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
		var DPS = JSON.stringify(dynamicParamObj);
		aa.env.setValue("dynamicParameters", DPS);  
		
		//Fix for PROD Defect 7948 : PRD_DPL_SM record did not got processed for PSI interface
		if(staticParamObj.recordCount == 0)
		{
			ELPLogging.debug("PSI no record to process");
			var emseErrorParameters = {"BatchInterfaceName": dynamicParamObj.batchInterfaceName, "RecordID" : "Invalid header", "ErrorDescription": "SM: PSI no record to process", "runDate":new Date(batchAppResultObj.runDate)};
			callToStoredProcedure(emseErrorParameters, "errorTable");
		}
	}
	catch(ex)
	{
		ELPLogging.notify("Error in updating Dynamic table with processed record count" +ex.message);
	}
				
	try
	{
        // POC
        var stagingQueryParameters = {
            "intakeStatus":"EXTRACTED_FILE",
            "tableName": selectQueryObj.selectQuery.table
        };

        var dataSet = getStgRecords(stagingQueryParameters);

        // POC
		// // Load Records whose Intake Status is "EXTRACTED_FILE"
		// var emseQueryParameters = {"intakeStatus":"EXTRACTED_FILE"}; 
		// var dataSet = queryStgRecord(emseQueryParameters);
		ELPLogging.debug("Finished loading staging table data");

	}
	catch(ex if ex instanceof StoredProcedureException)
	{
		returnException = new ELPAccelaEMSEException("Error querying Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}
	
	// Payment flag indicate Record should add to payment set or not.
	var addRecordToMonthlyPaymentSetFlag = false;
	var capID;
	var refContactNumber;
	var queryResult;
	
	// Iterate all records with in the dataSet object.
	while ((queryResult = dataSet.next()) != null) 
	{	
		timer.checkTimeout();
		try
		{
			/*
			* RECORD_TYPE must be present to make any decisions for Exam, Application or License record type.
			  Application Number is required field Exam and License records.
			*/	
			if ((queryResult.RECORD_TYPE != null) &&
				(queryResult.RECORD_TYPE == EXAM_RECORD || queryResult.RECORD_TYPE == LICENSE_RECORD) && 
				(queryResult.APPLICATION_NUMBER != null))
			{	 		 
				// Process the License records
				if (queryResult.RECORD_TYPE == LICENSE_RECORD)
				{
					ELPLogging.debug("Start Processing License Record : " + queryResult.APPLICATION_NUMBER);
					
					// Set the flag to add application number into the monthly payment set.
					addRecordToMonthlyPaymentSetFlag = true;
						
					// Validation for required fields for License record.
					if (validateRequiredFields(queryResult))
					{
						ELPLogging.debug("Required field Validation Pass");
						
						var capListResult = aa.cap.getCapID(queryResult.APPLICATION_NUMBER); 
					
						if (capListResult.getSuccess())
						{ 						
							capID = capListResult.getOutput();
							ELPLogging.debug("Processing Record ID : - " + capID);
							
							// Validation to check the duplicate record. 
							if (!duplicateCheckForRecords(queryResult))
							{
								ELPLogging.debug("Duplicate Record check pass");
								
								try
								{	
									// Process the filtered License record.
									evaluateStgRecords(capID, queryResult);

									// Call the method to get Application record details.
									var applicationTypeInfo = licenseData.getApplicationType(capID);
									
									// Adding License fee on Application record.
									feeOnApplicationRecord(capID, queryResult.RECORD_TYPE);

									// Update the Status of the fees on the application record
									//updateFeeStatus(capID, queryResult.RECORD_TYPE);
									
									// If record is Reinstatement, update the intake status to "PROCESSED_EMSE" and do not create License Record.
									if (applicationTypeInfo.category == "Reinstatement" && (queryResult.BOARD_CODE == "EL" || queryResult.BOARD_CODE == "FA"))
									{		
										//addRecordToMonthlyPaymentSetFlag = false;
										ELPLogging.debug("Processing Reinstatement Record");
										var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
										updateStgRecord(updateParameters);
									}
									else
									{						
										// Validate the License number and expiration.
										ELPLogging.debug("Performing license number and license exiration date validation.");
										var licenseNumberValidationResult = licenseData.validatePSIData(capID, queryResult);
										ELPLogging.debug("licenseExpirationFlag = "+licenseNumberValidationResult.licenseExpirationFlag);
										ELPLogging.debug("licenseNumberFlag = "+licenseNumberValidationResult.licenseNumberFlag);
										
										// For Valid expiration date process the License Record.
										if (licenseNumberValidationResult.licenseExpirationFlag)
										{
											ELPLogging.debug("License Number validation Pass");
											if(licenseData.validateLicenseFormat(queryResult, capID)) 
											{ 
												if (licenseData.checkLicenseNumber(queryResult))
												{
													// For other record create Transaction, Reference License records 
													// and update the work-flow task/status for Application record.
													var newLicNumber = licenseData.issueLicense(capID, queryResult);
													
													// Check the license number flag. Flag can have 2 possible values
													// True : License sequence number in PSI intake file is equal and greater then the License sequence number in 
													// 	      LICENSE_SEQUENCE_NUMBER standard choice.
													// False : License sequence number in PSI intake file is less then the License sequence number in 
													// 	      LICENSE_SEQUENCE_NUMBER standard choice.
													// Raise a condition on reference license if license number flag is false.
													if (!licenseNumberValidationResult.licenseNumberFlag)
													{
														// Get the License professional number associated with transaction license. 
														var refLicProf = getRefLicenseProf(newLicNumber.getCustomID());
														
														if(refLicProf != null)
														{
															ELPLogging.debug("Adding condition on Ref License number : "  + refLicProf);
															var licSeqNum = refLicProf.getLicSeqNbr();
															var conditionComment = " with License# : " +licSeqNum+ " , First Name : " +queryResult.FNAME+ " , Last Name : " + queryResult.LNAME;
															// Method raise a condition on reference license and update the condition comment.
															addRefLicenseStandardCondition(capID, licSeqNum, CONDITION_TYPE, RESEND_CONDITION, conditionComment);
														}
													}
													else
													{
														// Update the License sequence number for License records where PSI License number and
														// License sequence number in standard choice are same.
														ELPLogging.debug("Updating the License sequence number");
														licenseData.updateLicenseSequenceNumbers();
													}
													
													// Update the License type and Source ASI fields on the newly created license records
													if((queryResult.BOARD_CODE == "EL" || queryResult.BOARD_CODE == "FA") && (queryResult.TYPE_CLASS == "C" || queryResult.TYPE_CLASS == "D")) {
														var source = "Exam";
														var subType = "";
														if (queryResult.TYPE_CLASS == "C") {
															subType = "Systems Contractor";
														}
														else if (queryResult.TYPE_CLASS == "D") {
															subType = "Systems Technician";
														}
														updateASIValues(newLicNumber, "LICENSEE", "License Type", subType);
														updateASIValues(newLicNumber, "LICENSEE", "Source", source);
													}
													// Update the Military Status ASI as per the NO_FEE_COLLECTED field
													var noFeeCollectedObject;
													if (queryResult.NO_FEE_COLLECTED == "1")
													{
														noFeeCollectedObject = "Active Duty";
													}
													else if(queryResult.NO_FEE_COLLECTED == "2")
													{
														noFeeCollectedObject = "Veteran";
													}
													else if(queryResult.NO_FEE_COLLECTED == "3")
													{
														noFeeCollectedObject = "Spouse";
													}
													else
													{
														noFeeCollectedObject = "N/A";
													}
													// Update the ASI values on application records.
													updateASIValues(newLicNumber, "MILITARY STATUS", "Military Status", noFeeCollectedObject);	
													
													// Update the ASIT values
													copySingleASITable("LICENSE IN OTHER JURISDICTIONS", capID, newLicNumber);
													copySingleASITable("DUPLICATE LICENSE HISTORY", capID, newLicNumber);
													
													//Fix for PROD Defect : 6003 : SM Apprentice licenses not being changed to status of "upgraded" when SM Journeyperson app is approved
													if(queryResult.TYPE_CLASS == "J1" || queryResult.TYPE_CLASS == "J2")
													{
														//Get Application records work flow status then upgrade Apprentice license to "Upgraded"
														ELPLogging.debug("*********** Upgrading associated sheet Metal Apprentice Licenses Starts ***********");
														upgradeSheetMetalApprenticeLicenses(capID);
														ELPLogging.debug("*********** Upgrading associated sheet Metal Apprentice Licenses Ends ***********");
													
													}
													else if(queryResult.TYPE_CLASS == "M1")
													{
														ELPLogging.debug("*********** Processing Journeyman license Starts ***********");
														upgradeSheetMetalJourneypersonLicense(capID);
														ELPLogging.debug("*********** Processing Journeyman license Ends ***********");
													}
													
													// JIRA 1355
													if((queryResult.BOARD_CODE == "PL" || queryResult.BOARD_CODE == "GF") && queryResult.TYPE_CLASS == "J")
													{
														//Get Application records work flow status then upgrade Apprentice license to "Upgraded"
														ELPLogging.debug("*********** Upgrading associated PLGF Apprentice Licenses Starts ***********");
														upgradePLGFApprenticeLicenses(capID);
														ELPLogging.debug("*********** Upgrading associated PLGF Apprentice Licenses Ends ***********");
													
													}
													
													// Update parameters to update the staging table for processed records.
													var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
													updateStgRecord(updateParameters);
												}
												else
												{
													addRecordToMonthlyPaymentSetFlag=false;
													var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "License already exist in Accela", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.APPLICATION_NUMBER, "boardCode":queryResult.BOARD_CODE, "runDate" :new Date(batchAppResultObj.runDate)};
													updateStgRecord(emseUpdateParameters); 
												}
											}
											else 
											{
												ELPLogging.debug("Invalid Board Code OR Type Class");
												
												var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid Board Code OR Type Class", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.APPLICATION_NUMBER, "boardCode":queryResult.BOARD_CODE, "runDate" :new Date(batchAppResultObj.runDate)};
													updateStgRecord(emseUpdateParameters);
											}
										}
										else
										{
											// For Invalid License expiration date add error entry into stating error table and
											// delete record from PSI staging table.
											ELPLogging.notify("Invalid License Expiration Date: " + queryResult.APPLICATION_NUMBER);
											var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid License Expiration Date", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.APPLICATION_NUMBER, "runDate" : new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
											updateStgRecord(emseUpdateParameters);   
										}
									}
									
									if (addRecordToMonthlyPaymentSetFlag)
									{
										var tableValuesArray = {};
										tableValuesArray["Cash Date"] = jsDateToMMDDYYYY(queryResult.CASH_DATE);
										tableValuesArray["Cash Number"] = String(queryResult.CASH_NUMBER);
										tableValuesArray["Fee Type"] = String(queryResult.FEE_TYPE);
										tableValuesArray["Fee Amount"] = String(queryResult.FEE_AMT);
				
										// Updating ASIT on application record.
										addASITValueToRecord("EXAM VENDOR CASH INFO", tableValuesArray, capID);
									}
									
								} // END : try block.
								catch (ex)
								{
									ELPLogging.notify("Error/Exception occurred while processing license record  :  " + queryResult.APPLICATION_NUMBER + " - Error Message: ", ex.toString()); 
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Error/Exception occurred while processing license record.", "intakeStatus": "PROCESSED_EMSE_ERROR" , "recordID" : queryResult.APPLICATION_NUMBER};
									updateStgRecord(emseUpdateParameters);   		                				
								}                		            	    		  				
							} // END : Validation to check the duplicate record.
							else
							{
								ELPLogging.notify("Duplicate PSI Record Data : " + queryResult.APPLICATION_NUMBER);
								
								// Update the payment set flag and do not add record to monthly payment set.
								addRecordToMonthlyPaymentSetFlag = false;
							}
						}
						else
						{
							// For Invalid Application number add error entry into stating error table and
							// delete record from PSI staging table. 
							ELPLogging.notify("Invalid Application Number: " + queryResult.APPLICATION_NUMBER);      			
							var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid Application Number", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.APPLICATION_NUMBER, "boardCode":queryResult.BOARD_CODE, "runDate" :new Date(batchAppResultObj.runDate)};
							updateStgRecord(emseUpdateParameters); 
							
							// Update the payment set flag and do not add record to monthly payment set.							
							addRecordToMonthlyPaymentSetFlag = false;
						}
					} // END : Validate the required fields for License record.
					else
					{
						// For record, required fields are not in PSI file:
						// 1. Add error entry into stating error table.
						// 2. Delete record from PSI staging table.   
						var arrayKey = queryResult.BOARD_CODE+"-"+queryResult.RECORD_TYPE;
						ELPLogging.notify("PSI Record missing required fields : " + queryResult.APPLICATION_NUMBER);   
						var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PSI Record missing one or more required fields - " + requiredFieldArray[arrayKey], "intakeStatus": "PROCESSED_EMSE_VALIDATION", "recordID" : queryResult.APPLICATION_NUMBER, "runDate" :new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
						updateStgRecord(emseUpdateParameters);   								
					}					
				} // End : Process the License records
				// Process the Exam record.
				else
				{
					ELPLogging.debug("Start Processing Exam Record : " + queryResult.APPLICATION_NUMBER);
					
					// Validation for required fields for Exam record.
					if (validateRequiredFields(queryResult))
					{
						ELPLogging.debug("Required field validation pass");
						var capListResult = aa.cap.getCapID(queryResult.APPLICATION_NUMBER);  

						capID = capListResult.getOutput();						
						
						if (capListResult.getSuccess())
						{ 
							// Validation for duplicate record.
							if (!duplicateCheckForRecords(queryResult))
							{
								ELPLogging.debug("Duplicate record check pass");
								try
								{
									// Process the filtered Exam record.
									evaluateStgRecords(capID, queryResult); 
									
									// Update parameters to update the staging table for processed records.
									var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
									updateStgRecord(updateParameters);         				
								}
								catch (ex)
								{ 
									ELPLogging.debug("Error/Exception occurred while processing exam record  :  " + queryResult.APPLICATION_NUMBER + " - Error Message: ", ex.toString()); 
									var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Error/Exception occurred while processing exam record.", "intakeStatus": "PROCESSED_EMSE_ERROR" , "recordID" : queryResult.APPLICATION_NUMBER};
									updateStgRecord(emseUpdateParameters);  		                				
								}
							}
							else
							{
								ELPLogging.debug("Duplicate PSI exam record : " + queryResult.APPLICATION_NUMBER);
							}
						}
						else
						{
							// For Invalid Application number add error entry into stating error table and
							// delete record from PSI staging table.  
							ELPLogging.notify("Invalid Application Number: " + queryResult.APPLICATION_NUMBER);      			
							var emseUpdateParameters = {"recordID" : queryResult.APPLICATION_NUMBER, "errorMessage" : "Invalid Application Number", "intakeStatus": "PROCESSED_EMSE_VALIDATION", "rowNumber" : queryResult.rowNumber, "boardCode":queryResult.BOARD_CODE, "runDate" : new Date(batchAppResultObj.runDate)};
							updateStgRecord(emseUpdateParameters);													
						}
					}
					else
					{  
						// For record, required fields are not in PSI file:
						// 1. Add error entry into stating error table.
						// 2. Delete record from PSI staging table.
						var arrayKey = queryResult.BOARD_CODE+"-"+queryResult.RECORD_TYPE;
						ELPLogging.debug("PSI Record missing required fields for Exam Record : ", queryResult.APPLICATION_NUMBER);            	    		
						var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PSI Record missing one or more required fields - " + requiredFieldArray[arrayKey], "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.APPLICATION_NUMBER, "runDate" :new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
						updateStgRecord(emseUpdateParameters);  						
					}

					ELPLogging.debug("End Processing Exam Record : " + queryResult.APPLICATION_NUMBER);					
				} // END : Process the Exam record.
			}
			// Process the Application record.
			else if(queryResult.RECORD_TYPE == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start Processing Application Record : " + queryResult.FNAME + " " + queryResult.LNAME);	
				
				var capID;
				
				// Validation for required fields for Exam record.
				if (validateRequiredFields(queryResult))
				{
					ELPLogging.debug("Required field validation pass" );
					
					// Validation for duplicate record.
					if (!duplicateCheckForRecords(queryResult))
					{
						// Application data and duplicate record validation.
						ELPLogging.debug("Duplicate record check pass" );
						
						// Validate the Application record fields like SSN, Address and Phone Number
						var applicationRecValidation = applicationRecordValidation(queryResult);
						
						ELPLogging.debug("applicationRecValidation.addressValidationFlag = "+applicationRecValidation.addressValidationFlag);
						
						if(applicationRecValidation.addressValidationFlag == true)
						{
							// Process the records which are passed the Application record validation.
							if(applicationRecValidation.applicationRecordFlag)
							{
								ELPLogging.debug("Application record validation pass");
								
								// Set the Payment flag to add record to Monthly payment set.
								addRecordToMonthlyPaymentSetFlag = true;

								// Create Application record.
								capID = createApplicationRecord(queryResult);
								
								// CR 358 : Raise foreign address condition if foreignAddressFlag set to true
								if (foreignAddressFlag)
								{
									addStdConditionByConditionNumber(CONDITION_TYPE, ELFA_FOREIGN_CONDITION, capID);

									var capConditionComment = "The address failed validation for Foreign Address.";
									editConditionComment(capID, ELFA_FOREIGN_CONDITION, capConditionComment);
								}
								
								// CR 358 : Raise address condition if contactAddressCondition set to true
								if (contactAddressCondition)
								{
									addStdConditionByConditionNumber(CONDITION_TYPE, BAD_ADDRESS_CONDITION, capID);

									var capConditionComment = "PSI Address validation failed";
									editConditionComment(capID, BAD_ADDRESS_CONDITION, capConditionComment);
								}
								
								// Raise a Condition on reference License if Applicant's SSN number fails the SSN expression logic.
								if (applicationRecValidation.ssnFlag.ssnExpressionLogic)
								{
									ELPLogging.debug("SSN number failed the expression logic. Raising condition on reference contact number : " + refContactNumber);
									var conditionComment = "First Name : " +queryResult.FNAME+ ", Last Name : " + queryResult.LNAME;
									addConditionRefContact(CONDITION_TYPE, SSN_CONDITION, refContactNumber, conditionComment);
								}
								
								// Updating the PSI staging table.
								var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE"}
								updateStgRecord(updateParameters); 
							}
							else
							{
								// For record, Application record validation fails:
								// 1. Add error entry into stating error table.
								// 2. Delete record from PSI staging table.
								var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Invalid PSI Application data", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.FNAME + " " + queryResult.LNAME, "runDate" :new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
								updateStgRecord(emseUpdateParameters);
							}
						}
						else
						{
							// For record, Application record validation fails:
							// 1. Add error entry into stating error table.
							// 2. Delete record from PSI staging table.
							var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Address validation failed", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.FNAME + " " + queryResult.LNAME, "runDate" :new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
							updateStgRecord(emseUpdateParameters);
						
						}	
					}
					else
					{
						ELPLogging.notify("Duplicate Application record : " + queryResult.FNAME + " " + queryResult.LNAME);
						
						// For Duplicate record update the payment set flag and do not add record to monthly payment set.
						addRecordToMonthlyPaymentSetFlag = false;
					}
				}
				else
				{  
					// For record, required fields are not in PSI file:
					// 1. Add error entry into stating error table.
					// 2. Delete record from PSI staging table.
					var arrayKey = queryResult.BOARD_CODE+"-"+queryResult.RECORD_TYPE;
					ELPLogging.notify("PSI Record missing required fields for Application Record ");         	    		
					var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PSI Record missing one or more required fields - " + requiredFieldArray[arrayKey], "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.FNAME + " " + queryResult.LNAME, "runDate" :new Date(batchAppResultObj.runDate), "boardCode":queryResult.BOARD_CODE};
					updateStgRecord(emseUpdateParameters);  						
				}
				
				ELPLogging.debug("End Processing Application Record : " + queryResult.FNAME + " " + queryResult.LNAME);
			} // END : Process the Application record.
			else
			{  
				// For record, required fields are not in PSI file:
				// 1. Add error entry into stating error table.
				// 2. Delete record from PSI staging table. 
				ELPLogging.notify("PSI Record missing required fields"); 
				
				// Update the Error table with Application Number if available else update with First and Last name. 
				if (queryResult.APPLICATION_NUMBER)
				{
					var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PSI Record missing required field - Record Type", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.APPLICATION_NUMBER, "boardCode":queryResult.BOARD_CODE};
				}
				else
				{
					var emseUpdateParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "PSI Record missing required field - Record Type", "intakeStatus": "PROCESSED_EMSE_VALIDATION" , "recordID" : queryResult.FNAME + " " + queryResult.LNAME, "boardCode":queryResult.BOARD_CODE};
				}
				
				updateStgRecord(emseUpdateParameters);  						
			}
	
			// Add the Application ID to Monthly payment set if flag found true.
			if (addRecordToMonthlyPaymentSetFlag)
			{
				// Add record to Monthly Payment set.
				var setName = getMonthlyPaymentSet(queryResult);
				ELPLogging.debug("Adding record : " + capID + " to Monthly payment set " + setName);
				addApplicationRecordToMonthlyPaymentSet(setName, capID);
			}
		}
		catch(ex)
		{
			ELPLogging.debug("***ERROR = "+ex.toString());
			var updateParameters = {"rowNumber" : queryResult.rowNumber, "intakeStatus" : "PROCESSED_EMSE_ERROR", "errorMessage" : ex.toString()}
			updateStgRecord(updateParameters);
		}
	} // END : While loop
	
	
	//Email the error records to respective boards.
	emailErrorReport(dbConn, stagingConfigObj, new Date(batchAppResultObj.runDate));
	
}
catch(ex if ex instanceof ELPAccelaEMSEException)
{
		ELPLogging.fatal(ex.toString());
		aa.env.setValue("EMSEReturnCode", ex.getReturnCode()); 
		aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSI_INTAKE aborted with " + ex.toString());
}
catch(ex)
{
		ELPLogging.fatal(ex.message);
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE); 
		aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSI_INTAKE aborted with " + ex.message);
}
finally
{
	if (!ELPLogging.isFatal()) {    // if fatal then return code already filled in
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		aa.env.setValue("ScriptReturnCode","0");
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSI_INTAKE completed with " + ELPLogging.getErrorCount() + " errors.");                    
		} else {
			aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_PSI_INTAKE completed with no errors.");            
		}
	}
	
	if (dbConn)
	{
		dbConn.close();
	}
	aa.env.setValue("logFile", ELPLogging.toJSON());
}

/** 
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name 
 * @throws  N/A
 */
function getScriptText(vScriptName)
{ 
	var servProvCode = aa.getServiceProviderCode(); 
	if (arguments.length > 1) 
		servProvCode = arguments[1]; 
	vScriptName = vScriptName.toUpperCase(); 
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); 
	try 
	{ 
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN"); 
		return emseScript.getScriptText() + ""; 
	} 
	catch(err) 
	{ 
		return ""; 
	}
}

/** 
 * @desc This Method takes the typeClass and return the corresponding Exam Name.
 * @param {typeClass} typeClass - contains the Type Class eg. M1, J1 
 * @throws  N/A
 */
function getExamName(examCode)
{
	var examName;
	
	var examNameStdChoice = "EXAM_NAME_STD_CHOICE";
	
	// Load the exam name store in EXAM_NAME_STD_CHOICE standard choice.
	examName = getSharedDropDownDescriptionDetails(examCode, examNameStdChoice);
   
	return examName;
}


/** 
 * @desc This Method create new Exam record for the new application record.
 * @param {capID} capID - Unique Record ID. 
 * @throws  ELPAccelaEMSEException
 */
function createExamRecord(capID)
{
	// Create exam record for new application
	var newExamScriptModel = aa.examination.getExaminationModel().getOutput();
	newExamScriptModel.setServiceProviderCode("DPL");
	newExamScriptModel.setRequiredFlag("N");

	var examModel =  newExamScriptModel.getExaminationModel();
	
	var examCode = queryResult.BOARD_CODE + "-" + queryResult.TYPE_CLASS;
	
	var examName = getExamName(examCode);
	
	var providerNumber  = getProviderNumber(examName, EXAM_PROVIDER_NAME);
	
	if (providerNumber == null) {
		providerNumber = "N/A";
	}
	
	ELPLogging.debug("Exam Name is : " + examName + "  and Provider is : " + providerNumber);
	
	// Create Exam model for new record.
	examModel.setB1PerId1(capID.getID1());
	examModel.setB1PerId2(capID.getID2());
	examModel.setB1PerId3(capID.getID3());
	examModel.setExamName(examName);
	examModel.setProviderNo(providerNumber);
	examModel.setProviderName(EXAM_PROVIDER_NAME);
	newExamScriptModel.setAuditStatus("A");
	examModel.setFinalScore(queryResult.WRITTEN_SCORE);
    
    // JIRA 3064 : If Practical score is porvided by PSI, adding into exam record.
    if (queryResult.PRACTICAL_SCORE != null && queryResult.PRACTICAL_SCORE != undefined)
        examModel.setUserExamID(queryResult.PRACTICAL_SCORE);
	
	// Update Exam Status based on final score
	if (queryResult.WRITTEN_SCORE >= PASSING_SCORE)
	{
		examModel.setExamStatus("PCOMPLETED");
	}
	else
	{
		examModel.setExamStatus("PENDING");
	}

	//examModel.setGradingStyle("passfail");
	examModel.setPassingScore(PASSING_SCORE);
	examModel.setExamAttempt(1);
	examModel.setExamDate(queryResult.EXAM_DATE);
	examModel.setEntityType("CAP_EXAM");

	// Creating Exam record.
	var statusResult = aa.examination.createExaminationModel(newExamScriptModel);
	if (!statusResult.getSuccess()) {
		  returnException = new ELPAccelaEMSEException("Error Creating Examination "+ statusResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		  ELPLogging.error(returnException.toString());
		  throw returnException;    	

	}
	var status = statusResult.getOutput();
	
	if (!status)
	{
		  returnException = new ELPAccelaEMSEException("Error Creating Examination "+ statusResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		  ELPLogging.error(returnException.toString());
		  throw returnException;   
	}
}

/** 
 * @desc This Method contains the business logic for SM board.
 * @param capID and dataSet(queryResult)
 * @throws  N/A
 */
function processSMRecords(capID, queryResult)
{
	var examAttempCount;
	var updateStatus;
	
	ELPLogging.debug("Start processing for Sheet Metal(SM) record : " + queryResult.APPLICATION_NUMBER);
	
	var emseParameters = {"rowNumber" : queryResult.rowNumber, "errorMessage" : "Error in updating exam record into Accela", "intakeStatus": "PROCESSED_EMSE_ERROR"};
		
	var capIdScriptModel = aa.cap.createCapIDScriptModel(capID.getID1(), capID.getID2(), capID.getID3());
	var examModelList = aa.examination.getExaminationList(capIdScriptModel);
		
	var examScriptModel = examModelList.getOutput();
		
	examAttempCount = 0;
		
	// To get the exam failed attempt count.
	for (index in  examScriptModel)
	{	
		examAttempCount++;
	}
		
	// Creating new exam record for new application
	createExamRecord(capID);
		
	examAttempCount++;
		
	ELPLogging.debug("examAttempCount : -- " + examAttempCount + " queryResult.WRITTEN_SCORE : --- " + queryResult.WRITTEN_SCORE);
		
	
	// Update the work-flow task/status if applicant passed in written score.
	if (queryResult.WRITTEN_SCORE >= PASSING_SCORE)
	{
		// update the workflow for passed applicant
		ELPLogging.debug("Updating the work-flow task/status for passed applicant");
		updateTaskStatus("EXAM","Passed - Under Review","Exam Passed","Exam Passed","", capID);
	}
	else
	{
		// For Failed Applicants
		// Check the count of unsuccessful attempts. For 3 or multiple for 3 attempts raise condition and update workflow. 
		if (!(examAttempCount % SM_EXAM_ATTEMPT))
		{
			ELPLogging.debug("Raising " + SM_CONDITION_NAME + " condition on application record : " + capID );
			addStdConditionByConditionNumber(SM_CONDITION_TYPE, SM_CONDITION_NAME, capID);
			var capConditionComment = "Applicants has failed the exam three times";
			editConditionComment(capID, SM_CONDITION_NAME, capConditionComment);
				
			// Update Workflow task and assign the Board Staff.
			updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capID); 
			var userName = getSharedDropDownDescriptionDetails(SM_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
			assignTaskToUser(WFTASK, userName, capID)
		}
	}
}

/** 
 * @desc This Method is to filter out records based on Board code.
 * @param capId - CAP ID of Application
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws  ELPAccelaEMSEException
 */
function evaluateStgRecords(capId, queryResult)
{    
	// Processing the record based on board code.
	switch(String(queryResult.BOARD_CODE))
	{
		case "SM":
			processSMRecords(capId, queryResult);
			break;
		case "PL":
		case "GF":	
			processPLGFRecords(capId, queryResult);
			break;
		case "EL":
		case "FA":
			processELFARecords(capId, queryResult);
			break;
		default:
			ELPLogging.notify("Board code : " + queryResult.BOARD_CODE +" doesn't exists for Application ID # " + queryResult.APPLICATION_NUMBER);
			break;  
	}
}


/** 
 * @desc This Method validate the required fields based on Board code.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function validateRequiredFields(queryResult)
{
	// Method validates the License record for Sheet Metal board (SM).
	if (queryResult.BOARD_CODE == "SM")
	{
		if (queryResult.RECORD_TYPE == APPLICATION_RECORD) {
			return false;
		} else if (queryResult.RECORD_TYPE == EXAM_RECORD) {
			if (queryResult.BOARD_CODE == null ||
					queryResult.BOARD_CODE.trim().length == 0 ||				
					queryResult.TYPE_CLASS == null || 
					queryResult.TYPE_CLASS.trim().length == 0 ||				
					queryResult.SSN == null ||
					queryResult.SSN.trim().length != 9 ||				
					queryResult.EXAM_DATE == null ||
					queryResult.WRITTEN_SCORE == null ||	
					queryResult.WRITTEN_SCORE == 0 ||				
					queryResult.APPLICATION_NUMBER == null ||
					queryResult.APPLICATION_NUMBER.trim().length == 0) {
				return false;
			} else {
				return true;
			}
			
		} else if (queryResult.RECORD_TYPE == LICENSE_RECORD) {
			if (queryResult.BOARD_CODE == null ||
					queryResult.BOARD_CODE.trim().length == 0 ||
					queryResult.LICENSE_NUMBER == null || 
					queryResult.LICENSE_NUMBER.trim().length == 0 ||
					queryResult.TYPE_CLASS == null || 
					queryResult.TYPE_CLASS.trim().length == 0 ||
					queryResult.SSN == null ||
					queryResult.SSN.trim().length != 9 ||
					queryResult.ISSUE_DATE == null ||
					//queryResult.LIC_EXP_DATE == null ||
					queryResult.EXAM_DATE == null ||
					queryResult.WRITTEN_SCORE == null ||
					queryResult.WRITTEN_SCORE == 0 ||
					queryResult.APPLICATION_NUMBER == null ||
					queryResult.APPLICATION_NUMBER.trim().length == 0) {	
				return false;
			} else {
				return true;
			}
			
		} else {
			return false;
		}
	}
	else
	{
		// Method validates the required fields for EL/FA/PL/GF boards.
		return requiredFieldValidationForPLGFELFARecords(queryResult);
	}		
}

/** 
 * @desc This Method validate the required fields based on Board code.
 * @param dbConnection : DB connection object.
 * @param procedureConfiguration : Stored procedure configuration.
 * @param runDate : Run Date to get the error records.
 * @throws N/A.
 */
function emailErrorReport(dbConnection, procedureConfiguration, runDate)
{
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
		// parameters.batchInterfaceName = "ELP.PSI.INTAKE";
		// errorReportProcedure.prepareStatement();
		// var inputParameters = errorReportProcedure.prepareParameters(null,null,parameters);
		// ELPLogging.debug("     InputParameters for errorReportProcedure:", inputParameters);
		// errorReportProcedure.setParameters(inputParameters);
		// var dataSet = errorReportProcedure.queryProcedure();

        // POC
        var parameters = {
            "runDate": runDate,
            "batchInterfaceName": "ELP.PSI.DPL.INTAKE",
            "tableName": "ELP_VW_PSI_ERROR"
        };
        var dataSet = getErrorReportRecords(parameters);        
		ELPLogging.debug("*** Finished getLicenseConfigurationRecords() ***");
		

		var licenseConfiguration = null;
		// Creating 3 email bodies for SM, EL and PL boards.
		var emailBodyEL = [];
		var emailBodyPL = [];
		var emailBodySM = [];
		var boardCode = null;
		var firstLine = "The following are input errors in the PSI Intake File that prevented processing of that application.";
		emailBodyEL.push(firstLine);
		emailBodyPL.push(firstLine);
		emailBodySM.push(firstLine);
		
		// Key value to get the email address for each boards.
		var emailAddressCodeSM = "PSI ERRORS-SM";
		var emailAddressCodeEL = "PSI ERRORS-EL";
		var emailAddressCodePL = "PSI ERRORS-PL";
		
		// Board flags indicate email should send to the board or not.
		var flagSM = false;
		var flagEL = false;
		var flagPL = false;
		ELPLogging.debug("runDate  : " + runDate);
		
		// loop through all license configuration records
		while ((errorData = dataSet.next()) != null)
		{
			var processingDateS = errorData.runDate.toDateString();			
			
			var errorLine = errorData.errorDescription;
			
			var scanner = new Scanner(errorLine, ":");
			
			var boardCode = scanner.next();
			var errorMessage = scanner.next();
			
			ELPLogging.debug ( " Board : " +boardCode + " errorMessage : " +errorMessage );
			
			var errorLine = errorData.batchInterfaceName + ":" + processingDateS + ":" + errorData.recordID + ":	" + errorMessage;
			
			if (boardCode == "SM")
			{
				// Add the error message into the email body.
				emailBodySM.push(errorLine);				
				// Set the board flag to 'True' to send the email.
				flagSM = true;
			}
			else if (boardCode == "EL")
			{
				// Add the error message into the email body.
				emailBodyEL.push(errorLine);
				// Set the board flag to 'True' to send the email.
				flagEL = true;
			}
			else
			{
				// Add the error message into the email body.
				emailBodyPL.push(errorLine);
				// Set the board flag to 'True' to send the email.
				flagPL = true;
			}
			
			ELPLogging.debug(errorLine);
		}
		
		// Send email if board flag is true.
		if (flagSM)
		{
			ELPLogging.debug("Sending email to :"+emailAddressCodeSM+" with Error: "+errorLine);
			sendBatchStatusEmail(emailAddressCodeSM, "Batch PSI File Errors", emailBodySM);
		}
		
		// Send email if board flag is true.
		if (flagEL)
		{
			sendBatchStatusEmail(emailAddressCodeEL, "Batch PSI File Errors", emailBodyEL);
		}
		
		// Send email if board flag is true.
		if (flagPL)
		{
			sendBatchStatusEmail(emailAddressCodePL, "Batch PSI File Errors", emailBodyPL);
		}
	}
	catch (ex)
	{
		ELPLogging.error("Send Error Email Error ", ex);
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
}

/** 
 * @desc This Method validates the required fields based on Board code.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForPLGFELFARecords(queryResult)
{
	// Validation flag indicates the validation outcome.
	var validationResult = false;
	
	switch (String(queryResult.BOARD_CODE))
	{
		case "PL":
		case "GF":
			// Validate the Exam record.
			if (queryResult.RECORD_TYPE == EXAM_RECORD)
			{
				ELPLogging.debug("Start validating required fields for PL/GF board's record : " + queryResult.APPLICATION_NUMBER);
				validationResult = requiredFieldValidationForPLGFExamRecord(queryResult);
			}
			// Validate the License record.
			else if (queryResult.RECORD_TYPE == LICENSE_RECORD)
			{
				ELPLogging.debug("Start validating required fields for PL/GF board's record : " + queryResult.APPLICATION_NUMBER);
				validationResult = requiredFieldValidationForPLGFLicenseRecord(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.RECORD_TYPE + " for PL/GF board.");
			}
			break;
		case "EL":
		case "FA":
			// Validate the Exam record.
			if (queryResult.RECORD_TYPE == EXAM_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EL/PL board's record : " + queryResult.APPLICATION_NUMBER);
				validationResult = requiredFieldValidationForELFAExamRecord(queryResult);
			}
			// Validate the Application record.
			else if (queryResult.RECORD_TYPE == APPLICATION_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EL/PL board's record : " + queryResult.FNAME + " " + queryResult.LNAME);
				validationResult = requiredFieldValidationForELFAApplicationRecord(queryResult);
			}
			// Validate the License record.
			else if (queryResult.RECORD_TYPE == LICENSE_RECORD)
			{
				ELPLogging.debug("Start validating required fields for EL/PL board's record : " + queryResult.APPLICATION_NUMBER);
				validationResult = requiredFieldValidationForELFALicenseRecord(queryResult);
			}
			else
			{
				ELPLogging.notify("Invalid Record type : " + queryResult.RECORD_TYPE + " for EL/FA board.");
			}
			break;
			
		default:
			ELPLogging.notify("Invalid board code : " + queryResult.BOARD_CODE + " for EL/FA board.");
			break;
	}
	
	return validationResult;
}

/** 
 * @desc This Method validates the required fields for PL/GF boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForPLGFExamRecord(queryResult)
{
	var validationResult = false;	
	
	// Required field should be there in PSI intake file.
	if (queryResult.BOARD_CODE != null &&
		queryResult.BOARD_CODE.trim().length != 0 &&				
		queryResult.TYPE_CLASS != null && 
		queryResult.TYPE_CLASS.trim().length != 0 &&				
		queryResult.SSN != null &&
		queryResult.SSN.trim().length == 9 &&				
		queryResult.EXAM_DATE != null &&
		queryResult.WRITTEN_SCORE != null &&	
		queryResult.WRITTEN_SCORE != 0 &&				
		queryResult.APPLICATION_NUMBER != null &&
		queryResult.APPLICATION_NUMBER.trim().length != 0 &&
		queryResult.DATE_BIRTH != null &&
		queryResult.RECORD_TYPE != null &&
		queryResult.RECORD_TYPE.trim().length != 0 &&
		queryResult.FNAME != null &&
		queryResult.FNAME.trim().length != 0 &&
		queryResult.LNAME != null &&
		queryResult.LNAME.trim().length != 0
		)
	{
		validationResult = true;
	}

	return validationResult;
}

/** 
 * @desc This Method validates the required fields for PL/GF boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForPLGFLicenseRecord(queryResult)
{
	var validationResult = false;	
	
	// Required field should be there in PSI intake file.
	if (queryResult.BOARD_CODE != null &&
		queryResult.BOARD_CODE.trim().length != 0 &&
		queryResult.LICENSE_NUMBER != null && 
		queryResult.LICENSE_NUMBER.trim().length != 0 &&
		queryResult.TYPE_CLASS != null && 
		queryResult.TYPE_CLASS.trim().length != 0 &&
		queryResult.SSN != null &&
		queryResult.SSN.trim().length == 9 &&
		queryResult.ISSUE_DATE != null &&
		queryResult.LIC_EXP_DATE != null &&
		queryResult.APPLICATION_NUMBER != null &&
		queryResult.APPLICATION_NUMBER.trim().length != 0 &&
		queryResult.DATE_BIRTH != null &&
		queryResult.FEE_TYPE != null &&
		queryResult.FEE_TYPE.trim().length != 0 &&
		queryResult.CASH_NUMBER != null &&
		queryResult.CASH_NUMBER.trim().length != 0 &&
		queryResult.FEE_AMT != null &&
		queryResult.RECORD_TYPE != null &&
		queryResult.RECORD_TYPE.trim().length != 0 &&
		queryResult.CASH_DATE != null &&
		queryResult.SERIAL_NUMBER != null &&
		queryResult.SERIAL_NUMBER.trim().length != 0 &&
		queryResult.FNAME != null &&
		queryResult.FNAME.trim().length != 0 &&
		queryResult.LNAME != null &&
		queryResult.LNAME.trim().length != 0
		)
	{
		validationResult = true;
	}

	return validationResult;
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
 * @desc This Method validates the required fields for EL/FA boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForELFAExamRecord(queryResult)
{
	var validationResult = false;	
	
	// Required field should be there in PSI intake file.
	if (queryResult.BOARD_CODE != null &&
		queryResult.BOARD_CODE.trim().length != 0 &&				
		queryResult.TYPE_CLASS != null && 
		queryResult.TYPE_CLASS.trim().length != 0 &&				
		queryResult.SSN != null &&
		queryResult.SSN.trim().length == 9 &&				
		queryResult.EXAM_DATE != null &&
		queryResult.WRITTEN_SCORE != null &&					
		queryResult.APPLICATION_NUMBER != null &&
		queryResult.APPLICATION_NUMBER.trim().length != 0 &&
		queryResult.DATE_BIRTH != null &&
		queryResult.RECORD_TYPE != null &&
		queryResult.RECORD_TYPE.trim().length != 0 &&
		queryResult.FNAME != null &&
		queryResult.FNAME.trim().length != 0 &&
		queryResult.LNAME != null &&
		queryResult.LNAME.trim().length != 0
		)
	{
		validationResult = true;
	}

	return validationResult;
}

/** 
 * @desc This Method validates the required fields for EL/FA boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForELFALicenseRecord(queryResult)
{
	var validationResult = false;	

	// Required field should be there in PSI intake file.
	if (queryResult.BOARD_CODE != null &&
		queryResult.BOARD_CODE.trim().length != 0 &&
		queryResult.LICENSE_NUMBER != null && 
		queryResult.LICENSE_NUMBER.trim().length != 0 &&
		queryResult.TYPE_CLASS != null && 
		queryResult.TYPE_CLASS.trim().length != 0 &&
		queryResult.SSN != null &&
		queryResult.SSN.trim().length == 9 &&
		queryResult.ISSUE_DATE != null &&
		queryResult.LIC_EXP_DATE != null &&
		queryResult.APPLICATION_NUMBER != null &&
		queryResult.APPLICATION_NUMBER.trim().length != 0 &&
		queryResult.DATE_BIRTH != null &&
		queryResult.FEE_TYPE != null &&
		queryResult.CASH_NUMBER != null &&
		queryResult.CASH_NUMBER.trim().length != 0 &&
		queryResult.FEE_AMT != null &&
		queryResult.RECORD_TYPE != null &&
		queryResult.RECORD_TYPE.trim().length != 0 &&
		queryResult.CASH_DATE != null &&
		queryResult.SERIAL_NUMBER != null &&
		queryResult.SERIAL_NUMBER.trim().length != 0 &&
		queryResult.FNAME != null &&
		queryResult.FNAME.trim().length != 0 &&
		queryResult.LNAME != null &&
		queryResult.LNAME.trim().length != 0
		)
	{
		validationResult = true;
	}

	
	
	return validationResult;
}

/** 
 * @desc This Method validates the required fields for EL/FA boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function requiredFieldValidationForELFAApplicationRecord(queryResult)
{
	var validationResult = false;
	foreignAddressFlag = false;
	
	// Updated the condition as a part of CR 358
	// Required field should be there in PSI intake file.
	if (queryResult.BOARD_CODE != null &&
		queryResult.BOARD_CODE.trim().length != 0 &&
		queryResult.TYPE_CLASS != null && 
		queryResult.TYPE_CLASS.trim().length != 0 &&
		queryResult.SSN != null &&
		queryResult.SSN.trim().length == 9 &&
		queryResult.GENDER != null &&
		queryResult.GENDER.trim().length != 0 &&
		queryResult.PREF_COMMUNICATION != null &&
		queryResult.PREF_COMMUNICATION.trim().length != 0 &&
		queryResult.HS_INDC != null &&
		queryResult.HS_INDC.trim().length != 0 &&
		queryResult.DISC_1_INDC != null &&
		queryResult.DISC_1_INDC.trim().length != 0 &&
		queryResult.DISC_2_INDC != null &&
		queryResult.DISC_2_INDC.trim().length != 0 &&
		queryResult.DISC_3_INDC != null &&
		queryResult.DISC_3_INDC.trim().length != 0 &&
		queryResult.DISC_4_INDC != null &&
		queryResult.DISC_4_INDC.trim().length != 0 &&
		queryResult.DISC_5_INDC != null &&
		queryResult.DISC_5_INDC.trim().length != 0 &&
		queryResult.DATE_BIRTH != null &&
		queryResult.FEE_TYPE != null &&
		queryResult.FEE_TYPE.trim().length != 0 &&
		queryResult.CASH_NUMBER != null &&
		queryResult.CASH_NUMBER.trim().length != 0 &&
		queryResult.FEE_AMT != null &&
		queryResult.RECORD_TYPE != null &&
		queryResult.RECORD_TYPE.trim().length != 0 &&
		queryResult.CASH_DATE != null &&
		queryResult.RE_EXAM != null &&
		queryResult.RE_EXAM.trim().length != 0 &&
		queryResult.FNAME != null &&
		queryResult.FNAME.trim().length != 0 &&
		queryResult.LNAME != null &&
		queryResult.LNAME.trim().length != 0 &&
		queryResult.STREET_NAME != null &&
		queryResult.STREET_NAME.trim().length != 0 &&
		queryResult.CITY_TOWN != null &&
		queryResult.CITY_TOWN.trim().length != 0 //&&
		/*queryResult.STATE != null &&
		queryResult.STATE.trim().length != 0 &&
		queryResult.ZIP_CODEA != null &&
		queryResult.ZIP_CODEA.trim().length != 0*/
		)
	{
		if (queryResult.PREF_COMMUNICATION.toUpperCase() == "EMAIL")
		{
			// Email field is mandatory if preferred communication mode is Email.
			if (queryResult.EMAIL != null && queryResult.EMAIL.trim().length != 0)
			{
				validationResult = true;
			}
		}
		else
		{
			validationResult = true;
		}
		
		// CR 358 : Set the foreignAddressFlag to true in case State and Zip code do not exist.
		if (queryResult.STATE != null &&
			queryResult.STATE.trim().length != 0 &&
			queryResult.ZIP_CODEA != null &&
			queryResult.ZIP_CODEA.trim().length != 0)
		{
			foreignAddressFlag = false;
			
			if (validationResult)
			{
				validationResult = true;
			}
		}
		else
		{
			if ((queryResult.STATE != null &&
			queryResult.STATE.trim().length != 0) ||
			(queryResult.ZIP_CODEA != null &&
			queryResult.ZIP_CODEA.trim().length != 0))
			{
				validationResult = false;
			}
			else
			{
				foreignAddressFlag = true;
				
				if (validationResult)
				{
					validationResult = true;
				}
			}
		}
	}	
	

	return validationResult;
}

/** 
 * @desc This Method validates Application record for EL/FA boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws N/A.
 */
function applicationRecordValidation(queryResult)
{
	var validationResult = {};
	
	// Validate the SSN number.
	validationResult.ssnFlag = validateSSN(queryResult.SSN);
	validationResult.applicationRecordFlag = false;
	//Fix for PRD Defect 7931: PRD_DPL_PSI inteface the error msg shows EL:Invalid PSI Application data if the issue is of Address validation please fix this.
	validationResult.addressValidationFlag = false;
	
	if (validationResult.ssnFlag.ssnFlag)
	{
		ELPLogging.debug("SSN Number validated");
		
		// Validates the Address.
		
		// Defect 7599
		var addressLine1BuildingNo;
		if (queryResult.BUILDING_NUM)
		{
			addressLine1BuildingNo = queryResult. BUILDING_NUM + " " + queryResult.STREET_NAME;
		}
		else
		{
			addressLine1BuildingNo = queryResult.STREET_NAME;
		}
		
		var isEnabledAddressValidation = getSharedDropDownDescriptionDetails("PSI ADDRESS VALIDATION", "INTERFACE_ADDRESS_VALIDATION");
		
		contactAddressCondition = false;
		var contactAddressDetailsArrayTMP = new Array();
		
		// CR 358 : Do not valide address for foreign address.
		if(isEnabledAddressValidation.toLowerCase()=="true" && foreignAddressFlag == "false")
		{
			ELPLogging.debug("Start Address Validation");
			
			contactAddressDetailsArrayTMP = validateAddress(addressLine1BuildingNo, queryResult.ADDRS_2ND_LN, queryResult.CITY_TOWN, queryResult.STATE, queryResult.ZIP_CODEA, queryResult.BUILDING_NUM, "US", "DPL", "BATCHJOB");
			
			if(!contactAddressDetailsArrayTMP)
			{
				ELPLogging.debug("Invalid Address---");
				contactAddressDetailsArray["addressLine1"] = addressLine1BuildingNo;
				contactAddressDetailsArray["addressLine2"] = queryResult.ADDRS_2ND_LN;
				contactAddressDetailsArray["city"] = queryResult.CITY_TOWN;
				contactAddressDetailsArray["state"] = queryResult.STATE;
				contactAddressDetailsArray["zipCodeA"] = queryResult.ZIP_CODEA
				//contactAddressDetailsArray.addressValidationFlag = false;
				contactAddressCondition = true;
			}
			else			
			{
				contactAddressDetailsArray = contactAddressDetailsArrayTMP;
				contactAddressCondition = false;
			}
		}
		else
		{		
			ELPLogging.debug("Skipped Address Validation");
			contactAddressDetailsArray.addressLine1 = addressLine1BuildingNo;
			contactAddressDetailsArray.addressLine2 = queryResult.ADDRS_2ND_LN;
			contactAddressDetailsArray.city = queryResult.CITY_TOWN;
			contactAddressDetailsArray.state = queryResult.STATE;
			contactAddressDetailsArray.zipCodeA = queryResult.ZIP_CODEA;
			//contactAddressCondition = true;	
		}
		
		if (contactAddressDetailsArray)
		{
			ELPLogging.debug("Address validated");
			validationResult.addressValidationFlag = true;
			// Validates the Phone number.
			validationResult.phoneNumberFlag = validatePhoneNumber(queryResult.PRIMARY_PHONE);
			validationResult.applicationRecordFlag = true;
		}
		else
		{
			ELPLogging.debug("Invalid Address");
		}
	}
	else
	{
		ELPLogging.debug("Invalid SSN number");
	}
	
	return validationResult;
}

/** 
 * @desc The Method validates exam data available on License record or not.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @returns {Boolean} validation flag
 * @throws  N/A
 */ 
function validateExamDataAvilableInLicenseRecord(queryResult)
{
	var validationResult = false;
	
	// These are the required field to create an exam entry in application record.
	if ((queryResult.EXAM_DATE != null) && (queryResult.WRITTEN_SCORE != null) && (queryResult.TYPE_CLASS != "") && (queryResult.TYPE_CLASS.trim().length != 0))
	{
		validationResult = true;
		ELPLogging.debug("Exam details available on License Record");
	}
	else
	{
		ELPLogging.debug("Exam details not available on License Record");
	}
	
	return validationResult;
}

/** 
 * @desc The Method check for the duplicate record.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @returns {Boolean} validation flag
 * @throws  N/A
 */ 
function duplicateCheckForRecords(queryResult)
{
	var dulicateFlag = false;

	var emseDupCheckParameters = {"ssn" : queryResult.SSN, "boardCode" : queryResult.BOARD_CODE,
								  "typeClass" : queryResult.TYPE_CLASS,"licenseNumber" : queryResult.LICENSE_NUMBER,
								  "applicationNumber" : queryResult.APPLICATION_NUMBER, "examScore" : queryResult.WRITTEN_SCORE, "practicalScore" : queryResult.PRACTICAL_SCORE,
								  "examDate" : queryResult.EXAM_DATE,"vendor": "PSI", "recordType" : queryResult.RECORD_TYPE,
								  "rowNumber": queryResult.rowNumber, "runDate" : runDate, "fName" : queryResult.FNAME, "lName" : queryResult.LNAME};
	
	// Method will return the flag for duplicate record.
	// 0 : It mean record is not duplicate.
	// 1 : It means record is duplicate.
	dulicateFlag = callToStoredProcedure(emseDupCheckParameters, "duplicateCheckQuery");

	return dulicateFlag.duplicateflag;
}

/** 
 * @desc The Method Contains the business logic for PL/GF boards.
 * @param capId : Record capID model.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws  N/A
 */ 
function processPLGFRecords(capId, queryResult)
{
	ELPLogging.debug("Start processing for PL/GF board's record : " + queryResult.APPLICATION_NUMBER);
	
	// Process the records based on the record type i.e. Exam or License.
	if (queryResult.RECORD_TYPE == EXAM_RECORD)
	{
		// Create an exam entry into the Application record.
		createExamRecord(capId);
		
		var capScriptModel = aa.cap.getCap(capId).getOutput();
		
		var capModel = capScriptModel.getCapModel();
		
		var capTypeModel = capModel.getCapType();
		
		// For Journeyman Record if applicant failed exam for 6 or more times raise a condition on Application record.
		if (capTypeModel.getSubType() == "Journeyman" || capTypeModel.getSubType() == "Gas Fitter Journeyman")
		{
			var capIdScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
			var examModelList = aa.examination.getExaminationList(capIdScriptModel);
			
			var examScriptModel = examModelList.getOutput();
			
			var examAttempCount = 0;
			
			// To get the exam failed attempt count.
			for (index in  examScriptModel)
			{
				examAttempCount++;
			}

				// update the workflow for passed applicant
			if (queryResult.WRITTEN_SCORE < PASSING_SCORE && examAttempCount >= EXAM_ATTEMPT_SIX)
			{
				ELPLogging.debug("Raising "+ PLGF_CONDITION_NAME + " condition on application record");
				addStdConditionByConditionNumber(CONDITION_TYPE, PLGF_CONDITION_NAME, capId);

				var capConditionComment = "Applicants has failed the exam Six or more times";
				editConditionComment(capId, PLGF_CONDITION_NAME, capConditionComment);
				
				// Update Workflow task and assign the Board Staff.
				updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capId); 
				var userName = getSharedDropDownDescriptionDetails(PL_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
				assignTaskToUser(WFTASK, userName, capID)
			}

		}
		
		if(queryResult.WRITTEN_SCORE >= PASSING_SCORE)
		{
			ELPLogging.debug("Updating the work-flow task/status for passed applicant");
			updateTaskStatus("EXAM","Passed - Under Review","Exam Passed","Exam Passed","", capId);
			
		}
	}
	else if (queryResult.RECORD_TYPE == LICENSE_RECORD)
	{
		var licenseValidationResult = false;
		
		// Check if exam data available on License Record. 
		// If exist create an exam entry on Application record.
		licenseValidationResult = validateExamDataAvilableInLicenseRecord(queryResult);
		if (licenseValidationResult)
		{
			createExamRecord(capId);
		}
	}
}

/** 
 * @desc The Method Contains the business logic for EL/FA boards.
 * @param capId : Record capID model.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws  N/A
 */ 
function processELFARecords(capId, queryResult)
{
	var capListResult;
	var capIDModel;

	// Process the records based on the record type i.e. Application, Exam or License.
	if (queryResult.RECORD_TYPE == EXAM_RECORD)
	{
		ELPLogging.debug("Start processing for EL/FA board's record : " + queryResult.APPLICATION_NUMBER);
		
		// create exam entry on application record.
		createExamRecord(capId);
		
		// Accela common method gives the work-flow task/status for respective record.
		var workflowTaskStatusArray = loadTasks(capId);

		var statusDate;

		for (index in workflowTaskStatusArray)
		{		
			// To get the work-flow task/status update date. (WORKFLOW_STATUS = "Approved to Sit for Exam")
			if (workflowTaskStatusArray[index].status == WORKFLOW_STATUS) 
			{
				statusDate = workflowTaskStatusArray[index].statusdate;
			}
		}
		
		ELPLogging.debug("'Approved to Sit for Exam' status updated on : " + statusDate);
		//var daysDifference =  checkWorkFlowTaskStatusUpdateInRange(statusDate); 
		
		//ELPLogging.debug("Days between work-flow task/status update and today's date  : --- " + daysDifference);
		
		// Check the Exam date should be fall with in 1 year period from exam task approval.
		if (checkWorkFlowTaskStatusUpdateInRange(statusDate, EL_WINDOW_PERIOD)) 
		{
			if (queryResult.WRITTEN_SCORE >= PASSING_SCORE)
			{
				// update the workflow for passed applicant
				ELPLogging.debug("Updating the work-flow task/status for passed applicant");
				updateTaskStatus("EXAM","Passed - Under Review","Exam Passed","Exam Passed","", capId);
			}
			else if (queryResult.WRITTEN_SCORE < PASSING_SCORE)
			{
				var capScriptModel = aa.cap.getCap(capId).getOutput();
				
				var capModel = capScriptModel.getCapModel();
				
				var capTypeModel = capModel.getCapType();
				
				var capIdScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());

				var examModelList = aa.examination.getExaminationList(capIdScriptModel);
				
				var examScriptModel = examModelList.getOutput();
				
				var examAttempCount = 0;
				
				// Calculate the exam failed attempt count.
				for (index in  examScriptModel)
				{
					examAttempCount++;
				}
				
				ELPLogging.debug("Exam attempts count is : " + examAttempCount);
				if (examAttempCount == EXAM_ATTEMPT_THREE || examAttempCount == EXAM_ATTEMPT_SIX)
				{
					ELPLogging.debug("Raising "+ELFA_CONDITION_EXAM_FAILURE+ " condition on application record");
					// Raise a condition on Application record if exam attempt count is 3 or 6.
					addStdConditionByConditionNumber(CONDITION_TYPE, ELFA_CONDITION_EXAM_FAILURE, capId);

					var capConditionComment = "Applicants has failed the exam Three or Six times";
					editConditionComment(capId, ELFA_CONDITION_EXAM_FAILURE, capConditionComment);
					// Update Workflow task/status and assign the Board Staff.
					updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capId);
					var userName = getSharedDropDownDescriptionDetails(EL_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
					ELPLogging.debug("User NAme is  : " + userName);
					assignTaskToUser(WFTASK, userName, capID)				
				}
			}
		}
		else
		{
			ELPLogging.debug("Raising " + ELFA_CONDITION_REGISTRATION_EXPIRED+ " condition on application record for records which is not fall in 1 year window");
			// Raise a condition on application record if exam date does not fall in 1 year window.
			addStdConditionByConditionNumber(CONDITION_TYPE, ELFA_CONDITION_REGISTRATION_EXPIRED, capId);

			editConditionComment(capId, ELFA_CONDITION_REGISTRATION_EXPIRED, ELFA_CONDITION_REGISTRATION_EXPIRED_COMMENT);
			
			// Update Workflow task/status and assign the Board Staff.
			updateTaskStatus(WFTASK, WFSTATUS, capConditionComment,capConditionComment,"", capId);
			var userName = getSharedDropDownDescriptionDetails(EL_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
			assignTaskToUser(WFTASK, userName, capID)
		}
	}
	else if (queryResult.RECORD_TYPE == LICENSE_RECORD)
	{
		ELPLogging.debug("Start processing for EL/FA board's record : " + queryResult.APPLICATION_NUMBER);
		
		// Check Exam Data available
		var licenseValidationResult = false;

		// The Method validates exam data available on License record or not.
		licenseValidationResult = validateExamDataAvilableInLicenseRecord(queryResult);

		if (licenseValidationResult)
		{			
			// Call method the create the exam entry on Application record.
			createExamRecord(capId);
		}	
	}
}

/** 
 * @desc The Method Contains the business logic to create application record for EL/FA boards.
 * @param queryResult : Contains dataSet of PSI Staging table.
 * @throws  N/A
 */ 
function createApplicationRecord(queryResult)
{
	var capAlias = queryResult.BOARD_CODE + "-"+queryResult.TYPE_CLASS;
	
	// Get the cap type based on 'Board-Type class' key.
	var pCapType = getSharedDropDownDescriptionDetails(capAlias, CAP_TYPE_STD_CHOICE);
	
	// Creating Application record.
	var capIDModel = createCap(pCapType, null);
	ELPLogging.debug("Application Record created with ID : " + capIDModel);
	
	if (capIDModel) 
	{
		var capResult = aa.cap.getCap(capIDModel);
		var capScriptModel = capResult.getOutput();
		
		if (capScriptModel)
		{
			//set values for CAP record
			var capModel = capScriptModel.getCapModel();
			capModel.setCapStatus("Submitted");
			capModel.setCapClass("COMPLETE");
			capModel.setReportedDate(new java.util.Date());
			capModel.setFileDate(new java.util.Date());

			var capTypeModel = capModel.getCapType();
			
			capTypeModel.setCategory("License");	
			capModel.setCapType(capTypeModel);

			var editResult = aa.cap.editCapByPK(capModel);
			
			if(!editResult.getSuccess())
			{
				ELPLogging.debug("Error editing the cap record for "+capIDModel+": "+editResult.getErrorMessage());
			}
			
			//set the channel reported field to Interface
			var capDetailScriptModel = aa.cap.getCapDetail(capIDModel).getOutput();
			var capDetailModel = capDetailScriptModel.getCapDetailModel();
			capDetailModel.setReportedChannel("Interface");
			capDetailModel.setShortNotes(queryResult.BOARD_CODE);
			var editCapDetailResult = aa.cap.editCapDetail(capDetailModel);

			if(!editCapDetailResult.getSuccess())
			{
				ELPLogging.debug("Error updating Channel Reported for "+capDetailModel+": "+editCapDetailResult.getErrorMessage());
			}
			ELPLogging.debug("Successfully updated Channel Reported  for record ID : " +capIDModel);

			// Update the ASI values on application records.
			updateASIValues(capIDModel, "APPLICANT INFORMATION", "Have you ever applied for and/or taken the MA Electrician/Systems exam(s)?", queryResult.RE_EXAM);
			
			// Update the ASI values on application records.
			updateASIValues(capIDModel, "APPLICANT INFORMATION", "Do you have a high school diploma or equivalency?", queryResult.HS_INDC);
			
			// Assign the intake application to Staff member in order to proceed with the business flow.
			if (queryResult.BOARD_CODE == "EL" || queryResult.BOARD_CODE == "FA") {
				var userName = getSharedDropDownDescriptionDetails(EL_BOARDSTAFF_ID, TASK_ASSIGNMENT_STD_CHOICE);
				assignTaskToUser("Intake", userName, capIDModel);
			}
			
			// Assign task to Department
			if (queryResult.BOARD_CODE == "EL" || queryResult.BOARD_CODE == "FA") {
				var department = "DPL/DPL/LIC/ELECTRIC/STAFF/NA/NA";
				ELPLogging.debug("Setting the Dept Value.");
				updateTaskDeptt("Intake", department, capIDModel);
			}
			
			var noFeeCollectedObject;
			
			if (queryResult.NO_FEE_COLLECTED == "1")
			{
				noFeeCollectedObject = "Active Duty";
			}
			else if(queryResult.NO_FEE_COLLECTED == "2")
			{
				noFeeCollectedObject = "Veteran";
			}
			else if(queryResult.NO_FEE_COLLECTED == "3")
			{
				noFeeCollectedObject = "Spouse";
			}
			else
			{
				noFeeCollectedObject = "N/A";
			}
			
			// Update the ASI values on application records.
			updateASIValues(capIDModel, "MILITARY STATUS", "Military Status", noFeeCollectedObject);
			
			var tableValuesArray = {};
			
			tableValuesArray["Cash Date"] = jsDateToMMDDYYYY(queryResult.CASH_DATE);
			tableValuesArray["Cash Number"] = String(queryResult.CASH_NUMBER);
			tableValuesArray["Fee Type"] = String(queryResult.FEE_TYPE);
			tableValuesArray["Fee Amount"] = String(queryResult.FEE_AMT);
			tableValuesArray["City/State"] = String(queryResult.SCHOOL_LOCATION);
			tableValuesArray["Completion Date"] = String(queryResult.GRAD_YEAR);
			tableValuesArray["School/Institution"] = String(queryResult.SCHOOL_GRADUATED);
			tableValuesArray["Hours Completed"] = "";
			
			// Updating ASIT on application record.
			addASITValueToRecord("EXAM VENDOR CASH INFO", tableValuesArray, capIDModel);
			addASITValueToRecord("SCHOOLS/COLLEGES ATTENDED", tableValuesArray, capIDModel);
			
			// Adding Application fee on Application record.
			feeOnApplicationRecord(capIDModel, queryResult.RECORD_TYPE);
			// Update the Status of the fees on the application record
			//updateFeeStatus(capIDModel, queryResult.RECORD_TYPE);
		}
		else
		{
			ELPLogging.debug("Error retrieving the cap "+capIDModel+": "+capResult.getErrorMessage());
		}
		
		// Create a new contact as reference contact does not exist.
		var contactAddressObject = {};
		contactAddressObject.addressType = "Mailing Address";
		contactAddressObject.contactType = "Applicant";
		createCapContact(capIDModel, queryResult, contactAddressObject);
	
		// Creating premise address for Application record.
		//createPremiseAddress(capIDModel, queryResult);
	}
	else
	{
		ELPLogging.debug("Error creating the cap contact");
	}
	
	return capIDModel;
}

//Fix for PROD Defect : 6003 : SM Apprentice licenses not being changed to status of "upgraded" when SM Journeyperson app is approved
/**
 * @desc This method will upgrade Sheet Metal Apprentice license associated with the reference contact when Journeyperson application Approved.
 * @param {capId} contains capId.
 * @returns N/A
 */
function upgradeSheetMetalApprenticeLicenses(capId)
{
	ELPLogging.debug("Upgrading Sheet Metal Apprentice Licenses for recordID : "+capId);
	//Get the Apprentice License # from ASI
	/* var apprenticeASILicNo = getAppSpecific("Apprentice License #");
	aa.print("apprenticeASILicNo = "+apprenticeASILicNo); */
	
	// Get contacts associated with the capid
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if(capContactResult.getSuccess())
	{
		capContactResult=capContactResult.getOutput();
		for(index in capContactResult)
		{
			thisCapContact = capContactResult[index];
			thisPeople = thisCapContact.getPeople();

			// If the given contact is not "Applicant", continue
			if (thisPeople.contactType != "Applicant")
			continue;

			// For "Applicant", get  getCapContactModel
			capContactModel = thisCapContact.getCapContactModel();

			// Extract contact ref number
			var vRefNumber = capContactModel.refContactNumber;
			ELPLogging.debug("vRefNumber = "+vRefNumber);

			//Function call to get all licenses associated with Ref Contact number
			var allLicenses = getLicensesByRefContact(vRefNumber);
			ELPLogging.debug("allLicenses = "+allLicenses);
			if (allLicenses)
			{
				var associatedCapId = aa.cap.getCapID(allLicenses).getOutput();
				ELPLogging.debug("associatedCapId = "+associatedCapId);
				//Close Work flow
				//Fixes for defect 6003- Do not close the workflow task while upgrading
				//closeLicWorkflowForAssociatedLicense(associatedCapId);
				
				//Update the status of apprentice license to 'Upgraded'
				updateAppStatus("Upgraded", "Automatic update through script", associatedCapId);
                updateTaskStatus("License", "Upgraded", "Automatic update through script","Automatic update through script","", associatedCapId); 
				
				//Get LicenseProfessions based on capID.
				var licModels = aa.licenseProfessional.getLicensedProfessionalsByCapID(associatedCapId).getOutput();

				for (index in licModels)
				{
					var licModel = licModels[index];
					//Check the license number with the once extracted from the ASI
					
					if (licModel.licenseType == "Sheet Metal Apprentice")
					{
						var apprenticeASILicNo = licModel.licenseNbr;
						ELPLogging.debug("apprenticeASILicNo = "+apprenticeASILicNo);
						//If same, then disable the LP record
						// Changing the status of Ref LP
						var licProf = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, apprenticeASILicNo).getOutput();

						for (i in licProf)
						{
							var indLicProf = licProf[i];
							var type = indLicProf.getLicenseType();
							ELPLogging.debug("type = "+type);
							if (type != "Sheet Metal Apprentice")
								continue;
							indLicProf.setWcExempt("N");
							indLicProf.setPolicy("Upgraded");
							aa.licenseScript.editRefLicenseProf(indLicProf);
							var result = aa.licenseScript.updateLicenseStatusByTypeAndNbr(type, apprenticeASILicNo, "I");
							ELPLogging.debug("Success: " + result.getSuccess());
						}
					}
				}
			}
		}
	}
}

/**
 * @desc This method will retrieve licenses by reference contacts.
 * @param {ipRefContact} contains ipRefContact.
 * @returns {opLic} license ID.
 */
function getLicensesByRefContact(ipRefContact) 
{
	ELPLogging.debug("Retrieve licenses by reference contact : "+ipRefContact);
	var opLic = "";
	var fvPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
	var fvCcb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput();
	fvPeople.setServiceProviderCode(aa.getServiceProviderCode());
	fvPeople.setContactSeqNumber(ipRefContact);

	var fvCapsQry = fvCcb.getCapContactsByRefContactModel(fvPeople);
	if (!fvCapsQry)
		return opLic;
	var fvCaps = fvCapsQry.toArray();
	if (!fvCaps)
		return opLic;

	for (var fvCounter in fvCaps) 
	{
		var fvCap = fvCaps[fvCounter];
		if (!fvCap)
			continue;
		var fvCapIDTmp = fvCap.getCapID();
		if (!fvCapIDTmp)
			continue;
		var fvCapIDQry = aa.cap.getCapID(fvCapIDTmp.getID1(), fvCapIDTmp.getID2(), fvCapIDTmp.getID3());
		if (!fvCapIDQry || !fvCapIDQry.getSuccess())
			continue;
		var fvCapID = fvCapIDQry.getOutput();
		if(!fvCapID)
			continue;
		var fvCapMQry = aa.cap.getCap(fvCapID);
		if (!fvCapMQry || !fvCapMQry.getSuccess())
			continue;
		var fvCapM = fvCapMQry.getOutput();
		if (!fvCapM)
			continue;
		var fvCapType = fvCapM.getCapType();
		if (!fvCapType)
			continue;

		if (fvCapType.getGroup() != "License" )
		   continue;
		if (fvCapType.getType() != "Sheet Metal")
		   continue;
		if (fvCapType.getSubType() != "Apprentice")
		   continue;
		if (fvCapType.getCategory() != "License")
		   continue;
		opLic = fvCapID.getCustomID();
		ELPLogging.debug("opLic = "+opLic);
	}
	return opLic;
}

/**
* @desc This method will retrieve licenses by reference contacts.
* @param {ipRefContact} contains ipRefContact.
* @returns {opLic} license ID.
*/
function closeLicWorkflowForAssociatedLicense(associatedCapId)
{
	ELPLogging.debug("Closing wrokflow task for : "+associatedCapId);
	//Variables defined
	var sysDate = aa.date.getCurrentDate();

	//Access workflow
	var workflowResult = aa.workflow.getTasks(associatedCapId);
	if (workflowResult.getSuccess())
	{
		wfObj = workflowResult.getOutput();
		for (var i=0; i< wfObj.length; i++)
		{
			var fTask = wfObj[i];
			var desc = fTask.getTaskDescription();
			var activeFlag = fTask.getActiveFlag();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			ELPLogging.debug("RecordId:"+ associatedCapId.getCustomID() + " DESC: " + desc+ " Active Flag: " + fTask.getActiveFlag() + " Step no: " + stepnumber + " Process ID: " + processID);
			
			ELPLogging.debug("desc = "+desc+" && "+activeFlag);
			//Closing workflow
			if(desc == "License" && activeFlag == "Y")
			{
				var updateWorkflowTaskResult = aa.workflow.handleDisposition(associatedCapId,stepnumber,processID,"Upgraded",sysDate, "","Updated via script",systemUserObj ,"Y");
				ELPLogging.debug("Updated status: " + fTask.getDisposition() + " " + "Succeeded: " +updateWorkflowTaskResult.getSuccess());
			}
		}
	}
	else
	{
		ELPLogging.debug("Workflow else part.");
	}
}

/**
 * @desc This method will upgrade Sheet Metal Journeyperson license associated with the reference contact.
 * @param {capId} contains capId.
 * @returns N/A
 */
function upgradeSheetMetalJourneypersonLicense(capId)
{
	ELPLogging.debug("Upgrading Sheet Metal Journeyman license : "+capId);
	//Get the License # from ASI
	var asiLicNo = getAppSpecific("License #");
	ELPLogging.debug("asiLicNo : "+asiLicNo);
	
	// Check if user wants to keep your Journeyperson License Active
	var checkforJPActive = getAppSpecific("If approved to receive a Master License, do you want to keep your Journeyperson License Active?");
	ELPLogging.debug("checkforJPActive = "+checkforJPActive);
	
	if (checkforJPActive == "No")
	{
		// Get contacts associated with the capid
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if(capContactResult.getSuccess())
		{
			capContactResult=capContactResult.getOutput();
			for(yy in capContactResult)
			{
				thisCapContact = capContactResult[yy];
				thisPeople = thisCapContact.getPeople();

				// If the given contact is not "Applicant", continue
				if (thisPeople.contactType != "Applicant")
				continue;

				// For "Applicant", get  getCapContactModel
				capContactModel = thisCapContact.getCapContactModel();

				// Extract contact ref number
				var vRefNumber = capContactModel.refContactNumber;
				ELPLogging.debug("vRefNumber: " + vRefNumber);

				//Function call to get all licenses associated with Ref Contact number
				var allLicenses = getLicensesByRefContactForJourneyperson(vRefNumber);
				if (allLicenses)
				{
					var associatedCapId = aa.cap.getCapID(allLicenses).getOutput();
					ELPLogging.debug("Journeyperson Record: " + associatedCapId.getCustomID());

					//Close Work flow
					//Fixes for defect 6003- Do not close the workflow task while upgrading
					//closeLicWorkflowForAssociatedLicense(associatedCapId);

					//Update the status of apprentice license to 'Upgraded'
					updateAppStatus("Upgraded", "Updated via Interface", associatedCapId);
                    updateTaskStatus("License", "Upgraded", "Automatic update through script","Automatic update through script","", associatedCapId); 

					//Get LicenseProfessions based on capID.
					var licModels = aa.licenseProfessional.getLicensedProfessionalsByCapID(associatedCapId).getOutput();
					if (licModels)
					{
						for ( ll in licModels)
						{
							var licModel = licModels[ll];

							//Check the license number with the once extracted from the ASI
                            ELPLogging.debug("licModel.licenseNbr = "+licModel.licenseNbr);
							if (asiLicNo == licModel.licenseNbr)
							{
								//If same, then disable the LP record
								//licModel.setAuditStatus("I");

								// Changing the status of Ref LP
								var licProf = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, licModel.licenseNbr).getOutput();

								for (i in licProf)
								{
									var indLicProf = licProf[i];
									var type = indLicProf.getLicenseType();
                                    if (type != "Sheet Metal Journeyperson")
                                        continue;
                                    indLicProf.setWcExempt("N");
								    indLicProf.setPolicy("Upgraded");
									aa.licenseScript.editRefLicenseProf(indLicProf);
									var result = aa.licenseScript.updateLicenseStatusByTypeAndNbr(type, licModel.licenseNbr, "I");
									ELPLogging.debug("Success:" + result.getSuccess());
								}
							}
						}
					}
				}
			}
		}
	}

}

/**
 * @desc This method will retrieve licenses by reference contacts.
 * @param {ipRefContact} contains ipRefContact.
 * @returns {opLic} license ID.
 */
function getLicensesByRefContactForJourneyperson(ipRefContact)
{
    var opLic = "";
    var fvPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
    var fvCcb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput();
    fvPeople.setServiceProviderCode(aa.getServiceProviderCode());
    fvPeople.setContactSeqNumber(ipRefContact);

    var fvCapsQry = fvCcb.getCapContactsByRefContactModel(fvPeople);
    if (!fvCapsQry)
        return opLic;
    var fvCaps = fvCapsQry.toArray();
    if (!fvCaps)
        return opLic;

    for (var fvCounter in fvCaps) {
        var fvCap = fvCaps[fvCounter];
        if (!fvCap)
            continue;
        var fvCapIDTmp = fvCap.getCapID();
        if (!fvCapIDTmp)
            continue;
        var fvCapIDQry = aa.cap.getCapID(fvCapIDTmp.getID1(), fvCapIDTmp.getID2(), fvCapIDTmp.getID3());
        if (!fvCapIDQry || !fvCapIDQry.getSuccess())
            continue;
        var fvCapID = fvCapIDQry.getOutput();
        if(!fvCapID)
            continue;
        var fvCapMQry = aa.cap.getCap(fvCapID);
        if (!fvCapMQry || !fvCapMQry.getSuccess())
            continue;
        var fvCapM = fvCapMQry.getOutput();
        if (!fvCapM)
            continue;
        var fvCapType = fvCapM.getCapType();
        if (!fvCapType)
            continue;

        if (fvCapType.getGroup() != "License" )
           continue;
        if (fvCapType.getType() != "Sheet Metal")
           continue;
        if (fvCapType.getSubType() != "Journeyperson")
           continue;
        if (fvCapType.getCategory() != "License")
           continue;
        opLic = fvCapID.getCustomID();
    }
    return opLic;
}

// JIRA 1355
/**
 * @desc This method will upgrade PLGF Apprentice license associated with the reference contact when Journeyperson application Approved.
 * @param {capId} contains capId.
 * @returns N/A
 */
function upgradePLGFApprenticeLicenses(capId)
{
	ELPLogging.debug("Upgrading PLGF Apprentice Licenses for recordID : "+capId);
	//Get the Apprentice License # from ASI
	/* var apprenticeASILicNo = getAppSpecific("Apprentice License #");
	aa.print("apprenticeASILicNo = "+apprenticeASILicNo); */
	
	// Get contacts associated with the capid
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if(capContactResult.getSuccess())
	{
		capContactResult=capContactResult.getOutput();
		for(index in capContactResult)
		{
			thisCapContact = capContactResult[index];
			thisPeople = thisCapContact.getPeople();

			// If the given contact is not "Applicant", continue
			if (thisPeople.contactType != "Applicant")
			continue;

			// For "Applicant", get  getCapContactModel
			capContactModel = thisCapContact.getCapContactModel();

			// Extract contact ref number
			var vRefNumber = capContactModel.refContactNumber;
			ELPLogging.debug("vRefNumber = "+vRefNumber);

			//Function call to get all licenses associated with Ref Contact number
			var allLicenses = getLicensesByRefContactPLGF(vRefNumber);
			ELPLogging.debug("allLicenses = "+allLicenses);
			if (allLicenses)
			{
				var associatedCapId = aa.cap.getCapID(allLicenses).getOutput();
				ELPLogging.debug("associatedCapId = "+associatedCapId);
				//Close Work flow
				//Fixes for defect 6003- Do not close the workflow task while upgrading
				//closeLicWorkflowForAssociatedLicense(associatedCapId);
				
				//Update the status of apprentice license to 'Upgraded'
				updateAppStatus("Upgraded", "Automatic update through script", associatedCapId);
                updateTaskStatus("License", "Upgraded", "Automatic update through script","Automatic update through script","", associatedCapId); 
				
				//Get LicenseProfessions based on capID.
				var licModels = aa.licenseProfessional.getLicensedProfessionalsByCapID(associatedCapId).getOutput();

				for (index in licModels)
				{
					var licModel = licModels[index];
					//Check the license number with the once extracted from the ASI
					ELPLogging.debug ("licModel.licenseType ---" + licModel.licenseType);
					if (licModel.licenseType == "Apprentice Plumber" || licModel.licenseType == "Apprentice Gas Fitter")
					{
						var apprenticeASILicNo = licModel.licenseNbr;
						ELPLogging.debug("apprenticeASILicNo = "+apprenticeASILicNo);
						//If same, then disable the LP record
						// Changing the status of Ref LP
						var licProf = aa.licenseScript.getRefLicensesProfByLicNbr(servProvCode, apprenticeASILicNo).getOutput();

						for (i in licProf)
						{
							var indLicProf = licProf[i];
							var type = indLicProf.getLicenseType();
							ELPLogging.debug("type = "+type);
							if (type == "Apprentice Plumber")
							{
								ELPLogging.debug("type = "+type);
							}
							else
								if (type != "Apprentice Gas Fitter")
								continue;
							indLicProf.setWcExempt("N");
							indLicProf.setPolicy("Upgraded");
							aa.licenseScript.editRefLicenseProf(indLicProf);
							var result = aa.licenseScript.updateLicenseStatusByTypeAndNbr(type, apprenticeASILicNo, "I");
							ELPLogging.debug("Success: " + result.getSuccess());
							addToLicenseSyncSet(associatedCapId);
						}
					}
				}
			}
		}
	}
}

/**
 * @desc This method will retrieve licenses by reference contacts.
 * @param {ipRefContact} contains ipRefContact.
 * @returns {opLic} license ID.
 */
function getLicensesByRefContactPLGF(ipRefContact) 
{
	ELPLogging.debug("Retrieve licenses by reference contact : "+ipRefContact);
	var opLic = "";
	var flag =  false;
	var fvPeople = aa.people.createPeopleModel().getOutput().getPeopleModel();
	var fvCcb = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactDAOOracle").getOutput();
	fvPeople.setServiceProviderCode(aa.getServiceProviderCode());
	fvPeople.setContactSeqNumber(ipRefContact);

	var fvCapsQry = fvCcb.getCapContactsByRefContactModel(fvPeople);
	if (!fvCapsQry)
		return opLic;
	var fvCaps = fvCapsQry.toArray();
	if (!fvCaps)
		return opLic;

	for (var fvCounter in fvCaps) 
	{
		var fvCap = fvCaps[fvCounter];
		if (!fvCap)
			continue;
		var fvCapIDTmp = fvCap.getCapID();
		if (!fvCapIDTmp)
			continue;
		var fvCapIDQry = aa.cap.getCapID(fvCapIDTmp.getID1(), fvCapIDTmp.getID2(), fvCapIDTmp.getID3());
		if (!fvCapIDQry || !fvCapIDQry.getSuccess())
			continue;
		var fvCapID = fvCapIDQry.getOutput();
		if(!fvCapID)
			continue;
		var fvCapMQry = aa.cap.getCap(fvCapID);
		if (!fvCapMQry || !fvCapMQry.getSuccess())
			continue;
		var fvCapM = fvCapMQry.getOutput();
		if (!fvCapM)
			continue;
		var fvCapType = fvCapM.getCapType();
		if (!fvCapType)
			continue;

		if (fvCapType.getGroup() != "License" )
		   continue;
		if (fvCapType.getType() != "Plumbers and Gas Fitters")
		   continue;
		if (fvCapType.getSubType() == "Apprentice")
			flag = true;
		else
		   if (fvCapType.getSubType() != "Gas Fitter Apprentice")
		   continue;
		if (fvCapType.getCategory() != "License")
		   continue;
		opLic = fvCapID.getCustomID();
		ELPLogging.debug("opLic = "+opLic);
	}
	return opLic;
}

// POC
/**
 * @description Get the record count in the staging table to be processed.
 * @param  {string} serviceProviderCode
 * @param  {string} batchInterfaceName
 * @param  {date} runDate
 * @return {int} record count
 */
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
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
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
    	// var hasRunDate = false;
    	// var alterSql = "EXECUTE IMMEDIATE 'ALTER SESSION set nls_date_format = ''DD-MON-YYYY HH24:MI:SS'' ';";
    	// var alterStm = dbConn.createStatement();
    	// alterStm.executeUpdate(alterSql);

        for (p in parameters) {
            ELPLogging.debug("**INFO: " + p + ": " + parameters[p]);
        }

        var stmt = null;
        var sql = "select * from " + parameters["tableName"];
        if (!parameters["runDate"] || parameters["runDate"] == null) {
            sql += " WHERE INTAKE_STATUS = ? order by LICENSE_NUMBER asc";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            stmt.setString(1, parameters["intakeStatus"]);
        } else {
            sql += " WHERE RUN_DATE like ? order by LICENSE_NUMBER asc";
            ELPLogging.debug("** SQL: " + sql);
            stmt = dbConn.prepareStatement(sql);
            var sql_date = new java.sql.Date(parameters["runDate"].getTime());
            stmt.setDate(1, sql_date);
        }

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}

function getErrorReportRecords(parameters) {
    var dataSet = null;
    try {

        var stmt = null;
        var sql = "select * from " + parameters["tableName"] + " where batchInterfaceName = ? and run_date like ?";
        stmt = dbConn.prepareStatement(sql);
        stmt.setString(1, parameters["batchInterfaceName"]);
        var sql_date = new java.sql.Date(parameters["runDate"].getTime());
        stmt.setDate(2, sql_date);

        var rs = stmt.executeQuery();

        var queryProcedure = new StoredProcedure(selectQueryObj.selectQuery, dbConn);
        var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

        dataSet = ds;

    } catch (ex) {
        ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
    }
    return dataSet;
}