/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_EXAM_OVER_90DAYS (Script 834) Trigger : Batch
 |
 | - Adds the Condition of Approval "Failure to pay License" (Application Checklist) to 
 |   EN and LS - Professional Engineer Applications and EN and LS - Professional Land Surveyor Applications with the following:
 |    1) Record Status IS NOT equal to 'Closed' or 'Printed'
 |    2) 90 days have passed since the last exam was completed
 | 
 | Batch Requirements :
 | - None
 | Batch Options:
 | - None
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
// Email address of the sender
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var capExamOverCount = 0;
var capCondAddedCount = 0;

//Variables used
var duration = 90; 
	
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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "EXAM_OVER_90_DAYS"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryCompletedExamApps",\
					"procedure":{\
						"name":"ELP_SP_COMPLETED_EXAM_VW_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"examName","parameterType":"OUT","property":"EXAM_NAME","type":"STRING"},\
														 {"source":"RESULT","name":"examDate","parameterType":"OUT","property":"LAST_EXAM_DATE","type":"DATE"},\
														 {"source":"RESULT","name":"daysPast","parameterType":"OUT","property":"DAYS_PAST","type":"INTEGER"}]},\
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
		var licenseRenewalProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryCompletedExamApps")
			{
				 var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseRenewalProcedure == null)
		{
			var message = "Cannot find procedure queryCompletedExamApps";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryCompletedExamApps: " + supplementalConfiguration.procedure.name);

		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		licenseRenewalProcedure.prepareStatement();
		var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};
		 
		logDebugAndEmail("Searching for EN and LS records");

		licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		licenseRenewalProcedure.setParameters(inputParameters);

		//var dataSet = licenseRenewalProcedure.queryProcedure();
		var dataSet = getRecordsArray(emseParameters);
		
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"B1_PER_ID1":"id1"});
			ObjKeyRename(dataSet[i], {"B1_PER_ID2":"id2"});
			ObjKeyRename(dataSet[i], {"B1_PER_ID3":"id3"});
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
			ObjKeyRename(dataSet[i], {"EXAM_NAME":"examName"});
			ObjKeyRename(dataSet[i], {"LAST_EXAM_DATE":"examDate"});
			ObjKeyRename(dataSet[i], {"DAYS_PAST":"daysPast"});
			var queryResult = dataSet[i];
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){			
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" + " Days since last exam:" + queryResult.daysPast +":"+queryResult.examDate+":"+queryResult.examName);

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
			var examDate = queryResult.examDate;
			var examName = queryResult.examName;
			var examDaysPast = queryResult.daysPast;
			capCount++;
			
			if(examDaysPast > duration)
			{
				logDebugAndEmail("Record ID qualified: " + capId.getCustomID() + "(" + capStatus + ")" + " completed exam on: " + examDate  );
				logDebug("Days of not having paid after Exam Test: " + examDaysPast);
				capExamOverCount++;
			
				//Check if condition already exists
				if (appHasCondition("Application Checklist", "Pending", "Failure to pay License", null, capId) ||
								appHasCondition("Application Checklist", "Applied", "Failure to pay License", null, capId))
				{
					logDebugAndEmail("Condition Exists on Record");
				}
				else
				{					
					//Add Condition
					var cType = "Application Checklist";
					var cDesc = "Failure to pay License"; 
					CWM_ELP_Generic_DPL_addConditionOnCap(cType, cDesc, capId);
					//aa.capCondition.addCapCondition(capId, "Notice", cDesc, "Verification of failure to pay for licensure after passing the exam", null, null, null, null, null, "", null, null, "", "", "A","Y");
					logDebugAndEmail("Condition Added");
					capCondAddedCount++;
				}
			}			
		
		} // end for loop over the Oracle Data set returned.
	}// end of connection 
	else
	{
		logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	}

	logDebugAndEmail("Total PE & PLS Applications (NOT CLOSED) Processed: " + capCount);
	logDebugAndEmail("Total Applications with Completed Exams over 90 days: " + capExamOverCount);
	logDebugAndEmail("Total Applications 'Failure to pay License' condition added: " + capCondAddedCount);	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_EXAM_OVER_90DAYS" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_EXAM_OVER_90DAYS. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_EXAM_OVER_90DAYS " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (licenseRenewalProcedure != null) {
		licenseRenewalProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_EXAM_OVER_90DAYS completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_EXAM_OVER_90DAYS completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_EXAM_OVER_90DAYS completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_EXAM_OVER_90DAYS completed with no errors.");					
		}
	}

	aa.print(ELPLogging.toString());
}


if (emailAddress && emailAddress.length > 0 ) {
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

 function getContactPreferredChannelDesc(value) {
	return lookup("CONTACT_PREFERRED_CHANNEL", value);
}

function getRecordsArray(emseParameters){
	var sql = 
			"SELECT b.serv_prov_code, \
		       b.b1_per_id1, \
		       b.b1_per_id2, \
		       b.b1_per_id3, \
		       b.b1_per_group, \
		       b.b1_per_type, \
		       b.b1_per_sub_type, \
		       b.b1_alt_id, \
		       b.b1_appl_status, \
		       E.exam_name, \
		       Max(E.exam_date) AS LAST_EXAM_DATE, \
		       Floor(Trunc(sysdate) - Max(E.exam_date)) AS DAYS_PAST \
		FROM   b1permit b \
		       LEFT JOIN gexam E \
		              ON E.b1_per_id1 = B.b1_per_id1 \
		                 AND E.b1_per_id2 = B.b1_per_id2 \
		                 AND E.b1_per_id3 = B.b1_per_id3 \
		                 AND E.serv_prov_code = B.serv_prov_code \
		WHERE  b.b1_per_group = 'License' \
		       AND b.b1_per_type = 'Engineers and Land Surveyors' \
		       AND b.b1_per_sub_type IN ( 'Professional Land Surveyor', \
		                                  'Professional Engineer' \
		                                ) \
		       AND b.b1_per_category = 'Application' \
		       AND b.b1_appl_status NOT IN ( 'Closed', 'Printed' ) \
		       AND b.serv_prov_code = 'DPL' \
		       AND b.rec_status = 'A' \
		       AND e.exam_date IS NOT NULL \
		GROUP  BY b.serv_prov_code, \
		          b.b1_per_id1, \
		          b.b1_per_id2, \
		          b.b1_per_id3, \
		          b.b1_per_group, \
		          b.b1_per_type, \
		          b.b1_per_sub_type, \
		          b.b1_alt_id, \
		          b.b1_appl_status, \
		          E.exam_name \
		ORDER  BY b1_alt_id";

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