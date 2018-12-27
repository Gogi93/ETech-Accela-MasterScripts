//aa.env.setValue("SetID","ABCC|STATE_APPLICATION_AMENDMENT_APPROVAL");
//aa.env.setValue("ToEmailAddress1","tpatel@razavi.com");
/* ------------------------------------------------------------------------------------------------------ /
| Program : Batchscript -  BATCH_STATE_APPLICATION_AMEND_APPROVAL  Trigger : Batch
| batchJob :  BATCH_STATE_APP_AMEND_APPROVAL
| Script loops through set members, adds a report determined by a lookup table using the setName  to each record in the set
| then generates a batch report for printing and attaches the report to the set.

| Batch Requirements :
| - Valid Set of name convention.
| -  meant to be a script run every night.
/ ------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------ /
| START : USER CONFIGURABLE PARAMETERS
/ ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0
	var documentOnly = false;
var message = "";
var message1 = "";
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
var debug = "";
br = "<br>";
var emailText = "";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));

if (documentOnly) {
	doStandardChoiceActions(controlString, false, 0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
}

function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";
}

//showDebug = 3;
showDebug = true;
showMessage = true;
// Set to true to see debug messages in event log and email confirmation
var maxSeconds = 5 * 60;
// Number of seconds allowed for batch run, usually < 5 * 60
// Variables needed to log parameters below in eventLog
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("BatchJobName");
// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
// Start timer
var timeExpired = false;
// Variable to identify if batch script has timed out. Defaulted to "false".
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var sysFromEmail = "Noreply@elicensing.state.ma.us";
var paramsOK = true;
// Email body
// Parameter variables

/* ------------------------------------------------------------------------------------------------------ /
| END : USER CONFIGURABLE PARAMETERS
/ ------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------ /
| <=========== Main = Loop ================ >
|
/ ------------------------------------------------------------------------------------------------------ */
if (paramsOK) {
	var count = 0;
	try {
		var capId = null;
		var ToEmailAddress1 = aa.env.getValue("ToEmailAddress1");
		var setNameParam = aa.env.getValue("SetID");
		aa.print(setNameParam);
		var setName = setNameParam;
		logDebug("SetID: " + setName);
		var reportSet = new capSet(setName);
		var reportMembers = reportSet.members;
		logDebug("START", "Start of Batch Print For Batch Job.");
		for (var rm = 0; rm < reportMembers.length; rm++) // for each individual record add the appropriate document
		{
			var capIdObj = aa.cap.getCapID(reportMembers[rm].getID1(), reportMembers[rm].getID2(), reportMembers[rm].getID3());

			if (capIdObj.getSuccess()) {
				capId = capIdObj.getOutput();
				cap = aa.cap.getCap(capId).getOutput();
				logDebug("Processing Record: " + capId.getCustomID());
				var numAmendmentsProcessed = processAmendments(setNameParam, capId);
				count++;
			}
		}
		logDebug("INFO: Number of records processed: " + count + ".");

		logDebug("END", "End of BatchPrint For Job: Elapsed Time : " + elapsed() + " Seconds.");

		if (message1 == "") {
			message1 = "There is no records in SET - ABCC|STATE_APPLICATION_AMENDMENT_APPROVAL for Processing.";
		}

		if (ToEmailAddress1 != null || ToEmailAddress1 != "")
			aa.sendMail(sysFromEmail, ToEmailAddress1, "", "Batch Job: Applications and Amendments approval Email Notification", message1);
	} catch (err) {
		logDebug("Error while processing Amendments and Applications" + err.message);
	}
}

function processAmendments(setNameParam, capId) {
	var capCount = 0;

	if (capId) {
		//capId = capIdObj.getOutput();
		cap = aa.cap.getCap(capId).getOutput();
		logDebug("Processing Record: " + capId.getCustomID());
		var appTypeResult = cap.getCapType();
		var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
		var appTypeArray = appTypeString.split("/");
		if (appTypeArray[1] == "State License" && appTypeArray[3] == "Amendment") {
			//aa.batchJob.beginTransaction(100);
			updateLicenseWhenAmendmentApproval_New(capId);
			if (appMatch("License/State License/Salesman Permit/Amendment", capId) || appMatch("License/State License/Farmer Winery/Amendment", capId)) {

				CWM_ELP_346_WTUA_ABCC_Create_UpdateTransportationLicense_New(capId);
			}

			/*if (appMatch("License/State License/Express Transportation Permit/Amendment",capId)) {
			var parentCapId = getParentLicenseRecord(capId);
			if (AInfo["Add or Edit Number of Vehicles Being Permitted"] == "CHECKED") {

			updateASIonLicenseRecordForExpressAmendment(parentCapId);
			}
			else {

			copyAppSpecific(parentCapId);
			}

			}*/

			setTask_New("Commission Review 1", "N", "Y", capId);
			setTask_New("Commission Review 2", "N", "Y", capId);
			setTask_New("Commission Review 3", "N", "Y", capId);
			deactivateTask_New("Commission Review 1", capId);
			deactivateTask_New("Commission Review 2", capId);
			deactivateTask_New("Commission Review 3", capId);

			//aa.batchJob.commitTransaction();

			message1 += "RECORD UPDATED SUCCESSFULLY: " + capId.getCustomID() + "<br>";
			capCount++;
			var removeResult = aa.set.removeSetHeadersListByCap(setNameParam, capId)
				if (!removeResult.getSuccess()) {
					logDebug("**WARNING** error removing record from set " + setNameParam + " : " + removeResult.getErrorMessage());
				} else {
					logDebug("capSet: removed record " + capId + " from set " + setNameParam);
				}
				logDebug("**************************************************************************************************************************");
		}
		if (appTypeArray[1] == "State License" && appTypeArray[3] == "Application") {
			var newLicId = "";
			var parentid = getParentLicenseRecord(capId);
			logDebug("ParentID: " + parentid);

			if (!parentid) {
				//aa.batchJob.beginTransaction(100);
				newLicId = issueLicense_New(capId);

				if (!appMatch("License/State License/Salesman Permit/Application", capId)) { //RTC#14390
					removeApplicantFromLicense(newLicId);
				}

				//Added below for defect JIRA 2344
				if (!appMatch("License/State License/Transportation Permit/Application", capId)) {
					logDebug("Application contact not removed from Transportation Permit License");
					removeApplicationContactFromLicense(newLicId);
				}

				if (appMatch("License/State License/Transportation Permit/Application", capId)) {
					logDebug("COntact changed from Applicatio Contact to License Individual for Transportation Permit License")
					editContactType("Application Contact", "Licensed Individual", newLicId); //JIRA#2344
				}

				if (appMatch("License/State License/Salesman Permit/Application", capId)) {
					editContactType("Applicant", "Licensed Individual", newLicId); //JIRA#2072 this was removed:  earlier present "WTUA;License!State License!~!Application"
				}

				CWM_ELP_7113_WTUA_ABCC_AssociateLicenses(newLicId);

				var llaDecision = AInfo["Please indicate the decision of the Local Licensing Authority"];
				if (appMatch("License/Retail License/Retail/Application", capId) && (llaDecision == "Approves this application with a modification")) {
					copyASITablesForRetailLic(capId, newLicId);
				} else {
					copyASITables(capId, newLicId); // Defect 715
				}

				if (appMatch("*/*/Airline Master/*", capId) || appMatch("*/*/Air Cargo Permit/*", capId)) {
					var vNumRows = 0;
					if (typeof(FLIGHTS) == "object")
						vNumRows = FLIGHTS.length;
					useAppSpecificGroupName = false;
					editAppSpecific("Number of Flights Being Permitted", vNumRows.toString(), newLicId);
				}

				// Create other Permit reference license records

				CWM_ELP_XXX_WTUA_ABCC_CreateOtherReferenceLicenses_New(capId);

				// Amend License and LP for Transfers
				CWM_ELP_CR70_transferredApplicationApproval(capId);
				//Deactivate Transferred License
				CWM_ELP_CR70_deactivateTransferredLicense_New(capId);

				setTask_New("Commission Review 1", "N", "Y", capId);
				setTask_New("Commission Review 2", "N", "Y", capId);
				setTask_New("Commission Review 3", "N", "Y", capId);

				deactivateTask_New("Commission Review 1", capId);
				deactivateTask_New("Commission Review 2", capId);
				deactivateTask_New("Commission Review 3", capId);

				if (!appMatch("License/Retail License/Retail/Application", capId)) {
					activateTask_New("Issuance", capId);
				}

				//aa.batchJob.commitTransaction();
			}
			message1 += "RECORD UPDATED SUCCESSFULLY: " + capId.getCustomID() + "<br>";
			capCount++;
			var removeResult = aa.set.removeSetHeadersListByCap(setNameParam, capId)
				if (!removeResult.getSuccess()) {
					logDebug("**WARNING** error removing record from set " + setNameParam + " : " + removeResult.getErrorMessage());
				} else {
					logDebug("capSet: removed record " + capId + " from set " + setNameParam);
				}
				logDebug("**************************************************************************************************************************");
		}

	}
	//}
	return capCount;

}

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

