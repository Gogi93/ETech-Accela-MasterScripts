/***********************************************************************************************************************************
 * @Title 		: 	EMSE_DPL_INT_CEU_INTAKE
 * @Author		:	Sagar Cheke
 * @Date			:	04/02/2015
 * @Description 	: 	This Script will query the staging table to retrieve the records that were loaded for processing from the
CEU Inbound file. Script will perform validation for required fields, provider code and course name and
duplicate record check based on License	Number, Board Code, Type Class, Provider Code, Course Name, Course
Date. If this validation passes script will create CE Submission record in Accela system and link it as a
child of the Parent Record. Record will be assigned to the particular board staff. If any validation fails
record will be deleted from staging table, inserts into error table and an email will be triggered for any
erroneous record.
 ***********************************************************************************************************************************/

// POC
var selectQueryObj = {
	"selectQuery": {
		"table": "ELP_TBL_CEU_STG_DPL",
		"parameters": {
			"list": [{
					"name": "runDate",
					"source": "RESULT",
					"property": "runDate",
					"type": "DATE_TIME",
					"parameterType": "IN"
				}, {
					"name": "intakeStatus",
					"source": "RESULT",
					"property": "intakeStatus",
					"type": "STRING",
					"parameterType": "IN"
				}, {
					"name": "sp_cursor",
					"source": "RESULT",
					"property": "sp_cursor",
					"type": "ResultSet",
					"parameterType": "OUT"
				}
			]
		},
		"resultSet": {
			"list": [{
					"name": "rowNumber",
					"source": "RESULT",
					"property": "ROW_NUMBER",
					"type": "INTEGER",
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
					"name": "providerCode",
					"source": "RESULT",
					"property": "PROVIDER_CODE",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "dplPin",
					"source": "RESULT",
					"property": "DPL_PIN",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "courseDate",
					"source": "RESULT",
					"property": "COURSE_DATE",
					"type": "DATE_TIME",
					"parameterType": "OUT"
				}, {
					"name": "courseName",
					"source": "RESULT",
					"property": "COURSE_NAME",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "courseNumber",
					"source": "RESULT",
					"property": "COURSE_NUMBER",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "courseHours",
					"source": "RESULT",
					"property": "COURSE_HOURS",
					"type": "STRING",
					"parameterType": "OUT"
				}, {
					"name": "codeCycle",
					"source": "RESULT",
					"property": "CODE_CYCLE",
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
				}
			]
		}
	}
};

try {
	try {
		//Import the utility script which contains functions that will be used later
		var SCRIPT_VERSION = 3.0;
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_STRINGBUILDER"));
		eval(getScriptText("EMSE_MA_INT_C_EMAIL"));
		eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
		eval(getScriptText("INCLUDES_CUSTOM"));
		var returnException;
		ELPLogging.debug("Finished loading the external scripts");
	} catch (ex) {
		returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}

	try {
		//load all of the input parameters into objects
		var stagingConfigObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("stagingConfiguration"));
		var staticParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("staticParameters"));
		var dynamicParamObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("dynamicParameters"));
		var batchAppResultObj = datatypeHelper.loadObjectFromParameter(aa.env.getValue("batchApplicationResult"));
		ELPLogging.debug("Finished loading the input parameters into JSON objects");
	} catch (ex) {
		returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}

	try {
		//Create a connection to the Staging Table Database
		var dbConn = DBUtils.connectDB(stagingConfigObj.connectionInfo);
		ELPLogging.debug("Established a Database Connection");
	} catch (ex) {
		returnException = new ELPAccelaEMSEException("Error Connecting to Staging Table Database " + ex.message, ScriptReturnCodes.STAGING_CONNECTION);
		ELPLogging.fatal(returnException.toString());
		throw returnException;
	}

	try {
		// POC
		var processedCount = countStagingRecords(new Date(batchAppResultObj.runDate));

		// POC
		// Code to update processed count in the Dynamic table
		// var processedCount = countImportedRecords(new Date(batchAppResultObj.runDate));
		ELPLogging.debug("Processed Count : " + processedCount);

		updateDynamicParams(processedCount);
		dynamicParamObj.lastRunXML = "Number of records in file: " + batchAppResultObj.recordCount + " , Number of records successfully processed: " + processedCount;
		var DPS = JSON.stringify(dynamicParamObj);
		aa.env.setValue("dynamicParameters", DPS);
	} catch (ex) {
		ELPLogging.notify("Error in updating Dynamic table with processed record count " + ex.toString());
	}

	//Global variable declaration
	ELPLogging.debug("*******  Start creating global variables  ***************");

	aa.env.setValue("BatchJobName", "ELP.DPL.CEU.INTAKE");
	var HOUR_SEC = (60 * 60);
	aa.env.setValue("TIMEOUT", HOUR_SEC);
	var TIMER = new ELPTimer(HOUR_SEC);
	ELPLogging.debug("Timer Started");
	//Parsing run date
	var RUN_DATE = null;
	var runDateMs = Date.parse(batchAppResultObj.runDate);
	if (runDateMs != null) {
		RUN_DATE = new Date(runDateMs);
	} else {
		RUN_DATE = new Date();
	}
	ELPLogging.debug("*******  Ends creating global variables  ***************");

	var queryResult = null;
	var dataSetStg = null;

	try {
		// POC
		var emseQueryParameters = {
			"intakeStatus": "EXTRACTED_FILE",
			"tableName": selectQueryObj.selectQuery.table
		};

		dataSetStg = getStgRecords(emseQueryParameters);

		// POC
		// //Query staging table based on intake status as "EXTRACTED_FILE".
		// //IN parameters to the query stored procedure
		// var emseQueryParameters = {"intakeStatus":"EXTRACTED_FILE" };
		// //Querying staging table
		// dataSetStg = queryStgRecord(emseQueryParameters);
	} catch (ex
		if ex instanceof StoredProcedureException) {
		returnException = new ELPAccelaEMSEException("Error querying Staging Table Records: " + ex.message, ScriptReturnCodes.STAGING_PROCEDURE);
		ELPLogging.fatal(" Fatal Error " + returnException.toString());
		throw returnException;
	}
	var counter;
	var thisCounter;
	while ((queryResult = dataSetStg.next()) != null) {
		TIMER.checkTimeout();
		try {
			// Duplicate check for the record.
			if (validateReqdFields(queryResult)) {
				ELPLogging.debug("Validation for required fields passed.");

				if (!duplicateRecordCheck(queryResult)) {
					ELPLogging.debug("Duplicate check passed.");
					var licenseIDModel = null;

					var altID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
					ELPLogging.debug("Processing License Record ID : " + altID);
					//Retrieving record ID.
					var capIdResult = aa.cap.getCapID(altID);

					if (capIdResult.getSuccess()) {
						licenseIDModel = capIdResult.getOutput();
						ELPLogging.debug("CapID Model : " + licenseIDModel);

						if (licenseIDModel != null) {
							counter = 0;
							thisCounter = 0
								var isRecordProcessed = processCEUSubmissionRecord(licenseIDModel, queryResult);

							if (isRecordProcessed) {
								ELPLogging.debug("Starts updating CEU staging table for PROCESSED_EMSE.");

								//IN parameters to update stored procedure
								var emseUpdateParameters = {
									"rowNumber": queryResult.rowNumber,
									"intakeStatus": "PROCESSED_EMSE"
								}
								updateStgRecord(emseUpdateParameters);

								ELPLogging.debug("Finished updating CEU staging table.");
							}
						}
					} else {
						//IN parameters to update stored procedure
						ELPLogging.debug("Invalid record ID.");

						//Inserting record in the error table
						var errorDescription = queryResult.boardCode + ": Invalid record " + altID + " found. Provider code is " + queryResult.providerCode;
						updateErrorTable(altID, errorDescription);

						//Deleting record from staging table
						var emseDeleteParameters = {
							"rowNumber": queryResult.rowNumber
						};
						deleteStgRecord(emseDeleteParameters);
					}
				} else {
					var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
					ELPLogging.debug("Duplicate record " + recordID + " found.");

					//Inserting record in the error table
					var errorDescription = queryResult.boardCode + ": Duplicate Record " + recordID + " found.  Provider code is " + queryResult.providerCode;
					updateErrorTable(recordID, errorDescription);

					//Deleting record from staging table
					var emseDeleteParameters = {
						"rowNumber": queryResult.rowNumber
					};
					deleteStgRecord(emseDeleteParameters);
				}

			} else {
				//Fix for PRD defect 7354 : PRD_DPL_CEU_when there is a blank row in the file the error table records it as null-null instead of deleting that entry
				if (queryResult.boardCode == null && queryResult.licenseNumber == null && queryResult.typeClass == null) {
					//Deleting record from staging table
					ELPLogging.debug("Empty row found. Delete record from staging table.");
					var emseDeleteParameters = {
						"rowNumber": queryResult.rowNumber
					};
					deleteStgRecord(emseDeleteParameters);
				} else {
					var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
					ELPLogging.debug("Record " + recordID + " missing required fields.");

					//Inserting record in the error table
					var errorDescription = queryResult.boardCode + ": Record " + recordID + " missing required fields boardCode, licenseNumber, typeClass, providerCode, DPLPin, courseDate, courseName.";
					if (queryResult.providerCode != "") {
						errorDescription = errorDescription + " Provider code is " + queryResult.providerCode;
					} else {
						errorDescription = errorDescription + " Provider code is missing!"
					}

					updateErrorTable(recordID, errorDescription);

					//Deleting record from staging table
					var emseDeleteParameters = {
						"rowNumber": queryResult.rowNumber
					};
					deleteStgRecord(emseDeleteParameters);
				}
			}
		} catch (ex
			if ex instanceof StoredProcedureException) {
			var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
			ELPLogging.debug("Stored procedure exception occurred when trying to update record : " + recordID + " **ERRORS : " + ex.message);

			//Updating the CEU staging table
			var emseErrorUpdateParameters = {
				"rowNumber": queryResult.rowNumber,
				"intakeStatus": "PROCESSED_EMSE_ERROR",
				"stgErrorMessage": "Error occurred while processing record # " + ex.toString()
			};
			updateStgRecord(emseErrorUpdateParameters);
			//Fix for PROD defect 7269 : PRD_DPL_CEU_does not log defect in CEU staging table, it logs in error table but not on CE staging table itself.
			//Inserting record in the error table
			var errorDescription = queryResult.boardCode + ": Record : " + recordID + " : Stored procedure exception occurred when trying to update record : " + ex.message;
			updateErrorTable(recordID, errorDescription);
		}
		catch (ex) {
			// Update the stgErrorMessage field if there is any exception while updating the staging table
			// IN parameters to the Update stored procedure
			var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;
			ELPLogging.debug("***Error while processing a record :" + recordID + ", Provider code: " + queryResult.providerCode + " : Exceptions: " + ex.message);

			//Updating the CEU staging table
			var emseErrorUpdateParameters = {
				"rowNumber": queryResult.rowNumber,
				"intakeStatus": "PROCESSED_EMSE_ERROR",
				"stgErrorMessage": "Error occurred while processing record # " + ex.toString()
			};
			updateStgRecord(emseErrorUpdateParameters);
			//Fix for PROD defect 7269 : PRD_DPL_CEU_does not log defect in CEU staging table, it logs in error table but not on CE staging table itself.
			//Inserting record in the error table
			var errorDescription = queryResult.boardCode + ", Record : " + recordID + ", Provider code: " + queryResult.providerCode + "Error : ***Error while processing a record : " + ex.message;
			updateErrorTable(recordID, errorDescription);
		}
	}

	//Triggering mail for erroneous record.
	emailErrorReport(dbConn, stagingConfigObj, RUN_DATE);
} catch (ex
	if ex instanceof ELPAccelaEMSEException) {
	ELPLogging.debug(ex.message);
	ELPLogging.fatal(ex.toString());
	aa.env.setValue("EMSEReturnCode", ex.getReturnCode());
	aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_CEU_INTAKE  aborted with " + ex.toString());
}
catch (ex) {
	ELPLogging.fatal(ex.message);
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.EMSE_PROCEDURE);
	aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_CEU_INTAKE  aborted with " + ex.message);
}
finally {
	if (!ELPLogging.isFatal()) {
		// if fatal then return code already filled in
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		aa.env.setValue("ScriptReturnCode", "0");
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_CEU_INTAKE  completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_CEU_INTAKE  completed with no errors.");
		}
	}
	if (dataSetStg != null) {
		dataSetStg.close();
	}
	//Closing DB connection
	if (dbConn) {
		dbConn.close();
	}

	if (dataSetStg != null) {
		dataSetStg.close();
	}
	aa.env.setValue("logFile", ELPLogging.toJSON());
	aa.env.setValue("batchApplicationResult", JSON.stringify(batchAppResultObj));
}

