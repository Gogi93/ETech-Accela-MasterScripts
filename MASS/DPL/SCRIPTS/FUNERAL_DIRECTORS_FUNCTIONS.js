function CWM_ELP_DPL_CTRCA_attestationCheckFA(itemCapId) {
	try {
		useAppSpecificGroupName = false;
		var result = false;
		var tmpCapId = null;

		if (capId) {
			tmpCapId = capId;
			capId = itemCapId;
		} else {
			capId = itemCapId;
		}

		// this to avoid a script error from special character.
		var splChar = String.fromCharCode(167);
		var asiName = "A. I AM IN COMPLIANCE WITH G.L.c.62C " + splChar + splChar + "47A & 49A.";
		var inComplianceGLC = getAppSpecific(asiName);
		var educationAsi = getAppSpecific("B. I HAVE COMPLETED ALL REQUIRED CONTINUING EDUCATION IN COMPLIANCE WITH BOARD STATUTES/REGULATIONS");
		var reportedDiscipline = getAppSpecific("C. I HAVE REPORTED TO THE BOARD ALL DISCIPLINE TAKEN AGAINST ANY PROFESSIONAL LICENSE ISSUED TO ME.");
		var reportedPleas = getAppSpecific("D. I HAVE REPORTED TO THE BOARD ALL CRIMINAL CONVICTIONS OR GUILTY PLEAS.");
		// skumar: CR398 matching fields (extra space is required)
		asiName = "E.  AS REQUIRED BY M.G.L. C. 30A, " + splChar + "13A, I HAVE REPORTED MY SOCIAL SECURITY NUMBER.";
		var reportedSSN = getAppSpecific(asiName);
		var reportedEstEmployer = getAppSpecific("F. I HAVE REPORTED ANY CHANGE IN MY FUNERAL ESTABLISHMENT EMPLOYER.");
		var haveCompleted = getAppSpecific("B. I HAVE COMPLETED ALL REQUIRED CONTINUING EDUCATION IN COMPLIANCE WITH BOARD STATUTES/REGULATIONS").toUpperCase().equals("YES");
		if(reportedSSN  == undefined){ reportedSSN  = "NO";}

		//Fix For Defect 10162 by Vishakha M Singh
		// skumar - CR 398; Type3 renewal attestation has questions from A to G and all Y/N conditions should be handled
	// so the following code will never get executed for Type 3 since the logic is covered as part of another function called prior to this function. 
		/*
		if(appMatch("License/Funeral Directors/Type 3/Renewal"))
		{
			if(educationAsi == "NO")
			{
			//1. DO NOT Renew the license.
			//2. Set the Renewal record Workflow Task/Status to 'Validate/CE Attestation Review'
			closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
			updateTask("Validate", "CE Attestation Review", "Updated via script.", "Updated via script.");
			activateTask("Validate");
			//3. Put the renewal record into the license print set.
			var reportName = "DPL|LICENSE_REGISTRATION_CARD";
			var setType = "DPL License Print Set";
			callReport(reportName, false, true, setType);
			result = true;
			}
		}
		else
		{*/
			if (!haveCompleted) {
			//CWM_ELP_Generic_DPL_addConditionOnCap("Renewal","Positive Renewal Attestation");
			logDebug("Have not completed.");
			closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
			updateTask("Validate", "CE Attestation Review", "Updated via script.", "Updated via script.");
			activateTask("Validate");
			assignedToByShortNotes("Validate", getBoard(capId)); //If any are NO, complete task assignment
			addToLicensePrintSet(capId);
			} else if (inComplianceGLC.toUpperCase().equals("NO") || reportedDiscipline.toUpperCase().equals("NO") ||
			reportedPleas.toUpperCase().equals("NO") || reportedSSN.toUpperCase().equals("NO") || reportedEstEmployer.toUpperCase().equals("NO")) {
			// Note: Adding the renewal License into the Print set is included in renewalApproval()
			logDebug("If any are No");
			assignedToByShortNotes("Intake", getBoard(capId)); //If any are NO, complete task assignment
			if (renewalApproval(capId)) {
				closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
				activateTask("Issuance");
				updateTask("Issuance", "Attestation Review", "Updated via script.", "Updated via script.");
				assignedToByShortNotes("Issuance", getBoard(capId));
				result = true;
			} else
				result = false;
			} else { // enters when all are YES
				if (renewalApproval(capId)) {
					logDebug("Post renewal approval workflow tasks settings for " + capId.getCustomID());
					closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
					activateTask("Issuance");
					updateTask("Issuance", "Ready for Printing", "Updated via script.", "Updated via script.");
					result = true;
				} else
					result = false;
			}
		//}	
		
		capId = tmpCapId;
		return result;
	} catch (error) {
		logDebug("An exception has been thrown by CWM_ELP_DPL_CTRCA_attestationCheckFA");
	}
}

function CWM_ELP_DPL_681_WTUA_setExpDateForFuneralAssistant(itemCap){
	try{
		var currentDate = new Date();
		var expDate = new Date();
		expDate.setDate(20);
		expDate.setMonth(9);
		var currYear = currentDate.getFullYear();
		var currMonth = currentDate.getMonth();
		var expMonth = expDate.getMonth();
		if(currMonth >= 7 && currMonth <= 11)
		{
			expDate.setFullYear(currYear + 1);
			expDate.setMonth(9);
			expDate.setDate(20);
		}
		else
		{
			expDate.setFullYear(currYear);
			expDate.setMonth(9);
			expDate.setDate(20);
		}
		var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
		logDebug("expDateString : "+expDateString);
		licCustID = itemCap.getCustomID();
		if (licCustID)
			logDebug("Parent ID: " + licCustID + " " + itemCap);
		else
			logDebug("Unable to get Parent ID");
		thisLic=new licenseObject(licCustID,itemCap);
		thisLic.setExpiration(expDateString);
		thisLic.setStatus("Active");
	}
	catch(error)
	{
		showMessage=true;
		comment("Error on CCWM_ELP_DPL_681_WTUA_setExpDateForFuneralAssistant:" + error + ". Please contact administrator");
	}
}	
// END OF FUNCTION: CWM_ELP_DPL_681_WTUA_setExpDateForFuneralAssistant

//By:debashish.barik (SCRIPT#671), Dt:2/4/2016
//FUNERAL_DIRECTORS_FUNCTIONS
function CWM_ELP_DPL_671_ASB_validateFuneralEstablishmentLicense() {
	try {
		var isValidLicense = false;
		useAppSpecificGroupName = true;
		//Get AppSpecificInfo details
		var myAInfo = new Array();
		if (!publicUser) {
			loadAppSpecificBefore(myAInfo);
		} else { //Only for ACA page flow
			loadAppSpecific4ACA(myAInfo);
		}
		var fuEstLicenseNumber = myAInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
		useAppSpecificGroupName = false;
		logDebug("fuEstLicenseNumber####:" + fuEstLicenseNumber);
		if (fuEstLicenseNumber != null && fuEstLicenseNumber != 'undefined' && fuEstLicenseNumber != "") {
			//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
			fuEstLicenseNumber = String(fuEstLicenseNumber).toUpperCase();
			var vFeLic = getRefLicenseProf(fuEstLicenseNumber, "FE", "FE");
			var isActive = isLicenseActive(fuEstLicenseNumber, "FE", "FE");
			if (isActive && (vFeLic.getPolicy() == "Current")) {
				isValidLicense = true;
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("Funeral Establishment License entered is not Current, please contact the Board");
			}
		}
	} catch (err) {
		logDebug("ERROR** inside CWM_ELP_DPL_671_ASB_validateFuneralEstablishmentLicense. " + err.message);
	}
}

/*1. Validate that this is a current Type 3 license.
 *2.  If NOT, then message licensee/user:  "Type 3 License entered is not Current, please contact the Board".
 *Added by Ankush
 */
function CWM_ELP_DPL_522_ASB_validateType3LicenseInAddNewRelationshipASI_OLD() {
	try {
		var type3SponsorLicenseNumber = null;
		//Get AppSpecificInfo details
		if (publicUser) // HANDLE ACA PAGEFLOW
		{
			/*var cap = aa.env.getValue('CapModel');
			var currentCapId = cap.getCapID();*/
			type3SponsorLicenseNumber = AInfo["Type 3 Sponsor License Number"];
		}else if(!publicUser){
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			type3SponsorLicenseNumber = myAInfo["ADD NEW RELATIONSHIP.Type 3 Sponsor License Number"];
			useAppSpecificGroupName = false;
		}		
		if (type3SponsorLicenseNumber != null &&  type3SponsorLicenseNumber != "") {
			type3SponsorLicenseNumber = type3SponsorLicenseNumber.toString();
			if(type3SponsorLicenseNumber.indexOf("-") < 0){
				type3SponsorLicenseNumber = type3SponsorLicenseNumber + "-" + "EM" + "-" + "3";			
			}
			//var type3SponsorLicenseNumber = getAppSpecific("Type 3 Sponsor License Number",capId);
			var type3SponsorLicenseNumberCapID = aa.cap.getCapID(type3SponsorLicenseNumber).getOutput();
			var type3SponsorCapType = aa.cap.getCap(type3SponsorLicenseNumberCapID).getOutput().getCapType().toString();
			var licTypeArr = type3SponsorCapType.split("/");
			//Get license sub-type
			var licenseType = licTypeArr[2];
			var isValidLicense = false;
			//1)check licenseType is current "Type 3" license
			if (licenseType != null && licenseType == "Type 3") {
				if (isLicenseCurrent(type3SponsorLicenseNumberCapID)) {
					isValidLicense = true;
				}
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("Type 3 License entered is not Current, please contact the Board.");
			}
		}
	} catch (err) {
		useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("ERROR:Type 3 License entered is not Current, please contact the Board.");
	}
}// END OF FUNCTION: CWM_ELP_DPL_522_ASB_validateType3LicenseInAddNewRelationshipASI

/*@desc 
 *1. Validate that this is a Type 3 license that is linked to this Apprentice license.
 *1a. If the validation fails, then display the message "The Type 3 License number entered is not a valid license."
 *Note:-The license of the relationship being ended does not have to be in a status of Current.
 *	   -The current link can be established either by the licnese showing on the license tab and/or the key individual contact not having an end date.
 *Added by Ankush
*/
function CWM_ELP_DPL_520_ASB_validateType3LicenseLinkedToApprentice(){
	try{
	//Get AppSpecificInfo details
	//useAppSpecificGroupName = true;
	//var type3SponsorLicenseNumber = getAppSpecific("END EXISTING RELATIONSHIP.Type 3 Sponsor License Number",capId);	
	//useAppSpecificGroupName = false;
	var type3SponsorLicenseNumber = null;
	var parentLicenseCapId = null;
	var parentLicenseNbr = null;
var vParentLicNumeric ;
	if (publicUser) // HANDLE ACA PAGEFLOW
	{
		/*var cap = aa.env.getValue('CapModel');
		var currentCapId = cap.getCapID();*/
		//type3SponsorLicenseNumber = AInfo["Type 3 Sponsor License Number"];
		var myAInfo = new Array();
		useAppSpecificGroupName = true;
		loadAppSpecific4ACA(myAInfo);
		type3SponsorLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Type 3 Sponsor License Number"];
		parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
		useAppSpecificGroupName = false;
		if(parentLicenseNbr != null){
		    var vParentLicNumArry = parentLicenseNbr.split("-");	
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric "+vParentLicNumeric);
			parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()

}
	}else if(!publicUser){
		useAppSpecificGroupName = true;
		var myAInfo = new Array();
		loadAppSpecificBefore(myAInfo);
		type3SponsorLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Type 3 Sponsor License Number"];
		logDebug("type3SponsorLicenseNumber:"+type3SponsorLicenseNumber);
		parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
		logDebug("parentLicenseNbr:"+parentLicenseNbr);
		if(parentLicenseNbr != null){
			var vParentLicNumArry = parentLicenseNbr.split("-");	
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric "+vParentLicNumeric);
			parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()
		logDebug("parentLicenseNbr is not null, capid is:"+parentLicenseCapId);
		useAppSpecificGroupName = false;
}
	}	
	if (type3SponsorLicenseNumber != null &&  type3SponsorLicenseNumber != "") {
		logDebug("type3SponsorLicenseNumber is not null ; is not blank");
		type3SponsorLicenseNumber = type3SponsorLicenseNumber.toString();
		if(type3SponsorLicenseNumber.indexOf("-") < 0){
			vchildLicNumeric = type3SponsorLicenseNumber;
			logDebug("vchildLicNumeric : "+vchildLicNumeric);
			type3SponsorLicenseNumber = type3SponsorLicenseNumber + "-" + "EM" + "-" + "3";			
		}
		var vchildLicNumArry = type3SponsorLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : "+vchildLicNumeric);
		var type3SponsorLicenseNumberCapID= aa.cap.getCapID(type3SponsorLicenseNumber).getOutput();
		logDebug("type3SponsorLicenseNumberCapID: "+type3SponsorLicenseNumberCapID);
		var type3SponsorCapType= aa.cap.getCap(type3SponsorLicenseNumberCapID).getOutput().getCapType().toString();
		logDebug("get cap "+aa.cap.getCap(type3SponsorLicenseNumberCapID).getOutput());
		logDebug("get cap "+aa.cap.getCap(type3SponsorLicenseNumberCapID).getOutput().getCapType());
		
		var licTypeArr = type3SponsorCapType.split("/");
		//Get license sub-type
		var licenseType = licTypeArr[2];
		logDebug("licenseType "+licenseType);
		var isValidLicense = false;
		//1)check licenseType is a "Type 3" and 
		//2)the license of the relationship being ended does not have to be in a status of Current.
		if(licenseType!=null && licenseType=="Type 3"){
			logDebug("vParentLicNumeric "+vParentLicNumeric+"vchildLicNumeric "+vchildLicNumeric);
			if(checkRefLpExistsOnLicense(vParentLicNumeric,"EM","A",vchildLicNumeric,"EM","3") ){
				logDebug("license is not current and link exist");
				isValidLicense =true;
			}
		}
		if(!isValidLicense){
			cancel = true;
			showMessage = true;
			comment("The Type 3 License number entered is not a valid license.");
		}
	}
	}catch(err){
		useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("ERROR:The Type 3 License number entered is not a valid license.");
	logDebug("error message catched inside CWM_ELP_DPL_520_ASB_validateType3LicenseLinkedToApprentice.message: "+err.message);

}
}// END OF FUNCTION: CWM_ELP_DPL_520_ASB_validateType3LicenseLinkedToApprentice                             
/*
 *If the user loads the amendment on ACA AND the status of the license is NOT Current
 *Then: Then display the message "The status of this license is not Current which prevents this amendment from being submitted.  Please contact the *Board with any questions."
 *AND
 *Do not allow the user to proceed with the amendment online
 *SCRIPTID#:525,673[both functionality is same] 
 *Added By : Debashish BArik (DT:2/2/2016)
 */
function CWM_ELP_525_ACA_DPL_checkLicenseStatusOnLoad(){

var isLicenseCurrent = true;
try{
	//Get parent license of amendment
	var vParentCapID = getParent();

	var myCap = aa.cap.getCap(vParentCapID).getOutput();
	var myCapStatus = myCap.getCapStatus();
	if(!myCapStatus || myCapStatus==null || myCapStatus!='Current'){
		isLicenseCurrent == false;
	}
     if(!isLicenseCurrent){
			cancel = true;
			showMessage = true;
			comment("The status of this license is not Current which prevents this amendment from being submitted.  Please contact the Board with any questions.");
	}	
 }catch(err){
	 cancel = true;
	 showMessage = true;
	 comment("ERROR.Please contact the Board with any questions.");
 }
}

//NPATEL
function CWM_ELP_526_WTUA_DPL_AddConditionforNeedApproval(){

		var v =  aa.licenseScript.getLicenseProf(capId).getOutput();;
		aa.print(v);
		for (var refLic in v) {
		  licSeq = v[refLic].getLicenseProfessionalModel().getLicSeqNbr();
		//aa.print(licSeq);

		var dueDt = addDate(sysDate,30);
		var dueDate = aa.date.getScriptDateTime(aa.util.parseDate(dueDt));
		//aa.print(dueDate);

					var arr = loadASITable("RELATIONSHIP APPROVAL",capId);
					var count =0;

					for (var i in arr){
					   count= count+1;
									firstRow = arr[i];
									columnA = firstRow["License Number"];
									columnB = firstRow["30 Day Warning"];
									
									 if(columnB == "CHECKED"){
									   
									   var addCAEResult = aa.caeCondition.addCAECondition(licSeq, "Notice", "Need Relationship", "Need Relationship with in 30 Days", null, null, "Notice", "Applied", sysDate, dueDate, sysDate, sysDate, systemUserObj, systemUserObj);
											if (addCAEResult.getSuccess()) {
												logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + "Notice"+ ") " + "Notice");
											} else {
												logDebug("**ERROR: adding licensed professional (" + licSeq + ") condition (" + "Notice"+ "): " + addCAEResult.getErrorMessage());
											}
									} 
					}


		}

}

/**
 *script#528 debashish.barik
 *1. Using the values in the "License Type" and "License Number" fields,  the appropriate license as a key indiidual to the Apprentice License.
 *1a. add the license to the licences tab
 *1b. From the key individual's license, copy the Licensed Individual's contact to the Apprentice's license and set the contact type as "Sponsor".  Set the "Start Date" of the contact as the value "Transaction Date" in the ASIT.
 **/
