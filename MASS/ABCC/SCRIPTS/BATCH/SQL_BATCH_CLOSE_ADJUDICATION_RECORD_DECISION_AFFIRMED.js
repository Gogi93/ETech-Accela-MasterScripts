/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_CLOSE_ADJUDICATION_RECORD_DECISION_AFFIRMED
* @Author		:	Sagar Cheke
* @Date			:	04/19/2016
* @Description 	:	If Case Type is in "LLA Application Appeal", "LLA Violation Appeal" Disposition Type is set to "Decision Affirmed" then Close
					the Adjudication Record.
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

var emailText = "";
var publicUser = "";

var emailAddress = lookup("BATCH_STATUS_EMAIL", "DECISION AFFIRMED"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

ELPLogging.debug("Current user ID:" + currentUserID);

/*var stagingConfigurationString = '{\
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

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);*/
try
{
	//var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	//if(dbConfiguration)
	//{
	//	this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
	//	ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
	//	logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		/*var pendingExamProcedure = null;
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
		aa.print("Found queryAdjRecords : " + supplementalConfiguration.procedure.name);*/
		
		//var staticParameters = {} ;
		//var dynamicParameters = {} ;
		//var batchApplicationResult = {};
		//pendingExamProcedure.prepareStatement();
		//var inputParameters = pendingExamProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		//var emseParameters = {};

		//pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//pendingExamProcedure.setParameters(inputParameters);

		// Define the search criteria
		var capTypeModel = aa.cap.getCapTypeModel().getOutput();
		capTypeModel.setGroup("Enforce");
		capTypeModel.setType("Adjudication");
		capTypeModel.setSubType("NA");
		capTypeModel.setCategory("NA");

		var capModel = aa.cap.getCapModel().getOutput();
		capModel.setCapType(capTypeModel);

		// Get the list of records by search criteria
		var capIDList = aa.cap.getCapIDListByCapModel(capModel);
		if (!capIDList.getSuccess()) {
			logDebug("**INFO failed to get capIds list " + capIDList.getErrorMessage());
			capIDList = new Array(); //empty array script will exit
		} else {
			capIDList = capIDList.getOutput();
		}
		
		var dataSet = capIDList;
		
		//var dataSet = pendingExamProcedure.queryProcedure();
		//var dataSet = aa.cap.getByAppType('Enforce','Adjudication','NA','NA').getOutput();
		
		var x = 0;
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
		for (x in dataSet)
		{
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}
			
			//var capID = aa.cap.getCapID(queryResult.altID).getOutput();
			var capID = dataSet[x];
			var capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
			var scanner = new Scanner(capID.toString(), "-");
			var ID1 = scanner.next();
			var ID2 = scanner.next();
			var ID3 = scanner.next();

			var capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
			var validationArray = getASIDetailsForAdj(capId);

			if((validationArray.isLLAAppAppeal == true) && (validationArray.isDecisionAffirmed))
			{
				//aa.print("Processing Adjudication record : "+queryResult.capID);
				aa.print("<br>Processing Adjudication record : " + capIDString);
				
				//Close the ABCC Appeal task
				deactivateTask("ABCC Appeal");
				
				//Close the Adjudication Record 90 days from the date the Decision task was set to 'Decision Issued'
				var statusDate = retrieveStatusDateOfDecisionTask(capId)
				
				var daysBetweenDates = dateDifference(statusDate, new Date());
					
				if(daysBetweenDates >= 90)
				{
					//Close the Adjudication Record
					updateAppStatus("Close", "Updated via script", capId);
				}
				
			}			
		}
	//}
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
	/*if (dataSet != null) 
	{
		dataSet.close();
	}
	if (pendingExamProcedure != null) 
	{
		pendingExamProcedure.close();
	}
	if (databaseConnection != null) 
	{
		databaseConnection.close();
	}*/
	
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

	aa.print(ELPLogging.toString());
}

/**
 * @desc This method will retrieve decision task status date.
 * @param {capId} contains record ID.
 * @returns {statusDate} - statusDate value
 */
function retrieveStatusDateOfDecisionTask(capId)
{
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
	var validationArray = new Array();
	var isLLAAppAppeal = false;
	var isDecisionAffirmed = false;
	
	//This API retrieves ASI details on the record
	var asiDetailResult = aa.appSpecificInfo.getByCapID(capIDModel); 

	if(asiDetailResult.getSuccess())
	{
		var asiDetailsModel = asiDetailResult.getOutput();
		if(asiDetailsModel)
		{
			for(ASI in asiDetailsModel)
			{
				if((asiDetailsModel[ASI].getFieldLabel() == "Case Type") || (asiDetailsModel[ASI].getFieldLabel() == "Disposition Type"))
				{
					var checklistComment = asiDetailsModel[ASI].getChecklistComment();
					if(checklistComment == "LLA Application Appeal" || checklistComment == "LLA Violation Appeal")
					{
						validationArray.isLLAAppAppeal = true;
					}
					else if(checklistComment == "Decision Affirmed")
					{
						validationArray.isDecisionAffirmed = true;
					}
				}				
			}
		}	
	}
	
	return validationArray;
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