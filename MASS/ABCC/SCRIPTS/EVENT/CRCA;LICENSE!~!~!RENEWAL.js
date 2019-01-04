/*------------------------------------------------------------------------------------------------------/
/ Program : CRCA;License!~!~!Renewal.js
/ Event: ConvertToRealCapAfter
/
/------------------------------------------------------------------------------------------------------*/
/*
 *
 * CRCA;License!~!~!Renewal.js
 *
 */

var useAppSpecificTableGroupName = false;
showDebug = 3;

aa.cap.updateAccessByACA(capId, "Y");
if (!appMatch("License/Retail License/LLA Review/Renewal"))
{

aa.runScriptInNewTransaction("CONVERTTOREALCAPAFTER4RENEW");

/*
if (appMatch("License/Retail License/LLA Review/Renewal"))
{

setSpecialText()
}
*/
var vCapModel = aa.cap.getCap(capId).getOutput().getCapModel();
vCapModel.setAccessByACA("Y");
aa.cap.editCapByPK(vCapModel);
publicUser = true;

//Added for CR205. A renewal record which contains no changes and no documents will go straight to Issuance upon submission, the Intake workflow task will be set to 'Not Required'.

if (publicUser) {

	var autoApprove = false;
	var cap = aa.cap.getCap(capId).getOutput();
	logDebug("capId = " + capId);
	var type = cap.getCapType();
	logDebug("Record Type = " + type);
	var sourceASIResult = aa.appSpecificInfo.getByCapID(capId);
	if (sourceASIResult.getSuccess()) {
		var sourceASI = sourceASIResult.getOutput();
		for (i in sourceASI) {
			thisASI = sourceASI[i];
			if (thisASI.getCheckboxDesc() == 'Are you making changes to the Renewal Application?') {
				var renewalInfo = thisASI.getChecklistComment();
				logDebug(renewalInfo);
			}
		}
	}
	var recordMatch = String(lookup("LKUP_NoRequiredDocuments", type));
	var documentCount = countACADocuments();
	var parentCapId = getParentCapID4Renewal(capId);
	if (renewalInfo == "No") {
		//If there are no renewal changes then copy the fields from the License Record to the Renewal.
		//copy ASI information
		copyAppSpecificInfo(parentCapId, capId);
		//copy License information
		copyLicenseProfessional(parentCapId, capId);
		//copy Address information
		copyAddress(parentCapId, capId);
		//copy ASIT information
		if (!appMatch("License/State License/Wholesaler/Renewal")) {

			//copyAppSpecificTable(parentCapId, capId);//Comment by Evan Cai for EPLACE-5460
		}
		//copy People information
		//copyPeople(parentCapId, capId);
		restoreRenewalContacts(); // added for merging from TST2, for defect#9680.
	}
	//Adding this condition Eplace-550
	//This function will set empty value for the renewal which not change anything for contact,
	//So create new function setContactInfoOnNewContact_withRenewalInfo 10-18-2017 by Evan Cai PHOENIX-675
	//CWM_ELP_CR166_setContactInfoOnNewContact();
	if (renewalInfo != "Yes")
		setContactInfoOnNewContact_withRenewalInfo(renewalInfo);
	/*if (renewalInfo == "Yes" || renewalInfo == "No") {
	CWM_ELP_CR166_setContactInfoOnNewContact();
	}*/
	//Check whether record exists in the StandardChoice - 'LKUP_NoRequiredDocuments'.
	/*if ((recordMatch == 'undefined') || (appMatch("License/State License/Railroad Master/Renewal"))) {
	logDebug("Record not found. Will go into Intake.");
	}*/
	//Check if there are Documents Uploaded and any Renewal Changes.
	//phoenix-553 --545,46,51,50,497 ticket


	if (type == "License/Retail License/Retail/Renewal" && autoApprove == false && parentCapId != null) {
		var newDate = new Date();
		var month = newDate.getMonth();
		var day = newDate.getDate();
		var year = parseInt(newDate.getFullYear());
		newDate.setMonth(11);
		newDate.setDate(31);
		newDate.setFullYear(year);
		var dateString = newDate.getMonth() + 1 + "/" + newDate.getDate() + "/" + newDate.getFullYear();
		thisLic = new licenseObject(parentCapId.getCustomID(), parentCapId);
		thisLic.setExpiration(dateString);
		thisLic.setStatus("Online Renewal Pending");
	}

	/* For each row in the table add license fee $50 (AIRA) per flight
	 * Add a constant fee of $500  (AIRL)
	 */
	if (appMatch("License/State License/Airline Master/Renewal")) {
		var tblFlights = loadASITable("FLIGHTS");
		if (tblFlights) {
			var rowNum = tblFlights.length;
			if ((!isEmpty(rowNum) || isBlank(!rowNum))) {
				if (rowNum > 0) {
					if (feeExists("AIRA"))
						updateFee("AIRA", "STATE", "STANDARD", rowNum, "Y");
					else
						addFee("AIRA", "STATE", "STANDARD", rowNum, "Y");
				}
			}
		}
		if (feeExists("AIRL")) {
			updateFee("AIRL", "STATE", "STANDARD", 1, "Y");
			logDebug("Fee Added for row count:" + rowNum);
		} else {
			addFee("AIRL", "STATE", "STANDARD", 1, "Y");
			logDebug("Fee Added for row count:" + rowNum);
		}
	}

	//Air Cargo Permit Renewal fee
	if (appMatch("License/State License/Air Cargo Permit/Renewal")) {
		if (feeExists("TRAA")) {
			updateFee("TRAA", "STATE", "STANDARD", 1, "Y");
			logDebug("Fee Updated for Air Cargo Permit.");
		} else {
			addFee("TRAA", "STATE", "STANDARD", 1, "Y");
			logDebug("Fee Added for Air Cargo Permit.");
		}

	}

	//CoC fee calculation on renewal

	if (appMatch("License/State License/Certificate of Compliance/Renewal")) {
		/* ETW 11/10/17 Updating to use ASIT
		var over5000 = 0;
		var under5000 = 0;
		var shippingAddCount = 0;

		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess()) {
		capContactResult = capContactResult.getOutput();
		for (yy in capContactResult) {
		var peopleModel = capContactResult[yy].getPeople();
		if (peopleModel.getContactType() == "Business") {
		var capContactScriptModel = capContactResult[yy];
		var capContactModel = capContactScriptModel.getCapContactModel();
		var contactAddress = aa.address.getContactAddressListByCapContact(capContactModel);
		contactAddress = contactAddress.getOutput();
		for (i in contactAddress) {
		if (contactAddress[i].getAddressType() == "Shipping Address (Over 5000 Cases)") {
		over5000++;
		}

		if (contactAddress[i].getAddressType() == "Shipping Address (Under 5000 Cases)") {
		under5000++;
		}
		}
		}
		}
		}
		logDebug("over5000 : " + over5000 + " under5000: " + under5000);
		 */
		// Start ETW Update
		//get ASIT shipping addresses
		var over5000 = 0;
		var under5000 = 0;
		var tblShipAddr = loadASITable("SHIPPING ADDRESS");
		var thisRow;
		rIndex = 0;
		if (tblShipAddr && tblShipAddr != null && tblShipAddr.length > 0) {
			for (rIndex in tblShipAddr) {
				thisRow = tblShipAddr[rIndex];
				vAddrType = "" + thisRow["Address Type"].fieldValue;
				if (vAddrType == "Over 5K") {
					over5000++;
				} else if (vAddrType == "Under 5K") {
					under5000++;
				}
			}
		}

		logDebug("over5000 : " + over5000 + " under5000: " + under5000);
		// End ETW Update
		calcCoCFee(under5000, over5000);
	}

	/////PHOENIX-497/////
	/* Commented this piece of code because I covered this scenario on Phoenix-553
	if (appMatch("License/State License/Agent Broker Solicitor/Renewal")) {
	logDebug("Record match found");
	deactivateTask("Intake");
	updateTask("Intake", "Not Required", "Updated Via Scripts.", "Updated Via Scripts.");
	activateTask("Issuance");
	updateAppStatus("Issuance", "");
	logDebug("Approving");
	renewalApproval(capId);
	autoApprove = true;
	}*/
	if ((appMatch("License/State License/Airline Master/Renewal") || appMatch("License/State License/Railroad Master/Renewal") || appMatch("License/State License/Air Cargo Permit/Renewal") || appMatch("License/State License/Airline/Renewal") || appMatch("License/State License/Ship Cargo/Renewal") || appMatch("License/State License/Railroad Master/Renewal") || appMatch("License/State License/Railroad Cargo Permit/Renewal") || appMatch("License/State License/Warehouse Permit/Renewal") || appMatch("License/State License/Agent Broker Solicitor/Renewal") || appMatch("License/State License/Storage Permit/Renewal") || appMatch("License/State License/Salesman Permit/Renewal") || appMatch("License/State License/Express Transportation Permit/Renewal") || appMatch("License/State License/Transportation Permit/Renewal")) && (documentCount == 0)) {
		logDebug("Record match found");
		deactivateTask("Intake");
		updateTask("Intake", "License Intake Complete", "Updated Via Scripts.", "Updated Via Scripts.");
		activateTask("Issuance");
		updateAppStatus("Issuance", "");
		logDebug("Approving");
		renewalApproval(capId);
		/*var parentCap = getParentCapID4Renewal();
		setLicRegExpirationDate(parentCap);*/
		autoApprove = true;
	}
	if ((appMatch("License/State License/Wholesaler/Renewal") || appMatch("License/State License/Direct Wine Shipper/Renewal") || appMatch("License/State License/Farmer Brewery/Renewal") || appMatch("License/State License/Farmer Distillery/Renewal") || appMatch("License/State License/Farmer Winery/Renewal") || appMatch("License/State License/Caterer/Renewal") || appMatch("License/State License/Ship Chandler/Renewal") || appMatch("License/State License/Certificate of Compliance/Renewal") || appMatch("License/State License/Pub Brewery/Renewal") || appMatch("License/State License/Manufacturer/Renewal") || appMatch("License/State License/Commercial Alcohol/Renewal") || appMatch("License/State License/Ship Master/Renewal")) && (documentCount > 0)) {
		updateTask("Intake", "Submitted", "Updated Via Scripts..", "Updated Via Scripts..");
	}

}
}
function countACADocuments() {
	var totalDocuments = 0;
	var fvCurrentUserID = aa.person.getCurrentUser().getOutput().userID;
	var fvCapDocSR = aa.document.getCapDocumentList(capId, fvCurrentUserID);
	if (fvCapDocSR && fvCapDocSR.getSuccess()) {
		var fvCapDocList = fvCapDocSR.getOutput();
		if (fvCapDocList && fvCapDocList.length > 0) {
			for (vCounter in fvCapDocList) {
				var fvCapDoc = fvCapDocList[vCounter];
				vCounter++;
				aa.print(fvCapDoc);
			}
		}
		var totalDocuments = vCounter;
	}
	return totalDocuments;
}