function CWM_ELP_528_DPL_addLicenseProfToParentLicenseRecordAmendment() {

	var vChangeType;
	var vLicenseType;
	var vTranscationDate;

	try {
		//capID : ammendment capId
		//capID : ammendment capId
		logDebug("capId:" + capId.getCustomID());
		var vParentLicense = AInfo["License Number"]; //getAppSpecific("License Number");

		var vAppStatusToSet = "";
		if (appMatch("License/Funeral Directors/Embalmer Apprentice/Amendment")) {
			vAppStatusToSet = AInfo["Set Apprentice Status to"];
			if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
				vParentLicense = vParentLicense + "-" + "EM" + "-" + "A";
				vParentLicense = vParentLicense.toString();
			}

		} else if (appMatch("License/Funeral Directors/Funeral Assistant/Amendment")) {
			vAppStatusToSet = AInfo["Set Assistant Status to"];
			if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
				vParentLicense = vParentLicense + "-" + "EM" + "-" + "FA";
				vParentLicense = vParentLicense.toString();
			}
		} else if (appMatch("License/Funeral Directors/Type 6/Amendment")) {
			vAppStatusToSet = AInfo["Set Assistant Status to"];
			if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
				vParentLicense = vParentLicense + "-" + "EM" + "-" + "6";
				vParentLicense = vParentLicense.toString();
			}
		} else if (appMatch("License/Funeral Directors/Type 3/Amendment")) {
			vAppStatusToSet = AInfo["Set Type 3 Status to"];
			if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
				vParentLicense = vParentLicense + "-" + "EM" + "-" + "3";
				vParentLicense = vParentLicense.toString();
			}
		} else if (appMatch("License/Funeral Directors/Funeral Establishment/Amendment")) {
			vAppStatusToSet = AInfo["Set Assistant Status to"];
			if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
				vParentLicense = vParentLicense + "-" + "FE" + "-" + "FE";
				vParentLicense = vParentLicense.toString();
			}
		}
		if (!vParentLicense) {
			vParentLicense = getParent(capId);
			vParentLicense = vParentLicense.getCustomID();

		}
		var vParentRecordCap = aa.cap.getCapID(vParentLicense).getOutput();
		//Set transaction status and license status:
		if (vAppStatusToSet != null && vAppStatusToSet != "") {
			//1.Set transaction license status
			CWM_ELP_DPL_528_WTUA_SetTransactionReferenceLicenseStatus(vParentRecordCap, vParentLicense, vAppStatusToSet);

		}
		//set the contact types
		var pFromContactType = lookup("lookup:Funeral_Amendment_FromContact", appTypeString);
		var pToContactType = lookup("lookup:Funeral_Amendment_ToContact", appTypeString);

		logDebug("vParentLicense :" + vParentLicense);
		var myTable = loadASITable("RELATIONSHIP APPROVAL", capId);

		// loading ENTITY name of Parent License JIRA 3633
		var cFromContactType = "Funeral Establishment";
		var addEntityName = "";
		
		for (xx in myTable) {
			vChangeType = myTable[xx]["Change Type"];
			vLicenseType = myTable[xx]["License Type"];
			vTranscationDate = myTable[xx]["Transaction Date"];
			var vChildLicenseTemp = myTable[xx]["License Number"];
			if (vChangeType == "Add") {
				if (vLicenseType == "Funeral Establishment") {
					if (vChildLicenseTemp != null && vChildLicenseTemp != "") {
						vChildLicenseTemp = vChildLicenseTemp.toString();
						if (vChildLicenseTemp.indexOf("-") == -1) {
							logDebug("creating alt id from the license number:" + vChildLicenseTemp);
							if (vLicenseType == "Funeral Establishment") {
								vChildLicenseTemp = vChildLicenseTemp + "-" + "FE" + "-" + "FE";
							}
						}
						logDebug("getting Entity name from record: " + vChildLicenseTemp + " Contact Type: " + cFromContactType);
						var vChildLicenseCap = aa.cap.getCapID(vChildLicenseTemp).getOutput();
						logDebug("vChildLicenseCap: " + vChildLicenseCap);
						addEntityName = getContactEntityName(vChildLicenseCap, cFromContactType);
						
					}

				}

			}

		}
		logDebug("addEntityName: " + addEntityName);

		for (x in myTable) {
			logDebug("myTable1 :" + myTable[x]["Change Type"]);
			logDebug("myTable2:" + myTable[x]["License Type"]);
			logDebug("myTable3 :" + myTable[x]["License Number"]);

			vChangeType = myTable[x]["Change Type"];
			vLicenseType = myTable[x]["License Type"];
			vTranscationDate = myTable[x]["Transaction Date"];
			var vChildLicense = myTable[x]["License Number"];
			var vThirtyDayWarning = myTable[x]["30 Day Warning"];
			vThirtyDayWarning = vThirtyDayWarning.toString();
			//14+""+

			if (vChildLicense != null && vChildLicense != "") {
				vChildLicense = vChildLicense.toString();
				if (vChildLicense.indexOf("-") == -1) {
					logDebug("creating alt id from the license number:" + vChildLicense);
					if (vLicenseType == "Funeral Establishment") {
						vChildLicense = vChildLicense + "-" + "FE" + "-" + "FE";
					} else if (vLicenseType == "Type 3 Funeral Director" || vLicenseType == "Type 3") {
						vChildLicense = vChildLicense + "-" + "EM" + "-" + "3";
					} else if (vLicenseType == "Type 6 Funeral Director" || vLicenseType == "Type 6") {
						vChildLicense = vChildLicense + "-" + "EM" + "-" + "6";
					} else if (vLicenseType == "Funeral Assistant") {
						vChildLicense = vChildLicense + "-" + "EM" + "-" + "FA";
					} else if (vLicenseType == "Embalming Apprentice" || vLicenseType == "Apprentice") {
						vChildLicense = vChildLicense + "-" + "EM" + "-" + "A";
					}
				}
			}
			//set the parent contact types
			if (vLicenseType == "Funeral Establishment") {
				var cFromContactType = "Funeral Establishment";
				var cToContactType = "Funeral Establishment";
				//added for defect JIRA3633
				var pFromContactType = "Licensed Individual";
				var pToContactType = "Embalmer apprentice";
			} else {
				if (appMatch("License/Funeral Directors/Embalmer Apprentice/Amendment")) {
					var pFromContactType = "Licensed Individual";
					var pToContactType = "Embalmer apprentice";
					var cFromContactType = "Licensed Individual";
					var cToContactType = "Sponsor";
				} else if (appMatch("License/Funeral Directors/Type 3/Amendment") || appMatch("License/Funeral Directors/Apprentice/Amendment")) {
					var pFromContactType = "Licensed Individual";
					var pToContactType = "Sponsor";
					var cFromContactType = "Licensed Individual";
					var cToContactType = vLicenseType;
				}

			}
			logDebug("cFromContactType" + cFromContactType);
			logDebug("cToContactType" + cToContactType);
			logDebug("pFromContactType" + pFromContactType);
			logDebug("pToContactType" + pToContactType);

			//Check ChangeType id "Add"
			if (vChangeType == "Add") {

				logDebug("vChildLicense Alt Id:" + vChildLicense);
				//NULL check for vParentLicense and vChildLicense
				if (vParentLicense != null && vChildLicense != null) {
					//logDebug("vChildLicense and vParentLicense are not null");
					var vChildRecordCap = aa.cap.getCapID(vChildLicense).getOutput();
					if (vParentRecordCap != null && vChildRecordCap != null) {
						//Copy Child Ref license Prof to the Parent License
						//logDebug("vParentRecordCap and vChildRecordCap are valid record");
						var vLicenseScriptModel = getRefLicenseProf(vChildLicense.toString());
						if (vLicenseScriptModel != null) {
							var fvAddResult = aa.licenseScript.associateLpWithCap(vParentRecordCap, vLicenseScriptModel);
							//logDebug("Result:" + fvAddResult.getSuccess());
							if (fvAddResult.getSuccess()) {

								logDebug("SUCCESS:License professional successfully added to " + vParentRecordCap);
							} else {
								logDebug("ERROR::License professional cannot be added :" + fvAddResult.getErrorMessage());
							}
						}
						//Now Copy Ref Parent License Prof to The child License
						var vParentLicenseScriptModel = getRefLicenseProf(vParentLicense.toString());
						if (vParentLicenseScriptModel != null) {
							var fvAddResult2 = aa.licenseScript.associateLpWithCap(vChildRecordCap, vParentLicenseScriptModel);
						//	logDebug("Result2:" + fvAddResult2.getSuccess());
							if (fvAddResult2.getSuccess()) {

								logDebug("SUCCESS:Parent License professional successfully added to child " + vChildRecordCap);
							} else {
								logDebug("ERROR::License professional cannot be added :" + fvAddResult2.getErrorMessage());
							}
						}

						//logDebug("Copy contact start :fromCapID:" + capId);
						/*copy the Licensed Individual's contact to the Apprentice's license and set the contact type as "Sponsor".
						 *Set the "Start Date" of the contact as the value "Transaction Date" in the ASIT.
						 */
						//Copy Child contacts to parent
						logDebug("copying " + cFromContactType + " from " + vChildLicense + " to " + vParentLicense + " as contact type " + cToContactType);
						copyContactsByTypeWithAddressandStartDate(vChildRecordCap, vParentRecordCap, cFromContactType, cToContactType, vTranscationDate, false);
						//Copy Parents contacts to the child./ and keep license type as pFromContactType
						logDebug("copying " + pFromContactType + " from " + vParentLicense + " to " + vChildLicense + " as contact type " + pToContactType);
						copyContactsByTypeWithAddressandStartDate(vParentRecordCap, vChildRecordCap, pFromContactType, pToContactType, vTranscationDate, false);
						//logDebug("Copy contact End");
						// if the 30 day warning checkbox was selected then add the condition "Needs Relationship" to the license  Set a due date //on the condition for 30 //days in the future.
						//Adingcondition to the child license
						logDebug("vThirtyDayWarning:" + vThirtyDayWarning);
						if (vThirtyDayWarning.equals("CHECKED")) {
							logDebug("ADding condition start");
							CWM_ELP_XXX_WTUA_DPL_AddConditionforNeedsRelationShip(vChildLicense);
							logDebug("ADding condition end");
						}
						// update for JIRA 3633 Start commented below code
						// getting entity name from Amendment record - Funeral Establishment Contact
						var vContactType = "Funeral Establishment";
						logDebug("getting Entity name from recor: " + vChildLicense + " Contact Type: " + vContactType);
						vChildLicenseCap = aa.cap.getCapID(vChildLicense).getOutput();
						logDebug("vChildLicenseCap: " + vChildLicenseCap);
						var updatedEntityName = getContactEntityName(vChildLicenseCap, vContactType);
						logDebug("updatedEntityName: " + updatedEntityName);
						if (updatedEntityName != null && updatedEntityName != "") {
							// Updating Ref License Professional- Rstate
							vParentLicenseCap = aa.cap.getCapID(vParentLicense).getOutput();
							var refLP = getRefLicenseProf(vParentLicenseCap.getCustomID());
							if (!refLP) {
								refLP = getRefLicenseProfWithLicNbrAndTypeClass(vParentLicenseCap.getCustomID());
							}
							if (refLP && refLP != null) {
								refLP.setBusinessName(updatedEntityName);
								var res = aa.licenseScript.editRefLicenseProf(refLP);
								if (res.getSuccess())
									logDebug("Ref LP Business Name updated." + updatedEntityName);
								else
									logDebug("Ref LP Business Name not updated. " + res.getErrorMessage());

							} else {
								logDebug("Ref LP not found.");
							}

							// Updating B3Contra Table

							updateBusinessNameOnB3contraTableForBusinessAmendment(vParentLicenseCap, updatedEntityName);
							// Add to sync set
							addToLicenseSyncSet(vParentRecordCap);
						}
						// update for JIRA 3633 END


					} else {
						logDebug("ERROR::can not proceed as either or both of vParentRecordCap and vChildRecordCap are null/empty");
						//logDebug("vParentRecordCap:"+vParentRecordCap ",vChildRecordCap:"+vChildRecordCap);
					}
				} else {
					logDebug("ERROR::can not proceed as either or both of vChildLicense and vParentLicense are null/empty");
					//logDebug("vChildLicense:"+vChildLicense +",vParentLicense:"+vParentLicense);
				}
			}
			//528-for remove
			else if (vChangeType == "Remove") {
				logDebug("Remove Functionality started!!");
				//logDebug("vChildLicenseR:" + vChildLicense);
				//logDebug("vParentLicenseR" + vParentLicense);
				//logDebug("vTranscationDate:" + vTranscationDate);
				var vRelDate = new Date(vTranscationDate);

				if (vChildLicense != null && vParentLicense != null) {
					/*
					 *Remove the approprite license from the licences tab on the Apprentice license record.
					 *
					 *From the Apprentice license, find the Sponsor contact type for the key individual and set the "End Date" of the contact as the
					 *value in the column "Transaction Date" in the ASIT
					 */

					CWM_ELP_DPL_528_WTUA_editContactsFromCapAndContactType(vParentLicense, vChildLicense, vRelDate);

					CWM_ELP_DPL_528_WTUA_editContactsFromCapAndContactType(vChildLicense, vParentLicense, vRelDate);
				} else {
					logDebug("ERROR::Something went wrong!!");
					logDebug("ERROR::vParentLicR value :" + vParentLicense);
					logDebug("ERROR::vChildLicR value :" + vChildLicense);
				}



				//3633 remove entity name from LP
			if (vLicenseType == "Funeral Establishment") {
				//logDebug("removing process start 3633");
				// Updating Ref License Professional- Rstate
				vParentLicenseCap = aa.cap.getCapID(vParentLicense).getOutput();
				var refLP = getRefLicenseProf(vParentLicenseCap.getCustomID());
				if (!refLP) {
					refLP = getRefLicenseProfWithLicNbrAndTypeClass(vParentLicenseCap.getCustomID());
				}
				if (refLP && refLP != null) {
					refLP.setBusinessName(addEntityName);
					var res = aa.licenseScript.editRefLicenseProf(refLP);
					if (res.getSuccess())
						logDebug("Ref LP Business Name updated." + addEntityName);
					else
						logDebug("Ref LP Business Name not updated. " + res.getErrorMessage());

				} else {
					logDebug("Ref LP not found.");
				}
				// Updating B3Contra Table

				updateBusinessNameOnB3contraTableForBusinessAmendment(vParentLicenseCap, addEntityName);
				// Add to sync set
				addToLicenseSyncSet(vParentRecordCap);
				
			}
				logDebug("Remove Functionality Ended!!");
			}

		}
		
	}
 //for end
	catch (err) {
	logDebug("ERROR::can not proceed ,something went wrong:" + err.message);
	}
}
function CWM_ELP_DPL_531_WTUB_validateFuneralApprenticeAmendment()
{
	var assiStatus = getAppSpecific("Set Apprentice Status to");
	logDebug("value of assiStatus "+assiStatus);
	if(assiStatus == undefined || assiStatus == null || assiStatus ==""){
		cancel = true;
		showMessage = true;				
		comment("The field 'Set Apprentice Status to' must have a value.");
		}
} // end of CWM_ELP_DPL_531_WTUB_validateFuneralApprenticeAmendment
//ADDED BY KPREETI ON 2/13/2016
function CWM_ELP_675_DPL_ASB_Check1RowFuneralAssistantAmendment()
{	
	loadASITablesBefore();
	var relationshipRow = 0;	
	var minRows = 1;
	try 
	{
		relationshipRow = RELATIONSHIPAPPROVAL.length;
		logDebug("Number of relationshipRow: "+relationshipRow);
	} 
	catch (ex) 
	{
			if (relationshipRow < minRows) 
			{
				cancel = true;
				showMessage = true;
				logDebug("There is no row in the RELATIONSHIP APPROVAL table");
				comment("You must add at least 1 row in License In RELATIONSHIP APPROVAL  ASIT.");
			}
		
	}

}

//added by kpreeti for script 679
function CWM_ELP_679_WTUB_DPL_removeConditionOfApprovalOfFuneralEstablishment(){
	try{
		var estNumber = getAppSpecific("Establishment Number");	
		logDebug("Establishment Number entered: "+estNumber);
			var altId = estNumber;			
			if (estNumber != null){
				estNumber = estNumber.toString();
				if(estNumber.indexOf("-") < 0){
					altId = estNumber +"-"+lookup("BOARDS", "Funeral Directors");
					var typeClass = "FE";
					if(typeClass != "null" && typeClass != "" && typeClass != null && typeClass != undefined && typeClass != "undefined" && typeClass != " "){
						altId = altId +"-"+ typeClass;
					}			
				}				
				var capModel = aa.cap.getCapID(altId).getOutput();
				var cType = "Application Checklist";
				var cName = "Establishment Status to be Changed Due to Transfer";
				removeCapCondition(cType,cName,capModel);
				//logDebug("success for remove cap  condition is  "+removeCapCondition.getSuccess());
			}				
	}catch(err){
		logDebug("Error catched inside CWM_ELP_679_WTUB_DPL_removeConditionOfApprovalOfFuneralEstablishment.Message: "+err.message);
	}
	
}
//END OF CWM_ELP_679_WTUB_DPL_removeConditionOfApprovalOfFuneralEstablishment


//adding Establishment condition on Funeral Establishment
function CWM_ELP_683_DPL_ASA_addEstablishmentStatusCondition()
{
	try {	
			var estNumber = getAppSpecific("Establishment Number");			
                         var altId = estNumber;
			if (estNumber != null){
				estNumber = estNumber.toString();				
				if(estNumber.indexOf("-") < 0){
					altId = estNumber +"-"+lookup("BOARDS", "Funeral Directors");
					var typeClass = "FE";
					if(typeClass != "null" && typeClass != "" && typeClass != null && typeClass != undefined && typeClass != "undefined" && typeClass != " "){
						altId = altId +"-"+ typeClass;
					}			
				}				
				var capModel = aa.cap.getCapID(altId).getOutput();
				addStdConditionOnCapIDModel("Application Checklist", "Establishment Status to be Changed Due to Transfer", capModel);
			}				
	}
	catch (err) {
		logDebug("A JavaScript Error occured: CWM_ELP_683_DPL_ASA_addEstablishmentStatusCondition");
	}
}// END OF FUNCTION: CWM_ELP_683_DPL_ASA_addEstablishmentStatusCondition

/*1. Validate that this is a Funeral Establishment license
@debashish.barik
@FUNERAL_DIRECTORS_FUNCTIONS
 */
