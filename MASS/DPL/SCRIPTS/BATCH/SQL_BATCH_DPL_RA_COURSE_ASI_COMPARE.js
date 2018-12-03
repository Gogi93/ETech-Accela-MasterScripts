/* ------------------------------------------------------------------------------------------------------ /
 | Program : SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE Trigger : Batch
 |
 | - End dates the multiple mailing address in a contact.
 
 |
 | Batch Requirements :
 | - None
 | Batch Options:
 | - NO PARAMS - All Licenses Types
 | - LicenseType - By Board
 | - LicenseType and LicenseSubType - By License Type
 |
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
var printArr = aa.util.newArrayList();


var AInfo = new Array(); //Used to collect ASI info

var emailText = "";
var publicUser = "";

try {
  eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
  eval(getScriptText("INCLUDES_CUSTOM"));
  eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
   eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
  eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
  eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
  eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
  eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
  eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
  eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
  eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
} catch (ex) {
  var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
  ELPLogging.fatal(returnException.toString());
  throw returnException;
}

// this flag somehow gets reset in the scripts above, resetting here again so that it doesnt log
//showDebug = false;

/* *
 * User Parameters  Begin
 * */
var emailAddress = "";

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
  emailAddress2 = "";

//Set Size
var setSize = getParam("setSize");
if (setSize == null || setSize == "" || setSize == "undefined")
  setSize = 1000;

  



var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryContact",\
					"procedure":{\
						"name":"ELP_SP_RA_COURSE",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[			 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';




var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);

try {


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
    var raCourseProcedure = null;
    for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
      var supplementalConfiguration = stagingConfiguration.supplemental[ii];
      if (supplementalConfiguration.tag == "queryContact") {
        var raCourseProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
      }
    }
    if (raCourseProcedure == null) {
      var message = "Cannot find procedure queryContact";
      var exception = new Error(message);
      throw exception;
    }
   logMessage("Found queryContact: " + supplementalConfiguration.procedure.name);

    /* *
     * The ECB Violation procedure returns a ResultSet of ECB Violations
     */
    var staticParameters = {};
    var dynamicParameters = {};
    var batchApplicationResult = {};
    raCourseProcedure.prepareStatement();
    var inputParameters = raCourseProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
    var emseParameters = {};

    
   

    raCourseProcedure.copyEMSEParameters(emseParameters, inputParameters);
    ELPLogging.debug("inputParameters for Query", inputParameters);
    raCourseProcedure.setParameters(inputParameters);

    //var dataSet = raCourseProcedure.queryProcedure();
    var dataSet = getRecordsArray(emseParameters);
    
    if (dataSet != false || dataSet.length > 0) 
    for (var i in dataSet) {
      ObjKeyRename(dataSet[i], {"B1_PER_ID1":"id1"});
      ObjKeyRename(dataSet[i], {"B1_PER_ID2":"id2"});
      ObjKeyRename(dataSet[i], {"B1_PER_ID3":"id3"});
      ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
      var queryResult = dataSet[i];

    //for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
      if (elapsed() > maxSeconds) // Only continue if time hasn't expired
      {
        logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
        logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
        timeExpired = true;
        break;
      }

      capIdResult = aa.cap.getCapID(queryResult.customID);
      if (!capIdResult.getSuccess()) {
       aa.print("getCapID error: " + capIdResult.getErrorMessage());
        continue;
      }

      var capId = capIdResult.getOutput();
      capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

      var capResult = aa.cap.getCap(capId);
      if (!capResult.getSuccess()) {
       aa.print("getCap error: " + capResult.getErrorMessage());
        continue;
      }

      var cap = capResult.getOutput();
      var altId = capId.getCustomID();
      logDebug("altId = " + altId);
      var capStatus = cap.getCapStatus();
      var appTypeResult = cap.getCapType();
      var appTypeString = appTypeResult.toString();
      var appTypeArray = appTypeString.split("/");
      var licenseType = appTypeArray[1];
      var boardCode = altId.split("-")[1];
      var appCapId = "";

		


 		//aa.print("capId" + capId);
		useAppSpecificGroupName = true;
		
		
		var appACICourseTitle = getAppSpecific("APPROVED COURSE INFORMATION.Course Title",capId); if (appACICourseTitle == null) {appACICourseTitle = "";}
		var appACICourseHrs = getAppSpecific("APPROVED COURSE INFORMATION.Total Course Hours",capId); if (appACICourseHrs == null) {appACICourseHrs = "";}
		var appACICourseType = getAppSpecific("APPROVED COURSE INFORMATION.Course Type",capId);if (appACICourseType == null) {appACICourseType = "";}
		var appACIOnlineCourse = getAppSpecific("APPROVED COURSE INFORMATION.Online Course",capId); if (appACIOnlineCourse == null) {appACIOnlineCourse = "";}
		var appACIBoardApproval = getAppSpecific("APPROVED COURSE INFORMATION.Board Approval Date",capId); if (appACIBoardApproval == null) {appACIBoardApproval = "";}
		var appACIMeetsAQB = getAppSpecific("APPROVED COURSE INFORMATION.Meets AQB Criteria",capId); if (appACIMeetsAQB == null) {appACIMeetsAQB = "";}
		 
		var pcapId = aa.cap.getCapID(capId.getCustomID()).getOutput()
				   var vParentCapID = getParentLicenseRecord(pcapId);//aa.print("vParentCapID" + vParentCapID);
				   
					
					useAppSpecificGroupName = true;
		if (vParentCapID != null || vParentCapID != undefined)
{		
		var licACICourseTitle = getAppSpecific("APPROVED COURSE INFORMATION.Course Title",vParentCapID); if (licACICourseTitle == null) {licACICourseTitle = "";}
		var licACICourseHrs = getAppSpecific("APPROVED COURSE INFORMATION.Total Course Hours",vParentCapID); if (licACICourseHrs == null) {licACICourseHrs = "";}
		var licACICourseType = getAppSpecific("APPROVED COURSE INFORMATION.Course Type",vParentCapID); if (licACICourseType == null) {licACICourseType = "";}
		var licACIOnlineCourse = getAppSpecific("APPROVED COURSE INFORMATION.Online Course",vParentCapID); if (licACIOnlineCourse == null) {licACIOnlineCourse = "";}
		var licACIBoardApproval = getAppSpecific("APPROVED COURSE INFORMATION.Board Approval Date",vParentCapID); if (licACIBoardApproval == null) {licACIBoardApproval = "";}
		var licACIMeetsAQB = getAppSpecific("APPROVED COURSE INFORMATION.Meets AQB Criteria",vParentCapID); if (licACIMeetsAQB == null) {licACIMeetsAQB = "";}
		
		

		if (licACICourseTitle.trim() != appACICourseTitle.trim() || licACICourseHrs.trim() != appACICourseHrs.trim() || licACICourseType.trim() != appACICourseType.trim() || licACIOnlineCourse.trim() != appACIOnlineCourse.trim() ||
			licACIBoardApproval.trim() != appACIBoardApproval.trim() || licACIMeetsAQB.trim() != appACIMeetsAQB.trim() 	)
		
		{
		 printArr.add (vParentCapID.getCustomID());
		 capCount++;
		 
		 		 
		}
		}
		
	  }
	  aa.print (printArr);
	  
  } // end of connection
  else {
    logDebugAndEmail("Unable to get Environment Connection. Exiting batch.");
  }

  
