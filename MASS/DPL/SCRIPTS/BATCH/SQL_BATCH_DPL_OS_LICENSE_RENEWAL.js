/* ------------------------------------------------------------------------------------------------------ /
| Program : SQL_BATCH_DPL_OS_LICENSE_RENEWAL
| Trigger : Batch
| @Author : Sagar Cheke
| @Date   : 03/28/2015
|
| @updated by: debashish.barik | Date: 06/03/2016 , RTC#12188
|
| - Creates temp renewal records for licenses which have an expiration date that is <= 90 (or configured days) from current date.
| - If the contact is in active military duty, the license expiration date is calculated for the next period.
| - If the preferred communication is email for the Licensed Individual or Business contact, renewal records are placed in a set
|   for email renewal notification, otherwise they are placed in a set for the interface team to use to produce the renewal notice and send to the printers.
| - This script does not generate the renewal notice.
|
| Batch Requirements :
| - None
| Batch Options:
| - NO PARAMS - All Licenses Types
| - LicenseType - By Board
| - LicenseType and LicenseSubType - By License Type
|
| - For any of the above you can specify:
|   ExpirationDate - Use this expiration data as criteria
| 	 OR
| 	 ExpirationDateLookahead - Number of days to look ahead
|
/ ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0;

function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

showDebug = 3;
showMessage = false;
var maxSeconds = 60 * 60 * 2;
var br = "<br>";

var sysDate = aa.date.getCurrentDate();
var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("BatchJobName");
// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer
var timeExpired = false;
// Email address of the sender
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var renewalCapCount = 0;
var autoRenewCapCount = 0;
var dorCondCapCount = 0;
var licenseMissingLPs = 0;
var boardNotDefined = 0;
var renewalRecordExists = 0;
var missingExpDetails = 0;
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info

var emailText = "";
var publicUser = "";

try {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_CUSTOM"));
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
	eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
	eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
	eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
	eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
	eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
	eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
	eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "")
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

//Set Size
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
	setSize = 1000;

var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");
var daysToExpired = getParam("ExpirationDateLookahead");
var expirationDate = getParam("ExpirationDate");

var stagingConfigurationString = '{\
						"connectionSC": "DB_CONNECTION_INFO",\
							"supplemental":   [{\
										"tag":"queryLicenseRenewals",\
										"procedure":{\
											"name":"ELP_SP_READY_TO_RENEW_OS_QUERY",\
											"resultSet":{"list":[\
																			 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
																			 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
																			 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
                                                                             {"source":"RESULT","name":"B1_PER_TYPE","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\
                                                                             {"source":"RESULT","name":"B1_PER_SUB_TYPE","parameterType":"OUT","property":"B1_PER_SUB_TYPE","type":"STRING"},\
																			 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
																			 {"source":"RESULT","name":"expirationDate","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"}]},\
											"parameters":{"list":[\
																			 {"source":"RESULT","name":"AGENCY","parameterType":"IN","property":"AGENCY","type":"STRING"},\
																			 {"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
																			 {"source":"RESULT","name":"LICENSE_SUBTYPE","parameterType":"IN","property":"LICENSE_SUBTYPE","type":"STRING"},\
																			 {"source":"RESULT","name":"EXPIRATION_STARTDATE","parameterType":"IN","property":"EXPIRATION_STARTDATE","type":"DATE"},\
																			 {"source":"RESULT","name":"EXPIRATION_ENDDATE","parameterType":"IN","property":"EXPIRATION_ENDDATE","type":"DATE"},\
																			 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
							}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try {
	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();

	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if (dbConfiguration) {
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		 * Obtain Stored Procedure for queryECBViolation into Staging Table
		 */
		var licenseRenewalProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenseRenewals") {
				var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseRenewalProcedure == null) {
			var message = "Cannot find procedure queryLicenseRenewals";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryLicenseRenewals: " + supplementalConfiguration.procedure.name);

		/* *
		 * The ECB Violation procedure returns a ResultSet of ECB Violations
		 */
		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		licenseRenewalProcedure.prepareStatement();
		var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		var fromDt = new Date();
		var toDate = new Date();
		/*if( expirationDate && expirationDate != null){
		fromDt = new Date(expirationDate);
		toDate = new Date(expirationDate);
		ELPLogging.debug("Expiration Date set via parameter.");
		}
		else {*/

		if (daysToExpired == null || daysToExpired == "" || daysToExpired == "undefined" || isNaN(Number(daysToExpired))) {
			daysToExpired = 90;
			ELPLogging.debug("Expiration Look Ahead value not set via parameter. Setting Default 90 day expiration Look Ahead.");
		} else {
			ELPLogging.debug("Expiration Look Ahead value set via parameter.:" + daysToExpired);
		}

		fromDt.setDate(fromDt.getDate());
		toDate.setDate(toDate.getDate() + parseInt(daysToExpired));
		//}


		logDebugAndEmail("Searching for records with expiration date range from: " + fromDt + " to: " + toDate);

		if ((licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "") &&
			(licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "")) {
			logDebugAndEmail("License Type not set via parameter. Processing all DPL Ready for Renewal Licenses with expiration date from: " + fromDt + " to " + toDate);
		}

		if ((licenseTypeParam != null && licenseTypeParam != "undefined" && licenseTypeParam != "") &&
			(licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "")) {
			logDebugAndEmail("License SubType not set via parameter. ");
			logDebugAndEmail("Processing DPL Ready for Renew Licenses by Board = " + licenseTypeParam + " with expiration date from: " + fromDt + " to " + toDate);
		}

		emseParameters.EXPIRATION_STARTDATE = fromDt;
		emseParameters.EXPIRATION_ENDDATE = toDate;
		emseParameters.LICENSE_TYPE = licenseTypeParam;
		emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;
		emseParameters.AGENCY = "DPL";

		licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		licenseRenewalProcedure.setParameters(inputParameters);

		//var dataSet = licenseRenewalProcedure.queryProcedure();
		var dataSet = getRecordsArray(emseParameters);
		for (var i in dataSet)
		{
				ObjKeyRename(dataSet[i], {"B1_ALT_ID": "customID"});
				ObjKeyRename(dataSet[i], {"B1_PER_ID1": "id1"});
				ObjKeyRename(dataSet[i], {"B1_PER_ID2": "id2"});
				ObjKeyRename(dataSet[i], {"B1_PER_ID3": "id3"});
				ObjKeyRename(dataSet[i], {"EXPIRATION_DATE": "expirationDate"});
				var queryResult = dataSet[i];
			
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			ELPLogging.debug(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 + " (" + queryResult.customID + ")" + " expiration date:" + queryResult.expirationDate);

			capIdResult = aa.cap.getCapID(queryResult.customID);
			if (!capIdResult.getSuccess()) {
				ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}

			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

			var capResult = aa.cap.getCap(capId);
			if (!capResult.getSuccess()) {
				ELPLogging.debug("getCap error: " + capResult.getErrorMessage());
				continue;
			}

			var cap = capResult.getOutput();
			var altId = capId.getCustomID();
			var capStatus = cap.getCapStatus();
			var appTypeResult = cap.getCapType();
			var appTypeString = appTypeResult.toString();
			var appTypeArray = appTypeString.split("/");
			var licenseType = appTypeArray[1];
			var licenseSubType = appTypeArray[2];
			var boardCode = altId.split("-")[1];
			capCount++;

			// Only process licenses with "Current" status (With the exception of RE Salesperson & RE Broker)
			if (capStatus != "Current") {
					logDebugAndEmail("Unable to create renewal for license: " + altId + ". License status:" + capStatus);
			}

			// This is check to see if this license type should be processed by batch
			var processBoard = lookup("DPL_BOARDS", licenseType);
			if (processBoard == null || processBoard == "" || processBoard == "undefined") {
				logDebugAndEmail("Unable to look up Board Code for License: " + altId + ". Verify DPL_BOARDS standard choice contains board code for: " + licenseType);
				boardNotDefined++;
				continue;
			}
			// Check transaction license has a reference license
			var refLic = getRefLicenseProf(altId)
				if (!refLic) {
					logDebugAndEmail("Unable to look up License Professional for License: " + altId + ". Verify License Professional is associated to this license.");
					licenseMissingLPs++;
					continue;
				}

				var b1ExpResult = aa.expiration.getLicensesByCapID(capId);
			if (b1ExpResult.getSuccess()) {
				var lic = new licenseObject(altId, capId);
				var tmpOriginalStatus = lic.getStatus();

				if (lpHasCondition(altId, "Right to Renew Stayed by DOR")) {
					// Set expiration status to About to Expire in order to be able to create TMP record.
					lic.setStatus("About to Expire");

					// Create temp renewal record (for ACA users)
					createResult = aa.cap.createRenewalRecord(capId);

					if (!createResult.getSuccess()) {
						logDebugAndEmail("WARNING: Could not create renewal record for record on first attempt: " + altId + " " + createResult.getErrorMessage());
						createResult = aa.cap.createRenewalRecord(capId);
					}

					// Adding second attempt to create TMP for the case when createCap exception occurs because of duplicate tracking number assignment
					if (!createResult.getSuccess()) {
						logDebugAndEmail("WARNING: Could not create renewal record for record on second attempt: " + altId + " " + createResult.getErrorMessage());
					} else {
						renewalCapId = createResult.getOutput();
						renewalCap = aa.cap.getCap(renewalCapId).getOutput();

						if (renewalCap.isCompleteCap()) {
							logDebugAndEmail(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
						} else {
							ELPLogging.debug(altId + ": Created Renewal Record " + renewalCapId.getCustomID());

							aa.cap.updateAccessByACA(renewalCapId, "N");

							AInfo = new Array();
							AInfo = loadAppSpecificNew(AInfo, capId);
							copyAppSpecific(renewalCapId);

						}
						logDebugAndEmail("DOR Notice Condition found on " + altId + " and will not be added to Renewal Notice Set.");
					}

					//Set status back to original status
					lic.setStatus(tmpOriginalStatus);

					dorCondCapCount++;
				} else {
					var appType = appTypeArray[2];


					var military = getAppSpecificValue("Military Status", capId);
					if (military == null || military == undefined || military == "") {
						military = "N/A";
					}

					if (military == "Active Duty") {

						// Add comment to work-flow task to indicate auto renewal
						var taskName = "License";
						var updateTaskStatus = "Current";
						ELPLogging.debug("Updating Task: Task Name = " + taskName + " task Status = " + updateTaskStatus);
						updateTask(taskName, updateTaskStatus, "Active Duty Automatic Renewal assessed by system batch job", "Active Duty Automatic Renewal assessed by system batch job", "", capId);

						//if military status = "Active Duty" change Expiration date
						//calculateDPLExpirationDateForRenewal(capId);
						activeLicense(capId);
						updateActiveRefLP(capId);
						ELPLogging.debug("License Expiration date changed for Active Duty Military status. License No: " + altId);

						autoRenewCapCount++;
					}

					if (military != "Active Duty") {
						// Set expiration status to About to Expire (this will make the renewal button available in ACA)
						lic.setStatus("About to Expire");

						// Create temp renewal record (for ACA users)
						createResult = aa.cap.createRenewalRecord(capId);

						if (!createResult.getSuccess()) {
							logDebugAndEmail("WARNING: Could not create renewal record for record on first attempt: " + altId + " " + createResult.getErrorMessage());
							createResult = aa.cap.createRenewalRecord(capId);
						}

						// Adding second attempt to create TMP for the case when createCap exception occurs because of duplicate tracking number assignment
						if (!createResult.getSuccess()) {
							logDebugAndEmail("WARNING: Could not create renewal record for record on second attempt: " + altId + " " + createResult.getErrorMessage());
						} else {
							renewalCapId = createResult.getOutput();
							renewalCap = aa.cap.getCap(renewalCapId).getOutput();

							if (renewalCap.isCompleteCap()) {
								logDebugAndEmail(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
								logDebugAndEmail(altId + " will not be added to Renewal Notice Set.");
								renewalRecordExists++;
							} else {
								ELPLogging.debug(altId + ": Created Renewal Record " + renewalCapId.getCustomID());

								aa.cap.updateAccessByACA(renewalCapId, "N");

								renewalCapCount++;

								AInfo = new Array();
								AInfo = loadAppSpecificNew(AInfo, capId);
								copyAppSpecific(renewalCapId);


								//Check for communication method for Business or Licensed Individual contact type only
								var pc = checkForPreferredCommunicationMethod(capId);
								//Preferred channel is email
								if (pc == "Email") {
									callReport(boardCode + "|RENEWAL_NOTIFICATION_EMAIL", false, true, "Email Notification");
								} else {
									callReport(boardCode + "|RENEWAL_NOTIFICATION", false, true, "DPL Renewal App Print Set");
								}

								if (queryResult.B1_PER_SUB_TYPE == "Sales Representative") {
									callReport("OS Sales Representative Renewal Letter", false, true, "DPL Renewal App Print Set");
								} else if (queryResult.B1_PER_TYPE == "Occupational Schools" && queryResult.B1_PER_SUB_TYPE == "School") {
									callReport("OS Renewal Letter", false, true, "DPL Renewal App Print Set");
								}
							}
						}
					}
				}
			} else {
				logDebugAndEmail("WARNING: Unable to retrieve expiration details for license:" + altId);
				missingExpDetails++;
			}

		} // end for loop over the Oracle Data set returned.
	} // end of connection
	else {
		logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	}

	logDebugAndEmail("________________________________________________________________________________");
	logDebugAndEmail("Total Licenses Processed: " + capCount);
	logDebugAndEmail("Licenses with Board not defined: " + boardNotDefined);
	logDebugAndEmail("Licenses missing LPs that were not renewed: " + licenseMissingLPs);
	logDebugAndEmail("Licenses missing expiration details that were not renewed: " + missingExpDetails);
	logDebugAndEmail("Licenses with DOR Notice conditions:" + dorCondCapCount);
	logDebugAndEmail("Active Duty Licenses Processed: " + autoRenewCapCount);
	logDebugAndEmail("Non-Military Licenses Processed: " + renewalCapCount);
	logDebugAndEmail("Licenses not added to set because TMP renewal exists: " + renewalRecordExists);
	//dataSet.close();
} catch (ex) {
	aa.print("exception caught: " + ex.message);

	dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_OS_LICENSE_RENEWAL" + ex.message);
	ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_OS_LICENSE_RENEWAL. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_OS_LICENSE_RENEWAL " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
finally {
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (licenseRenewalProcedure != null) {
		licenseRenewalProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}

	if (!ELPLogging.isFatal()) {
		dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_OS_LICENSE_RENEWAL completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_OS_LICENSE_RENEWAL completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_OS_LICENSE_RENEWAL completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_OS_LICENSE_RENEWAL completed with no errors.");
		}
	}

	aa.print(ELPLogging.toString());
}

if (emailAddress.length > 0) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
}

