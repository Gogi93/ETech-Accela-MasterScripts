// JavaScript Document
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
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
//Set Size
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
	setSize = 1000;

/* *
 * User Parameters  Begin
 * */
var capCount = 0;	
var renewalCapCount = 0;
var existRenewalCount = 0;
var condCapCount = 0;
var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info
	
var emailText = "";
var publicUser = "";

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryLicensestoExpire",\
					"procedure":{\
						"name":"ELP_SP_EXPIRE_LIC_JAN1ST_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"expirationDate","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_SUBTYPE","parameterType":"IN","property":"LICENSE_SUBTYPE","type":"STRING"},\
														 {"source":"RESULT","name":"EXPIRATION_STARTDATE","parameterType":"IN","property":"EXPIRATION_STARTDATE","type":"DATE"},\
														 {"source":"RESULT","name":"EXPIRATION_ENDDATE","parameterType":"IN","property":"EXPIRATION_ENDDATE","type":"DATE"},\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';


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
	eval(getScriptText("EMSE_MA_INT_C_SCANNER"));
	
	var returnException;
	showDebug = 3;
	showMessage = false;
	ELPLogging.debug("Finished loading the external scripts");
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   emailText = emailText + returnException.toString() + br;

   throw returnException;
}

var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");
var fromDtParam = getParam("FromDate");
var toDateParam = getParam("ToDate"); 
var taskName = "License";
var updateTaskStatus = "Expired";
 
var emailAddress = lookup("BATCH_STATUS_EMAIL", "LAPSED"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

var fromDt;
var toDate;

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
	var licenseRenewalProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryLicensestoExpire")
		{
			 var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (licenseRenewalProcedure == null)
	{
		var message = "Cannot find procedure queryLicensestoExpire";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryLicensestoExpire: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {};
	var dynamicParameters = {};
	var batchApplicationResult = {};
	//licenseRenewalProcedure.prepareStatement();
	//var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	 
	// If Expiration date not passed in via batch job parameter, it is defined here as 12/31/[Current Year] 
	if( fromDtParam == null || fromDtParam == "undefined" || fromDtParam == "" || toDateParam == null || toDateParam == "undefined" || toDateParam == "")
	{
		var currentDate = new Date();
		var year = currentDate.getFullYear()
		var expdate = "12/31" +"/"+ (year-1); //SHOULD BE YEAR MINUS 1 - PREVIOUS YEAR, since job will be run in the new year.
		toDate = new Date(expdate);
		fromDt = new Date(expdate);
		ELPLogging.debug("Expiration Date Range not set via parameter. Setting Default expiration date: " + expdate);
	}
	else
	{
		fromDt = new Date(fromDtParam);
		toDate = new Date(toDateParam);	
	}

	if ( (licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "" ) && 
	     (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ) )
		ELPLogging.debug("License Type not set via parameter. Processing all ABCC Ready for Renew Licenses with expiration date from: " + fromDt + " to " + toDate); 
		

	emseParameters.EXPIRATION_STARTDATE = fromDt;
	emseParameters.EXPIRATION_ENDDATE = toDate;
	emseParameters.LICENSE_TYPE = licenseTypeParam;
	emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;
	emseParameters.AGENCY = "ABCC";

	//licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
	//ELPLogging.debug("inputParameters for Query", inputParameters);
	//licenseRenewalProcedure.setParameters(inputParameters);

	//var dataSet = licenseRenewalProcedure.queryProcedure();

	//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
	var dataSet = getRecordsArray(emseParameters,databaseConnection);
	aa.print("dataSet.length: " +dataSet.length);
    if (dataSet != false || dataSet.length > 0) 
	for (var i in dataSet) 
	{
		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			sendBatchTimeoutEmail() ;
			break;
		}
		
		//aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" + " expiration date:" + queryResult.expirationDate);
        ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
		var queryResult = dataSet[i];
		var capIdResult = aa.cap.getCapID(queryResult.customID);

		if ( ! capIdResult.getSuccess())
		{
			ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var capId = capIdResult.getOutput();
		capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();
		var capResult = aa.cap.getCap(capId);
		var cap = capResult.getOutput();
		var appTypeResult = cap.getCapType();
		var capTypeArray = appTypeResult.toString().split("/");
		var b1PerType = capTypeArray[1];		
		var appTypeString = appTypeResult.toString();

		if ( ! capResult.getSuccess())
		{
			ELPLogging.debug("getCap error: " + capIdResult.getErrorMessage());
			emailText = emailText + "getCap error: " + capIdResult.getErrorMessage() + br;
			continue;
		}
		
			//Info for each License record 
			ELPLogging.debug("/*_________________________________________________*/");
			var altId=capId.getCustomID();
			var capStatus = cap.getCapStatus();
			//var appTypeArray = appTypeString.split("/");
						
			try
			{
				//Check if condition exists
				if (!appHasCondition(null, null, null, "Hold"))
				{
					//Get license expiration date
					//var lic = new licenseObject(altId, capId);
					//var expDate = lic.b1ExpDate;
					//var expDateString = expDate.toString();
					//var expDateObj = new Date(Date.parse(expDateString));
					//logDebug("License expiration date:" + expDateObj + " Today's date:" + currentTime);
					
					//Compare with today's date. If greater or equal, change workflow status
					//if(currentTime >= expDateObj)
					//{
						ELPLogging.debug("Updating License: " + altId + " with License Status:" + capStatus);
						// Change workflow task status and cap status to Expired
						if(b1PerType == "Retail License")
							taskName = "Retail License";
						else
							taskName = "License";
						
					
						//Expiration status should be Expired  EPLACE-4368
						b1ExpResult = aa.expiration.getLicensesByCapID(capId);
                        this.b1Exp = b1ExpResult.getOutput();
						ELPLogging.debug("Before updating the status"+this.b1Exp.getExpStatus());
                        this.b1Exp.setExpStatus("Expired");
						aa.expiration.editB1Expiration(b1Exp.getB1Expiration());
						ELPLogging.debug("updated expiration status to Expired"+this.b1Exp.getExpStatus());
						
						ELPLogging.debug("Updating Task - Task Name = " + taskName + " task Status = " + updateTaskStatus);
						updateTask(taskName, updateTaskStatus, "Set status to " + updateTaskStatus + " by system batch job", "Set status to " + updateTaskStatus + " by system batch job", "", capId);
						addToLicenseSyncSet(capId);
						capCount++;

						// Updating the status of Reference License to "Expired". Changed for defect 1693
						var newLic = getRefLicenseProf(altId);
						if(newLic)
						{
							newLic.setPolicy("Expired");                 
							newLic.setWcExempt("N");
							var myResult = aa.licenseScript.editRefLicenseProf(newLic);
						}
		          //}
				}//apphascondition
			} //end try
			catch (e)
			{
				ELPLogging.debug(e.message);
			}				
    }//end for
	
	ELPLogging.debug("Licenses Processed: " + capCount); 
	emailText = emailText + "Licenses Processed: " + capCount + br;
	ELPLogging.debug("Licenses with HOLD condition: " + condCapCount);
	emailText = emailText + "Licenses with HOLD condition: " + condCapCount + br;
	
    //dataSet.close();
}//end mainProcess
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_ABCC_LICENSE_RENEWAL" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_ABCC_LICENSE_RENEWAL. " + ex.message);
   
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
	if (licenseRenewalProcedure != null) {
		//licenseRenewalProcedure.close();
	}
	if (databaseConnection != null) {
		//databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) {
		dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("     dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);
		
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_EXPIRE_LICENSE_JAN_1st completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_EXPIRE_LICENSE_JAN_1st completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_EXPIRE_LICENSE_JAN_1st completed with no errors.");
			ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_EXPIRE_LICENSE_JAN_1st completed with no errors.");				
		}
	}

}

