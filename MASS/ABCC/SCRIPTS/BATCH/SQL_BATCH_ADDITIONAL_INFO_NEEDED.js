/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_ADDITIONAL_INFO_NEEDED
* @Author		:	Sagar Cheke
* @Date			:	04/26/2016
* @Description 	:	IF
					Activate Refund Task - Additional Information Needed
					Activate the Refund Task when the following occurs:
					1. Intake Task set to "Additional Information Needed" OR
					2. Investigation Task set to "Additional Information Needed" OR
					3. Executive Review Task set to "Additional Information Needed" AND
					4. Task Status Due Date is less than Current Date"
					THEN
					1. Activate the Refund Task and set the Task Status to "Refund Required"
					2. Set the Application Status to "Refund Required"

***********************************************************************************************************************************/

try
{
	var SCRIPT_VERSION = 3.0;
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
	eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
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
var capCountWithRefundStatus = 0;
var capCountDeficiencyLetter = 0;

var emailText = "";
var capId ="";
var oneDay = 1000 * 60 * 60 * 24;
var daysFromCurrentDateArray = ["7", "14", "21", "28", "35", "42"];



var emailAddress = lookup("BATCH_STATUS_EMAIL", "ADDITIONAL_INFO_NEEDED"); // This email will be set by standard choice

var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

 var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryRecordsFromView",\
					"procedure":{\
						"name":"ELP_SP_ADDI_INFO_NEEDED_ABCC",\
						"resultSet":{"list":[\
												{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAP_ID","type":"STRING"},\
                                                {"source":"RESULT","name":"type","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\
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
		
		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		var queryRecordsFromView = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryRecordsFromView")
			{
				 var queryRecordsFromView = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (queryRecordsFromView == null)
		{
			var message = "Cannot find procedure ELP_SP_ADDI_INFO_NEEDED_ABCC";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryRecordsFromView : " + supplementalConfiguration.procedure.name);
		
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		queryRecordsFromView.prepareStatement();
		var inputParameters = queryRecordsFromView.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		//queryRecordsFromView.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//queryRecordsFromView.setParameters(inputParameters);

		//var dataSet = queryRecordsFromView.queryProcedure();
		
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
			 aa.print("altID: " +queryResult.altID);
			 evaluateLicenseRecords(queryResult);
		}
		
		emailText = emailText + "Total CAPS with Refund status : "+ capCountWithRefundStatus + br;
		emailText = emailText + "Total CAPS with deficiency letter : " + capCountDeficiencyLetter + br;
		aa.print("Total CAPS with Refund status : "+ capCountWithRefundStatus);	 
		aa.print("Total CAPS with deficiency letter : " + capCountDeficiencyLetter);
		aa.print("Process Completed.");
	}	

}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_LIC_STATUS_UPDATE_ABCC" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_LIC_STATUS_UPDATE_ABCC. " + ex.message);
   
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
	
	if (queryRecordsFromView != null) 
	{
		//queryRecordsFromView.close();
	}
	
	if (databaseConnection != null) 
	{
		//databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) {
		dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);
		
		if (ELPLogging.getErrorCount() > 0) 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors." + br;
		}
		else 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors.");				
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors." + br;
		}
	}
	
	if (emailAddress && emailAddress != "" && emailAddress.length > 0 ) 
	{
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	}
	else 
	{
		aa.print("Batch status email not sent. Standard Choice lookup failed or not found.");
	}
	
	aa.print(ELPLogging.toString());
}


function evaluateLicenseRecords(queryResult)
{
	var capID = aa.cap.getCapID(queryResult.altID).getOutput();
	var scanner = new Scanner(capID.toString(), "-");
	var ID1 = scanner.next();
	var ID2 = scanner.next();
	var ID3 = scanner.next();

	capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
	
	updateRecordDetails(capId);
}

