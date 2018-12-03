/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING Trigger : Batch
 |
 | - 
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

var capCount = 0;
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info
	
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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "CLOSE REQUIREMENT PENDING"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryReqPending",\
					"procedure":{\
						"name":"ELP_SP_PENDING_REQS_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"conIssDate","parameterType":"OUT","property":"B1_CON_ISS_DD","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';


var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try
{
 
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
	ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
	logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var pendingReqProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryReqPending")
		{
			 var pendingReqProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (pendingReqProcedure == null)
	{
		var message = "Cannot find procedure queryReqPending";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryReqPending: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	pendingReqProcedure.prepareStatement();
	var inputParameters = pendingReqProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	 
	pendingReqProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("inputParameters for Query", inputParameters);
	pendingReqProcedure.setParameters(inputParameters);

	//var dataSet = pendingReqProcedure.queryProcedure();
	var dataSet = getRecordsArray(emseParameters);
		
	if (dataSet != false || dataSet.length > 0) 
	for (var i in dataSet) {
		ObjKeyRename(dataSet[i], {"B1_PER_ID1":"id1"});
		ObjKeyRename(dataSet[i], {"B1_PER_ID2":"id2"});
		ObjKeyRename(dataSet[i], {"B1_PER_ID3":"id3"});
		ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
		ObjKeyRename(dataSet[i], {"B1_CON_ISS_DD":"conIssDate"});
		var queryResult = dataSet[i];

	//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){
		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}

		aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" + " Condition expiration date:" + queryResult.conIssDate);

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
		capCount++;
	
		// Add comment to work-flow task to Requirements not met
		var taskName = "Intake";
		var updateTaskStatus = "Additional Information Needed";
		ELPLogging.debug("Updating Task: Task Name = " + taskName + " task Status = " + updateTaskStatus);
		updateTask(taskName, updateTaskStatus, "Application expired due to pending requirement", "Application expired due to pending requirement", "", capId);
				
		cap.setCapStatus("Closed");
		aa.cap.updateAppWithModel(cap);
		ELPLogging.debug("Updated the Cap Status to Closed for " + altId);
		
	} // end for loop over the Oracle Data set returned.


	logDebugAndEmail("Total Licenses Processed: " + capCount);
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (pendingReqProcedure != null) {
		pendingReqProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_CLOSE_REQUIREMENT_PENDING completed with no errors.");					
		}
	}

	aa.print(ELPLogging.toString());
}


if (emailAddress && emailAddress != "" && emailAddress.length > 0 ) {
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

function getRecordsArray(emseParameters){
	var sql = 
			"SELECT B.serv_prov_code, \
			       B.b1_per_id1, \
			       B.b1_per_id2, \
			       B.b1_per_id3, \
			       b.b1_alt_id, \
			       B.b1_appl_status,\
			       Add_months(c.b1_con_iss_dd, 6) AS B1_CON_ISS_DD \
			FROM   b1permit b \
			       LEFT JOIN b6condit c \
			              ON b.b1_per_id1 = c.b1_per_id1 \
			                 AND b.b1_per_id2 = c.b1_per_id2 \
			                 AND b.b1_per_id3 = c.b1_per_id3 \
			                 AND b.serv_prov_code = c.serv_prov_code \
			                 AND b.b1_appl_status NOT IN ( 'Ready for Printing', 'Closed', \
			                                               'Printed' ) \
			                 AND b.rec_status = 'A' \
			WHERE  c.b1_con_des = 'Application on Hold Pending Requirement' \
			       AND c.serv_prov_code = 'DPL' \
			       AND Add_months(c.b1_con_iss_dd, 6) <= sysdate \
			ORDER  BY c.b1_con_des ASC";   

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