/**
 * @desc This method will process CEU submission record.
 * @param {queryResult} queryResult - contains the queryResult
 * @param {licenseIDModel} licenseIDModel - contains the license record ID from Accela system.
 * @throws  N/A
 */
function processCEUSubmissionRecord(licenseIDModel, queryResult) {
	ELPLogging.debug("Processing CEU submission record for license ID = " + licenseIDModel);
	var providerDetailsArray = new Array();
	var isRecordProcessed = false;

	switch (String(queryResult.boardCode)) {
	case 'EL':
	case 'FA': {
			ELPLogging.debug("Board code = " + queryResult.boardCode + " is processing.");
			//Validate only provider code and retrieve provider name of validated provider code
			providerDetailsArray = validateProviderCode(queryResult.providerCode);
			if (providerDetailsArray.isValidProviderCode) {
				ELPLogging.debug("Validation for provider code is passed for EL board.");

				isRecordProcessed = true;
				createCEUSubmissionRecord(licenseIDModel, queryResult, providerDetailsArray.providerName);
			} else {
				ELPLogging.debug("Validation for provider code is failed for EL board.");
				var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;

				//Inserting record in the error table
				var errorDescription = queryResult.boardCode + ": Validation of provider code " + queryResult.providerCode + " is failed for recordID " + recordID;
				updateErrorTable(recordID, errorDescription);

				//Deleting record from staging table
				var emseDeleteParameters = {
					"rowNumber": queryResult.rowNumber
				};
				deleteStgRecord(emseDeleteParameters);
			}
			break;
		}

	case "PL":
	case "GF": {
			ELPLogging.debug("Board code = " + queryResult.boardCode + " is processing.");
			//validate provider code and resp provider name
			providerDetailsArray = validateProviderCode(queryResult.providerCode);
			if (providerDetailsArray.isValidProviderCode) {
				ELPLogging.debug("Validation for provider code is passed for PL board.");
				//Validate course name specific to license type
				if (validateCourseName(queryResult.courseName, licenseIDModel)) {
					ELPLogging.debug("Validation for course name is passed for PL board.");
					isRecordProcessed = true;
					createCEUSubmissionRecord(licenseIDModel, queryResult, providerDetailsArray.providerName);
				} else {
					ELPLogging.debug("Validation for course name is failed for PL board.");
					var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;

					//Inserting record in the error table
					var errorDescription = queryResult.boardCode + ": Validation for provider code : " + queryResult.providerCode + " is successful, but validation for course name : " + queryResult.courseName + " is failed for recordID " + recordID;
					updateErrorTable(recordID, errorDescription);

					//Deleting record from staging table
					var emseDeleteParameters = {
						"rowNumber": queryResult.rowNumber
					};
					deleteStgRecord(emseDeleteParameters);
				}
			} else {
				ELPLogging.debug("Validation for provider code is failed for PL board.");
				var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;

				//Inserting record in the error table
				var errorDescription = queryResult.boardCode + ": Validation of provider code " + queryResult.providerCode + " is failed for recordID " + recordID;
				updateErrorTable(recordID, errorDescription);

				//Deleting record from staging table
				var emseDeleteParameters = {
					"rowNumber": queryResult.rowNumber
				};
				deleteStgRecord(emseDeleteParameters);
			}
			break;
		}
	default:
		ELPLogging.notify("Invalid board code found.");

		var recordID = queryResult.licenseNumber + "-" + queryResult.boardCode + "-" + queryResult.typeClass;

		//Inserting record in the error table
		var errorDescription = queryResult.boardCode + ": Invalid board code found for recordID " + recordID;
		updateErrorTable(recordID, errorDescription);

		//Deleting record from staging table
		var emseDeleteParameters = {
			"rowNumber": queryResult.rowNumber
		};
		deleteStgRecord(emseDeleteParameters);
		break;
	}

	return isRecordProcessed;
}

/**
 * @desc This method will validate provide code with existing providers from the system.
 * @param {providerCode} a providerCode from intake file.
 * @returns {providerDetailsArray} - returns provider details array which will contains provider name and boolean flag.
 */