function CWM_ELP_DPL_670_WTUB_validateFuneralEstablishmentLicense() {
	var isValidLicense = false;
	try {
		useAppSpecificGroupName = true;
		//Get AppSpecificInfo details
		//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
		var vFunAssistantNum = getAppSpecific("MY LICENSE.License Number", capId).toUpperCase();
		//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
		var fuEstLicenseNumber = getAppSpecific("END EXISTING RELATIONSHIP.Funeral Establishment License Number", capId).toUpperCase(); 
		var fuEstLicenseName = getAppSpecific("END EXISTING RELATIONSHIP.Funeral Establishment Name", capId);
		var fuEstLicenseDt = getAppSpecific("END EXISTING RELATIONSHIP.End Date of Relationship with Establishment", capId);

		//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
		var vAddfuEstLicenseNumber = getAppSpecific("ADD NEW RELATIONSHIP.Funeral Establishment License Number", capId).toUpperCase();
		var vAddfuEstLicenseName = getAppSpecific("ADD NEW RELATIONSHIP.Funeral Establishment Name", capId);
		var vAddfuEstLicenseDt = getAppSpecific("ADD NEW RELATIONSHIP.Start Date of Relationship with Establishment", capId);
		useAppSpecificGroupName = false;

		var vLicenseRecord = "";
		var vLicFARecord = "";
		logDebug("vFunAssistantNum:" + vFunAssistantNum);

		logDebug("fuEstLicenseNumber:" + fuEstLicenseNumber);
		logDebug("fuEstLicenseName:" + fuEstLicenseName);
		logDebug("fuEstLicenseDt:" + fuEstLicenseDt);

		logDebug("vAddfuEstLicenseNumber:" + vAddfuEstLicenseNumber);
		logDebug("vAddfuEstLicenseName:" + vAddfuEstLicenseName);
		logDebug("vAddfuEstLicenseDt:" + vAddfuEstLicenseDt);

		//1.ADD NEW RELATIONSHIP check start
		/*
		1. Validate that this is a current Funeral Establishment license.
		2.  If NOT, then message licensee/user:  "Funeral Establishment License entered is not Current, please contact the Board".
		 */
		if (validateMyObject(vAddfuEstLicenseNumber) || validateMyObject(vAddfuEstLicenseName) || validateMyObject(vAddfuEstLicenseDt)) {
			var falg1 = false;
			var vLicenseRecordAdd = "";

			//START FE
			var boardCode = lookup("BOARDS", "Funeral Establishment");
			var vFunEstLicType = lookup("lookup:LP to Type Class", "Funeral Establishment");
			//alt id fo
			if (vAddfuEstLicenseNumber.indexOf("-") < 0) {
				//get the valid reference license number.
				vLicenseRecordAdd = getLPAltId(vAddfuEstLicenseNumber, boardCode, vFunEstLicType);
			} else {
				//Need to verfy the alt id
				vAddfuEstLicenseNumber = String(vAddfuEstLicenseNumber);
				var vArrLic = vAddfuEstLicenseNumber.split("-");
				var v1Lic = vArrLic[0];
				var v2Board = vArrLic[1];
				var v3LicType = vArrLic[2];

				var vLicType1 = "";
				//Expecting board name as FE and License Type as FE respectively
				if ((v2Board == boardCode) && (v3LicType == vFunEstLicType)) {
					//get the valid reference license number.
					vLicenseRecordAdd = getLPAltId(v1Lic, v2Board, v3LicType);
				}
			}
			logDebug("vLicenseRecordAdd:" + vLicenseRecordAdd);
			if (vLicenseRecordAdd && vLicenseRecordAdd != null && vLicenseRecordAdd != "") {
				var fuEstLicenseNumberCapID = aa.cap.getCapID(vLicenseRecordAdd).getOutput();
				var vLicStatus = getMyLicenseStatus(fuEstLicenseNumberCapID);
				if (vLicStatus && vLicStatus == 'Current') {
					logDebug("Add FE is valid!!");
					falg1 = true;
				}
			}
			if (!falg1) {
				showMessage = true;
				cancel = true;
				comment("Funeral Establishment License entered is not Current, please contact the Board");
			}

		} else {
			logDebug("No need to validate for Add New RELATIONSHIP!!! as no fields populate");
		} //1.ADD NEW RELATIONSHIP check end

		//1.END EXISTING RELATIONSHIP check start
		//Check Fun Est is populated or not
		if (validateMyObject(fuEstLicenseNumber) || validateMyObject(fuEstLicenseName) || validateMyObject(fuEstLicenseDt)) {
			if (fuEstLicenseNumber) {
				fuEstLicenseNumber = fuEstLicenseNumber.toString();
				//START FE
				var boardCode = lookup("BOARDS", "Funeral Establishment");
				var vFunEstLicType = lookup("lookup:LP to Type Class", "Funeral Establishment");
				//alt id fo
				if (fuEstLicenseNumber.indexOf("-") < 0) {
					//get the valid reference license number.
					vLicenseRecord = getLPAltId(fuEstLicenseNumber, boardCode, vFunEstLicType);
				} else {
					//Need to verfy the alt id
					fuEstLicenseNumber = String(fuEstLicenseNumber);
					var vArrLic = fuEstLicenseNumber.split("-");
					var v1Lic = vArrLic[0];
					var v2Board = vArrLic[1];
					var v3LicType = vArrLic[2];

					var vLicType1 = "";
					//Expecting board name as FE and License Type as FE respectively
					if ((v2Board == boardCode) && (v3LicType == vFunEstLicType)) {
						//get the valid reference license number.
						vLicenseRecord = getLPAltId(v1Lic, v2Board, v3LicType);
					}
				}
				//END

				//STRT FA
				var boardCode2 = "EM"; //lookup("BOARDS", "Funeral Directors");
				var vFunAstLicType = lookup("lookup:LP to Type Class", "Funeral Assistant");
				//alt id fo
				if (vFunAssistantNum.indexOf("-") < 0) {
					//get the valid reference license number.
					vLicFARecord = getLPAltId(vFunAssistantNum, boardCode2, vFunAstLicType);
				} else {
					//Need to verfy the alt id
					vFunAssistantNum = String(vFunAssistantNum);
					var vArrLic = vFunAssistantNum.split("-");
					var v1Lic = vArrLic[0];
					var v2Board = vArrLic[1];
					var v3LicType = vArrLic[2];

					var vLicType1 = "";
					//Expecting board name as FE and License Type as FA respectively
					if ((v2Board == boardCode2) && (v3LicType == vFunAstLicType)) {
						//get the valid reference license number.
						vLicFARecord = getLPAltId(v1Lic, v2Board, v3LicType);
					}
				}
				//END FA
			}
			logDebug("vLicenseRecord:" + vLicenseRecord);
			logDebug("vLicFARecord:" + vLicFARecord);

			/*	1. Validate that this is a Funeral Establishment license that is linked to this Assistant license.
			1a. If the validation fails, then display the message "The Funeral Establishment License number entered is not a valid license."
			Note: the license of the relationship being ended does not have to be in a status of Current.
			 */
			if (vLicenseRecord && vLicenseRecord != null && vLicenseRecord != "") {
				if (vLicFARecord && vLicFARecord != null && vLicFARecord != "") {

					vLicFARecord = String(vLicFARecord);
					vLicenseRecord = String(vLicenseRecord);
					var facLicNum = vLicFARecord.split("-")[0];
					var facLicBC = vLicFARecord.split("-")[1];
					var facLicTC = vLicFARecord.split("-")[2];
					var refLicNum = vLicenseRecord.split("-")[0];
					var refLicBC = vLicenseRecord.split("-")[1];
					var refLicTC = vLicenseRecord.split("-")[2]
					var flag = checkRefLpExistsOnLicense(facLicNum, facLicBC, facLicTC, refLicNum, refLicBC, refLicTC);
					logDebug("flag:" + flag);
					if (flag) {
						logDebug("6.Valid License: ");
						isValidLicense = true;
					}
				}
			}
			if (!isValidLicense) {
				logDebug("7.Not Valid License: ");
				cancel = true;
				showMessage = true;
				comment("The Funeral Establishment License number entered is not a valid license.");// + vLicFARecord + "--flag:" + flag + "--vLicenseRecord:" + vLicenseRecord + "--refLicNum:" + refLicNum + "--refLicBC:" +refLicBC + "--refLicTC:" + refLicTC);
			}
		} else {
			logDebug("No need to validate for End existing!!! as no fields populate");
		}
	} catch (err) {
		logDebug("ERROR:The Funeral Establishment License number entered is not a valid license.:" + err.message);
	}
}


function CWM_ELP_685_DPL_EXP_CheckMainOfficeEstablishmentNumber(){
				   if (appMatch("License/Funeral Directors/Funeral Establishment/Application")){
				
				//var myAInfo = new Array();
                //loadAppSpecificBefore(myAInfo);
                var FELicenseNumber = AInfo["Main Office Establishment Number"];
				
				//var FELicenseNumber = getAppSpecific("Main Office Establishment Number",capId);
					
				if(FELicenseNumber && FELicenseNumber != ""){
					try{
						//debashish.barik RTC#13893 start
						FELicenseNumber = String(FELicenseNumber);
						var vLicenseActive = isLicenseActive(FELicenseNumber, "FE", "FE");
						var vRef = getRefLicenseProf(FELicenseNumber,"FE","FE");
						if(vRef && vRef!=null)
							//var cpLic = aa.cap.getCapID(FELicenseNumber).getOutput();
							//var capLic = aa.cap.getCap(cpLic).getOutput();
							var myLicenseStatus = vRef.getPolicy();

							if( (!vLicenseActive) || (myLicenseStatus != "Current")){
									cancel = true;
									showMessage = true;
									comment("The Main Office Establishment Number is either not a valid number or not current.");
							}	
							//debashish.barik RTC#13893 end
					}catch(err){
									cancel = true;
									showMessage = true;
									comment("The Main Office Establishment Number is either not a valid number or not current.:"+err.message);
					}
				}
		}
}

function CWM_ELP_689_ASB_Type6LicenseValidation() {
	var feLicNumRemove;
	var feLicNumAdd;

	if (appMatch("License/Funeral Directors/Embalmer Apprentice/Amendment") || appMatch("License/Funeral Directors/Establishment/Amendment") || appMatch("License/Funeral Directors/Type 6/Amendment")) {
		for (loopk in AppSpecificInfoModels) {
			var appSpecificObj = AppSpecificInfoModels[loopk];
			if (appSpecificObj.getCheckboxType() == "END EXISTING RELATIONSHIP") {
				if (appSpecificObj.checkboxDesc == "Funeral Establishment License Number") {
					feLicNumRemove = appSpecificObj.checklistComment;
				}
			}
			if (appSpecificObj.getCheckboxType() == "ADD NEW RELATIONSHIP") {
				if (appSpecificObj.checkboxDesc == "Funeral Establishment License Number") {
					feLicNumAdd = appSpecificObj.checklistComment;
					break;
				}
			}
		}
	}
	if ((feLicNumRemove != null) && (feLicNumRemove != "")) {
		logDebug("feLicNumRemove: " + feLicNumRemove);
		feLicNumRemove = feLicNumRemove.toString();
		var alt_idRemove = "";
		if(feLicNumRemove.indexOf("-")==-1){//201-FE-FE
			alt_idRemove = feLicNumRemove + "-FE-FE";
		}else{
			alt_idRemove = feLicNumRemove;
		}
		var altRem = aa.cap.getCapID(alt_idRemove).getOutput();
		if (!altRem) {
			cancel = true;
			showMessage = true;
			comment("The Funeral Establishment License number entered is not a valid license.");
		} else {
			var licProfObjRemove = getRefLicenseProf(altRem.getCustomID());
			if (!licProfObjRemove) {
				cancel = true;
				showMessage = true;
				comment("The Funeral Establishment License number entered is not a valid license.");
			}
		}
	}
	if ((feLicNumAdd != null) && (feLicNumAdd != "")) {
		logDebug("feLicNumAdd: " + feLicNumAdd);
		feLicNumAdd = feLicNumAdd.toString();
		var alt_idAdd = "";
		if(feLicNumAdd.indexOf("-")==-1){//201-FE-FE
			alt_idAdd = feLicNumAdd + "-FE-FE";
		}else{
			alt_idAdd = feLicNumAdd;
		}
		
		//var alt_idAdd = feLicNumAdd + "-FE-FE";
		
		var altAdd = aa.cap.getCapID(alt_idAdd).getOutput();
		if (!altAdd) {
			cancel = true;
			showMessage = true;
			comment("The Funeral Establishment License number entered is not a valid license.");
		} else {
			var licProfObjAdd = getRefLicenseProf(altAdd.getCustomID());
			if (!licProfObjAdd) {
				cancel = true;
				showMessage = true;
				comment("The Funeral Establishment License number entered is not a valid license.");
			} else {
				if (licProfObjAdd.getPolicy() != "Current") {
					showMessage = true;
					cancel = true;
					message = "";
					comment("The License " + alt_idAdd + " is not Current, please contact the Board.");
				}
			}
		}
	}
}
function CWM_ELP_Defect10391_WTUB_DPL_Type6RowReq() //Defect 10391 added by Prateek 
{
		var add = loadASITable("RELATIONSHIP APPROVAL", capId);
		
		
	try {
			logDebug("Number of rows in Relationship-Approval table: " +add.length);			
			if((!add)||(add.length<1)){
		        logDebug("No Row or table not found");
                cancel = true;
                showMessage = true;
				comment("<font color='red'><b>At least one row must exist in the Relationship Approval ASIT.</b></font>")
				comment("At least one row must exist in the Relationship Approval ASIT.");
			}
	} catch (err) {
		
		if((!add)||(add.length<1)){
		        logDebug("No Row or table not found");
				cancel = true;
                showMessage = true;
                comment("At least one row must exist in the Relationship Approval ASIT.");

		}
		else{
			logDebug("An error has occurred in CWM_ELP_Defect10391_WTUB_DPL_Type6RowReq.");
			comment(err.message);
		}
	}
}




function CWM_ELP_693_ASB_DPL_Type6RowReq() {
		var minRows = 1;
		var relRows = 0;
		loadASITablesBefore();
	try {
		relRows = RELATIONSHIPAPPROVAL.length
	} catch (err) {
		cancel = true;
		showMessage = true;
		if(relRows < minRows){
			comment("At least one row must exist in the Relationship Approval ASIT.");
		}
		else{
			logDebug("An error has occurred in CWM_ELP_693_ASB_DPL_Type6RowReq.");
			comment(err.message);
		}
	}
}
function CWM_ELP_692_DPL_WTUB_updateLicFromAmendment() {
	var fromContactType = "Licensed Individual";
	var toContactType = "Funeral Establishment";
	var vChangeType;
	var vLicenseType;
	var vTranscationDate;
	var vChildLicense;
	var childAlt;
	var vBoard = "FE";
	try {
		logDebug("capId:" + capId);
		var vParentLicense = AInfo["License Number"]; //getAppSpecific("License Number");
		var parentCapType;
		var myTable = loadASITable("RELATIONSHIP APPROVAL", capId);
		var vParentRecordCap = getParent();
		var parentCap = aa.cap.getCap(vParentRecordCap).getOutput();
		var parentCapType = (parentCap.getCapType().toString()).split("/");;
		var vChildRecordCap;
		logDebug("vParentRecordCap:" + vParentRecordCap);

		for (x in myTable) {
			logDebug("Change Type :" + myTable[x]["Change Type"]);
			logDebug("License Type:" + myTable[x]["License Type"]);
			logDebug("License Number:" + myTable[x]["License Number"]);
			logDebug("Transaction Date:" + myTable[x]["Transaction Date"]);

			vChangeType = myTable[x]["Change Type"];
			vLicenseType = myTable[x]["License Type"];
			vTranscationDate = myTable[x]["Transaction Date"];
			vChildLicense = myTable[x]["License Number"];
			childAlt = returnCompleteAltId(vChildLicense, vBoard, vLicenseType);
			vChildRecordCap = aa.cap.getCapID(childAlt).getOutput();

			if ((vParentRecordCap != null)&&(vChildRecordCap != null)) {
				logDebug("vParentRecordCap and vChildRecordCap are valid record");
				var vLicenseScriptModel = getRefLicenseProf(vChildRecordCap.getCustomID());
				var parentLP = getRefLicenseProf(vParentRecordCap.getCustomID());
				if (vLicenseScriptModel != null) {
					if (vChangeType == "Add") {
						var fvAddResult = aa.licenseScript.associateLpWithCap(vParentRecordCap, vLicenseScriptModel);
						var fvAddResult2 = aa.licenseScript.associateLpWithCap(vChildRecordCap, parentLP);
						logDebug("Association result1:" + fvAddResult.getSuccess());
						logDebug("Association result2:" + fvAddResult2.getSuccess());
						copyContactsByCapContactType(vChildRecordCap, vParentRecordCap, "Business", toContactType, vTranscationDate);
						copyContactsByCapContactType(vParentRecordCap, vChildRecordCap, fromContactType, parentCapType[2], vTranscationDate);
					} else if (vChangeType == "Remove") {
						removeAssociatedLP(vChildLicense, vParentRecordCap);
						var contact = getContactByTypeXXX("Funeral Establishment", vParentRecordCap);
						var vEndDate = new Date(vTranscationDate);
						contact.setEndDate(vEndDate);
						aa.people.editCapContact(contact);
						//2nd removal
						removeAssociatedLP(vParentLicense, vChildRecordCap);
						var contact2 = getContactByTypeXXX(parentCapType[2], vChildRecordCap);
						var vEndDate2 = new Date(vTranscationDate);
						contact2.setEndDate(vEndDate2);
						aa.people.editCapContact(contact2);
					}
					setType6Status(vParentRecordCap,parentLP);
				}
			} else {
cancel = true;				
logDebug("Can not proceed with a null/empty parent cap ID");
			}

		} //for end
	} catch (err) {
		logDebug("An error occurred in " + err.message);
		//for testing
		cancel = true;
	}
}
function CWM_ELP_694_DPL_WTUB_updateLicFromAmendment() {
	try {
		var ignoreArr = new Array();
        var vParentRecordCap = getParent();
		var add = loadASITable("ADD NEW RELATIONSHIP", capId);
		var end = loadASITable("END EXISTING RELATIONSHIP", capId);
		
		ignoreArr.push("END EXISTING RELATIONSHIP");
		ignoreArr.push("ADD NEW RELATIONSHIP");
		copyASITables(capId, vParentRecordCap, ignoreArr);
		if((add)&&(add.length>0)){
			addRelationship();
		}
		if((end)&&(end.length>0)){
			endRelationship();
		}
		
	} //for end
	catch (err) {
		logDebug("An error occurred in " + err.message);
		//for testing
		cancel = true;
	}
}
function CWM_ELP_696_DPL_ASA_CalculatePercentage() {
	try{
	var totalShares = getAppSpecific("Total Number of Shares Issued",capId);
	var tname = "OWNERSHIP INFORMATION";
	var ownership = loadASITable(tname,capId);
	var percentOwn;
	var numShares;
	if (totalShares != null && totalShares > 0) {

		for (var i = 0; i < ownership.length; i++) {
			row = ownership[i];
			if (row["Number of Shares"] != "") {
				numShares = row["Number of Shares"];
					percentOwn = aa.util.round(numShares / totalShares, 2)*100; 
				editASITableRow(ownership, capId, tname, "Percentage", percentOwn.toString(),i);
			}
		}
	}
	}
	catch(err){
		logDebug("An error has occured in CWM_ELP_696_DPL_ASA_CalculatePercentage.");
		logDebug(err.message);
	}
}

/*1. Validate that this is a current Funeral Establishment license.
 *2.  If NOT, then message licensee/user:  "Funeral Establishment License entered is not Current, please contact the Board".
 *Added by Ankush
 * updated by debashish.barik,RTC#13166
 *
 *FUNERAL_DIRECTORS_FUNCTIONS
 */
function CWM_ELP_DPL_522_ASB_validateFuneralEstablishmentInAddNewRelationshipASI() {
	try {
		//Get AppSpecificInfo details
		//var funeralEstLicenseNumber = getAppSpecific("ADD NEW RELATIONSHIP.Funeral Establishment License Number", capId);
		var funeralEstLicenseNumber = null;
		if (publicUser) // HANDLE ACA PAGEFLOW
		{
			/*var cap = aa.env.getValue('CapModel');
			var currentCapId = cap.getCapID();*/
			useAppSpecificGroupName = true;
			loadAppSpecific4ACA(AInfo);
			funeralEstLicenseNumber = AInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			useAppSpecificGroupName = false;		
                         } 
                        else if (!publicUser) {
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			funeralEstLicenseNumber = myAInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			useAppSpecificGroupName = false;
		}
		if (funeralEstLicenseNumber != null && funeralEstLicenseNumber != "") {
			//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString().toUpperCase();
			var isValidLicense = false;
			//1)check licenseType is current and "Funeral Establishment" license
			var vFeLic = getRefLicenseProf(funeralEstLicenseNumber, "FE", "FE");
			var isActive = isLicenseActive(funeralEstLicenseNumber, "FE", "FE");
			if (isActive && vFeLic && (vFeLic.getPolicy() == "Current")) {
				isValidLicense = true;
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("Funeral Establishment License entered is not Current, please contact the Board.");
			}
		}
	} catch (err) {
		useAppSpecificGroupName = false;
		logDebug("ERROR:Funeral Establishment License entered is not Current, please contact the Board.");
	}
} // END OF FUNCTION: CWM_ELP_DPL_522_ASB_validateFuneralEstablishmentInAddNewRelationshipASI