logDebugAndEmail("________________________________________________________________________________");
  logDebugAndEmail("Total Licenses having conflicting ASI's: " + capCount);
  


  //dataSet.close();
} catch (ex) {
  aa.print("exception caught: " + ex.message);

  //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
  aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
  aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE" + ex.message);
 aa.print("     EMSEReturnCode: " + ScriptReturnCodes.OTHER);
 aa.print("     EMSEReturnMessage: " + "Error executing SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE. " + ex.message);

  var returnException = new ELPAccelaEMSEException("Error executing SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE " + ex.message + " " + (ELPLogging.toString()), ScriptReturnCodes.EMSE_PROCEDURE);
  ELPLogging.fatal(returnException.toString());
  throw returnException;
} finally {
  // close objects
  if (dataSet != null) {
    //dataSet.close();
  }
  if (raCourseProcedure != null) {
    raCourseProcedure.close();
  }
  if (databaseConnection != null) {
    databaseConnection.close();
  }

  if (!ELPLogging.isFatal()) {
    //dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
    aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
   aa.print("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
    //ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

    if (ELPLogging.getErrorCount() > 0) {
      aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE completed with " + ELPLogging.getErrorCount() + " errors.");
      logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE completed with " + ELPLogging.getErrorCount() + " errors.");
    } else {
      aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE completed with no errors.");
      logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_DPL_RA_COURSE_ASI_COMPARE completed with no errors.");
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
 aa.print("PARAMETER " + pParamName + " = " + ret);
  return ret;
}

function elapsed() {
  var thisDate = new Date();
  var thisTime = thisDate.getTime();
  return ((thisTime - batchStartTime) / 1000)
}

function logDebugAndEmail(debugText) {
  emailText = emailText + debugText + br;
 aa.print(debugText);
}


function getRecordsArray(emseParameters){
  var sql = 
      "SELECT b.serv_prov_code, \
             b.b1_per_id1, \
             b.b1_per_id2, \
             b.b1_per_id3, \
             b.b1_per_group, \
             b.b1_per_type, \
             b.b1_per_sub_type,\
             b.b1_per_category, \
             b.b1_alt_id, \
             b.b1_appl_status \
           FROM   b1permit b \
      WHERE  b.rec_status = 'A' \
             AND b.serv_prov_code = 'DPL' \
             AND b.b1_per_category LIKE '% Course Application' \
             AND b.b1_per_id1 NOT LIKE '%EST%' "; 

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
