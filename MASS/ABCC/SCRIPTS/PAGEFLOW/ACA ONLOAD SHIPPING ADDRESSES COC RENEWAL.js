/*------------------------------------------------------------------------------------------------------/
| Program : ACA ONLOAD SHIPPING ADDRESSES COC RENEWAL.js
| Event   : ACA ONLOAD SHIPPING ADDRESSES COC RENEWAL
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var showDebug = false; // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; // Use Group name when populating Task Specific Info Values
var cancel = false;
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag

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

if (SA) {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
    eval(getScriptText(SAScript, SA));
} else {
    eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
}

eval(getScriptText("INCLUDES_CUSTOM"));

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


var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var servProvCode = capId.getServiceProviderCode()               // Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var capIDString = capId.getCustomID();              // alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();   // Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();           // Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");            // Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var AInfo = new Array();                        // Create array for tokenized variables
//loadAppSpecific4ACA(AInfo);
//loadASITables4ACA_Custom();    // Using a custom function from Rel A.
useAppSpecificGroupName = true;
var cap = aa.env.getValue("CapModel");
var parentId = cap.getParentCapID();
var cancelMessage = "It is: ";
// page flow custom code begin

// page flow custom code begin
try {
	var vCapASITGroup;
	var vUpdatedASIT;
	var vTableName = "SHIPPING ADDRESS";

	var gm = cap.getAppSpecificTableGroupModel();
	var ta = gm.getTablesMap();
	var tai = ta.values().iterator();

	while (tai.hasNext()) {
		var tsm = tai.next();
		var tn = tsm.getTableName();

		if (!tn.equals(vTableName)) continue;
		if (tsm.rowIndex.isEmpty()) {
			logDebug("Couldn't load ASI Table " + vTableName + ": it is empty");
		}

		var tempObject = new Array();
		var tempArray = new Array();

		var tsmfldi = tsm.getTableField().iterator();
		var tsmcoli = tsm.getColumns().iterator();
		var numrows = 1;

		while (tsmfldi.hasNext())  // cycle through fields 
		{
			if (!tsmcoli.hasNext()) {  // cycle through columns

				var tsmcoli = tsm.getColumns().iterator();
				tempArray.push(tempObject);  // end of record
				var tempObject = new Array();  // clear the temp obj
				numrows++;
			}
			var tcol = tsmcoli.next();
			var tval = tsmfldi.next();
			var readOnly;
			var fieldInfo;
			if (tcol.getColumnName() != "Address Type") {
				readOnly = 'Y';
				fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
			} else {
				readOnly = 'N';
				fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
			}
		
			tempObject[tcol.getColumnName()] = fieldInfo;
		}
		tempArray.push(tempObject);  // end of record
	}

		vCapASITGroup = cap.getAppSpecificTableGroupModel();
		vUpdatedASIT = replaceASITable4ACAPageFlow(vCapASITGroup, vTableName, tempArray);
		cap.setAppSpecificTableGroupModel(vUpdatedASIT);

		aa.env.setValue("CapModel", cap);
} catch (err) {

	logDebug(err);

}

// page flow custom code end


if (debug.indexOf("**ERROR") > 0) {
	aa.env.setValue("ErrorCode", "1");
	aa.env.setValue("ErrorMessage", debug);
} else {
	if (cancel) {
		aa.env.setValue("ErrorCode", "-2");
		if (showMessage)
			aa.env.setValue("ErrorMessage", message);
		if (showDebug)
			aa.env.setValue("ErrorMessage", debug);
	} else {
		aa.env.setValue("ErrorCode", "0");
		if (showMessage)
			aa.env.setValue("ErrorMessage", message);
		if (showDebug)
			aa.env.setValue("ErrorMessage", debug);
	}
}