/*
 *
 * ASA;License!~!~!Renewal.js
 *
 */

var vNoOfCons = 0;
var vContactsSR = aa.people.getCapContactByCapID(capId);
if (vContactsSR && vContactsSR.getSuccess()) {
	var vContacts = vContactsSR.getOutput();
	vNoOfCons = vContacts.length;
	logDebug("Contacts Length" + vNoOfCons);
}
var vFisrtTimeASA = false;
if (!publicUser || vNoOfCons == 0)
	vFisrtTimeASA = true;
logDebug("FIRST TIME ACA" + vFisrtTimeASA);
if (vFisrtTimeASA)
	aa.runScript("APPLICATIONSUBMITAFTER4RENEW");

var vParentCapID = getParentLicenseCapID(capId);
if (vParentCapID) {
	var vParentCap = aa.cap.getCap(vParentCapID).getOutput();
	var vParentCapModel = vParentCap.getCapModel();
	var vCreatedBy = vParentCapModel.getCreatedBy();
	var vAccessByACA = vParentCapModel.getAccessByACA();
	if (vCreatedBy) {
		editCreatedBy(vCreatedBy, capId);
		if (vCreatedBy.length() > 9 && vCreatedBy.substring(0, 10) == "PUBLICUSER" && (!vAccessByACA || vAccessByACA == "Y")) {
			var vCapModel = aa.cap.getCap(capId).getOutput().getCapModel();
			vCapModel.setAccessByACA("Y");
			aa.cap.editCapByPK(vCapModel);
		}
	}
	var capResult = aa.cap.getCap(capId);
	if (!capResult.getSuccess()) {
		logDebug("getCap error: " + capResult.getErrorMessage());
	}

	var cap = capResult.getOutput();
	var appTypeResult = cap.getCapType();
	var appTypeString = appTypeResult.toString();
	var appTypeArray = appTypeString.split("/");
	var licenseType = appTypeArray[1];
	var licenseSubType = appTypeArray[2];
	if (licenseSubType == "Electrology Instructor") {
		var myParentCapID = getParentCapID4Renewal(capId);
		var vElecLic = getAppSpecific("Electrologist License Number", myParentCapID)
			aa.print("Electrologist License Number:" + vElecLic);
		var lp = getRefLicenseProf(vElecLic, "ET", "1");
		if (lp) {
			var lpdate = lp.getLicenseExpirationDate();
			var lpExpDate = lpdate.getMonth() + "/" + lpdate.getDayOfMonth() + "/" + lpdate.getYear();
			var lpStatus = lp.getPolicy();
			var lpLicNum = lp.getStateLicense();
			editAppSpecific("Electrologist License Number", lpLicNum, capId);
			editAppSpecific("Electrologist License Expiration Date", lpExpDate, capId);
			editAppSpecific("Electrologist License Status", lpStatus, capId);
		}
	}
	if (licenseSubType == "Physical Therapy Facility" || (licenseType == "Cosmetology" && licenseSubType == "Shop")) {
		copyLicenseNbrToASI(vParentCapID, capId);
	}
	if (licenseSubType == "Physical Therapy Facility") {
		CWM_ELP_DPL_Defect10621_addEmployeeInfo(vParentCapID, capId);
	}
	if (vFisrtTimeASA) {
		//if(!publicUser)

		// removeContactsFromCap(capId);
		// copyContactsWithAddress(vParentCapID, capId);
		copySpecificASITables(vParentCapID, capId, "DUPLICATE LICENSE HISTORY")
		//copyAppSpecificTable(vParentCapID, capId);

		//to copy Diffetent ASIT fields form License to Renewal
		if (appMatch("License/Chiropractor/Chiropractor Facility/Renewal")) {
			var ASITtableName = "EMPLOYEE INFORMATION";
			copyDiffASITforChiroFacilityLicenseToRenewal(vParentCapID, capId, ASITtableName);
		}

		//Added BY Sameer
		//Defect 2558, this code should be applicable only for AA applications and hence condition is applied accordingly.

		// Commented out by JCollado - Contact Copy w/Address now occurs in APPLICATIONSUBMITAFTER4RENEW
		//Uncommented by Aditi for defect 10265. Code has not been moved to APPLICATIONSUBMITAFTER4RENEW.

		// Begin - ETW - EPAWS-946, EPAWS-1010, commented out to remove duplicate address defect
		//if (vParentCapID) {
		//	removeContactsFromCap(capId);
		//	copyContactsWithAddress(vParentCapID, capId);
		//}
		// Begin - ETW - EPAWS-946, EPAWS-1010
	}
}

