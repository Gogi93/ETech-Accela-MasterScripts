/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_OS_RENEWAL_REMINDER Trigger : Batch
 | Trigger : Batch
 | @Author : Sagar Cheke
 | @Date   : 07/13/2016
 | - Identifies licenses expiring within 45 days (6 weeks out) that have not initiated the renewal process 
 |   and the Licensed Individual or Business contact preferred communication is set to email.
 | - Licenses with an associated TMP renewal record are identified as not having initiated the renewal process.
 | - If the preferred communication is email for the Licensed Individual or Business contact, licences records 
 |   are placed in a set for printing of the renewal notification with coupon.
 | - In addition a reminder email is sent with a renewal notification without coupon.
 |
 | 1. For Sales Rep Renewal Notice to be sent 90 days prior to the expiration date.
 | 2. For OS Renewal Notice to be sent 120 days prior to the expiration date.
 | 
 | Batch Requirements :
 | - None
 |
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0;

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
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var reminderEmailCapCount = 0;
var reminderPrintCapCount = 0;
var renewalSetName = "OS|RENEWAL_REMINDER";
var emailTemplate = "RENEWAL_REMINDER_EMAIL_NOTIFICATION";
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
 
var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");

var emailAddress = lookup("BATCH_STATUS_EMAIL", "OS RENEWAL REMINDER"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	ELPLogging.debug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var lkupReport = String(lookup("LKUP_SetName_To_Correspondence", renewalSetName));
var reportToBe;
if (lkupReport == 'undefined') {
	logDebug("**WARNING Set Name: " + renewalSetName + " is not tied to a correspondence.  PLease see administrator for help.");
}
else{
   reportToBe = lkupReport.split("|");
}

 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryRenewalReminder",\
					"procedure":{\
						"name":"ELP_SP_REN_OS_REMINDER_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"start_range","parameterType":"OUT","property":"START_RANGE","type":"DATE"},\
														 {"source":"RESULT","name":"end_range","parameterType":"OUT","property":"END_RANGE","type":"DATE"},\
														 {"source":"RESULT","name":"expirationDate","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try
{

	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();
	 
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
	ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);	
	logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);
	
	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var licenseRenewalProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryRenewalReminder")
		{
			 var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (licenseRenewalProcedure == null)
	{
		var message = "Cannot find procedure queryRenewalReminder";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryRenewalReminder: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	licenseRenewalProcedure.prepareStatement();
	var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	
	emseParameters.AGENCY = "DPL";
	emseParameters.licensePerType = licenseTypeParam;
	emseParameters.licensePerSubType = licenseSubtypeParam;

	licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("inputParameters for Query", inputParameters);
	licenseRenewalProcedure.setParameters(inputParameters);

	var firstRec = true;
	//var dataSet = licenseRenewalProcedure.queryProcedure();
	var dataSet = getRecordsArray(emseParameters);
	
	//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
	for (var i in dataSet)
	{
		ObjKeyRename(dataSet[i], {"B1_ALT_ID": "customID"});
		var queryResult = dataSet[i];
		
		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			logMessage("WARNING", "A script time-out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			logDebugAndEmail("WARNING: A script time-out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}
        
        ELPLogging.debug ("Processing record # " + queryResult.customID);
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
		var boardCode = altId.split("-")[1];

		var boardName = lookup("BOARD_CODE_INT_RECORD_TYPE", boardCode);
		if( boardName == null || boardName == "" || boardName == "undefined")
		{
			logDebugAndEmail("Unable to look up Board Name for License: "  + altId + ". Verify BOARD_CODE_INT_RECORD_TYPE standard choice contains board code for: " + boardCode );
			continue;		
		}
		
		// This is check to see if this license type should be processed by batch
		var processBoard = lookup("DPL_BOARDS", appTypeArray[1]);
		if( processBoard == null || processBoard == "" || processBoard == "undefined")
		{
			logDebugAndEmail("Unable to look up Board Code for License: "  + altId + ". Verify DPL_BOARDS standard choice contains board code for: " + appTypeArray[1] );
			continue;		
		}
		
		capCount++;
		
		//Check for communication method for Business or Licensed Individual contact type only
		var co = getContactObjsNew(capId);
		var contactEmail = "";
		for (i in co) 
		{
            var pc = null;
			var po = co[i].people;
			var contactType = po.getContactType();
			if(contactType == "Licensed Individual" || contactType  == "Occupational School")
			{
				pc = getContactPreferredChannelDesc(po.getPreferredChannel());
				ELPLogging.debug(po.getContactName() + " - " + po.getContactType() + " - PreferredChannel:" + pc);

				if( pc == "Email")
				{
					contactEmail = po.getEmail();
				}
			} 


		if (pc == "Email") //Preferred channel is email
		{
			// Add to Renewal Print set to generate Renewal with Coupon Notice
			//callReport(renewalSetName, false, true, "DPL Renewal App Print Set");
			if(licenseSubtypeParam == "Sales Representative")
			{
				callReport(reportToBe[0], false, true, "DPL Renewal App OS Print Set");
			}
			else if(licenseTypeParam == "Occupational Schools" && licenseSubtypeParam == "School")
			{
				callReport("OS Renewal Letter", false, true, "DPL Renewal App OS Print Set");
			}
			reminderPrintCapCount++
			// Send email Reminder with Renewal without Coupon Notice
			var emailParameters = getEmailTemplateParameters(capId);
            getContactParams4Notification(emailParameters, "Occupational School");  
             
             if (contactType == 'Occupational School')
             {
             
                addParameter(emailParameters, "$$Licensee_Name$$", emailParameters.get("$$occupational schoolBusinesName$$"));
                addParameter(emailParameters, "$$FULL_NAME$$", emailParameters.get("$$occupational schoolBusinesName$$"));
             }
			var reportParameterHashMap = aa.util.newHashMap();
			reportParameterHashMap.put("ALT_ID", String(capId.getCustomID()));
			
			ELPLogging.debug("reportToBe : "+reportToBe[0]);
			if(licenseSubtypeParam == "Sales Representative")
			{
				if (!generateReportSaveAndEmail(reportToBe[0], reportParameterHashMap, emailTemplate, emailParameters, contactEmail, capId)) {
					ELPLogging.debug("**WARNING Report not generated or sent for " + contactEmail);
				}			
				else{
					ELPLogging.debug("Renewal reminder email sent to mailid:"+contactEmail +"for record:"+String(capId.getCustomID()));
					ELPLogging.debug("ReminderCounter:"+reminderEmailCapCount+1);
					reminderEmailCapCount++;
				}
			}
			else
			{
				if (!generateReportSaveAndEmail("OS Renewal Letter", reportParameterHashMap, emailTemplate, emailParameters, contactEmail, capId)) {
					ELPLogging.debug("**WARNING Report not generated or sent for " + contactEmail);
				}			
				else{
					ELPLogging.debug("Renewal reminder email sent to mailid:"+contactEmail +"for record:"+String(capId.getCustomID()));
					ELPLogging.debug("ReminderCounter:"+reminderEmailCapCount+1);
					reminderEmailCapCount++;
				}
			}
		}
				
		}
	} // end for loop over the Oracle Data set returned.

	logDebugAndEmail("Total Licenses Approaching Expiration: " + capCount);
	logDebugAndEmail("Licenses with communication channel set to email: " + reminderPrintCapCount);	
	logDebugAndEmail("Licenses Reminder Email sent : " + reminderEmailCapCount);
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_OS_RENEWAL_REMINDER" + ex.message);
   ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_OS_RENEWAL_REMINDER. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_OS_RENEWAL_REMINDER " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_OS_RENEWAL_REMINDER completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_OS_RENEWAL_REMINDER completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_OS_RENEWAL_REMINDER completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_OS_RENEWAL_REMINDER completed with no errors.");					
		}
	}

	aa.print(ELPLogging.toString());
}