/* ------------------------------------------------------------------------------------------------------ /
| <=========== External Functions (used by Action entries)
/ ------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------ /
| <=========== Internal Functions and Classes (Used by this script)
/ ------------------------------------------------------------------------------------------------------ */
function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function updateLicenseWhenAmendmentApproval_New(amendmentCapId) {
	parentCapId = getParentLicenseRecord(amendmentCapId);
	var sourceContactAddressList = null;
	var sourceContactAddressList1 = null;
	var DBAName = "";
	logDebug("Parent Cap ID: " + parentCapId);
	var vContactAmend = getAppSpecific("Edit Contact and / or Address Information", amendmentCapId);
	capId = amendmentCapId;
	if (parentCapId) {
		var licExpDate = null;
		var b1ExpResult = aa.expiration.getLicensesByCapID(parentCapId);
		if (b1ExpResult.getSuccess()) {
			var expObj = b1ExpResult.getOutput();
			licExpDate = expObj.getExpDate();
		}

		logDebug("Get Ref License Prof to update expiration date.");
		var refLP = getRefLicenseProf(parentCapId.getCustomID());
		if (refLP && refLP != null) {
			var licExpDateOldValue = refLP.getLicenseExpirationDate();
			refLP.setLicenseExpirationDate(licExpDate);
			//get the business contact and update the address info:
			var updating = false;
			conArr = getPeople(capId);
			if (conArr) {
				if (!conArr.length) {
					logDebug("**WARNING: No contact available");
					return false;
				}
			}

			//get contact record
			var pContactType = "Business";
			var cont = null;
			var contBus = null;
			var contFound = false;
			var contBusFound = false;
			for (yy in conArr) {
				if (contFound == false && pContactType != "Business") {
					cont = conArr[yy];
					contFound = true;
				}
				if (contBusFound == false && conArr[yy].getCapContactModel().getPeople().getContactType() == "Business") {
					contBus = conArr[yy];
					contBusFound = true;
				}
				if (contFound && contBusFound)
					break;

			}

			if (pContactType != "Business" && !contFound) {
				logDebug("**WARNING: No Contact found of type11: " + pContactType);
			}
			if (!contBusFound) {
				logDebug("**WARNING: No Contact found of type22: Business");
			}
			var addr = null;
			if (cont)
				addr = getCapContactAddressByType(cont, "Mailing");
			else if (contBus)
				addr = getCapContactAddressByType(contBus, "Business");

			var vAL3 = "";
			if (addr)
				vAL3 = addr.getAddressLine3();

			if (contBus) {
				var peopBus = contBus.getPeople();
				refLP.setBusinessName(peopBus.getBusinessName());
				// added for JIRA 2408

				if (peopBus.getTradeName())
					DBAName = peopBus.getTradeName();
				else
					DBAName = getAppSpecific("DBA Name (if different)", amendmentCapId);
				refLP.setBusinessName2(DBAName);
				// Update for JIRA 2408 End
				refLP.setEMailAddress(peopBus.getEmail())
				refLP.setPhone1(peopBus.getPhone1());
			}

			if (cont) {
				var peop = cont.getPeople();
				refLP.setEMailAddress(peop.getEmail())
				refLP.setPhone1CountryCode(peop.getPhone1CountryCode());
				refLP.setPhone1(peop.getPhone1());
				refLP.setPhone2CountryCode(peop.getPhone2CountryCode());
				refLP.setPhone2(peop.getPhone2());
				refLP.setPhone3CountryCode(peop.getPhone3CountryCode());
				refLP.setPhone3(peop.getPhone3());
				refLP.setFaxCountryCode(peop.getFaxCountryCode());
				refLP.setFax(peop.getFax());
			}

			if (addr) {
				//Defect 2477 Fix - START
				if (addr.getHouseNumberAlphaStart() == null) {
					refLP.setAddress1(" " + addr.getAddressLine1());
				} else {
					refLP.setAddress1(addr.getHouseNumberAlphaStart() + " " + addr.getAddressLine1());
				}
				//Defect 2477 Fix - END

				refLP.setAddress2(addr.getAddressLine2());
				refLP.setAddress3(vAL3);
				refLP.setCity(addr.getCity());
				refLP.setState(addr.getState());
				refLP.setZip(addr.getZip());
				refLP.setContryCode(addr.getCountryCode());
				refLP.getLicenseModel().setCountryCode(addr.getCountryCode());
				refLP.setCountry(addr.getCountryCode());
			}
			refLP.setLicState(licenseState);
			if (AInfo["Insurance Amount"])
				refLP.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
			if (AInfo["Insurance Exp Date"])
				refLP.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
			if (AInfo["Business License Exp Date"])
				refLP.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));

			refLP.setAuditStatus("A");
			refLP.setLicenseLastRenewalDate(sysDate);
			refLP.setPolicy("Issued");
			refLP.setWcExempt("Y");
			//end defect 3119
			var res = aa.licenseScript.editRefLicenseProf(refLP);
			if (res.getSuccess()) {
				logDebug("Ref LP expiration date updated.");
				//defect 3119
				addToLicenseSyncSet(parentCapId);
				//end of defect 3119
			} else {
				logDebug("Ref LP expiration date not updated. " + res.getErrorMessage());
			}

			//if(vContactAmend == "CHECKED")
			//{
			//remove and add LP to resolve EPLACE-7828
			var tpID = aa.cap.getCapID(parentCapId.getCustomID()).getOutput();
			removeAssociatedLP(tpID, parentCapId);
			associateLpWithCap(refLP, parentCapId);
			//}
		} else {
			logDebug("Ref LP not found.");
		}
		/*JIRA#2243 start:change DBA and Business name updae on B3CONTRA(Licensed Professional)
		putting inside try-catch not affect other process .add here for B3ONTRA update.
		 */
		capId = amendmentCapId;
		var vDBAAmend = getAppSpecific("Change of DBA", amendmentCapId);
		if (vDBAAmend == "CHECKED") {
			var refLicenseResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(parentCapId).getOutput();
			for (var i in refLicenseResult) {
				try {
					var contBus2;
					var conArr2 = getPeople(parentCapId);
					for (yy in conArr2) {
						if (conArr2[yy].getCapContactModel().getPeople().getContactType() == "Business") {
							contBus2 = conArr2[yy];
							break;
						}
					}
					capId = amendmentCapId;
					//var amendedDBA = getAppSpecific("DBA Name (if different)");

					logDebug("amendedDBA:" + DBAName);
					logDebug("Updating Licensed Professional.");
					if (contBus2) {
						var peopBus = contBus2.getPeople();
						refLicenseResult[i].setBusinessName(peopBus.getBusinessName());
						refLicenseResult[i].setBusName2(String(DBAName));
						refLicenseResult[i].setEmail(peopBus.getEmail());
						refLicenseResult[i].setPhone1(peopBus.getPhone1());
					}
					var result = aa.licenseProfessional.editLicensedProfessional(refLicenseResult[i]);
				} catch (err) {
					logDebug("Error while updating B3CONTRA" + err.message);
				}

			}
		} //end vDBAAmend

		/*JIRA#2243 end //commented by tp
		/*
		if (!(appMatch("License/State License/Salesman Permit/Amendment",amendmentCapId) || appMatch("License/State License/Wholesaler/Amendment",amendmentCapId) || appMatch("License/State License/Transportation Permit/Amendment",amendmentCapId))) {
		//Remove LPsFrom Parent
		removeLPsExceptPrimary(parentCapId);
		//Add LPs From Amendment
		CWM_ELP_ABCC_Defect_8071_copyLPfromAmendmentToLicense();
		}
		 */
		/*JIRA#3944*/
		capId = amendmentCapId;
		var vvehicleAmend = getAppSpecific("Add, Update, or Remove Vehicle Information", amendmentCapId)
			if (!(appMatch("License/State License/Transportation Permit/Amendment", amendmentCapId)) && vvehicleAmend == "CHECKED") {
				CWM_ELP_WTUA_ABCC_UpdateTransportaionRecordForVehicleAmendment_New();
			}
			/*JIRA#3944*/
			updateAppStatus("Issued", "", parentCapId);
		updateTask("License", "Issued", "Updated via script.", "Updated via script.", null, parentCapId);
		//var vContactORAddressAmend = getAppSpecific("Edit Contact and / or Address Information", amendmentCapId);
		//if(vContactORAddressAmend == "CHECKED")
		//{
		ignoreContactTypeArr = new Array("Application Contact");
		logDebug("copy Contacts ignoreContactTypeArr");
		removeContactsFromCap(parentCapId);
		// ETW 12/27/18 Start Fix to copy contacts with ASI
		copyContacts3_0(amendmentCapId, parentCapId);
		//copyContactsIgnoreType(amendmentCapId, parentCapId, ignoreContactTypeArr);
		// ETW 12/27/18 End Fix to copy contacts with ASI

		//}
		//logDebug("capppIIIDDD###" + capId.getCustomID());
		updatePremiseAddressesOnLicense(amendmentCapId, parentCapId);
		logDebug("copy ASI");
		capId = amendmentCapId;

		if (!appMatch("License/State License/Express Transportation Permit/Amendment", amendmentCapId)) {
			logDebug("capppIIIDDD2###" + capId.getCustomID());
			logDebug("parentCapId###" + parentCapId.getCustomID());
			useAppSpecificGroupName = false;
			copyAppSpecificInformation(parentCapId, amendmentCapId);
			// copyAppSpecificNew(parentCapId);
		}
		CopyDeleteASIT(amendmentCapId, parentCapId);
		if (appMatch("License/State License/Airline Master/Amendment", amendmentCapId)) {
			updateAirlineAmendmentApproval();
		}
		removeASITable("ASSOCIATED LICENSES", parentCapId); // copy this line as migration for defect#9620
		CWM_ASA_ABCC_addAssociatedLicensesASIT1NoDups(parentCapId);
		updateAppStatus("Issuance", "Updated via Script", amendmentCapId);
		updateTask("License", "Issued", "Updated via script.", "Updated via script.", null, parentCapId);
		var workflowReview = getWorkflowReviewLevel();
		if (workflowReview == "fasttrack") {
			updateTask("Intake", "Not Required", "Task updated by automation");
			deactivateTask("Intake");
			updateTask("Investigation", "Not Required", "Task updated by automation");
			updateTask("Executive Review", "Not Required", "Task updated by automation");
			updateTask("Commission Review 1", "Not Required", "Task updated by automation");
			updateTask("Commission Review 2", "Not Required", "Task updated by automation");
			updateTask("Commission Review 3", "Not Required", "Task updated by automation");
		}
		//Added By THP for EPAWS-1076
		setSpecialText(parentCapId);
		activateTask("Issuance");
		updateTask("Issuance", "Pending Email", "Task updated by automation");
		CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment_1(capId);

	}
}

