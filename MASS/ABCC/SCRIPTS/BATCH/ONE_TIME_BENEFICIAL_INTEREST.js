// One_Time_Batch_Beneficial_Interest_Remove.js

/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var disableTokens = false;
var showDebug = true; // Set to true to see debug messages in email confirmation
var maxSeconds = 4 * 60; // number of seconds allowed for batch processing, usually < 5*60
var autoInvoiceFees = "Y"; // whether or not to invoice the fees added
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = true; // Use Group name when populating Task Specific Info Values
var currentUserID = "ADMIN";
var publicUser = null;
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var GLOBAL_VERSION = 2.0;
var cancel = false;
var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");
var controlString = "Batch";
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag
var feeSeqList = new Array(); // invoicing fee list
var paymentPeriodList = new Array(); // invoicing pay periods
var bSetCreated = false; //Don't create a set until we find our first app
var setId = "";
var timeExpired = false;
var emailText = "";
var capId = null;
var cap = null;
var capIDString = "";
var appTypeResult = null;
var appTypeString = "";
var appTypeArray = new Array();
var capName = null;
var capStatus = null;
var fileDateObj = null;
var fileDate = null;
var fileDateYYYYMMDD = null;
var parcelArea = 0;
var estValue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var balanceDue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var capDetail = "";
var AInfo = new Array();
var partialCap = false;
var SCRIPT_VERSION = 2.0
	var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
	useSA = true;
	SA = bzr.getOutput().getDescription();
	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
	if (bzr.getSuccess()) {
		SAScript = bzr.getOutput().getDescription();
	}
}

var startTime = startDate.getTime(); // Start timer

if (SA) {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
	eval(getScriptText(SAScript, SA));
} else {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
}

//eval(getScriptText("INCLUDES_BATCH"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getMasterScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

function getScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}
/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
//Needed HERE to log parameters below in eventLog
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("batchJobName");
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
//
// Your variables go here
// Ex. var appGroup = getParam("Group");
//
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|-----------------------------------------------------------------------------------------------------+/
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
// Your script goes here
// Ex. var appGroup = getParam("Group");
//
try {
	var capList = aa.cap.getByAppType("License", "Retail License", "Retail", "Application").getOutput();
	var cap;
	var capId;
	var x = 0;
	//var vGoodStatuses = ["Active","About to Expire"];

	//showDebug = true;
	showMessage = true;

	logMessage("Processing " + capList.length + " records.");

	for (x in capList) {

		//if (x > 20) {
		//	break;
		//}

		logMessage("Time Check 1 : " + elapsed() + " Seconds");

		if (x % 500 === 0) {
			aa.sendMail("noReply@accela.com", "ewylam@etechconsultingllc.com", "", batchJobName + " Progress Results : " + x, message);
		}

		//logMessage("Time Check 2 : " + elapsed() + " Seconds");

		cap = capList[x];
		capId = cap.getCapID();
		cap = cap.getCapModel();

		//vCheck = ["00003-CL-0904", "00009-RS-0838", "03950-RS-0536", "89276-PK-1508","04236-BP-0310"];
		//vCheck = ["89365-PK-0800","WM-LIC-000461"];
		//if (!exists(capId.getCustomID(), vCheck)) {
		//	continue;
		//}

		//		appTypeAlias = cap.getCapModel().getAppTypeAlias();
		//		vLicenseObj = new licenseObject(null, capId);

		//if (!exists(cap.getCapModel().getCapStatus(), vGoodStatuses)) {
		//	continue;
		//}


		if (getContactObjs_Batch(capId, "Beneficial Interest - Individual").length > 0 || getContactObjs_Batch(capId, "Beneficial Interest - Organization").length > 0) {
			logMessage("Processing: " + capId.getCustomID());

			//Generate license report and email
			var vEmailTemplate;
			var vReportTemplate;

			//vEmailTemplate = "BCC TEMP LICENSE ISSUED NOTIFICATION";
			vReportTemplate = "Beneficial Interest Report";

			/*
			var vEParams = aa.util.newHashtable();
			addParameter(vEParams, "$$LicenseType$$", appTypeAlias);
			addParameter(vEParams, "$$ExpirationDate$$", vLicenseObj.b1ExpDate);
			addParameter(vEParams, "$$ApplicationID$$", capId.getCustomID());
			 */

			var vRParams = aa.util.newHashtable();
			addParameter(vRParams, "LicenseNo", capId.getCustomID());

			//emailContacts_BCC("All", vEmailTemplate, vEParams, vReportTemplate, vRParams);
			var vReportName = generateReportForEmail(capId, vReportTemplate, aa.getServiceProviderCode(), vRParams);

			//logMessage("Time Check 3 : " + elapsed() + " Seconds");

			if (vReportName != false) {
				//Remove Contact
				var vContactObjs = [];
				var vContactObj;
				var y = 0;
				var vTotCnt = 0
					var vRemCnt = 0;
				vContactObjs = getContactObjs_Batch(capId, "Beneficial Interest - Individual");

				//logMessage("Time Check 4 : " + elapsed() + " Seconds");

				vTotCnt = vTotCnt + vContactObjs.length;
				for (y in vContactObjs) {
					vContactObj = vContactObjs[y];
					if (vContactObj != false && vContactObj != null) {
						vRemoveResult = aa.people.removeCapContact(capId, vContactObj.seqNumber); // About 3 Sec
						if (vRemoveResult.getSuccess() == true) {
							//logMessage("Time Check 5.1 : " + elapsed() + " Seconds");
							vRemCnt = vRemCnt + 1;
							//logMessage("Successfully removed Beneficial Interest - Individual contact from record: " + capId.getCustomID());
						}
						else {
							//logMessage("Time Check 5.2 : " + elapsed() + " Seconds");
							logMessage("Error removing contact: " + vRemoveResult.getErrorMessage());
						}
					}
				}
				y = 0;
				vContactObjs = getContactObjs_Batch(capId, "Beneficial Interest - Organization");

				//logMessage("Time Check 6 : " + elapsed() + " Seconds");

				vTotCnt = vTotCnt + vContactObjs.length;
				for (y in vContactObjs) {
					vContactObj = vContactObjs[y];
					if (vContactObj != false && vContactObj != null) {
						vRemoveResult = aa.people.removeCapContact(capId, vContactObj.seqNumber); // About 3 Sec
						if (vRemoveResult.getSuccess() == true) {
							//logMessage("Time Check 7.1 : " + elapsed() + " Seconds");
							vRemCnt = vRemCnt + 1;
							//logMessage("Successfully removed Beneficial Interest - Individual contact from record: " + capId.getCustomID());
						}
						else {
							//logMessage("Time Check 7.2 : " + elapsed() + " Seconds");
							logMessage("Error removing contact: " + vRemoveResult.getErrorMessage());
						}
					}
				}
				logMessage("-Removed " + vRemCnt + " of " + vTotCnt + " contacts for record: " + capId.getCustomID());

				//logMessage("Time Check 8 : " + elapsed() + " Seconds");

			}
		}
	}

	logMessage("Time Check 9 : " + elapsed() + " Seconds");

} catch (e) {
	logDebug("Error: " + e);
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0) {
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
} else {
	aa.env.setValue("ScriptReturnCode", "0");
	if (showMessage)
		aa.env.setValue("ScriptReturnMessage", message);
	if (showDebug)
		aa.env.setValue("ScriptReturnMessage", debug);
}