//added by Ankush
function CWM_ELP_DPL_520_ASB_validateFuneralEstablishmentLicenseLinkedToApprentice(){
	try{
		//Get AppSpecificInfo details
		//useAppSpecificGroupName = true;
		//var funeralEstLicenseNumber = getAppSpecific("END EXISTING RELATIONSHIP.Funeral Establishment License Number",capId);	
		//useAppSpecificGroupName = false;
		var funeralEstLicenseNumber = null;
		var parentLicenseCapId = null;
		var parentLicenseNbr = null;
		var vchildLicNumeric = "";
		var vParentLicNumeric = "";
		if (publicUser) // HANDLE ACA PAGEFLOW
		{			
			var myAInfo = new Array();
			useAppSpecificGroupName = true;
			loadAppSpecific4ACA(myAInfo);
			funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			useAppSpecificGroupName = false;
			if(parentLicenseNbr != null){
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput();
				var vParentLicNumArry = parentLicenseNbr.split("-");	
				vParentLicNumeric = vParentLicNumArry[0];
				logDebug("vParentLicNumeric "+vParentLicNumeric);
			}
		}else if(!publicUser){
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			if(parentLicenseNbr != null)
			var vParentLicNumArry = parentLicenseNbr.split("-");	
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric "+vParentLicNumeric);
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()
			useAppSpecificGroupName = false;
		}
		if (funeralEstLicenseNumber != null &&  funeralEstLicenseNumber != "") {
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString();
			if(funeralEstLicenseNumber.indexOf("-") < 0){
				vchildLicNumeric = funeralEstLicenseNumber;
				funeralEstLicenseNumber = funeralEstLicenseNumber + "-" + "FE" + "-" + "FE";			
			}
			var vchildLicNumArry = funeralEstLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : "+vchildLicNumeric);
			var funeralEstLicenseNumberCapID= aa.cap.getCapID(funeralEstLicenseNumber).getOutput();
			var funeralEstCapType= aa.cap.getCap(funeralEstLicenseNumberCapID).getOutput().getCapType().toString();
			var licTypeArr = funeralEstCapType.split("/");
			//Get license sub-type
			var licenseType = licTypeArr[2];
			var isValidLicense = false;
			//1)check licenseType is a "Type 3" and 
			//2)the license of the relationship being ended does not have to be in a status of Current.
			if(licenseType!=null && licenseType=="Funeral Establishment"){
				logDebug("inside if");
				if(checkRefLpExistsOnLicense(vParentLicNumeric,"EM","A",vchildLicNumeric,"FE","FE")){
					logDebug("FEN");
					isValidLicense =true;
				}
			}
			if(!isValidLicense){
				cancel = true;
				showMessage = true;
				comment("The Funeral Establishment License number entered is not a valid license.");
			}
		}
	}catch(err){
		//useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("ERROR:The Funeral Establishment License number entered is not a valid license.");
	}
}// END OF FUNCTION: CWM_ELP_DPL_520_ASB_validateFuneralEstablishmentLicenseLinkedToApprentice          
//added by preeti FOR SCRIPT#1603
function CWM_ELP_1603_DPL_ASB_Check1RowFuneralEstablishment()

{
	if(!publicUser){
	loadASITablesBefore();
	}else if(publicUser){
	loadASITables4ACA_Custom();
	}
	var ownershipRow = 0;	
	var minRows = 1;
	try 
	{
		ownershipRow = OWNERSHIPINFORMATION.length;
		logDebug("Number of ownershipRow: "+ownershipRow);
	} 
	catch (ex) 
	{
			if (ownershipRow < minRows) 
			{
				cancel = true;
				showMessage = true;
				logDebug("There is no row in the ownership information table");
				comment("You must add at least 1 row in License In OWNERSHIP INFORMATION ASIT.");
				comment("Error msg from env: "+ex.message);
			}
		
	}	
}
//added by kpreeti on 2/23/2016
function CWM_ELP_679_DPL_noLongerLicensed() {
try 
{
	var formerFuneralASILicNo = getAppSpecific("Establishment Number")
	if(formerFuneralASILicNo){
	logDebug("formerFuneralASILicNo "+formerFuneralASILicNo);
	// Get contacts associated with the capid
    var capContactResult = aa.people.getCapContactByCapID(capId);
	logDebug("capContactResult "+capContactResult);
	if(capContactResult.getSuccess())
	{
		capContactResult=capContactResult.getOutput();
		logDebug("capContactResult "+capContactResult);
		for(yy in capContactResult)
		{
			 thisCapContact = capContactResult[yy];
			 thisPeople = thisCapContact.getPeople();

			 // If the given contact is not "Applicant", continue
			 if (thisPeople.contactType != "Business")
			  continue;

			// For "Business", get  getCapContactModel
			capContactModel = thisCapContact.getCapContactModel();

			// Extract contact ref number
			var vRefNumber = capContactModel.refContactNumber;

			//Function call to get all licenses associated with Ref Contact number
			var allLicenses = getLicensesByRefContactforUpgrade(vRefNumber, "Funeral Directors", "Funeral Establishment");
			if (allLicenses)
			{
				logDebug("allLicenses length "+allLicenses.length);
				for (index =0;index < allLicenses.length;index++)
				{	
				var upgradeLP = getRefLicenseProf(formerFuneralASILicNo,"FE","FE");
				if (upgradeLP) 
				{
					var refLPLicNum = upgradeLP.stateLicense + "-"+upgradeLP.comment+"-" + upgradeLP.businessLicense;		
					var transLicNum = allLicenses[index]
					if(refLPLicNum == transLicNum)
					{					
						var associatedCapId = aa.cap.getCapID(allLicenses[index]).getOutput();
						
						

						//Update the status of transactional license to 'No Longer Licensed'
						updateAppStatus("No Longer Licensed", "Automatic update through script", associatedCapId);
						
						//update ref license professional
						upgradeLP.setWcExempt("N");
						upgradeLP.setPolicy("No Longer Licensed");						
						myResult = aa.licenseScript.editRefLicenseProf(upgradeLP);
						
						if (myResult.getSuccess()) {
							logDebug("Successful");
							closeLicWorkflowCust("No Longer Licensed","Review relationships to this License and determine what actions need to be taken regarding those related licensees.",associatedCapId);
                                                         assignedToByShortNotes("Issuance", getBoard(associatedCapId)); // board is FE

						}		
					}
			}
		}
	}
	}
}
	}
}
catch(error)
{
   showMessage=true;
   comment("Error on CWM_ELP_679_DPL_noLongerLicensed:" + error, "Please contact administrator");
	}
}// end of CWM_ELP_679_DPL_noLongerLicensed



//Ankush
function CWM_ELP_DPL_234_WTUB_ValidateSponsorLicenseNumber(isAsbOrAsiUpdate) {
	try {
		if (isAsbOrAsiUpdate) {
			//var myAInfo = new Array();
			//loadAppSpecificBefore(myAInfo);
			var vSponsorLicNbr = AInfo["Sponsor License Number"];
			logDebug("##vSponsorLicNbr1:: " + vSponsorLicNbr);
		} else {
			var vSponsorLicNbr = getAppSpecific("Sponsor License Number", capId);
		}
		var vSponsorLicBoardCode = "EM";
		var vSponsorLicTypeCode = "3";		
		var vEstablismentLicBoardCode = "FE";
		var vEstablismentLicTypeCode = "FE";
		var flag = 1;
		var vCheckLP = true;
		if (vSponsorLicNbr && vSponsorLicNbr != null &&  vSponsorLicNbr != "") {
			var vLicenseActive = isLicenseActive(vSponsorLicNbr, vSponsorLicBoardCode, vSponsorLicTypeCode);
			/*vSponsorLicNbr = vSponsorLicNbr.toString();
			if(vSponsorLicNbr.indexOf("-") < 0){
				vSponsorLicNbr = vSponsorLicNbr + "-" + "EM" + "-" + "3";
			}*/
			var vLicenseNum = vSponsorLicNbr.toString();
			if(vLicenseNum.indexOf("-") < 0){
				vLicenseNum = vLicenseNum + "-"+vSponsorLicBoardCode+"-"+vSponsorLicTypeCode;
			}
			var vLicenseNumCapId = aa.cap.getCapID(vLicenseNum);
			if(vLicenseNumCapId!=null && vLicenseNumCapId.getSuccess()){
				vLicenseNumCapId = vLicenseNumCapId.getOutput();
				//check it is actually a sponsor license i,e xxx-EM-3, debashish.bariksss
				var vCap = aa.cap.getCap(vLicenseNumCapId).getOutput();
				var fvCapType = vCap.getCapType();
                    if (fvCapType == "License/Funeral Directors/Type 3/License") {
				var vLicStatus = getMyLicenseStatus(vLicenseNumCapId);
				if(!vLicenseActive && !matches(vLicStatus, "Current")){
					flag = 0;
					logDebug("test");
				}
                     }else{
					logDebug("not a type 3 license");
					flag = 0;
                     }
			}else{
				flag = 0;
			}
			//var vSponsorLicNbrCapID = aa.cap.getCapID(vSponsorLicNbr).getOutput();
			if(flag == 1){
				if (isAsbOrAsiUpdate) {
					//var myAInfoNew = new Array();
					//loadAppSpecificBefore(myAInfoNew);
					var vEstablismentLicNbr = AInfo["Funeral Establishment License Number"];
					logDebug("##vEstablismentLicNbr:: " + vEstablismentLicNbr);
				} else {
					var vEstablismentLicNbr = getAppSpecific("Funeral Establishment License Number", capId);
				}
				logDebug("testvEstablismentLicNbr:: "+vEstablismentLicNbr);
				if (vEstablismentLicNbr  && vEstablismentLicNbr != null &&  vEstablismentLicNbr != "") {
					/*vEstablismentLicNbr = vEstablismentLicNbr.toString();
					if(vEstablismentLicNbr.indexOf("-") < 0){
						vEstablismentLicNbr = vEstablismentLicNbr + "-" + "FE" + "-" + "FE";			
					}*/
					//var vEstablismentLicNbrCapID= aa.cap.getCapID(vEstablismentLicNbr).getOutput();
					//sponsorRefLic = isAssociatedLicense(vEstablismentLicNbrCapID, vSponsorLicNbr);
					vCheckLP = checkRefLpExistsOnLicense(vEstablismentLicNbr,vEstablismentLicBoardCode,vEstablismentLicTypeCode,vSponsorLicNbr, vSponsorLicBoardCode, vSponsorLicTypeCode);
					logDebug("##vCheckLP:: "+vCheckLP);
                                   if (!vCheckLP) {
					cancel = true;
					showMessage = true;
					//logDebug("Failed Validation : Sponsor is not associated with the Funeral Establishment.");
					comment("Sponsor is not associated with the Funeral Establishment.");
                                        // comment("Funeral Establishment is not a valid or Current Establishment licensee");
				} 
				
                          }		
							}
			else {
				cancel = true;
				showMessage = true;
				//logDebug("Failed Validation : Sponsor is not a valid or Current Type 3 licensee.");
				comment("Sponsor is not a valid or Current Type 3 licensee.");				
			}
		} 
	} catch(err) {
		logDebug("Error on ASB function CWM_ELP_DPL_234_WTUB_ValidateSponsorLicenseNumber, Please contact administrator : "+ err.message);
	}
}// END OF FUNCTION: CWM_ELP_DPL_234_WTUB_ValidateSponsorLicenseNumber() 
//Ankush
function CWM_ELP_DPL_234_WTUB_ValidateFuneralEstLicenseNumber(isAsbOrAsiUpdate) {
	try {
		if (isAsbOrAsiUpdate) {
			//var myAInfoNew = new Array();
			//loadAppSpecificBefore(myAInfoNew);
			var vEstablismentLicNbr = AInfo["Funeral Establishment License Number"];
			logDebug("##vEstablismentLicNbr2:: " + vEstablismentLicNbr);
		} else {
			var vEstablismentLicNbr = getAppSpecific("Funeral Establishment License Number", capId);
		}
		//var vEstablismentLicNbr = getAppSpecific("Funeral Establishment License Number", capId);			
		var vEstablismentLicBoardCode = "FE";
		var vEstablismentLicTypeCode = "FE";
		var flag = 1;
		if (vEstablismentLicNbr  && vEstablismentLicNbr != null &&  vEstablismentLicNbr != "") {
			var vLicenseActive = isLicenseActive(vEstablismentLicNbr, vEstablismentLicBoardCode, vEstablismentLicTypeCode);			
			var vLicenseNum = vEstablismentLicNbr.toString();
			if(vLicenseNum.indexOf("-") < 0){
				vLicenseNum = vLicenseNum + "-"+vEstablismentLicBoardCode+"-"+vEstablismentLicTypeCode;
			}
			var vLicenseNumCapId = aa.cap.getCapID(vLicenseNum);
			if(vLicenseNumCapId!=null && vLicenseNumCapId.getSuccess()){
				vLicenseNumCapId = vLicenseNumCapId.getOutput();

			   //check it is actually a sponsor license i,e xxx-FE-FE, debashish.barik
				var vCap = aa.cap.getCap(vLicenseNumCapId).getOutput();
				var fvCapType = vCap.getCapType();
				if (fvCapType == "License/Funeral Directors/Funeral Establishment/License") {
					var vLicStatus = getMyLicenseStatus(vLicenseNumCapId);
					if (!vLicenseActive && !matches(vLicStatus, "Current")) {
						flag = 0;
					}
				} else {
					logDebug("not a FE license");
					flag = 0;
				}

			}else{
				flag = 0;
			}
			if(flag == 0) {
				cancel = true;
				showMessage = true;
				//logDebug("Failed Validation : Funeral Establishment is not a valid or Current Establishment licensee.");
				comment("Funeral Establishment is not a valid or Current Establishment licensee.");				
			}
		}
	} catch(err) {
		logDebug("Error on ASB function CWM_ELP_DPL_234_WTUB_ValidateFuneralEstLicenseNumber, Please contact administrator"+ err.message);
	}
}// END OF FUNCTION: CWM_ELP_DPL_234_WTUB_ValidateFuneralEstLicenseNumber() 

//Ankush
function CWM_ELP_DPL_234_WTUA_copyLPAndContact(vCapId, vNewLicId) {
	try {
		var vSponsorLicNum = getAppSpecific("Sponsor License Number"); 
		var vEstablismentLicNbr = getAppSpecific("Funeral Establishment License Number");
		var vLicenseScriptModel = null;
		var vEstLicenseScriptModel = null;
		if(vSponsorLicNum != null && vSponsorLicNum != ""){
            var vLicenseNum = vSponsorLicNum.toString();
			if(vLicenseNum.indexOf("-") < 0){
				vLicenseNum = vLicenseNum + "-" + "EM" + "-" + "3";
			}
			vLicenseScriptModel = getRefLicenseProf(vLicenseNum.toString());		
			var vSponsorLicNumCap = aa.cap.getCapID(vLicenseNum);
			if(vSponsorLicNumCap != null && vSponsorLicNumCap.getSuccess())
				vSponsorLicNumCap = vSponsorLicNumCap.getOutput();
			var vSponsorLicNum2Cap = vNewLicId;
			/* copyContactsByCapContactType(vSponsorLicNumCap, vSponsorLicNum2Cap, "Licensed Individual","Sponsor", null);
			copyContactsByCapContactType(vSponsorLicNumCap, null, "Licensed Individual","Sponsor", null); */
			copyContactsByCapContactTypeWithASI(vSponsorLicNumCap, vSponsorLicNum2Cap, "Licensed Individual","Sponsor", null, vSponsorLicNum);
			copyContactsByCapContactTypeWithASI(vSponsorLicNumCap, null, "Licensed Individual","Sponsor", null, vSponsorLicNum);
			if(vLicenseScriptModel!=null){
				var fvAddResult = aa.licenseScript.associateLpWithCap(vSponsorLicNum2Cap, vLicenseScriptModel);
					logDebug("fvAddResult:: "+fvAddResult.getSuccess());			 
				if(fvAddResult.getSuccess()){
					logDebug("SUCCESS:License professional successfully added to "+vSponsorLicNum2Cap);
				}else{
					logDebug("FAILED:License professional cannot be added :"+fvAddResult.getErrorMessage());
				}
				
                // JIRA 3811 : Check if License is associated with Application record or not. If exist do not associate it again.
                if (!isAssociateToLP(vCapId, vLicenseNum))
                {
                    aa.licenseScript.associateLpWithCap(vCapId, vLicenseScriptModel);
                }
			}
		}
		if(vEstablismentLicNbr != null && vEstablismentLicNbr != ""){
            var vEstLicenseNum = vEstablismentLicNbr.toString();
			if(vEstLicenseNum.indexOf("-") < 0){
				vEstLicenseNum = vEstLicenseNum + "-" + "FE" + "-" + "FE";
			}
			vEstLicenseScriptModel = getRefLicenseProf(vEstLicenseNum.toString());		
			var vEstLicNumCap = aa.cap.getCapID(vEstLicenseNum);
			if(vEstLicNumCap != null && vEstLicNumCap.getSuccess())
				vEstLicNumCap = vEstLicNumCap.getOutput();
			var vEstLicNum2Cap = vNewLicId;
			/* copyContactsByCapContactType(vEstLicNumCap, vEstLicNum2Cap, "Business","Funeral Establishment", null);
			copyContactsByCapContactType(vEstLicNumCap, null, "Business","Funeral Establishment", null); */
			copyContactsByCapContactTypeWithASI(vEstLicNumCap, vEstLicNum2Cap, "Business","Funeral Establishment", null, vEstablismentLicNbr);
			copyContactsByCapContactTypeWithASI(vEstLicNumCap, null, "Business","Funeral Establishment", null, vEstablismentLicNbr);
			if(vEstLicenseScriptModel!=null){
				var fvAddResult = aa.licenseScript.associateLpWithCap(vEstLicNum2Cap, vEstLicenseScriptModel);
					logDebug("fvAddResult:: "+fvAddResult.getSuccess());			 
				if(fvAddResult.getSuccess()){
					logDebug("SUCCESS:License professional successfully added to "+vEstLicNum2Cap);
				}else{
					logDebug("FAILED:License professional cannot be added :"+fvAddResult.getErrorMessage());
				}
				
                // JIRA 3811 : Check if License is associated with Application record or not. If exist do not associate it again.
                 if (!isAssociateToLP(vCapId, vEstLicenseNum))
                {
                    aa.licenseScript.associateLpWithCap(vCapId, vEstLicenseScriptModel);
                }
			}
		}
	} catch(err) {
		cancel = true;
		showMessage = true;
		comment("Error on ASB function CWM_ELP_DPL_234_WTUA_copyLPAndContact, Please contact administrator : " +err.message);
	}
}

//Added by Ankush for Script#274
function CWM_ELP_DPL_274_WTUB_ValidateLicenseIssueDate() {
	try {
		var vLicIssueDt = getAppSpecific("License Issue Date");
		if(!vLicIssueDt){
			cancel = true;
			showMessage = true;
			logDebug("Failed Validation: " + wfTask + "-" + wfStatus + " :: This record must have a License Issue Date value to continue.");
			comment("This record must have a License Issue Date value to continue.");
		}
	}catch (err) {
	showMessage = true;
	comment("Error on WTUB function CWM_ELP_DPL_274_WTUB_ValidateLicenseIssueDate, Please contact administrator"+ err.message);
	}
} // END OF CWM_ELP_DPL_274_WTUB_ValidateLicenseIssueDate()
//Added by Ankush for Script#272
function CWM_ELP_DPL_272_WTUA_setExpDateForEmbamlerApprentice(itemCap){
	try{
		var currentDate = new Date();
		var expDate = new Date();
		expDate.setDate(20);
		expDate.setMonth(9);
		var currYear = currentDate.getFullYear();
		var currMonth = currentDate.getMonth();
		var expMonth = expDate.getMonth();
		if(currMonth >= 7 && currMonth <= 11)
		{
			expDate.setFullYear(currYear + 1);
			expDate.setMonth(9);
			expDate.setDate(20);
		}
		else
		{
			expDate.setFullYear(currYear);
			expDate.setMonth(9);
			expDate.setDate(20);
		}
		var expDateString = expDate.getMonth() + 1 + "/" + expDate.getDate() + "/" + expDate.getFullYear();
		logDebug("expDateString : "+expDateString);
		licCustID = itemCap.getCustomID();
		if (licCustID)
			logDebug("Parent ID: " + licCustID + " " + itemCap);
		else
			logDebug("Unable to get Parent ID");
		thisLic=new licenseObject(licCustID,itemCap);
		thisLic.setExpiration(expDateString);
		thisLic.setStatus("Active");
	}
	catch(error)
	{
		showMessage=true;
		comment("Error on CCWM_ELP_DPL_681_WTUA_setExpDateForFuneralAssistant:" + error + ". Please contact administrator");
	}
}	
// END OF FUNCTION: CWM_ELP_DPL_272_WTUA_setExpDateForEmbamlerApprentice()

