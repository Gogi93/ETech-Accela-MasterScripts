/*------------------------------------------------------------------------------------------------------/
/ Program : CRCA;Licence!~!~!Application.js
/ Event: ConvertToRealCapAfter
/
/------------------------------------------------------------------------------------------------------*/

syncContacts();
addDPLApplicationFee();

if (publicUser)
{
	if (appMatch("License/Sheet Metal/Apprentice/Application") || appMatch("License/Sheet Metal/Business License/Application"))
	{
		addReferenceContactFromMasterLicense();
	}
	if (appMatch("License/Sheet Metal/School/Application"))
	{
		addReferenceContactFromMasterLicense("I");
	}

	// This code is to add the cover letter to SET and Email to applicants
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
			if (appMatch("License/Sheet Metal/Business License/Application") || appMatch("License/Sheet Metal/School/Application"))
			{
				if (thisPeople.email != null && validEmail(thisPeople.email) && contacttype == "Business")
				{
					var myHashMap=aa.util.newHashMap();
					myHashMap.put("ALT_ID", capId.getCustomID());
					var fvEmailParameters = aa.util.newHashtable();
					var vACAUrl = lookup("ACA_SITE","dpl site");
					
					//Get legal board name, board phone and cover contact name - defect 6522
					var boardName = getLicensingBoard(capId);
					var rlpBoadName = getLegalBoardName(boardName);
					var boardPhone = lookup("BOARD_PHONE",boardName);
					var fName = thisPeople.getFirstName();
					var lName = thisPeople.getLastName();
					var coverName = fName + " " + lName;
					
					fvEmailParameters.put("$$ATTN_Dept$$",rlpBoadName);
					fvEmailParameters.put("$$Board_PhoneNumber$$", boardPhone);
					fvEmailParameters.put("$$Cover_Contact$$", coverName);
					//vACAUrl = vACAUrl.split("/admin")[0];
					fvEmailParameters.put("$$ACA_LINK$$",vACAUrl);
					
					sendReportByEmailTemplate("Document_Submission_Cover_Sheet", myHashMap, sysFromEmail, thisPeople.email, "", "ACA_COVER_SHEET_EMAIL", fvEmailParameters, "License", "ADMIN")
				}
			}
			else
			{
				if(thisPeople.email != null && validEmail(thisPeople.email) && contacttype == "Applicant")
				{
					var myHashMap=aa.util.newHashMap();
					myHashMap.put("ALT_ID", capId.getCustomID());
					var fvEmailParameters = aa.util.newHashtable();
					var vACAUrl = lookup("ACA_SITE","dpl site");
					//vACAUrl = vACAUrl.split("/admin")[0];
					fvEmailParameters.put("$$ACA_LINK$$",vACAUrl);
					
					//Get cover contact name - Defect 6522
					
					var fName = thisPeople.getFirstName();
					var lName = thisPeople.getLastName();
					var coverName = fName + " " + lName;
						
					//Pass parameters legal board name, board phone and cover contact name - defect 6522
					var boardName = getLicensingBoard(capId);
					var rlpBoadName = getLegalBoardName(boardName);
					var boardPhone = lookup("BOARD_PHONE",boardName);
					
					fvEmailParameters.put("$$ATTN_Dept$$",rlpBoadName);
					fvEmailParameters.put("$$Board_PhoneNumber$$", boardPhone);
					fvEmailParameters.put("$$Cover_Contact$$", coverName);
					
					sendReportByEmailTemplate("Document_Submission_Cover_Sheet", myHashMap, sysFromEmail, thisPeople.email, "", "ACA_COVER_SHEET_EMAIL", fvEmailParameters, "License", "ADMIN");
					
				}
			}
			
			/*else if(thisPeople.email != null && validEmail(thisPeople.email) && contacttype == "Complainant" && appMatch("Enforce/Investigation/Intake/*"))
			{
				var myHashMap=aa.util.newHashMap();
				myHashMap.put("ALT_ID", capId.getCustomID());
				var fvEmailParameters = aa.util.newHashtable();
				var vACAUrl = lookup("ACA_SITE","dpl site");
				//vACAUrl = vACAUrl.split("/admin")[0];
				fvEmailParameters.put("$$ACA_LINK$$",vACAUrl);
				
				var fName = thisPeople.getFirstName();
				var lName = thisPeople.getLastName();
				var coverName = fName + " " + lName;
				
				//Pass parameters legal board name, board phone and cover contact name - defect 6522
				var boardPhone = lookup("BOARD_PHONE","Complaint Inquiries");
					
				//fvEmailParameters.put("$$Board_PhoneNumber$$", boardPhone);
				//fvEmailParameters.put("$$ATTN_Dept$$", "Office of Investigations");
				fvEmailParameters.put("$$FullName$$", coverName);
				
				sendReportByEmailTemplate("COMPLAINT_RECEIVED_AND_FILED_DPL", myHashMap, sysFromEmail, thisPeople.email, "", "ACA_COMPLAINT_RECEIVED_EMAIL", fvEmailParameters, "License", "ADMIN")
			}*/
		}
	}

	useAppSpecificGroupName = false;
	if (appMatch("License/Veterinarian/Veterinarian License/Application")) 
	{

		//Get ASI values

		//get PAVE and ECFVG certificate Answer
		var PAVEans = getAppSpecific("If not a graduate of a school accredited by the AVMA, have you secured a PAVE or ECFVG certificate?");
		//logDebug("PAVE and ECFVG Answer :" + PAVEans);

		//get Degree Conferred Answer
		var DEGans = getAppSpecific("Degree Conferred");
		//logDebug("Degree Conferred Answer :" + DEGans);

		//get Limited License Answer
		var LIMans = getAppSpecific("Are you applying for a limited license?");
		//logDebug("Applying for Limited License Answer :" + LIMans);


		var condResult = aa.capCondition.getCapConditions(capId);

		var capConds = condResult.getOutput();
		var cStatusType;

		for (cc in capConds)
		{
			var thisCond = capConds[cc];
			//logDebug("thiscond: " + thisCond);
			var cStatusType = thisCond.getConditionStatusType();
			var cDesc = thisCond.getConditionDescription();
			
			if (PAVEans == "No" && cDesc == "Verification of ECFVG or PAVE documentation") {
				editCapConditionStatus("Application Checklist", "Verification of ECFVG or PAVE documentation", "Met", "Not Applied");
			}
			if (DEGans == "Yes" && cDesc == "Certificate by Dean or Registrar of Veterinary College") {
				editCapConditionStatus("Application Checklist", "Certificate by Dean or Registrar of Veterinary College", "Met", "Not Applied");
			}

		}

		if (LIMans == "Yes") {
			editCapConditionStatus("Application Checklist", "Verification of NAVLE", "Met", "Not Applied");
		}
		if (LIMans == "No") {
			editCapConditionStatus("Application Checklist", "Verification of CV/Resume", "Met", "Not Applied");
			editCapConditionStatus("Application Checklist", "Copy of Board Specialty Certificate", "Met", "Not Applied");
		}

	} //appmatch ends
  	if(appMatch("License/Massage Therapy/Solo Massage Establishment/Application") || appMatch("License/Massage Therapy/Multiple Massage Establishment/Application"))
	{
		var appType = getAppSpecific("Application Type");
		if (appType == "New Establishment") {
			waiveCondition("Verification of Existing Establishment License Number");
			logDebug("Verification of Existing Establishment License Number condition waived");
		}
	}
}