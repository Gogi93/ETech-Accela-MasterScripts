/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_CLOSE_ADJ_LICREVOKED_SUSPENSIONENDS_WARNING
* @Author		:	Sagar Cheke
* @Date			:	04/21/2016
* @Description 	:	IF Close the Adjudication Record when one of the following occurs:
					1. Disposition Type is set to 'Warning' AND
					2. Warning ASI is set to 'Yes' OR

					3. Disposition Type is set to 'Revocation OR
					4. Revocation Start Date is not NULL AND

					5. Disposition Type is set to 'Suspension' AND
					6. Suspension End Date is equal to the current date AND

					7. Disposition Type 'Suspension Held in Abeyance' does not exist ELSE
					8. Suspension Held in Abeyance End Date is equal to the current date
					THEN
					1. Set the Decision Action task status to 'Decision Action Complete'
					2. Close the Adjudication Record workflow
***********************************************************************************************************************************/
try 
{
	var SCRIPT_VERSION = 3.0;
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));        
	eval(getScriptText("INCLUDES_CUSTOM"));		
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
        eval(getScriptText("INCLUDES_BATCH"));
	eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
	eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
	eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
	eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
	eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
	eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
	eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
	ELPLogging.debug("Finished loading the external scripts.");

}
catch (ex)
{
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

showDebug = 3;
showMessage = false;
var maxSeconds = 60 * 60 * 2;
var br = "<br>";

var sysDate = aa.date.getCurrentDate();
var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();

var batchJobID = aa.batchJob.getJobID().getOutput();
aa.print(batchJobID);
var batchJobName = "" + aa.env.getValue("BatchJobName");
// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer
var timeExpired = false;
// Email address of the sender
var senderEmailAddr = "noreply@dpl.state.ma.us";

var capCount = 0;
var renewalCapCount = 0;
var existRenewalCount = 0;
var condCapCount = 0;
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info

var dispositionTypeArray = ["Approved","Disapproved","Warning","Cancellation","Modification","Decision Remanded to LLA","25E Case Dismissed","25E Case Memorandum","Other"];


var emailText = "";
var publicUser = "";

var emailAddress = lookup("BATCH_STATUS_EMAIL", "LICREVOKED SUSPENSIONENDS WARNING"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

ELPLogging.debug("Current user ID:" + currentUserID);

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryAdjRecords",\
					"procedure":{\
						"name":"ELP_SP_ADJUDICATION_REC_ABCC",\
						"resultSet":{"list":[\
												{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAP_ID","type":"STRING"},\
												{"source":"RESULT","name":"altID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
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
		var pendingExamProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryAdjRecords")
			{
				 var pendingExamProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (pendingExamProcedure == null)
		{
			var message = "Cannot find procedure ELP_SP_ADJUDICATION_REC_ABCC";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryAdjRecords : " + supplementalConfiguration.procedure.name);
		
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		pendingExamProcedure.prepareStatement();
		var inputParameters = pendingExamProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		//pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//pendingExamProcedure.setParameters(inputParameters);

		//var dataSet = pendingExamProcedure.queryProcedure();
		
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
		var dataSet = getRecordsArray(emseParameters,databaseConnection);
	    aa.print("dataSet.length: " +dataSet.length);
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) 
		{
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"altID"});
			//aa.print("My Test>> "+queryResult.customID);
			var queryResult = dataSet[i];
			var capID = aa.cap.getCapID(queryResult.altID).getOutput();
			var scanner = new Scanner(capID.toString(), "-");
			var ID1 = scanner.next();
			var ID2 = scanner.next();
			var ID3 = scanner.next();

			var capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();	
			aa.print("My Test>> "+queryResult.altID);
			try
			{
				var ASIDetailsArray = getASIDetailsForAdj(capId);
			
				if(((ASIDetailsArray.dispType == "Warning") && (ASIDetailsArray.ASI == "Yes")) || ((ASIDetailsArray.dispType == "Revocation") && (ASIDetailsArray.ASI != null)) || ((ASIDetailsArray.dispType == "Suspension") && (ASIDetailsArray.ASI == "0")) || ((ASIDetailsArray.dispType == "Suspension Held in Abeyance") && (ASIDetailsArray.ASI == "0")))
				{
					aa.print("Processing record ID : "+capId);
					activateTask("Decision Action");
					updateTask("Decision Action", "Decision Action Complete", "Updated via script.", "Updated via script.");
					deactivateTask("Decision Action");
					//Close the Adjudication Record
					updateAppStatus("Close", "Updated via script", capId);
				}
			}
			catch(err)
			{
				aa.print("**ERROR : "+err.message);
				
			}
			
		}
	}
}
catch (ex)
{
   aa.print("Exception caught: " + ex.message);   
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED" + ex.message);
   aa.print("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   aa.print("EMSEReturnMessage: " + "Error executing SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
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
	if (pendingExamProcedure != null) 
	{
		//pendingExamProcedure.close();
	}
	if (databaseConnection != null) 
	{
		//databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) 
	{
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		aa.print("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
			
		if (ELPLogging.getErrorCount() > 0) 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED completed with " + ELPLogging.getErrorCount() + " errors.");
		}
		else 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED completed with no errors.");					
		}
	}

	//aa.print(ELPLogging.toString());
}

/**
 * @desc This method will check that ABCC Appeal task is not active.
 * @param {capId} contains record ID.
 * @returns {Boolean} - isNotActive value
 */
function isABCCAppealNotActive(capId)
{
	var isNotActive = false;
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
		
	for (i in wfObj)
	{
		var fTask = wfObj[i];
		var activeFlag =  fTask.getActiveFlag();
		var desc =  fTask.getTaskDescription();
		var disposition = fTask.getDisposition();
		
		if((desc == "ABCC Appeal" ) && (activeFlag == "N") )
		{
			isNotActive = true;
		}
	}
	return isNotActive;
}

/**
 * @desc This method will retrieve decision task status date.
 * @param {capId} contains record ID.
 * @returns {statusDate} - statusDate value
 */
function retrieveStatusDateOfDecisionTask(capId)
{
	//Decision task was set to "Decision Issued"
	var statusDate = new Date();
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
		
	for (i in wfObj)
	{
		var fTask = wfObj[i];
		var activeFlag =  fTask.getActiveFlag();
		var desc =  fTask.getTaskDescription();
		var disposition = fTask.getDisposition();
		
		if(desc == "Decision" && disposition == "Decision Issued")
		{
			statusDate = fTask.getStatusDate();
		}
	}
	return statusDate;
}

/**
 * @desc This method retrieves record ASI details.
 * @param {capId} Cap ID - contains record ID.
 */
function getASIDetailsForAdj(capIDModel)
{
	//Local variable declaration
	var ASI = "";
	var dispType ="";
	var ASIDetailsArray = new Array();
	
	//This API retrieves ASI details on the record
	var asiDetailResult = aa.appSpecificInfo.getByCapID(capIDModel); 

	if(asiDetailResult.getSuccess())
	{
		var asiDetailsModel = asiDetailResult.getOutput();
		if(asiDetailsModel)
		{
			for(ASI in asiDetailsModel)
			{
				if(asiDetailsModel[ASI].getFieldLabel() == "Disposition Type")
				{
					var checklistComment = asiDetailsModel[ASI].getChecklistComment();
					
					if(checklistComment == "Warning")
					{
						dispType = "Warning"; 
						ASI = getASIvalue(capIDModel, dispType);
						ASIDetailsArray["dispType"] = dispType;
						ASIDetailsArray["ASI"] = ASI;
					}
					else if(checklistComment == "Revocation")
					{
						dispType = "Revocation";
						ASI = getASIvalue(capIDModel, dispType);
						ASIDetailsArray["dispType"] = dispType;
						ASIDetailsArray["ASI"] = ASI;
					}
					else if(checklistComment == "Suspension")
					{
						dispType = "Suspension";
						ASI = getASIvalue(capIDModel, dispType);
						ASIDetailsArray["dispType"] = dispType;
						ASIDetailsArray["ASI"] = ASI;
					}
					else if(checklistComment == "Suspension Held in Abeyance")
					{
						dispType = "Suspension Held in Abeyance";
						ASI = getASIvalue(capIDModel, dispType);
						ASIDetailsArray["dispType"] = dispType;
						ASIDetailsArray["ASI"] = ASI;
					}
				}				
			}
		}	
	}
	
	
	return ASIDetailsArray;
}

function getASIvalue(capIDModel, dispType)
{
	var ASIValue="";
	
	//This API retrieves ASI details on the record
	var asiDetailResult = aa.appSpecificInfo.getByCapID(capIDModel); 
	if(asiDetailResult.getSuccess())
	{
		var asiDetailsModel = asiDetailResult.getOutput();
		for(ASI in asiDetailsModel)
		{
			if((asiDetailsModel[ASI].getFieldLabel() == "Warning") && (dispType == "Warning"))
			{
				ASIValue = asiDetailsModel[ASI].getChecklistComment();
			}
			else if ((asiDetailsModel[ASI].getFieldLabel() == "Revocation Start Date") && (dispType == "Revocation"))
			{
				ASIValue = asiDetailsModel[ASI].getChecklistComment();
			}
			else if ((asiDetailsModel[ASI].getFieldLabel() == "Suspension End Date") && (dispType == "Suspension"))
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValue = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);	
				}
			}
			else if ((asiDetailsModel[ASI].getFieldLabel() == "Suspension Held in Abeyance End Date") && (dispType == "Suspension Held in Abeyance"))
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValue = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);
				}
			}
		}
	}
	
	return ASIValue;
}