// DPL Release C - Script IDs: 680 (added by dbarik)
// workflow check  on FuneralEstablishment Application ASI license issue date
function CWM_ELP_DPL_680_WTUB_checkWorkflowForLicenseIssueDate(){
	var wfTaskObj;
	var issueDateObj;
  try{
	  logDebug("Mytask wfTask:" + wfTask); 
	  logDebug("Mytask wfStatus: " + wfStatus);
	  var issueTaskDate = getAppSpecific("License Issue Date",capId);
	  logDebug("Mytask taskDate: " + issueTaskDate);
	  if((wfTask == "Validate" && (matches(wfStatus, "Approved", "Approved with Conditions"))) )
	  {
		logDebug("Validate and approved/approved with conditions entered");
		if(issueTaskDate==null || !issueTaskDate || issueTaskDate=="undefined"){
			cancel = true;
			showMessage = true;
                         message="";
			//logDebug("This record must have a License Issue Date value to continue.");
			comment("This record must have a License Issue Date value to continue.");
		}else{
			logDebug("SUCESS!!!");
		}
	  }
  }catch(err){	
	  cancel = true;
	  showMessage=true;
	comment("Error on WTUB;License!Funeral Directors!Funeral Establishment!Application, Please contact administrator");
  }
	
}
//added by kpreeti
function CWM_ELP_DPL_679_WTUA_UpdateFormerFuneralEstablishmentLic(){
	try{
	var fullAltId = getAppSpecific("Establishment Number",capId);
	//if(fullAltId.indexOf("-") < 0){
		var fullAltId = fullAltId+"-FE-FE";
		var licenseCapID = aa.cap.getCapID(fullAltId).getOutput();
		assignedToByShortNotes("Issuance", getBoard(licenseCapID)); // board is FE
		updateTask("Issuance", "No Longer Licensed", "Review relationships to this License and determine what actions need to be taken regarding those related licensees.", "Updated via script.",capId);   
//}
	}catch(err){
		("error: "+err.message);
	}
} // END OF CWM_ELP_DPL_679_WTUA_UpdateFormerFuneralEstablishmentLic

function CWM_ELP_DPL_528_WTUA_editContactsFromCapAndContactType(theParentRecord,theChildRecord,vRelDate)
{
		if(theParentRecord!= null && theChildRecord!=null){
			logDebug("Parent Record: " + theParentRecord);
			logDebug("Child Record: " + theChildRecord);
			if(theParentRecord != null && theChildRecord != null){
				var pRecordCap = aa.cap.getCapID(theParentRecord).getOutput();
				var cRecordCap = aa.cap.getCapID(theChildRecord).getOutput();
				var rRecordCap = getLatestTempRenewal(pRecordCap);
				
				var cons = aa.people.getCapContactByCapID(cRecordCap).getOutput();
				var pCons = aa.people.getCapContactByCapID(pRecordCap).getOutput();

   				for (x in cons){
                var licContact = cons[x];
                var licContactModel = licContact.getCapContactModel();
                var refContactNumber = licContactModel.refContactNumber;
                var contactAddressList = aa.address.getContactAddressListByCapContact(licContactModel).getOutput();	
				//added if statement to make sure we only end date the licensed individual contact
				var pca = theParentRecord.split("-");
				var cca = theChildRecord.split("-");
				if(cca[1] =="FE"){
					var vcontactEndDate = "Funeral Establishment";
				}
				else {
					var vcontactEndDate = "Licensed Individual";
				}
				logDebug("vcontactEndDate:"+vcontactEndDate);
				if(cons[x].getCapContactModel().getContactType() == vcontactEndDate){				
   					var refNum = cons[x].getCapContactModel().getRefContactNumber();
      				var conSeqNum = cons[x].getPeople().getContactSeqNumber();
      				logDebug("Contact to be end dated: " + conSeqNum);
      				logDebug("Contact Reference Number to be end dated: " + refNum);
	  				
	  				for(i in pCons){	
		  				var pRefNum = pCons[i].getCapContactModel().getRefContactNumber();
	  					var pConSeqNum = pCons[i].getPeople().getContactSeqNumber();
	  					var pConEmail = pCons[i].getPeople().getEmail();
	  					if(pRefNum.equals(refNum) && pCons[i].getPeople().getEndDate() == null){	
							//aa.people.removeCapContact(pRecordCap, pConSeqNum);
							//logDebug("Contact sequence Number deleted: " + pConSeqNum + " from record: " + pRecordCap.getCustomID());
								pCons[i].getPeople().setEndDate(vRelDate);
                                var updateResult = aa.people.editCapContact(pCons[i].getCapContactModel());
                                if (updateResult.getSuccess()) {
                                    logDebug("Contact " + pConSeqNum + " updated successfully on the license");
                                } else {
                                    logDebug("Contact " + pConSeqNum + " update failed on the license: " + updateResult.getErrorType() + ":" + updateResult.getErrorMessage());
                                }							
							logDebug("Contact Reference Number end dated: " + pRefNum + " from license record: " + pRecordCap.getCustomID());
                                // After we edit the contact type, we need to re-copy addresses
                                for (add in contactAddressList) {
                                    var transactionAddress = false;
                                    contactAddressModel = contactAddressList[add].getContactAddressModel();
                                    if (contactAddressModel.getEntityType() == "CAP_CONTACT") {
                                        transactionAddress = true;
                                        contactAddressModel.setEntityID(parseInt(pCons[i].getPeople().getContactSeqNumber()));
                                    }
                                    // Commit if transaction contact address
                                    if (transactionAddress) {
                                        var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
                                        contactAddressModel.setContactAddressPK(newPK);
                                        aa.address.createCapContactAddress(pRecordCap, contactAddressModel);
                                    }
                                    // Commit if reference contact address
                                    else {
                                        // build model
                                        var Xref = aa.address.createXRefContactAddressModel().getOutput();
                                        Xref.setContactAddressModel(contactAddressModel);
                                        Xref.setAddressID(contactAddressList[add].getAddressID());
                                        Xref.setEntityID(parseInt(pCons[i].getPeople().getContactSeqNumber()));
                                        Xref.setEntityType(contactAddressModel.getEntityType());
                                        Xref.setCapID(pRecordCap);
                                        // commit address
                                        aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
                                    }
                                }							
		  				        break;
	                    }
   					}
					//remove the contact from the temp renewal if it exists
 					if (rRecordCap != null) {
						var rCons = aa.people.getCapContactByCapID(rRecordCap).getOutput();
						logDebug("contact length:"+rCons.length);
 						for(r in rCons) {
						var rRefNum = rCons[r].getCapContactModel().getRefContactNumber();
	  					var rConSeqNum = rCons[r].getPeople().getContactSeqNumber();
	  					var rConEmail = rCons[r].getPeople().getEmail();
	  					//if (pConEmail.equals(conEmail)){	
if(rRefNum){	  					
if(rRefNum.equals(refNum)){	
							aa.people.removeCapContact(rRecordCap, rConSeqNum);
							//logDebug("Contact sequence Number deleted: " + pConSeqNum + " from record: " + pRecordCap.getCustomID());
							logDebug("Contact Reference Number deleted: " + pRefNum + " from renewal record: " + rRecordCap.getCustomID());
		  				        break;
	                    }
}	
							
						} 
					} 
	  			}
			}


				
				//Remove LP Link from License Tab
				var vRefLP = getRefLicenseProf(cRecordCap.getCustomID());
				var vreflpBusinessLicense = vRefLP.businessLicense;
				var vreflpStateLicense = vRefLP.stateLicense;
				var vreflpStateLicense2= vRefLP.stateLicense+"-"+vreflpBusinessLicense;
				logDebug("vRefLP Business License: " + vreflpBusinessLicense);
				logDebug("vRefLP State License: " + vreflpStateLicense);
				logDebug("vRefLP State License secondary check: " + vreflpStateLicense2);
				
				var capLicenseResult = aa.licenseScript.getLicenseProf(pRecordCap);
				if(capLicenseResult.getSuccess()){
					var capLicenseArr = capLicenseResult.getOutput();
					for(i in capLicenseArr){
						
						logDebug("parent License: " + capLicenseArr[i].getBusinessLicense());
						// Get child reference LP
						if((vreflpBusinessLicense == capLicenseArr[i].getBusinessLicense() && vreflpStateLicense == capLicenseArr[i].getLicenseNbr()) || (vreflpBusinessLicense == capLicenseArr[i].getBusinessLicense() && vreflpStateLicense2 == capLicenseArr[i].getLicenseNbr())){
							//var vRefLP = getRefLicenseProf(curCapId.getCustomID());
							if( capLicenseArr[i].getPrintFlag() == "Y"){
								capLicenseArr[i].setPrintFlag("N");
								var result = aa.licenseProfessional.editLicensedProfessional(capLicenseArr[i]);
								logDebug("Setting primary flag to N " +  result.getSuccess());
							}						
							logDebug("Removing license LP: " + capLicenseArr[i].getLicenseNbr() +  " from CAP " + pRecordCap.getCustomID());
							var remCapResult = aa.licenseProfessional.removeLicensedProfessional(capLicenseArr[i]);	
						}
					}
				}
				}
			}
}
//added by kpreeti for defect 10241
function CWM_ELP_DPL_ASB_validateApprenticeLicenseLinkedToType3() {
	try {
		var apprenticeLicenseNumber = null;
		var parentLicenseCapId = null;
		var parentLicenseNbr = null;
var vParentLicNumeric;
		if (publicUser) // HANDLE ACA PAGEFLOW
		{
			var myAInfo = new Array();
			useAppSpecificGroupName = true;
			loadAppSpecific4ACA(myAInfo);
			apprenticeLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Apprentice License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			useAppSpecificGroupName = false;
			if (parentLicenseNbr != null){
				var vParentLicNumArry = parentLicenseNbr.split("-");
			vParentLicNumeric = vParentLicNumArry[0];
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput();
                          
                           }
		} else if (!publicUser) {
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			apprenticeLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Apprentice License Number"];
			logDebug("apprenticeLicenseNumber:" + apprenticeLicenseNumber);
                   
                         if(apprenticeLicenseNumber == "" || apprenticeLicenseNumber == null){
                          logDebug("Inside the condition-----");
				return false;
			}

			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			logDebug("parentLicenseNbr:" + parentLicenseNbr);
			if (parentLicenseNbr != null){
				var vParentLicNumArry = parentLicenseNbr.split("-");
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric " + vParentLicNumeric);
			parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput();
				logDebug("parentLicenseNbr is not null, capid is:" + parentLicenseCapId);
                         }
			useAppSpecificGroupName = false;
		}
		if (apprenticeLicenseNumber != null && apprenticeLicenseNumber != "") {
//showMessage = true;
			logDebug("apprenticeLicenseNumber is not null ; is not blank");
			apprenticeLicenseNumber = apprenticeLicenseNumber.toString();
			if (apprenticeLicenseNumber.indexOf("-") < 0) {
				vchildLicNumeric = apprenticeLicenseNumber;
				logDebug("vchildLicNumeric : " + vchildLicNumeric);
				apprenticeLicenseNumber = apprenticeLicenseNumber + "-" + "EM" + "-" + "A";
			}
			var vchildLicNumArry = apprenticeLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : " + vchildLicNumeric);
			var apprenticeLicenseNumberCapID = aa.cap.getCapID(apprenticeLicenseNumber).getOutput();
			logDebug("apprenticeLicenseNumberCapID: " + apprenticeLicenseNumberCapID);
			var isValidLicense = false;
			if (apprenticeLicenseNumberCapID) {
				var type3SponsorCapType = aa.cap.getCap(apprenticeLicenseNumberCapID).getOutput().getCapType().toString();
				logDebug("get cap " + aa.cap.getCap(apprenticeLicenseNumberCapID).getOutput());
				logDebug("get cap " + aa.cap.getCap(apprenticeLicenseNumberCapID).getOutput().getCapType());

				var licTypeArr = type3SponsorCapType.split("/");
				//Get license sub-type
				var licenseType = licTypeArr[2];
				logDebug("licenseType " + licenseType);

				//1)check licenseType is a "Embalmer Apprentice" and
				//2)the license of the relationship being ended does not have to be in a status of Current.
				if (licenseType != null && licenseType == "Embalmer Apprentice") {
					logDebug("vParentLicNumeric " + vParentLicNumeric + "vchildLicNumeric " + vchildLicNumeric);
					if (checkRefLpExistsOnLicense(vParentLicNumeric, "EM", "3", vchildLicNumeric, "EM", "A")) {
						logDebug("link exists");
						isValidLicense = true;
					}
				}
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("<font color='red'><b>The Apprentice License number entered is not a valid license.</b></font>");
			}
		}
	} catch (err) {
		useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("ERROR:The Apprentice License number entered is not a valid license.");
		logDebug("Error message caught inside CWM_ELP_DPL_ASB_validateApprenticeLicenseLinkedToType3.message: " + err.message);
	}
} // END OF FUNCTION: CWM_ELP_DPL_ASB_validateApprenticeLicenseLinkedToType3

//added by kpreeti for defect# 10241
function CWM_ELP_DPL_ASB_validateFuneralEstablishmentLicenseLinkedToType3(){
	try{
		//Get AppSpecificInfo details
		//useAppSpecificGroupName = true;
		//var funeralEstLicenseNumber = getAppSpecific("END EXISTING RELATIONSHIP.Funeral Establishment License Number",capId);	
		//useAppSpecificGroupName = false;
		var funeralEstLicenseNumber = null;
		var parentLicenseCapId = null;
		var parentLicenseNbr = null;
		var vchildLicNumeric = "";
		var vParentLicNumeric = "";
		if (publicUser) // HANDLE ACA PAGEFLOW

		{			
			var myAInfo = new Array();
			useAppSpecificGroupName = true;
			loadAppSpecific4ACA(myAInfo);
			funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			useAppSpecificGroupName = false;
			if(parentLicenseNbr != null){
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput();
				var vParentLicNumArry = parentLicenseNbr.split("-");	
				vParentLicNumeric = vParentLicNumArry[0];
				logDebug("vParentLicNumeric "+vParentLicNumeric);
			}
		}else if(!publicUser){
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			
                        if(funeralEstLicenseNumber == "" || funeralEstLicenseNumber == null){
				return false;
			}

                        if(parentLicenseNbr != null)
			var vParentLicNumArry = parentLicenseNbr.split("-");	
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric "+vParentLicNumeric);
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()
			useAppSpecificGroupName = false;
		}
		if (funeralEstLicenseNumber != null &&  funeralEstLicenseNumber != "") {
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString();
			if(funeralEstLicenseNumber.indexOf("-") < 0){
				vchildLicNumeric = funeralEstLicenseNumber;
				funeralEstLicenseNumber = funeralEstLicenseNumber + "-" + "FE" + "-" + "FE";			
			}
			var vchildLicNumArry = funeralEstLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : "+vchildLicNumeric);
			var funeralEstLicenseNumberCapID= aa.cap.getCapID(funeralEstLicenseNumber).getOutput();
			var funeralEstCapType= aa.cap.getCap(funeralEstLicenseNumberCapID).getOutput().getCapType().toString();
			var licTypeArr = funeralEstCapType.split("/");
			//Get license sub-type
			var licenseType = licTypeArr[2];
			var isValidLicense = false;
			//1)check licenseType is a "Funeral Establishment" and 
			//2)the license of the relationship being ended does not have to be in a status of Current.
			if(licenseType!=null && licenseType=="Funeral Establishment"){
				logDebug("inside if");
				if(checkRefLpExistsOnLicense(vParentLicNumeric,"EM","3",vchildLicNumeric,"FE","FE") && isLicenseCurrent(funeralEstLicenseNumberCapID)){
					logDebug("FEN");
					isValidLicense =true;
				}
			}
			if(!isValidLicense){
				cancel = true;
				showMessage = true;
				comment("<font color='red'><b>The Funeral Establishment License number entered is not a valid license.</b></font>");
			}
		}
	}catch(err){
		//useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("<font color='red'><b>ERROR:The Funeral Establishment License number entered is not a valid license.</b></font>");
	}
}// END OF FUNCTION: CWM_ELP_DPL_ASB_validateFuneralEstablishmentLicenseLinkedToType3

function CWM_ELP_DPL_Type3_attestationCheckFA(itemCapId)
{
	try {
		useAppSpecificGroupName = false;
		var result = false;
		var tmpCapId = null;

		if (capId) {
			tmpCapId = capId;
			capId = itemCapId;
		} else {
			capId = itemCapId;
		}

		// this to avoid a script error from special character.
		var splChar = String.fromCharCode(167);
		var asiName = "A. I AM IN COMPLIANCE WITH G.L.c.62C " + splChar + splChar + "47A & 49A.";
		var inComplianceGLC = getAppSpecific(asiName);
		var educationAsi = getAppSpecific("B. I HAVE COMPLETED ALL REQUIRED CONTINUING EDUCATION IN COMPLIANCE WITH BOARD STATUTES/REGULATIONS");
		var reportedDiscipline = getAppSpecific("C. I HAVE REPORTED TO THE BOARD ALL DISCIPLINE TAKEN AGAINST ANY PROFESSIONAL LICENSE ISSUED TO ME.");
		var reportedPleas = getAppSpecific("D. I HAVE REPORTED TO THE BOARD ALL CRIMINAL CONVICTIONS OR GUILTY PLEAS.");
		asiName = "E.  AS REQUIRED BY M.G.L. C. 30A, " + splChar + "13A, I HAVE REPORTED MY SOCIAL SECURITY NUMBER.";
		var reportedSSN = getAppSpecific(asiName);
		var reportedEstEmployer = getAppSpecific("F. I HAVE REPORTED ANY CHANGE IN MY ASSOCIATED FUNERAL ESTABLISHMENTS.");
		var reportTerminatedAppr = getAppSpecific("G. I HAVE REPORTED ANY TERMINATIONS OF APPRENTICES I SPONSORED.");
		var haveCompleted = getAppSpecific("B. I HAVE COMPLETED ALL REQUIRED CONTINUING EDUCATION IN COMPLIANCE WITH BOARD STATUTES/REGULATIONS").toUpperCase().equals("YES");
		if(reportedSSN == undefined){ reportedSSN  = "NO";}

		if (!haveCompleted) {
			//CWM_ELP_Generic_DPL_addConditionOnCap("Renewal","Positive Renewal Attestation");
			logDebug("Have not completed.");
			closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
			updateTask("Validate", "CE Attestation Review", "Updated via script.", "Updated via script.");
			activateTask("Validate");
			assignedToByShortNotes("Validate", getBoard(capId)); //If any are NO, complete task assignment
			addToLicensePrintSet(capId);
		} else if (inComplianceGLC.toUpperCase().equals("NO") || reportedDiscipline.toUpperCase().equals("NO") ||
			reportedPleas.toUpperCase().equals("NO") || reportedSSN.toUpperCase().equals("NO") || reportedEstEmployer.toUpperCase().equals("NO") || reportTerminatedAppr.toUpperCase().equals("NO")) {
			// Note: Adding the renewal License into the Print set is included in renewalApproval()
			logDebug("If any are No");
			assignedToByShortNotes("Intake", getBoard(capId)); //If any are NO, complete task assignment
			if (renewalApproval(capId)) {
				closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
				activateTask("Issuance");
				updateTask("Issuance", "Attestation Review", "Updated via script.", "Updated via script.");
				assignedToByShortNotes("Issuance", getBoard(capId));
				result = true;
			} else
				result = false;
		} else { // enters when all are YES
			if (renewalApproval(capId)) {
				logDebug("Post renewal approval workflow tasks settings for " + capId.getCustomID());
				closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
				activateTask("Issuance");
				updateTask("Issuance", "Ready for Printing", "Updated via script.", "Updated via script.");
				result = true;
			} else
				result = false;
		}
		capId = tmpCapId;
		return result;
	} 
	catch (error) {
		logDebug("An exception has been thrown by CWM_ELP_DPL_Type3_attestationCheckFA");
		logDebug("Error in CWM_ELP_DPL_Type3_attestationCheckFA: " + error.message);
	}
}

