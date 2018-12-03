/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC
* @Author		:	Sagar Cheke
* @Date			:	05/02/2016
* @Description 	:	The script looks at CoC license records that meet the conditions below. For each one of these records, 
					the batch job add the CoC license record to the email set, populates email template and sends email to 
					business contact. The email will be attached to the CoC license record.
					1. Record Status of "Issued"
***********************************************************************************************************************************/
try
{
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
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
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
//var capId ="";
var capCount = 0;
var condAddedCount = 0;
var emailText = "";
var oneDay = 1000 * 60 * 60 * 24;

var emailAddress = lookup("BATCH_STATUS_EMAIL", "MPP_RENEWAL_REMINDER"); // This email will be set by standard choice
aa.print("emailAddress : "+emailAddress);
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

/*var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryRecordsFromView",\
					"procedure":{\
						"name":"ELP_SP_COC_LICENSE_ABCC",\
						"resultSet":{"list":[\
												{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAP_ID","type":"STRING"},\
												{"source":"RESULT","name":"perType","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\
												{"source":"RESULT","name":"altID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
												{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);*/

try
{
	//var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	//if(dbConfiguration)
	//{
		//this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		//ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		
		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		/*var queryRecordsFromView = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryRecordsFromView")
			{
				 var queryRecordsFromView = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (queryRecordsFromView == null)
		{
			var message = "Cannot find procedure ELP_SP_COC_LICENSE_ABCC";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryRecordsFromView : " + supplementalConfiguration.procedure.name);
		
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		queryRecordsFromView.prepareStatement();
		var inputParameters = queryRecordsFromView.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		queryRecordsFromView.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		queryRecordsFromView.setParameters(inputParameters);

		var dataSet = queryRecordsFromView.queryProcedure();*/
		
		var dataSet = getRecordsBySQL();
	
		logMessage("Total Records: " + dataSet.length);
		
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
		var x = 0;
		for (x in dataSet){
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}
			
			//var capID = aa.cap.getCapID(queryResult.altID).getOutput();
			var capID = dataSet[x];
			var capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
			
			//var scanner = new Scanner(capID.toString(), "-");
			//var ID1 = scanner.next();
			//var ID2 = scanner.next();
			//var ID3 = scanner.next();
			//capId = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
			
			var capId = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput();
			
			evaluateCoCLicenseRecords(capId, capID, capIDString);
		}
	//}
	
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	/*if (dataSet != null)
	{
		dataSet.close();
	}
	
	if (queryRecordsFromView != null) 
	{
		queryRecordsFromView.close();
	}
	
	if (databaseConnection != null) 
	{
		databaseConnection.close();
	}*/
	
	if (!ELPLogging.isFatal()) {
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		//ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);
		
		if (ELPLogging.getErrorCount() > 0) 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with " + ELPLogging.getErrorCount() + " errors." + br;
		}
		else 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with no errors.");				
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_MPP_RENEWAL_DATE_REMINDER_ABCC completed with no errors." + br;
		}
	}
	
	if (emailAddress && emailAddress != "" && emailAddress.length > 0 ) 
	{
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	}
	else 
	{
		aa.print("Email not sent. Standard Choice lookup failed or not found.");
	}
	
	aa.print(ELPLogging.toString());
}

/**
 * @desc This method processes CoC license records from VIEW
 * @param {capId} contains record ID.
 * @returns NA
 */
function evaluateCoCLicenseRecords(pCapId, capID, capIDString)
{
	//aa.print("Processing record ID : "+queryResult.altID);
	aa.print("Processing record ID : " + capIDString);
	
	//var capID = aa.cap.getCapID(queryResult.altID).getOutput();
	//var capID = aa.cap.getCapID(capIDString).getOutput();
	
	var scanner = new Scanner(capID.toString(), "-");
	var ID1 = scanner.next();
	var ID2 = scanner.next();
	var ID3 = scanner.next();
	
	var currentDate = dateFormattedIntC(new Date(), "MMDDYYYY");
		
	//Add record to email set: ABCC_MPP_REMINDER_MMDDYYYY
	var setName = "ABCC_MPP_REMINDER_" + currentDate;
	
	// Check if set already exist.
	var setResult = aa.set.getSetByPK(setName);
	
	if(setResult.getSuccess())
	{
		aa.print("Set: " + setName + " already exists.");
	}
	else
	{
		// Create a new set if it does not already exists.
		var newSetResult = aa.set.createSet(setName, setName);
		if(newSetResult.getSuccess())
		{
			aa.print("Successfully created the set: " + setName);
		}
		else
		{
			aa.print("Unable to create set " + setName + " : \n Error: " + ScriptReturnCodes.EMSE_PROCEDURE);
			throw new ELPAccelaEMSEException("Unable to create set ", ScriptReturnCodes.EMSE_PROCEDURE);
			// throw an exception
		}
	}
	
	var setDetail = aa.set.getSetDetailsScriptModel();
	var setDetailsModel = null;
	if (setDetail.getSuccess()) 
	{
		setDetailsModel = setDetail.getOutput();
		setDetailsModel.setID1(ID1);
		setDetailsModel.setID2(ID2);
		setDetailsModel.setID3(ID3);
		setDetailsModel.setSetID(setName);
	}
	
	var memberListResult = aa.set.getSetMembers(setDetailsModel);
	
	if(memberListResult.getSuccess()) {
		var memberList = memberListResult.getOutput();
		//If the member list size is more than zero then record is not present in the set
		if(memberList.size())
		{
			aa.print("Record already exists in the set");
		}
		else
		{
			aa.set.add(setName,pCapId);	
		}
	}
	
	sendEmailForCoC(pCapId, setName, setDetailsModel);

}

