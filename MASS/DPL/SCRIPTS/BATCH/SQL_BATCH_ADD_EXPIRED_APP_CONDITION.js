/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_ADD_EXPIRED_APP_CONDITION (Script 827) Trigger : Batch
 |
 | - Adds the Standard Condition "Application About to Expire" with a status of Applied to 
 |   EN and LS - Professional Engineer Applications and EN and LS - Professional Land Surveyor Applications with the following:
 |    1) Record Status == 'Pending Exam'
 |    2) 36 months have passed since Workflow status of 'Approved to Sit for Exam' has changed
 | 
 | Batch Requirements :
 | - None
 | Batch Options:
 | - None
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
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

var capInPendingExamCount = 0;
var capExpiredCount = 0;

//Variables used
var oneDay = 24*60*60*1000;
var months = 36
var duration = Math.round(months*30.43); 
	
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
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "EXPIRED_APP_CONDITION"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryPendingExamApps",\
					"procedure":{\
						"name":"ELP_SP_PENDING_EXAM_VW_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';




var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try
{
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if(dbConfiguration)
	{
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		var licenseRenewalProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryPendingExamApps")
			{
				 var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseRenewalProcedure == null)
		{
			var message = "Cannot find procedure queryPendingExamApps";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryPendingExamApps: " + supplementalConfiguration.procedure.name);

		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		licenseRenewalProcedure.prepareStatement();
		var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};
		 
		logDebugAndEmail("Searching for EN and LS records");

		//licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		//licenseRenewalProcedure.setParameters(inputParameters);

		//var dataSet = licenseRenewalProcedure.queryProcedure();

		var dataSet = getRecordsArray(emseParameters);
		
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"B1_PER_ID1":"id1"});
			ObjKeyRename(dataSet[i], {"B1_PER_ID2":"id2"});
			ObjKeyRename(dataSet[i], {"B1_PER_ID3":"id3"});
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
			var queryResult = dataSet[i];

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){	
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")");
			capIdResult = aa.cap.getCapID(queryResult.customID);
			if ( ! capIdResult.getSuccess())
			{
				ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}
			
			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

			var capResult = aa.cap.getCap(capId);
			if ( ! capResult.getSuccess())
			{
				ELPLogging.debug("getCap error: " + capResult.getErrorMessage());
				continue;
			}
			
			var cap = capResult.getOutput();
			var altId = capId.getCustomID();
			var capStatus = cap.getCapStatus();
			var appTypeResult = cap.getCapType();
			var appTypeString = appTypeResult.toString();
			var appTypeArray = appTypeString.split("/");
			var board = appTypeArray[1];
			capInPendingExamCount++;
			
			var workflowResult = aa.workflow.getTasks(capId);
		
			//Get Workflow
			if (workflowResult.getSuccess())
			{				
				wfObj = workflowResult.getOutput();
				for (var i=0; i< wfObj.length; i++)
				{ 
					var fTask = wfObj[i]; 
					var desc = fTask.getTaskDescription(); 
					var disp = fTask.getDisposition(); 
				
					//Check for Task = "Validate" and Status = "Approved to Sit for Exam"
					if(desc == "Validate" && disp == "Approved to Sit for Exam") 
					{
						var taskDate = fTask.getStatusDate();
						var newDate = new Date();
						var condition = Math.round(Math.abs((newDate.getTime() - taskDate.getTime())/(oneDay)));
						
						//Check the duration for which the condition needs to be added
						if(condition > duration)
						{
							logDebugAndEmail("Record ID qualified: " + altId);
							logDebugAndEmail("Qualifying Days: " + condition);
							
							//Add Condition
							CWM_ELP_Generic_DPL_addConditionOnCap("Application Checklist", "Application About to Expire", capId);
							logDebugAndEmail("Condition Added");
							capExpiredCount++
						}
					}
				}		
			}		
		} // end for loop over the Oracle Data set returned.
	}// end of connection 
	else
	{
		logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	}

	logDebugAndEmail("Total Applications in Pending Exam status: " + capInPendingExamCount);
	logDebugAndEmail("Total Applications 'Application About to Expire' condition added: " + capExpiredCount);	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_ADD_EXPIRED_APP_CONDITION" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_ADD_EXPIRED_APP_CONDITION. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_ADD_EXPIRED_APP_CONDITION " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ADD_EXPIRED_APP_CONDITION completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_ADD_EXPIRED_APP_CONDITION completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ADD_EXPIRED_APP_CONDITION completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_ADD_EXPIRED_APP_CONDITION completed with no errors.");
		}
	}

	aa.print(ELPLogging.toString());
}


if (emailAddress && emailAddress.length > 0 ) {
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
function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail( debugText )
{
	emailText = emailText + debugText + br;
	ELPLogging.debug(debugText);
}

 function getContactPreferredChannelDesc(value) {
	return lookup("CONTACT_PREFERRED_CHANNEL", value);
}

function getRecordsArray(emseParameters){
	var sql = 
			"SELECT b.serv_prov_code, \
			       b.b1_per_id1, \
			       b.b1_per_id2, \
			       b.b1_per_id3, \
			       b.b1_per_group, \
			       b.b1_per_type, \
			       b.b1_per_sub_type, \
			       b.b1_alt_id, \
			       b.b1_appl_status, \
			       W.task, \
			       W.status AS TASKSTATUS \
			FROM   b1permit b \
			       LEFT JOIN v_workflow W \
			              ON B.serv_prov_code = W.agency_id \
			                 AND B.b1_alt_id = W.record_id \
			WHERE  b.b1_per_group = 'License' \
			       AND b.b1_per_type = 'Engineers and Land Surveyors' \
			       AND b.b1_per_sub_type IN ( 'Professional Land Surveyor', \
			                                  'Professional Engineer' \
			                                ) \
			       AND b.b1_per_category = 'Application' \
			       AND b.b1_appl_status = 'Pending Exam' \
			       AND b.serv_prov_code = 'DPL' \
			       AND b.rec_status = 'A' \
			       AND W.task = 'Exam' \
			       AND W.status = 'Pending Exam' \
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