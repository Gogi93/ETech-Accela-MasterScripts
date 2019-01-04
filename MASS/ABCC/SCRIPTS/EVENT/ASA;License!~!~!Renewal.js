//Start Core Renewal Functionality
var showDebug = 3
	if (parentCapId == "undefined" || parentCapId == null) {
		parentCapId = aa.env.getValue("ParentCapID");
	}

	var vGoodToRenew = false;
var vOrgCapId;
var isLLARenewal = (appMatch("License/Retail License/LLA Review/Renewal") || appMatch("License/Retail License/Retail/Renewal")) //License/Retail License/Retail/Renewal appMatch was added by John Bennett to preserve new Renewal Logic functionality

//Update for EPLACE-4451 By Evan Cai 9/28/2019
//Setup/Check renewal
//vGoodToRenew = prepareRenewal();
if (!isLLARenewal && isRenewProcessWithCheckParent(parentCapId, capId)) {
	aa.print("CAPID(" + parentCapId + ") is ready for renew. PartialCap (" + capId + ")");
	//2. Associate partial cap with parent CAP.
	var result = aa.cap.createRenewalCap(parentCapId, capId, true);
	if (result.getSuccess()) {
		//3. Copy key information from parent license to partial cap
		vGoodToRenew = true;
		//4. Set B1PERMIT.B1_ACCESS_BY_ACA to "N" for partial CAP to not allow that it is searched by ACA user.
		//if (publicUser){
		aa.cap.updateAccessByACA(capId, "Y");
		//}
		//else {
		//aa.cap.updateAccessByACA(capId, "N");
		//}
	} else {
		aa.print("ERROR: Associate partial cap with parent CAP. " + result.getErrorMessage());
	}
}
if (vGoodToRenew) {

	//Copy Parcels from license to renewal
	copyParcels(parentCapId, capId);

	//Copy addresses from license to renewal
	copyAddress(parentCapId, capId);

	//copy ASI Info from license to renewal
	copyASIInfo(parentCapId, capId);

	//Copy ASIT from license to renewal (exclude Permit Information)

	//Added by Evan Cai 11-1-2017 for PHOENIX-708
	if (appMatch("License/State License/Certificate of Compliance/Renewal")) {
		copyASITablesForRenewal(parentCapId, capId);
	} else {
		copyASITables(parentCapId, capId);
	}

	//Copy Contacts from license to renewal
	//copyContacts3_0(parentCapId, capId);

	if (appMatch("License/State License/Transportation Permit/Renewal")) {

		copyContactsByTypeWithAddress(parentCapId, capId, "Business");
		copyContactsByTypeWithAddress(parentCapId, capId, "Licensed Individual")

	} else {
		//Copy Contacts from license to renewal
		copyContacts3_0(parentCapId, capId);
	}

	//Copy Work Description from license to renewal
	aa.cap.copyCapWorkDesInfo(parentCapId, capId);

	//Copy application name from license to renewal
	editAppName(getAppName(parentCapId), capId);

	//Update ACA Components and remove Application Contact
	var vContactResult;
	var vContactAry = [];
	var vCapContactModel;
	var vContactTypeToCheckFor = "Application Contact";
	var vContactSeqNumber = 0;
	var vPeopleModel;
	var yy = 0;
	/*vContactResult = aa.people.getCapContactByCapID(capId);
	if (vContactResult.getSuccess()) {
	vContactAry = vContactResult.getOutput();
	for (yy in vContactAry) {
	vCapContactModel = vContactAry[yy].getCapContactModel();
	// Remove Application Contact
	if (vCapContactModel.getContactType() == vContactTypeToCheckFor) {
	vPeopleModel = vContactAry[yy].getPeople();
	vContactSeqNumber = parseInt(vPeopleModel.getContactSeqNumber());
	aa.people.removeCapContact(capId, vContactSeqNumber);
	}
	// update ACA components
	//vCapContactModel.setComponentName(null);
	//aa.people.editCapContactWithAttribute(vCapContactModel);
	//The API editContactByCapContact will update the reference contact with Business type. So just comment at first 10-18-2017 by Evan Cai PHOENIX-675
	if (vCapContactModel.getContactType() == "Business") {
	vCapContactModel.setComponentName("Applicant");
	aa.people.editCapContactWithAttribute(vCapContactModel);
	}
	}
	}
	 */

	//Update ACA Components and remove Application Contact
	// Get people with target CAPID.
	var capPeoples = getPeople3_0(capId); //This will get the contact with address information.
	// Check to see which people is matched in both source and target.
	for (loopk in capPeoples) {
		sourcePeopleModel = capPeoples[loopk];
		if (sourcePeopleModel != null) {
			vCapContactModel = sourcePeopleModel.getCapContactModel();
			// Remove Application Contact
			if (vCapContactModel.getContactType() == vContactTypeToCheckFor) {
				vPeopleModel = sourcePeopleModel.getPeople();
				vContactSeqNumber = parseInt(vPeopleModel.getContactSeqNumber());
				aa.people.removeCapContact(capId, vContactSeqNumber);
			}
			// update ACA components
			vCapContactModel.setComponentName(null);
			aa.people.editCapContactWithAttribute(vCapContactModel);
			//The API editContactByCapContact will update the reference contact with Business type. So just comment at first 10-18-2017 by Evan Cai PHOENIX-675
			if (vCapContactModel.getContactType() == "Business") {
				vCapContactModel.setComponentName("Applicant");
				aa.people.editCapContactWithAttribute(vCapContactModel);
			}
		}
	}

	//Clear ASI
	editAppSpecific("Signature", "");
	editAppSpecific("Title", "");
}
//End Core Renewal Functionality

