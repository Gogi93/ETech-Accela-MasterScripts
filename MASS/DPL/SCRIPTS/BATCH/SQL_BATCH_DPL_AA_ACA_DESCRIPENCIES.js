/* ------------------------------------------------------------------------------------------------------ /
| Program : SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES Trigger : Batch
|
| - 
| - This script does not generate the renewal notice.
|
| Batch Requirements :
| - None
| Batch Options:
| - NO PARAMS - All Licenses Types
| - LicenseType - By Board
| - LicenseType and LicenseSubType - By License Type
|
| - For any of the above you can specify:
|   ExpirationDate - Use this expiration data as criteria
| 	 OR
| 	 ExpirationDateLookahead - Number of days to look ahead
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
var renewalCapCount = 0;
var autoRenewCapCount = 0;
var dorCondCapCount = 0;
var plgsCapCount = 0;
var reTraineeNotRenewed = 0; //id 1264 - Master Script List DPL
var ceHoursNotMet = 0;
var licenseMissingLPs = 0;
var boardNotDefined = 0;
var plBusinessMasterInactive = 0;
var plInspectorHoursNotMet = 0;
var renewalRecordExists = 0;
var missingExpDetails = 0;
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
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
	setSize = 1000;

var licenseTypeParam = getParam("LicenseType");
//var licenseSubtypeParam = getParam("LicenseSubType");//


var stagingConfigurationString = '{\
		"connectionSC": "DB_CONNECTION_INFO",\
			"supplemental":   [{\
						"tag":"queryLicenseRecords",\
						"procedure":{\
							"name":"ELP_SP_AA_ACA_DESCRI_QUERY",\
							"resultSet":{"list":[\
													{"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
													{"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
													{"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
													{"source":"RESULT","name":"TASK_STATUS","parameterType":"OUT","property":"TASK_STATUS","type":"STRING"},\
													{"source":"RESULT","name":"EXPIRATION_DATE","parameterType":"OUT","property":"EXPIRATION_DATE","type":"DATE"},\
													{"source":"RESULT","name":"B1_ALT_ID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
							"parameters":{"list":[\
													{"source":"RESULT","name":"AGENCY","parameterType":"IN","property":"AGENCY","type":"STRING"},\
													{"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
													{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
			}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try 
{
	var capsToAddHashMap = new Array();
	var arrBatchesToPrint = new Array();
	var myCaps = new Array();

	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if (dbConfiguration) {
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		 * Obtain Stored Procedure for queryECBViolation into Staging Table
		 */
		var licenseRenewalProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenseRecords") {
				var licenseRenewalProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseRenewalProcedure == null) {
			var message = "Cannot find procedure queryLicenseRecords";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryLicenseRecords: " + supplementalConfiguration.procedure.name);

		/* *
		 * The ECB Violation procedure returns a ResultSet of ECB Violations
		 */
		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		licenseRenewalProcedure.prepareStatement();
		var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		if ((licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "")) {
			logDebugAndEmail("License Type not set via parameter.");
		}

		if ((licenseTypeParam != null && licenseTypeParam != "undefined" && licenseTypeParam != "")) {
			logDebugAndEmail("License SubType not set via parameter. ");
			logDebugAndEmail("Processing DPL Licenses by Board = " + licenseTypeParam);
		}
		
		emseParameters.LICENSE_TYPE = licenseTypeParam;
		//emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;
		emseParameters.AGENCY = "DPL";

		licenseRenewalProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		licenseRenewalProcedure.setParameters(inputParameters);

		//var dataSet = licenseRenewalProcedure.queryProcedure();
		var dataSet = getRecordsArray(emseParameters);

		for (var i in dataSet)
		{
			ObjKeyRename(dataSet[i], {"B1_ALT_ID": "customID"});
			var queryResult = dataSet[i];

			capIdResult = aa.cap.getCapID(queryResult.B1_ALT_ID);
			if (!capIdResult.getSuccess()) {
				ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}

			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

			var capResult = aa.cap.getCap(capId);
			if (!capResult.getSuccess()) {
				ELPLogging.debug("getCap error: " + capResult.getErrorMessage());
				continue;
			}

			var cap = capResult.getOutput();
			
			if(capId)
			{
				try
				{
					updateRefLicenseRecord(capId);
				}
				catch (ex) 
				{
					ELPLogging.error("** Error  while processing record : "+capId.getCustomID(), ex);
				}	
			}	
		} // end for loop over the Oracle Data set returned.
	} // end of connection
	else 
	{
		logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
	}

	logDebugAndEmail("________________________________________________________________________________");
	//dataSet.close();
} 
catch (ex) 
{
	aa.print("exception caught: " + ex.message);

	dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js" + ex.message);
	ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
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
		
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_AA_ACA_DESCRIPENCIES.js completed with no errors.");
		}
	}

	aa.print(ELPLogging.toString());
}

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

