/* ------------------------------------------------------------------------------------------------------ /
| Program : SQL_BATCH_DPL_LICENSE_SYNC_1638 
| Trigger : Batch
|
| 1)LAST_RENEWAL_DD:-
|	a. If license has a renewal - Calculated based on Latest renewal status as Closed if not Closed then Ready for Printing status
|	b. If License does not have renewal - it should be null
|		
| 2) LAST_UPDATE_DD 		
|		a. if license has a renewal - Calculated based on Latest renewal status 
|			Closed if not Closed then Ready for Printing status
|		b. if license does not have a renewal - B1_FILE_DD
|
| Batch Requirements :
| - None
| Batch Options:
| - NO PARAMS - All Licenses Types
| - LicenseType - By Board
| - LicenseType and LicenseSubType - By License Type
/ ------------------------------------------------------------------------------------------------------ */

var SCRIPT_VERSION = 3.0
showDebug = false;
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

var emailText = "";
var publicUser = "";

try 
{
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
	eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
} 
catch (ex) 
{
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
// this flag somehow gets reset in the scripts above, resetting here again so that it doesnt log
showDebug = false;
/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "LIC SYNC"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "")
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

//Set Size
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
	setSize = 1000;

var licenseType = getParam("licenseType");
var licenseSubType = getParam("licenseSubType");


