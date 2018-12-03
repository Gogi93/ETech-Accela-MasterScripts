// JavaScript Document
//SQL_BATCH_ABCC_RENEWAL.js
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
					"tag":"queryLicenseRenewals",\
					"procedure":{\
						"name":"ELP_SP_READYTORENEW_CNV_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"expirationDate","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"AGENCY","parameterType":"IN","property":"AGENCY","type":"STRING"},\
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
   throw returnException;
}

/* *
 * User Parameters  Begin
 * */
var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");
var fromDtParam = getParam("FromDate");
var toDateParam = getParam("ToDate");
 
var emailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL"); // This email will be set by standard choice
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
		if (supplementalConfiguration.tag == "queryLicenseRenewals")
		{
			 var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (licenseRenewalProcedure == null)
	{
		var message = "Cannot find procedure queryLicenseRenewals";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryLicenseRenewals: " + supplementalConfiguration.procedure.name);

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
		var expdate = "12/31" +"/"+ (year-1);
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

		//capIdResult = aa.cap.getCapID(queryResult.customID);
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
		ELPLogging.debug(capId);
		var capResult = aa.cap.getCap(capId);
		if ( ! capResult.getSuccess())
		{
			ELPLogging.debug("getCap error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var cap = capResult.getOutput();
		var altId = capId.getCustomID();
		var capStatus = cap.getCapStatus();
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString();
		var appTypeArray = appTypeString.split("/");
		capCount++;
		aa.print(capCount);
		aa.print(altId);
		if ( ! appHasCondition(null, null, null, "Hold"))
		{
			var lic = new licenseObject(altId, capId);
			
			ELPLogging.debug("Updating Cap ID: " + altId);
									
			// Create temp renewal record (for ACA users)               
			createResult = aa.cap.createRenewalRecord(capId);

			if (!createResult.getSuccess())
			{
				ELPLogging.debug("Could not create renewal record : " + createResult.getErrorMessage());
				existRenewalCount++;
			}
			else
			{
				renewalCapId = createResult.getOutput();
				renewalCap = aa.cap.getCap(renewalCapId).getOutput();
				//Added by Evan Cai 10-22-2017 for EPLACE-3178
				setSpecialText(renewalCapId);
				if (renewalCap.isCompleteCap())
				{
					ELPLogging.debug(altId + ": Renewal Record already exists : " + renewalCapId.getCustomID());
					existRenewalCount++;
				}
				else
				{
					ELPLogging.debug(altId + ": Created Renewal Record " + renewalCapId.getCustomID());

					aa.cap.updateAccessByACA(renewalCapId, "N");

					AInfo = new Array();
					AInfo = loadAppSpecificNew(AInfo, capId);

					copyAppSpecific(renewalCapId);                                   							

					callReport("RENEWAL_NOTIFICATION",false,true);
					renewalCapCount++;
				}
			}			
		}
		else
			condCapCount++;
			
	} // end for loop over the Oracle Data set returned.
   
	ELPLogging.debug("Licenses Processed: " + capCount); 
	emailText = emailText + "Licenses Processed: " + capCount + br; 
	ELPLogging.debug("Licenses with HOLD condition: " + condCapCount);
	emailText = emailText + "Licenses with HOLD condition: " + condCapCount + br;
	ELPLogging.debug("TMP Renewal records created: " + renewalCapCount);
	emailText = emailText + "TMP Renewal records created: " + renewalCapCount + br;
	ELPLogging.debug("Licenses with existing TMP Renewal records or unable to create: " + existRenewalCount);	
	emailText = emailText + "Licenses with existing TMP Renewal records or unable to create: " + existRenewalCount + br;	
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_ABCC_LICENSE_RENEWAL" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_ABCC_LICENSE_RENEWAL. " + ex.message);
   emailText = emailText + "Error executing SQL_BATCH_ABCC_LICENSE_RENEWAL. " + ex.message + br;
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with " + ELPLogging.getErrorCount() + " errors." + br;
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with no errors.");
			ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with no errors.");				
			emailText = emailText + "SQL_BATCH_ABCC_LICENSE_RENEWAL completed with no errors." + br;
		}
	}
}

if (emailAddress.length > 0 && renewalCapCount > 0) {
	aa.sendMail("Noreply@elicensing.state.ma.us", emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	ELPLogging.debug("Email sent to " + emailAddress);
} else {
	aa.sendMail("Noreply@elicensing.state.ma.us", emailAddress, emailAddress2, "Result: " + batchJobName, "Batch Job Ran Successfully, No Renewal Records Found.");
	ELPLogging.debug("Email sent to " + emailAddress);
}

aa.print(ELPLogging.toString());

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Internal Functions and Classes (Used by this script)
 / ------------------------------------------------------------------------------------------------------ */
function loadAppSpecificNew(thisArr)
{
   //
   // Returns an associative array of App Specific Info
   // Optional second parameter, cap ID to load from
   //

   var itemCap = capId;
   if (arguments.length == 2) itemCap = arguments[1];
   // use cap ID specified in args

   var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
   if (appSpecInfoResult.getSuccess())
   {
      var fAppSpecInfoObj = appSpecInfoResult.getOutput();

      for (loopk in fAppSpecInfoObj)
      {
         if (useAppSpecificGroupName)
         thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
         else
         thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
      }
      return thisArr;
   }
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
   var ret = "" + aa.env.getValue(pParamName);
  // logDebug("PARAMETER " + pParamName + " = " + ret);
   return ret;
}

function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

//SW ADDED Helper functions
function getRecordsArray(emseParameters,databaseConnection){
var sql = "select b.SERV_PROV_CODE,b.B1_PER_ID1, b.B1_PER_ID2, b.B1_PER_ID3, b.B1_PER_GROUP, b.b1_per_type, b.b1_per_sub_type, b.B1_ALT_ID, b.B1_APPL_STATUS, e.EXPIRATION_STATUS, e.EXPIRATION_DATE \
from B1PERMIT b \
left join B1_EXPIRATION e \
on b.B1_PER_ID1 = e.B1_PER_ID1 \
and b.B1_PER_ID2 = e.B1_PER_ID2 \
and b.B1_PER_ID3 = e.B1_PER_ID3 \
and b.SERV_PROV_CODE = e.SERV_PROV_CODE \
and b.REC_STATUS = 'A' \
where  b.SERV_PROV_CODE  = 'ABCC' \
and b.B1_PER_CATEGORY = 'License' \
and b.B1_APPL_STATUS = 'Expired' \
and e.EXPIRATION_STATUS = 'Expired' \
and (b.b1_per_type =  '" +emseParameters.LICENSE_TYPE+"' OR '" +emseParameters.LICENSE_TYPE+"' IS NULL) \
and (b.b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL) \
and (e.EXPIRATION_DATE) >= TO_DATE('" +aa.util.formatDate(emseParameters.EXPIRATION_STARTDATE, "MM/dd/yyyy")+ "','mm/dd/yyyy') \
and (e.EXPIRATION_DATE) < TO_DATE('" +aa.util.formatDate(emseParameters.EXPIRATION_ENDDATE, "MM/dd/YYYY")+ "','mm/dd/yyyy') + 1\
order by EXPIRATION_DATE,  b.b1_per_type asc";

	
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

