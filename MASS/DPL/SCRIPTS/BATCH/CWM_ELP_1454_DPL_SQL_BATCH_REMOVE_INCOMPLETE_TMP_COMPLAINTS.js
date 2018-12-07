/* ------------------------------------------------------------------------------------------------------ /
 | Program : CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints Trigger : Batch
 |
 | - Identifies incomplete complaint records that are a defined set of days past creation date 
 | - These incomplete complaints will be removed.
 | 
 | Batch Requirements :
 | - None
 | Batch Options:
 | - NO PARAMS - Default daysToPurge = 90
 | - daysToPurge - Number of days past creation date (TMP Records)
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
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var deletedTMPCapCount = 0;
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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "INCOMPLETE COMPLAINT TMP"); // This email will be set by standard choice

if (emailAddress == null || emailAddress == "") {
    emailAddress = "david.uch@accenture.com";
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");
}
var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

var daysToPurge = lookup("BATCH_PURGE_TEMP", "COMPLAINT");
if(daysToPurge ==null || daysToPurge == "" || daysToPurge == "undefined")
	daysToPurge = 90;
 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryIncompleteComplaintTmp",\
					"procedure":{\
						"name":"ELP_SP_TMP_COMPLAINT_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"tmpComplaint","parameterType":"OUT","property":"TMP_COMPLAINT","type":"STRING"},\
														 {"source":"RESULT","name":"daysSinceLastUpdate","parameterType":"OUT","property":"DAYS_SINCE_LAST_UPDATE","type":"INTEGER"},\
														 {"source":"RESULT","name":"recDate","parameterType":"OUT","property":"REC_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"AGENCY","parameterType":"IN","property":"AGENCY","type":"STRING"},\
														 {"source":"RESULT","name":"DAYSTOPURGE","parameterType":"IN","property":"DAYSTOPURGE","type":"STRING"},\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';
		
var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try
{

	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();
	 
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
	ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);	
	logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);
	
	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/

	var incompleteComplaintProcedure = null;

	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryIncompleteComplaintTmp")
		{
			 var incompleteComplaintProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}

	if (incompleteComplaintProcedure == null)

	{
		var message = "Cannot find procedure queryIncompleteComplaintTmp";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryIncompleteComplaintTmp: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	incompleteComplaintProcedure.prepareStatement();
	var inputParameters = incompleteComplaintProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	
	emseParameters.AGENCY = "DPL";
	emseParameters.DAYSTOPURGE = daysToPurge;

	//incompleteComplaintProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("inputParameters for Query", inputParameters);
	//incompleteComplaintProcedure.setParameters(inputParameters);

	//var dataSet = incompleteComplaintProcedure.queryProcedure();
	var dataSet = getRecordsArray(emseParameters);
	
	for (var i in dataSet)
	//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
	{
		ObjKeyRename(dataSet[i], {"B1_ALT_ID": "customID"});
		ObjKeyRename(dataSet[i], {"B1_PER_ID1": "id1"});
		ObjKeyRename(dataSet[i], {"B1_PER_ID2": "id2"});
		ObjKeyRename(dataSet[i], {"B1_PER_ID3": "id3"});
		ObjKeyRename(dataSet[i], {"REC_DATE": "recDate"});
		ObjKeyRename(dataSet[i], {"DAYS_SINCE_LAST_UPDATE": "daysSinceLastUpdate"});
		queryResult = dataSet[i];

		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}

		//aa.print(queryResult.daysSinceLastUpdate + " " + queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" + " created date:" + queryResult.recDate);

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


		if( queryResult.daysSinceLastUpdate >= daysToPurge )
		{
			var inactivateTMPCapCount = 0;
			ELPLogging.debug(altId + " is " + queryResult.daysSinceLastUpdate + " day past created date");

			var removeCapId = aa.cap.getCapID(queryResult.tmpComplaint).getOutput(); 
			var result = aa.cap.removeRecord(removeCapId).getSuccess();
			if(result){
				ELPLogging.debug("Successfully deleted TMP complaint " + queryResult.tmpComplaint + " " + result);			
				deletedTMPCapCount++;	
			}
			else{
				ELPLogging.debug("Failed to remove " + altId);
			}
			if( cap.getCapModel().getAuditStatus() == "A")
			{
				cap.getCapModel().setAuditStatus("I");
				aa.cap.editCapByPK(cap.getCapModel());
				inactivateTMPCapCount++;
			}
		}				
				
	} // end for loop over the Oracle Data set returned.

	logDebugAndEmail("Total TMP Complaints past purge date: " + capCount);
	logDebugAndEmail("Deleted TMP Renewals: " + deletedTMPCapCount);	
    logDebugAndEmail("Inactivated TMP Applications: " + inactivateTMPCapCount);	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}


	if (incompleteComplaintProcedure != null) {
		incompleteComplaintProcedure.close();


	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) {
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "CWM_ELP_1454_DPL_SQL_Batch_Remove_Incomplete_TMP_Complaints completed with no errors.");					
		}
	}

	aa.print(ELPLogging.toString());
}


if (emailAddress.length > 0 ) {
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
	var sql = "SELECT SERV_PROV_CODE, B1_PER_ID1, B1_ALT_ID, B1_PER_ID2, B1_PER_ID3, B1_PER_GROUP, B1_PER_TYPE, B1_PER_SUB_TYPE, B1_PER_CATEGORY, REC_DATE, B1_ALT_ID \
as TMP_COMPLAINT , FLOOR(TRUNC(SYSDATE)- REC_DATE) AS DAYS_SINCE_LAST_UPDATE \
FROM b1permit \
where serv_prov_code = 'DPL' \
AND b1_per_group = 'Enforce' \
AND b1_per_type = 'Investigation' \
AND b1_per_sub_type = 'Intake' \
and rec_status = 'A' \
AND b1_appl_class like '%INCOMPLETE%' \
AND FLOOR(TRUNC(SYSDATE)- REC_DATE) > '" + emseParameters.DAYSTOPURGE + "'";
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

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	return ret;
}