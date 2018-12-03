/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_LAPSED_LICENSE Trigger : Batch
 |
 | - A license that is not renewed by its renewal date is considered Lapsed.
 | - The script will update the status of the license and apply a late fee to for licenses that have not
 |   been renewed before their expiration date.
 | - License is be added to the SYNCSET
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
 | 	
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0;
var debug = "";

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

showDebug = false;
showMessage = false;
var maxSeconds = 60 * 60 * 2;
var br = "<br>";
aa.print("showDebug ---" + showDebug);
var dynamicParameters = {};
var sysDate = aa.date.getCurrentDate();
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

var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser(currentUserID).getOutput();

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "LAPSED"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	logDebug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");
	
var emailAddress2 = getParam("emailAddress"); // This will be secondary email (as CC) set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var toDateParam = getParam("ExpirationDate");
var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");
 
var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [\
					{\
					"tag":"queryLapsedLicenses",\
					"procedure":{\
						"name":"ELP_SP_LAPSED_LICENSES_QUERY",\
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
														 {"source":"RESULT","name":"EXPIRATIONDATE","parameterType":"IN","property":"EXPIRATIONDATE","type":"DATE"},\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}\
					},\
					{\
					"tag":"queryBusinessLicenses",\
					"procedure":{\
						"name":"ELP_SP_LAPSED_BUSINESS_QUERY",\
						"resultSet":{"list":[\
										 {"source":"RESULT","name":"businessLicenseID","parameterType":"OUT","property":"businessLicenseID","type":"STRING"},\
										 {"source":"RESULT","name":"individualLicenseNumber","parameterType":"OUT","property":"individualLicenseNumber","type":"STRING"},\
										 {"source":"RESULT","name":"legalBoardName","parameterType":"OUT","property":"legalBoardName","type":"STRING"},\
										 {"source":"RESULT","name":"contactFirstName","parameterType":"OUT","property":"contactFirstName","type":"STRING"},\
										 {"source":"RESULT","name":"contactLastName","parameterType":"OUT","property":"contactLastName","type":"STRING"}]},\
						"parameters":{"list":[\
										 {"source":"RESULT","name":"servProvCode","parameterType":"IN","property":"servProvCode","type":"STRING"},\
										 {"source":"RESULT","name":"businessGroup","parameterType":"IN","property":"businessGroup","type":"STRING"},\
	 									 {"source":"RESULT","name":"businessType","parameterType":"IN","property":"businessType","type":"STRING"},\
										 {"source":"RESULT","name":"businessSubType","parameterType":"IN","property":"businessSubType","type":"STRING"},\
	 									 {"source":"RESULT","name":"businessCategory","parameterType":"IN","property":"businessCategory","type":"STRING"},\
										 {"source":"RESULT","name":"individualLicenseNumber","parameterType":"IN","property":"individualLicenseNumber","type":"STRING"},\
	 									 {"source":"RESULT","name":"individualBoardCode","parameterType":"IN","property":"individualBoardCode","type":"STRING"},\
										 {"source":"RESULT","name":"individualTypeClass","parameterType":"IN","property":"individualTypeClass","type":"STRING"},\
										 {"source":"RESULT","name":"SP_CURSOR","parameterType":"OUT","property":"SP_CURSOR","type":"RESULT_SET"}]}}\
	},\
	    ]\
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
	var lapsedLicenseProcedure = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		ELPLogging.debug("TAG " + supplementalConfiguration.tag);		
		if (supplementalConfiguration.tag == "queryLapsedLicenses")
		{
			 var lapsedLicenseProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			 break;
		}
	}
	if (lapsedLicenseProcedure == null)
	{
		var message = "Cannot find procedure queryLapsedLicenses";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryLapsedLicenses: " + supplementalConfiguration.procedure.name);
	
	var businessLicenseProcedure = null;
	var businessLicenseConfiguration = null;
	for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii ++ )
	{
		var supplementalConfiguration = stagingConfiguration.supplemental[ii];
		ELPLogging.debug("TAG2 " + supplementalConfiguration.tag);
		if (supplementalConfiguration.tag == "queryBusinessLicenses")
		{
			var businessLicenseConfiguration = supplementalConfiguration.procedure;
			break;

		}
	}
	if (businessLicenseConfiguration == null)
	{
		var message = "Cannot find procedure queryBusinessLicenses";
		var exception = new Error(message);
		throw exception;
	}
	ELPLogging.debug("Found queryBusinessLicenses: " + supplementalConfiguration.procedure.name);		
	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*/
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	lapsedLicenseProcedure.prepareStatement();
	var inputParameters = lapsedLicenseProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};
	 
	// The SP may have an expiration date passed in. If it is not set via batch job parameter, it is defined here. 
	var toDate = new Date();
	if( toDateParam == null || toDateParam == "undefined" || toDateParam == "")
	{
		logDebugAndEmail("Expiration Date not set via parameter. Setting Default expiration date: " + toDate);
	}
	else
	{
		toDate = new Date(toDateParam);	
	}

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
	
	logDebugAndEmail("Searching for records with expiration date on or prior to: " + toDate );
		
	emseParameters.EXPIRATIONDATE = toDate;
	emseParameters.LICENSE_TYPE = licenseTypeParam;
	emseParameters.LICENSE_SUBTYPE = licenseSubtypeParam;
	emseParameters.AGENCY = "DPL";

	lapsedLicenseProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("InputParameters for Query: ", inputParameters);
	lapsedLicenseProcedure.setParameters(inputParameters);

	//var dataSet = lapsedLicenseProcedure.queryProcedure();
    var setName = lookup("Lookup:LicenseSync", "SET_NAME");
    var dataSet = getRecordsArray(emseParameters);
	if (dataSet != false || dataSet.length > 0) 
	for (var i in dataSet) {
		ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
		ObjKeyRename(dataSet[i], {"EXPIRATION_DATE":"expirationDate"});
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
		var boardCode = altId.split("-")[1];
        var specialAH_PT = false;
        var specialSW = false;
        
        // JIRA 1306 : Special business case for Allied Health/Physical Therapist License
            // 1 day after expiration date we want license record status to be "expired" and WF task status to be expired (so only ACA renewals can be submitted) 
        if(appMatch("License/Allied Health/Physical Therapist/License", capId) || appMatch("License/Allied Health/Occupational Therapist Asst/License", capId) || appMatch("License/Allied Health/Athletic Trainer/License", capId)
            || appMatch("License/Allied Health/Occupational Therapist/License", capId)|| appMatch("License/Allied Health/Physical Therapist Assistant/License", capId))
         {
            var newDate = new Date(queryResult.expirationDate);
            newDate.setDate(newDate.getDate() + 1);
            var date1 = new Date();
            date1.setHours(0,0,0,0);
            if (newDate < date1)
            {
                specialAH_PT = true;
            }
            else
            {
                aa.print("Skipping AH PT License record # " + queryResult.customID);
                continue;
            }
        }
        // JIRA 1306 : Special business case for Allied Health/Physical Therapist License

        // EPLACE-4785 : Special business case for Social Workers renewals.
        // Set the License task to Expired and Inactivate the license if expiration date is more than a year from today's date. 
        // Reintroduced as part of EPLACE-6223.
        
		if (appMatch("License/Social Workers/*/License", capId)) {
			var licExpDate = new Date(queryResult.expirationDate);
			var todaysDate = new Date();
			todaysDate.setHours(0, 0, 0, 0);
			if (dateDiff(licExpDate, todaysDate) > 365) specialSW = true;
		}
        // EPLACE-4785 : Special business case for Social Workers renewals.


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
	
		ELPLogging.debug("Updating Cap ID: " + altId);
		// Change work flow task status and cap status to Lapsed
		var taskName = "License";
		var updateTaskStatus = "Lapsed";
		
        // JIRA 1306 : Special business case for Allied Health/Physical Therapist License
            // 1 day after expiration date we want license record status to be "expired" and WF task status to be expired (so only ACA renewals can be submitted)
        // EPLACE-4785 : Special business case for Social Workers renewals
        // Set the License task to Expired and Inactivate the license if expiration date is more than a year from today's date.
       	if (specialAH_PT || specialSW)
        {
			ELPLogging.debug("Updating Task: Task Name = " + taskName + " task Status = Expired");
			updateTask(taskName, "Expired", "Set status to Expired by system batch job", "Set status to Expired by system batch job");		
        }
        else
        {
            ELPLogging.debug("Updating Task: Task Name = " + taskName + " task Status = " + updateTaskStatus);
            updateTask(taskName, updateTaskStatus, "Set status to " + updateTaskStatus + " by system batch job", "Set status to " + updateTaskStatus + " by system batch job", "", capId);
        }
		
		var lic = new licenseObject(altId, capId);
		// Set expiration status to Expired
        // JIRA 2270 : If License record has Active DOR condition expiration status should be 'Inacitve' to disable renewal from ACA.
        // EPLACE-4785 : Special business case for Social Workers renewals
        // Set to 'Inactive' to disable renewal from ACA.
        if (lpHasCondition(altId, "Right to Renew Stayed by DOR") || specialSW)
        {
            lic.setStatus("Inactive");
        }
        else
        {
            lic.setStatus("Expired");
        }
		
		var newLicAInfo = new Array();
		loadAppSpecific(newLicAInfo, capId);
		var asiTypeClass = newLicAInfo["Type Class"];                      
		logDebug("Type Class : " +asiTypeClass);

		if (asiTypeClass && asiTypeClass != null && asiTypeClass != "")
			newLicenseType = asiTypeClass;
		else
			newLicenseType = boardCode;
			
		var newLic = getRefLicenseProf(altId, boardCode, newLicenseType);
		//Sagar : EPLACE-1024 :DPL_PROD_EL/FA_Incorrect License status 
		if((appMatch("License/Electricians/Journeyman Electrician/License", capId) && !newLic))
		{
			newLic = getRefLicenseProfForEL_board(altId);
		}
		
		ELPLogging.debug("License Professional: " +newLic);
		if (newLic)
		{
			ELPLogging.debug("Updating existing Ref License Professional : " + newLic);		
			newLic.setWcExempt("N");
			// EPLACE-4785 : Special business case for Social Workers renewals
			if (specialSW) {
				newLic.setPolicy("Inactive");
			} else {
				newLic.setPolicy("Expired");
			}
			var myResult = aa.licenseScript.editRefLicenseProf(newLic);

			if (myResult.getSuccess()) 
			{
				ELPLogging.debug("Successfully added/updated License No. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());

					// Add LP to SYNCSET
					//addTransLictoSet(capId);
					addToLicenseSyncSet4Batch(capId);
				licProfCapCount++;
			}
			else 
				ELPLogging.debug("**ERROR: Can't create reference licence prof: " + myResult.getErrorMessage());
				
		} 
		//check if Lapsed license is also a key licensee on a related business license
		var fvEmailParameters = aa.util.newHashtable();
		businessLicenseProcedure = new StoredProcedure(businessLicenseConfiguration, databaseConnection);		
        CWM_ELP_7803_batch_getRelatedBusinessLicenses(altId,appTypeString,businessLicenseProcedure);
		
		//added by preeti for testing-1, defect 12171
		
			CWM_ELP_Defect12171_batch_getRelatedBusinessLicenses(altId,appTypeString);
		
        //CWM_ELP_1480_batch_getRelatedBusinessLicenses(altId,appTypeString);
				//debashish.barik RTC#12845,12849
		//CWM_ELP_XXX_assessAdditionalRenewalFees(appTypeString,capId);
		//Added By ankush for CR281
		CWM_ELP_281_batch_updateInspectorLicense(appTypeString, capId);
		capCount++;
	
	} // end for loop over the Oracle Data set returned.
   
	logDebugAndEmail( "Lapsed  Licenses Processed: " + capCount);
	logDebugAndEmail( "LPs updated and added to SYNCSET: " + licProfCapCount);
	
  //dataSet.close();
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);
   ELPLogging.debug("exception caught", ex);

   dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_LAPSED_LICENSE" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_LAPSED_LICENSE. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_LAPSED_LICENSE " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (lapsedLicenseProcedure != null) {
		lapsedLicenseProcedure.close();
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LAPSED_LICENSE completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LAPSED_LICENSE completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_LAPSED_LICENSE completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_LAPSED_LICENSE completed with no errors.");
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

function CWM_ELP_7803_batch_getRelatedBusinessLicenses(altId,appTypeStr, businessLicenseProcedure) {
	var performKeyCheck = lookup("Lookup:Key License on Business",appTypeStr)
	if(performKeyCheck) 
	{
		try 
		{
			var altidArray = altId.split("-"); // Array of application type string
			var licenseNum = altidArray[0];
			var board = altidArray[1];
			var typeClass = altidArray[2];
			var appTypeArray = performKeyCheck.split("/");
	  
			var contactNum = 0;
			aa.print("Searching for LP (" + licenseNum + ", " + board + ", " + typeClass + ") in Business License records (" + performKeyCheck + ").");

		fvEmailParameters.put("$$masterLic$$",licenseNum + "-" + board + "-" + typeClass);
		var dataSet = relatedBusinessLicense(businessLicenseProcedure, altId, performKeyCheck);
		if (dataSet == null) {
			ELPLogging.debug("dataSet is null");
			return;
		}
		
		if (dataSet != false || dataSet.length > 0) 
		for (var i in dataSet) {
			ObjKeyRename(dataSet[i], {"BUSINESSLICENSEID":"businessLicenseID"});
			ObjKeyRename(dataSet[i], {"INDIVIDUALLICENSENUMBER":"individualLicenseNumber"});
			ObjKeyRename(dataSet[i], {"LEGALBOARDNAME":"legalBoardName"});
			ObjKeyRename(dataSet[i], {"CONTACTFIRSTNAME":"contactFirstName"});
			ObjKeyRename(dataSet[i], {"CONTACTLASTNAME":"contactLastName"});
			var queryResult = dataSet[i];
			//aa.print("INSIDE OTHER > "+ queryResult.businessLicenseID+" : "+ queryResult.individualLicenseNumber +" : "+queryResult.legalBoardName+" : "+queryResult.contactFirstName);
			//continue;

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){	
			var capIdResult = aa.cap.getCapID(queryResult.businessLicenseID);
			if ( ! capIdResult.getSuccess())
			{
				aa.print("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}
			
			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();	
			var thisCapResult = aa.cap.getCap(capId);
			if ( ! thisCapResult.getSuccess())
			{
				aa.print("getCap error: " + thisCapResult.getErrorMessage());
				continue;
			}			
			var thisCap = thisCapResult.getOutput(); 

			aa.print("Found a Business license with this Master..." + thisCap.getCapModel().getAltID());
			fvEmailParameters.put("$$Record Number$$",thisCap.getCapModel().getAltID());
			fvEmailParameters.put("$$BUSINESS_LIC$$",thisCap.getCapModel().getAltID());
			fvEmailParameters.put("$$KeyIndividual$$",queryResult.contactFirstName +" " + queryResult.contactLastName);
			fvEmailParameters.put("$$Board_Name$$",queryResult.legalBoardName);
			fvEmailParameters.put("$$Board_PhoneNumber$$",lookup("BOARD_PHONE",board));
			//this function sends the email to the business
			CWM_ELP_1480_batch_SendLapsedNotice(capId);
			//Sagar: Fix for PROD Defect 12040 : DPL_PROD_SM_Report defect
			//If the license of a key licensee associated with a facility / business license lapses or expires and the business / facility license is still current, notify agency staff and the business license holder that the business license may be invalid
			var LpStatus = isValidMasterLicense(altId);
			if((LpStatus == "Expired") || (LpStatus == "Lapsed"))
			{
				aa.print("LpStatus : "+LpStatus);
				//this function sends the email to the internal board staff
				CWM_ELP_1480_batch_SendLapsedNoticeInternal(capId,board);
			}
			
		}
		} catch (ex) {
			ELPLogging.error("getRelatedBusnessLicenses exception", ex);
		} 
		finally 
		{
			if (dataSet != null) {
				//dataSet.close();
			}
			if (businessLicenseProcedure != null) {
				businessLicenseProcedure.close();
			}
		}
	}
	else 
	{
		aa.print("not a key licensee");
	}
}

function CWM_ELP_Defect12171_batch_getRelatedBusinessLicenses(altId,appTypeStr){
	//doing look up to find master license
	var performKeyCheck = lookup("Lookup:Key License on Business",appTypeStr);
	
	if(performKeyCheck)
	{
		var refContactNumber = null;
		var licNo = altId;
		var altidArray = licNo.split("-"); // Array of application type string
		var licenseNum = altidArray[0];
		var board = altidArray[1];
		var typeClass = altidArray[2];
		fvEmailParameters.put("$$masterLic$$",licenseNum + "-" + board + "-" + typeClass);
		aa.print(board +typeClass +licenseNum );
		var refLP = getRefLicenseProf(licNo);
		aa.print(refLP );
		if (refLP) {
			var contactTypeOnBL = lookup("Lookup:keyIndividual_ContactType_onBusinessLicense",appTypeStr);
			var licNum = refLP.stateLicense +"-"+refLP.comment +"-"+refLP.businessLicense;
			var licCapId = aa.cap.getCapID(licNum).getOutput();
			var licContacts = getPeople(licCapId);
			//getting reference contact number, for broker there is only one contact type i.e, licensed individual
			for (c in licContacts) 
				{
				var licContact = licContacts[c];
				var licContactModel = licContact.getCapContactModel();
					//if(licContactModel.getPeople().getContactType() == "Licensed Individual"){
					refContactNumber = licContactModel.refContactNumber; 
					aa.print(refContactNumber );
					//}
				}
			var cont = getLicenseCapsByRefContact(refContactNumber);
			for(a in cont){
				aa.print(cont[a].getCustomID());
				var source = getPeople(cont[a]);
				for (zz in source){
					sourcePeopleModel = source[zz].getCapContactModel();
					aa.print(sourcePeopleModel.getPeople().getEndDate());
					if(sourcePeopleModel.getPeople().getContactType() == contactTypeOnBL && sourcePeopleModel.getPeople().getEndDate() == null){
					aa.print(cont[a].getCustomID()+ " has master associated.");
					var thisCap = aa.cap.getCap(cont[a]).getOutput();
					
					//getting thisProfLicense for KeyIndividual, copied from preivious code
					var profLicenseCapId = aa.licenseProfessional.getLicensedProfessionalsByCapID(cont[a]);
						if (profLicenseCapId.getSuccess()) { 
							var profLicense = profLicenseCapId.getOutput();
							//aa.print(profLicense.length);
							for (var counter in profLicense) {
								var thisProfLicense = profLicense[counter];
								if (thisProfLicense.getLicenseNbr() == licenseNum && thisProfLicense.getLicenseBoard() == getLegalBoardName(board) && thisProfLicense.getBusinessLicense() == typeClass) {
								  //var thisCap = aa.cap.getCap(thisApp.getCapID()).getOutput(); 
								aa.print("Found a Business license with this Master..." + thisCap.getCapModel().getAltID());
								fvEmailParameters.put("$$Record Number$$",thisCap.getCapModel().getAltID());
								fvEmailParameters.put("$$BUSINESS_LIC$$",thisCap.getCapModel().getAltID());
								fvEmailParameters.put("$$KeyIndividual$$",thisProfLicense.getContactFirstName() +" " + thisProfLicense.getContactLastName());
								fvEmailParameters.put("$$Board_Name$$",getLegalBoardName(board));
								fvEmailParameters.put("$$Board_PhoneNumber$$",lookup("BOARD_PHONE",board));
								}
							}
						}
					}
				}
			}
		}
	}else{
		aa.print("not a key licensee");
	}
} // end of CWM_ELP_Defect12171_batch_getRelatedBusinessLicenses



function CWM_ELP_1480_batch_getRelatedBusinessLicenses(altId,appTypeStr) {
	var performKeyCheck = lookup("Lookup:Key License on Business",appTypeStr)
if(performKeyCheck){

   var altidArray = altId.split("-"); // Array of application type string
   var licenseNum = altidArray[0];
   var board = altidArray[1];
   var typeClass = altidArray[2];
   var appTypeArray = performKeyCheck.split("/");
  
   var contactNum = 0;
   //Create a capModel for use with the get records method
   var capModel = aa.cap.getCapModel().getOutput();
   var capTypeModel = capModel.getCapType();
   capTypeModel = capModel.getCapType();
   capTypeModel.setGroup(appTypeArray[0]);
   capTypeModel.setType(appTypeArray[1]);
   capTypeModel.setSubType(appTypeArray[2]);
   capTypeModel.setCategory(appTypeArray[3]);
   capModel.setCapType(capTypeModel);

   appListResult = aa.cap.getCapIDListByCapModel(capModel);
   if (appListResult.getSuccess()) {
      appList = appListResult.getOutput();
   }
   aa.print("Searching for LP (" + licenseNum + ", " + board + ", " + typeClass + ") in Business License records (" + appList.length + ").");
	fvEmailParameters.put("$$masterLic$$",licenseNum + "-" + board + "-" + typeClass);
   if (appList.length > 0) {
      for (a in appList) {
         var thisApp = appList[a];
         var profLicenseCapId = aa.licenseProfessional.getLicensedProfessionalsByCapID(thisApp.getCapID());
         if (profLicenseCapId.getSuccess()) { 
            var profLicense = profLicenseCapId.getOutput();
            for (var counter in profLicense) {
               var thisProfLicense = profLicense[counter];
			     if (thisProfLicense.getLicenseNbr() == licenseNum && thisProfLicense.getLicenseBoard() == getLegalBoardName(board) && thisProfLicense.getBusinessLicense() == typeClass) {
	          var thisCap = aa.cap.getCap(thisApp.getCapID()).getOutput(); 

				  aa.print("Found a Business license with this Master..." + thisCap.getCapModel().getAltID());
				  	fvEmailParameters.put("$$Record Number$$",thisCap.getCapModel().getAltID());
				  fvEmailParameters.put("$$BUSINESS_LIC$$",thisCap.getCapModel().getAltID());
				  fvEmailParameters.put("$$KeyIndividual$$",thisProfLicense.getContactFirstName() +" " + thisProfLicense.getContactLastName());
				  fvEmailParameters.put("$$Board_Name$$",getLegalBoardName(board));
				 fvEmailParameters.put("$$Board_PhoneNumber$$",lookup("BOARD_PHONE",board));
				  //this function sends the email to the business
				  CWM_ELP_1480_batch_SendLapsedNotice(thisApp.getCapID());
				  //this function sends the email to the internal board staff
				  CWM_ELP_1480_batch_SendLapsedNoticeInternal(thisApp.getCapID(),board);
               }
            }
         }
      }
   }


}
else{
	aa.print("not a key licensee");
}
}

function CWM_ELP_1480_batch_SendLapsedNotice(parentCapId){
	                        var capContactArr = getContactArray(parentCapId);
							var busContact = "Business";
							var contactEmails = new Array();
							
                        for (contactItem in capContactArr) {
							aa.print(String(capContactArr[contactItem].contactType).toUpperCase());
                           if (capContactArr[contactItem].contactType != null && (String(capContactArr[contactItem].contactType).toUpperCase() == busContact.toUpperCase())) {
                              aa.print("**INFO Contact type matched.");
                              if (capContactArr[contactItem].email != null) {
                                 aa.print("**INFO Checking email address format is valid.");
                                 var atIndex = String(capContactArr[contactItem].email).indexOf("@");
                                 var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
                                 // aa.print(atIndex + "  P: " + periodIndex);
                                 if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) {// basic email validation
                                    aa.print("**INFO Email added: " + capContactArr[contactItem].email);
									fvEmailParameters.put("$$BusinessName$$",capContactArr[contactItem].businessName);
                                   // contactEmails.push(capContactArr[contactItem].email);

									var fvCapID4Email = aa.cap.createCapIDScriptModel(parentCapId.getID1(),parentCapId.getID2(),parentCapId.getID3());
									var fvFileNames = [];
									aa.document.sendEmailAndSaveAsDocument(sysFromEmail,String(capContactArr[contactItem].email),"","ACA_LICENSE_LAPSED_FOR_CURRENT_BUSINESS",fvEmailParameters,fvCapID4Email,fvFileNames);
									aa.print("External email sent to " + String(capContactArr[contactItem].email));

                                 } else {
                                  
                                    aa.print("**INFO Invalid email address format found. Will save on record and don't email.");

                                 }
                              } 
						}
						}


}

function CWM_ELP_1480_batch_SendLapsedNoticeInternal(parentCapId, board)
{
	var boardstaff = lookup("Lookup:Key License on Business Internal Emails",board)
	var internalEmailarray = boardstaff.split(";");

	for (contactItem in internalEmailarray) 
	{
		getContactParams4Notification(fvEmailParameters, "Business");  
		var fvCapID4Email = aa.cap.createCapIDScriptModel(parentCapId.getID1(),parentCapId.getID2(),parentCapId.getID3());
		var fvFileNames = [];
		aa.document.sendEmailAndSaveAsDocument(sysFromEmail,String(internalEmailarray[contactItem]),"","AA_LICENSE_LAPSED_FOR_CURRENT_BUSINESS",fvEmailParameters,fvCapID4Email,fvFileNames);
		aa.print("Internal email sent to "+ internalEmailarray[contactItem]);

	}
}

function relatedBusinessLicense(newProcedure, altId, performKeyCheck) {
	/* *
	* The ECB Violation procedure returns a ResultSet of ECB Violations
	*   servProvCode IN VARCHAR2
, BUSINESSGROUP IN VARCHAR2 
, BUSINESSTYPE IN VARCHAR2 
, BUSINESSSUBTYPE IN VARCHAR2 
, BUSINESSCATEGORY IN VARCHAR2 
, INDIVIDUALLICENSENUMBER IN VARCHAR2 
, individualBoardCode IN VARCHAR
, INDIVIDUALTYPECLASS IN VARCHAR2 
, SP_CURSOR OUT SYS_REFCURSOR 
ResultSet
  		bl.b1_alt_id as businessLicenseID, 
        lp.b1_license_nbr as individualLicenseNbr, 
        lp.b1_lic_board as legalBoardName,
        lp.b1_cae_fname as contactFirstName,
        lp.b1_cae_lname as contactLastName
	*/
	var altidArray = altId.split("-"); // Array of application type string
	var licenseNum = altidArray[0];
	var board = altidArray[1];
	var typeClass = altidArray[2];
	var appTypeArray = performKeyCheck.split("/");	
	var staticParameters = {} ;
	var dynamicParameters = {} ;
	var batchApplicationResult = {};
	newProcedure.prepareStatement();
	var inputParameters = newProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
	var emseParameters = {};	
	emseParameters.businessGroup = appTypeArray[0];
	emseParameters.businessType = appTypeArray[1];
	emseParameters.businessSubType = appTypeArray[2];
	emseParameters.businessCategory = appTypeArray[3];
	emseParameters.individualLicenseNumber = licenseNum;
	emseParameters.individualBoardCode = board;
	emseParameters.individualTypeClass = typeClass;
	emseParameters.servProvCode = "DPL";

	newProcedure.copyEMSEParameters(emseParameters, inputParameters);
	ELPLogging.debug("InputParameters for Query: ", inputParameters);
	newProcedure.setParameters(inputParameters);

	//var dataSet = newProcedure.queryProcedure();
	var dataSet = getRecordsArrayBusiness(emseParameters);

	return dataSet;
}

function addToLicenseSyncSet4Batch(addToSetCapId) {
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	//var setName = lookup("Lookup:LicenseSync", "SET_NAME");

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
			logDebug("doesExistInSync " + doesExistInSync);
			if (!doesExistInSync)
					aa.set.add(setName, addToSetCapId);
	}
}						

function isValidMasterLicense(altId)
{
	var LpStatus = ""
	var altidArray = altId.split("-"); // Array of application type string
	var licenseNum = altidArray[0];
	var board = altidArray[1];
	var typeClass = altidArray[2];
	
	var licSeqNumber = retrieveSeqNbr(licenseNum,typeClass,board);
		
	var refLicenseResult = aa.licenseScript.getRefLicenseProfBySeqNbr("DPL", aa.util.parseLong(licSeqNumber.toString()));
	if(refLicenseResult.getSuccess())
	{
		LpStatus = refLicenseResult.getOutput().getPolicy();
	}
	return LpStatus;
}

/*
 *@Added By: debashish.barik
 *@Date: 3/2/2016
 *@Description:If the license has been lapsed for more than 1 renewal cycle 
 *			   Then assess an ADDITIONAL renewal fee  <PTRN>
 *@pAppTypeString : 4 part record structure. ex: License/Allied Health/Physical Therapist/Application
 *Note: For assess additional fee , you need to add a row into ,standard choice: LKUP_Additional_Renewal_Fees for your record type
 */
function CWM_ELP_XXX_assessAdditionalRenewalFees(pAppTypeString, pCapId) {
	ELPLogging.debug("CWM_ELP_XXX_assessAdditionalRenewalFees start:" + pCapId.getCustomID());
	try {
		if (pAppTypeString != null && pAppTypeString != "") {
			ELPLogging.debug("pCapId:" + pCapId.getCustomID());
			var vAppTypeArray = pAppTypeString.split("/");
			var vFeeValue = vAppTypeArray[1] + "/" + vAppTypeArray[2]; //ex:Allied Health/Physical Therapist
			var vAddfeeInfo = lookup("LKUP_Additional_Renewal_Fees", vFeeValue); // add corrsoponding record type to the standard choice.
			if (vAddfeeInfo) {
				ELPLogging.debug("vAddfeeInfo:" + vAddfeeInfo);
				vAddfeeInfo = vAddfeeInfo.toString();
				var vFee = vAddfeeInfo.split("/");
				var vFeeCode = vFee[0];
				var vFeeSchedule = vFee[1];
				ELPLogging.debug("From Standard choice: vFeeCode:" + vFeeCode + ",vFeeSchedule:" + vFeeSchedule);
				//if (feeQty(vFeeCode, pCapId) <= 1) {
				//Start RTC#12196, debashish.barik
				//Get the Renewal cap associated with License
				var result = aa.cap.getProjectByMasterID(pCapId, "Renewal", null);
				if (result.getSuccess()) {
					projectScriptModels = result.getOutput();

					for (it in projectScriptModels) {
						var projectScriptModel = projectScriptModels[it];
						var renCapId = projectScriptModel.getCapID()

							var renCapResult = aa.cap.getCap(renCapId);
						if (renCapResult.getSuccess()) {
							var capScriptModel = renCapResult.getOutput();
							//Check if the Cap is partial or complete, If partial then add fee
							ELPLogging.debug("Complete Cap: " + renCapId + " " + capScriptModel.isCompleteCap());
							if (!capScriptModel.isCompleteCap()) {
								//If fee exists
								if (vFeeCode && vFeeSchedule) {
									addFee(vFeeCode, vFeeSchedule, "STANDARD", 1, "Y", renCapId);
									ELPLogging.debug("Additional fee " + vFeeCode + " added on Renewal " + renCapId + " for License " + pCapId.getCustomID());
								}
							}
						}
					}
				}
				//END RTC#12196
				//addFee(vFeeCode, vFeeSchedule, "STANDARD", 1, "Y", pCapId);
				//ELPLogging.debug("Additional fee " + vFeeCode + " added to " + pCapId);
				//} else {
				//ELPLogging.debug("The additional renewal fee already exists on the record.");
				//}
			} else {
				ELPLogging.debug("Warning** Fee value:" + vFeeValue + " doesnot exist in LKUP_Additional_Renewal_Fees");
			}
		} else {
			ELPLogging.debug("Warning**Additional fee can not be assessed for this record");
		}
		ELPLogging.debug("CWM_ELP_XXX_assessAdditionalRenewalFees exit:" + pCapId.getCustomID());
	} catch (err) {
		ELPLogging.debug("Error** in CWM_ELP_XXX_assessAdditionalRenewalFees():" + err.message);
	}

}

function CWM_ELP_281_batch_updateInspectorLicense(appTypeString, capId)
{
	try{
		if(appTypeString == "License/Plumbers and Gas Fitters/Journeyman/License" || appTypeString == "License/Plumbers and Gas Fitters/Gas Fitter Master/License" ||
			appTypeString == "License/Plumbers and Gas Fitters/Master/License" || appTypeString == "License/Plumbers and Gas Fitters/Gas Fitter Journeyman/License"){
			var vUpadteInspectorLicense = true;
			var profLicenseList = aa.licenseProfessional.getLicensedProfessionalsByCapID(capId);
						if (profLicenseList.getSuccess()) { 
							var profLicenseObj = profLicenseList.getOutput();
							//ELPLogging.debug(profLicenseObj.length);
							for (var counter in profLicenseObj) {
								var thisProfLicenseObj = profLicenseObj[counter];								
								if (thisProfLicenseObj && thisProfLicenseObj.getLicenseBoard() == "Board of State Examiners of Plumbers and Gas Fitters" && thisProfLicenseObj.getBusinessLicense() == "IN") {
										var inspectorLicAltId = thisProfLicenseObj.getLicenseNbr() + "-"+thisProfLicenseObj.getComment()+"-" + thisProfLicenseObj.getBusinessLicense();
										var inspectorLicCapId = aa.cap.getCapID(inspectorLicAltId).getOutput();
										if(inspectorLicCapId){
											var profLicenseListNew = aa.licenseProfessional.getLicensedProfessionalsByCapID(inspectorLicCapId);
											if (profLicenseListNew.getSuccess()) { 
												var profLicenseObjNew = profLicenseListNew.getOutput();
												for (var counterNew in profLicenseObjNew) {
													var thisProfLicenseObjNew = profLicenseObjNew[counterNew];															
													if (thisProfLicenseObjNew && thisProfLicenseObjNew.getLicenseBoard() != "Board of State Examiners of Plumbers and Gas Fitters" && thisProfLicenseObjNew.getBusinessLicense() != "IN") {
															//ELPLogging.debug("thisProfLicenseObjNew.getLicenseNbr() :: "+thisProfLicenseObjNew.getLicenseNbr());
															//ELPLogging.debug("thisProfLicenseObjNew.getLicenseBoard() :: "+thisProfLicenseObjNew.getLicenseBoard());
															//ELPLogging.debug("thisProfLicenseObjNew.getBusinessLicense() :: "+thisProfLicenseObjNew.getBusinessLicense());														
															var newLicProf = getRefLicenseProf(thisProfLicenseObjNew.getLicenseNbr(), thisProfLicenseObjNew.getComment(), thisProfLicenseObjNew.getBusinessLicense());
															var newLicProfStatus = newLicProf.getPolicy();
															if(newLicProfStatus == "Current"){
																vUpadteInspectorLicense = false;
															}
															
													}
												}
												if(vUpadteInspectorLicense){
													//var licNew = new licenseObject(inspectorLicAltId, inspectorLicCapId);
													ELPLogging.debug("Setting Record Status of Inspector Cap ID: " + inspectorLicAltId + " Inactive");
													//licNew.setStatus("Inactive");
													updateAppStatus("Inactive","Updated by Script",inspectorLicCapId);
													var newInspectorLicProf = getRefLicenseProf(thisProfLicenseObj.getLicenseNbr(), thisProfLicenseObj.getComment(), thisProfLicenseObj.getBusinessLicense());
													if(newInspectorLicProf){
														newInspectorLicProf.setWcExempt("N");
														newInspectorLicProf.setPolicy("Inactive");
														aa.licenseScript.editRefLicenseProf(newInspectorLicProf);
													}
													updateTask("License", "Inactive", "Set status to  Inactive  by system batch job", "Set status to  Inactive by system batch job", "", inspectorLicCapId);
												}
											}
										}
								}
							}
						}
		}
	} catch(err){
		ELPLogging.debug("err :: "+err.message);
	}
}


function getRecordsArray(emseParameters){
	var sql = 
			"select b.SERV_PROV_CODE,b.B1_PER_ID1, b.B1_PER_ID2, b.B1_PER_ID3, b.B1_PER_GROUP, b.b1_per_type, b.b1_per_sub_type, b.B1_PER_CATEGORY, b.b1_alt_id, b.B1_APPL_STATUS, e.EXPIRATION_STATUS, e.EXPIRATION_DATE \
			from B1PERMIT b \
			left join B1_EXPIRATION e \
			on b.B1_PER_ID1 = e.B1_PER_ID1 \
			and b.B1_PER_ID2 = e.B1_PER_ID2 \
			and b.B1_PER_ID3 = e.B1_PER_ID3 \
			and b.SERV_PROV_CODE = e.SERV_PROV_CODE \
			where b.B1_PER_CATEGORY in ('License', 'Approval') \
			and (b.B1_APPL_STATUS = 'Current' or ( b.B1_APPL_STATUS = 'Inactive' and b.b1_per_type = 'Real Estate' and (b.b1_per_sub_type = 'Salesperson' or b.b1_per_sub_type = 'Broker'))) \
			and b.B1_PER_SUB_TYPE not in ('Assistant Instructor','Jr Instructor') \
			and b.B1_PER_TYPE not in ('Occupational Schools') \
			and e.EXPIRATION_STATUS in( 'About to Expire', 'Active') \
			and e.expiration_date < trunc(sysdate) \
			and (b.b1_per_type =  '" +emseParameters.LICENSE_TYPE+"' OR '" +emseParameters.LICENSE_TYPE+"' IS NULL) \
			and (b.b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL) \
			and (e.EXPIRATION_DATE) < TO_DATE('" +aa.util.formatDate(emseParameters.EXPIRATIONDATE, "MM/dd/yyyy")+ "','mm/dd/yyyy') + 1 \
			and b.REC_STATUS = 'A' \
			and b.serv_prov_code = 'DPL' \
			order by EXPIRATION_DATE asc";

			aa.print(sql);

			var arr = doSQL(sql);
			return arr;
}

function getRecordsArrayBusiness(emseParameters){
		var sql = 
			"SELECT bl.b1_alt_id      AS businessLicenseID, \
			       lp.b1_license_nbr AS individualLicenseNumber,  \
			       lp.b1_lic_board   AS legalBoardName,  \
			       lp.b1_cae_fname   AS contactFirstName,  \
			       lp.b1_cae_lname   AS contactLastName  \
			FROM   accela.b1permit bl,  \
			       accela.b3contra lp,  \
			       rbizdomain_value bc,  \
			       rbizdomain_value bn  \
			WHERE  bc.serv_prov_code = '"+emseParameters.servProvCode+"'  \
			       AND bc.bizdomain = 'BOARD_CODE_INT_RECORD_TYPE'  \
			       AND bc.bizdomain_value = '"+emseParameters.individualBoardCode+"'  \
			       AND bc.serv_prov_code = bn.serv_prov_code  \
			       AND bn.bizdomain = 'LKUP_Board_Name'  \
			       AND bc.value_desc = bn.bizdomain_value  \
			       AND bl.serv_prov_code = '"+emseParameters.servProvCode+"'  \
			       AND bl.b1_per_group = '"+emseParameters.businessGroup+"'  \
			       AND bl.b1_per_type = '"+emseParameters.businessType+"'  \
			       AND bl.b1_per_sub_type = '"+emseParameters.businessSubType+"'  \
			       AND bl.b1_per_category = '"+emseParameters.businessCategory+"'  \
			       AND bl.serv_prov_code = lp.serv_prov_code  \
			       AND bl.b1_per_id1 = lp.b1_per_id1  \
			       AND bl.b1_per_id2 = lp.b1_per_id2  \
			       AND bl.b1_per_id3 = lp.b1_per_id3  \
			       AND lp.b1_license_nbr = '"+emseParameters.individualLicenseNumber+"'  \
			       AND lp.b1_bus_lic = '"+emseParameters.individualTypeClass+"'  \
			       AND lp.b1_lic_board = bn.value_desc"; 

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