function validateProviderCode(providerCode) {
	ELPLogging.debug("Validating provider code = " + providerCode);
	var isValidProviderCode = false;
	var providerName = null;
	var providerDetailsArray = new Array();
	var queryProcedure = null;
	for (var x = 0; x < stagingConfigObj.supplemental.length; x++) {
		var supplementalConfig = stagingConfigObj.supplemental[x];
		if (supplementalConfig.tag == "providerCodes") {
			var queryProcedure = new StoredProcedure(supplementalConfig.procedure, dbConn);
		}
	}
	if (queryProcedure) {
		try {
			// POC
			// queryProcedure.prepareStatement();
			// var inputParameters = queryProcedure.prepareParameters(staticParamObj, dynamicParamObj, batchAppResultObj);
			// queryProcedure.setParameters(inputParameters);
			// //Query for fetching the records from the view
			// var dataSetFromView = queryProcedure.queryProcedure();
			// queryProcedure.close();

			// POC
			var parameters = {
				"tableName": "RPROVIDER"
			};

			var dataSetFromView = getProviderCode(queryProcedure, parameters);

			var providerFields = "";
			//Perform validation for provider code
			while (providerFields = dataSetFromView.next()) {
				if (String(providerFields.providerNo) == String(queryResult.providerCode)) {
					providerDetailsArray["isValidProviderCode"] = true;
					providerDetailsArray["providerName"] = providerFields.providerName;
					break;
				} else {
					providerDetailsArray["isValidProviderCode"] = isValidProviderCode;
				}
			}
		} catch (ex) {
			ELPLogging.error("validateProviderCode exception", ex);
		}
		finally {
			ELPLogging.debug("Closing validateProviderCode");
			if (dataSetFromView != null) {
				dataSetFromView.close();
			}
			if (queryProcedure != null) {
				queryProcedure.close();
			}
		}
	}

	return providerDetailsArray;
}

/**
 * @desc This method will validate course name specific to license type.
 * @param {courseName} a course name from intake file.
 * @param {licenseIDModel} a licese record ID.
 * @returns {isValidCourseName} - returns boolean value.
 */
function validateCourseName(courseName, licenseIDModel) {
	ELPLogging.debug("Validating course name = " + courseName);
	var isValidCourseName = false;

	var capModelResult = aa.cap.getCap(licenseIDModel).getOutput();
	var capType = capModelResult.getCapType();
	ELPLogging.debug("capType = " + capType);
	//Separating group, type, sub type and category from License/Real Estate/Broker/Application
	var scanner = new Scanner(capType.toString(), "/");
	var group = scanner.next();
	var type = scanner.next();
	var subType = scanner.next();
	var category = scanner.next();

	ELPLogging.debug("group = " + group + " -- " + " type = " + type + " -- " + " subType = " + subType + " courseName = " + courseName);

	//IN parameters to duplicate record check procedure
	var validateCourseNameParameters = {
		"perGroup": group,
		"perType": type,
		"perSubType": subType,
		"courseName": courseName
	};
	try {
		var validationResultFlag = callToStoredProcedure(validateCourseNameParameters, "courseName");
		isValidCourseName = validationResultFlag.validationFlag;
		ELPLogging.debug("Course name validation flag = " + isValidCourseName);
	} catch (ex) {
		ELPLogging.debug("validateCourseName ", ex);
		isValidCourseName = false;
	}
	return isValidCourseName;
}

/**
 * @desc : This method will create CEU Submission record and process new CEU submission record.
 * @param {licenseIDModel} : license record ID from Accela system
 * @throws N/A
 */
function createCEUSubmissionRecord(licenseIDModel, queryResult, providerName) {
	ELPLogging.debug("Creating new CEU submission record for license record ID = " + licenseIDModel);
	var contactType = "Licensed Individual";

	//Create empty CAP for CE Submission record
	var submissionRecordID = createCEUCAP();
	ELPLogging.debug("Finished creating CEU Submission record with CAP ID: " + submissionRecordID);

	//Fix for PROD Defect 8539: PRD_DPL_CE Submission record search does not populate anything for PL Board but it is for other boards.
	//set the channel reported field to Interface
	var capDetailScriptModel = aa.cap.getCapDetail(submissionRecordID).getOutput();
	var capDetailModel = capDetailScriptModel.getCapDetailModel();
	capDetailModel.setReportedChannel("Interface");
	capDetailModel.setShortNotes(queryResult.boardCode);

	var editCapDetailResult = aa.cap.editCapDetail(capDetailModel);

	if (!editCapDetailResult.getSuccess()) {
		ELPLogging.debug("Error updating Channel Reported for " + capDetailModel + ": " + editCapDetailResult.getErrorMessage());
	}
	ELPLogging.debug("Successfully updated Channel Reported and short notes for record ID : " + submissionRecordID);

	//Update contact information on the CEU Submission record.
	updateContactInfoOnCEUSubmissionRecord(submissionRecordID, licenseIDModel, contactType);

	//Update CEU record related information on CEU record
	updateCEUInformation(licenseIDModel, submissionRecordID, queryResult, providerName);
}

/**
 * @desc : This method will update CEU information on the new CEU Submission record.
 * @param {licenseIDModel} : License record ID
 * @param {submissionRecordID } : CEU Submission record
 * @param {queryResult} : Contains query result set from staging table
 * @throws ELPAccelaEMSEException
 */
