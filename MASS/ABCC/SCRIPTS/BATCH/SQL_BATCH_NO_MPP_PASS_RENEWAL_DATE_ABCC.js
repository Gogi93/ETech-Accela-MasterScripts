/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC
* @Author		:	Sagar Cheke
* @Date			:	04/29/2016
* @Description 	:	The script looks at CoC license records that meet the conditions below. 

For each one of these records, the job adds the "CoC Not Eligible for Renewal" Condition to the associated LP and sends notification to Licensee (outcome letter). The email will be listed in the documents tab of the license record as proof the email was sent to business contact.

	1.IF
		The CoC license record does not have a related Master Price Posting Annual amendment for the calendar year and the associated LP does not
		contain a "CoC Not Eligible for Renewal" condition, 
	  THEN:
		a.Add the "CoC Not Eligible for Renewal" Condition to the LP
		
	2.IF 
		The CoC license record has related Master Price Posting Annual amendment for the calendar year and if Master Price Posting Annual has not
		been uploaded and the associated LP does not contain a "CoC Not Eligible for Renewal" condition, 
	  THEN:
		a.Add the "CoC Not Eligible for Renewal" Condition to the LP
		b.Send notification to business contact (outcome letter)
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
var capId ="";
var capCount = 0;
var condAddedCount = 0;
var emailText = "";
var oneDay = 1000 * 60 * 60 * 24;

var emailAddress = lookup("BATCH_STATUS_EMAIL", "CLOSE_RETAIL_APP"); // This email will be set by standard choice
aa.print("emailAddress : "+emailAddress);
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