var stagingConfigurationString = '{\
		"connectionSC": "DB_CONNECTION_INFO",\
			"supplemental":   [\
						{"tag":"queryLicenseRecords",\
						"procedure":{\
							"name":"ELP_SP_SYNC_VIEW_QUERY_1638",\
							"resultSet":{"list":[\
										{"source":"RESULT","name":"LICENSE_ID_B1PERMIT","parameterType":"OUT","property":"LICENSE_ID(B1PERMIT)","type":"STRING"},\
										{"source":"RESULT","name":"LIC_NBR_B3CONTRA","parameterType":"OUT","property":"LIC_NBR(B3CONTRA)","type":"STRING"},\
										{"source":"RESULT","name":"LP_LIC_NBR_RSTATE_LIC","parameterType":"OUT","property":"LP_LIC_NBR (RSTATE_LIC)","type":"STRING"},\
										{"source":"RESULT","name":"LP_LIC_TYPE_RSTATE_LIC","parameterType":"OUT","property":"LP_LIC_TYPE (RSTATE_LIC)","type":"STRING"},\
										{"source":"RESULT","name":"LICENSE_STATUS_B1PERMIT","parameterType":"OUT","property":"LICENSE_STATUS(B1PERMIT)","type":"STRING"},\
										{"source":"RESULT","name":"LP_STATUS_RSTATE_LIC","parameterType":"OUT","property":"LP_STATUS(RSTATE_LIC)","type":"STRING"},\
										{"source":"RESULT","name":"LIC_ORIG_ISS_DD_B1PERMIT","parameterType":"OUT","property":"LIC_ORIG_ISS_DD(B1PERMIT)","type":"DATE"},\
										{"source":"RESULT","name":"LIC_ORIG_ISS_DD_B3CONTRA","parameterType":"OUT","property":"LIC_ORIG_ISS_DD(B3CONTRA)","type":"DATE"},\
										{"source":"RESULT","name":"LIC_ORIG_ISS_DD_RSTATE_LIC","parameterType":"OUT","property":"LIC_ORIG_ISS_DD(RSTATE_LIC)","type":"DATE"},\
										{"source":"RESULT","name":"EXP_DATE_B1_EXPIRATION","parameterType":"OUT","property":"EXP_DATE(B1_EXPIRATION)","type":"DATE"},\
										{"source":"RESULT","name":"LIC_EXPIR_DD_B3CONTRA","parameterType":"OUT","property":"LIC_EXPIR_DD(B3CONTRA)","type":"DATE"},\
										{"source":"RESULT","name":"LP_EXP_DATE_RSTATE_LIC","parameterType":"OUT","property":"LP_EXP_DATE(RSTATE_LIC)","type":"DATE"},\
										{"source":"RESULT","name":"LAST_RENEWAL_DD_B3CONTRA","parameterType":"OUT","property":"LAST_RENEWAL_DD(B3CONTRA)","type":"DATE"},\
										{"source":"RESULT","name":"LAST_RENEWAL_DD_RSTATE_LIC","parameterType":"OUT","property":"LAST_RENEWAL_DD(RSTATE_LIC)","type":"DATE"},\
										{"source":"RESULT","name":"LAST_UPDATE_DD_B3CONTRA","parameterType":"OUT","property":"LAST_UPDATE_DD(B3CONTRA)","type":"DATE"},\
										{"source":"RESULT","name":"LAST_UPDATE_DD_RSTATE_LIC","parameterType":"OUT","property":"LAST_UPDATE_DD(RSTATE_LIC)","type":"DATE"}]},\
							"parameters":{"list":[\
										{"source":"RESULT","name":"licenseType","parameterType":"IN","property":"licenseType","type":"STRING"},\
										{"source":"RESULT","name":"licenseSubType","parameterType":"IN","property":"licenseSubType","type":"STRING"},\
										{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}},\
						{"tag":"updateB3contraTable",\
						"procedure":{\
							"name":"ELP_SP_UPDATE_B3CONTRA",\
							"resultSet":{"list":[\]},\
							"parameters":{"list":[\
										{"source":"RESULT","name":"SERV_PROV_CODE","parameterType":"IN","property":"SERV_PROV_CODE","type":"STRING"},\
										{"source":"RESULT","name":"B1_PER_ID1","parameterType":"IN","property":"B1_PER_ID1","type":"STRING"},\
										{"source":"RESULT","name":"B1_PER_ID2","parameterType":"IN","property":"B1_PER_ID2","type":"STRING"},\
										{"source":"RESULT","name":"B1_PER_ID3","parameterType":"IN","property":"B1_PER_ID3","type":"STRING"},\
										{"source":"RESULT","name":"B1_LICENSE_NBR","parameterType":"IN","property":"B1_LICENSE_NBR","type":"STRING"},\
										{"source":"RESULT","name":"B1_COMMENT","parameterType":"IN","property":"B1_COMMENT","type":"STRING"},\
										{"source":"RESULT","name":"B1_BUS_LIC","parameterType":"IN","property":"B1_BUS_LIC","type":"STRING"},\
										{"source":"RESULT","name":"LIC_ORIG_ISS_DD_B3CONTRA","parameterType":"IN","property":"LIC_ORIG_ISS_DD_B3CONTRA","type":"DATE"},\
										{"source":"RESULT","name":"LIC_EXPIR_DD_B3CONTRA","parameterType":"IN","property":"LIC_EXPIR_DD_B3CONTRA","type":"DATE"},\
										{"source":"RESULT","name":"LAST_RENEWAL_DD_B3CONTRA","parameterType":"IN","property":"LAST_RENEWAL_DD_B3CONTRA","type":"DATE"},\
										{"source":"RESULT","name":"LAST_UPDATE_DD_B3CONTRA","parameterType":"IN","property":"LAST_UPDATE_DD_B3CONTRA","type":"DATE"}]}}},\
						{"tag":"updateRstateLicTable",\
						"procedure":{\
							"name":"ELP_SP_UPDATE_RSTATE_LIC",\
							"resultSet":{"list":[\]},\
							"parameters":{"list":[\
										{"source":"RESULT","name":"SERV_PROV_CODE","parameterType":"IN","property":"SERV_PROV_CODE","type":"STRING"},\
										{"source":"RESULT","name":"LIC_NBR","parameterType":"IN","property":"LIC_NBR","type":"STRING"},\
										{"source":"RESULT","name":"LIC_COMMENT","parameterType":"IN","property":"LIC_COMMENT","type":"STRING"},\
										{"source":"RESULT","name":"BUS_LIC","parameterType":"IN","property":"BUS_LIC","type":"STRING"},\
										{"source":"RESULT","name":"LIC_TYPE","parameterType":"IN","property":"LIC_TYPE","type":"STRING"},\
										{"source":"RESULT","name":"LP_STATUS_RSTATE_LIC","parameterType":"IN","property":"LP_STATUS_RSTATE_LIC","type":"STRING"},\
										{"source":"RESULT","name":"LIC_ORIG_ISS_DD_RSTATE_LIC","parameterType":"IN","property":"LIC_ORIG_ISS_DD_RSTATE_LIC","type":"DATE"},\
										{"source":"RESULT","name":"LP_EXP_DATE_RSTATE_LIC","parameterType":"IN","property":"LP_EXP_DATE_RSTATE_LIC","type":"DATE"},\
										{"source":"RESULT","name":"LAST_RENEWAL_DD_RSTATE_LIC","parameterType":"IN","property":"LAST_RENEWAL_DD_RSTATE_LIC","type":"DATE"},\
										{"source":"RESULT","name":"LAST_UPDATE_DD_RSTATE_LIC","parameterType":"IN","property":"LAST_UPDATE_DD_RSTATE_LIC","type":"DATE"}]}}}]\
			}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try 
{
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if (dbConfiguration)
	{
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		
		var licenseRecordProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++)
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenseRecords") 
			{
				var licenseRecordProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseRecordProcedure == null) 
		{
			var message = "Cannot find procedure queryLicenseRecords";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryLicenseRecords: " + supplementalConfiguration.procedure.name);

		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		licenseRecordProcedure.prepareStatement();
		var inputParameters = licenseRecordProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		// commented for performance
		//logDebugAndEmail("Searching for records with expiration date range from: " + fromDt + " to: " + toDate);

		if ((licenseType == null || licenseType == "undefined" || licenseType == "") &&
			(licenseSubType == null || licenseSubType == "undefined" || licenseSubType == "")) 
		{
			logDebugAndEmail("License Type not set via parameter. Processing all records");
		}

		if ((licenseType != null && licenseType != "undefined" && licenseType != "") &&
			(licenseSubType == null || licenseSubType == "undefined" || licenseSubType == "")) 
		{
			logDebugAndEmail("License SubType not set via parameter. ");
			logDebugAndEmail("Processing Licenses by Board = " + licenseType);
		}
		
		
		emseParameters.licenseSubType = licenseSubType;
		emseParameters.licenseType = licenseType;
		
		ELPLogging.debug("licenseType : "+licenseType+" || licenseSubType : "+licenseSubType);
		licenseRecordProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query # ", inputParameters);
		licenseRecordProcedure.setParameters(inputParameters);

		var dataSet = getRecordsArray(emseParameters);
		//var dataSet = licenseRecordProcedure.queryProcedure(); 
		/* var emseParameters = {};
		
		var dataSet = callToStoredProcedure(emseParameters, "queryLicenseRecords"); */
		
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"LICENSE_ID":"LICENSE_ID_B1PERMIT"});
			ObjKeyRename(dataSet[i], {"LIC_NBR":"LIC_NBR_B3CONTRA"});
			ObjKeyRename(dataSet[i], {"LP_LIC_NBR":"LP_LIC_NBR_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"LP_LIC_TYPE":"LP_LIC_TYPE_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"LICENSE_STATUS":"LICENSE_STATUS_B1PERMIT"});
			ObjKeyRename(dataSet[i], {"LP_STATUS":"LP_STATUS_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"LIC_ORIG_ISS_DD_B1":"LIC_ORIG_ISS_DD_B1PERMIT"});
			ObjKeyRename(dataSet[i], {"LIC_ORIG_ISS_DD_B3":"LIC_ORIG_ISS_DD_B3CONTRA"});
			ObjKeyRename(dataSet[i], {"LIC_ORIG_ISS_DD_RS":"LIC_ORIG_ISS_DD_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"EXP_DATE":"EXP_DATE_B1_EXPIRATION"});
			ObjKeyRename(dataSet[i], {"LIC_EXPIR_DD":"LIC_EXPIR_DD_B3CONTRA"});
			ObjKeyRename(dataSet[i], {"LP_EXP_DATE":"LP_EXP_DATE_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"LAST_RENEWAL_DD_B3":"LAST_RENEWAL_DD_B3CONTRA"});
			ObjKeyRename(dataSet[i], {"LAST_RENEWAL_DD_RS":"LAST_RENEWAL_DD_RSTATE_LIC"});
			ObjKeyRename(dataSet[i], {"LAST_UPDATE_DD_B3":"LAST_UPDATE_DD_B3CONTRA"});
			ObjKeyRename(dataSet[i], {"LAST_UPDATE_DD_RS":"LAST_UPDATE_DD_RSTATE_LIC"});
			
			var queryResult = dataSet[i];

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}
			
			processRecords(queryResult);
			
		}
	}
	else
	{
		logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	}

	logDebugAndEmail("________________________________________________________________________________");
	logDebugAndEmail("Total Licenses Processed: " + capCount);
	
}
catch (ex) 
{
	ELPLogging.debug("exception caught: " + ex.message);

	//dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_LICENSE_SYNC_1638" + ex.message);
	ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_LICENSE_SYNC_1638. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_LICENSE_SYNC_1638 " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
finally
{
	// close objects
	if (dataSet != null) 
	{
		//dataSet.close();
	} 
	if (licenseRecordProcedure != null) 
	{
		licenseRecordProcedure.close();
	}
	if (databaseConnection != null) 
	{
		databaseConnection.close();
	}

	if (!ELPLogging.isFatal()) 
	{
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LICENSE_SYNC_1638 completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LICENSE_SYNC_1638 completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LICENSE_SYNC_1638 completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LICENSE_SYNC_1638 completed with no errors.");
		}
	}

	aa.print(ELPLogging.toString());
}

/* if (emailAddress.length > 0) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
} */

function processRecords(queryResult)
{
	ELPLogging.debug("-----------------------------------------------Processing record : "+queryResult.LICENSE_ID_B1PERMIT);
	var capIdResult = aa.cap.getCapID(queryResult.LICENSE_ID_B1PERMIT);
	if (!capIdResult.getSuccess()) 
	{
		ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
	}

	var capId = capIdResult.getOutput();
	
	var lastRenewalDate = retrieveLastRenewalDate(capId);
	ELPLogging.debug("lastRenewalDate : "+lastRenewalDate);
	
	//update B3CONTRA table
	updateB3contraTable(queryResult,capId, lastRenewalDate);
	
	//Update RSTATE_LIC table
	updateRstateLicTable(queryResult,capId, lastRenewalDate);
	
	//Add record to SYNC set
	addToLicenseSyncSet4Batch(capId)
	capCount++;
}

function updateB3contraTable(queryResult, capId, lastRenewalDate)
{
	var emseUpdateParameters = {};
	var scanner = new Scanner(queryResult.LICENSE_ID_B1PERMIT, "-");
	var licenseSeqNbr = scanner.next();
	var boardCode = scanner.next();
	var typeClass = scanner.next();
	
	emseUpdateParameters.SERV_PROV_CODE = 'DPL';
	emseUpdateParameters.B1_PER_ID1 = capId.ID1;
	emseUpdateParameters.B1_PER_ID2 = capId.ID2;
	emseUpdateParameters.B1_PER_ID3 = capId.ID3;
	emseUpdateParameters.B1_LICENSE_NBR = queryResult.LIC_NBR_B3CONTRA;
	emseUpdateParameters.B1_COMMENT = boardCode;
	emseUpdateParameters.B1_BUS_LIC = typeClass;
	
	
	if(new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT).getTime() != new Date(queryResult.LIC_ORIG_ISS_DD_B3CONTRA).getTime())
	{
		emseUpdateParameters.LIC_ORIG_ISS_DD_B3CONTRA = new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT);
		
	}
	if(new Date(queryResult.EXP_DATE_B1_EXPIRATION).getTime() != new Date(queryResult.LIC_EXPIR_DD_B3CONTRA))
	{
		emseUpdateParameters.LIC_EXPIR_DD_B3CONTRA = new Date(queryResult.EXP_DATE_B1_EXPIRATION);
	}
	
	if(lastRenewalDate && (lastRenewalDate.getTime() != new Date(queryResult.LAST_RENEWAL_DD_B3CONTRA).getTime()))
	{
		emseUpdateParameters.LAST_RENEWAL_DD_B3CONTRA = lastRenewalDate;
	}
	else
	{
		emseUpdateParameters.LAST_RENEWAL_DD_B3CONTRA = lastRenewalDate;
	}
	
	if(lastRenewalDate && (lastRenewalDate.getTime() != new Date(queryResult.LAST_UPDATE_DD_B3CONTRA).getTime()))
	{
		emseUpdateParameters.LAST_UPDATE_DD_B3CONTRA = new Date(lastRenewalDate);
	}
	else
	{
		emseUpdateParameters.LAST_UPDATE_DD_B3CONTRA = new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT);
	}
	
	var updateB3contraResult = callToStoredProcedure(emseUpdateParameters, "updateB3contraTable");

}