//Added by Sameer to add renewal fee on DPL records
//if (!publicUser)
addDPLRenewalFee();

setContactsSyncFlag("N");

//Added by Sameer to invoice Late fee added through batch job - BATCH_DPL SET LAPSED STATUS
//-------------------------------- START ---------------------------------------------
if (!publicUser) {
	var lateFeeCodeArray = new Array();
	lateFeeCodeArray.push("SMRL");
	lateFeeCodeArray.push("VTLR");
	lateFeeCodeArray.push("RALR");
	lateFeeCodeArray.push("PLLR");
	lateFeeCodeArray.push("ELLR");
	lateFeeCodeArray.push("HOLR");
	lateFeeCodeArray.push("RELR");
	lateFeeCodeArray.push("ENLR");
	lateFeeCodeArray.push("NULR");
	lateFeeCodeArray.push("PYLR");
	lateFeeCodeArray.push("ARLF");
	lateFeeCodeArray.push("BRLF");
	lateFeeCodeArray.push("CALF");
	lateFeeCodeArray.push("CHLF");
	lateFeeCodeArray.push("DOLF");
	lateFeeCodeArray.push("DWLF");
	lateFeeCodeArray.push("ETLF");
	lateFeeCodeArray.push("HELF");
	lateFeeCodeArray.push("HILF");
	lateFeeCodeArray.push("HOLR");
	lateFeeCodeArray.push("LALF");
	lateFeeCodeArray.push("MHLF");
	lateFeeCodeArray.push("MTLF");
	lateFeeCodeArray.push("OPLF");
	lateFeeCodeArray.push("PDLF");
	lateFeeCodeArray.push("SALF");
	lateFeeCodeArray.push("SPLF");
	lateFeeCodeArray.push("SWLF");
	lateFeeCodeArray.push("HDLF");
	lateFeeCodeArray.push("HSRN");

	for (ii in lateFeeCodeArray) {
		if (feeExists(lateFeeCodeArray[ii])) {
			invoiceFee(lateFeeCodeArray[ii], "STANDARD")
		}
	}
}
//-------------------------------- END ------------------------------------------------


function removeContactsFromCap(recordCapId) {

	var cons = aa.people.getCapContactByCapID(recordCapId).getOutput();
	for (x in cons) {
		conSeqNum = cons[x].getPeople().getContactSeqNumber();
		if (conSeqNum) {
			aa.people.removeCapContact(recordCapId, conSeqNum);
		}
	}

}

