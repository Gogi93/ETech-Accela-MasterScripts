/***********************************************************************************************************************************
 * @Title 		: 	SQL_BATCH_FORFEITURE_PENDING_EXAM
 * @Author		:	Sagar Cheke
 * @Date			:	03/17/2016
 * @Description 	:	If an application is in the status of 'Pending Exam' for more than 2 years Then set the workflow status of the application to "Expired" and close the application. (Script #653)
 ***********************************************************************************************************************************/
var SCRIPT_VERSION = 3.0;

showDebug = true;
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
var condAddedCount = 0;
var emailText = "";

// you can get rid of the ELPLogging debug
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

/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var group = aa.env.getValue("group");
var recordType = aa.env.getValue("recordType");
var recordSubType = aa.env.getValue("recordSubType");
var recordCategory = aa.env.getValue("recordCategory");
var wTask = aa.env.getValue("wTask");
var wStatus = aa.env.getValue("wStatus");
//var duration = aa.env.getValue("duration");

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "EXAM_OVER_2_YEARS"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "")
	aa.print("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
	"supplemental":   [{\
	"tag":"queryHDPendingExamApps",\
	"procedure":{\
	"name":"ELP_SP_HD_PENDING_EXAM_QUERY",\
	"resultSet":{"list":[\{"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\{"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\{"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\{"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\{"source":"RESULT","name":"assignUser","parameterType":"OUT","property":"ASSIGNED_USERID#","type":"STRING"},\{"source":"RESULT","name":"dateStatus","parameterType":"OUT","property":"DATE_STATUS","type":"DATE"},\{"source":"RESULT","name":"daysPast","parameterType":"OUT","property":"DAYS_SINCE_STATUS_UPDATE","type":"INTEGER"}]},\
	"parameters":{"list":[\{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
	}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);
try {
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
		var pendingExamProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryHDPendingExamApps") {
				var pendingExamProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (pendingExamProcedure == null) {
			var message = "Cannot find procedure queryHDPendingExamApps";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryHDPendingExamApps: " + supplementalConfiguration.procedure.name);

		/* *
		 * The ECB Violation procedure returns a ResultSet of ECB Violations
		 */
		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		pendingExamProcedure.prepareStatement();
		var inputParameters = pendingExamProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		logDebugAndEmail("Searching for HD records with 'Pending Exam' record status and over days since Validate/Approved for Sit status");

		//pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		//pendingExamProcedure.setParameters(inputParameters);

		var dataSet = getRecordsArray(emseParameters);
		//var dataSet = pendingExamProcedure.queryProcedure();
		if (dataSet != false || dataSet.length > 0) {
			for (var i in dataSet) {
				ObjKeyRename(dataSet[i], {
					"B1_PER_ID1": "id1"
				});
				ObjKeyRename(dataSet[i], {
					"B1_PER_ID2": "id2"
				});
				ObjKeyRename(dataSet[i], {
					"B1_PER_ID3": "id3"
				});
				ObjKeyRename(dataSet[i], {
					"B1_ALT_ID": "customID"
				});
				ObjKeyRename(dataSet[i], {
					"ASSIGNED_USERID#": "assignUser"
				});
				ObjKeyRename(dataSet[i], {
					"DATE_STATUS": "dateStatus"
				});
				ObjKeyRename(dataSet[i], {
					"DAYS_SINCE_STATUS_UPDATE": "daysPast"
				});

				var queryResult = dataSet[i];
				//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){
				if (elapsed() > maxSeconds) // Only continue if time hasn't expired
				{
					logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					timeExpired = true;
					break;
				}

				aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 + " (" + queryResult.customID + ")" + " Days since approval: " + queryResult.daysPast + " Date Status: " + queryResult.dateStatus);

				capIdResult = aa.cap.getCapID(queryResult.customID);
				if (!capIdResult.getSuccess()) {
					aa.print("getCapID error: " + capIdResult.getErrorMessage());
					continue;
				}

				var capId = capIdResult.getOutput();
				capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

				var capResult = aa.cap.getCap(capId);
				if (!capResult.getSuccess()) {
					aa.print("getCap error: " + capResult.getErrorMessage());
					continue;
				}

				var cap = capResult.getOutput();
				var altId = capId.getCustomID();
				aa.print("altId : " + altId);
				var capStatus = cap.getCapStatus();
				var appTypeResult = cap.getCapType();
				var appTypeString = appTypeResult.toString();
				var appTypeArray = appTypeString.split("/");
				var board = appTypeArray[1];

				var currentDate = new Date();
				var currentYr = currentDate.getFullYear();
				var currentMonth = currentDate.getMonth();
				var currentDay = currentDate.getDate();

				var wfDateStatus = new Date(queryResult.dateStatus);
				var wfYear = wfDateStatus.getFullYear();
				var wfMonth = wfDateStatus.getMonth();
				var wfDay = wfDateStatus.getDate();

				//If an application is in the status of 'Pending Exam' for more than 2 years Then set the workflow status of the application to "Expired" and close the application

				var YrDiff = currentYr - wfYear;
				var dateDifference = dateDifferenceFunction(wfDateStatus, currentDate);
				aa.print("dateDifference = " + dateDifference);
				if ((YrDiff >= 2) && (wfMonth <= currentMonth) && (wfDay < currentDay))

					if ((dateDifference >= 730) || (dateDifference >= 731)) {
						aa.print("Update Workflow status of the application to Expired and close the application");

						updateTask("Exam", "Expired", "Updated via script.", "Updated via script.");
						closeTask("Exam", "Expired", "Updated via script.", "Updated via script.");
					}

				capCount++;
			}
		}
	}
} catch (ex) {
	aa.print("exception caught: " + ex.message);

	//dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_653_FORFEITURE_PENDING_EXAM" + ex.message);
	aa.print("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	aa.print("EMSEReturnMessage: " + "Error executing SQL_BATCH_653_FORFEITURE_PENDING_EXAM. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
finally {
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (pendingExamProcedure != null) {
		pendingExamProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}

	if (!ELPLogging.isFatal()) {
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		aa.print("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		//aa.print("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with no errors.");
		}
	}

	aa.print(ELPLogging.toString());
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	aa.print("PARAMETER " + pParamName + " = " + ret);
	return ret;
}

function logDebugAndEmail(debugText) {
	emailText = emailText + debugText + br;
	aa.print(debugText);
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

/**
 * @desc This method calculate the absolute date difference between two dates.
 * @param {date1,date2} - two JavaScript date objects
 * @returns {integer} - returns an integer value.
 */
function dateDifferenceFunction(date1, date2) {
	var datediff = Math.abs(date1.getTime() - date2.getTime());

	return Math.ceil((datediff / (24 * 60 * 60 * 1000)));
}

function getRecordsArray(emseParameters) {
	var sql =
		"SELECT b.serv_prov_code, \
		b.b1_per_id1, \
		b.b1_per_id2, \
		b.b1_per_id3, \
		b.b1_per_group, \
		b.b1_per_type, \
		b.b1_per_sub_type,  \
		b.b1_alt_id,  \
		b.b1_appl_status,  \
		W.task,  \
		W.status AS TASKSTATUS,  \
		date_assigned,  \
		date_due,  \
		to_char(date_status, 'yyyy/mm/dd hh24:mi:ss') as date_status,  \
		task_is_active,  \
		task_is_complete,  \
		days_since_assigned,  \
		Floor(Trunc(sysdate) - date_status) AS DAYS_SINCE_STATUS_UPDATE,  \
		assigned_userid#  \
		FROM   b1permit b  \
		LEFT JOIN v_workflow W  \
		ON B.serv_prov_code = W.agency_id  \
		AND B.b1_alt_id = W.record_id  \
		WHERE  b.b1_per_group = 'License'  \
		AND b.b1_per_type = 'Cosmetology'  \
		AND b.b1_per_sub_type = 'Forfeiture'  \
		AND b.b1_per_category = 'Application'  \
		AND b.b1_appl_status = 'Pending Exam'  \
		AND b.rec_status = 'A'  \
		AND W.task = 'Exam'  \
		AND W.status = 'Pending Exam'  \
		AND W.task_is_active = 'Y'";

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
	for (var key in src) {
		if (key in map)
			// rename key
			dst[map[key]] = src[key];
		else
			// same key
			dst[key] = src[key];
	}
	// clear src
	for (var key in src) {
		delete src[key];
	}
	// dst --> src
	for (var key in dst) {
		src[key] = dst[key];
	}
}