function updateRstateLicTable(queryResult, capId, lastRenewalDate)
{
	var emseRstateLicUpdateParameters = {};
	var scanner = new Scanner(queryResult.LICENSE_ID_B1PERMIT, "-");
	var licenseNbr = scanner.next();
	var boardCode = scanner.next();
	var typeClass = scanner.next();
	
	emseRstateLicUpdateParameters.SERV_PROV_CODE = 'DPL';
	emseRstateLicUpdateParameters.LIC_NBR = queryResult.LP_LIC_NBR_RSTATE_LIC;
	emseRstateLicUpdateParameters.LIC_COMMENT = boardCode;
	emseRstateLicUpdateParameters.BUS_LIC = typeClass;
	emseRstateLicUpdateParameters.LIC_TYPE = queryResult.LP_LIC_TYPE_RSTATE_LIC;
	
	
	//LP status
	if(queryResult.LICENSE_STATUS_B1PERMIT != queryResult.LP_STATUS_RSTATE_LIC)
	{
		emseRstateLicUpdateParameters.LP_STATUS_RSTATE_LIC = queryResult.LICENSE_STATUS_B1PERMIT;
	}
	
	//LIC_ORIG_ISS_DD
	if(new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT).getTime() != new Date(queryResult.LIC_ORIG_ISS_DD_RSTATE_LIC).getTime())
	{
		emseRstateLicUpdateParameters.LIC_ORIG_ISS_DD_RSTATE_LIC = new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT);
	}
	
	//EXP_DATE
	if(new Date(queryResult.EXP_DATE_B1_EXPIRATION).getTime() != new Date(queryResult.LP_EXP_DATE_RSTATE_LIC).getTime())
	{
		emseRstateLicUpdateParameters.LP_EXP_DATE_RSTATE_LIC = new Date(queryResult.EXP_DATE_B1_EXPIRATION);
	}
	
	//LAST_RENEWAL_DD
	if(lastRenewalDate && (lastRenewalDate.getTime() != new Date(queryResult.LAST_RENEWAL_DD_RSTATE_LIC).getTime()))
	{
		emseRstateLicUpdateParameters.LAST_RENEWAL_DD_RSTATE_LIC = lastRenewalDate;
	}
	else
	{
		emseRstateLicUpdateParameters.LAST_RENEWAL_DD_RSTATE_LIC = lastRenewalDate;
	}
	
	//LAST_UPDATE_DD
	if(lastRenewalDate && (lastRenewalDate.getTime() != new Date(queryResult.LAST_UPDATE_DD_RSTATE_LIC).getTime()))
	{
		emseRstateLicUpdateParameters.LAST_UPDATE_DD_RSTATE_LIC = new Date(lastRenewalDate);
	}
	else
	{
		emseRstateLicUpdateParameters.LAST_UPDATE_DD_RSTATE_LIC = new Date(queryResult.LIC_ORIG_ISS_DD_B1PERMIT);
	}
	
	var updateB3contraResult = callToStoredProcedure(emseRstateLicUpdateParameters, "updateRstateLicTable");
	
}