function updateCEUInformation(licenseIDModel, submissionRecordID, queryResult, providerName) {
	ELPLogging.debug("Updating CEU information on the license record = " + licenseIDModel);
	//Local variable declaration
	var creditType = null;

	//If the Course Number is populated then populate the field with Professional Development
	//Else populate the field with Continuing Education

	if (queryResult.courseNumber == null) {
		creditType = "Continuing Education";
	} else {
		//Professional Development : Only populate for records with a Credit Type of Professional Development.Will store the Course Name for Professional Development credits
		creditType = "Professional Development";
	}

	ELPLogging.debug("Credit type = " + creditType);

	//Create/Update CEU submission record in the Accela system
	var continuingEducationScriptModel = aa.continuingEducation.getContinuingEducationModel().getOutput();
	var continuingEducationModel = continuingEducationScriptModel.getContinuingEducationModel();
	continuingEducationModel.setEntityType("CAP_CONTEDU");
	continuingEducationModel.setB1PerId1(submissionRecordID.getID1());
	continuingEducationModel.setB1PerId2(submissionRecordID.getID2());
	continuingEducationModel.setB1PerId3(submissionRecordID.getID3());
	//Fix for Defect 5600 : java.lang.null pointer exception getting generated on running the CEU interface for EL Board
	if (queryResult.courseHours != null) {
		continuingEducationModel.setHoursCompleted(aa.util.parseDouble(queryResult.courseHours));
	}
	ELPLogging.debug("queryResult.courseDate : " + queryResult.courseDate);
	continuingEducationModel.setDateOfClass(new java.util.Date(queryResult.courseDate));
	continuingEducationModel.setProviderNo(queryResult.providerCode);
	continuingEducationModel.setContEduName(queryResult.courseName);
	continuingEducationModel.setProviderName(providerName);
	// ETW Begin Fix for EPAWS-1391
	//continuingEducationModel.setGradingStyle("Pass/Fail");
	continuingEducationModel.setGradingStyle("passfail");
	continuingEducationModel.setRequiredFlag("Y");
	var vAuditModel = continuingEducationModel.getAuditModel();
	vAuditModel.setAuditID("ADMIN");
	vAuditModel.setAuditDate(new Date());
	vAuditModel.setAuditStatus("A") 
	continuingEducationModel.setAuditModel(vAuditModel);
	// ETW End Fix fof EPAWS-1391

	//Fix for Defect 5600 : java.lang.null pointer exception getting generated on running the CEU interface for EL Board
	if (queryResult.codeCycle != null) {
		continuingEducationModel.setClassName(queryResult.codeCycle);
	}

	var templateModel = aa.genericTemplate.getTemplateStructureByGroupName("TR-CE").getOutput();
	continuingEducationModel.setTemplate(templateModel);

	var continuingEducationRecord = aa.continuingEducation.createContinuingEducationModel(continuingEducationScriptModel);
	if (!continuingEducationRecord.getSuccess()) {
		var returnException = new ELPAccelaEMSEException("Error creating for record " + submissionRecordID + ": " + continuingEducationRecord.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}

	//Set the Workflow Task/Status to Intake/Credits Accepted
	ELPLogging.debug("Updating work flow Task/Status to Intake/Credits Accepted for record ID # " + submissionRecordID);
	updateWFTask("Intake", "Credits Accepted", "", "", "", submissionRecordID);

	updateASIOnCERecord(submissionRecordID, creditType);

	//Link as a child of the Parent Record.
	processChildRecordProcessing(licenseIDModel, submissionRecordID);

	//Retrieve social security number
	var socialSecurityNumber = retrieveSocialSecurityNumber(licenseIDModel);

	//Process license record associated with the Licensee
	processAssociatedRecordWithContact(licenseIDModel, submissionRecordID, socialSecurityNumber, queryResult);

	//Business Rule implementation
	performTaskAssignmentProcessing(licenseIDModel, submissionRecordID, queryResult);
}

/**
 * @desc : This method retrieves child records associated with the license and process them as the design doc rules.
 * @param {licenseIDModel} : Contains License recordID.
 * @param {submissionRecordID} : Contains CEU Submission recordID.
 */
function processChildRecordProcessing(licenseIDModel, submissionRecordID) {
	ELPLogging.debug("Processing child records associated with License record : " + licenseIDModel);

	var appRecordslist = aa.cap.getProjectByMasterID(licenseIDModel, null, null);

	if (appRecordslist.getSuccess()) {
		var appRecordslistModel = appRecordslist.getOutput();
		if (appRecordslistModel) {
			var categoryArray = getAssociatedCategories(appRecordslistModel);
			ELPLogging.debug("categoryArray: " + categoryArray);

			var isOpenRenewal = openRenewalCheck(appRecordslistModel);
			ELPLogging.debug("isOpenRenewal = " + isOpenRenewal);

			for (index in appRecordslistModel) {

				var childCapID = appRecordslistModel[index].getCapID();

				linkingOfChildRecords(licenseIDModel, submissionRecordID, childCapID, categoryArray, isOpenRenewal);
			}
		} else {
			ELPLogging.debug("There is no child records associated with License record : " + licenseIDModel + ", Provider Code: " + queryResult.providerCode);
		}
	} else {
		//Fix for PROD defect 9009 : PRD_DPL_CEU interface does not process Inspector records
		//Conversion data does not contain any child or parent record in this case this code will be executed.
		linkCESubmissionRecordAsChild(licenseIDModel, submissionRecordID);
	}
}

/**
 * @desc : 	This method will perform below operations
a.	If an open CE Audit Record is found against the License
i.	Link CE Submission Record as child
ii.	Copy credit information onto CE Audit Record
b.	Else If an Open Reinstatement Record is found against the License
i.	Link CE Submission Record as child
ii.	Copy credit information onto Reinstatement Record
c.	Else If an open Renewal Record is found against the License
i.	Link CE submission Record as child
ii.	Copy credit information onto Renewal Record
d.	Else Link the CE Submission Record as a child of the License Record
i.	Do not copy the credit information onto the License Record

 * @param {licenseIDModel} : Contains License recordID.
 * @param {submissionRecordID} : Contains CEU Submission recordID.
 * @throws
 */
function linkingOfChildRecords(licenseIDModel, submissionRecordID, childCapID, categoryArray, isOpenRenewal) {
	//Local variable declaration
	var renewalRecordID = null;
	var CEAuditRecordID = null;
	var reinstatementRecordID = null;
	var licIDModel = null;
	var capScriptModel = aa.cap.getCap(childCapID);
	if (capScriptModel.getSuccess()) {
		var capScriptModelResult = capScriptModel.getOutput();

		var recordStatus = capScriptModelResult.getCapStatus();
		var capType = capScriptModelResult.getCapType();
		var capClass = capScriptModelResult.getCapClass();

		var scanner = new Scanner(capType.toString(), "/");
		var group = scanner.next();
		var type = scanner.next();
		var subType = scanner.next();
		var category = scanner.next();
		ELPLogging.debug("Child record Category = " + category + " recordStatus = " + recordStatus + " capClass = " + capClass);

		if (category == "Renewal" && recordStatus != "Closed" && capClass == "COMPLETE") {

			renewalRecordID = capScriptModelResult.getCapID();
			ELPLogging.debug("Link CE submission Record as child and Copy credit information onto Renewal Record for = " + renewalRecordID);

			//Link CE Submission Record as child
			linkCESubmissionRecordAsChild(renewalRecordID, submissionRecordID);

			//Copy credit Information on to record
			copyCEUInformationOnAssociatedLicense(submissionRecordID, renewalRecordID);
		} else if (category == "CE Audit" && recordStatus != "Closed") {

			CEAuditRecordID = capScriptModelResult.getCapID();

			ELPLogging.debug("Link CE Submission Record = " + submissionRecordID + " as child and Copy credit information onto CE Audit Record = " + CEAuditRecordID);

			//Link CE Submission Record as child
			linkCESubmissionRecordAsChild(CEAuditRecordID, submissionRecordID);

			//Copy credit Information on to record
			copyCEUInformationOnAssociatedLicense(submissionRecordID, CEAuditRecordID);
		} else if (category == "Reinstatement" && recordStatus != "Closed") {

			reinstatementRecordID = capScriptModelResult.getCapID();

			ELPLogging.debug("Link CE Submission Record = " + submissionRecordID + " as child and Copy credit information onto Reinstatement Record for = " + reinstatementRecordID);

			//Link CE Submission Record as child
			linkCESubmissionRecordAsChild(reinstatementRecordID, submissionRecordID);

			//Copy credit Information on to record
			copyCEUInformationOnAssociatedLicense(submissionRecordID, reinstatementRecordID);
		} else {
			if ((exists("Renewal", categoryArray)) || (exists("CE Audit", categoryArray)) || (exists("Reinstatement", categoryArray))) {
				ELPLogging.debug("Child record Renewal OR CE Audit OR Reinstatement exists, go to next child record.");
				if (isOpenRenewal) {
					ELPLogging.debug("Go to next record.");
				} else {
					ELPLogging.debug("thisCounter = " + thisCounter);
					//IF Renewal record is Closed then link CE record as a child to license
					if (recordStatus == "Closed" && thisCounter == 0) {
						ELPLogging.debug("Renewal or Reinstatement or CE Audit Closed record found. Associating CE record to License record.");
						//Link CE record as a child of the license record1
						thisCounter = thisCounter + 1;
						ELPLogging.debug("thisCounter2 = " + thisCounter);
						linkCESubmissionRecordAsChild(licenseIDModel, submissionRecordID);
					}
				}
			} else {
				if (counter == 0) {
					ELPLogging.debug("counter = " + counter);
					ELPLogging.debug("Link the CE Submission Record = " + submissionRecordID + " as a child of the License Record and Do not copy the credit information onto the License Record = " + licenseIDModel);
					//Link CE Submission Record as child
					linkCESubmissionRecordAsChild(licenseIDModel, submissionRecordID);
					counter = counter + 1;
				}
			}
		}
	}
}

/**
 * @desc : This method will link CEU Submission record as a child record to the License record
 * @param {parentRecordID} : Contains Parent record ID may be renewalRecordID, reinstatementRecordID, licenseIDModel.
 * @param {submissionRecordID} :  Contains CEU Submission record ID.
 * @throws N/A
 */
function linkCESubmissionRecordAsChild(parentRecordID, submissionRecordID) {
	ELPLogging.debug("Linking CE Submission record = " + submissionRecordID + " as child of the record = " + parentRecordID);

	var appHierarchyResult = aa.cap.createAppHierarchy(parentRecordID, submissionRecordID);

	if (!appHierarchyResult.getSuccess()) {
		ELPLogging.debug("**Error*** Could not link CEU Submission record : " + submissionRecordID + " to the parent record = " + parentRecordID + " ## " + appHierarchyResult.getErrorMessage());
	}

}

/**
 * @desc : Business Rule Implementation
Determine whether the record is or is not assigned to a specific user (by Board) who belongs to the Board Staff
of the record type submitted on the CE Submission record
a.	If the License related to the CE Submission record  is part of a 'post-renewal' audit, then assign the record
to a specific user (TBD by Board) who belongs to the Board Staff of the license that is being audited.
b.	If the License related to the CE Submission record  is part of a 'during -renewal' audit, then assign
the record to a specific user (TBD by Board) who belongs to the Board Staff of the license that is being audited.
c.	If the License related to the CE Submission record is part of a Board that follows the 'pre-renewal'
audit process, then assign the record to a specific user (TBD by Board) who belongs to the Board Staff of the license that is being audited.
d.	If the License related to the CE Submission record DOES NOT fall into one of the above categories,
then do not assign the CE Submission record to any specific staff person.
 * @param
 * @throws
 */
function performTaskAssignmentProcessing(licenseIDModel, submissionRecordID, queryResult) {
	ELPLogging.debug("Perform Task assignment to boardStaff for record ID :  " + licenseIDModel);

	var WFTASK = "Intake";
	var AH_BOARDSTAFF_ID = "AH|BOARDSTAFF";
	var CA_BOARDSTAFF_ID = "CA|BOARDSTAFF";
	var DO_BOARDSTAFF_ID = "DO|BOARDSTAFF";
	var DW_BOARDSTAFF_ID = "DW|BOARDSTAFF";
	var EL_BOARDSTAFF_ID = "EL|BOARDSTAFF";
	var EM_BOARDSTAFF_ID = "EM|BOARDSTAFF";
	var EN_BOARDSTAFF_ID = "EN|BOARDSTAFF";
	var FA_BOARDSTAFF_ID = "FA|BOARDSTAFF";
	var GF_BOARDSTAFF_ID = "GF|BOARDSTAFF";
	var HD_BOARDSTAFF_ID = "HD|BOARDSTAFF";
	var HE_BOARDSTAFF_ID = "HE|BOARDSTAFF";
	var HI_BOARDSTAFF_ID = "HI|BOARDSTAFF";
	var HO_BOARDSTAFF_ID = "HO|BOARDSTAFF";
	var LA_BOARDSTAFF_ID = "LA|BOARDSTAFF";
	var MH_BOARDSTAFF_ID = "MH|BOARDSTAFF";
	var MT_BOARDSTAFF_ID = "MT|BOARDSTAFF";
	var NU_BOARDSTAFF_ID = "NU|BOARDSTAFF";
	var OP_BOARDSTAFF_ID = "OP|BOARDSTAFF";
	var PD_BOARDSTAFF_ID = "PD|BOARDSTAFF";
	var PL_BOARDSTAFF_ID = "PL|BOARDSTAFF";
	var PY_BOARDSTAFF_ID = "PY|BOARDSTAFF";
	var RA_BOARDSTAFF_ID = "RA|BOARDSTAFF";
	var RE_BOARDSTAFF_ID = "RE|BOARDSTAFF";
	var SA_BOARDSTAFF_ID = "SA|BOARDSTAFF";
	var SM_BOARDSTAFF_ID = "SM|BOARDSTAFF";
	var SP_BOARDSTAFF_ID = "SP|BOARDSTAFF";
	var SW_BOARDSTAFF_ID = "SW|BOARDSTAFF";
	var ET_BOARDSTAFF_ID = "ET|BOARDSTAFF";
	var VT_BOARDSTAFF_ID = "VT|BOARDSTAFF";

	var boardStaff = null;

	if (queryResult.boardCode == "AH") {
		boardStaff = AH_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "CA") {
		boardStaff = CA_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "DO") {
		boardStaff = DO_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "DW") {
		boardStaff = DW_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "EL") {
		boardStaff = EL_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "EM") {
		boardStaff = EM_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "EN") {
		boardStaff = EN_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "FA") {
		boardStaff = FA_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "GF") {
		boardStaff = GF_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "HD") {
		boardStaff = HD_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "HE") {
		boardStaff = HE_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "HI") {
		boardStaff = HI_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "HO") {
		boardStaff = HO_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "LA") {
		boardStaff = LA_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "MH") {
		boardStaff = MH_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "MT") {
		boardStaff = MT_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "NU") {
		boardStaff = NU_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "OP") {
		boardStaff = OP_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "PD") {
		boardStaff = PD_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "PL") {
		boardStaff = PL_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "PY") {
		boardStaff = PY_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "RA") {
		boardStaff = RA_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "RE") {
		boardStaff = RE_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "SA") {
		boardStaff = SA_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "SM") {
		boardStaff = SM_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "SP") {
		boardStaff = SP_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "SW") {
		boardStaff = SW_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "ET") {
		boardStaff = ET_BOARDSTAFF_ID;
	} else if (queryResult.boardCode == "VT") {
		boardStaff = VT_BOARDSTAFF_ID;
	}
	var userName = getSharedDropDownDescriptionDetails(boardStaff, "TASK_ASSIGNMENT");
	ELPLogging.debug("User Name is  : " + userName);

	assignTaskToUser(WFTASK, userName, licenseIDModel)
}

/**
 * @desc This method will retrieves categories of the child records.
 * @param {appRecordslistModel} a child record list model
 * @returns {categoryArray} - returns an category array.
 */
function getAssociatedCategories(appRecordslistModel) {
	var categoryArray = new Array();
	var capIndex = 0;
	for (index in appRecordslistModel) {

		var childCapID = appRecordslistModel[index].getCapID();
		var capScriptModel = aa.cap.getCap(childCapID);
		if (capScriptModel.getSuccess()) {
			var capScriptModelOutput = capScriptModel.getOutput();
			var capType = capScriptModelOutput.getCapType();

			var scanner = new Scanner(capType.toString(), "/");
			var group = scanner.next();
			var type = scanner.next();
			var subType = scanner.next();
			var category = scanner.next();
			categoryArray[capIndex] = category;
			capIndex = capIndex + 1;
		}
	}
	return categoryArray;
}

/**
 * @desc This method creates record in the Accela system
 * @throws ELPAccelaEMSEException
 */
function createCEUCAP() {
	ELPLogging.debug("Creating CEU CAP in Accela system.");

	//Local variable declaration
	var group = "License";
	var type = "DPL";
	var subType = "Continuing Education";
	var category = "CE Submission";

	var createCapResult = aa.cap.createApp(group, type, subType, category, null);
	var licenseIDModel = createCapResult.getOutput();

	if (licenseIDModel) {
		var capResult = aa.cap.getCap(licenseIDModel);
		var capScriptModel = capResult.getOutput();

		if (capScriptModel) {
			//set values for CAP record
			var capModel = capScriptModel.getCapModel();
			capModel.setCapStatus("Submitted");
			capModel.setCapClass("COMPLETE");
			capModel.setReportedDate(new java.util.Date());
			capModel.setFileDate(new java.util.Date());

			var editResult = aa.cap.editCapByPK(capModel);
			if (!editResult.getSuccess()) {
				var returnException = new ELPAccelaEMSEException("Error editing the CAP ASI for " + licenseIDModel + ": " + editResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
				throw returnException;

			}
			return licenseIDModel;
		} else {
			var returnException = new ELPAccelaEMSEException("Error retrieving the CAP " + licenseIDModel + ": " + capResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
		}
	} else {
		var returnException = new ELPAccelaEMSEException("**Error Duplicate CapID found in Accela system  : " + createCapResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc : This method will update contact information on the New CEU Submission record.
a.	Add the Contact
i.	 Copy the Licensed Individual Contact Type from the License Record
ii.	 Flag as Primary
iii. Contact Type: Licensed Individual
iv.	 No address information needed

 * @param
 * @throws
 */
function updateContactInfoOnCEUSubmissionRecord(submissionRecordID, licenseID, contactType) {
	ELPLogging.debug("Updating contact information on CEU submission record = " + submissionRecordID);

	var licenseContactDetailModel = aa.people.getCapContactByCapID(licenseID);

	if (licenseContactDetailModel.getSuccess()) {
		var licenseContactDetailModelList = licenseContactDetailModel.getOutput();
		for (index in licenseContactDetailModelList) {
			if (licenseContactDetailModelList[index].getCapContactModel().getContactType() == contactType) {
				var capContactModel = licenseContactDetailModelList[index].getCapContactModel();
				capContactModel.setPrimaryFlag("Y");
				capContactModel.setCapID(submissionRecordID);
				aa.people.createCapContact(capContactModel);
				ELPLogging.debug("Copied contact from " + licenseID + " to " + submissionRecordID);
			}
		}
	} else {
		ELPLogging.debug("**ERROR: Failed to get contacts : " + licenseContactDetailModel.getErrorMessage());
	}
}

/**
 * @desc This method retrieves social security number.
 * @param {licenseIDModel} contains licenseIDModel.
 * @returns {socialSecurityNumber} - Social Security Number.
 */
function retrieveSocialSecurityNumber(licenseIDModel) {
	ELPLogging.debug("Retrieving social Security Number : " + licenseIDModel);

	//Local variable declaration
	var socialSecurityNumber = null;

	var capContactResult = aa.people.getCapContactByCapID(licenseIDModel);
	if (capContactResult.getSuccess()) {
		var capContactArray = capContactResult.getOutput();

		if (capContactArray) {
			for (capContactIndex in capContactArray) {
				var socialSecurityNumber = capContactArray[capContactIndex].getCapContactModel().getSocialSecurityNumber();
				ELPLogging.debug("Social Security Number : " + socialSecurityNumber);

			}
		}
	}
	return socialSecurityNumber;
}

/**
 * @desc This method retrieves the associated license records with the contact.
 * @param {licenseIDModel} contains licenseIDModel.
 * @param {submissionRecordID} contains CEU submission recordID.
 * @param {socialSecurityNumber} contains social security number.
 * @param {queryResult} contains queryResult from the staging table.
 */
function processAssociatedRecordWithContact(licenseIDModel, submissionRecordID, socialSecurityNumber, queryResult) {
	ELPLogging.debug("Retrieving capID from the Social security number : " + socialSecurityNumber);

	//Local variable declaration
	var capID = null;
	var altID = null;

	var peopleScriptModel = aa.people.createPeopleModel().getOutput();
	peopleScriptModel.setServiceProviderCode(queryResult.serviceProviderCode);
	peopleScriptModel.setContactType("Licensed Individual");
	peopleScriptModel.setSocialSecurityNumber(socialSecurityNumber);

	var peopleResult = aa.people.getCapIDsByRefContact(peopleScriptModel);

	if (peopleResult.getSuccess()) {
		var capIDScriptModel = peopleResult.getOutput();
		for (index in capIDScriptModel) {
			var associatedCapID = capIDScriptModel[index].getCapID();
			var capScriptModel = aa.cap.getCap(associatedCapID);
			if (capScriptModel.getSuccess()) {
				var capScriptModelOutput = capScriptModel.getOutput();
				var capType = capScriptModelOutput.getCapType();

				var scanner = new Scanner(capType.toString(), "/");
				var group = scanner.next();
				var type = scanner.next();
				var subType = scanner.next();
				var category = scanner.next();
				ELPLogging.debug("category # " + category);

				if (category == "License") {
					ELPLogging.debug("License record associated with the contact : " + associatedCapID);
					ELPLogging.debug("licenseIDModel = " + licenseIDModel);
					if (associatedCapID.toString() == licenseIDModel.toString()) {
						ELPLogging.debug("Do not copy credit information on the license record");

					} else {
						copyCEUInformationOnAssociatedLicense(submissionRecordID, associatedCapID);
					}
				}
			}
		}
	}
}

/**
 * @desc This method retrieves the associated license records with the contact.
 * @param {srcCapID} contains source capID.
 * @param {targetCapID} contains target capID.
 */
function copyCEUInformationOnAssociatedLicense(srcCapID, targetCapID) {
	ELPLogging.debug("Copy CEU information from source CapID # " + srcCapID + " to Destination capID " + targetCapID);

	var copyContEducationList = aa.continuingEducation.copyContEducationList(srcCapID, targetCapID);
	if (!copyContEducationList.getSuccess()) {
		ELPLogging.debug("*** Error : while copying continue education information from source CapID # " + srcCapID + " to Destination capID " + targetCapID + " ## " + copyContEducationList.getErrorMessage());
	} else {
		ELPLogging.debug("Successfully copied continue education information from source CapID # " + srcCapID + " to Destination capID # " + targetCapID);
	}
}

/**
 * @desc This method will update ASI on the CE record.
 * @param {submissionRecordID} contains CE record ID.
 */
function updateASIOnCERecord(submissionRecordID, creditType) {
	ELPLogging.debug("Updating ASI on the CE record : " + submissionRecordID);
	var scanner = new Scanner(submissionRecordID.toString(), "-");
	var ID1 = scanner.next();
	var ID2 = scanner.next();
	var ID3 = scanner.next();

	var capIDScriptModel = aa.cap.createCapIDScriptModel(ID1, ID2, ID3);

	var continuingEducationScriptModelList = aa.continuingEducation.getContEducationList(capIDScriptModel);
	if (continuingEducationScriptModelList.getSuccess()) {
		var continuingEducationScriptModelList = continuingEducationScriptModelList.getOutput();

		for (index in continuingEducationScriptModelList) {
			var continuingEducationScriptModel = continuingEducationScriptModelList[index];
			var continuingEducationModel = continuingEducationScriptModel.getContinuingEducationModel();

			var template = continuingEducationModel.getTemplate();
			var templateGroups = template.getTemplateForms();
			var subGroups = templateGroups.get(0).getSubgroups();

			for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
				var subGroup = subGroups.get(subGroupIndex);
				var subGrpName = subGroup.getSubgroupName();
				var asiFields = subGroup.getFields();

				for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++) {
					var field = asiFields.get(fieldIndex);
					if (field.getFieldName() == "Credit Type") {
						field.setDefaultValue(creditType);
					}
				}

				var continuingEducationASIScriptModel = aa.continuingEducation.updateContinuingEducationModel(continuingEducationScriptModel);
				if (!continuingEducationASIScriptModel.getSuccess()) {
					var returnException = new ELPAccelaEMSEException("Error creating for record " + submissionRecordID + ": //" + continuingEducationScriptModel.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
					throw returnException;
				}
			}
		}
	}
}

/**
 * @desc This method will retrieves categories of the child records.
 * @param {appRecordslistModel} a child record list model
 * @returns {capStatusArray} - returns an category array.
 */
function openRenewalCheck(appRecordslistModel) {
	var capStatusArray = new Array();
	var capIndex = 0;
	var closedRecordCount = 0;
	var isOpenRenewal = false;
	for (index in appRecordslistModel) {
		var childCapID = appRecordslistModel[index].getCapID();
		var capScriptModel = aa.cap.getCap(childCapID);
		if (capScriptModel.getSuccess()) {
			var capScriptModelResult = capScriptModel.getOutput();
			var capStatus = capScriptModelResult.getCapStatus();
			var capType = capScriptModelResult.getCapType();
			var scanner = new Scanner(capType.toString(), "/");
			var group = scanner.next();
			var type = scanner.next();
			var subType = scanner.next();
			var category = scanner.next();
			if (capStatus == "Closed" && category == "Renewal") {
				closedRecordCount = closedRecordCount + 1;
			}
			if (category == "Renewal") {
				capStatusArray[capIndex] = capStatus;
				capIndex = capIndex + 1;
			}
		}
	}
	if (closedRecordCount == capIndex) {
		// all ecords are closed;
		ELPLogging.debug("All closed");
		isOpenRenewal = false;
	} else {
		ELPLogging.debug("Open Renewal");
		isOpenRenewal = true;
		// There is one record which is open
	}
	return isOpenRenewal;
}
/**
 * @desc This method is performing validation for required fields for RE board.
 * @param {queryResult} contains query result from staging table.
 * @returns {boolean} - boolean value
 */
function validateReqdFields(queryResult) {
	ELPLogging.debug("Performing validations for required fields.");

	if (queryResult.boardCode == null ||
		queryResult.boardCode.trim().length == 0 ||
		queryResult.licenseNumber == null ||
		queryResult.licenseNumber.trim().length == 0 ||
		queryResult.typeClass == null ||
		queryResult.typeClass.trim().length == 0 ||
		queryResult.providerCode == null ||
		queryResult.providerCode.trim().length == 0 ||
		queryResult.dplPin == null ||
		queryResult.dplPin.trim().length == 0 ||
		queryResult.courseDate == null ||
		queryResult.courseName == null ||
		queryResult.courseName.trim().length == 0) {
		return false;
	} else {
		return true;
	}
}

/**
 * @desc This method will trigger an email for any invalid record.
 * @param {dbConnection} contains dbConnection object.
 * @param {procedureConfiguration} contains procedureConfiguration object.
 * @param {RUN_DATE} contains RUN_DATE.
 */
function emailErrorReport(dbConnection, procedureConfiguration, runDate) {
	ELPLogging.debug("Triggering error report.");
	for (var ii = 0; ii < procedureConfiguration.supplemental.length; ii++) {
		var supplementalConfiguration = procedureConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "errorQuery") {
			var errorReportProcedure = new StoredProcedure(supplementalConfiguration.procedure, dbConnection);
			break;
		}
	}

	if (errorReportProcedure == null) {
		var message = "Cannot find supplemental stored procedure for Error Query.";
		returnException = new ELPAccelaEMSEException(message, ScriptReturnCodes.STAGING_PROCEDURE);
		ELPLogging.error(returnException.toString());
		return;
	}
	try {
		ELPLogging.debug("*** Start getErrorReportRecords() ***");

		// POC
		// var parameters = {};
		// parameters.runDate = runDate;
		// parameters.batchInterfaceName = "ELP.DPL.CEU.INTAKE";
		// errorReportProcedure.prepareStatement();
		// var inputParameters = errorReportProcedure.prepareParameters(null,null,parameters);
		// ELPLogging.debug("Input parameters for error report procedure: ", inputParameters);

		// errorReportProcedure.setParameters(inputParameters);
		// var dataSet = errorReportProcedure.queryProcedure();

		// POC
		var parameters = {
			"runDate": runDate,
			"batchInterfaceName": "ELP.DPL.CEU.INTAKE",
			"tableName": "ELP_VW_PSI_ERROR"
		};
		var dataSet = getErrorReportRecords(errorReportProcedure, parameters);

		ELPLogging.debug("*** Finished getErrorReportRecords() ***");

		// loop through all license configuration records
		var licenseConfiguration = null;
		var emailBodyAH = [];
		var emailBodyCA = [];
		var emailBodyDW = [];
		var emailBodyEL = [];
		var emailBodyEM = [];
		var emailBodyEN = [];
		var emailBodyFA = [];
		var emailBodyGF = [];
		var emailBodyHD = [];
		var emailBodyHE = [];
		var emailBodyHI = [];
		var emailBodyHO = [];
		var emailBodyLA = [];
		var emailBodyMH = [];
		var emailBodyMT = [];
		var emailBodyNU = [];
		var emailBodyOP = [];
		var emailBodyPD = [];
		var emailBodyPL = [];
		var emailBodyPY = [];
		var emailBodyRA = [];
		var emailBodyRE = [];
		var emailBodySA = [];
		var emailBodySM = [];
		var emailBodySP = [];
		var emailBodySW = [];
		var emailBodyET = [];
		var emailBodyVT = [];

		var boardCode = null;
		var firstLine = "The following are input errors in the CEU Intake File that prevented processing of that application.";
		emailBodyAH.push(firstLine);
		emailBodyCA.push(firstLine);
		emailBodyDW.push(firstLine);
		emailBodyEL.push(firstLine);
		emailBodyEM.push(firstLine);
		emailBodyEN.push(firstLine);
		emailBodyFA.push(firstLine);
		emailBodyGF.push(firstLine);
		emailBodyHD.push(firstLine);
		emailBodyHE.push(firstLine);
		emailBodyHI.push(firstLine);
		emailBodyHO.push(firstLine);
		emailBodyLA.push(firstLine);
		emailBodyMH.push(firstLine);
		emailBodyMT.push(firstLine);
		emailBodyNU.push(firstLine);
		emailBodyOP.push(firstLine);
		emailBodyPD.push(firstLine);
		emailBodyPL.push(firstLine);
		emailBodyPY.push(firstLine);
		emailBodyRA.push(firstLine);
		emailBodyRE.push(firstLine);
		emailBodySA.push(firstLine);
		emailBodySM.push(firstLine);
		emailBodySP.push(firstLine);
		emailBodySW.push(firstLine);
		emailBodyET.push(firstLine);
		emailBodyVT.push(firstLine);

		var emailAddressCodeAH = "CEU ERRORS-AH";
		var emailAddressCodeCA = "CEU ERRORS-CA";
		var emailAddressCodeDO = "CEU ERRORS-DO";
		var emailAddressCodeDW = "CEU ERRORS-DW";
		var emailAddressCodeEL = "CEU ERRORS-EL";
		var emailAddressCodeEM = "CEU ERRORS-EM";
		var emailAddressCodeEN = "CEU ERRORS-EN";
		var emailAddressCodeFA = "CEU ERRORS-FA";
		var emailAddressCodeGF = "CEU ERRORS-GF";
		var emailAddressCodeHD = "CEU ERRORS-HD";
		var emailAddressCodeHE = "CEU ERRORS-HE";
		var emailAddressCodeHI = "CEU ERRORS-HI";
		var emailAddressCodeHO = "CEU ERRORS-HO";
		var emailAddressCodeLA = "CEU ERRORS-LA";
		var emailAddressCodeMH = "CEU ERRORS-MH";
		var emailAddressCodeMT = "CEU ERRORS-MT";
		var emailAddressCodeNU = "CEU ERRORS-NU";
		var emailAddressCodeOP = "CEU ERRORS-OP";
		var emailAddressCodePD = "CEU ERRORS-PD";
		var emailAddressCodePL = "CEU ERRORS-PL";
		var emailAddressCodePY = "CEU ERRORS-PY";
		var emailAddressCodeRA = "CEU ERRORS-RA";
		var emailAddressCodeRE = "CEU ERRORS-RE";
		var emailAddressCodeSA = "CEU ERRORS-SA";
		var emailAddressCodeSM = "CEU ERRORS-SM";
		var emailAddressCodeSP = "CEU ERRORS-SP";
		var emailAddressCodeSW = "CEU ERRORS-SW";
		var emailAddressCodeET = "CEU ERRORS-ET";
		var emailAddressCodeVT = "CEU ERRORS-VT";

		var flagAH = false;
		var flagCA = false;
		var flagDO = false;
		var flagDW = false;
		var flagEL = false;
		var flagEM = false;
		var flagEN = false;
		var flagFA = false;
		var flagGF = false;
		var flagHD = false;
		var flagHE = false;
		var flagHI = false;
		var flagHO = false;
		var flagLA = false;
		var flagMH = false;
		var flagMT = false;
		var flagNU = false;
		var flagOP = false;
		var flagPD = false;
		var flagPL = false;
		var flagPY = false;
		var flagRA = false;
		var flagRE = false;
		var flagSA = false;
		var flagSM = false;
		var flagSP = false;
		var flagSW = false;
		var flagET = false;
		var flagVT = false;

		ELPLogging.debug("runDate  : " + runDate);
		while ((errorData = dataSet.next()) != null) {
			var processingDateS = errorData.runDate.toDateString();

			var errorLine = errorData.errorDescription;

			var scanner = new Scanner(errorLine, ":");

			var boardCode = scanner.next();
			var errorMessage = scanner.next();

			ELPLogging.debug(" Board : " + boardCode + " errorMessage : " + errorMessage);

			var errorLine = processingDateS + ":" + errorData.recordID + " : " + errorMessage;

			ELPLogging.debug("errorLine # " + errorLine);
			if (boardCode == "AH") {
				emailBodyAH.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagAH = true;
			} else if (boardCode == "CA") {
				emailBodyCA.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagCA = true;
			} else if (boardCode == "DO") {
				emailBodyDO.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagDO = true;
			} else if (boardCode == "DW") {
				emailBodyDW.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagDW = true;
			} else if (boardCode == "EL") {
				emailBodyEL.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagEL = true;
			} else if (boardCode == "EM") {
				emailBodyEM.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagEM = true;
			} else if (boardCode == "EN") {
				emailBodyEN.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagEN = true;
			} else if (boardCode == "FA") {
				emailBodyFA.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagFA = true;
			} else if (boardCode == "GF") {
				emailBodyGF.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagGF = true;
			} else if (boardCode == "HD") {
				emailBodyHD.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagHD = true;
			} else if (boardCode == "HE") {
				emailBodyHE.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagHE = true;
			} else if (boardCode == "HI") {
				emailBodyHI.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagHI = true;
			} else if (boardCode == "HO") {
				ELPLogging.debug("Mail for HO board");
				emailBodyHO.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagHO = true;
			} else if (boardCode == "LA") {
				emailBodyLA.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagLA = true;
			} else if (boardCode == "MH") {
				emailBodyMH.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagMH = true;
			} else if (boardCode == "MT") {
				emailBodyMT.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagMT = true;
			} else if (boardCode == "NU") {
				emailBodyNU.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagNU = true;
			} else if (boardCode == "OP") {
				emailBodyOP.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagOP = true;
			} else if (boardCode == "PD") {
				emailBodyPD.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagPD = true;
			} else if (boardCode == "PL") {
				emailBodyPL.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagPL = true;
			} else if (boardCode == "PY") {
				emailBodyPY.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagPY = true;
			} else if (boardCode == "RA") {
				emailBodyRA.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagRA = true;
			} else if (boardCode == "RE") {
				emailBodyRE.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagRE = true;
			} else if (boardCode == "SA") {
				emailBodySA.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagSA = true;
			} else if (boardCode == "SM") {
				emailBodySM.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagSM = true;
			} else if (boardCode == "SP") {
				emailBodySP.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagSP = true;
			} else if (boardCode == "SW") {
				emailBodySW.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagSW = true;
			} else if (boardCode == "ET") {
				emailBodyET.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagET = true;
			} else if (boardCode == "VT") {
				emailBodyVT.push(errorLine);
				ELPLogging.debug("errorLine : " + errorLine);
				flagVT = true;
			}

			ELPLogging.debug("Error Line = " + errorLine);
		}

		if (flagAH) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeAH, "Batch CEU File Errors", emailBodyAH);
		}

		if (flagCA) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeCA, "Batch CEU File Errors", emailBodyCA);
		}

		if (flagDO) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeDO, "Batch CEU File Errors", emailBodyDO);
		}

		if (flagDW) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeDW, "Batch CEU File Errors", emailBodyDW);
		}

		if (flagEL) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeEL, "Batch CEU File Errors", emailBodyEL);
		}

		if (flagEM) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeEM, "Batch CEU File Errors", emailBodyEM);
		}

		if (flagEN) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeEN, "Batch CEU File Errors", emailBodyEN);
		}

		if (flagFA) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeFA, "Batch CEU File Errors", emailBodyFA);
		}

		if (flagGF) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeGF, "Batch CEU File Errors", emailBodyGF);
		}

		if (flagHD) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeHD, "Batch CEU File Errors", emailBodyHD);
		}
		if (flagHE) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeHE, "Batch CEU File Errors", emailBodyHE);
		}

		if (flagHI) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeHI, "Batch CEU File Errors", emailBodyHI);
		}

		if (flagHO) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeHO, "Batch CEU File Errors", emailBodyHO);
		}

		if (flagLA) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeLA, "Batch CEU File Errors", emailBodyLA);
		}

		if (flagMH) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeMH, "Batch CEU File Errors", emailBodyMH);
		}

		if (flagMT) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeMT, "Batch CEU File Errors", emailBodyMT);
		}

		if (flagNU) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeNU, "Batch CEU File Errors", emailBodyNU);
		}

		if (flagOP) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeOP, "Batch CEU File Errors", emailBodyOP);
		}

		if (flagPD) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodePD, "Batch CEU File Errors", emailBodyPD);
		}

		if (flagPL) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodePL, "Batch CEU File Errors", emailBodyPL);
		}
		if (flagPY) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodePY, "Batch CEU File Errors", emailBodyPY);
		}

		if (flagRA) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeRA, "Batch CEU File Errors", emailBodyRA);
		}

		if (flagRE) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeRE, "Batch CEU File Errors", emailBodyRE);
		}

		if (flagSA) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeSA, "Batch CEU File Errors", emailBodySA);
		}

		if (flagSM) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeSM, "Batch CEU File Errors", emailBodySM);
		}

		if (flagSP) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeSP, "Batch CEU File Errors", emailBodySP);
		}

		if (flagSW) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeSW, "Batch CEU File Errors", emailBodySW);
		}

		if (flagET) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeET, "Batch CEU File Errors", emailBodyET);
		}

		if (flagVT) {
			ELPLogging.debug("Sending batch status email");
			sendBatchStatusEmail(emailAddressCodeVT, "Batch CEU File Errors", emailBodyVT);
		}

	} catch (ex) {
		ELPLogging.error("Send Error Email Error : ", ex);
	}
	finally {
		if (dataSet != null) {
			dataSet.close();
		}
		if (errorReportProcedure != null) {
			errorReportProcedure.close();
		}
	}
	ELPLogging.debug("emailErrorReport End.");
}