/*var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryRecordsFromView",\
					"procedure":{\
						"name":"ELP_SP_COC_RECORDS_ABCC",\
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
			var message = "Cannot find procedure ELP_SP_COC_RECORDS_ABCC";
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
		queryRecordsFromView.setParameters(inputParameters);*/

		// Define the search criteria
		var capTypeModel = aa.cap.getCapTypeModel().getOutput();
		capTypeModel.setGroup("License");
		capTypeModel.setType("State License");
		capTypeModel.setSubType("Certificate of Compliance");
		capTypeModel.setCategory("License");

		var capModel = aa.cap.getCapModel().getOutput();
		capModel.setCapType(capTypeModel);
		capModel.setCapStatus("Issued");

		// Get the list of records by search criteria
		var capIDList = aa.cap.getCapIDListByCapModel(capModel);
		if (!capIDList.getSuccess()) {
			logDebug("**INFO failed to get capIds list " + capIDList.getErrorMessage());
			capIDList = new Array(); //empty array script will exit
		} else {
			capIDList = capIDList.getOutput();
		}
		
		//var dataSet = queryRecordsFromView.queryProcedure();
		var dataSet = capIDList;
		
		var x = 0;
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
		for (x in dataSet) {
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
			
			evaluateCoCRecords(capId, capIDString);
		}
	//}
	
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC" + ex.message);
   ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC. " + ex.message);
   
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
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors." + br;
		}
		else 
		{
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with no errors.");				
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_NO_MPP_PASS_RENEWAL_DATE_ABCC completed with no errors." + br;
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

function evaluateCoCRecords(pCapId, capIDString)
{
	//aa.print("Processing record : "+queryResult.altID);
	aa.print("Processing record : " + capIDString);
	var currentDate = new Date();	
	
	var amendRecord = getChildren("License/State License/Master Price List/Amendment", pCapId);

	if(amendRecord)
	{
		var scanner = new Scanner(amendRecord.toString(), "-");
		var ID1 = scanner.next();
		var ID2 = scanner.next();
		var ID3 = scanner.next();
		var amendRecordModel = aa.cap.getCapIDModel(ID1,ID2,ID3).getOutput();
		
		var capIdScriptModel = aa.cap.getCap(amendRecordModel).getOutput();
		if(capIdScriptModel)
		{
			var fileDate = capIdScriptModel.getFileDate();
			var jsfileDate= new Date(fileDate.getMonth() + "/" + fileDate.getDayOfMonth()+ "/" + fileDate.getYear());
			
			//If the CoC license record has related Master Price Posting Annual amendment for the calendar year and 
			//if Master Price Posting Annual has not been uploaded and the associated LP does not contain a "CoC Not Eligible for Renewal" condition, then:
			if(currentDate.getFullYear() == jsfileDate.getFullYear())
			{
				var isDocAttached = getDocumentListForAmend(amendRecordModel);
				var isCondtnExists = isConditionExistsOnRefLicense(pCapId);
				aa.print("isDocAttached : "+isDocAttached+" isCondtnExists : "+isCondtnExists);
				if(!isDocAttached && !isCondtnExists)
				{
					//Add the "CoC Not Eligible for Renewal" Condition to the LP
					var capLicenses = getLicenseProfessional(pCapId);
					if (capLicenses == null || capLicenses.length == 0)
					{
						logDebug("WARNING: Unable to retrieve the Ref lics");
						return;
					}
					for(eachLic in capLicenses)
					{
						var thisLic = capLicenses[eachLic];
						var licenseNumber = thisLic.getLicenseNbr();
						
						if(licenseNumber == pCapId.getCustomID())
						{
							var refLicProf = getRefLicenseProf(thisLic.getLicenseNbr());
							var licSeq = refLicProf.getLicSeqNbr();
							aa.print("licSeq : "+licSeq);
							addCondionOnRefLic(licSeq, "Review", "CoC Not Eligible for Renewal", jsDateToMMDDYYYY(new Date()));
						}
					}
					
					//Add record to email set: ABCC_MPP_NOT_FOUND_MMDDYYYY
					var currentDate = dateFormattedIntC(new Date(),"MMDDYYYY");
					var setName = "ABCC_MPP_NOT_FOUND_"+currentDate;
					
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
					//Send notification to business contact (outcome letter)
					CWM_ELP_WTUA_Email_Application_Outcome_Letter()
				}		
			}	
		}
	}
	else
	{
		//If the CoC license record does not have a related Master Price Posting Annual amendment for the calendar year 
		//and the associated LP does not contain a "CoC Not Eligible for Renewal" condition, then:
		var isCondtnExists = isConditionExistsOnRefLicense(pCapId);
		if(!isCondtnExists)
		{
			var capLicenses = getLicenseProfessional(pCapId);
			if (capLicenses == null || capLicenses.length == 0)
			{
				logDebug("WARNING: Unable to retrieve the Ref lics");
				return;
			}
			for(eachLic in capLicenses)
			{
				var thisLic = capLicenses[eachLic];
				var licenseNumber = thisLic.getLicenseNbr();
				
				//if(licenseNumber == capID.getCustomID())
				if(licenseNumber == pCapId.getCustomID())
				{
					var refLicProf = getRefLicenseProf(thisLic.getLicenseNbr());
					var licSeq = refLicProf.getLicSeqNbr();
					addCondionOnRefLic(licSeq, "Review", "CoC Not Eligible for Renewal", jsDateToMMDDYYYY(new Date()));
				}
			}
		}
	
	}
}

/**
 * @desc This method will check the condition on reference license.
 * @returns {boolean} - boolean value
 */
function getDocumentListForAmend(amendRecordModel) 
{
	var isDocAttached = false;
	var docListArray = new Array();
	docListResult = aa.document.getCapDocumentList(amendRecordModel, currentUserID);
	if (docListResult.getSuccess())
	{
		docListArray = docListResult.getOutput();
		for(x in docListArray)
		{
			if(docListArray[x].getDocCategory() == "Master Price Posting - Annual")
				isDocAttached =true;
		}
		
	}
	return isDocAttached;
}

/**
 * @desc This method will check the condition on reference license.
 * @returns {boolean} - boolean value
 */
function isConditionExistsOnRefLicense(pCapId)
{
	var isCondExistsOnRefLic = false;
	var reqdConditionDescription = "CoC Not Eligible for Renewal";
	var capLicenses = getLicenseProfessional(pCapId);
	if (capLicenses == null || capLicenses.length == 0)
	{
		logDebug("WARNING: Unable to retrieve the Ref lics");
		return;
	}
	
	for(eachLic in capLicenses)
	{
		var thisLic = capLicenses[eachLic];
		var licenseNumber = thisLic.getLicenseNbr();
		
		if(licenseNumber == capID.getCustomID())
		{
			var refLicProf = getRefLicenseProf(thisLic.getLicenseNbr());
			var licSeq = refLicProf.getLicSeqNbr();
			
			var CAEConditionResult = aa.caeCondition.getCAEConditions(aa.util.parseLong(licSeq));
			if(CAEConditionResult.getSuccess())
			{
				var CAEConditionScriptResult = CAEConditionResult.getOutput();
				for(x in CAEConditionScriptResult)
				{
					var condDesc = CAEConditionScriptResult[x]. getConditionDescription();
					if(condDesc.toUpperCase() ==  reqdConditionDescription.toUpperCase())
					{
						isCondExistsOnRefLic = true;
					}
				}
				
			}			
		}
	}
	return isCondExistsOnRefLic;
}

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

/**
 * @desc This method format current date to MM/dd/YYYY.
 */
function dateFormattedIntC(dateObj,pFormat){
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
