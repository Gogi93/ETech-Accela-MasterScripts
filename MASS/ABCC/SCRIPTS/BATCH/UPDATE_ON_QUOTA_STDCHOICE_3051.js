/***********************************************************************************************************************************
 * @Title 		: 	UPDATE_ON_QUOTA_STDCHOICE_3051
 * @Author		:	debashish.barik
 * @Date			:	05/22/2017
 * @Description 	:	UPDATE_ON_STDCHOICE_3051
 ***********************************************************************************************************************************/
try {
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
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

function getScriptText(vScriptName) {
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
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";
var capId = "";
var capCount = 0;
var condAddedCount = 0;
var emailText = "";
var oneDay = 1000 * 60 * 60 * 24;

var stagingConfigurationString = '{\ 	"connectionSC": "DB_CONNECTION_INFO",\ 	"supplemental":   [{\ 	"tag":"queryRecordsFromView",\ 	"procedure":{\ 	"name":"UPDATE_ON_STDCHOICE_3051",\ 	"resultSet":{"list":[\{"source":"RESULT","name":"muni_code","parameterType":"OUT","property":"muni_code","type":"STRING"},\{"source":"RESULT","name":"city_town","parameterType":"OUT","property":"city_town","type":"STRING"},\{"source":"RESULT","name":"Count","parameterType":"OUT","property":"Count","type":"STRING"}]},\ 	"parameters":{"list":[\{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\ 	}';
var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try {
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if (dbConfiguration) {
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		 * Obtain Stored Procedure for queryECBViolation into Staging Table
		 */
		var queryRecordsFromView = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryRecordsFromView") {
				var queryRecordsFromView = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (queryRecordsFromView == null) {
			var message = "Cannot find procedure ELP_SP_RETAIL_APP_ABCC";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryRecordsFromView : " + supplementalConfiguration.procedure.name);

		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		queryRecordsFromView.prepareStatement();
		var inputParameters = queryRecordsFromView.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		//queryRecordsFromView.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//queryRecordsFromView.setParameters(inputParameters);

		//var dataSet = queryRecordsFromView.queryProcedure();

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
		var dataSet = getRecordsArray(emseParameters,databaseConnection);
	    //aa.print("dataSet.length: " +dataSet.length);
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

			try {
				
				ObjKeyRename(dataSet[i], {"MUNI_CODE":"muni_code"});
				ObjKeyRename(dataSet[i], {"CITY_TOWN":"city_town"});
				ObjKeyRename(dataSet[i], {"COUNT":"Count"});
			    //aa.print("My Test>> "+queryResult.customID);
		    	var queryResult = dataSet[i];
				var vMuniCOde = String(queryResult.muni_code);
				var vCity_town = String(queryResult.city_town);
				var vCount = String(queryResult.Count);
				aa.print(vCity_town + "[" + vMuniCOde + "]:" + vCount);
				editLookup("LLA On Premise Licenses Issued", vMuniCOde, vCount);

			} catch (err) {
				aa.print("Warning**cannot process:" + vMuniCOde + ":" + err.message);
			}
		}
	}

} catch (ex) {
	aa.print("exception caught: " + ex.message);

	dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing UPDATE_ON_QUOTA_STDCHOICE_3051" + ex.message);
	ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("EMSEReturnMessage: " + "Error executing UPDATE_ON_QUOTA_STDCHOICE_3051. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
finally {
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}

	if (queryRecordsFromView != null) {
		//queryRecordsFromView.close();
	}

	if (databaseConnection != null) {
		//databaseConnection.close();
	}

	if (!ELPLogging.isFatal()) {
		dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with " + ELPLogging.getErrorCount() + " errors." + br;
		} else {
			aa.env.setValue("EMSEReturnMessage", "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with no errors.");
			emailText = emailText + "EMSEReturnMessage: " + "UPDATE_ON_QUOTA_STDCHOICE_3051 completed with no errors." + br;
		}
	}

	/* 	if (emailAddress && emailAddress != "" && emailAddress.length > 0) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	} else {
	aa.print("Email not sent. Standard Choice lookup failed or not found.");
	} */

	aa.print(ELPLogging.toString());
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

//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection){
	var sql = "select r.BIZDOMAIN_VALUE as muni_code, upper(r.VALUE_DESC)as city_town , \
NVl(A_All.total,0)||'|'||NVL(A_Wine.total,0)||'|'||NVL(S_All.total,0)||'|'||NVL(S_Wine.total,0) Count \
from ACCELA.RBIZDOMAIN_VALUE r \
left join JIRA_3051_ANNUAL_ALL A_All \
on  upper(A_All.City) = upper(r.VALUE_DESC)  and A_All.\"CATEGORY_Type\" = 'ON_CATEGORY' \
left join JIRA_3051_Annual_Wine A_Wine \
on  upper(A_Wine.City) = upper(r.VALUE_DESC)  and A_Wine.\"CATEGORY_Type\" = 'ON_CATEGORY' \
left join JIRA_3051_Seasonal_All S_All on  upper(S_All.City) = upper(r.VALUE_DESC)  and S_All.\"CATEGORY_Type\" = 'ON_CATEGORY' \
left join JIRA_3051_Seasonal_Wine S_Wine on  upper(S_Wine.City) = upper(r.VALUE_DESC)  and S_Wine.\"CATEGORY_Type\" = 'ON_CATEGORY' \
where r.BIZDOMAIN = 'Muni Code to Name'";
			
			
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