/**
 * @desc This method will check duplicate records. If any duplicate record found it will delete that record from staging table.
 * @param queryResult
 */
function duplicateRecordCheck(queryResult) {
	ELPLogging.debug("Duplicate record check for row number # " + queryResult.rowNumber);
	var duplicateFlag = false;

	//IN parameters to duplicate record check procedure
	// added courseNumber - JSH - 08/23/18
	var emseDupCheckParameters = {
		"boardCode": queryResult.boardCode,
		"typeClass": queryResult.typeClass,
		"licenseNumber": queryResult.licenseNumber,
		"providerCode": queryResult.providerCode,
		"courseName": queryResult.courseName,
		"courseDate": queryResult.courseDate,
		"courseNumber": queryResult.courseNumber,
		"duplicateFlag": false
	};
	try {
		var duplicateCheckResult = callToStoredProcedure(emseDupCheckParameters, "duplicateRecordCheck");
		duplicateFlag = duplicateCheckResult.duplicateFlag;
		ELPLogging.debug("Duplicate record flag = " + duplicateFlag);
	} catch (ex) {
		ELPLogging.error("duplicateRecordCheck ", ex);
		duplicateFlag = false;
	}

	return duplicateFlag;
}

/**
 * @desc This method logs an error in the error table "ELP_TBL_ERROR_STG_MA" in case of an invalid record.
 * @param {recordID} recordID - contains the first name and last name.
 * @param {errorDescription} errorDescription - contains the errorDescription.
 * @throws ELPAccelaEMSEException
 */
