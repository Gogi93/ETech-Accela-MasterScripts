/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC
* @Author		:	Sagar Cheke
* @Date			:	04/28/2016
* @Description 	:	IF record status is Submitted and current date is 12/31/YYYY where YYYY is current year,
					THEN
					Close the workflow and mark the renewal record as complete.
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
var capId ="";
var capCount = 0;
var condAddedCount = 0;
var emailText = "";
var oneDay = 1000 * 60 * 60 * 24;

var emailAddress = lookup("BATCH_STATUS_EMAIL", "CLOSE_RETAIL_RENEWAL"); // This email will be set by standard choice
aa.print("emailAddress : "+emailAddress);
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

/*var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryRecordsFromView",\
					"procedure":{\
						"name":"ELP_SP_RETAIL_RENEWAL_ABCC",\
						"resultSet":{"list":[\
												{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAP_ID","type":"STRING"},\
												{"source":"RESULT","name":"perType","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\
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
		
		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		/*var queryRecordsFromView = null;
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
			var message = "Cannot find procedure ELP_SP_RETAIL_RENEWAL_ABCC";
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

		queryRecordsFromView.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		queryRecordsFromView.setParameters(inputParameters);*/

		//var dataSet = queryRecordsFromView.queryProcedure();
		
		// Define the search criteria
		var capTypeModel = aa.cap.getCapTypeModel().getOutput();
		capTypeModel.setGroup("License");
		capTypeModel.setType("Retail License");
		capTypeModel.setCategory("Renewal");

		var capModel = aa.cap.getCapModel().getOutput();
		capModel.setCapType(capTypeModel);
		capModel.setCapStatus("Submitted");

		// Get the list of records by search criteria
		var capIDList = aa.cap.getCapIDListByCapModel(capModel);
		if (!capIDList.getSuccess()) {
			logDebug("**INFO failed to get capIds list " + capIDList.getErrorMessage());
			capIDList = new Array(); //empty array script will exit
		} else {
			capIDList = capIDList.getOutput();
		}
		
		var dataSet = capIDList;
		
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
			capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
			var scanner = new Scanner(capID.toString(), "-");
			var ID1 = scanner.next();
			var ID2 = scanner.next();
			var ID3 = scanner.next();
			capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
			
			evaluateReatilRenewalRecords(capId, capIDString);
		}
	//}
	
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC. " + ex.message);
   
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
	
	if (queryRecordsFromView != null) 
	{
		queryRecordsFromView.close();
	}
	
	if (databaseConnection != null) 
	{
		databaseConnection.close();
	}*/
	
	if (!ELPLogging.isFatal()) {
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		//ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);
		
		if (ELPLogging.getErrorCount() > 0) 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with " + ELPLogging.getErrorCount() + " errors." + br;
		}
		else 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with no errors.");				
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_CLOSE_RETAIL_RENEWAL_WF_JAN_1ST_ABCC completed with no errors." + br;
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

function evaluateReatilRenewalRecords(capId, capIDString)
{
	//aa.print("Processing Renewal record : "+queryResult.altID);
	aa.print("<br>Processing Renewal record : " + capIDString);
	var endOfCalYr = new Date();
	endOfCalYr.setMonth(11,12);
	
	var currentDate = new Date();
		
	var diffDueDays = dateDifference(endOfCalYr, currentDate)
	if(diffDueDays == 0)
	{
		//aa.print("Closing Work flow for record : "+queryResult.altID);
		aa.print("Closing Work flow for record : " + capIDString);
		closeTask("Retail Renewal", "Submitted", "Updated via script.", "Updated via script.");
	}

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