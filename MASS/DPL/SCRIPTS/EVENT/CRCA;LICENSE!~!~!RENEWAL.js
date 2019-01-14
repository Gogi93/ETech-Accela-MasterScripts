/*
*
* CRCA;License!~!~!Renewal.js
*
*/

logDebug("CRCA;License!~!~!Renewal begin.");
logMessage("CRCA;License!~!~!Renewal begin.");
aa.cap.updateAccessByACA(capId, "Y");
//Added by Sameer to add renewal fee on DPL records
//Removed by Tony L.  It was adding an extra fee in ACA, the one for AA is being called in ASA.
if (!publicUser)
addDPLRenewalFee();

if (publicUser)
	processRenewal(capId);

aa.runScript("CONVERTTOREALCAPAFTER4RENEW");

logDebug("CRCA;License!~!~!Renewal end.");
logMessage("CRCA;License!~!~!Renewal end.");
parentCapId = getParentCapID4Renewal(capId);
if (appMatch("License/Sheet Metal/Apprentice/Renewal"))
{
	copyContactsByTypeWithAddress(parentCapId, capId, "Master Licensee");
	copyLicensedProf(parentCapId, capId);
}


// ADDDED FOR DEFECT JIRA 2374
// LINKS PARENT LICENSE TO RENEWAL
//Sagar: EPLACE-2853 : Unique constraint errors in Citizen Access 
//Added check to associate LP With Cap only for ACA users
if(publicUser)
{
	try {
		var licCapId = getParentCapID4Renewal(capId);
		logDebug("licCapId: " + licCapId);
		logDebug("Renewal id: " + capId.getCustomID());
		logDebug("License id: " + licCapId.getCustomID());
		if (licCapId) {
			refLP = getRefLicenseProf(licCapId.getCustomID());
			logDebug("refLP: " + refLP);

			if (refLP) {
				associateLpWithCap(refLP, capId)
			} else {
				logDebug("not able to identify Reference LP for: " + licCapId.getCustomID())
			}

		} else {
			logDebug("cannot find Parent for:" + capId.getCustomID());
		}
	} catch (ex) {
		logDebug("ERROR ** while linking Renewal to Parent License :: "+ex.message);
	}
}

//Added by Sameer to invoice Late fee added through batch job - BATCH_DPL SET LAPSED STATUS
//-------------------------------- START ---------------------------------------------
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

//JIRA: 2331
if (publicUser)
for ( ii in lateFeeCodeArray)
{
	if (feeExists(lateFeeCodeArray[ii])) 
	{
		invoiceFee(lateFeeCodeArray[ii], "STANDARD")
	}
}
//-------------------------------- END ------------------------------------------------

// This code is to add the cover letter to SET and Email to applicants
if (publicUser)
{
	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess())
	{
		capContactResult = capContactResult.getOutput();
		aa.print(capContactResult.length);
		for (yy in capContactResult)
		{
			thisCapContact = capContactResult[yy];
			thisPeople = thisCapContact.getPeople();
			aa.print(thisPeople.email);
			aa.print(thisPeople.primaryFlag);
			aa.print(thisPeople);

			var contacttype = thisPeople.getContactType();
			if (appMatch("License/Sheet Metal/Business License/Renewal") || appMatch("License/Sheet Metal/School/Renewal"))
			{
				if (thisPeople.email != null && validEmail(thisPeople.email) && contacttype == "Business")
				{
					var myHashMap=aa.util.newHashMap();
					myHashMap.put("ALT_ID", capId.getCustomID());
					var fvEmailParameters = aa.util.newHashtable();
					var vACAUrl = lookup("ACA_SITE","dpl site");
					//vACAUrl = vACAUrl.split("/admin")[0];
					fvEmailParameters.put("$$ACA_LINK$$",vACAUrl);
					sendReportByEmailTemplate("Document_Submission_Cover_Sheet", myHashMap, sysFromEmail, thisPeople.email, "", "ACA_COVER_SHEET_EMAIL", fvEmailParameters, "License", "ADMIN")
				}
			}
			else if (thisPeople.email != null && validEmail(thisPeople.email) && contacttype == "Applicant")
			{  
				var myHashMap=aa.util.newHashMap();
				myHashMap.put("ALT_ID", capId.getCustomID());
				var fvEmailParameters = aa.util.newHashtable();
				var vACAUrl = lookup("ACA_SITE","dpl site");
				//vACAUrl = vACAUrl.split("/admin")[0];
				fvEmailParameters.put("$$ACA_LINK$$",vACAUrl);
				sendReportByEmailTemplate("Document_Submission_Cover_Sheet", myHashMap, sysFromEmail, thisPeople.email, "", "ACA_COVER_SHEET_EMAIL", fvEmailParameters, "License", "ADMIN")
			}
		}
	}
}

setContactsSyncFlag("N");

// Begin - ETW - EPAWS-1194, updated to not save "Submitted" status for TMP records
var vStatus = getRecordStatus(capId);
if ((vStatus == null || vStatus == "") && capId.getCustomID().indexOf("TMP") == -1 && capId.getCustomID().indexOf("EST") == -1) {
	editCapStatus(capId, "Submitted");
}

function editCapStatus(pCapId, pStatus) {
	var vCap = aa.cap.getCap(pCapId);
	var vSaveResult;
	if (!vCap.getSuccess()) {
		return false;
	} else {
		vCap = vCap.getOutput().getCapModel();
		vCap.setCapStatus(pStatus);
		vSaveResult = aa.cap.editCapByPK(vCap);
		if (!vSaveResult.getSuccess()) {
			return false;
		} else {
			return true;
		}
	}
}


function getRecordStatus(pCapId) {
	var recordStatusResult = aa.cap.getCap(pCapId);
	if (!recordStatusResult.getSuccess()) {
		logDebug("**ERROR: Failed to get record status: " + recordStatusResult.getErrorMessage()); 
		return false;
	}
		
	var recordStatusObj = recordStatusResult.getOutput();

	if (!recordStatusObj) {
		logDebug("**ERROR: No cap script object");
		return false;
	}
	var cd = recordStatusObj.getCapModel();
	var recordStatus = cd.getCapStatus();
	if(recordStatus != null) {
		return recordStatus;
	}
	else {
		return "";
	}
}

// End - ETW - EPAWS-1194, updated to not save "Submitted" status for TMP records