function CWM_ELP_DPL_Type6_attestationCheckFA(itemCapId)
{
	try {
		useAppSpecificGroupName = false;
		var result = false;
		var tmpCapId = null;

		if (capId) {
			tmpCapId = capId;
			capId = itemCapId;
		} else {
			capId = itemCapId;
		}

		// this to avoid a script error from special character.
		var splChar = String.fromCharCode(167);
		var asiName = "A. I AM IN COMPLIANCE WITH G.L.c.62C " + splChar + splChar + "47A & 49A.";
		var inComplianceGLC = getAppSpecific(asiName);
		var educationAsi = getAppSpecific ("B. I HAVE COMPLETED ALL REQUIRED CONTINUING EDUCATION IN COMPLIANCE WITH BOARD STATUTES/REGULATIONS.").toUpperCase().equals("YES");
		var reportedDiscipline = getAppSpecific("C. I HAVE REPORTED TO THE BOARD ALL DISCIPLINE TAKEN AGAINST ANY PROFESSIONAL LICENSE ISSUED TO ME.");
		var reportedPleas = getAppSpecific("D. I HAVE REPORTED TO THE BOARD ALL CRIMINAL CONVICTIONS OR GUILTY PLEAS.");
		asiName = "E.  AS REQUIRED BY M.G.L. C. 30A, " + splChar + "13A, I HAVE REPORTED MY SOCIAL SECURITY NUMBER.";
		var reportedSSN = getAppSpecific(asiName);
		var reportedEstEmployer = getAppSpecific("F. I HAVE REPORTED ANY CHANGE IN MY FUNERAL ESTABLISHMENT EMPLOYER.");
		var reportChangesInType3 = getAppSpecific("G. I HAVE REPORTED ANY CHANGE IN MY TYPE 3 SPONSOR.");
		
		if(reportedSSN == undefined){ reportedSSN  = "NO";}

		if (!educationAsi) {
			//CWM_ELP_Generic_DPL_addConditionOnCap("Renewal","Positive Renewal Attestation");
			logDebug("Have not completed.");
			closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
			activateTask("Validate");
			updateTask("Validate", "CE Attestation Review", "Updated via script.", "Updated via script.");
			//callReport("DPL|LICENSE_REGISTRATION_CARD",false,true,"DPL License Print Set",capId);

			assignedToByShortNotes("Validate", getBoard(capId)); //If any are NO, complete task assignment
			
			//addToLicensePrintSet(capId);
		} else if (inComplianceGLC.toUpperCase().equals("NO") || reportedDiscipline.toUpperCase().equals("NO") ||
			reportedPleas.toUpperCase().equals("NO") || reportedSSN.toUpperCase().equals("NO") || reportedEstEmployer.toUpperCase().equals("NO") || reportChangesInType3.toUpperCase().equals("NO")) {
			// Note: Adding the renewal License into the Print set is included in renewalApproval()
			logDebug("If any are No");
			//assignedToByShortNotes("Intake", getBoard(capId)); //If any are NO, complete task assignment
			if (renewalApproval(capId)) {
				closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
				activateTask("Issuance");
				updateTask("Issuance", "Attestation Review", "Updated via script.", "Updated via script.");
				assignedToByShortNotes("Issuance", getBoard(capId));
				callReport("DPL|LICENSE_REGISTRATION_CARD",false,true,"DPL License Print Set",capId);
				result = true;
			} else
				result = false;
		} else { // enters when all are YES
			if (renewalApproval(capId)) {
				logDebug("Post renewal approval workflow tasks settings for " + capId.getCustomID());
				closeTask("Intake", "Submitted", "Updated via script.", "Updated via script.");
				activateTask("Issuance");
				updateTask("Issuance", "Ready for Printing", "Updated via script.", "Updated via script.");
				result = true;
			} else
				result = false;
		}
		capId = tmpCapId;
		return result;
	} 
	catch (error) {
		logDebug("An exception has been thrown by CWM_ELP_DPL_Type6_attestationCheckFA");
		logDebug("Error in CWM_ELP_DPL_Type6_attestationCheckFA: " + error.message);
	}
}


function CWM_ELP_530_DPL_addNeedRelationShipConditionApprenticeAmendment()
{
	try {
		var RelationshipApprTable = loadASITable("RELATIONSHIP APPROVAL", capId);
		var vChangeType; 
		var vLicenseType;
		var vRelatedLicense;
		
		// iterate thru all rows in the relationship approval table
		for(rowIter in RelationshipApprTable )
		{
			vChangeType = RelationshipApprTable[rowIter]["Change Type"];
			vRelatedLicense = RelationshipApprTable[rowIter]["License Number"];
			vLicenseType = RelationshipApprTable[rowIter]["License Type"];
			var vThirtyDayWarning = RelationshipApprTable[rowIter]["30 Day Warning"];
			vThirtyDayWarning = vThirtyDayWarning.toString();

			logDebug("Change Type: " + vChangeType + " LicenseType: " + vLicenseType + " LicenseNbr: " + vRelatedLicense);	
			
			if(vRelatedLicense!=null && vRelatedLicense!=""){
				vRelatedLicense = vRelatedLicense.toString();
				if (vRelatedLicense.inderowIterOf("-") == -1) {
					
					logDebug("Create ALT_ID from the license number: " + vRelatedLicense);
					
					if(vLicenseType == "Funeral Establishment" ){
						 vRelatedLicense = vRelatedLicense+"-"+"FE"+"-"+"FE";
					} else if(vLicenseType == "Type 3" ){
						 vRelatedLicense = vRelatedLicense+"-"+"EM"+"-"+"3";
					}
				}
		
				if(vChangeType=="Add" && vThirtyDayWarning.equals("CHECKED")){
					logDebug("BEGIN adding condition");
					CWM_ELP_XXX_WTUA_DPL_AddConditionforNeedsRelationShip(vRelatedLicense);
					logDebug("END adding condition");
				} else {
					logDebug("For related License: " + vRelatedLicense + " either Add option is not selected or 30 Day warning is not checked.");
				}
			}
		}
	} catch(err) {
		logDebug("ERROR on CWM_ELP_530_DPL_addNeedRelationShipConditionApprenticeAmendment: " + err.message);
	}
}
//added by kpreeti
function closeLicWorkflowCust(wstatus,pNote, associatedCapId)
{
	//Variables defined
	var sysDate = aa.date.getCurrentDate();
	var userId = "admin"
	var systemUserObjResult = aa.person.getUser(userId.toUpperCase());
	if (systemUserObjResult.getSuccess()) 
	{
		var systemUserObj = systemUserObjResult.getOutput();
	}
	
	//Access workflow
	var workflowResult = aa.workflow.getTasks(associatedCapId);
	if (workflowResult.getSuccess())
	{
		wfObj = workflowResult.getOutput();
		for (var i=0; i< wfObj.length; i++)
		{ 
			var fTask = wfObj[i]; 
			var desc = fTask.getTaskDescription(); 
			var activeFlag = fTask.getActiveFlag();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			logDebug("RecordId:"+ associatedCapId.getCustomID() + " DESC: " + desc+ " Active Flag: " + fTask.getActiveFlag() + " Step no: " + stepnumber + " Process ID: " + processID);
			
			//Closing workflow
			if(desc == "License" && activeFlag == "Y")
			{
				var updateWorkflowTaskResult = aa.workflow.handleDisposition(associatedCapId,stepnumber,processID,wstatus,sysDate, "",pNote,systemUserObj ,"Y");
				logDebug("Updated status: " + fTask.getDisposition() + " " + "Succeeded: " +updateWorkflowTaskResult.getSuccess());
			}
		}	
	}	
}
//CR 524 -EM Board - Funeral Assistant App requires Sponsor information this needs to be made not requirednew - Jaime Shear 08/09/2016
function CWM_ELP_DPL_WTUB_440_LicNbrRequired(){
	try{
		var feLicNbr = getAppSpecific("Funeral Establishment License Number");
		if(feLicNbr==null||feLicNbr==""){
			cancel = true;
			showMessage = true;
			message="";
			comment("The field Funeral Establishment License Number must have a value before approving this applicaiton.");
		}
	}
	catch(err){
		logDebug("An error occurred in CWM_ELP_DPL_440_LicNbrRequired:"+err.message);
	}
}
//evt - updates for EPAWS-994
function CWM_ELP_DPL_FuneralAsstDocCheck() {
	try {
		if (!docCheck("CORI Notarized Form")) {
			cancel = true;
			showMessage = true;
			comment("The CORI Notarized Form must be uploaded to proceed with this application");
		}
		if (!docCheck("Passport Photo")) {
			if (!cancel) {
				cancel = true;
			}
			if (!showMessage) {
				showMessage = true;
			}
			comment("The Passport Photo must be uploaded to proceed with this application");
		}
		if (!docCheck("Training Certification")) {
			if (!cancel) {
				cancel = true;
			}
			if (!showMessage) {
				showMessage = true;
			}
			comment("The Training Certification must be uploaded to proceed with this application");
		}
		if (!docCheck("High School Diploma")) {
			if (!cancel) {
				cancel = true;
			}
			if (!showMessage) {
				showMessage = true;
			}
			comment("The High School Diplima must be uploaded to proceed with this application");
		}
		/*if (!docCheck("Birth Certificate")) {
			if (!cancel) {
				cancel = true;
			}
			if (!showMessage) {
				showMessage = true;
			}
			comment("The Birth Certificate must be uploaded to proceed with this application");
		}*/
		if (!docCheck("Sponsor Signature")) {
			if (!cancel) {
				cancel = true;
			}
			if (!showMessage) {
				showMessage = true;
			}
			comment("The Sponsor Signature must be uploaded to proceed with this application");
		}
	} catch (err) {
		logDebug("An error occurred in CWM_ELP_DPL_FuneralAsstDocCheck:" + err.message);
	}
}
function CWM_ELP_DPL_440_RequireHighSchoolEd(){
	try{
		loadASITForACA();
		var reqMet = false;

		if(typeof(EDUCATION) == "object"){
			for(row in EDUCATION){
				if(EDUCATION[row]["School Type"]=="High School or Equivalent"){
					reqMet = true;
					break;
				}
			}
		}
		if(!reqMet){
			cancel = true;
			showMessage = true;
			comment("Applicants must indicate their High School or equivalent education");
		}
	}
	catch(err){
		comment("An error occurred in CWM_ELP_DPL_440_RequireHighSchoolEd:"+err.message);
	}
}
function CWM_ELP_DPL_440_ValidateSponsor() {
	try {
		var sponsorLicNbr = AInfo["Sponsor License Number"];
		if ((sponsorLicNbr) && (sponsorLicNbr != "")) {
			var sponsorLicNbrString = null;
			if (sponsorLicNbr.indexOf("-") < 0) {
				sponsorLicNbrString = sponsorLicNbr + "-EM-3";
			} else {
				sponsorLicNbrString = sponsorLicNbr;
			}
			var type3LP = getRefLicenseProf(sponsorLicNbrString);
			if (type3LP) {
				if (type3LP.getPolicy() != "Current") {
					cancel = true;
					showMessage = true;
					comment("<b><font color='red'>Sponsor is not a valid or current Type 3 licensee</font></b>");
				}
			} else {
				cancel = true;
				showMessage = true;
				comment("<b><font color='red'>Sponsor is not a valid or current Type 3 licensee</font></b>");
			}
			var feLicNbr = AInfo["Funeral Establishment License Number"];
			if ((feLicNbr)&&(feLicNbr != "")&&(type3LP)){
				var feLicNbrString = null;
				if (feLicNbr.indexOf("-") < 0) {
					feLicNbrString = feLicNbr + "-FE-FE";
				} else {
					feLicNbrString = feLicNbr;
				}
				var feRecord = aa.cap.getCapID(feLicNbrString).getOutput();
				var lpList = aa.licenseProfessional.getLicensedProfessionalsByCapID(feRecord).getOutput();
				var spArray = sponsorLicNbrString.split("-"); //holds the structure of the sponsor's license number
				var associated = false;
				for (lp in lpList) {
					if ((lpList[lp].getLicenseType() == type3LP.getLicenseType()) && (lpList[lp].getLicenseNbr() == spArray[0])) {
						associated = true;
						break;
					}
				}

				if (!associated) {
					cancel = true;
					showMessage = true;
					comment("Sponsor is not associated with the Funeral Establishment.");
				}
			}
		}
	} catch (err) {
		logDebug("An error has occurred in CWM_ELP_DPL_440_ValidateSponsor:" + err.message);
	}
}
/* Release C - CR ID: 440 (Added by Ankush) Dt.: 05/06/2016
evt - Modified for EPAWS-985
 */
function CWM_ELP_440_DPL_ACA_ASB_checkEmbalmerReqDocsUploaded()
{
    try
    {
		var vCORIReqFrm = false;
		var docCORIReqFrm = "CORI Notarized Form";
		var vCORIReqFrmErrMsg = "The CORI Notarized Form must be uploaded to proceed with this application";
		
		var vPassportPhoto = false;
		var docPassportPhoto = "Passport Photo";
		var vPassportPhotoErrMsg = "The Passport Photo must be uploaded to proceed with this application";
		
		var vSponsorSignature = false;
		var docSponsorSignature = "Sponsor Signature";
		var vSponsorSignatureErrMsg = "The Sponsor Signature must be uploaded to proceed with this application";

		var vHighSchoolDiploma = false;
		var docHighSchoolDiploma = "High School Diploma";
		var vHighSchoolDiplomaErrMsg = "The High School Diplima must be uploaded to proceed with this application";

		//var vBirthCert = false;
		//var docBirthCert = "Birth Certificate";
		//var vBirthCertErrMsg = "The Birth Certificate must be uploaded to proceed with  this application";
		
		var vOSHAcert = false;
		var docOSHAcert = "OSHA Training Certificate";
		var vOSHAcertErrorMsg = "The OSHA Training Certificate must be uploaded to proceed with this application";
		
		var docErrorMsg ="";
				
		if(!publicUser)
		{
			vCORIReqFrm = docCheckForASB(docCORIReqFrm);
			vPassportPhoto = docCheckForASB(docPassportPhoto);
			vSponsorSignature = docCheckForASB(docSponsorSignature);
			vHighSchoolDiploma = docCheckForASB(docHighSchoolDiploma);
			//vBirthCert = docCheckForASB(docBirthCert);
			vOSHAcert = docCheckForASB(docOSHAcert);
		} 
		else 
		{
			vCORIReqFrm = docCheck(docCORIReqFrm);
			vPassportPhoto = docCheck(docPassportPhoto);
			vSponsorSignature = docCheck(docSponsorSignature);
			vHighSchoolDiploma = docCheck(docHighSchoolDiploma);
			//vBirthCert = docCheck(docBirthCert);
			vOSHAcert = docCheck(docOSHAcert);
		}

		if (!vCORIReqFrm) {
			docErrorMsg = docErrorMsg + "<br>" + vCORIReqFrmErrMsg;
		}
		if (!vPassportPhoto) {
			docErrorMsg = docErrorMsg + "<br>" + vPassportPhotoErrMsg;
		}		
		if (!vSponsorSignature) {
			docErrorMsg = docErrorMsg + "<br>" + vSponsorSignatureErrMsg;
		}		
		if (!vHighSchoolDiploma) {
			docErrorMsg = docErrorMsg + "<br>" + vHighSchoolDiplomaErrMsg;
		}
		//if (!vBirthCert) {
		//	docErrorMsg = docErrorMsg + "<br>" + vBirthCertErrMsg;
		//}
		if (!vOSHAcert) {
			docErrorMsg = docErrorMsg + "<br>" + vOSHAcertErrorMsg;
		}

		if (docErrorMsg)
		{
			cancel = true;
			showMessage = true;
			comment(docErrorMsg);
		}
	}
	
	catch(err)
    {
        showMessage=true;
        comment("Error Message: " + err.message);
		comment("Error on ASB/EventAddBefore function CWM_ELP_440_DPL_ACA_ASB_checkEmbalmerReqDocsUploaded, Please contact administrator");
    }
} // END OF FUNCTION: CWM_ELP_440_DPL_ACA_ASB_checkEmbalmerReqDocsUploaded()
//ADDED BY Ankush ON 05/06/2016. CR440
function CWM_ELP_440_DPL_ASB_ACA_CheckMinRowEDUCATION()
{
	var ownershipRow = 0;	
	var minRows = 1;
	var flag = 0;
	try 
	{
		if(!publicUser){
			loadASITablesBefore();
		}else if(publicUser){
		  loadASITForACA();
		}
		ownershipRow = EDUCATION.length;
		for(x in EDUCATION){
			var col1 = EDUCATION[x]["School Type"];					
			if(col1 != null && col1 != undefined){
				col1 = col1.toString();
				if(col1 == "High School or equivalent"){
					flag = 1;
				}
			}
		}
		logDebug("Number of ownershipRow: "+ownershipRow);
	} 
	catch (ex) 
	{
		if (ownershipRow < minRows) 
		{
			flag = 0;
		}
		
	}
	if(flag == 0){
		cancel = true;
		showMessage = true;
		comment("Applicants must indicate their High School or equivalent education");
	}
	
}//END OF FUNCTION: CWM_ELP_197_DPL_ASB_ACA_CheckMinRowEDUCATION
/*@desc 
* 
 *Added by Ankush Kshirsagar
*/
function CWM_ELP_DPL_440_ASA_copyLPAndContact() {
	try {
		var vSponsorLicNum = getAppSpecific("Sponsor License Number");
		var vEstablismentLicNbr = getAppSpecific("Funeral Establishment License Number");
		var vLicenseScriptModel = null;
		var vEstLicenseScriptModel = null;
		if(vSponsorLicNum != null && vSponsorLicNum != ""){
            var vLicenseNum = vSponsorLicNum.toString();
			if(vLicenseNum.indexOf("-") < 0){
				vLicenseNum = vLicenseNum + "-" + "EM" + "-" + "3";
			}
			vLicenseScriptModel = getRefLicenseProf(vLicenseNum.toString());		
			var vSponsorLicNumCap = aa.cap.getCapID(vLicenseNum);
			if(vSponsorLicNumCap != null && vSponsorLicNumCap.getSuccess())
				vSponsorLicNumCap = vSponsorLicNumCap.getOutput();
			
			copyContactsByCapContactTypeWithASI(vSponsorLicNumCap, null, "Licensed Individual","Sponsor", null, vSponsorLicNum);
			if(vLicenseScriptModel!=null){				
				aa.licenseScript.associateLpWithCap(capId, vLicenseScriptModel);
			}
		}
		if(vEstablismentLicNbr != null && vEstablismentLicNbr != ""){
            var vEstLicenseNum = vEstablismentLicNbr.toString();
			if(vEstLicenseNum.indexOf("-") < 0){
				vEstLicenseNum = vEstLicenseNum + "-" + "FE" + "-" + "FE";
			}
			vEstLicenseScriptModel = getRefLicenseProf(vEstLicenseNum.toString());		
			var vEstLicNumCap = aa.cap.getCapID(vEstLicenseNum);
			if(vEstLicNumCap != null && vEstLicNumCap.getSuccess())
				vEstLicNumCap = vEstLicNumCap.getOutput();
			
			copyContactsByCapContactTypeWithASI(vEstLicNumCap, null, "Funeral Establishment","Funeral Establishment", null, vEstablismentLicNbr);
			if(vEstLicenseScriptModel!=null){				
				aa.licenseScript.associateLpWithCap(capId, vEstLicenseScriptModel);
			}
		}
	} catch(err) {
		cancel = true;
		showMessage = true;
		comment("Error on ASB function CWM_ELP_DPL_440_ASA_copyLPAndContact, Please contact administrator" + err.message);
	}
}// END OF FUNCTION: CWM_ELP_DPL_440_ASA_copyLPAndContact() 