//**********************************************************************************************************************************************************
function CWM_ELP_WTUA_ABCC_UpdateTransportaionRecordForVehicleAmendment_New() {
	try {

		var vVehicleAmend = getAppSpecific("Add, Update, or Remove Vehicle Information", capId);
		if (!vVehicleAmend) {
			return;
		}
		if (vVehicleAmend == "UNCHECKED") {
			return;
		}
		var vPlicId = getParentLicenseRecord(capId);

		//1.All Plate LIcense
		var vPasitInformation = loadASITable("VEHICLE INFORMATION", vPlicId);
		var vPlateLic = aa.util.newArrayList();

		if (vPasitInformation && vPasitInformation.length > 0) {
			for (var numofTP = 0; numofTP < vPasitInformation.length; numofTP++) {
				var vPlateNum = vPasitInformation[numofTP]["Vehicle Plate Number"];
				vPlateNum = String(vPlateNum);
				vPlateLic.add(vPlateNum);
			}
		}
		logDebug("All Plate LIcense#:" + vPlateLic);
		//2.All Plate Amend
		var vAmendasitInformation = loadASITable("VEHICLE INFORMATION", capId);
		var vAmendlateLic = aa.util.newArrayList();

		if (vAmendasitInformation && vAmendasitInformation.length > 0) {
			for (var row = 0; row < vAmendasitInformation.length; row++) {
				var vAmendPlateNum = String(vAmendasitInformation[row]["Vehicle Plate Number"]);
				vAmendlateLic.add(vAmendPlateNum);
			}
		}
		logDebug("All Plate Amend#:" + vAmendlateLic);
		//3.New Plate to Add
		var asitInformation = loadASITable("VEHICLE INFORMATION", capId);
		var vPlateLicNewPlate = new Array();

		if (asitInformation && asitInformation.length > 0) {
			for (var row1 = 0; row1 < asitInformation.length; row1++) {
				var vChildPlateNum = String(asitInformation[row1]["Vehicle Plate Number"]);
				if (!vPlateLic.contains(vChildPlateNum)) {
					vPlateLicNewPlate.push(vChildPlateNum); // New Plate Added to Amendment
				}
			}
		}
		logDebug("New Plate to Add#:" + vPlateLicNewPlate);

		//4.Old plate to remove from license
		var asitInformation2 = loadASITable("VEHICLE INFORMATION", vPlicId); //Loop License
		var vPlateLicOldPlate = aa.util.newArrayList();
		if (asitInformation2 && asitInformation2.length > 0) {
			for (var row2 = 0; row2 < asitInformation2.length; row2++) {
				var vLicPlateNum = String(asitInformation2[row2]["Vehicle Plate Number"]);
				if (!vAmendlateLic.contains(vLicPlateNum)) { //Old Plate will not avialable in Amendment as its removed
					vPlateLicOldPlate.add(vLicPlateNum); // New Plate Added to Amendment
				}
			}
		}
		logDebug("Old plate to remove from license#:" + vPlateLicOldPlate);
		//Remove LP from License:
		if (vPlateLicOldPlate.size() > 0) {
			var tpResult = aa.licenseScript.getLicenseProf(vPlicId);
			var vRemoveTP = aa.util.newArrayList();
			if (tpResult.success) {
				var tpList = tpResult.getOutput();

				for (tp in tpList) {
					var licNbr = tpList[tp].getLicenseNbr();
					var tpID = aa.cap.getCapID(licNbr).getOutput();
					if (tpID) {
						var appType = aa.cap.getCapTypeModelByCapID(tpID).getOutput();
						var appTypeArray = appType.toString().split("/");
						if (appTypeArray[2] == "Transportation Permit") {
							var vTRasitInformation = loadASITable("VEHICLE INFORMATION", tpID);

							if (vTRasitInformation && vTRasitInformation.length > 0) {
								for (var numofTP1 = 0; numofTP1 < vTRasitInformation.length; numofTP1++) {
									var vTRPlateNum = vTRasitInformation[numofTP1]["Vehicle Plate Number"];
									vTRPlateNum = String(vTRPlateNum);
									//logDebug("Check LP To remove for Plate#:"+vTRPlateNum +",ALT#"+licNbr);
									if (vPlateLicOldPlate.contains(vTRPlateNum)) {
										logDebug("True:LP To remove for Plate#" + vTRPlateNum + ",ALT#" + licNbr + ",CapId:" + tpID + ", from license");
										vRemoveTP.add(licNbr);
										removeAssociatedLP(tpID, vPlicId);
										break; // TR associate to one Vehicle plate number.
									}
								}
							}
						}
					}
				}
				logDebug("Old TR to remove from license#:" + vRemoveTP);
			}
		}
		//New LP on LIcense
		if (vPlateLicNewPlate.length > 0) {
			for (var i = 0; i < vPlateLicNewPlate.length; i++) {
				CWM_ELP_WTUA_ABCC_CreateNewTransportationLicenseAmendment_New(String(vPlateLicNewPlate[i]));
			}

		}
	} catch (err) {
		logDebug("Errpr**CWM_ELP_WTUA_ABCC_UpdateTransportaionRecordForVehicleAmendment:" + err.message);
	}
}
//**********************************************************************************************************************************************************
function CWM_ELP_WTUA_ABCC_CreateNewTransportationLicenseAmendment_New(pVehiclePlateNum2Add) {
	try {

		var asitInformation = loadASITable("VEHICLE INFORMATION");
		var tableName = "VEHICLE INFORMATION";
		var rows;
		var column = new Array();
		var thisContactType = null;
		if (appTypeArray[2] == "Salesman Permit") {
			if (appTypeArray[3] == "Application") {
				thisContactType = "Applicant";
			} else {
				thisContactType = "Licensed Individual";
			}
		} else {
			thisContactType = "Business";
		}

		if (asitInformation && asitInformation.length > 0) {
			logDebug("vehicle info length:" + asitInformation.length);
			for (var numofTP = 0; numofTP < asitInformation.length; numofTP++) {

				var vVehiclePlateNum = asitInformation[numofTP]["Vehicle Plate Number"];
				logDebug("vVehiclePlateNum:" + vVehiclePlateNum);
				if (vVehiclePlateNum == pVehiclePlateNum2Add) {
					logDebug(asitInformation[numofTP]["Vehicle Plate Number"]);
					logDebug(asitInformation[numofTP]["Leased or Owned by Employee?"]);
					logDebug(asitInformation[numofTP]["Employee Name"]);
					//logDebug("numofTP:"+numofTP);
					// Create Transaction License and Reference Licence (but do not associate)
					tranLicId = createLicenseWithoutChild_New("Issued", true, true, "Transportation Permit", null, false);
					logDebug("tranLicId:" + tranLicId);

					if (tranLicId) {
						// Remove the ApplicationContact
						removeApplicationContactFromLicense(tranLicId);

						// Copy ASIT
						column["Vehicle Plate Number"] = vVehiclePlateNum; //asitInformation[numofTP]["Vehicle Plate Number"];
						column["Leased or Owned by Employee?"] = asitInformation[numofTP]["Leased or Owned by Employee?"];
						column["Employee Name"] = asitInformation[numofTP]["Employee Name"];
						rows = new Array();
						rows.push(column);
						addASITable(tableName, rows, tranLicId);

						parentLicenseCapID = getParentLicenseRecord(capId);
						transRefLic = getRefLicenseProf(parentLicenseCapID.getCustomID());
						//Populate ASI
						var capScriptModel = aa.cap.getCap(parentLicenseCapID).getOutput();
						var capTypeString = capScriptModel.getCapType();
						var capTypeArray = String(capTypeString).split("/");
						var subType = capTypeArray[2];
						var licType = null;
						licType = lookup("TRANS_PERMIT_LIC_TYPE_LOOKUP", subType);
						if (licType != null) {
							editAppSpecific("ABCC License Type", licType, tranLicId);
						}
						var dbaName = getAppSpecific("DBA Name (if different)", parentLicenseCapID);
						editAppSpecific("DBA Name (if different)", dbaName, tranLicId);
						var website = getAppSpecific("Website", parentLicenseCapID);
						editAppSpecific("Website", website, tranLicId);
						var signature = getAppSpecific("Signature", parentLicenseCapID);
						editAppSpecific("Signature", signature, tranLicId);
						var title = getAppSpecific("Title", parentLicenseCapID);
						editAppSpecific("Title", title, tranLicId);

						//added for EPLACE-6074
						//setExpirationDateForRenewal(tranLicId);
						//ended for EPLACE-6074


						// Associate the Transportation LP to the parent license record of this Application/Renewal
						transRefLic = getRefLicenseProf(tranLicId.getCustomID());
						if (transRefLic) {
							associateLpWithCap(transRefLic, parentLicenseCapID);
							logDebug("Transportation Permit LP associated to license " + parentLicenseCapID.getCustomID());
						} else
							logDebug("Parent License for " + capId.getCustomID() + " not found");
					}
				}
			}
		}
	} catch (err) {
		logDebug("Error**:CWM_ELP_WTUA_ABCC_CreateNewTransportationLicenseAmendment" + err.message);
	}
}