function retrieveLastRenewalDate(capId)
{
	var lastRenewalDate = null;
	
	var renewalCapId = null;
	var capArray = new Array();

	var childRecordsResult = aa.cap.getProjectByMasterID(capId, "Renewal", "");

	if (childRecordsResult.getSuccess()) 
	{
		var childRecordslist = childRecordsResult.getOutput();

		for (counter in childRecordslist) 
		{
			var childRecID = childRecordslist[counter].getCapID();
			var capScriptModel = aa.cap.getCap(childRecID);
			if(capScriptModel.getSuccess())
			{
				var capScriptModelResult = capScriptModel.getOutput();	
				var capStatus = capScriptModelResult.getCapStatus();
				var capType = capScriptModelResult.getCapType();

				var scanner = new Scanner(capType.toString(), "/");
				var group = scanner.next();
				var type = scanner.next();
				var subType = scanner.next();
				var category = scanner.next();
				//Add below record status to array and get latest renewal from them
				//This scenario is if first latest renewal is on Submitted status
				if((capStatus == "Closed") || (capStatus == "Ready for Printing") || (capStatus =="Approved") && category == "Renewal")
				{
					capArray[counter] = childRecID;
				}
			}
		}

		if (capArray.length > 0) 
		{
			//Get Latest Renewal record
			var latestRenewalRec = null;
			var latestRenewalRecDate = null;

			for (thisCapCounter in capArray) 
			{
				if (!latestRenewalRec) 
				{
					ELPLogging.debug("--1--");
					latestRenewalRec = capArray[thisCapCounter];
					
					if ((latestRenewalRec.getID1().indexOf("EST") > 0)) 
					{
						latestRenewalRec = null;
						continue;
					}
					var capModelResult = aa.cap.getCap(latestRenewalRec).getOutput();
					latestRenewalRecDate = capModelResult.getFileDate();
					var latestRenewalDate = new Date(latestRenewalRecDate.getMonth() + "/" + latestRenewalRecDate.getDayOfMonth() +
							"/" + latestRenewalRecDate.getYear());
				}
				else 
				{
					ELPLogging.debug("--2--");
					var tempCapID = capArray[thisCapCounter];
					var capModelResult = aa.cap.getCap(tempCapID).getOutput();
					var tempDate = capModelResult.getFileDate();
					var newLicDate = new Date(tempDate.getMonth() + "/" + tempDate.getDayOfMonth() +"/" + tempDate.getYear());
					var b1PerId1 = tempCapID.getID1();

					if ((b1PerId1.indexOf("EST") < 0)) 
					{
						if ((newLicDate > latestRenewalDate) == 1) 
						{
							latestRenewalDate = newLicDate;
							latestRenewalRec = tempCapID;
						}
					}
				}
			}
			renewalCapId = latestRenewalRec;
		}
		if(renewalCapId == null)
		{
			//If temp renewal then it will be null
			lastRenewalDate = null;
		}
		else
		{
			//retrieve rec_date for latest renewal
			lastRenewalDate = retriveRecDateForRenewalUpdate(renewalCapId);
		}
	}
	
	return lastRenewalDate;
}