function copyAppSpecificInfo(srcCapId, targetCapId) {
	//1. Get Application Specific Information with source CAPID.
	var appSpecificInfo = getAppSpecificInfo(srcCapId);
	if (appSpecificInfo == null || appSpecificInfo.length == 0) {
		return;
	}
	//2. Set target CAPID to source Specific Information.
	for (loopk in appSpecificInfo) {
		var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
		if (sourceAppSpecificInfoModel.getCheckboxDesc() != "eSignature" && sourceAppSpecificInfoModel.getCheckboxDesc() != "Signature" && sourceAppSpecificInfoModel.getCheckboxDesc() != "Electronic Signature" && sourceAppSpecificInfoModel.getCheckboxDesc() != "Title") {
			sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
			sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
			sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
			//3. Edit ASI on target CAP (Copy info from source to target)
			aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
		}
	}
}

function getAppSpecificInfo(capId) {
	capAppSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(capId);
	if (s_result.getSuccess()) {
		capAppSpecificInfo = s_result.getOutput();
		if (capAppSpecificInfo == null || capAppSpecificInfo.length == 0) {
			aa.print("WARNING: no appSpecificInfo on this CAP:" + capId);
			capAppSpecificInfo = null;
		}
	} else {
		aa.print("ERROR: Failed to appSpecificInfo: " + s_result.getErrorMessage());
		capAppSpecificInfo = null;
	}
	// Return AppSpecificInfoModel[]
	return capAppSpecificInfo;
}