function copyContactsWithAddress(pFromCapId, pToCapId) {
	// Copies all contacts from pFromCapId to pToCapId and includes Contact Address objects
	//
	if (pToCapId == null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
	var copied = 0;
	if (capContactResult.getSuccess()) {
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts) {
			var newContact = Contacts[yy].getCapContactModel();

			var newPeople = newContact.getPeople();
			// aa.print("Seq " + newPeople.getContactSeqNumber());

			var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
			newContact.setCapID(vToCapId);
			var vCType = newContact.getContactType();
			//Defect 10265
			if (vCType == "Licensed Individual") {
				//logDebugAndEmail("Lic Ind contact type");
				if (!((appMatch("License/Plumbers and Gas Fitters/Gas Fitter Business/Renewal", vToCapId)) || (appMatch("License/Plumbers and Gas Fitters/Business/Renewal", vToCapId)) || (appMatch("License/Plumbers and Gas Fitters/Products/Renewal", vToCapId)) || (appMatch("License/Real Estate Appraiser/Course/Renewal", vToCapId)) || (appMatch("License/Real Estate/Business/Renewal", vToCapId)) || (appMatch("License/Real Estate/School/Renewal", vToCapId)) || (appMatch("License/Sheet Metal/Business License/Renewal", vToCapId)) || (appMatch("License/Sheet Metal/School/Renewal", vToCapId)) || (appMatch("License/Allied Mental Health/Educational Psychologist/License")))) {
					//logDebugAndEmail("Setting component name to applicant");
					newContact.setComponentName("Applicant");
				}
			} else if (vCType == "Business" && (appMatch("License/Sheet Metal/Business License/Renewal", vToCapId) || appMatch("License/Barbers/Shop/Renewal", vToCapId) || appMatch("License/Real Estate/Business/Renewal", vToCapId))) {
				newContact.setComponentName("Contact1");
			} else if (appMatch("License/Massage Therapy/Multiple Massage Establishment/Renewal", vToCapId) || appMatch("License/Massage Therapy/Solo Massage Establishment/Renewal", vToCapId)) {
				if (vCType == "Massage Therapy Establishment") {
					newContact.setComponentName("Contact1");
				} else if (vCType == "MT Compliance Officer") {
					newContact.setComponentName("Applicant");
				} else if (vCType == "Solo Massage Therapist") {
					newContact.setComponentName("Applicant");
				} else if (vCType == "Establishment Operator") {
					newContact.setComponentName("Contact2");
				} else if (vCType == "Establishment Owner") {
					newContact.setComponentName("Contact3");
				}

			} else if (appMatch("License/Chiropractor/Chiropractor Facility/Renewal", vToCapId)) {
				if (vCType == "Business") {
					newContact.setComponentName("Contact1");
				} else if (vCType == "Business Principal") {
					newContact.setComponentName("Contact3");
				} else if (vCType == "Business Entity Owner") {
					newContact.setComponentName("Contact2");
				} else if (vCType == "Chiropractor of Record") {
					newContact.setComponentName("Applicant");
				}

			} else if (appMatch("License/Allied Health/Physical Therapy Facility/Renewal", vToCapId)) {
				if (vCType == "Business") {
					newContact.setComponentName("Contact1");
				} else if (vCType == "Business Principal") {
					newContact.setComponentName("Contact3");
				} else if (vCType == "Business Entity Owner") {
					newContact.setComponentName("Contact2");
				} else if (vCType == "PT Compliance Officer") {
					newContact.setComponentName("Applicant");
				}

			} else if (appMatch("License/Electrology/Electrology School/Renewal", vToCapId)) {
				if (vCType == "School") {
					newContact.setComponentName("Contact1");
				} else if (vCType == "Primary Owner") {
					newContact.setComponentName("Contact2");
				} else if (vCType == "School Director(Individual)") {
					newContact.setComponentName("Contact3");
				}

			} else if (appMatch("License/Cosmetology/Aesthetician School/License", vToCapId)) {
				if (vCType == "School") {
					newContact.setComponentName("Contact1");
				}
			} else if (appMatch("License/Cosmetology/Advanced Training Institute/Renewal", vToCapId)) {
				if (vCType == "School") {
					newContact.setComponentName("Contact1");
				}
			} else if (appMatch("License/Funeral Directors/*/Renewal", vToCapId)) {
				if (appMatch("License/Funeral Directors/Embalmer Apprentice/Renewal", vToCapId)) {
					if (vCType == "Licensed Individual") {
						newContact.setComponentName("Applicant");
					} else if (vCType == "Sponsor") {
						newContact.setComponentName("Contact1");
					} else if (vCType == "Funeral Establishment") {
						newContact.setComponentName("Contact2");
					}
				} else {

					if (vCType == "Licensed Individual") {
						newContact.setComponentName("Applicant");
					} else if (vCType == "Funeral Establishment") {
						newContact.setComponentName("Contact1");
					}
				}
			}

			aa.people.createCapContact(newContact);
			aa.people.editCapContactWithAttribute(newContact);

			newerPeople = newContact.getPeople();
			// contact address copying
			if (addressList) {
				for (add in addressList) {
					var transactionAddress = false;
					contactAddressModel = addressList[add].getContactAddressModel();
					if (contactAddressModel.getEntityType() == "CAP_CONTACT") {
						transactionAddress = true;
						contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
					}
					// Commit if transaction contact address
					if (transactionAddress) {
						var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
						contactAddressModel.setContactAddressPK(newPK);
						aa.address.createCapContactAddress(vToCapId, contactAddressModel);
					}
					// Commit if reference contact address
					else {
						// build model
						var Xref = aa.address.createXRefContactAddressModel().getOutput();
						Xref.setContactAddressModel(contactAddressModel);
						Xref.setAddressID(addressList[add].getAddressID());
						Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
						Xref.setEntityType(contactAddressModel.getEntityType());
						Xref.setCapID(vToCapId);
						// commit address
						aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
					}

				}
			}
			// end if
			copied++;
			logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
		}
	} else {
		logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
		return false;
	}
	return copied;
}