if (emailAddress)
{
if (emailAddress.length > 0 ) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
}
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

function getContactObjsNew(itemCap) // optional typeToLoad, optional return only one instead of Array?
{
	var typesToLoad = false;
	if (arguments.length == 2)
		typesToLoad = arguments[1];
	var capContactArray = new Array();
	var cArray = new Array();
	if (itemCap.getClass().toString().equals("com.accela.aa.aamain.cap.CapModel")) { // page flow script
		//if (!cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") {
		if (cap.getApplicantModel()) {
			capContactArray[0] = cap.getApplicantModel();
		}
		if (cap.getContactsGroup().size() > 0) {
			var capContactAddArray = cap.getContactsGroup().toArray();
			for (ccaa in capContactAddArray)
				capContactArray.push(capContactAddArray[ccaa]);
		}
	} else {
		var capContactResult = aa.people.getCapContactByCapID(itemCap);
		if (capContactResult.getSuccess()) {
			var capContactArray = capContactResult.getOutput();
		}
	}
	if (capContactArray) {
		for (var yy in capContactArray) {
			if (!typesToLoad || exists(capContactArray[yy].getPeople().contactType, typesToLoad)) {
				cArray.push(new contactObj(capContactArray[yy]));
			}
		}
	}
	ELPLogging.debug("getContactObj returned " + cArray.length + " contactObj(s)");
	return cArray;
}
function getRecordsArray(emseParameters){
	var sql = 
			"select b.SERV_PROV_CODE,b.B1_PER_ID1, b.B1_PER_ID2, b.B1_PER_ID3, \
			b.B1_PER_GROUP, b.b1_per_type, b.b1_per_sub_type, b.b1_per_category, \
			b.b1_alt_id, b.B1_APPL_STATUS, \
			e.EXPIRATION_STATUS, e.EXPIRATION_DATE, TRUNC(Sysdate)-e.EXPIRATION_DATE as DAYS_TO_EXPIRE, \
			TRUNC(Sysdate+45, 'IW') as START_RANGE, TRUNC(Sysdate +45,'IW') + 6 as END_RANGE \
			from B1PERMIT b \
			left join B1_EXPIRATION e \
			on b.B1_PER_ID1 = e.B1_PER_ID1 \
			and b.B1_PER_ID2 = e.B1_PER_ID2 \
			and b.B1_PER_ID3 = e.B1_PER_ID3 \
			and b.SERV_PROV_CODE = e.SERV_PROV_CODE \
			and b.REC_STATUS = 'A' \
			where  b.SERV_PROV_CODE  = 'DPL' \
			and b.B1_PER_CATEGORY in ('License', 'Approval') \
			and b.B1_APPL_STATUS = 'Current' \
			and b.B1_PER_TYPE = 'Occupational Schools' \
			and e.EXPIRATION_STATUS = 'About to Expire' \
			AND e.EXPIRATION_DATE >= TRUNC(Sysdate + 45,'IW')  -- NOT PASSED EXPIRATION DATE \
			and E.EXPIRATION_DATE <= TRUNC(Sysdate + 45 ,'IW') + 6 \
			and  exists (select 1 from accela.xapp2ref link, accela.b1permit p2 \
			where link.b1_master_id1 = b.b1_per_id1 \
			and link.b1_master_id2 = b.b1_per_id2 \
			and link.b1_master_id3 = b.b1_per_id3 \
			and link.b1_per_id1 = p2.b1_per_id1 \
			and link.b1_per_id2 = p2.b1_per_id2 \
			and link.b1_per_id3 = p2.b1_per_id3 \
			and p2.b1_per_category = 'Renewal' \
			and    p2.rec_status = 'A' \
			and    p2.b1_appl_status is null) \
			and b.B1_PER_TYPE = '" + emseParameters.licensePerType + "' \
			and b.B1_PER_SUB_TYPE = '" + emseParameters.licensePerSubType + "'";

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