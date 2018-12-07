/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_LAPSED_LATE_FEE Trigger : Batch
 |
 | - A license that is not renewed by its renewal date is considered Lapsed.
 | - The script will apply a late fee to the TMP renewal records for the Lapsed licenses.
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

//showDebug = 3;
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
var licProfCapCount = 0;
var lateFeeCount = 0;
var lateFeeNotAdded = 0;

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
var emailAddress = lookup("BATCH_STATUS_EMAIL", "LAPSED LATE FEE"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	logDebug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");
	
var emailAddress2 = getParam("emailAddress"); // This will be secondary email (as CC) set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");

//var licenseTypeParam = "Electricians"//getParam("LicenseType");//
//var licenseSubtypeParam = "Journeyman Electrician"//getParam("LicenseSubType");//

 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryLapsedLateFeeLicenses",\
					"procedure":{\
						"name":"ELP_SP_LAPSED_LATE_FEE_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"},\
														 {"source":"RESULT","name":"dayPastExpDate","parameterType":"OUT","property":"DAYS_PAST_EXP_DATE","type":"INTEGER"},\
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
	var lapsedLicenseLateFeeProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		if (supplementalConfiguration.tag == "queryLapsedLateFeeLicenses")
		{
			 var lapsedLicenseLateFeeProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
		}
	}
	if (lapsedLicenseLateFeeProcedure == null)
	{
		var message = "Cannot find procedure queryLapsedLateFeeLicenses";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryLapsedLateFeeLicenses: " + supplementalConfiguration.procedure.name);

	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	lapsedLicenseLateFeeProcedure.prepareStatement();
	var inputParameters = lapsedLicenseLateFeeProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};

	if ( (licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "" ) && 
	     (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ) )
	{
		logDebugAndEmail("License Type not set via parameter. Processing all LAPSED Licenses."); 
	}	
	if ((licenseTypeParam != null && licenseTypeParam != "undefined" && licenseTypeParam != "" ) && 
	(licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ))
	{
		logDebugAndEmail("License SubType not set via parameter. Processing LAPSED Licenses by Board = "+ licenseTypeParam + ".");
	}
		
	emseParameters.LICENSE_TYPE = licenseTypeParam;
	emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;
	emseParameters.AGENCY = "DPL";

	//lapsedLicenseLateFeeProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("InputParameters for Query: ", inputParameters);
	//lapsedLicenseLateFeeProcedure.setParameters(inputParameters);

	//var dataSet = lapsedLicenseLateFeeProcedure.queryProcedure();
	var dataSet = getRecordsArray(emseParameters);
		
	if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
			ObjKeyRename(dataSet[i], {"DAYS_PAST_EXP_DATE":"dayPastExpDate"});
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
		//aa.print(queryResult.customID + " " + queryResult.dayPastExpDate);
		//continue;

		ELPLogging.debug(queryResult.customID );
		capIdResult = aa.cap.getCapID(queryResult.customID);
		if ( ! capIdResult.getSuccess())
		{
			logDebug("getCapID error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var capId = capIdResult.getOutput();
		capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

		var capResult = aa.cap.getCap(capId);
		if ( ! capResult.getSuccess())
		{
			logDebug("getCap error: " + capIdResult.getErrorMessage());
			continue;
		}
		
		var cap = capResult.getOutput();
		var altId = capId.getCustomID();
		var capStatus = cap.getCapStatus();
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString();
		var appTypeArray = appTypeString.split("/");
		var dayPastExpDate = queryResult.dayPastExpDate;
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
		
		// Most license type will have late fee applied based on number of days specified in standard choice: LAPSED_LATE_FEE_GRACE_PERIOD
		// But is some cases it will be different. Special cases should be handled by this function:
		var readyForLateFee = isReadyForLateFee(capId, dayPastExpDate);
		if(!readyForLateFee)
		{
			logDebugAndEmail( altId + " not ready for late fee. Days past expiration date:" + dayPastExpDate );
			continue;
		}
			
		/*---------------------------------------------------------------------------------/
		Added by Sameer for Defect 1424 - START
		------------------------------------------------------------------------------------*/
		//1. Get Type class
		var typeClass = getAppSpecific("Type Class", capId);
		logDebug("Type class: " + typeClass);

		//2. Create the Fee value for Standard choice search
                 // JIRA 2042 : commenting the typeclass if condition as it is not in use.
		//if(typeClass)
		{
			var feeValue = boardCode;  //"|" + typeClass;
			logDebug("FeeValue: " + feeValue);	

			//3. Get the fee code and fee schedule from Standard choice
			var feeCode;
			var feeSchedule;
			var feeInfo = lookup("Renewal_Late_Fees", feeValue);	
			if (feeInfo)
			{
				feeInfo = feeInfo.toString();
				var fee =new Array();
				fee = feeInfo.split("/");
				feeCode = fee[0];
				feeSchedule = fee[1];
				//ELPLogging.debug("From Standard choice: " + feeCode + " "+ feeSchedule);
			}
			else 
			{
				ELPLogging.debug("FeeValue " +  feeValue + " not found in Renewal_Late_Fees Standard choice");
				lateFeeNotAdded++;
				continue;
			}
			

			//4. Get the Renewal cap associated with License
			var result = aa.cap.getProjectByMasterID(capId, "Renewal", null);
			if(result.getSuccess())
			{
				projectScriptModels = result.getOutput();

				for(it in projectScriptModels)
				{
					var projectScriptModel = projectScriptModels[it];
					var renCapId = projectScriptModel.getCapID()

					//5. Check if the Cap is partial or complete, If partial then add late fee
					var renCapResult = aa.cap.getCap(renCapId);
					if(renCapResult.getSuccess())
					{
						var capScriptModel = renCapResult.getOutput();
						//ELPLogging.debug("Complete Cap: " + renCapId + " " + capScriptModel.isCompleteCap());
						if(!capScriptModel.isCompleteCap())
						{
							//6. If fee exists, then update. Else add
							if (feeCode && feeSchedule)
							{
								tmpCapId = capId;
								capId = renCapId;
								if (!feeExists(feeCode)) 
								{
									addFee(feeCode, feeSchedule, "STANDARD", 1, "Y", renCapId);
									logDebugAndEmail("Fee Added on Renewal " + renCapId + " for License " + altId );
									lateFeeCount++;
								}
								capId = tmpCapId;
							}
						}
					}
				}	
			}
		}	
		/*---------------------------------------------------------------------------------/
		Added by Sameer for Defect 1424 - END
		------------------------------------------------------------------------------------*/	
	} // end for loop over the Oracle Data set returned.
   
	logDebugAndEmail( "Lapsed  Licenses Processed: " + capCount);
  logDebugAndEmail( "Late Fee Added: " + lateFeeCount);
	logDebugAndEmail( "Late Fee Not Defined: " + lateFeeNotAdded);
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_LAPSED_LATE_FEE" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_LAPSED_LATE_FEE. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_LAPSED_LATE_FEE " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (lapsedLicenseLateFeeProcedure != null) {
		lapsedLicenseLateFeeProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) {
		
		if (!timeExpired) {
			dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
			aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
			//ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
			ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

			if (ELPLogging.getErrorCount() > 0) {
				aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LAPSED_LATE_FEE completed with " + ELPLogging.getErrorCount() + " errors.");
				logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LAPSED_LATE_FEE completed with " + ELPLogging.getErrorCount() + " errors.");
			} else {
				aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LAPSED_LATE_FEE completed with no errors.");
				logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LAPSED_LATE_FEE completed with no errors.");
			}
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
   logDebug("PARAMETER " + pParamName + " = " + ret);
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

function isReadyForLateFee(pCapId, pDayPastExpDate)
{
	//Sagar: Fix for PROD defect 11616 : DPL_PROD_EN_EN license types missing correct late fee logic in late fee job
	if((appMatch("License/Engineers and Land Surveyors/Professional Land Surveyor/License", pCapId) && pDayPastExpDate < 31) || appMatch("License/Engineers and Land Surveyors/Professional Engineer/License", pCapId) && pDayPastExpDate < 31)
		return false;	
	
	return true;	
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
       tmp.b1_alt_id TMP_RENEWAL, \
       TMP.b1_appl_class, \
       s.value_desc AS RENEWALCYCLE, \
       f.value_desc AS GRACE_PERIOD, \
       Floor(Trunc(sysdate) - e.expiration_date) AS DAYS_PAST_EXP_DATE \
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
		       LEFT JOIN rbizdomain_value F \
		              ON F.serv_prov_code = B.serv_prov_code \
		                 AND F.bizdomain_value = 'DAYS' \
		                 AND F.bizdomain = 'LAPSED_LATE_FEE_GRACE_PERIOD' \
		       LEFT JOIN accela.xapp2ref r \
		              ON r.b1_master_id1 = b.b1_per_id1 \
		                 AND r.b1_master_id2 = b.b1_per_id2 \
		                 AND r.b1_master_id3 = b.b1_per_id3 \
		                 AND R.master_serv_prov_code = b.serv_prov_code \
		                 AND r.b1_status = 'Incomplete' \
		       LEFT JOIN b1permit tmp \
		              ON tmp.b1_per_id1 = r.b1_per_id1 \
		                 AND tmp.b1_per_id2 = r.b1_per_id2 \
		                 AND tmp.b1_per_id3 = r.b1_per_id3 \
		                 AND tmp.serv_prov_code = r.serv_prov_code \
		                 AND tmp.b1_appl_class != 'COMPLETE' \
		WHERE  b.serv_prov_code = 'DPL' \
		       AND b.b1_per_category = 'License' \
		       AND ( b.b1_per_type = '" +emseParameters.LICENSE_TYPE+"' \
		              OR '" +emseParameters.LICENSE_TYPE+"' IS NULL ) \
		       AND ( b.b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' \
		              OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL ) \
		       AND b.b1_appl_status = 'Expired' \
		       AND b.rec_status = 'A' \
		       AND e.expiration_date + To_number(f.value_desc) < sysdate \
		       AND W.task = 'License' \
		       AND W.status = 'Lapsed' \
		       AND TMP.rec_status = 'A' \
		       AND TMP.b1_alt_id IS NOT NULL"; 

			
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