//**********************************************************************************************************************************************************
function createLicenseWithoutChild_New(initStatus, copyASI, createRefLP, licType, contactType, licHolderSwitch) {
	// Create the transaction Record
	cap = aa.cap.getCap(capId).getOutput();
	logDebug("CapId********: " + capId);
	var appTypeResult = cap.getCapType();
	var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
	var appTypeArray = appTypeString.split("/");
	newLicenseType = licType;
	newTransLicId = createRecord(appTypeArray[0], appTypeArray[1], newLicenseType, "License", null);
	newTransLicIdString = newTransLicId.getCustomID();

	if (newTransLicId) {
		removeContactsFromCap(newTransLicId);
		// ETW 12/27/18 Start Fix to copy contacts with ASI
		copyContacts3_0(capId, newTransLicId);
		//copyContactsWithAddress(capId, newTransLicId)
		// ETW 12/27/18 End Fix to copy contacts with ASI
		editContactType("Applicant", "Licensed Individual", newTransLicId);
		setExpirationDateForLicense(newTransLicId);
		var vExpDate = aa.expiration.getLicensesByCapID(newTransLicId).getOutput().getExpDate();

		// Create the Reference License
		//createRefLicProf(newTransLicIdString, newLicenseType, "Business", initStatus, vExpDate);
		var isLicIndiv = isIndividualContact();
		logDebug("isLicIndiv#" + isLicIndiv);
		if (isLicIndiv) {
			createRefLicProf_New(newTransLicIdString, newLicenseType, "Licensed Individual", initStatus, vExpDate, capId);
		} else {
			createRefLicProf_New(newTransLicIdString, newLicenseType, "Business", initStatus, vExpDate, capId);
		}
		newRefLic = getRefLicenseProf(newTransLicIdString);

		if (newRefLic) {
			logDebug("Reference LP of type " + newLicenseType + " successfully created");
			associateLpWithCap(newRefLic, newTransLicId);
		} else
			logDebug("Reference LP " + newLicenseType + " not created");

		// Copy ASI is necessary
		if (copyASI)
			copyAppSpecific(newTransLicId);

		// Add to Sync Set
		addToLicenseSyncSet(newTransLicId);
		setContactsSyncFlag("N", newTransLicId);

		//Set License workflow to Issued
		closeLicWorkflow(newTransLicId);

		var appCreatedBy = cap.getCapModel().getCreatedBy();
		if (appCreatedBy)
			editCreatedBy(appCreatedBy, newTransLicId);

		// Add to License Print Set
		if (licType != "Transportation Permit") {
			callReport("License_Certificate", false, true, null, newTransLicId);
		}

		// Switch the contact type on the license if necessary
		if (licHolderSwitch && newTransLicId) {
			conToChange = null;
			cons = aa.people.getCapContactByCapID(newTransLicId).getOutput();

			for (thisCon in cons) {
				if (cons[thisCon].getCapContactModel().getPeople().getContactType() == contactType) {
					conToChange = cons[thisCon].getCapContactModel();
					p = conToChange.getPeople();
					p.setContactType(contactType);
					conToChange.setPeople(p);
					aa.people.editCapContact(conToChange);
					logDebug("Contact type successfully switched to " + contactType);
				}
			}
		}
	}

	return newTransLicId;
}
//****************************************************************************************************************************************************
function issueLicense_New(appCapId) {
	updateAppStatus("Issuance", "Updated via Script", appCapId);

	var contactType = "Applicant";
	if (appMatch("License/State License/Airline Master/Application") || appMatch("License/State License/Air Cargo Permit/Application") ||
		appMatch("License/State License/Certificate of Compliance/Application"))
		//Changed the contact type from AR to Business By Bhandhavya to resolve defect # 685 and # 657
		//contactType = "Authorized Representative";
		contactType = "Business";

	// As per defect 952, i.e to switch Business contact type to "License Holder" is not valid for ABCC and hence set licHolderSwitch to false.
	// Changed by Bhandhavya on 9/17/2014


	//newLicId = createLicense("Issued", true, true, contactType, true);

	newLicId = createLicense_New("Issued", true, true, contactType, false, capId);

	logDebug("New License Object" + newLicId);
	logDebug("Custom ID" + newLicId.getCustomID());

	if (newLicId) {
		//Added by Evan Cai 7-10-2017 for EPLACE3178
		setSpecialText(newLicId);
		//Add issued license to set
		//addTransLictoSet(newLicId);
		addToLicenseSyncSet(newLicId);
		//setLicExpirationDate(newLicId);
		//added by thp
		//setExpirationDateForLicense(newLicId);

		//createRefLP4Lookup(newLicId);
		setContactsSyncFlag("N", newLicId);

		//Set License workflow to Issued
		closeLicWorkflow(newLicId);

		var appCreatedBy = cap.getCapModel().getCreatedBy();

		if (appCreatedBy)
			editCreatedBy(appCreatedBy, newLicId);

		// sendLicenseIssuedNotification();
		// addToLicensePrintSet(newLicId);
		// aa.batchJob.commitTransaction();
		var tmpCapId = appCapId;
		capId = newLicId;
		if (appMatch("License/Retail License/Off Premise Retail/License", newLicId) || appMatch("License/Retail License/On Premise Retail/License", newLicId)) {
			var params = aa.util.newHashtable();
			var appCapScriptModel = aa.cap.getCap(appCapId).getOutput();
			addParameter(params, "$$AppType$$", appCapScriptModel.getCapType().getAlias());
			addParameter(params, "$$License_Type$$", cap.getCapType().getAlias());
			getContactParams4NotificationXXX(params, "Business");
			capId = appCapId;
			getContactParams4NotificationXXX(params, "LLA");
			capId = newLicId;
			addParameter(params, "$$Town$$", AInfo["City/Town Name"]);
			addParameter(params, "$$licAltID$$", capId.getCustomID());
			//addParameter(params, "$$Busines$$", params.get("$$businessBusinesName$$"));
			//Added by Prateek 03/06/2017 for defect JIRA 2334
			getContactParams4NotificationXXX(params, "Application Contact");
			var reportName = "Application Summary Review";
			var myHashMap = aa.util.newHashMap();
			myHashMap.put("ALT_ID", String(appCapId.getCustomID()));
			var emailTo = "";
			if (params.get("$$application contactEmail$$") == null)
				emailTo = params.get("$$businessEmail$$");
			else
				emailTo = params.get("$$application contactEmail$$");
			params.put("$$businessBusinesName$$", params.get("$$businessBusinesName$$"));
			var LLA_Name = getLLAName(AInfo["City/Town Name"]);
			addParameter(params, "$$LLA_NAME$$", LLA_Name);
			var isSent = sedEmailWithReportAttchment(reportName, myHashMap, "EMAIL RETAIL LICENSEE NOTIFICATION", params, emailTo, capId, params.get("$$llaEmail$$"))

				if (!isSent) {
					logDebug("LLA Name: " + params.get("$$llaEmail$$"));
					logDebug("businessEmail Name: " + params.get("$$businessEmail$$"));
					sendNotification(sysFromEmail, emailTo, params.get("$$llaEmail$$"), "EMAIL RETAIL LICENSEE NOTIFICATION", params, null);
					capId = tmpCapId;
					logDebug("Email Sent Sucessfully!!!");
					logDebug("email sent to Application Contact and LLA now closing workflow task: Issuance");
					closeTask("Issuance", "Emailed", "Updated via sript", "");
					deactivateTask("Issuance");
				} else {
					logDebug("Email Sent Sucessfully with report!!!");
					logDebug("email sent to Application Contact and LLA now closing workflow task: Issuance");
					capId = tmpCapId;
					closeTask("Issuance", "Emailed", "Updated via sript", "");
					deactivateTask("Issuance");
				}

		} else {
			callReport_New("License_Certificate", false, true, "Batch Print", capId);
			capId = tmpCapId;
		}
	}
	return newLicId;

}