function CWM_ELP_DPL_WTUA_440_addFEcontact(newLicId, newLicIdString) {
	try {
		var licenseNum = getAppSpecific("Funeral Establishment License Number");
		if (licenseNum != undefined && licenseNum != null && licenseNum != "") {

			var licenseTC = "FE";
			var contactType = "Funeral Establishment";
			var refLP = getRefLicenseProf(licenseNum, "FE", licenseTC);
			if (refLP) {
				var refLP2 = getRefLicenseProf(newLicIdString, "EM", "FA");
				var contactType2 = "Funeral Assistant";
				licenseNum = licenseNum.toString();
				if (licenseNum.indexOf("-") < 0) {
					licenseNum = licenseNum + "-" + "FE" + "-" + "FE";
				}
				var feLicNumID = aa.cap.getCapID(licenseNum).getOutput();
                                 associateLpWithCap( refLP,capId);//FE-To-FAAPP
				copyContactsByTypeWithAddress(feLicNumID,capId,contactType);
				copyContactsByTypeWithAddress(feLicNumID,newLicId,contactType);
				copyContactsByCapContactTypeWithASI(newLicId, feLicNumID, "Licensed Individual", contactType2, new Date(), null);
				//addReferenceContactandLicenseToParent(refLP, contactType, capId);
				if (refLP ) {
					logDebug("Adding Ref Licens to App record:" + newLicId);
					associateLpWithCap(refLP, newLicId);
				}
				
					if (refLP2 ) {
					logDebug("Adding Ref Licens to App record:" + feLicNumID);
					associateLpWithCap(refLP2, feLicNumID);
				}
				//addReferenceContactandLicenseToParent(refLP2, contactType2, feLicNumID);
			}

		}

	} catch (err) {

		showMessage = true;
		comment("Error on CWM_ELP_DPL_WTUA_440_addFEcontact, Please contact administrator" + err.Message);

	}
}

function CWM_ELP_DPL_440_validateFE() {
	try {
		var feLicNbr = AInfo["Funeral Establishment License Number"];
		var feLicNbrString = null;
		if ((feLicNbr) && (feLicNbr != "")) {
			if (feLicNbr.indexOf("-") < 0) {
				feLicNbrString = feLicNbr + "-FE-FE";
			} else {
				feLicNbrString = feLicNbr;
			}
			var feLP = getRefLicenseProf(feLicNbrString);
			if (feLP) {
				if (feLP.getPolicy() != "Current") {
					cancel = true;
					showMessage = true;
					comment("<b><font color='red'>Funeral Establishment is not a valid or current Establishment licensee</font></b>");
					//logDebug("FE licensee isn't current.");
				}
			} else {
				cancel = true;
				showMessage = true;
				comment("<b><font color='red'>Funeral Establishment is not a valid or current Establishment licensee</font></b>");
				//logDebug("FE licensee isn't current.");
			}
		}
	} catch (err) {
		logDebug("An error occurred in CWM_ELP_DPL_440_validateFE:" + err.message);
	}
}

/*
@By:debashish.barik
@Dt:5/17/2016
@FUNERAL_DIRECTORS_FUNCTIONS
@Desc:
Assess and invoice the $31 license fee (ECRT Code: EMFO) when the application is created.
 */
function CWM_ELP_DPL_ASA_assessLiceseFeeFunAssistantApp() {
	try {
			if (feeExists("EMFO")) {
				//updateFee("EMFO", "MH", "STANDARD", 1, "Y");
				logDebug("Fee Exist already.  Fee not updated.");
			} else {
				addFee("EMFO", "MH", "STANDARD", 1, "Y");
				logDebug("Fee Added.");
			}
	} catch (err) {
		logDebug("Error**CWM_ELP_DPL_ASA_assessLiceseFeeFunAssistantApp():" + err.message);
	}
}

/*@desc 
 *1. Validate that this is a Funeral Establishment license that is linked to this Type 3 license.
 *1a. If the validation fails, then display the message "The Funeral Establishment License number entered is not a valid license."
 *Note: the license of the relationship being ended does not have to be in a status of Current.
 *	   -The current link can be established either by the licnese showing on the license tab and/or the key individual contact not having an end date.
 *Added by kpreeti
*/

function CWM_ELP_DPL_ASB_validateFuneralEstablishmentLicenseLinkedToType6(){
	try{
		//Get AppSpecificInfo details
		//useAppSpecificGroupName = true;
		//var funeralEstLicenseNumber = getAppSpecific("END EXISTING RELATIONSHIP.Funeral Establishment License Number",capId);	
		//useAppSpecificGroupName = false;
		var funeralEstLicenseNumber = null;
		var parentLicenseCapId = null;
		var parentLicenseNbr = null;
		var vchildLicNumeric = "";
		var vParentLicNumeric = "";
		if (publicUser) // HANDLE ACA PAGEFLOW

		{			
			var myAInfo = new Array();
			useAppSpecificGroupName = true;
			//loadAppSpecific4ACA(myAInfo);
			funeralEstLicenseNumber = AInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = AInfo["MY LICENSE.License Number"];
			useAppSpecificGroupName = false;
			if(parentLicenseNbr != null){
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput();
				var vParentLicNumArry = parentLicenseNbr.split("-");	
				vParentLicNumeric = vParentLicNumArry[0];
				logDebug("vParentLicNumeric "+vParentLicNumeric);
			}
		}else if(!publicUser){
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
			parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
			if(parentLicenseNbr != null)
			var vParentLicNumArry = parentLicenseNbr.split("-");	
			vParentLicNumeric = vParentLicNumArry[0];
			logDebug("vParentLicNumeric "+vParentLicNumeric);
				parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()
			useAppSpecificGroupName = false;
		}
		if (funeralEstLicenseNumber != null &&  funeralEstLicenseNumber != "") {
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString();
			if(funeralEstLicenseNumber.indexOf("-") < 0){
				vchildLicNumeric = funeralEstLicenseNumber;
				funeralEstLicenseNumber = funeralEstLicenseNumber + "-" + "FE" + "-" + "FE";			
			}
			var vchildLicNumArry = funeralEstLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : "+vchildLicNumeric);
			var funeralEstLicenseNumberCapID= aa.cap.getCapID(funeralEstLicenseNumber).getOutput();
			var funeralEstCapType= aa.cap.getCap(funeralEstLicenseNumberCapID).getOutput().getCapType().toString();
			var licTypeArr = funeralEstCapType.split("/");
			//Get license sub-type
			var licenseType = licTypeArr[2];
			var isValidLicense = false;
			//1)check licenseType is a "Funeral Establishment" and 
			//2)the license of the relationship being ended does not have to be in a status of Current.
			if(licenseType!=null && licenseType=="Funeral Establishment"){
				logDebug("inside if");
				if(checkRefLpExistsOnLicense(vParentLicNumeric,"EM","6",vchildLicNumeric,"FE","FE")){
					logDebug("FEN");
					isValidLicense =true;
				}
			}
			if(!isValidLicense){
				cancel = true;
				showMessage = true;
				comment("<font color='red'><b>The Funeral Establishment License number entered is not a valid license.</b></font>");
			}
		}
	}catch(err){
		//useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("ERROR:The Funeral Establishment License number entered is not a valid license.");
	}
}// END OF FUNCTION: CWM_ELP_DPL_520_ASB_validateFuneralEstablishmentLicenseLinkedToApprentice  

//debashish.barik
//@FUNERAL_DIRECTORS_FUNCTIONS
function validateMyObject(pMyObject){

	if(pMyObject && pMyObject!=null && pMyObject!=""){
		return true;
	}else{
	return false;
       }
}

/*
"1. Validate that this is a current Apprentice license.
2.  If NOT, then message licensee/user:  ""Apprentice License entered is not Current, please contact the Board""."
"1. Validate that this is a current Funeral Establishment license.
2.  If NOT, then message licensee/user:  ""Funeral Establishment License entered is not Current, please contact the Board"".
@By:debashish.barik
@Dt:6/7/2016
@FUNERAL_DIRECTORS_FUNCTIONS
 */
function CWM_ELP_DPL_ASB_validateFunEstApperLic() {
	try {
		var flagF = true;
		var flagA = true;

		var vApprenticeLic = "";
		var vFunLic = "";
		var vAppName = "";
		var vApperDt = "";
		var vFunName = "";
		var vFunDt = "";
		useAppSpecificGroupName = true;
		if (publicUser) { //ACA page flow, AInfo is declared on page flow script, if not use loadAppSpecific4ACA(AInfo)
			var AInfo = new Array();
			loadAppSpecific4ACA(AInfo);
			vApprenticeLic = AInfo["ADD NEW RELATIONSHIP.Apprentice License Number"];
			vAppName = AInfo["ADD NEW RELATIONSHIP.Apprentice Name"];
			vApperDt = AInfo["ADD NEW RELATIONSHIP.End Date of Relationship with Apprentice"];

			vFunLic = AInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			vFunName = AInfo["ADD NEW RELATIONSHIP.Funeral Establishment Name"];
			vFunDt = AInfo["ADD NEW RELATIONSHIP.End Date of Relationship with Establishment"];

		} else { //AA
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);

			vApprenticeLic = myAInfo["ADD NEW RELATIONSHIP.Apprentice License Number"];
			vAppName = myAInfo["ADD NEW RELATIONSHIP.Apprentice Name"];
			vApperDt = myAInfo["ADD NEW RELATIONSHIP.End Date of Relationship with Apprentice"];

			vFunLic = myAInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			vFunName = myAInfo["ADD NEW RELATIONSHIP.Funeral Establishment Name"];
			vFunDt = myAInfo["ADD NEW RELATIONSHIP.End Date of Relationship with Establishment"];
		}

		useAppSpecificGroupName = false;
		//showMessage = true;

		//validate ADD NEW RELATIONSHIP group populated or not , checking the rule only if there is value else skip
		if (vApprenticeLic!="") {
			var boardCode = "EM";
			var aTypeClass = "A";
			//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
			var isActive = isLicenseActive(vApprenticeLic.toUpperCase(), boardCode, aTypeClass); 
				if (!isActive) 
				{
					cancel = true;
					showMessage = true;
					message = "";
					comment("<font color = 'red'><b>Apprentice License entered is not Current, please contact the Board</b></font>");
				}
		}
		if (vFunLic!="") {
			var boardCode = "FE";
			var aTypeClass = "FE";
			//FA 11-29-2017 Ticket:EPLACE-4414. Convert license number to uppercase. Validation works accuretly if license number is all uppercase
			var isActive = isLicenseActive(vFunLic.toUpperCase(), boardCode, aTypeClass); 
				if (!isActive) 
				{
					cancel = true;
					showMessage = true;
					message = "";
				comment("<font color = 'red'><b>Funeral Establishment License entered is not Current, please contact the Board</b></font>");
				}
		}

	} catch (err) {
		logDebug("Error**CWM_ELP_DPL_ASB_validateFunEstApperLic():" + err.message);
	}

}

/*
@By:debashish.barik
@Dt:6/17/2016
FUNERAL_DIRECTORS_FUNCTIONS
*/
function CWM_ELP_DPL_WTUA_Type3_attestationCheckFA() {
	try {
		if (wfTask == "Validate" && matches(wfStatus, "Approved", "Approved with Conditions")) {
			var vParentLicCapID = getParentLicenseRecord(capId);
			if (vParentLicCapID && vParentLicCapID != null) {
				logDebug("Parent Lic:" + vParentLicCapID.getCustomID());
				setExpirationCustomYear(vParentLicCapID, 1);
				updateAppStatus("Current", "", vParentLicCapID);
				updateTask("License", "Current", "Updated via script.", "Updated via script.", "DPL_LICENSE", vParentLicCapID);
				reportName = "DPL|LICENSE_REGISTRATION_CARD";
				callReport(reportName, false, true, "DPL License Print Set");
			} else {
				logDebug("ohh.!!Some thing wrong!!");
			}
		}
	} catch (err) {
		logDebug("Error** in CWM_ELP_DPL_WTUA_Type3_attestationCheckFA(): " + err.message);
	}
}

/*
Added By Kanhaiya Bhardwaj on 6/29/2016 for RTC#13002
*/
function CWM_ELP_DPL_WTUB_Validate_CheckLicensePresence(){

	try{
			var vEstablismentLicNbr = AInfo["Funeral Establishment License Number"];
			var vSponsorLicNbr = AInfo["Sponsor License Number"];
			
			if(vEstablismentLicNbr == null || vSponsorLicNbr== null)
			{
				cancel =true;
				showMessage = true;
				comment("The fields Funeral Establishment License Number and Sponsor License Number must have a value before approving this application.");
			}
	} catch (err) {
		cancel = true;
		showMessage = true;
		comment("Error on ASB function CWM_ELP_DPL_WTUB_Validate_CheckLicensePresence, Please contact administrator : " + err.message);
	}
}//END OF FUNCTION: CWM_ELP_DPL_WTUB_Validate_CheckLicensePresence()
/*
WTUA version of CWM_ELP_DPL_ASB_validateFuneralEstablishmentLicenseLinkedToType6
@Chris Louis-Jean
#RTC 12800
 */
function CWM_ELP_DPL_WTUB_validateFELinkedToType6() {
	try {
		var funeralEstLicenseNumber = null;
		var parentLicenseCapId = null;
		var parentLicenseNbr = null;
		var vchildLicNumeric = "";
		var vParentLicNumeric = "";
		useAppSpecificGroupName = true;
		var myAInfo = new Array();
		loadAppSpecific(myAInfo);
		funeralEstLicenseNumber = myAInfo["END EXISTING RELATIONSHIP.Funeral Establishment License Number"];
		parentLicenseNbr = myAInfo["MY LICENSE.License Number"];
		if (parentLicenseNbr != null)
			var vParentLicNumArry = parentLicenseNbr.split("-");
		vParentLicNumeric = vParentLicNumArry[0];
		logDebug("vParentLicNumeric " + vParentLicNumeric);
		parentLicenseCapId = aa.cap.getCapID(parentLicenseNbr).getOutput()
			useAppSpecificGroupName = false;

		if (funeralEstLicenseNumber != null && funeralEstLicenseNumber != "") {
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString();
			if (funeralEstLicenseNumber.indexOf("-") < 0) {
				vchildLicNumeric = funeralEstLicenseNumber;
				funeralEstLicenseNumber = funeralEstLicenseNumber + "-" + "FE" + "-" + "FE";
			}
			var vchildLicNumArry = funeralEstLicenseNumber.split("-");
			vchildLicNumeric = vchildLicNumArry[0];
			logDebug("vchildLicNumeric : " + vchildLicNumeric);
			var funeralEstLicenseNumberCapID = aa.cap.getCapID(funeralEstLicenseNumber).getOutput();
			var funeralEstCapType = aa.cap.getCap(funeralEstLicenseNumberCapID).getOutput().getCapType().toString();
			var licTypeArr = funeralEstCapType.split("/");
			//Get license sub-type
			var licenseType = licTypeArr[2];
			var isValidLicense = false;
			//1)check licenseType is a "Funeral Establishment" and
			//2)the license of the relationship being ended does not have to be in a status of Current.
			if (licenseType != null && licenseType == "Funeral Establishment") {
				logDebug("inside if");
				if (checkRefLpExistsOnLicense(vParentLicNumeric, "EM", "6", vchildLicNumeric, "FE", "FE")) {
					logDebug("FEN");
					isValidLicense = true;
				}
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("<font color='red'><b>The Funeral Establishment License number entered is not a valid license.</b></font>");
			}
		}
	} catch (err) {
		//useAppSpecificGroupName = false;
		cancel = true;
		showMessage = true;
		comment("An error has occurred in CWM_ELP_DPL_WTUB_validateFELinkedToType6:" + err.message);
		comment(err.stack);
	}
} // END OF FUNCTION: CWM_ELP_DPL_WTUB_validateFELinkedToType6

/*1. Validate that this is a current Funeral Establishment license.
 *2.  If NOT, then message licensee/user:  "Funeral Establishment License entered is not Current, please contact the Board".
 *Added by Ankush
 * updated by debashish.barik,RTC#13166
 *
 *FUNERAL_DIRECTORS_FUNCTIONS
 */
function CWM_ELP_DPL_522_ASB_validateFuneralEstablishmentInAddNewRelationshipASI() {
	try {
		//Get AppSpecificInfo details
		//var funeralEstLicenseNumber = getAppSpecific("ADD NEW RELATIONSHIP.Funeral Establishment License Number", capId);
		var funeralEstLicenseNumber = null;
		if (publicUser) // HANDLE ACA PAGEFLOW
		{
			/*var cap = aa.env.getValue('CapModel');
			var currentCapId = cap.getCapID();*/
			useAppSpecificGroupName = true;
			loadAppSpecific4ACA(AInfo);
			funeralEstLicenseNumber = AInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			useAppSpecificGroupName = false;		
                         } 
                        else if (!publicUser) {
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			funeralEstLicenseNumber = myAInfo["ADD NEW RELATIONSHIP.Funeral Establishment License Number"];
			useAppSpecificGroupName = false;
		}
		if (funeralEstLicenseNumber != null && funeralEstLicenseNumber != "") {
			funeralEstLicenseNumber = funeralEstLicenseNumber.toString();
			var isValidLicense = false;
			//1)check licenseType is current and "Funeral Establishment" license
			var vFeLic = getRefLicenseProf(funeralEstLicenseNumber, "FE", "FE");
			var isActive = isLicenseActive(funeralEstLicenseNumber, "FE", "FE");
			if (isActive && vFeLic && (vFeLic.getPolicy() == "Current")) {
				isValidLicense = true;
			}
			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("Funeral Establishment License entered is not Current, please contact the Board.");
			}
		}
	} catch (err) {
		useAppSpecificGroupName = false;
		logDebug("ERROR:Funeral Establishment License entered is not Current, please contact the Board.");
	}
} // END OF FUNCTION: CWM_ELP_DPL_522_ASB_validateFuneralEstablishmentInAddNewRelationshipASI

/*1. Validate that this is a current Type 3 license.
 *2.  If NOT, then message licensee/user:  "Type 3 License entered is not Current, please contact the Board".
 *Added by Ankush
 *updated by debashish.barik, RTC#13166
 *
 *FUNERAL_DIRECTORS_FUNCTIONS
 */