function copyASITablesForRenewal(pFromCapId, pToCapId) {
	// Function dependencies on addASITable()
	var itemCap = pFromCapId;
	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray();
	var tai = ta.iterator();
	var tableArr = new Array();
	while (tai.hasNext()) {
		var tsm = tai.next();
		var tempObject = new Array();
		var tempArray = new Array();
		var tn = tsm.getTableName() + "";
		var numrows = 0;
		if (!tsm.rowIndex.isEmpty()) {
			var tsmfldi = tsm.getTableField().iterator();
			var tsmcoli = tsm.getColumns().iterator();
			var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
			var numrows = 1;
			while (tsmfldi.hasNext()) // cycle through fields
			{
				if (!tsmcoli.hasNext()) // cycle through columns
				{
					var tsmcoli = tsm.getColumns().iterator();
					tempArray.push(tempObject); // end of record
					var tempObject = new Array(); // clear the temp obj
					numrows++;
				}
				var tcol = tsmcoli.next();
				var tval = tsmfldi.next();
				if (tcol == "TTB Permit Number" && tval == null) {
					tval = 0;
				}

				var readOnly = 'N';
				if (readOnlyi.hasNext()) {
					readOnly = readOnlyi.next();
				}
				var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
				tempObject[tcol.getColumnName()] = fieldInfo;
				//tempObject[tcol.getColumnName()] = tval;
			}
			tempArray.push(tempObject); // end of record
		}
		addASITable(tn, tempArray, pToCapId);
		logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
	}
}

//Add by Evan Cai 11-5 for EPLACE-5378
function isRenewProcessWithCheckParent(parentCapID, partialCapID) {
	//1. Check to see parent CAP ID is null.
	if (parentCapID == null || partialCapID == null
		 || aa.util.instanceOfString(parentCapID)) {
		return false;
	}
	//2. Get CAPModel by PK for partialCAP.
	var result = aa.cap.getCap(partialCapID);
	if (result.getSuccess()) {
		capScriptModel = result.getOutput();
		//2.1. Check to see if it is partial CAP.
		if (capScriptModel.isCompleteCap()) {
			aa.print("ERROR: It is not partial CAP(" + capScriptModel.getCapID() + ")");
			return false;
		}
	} else {
		aa.print("ERROR: Fail to get CAPModel (" + partialCapID + "): " + result.getErrorMessage());
		return false;
	}
	//3.  Check to see if the renewal was initiated before.
	result = aa.cap.getProjectByMasterID(parentCapID, "Renewal", "Incomplete");
	if (result.getSuccess()) {
		partialProjects = result.getOutput();
		if (partialProjects != null && partialProjects.length > 0) {
			//Avoid to initiate renewal process multiple times.
			aa.print("Warning: Renewal process was initiated before. ( " + parentCapID + ")");
			return false;
		}

	}
	//4 . Check to see if parent CAP is ready for renew.
	return isReadyRenew(parentCapID);
}
