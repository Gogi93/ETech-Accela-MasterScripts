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
var executionDate = getParam("executionDate"); 

var emailText = "";
var publicUser = "";

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryLicensestoExpire",\
					"procedure":{\
						"name":"ELP_SP_EXPIRE_REN_JUL1ST_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
 														 {"source":"RESULT","name":"LICENSE_TYPE","parameterType":"IN","property":"LICENSE_TYPE","type":"STRING"},\
														 {"source":"RESULT","name":"LICENSE_SUBTYPE","parameterType":"IN","property":"LICENSE_SUBTYPE","type":"STRING"},\
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

var licenseTypeParam = getParam("LicenseType");
var licenseSubtypeParam = getParam("LicenseSubType");
var fromDtParam = getParam("FromDate");
var toDateParam = getParam("ToDate");
 
var emailAddress = lookup("BATCH_STATUS_EMAIL", "EXPIRED"); // This email will be set by standard choice
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

var fromDt;
var toDate;

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

var currentTime = new Date();
currentTime = (currentTime.getMonth()+1) + "/" + currentTime.getDate() + "/" + currentTime.getFullYear();

if (executionDate == "" || executionDate == null || executionDate == "undefined"){
	var currentDate = new Date();
	var year = currentDate.getFullYear();
	var executionDate = "7/1" +"/"+ year;
	
}
aa.print(currentTime + " | " + executionDate);
//check if its July 1st
//Commented out the date check, as we should be able to run it manually on any date. For defect#12751
//if(currentTime == executionDate) 
//{
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
		licenseRenewalProcedure.prepareStatement();
		var inputParameters = licenseRenewalProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};
		 
		// If Expiration date not passed in via batch job parameter, it is defined here as 12/31/[Current Year] 
		if( fromDtParam == null || fromDtParam == "undefined" || fromDtParam == "" || toDateParam == null || toDateParam == "undefined" || toDateParam == "")
		{
			var currentDate = new Date();
			var year = currentDate.getFullYear()
			var expdate = "12/31" +"/"+ year;
			toDate = new Date(expdate);
			fromDt = new Date(expdate);
			ELPLogging.debug("Expiration Date Range not set via parameter. Setting Default expiration date: " + expdate);
		}
		else
		{
			fromDt = new Date(fromDtParam);
			toDate = new Date(toDateParam);	
		}

		if((licenseTypeParam == null || licenseTypeParam == "undefined" || licenseTypeParam == "" ) && 
			 (licenseSubtypeParam == null || licenseSubtypeParam == "undefined" || licenseSubtypeParam == "" ) )
			ELPLogging.debug("License Type not set via parameter. Processing all open ABCC Renewals"); 
			
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
			ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
			//aa.print("My Test>> "+queryResult.customID);
			var queryResult = dataSet[i];
			if (elapsed() > maxSeconds) // only continue if time hasn't expired
			{ 
				aa.print("Time out Error");
				timeExpired = true ;
				break; 
			}
             
			try
			{
				capId = capIdResult = aa.cap.getCapID(queryResult.customID).getOutput();
				//aa.print(queryResult.customID);
                var cap = aa.cap.getCap(capId).getOutput();
                myAppTypeString = cap.getCapType().toString();
                
                    var capStatus = cap.getCapStatus();
                    var capId1 = capId.getID1();  
                    var capId2 = capId.getID2();    
                    var capId3 = capId.getID3();
                    var capidModel=aa.cap.getCapIDModel(capId1,capId2,capId3).getOutput();
                    var altId=capId.getCustomID();
                    
                    var parentCapId = getParentLicenseCapID(capId);
                    if(parentCapId)
                    {
						parentCapId = aa.cap.getCapID(parentCapId.ID1, parentCapId.ID2, parentCapId.ID3).getOutput();
                        var parentCap = aa.cap.getCap(parentCapId).getOutput();
                        var parentAltId = parentCapId.getCustomID();
                        var lic = new licenseObject(parentAltId, parentCapId);
                        var parentRenewalStatus = lic.getStatus();
                        var parentRecordStatus   = parentCap.getCapStatus();
                        var parentTypeString = parentCap.getCapType().toString();
						logDebug("parentTypeString: " +parentTypeString);
                        if(parentTypeString != "License/State License/Transportation Permit/License")
						{
							if(parentRenewalStatus == "About to Expire" && parentRecordStatus == "Expired")
							{
								ELPLogging.debug("Parent Lic: " + parentAltId);
								ELPLogging.debug("Cap Status: " + parentCap.getCapStatus());
								ELPLogging.debug("Renewal Status: " + parentRenewalStatus);
                          
                                                
								var stat="Expired";
								var cmt="On July 1st License Renewal is expired";
								updateAppStatus(stat,cmt,capId); 
							
								//updating TMP record to inactive
								var tmpCap=aa.cap.getCap(capId).getOutput();
								tmpCap.setAuditStatus("I");
								aa.cap.updateAppWithModel(tmpCap);
								ELPLogging.debug("Setting TMP record to Inactive");

								//set renewal status to Expired 
								var parentRenewalStatus1 = lic.setStatus("Expired");
                            
								// Make the TMP Renewal inaccessible in ACA
								editCreatedBy(currentUserID, capId);
								aa.cap.updateCreatedAccessBy4ACA(capId, currentUserID, "N", "N");
								capCount++;   
							
							  
                              ELPLogging.debug("Renewal record status changed from " + capStatus + " to Expired for record: " + altId + " with License number " + parentAltId);       
							}
						}
                        //else{
                        //    ELPLogging.debug("WARNING: Did not update status for tmp record: " + altId + " because license record status is not Expired " + parentAltId);
                        //}
                    }
                    else{
                        ELPLogging.debug("WARNING: Did not find parent license for tmp record: " + altId);
                    }
			}//end try
			catch (e)
			{
				ELPLogging.debug(e.message);
			}     
		}//end for
	}
	catch (ex)
	{
		aa.print("exception caught: " + ex.message);
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
		aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1st" + ex.message);
		ELPLogging.debug("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
		ELPLogging.debug("     EMSEReturnMessage: " + "Error executing SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1st. " + ex.message);
		emailText =  emailText + "Error executing SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1st" + ex.message + br;
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
				aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with " + ELPLogging.getErrorCount() + " errors.");
				ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with " + ELPLogging.getErrorCount() + " errors.");
				emailText = emailText +  "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with " + ELPLogging.getErrorCount() + " errors." + br;
			} else {
				aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with no errors.");
				ELPLogging.debug("     EMSEReturnMessage: " + "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with no errors.");				
				emailText = emailText +  "SQL_BATCH_ABCC_EXPIRE_RENEWAL_JUL_1ST completed with no errors." + br;
			}
		}
		ELPLogging.debug("Renewals Processed: " + capCount);
		emailText = emailText + "Renewals Processed: " + capCount + br;
	}

	/*if (emailAddress.length > 0 && capCount > 0) {
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
		ELPLogging.debug("Email sent to " + emailAddress);
	} else {
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, "Batch Job Ran Successfully, No Renewal Records Found.");
		ELPLogging.debug("Email sent to " + emailAddress);
	} 	
	aa.print(ELPLogging.toString());*/

//}
//end mainProcess

if (emailAddress.length > 0 && capCount > 0) {
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
	var sql = "SELECT SERV_PROV_CODE,B1_PER_ID1,B1_PER_ID2,B1_PER_ID3,B1_PER_GROUP,B1_PER_TYPE,B1_PER_SUB_TYPE,B1_PER_CATEGORY,REC_STATUS,B1_ALT_ID,B1_APPL_STATUS \
from B1PERMIT \
where B1_PER_CATEGORY = 'Renewal' \
and b1_appl_class like '%INCOMPLETE%'\
AND B1_APPL_STATUS is NULL \
and REC_STATUS = 'A' \
and SERV_PROV_CODE = 'ABCC' \
and (b1_per_type =  '" +emseParameters.LICENSE_TYPE+"' OR '" +emseParameters.LICENSE_TYPE+"' IS NULL) \
and (b1_per_sub_type = '" +emseParameters.LICENSE_SUBTYPE+"' OR '" +emseParameters.LICENSE_SUBTYPE+"' IS NULL)";
			
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