function updateRecordDetails(capId)
{
	aa.print("Update record details for : "+capId);
	var activeTask ="";
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		aa.print("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
		
	for (i in wfObj)
	{
		var fTask = wfObj[i];
		
		var activeFlag =  fTask.getActiveFlag();
		var taskStatus =  fTask.getDisposition();
		var WfTask = fTask.getTaskDescription();
		var taskDueDate = fTask.getDueDate();
		var statusDate =  fTask.getStatusDate();	
		var currentDate = new Date();
		
		if((WfTask == "Intake" && activeFlag == "Y" && taskStatus == "Additional Information Needed") || (WfTask == "Investigation" && activeFlag == "Y" && taskStatus == "Additional Information Needed") || (WfTask == "Executive Review" && activeFlag == "Y" && taskStatus == "Additional Information Needed"))
		{
			/*if(taskDueDate)
			{
				var jstaskDueDate = new Date(taskDueDate.getMonth() + "/" + taskDueDate.getDayOfMonth()+ "/" + taskDueDate.getYear());		
				if(jstaskDueDate <= currentDate)
				{
					capCountWithRefundStatus++;
					deactivateTask(WfTask);
					activateTask("State Refund");
					updateTask("State Refund", "Refund Required", "Updated via script.", "Updated via script.");
					updateAppStatus("Refund Required", "", capId);	
				}
			}*/
			/*After 45 days of the intial selection of the 'ADDITIONAL_INFO_NEEDED' task status, set task 'State Refund' with status 'Refund Required'*/
			var diffDueDays = calculateDateDiff(statusDate, currentDate);
			logDebug("diffDueDays:" + diffDueDays);
			if (diffDueDays >= 45) {
				capCountWithRefundStatus++;
				deactivateTask(WfTask);
                if (queryResult.type == 'State License')
                {
                    activateTask("Refund");
                    updateTask("Refund", "Refund Required", "No Response Received.", "No Response Received.");
                }
                else
                {
                    activateTask("State Refund");
                    updateTask("State Refund", "Refund Required", "No Response Received.", "No Response Received.");
                }
				updateAppStatus("Refund Required", "", capId);
			}
			//Send Weekly Deficiency Letter
			var diffDueDays = calculateDateDiff(statusDate , currentDate);
			
			if(exists(diffDueDays, daysFromCurrentDateArray))
			{
				capCountDeficiencyLetter++;
				emailApplicationDeficiencyLetter(capId);
			}
		}
	}
}

function calculateDateDiff(statusDate , currentDate)
{
	//var diffDueDays = Math.round((statusDate.getTime() - currentDate.getTime())/(oneDay));
	var diffDueDays = Math.round((currentDate.getTime() - statusDate.getTime()) / (oneDay));
      return diffDueDays;
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

function emailApplicationDeficiencyLetter(capId)
{
	var contactEmails = new Array();
	var reportName = "Application_Deficiency_Letter_Email";
	var emailTemplate = "* EMAIL APPLICATION DEFICIENCY";
	var emailParameters = getEmailTemplateParametersXXX(capId);
	var myHashMap = aa.util.newHashMap();
	myHashMap.put("ALT_ID", String(capId.getCustomID()));
	var capContactArr = getPeople(capId);
	for (contactItem in capContactArr)
	{
		var contactType = capContactArr[contactItem].getCapContactModel().getPeople().getContactType();
		var primaryFlag = capContactArr[contactItem].getCapContactModel().getPrimaryFlag();
		
		var email = capContactArr[contactItem].getCapContactModel().getEmail();
		
        if (contactType != null && (String(contactType).toUpperCase() == "APPLICANT" || String(contactType).toUpperCase() == "APPLICATION CONTACT"||String(contactType).toUpperCase() == "BUSINESS"))
		{
			if (email != null) 
			{
				
				var atIndex = String(capContactArr[contactItem].email).indexOf("@");
				var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
				if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) // basic email validation
				{
					contactEmails.push(email);
					myHashMap.put("Contact_Name", capContactArr[contactItem].fullName);
				}
			}
		}
	}
	if (contactEmails && contactEmails.length > 0) 
	{
		aa.print("contactEmails : "+contactEmails);
        var llaName = null;
		for (validEmail in contactEmails)
		{
            if (getLLAName(getAppSpecific("City/Town Name", capId)))
            {
                llaName = getLLAName(getAppSpecific("City/Town Name", capId));
            }
            else
            {
                llaName = getLLAName(getAppSpecific("City/Town", capId));
            }
            aa.print("----" + getLLAName(getAppSpecific("City/Town Name", capId)));
            addParameter(emailParameters, "$$LLA$$", llaName);
			if (!generateReportSaveAndEmailXXX(reportName, myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId)) 
			{
				aa.print("Error sending Application Deficiency Email");
			}
            else
            {
                aa.print("Deficiency email sent for -- " + capId);
            }
		}
	}
}


//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection){
	var sql = "SELECT PERMIT.SERV_PROV_CODE, \
    CONCAT(CONCAT(CONCAT(CONCAT(PERMIT.B1_PER_ID1, '-'), PERMIT.B1_PER_ID2),'-'),PERMIT.B1_PER_ID3) AS CAP_ID, \
    PERMIT.B1_ALT_ID , \
    PERMIT.B1_PER_GROUP , \
    PERMIT.B1_PER_TYPE, \
    PERMIT.B1_PER_SUB_TYPE, \
    PERMIT.B1_PER_CATEGORY, \
    PERMIT.B1_APPL_STATUS \
  FROM ACCELA.B1PERMIT PERMIT \
  join ACCELA.V_WORKFLOW W on \
  W.RECORD_ID = PERMIT.b1_alt_id \
  WHERE PERMIT.SERV_PROV_CODE = 'ABCC' \
  AND PERMIT.B1_PER_GROUP     = 'License' \
 and W.TASK_IS_ACTIVE = 'Y' \
  and W.status like 'Additional Information Needed' \
  ORDER BY PERMIT.rec_date DESC";
			
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