function CWM_ELP_DPL_522_ASB_validateType3LicenseInAddNewRelationshipASI() {
	try {
		var type3SponsorLicenseNumber = null;
		//Get AppSpecificInfo details
		if (publicUser) // HANDLE ACA PAGEFLOW
		{
			useAppSpecificGroupName = true;
			type3SponsorLicenseNumber = AInfo["ADD NEW RELATIONSHIP.Type 3 Sponsor License Number"];
			useAppSpecificGroupName = false;
		} else if (!publicUser) {
			useAppSpecificGroupName = true;
			var myAInfo = new Array();
			loadAppSpecificBefore(myAInfo);
			type3SponsorLicenseNumber = myAInfo["ADD NEW RELATIONSHIP.Type 3 Sponsor License Number"];
			useAppSpecificGroupName = false;
		}
		if (type3SponsorLicenseNumber != null && type3SponsorLicenseNumber != "") {
			type3SponsorLicenseNumber = type3SponsorLicenseNumber.toString();
			var isValidLicense = false;
			//1)check licenseType is current "Type 3" license
			var vType3Lic = getRefLicenseProf(type3SponsorLicenseNumber, "EM", "3");
			var isActive = isLicenseActive(type3SponsorLicenseNumber, "EM", "3");
			if (isActive && vType3Lic && (vType3Lic.getPolicy() == "Current")) {
				isValidLicense = true;
			}

			if (!isValidLicense) {
				cancel = true;
				showMessage = true;
				comment("Type 3 License entered is not Current, please contact the Board.");
			}
		}
	} catch (err) {
		useAppSpecificGroupName = false;
		logDebug("ERROR:Type 3 License entered is not Current, please contact the Board.");
	}
} // END OF FUNCTION: CWM_ELP_DPL_522_ASB_validateType3LicenseInAddNewRelationshipASI

/*
debashish.barik
FUNERAL_DIRECTORS_FUNCTIONS
*/
function CWM_ELP_DPL_WTUA_addFEcontactToApplication() {
	try {
		var licenseNum = getAppSpecific("Funeral Establishment License Number");
		licenseNum = getLPAltId(licenseNum,"FE","FE");
		logDebug("Copy FE contacts from licenseNum: "+licenseNum + " to " + capId.getCustomID());
		if (licenseNum != undefined && licenseNum != null && licenseNum != "") {
			var contactType = "Funeral Establishment";
			var licCapId= aa.cap.getCapID(licenseNum).getOutput();
			if (licCapId) {
				copyContactsByCapContactTypeWithASI(licCapId, capId, contactType, contactType, null, licenseNum);
			}
		}
	} catch (err) {
		logDebug("Error on CWM_ELP_DPL_WTUA_addFEcontactToApplication, Please contact administrator" + err.Message);
	}
}
// added by Ankush Kshirsagar for CR456
function CWM_ELP_456_ACA_ASIPageFlowSkipPage(){
	try{
		var myAInfo = new Array();
		loadAppSpecific4ACA(myAInfo);		
		var vTotalNumberOfPreNeeds = myAInfo["Total number of pre-need funeral contracts to which the funeral home is a party"];

		if(vTotalNumberOfPreNeeds == "0" || vTotalNumberOfPreNeeds == 0){
			// Goto Page 4. "E-signature" Page
			aa.env.setValue("ReturnData", "{'PageFlow': {'StepNumber': '2', 'PageNumber':'1'}}"); 
		}
	}catch(err){
		logDebug("Error in function CWM_ELP_456_ACA_ASIPageFlowSkipPage message: "+err.message);
	}	
}//END OF FUNCTION: CWM_ELP_456_ACA_ASIPageFlowSkipPage
//ADDED BY Ankush ON 08/22/2016. CR456
function CWM_ELP_456_DPL_ASB_ACA_CheckMinRowCompaniesHoldingFunds()
{

	var ownershipRow = 0;	
	var minRows = 1;
	var flag = 0;

	try 
	{
		if(!publicUser){
			loadASITablesBefore();
		}else if(publicUser){
		  loadASITForACA();
		}
		ownershipRow = COMPANIESHOLDINGFUNDS.length;

		//comment("Number of ownershipRow: "+COMPANIESHOLDINGFUNDS[0]["License Number"]);
		for(x in COMPANIESHOLDINGFUNDS){
			var col1 = COMPANIESHOLDINGFUNDS[x]["Name"];
			var col2 = COMPANIESHOLDINGFUNDS[x]["Address"];		
			var col3 = COMPANIESHOLDINGFUNDS[x]["Funding Method"];		
			if((col1.length() != 0) || (col2.length()!=0) || (col3.length() != 0)){
			   flag = 1;
			}
		}
	} 
	catch (ex) 
	{
		if (ownershipRow < minRows) 
		{
			flag = 0;
		}
	}
	if(flag == 0){
		cancel = true;
		showMessage = true;
		comment("You must enter at least one company holding funds.");
	}
	
}//END OF FUNCTION: CWM_ELP_456_DPL_ASB_ACA_CheckMinRowCompaniesHoldingFunds
//ADDED BY Ankush ON 08/22/2016 CR456
function CWM_ELP_456_DPL_ASB_ACA_CheckMinRowLocationofContracts()
{

	var ownershipRow = 0;	
	var minRows = 1;
	var flag = 0;

	try 
	{
		if(!publicUser){
			loadASITablesBefore();
		}else if(publicUser){
		  loadASITForACA();
		}
		ownershipRow = LOCATIONOFCONTRACTS.length;

		//comment("Number of ownershipRow: "+LOCATIONOFCONTRACTS[0]["License Number"]);
		for(x in LOCATIONOFCONTRACTS){
			var col1 = LOCATIONOFCONTRACTS[x]["Location of Contracts and Arrangements"];	
			if((col1.length() != 0)){
			   flag = 1;
			}
		}
	} 
	catch (ex) 
	{
		if (ownershipRow < minRows) 
		{
			flag = 0;
		}
	}
	if(flag == 0){
		cancel = true;
		showMessage = true;
		comment("You must enter at least one location of contracts.");
	}
	
}//END OF FUNCTION: CWM_ELP_456_DPL_ASB_ACA_CheckMinRowLocationofContracts
//Added by Ankus for CR456
function CWM_ELP_456_DPL_WTUA_addPreNeedsContractsAsitRow(licId){
    try{
        logDebug("Calling CWM_ELP_456_DPL_WTUA_addPreNeedsContractsAsitRow()");
		var tableName = "PRE-NEEDS CONTRACTS";
        var sourceTable = loadASITable("PRE-NEEDS CONTRACTS", licId); //Pre-Needs Contracts
        //var targetTable = loadASITable("PRE-NEEDS CONTRACTS", licId);
        var masterArray = new Array();
        var elementArray = null;
        
        for (row in sourceTable){
            elementArray = new Array();
            elementArray["Year"] = sourceTable[row]["Year"];
            elementArray["Total number of pre-need funeral contracts to which the funeral home is a party"] = sourceTable[row]["Total number of pre-need funeral contracts to which the funeral home is a party"];
            elementArray["The number of pre-need contracts entered into during the preceding calendar year"] = sourceTable[row]["The number of pre-need contracts entered into during the preceding calendar year"];
            elementArray["Number of pre-need contracts fulfilled"] = sourceTable[row]["Number of pre-need contracts fulfilled"];
            elementArray["The number of pre-need contracts transferred to another funeral home"] = sourceTable[row]["The number of pre-need contracts transferred to another funeral home"];
            elementArray["The number of pre-need contracts cancelled"] = sourceTable[row]["The number of pre-need contracts cancelled"];
            masterArray.push(elementArray);
        }
		elementArray = new Array();
		elementArray["Year"] = String(getAppSpecific("Year"));
		elementArray["Total number of pre-need funeral contracts to which the funeral home is a party"] = String(getAppSpecific("Total number of pre-need funeral contracts to which the funeral home is a party"));
		elementArray["The number of pre-need contracts entered into during the preceding calendar year"] = String(getAppSpecific("The number of pre-need contracts entered into during the preceding calendar year"));
		elementArray["Number of pre-need contracts fulfilled"] = String(getAppSpecific("Number of pre-need contracts fulfilled"));
		elementArray["The number of pre-need contracts transferred to another funeral home"] = String(getAppSpecific("The number of pre-need contracts transferred to another funeral home"));
		elementArray["The number of pre-need contracts cancelled"] = String(getAppSpecific("The number of pre-need contracts cancelled"));
		masterArray.push(elementArray);		
        removeASITable(tableName, licId);
        addASITable("PRE-NEEDS CONTRACTS", masterArray, licId);
    }
    catch(err){
        //showMessage = true;
        logDebug("ERROR CWM_ELP_456_DPL_WTUA_addPreNeedsContractsAsitRow(). Err: " + err);
    }
}//END CWM_ELP_456_DPL_WTUA_addPreNeedsContractsAsitRow
//Added by Ankus for CR456
function CWM_ELP_456_DPL_WTUA_copyBankingInstitutionsASIT(licId){
    try{
        logDebug("Calling CWM_ELP_456_DPL_WTUA_copyBankingInstitutionsASIT()");
        var sourceTable = loadASITable("BANKING INSTITUTIONS", capId);
        //var targetTable = loadASITable("BANKING INSTITUTIONS", licId);
        var masterArray = new Array();
        var elementArray = null;
        
        for (row in sourceTable){
            elementArray = new Array();
            elementArray["Institution Name"] = sourceTable[row]["Institution Name"];
            elementArray["Account number"] = sourceTable[row]["Account number"];
            masterArray.push(elementArray);
        }
        removeASITable("BANKING INSTITUTIONS", licId);
        addASITable("BANKING INSTITUTIONS", masterArray, licId);
    }
    catch(err){
        //showMessage = true;
        logDebug("ERROR in CWM_ELP_456_DPL_WTUA_copyBankingInstitutionsASIT(). Err: " + err);
    }
}//END CWM_ELP_456_DPL_WTUA_copyBankingInstitutionsASIT
//Added by Ankus for CR456
function CWM_ELP_456_DPL_WTUA_copyCompaniesHoldingFundsASIT(licId){
    try{
        logDebug("Calling CWM_ELP_456_DPL_WTUA_copyCompaniesHoldingFundsASIT()");
        var sourceTable = loadASITable("COMPANIES HOLDING FUNDS", capId);
        //var targetTable = loadASITable("COMPANIES HOLDING FUNDS", licId);
        var masterArray = new Array();
        var elementArray = null;
        
        for (row in sourceTable){
            elementArray = new Array();
            elementArray["Name"] = sourceTable[row]["Name"];
            elementArray["Address"] = sourceTable[row]["Address"];
            elementArray["Funding Method"] = sourceTable[row]["Funding Method"];
            masterArray.push(elementArray);
        }
        removeASITable("COMPANIES HOLDING FUNDS", licId);
        addASITable("COMPANIES HOLDING FUNDS", masterArray, licId);
    }
    catch(err){
        //showMessage = true;
        logDebug("ERROR in CWM_ELP_456_DPL_WTUA_copyCompaniesHoldingFundsASIT(). Err: " + err);
    }
}//END CWM_ELP_456_DPL_WTUA_copyCompaniesHoldingFundsASIT
//Added by Ankus for CR456
function CWM_ELP_456_DPL_WTUA_copyLocationofContractsASIT(licId){
    try{
        logDebug("Calling CWM_ELP_456_DPL_WTUA_copyLocationofContractsASIT()");
        var sourceTable = loadASITable("LOCATION OF CONTRACTS", capId);
        //var targetTable = loadASITable("LOCATION OF CONTRACTS", licId);
        var masterArray = new Array();
        var elementArray = null;
        
        for (row in sourceTable){
            elementArray = new Array();
            elementArray["Location of Contracts and Arrangements"] = sourceTable[row]["Location of Contracts and Arrangements"];            
            masterArray.push(elementArray);
        }
        removeASITable("LOCATION OF CONTRACTS", licId);
        addASITable("LOCATION OF CONTRACTS", masterArray, licId);
    }
    catch(err){
        //showMessage = true;
        logDebug("ERROR in CWM_ELP_456_DPL_WTUA_copyLocationofContractsASIT(). Err: " + err);
    }
}//END CWM_ELP_456_DPL_WTUA_copyLocationofContractsASIT
//Added by Ankus for CR456
function CWM_ELP_456_DPL_WTUA_updatePreNeedsContractsAsitRow(licId){
    try{
        logDebug("Calling CWM_ELP_456_DPL_WTUA_updatePreNeedsContractsAsitRow()");
		var tableName = "PRE-NEEDS CONTRACTS";
        var sourceTable = loadASITable("PRE-NEEDS CONTRACTS", licId); //Pre-Needs Contracts
        //var targetTable = loadASITable("PRE-NEEDS CONTRACTS", licId);
        var masterArray = new Array();
        var elementArray = null;
        
        for (row in sourceTable){
            elementArray = new Array();
			if(String(sourceTable[row]["Year"]) == String(getAppSpecific("Year"))){
				//logDebug(sourceTable[row]["Year"] + String(getAppSpecific("Year")));
				elementArray["Year"] = String(getAppSpecific("Year"));
				elementArray["Total number of pre-need funeral contracts to which the funeral home is a party"] = String(getAppSpecific("Total number of pre-need funeral contracts to which the funeral home is a party"));
				elementArray["The number of pre-need contracts entered into during the preceding calendar year"] = String(getAppSpecific("The number of pre-need contracts entered into during the preceding calendar year"));
				elementArray["Number of pre-need contracts fulfilled"] = String(getAppSpecific("Number of pre-need contracts fulfilled"));
				elementArray["The number of pre-need contracts transferred to another funeral home"] = String(getAppSpecific("The number of pre-need contracts transferred to another funeral home"));
				elementArray["The number of pre-need contracts cancelled"] = String(getAppSpecific("The number of pre-need contracts cancelled"));
			}else{
				elementArray["Year"] = sourceTable[row]["Year"];
				elementArray["Total number of pre-need funeral contracts to which the funeral home is a party"] = sourceTable[row]["Total number of pre-need funeral contracts to which the funeral home is a party"];
				elementArray["The number of pre-need contracts entered into during the preceding calendar year"] = sourceTable[row]["The number of pre-need contracts entered into during the preceding calendar year"];
				elementArray["Number of pre-need contracts fulfilled"] = sourceTable[row]["Number of pre-need contracts fulfilled"];
				elementArray["The number of pre-need contracts transferred to another funeral home"] = sourceTable[row]["The number of pre-need contracts transferred to another funeral home"];
				elementArray["The number of pre-need contracts cancelled"] = sourceTable[row]["The number of pre-need contracts cancelled"];
			}
            masterArray.push(elementArray);
        }
        removeASITable(tableName, licId);
        addASITable("PRE-NEEDS CONTRACTS", masterArray, licId);
    }
    catch(err){
        //showMessage = true;
        logDebug("ERROR CWM_ELP_456_DPL_WTUA_updatePreNeedsContractsAsitRow(). Err: " + err);
    }
}//END CWM_ELP_456_DPL_WTUA_updatePreNeedsContractsAsitRow

function isAssociateToLP(vcapId, vLP)
{
try{
    var flag = false;
    var profLicenseCapId = aa.licenseProfessional.getLicensedProfessionalsByCapID(capId);
    var profLicense = profLicenseCapId.getOutput();
    for (var counter in profLicense)
    {
        var thisProfLicense = profLicense[counter];
        var licNumber = thisProfLicense.getLicenseNbr() + "-"+thisProfLicense.getComment() +"-"+ thisProfLicense.getBusinessLicense();
         if (vLP == licNumber)
           {
                logDebug("Already associated to capID");
                flag = true;
                break;
           }
      }
      
      return flag;
      }
  catch(ex)
  {
    logDebug ("Error in isAssociateToLP : -" + ex);
  }
}

function updateB3contraTableForFEAmendmentwithEntityName(associatedCapId,entityName)
{
	logDebug("Updating B3CONTRA for  : "+associatedCapId);
	var licenseRecordId = associatedCapId.getCustomID();
	logDebug("licenseRecordId  : "+licenseRecordId);
	var scanner = licenseRecordId.split("-");
	var b1LicNbr = scanner[0];
	var boardCode = scanner[1];
	var typeClass = scanner[2];
		

	var capLpsB3contra = getLicenseProfessional(associatedCapId);
	for (var thisCapLpNum in capLpsB3contra) 
	{
		var b3ContraObj = capLpsB3contra[thisCapLpNum];
		var licNbrB3contra = capLpsB3contra[thisCapLpNum].getLicenseNbr();
		var boardCodeB3contra = capLpsB3contra[thisCapLpNum].getComment();
		var typeClassB3Contra = capLpsB3contra[thisCapLpNum].getBusinessLicense();
		
		if(((b1LicNbr == licNbrB3contra) && (boardCode == boardCodeB3contra) && (typeClass == typeClassB3Contra) )||
		((b1LicNbr+"-"+typeClass == licNbrB3contra+"-"+typeClassB3Contra) && (boardCode == boardCodeB3contra) && (typeClass == typeClassB3Contra) ))
		{
			logDebug("Updating LP : "+licNbrB3contra);
			//b3ContraObj.setWorkCompExempt("N");
			b3ContraObj.setBusinessName(entityName);
			var result = aa.licenseProfessional.editLicensedProfessional(b3ContraObj);
			logDebug("Entity name on B3contra Updated");
			
		} 
	} 
}

function CWM_ELP_Defect1515_DPL_AddEntityNameToLPforNewAddedLicense()
{
var myTable = loadASITable("RELATIONSHIP APPROVAL", capId);
for (x in myTable) {
try
{
			var vChangeType = myTable[x]["Change Type"];
			var vChildLicense = myTable[x]["License Number"];
			logDebug("vChildLicense "+vChildLicense);
			logDebug("vChangeType "+vChangeType);
			if (vChildLicense != null && vChildLicense != "") {
				vChildLicense = vChildLicense.toString();
				if (vChildLicense.indexOf("-") == -1) {
				vChildLicense = vChildLicense + "-" + "FE" + "-" + "FE";
				}
			}
	var vChildRecordCap = aa.cap.getCapID(vChildLicense).getOutput();

	if(vChangeType=="Add"){
	var capContactResult = aa.people.getCapContactByCapID(vChildRecordCap);
	var pFromContactType = "Funeral Establishment";
	var entityName="";
	var vParentLicense = getParent().getCustomID();//AInfo["License Number"];
	logDebug("vParentLicense: "+vParentLicense);
	if (vParentLicense != null && vParentLicense.indexOf("-") == -1) {
					vParentLicense = vParentLicense + "-" + "FE" + "-" + "FE";
					vParentLicense = vParentLicense.toString();
				}
	var vParentRecordCap = aa.cap.getCapID(vParentLicense).getOutput();
	if (capContactResult.getSuccess())
		{
			var Contacts = capContactResult.getOutput();
			for (yy in Contacts)
			  {
			  if(Contacts[yy].getCapContactModel().getContactType() == pFromContactType)
				{
					
					var newContact = Contacts[yy].getCapContactModel();
					var newPeople = newContact.getPeople();
					entityName=newPeople.getBusinessName();
					logDebug("Entity Name on added License: "+entityName);
				}									  
			  }
		}
	var lp = getRefLicenseProf(vParentLicense);
	logDebug(lp);
		if (lp)
			{
				lp.setBusinessName(entityName);
				var result = aa.licenseScript.editRefLicenseProf(lp);
					if(result.getSuccess())
						logDebug("Entity name on LP Updated");
			}
			
			updateB3contraTableForFEAmendmentwithEntityName(vParentRecordCap,entityName);
			
		}
}

catch(ex)
{
cancel=true;
showMessage=true;
logDebug(ex.message);
}

	}
}