/**
 * @desc This method will create Renewal records for CA board.
 * @param {capId} contains record ID.
 * @param {setName} contains set Name.
 * @param {setDetailsModel} contains setDetailsModel.
 * @returns NA
 */
function sendEmailForCoC(pCapId, setName, setDetailsModel)
{
	var contactEmails = new Array();
	var emailTemplate = "AA_MPP_NEW";
	var emailParameters = getEmailTemplateParametersXXX(pCapId);
	
	var fvEmailParameters = aa.util.newHashtable();
	//fvEmailParameters.put("$$AltID$$", capID.getCustomID());
	fvEmailParameters.put("$$AltID$$", pCapId.getCustomID());
	fvEmailParameters.put("$$RecTypeAlias$$", emailParameters.appType);
	fvEmailParameters.put("$$ExpDate$$", emailParameters.ExpirationDate);
	fvEmailParameters.put("$$ACAUrl$$", emailParameters.ACA_LINK);
	fvEmailParameters.put("$$FullName$$", emailParameters.businessFullName);
	fvEmailParameters.put("$$BusinessName$$", emailParameters.businessBusinesName);
		
	var fvCapID4Email = aa.cap.createCapIDScriptModel(pCapId.getID1(),pCapId.getID2(),pCapId.getID3());
	var fvFileNames = [];
	
	var capContactArr = getPeople(pCapId);
	for (contactItem in capContactArr)
	{
		var contactType = capContactArr[contactItem].getCapContactModel().getPeople().getContactType();
		var email = capContactArr[contactItem].getCapContactModel().getEmail();
		if (contactType != null && (String(contactType).toUpperCase() == "BUSINESS")) 
		{
		  if (email != null) 
		  {
			var atIndex = String(capContactArr[contactItem].email).indexOf("@");
			var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
			if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) // basic email validation
			{  
				contactEmails.push(capContactArr[contactItem].email);
				fvEmailParameters.put("Contact_Name", capContactArr[contactItem].fullName);
			}
		  }
		}
	}
	
	if(contactEmails && contactEmails.length > 0) 
	{
		for (validEmail in contactEmails)
		{
			var fvEmailID = contactEmails[validEmail];
			aa.print("fvEmailID : "+fvEmailID);
			var sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(sysFromEmail, fvEmailID,"","AA_MPP_NEW", fvEmailParameters, fvCapID4Email, fvFileNames);
			
			if(sendNotificationResult.getSuccess())
			{
				setDetailsModel.setSetMemberStatus("Emailed");
				var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
				if (!updateResult.getSuccess())
                     aa.print("Script failed up to update SetMemberStatus for record " + pCapId.getCustomID());
		   }
		}
	}
}

/**
 * @desc This method format current date to MM/dd/YYYY.
 */
function dateFormattedIntC(dateObj, pFormat){
	var mth = "";
	var day = "";
	var ret = "";
	if (dateObj == null) {
		return "";
	}
	if (dateObj.getMonth() >= 9) {
		mth = "" + (dateObj.getMonth()+1);
	} else {
		mth = "0" + (dateObj.getMonth()+1);
	}
	if (dateObj.getDate() > 9) {
		day = dateObj.getDate().toString();
	} else {
		day = "0"+dateObj.getDate().toString();
	}
	if (pFormat=="YYYY-MM-DD") {
		ret = dateObj.getFullYear().toString()+"-"+mth+"-"+day;
	} else if (pFormat == "MMDDYYYY") {
		ret = ""+mth+day+dateObj.getFullYear().toString();		
	} else if (pFormat == "YYYYMMDD") {
		ret = ""+dateObj.getFullYear().toString()+mth+day;		
	} else {
		ret = ""+mth+"/"+day+"/"+dateObj.getFullYear().toString();
	}

	return ret;
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
    selectString = "SELECT B1PERMIT.B1_PER_ID1 || '-' || B1PERMIT.B1_PER_ID2 || '-' || B1PERMIT.B1_PER_ID3 AS CapId FROM B1PERMIT WHERE B1PERMIT.SERV_PROV_CODE = 'ABCC' AND B1PERMIT.B1_PER_GROUP = 'License' AND B1PERMIT.B1_PER_TYPE = 'State License' AND B1PERMIT.B1_PER_SUB_TYPE = 'Certificate of Compliance' AND B1PERMIT.B1_PER_CATEGORY IN ('License','Amendment') AND B1PERMIT.B1_APPL_STATUS = 'Issued' AND B1PERMIT.REC_STATUS = 'A' AND B1PERMIT.B1_ALT_ID NOT LIKE '%EST%' AND B1PERMIT.B1_ALT_ID NOT LIKE '%TMP%' ORDER BY B1PERMIT.REC_DATE DESC";

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