//********************************************************************************************************************************************************
function createLicense_New(initStatus, copyASI, createRefLP, contactType, licHolderSwitch, capId) {

	//initStatus - record status to set the license to initially
	//copyASI - copy ASI from Application to License? (true/false)
	//createRefLP - create the reference LP (true/false)
	//licHolderSwitch - switch the applicant to license holder
	var newLicId = null;
	cap = aa.cap.getCap(capId).getOutput();
	logDebug("createLicense_New CapId********: " + capId);

	var appTypeResult = cap.getCapType();
	var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
	var appTypeArray = appTypeString.split("/");

	var newLic = null;

	var newLicIdString = null;
	var newLicenseType = appTypeArray[2];
	var newRetailLicSubType = "";
	var newRetailTypeForAltId = "";
	var newRetailLicIdForAltId = "";
	var oldAltId = "";
	var newAltId = "";

	//create the license record
	if (appMatch("License/Retail License/Retail/Application", capId)) {
		var cityTownName = AInfo["City/Town Name"];
		newRetailLicSubType = getRetailAppLicType(); //Get On Premise Retail or Off Premise Retail
		// added for JIRA 2408
		newLicenseType = newRetailLicSubType;
		newRetailTypeForAltId = getRetailLicType(newRetailLicSubType); //Get CC code for alt id ($$SEQ05$$-CC-MMMM)
		newRetailLicIdForAltId = getMuniCodeFromName(cityTownName); //get MMMM number for alt id ($$SEQ05$$-CC-MMMM)

		newLicId = createParent(appTypeArray[0], appTypeArray[1], newRetailLicSubType, "License", null);

		if (newLicId) {
			oldAltId = newLicId.getCustomID();
			logDebug("==> oldAltId: " + oldAltId);

			newAltId = generateRetailAltId(oldAltId, newRetailTypeForAltId, newRetailLicIdForAltId);

			var updateCapAltIDResult = aa.cap.updateCapAltID(newLicId, newAltId);
			if (updateCapAltIDResult.getSuccess())
				logDebug(newLicId + " AltID changed from " + oldAltId + " to " + newAltId);
			else
				logDebug("**WARNING: AltID was not changed from " + oldAltId + " to " + newAltId + ": " + updateCapAltIDResult.getErrorMessage());
			newLicId = aa.cap.getCapID(newAltId).getOutput();
		}
	} else
		newLicId = createParent(appTypeArray[0], appTypeArray[1], appTypeArray[2], "License", null);

	//field repurposed to represent the original effective date
	editFirstIssuedDate(sysDateMMDDYYYY, newLicId);

	newLicIdString = newLicId.getCustomID();
	updateAppStatus(initStatus, "", newLicId);

	// Added by NPHON -- Rel B - Agile Pilot
	if (appMatch("License/State License/Wholesaler/Application", capId)) {
		// Generate new wholesaler license id based on application license category asi.
		generateNewWholesalerLicense(newLicId);
		newLicIdString = getWholesalerLicensePrefix() + newLicIdString;
	}

	// Added by TKAHN -- Rel B ABCC Defect#6726
	if (appMatch("License/State License/Warehouse Permit/Application", capId)) {
		// Generate new wholesaler license id based on application license category asi.
		generateNewWarehousePermitLicense(newLicId);
		newLicIdString = getWarehousePermitLicensePrefix() + newLicIdString;
	}

	// Added by TKAHN -- Rel B ABCC Defect#6718
	if (appMatch("License/State License/Manufacturer/Application", capId)) {
		// Generate new Manufacturer license id based on application license category asi.
		generateNewManufacturerLicense(newLicId);
		newLicIdString = getManufacturerLicensePrefix() + newLicIdString;
	}

	//copy all ASI
	if (copyASI && newLicId) {
		logDebug("copying ASI...");

		//copyAppSpecificNew1(newLicId);
		copyAppSpecificInformation(newLicId, capId);
		//copyAppSpecific(newLicId);


		//For Retail Application
		if (appMatch("License/Retail License/Retail/Application", capId)) {
			var llaDecision = AInfo["Please indicate the decision of the Local Licensing Authority"];
			if (llaDecision == "Approves this application with a modification") {
				cpyRtlAppLLAinfASIT2LicDescOfPrem(newLicId);
				var tmpUseAppSpecificGroupName = useAppSpecificGroupName;
				useAppSpecificGroupName = true;

				var appInfo = new Array();
				loadAppSpecific(appInfo);

				editAppSpecific("DESCRIPTION OF PREMISES.Patio/Deck/Outdoor Area Total Square Footage", appInfo["DESCRIPTION OF PREMISES.Patio/Deck/Outdoor Area Total Square Footage"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Indoor Area Total Square Footage", appInfo["DESCRIPTION OF PREMISES.Indoor Area Total Square Footage"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Number of Entrances", appInfo["DESCRIPTION OF PREMISES.Number of Entrances"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Number of Exits", appInfo["DESCRIPTION OF PREMISES.Number of Exits"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Approved Seating Capacity", appInfo["DESCRIPTION OF PREMISES.Approved Seating Capacity"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Approved Occupancy", appInfo["DESCRIPTION OF PREMISES.Approved Occupancy"], newLicId);

				useAppSpecificGroupName = tmpUseAppSpecificGroupName;
			} else {
				//copySingleASITable("DESCRIPTION OF PREMISES", capId, newLicId);

				var tmpUseAppSpecificGroupName = useAppSpecificGroupName;
				useAppSpecificGroupName = true;

				var appInfo = new Array();
				loadAppSpecific(appInfo);

				editAppSpecific("DESCRIPTION OF PREMISES.Patio/Deck/Outdoor Area Total Square Footage", appInfo["DESCRIPTION OF PREMISES.Patio/Deck/Outdoor Area Total Square Footage"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Indoor Area Total Square Footage", appInfo["DESCRIPTION OF PREMISES.Indoor Area Total Square Footage"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Number of Entrances", appInfo["DESCRIPTION OF PREMISES.Number of Entrances"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Number of Exits", appInfo["DESCRIPTION OF PREMISES.Number of Exits"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Approved Seating Capacity", appInfo["DESCRIPTION OF PREMISES.Approved Seating Capacity"], newLicId);
				editAppSpecific("DESCRIPTION OF PREMISES.Approved Occupancy", appInfo["DESCRIPTION OF PREMISES.Approved Occupancy"], newLicId);

				useAppSpecificGroupName = tmpUseAppSpecificGroupName;
			}
		}
	}

	if (appMatch("License/Retail License/Retail/Application", capId) && newLicId) {
		CWM_ELP_12487_WTUA_ABCC_createTransportationPermit(newLicId);
	}
	logDebug("newLicId: " + newLicId.getCustomID());
	setExpirationDateForLicense(newLicId);
	var vExpDate = aa.expiration.getLicensesByCapID(newLicId).getOutput().getExpDate();

	if (createRefLP && newLicId) {
		var bizExists = getContactByTypeXXX("Business", capId);
		if (bizExists != false) {
			createRefLicProf_New(newLicIdString, newLicenseType, "Business", initStatus, vExpDate, capId);
		} else {
			createRefLicProf_New(newLicIdString, newLicenseType, "Applicant", initStatus, vExpDate, capId);
		}
		newLic = getRefLicenseProf(newLicIdString);

		if (newLic) {
			//manually set any values on the reference LP
			//newLic.setAuditStatus("A");
			//newLic.setLicOrigIssDate(sysDate);
			//newLic.setLicenseIssueDate(sysDate);
			//newLic.setLicState(licenseState);
			//myResult = aa.licenseScript.editRefLicenseProf(newLic);
			//if (myResult.getSuccess()) {
			logDebug("Reference LP successfully created");
			// added for JIRA 2408
			if (appMatch("License/Retail License/Retail/Application") && ((newLic.getBusinessName2() == null) || (newLic.getBusinessName2() == ""))) {
				var isDBA = AInfo["Please indicate if there is a Doing Business As (DBA) name"];
				if (isDBA == "Y" || isDBA == "Yes") {
					var DBAName = AInfo["DBA Name (if different)"];
					newLic.setBusinessName2(DBAName);
					myResult = aa.licenseScript.editRefLicenseProf(newLic);
					if (myResult.getSuccess())
						logDebug("Reference LP successfully updated");
				}
			}
			// JIRA 2408 END
			if (appMatch("License/State License/Direct Wine Shipper/Application", capId)) { // Defect 11826, Defect#12251
				CWM_ELP_7113_WTUA_ABCC_AssociateLicenses(newLicId);
				associateLpWithCap(newLic, newLicId);
			} else {
				associateLpWithCap(newLic, newLicId);
			}
			//} else {
			//logDebug("Error updating Reference LP");
			//}
		} else {
			logDebug("Reference LP not created");
		}
	}

	if (licHolderSwitch && newLicId) {
		conToChange = null;
		cons = aa.people.getCapContactByCapID(newLicId).getOutput();

		for (thisCon in cons) {
			if (cons[thisCon].getCapContactModel().getPeople().getContactType() == contactType) {
				conToChange = cons[thisCon].getCapContactModel();
				p = conToChange.getPeople();
				p.setContactType("License Holder");
				conToChange.setPeople(p);
				aa.people.editCapContact(conToChange);
				logDebug("Contact type successfully switched to License Holder");
			}
		}
	}

	return newLicId;
} //END createLicense

//********************************************************************************************************************************************
function createRefLicProf_New(rlpId, rlpType, pContactType, initStatus, expDate, capId) {
	//
	//Creates/updates a reference licensed prof from a Contact
	//06SSP-00074, modified for 06SSP-00238

	var rlpBoadName = "Alcoholic Beverages Control Commission";

	var updating = false;
	conArr = getPeople(capId);
	if (!conArr.length) {
		logDebug("**WARNING: No contact available");
		return false;
	}
	var newLic = getRefLicenseProf(rlpId);
	if (newLic) {
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
	} else
		var newLic = aa.licenseScript.createLicenseScriptModel();
	//get contact record
	var cont = null;
	var contBus = null;
	var contFound = false;
	var contBusFound = false;
	for (yy in conArr) {
		if (contFound == false && pContactType != "Business" && pContactType == conArr[yy].getCapContactModel().getPeople().getContactType()) {
			cont = conArr[yy];
			contFound = true;
		}
		if (contBusFound == false && conArr[yy].getCapContactModel().getPeople().getContactType() == "Business") {
			contBus = conArr[yy];
			contBusFound = true;
		}
		if (contFound && contBusFound)
			break;

	}

	if (pContactType != "Business" && !contFound) {
		logDebug("**WARNING: No Contact found of type: " + pContactType);
	}
	if (!contBusFound) {
		logDebug("**WARNING: No Contact found of type: Business");
	}
	var addr = null;
	if (cont)
		addr = getCapContactAddressByType(cont, "Mailing");
	else if (contBus)
		addr = getCapContactAddressByType(contBus, "Business");

	var vAL3 = "";
	if (addr)
		vAL3 = addr.getAddressLine3();

	newLic.setServiceProviderCode(aa.getServiceProviderCode());
	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");
	newLic.setStateLicense(rlpId);
	newLic.setBusinessLicense(null);
	newLic.setLicenseBoard(rlpBoadName);
	newLic.setLicenseType(rlpType);
	newLic.setLicOrigIssDate(sysDate);
	newLic.setLicenseIssueDate(sysDate);
	newLic.setLicenseExpirationDate(expDate);
	if (contBus) {
		var peopBus = contBus.getPeople();
		newLic.setBusinessName(peopBus.getBusinessName());
		newLic.setBusinessName2(peopBus.getTradeName()); //newLic.setBusinessName2(peopBus.getBusinessName2()); commented for defect 2408
		newLic.setFein(peopBus.getFein());
		newLic.setPhone1CountryCode(peopBus.getPhone1CountryCode());
		newLic.setPhone1(peopBus.getPhone1());
		newLic.setEMailAddress(peopBus.getEmail());
	}

	if (cont) {
		var peop = cont.getPeople();
		newLic.setFein(peop.getFein());
		newLic.setContactFirstName(peop.getFirstName());
		newLic.setContactMiddleName(peop.getMiddleName());
		newLic.setContactLastName(peop.getLastName());
		newLic.setSuffixName(peop.getNamesuffix());
		newLic.setSocialSecurityNumber(peop.getSocialSecurityNumber());
		newLic.setMaskedSsn(peop.getMaskedSsn())
		newLic.setEMailAddress(peop.getEmail())
		newLic.setPhone1CountryCode(peop.getPhone1CountryCode());
		newLic.setPhone1(peop.getPhone1());
		newLic.setPhone2CountryCode(peop.getPhone2CountryCode());
		newLic.setPhone2(peop.getPhone2());
		newLic.setPhone3CountryCode(peop.getPhone3CountryCode());
		newLic.setPhone3(peop.getPhone3());
		newLic.setFaxCountryCode(peop.getFaxCountryCode());
		newLic.setFax(peop.getFax());
	}

	if (addr) {
		//Defect 2477 Fix - START
		if (addr.getHouseNumberAlphaStart() == null) {
			newLic.setAddress1(" " + addr.getAddressLine1());
		} else {
			newLic.setAddress1(addr.getHouseNumberAlphaStart() + " " + addr.getAddressLine1());
		}
		//Defect 2477 Fix - END

		newLic.setAddress2(addr.getAddressLine2());
		newLic.setAddress3(vAL3);
		newLic.setCity(addr.getCity());
		newLic.setState(addr.getState());
		newLic.setZip(addr.getZip());
		newLic.setContryCode(addr.getCountryCode());
		newLic.getLicenseModel().setCountryCode(addr.getCountryCode());
		newLic.setCountry(addr.getCountryCode());
	}
	newLic.setLicState(licenseState);
	newLic.setPolicy(initStatus);
	newLic.setWcExempt("Y");
	newLic.setComment(rlpBoadName);
	if (AInfo["Insurance Amount"])
		newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
	if (AInfo["Insurance Exp Date"])
		newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
	if (AInfo["Business License Exp Date"])
		newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);
	if (myResult.getSuccess()) {
		logDebug("Successfully added/updated License No. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
		logMessage("Successfully added/updated License No. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
		return true;
	} else {
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return false;
	}
}

//************************************************************************************************************************************************
function callReport_New(reportToBe, sendToInline, addToPrintBatch, setType, capId) {
	var itemcap = capId;
	if (arguments.length > 4)
		itemcap = arguments[4];

	var myHashMap = aa.util.newHashMap();
	var dDate = new Date();
	var dateString = null;
	var setToBePrinted = null;
	var setName = null;
	var dateString = null;
	var lkupResult = null;
	var setFrequency = null;
	var setDate = null;

	myHashMap.put("ALT_ID", itemcap.getCustomID());

	logDebug("ALT ID inside callReport is " + itemcap.getCustomID());

	if (addToPrintBatch && reportToBe != null) {
		setName = generateBatchPrintSetName(reportToBe);
	}
	if (setName != 'undefined' && setName != null) {
		setToBePrinted = new capSet(setName.toUpperCase());
	}
	if (setType = 'undefined') {
		setType = "Batch Print";
	}
	if (setToBePrinted) {
		setToBePrinted.add(itemcap, false);
		setToBePrinted.updateRecordSetType(setType);
		setToBePrinted.updateSetStatus("Created");
	}
	if (sendToInline) {
		//aa.print("Inline: " + reportToBe);
		//aa.print("inLine: " + itemcap.toString());
		message = "";
		InlinePrint(reportToBe, itemcap);
	}
}

//*********************************************************************************************************************************************************
function setTask_New(wfstr, isOpen, isComplete, capId) // optional process name isOpen, isComplete take 'Y' or 'N'
{
	var useProcess = false;
	var processName = "";

	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, isOpen, isComplete, null, null);
			else
				aa.workflow.adjustTask(capId, stepnumber, isOpen, isComplete, null, null);

			logDebug("set Workflow Task: " + wfstr);
		}
	}
}

//***********************************************************************************************************************************************
function deactivateTask_New(wfstr, capId) // optional process name
{
	var useProcess = false;
	var processName = "";

	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();

			if (useProcess) {
				aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
			} else {
				aa.workflow.adjustTask(capId, stepnumber, "N", completeFlag, null, null);
			}

			logDebug("deactivating Workflow Task: " + wfstr);
		}
	}
}
//***************************************************************************************************************************************************
function activateTask_New(wfstr, capId) // optional process name
{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2) {
		processName = arguments[1]; // subprocess
		useProcess = true;
	}

	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}

	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess) {
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			} else {
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)
			}
			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
		}
	}
}
//******************************************************************************************************************************************************
function CWM_ELP_XXX_WTUA_ABCC_CreateOtherReferenceLicenses_New(capId) {
	logDebug("Inside CWM_ELP_XXX_WTUA_ABCC_CreateOtherReferenceLicenses_New()");

	if (appMatch("License/State License/Farmer Brewery/Application", capId) ||
		appMatch("License/State License/Farmer Winery/Application", capId) ||
		appMatch("License/State License/Farmer Distillery/Application", capId) ||
		appMatch("License/State License/Manufacturer/Application", capId) ||
		appMatch("License/State License/Commercial Alcohol/Application", capId) ||
		appMatch("License/State License/Caterer/Application", capId) ||
		appMatch("License/State License/Salesman Permit/Application", capId) ||
		appMatch("License/State License/Pub Brewery/Application", capId) ||
		appMatch("License/State License/Wholesaler/Application", capId)) {
		logDebug("Inside");
		CWM_ELP_346_WTUA_ABCC_CreateTransportationLicense_New(capId);
		//create Direct Wine Shipper for Release C build
		if (AInfo["Apply for a Direct Wine Shipper License"] == "Yes" || AInfo["Apply for/renew Direct Wine Shipper License"] == "Yes") //Defect 13120
		{
			CWM_ELP_Build_C_WTUA_ABCC_CreateDirectWineShipperLicense();
		}
	} else if (appMatch("License/State License/Farmer Brewery/Renewal", capId) ||
		appMatch("License/State License/Farmer Winery/Renewal", capId) ||
		appMatch("License/State License/Farmer Distillery/Renewal", capId) ||
		appMatch("License/State License/Manufacturer/Renewal", capId) ||
		appMatch("License/State License/Commercial Alcohol/Renewal", capId) ||
		appMatch("License/State License/Caterer/Renewal", capId) ||
		appMatch("License/State License/Salesman Permit/Renewal", capId) ||
		appMatch("License/State License/Pub Brewery/Renewal", capId) ||
		appMatch("License/State License/Wholesaler/Renewal", capId)) {
		CWM_ELP_346_WTUA_ABCC_Create_UpdateTransportationLicense();
		if (AInfo["Apply for a Direct Wine Shipper License"] == "Yes" || AInfo["Apply for/renew Direct Wine Shipper License"] == "Yes") //Defect 13120
		{
			CWM_ELP_Release_C_WTUA_ABCC_Create_UpdateDirectWineShipperLicense();
		}
	}

	if ((appMatch("License/State License/Agent Broker Solicitor/*", capId))) {
		CWM_ELP_1408_WTUA_ABCC_AssociateLicenses(capId);
	}

}

