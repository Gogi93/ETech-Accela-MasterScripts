/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_EXPIRED_LICENSE Trigger : Batch
 |
 | - A license that has not been renewed within one cycle is considered to be expired. Renewal cycles differ by board.
 | - This script will change the workflow task status to Expired and the expiration status to Inactive 
 |   for those licenses that are not renewed within the renewal cycle.
 | - License is be added to the SYNCSET
 | 
 | Batch Requirements :
 | - None
 | Batch Options:
 | - NO PARAMS - All Licenses Types
 | - LicenseType - By Board
 | - LicenseType and LicenseSubType - By License Type
 | 	
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
var holdCondCapCount = 0;
var licProfCapCount = 0;

var useAppSpecificGroupName = false;
var AInfo = new Array(); //Used to collect ASI info
	
var emailText = "";
var publicUser = "";

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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "EXPIRED"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	aa.print("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");
	
var emailAddress2 = getParam("emailAddress"); // This will be secondary email (as CC) set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");

//var licenseTypeParam = "Electricians";
//var licenseSubtypeParam = "Journeyman Electrician";

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryExpiredLicenses",\
					"procedure":{\
						"name":"ELP_SP_EXPIRED_LICENSES_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"expirationDate","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_SUBTYPE","parameterType":"IN","property":"LICENSE_SUBTYPE","type":"STRING"},\
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

	// Create a connection to the Staging Table Database
	var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
	/* *
	* Obtain Stored Procedure for queryECBViolation into Staging Table
	*/
	var expiredLicenseProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryExpiredLicenses")
		{
			 var expiredLicenseProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (expiredLicenseProcedure == null)
	{
		var message = "Cannot find procedure queryExpiredLicenses";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryExpiredLicenses: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	expiredLicenseProcedure.prepareStatement();
	var inputParameters = expiredLicenseProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	 
	if ( (licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "" ) && 
	     (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ) )
	{
		logDebugAndEmail("License Type not set via parameter. Processing ALL EXPIRED LAPSED Licenses."); 
	}
		
	if ((licenseTypeParam != null && licenseTypeParam != "undefined" && licenseTypeParam != "" ) && 
	(licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ))
	{
		logDebugAndEmail("License SubType not set via parameter. Processing EXPIRED Licenses by Board = "+ licenseTypeParam);
	}

	emseParameters.LICENSE_TYPE = licenseTypeParam;
	emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;

	expiredLicenseProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("InputParameters for Query", inputParameters);
	expiredLicenseProcedure.setParameters(inputParameters);

	//var dataSet = expiredLicenseProcedure.queryProcedure();

	var dataSet = getRecordsArray(emseParameters);
	if (dataSet != false || dataSet.length > 0) 
	for (var i in dataSet) {
		ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
		var queryResult = dataSet[i];

	//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){
		if (elapsed() > maxSeconds) // Only continue if time hasn't expired
		{
			logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			logDebugAndEmail("A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
			timeExpired = true;
			break;
		}

		//aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" + " expiration date:" + queryResult.expirationDate);
		//aa.print("My Test >> "+queryResult.customID);
		//continue;

		capIdResult = aa.cap.getCapID(queryResult.customID);
		if ( ! capIdResult.getSuccess())
		{
			aa.print("getCapID error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var capId = capIdResult.getOutput();
		capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

		var capResult = aa.cap.getCap(capId);
		if ( ! capResult.getSuccess())
		{
			aa.print("getCap error: " + capIdResult.getErrorMessage());
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
		
//		if (! appHasCondition(null, null, null, "Hold"))
//		{
			var lic = new licenseObject(altId, capId);
			//updated for defect 10449
			var workflowResult = aa.workflow.getTasks(capId);
		    if (workflowResult.getSuccess())
		  	{
			    	wfObj = workflowResult.getOutput();
			    	for (i in wfObj)
			    { 
			      	var fTask = wfObj[i]; 
			      	var desc = fTask.getTaskDescription(); 
			      	var disp = fTask.getDisposition(); 
			      	var taskDate = fTask.getStatusDate();
					//Sagar : Fix for PROD Defect 13235 : DPL_PROD_SM_Records not updated to Expired / Expired
					//Sagar : Fix for PROD Defect 13447 : DPL_PROD_EN_Lapsed Licenses not Changing to Expired
					logDebug("desc : "+desc+" disp : "+disp);
			      	if(desc == "License" && disp == "Lapsed")
			      	{
						// Change work flow task status and cap status to Ready for Renewal
						var taskName = "License";
						var updateTaskStatus = "Expired";
						aa.print("Updating Task: Task Name = " + taskName + " task Status = " + updateTaskStatus);
						updateTask(taskName, updateTaskStatus, "Set status to " + updateTaskStatus + " by system batch job", "Set status to " + updateTaskStatus + " by system batch job", "", capId);
						capCount++;
			      	}
			    }   
		  	}
			//end defect 10449
			
			// Set expiration status to Inactive
            // adding condition for Script#159, "Do not change the renewal status on the license" for Cosmetology board. Added by tofek
			//Sagar : EPLACE-1058 : DPL_PROD_licensee able to renew on ACA and/or via lockbox after the Lapsed license period 
			//Sagar : EPLACE-604  : DPL_PROD_NU_Expired/expired NU license renewed online instead of submitting reinstatement
			/* if(processBoard != "HD"){
				lic.setStatus("Inactive");	//RTC#12553, debashish.barik		
			} */
			//Sagar : EPLACE-2029 : DPL_PROD_Accounting_Batch job updating HD records to expired/expired
            
            // JIRA 2773
            if ( appTypeArray[1] == 'Speech and Audiology' && (appTypeArray[2] == 'Audiologist' || appTypeArray[2] == 'Audiology Assistant' || appTypeArray[2] == 'Speech Language Pathologist' || appTypeArray[2] == 'Speech Language Pathology Asst'))
            {
                lic.setStatus("Expired");
            }
            else
            {
                lic.setStatus("Inactive");
            }
			
			var newLicAInfo = new Array();
			loadAppSpecific(newLicAInfo, capId);
			var asiTypeClass = newLicAInfo["Type Class"];                      
			aa.print("Type Class : " +asiTypeClass);

			if (asiTypeClass && asiTypeClass != null && asiTypeClass != "")
				newLicenseType = asiTypeClass;
			else
				newLicenseType = boardCode;



			var vLicType  = appTypeArray[1]+"/"+appTypeArray[2];
			//Fixes for defect 8319
			if(vLicType == 'Engineers and Land Surveyors/Temporary Permit')
			{
				aa.print("Processing EN-TP type records!");
				var newLic = getRefLicenseProf(altId);
			}
			else
			{
			var newLic = getRefLicenseProf(altId, boardCode, newLicenseType);
			}
			
			aa.print("License Professional: " +newLic);
			if (newLic)
			{
				aa.print("Updating existing Ref License Professional : " + newLic);								  
				newLic.setWcExempt("N");
				newLic.setPolicy("Expired");					

				var myResult = aa.licenseScript.editRefLicenseProf(newLic);

				if (myResult.getSuccess()) 
				{
					aa.print("Successfully added/updated License No. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
					
					// Add LP to SYNCSET
					//addTransLictoSet(capId);

					addToLicenseSyncSet4Batch(capId);

					licProfCapCount++;
				}
				else 
					aa.print("**ERROR: Can't create reference licence prof: " + myResult.getErrorMessage());
			} 
//		}
//		else
//		{
//			holdCondCapCount++;
//		}		
		
	} // end for loop over the Oracle Data set returned.
   
	logDebugAndEmail( "Expired licenses processed: " + capCount);
//	logDebugAndEmail( "Expired licenses with HOLD conditions:" + holdCondCapCount);
	logDebugAndEmail( "License professionals set to Expired:  " + licProfCapCount);
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_EXPIRED_LICENSE" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_EXPIRED_LICENSE. " + ex.message);
   
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
	if (expiredLicenseProcedure != null) {
		expiredLicenseProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_EXPIRED_LICENSE completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_EXPIRED_LICENSE completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_EXPIRED_LICENSE completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_EXPIRED_LICENSE completed with no errors.");	
		}
	}

	aa.print(ELPLogging.toString());
}
	

if (emailAddress.length > 0 ) {
	aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
}
/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Internal Functions and Classes (Used by this script)
 / ------------------------------------------------------------------------------------------------------ */
 function getParam(pParamName) // gets parameter value and logs message showing param value
{
   var ret = "" + aa.env.getValue(pParamName);
   aa.print("PARAMETER " + pParamName + " = " + ret);
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

function addToLicenseSyncSet4Batch(addToSetCapId) {
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = lookup("Lookup:LicenseSync", "SET_NAME");

	if (matches(setName, null, "", undefined)) setName = "SYNCSET";

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
			aa.print("doesExistInSync " + doesExistInSync);
			if (!doesExistInSync)
					aa.set.add(setName, addToSetCapId);
	}
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
       b.b1_per_category, \
       b.b1_alt_id, \
       b.b1_appl_status, \
       W.status AS TASKSTATUS, \
       e.expiration_status, \
       e.expiration_date, \
       s.value_desc AS RENEWALCYCLE \
	   FROM   b1permit b \
       LEFT JOIN b1_expiration e \
              ON b.b1_per_id1 = e.b1_per_id1 \
                 AND b.b1_per_id2 = e.b1_per_id2 \
                 AND b.b1_per_id3 = e.b1_per_id3 \
                 AND b.serv_prov_code = e.serv_prov_code \
       LEFT JOIN v_workflow W \
              ON B.serv_prov_code = W.agency_id \
                 AND B.b1_alt_id = W.record_id \
       LEFT JOIN rbizdomain_value S \
              ON S.bizdomain_value = B.b1_per_type \
                 AND S.serv_prov_code = B.serv_prov_code \
                 AND S.bizdomain = 'BOARD_RENEWAL_CYCLE' \
	   WHERE  b.serv_prov_code = 'DPL' \
       AND ( b.b1_per_type = '" +emseParameters.LICENSE_TYPE+"' \
              OR '" +emseParameters.LICENSE_TYPE+"' IS NULL ) \
       AND ( b.b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' \
              OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL ) \
       AND b.b1_per_category IN ( 'License', 'Approval', 'Permit' ) \
       AND b.b1_appl_status = 'Expired' \
       AND b.b1_app_type_alias NOT IN( 'Barber Shop License' ) \
       AND b.rec_status = 'A' \
       AND e.expiration_date + To_number(s.value_desc) < Trunc(sysdate) \
       AND W.task = 'License' \
       AND ( W.status = 'Lapsed' \
              OR ( W.status = 'Expired' \
                   AND e.expiration_status <> 'Inactive' \
                   AND b.b1_per_sub_type IN ( 'Occupational Therapist Asst', \
                                              'Athletic Trainer', \
                                              'Occupational Therapist', \
                                              'Physical Therapist' \
                                              ,'Physical Therapist Assistant' \
                                            ) \
                   AND b.b1_per_type = 'Allied Health' ) )"; 

			
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

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	return ret;
}