function retriveRecDateForRenewalUpdate(renewalCapId)
{
	ELPLogging.debug("renewalCapId : "+renewalCapId);
	var lastRenewalDate = null;
	var capScriptModel = aa.cap.getCap(renewalCapId);
	if(capScriptModel.getSuccess())
	{
		var capScriptModelResult = capScriptModel.getOutput();	
		var capStatus = capScriptModelResult.getCapStatus();
		if((capStatus == "Closed") || (capStatus == "Ready for Printing") || (capStatus =="Approved"))
		{
			var workflowResult = aa.workflow.getTasks(renewalCapId);
			if (workflowResult.getSuccess())
			{
				var wfObj = workflowResult.getOutput();
				
				for (i in wfObj)
				{ 
					var fTask = wfObj[i]; 
					var desc = fTask.getTaskDescription(); 
					var disp = fTask.getDisposition(); 
					var statusDate = fTask.getStatusDate();
										
					if(desc == "Issuance" && (disp =="Printed" || disp =="Closed") && (capStatus == "Closed"))
					{
						//Closed/printed
						ELPLogging.debug("--1-1-");
						lastRenewalDate = fTask.getStatusDate();
						break;
					}
					else if(((desc == "Validate" && (disp == "Approved" || disp == "Approved with Conditions")))&& (capStatus == "Ready for Printing" ||capStatus =="Approved"))
					{
						//record on Issuance/Ready for Printing
						ELPLogging.debug("--1-2-");
						lastRenewalDate = fTask.getStatusDate();
						break;
					}
					
				}   
			}
		}
		
	}
	return lastRenewalDate;
}

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	return ret;
}

