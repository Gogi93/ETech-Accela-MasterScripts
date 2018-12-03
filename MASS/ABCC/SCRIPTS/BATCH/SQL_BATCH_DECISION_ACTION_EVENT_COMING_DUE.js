/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_DECISION_ACTION_EVENT_COMING_DUE
* @Author		:	Sagar Cheke
* @Date			:	04/22/2016
* @Description 	:	IF
					Other Decision Terms Decision Action Date OR Suspension Start Date OR 
					Revocation Start Date OR Cancellation Start Date or Modification Start Date equals the current date
					THEN
					Set the task status of the Decision Action task to "Follow Up Required".
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

function getScriptText(vScriptName) 
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
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

//ELPLogging.debug("Current user ID:" + currentUserID);

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
		//this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		//ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		//logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		//var pendingExamProcedure = null;
		/*for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
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

		pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		pendingExamProcedure.setParameters(inputParameters);*/

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
		
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
		var x = 0;
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
			/*
			var scanner = new Scanner(capID.toString(), "-");
			var ID1 = scanner.next();
			var ID2 = scanner.next();
			var ID3 = scanner.next();
			*/
			
			//var capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
			var capId = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput();					
			
			var ASIDetailsArray = getASIvalue(capId);
			var ASIvalueDetailsArray = getASITvalue(capId, ASIDetailsArray);
			
			// Remove after debug
			//if (x > 10) { aa.print("Done"); break; }
			
			/*if((ASIvalueDetailsArray.suspensionStartDate == "0" )|| (ASIvalueDetailsArray.revocationStartDate == "0") || (ASIvalueDetailsArray.cancellationStartDate == "0") || (ASIvalueDetailsArray.modificationStartDate == "0") || (ASIvalueDetailsArray.decisionActionDate=="0"))
			{
				//aa.print("Processing record : "+queryResult.altID);
				aa.print("Processing record : " + capIDString);
				//activateTask("Decision Action");
				updateTask("Decision Action", "Follow Up Required", "Updated via script.", "Updated via script.");
			}*/
			
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

function getASIvalue(capIDModel)
{
	var ASIValueArray = new Array();
	
	//This API retrieves ASI details on the record
	var asiDetailResult = aa.appSpecificInfo.getByCapID(capIDModel); 
	if(asiDetailResult.getSuccess())
	{
		var asiDetailsModel = asiDetailResult.getOutput();
		for(ASI in asiDetailsModel)
		{
			if(asiDetailsModel[ASI].getFieldLabel() == "Suspension Start Date")
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValueArray["suspensionStartDate"] = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);
				}
				else
				{
					ASIValueArray["suspensionStartDate"] = "-1";
				}
			}
			else if (asiDetailsModel[ASI].getFieldLabel() == "Revocation Start Date")
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValueArray["revocationStartDate"] = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);
				}
				else
				{
					ASIValueArray["revocationStartDate"] = "-1";
				}
			}
			else if (asiDetailsModel[ASI].getFieldLabel() == "Cancellation Start Date")
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValueArray["cancellationStartDate"] = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);
				}
				else
				{
					ASIValueArray["cancellationStartDate"] = "-1";
				}
			}
			else if (asiDetailsModel[ASI].getFieldLabel() == "Modification Start Date")
			{
				var currentDate = formatCurrentDate();
				if(asiDetailsModel[ASI].getChecklistComment() != null)
				{
					ASIValueArray["modificationStartDate"] = dateDifference(aa.util.parseDate(asiDetailsModel[ASI].getChecklistComment().toString()), currentDate);
				}
				else
				{
					ASIValueArray["modificationStartDate"] = "-1";
				}
			}
		}
	}
	
	return ASIValueArray;
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

function getASITvalue(pCapId, pASIDetailsArray)
{	
	var arr = loadASITable("OTHER DECISION TERMS", pCapId);
	var count = 0;
	if(arr)
	{
		for (i in arr)
		{
			count = count + 1;
			firstRow = arr[i];
			var decisionActionDate = firstRow["Decision Action Date"];
			
			var currentDate = formatCurrentDate();
			if(decisionActionDate != "")
			{
				pASIDetailsArray["decisionActionDate"] = dateDifference(aa.util.parseDate(decisionActionDate.toString()), currentDate);
			}
			else
			{
				pASIDetailsArray["decisionActionDate"] = "-1";
			}
		}
	}
	
	return pASIDetailsArray;
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