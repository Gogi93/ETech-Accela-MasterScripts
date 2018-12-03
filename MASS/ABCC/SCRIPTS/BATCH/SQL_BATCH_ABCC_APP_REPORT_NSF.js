/* ------------------------------------------------------------------------------------------------------ /
 |Created this Batch As a Part of CR 205, According to the ABCC Deficiency Weekly Reminder Script Specification for Application Records.
 |
 |	Program : SQL_BATCH_ABCC_APP_REPORT_NSF Trigger : Batch
 |
 | Check if Record status is "Additional Information Needed" on NSF Workflow Task
 |	Find the workflow task that has a status of "Additional Information Needed"
 |	- If Due Date is greater than current date, email the Deficiency Letter. Set Due Date to 45 days past the current date. Set Status Date to current date.
 |	- If Due Date is less than current date, deactivate the current task and activate the "Refund" task with a default status of "Refund Required" and set workflow comments to "No Response Received". 
 | 
 | 	
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0;

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
		eval(getScriptText("INCLUDES_DATA_LOAD")); 
		eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

showDebug = true;
showMessage = false;
var maxSeconds = 3600;
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




/* *
 * User Parameters  Begin
 * */
try{
var staticParamObj = '{\
		"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryAddInfoApplication",\
					"procedure":{\
						"name":"ELP_SP_ADDINF_INT_ACCELA_NSF",\
						"resultSet":{"list":[\
							{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAPID","type":"STRING"},\
							{"source":"RESULT","name":"servProvCode","parameterType":"OUT","property":"SERV_PROV_CODE","type":"STRING"},\
							{"source":"RESULT","name":"altID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
							{"source":"RESULT","name":"perID1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
							{"source":"RESULT","name":"perID2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
							{"source":"RESULT","name":"perID3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
							{"source":"RESULT","name":"group","parameterType":"OUT","property":"B1_PER_GROUP","type":"STRING"},\
							{"source":"RESULT","name":"type","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\
							{"source":"RESULT","name":"subtype","parameterType":"OUT","property":"B1_PER_SUB_TYPE","type":"STRING"},\
							{"source":"RESULT","name":"category","parameterType":"OUT","property":"B1_PER_CATEGORY","type":"STRING"},\
							{"source":"RESULT","name":"appStatus","parameterType":"OUT","property":"B1_APPL_STATUS","type":"STRING"},\
							{"source":"RESULT","name":"appAlias","parameterType":"OUT","property":"B1_APP_TYPE_ALIAS","type":"STRING"},\
							{"source":"RESULT","name":"recDate","parameterType":"OUT","property":"REC_DATE","type":"DATE"},\
							{"source":"RESULT","name":"statDate","parameterType":"OUT","property":"STAT_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
							{"source":"RESULT","name":"SP_CURSOR","parameterType":"OUT","property":"SP_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

  var stagingConfiguration = datatypeHelper.loadObjectFromParameter(staticParamObj);
				
  var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
  if (dbConfiguration) {
    this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
    ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
    aa.print("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);


    // Create a connection to the Staging Table Database

    var dbConn = DBUtils.connectDB(stagingConfiguration.connectionInfo);				
		}

}
catch(ex)
    {
        returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
        ELPLogging.fatal(returnException.toString());
        throw returnException;
    }
			
		
try
{

	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var addInfoApplicationProcedure = null;
	var staticParameters = {} ;
	var dynamicParamObj = {} ;
	var batchAppResultObj = {};
	var emseParameters = {};
	//retrieve mapping stored procedure
	for(var x = 0; x < stagingConfiguration.supplemental.length; x++)
	{
		var supplementalConfig = stagingConfiguration.supplemental[x];
		if(supplementalConfig.tag == "queryAddInfoApplication")
		{
			var queryProcedure = new StoredProcedure(supplementalConfig.procedure,dbConn);
		}
		
			
	}
	if(queryProcedure)
	{
		//queryProcedure.prepareStatement();
		//var inputParameters = queryProcedure.prepareParameters(staticParamObj,dynamicParamObj,batchAppResultObj);
		//queryProcedure.setParameters(inputParameters);
		//Query for fetching the records from the view	
		//var dataSetStg = queryProcedure.queryProcedure();
		//queryProcedure.close();
		//var queryForDBFields = "" ;
		//while(queryForDBFields = dataSetStg.next())
		var dataSetStg = getRecordsArray(emseParameters,dbConn);	
        aa.print("dataSetStg: " +dataSetStg);		
		var queryForDBFields = "" ;		
	    for (var i in dataSetStg) 	
		{
			aa.print("dataSetStg.length: " +dataSetStg.length);	
		    ObjKeyRename(dataSetStg[i], {"B1_ALT_ID":"altID"});
		    ObjKeyRename(dataSetStg[i], {"REC_DATE":"recDate"});
		    ObjKeyRename(dataSetStg[i], {"STAT_DATE":"statDate"});
		    var queryForDBFields = dataSetStg[i];
		    aa.print("queryForDBFields: " +queryForDBFields);
			var AddInfoAppReqDate = queryForDBFields.recDate;
			var StatusDate = queryForDBFields.statDate;
			
			var duedate = new Date(AddInfoAppReqDate);
			var taskStatusDate = new Date(StatusDate);			
			var sysDate = new Date();
			
			aa.print("date: " + duedate + "sysDate: " + sysDate + " statusDate" + taskStatusDate);
			var diffDays = parseInt(( duedate - sysDate) / (1000 * 60 * 60 * 24));
			var multipleCnt = parseInt(( taskStatusDate - sysDate) / (1000 * 60 * 60 * 24));
			var getAltID = queryForDBFields.altID;
			aa.print("For Record ID = " + getAltID);
			aa.print("No. of Day's since Additional Information Needed Status was set = " + diffDays +" == " +multipleCnt);
			//If the current date a multiple of 7 (days) after the Status Date then email the Deficiency Letter.
			if(diffDays >= 0 && diffDays < 45){  //if(diffDays < 45){
				if(((multipleCnt + 1) % 7 == 0)){
				var getAltID = queryForDBFields.altID;
				aa.print("getAltID" + getAltID);
				var capId = aa.cap.getCapID(getAltID).getOutput();
				aa.print("capId :  " + capId);
				aa.print("Email has been sent");
				CWM_ELP_WTUA_Email_Application_Deficiency_Letter(capId);	
				}
			}
			
			else{
			//If the Status Date has exceeded 45 days from the day it was set, then advance the Workflow to "Refund" and updated the Application Status to Refund Required.  
				var getAltID = queryForDBFields.altID;
				aa.print("Record ID is " + getAltID);
				var capId = aa.cap.getCapID(getAltID).getOutput();
				var tasks = aa.workflow.getTaskItemByCapID(capId, null).getOutput();
				var userId = currentUserID;
				var systemUserObjResult = aa.person.getUser(userId.toUpperCase());
				if (systemUserObjResult.getSuccess()) 
					var systemUserObj = systemUserObjResult.getOutput();
				//Check which Workflow Task has a status of "Additional Information Needed."
				for (i in tasks){
				aa.print("Task : " + tasks[i].getTaskDescription() + " has a status : " + tasks[i].getDisposition() + " And it has exceeded 45 days.");
				if(tasks[i].getDisposition() == "Additional Information Needed")
					break;
				}
				var taskName = tasks[i].getTaskDescription();
				aa.print("task =" + taskName);
				deactivateTask(taskName);
				activateTask("Refund");
				var updateStatusResult = aa.cap.updateAppStatus(capId, "APPLICATION", "Refund Required", aa.date.getScriptDateTime(new Date()), "", systemUserObj);
				if (updateStatusResult.getSuccess())
					aa.print("Updated application status to Refund Required successfully.");
				else
					aa.print("**ERROR: application status update to Refund Required was unsuccessful.  The reason is " + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());

				updateTask("Refund", "Refund Required", "No Response Received", "No Response Received");
					
			}
		}
	}

	
}
catch(ex)
{
	aa.print("Error : "+ex.message);
	returnException = new ELPAccelaEMSEException("Error Parsing input parameters to JSON Objects " + ex.message, ScriptReturnCodes.INPUT_PARAMETERS);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

//SW ADDED Helper functions
function getRecordsArray(emseParameters, databaseConnection){
var sql = "SELECT PERMIT.SERV_PROV_CODE, \
  (PERMIT.B1_PER_ID1 \
  || '-' \
  || PERMIT.B1_PER_ID2 \
  || '-' \
  || PERMIT.B1_PER_ID3) CAPID, \
  PERMIT.B1_ALT_ID, \
  PERMIT.B1_PER_ID1, \
  PERMIT.B1_PER_ID2, \
  PERMIT.B1_PER_ID3, \
  PERMIT.B1_PER_GROUP, \
  PERMIT.B1_PER_TYPE, \
  PERMIT.B1_PER_SUB_TYPE, \
  PERMIT. B1_PER_CATEGORY, \
  PERMIT.B1_APPL_STATUS, \
  PERMIT.B1_APP_TYPE_ALIAS, \
  MAXSTATUSHISTORY.DATE_DUE REC_DATE, \
  MAXSTATUSHISTORY.DATE_STATUS STAT_DATE \
FROM B1PERMIT PERMIT \
RIGHT JOIN V_WORKFLOW MAXSTATUSHISTORY \
ON PERMIT.B1_ALT_ID          = MAXSTATUSHISTORY.RECORD_ID \
WHERE PERMIT.B1_PER_CATEGORY        = 'Application' \
AND PERMIT.SERV_PROV_CODE           = 'ABCC' \
AND PERMIT.B1_APPL_CLASS            = 'COMPLETE' \
AND MAXSTATUSHISTORY.STATUS         = 'Additional Information Needed' \
AND MAXSTATUSHISTORY.TASK = 'NSF'";

	
			aa.print(sql);

			var arr = doSQL(sql,databaseConnection);
			aa.print("arr: " +arr);
			return arr;
}

function doSQL(sql,databaseConnection) {

	try {
		var array1 = [];
		var dbConn = databaseConnection;
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		 aa.print("conn: " +conn);
		var sStmt = dbConn.prepareStatement(sql);
		 aa.print("sql: " +sql);
      
		//if (sql.toUpperCase().indexOf("SELECT") == 0) {
			  aa.print("sStmt: " +sStmt);
			var rSet = sStmt.executeQuery();
			 aa.print("rSet: " +rSet);
			while (rSet.next()) {
				var obj = {};
				var md = rSet.getMetaData();
				var columns = md.getColumnCount();
				for (i = 1; i <= columns; i++) {
					obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
				}
				obj.count = rSet.getRow();
				 aa.print("obj.count: " +obj.count);
				 aa.print("rSet.getRow(): " +rSet.getRow());
				 array1.push(obj);
			}
			rSet.close();
			sStmt.close();
			conn.close();
			return array1;
		//}
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

