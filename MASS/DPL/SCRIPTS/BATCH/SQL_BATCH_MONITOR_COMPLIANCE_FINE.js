// JavaScript Document
var SCRIPT_VERSION = 2.0

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

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
var fvCountFine = 0;
var AInfo = new Array(); //Used to collect ASI info
	
var emailText = "";
var publicUser = "";

// you can get rid of the ELPLogging debug
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
		logDebug("Finished loading the external scripts");
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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "COMPLIANCE FINE"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryCompliance",\
					"procedure":{\
						"name":"ELP_SP_MONITOR_COMPL_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';


// you can get rid of the ELPLogging debug
try
{
	 	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS_UNCOMPRESSED"));
		eval(getScriptText("INCLUDES_BATCH"));
		eval(getScriptText("INCLUDES_CUSTOM"));		
		eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
		eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
		var returnException;
		showDebug = true;
		logDebug("Finished loading the external scripts");
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try
{

	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();
	 
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
	ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);

	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var complianceProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryCompliance")
		{
			 var complianceProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (complianceProcedure == null)
	{
		var message = "Cannot find procedure queryCompliance";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryCompliance: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	complianceProcedure.prepareStatement();
	var inputParameters = complianceProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};

	//complianceProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("inputParameters for Query", inputParameters);
	//complianceProcedure.setParameters(inputParameters);

	//var dataSet = complianceProcedure.queryProcedure();
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
			emailText = emailText +  "WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed." + br;
			timeExpired = true;
			sendBatchTimeoutEmail() ;
			break;
		}

		aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")");
		capIdResult = aa.cap.getCapID(queryResult.customID);
		if ( ! capIdResult.getSuccess())
		{
			logDebug("getCapID error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var capId = capIdResult.getOutput();
		capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

		var capResult = aa.cap.getCap(capId);
		if ( ! capResult.getSuccess())
		{
			logDebug("getCap error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var cap = capResult.getOutput();
		var altId = capId.getCustomID();
		var capStatus = cap.getCapStatus();
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString();
		var appTypeArray = appTypeString.split("/");
		var board = appTypeArray[1];
		capCount++

		useAppSpecificGroupName = true;
		var fvCompDate = getAppSpecific("CIVIL ADMINISTRATIVE PENALTY.Compliance Achieved Date",capId);
		if (fvCompDate != null && fvCompDate != "" & fvCompDate != undefined)
		{
			logDebug("Compliance is achieved for this CAP. Skipping.....");
			continue;
		}
		var fvSysDate = new Date();
		var fvResultDate = getAddDate(fvSysDate,-1);
		var fvResult = checkCompliance(capId,fvResultDate);
		if (fvResult)
		{
			logDebug(altId + " CAP has 'Fine Payment' 1 Day overdue.");
			ELPLogging.debug(altId + " CAP has 'Fine Payment' 1 Day overdue.");
			fvCountFine++;
			updateTask("Monitor", "Follow Up Required", "Fine Payment Due", "Fine Payment Due", "DPL_COMPLIANCE", capId);
		}
		
	} // end for loop over the Oracle Data set returned.
  
	emailText = emailText + "Total Compliance CAPS with active Monitor tasks: " + capCount + br;
	emailText = emailText + "Total CAPS with 'Fine Payment Due' Overdue: " + fvCountFine + br;
	ELPLogging.debug("Total Compliance CAPS with active Monitor tasks: " + capCount);	 
	ELPLogging.debug("Total CAPS with 'Fine Payment Due' Overdue: " + fvCountFine);
	ELPLogging.debug("Process Completed.");
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_MONITOR_COMPLIANCE_FINE" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_MONITOR_COMPLIANCE_FINE. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (complianceProcedure != null) {
		complianceProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with " + ELPLogging.getErrorCount() + " errors." + br;
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with no errors.");				
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_MONITOR_COMPLIANCE_FINE completed with no errors." + br;
		}
	}

	aa.print(ELPLogging.toString());
}
	

if (emailAddress && emailAddress != "" && emailAddress.length > 0 ) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
}
else 
{
	aa.print("Email not sent. Standard Choice lookup failed or not found.");
}

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Internal Functions and Classes (Used by this script)
 / ------------------------------------------------------------------------------------------------------ */
function getAddDate(ipDate,ipDays)
{
	opDate = ipDate;
	opDate.setDate(opDate.getDate() + ipDays);
	return opDate;
}

function checkCompliance(ipCapID,ipValue)
{
	useAppSpecificGroupName = true;
	var fvVal = getAppSpecific("CIVIL ADMINISTRATIVE PENALTY.Due Date",ipCapID);
	var fvDate = new Date(fvVal);
	if (fvDate.getFullYear() == ipValue.getFullYear() &&
		fvDate.getDate() == ipValue.getDate() &&
		fvDate.getMonth() == ipValue.getMonth())
		return true;
	return false;
}

function getParam(pParamName) // gets parameter value and logs message showing parameter value
{
   var ret = "" + aa.env.getValue(pParamName);
   logDebug("PARAMETER " + pParamName + " = " + ret);
   return ret;
}
function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}


function getRecordsArray(emseParameters){
	var sql = 
			"select\
			   b.SERV_PROV_CODE,\
			   b.B1_PER_ID1,\
			   b.B1_PER_ID2,\
			   b.B1_PER_ID3,\
			   b.B1_PER_GROUP,\
			   b.b1_per_type,\
			   b.b1_per_sub_type,\
			   b.b1_alt_id,\
			   b.B1_APPL_STATUS,\
			   W.TASK,\
			   W.STATUS as TASKSTATUS \
			from\
			   B1PERMIT b \
			   LEFT JOIN\
			      V_WORKFLOW W \
			      ON B.SERV_PROV_CODE = W.AGENCY_ID \
			      AND B.b1_alt_id = W.RECORD_ID \
			where\
			   b.B1_PER_GROUP = 'Enforce' \
			   and b.B1_PER_TYPE = 'Compliance' \
			   and b.B1_PER_SUB_TYPE = 'NA' \
			   and b.B1_PER_CATEGORY = 'NA' \
			   and b.B1_APPL_STATUS in \
			   (\
			      'Under Review',\
			      'Active'\
			   )\
			   and W.TASK = 'Monitor' 	--and W.STATUS = 'Lapsed'\
			   and W.TASK_IS_ACTIVE = 'Y'"; 

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