/* ------------------------------------------------------------------------------------------------------ /
| <=========== Internal Functions and Classes (Used by this script)
/ ------------------------------------------------------------------------------------------------------ */
function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	ELPLogging.debug("PARAMETER " + pParamName + " = " + ret);
	return ret;
}
function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail(debugText) {
	emailText = emailText + debugText + br;
	ELPLogging.debug(debugText);
}

function getContactPreferredChannelDesc(value) {
	return lookup("CONTACT_PREFERRED_CHANNEL", value);
}

function getAppSpecificValue(pItemName, pItemCapId) {
	//modified version of getAppSpecific function created for this batch script
	//
	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(pItemCapId);
	if (appSpecInfoResult.getSuccess()) {
		var appspecObj = appSpecInfoResult.getOutput();

		if (pItemName != "")
			for (i in appspecObj)
				if (appspecObj[i].getCheckboxDesc() == pItemName) {
					return appspecObj[i].getChecklistComment();
					break;
				}
	} else {
		ELPLogging.debug("ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage())
	}
	return false;
}

function getContactObjsNew(itemCap) // optional typeToLoad, optional return only one instead of Array?
{
	var typesToLoad = false;
	if (arguments.length == 2)
		typesToLoad = arguments[1];
	var capContactArray = new Array();
	var cArray = new Array();
	if (itemCap.getClass().toString().equals("com.accela.aa.aamain.cap.CapModel")) { // page flow script
		//if (!cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") {
		if (cap.getApplicantModel()) {
			capContactArray[0] = cap.getApplicantModel();
		}
		if (cap.getContactsGroup().size() > 0) {
			var capContactAddArray = cap.getContactsGroup().toArray();
			for (ccaa in capContactAddArray)
				capContactArray.push(capContactAddArray[ccaa]);
		}
	} else {
		var capContactResult = aa.people.getCapContactByCapID(itemCap);
		if (capContactResult.getSuccess()) {
			var capContactArray = capContactResult.getOutput();
		}
	}
	if (capContactArray) {
		for (var yy in capContactArray) {
			if (!typesToLoad || exists(capContactArray[yy].getPeople().contactType, typesToLoad)) {
				cArray.push(new contactObj(capContactArray[yy]));
			}
		}
	}
	ELPLogging.debug("getContactObj returned " + cArray.length + " contactObj(s)");
	return cArray;
}

function loadASITableCustom(tname) {
	//
	// Returns a single ASI Table array of arrays
	// Optional parameter, cap ID to load from
	//
	var itemCap = capId;
	if (arguments.length == 2)
		itemCap = arguments[1]; // use cap ID specified in args
	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
		var tai = ta.iterator();
	while (tai.hasNext()) {
		var tsm = tai.next();
		var tn = tsm.getTableName();
		if (!tn.equals(tname))
			continue;
		if (tsm.rowIndex.isEmpty()) {
			ELPLogging.debug("Couldn't load ASI Table " + tname + " it is empty");
			return false;
		}
		var tempObject = new Array();
		var tempArray = new Array();
		var tsmfldi = tsm.getTableField().iterator();
		var tsmcoli = tsm.getColumns().iterator();
		var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
		var numrows = 1;
		while (tsmfldi.hasNext()) // cycle through fields
		{
			if (!tsmcoli.hasNext()) // cycle through columns
			{
				var tsmcoli = tsm.getColumns().iterator();
				tempArray.push(tempObject); // end of record
				var tempObject = new Array(); // clear the temp obj
				numrows++;
			}
			var tcol = tsmcoli.next();
			var tval = tsmfldi.next();
			var readOnly = 'N';
			if (readOnlyi.hasNext()) {
				readOnly = readOnlyi.next();
			}
			var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
			tempObject[tcol.getColumnName()] = fieldInfo;
		}
		tempArray.push(tempObject); // end of record
	}
	return tempArray;
}

function loadAppSpecificNew(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2)
		itemCap = arguments[1];
	// use cap ID specified in args

	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess()) {
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj) {
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
		}
		return thisArr;
	}
}