if (appMatch("License/Public Accountancy/CPA/Renewal")) {
	try {
		var capIDModel = new com.accela.aa.emse.dom.CapIDScriptModel(capId);
		var CEArr = new Array();

		var CERes = aa.continuingEducation.getContEducationList(capIDModel).getOutput();

		if (CERes) {
			for (var c in CERes) {
				var rowArr = new Array();
				var CEModel = CERes[c].getContinuingEducationModel();
				var ceTmp = CEModel.getTemplate();
				var ceASI = ceTmp.getTemplateForms();

				for (i = 0; i < ceASI.size(); i++) {
					var template = ceASI.get(i);
					var subGroups = template.getSubgroups();

					for (j = 0; j < subGroups.size(); j++) {
						var subGroup = subGroups.get(j);
						var fields = subGroup.fields;

						for (k = 0; k < fields.size(); k++) {
							var field = fields.get(k);

							if (field.getFieldName() == "Type") {
								CEModel.setClassName(field.defaultValue);
							} else if (field.getFieldName() == "Location") {
								CEModel.setGradingStyle(field.defaultValue);
							} else if (field.getFieldName() == "Continuing Education Course Name/Number") {
								//Sagar : EPLACE-2946 : DPL_PROD_CA_EMSE Operation Failed
								if (field.defaultValue.length() >= 65) {
									var trimedProviderNo = field.defaultValue.substring(0, 64);
									CEModel.setProviderNo(trimedProviderNo);
								} else {
									CEModel.setProviderNo(field.defaultValue);
								}
							}
						}
					}
				}

				var approveModel = new com.accela.aa.emse.dom.ContinuingEducationScriptModel(CEModel, CERes[c].getServiceProviderCode());
				aa.continuingEducation.updateContinuingEducationModel(approveModel);

			}
		}
	} catch (ex) {
		logDebug("Error in CPA : " + ex.message);
	}
}

// JIRA 2620 : Coping Master barber license information to Renewal record
if (appMatch("License/Barbers/Shop/Renewal")) {
	var capLicenseResult = aa.licenseScript.getLicenseProf(vParentCapID);
	if (capLicenseResult.getSuccess()) {
		var capLicenseArr = capLicenseResult.getOutput();
		for (iIter in capLicenseArr) {
			aa.print("------------" + capLicenseArr[iIter].getContactFirstName() + " " + capLicenseArr[iIter].getContactLastName());
			aa.print("------------" + capLicenseArr[iIter].getLicenseNbr() + "-" + capLicenseArr[iIter].getComment() + "-" + capLicenseArr[iIter].getBusinessLicense());
			if ("M" == capLicenseArr[iIter].getBusinessLicense() && "BR" == capLicenseArr[iIter].getComment()) {
				if (getAppSpecific("Master Barber License Number", capId) == null) {
					var masterBarbderLicenseName = capLicenseArr[iIter].getContactFirstName() + " " + capLicenseArr[iIter].getContactLastName();
					var masterBarberLicense = capLicenseArr[iIter].getLicenseNbr() + "-" + capLicenseArr[iIter].getComment() + "-" + capLicenseArr[iIter].getBusinessLicense();
					editAppSpecific("Master Barber License Number", masterBarberLicense, capId);
					editAppSpecific("Master Barber Name", masterBarbderLicenseName, capId);
				}

			}
		}
	}
}
// JIRA 2620 : Copied Master barber license information to Renewal record

// ADDDED FOR DEFECT JIRA 2374
// LINKS PARENT LICENSE TO RENEWAL

/*try{
var licCapId = getParentCapID4Renewal(capId);
logDebug("licCapId: "+licCapId);
logDebug("Renewal id: " + capId.getCustomID());
logDebug("License id: " + licCapId.getCustomID());
if (licCapId) {
refLP = getRefLicenseProf(licCapId.getCustomID());
logDebug("refLP: "+refLP);

if (refLP)
{
associateLpWithCap(refLP, capId)
}
else
{
logDebug("not able to identify Reference LP for: " + licCapId.getCustomID())
}

}
else
{
logDebug("cannot find Parent for:" + capId.getCustomID());
}
}
catch(ex)
{
logDebug("ERROR ** while linking Renewal to Parent License");
}*/