function updateRefLicenseRecord(capId)
{
	aa.print(" || Processing record ID : "+capId.getCustomID());
	var refLP = getRefLicenseProf(capId.getCustomID());
	if(!refLP)
	{
		refLP = getRefLicenseProfWithLicNbrAndTypeClass(capId.getCustomID())
	}

	var licExpDate = null;
	var b1ExpResult = aa.expiration.getLicensesByCapID(capId);
	if (b1ExpResult.getSuccess()) 
	{
	  var expObj = b1ExpResult.getOutput();
	  licExpDate = expObj.getExpDate();
	  //aa.print("licExpDate : "+licExpDate);
	}
	if (refLP && refLP != null) 
	{
		aa.print("refLP : "+refLP.getLicSeqNbr());
		//var wfStatus = getWFTaskStatus(capId);
		var licenseStatus = getRecordStatus(capId);
		aa.print("licenseStatus : "+licenseStatus);
		var licExpDateOldValue = refLP.getLicenseExpirationDate();
		//aa.print("Old Expiration Date is " + licExpDateOldValue);
		if(licExpDate)
		{
			refLP.setLicenseExpirationDate(licExpDate);
		}
		
		refLP.setPolicy(licenseStatus);

		var res = aa.licenseScript.editRefLicenseProf(refLP);
		if (res.getSuccess())
		{
			aa.print("Ref LP expiration date and status updated.");
		}	
		else{
			aa.print("Ref LP expiration date and status not updated. " + res.getErrorMessage());
		} 
		
		addToLicenseSyncSet4Batch1255(capId);
		
	}
	else 
	{
		aa.print("Ref LP not found.");
	}	
}

function getRecordStatus(capId)
{
	var capResult = aa.cap.getCap(capId);
	if (!capResult.getSuccess()) 
	{
		aa.print("getCap error: " + capResult.getErrorMessage());
		return false;
	}
	var licCap = capResult.getOutput();
	var licenseStatus = licCap.getCapStatus();
	return licenseStatus;
	
}
function getWFTaskStatus(capId){
	var wfStatus ="";
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
	{
		wfObj = workflowResult.getOutput();
		for (i in wfObj)
		{ 
		  var fTask = wfObj[i]; 
		  var wfTask = fTask.getTaskDescription(); 
		  
		  if(wfTask = "License" )
		  {
				wfStatus = fTask.getDisposition(); 
		  }
		}
	}
	
	return wfStatus;
}