function updateErrorTable(recordID, errorDescription) {
	ELPLogging.debug("Updating Error table : " + recordID + " in ELP_TBL_ERROR_STG_MA table.");

	//Error table update parameters
	var errorTableUpdateParameters = {
		"BatchInterfaceName": dynamicParamObj.batchInterfaceName,
		"RecordID": recordID,
		"ErrorDescription": errorDescription,
		"runDate": RUN_DATE
	};

	//Calling ELP_SP_ERROR_INT_INSERT SP to insert data into error table
	callToStoredProcedure(errorTableUpdateParameters, "errorTableInsert");
}

/**
 * @desc This method creates the DB connection and execute the supplemental stored procedure
 * @param {emseInsertParameters} emseInsertParameters - Input parameters
 * @param {supplementalTag} supplementalTag - Stored procedure name.
 */
function callToStoredProcedure(emseInsertParameters, supplementalTag) {
	for (var stgObjIterator = 0; stgObjIterator < stagingConfigObj.supplemental.length; stgObjIterator++) {
		var supplementalConfiguration = stagingConfigObj.supplemental[stgObjIterator];

		if (supplementalConfiguration.tag == supplementalTag) {
			var record = new StoredProcedure(supplementalConfiguration.procedure, dbConn);
			break;
		}
	}
	var queryResult = {};
	if (record == null) {
		var message = "Cannot find procedure";
		var exception = new Error(message);
		throw exception;
	}

	var staticParameters = {};
	var dynamicParameters = {};
	var batchApplicationResult = {};

	record.spCall = "{ CALL " + record.procedure.name + " ";

	// add the parameter place holders
	// there is always an out parameter first for the update count
	if ((record.procedure.parameters != null) &&
		record.procedure.parameters.list.length > 0) {
		var placeHolders = "";

		var parameters = record.procedure.parameters.list;

		for (i = 0; i < parameters.length; i++) {
			if (placeHolders.length == 0) {
				placeHolders = placeHolders + "(?";
			} else {
				placeHolders = placeHolders + ", ?";
			}
		}

		placeHolders += ") ";

		record.spCall += placeHolders;
	} else {
		var placeHolders = "";
		placeHolders = placeHolders + "(?"; // count out parameter
		placeHolders += ") ";
		record.spCall += placeHolders;
	}

	record.spCall += "}";
	try {
		ELPLogging.debug("record.spCall -- " + record.spCall);
		record.statement = record.dbConnection.prepareCall(record.spCall);

		var inputParameters = record.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);

		record.copyEMSEParameters(emseInsertParameters, inputParameters);

		record.setParameters(inputParameters);
		queryResult = record.executeProcedure();
	} catch (ex) {
		ELPLogging.error("callStoredProcedure Exception", ex);
	}
	finally {
		if (record != null) {
			record.close();
		}
	}
	return queryResult;
}

