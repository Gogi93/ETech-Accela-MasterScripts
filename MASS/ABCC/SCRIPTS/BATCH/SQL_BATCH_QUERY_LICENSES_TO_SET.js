/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_QUERY_LICENSES_TO_SET Trigger : Batch
 |
 | Batch Requirements :
 | - None
 | Batch Options:
 | - SetName - Name of set to which licenses should be added. Set is created if not exists.
 | - Pilot - Set to Yes to indicate only restricted set to be run.
 |
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0

function getScriptText(vScriptName) {
  vScriptName = vScriptName.toUpperCase();
  var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
  var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
  return emseScript.getScriptText() + "";
}

showDebug = false;
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
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info

var emailText = "";
var publicUser = "";

try {
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
	eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

// this flag somehow gets reset in the scripts above, resetting here again so that it doesnt log
showDebug = false;

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "")
  ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
  emailAddress2 = "";

//Set Size
//var setSize = getParam("setSize");
//if (setSize == null || setSize == "" || setSize == "undefined")
//  setSize = 1000;

//var pilotParam = getParam("Pilot");
//if ((pilotParam == null) || (pilotParam == "undefined") || (pilotParam == "")) {
//	pilotParam = "NO";
//}

var setNameParam = getParam("SetName");
if ((setNameParam == null) || (setNameParam == "undefined") || (setNameParam == "")) {
	setNameParam = "ABCC_MUNICIPAL_TEST";
}

/*var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryLicenses2Set",\
					"procedure":{\
						"name":"ELP_SP_LICENSE2SET_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"serv_prov_code","parameterType":"OUT","property":"SERV_PROV_CODE","type":"STRING"},\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"PILOT","parameterType":"IN","property":"PILOT","type":"STRING"},\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);*/

try {

	//var capsToAddHashMap = new Array();
	//var arrBatchesToPrint = new Array();
	//var myCaps = new Array();

	//var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	//if (dbConfiguration) {
		//this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		//ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		//logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		/*var LicenseToSetProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenses2Set") {
				LicenseToSetProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (LicenseToSetProcedure == null) {
			var message = "Cannot find procedure queryLicenses2Set";
			var exception = new Error(message);
			throw exception;
		}
		logMessage("Found queryLicenses2Set: " + supplementalConfiguration.procedure.name);*/
		
		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		//var staticParameters = {};
		//var dynamicParameters = {};
		//var batchApplicationResult = {};
		//LicenseToSetProcedure.prepareStatement();
		//var inputParameters = LicenseToSetProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		//var emseParameters = {};

		//emseParameters.PILOT = pilotParam;
	 
		//LicenseToSetProcedure.copyEMSEParameters(emseParameters, inputParameters);
		//ELPLogging.debug("inputParameters for Query", inputParameters);
		//LicenseToSetProcedure.setParameters(inputParameters);
		
		var vCapIDArray = getRecordsBySQL();
		
		aa.print("Total Records: " + vCapIDArray.length);
				
		var regEx = /[0-9]{5}-[A-Z]{2}-[0-9]{4}/;
		var dataSet = [];
		
		for (i in vCapIDArray){
			var capID = vCapIDArray[i];
			var capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
			
			if (regEx.test(capIDString)){
				dataSet.push(vCapIDArray[i]);
			}
		}
		
		//var dataSet = LicenseToSetProcedure.queryProcedure();

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
		var x = 0;
		for (x in dataSet) {	
			try {

				if (elapsed() > maxSeconds) {		// Only continue if time hasn't expired
					logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
					timeExpired = true;
					break;
				}

				capID = dataSet[x];
				capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
				
				//var capId = aa.cap.getCapID(queryResult.customID).getOutput();
				var capId = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput();
				aa.print("Got one: " + capIDString);
				addToSet(capId, setNameParam);
				capCount++;

			} catch (ex) {
				aa.print("exception caught: " + ex.message);

				aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
				aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET" + ex.message);
				ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
				ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET. " + ex.message);
				ELPLogging.debug("________________________________________________________________________________");
				ELPLogging.debug("Total Licenses Processed: " + capCount);

				var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_QUERY_LICENSES_TO_SET " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
				ELPLogging.fatal(returnException.toString());
				throw returnException;
				
			}			

		} // end for loop over the Oracle Data set returned.
	//} // end of connection
	//else {
	//	logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	//}

	logDebugAndEmail("________________________________________________________________________________");
	logDebugAndEmail("Total Licenses Processed: " + capCount);

	//dataSet.close();
} catch (ex) {
	aa.print("exception caught: " + ex.message);

	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET" + ex.message);
	ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_QUERY_LICENSES_TO_SET. " + ex.message);
	ELPLogging.debug("________________________________________________________________________________");
	ELPLogging.debug("Total Licenses Processed: " + capCount);

	var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_MUNICIPAL_LICENSES_TO_SET " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
} finally {
	// close objects
	/*if (dataSet != null) {
		dataSet.close();
	}
	if (LicenseToSetProcedure != null) {
		LicenseToSetProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}*/

	if (!ELPLogging.isFatal()) {
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("________________________________________________________________________________");
		ELPLogging.debug("Total Licenses Processed: " + capCount);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MUNICIPAL_LICENSES_TO_SET completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_MUNICIPAL_LICENSES_TO_SET completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MUNICIPAL_LICENSES_TO_SET completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_MUNICIPAL_LICENSES_TO_SET completed with no errors.");
		}
	}
}