function addToLicenseSyncSet4Batch1255(addToSetCapId) 
{
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = lookup("Lookup:LicenseSync", "SET_NAME");

	if (matches(setName, null, "", undefined)) setName = "SYNCSET";

	var setExists = false;
	var setGetResult = aa.set.getSetByPK(setName);
	if (setGetResult.getSuccess()) setExists = true;

	if (!setExists) 
	{
		setDescription = setName;
		setType = "License Sync";
		setStatus = "Pending";
		setExists = createSet(setName, setDescription, setType, setStatus);
	}

	if (setExists) 
	{
		var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(addToSetCapId).getOutput();

		var doesExistInSync = false;
		for (i = 0; i < setsMemberIsPartOf.size(); i++) 
		{
				
			if (setName == setsMemberIsPartOf.get(i).getSetID()) 
			{
				doesExistInSync = true;
				aa.print("part of set - " + setsMemberIsPartOf.get(i).getSetID());
			}
		}
		aa.print("doesExistInSync ? " + doesExistInSync);
		if (!doesExistInSync)
		{
			aa.set.add(setName, addToSetCapId);
		}
	}
}

function getRefLicenseProfWithLicNbrAndTypeClass(refstlic) {
	var boardName = "";
	var licenseType = "";
	var licenseNumber = refstlic;

	if (arguments.length == 3) {
		boardName = arguments[1];
		licenseType = arguments[2].toUpperCase();
	}

	if (isDPLLicenseFormat(refstlic)) {
		licenseNumber = getDPLLicenseNumber(refstlic).toString();
		var licNumberArray = refstlic.split("-");
		boardName = licNumberArray[1];
		//added for defect 7782
		var userTC = licNumberArray[2].toUpperCase();
		//added to address issue in defect 2603
		if (licenseType != "" && licenseType != userTC) {
			logDebug("ERROR The license type passed by user is not matching with M1 or M2");
			return false;
		}
		licenseType = licNumberArray[2];
	}
	//var boardNameold = getLegalBoardName(boardName);
	logDebug("Searching Ref LP refstlic = " + licenseNumber + " boardcode = " + boardName + " licenseType = " + licenseType);
	licenseNumber = licenseNumber + "-" + licenseType;
	var refLicNbr = retrieveSeqNbr(licenseNumber, licenseType, boardName);
	if ((!refLicNbr) || (refLicNbr == undefined)) {
		logDebug("Error retrieving sequence number.");
		return false;
	}
	var seqNbr = 1 * refLicNbr[0];
	var lpResult = aa.licenseScript.getRefLicenseProfBySeqNbr(aa.getServiceProviderCode(), seqNbr);
	if (!lpResult.getSuccess()) {
		logDebug("Error retrieving LP: " + lpResult.getErrorMessage());
		return false;
	}
	var refLicObj = null;
	refLicObj = lpResult.getOutput();
	//if we do not get a match, do a secondary check to look for LPs are part of converted duplicate data
	if (!refLicObj) {
		var mergedLicNum = licenseNumber + "-" + licenseType;
		//logDebug(mergedLicNum);
		var refLicenseResult2 = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), mergedLicNum);
		if (!refLicenseResult2.getSuccess()) {
			logDebug("**ERROR retrieving Ref Lic Profs : " + refLicenseResult2.getErrorMessage());
			return false;
		} else {
			var newLicArray2 = refLicenseResult2.getOutput();
			if (!newLicArray2) {
				//logDebug("Ref Lic Prof not found in converted data.");
				//return null;
			}
			//logDebug("found a match in converted data");
			//made change to have the function look for the board code in the comments field and not the board name field.
			for (var thisLic in newLicArray2) {
				//logDebug("Match = " + newLicArray2[thisLic].getStateLicense() +" boardcode = " + newLicArray2[thisLic].getComment() + " licenseType = " + newLicArray2[thisLic].getBusinessLicense());
				if (mergedLicNum && mergedLicNum != null && mergedLicNum != ""
					 && newLicArray2[thisLic] && newLicArray2[thisLic].getStateLicense() && mergedLicNum.toUpperCase().equals(newLicArray2[thisLic].getStateLicense().toUpperCase())
					 && (boardName == "" || (newLicArray2[thisLic].getComment() && boardName.toUpperCase().equals(newLicArray2[thisLic].getComment().toUpperCase())))
					 && (licenseType == "" || (newLicArray2[thisLic].getBusinessLicense() && licenseType.toUpperCase().equals(newLicArray2[thisLic].getBusinessLicense().toUpperCase())))) {
					refLicObj = newLicArray2[thisLic];
					logDebug("Ref Lic Prof found by using the comment field.");
					break;
				}
			}
		}
	}
	if (refLicObj) {
		//logDebug("Reference license returned: " + refLicObj.getStateLicense() +" boardcode = " + refLicObj.getLicenseBoard() + " licenseType = " + refLicObj.getBusinessLicense());
	} else {
		logDebug("no lp found");
	}
	return refLicObj;
}
function getRecordsArray(emseParameters){
	var sql = 
			"SELECT b1.SERV_PROV_CODE, \
			b1.B1_PER_ID1, \
			b1.B1_PER_ID2, \
			b1.B1_PER_ID3, \
			b1.b1_alt_id, \
			b1.B1_PER_GROUP, \
			b1.B1_PER_TYPE, \
			b1.B1_PER_SUB_TYPE, \
			b1.B1_PER_CATEGORY, \
			b1.B1_APPL_STATUS, \
			gp.SD_APP_DES as TASK_STATUS, \
			b1e.EXPIRATION_DATE, \
			b1e.EXPIRATION_STATUS, \
			b3c.B1_LICENSE_NBR as B3_B1_LICENSE_NBR, \
			b3c.B1_LICENSE_TYPE as B3_B1_LICENSE_TYPE, \
			b3c.LIC_SEQ_NBR as b3_LIC_SEQ_NBR, \
			rs.LIC_SEQ_NBR, \
			rs.LIC_TYPE, \
			rs.LIC_NBR, \
			rs.LIC_EXPIR_DD as LP_EXP_DATE, \
			rs.INS_POLICY_NO as LP_STATUS, \
			rs.serv_prov_code as LP_serv_prov_code \
			from b1permit b1 \
			inner join accela.b1_Expiration b1e \
			on b1.B1_PER_ID1 = b1e.B1_PER_ID1 \
			and b1.B1_PER_ID2 = b1e.B1_PER_ID2 \
			and b1.B1_PER_ID3 = b1e.B1_PER_ID3 \
			and b1.SERV_PROV_CODE = b1e.SERV_PROV_CODE \
			inner join ACCELA.GPROCESS gp \
			on b1.B1_PER_ID1 = gp.B1_PER_ID1 \
			and b1.B1_PER_ID2 = gp.B1_PER_ID2 \
			and b1.B1_PER_ID3 = gp.B1_PER_ID3 \
			and b1.SERV_PROV_CODE = gp.SERV_PROV_CODE \
			inner join ACCELA.B3CONTRA b3c \
			on b1.B1_PER_ID1 = b3c.B1_PER_ID1 \
			and b1.B1_PER_ID2 = b3c.B1_PER_ID2 \
			and b1.B1_PER_ID3 = b3c.B1_PER_ID3 \
			and  SUBSTR(b1.B1_ALT_ID, 1, Instr(b1.B1_ALT_ID, '-', -1, 2) -1) = b3c.B1_LICENSE_NBR \
			and b1.SERV_PROV_CODE = b3c.SERV_PROV_CODE \
			inner join ACCELA.RSTATE_LIC rs \
			on rs.LIC_NBR = b3c.B1_LICENSE_NBR \
			and rs.LIC_TYPE = b3c.B1_LICENSE_TYPE \
			where b1.B1_PER_CATEGORY = 'License' \
			and b1.serv_prov_code= 'DPL' \
			and (EXPIRATION_DATE != rs.LIC_EXPIR_DD OR B1_APPL_STATUS != rs.INS_POLICY_NO) \
			and rs.SERV_PROV_CODE = 'DPL' \
			and B1_PER_TYPE = '" + emseParameters.LICENSE_TYPE + "'";

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