/**
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name
 * @throws  N/A
 */
function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";
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
			sql += " WHERE RUN_DATE = ?";
			stmt = dbConn.prepareStatement(sql);
			var sql_date = new java.sql.Timestamp(parameters["runDate"].getTime());
			stmt.setTimestamp(1, sql_date);
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

function getProviderCode(queryProcedure, parameters) {
	var dataSet = null;
	try {

		for (p in parameters) {
			ELPLogging.debug("**INFO: " + p + ": " + parameters[p]);
		}

		var stmt = null;
		var sql = "select PROVIDER_NAME, PROVIDER_NO from " + parameters["tableName"];
		ELPLogging.debug("**SQL: " + sql);

		stmt = dbConn.prepareStatement(sql);
		var rs = stmt.executeQuery();

		var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

		dataSet = ds;

	} catch (ex) {
		ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
	}
	return dataSet;
}

function getErrorReportRecords(queryProcedure, parameters) {
	var dataSet = null;
	try {

		for (p in parameters) {
			ELPLogging.debug("**INFO: " + p + ": " + parameters[p]);
		}

		var stmt = null;
		var sql = "select * from " + parameters["tableName"] + " where batchInterfaceName = ? and run_date = ?";
		stmt = dbConn.prepareStatement(sql);
		stmt.setString(1, parameters["batchInterfaceName"]);
		var sql_date = new java.sql.Timestamp(parameters["runDate"].getTime());
		stmt.setTimestamp(2, sql_date);

		var rs = stmt.executeQuery();

		ELPLogging.debug("**SQL: " + sql);
		var ds = new DataSet(rs, queryProcedure.procedure.resultSet, queryProcedure);

		dataSet = ds;

	} catch (ex) {
		ELPLogging.error("**ERROR: In function " + arguments.callee.toString().match(/function ([^\(]+)/)[1] + ", line: " + ex.lineNumber + " - " + ex.message + "\r" + ex.stack);
	}
	return dataSet;
}