function checkForPreferredCommunicationMethod(pCapId) {
	//Check for communication method for Business or Licensed Individual contact type only
	var co = getContactObjsNew(pCapId);
	for (i in co) {
		var po = co[i].people;
		var contactType = po.getContactType();
		if ((contactType == "Licensed Individual" || contactType == "Business" || contactType == "Occupational School") && po.getPreferredChannel()) {
			var pc = getContactPreferredChannelDesc(po.getPreferredChannel());
			if (!pc)
				pc = "Postal Mail";
			ELPLogging.debug(po.getContactName() + " - " + po.getContactType() + " - PreferredChannel:" + pc);

			if (pc == "Email")
				return pc;
		}
	}
	return "Postal Mail"
}


function updateActiveRefLP() {
	var licExpDate = null;
	var b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);
	if (b1ExpResult.getSuccess()) {
		var expObj = b1ExpResult.getOutput();
		licExpDate = expObj.getExpDate();
	}

	logDebug("Get Ref License Prof to update expiration date.");
	//var refLP = getRefLicenseProf(itemCap);
	var refLP = getRefLicenseProf(itemCap.getCustomID());
	if (!refLP) {
		refLP = getRefLicenseProfWithLicNbrAndTypeClass(itemCap.getCustomID())
	}
	if (refLP && refLP != null) {
		var licExpDateOldValue = refLP.getLicenseExpirationDate();
		refLP.setLicenseExpirationDate(licExpDate);
		refLP.setAuditStatus("A");
		refLP.setLicenseLastRenewalDate(sysDate);
		refLP.setPolicy("Current");
		refLP.setWcExempt("Y");

		var res = aa.licenseScript.editRefLicenseProf(refLP);
		if (res.getSuccess())
			logDebug("Ref LP expiration date updated.");
		else
			logDebug("Ref LP expiration date not updated. " + res.getErrorMessage());
		addToLicenseSyncSet(itemCap);
	} else {
		logDebug("Ref LP not found.");
	}

	//JIRA 2358
	var licenseProfessional = getLicenseProfessional(itemCap);

	var altID = itemCap.getCustomID();

	var licNumberArray = altID.split("-");
	var licenseNumber = licNumberArray[0];
	var boardName = licNumberArray[1];
	var licenseType = licNumberArray[2];

	if (licenseProfessional) {
		for (var thisCapLpNum in licenseProfessional) {
			var licenseProfessionalScriptModel = licenseProfessional[thisCapLpNum];

			var licNbrB3contra = licenseProfessionalScriptModel.getLicenseNbr();
			var boardCodeB3contra = licenseProfessionalScriptModel.getComment();
			var typeClassB3Contra = licenseProfessionalScriptModel.getBusinessLicense();

			if (((licenseNumber == licNbrB3contra) && (boardName == boardCodeB3contra) && (licenseType == typeClassB3Contra)) ||
				((licenseNumber + "-" + licenseType == licNbrB3contra + "-" + typeClassB3Contra) &&
					(boardName == boardCodeB3contra) && (licenseType == typeClassB3Contra))) {

				licenseProfessionalScriptModel.setLicenseExpirDate(licExpDate);
				licenseProfessionalScriptModel.setWorkCompExempt("Y");
				var res = aa.licenseProfessional.editLicensedProfessional(licenseProfessionalScriptModel);
				if (res.getSuccess())
					logDebug("Ref LP expiration date updated.");
				else
					logDebug("Ref LP expiration date not updated. " + res.getErrorMessage());
			}
		}
	}

}