aa.print(ELPLogging.toString());

if (emailAddress.length > 0) {
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

function elapsed() {
  var thisDate = new Date();
  var thisTime = thisDate.getTime();
  return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail(debugText) {
  emailText = emailText + debugText + br;
  ELPLogging.debug(debugText);
}

function addToSet(addToSetCapId, tgtSetName) {
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = tgtSetName;

	aa.print("add to set: " + setName + " cap: " + setCap);

	var setExists = false;
	var setGetResult = aa.set.getSetByPK(setName);
	if (setGetResult.getSuccess()) setExists = true;

	if (!setExists) {
			//logDebug("Set doesn't exists.");
			setDescription = setName;
			setType = "License Sync";
			setStatus = "Pending";
			setExists = createSet(setName, setDescription, setType, setStatus);
	}

	if (setExists) {
		 // logDebug("Set exists. Adding " + addToSetCapId);

			var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(addToSetCapId).getOutput();

			var doesExistInSync = false;
			for (i = 0; i < setsMemberIsPartOf.size(); i++) {
					// aa.print("Part of Set : " + setsMemberIsPartOf.get(i).getSetID());
					if (setName == setsMemberIsPartOf.get(i).getSetID()) {
							doesExistInSync = true;
							aa.print("part of set - " + setsMemberIsPartOf.get(i).getSetID());
					}
			}
			logDebug("doesExistInSync " + doesExistInSync);
			if (!doesExistInSync)
					aa.set.add(setName, addToSetCapId);
	}
}

function getRecordsBySQL() {
    // Setup variables
    var initialContext;
    var ds;
    var conn;
    var selectString;
    var sStmt;
    var rSet;
    var retVal;
    var retValArray;
    var capIdArray;
    var retArr;

    // Setup SQL Query to return CapIds
    initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
    ds = initialContext.lookup("java:/AA");
    conn = ds.getConnection();

    // Get Records
    selectString = "SELECT B1PERMIT.B1_PER_ID1 || '-' || B1PERMIT.B1_PER_ID2 || '-' || B1PERMIT.B1_PER_ID3 AS CapId FROM B1PERMIT WHERE B1PERMIT.SERV_PROV_CODE = 'ABCC' AND B1PERMIT.B1_PER_GROUP = 'License' AND B1PERMIT.B1_PER_TYPE = 'Retail License' AND B1PERMIT.B1_PER_CATEGORY = 'License' AND B1PERMIT.REC_STATUS = 'A' AND REGEXP_LIKE (B1PERMIT.B1_ALT_ID, '[0-9]{5}-[A-Z]{2}-[0-9]{4}')";

    //logDebug(selectString);

    // Execute the SQL query to return CapIds as a string
    sStmt = conn.prepareStatement(selectString);
    rSet = sStmt.executeQuery();
    retVal = "";
    retValArray = [];
    capIdArray = [];
    while (rSet.next()) {
        retVal = rSet.getString("CapId");
        // Separate CapId into three parts, ID1, ID2, ID3
        retValArray = retVal.split("-");
        // Save actual CapId object to array for processing
        capIdArray.push(aa.cap.getCapID(retValArray[0], retValArray[1], retValArray[2]).getOutput());
    }
    sStmt.close();
    conn.close();

    return capIdArray;
}