function getParentCapID4Renewal() {
	parentLic = getParentLicenseCapID(capId);
	pLicArray = String(parentLic).split("-");
	var parentLicenseCAPID = aa.cap.getCapID(pLicArray[0], pLicArray[1], pLicArray[2]).getOutput();

	return parentLicenseCAPID;
}

function copyLicenseProfessional(srcCapId, targetCapId) {
	//1. Get license professionals with source CAPID.
	var capLicenses = getLicenseProfessional(srcCapId);
	if (capLicenses == null || capLicenses.length == 0) {
		return;
	}
	//2. Get license professionals with target CAPID.
	var targetLicenses = getLicenseProfessional(targetCapId);
	//3. Check to see which licProf is matched in both source and target.
	for (loopk in capLicenses) {
		sourcelicProfModel = capLicenses[loopk];
		//3.1 Set target CAPID to source lic prof.
		sourcelicProfModel.setCapID(targetCapId);
		targetLicProfModel = null;
		//3.2 Check to see if sourceLicProf exist.
		if (targetLicenses != null && targetLicenses.length > 0) {
			for (loop2 in targetLicenses) {
				if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2])) {
					targetLicProfModel = targetLicenses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched licProf model.
		if (targetLicProfModel != null) {
			//3.3.1 Copy information from source to target.
			aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
			//3.3.2 Edit licProf with source licProf information.
			aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
		}
		//3.4 It is new licProf model.
		else {
			//3.4.1 Create new license professional.
			aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
		}
	}
}
function getLicenseProfessional(capId) {
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(capId);
	if (s_result.getSuccess()) {
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0) {
			aa.print("WARNING: no licensed professionals on this CAP:" + capId);
			capLicenseArr = null;
		}
	} else {
		aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;
	}
	return capLicenseArr;
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2) {
	if (licProfScriptModel1 == null || licProfScriptModel2 == null) {
		return false;
	}
	if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
		 && licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr())) {
		return true;
	}
	return false;
}
function copyAddress(srcCapId, targetCapId) {
	//1. Get address with source CAPID.
	var capAddresses = getAddress(srcCapId);
	if (capAddresses == null || capAddresses.length == 0) {
		return;
	}
	//2. Get addresses with target CAPID.
	var targetAddresses = getAddress(targetCapId);
	//3. Check to see which address is matched in both source and target.
	for (loopk in capAddresses) {
		sourceAddressfModel = capAddresses[loopk];
		//3.1 Set target CAPID to source address.
		sourceAddressfModel.setCapID(targetCapId);
		targetAddressfModel = null;
		//3.2 Check to see if sourceAddress exist.
		if (targetAddresses != null && targetAddresses.length > 0) {
			for (loop2 in targetAddresses) {
				if (isMatchAddress(sourceAddressfModel, targetAddresses[loop2])) {
					targetAddressfModel = targetAddresses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched address model.
		if (targetAddressfModel != null) {

			//3.3.1 Copy information from source to target.
			aa.address.copyAddressModel(sourceAddressfModel, targetAddressfModel);
			//3.3.2 Edit address with source address information.
			aa.address.editAddressWithAPOAttribute(targetCapId, targetAddressfModel);
		}
		//3.4 It is new address model.
		else {
			//3.4.1 Create new address.
			aa.address.createAddressWithAPOAttribute(targetCapId, sourceAddressfModel);
		}
	}
}

function isMatchAddress(addressScriptModel1, addressScriptModel2) {
	if (addressScriptModel1 == null || addressScriptModel2 == null) {
		return false;
	}
	var streetName1 = addressScriptModel1.getStreetName();
	var streetName2 = addressScriptModel2.getStreetName();
	if ((streetName1 == null && streetName2 != null)
		 || (streetName1 != null && streetName2 == null)) {
		return false;
	}
	if (streetName1 != null && !streetName1.equals(streetName2)) {
		return false;
	}
	return true;
}

function getAddress(capId) {
	capAddresses = null;
	var s_result = aa.address.getAddressByCapId(capId);
	if (s_result.getSuccess()) {
		capAddresses = s_result.getOutput();
		if (capAddresses == null || capAddresses.length == 0) {
			aa.print("WARNING: no addresses on this CAP:" + capId);
			capAddresses = null;
		}
	} else {
		aa.print("ERROR: Failed to address: " + s_result.getErrorMessage());
		capAddresses = null;
	}
	return capAddresses;
}

function copyAppSpecificTable(srcCapId, targetCapId) {
	var tableNameArray = getTableName(srcCapId);
	if (tableNameArray == null) {
		return;
	}
	for (loopk in tableNameArray) {
		var tableName = tableNameArray[loopk];
		//1. Get appSpecificTableModel with source CAPID
		var targetAppSpecificTable = getAppSpecificTable(srcCapId, tableName);

		//2. Edit AppSpecificTableInfos with target CAPID
		var aSTableModel = null;
		if (targetAppSpecificTable == null) {
			return;
		} else {
			aSTableModel = targetAppSpecificTable.getAppSpecificTableModel();
		}
		aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,
			targetCapId,
			null);
	}
}

function getTableName(capId) {
	var tableName = null;
	var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
	if (result.getSuccess()) {
		tableName = result.getOutput();
		if (tableName != null) {
			return tableName;
		}
	}
	return tableName;
}

function getAppSpecificTable(capId, tableName) {
	appSpecificTable = null;
	var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(capId, tableName);
	if (s_result.getSuccess()) {
		appSpecificTable = s_result.getOutput();
		if (appSpecificTable == null || appSpecificTable.length == 0) {
			aa.print("WARNING: no appSpecificTable on this CAP:" + capId);
			appSpecificTable = null;
		}
	} else {
		aa.print("ERROR: Failed to appSpecificTable: " + s_result.getErrorMessage());
		appSpecificTable = null;
	}
	return appSpecificTable;
}
function copyPeople(srcCapId, targetCapId) {
	//1. Get people with source CAPID.
	var capPeoples = getPeople(srcCapId);
	if (capPeoples == null || capPeoples.length == 0) {
		return;
	}
	//2. Get people with target CAPID.
	var targetPeople = getPeople(targetCapId);
	//3. Check to see which people is matched in both source and target.
	for (loopk in capPeoples) {
		sourcePeopleModel = capPeoples[loopk];
		//3.1 Set target CAPID to source people.
		sourcePeopleModel.getCapContactModel().setCapID(targetCapId);
		targetPeopleModel = null;
		//3.2 Check to see if sourcePeople exist.
		if (targetPeople != null && targetPeople.length > 0) {
			for (loop2 in targetPeople) {
				if (isMatchPeople(sourcePeopleModel, targetPeople[loop2])) {
					targetPeopleModel = targetPeople[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched people model.
		if (targetPeopleModel != null) {
			//3.3.1 Copy information from source to target.
			aa.people.copyCapContactModel(sourcePeopleModel.getCapContactModel(), targetPeopleModel.getCapContactModel());
			//3.3.2 Edit People with source People information.
			aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
		}
		//3.4 It is new People model.
		else {
			//3.4.1 Create new people.
			aa.people.createCapContactWithAttribute(sourcePeopleModel.getCapContactModel());
		}
	}
}

function isMatchPeople(capContactScriptModel, capContactScriptModel2) {
	if (capContactScriptModel == null || capContactScriptModel2 == null) {
		return false;
	}
	var contactType1 = capContactScriptModel.getCapContactModel().getPeople().getContactType();
	var contactType2 = capContactScriptModel2.getCapContactModel().getPeople().getContactType();
	var firstName1 = capContactScriptModel.getCapContactModel().getPeople().getFirstName();
	var firstName2 = capContactScriptModel2.getCapContactModel().getPeople().getFirstName();
	var lastName1 = capContactScriptModel.getCapContactModel().getPeople().getLastName();
	var lastName2 = capContactScriptModel2.getCapContactModel().getPeople().getLastName();
	var fullName1 = capContactScriptModel.getCapContactModel().getPeople().getFullName();
	var fullName2 = capContactScriptModel2.getCapContactModel().getPeople().getFullName();
	if ((contactType1 == null && contactType2 != null)
		 || (contactType1 != null && contactType2 == null)) {
		return false;
	}
	if (contactType1 != null && !contactType1.equals(contactType2)) {
		return false;
	}
	if ((firstName1 == null && firstName2 != null)
		 || (firstName1 != null && firstName2 == null)) {
		return false;
	}
	if (firstName1 != null && !firstName1.equals(firstName2)) {
		return false;
	}
	if ((lastName1 == null && lastName2 != null)
		 || (lastName1 != null && lastName2 == null)) {
		return false;
	}
	if (lastName1 != null && !lastName1.equals(lastName2)) {
		return false;
	}
	if ((fullName1 == null && fullName2 != null)
		 || (fullName1 != null && fullName2 == null)) {
		return false;
	}
	if (fullName1 != null && !fullName1.equals(fullName2)) {
		return false;
	}
	return true;
}

function getPeople(capId) {
	capPeopleArr = null;
	var s_result = aa.people.getCapContactByCapID(capId);
	if (s_result.getSuccess()) {
		capPeopleArr = s_result.getOutput();
		if (capPeopleArr == null || capPeopleArr.length == 0) {
			aa.print("WARNING: no People on this CAP:" + capId);
			capPeopleArr = null;
		}
	} else {
		aa.print("ERROR: Failed to People: " + s_result.getErrorMessage());
		capPeopleArr = null;
	}
	return capPeopleArr;
}
function setLicRegExpirationDate(itemCap) {
	var dte = new Date();
	b1ExpResult = aa.expiration.getLicensesByCapID(itemCap);
	if (b1ExpResult.getSuccess()) {
		this.b1Exp = b1ExpResult.getOutput();
		tmpDate = this.b1Exp.getExpDate();
		if (tmpDate)
			this.b1ExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
		this.b1Status = this.b1Exp.getExpStatus();
		aa.print("Found expiration inforamtion: " + this.b1ExpDate)
	} else {
		aa.print("**ERROR: Getting B1Expiration Object for Cap.  Reason is: " + b1ExpResult.getErrorType() + ":" + b1ExpResult.getErrorMessage());
		return false
	}
	var b1ExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + (dte.getFullYear() + 1);

	var certNum = itemCap.getCustomID();
	thisLic = new licenseObject(certNum, itemCap);
	thisLic.setExpiration(b1ExpDate);
	thisLic.setStatus("Active");
	return true;

}

function setContactInfoOnNewContact_withRenewalInfo(renewalInfo) {
	try {
		var primaryPhone = null;
		var alternatePhone = null;
		var emailAddress = null;
		var mobilePhone = null;
		var sourceContactAddressList = null;
		var conSeqNum = null;
		var primaryPhone1 = null;
		var alternatePhone1 = null;
		var emailAddress1 = null;
		var mobilePhone1 = null;
		var sourceContactAddressList1 = null;
		var conSeqNum1 = null;
		var vParentCapId = getParentLicenseCapID(capId);
		logDebug("vParentCapId: " + vParentCapId);
		logDebug("vparentCustomID: " + vParentCapId.getCustomID());
		var capContactResult = aa.people.getCapContactByCapID(capId);
		var capPeoples = getPeople(capId);

		//get Current contact ContactAddressList element
		for (loopk in capPeoples) {
			sourcePeopleModel = capPeoples[loopk];
			if (sourcePeopleModel.getCapContactModel().getContactType() == "Business") {
				sourceContactAddressList = sourcePeopleModel.getCapContactModel().getPeople().getContactAddressList();
				logDebug("sourceContactAddressList" + sourceContactAddressList);
			}
			if (sourcePeopleModel.getCapContactModel().getContactType() == "Manager") {
				sourceContactAddressList1 = sourcePeopleModel.getCapContactModel().getPeople().getContactAddressList();
				logDebug("sourceContactAddressList1" + sourceContactAddressList1);
			}

		}

		//get Current contact data elements
		if (capContactResult.getSuccess()) {
			var vcapContactArray = capContactResult.getOutput();
			for (yy in vcapContactArray) {
				var peopleModel = vcapContactArray[yy].getPeople();
				var newContact = vcapContactArray[yy].getCapContactModel();

				//sourceContactAddressList = newContact.getPeople().getContactAddressList();
				//logDebug("sourceContactAddressList: " + sourceContactAddressList);

				if (peopleModel.getContactType() == "Business") {

					primaryPhone = peopleModel.getPhone1();
					logDebug("primaryPhone " + primaryPhone);
					alternatePhone = peopleModel.getPhone3();
					logDebug("alternatePhone " + alternatePhone);
					mobilePhone = peopleModel.getPhone2();
					logDebug("mobilePhone " + mobilePhone);
					emailAddress = peopleModel.getEmail();
					logDebug("emailAddress " + emailAddress);
					conSeqNum = peopleModel.getContactSeqNumber();
					logDebug("conSeqNum: " + conSeqNum);

				}
				if (peopleModel.getContactType() == "Manager") {

					primaryPhone1 = peopleModel.getPhone1();
					logDebug("primaryPhone1 " + primaryPhone1);
					alternatePhone1 = peopleModel.getPhone3();
					logDebug("alternatePhone1 " + alternatePhone1);
					mobilePhone1 = peopleModel.getPhone2();
					logDebug("mobilePhone1 " + mobilePhone1);
					emailAddress1 = peopleModel.getEmail();
					logDebug("emailAddress1 " + emailAddress1);
					conSeqNum1 = peopleModel.getContactSeqNumber();
					logDebug("conSeqNum1: " + conSeqNum1);

				}
			}

		}
		if (vParentCapId) {
			if (conSeqNum) {
				aa.people.removeCapContact(capId, conSeqNum);
				logDebug("conSeqNum removed");
			}
			if (conSeqNum1) {
				aa.people.removeCapContact(capId, conSeqNum1);
				logDebug("conSeqNum1 removed");
			}

			ignoreContactTypeArr = new Array("Application Contact", "Attorney");
			copyContactsIgnoreType(vParentCapId, capId, ignoreContactTypeArr);

			var fvCapContactResult = aa.people.getCapContactByCapID(capId);
			if (fvCapContactResult.getSuccess()) {
				var fvcapContactArray = fvCapContactResult.getOutput();
				for (yy in fvcapContactArray) {
					var fvPeopleCapContactModel = fvcapContactArray[yy].getCapContactModel();
					var fvPeopleModel = fvcapContactArray[yy].getPeople();

					if (fvPeopleModel.getContactType() == "Business" && renewalInfo == "Yes") {

						logDebug("newContact phone1: " + fvPeopleModel.getPhone1());
						fvPeopleModel.setPhone1(primaryPhone);
						logDebug("setPrimary to: " + fvPeopleModel.getPhone1());

						logDebug("newContact mobilePhone: " + fvPeopleModel.getPhone2());
						fvPeopleModel.setPhone2(mobilePhone);
						logDebug("setMobile to: " + fvPeopleModel.getPhone2());

						logDebug("newContact alternatePhone: " + fvPeopleModel.getPhone3());
						fvPeopleModel.setPhone3(alternatePhone);
						logDebug("setAlternate to: " + fvPeopleModel.getPhone3());

						logDebug("newContact Email: " + fvPeopleModel.getEmail());
						//fvPeopleModel.setEmail(emailAddress);
						logDebug("setEmail to: " + fvPeopleModel.getEmail());

						aa.people.editCapContact(fvPeopleCapContactModel);
						//aa.people.editCapContactWithAttribute(fvPeopleCapContactModel);


					}
					if (fvPeopleModel.getContactType() == "Manager" && renewalInfo == "Yes") {

						logDebug("newContact phone1: " + fvPeopleModel.getPhone1());
						fvPeopleModel.setPhone1(primaryPhone1);
						logDebug("setPrimary to: " + fvPeopleModel.getPhone1());

						logDebug("newContact mobilePhone: " + fvPeopleModel.getPhone2());
						fvPeopleModel.setPhone2(mobilePhone1);
						logDebug("setMobile to: " + fvPeopleModel.getPhone2());

						logDebug("newContact alternatePhone: " + fvPeopleModel.getPhone3());
						fvPeopleModel.setPhone3(alternatePhone1);
						logDebug("setAlternate to: " + fvPeopleModel.getPhone3());

						logDebug("newContact Email: " + fvPeopleModel.getEmail());
						fvPeopleModel.setEmail(emailAddress1);
						logDebug("setEmail to: " + fvPeopleModel.getEmail());

						aa.people.editCapContact(fvPeopleCapContactModel);
						//aa.people.editCapContactWithAttribute(fvPeopleCapContactModel);


					}
				}
			}
			if (renewalInfo == "Yes") {
				//set contact ContactAddressList element
				var updatedCapPeoples = getPeople(capId);
				for (loopk in updatedCapPeoples) {
					targetPeopleModel = updatedCapPeoples[loopk];
					if (targetPeopleModel.getCapContactModel().getContactType() == "Business") {
						targetPeopleModel.getCapContactModel().getPeople().setContactAddressList(sourceContactAddressList);
						aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
						logDebug("Business contact Address updated");
					}
					if (targetPeopleModel.getCapContactModel().getContactType() == "Manager") {
						targetPeopleModel.getCapContactModel().getPeople().setContactAddressList(sourceContactAddressList1);
						aa.people.editCapContactWithAttribute(targetPeopleModel.getCapContactModel());
						logDebug("Manager contact Address updated");
					}
				}
			}
		}
	} catch (err) {
		logDebug(err.message);
	}
}

function logDebug(dstr) {
	vLevel = 1
		if (arguments.length > 1)
			vLevel = arguments[1];
		if ((showDebug & vLevel) == vLevel || vLevel == 1)
			debug += dstr + br;
		if ((showDebug & vLevel) == vLevel)
			aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}