//*****************************************************************************************************************************************************
function CWM_ELP_346_WTUA_ABCC_CreateTransportationLicense_New(capId) {
	cap = aa.cap.getCap(capId).getOutput();
	logDebug("CapId********: " + capId);
	var appTypeResult = cap.getCapType();
	var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
	var appTypeArray = appTypeString.split("/");
	logDebug("Inside CWM_ELP_346_WTUA_ABCC_CreateTransportationLicense_New()");
	var asitInformation = loadASITable("VEHICLE INFORMATION", capId);
	var tableName = "VEHICLE INFORMATION";
	var rows;
	var column = new Array();
	var thisContactType = null;
	if (appTypeArray[2] == "Salesman Permit") {
		if (appTypeArray[3] == "Application") {
			thisContactType = "Applicant";
		} else {
			thisContactType = "Licensed Individual";
		}
	} else {
		thisContactType = "Business";
	}

	if (asitInformation && asitInformation.length > 0) {
		logDebug("vehicle info length:" + asitInformation.length);
		for (var numofTP = 0; numofTP < asitInformation.length; numofTP++) {
			//logDebug("numofTP:"+numofTP);
			// Create Transaction License and Reference Licence (but do not associate)
			tranLicId = createLicenseWithoutChild_New("Issued", true, true, "Transportation Permit", null, false);
			// Remove the ApplicationContact
			removeApplicationContactFromLicense(tranLicId);

			// Copy ASIT
			column["Vehicle Plate Number"] = asitInformation[numofTP]["Vehicle Plate Number"];
			column["Leased or Owned by Employee?"] = asitInformation[numofTP]["Leased or Owned by Employee?"];
			column["Employee Name"] = asitInformation[numofTP]["Employee Name"];
			rows = new Array();
			rows.push(column);
			addASITable(tableName, rows, tranLicId);

			parentLicenseCapID = getParentLicenseRecord(capId);
			transRefLic = getRefLicenseProf(parentLicenseCapID.getCustomID());
			//Populate ASI
			var capScriptModel = aa.cap.getCap(parentLicenseCapID).getOutput();
			var capTypeString = capScriptModel.getCapType();
			var capTypeArray = String(capTypeString).split("/");
			var subType = capTypeArray[2];
			var licType = null;
			licType = lookup("TRANS_PERMIT_LIC_TYPE_LOOKUP", subType);
			if (licType != null) {
				editAppSpecific("ABCC License Type", licType, tranLicId);
			}
			var dbaName = getAppSpecific("DBA Name (if different)", parentLicenseCapID);
			editAppSpecific("DBA Name (if different)", dbaName, tranLicId);
			var website = getAppSpecific("Website", parentLicenseCapID);
			editAppSpecific("Website", website, tranLicId);
			var signature = getAppSpecific("Signature", parentLicenseCapID);
			editAppSpecific("Signature", signature, tranLicId);
			var title = getAppSpecific("Title", parentLicenseCapID);
			editAppSpecific("Title", title, tranLicId);

			// Associate the Transportation LP to the parent license record of this Application/Renewal
			transRefLic = getRefLicenseProf(tranLicId.getCustomID());
			if (transRefLic) {
				associateLpWithCap(transRefLic, parentLicenseCapID);
				logDebug("Transportation Permit LP associated to license " + parentLicenseCapID.getCustomID());
			} else
				logDebug("Parent License for " + capId.getCustomID() + " not found");
		}
	}
}