/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function generateReportForEmail(itemCap, reportName, module, parameters) {
//logMessage(" Report Time Check 1 : " + elapsed() + " Seconds");
	//returns the report file which can be attached to an email.
	var vAltId;
	var user = currentUserID; // Setting the User Name
	var report = aa.reportManager.getReportInfoModelByName(reportName);
//logMessage(" Report Time Check 2 : " + elapsed() + " Seconds");	
	var permit;
	var reportResult;
	var reportOutput;
	var vReportName;
	report = report.getOutput();
	report.setModule(module);
	report.setCapId(itemCap);
	report.setReportParameters(parameters);

	vAltId = itemCap.getCustomID();
	report.getEDMSEntityIdModel().setAltId(vAltId);
//logMessage(" Report Time Check 3 : " + elapsed() + " Seconds");
	permit = aa.reportManager.hasPermission(reportName, user);
//logMessage(" Report Time Check 4 : " + elapsed() + " Seconds");	
	if (permit.getOutput().booleanValue()) {
		reportResult = aa.reportManager.getReportResult(report);
//logMessage(" Report Time Check 5 : " + elapsed() + " Seconds");		
		if (!reportResult.getSuccess()) {
			logDebug("System failed get report: " + reportResult.getErrorType() + ":" + reportResult.getErrorMessage());
			return false;
		} else {
			reportOutput = reportResult.getOutput();
			vReportName = reportOutput.getName();
			logMessage("Report " + vReportName + " generated for record " + itemCap.getCustomID() + ". " + parameters);
//logMessage(" Report Time Check 6 : " + elapsed() + " Seconds");			
			return vReportName;
		}
	} else {
		logDebug("Permissions are not set for report " + reportName + ".");
		return false;
	}
}

function getContactObjs_Batch(itemCap) // optional typeToLoad, optional return only one instead of Array?
{
	var typesToLoad = false;
	if (arguments.length == 2)
		typesToLoad = arguments[1];
	var capContactArray = new Array();
	var cArray = new Array();
	typesToLoad = typesToLoad.split(",");

	//logDebug("1) " + typesToLoad);

	var capContactResult = aa.people.getCapContactByCapID(itemCap);
	//logDebug("2) " + capContactResult.getSuccess());
	if (capContactResult.getSuccess()) {
		var capContactArray = capContactResult.getOutput();
	}

	if (capContactArray) {
		//logDebug("3) " + capContactArray.length);
		for (var yy in capContactArray) {
			//logDebug("4) " + capContactArray[yy].getPeople().contactType);
			//logDebug("5) " + typesToLoad);
			//logDebug("6) " + exists(capContactArray[yy].getPeople().contactType, typesToLoad));

			if (!typesToLoad || exists(capContactArray[yy].getPeople().contactType, typesToLoad)) {
				//logDebug("7)");
				cArray.push(new contactObj(capContactArray[yy]));
			}
		}
	}
	//    logDebug("getContactObj returned " + cArray.length + " contactObj(s)");
	return cArray;

}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}