function elapsed() 
{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail(debugText) 
{
	emailText = emailText + debugText + br;
	ELPLogging.debug(debugText);
}

/** 
 * @desc This method creates the DB connection and execute the supplemental stored procedure
 * @param {emseInsertParameters} emseInsertParameters - Input parameters
 * @param {supplementalTag} supplementalTag - Stored procedure name. 
 */
function callToStoredProcedure(emseInsertParameters, supplementalTag)
{
    for (var stgObjIterator = 0; stgObjIterator < stagingConfiguration.supplemental.length; stgObjIterator ++ )
    {
        var supplementalConfiguration = stagingConfiguration.supplemental[stgObjIterator];

        if (supplementalConfiguration.tag == supplementalTag)
        {
            var record = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
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
	
    record.statement = record.dbConnection.prepareCall(record.spCall);

    var inputParameters = record.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
    record.copyEMSEParameters(emseInsertParameters, inputParameters);

    record.setParameters(inputParameters);
		
    var queryResult = record.executeProcedure();

    record.close();
	
	return queryResult;
}


function addToLicenseSyncSet4Batch(addToSetCapId) 
{
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = lookup("Lookup:LicenseSync", "SET_NAME");

	if (matches(setName, null, "", undefined)) setName = "SYNCSET";

	var setExists = false;
	var setGetResult = aa.set.getSetByPK(setName);
	if (setGetResult.getSuccess()) setExists = true;

	if (!setExists) 
	{
		setDescription = setName;
		setType = "License Sync";
		setStatus = "Pending";
		setExists = createSet(setName, setDescription, setType, setStatus);
	}

	if (setExists) 
	{
		var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(addToSetCapId).getOutput();

		var doesExistInSync = false;
		for (i = 0; i < setsMemberIsPartOf.size(); i++) 
		{
			if (setName == setsMemberIsPartOf.get(i).getSetID()) 
			{
				doesExistInSync = true;
				ELPLogging.debug("Record is part of set : " + setsMemberIsPartOf.get(i).getSetID());
			}
		}
		
		if (!doesExistInSync)
		{
			ELPLogging.debug("Add record to SYNC set : " + addToSetCapId);
			aa.set.add(setName, addToSetCapId);
		}
	}
}

function getRecordsArray(emseParameters){
	var sql = 
			"SELECT b1.serv_prov_code, \
		       b1.b1_per_group, \
		       b1.b1_per_type, \
		       b1.b1_per_sub_type, \
		       b1.b1_per_category, \
		       b1.b1_alt_id            	LICENSE_ID, \
		       b1.b1_appl_status       	LICENSE_STATUS, \
		       rs.ins_policy_no        	LP_STATUS, \
		       b1.b1_file_dd           	LIC_ORIG_ISS_DD_B1, \
		       b3c.b1_lic_orig_iss_dd  	LIC_ORIG_ISS_DD_B3, \
		       RS.lic_orig_iss_dd    	LIC_ORIG_ISS_DD_RS, \
		       b1e.expiration_date   	EXP_DATE, \
		       b3c.b1_lic_expir_dd   	LIC_EXPIR_DD, \
		       rs.lic_expir_dd       	LP_EXP_DATE, \
		       b3c.b1_last_renewal_dd  	LAST_RENEWAL_DD_B3, \
		       RS.last_renewal_dd      	LAST_RENEWAL_DD_RS, \
		       b3c.b1_last_update_dd   	LAST_UPDATE_DD_B3, \
		       RS.last_update_dd       	LAST_UPDATE_DD_RS, \
		       rs.lic_seq_nbr          	LP_LIC_SEQ_NBR, \
		       rs.lic_type             	LP_LIC_TYPE, \
		       rs.lic_nbr              	LP_LIC_NBR, \
		       rs.serv_prov_code       	LP_SERV_PROV_CODE, \
		       b1e.expiration_status   	EXP_STATUS, \
		       b3c.b1_license_nbr      	LIC_NBR, \
		       b3c.b1_license_type     	LICENSE_TYPE, \
		       b3c.lic_seq_nbr         	LIC_SEQ_NBR, \
		       gp.sd_pro_des           	WF_TK, \
		       gp.sd_app_des           	TK_STATUS \
		FROM   b1permit b1 \
		       INNER JOIN accela.b1_expiration b1e \
		               ON b1.b1_per_id1 = b1e.b1_per_id1 \
		                  AND b1.b1_per_id2 = b1e.b1_per_id2 \
		                  AND b1.b1_per_id3 = b1e.b1_per_id3 \
		                  AND b1.serv_prov_code = b1e.serv_prov_code \
		       INNER JOIN gprocess gp \
		               ON b1.b1_per_id1 = gp.b1_per_id1 \
		                  AND b1.b1_per_id2 = gp.b1_per_id2 \
		                  AND b1.b1_per_id3 = gp.b1_per_id3 \
		                  AND b1.serv_prov_code = gp.serv_prov_code \
		       INNER JOIN b3contra b3c \
		               ON b1.b1_per_id1 = b3c.b1_per_id1 \
		                  AND b1.b1_per_id2 = b3c.b1_per_id2 \
		                  AND b1.b1_per_id3 = b3c.b1_per_id3 \
		                  AND ( ( Substr(b1.b1_alt_id, 1, Instr(b1.b1_alt_id, '-', -1, 2) - 1)\
		                          = b3c.b1_license_nbr ) \
		                         OR ( Concat(Concat(Substr(b1_alt_id, 1, Instr(b1_alt_id, '-') - 1), '-'), \
		                              Substr( b1_alt_id, Instr(b1_alt_id, '-') + 4)) = b3c.b1_license_nbr ) \
		                      ) \
		                  AND ( Regexp_substr (b1.b1_alt_id, '[^-]+', 1, 2) ) = b3c.b1_comment \
		                  AND ( Regexp_substr (b1_alt_id, '[^-]+', 1, 3) ) = b3c.b1_bus_lic \
		                  AND b1.serv_prov_code = b3c.serv_prov_code \
		       INNER JOIN rstate_lic rs \
		               ON rs.lic_nbr = b3c.b1_license_nbr \
		                  AND rs.lic_type = b3c.b1_license_type \
		                  AND rs.lic_comment = b3c.b1_comment \
		                  AND rs.bus_lic = b3c.b1_bus_lic \
		WHERE  b1.b1_per_category = 'License' \
		       AND b1.serv_prov_code = 'DPL' \
		       AND b1.rec_status = 'A'  \
		       AND rs.serv_prov_code = 'DPL' \
		       AND \
		       ( ( b1.b1_appl_status != rs.ins_policy_no ) \
		          OR ( b1.b1_file_dd != b3c.b1_lic_orig_iss_dd ) \
		          OR ( b1.b1_file_dd != RS.lic_orig_iss_dd ) \
		          OR ( b1e.expiration_date != b3c.b1_lic_expir_dd ) \
		          OR ( b1e.expiration_date != rs.lic_expir_dd ) \
		          OR ( ( b3c.b1_last_renewal_dd != RS.last_renewal_dd ) \
		                OR ( b3c.b1_last_renewal_dd IS NULL \
		                     AND RS.last_renewal_dd IS NOT NULL ) ) \
		          OR ( b3c.b1_last_update_dd != RS.last_update_dd \
		                OR b3c.b1_last_update_dd IS NULL \
		                OR RS.last_update_dd IS NULL ) ) \
		        AND (b1.B1_PER_TYPE = '" +emseParameters.LICENSE_TYPE+"' OR '" +emseParameters.LICENSE_TYPE+"' IS NULL) \
		        AND (b1.B1_PER_SUB_TYPE = '" +emseParameters.LICENSE_SUBTYPE+"' OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL) \
		        AND ROWNUM < 20"; 

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