//***********************************************************************************************************************************************
function CWM_ELP_CR70_deactivateTransferredLicense_New(capId) {

	if (!appMatch("License/Retail License/Retail/Application", capId)) {
		var transferredLicenseAltId = getAppSpecific("License Number", capId);
		var transferRequest = getAppSpecific("Request Transfer of License", capId);
		var transferRequestPUB = getAppSpecific("Are you applying for a Transfer", capId);
		try {
			if (appMatch("License/State License/Manufacturer/Application") ||
				appMatch("License/State License/Wholesaler/Application") ||
				appMatch("License/State License/Manufacturer/Application")) {
				if ((transferRequestPUB == "Yes" || transferRequest == "Yes") && (transferredLicenseAltId != "" || transferredLicenseAltId != null)) {
					var transferredCapId = aa.cap.getCapID(transferredLicenseAltId).getOutput();
					if (transferredCapId) {
						updateAppStatus("Expired", "Updated via Script. Transfer Request", transferredCapId);
						updateTask("License", "Expired", "Updated via script, Transfer Request.", "Updated via script, Transfer Request.", "", transferredCapId);

						var b1ExpResult = aa.expiration.getLicensesByCapID(transferredCapId);
						if (b1ExpResult.getSuccess()) {
							var b1Exp = b1ExpResult.getOutput();
							if (b1Exp) {
								thisLic = new licenseObject(transferredLicenseAltId, transferredCapId);
								thisLic.setStatus("Expired");
							}
						}
					}
				}
			}
		} catch (err) {
			logDebug("Error on deactivateTransferredLicense function. Please contact System Administrator");
			err.message;
		}
	} else {
		var transferredLicenseAltId = getAppSpecific("License Number for Transfer", capId);
		var ApplyNewYN = getAppSpecific("Apply for a New License", capId);
		logDebug("ApplyNewYN :" + ApplyNewYN);
		/*JIRA#3492 Start*/
		var vParentCapId = getParentLicenseRecord(capId);
		logDebug("vParentCapId:" + vParentCapId);
		var vTransferWFComment = "";
		if (vParentCapId) {
			var vNewLicRec = vParentCapId.getCustomID();
			vTransferWFComment = "Updated via script. Set to Expired due to approval of License Transfer [" + vNewLicRec + "]";
		} else {
			vTransferWFComment = "Updated via script. Set to Expired due to approval of License Transfer";
		}
		logDebug("vTransferWFComment :" + vTransferWFComment);
		/*JIRA#3492 End*/
		try {

			if (ApplyNewYN == "No" && (transferredLicenseAltId != "" || transferredLicenseAltId != null)) {
				var transferredCapId = aa.cap.getCapID(transferredLicenseAltId).getOutput();
				if (transferredCapId) {
					updateAppStatus("Expired", "Updated via Script. Transfer Request", transferredCapId);
					updateTask("Retail License", "Expired", String(vTransferWFComment), String(vTransferWFComment), "", transferredCapId);

					/*JIRA#3492 Start*/
					transferredLicenseAltId = String(transferredLicenseAltId);
					var vTransfRefLP = getRefLicenseProf(transferredLicenseAltId);
					if (vTransfRefLP) {
						vTransfRefLP.setPolicy("Expired");
						aa.licenseScript.editRefLicenseProf(vTransfRefLP);
					} else {
						logDebug("Warning**Refernce LP:" + vTransfRefLP);
					}
					/*JIRA#3492 End*/
					var b1ExpResult = aa.expiration.getLicensesByCapID(transferredCapId);
					if (b1ExpResult.getSuccess()) {
						var b1Exp = b1ExpResult.getOutput();
						if (b1Exp) {
							thisLic = new licenseObject(transferredLicenseAltId, transferredCapId);
							thisLic.setStatus("Expired");
						}
					}
				}
			}

		} catch (err) {
			logDebug("Error on deactivateTransferredLicense function. Please contact System Administrator");
			err.message;
		}
	}
}
//*******************************************************************************************************************************************************
function CWM_ELP_346_WTUA_ABCC_Create_UpdateTransportationLicense_New(capId) {
	var asitInformation = loadASITable("VEHICLE INFORMATION");
	var newTP = 0;
	var parentLicenseCapID = getParentLicenseRecord(capId);
	var parentTable = loadASITable("VEHICLE INFORMATION", parentLicenseCapID);
	var parentPlates = aa.util.newArrayList();
	var renewVehicles = aa.util.newArrayList();
	var tableName = "VEHICLE INFORMATION";
	var rows;
	var column = new Array();
	var counter = 0;
	if (parentTable && parentTable != null && parentTable.length > 0) {
		for (rec in parentTable) {
			parentPlates.add(String(parentTable[rec]["Vehicle Plate Number"]).toUpperCase()); //make upperCase
		}
		for (row in asitInformation) {
			if (parentPlates) {
				if (!parentPlates.contains(String(asitInformation[row]["Vehicle Plate Number"]).toUpperCase())) { //make upperCase
					newTP++; //if the renewal has any plates that are not on the license
				} else {
					renewVehicles.add(String(asitInformation[row]["Vehicle Plate Number"]).toUpperCase());
				}
			}
		}
	}
	logDebug("newTP:" + newTP);
	logDebug("renewVehicles:" + renewVehicles.size());

	if ((asitInformation) && (asitInformation.length > 0)) { //Renew Transportation Permits if they were on the renewal
		var tpResult = aa.licenseScript.getLicenseProf(parentLicenseCapID);
		if (tpResult.success) {
			var tpList = tpResult.getOutput();
			var tpID;
			var licNbr;
			var b1ExpResultRec;
			var licExpiration;
			var tpExp;
			var appType;
			var appTypeArray;
			var expModel;
			var tpVehicleASIT;

			for (tp in tpList) {
				licNbr = tpList[tp].getLicenseNbr();
				logDebug("reference license:" + licNbr);
				tpID = aa.cap.getCapID(licNbr).getOutput();
				logDebug("ref license capID:" + tpID);
				if (tpID && tpID != null) {
					appType = aa.cap.getCapTypeModelByCapID(tpID).getOutput();
					logDebug("ref type:" + appType);
					appTypeArray = appType.toString().split("/");
					//logDebug("appTypeArray length:" + appTypeArray.length);
					logDebug("license type:" + appTypeArray[2]);
					if (appTypeArray[2] == "Transportation Permit") {
						tpVehicleASIT = loadASITable("VEHICLE INFORMATION", tpID);
						//logDebug("tpVehicleASIT[0]Plate Number: " +tpVehicleASIT[0]["Vehicle Plate Number"]);
						if (tpVehicleASIT.length > 0) {
							if (renewVehicles.size() > 0 && renewVehicles.contains(String(tpVehicleASIT[0]["Vehicle Plate Number"]).toUpperCase())) {
								var index = renewVehicles.indexOf(String(tpVehicleASIT[0]["Vehicle Plate Number"]).toUpperCase());
								renewVehicles.remove(index);

								updateAppStatus("Issued", "Updated by script", tpID);
								updateTask("License", "Issued", "Updated by script", "Updated by script", null, tpID);
								b1ExpResultRec = aa.expiration.getLicensesByCapID(tpID);
								licExpiration = aa.expiration.getLicensesByCapID(parentLicenseCapID).getOutput(); //expiration of the license
								logDebug("licExp:" + licExpiration);
								if (b1ExpResultRec.getSuccess) {
									tpExp = b1ExpResultRec.getOutput(); //expiration of the renewal
									if (tpExp != null) {
										tpExp.setExpStatus("Active");
										tpExp.setExpDate(licExpiration.getExpDate()); //sets the transportation permit's renewal expiration to match the license's
										expModel = tpExp.getB1Expiration();
										aa.expiration.editB1Expiration(expModel);
										// update for 2408// what about Record expiration status
										var transRefLic = getRefLicenseProf(tpID.getCustomID());
										transRefLic.setLicenseExpirationDate(licExpiration.getExpDate());
										myResult = aa.licenseScript.editRefLicenseProf(transRefLic);
										logDebug("Transportation Permit LP expiration date updated: " + myResult.getSuccess());
										// update for 2408 end

									}
								}
								logDebug("Copying ASIT");
								copyOneVehicle(tpID, capId); //copy the appropriate ASIT row from the renewal to the Transportation Permit
							}
						}
					}
				}
			}
		}
		if (renewVehicles.size() > 0) {
			for (var numofTP = 0; numofTP < renewVehicles.size(); numofTP++) {
				logDebug("renewVehicles: " + numofTP);
				renArray = renewVehicles.toArray();
				var tranLicIdRV = createLicenseWithoutChild_New("Issued", true, true, "Transportation Permit", null, false);

				// Copy ASIT
				vpn = new Array();
				rows = new Array();
				vpn["Vehicle Plate Number"] = String(renArray[numofTP]);
				vpn["Leased or Owned by Employee?"] = "";
				vpn["Employee Name"] = "";
				rows[numofTP] = vpn;
				addASITable(tableName, rows, tranLicIdRV);

				transRefLicRV = getRefLicenseProf(tranLicIdRV.getCustomID());
				if (transRefLicRV) {
					associateLpWithCap(transRefLicRV, parentLicenseCapID);
					logDebug("Transportation Permit LP associated to license " + parentLicenseCapID.getCustomID());
					//Update transaction TR with Expiration date
					// update for 2408//
					licExpiration = aa.expiration.getLicensesByCapID(parentLicenseCapID).getOutput(); //expiration of the license
					var b1ExpResultRecTP = aa.expiration.getLicensesByCapID(tranLicIdRV);
					if (b1ExpResultRecTP.getSuccess) {
						tpExp = b1ExpResultRecTP.getOutput(); //expiration of the renewal
						if (tpExp != null) {
							tpExp.setExpStatus("Active");
							tpExp.setExpDate(licExpiration.getExpDate()); //sets the transportation permit's renewal expiration to match the license's
							expModel = tpExp.getB1Expiration();
							aa.expiration.editB1Expiration(expModel);
						}
					}
					//Update LP TR with expiration date
					transRefLicRV.setLicenseExpirationDate(licExpiration.getExpDate());
					myResult = aa.licenseScript.editRefLicenseProf(transRefLicRV);
					logDebug("Transportation Permit LP expiration date updated: " + myResult.getSuccess() + " for: " + tranLicIdRV.getCustomID());
					// update for 2408 end


				} else {
					logDebug("License professional for " + tranLicIdRV.getCustomID() + " not found");
				}
			}
		}
	}
	if ((asitInformation) && (newTP > 0)) {
		for (var numofTP = 0; numofTP < newTP; numofTP++) {
			// Create Transaction License and Reference Licence (but do not associate)
			tranLicIdTP = createLicenseWithoutChild_New("Issued", true, true, "Transportation Permit", null, false);
			// Remove the Applicant
			removeApplicantFromLicense(tranLicIdTP);

			// Copy ASIT
			counter = ((asitInformation.length) - newTP) + numofTP;
			column["Vehicle Plate Number"] = asitInformation[counter]["Vehicle Plate Number"];
			column["Leased or Owned by Employee?"] = asitInformation[counter]["Leased or Owned by Employee?"];
			column["Employee Name"] = asitInformation[counter]["Employee Name"];
			rows = new Array();
			rows.push(column);
			addASITable(tableName, rows, tranLicIdTP);

			// Associate the Transportation LP to the parent license record of this Application/Renewal
			transRefLicTP = getRefLicenseProf(tranLicIdTP.getCustomID());
			if (transRefLicTP) {
				associateLpWithCap(transRefLicTP, parentLicenseCapID);
				logDebug("Transportation Permit LP associated to license " + parentLicenseCapID.getCustomID());
				//Update transaction TR with Expiration date
				// update for 2408//
				licExpiration = aa.expiration.getLicensesByCapID(parentLicenseCapID).getOutput(); //expiration of the license
				b1ExpResultRecTP = aa.expiration.getLicensesByCapID(tranLicIdTP);
				if (b1ExpResultRecTP.getSuccess) {
					tpExp = b1ExpResultRecTP.getOutput(); //expiration of the renewal
					if (tpExp != null) {
						tpExp.setExpStatus("Active");
						tpExp.setExpDate(licExpiration.getExpDate()); //sets the transportation permit's renewal expiration to match the license's
						expModel = tpExp.getB1Expiration();
						aa.expiration.editB1Expiration(expModel);
					}
				}
				//Update LP TR with expiration date
				transRefLicTP.setLicenseExpirationDate(licExpiration.getExpDate());
				myResult = aa.licenseScript.editRefLicenseProf(transRefLicTP);
				logDebug("Transportation Permit LP expiration date updated: " + myResult.getSuccess() + " for: " + tranLicIdTP.getCustomID());
				// update for 2408 end
			} else {
				logDebug("License professional for " + tranLicIdTP.getCustomID() + " not found");
			}
		}
	} else {
		logDebug("No need to create new transportation permit.");
	}
}