if (emailAddress.length > 0 && renewalCapCount > 0) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	ELPLogging.debug("Email sent to " + emailAddress);
} else {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, "Batch Job Ran Successfully, No Renewal Records Found.");
	ELPLogging.debug("Email sent to " + emailAddress);
}   

aa.print(ELPLogging.toString());

//##########External functions###################
//###################Function getparam

function getParam(pParamName) //gets parameter value and logs message showing param value
	{
	var ret = "" + aa.env.getValue(pParamName);	
	//logMessage("PARAMETER", pParamName+" = "+ret);
	return ret;
	}

//##################Function elapsed
function elapsed() 
{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000) 
}
//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection){
var sql = "select b.SERV_PROV_CODE,b.B1_PER_ID1, b.B1_PER_ID2, b.B1_PER_ID3, b.B1_PER_GROUP, b.b1_per_type, b.b1_per_sub_type, b.b1_alt_id, b.B1_APPL_STATUS, e.EXPIRATION_STATUS, e.EXPIRATION_DATE from B1PERMIT b \
left join B1_EXPIRATION e \
on b.B1_PER_ID1 = e.B1_PER_ID1 \
and b.B1_PER_ID2 = e.B1_PER_ID2 \
and b.B1_PER_ID3 = e.B1_PER_ID3 \
and b.SERV_PROV_CODE = e.SERV_PROV_CODE \
and b.REC_STATUS = 'A' \
where b.B1_PER_CATEGORY = 'License' \
and b.B1_APPL_STATUS = 'Ready for Renewal'\
and e.EXPIRATION_STATUS = 'About to Expire'\
and (b.b1_per_type =  '" +emseParameters.LICENSE_TYPE+"' OR '" +emseParameters.LICENSE_TYPE+"' IS NULL) \
and (b.b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL) \
and (e.EXPIRATION_DATE) >= TO_DATE('" +aa.util.formatDate(emseParameters.EXPIRATION_STARTDATE, "MM/dd/yyyy")+ "','mm/dd/yyyy') \
and (e.EXPIRATION_DATE) < TO_DATE('" +aa.util.formatDate(emseParameters.EXPIRATION_ENDDATE, "MM/dd/YYYY")+ "','mm/dd/yyyy') + 1 \
order by e.EXPIRATION_DATE asc";


	
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

