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
var condAddedCount = 0;
var emailText = "";

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
}
catch (ex)
{
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

var emailAddress = lookup("BATCH_STATUS_EMAIL", "PENDING EXAM"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryPendingExam",\
					"procedure":{\
						"name":"ELP_SP_PENDING_EXAM_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"LICENSE_GRP","parameterType":"IN","property":"LICENSE_GRP","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_SUBTYPE","parameterType":"IN","property":"LICENSE_SUBTYPE","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_CATEGORY","parameterType":"IN","property":"LICENSE_CATEGORY","type":"STRING"},\
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

	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var pendingExamProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryPendingExam")
		{
			 var pendingExamProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (pendingExamProcedure == null)
	{
		var message = "Cannot find procedure queryPendingExam";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryPendingExam: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	pendingExamProcedure.prepareStatement();
	var inputParameters = pendingExamProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};

	emseParameters.LICENSE_GRP = group;	
	emseParameters.LICENSE_TYPE = recordType;
	emseParameters.LICENSE_SUBTYPE = recordSubType;
	emseParameters.LICENSE_CATEGORY = recordCategory;
	
	//pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("InputParameters for Query", inputParameters);
	//pendingExamProcedure.setParameters(inputParameters);

	//var dataSet = pendingExamProcedure.queryProcedure();
	var dataSet = getRecordsArray(emseParameters);

	var capList="";

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
		try
		{
			ELPLogging.debug("queryResult.customID = "+queryResult.customID);
			var capIdResult = aa.cap.getCapID(String(queryResult.customID));
		}
		catch(ex)
		{
			ELPLogging.debug("Record ID not found for : " +queryResult.customID);
			ELPLogging.debug("** Error : "+ex.message);
		}
			if ( !capIdResult.getSuccess())
			{
				logDebug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}
		try
		{
			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();
		}
		catch(ex)
		{
			ELPLogging.debug("Record ID not found for1 : " +queryResult.customID);
			ELPLogging.debug("** Error1 : "+ex.message);
		
		}	
			

		var capResult = aa.cap.getCap(capId);
		if ( ! capResult.getSuccess())
		{
			logDebug("getCap error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var cap = capResult.getOutput();
		var altId = capId.getCustomID();
		var capStatus = cap.getCapStatus();
		ELPLogging.debug("capStatus = "+capStatus);
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString();
		var appTypeArray = appTypeString.split("/");
		var board = appTypeArray[1];

		var oneDay = 24*60*60*1000;
		var duration = lookup("PENDING EXAM STATUS DURATION", "duration");
		ELPLogging.debug("Duration: " + duration);
			
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
				var taskDate = fTask.getStatusDate();
				var activeFlag = fTask.getActiveFlag();
				//ELPLogging.debug("RecordId:"+ capId.getCustomID() + " DESC: " + desc+ " DISP: " + disp +" TaskDate: "+ taskDate);
				
				//Check for Task = "Exam" and Status = "Pending Exam"
				if(desc == wTask && disp == wStatus && activeFlag == "Y" && capStatus == "Pending Exam") 
				{
					ELPLogging.debug("WF Task and STATUS matched.");
					var taskDate = fTask.getStatusDate();
					var newDate = new Date();
					var condition=0;
					
					if(taskDate)
					{
						condition = Math.round(Math.abs((newDate.getTime() - taskDate.getTime())/(oneDay)));
						logDebug("Record ID: " + altId + " has active task: " + wTask + " with task status: "+ wStatus );
						ELPLogging.debug("Record ID: " + altId + " has active task: " + wTask + " with task status: "+ wStatus );						 
						capCount++;
					}
									
					//Check the duration for which the condition needs to be added
					ELPLogging.debug("Condition = "+condition+" = "+" duration = "+duration);
					if(condition > duration)
					{
						logDebug("Record ID qualified: " + altId);
						logDebug("Days in " + wStatus + " status: " + condition);
						
						//Add Condition
						aa.capCondition.addCapCondition(capId, "Notice", "Pending Exam Exceeds Time Limit", altId, null, null, null, null, null, "", null, null, "", "", "A");
						logDebug("Condition Added to " + altId );
						ELPLogging.debug("Condition Added to " + altId );
						condAddedCount++;
						//create a string list of records that have a pending exam > 160 days
						capList += br + altId;
					}
				}
			}		
		}
		
		
	} // end for loop over the Oracle Data set returned.
	
  	//The following records have been pending exam for more than 160 days
	//emailText = emailText + "Total CAPS with active task '" + wTask + "' and task status '"+ wStatus + "': "+ capCount + br;
	//emailText = emailText + "Total CAPS updated with Notice condition (Pending Exam Exceeds Time Limit): " + condAddedCount + br;
	emailText = emailText + "The following records have been pending exam for more than 160 days:"+ br + capList;
	ELPLogging.debug("Total CAPS with active task '" + wTask + "' and task status '"+ wStatus + "': "+ capCount);	 
	ELPLogging.debug("Total CAPS updated with Notice condition (Pending Exam Exceeds Time Limit): " + condAddedCount);
	ELPLogging.debug("Process Completed.");
	
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_PENDING_EXAM" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_PENDING_EXAM. " + ex.message);
   
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
	if (pendingExamProcedure != null) {
		pendingExamProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors." + br;
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_PENDING_EXAM completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_PENDING_EXAM completed with no errors.");				
			// We do not need  additional EMSE specific message in the Email
			//emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_PENDING_EXAM completed with no errors." + br;
		}
	}
	
	if (emailAddress && emailAddress != "" && emailAddress.length > 0 ) 
	{
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	}
	else 
	{
		aa.print("Email not sent. Standard Choice lookup failed or not found.");
	}
	
	aa.print(ELPLogging.toString());
}

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Internal Functions and Classes (Used by this script)
 / ------------------------------------------------------------------------------------------------------ */
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
			"select B1_PER_ID1, B1_PER_ID2, B1_PER_ID3, B1_ALT_ID from B1PERMIT \
		      where SERV_PROV_CODE = 'DPL' \
		      and B1_PER_GROUP = '" +emseParameters.LICENSE_GRP+"' \
		      and B1_PER_TYPE = '" +emseParameters.LICENSE_TYPE+"' \
		      and B1_PER_SUB_TYPE = '" +emseParameters.LICENSE_SUBTYPE+"' \
		      and B1_PER_CATEGORY = '" +emseParameters.LICENSE_CATEGORY+"' \
		      and REC_STATUS = 'A'";

			
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