//***************************************************************************************************************************************************
function CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment_1(capId) {
	try {
		//updated for JIRA # 4598
		var licCapId = null;
		licCapId = parentCapId;
		if (!parentCapId || parentCapId == null) {
			licCapId = getParent();
			if (!licCapId || licCapId == null) {
				licCapId = getParentLicenseRecord(capId);
			}
		} else {
			licCapId = getParentLicenseRecord(capId);
		}

		licCapId = aa.cap.getCapID(licCapId.ID1, licCapId.ID2, licCapId.ID3).getOutput();
		var licAltId = licCapId.getCustomID();
		var itemCapScriptModel = aa.cap.getCap(licCapId).getOutput();
		var licAppType = itemCapScriptModel.getCapType().getAlias()

			if (itemCapScriptModel.getCapType().getType() == "State License") {
				var contactEmails = new Array();
				var contactName = "";
				//var bizName = "";
				var reportName = "License_Certificate";
				var emailTemplate = "EMAIL CORRESPONDENCE LICENSE";
				var myHashMap = aa.util.newHashMap();
				myHashMap.put("License_Number", String(licCapId.getCustomID()));
				var capContactArr = getPeople(capId);
				//JIRA#3508 start , added in try catch, some time new methods body do not migrated but calling method got migrated with some other defect which cause issue in PROD.
				try {
					var isHaveBusinessContact = isContactPresentOnCapModel(capId, "BUSINESS"); //check Business Contact present or not. For Few State licnese 'Business' is not required like salesman amendment
				} catch (err) {
					logDebug("Error*:" + err.message);
				}

				var contactTypeCheck = "BUSINESS";
				if (!isHaveBusinessContact) {
					contactTypeCheck = "APPLICATION CONTACT"
				}

				aa.print("isHaveBusinessContact:" + isHaveBusinessContact + "," + contactTypeCheck);
				//JIRA#3508 End
				for (contactItem in capContactArr) {
					var contactType = capContactArr[contactItem].getCapContactModel().getPeople().getContactType();
					var email = capContactArr[contactItem].getCapContactModel().getEmail();

					if (contactType != null && (String(contactType).toUpperCase() == contactTypeCheck)) {
						if (email != null) {
							logDebug("Contact Email Address " + capContactArr[contactItem].email + " for " + contactType + " contact type.");
							var atIndex = String(capContactArr[contactItem].email).indexOf("@");
							var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
							if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) // basic email validation
							{
								contactEmails.push(capContactArr[contactItem].email);
								//updated below code to handle if first name and Last name is Null
								if (capContactArr[contactItem].firstName != null && capContactArr[contactItem].lastName != null)
									contactName = capContactArr[contactItem].firstName + " " + capContactArr[contactItem].lastName;
								else
									contactName = capContactArr[contactItem].getPeople().businessName;

								//bizName = capContactArr[contactItem].getPeople().businessName;
							}
						}
					}
				}

				if (contactEmails && contactEmails.length > 0) {
					logDebug("contactEmails :" + contactEmails);
					for (validEmail in contactEmails) {
						logDebug("Trying to send email to " + contactName + " to email " + String(contactEmails[validEmail]));
						var emailParameters = aa.util.newHashtable();
						emailParameters.put("$$Licensee_Name$$", contactName);
						emailParameters.put("$$Busines$$", contactName);
						emailParameters.put("$$appType$$", licAppType);
						emailParameters.put("$$licAltID$$", licAltId);
						// Start 10/25/2017 ETW Updated EPLACE-3263
						/*
						if (publicUser) {
						sendReportByEmailTemplate(reportName, myHashMap, "Noreply@elicensing.state.ma.us", String(contactEmails[validEmail]), "", emailTemplate, emailParameters, "License", "ADMIN");

						//	generateReportSaveAndEmailCClla(reportName, myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]));
						logDebug("emailed from public user");
						updateTask("Issuance", "Emailed", "Task updated by automation");
						deactivateTask("Issuance");
						} else if (!publicUser && !generateReportSaveAndEmail(reportName, myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId))
						logDebug("Error sending Email to " + String(contactEmails[validEmail]) + " from CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment()");
						else {
						logDebug("SUCCESS!! Email sent..");
						updateTask("Issuance", "Emailed", "Task updated by automation");
						deactivateTask("Issuance");
						}
						 */
						// Save capId and set to licCapId so that the email and report will be on the license
						var vTmpCapId = capId;
						capId = licCapId;
						//added extra
						//var isSent = sedEmailWithReportAttchment(reportName, myHashMap, emailTemplate, params, emailParameters, capId)
						sedEmailWithReportAttchment(reportName, myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId);
						//ended
						//sendReportByEmailTemplate(reportName, myHashMap, sysFromEmail, String(contactEmails[validEmail]), "", emailTemplate, emailParameters, "License", "ADMIN");
						logDebug("SUCCESS!! Email sent.." + String(contactEmails[validEmail]));
						capId = vTmpCapId;
						updateTask("Issuance", "Emailed", "Task updated by automation");
						deactivateTask("Issuance");
						// End 10/25/2017 ETW Updated EPLACE-3263

						/*if (!generateReportSaveAndEmail(reportName, myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId)){
						logDebug("Error sending Email to " + String(contactEmails[validEmail]) + " from CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment()");
						}
						else{
						closeTask("Issuance","Emailed","Updated via sript","");
						deactivateTask("Issuance");
						logDebug("Report has been Emailed from CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment()");
						}*/
					}
				}
			} else {
				if (itemCapScriptModel.getCapType().getType() == "Retail License") {
					var LLA_Name = getLLAName(AInfo["City/Town Name"]);
					var reportName = "Application Summary Review";
					var myHashMap = aa.util.newHashMap();
					myHashMap.put("ALT_ID", String(capId.getCustomID()));
					var params = aa.util.newHashtable();
					var appCapScriptModel = aa.cap.getCap(capId).getOutput();
					addParameter(params, "$$AppType$$", appCapScriptModel.getCapType().getAlias());
					addParameter(params, "$$License_Type$$", itemCapScriptModel.getCapType().getAlias());
					getContactParams4NotificationXXX(params, "Business");
					getContactParams4NotificationXXX(params, "LLA");
					getContactParams4NotificationXXX(params, "Application Contact");
					addParameter(params, "$$Town$$", AInfo["City/Town Name"]);
					addParameter(params, "$$licAltID$$", licAltId);
					addParameter(params, "$$LLA_NAME$$", LLA_Name);
					params.put("$$businessBusinesName$$", params.get("$$businessBusinesName$$"));

					var emailTo = "";
					if (params.get("$$application contactEmail$$") == null)
						emailTo = params.get("$$businessEmail$$");
					else
						emailTo = params.get("$$application contactEmail$$");
					//added extra
					//var fvFileNames = [];
					// var capIDScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
					//aa.document.sendEmailAndSaveAsDocument("tpatel@razavi.com",emailTo,"","EMAIL RETAIL LICENSEE NOTIFICATION",params,capIDScriptModel,fvFileNames);
					//end  extra
					var isSent = sedEmailWithReportAttchment(reportName, myHashMap, "EMAIL RETAIL LICENSEE NOTIFICATION", params, emailTo, capId, params.get("$$llaEmail$$"))
						if (!isSent) {
							logDebug("Email Sent Sucessfully111111!!!");
							sendNotification(sysFromEmail, emailTo, params.get("$$llaEmail$$"), "EMAIL RETAIL LICENSEE NOTIFICATION", params, null);
							closeTask("Issuance", "Emailed", "Updated via sript", "");
							deactivateTask("Issuance");
						} else {
							logDebug("Email Sent Sucessfully!!!");
							closeTask("Issuance", "Emailed", "Updated via sript", "");
							deactivateTask("Issuance");
						}

				}
			}
	} catch (err) {
		showMessage = true;
		comment("Error on function CWM_ELP_WTUA_Email_License_Issuance_Notification_From_Amendment, Please contact administrator : " + err);
	}
}
//Ended JIRA 4598
//*********************************************************************************************************************************************************


//*********************************************************************************************************************************************************
function copyAppSpecificInformation(pToCapId, pFromCapId) {
	var appSpecInfoToResult = aa.appSpecificInfo.getByCapID(pToCapId);
	if (appSpecInfoToResult.getSuccess()) {
		var appSpecInfoResult = aa.appSpecificInfo.getByCapID(pFromCapId);

		if (appSpecInfoResult.getSuccess()) {
			var appspecObj = appSpecInfoResult.getOutput();
			var appspecToObj = appSpecInfoToResult.getOutput();
			for (i in appspecToObj) {
				for (j in appspecObj) {

					if (appspecToObj[i].getCheckboxDesc() == appspecObj[j].getCheckboxDesc()) {
						appspecToObj[i].setChecklistComment(appspecObj[j].getChecklistComment());
						logDebug("Setting app spec info item " + appspecToObj[i].getCheckboxDesc() + " to " + appspecObj[j].getChecklistComment());
						break;
					}
				}

			}
			var actionResult = aa.appSpecificInfo.editAppSpecInfos(appspecToObj);
			if (actionResult.getSuccess()) {
				//logDebug("app spec info item " + itemName + " has been given a value of " + itemValue);
			} else {
				logDebug("**ERROR: Setting the app spec info item " + itemName + " to " + itemValue + " .\nReason is: " + actionResult.getErrorType() + ":" + actionResult.getErrorMessage());
			}
		} // item name blank
	} // got app specific object
	else {
		logDebug("**ERROR: getting target app specific info for Cap : " + appSpecInfoResult.getErrorMessage());
	}

}