function getRecordsArray(emseParameters){
	var sql = "select b.SERV_PROV_CODE,b.B1_PER_ID1, b.B1_PER_ID2, b.B1_PER_ID3, b.B1_PER_GROUP, b.b1_per_type, b.b1_per_sub_type, \
				b.B1_PER_CATEGORY, b.b1_alt_id, b.B1_APPL_STATUS, e.EXPIRATION_STATUS, e.EXPIRATION_DATE \
				from B1PERMIT b \
				left join B1_EXPIRATION e \
				on b.B1_PER_ID1 = e.B1_PER_ID1 \
				and b.B1_PER_ID2 = e.B1_PER_ID2 \
				and b.B1_PER_ID3 = e.B1_PER_ID3 \
				and b.SERV_PROV_CODE = e.SERV_PROV_CODE \
				and b.REC_STATUS = 'A' \
				where  b.SERV_PROV_CODE  = 'DPL' \
				and b.B1_PER_CATEGORY in ('License', 'Approval') \
				and b.B1_PER_TYPE = 'Occupational Schools' \
				and b.B1_APPL_STATUS = 'Current' \
				and e.EXPIRATION_STATUS not in ('About to Expire', 'Inactive') \
				and (b.b1_per_type = '" + emseParameters.LICENSE_TYPE + "' OR '" + emseParameters.LICENSE_TYPE + "' IS NULL) \
				and (b.b1_per_sub_type = '" + emseParameters.LICENSE_SUBTYPE + "' OR '" + emseParameters.LICENSE_SUBTYPE + "' IS NULL) \
				and (e.EXPIRATION_DATE) >= TO_DATE('" + aa.util.formatDate(emseParameters.EXPIRATION_STARTDATE, "MM/dd/yyyy") + "', 'mm/dd/yyyy') \
				and (e.EXPIRATION_DATE) <= TO_DATE('" + aa.util.formatDate(emseParameters.EXPIRATION_ENDDATE, "MM/dd/yyyy") + "', 'mm/dd/yyyy') \
				order by EXPIRATION_DATE,  b.b1_per_type asc";

			aa.print(sql);

			var arr = doSQL(sql);
			return arr;
}
function doSQL(sql) {

	try {
		var array = [];
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sStmt = conn.prepareStatement(sql);

		if (sql.toUpperCase().indexOf("SELECT") == 0) {
			var rSet = sStmt.executeQuery();
			while (rSet.next()) {
				var obj = {};
				var md = rSet.getMetaData();
				var columns = md.getColumnCount();
				for (i = 1; i <= columns; i++) {
					obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
				}
				obj.count = rSet.getRow();
				array.push(obj);
			}
			rSet.close();
			sStmt.close();
			conn.close();
			return array;
		}
	} catch (err) {
		aa.print(err.message);
	}
}
function ObjKeyRename(src, map) {
    var dst = {};
    // src --> dst
    for(var key in src){
        if(key in map)
            // rename key
            dst[map[key]] = src[key];
        else
            // same key
            dst[key] = src[key];
    }
    // clear src
    for(var key in src){
        delete src[key];
    }
    // dst --> src
    for(var key in dst){
        src[key] = dst[key];
    }
}