/**
 * @desc This method format current date to MM/dd/YYYY.
 */
function formatCurrentDate()
{
	var dateObj = new Date();
	var mth = "";
	var day = "";
	var ret = "";
	if (dateObj == null) {
		return "";
	}
	if (dateObj.getMonth() >= 9) {
		mth = "" + (dateObj.getMonth()+1);
	} else {
		mth = "0" + (dateObj.getMonth()+1);
	}
	if (dateObj.getDate() > 9) {
		day = dateObj.getDate().toString();
	} else {
		day = "0"+dateObj.getDate().toString();
	}
		
	return aa.util.parseDate(""+mth+"/"+day+"/"+dateObj.getFullYear().toString())
}


function logDebugAndEmail( debugText )
{
	emailText = emailText + debugText + br;
	aa.print(debugText);
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
   var ret = "" + aa.env.getValue(pParamName);
   aa.print("PARAMETER " + pParamName + " = " + ret);
   return ret;
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function getScriptText(vScriptName) 
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";
}

//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection)
{
	       	var sql = "SELECT PERMIT.SERV_PROV_CODE, \
           CONCAT(CONCAT(CONCAT(CONCAT(PERMIT.B1_PER_ID1, '-'), PERMIT.B1_PER_ID2),'-'),PERMIT.B1_PER_ID3) AS CAP_ID, \
           PERMIT.B1_ALT_ID , \
		   PERMIT.B1_PER_GROUP , \
		   PERMIT.B1_PER_TYPE , \
           PERMIT.B1_PER_SUB_TYPE , \
		   PERMIT.B1_PER_CATEGORY , \
		   PERMIT.B1_APPL_STATUS \
           FROM ACCELA.B1PERMIT PERMIT \
		    WHERE PERMIT.SERV_PROV_CODE = 'ABCC' \
           AND PERMIT.B1_PER_GROUP = 'Enforce' AND PERMIT.B1_PER_TYPE = 'Adjudication' \
           and PERMIT.B1_PER_SUB_TYPE = 'NA' \
           and PERMIT.B1_PER_CATEGORY = 'NA' \
           order by PERMIT.rec_date desc";
			
			aa.print(sql);

			var arr = doSQL(sql,databaseConnection);
			return arr;
}

function doSQL(sql,databaseConnection) {

	try {
		var array = [];
		var dbConn = databaseConnection;
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sStmt = dbConn.prepareStatement(sql);

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
