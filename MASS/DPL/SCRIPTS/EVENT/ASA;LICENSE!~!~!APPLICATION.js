//------------------------------------------------------------------------------------------------------/
// Program : ASA;LICENSE!~!~!APPLICATION.js
// Event: ApplicationSubmitAfter
//------------------------------------------------------------------------------------------------------*/

showDebug = true;

syncContacts();

setContactsSyncFlag("N");

//Added by Sameer to add DPL application fee
addDPLApplicationFee();

if (appMatch("License/Veterinarian/Veterinarian License/Application")) {

  //Get ASI values

  //get PAVE and ECFVG certificate Answer
  var PAVEans = getAppSpecificValue("If not a graduate of a school accredited by the AVMA, have you secured a PAVE or ECFVG certificate?", capId);
  aa.print("PAVE and ECFVG Answer :" + PAVEans);


  //get Degree Conferred Answer
  var DEGans = getAppSpecificValue("Degree Conferred", capId);
  aa.print("Degree Conferred Answer :" + DEGans);

  //get Limited License Answer
  var LIMans = getAppSpecificValue("Are you applying for a limited license?", capId);
  aa.print("Applying for Limited License Answer :" + LIMans);


  var condResult = aa.capCondition.getCapConditions(capId);

  var capConds = condResult.getOutput();
  var cStatusType;

  for (cc in capConds)

  {

    var thisCond = capConds[cc];
    //aa.print(thisCond);
    var cStatusType = thisCond.getConditionStatusType();
    var cDesc = thisCond.getConditionDescription();
    aa.print(cDesc);
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

//#######################################################################

if (appMatch("License/Sheet Metal/Apprentice/Application")) {

  //Get ASI values

  //get Sheet Metal training
  var SheetAns = getAppSpecificValue("Have you completed a Board approved sheet metal training program or Vocational School?", capId);
  aa.print("Answer :" + SheetAns);

  var condResult = aa.capCondition.getCapConditions(capId);
  var capConds = condResult.getOutput();
  var cStatusType;

  for (cc in capConds)

  {

    var thisCond = capConds[cc];
    //aa.print(thisCond);
    var cStatusType = thisCond.getConditionStatusType();
    var cDesc = thisCond.getConditionDescription();
    aa.print(cDesc);
    if (SheetAns == "No" && cDesc == "Verification of training program") {
      editCapConditionStatus("Application Checklist", "Verification of training program", "Met", "Not Applied");

    }

  }


// This code is to add the cover letter to SET and Email to applicants
//	callCoverSheetReportAndSendToEmail("COVER_SHEET"); 







} //appmatch ends


//##################function getAppSpecificValue
function getAppSpecificValue(pItemName, pItemCapId) {
  //modified version of getAppSpecific function created for this batch script
  //
  var appSpecInfoResult = aa.appSpecificInfo.getByCapID(pItemCapId);
  if (appSpecInfoResult.getSuccess()) {
    var appspecObj = appSpecInfoResult.getOutput();

    if (pItemName != "")
      for (i in appspecObj)
        if (appspecObj[i].getCheckboxDesc() == pItemName) {
          return appspecObj[i].getChecklistComment();
          break;
        }
  } else {
    logDebug("ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage())
  }
  return false;
}

// Added by NPHON on 7/22/14
//assignedToByShortNotes("Intake", getShortNotes());
//assignedToByShortNotes("Intake", getBoard(capId));



// Added by Bhandhavya on 8/27/2014 to populate AKA tab of the reference contact with AKA ASI on the spear form..


var capContactResult = aa.people.getCapContactByCapID(capId);
if (capContactResult.getSuccess()) {
  capContactResult = capContactResult.getOutput();
  for (yy in capContactResult) {
    thisCapContact = capContactResult[yy];
    thisPeople = thisCapContact.getPeople();
    aa.print(thisPeople.contactType);

    // if (thisPeople.contactType == "Business")
    // {
    var asiTemplate = thisPeople.template;
    if (asiTemplate != null) {
      var templategroup = asiTemplate.getTemplateForms();
      var field1 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Classification");
      if (field1)
        var classification = field1.getDefaultValue();

      var field2 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "First Name");
      if (field2)
        var firstname = field2.getDefaultValue();

      var field3 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Middle Name");
      if (field3)
        var middlename = field3.getDefaultValue();

      var field4 = getFieldAttributeByName(templategroup, "APPLICANT OTHER NAMES", "Last Name");
      if (field4)
        var lastname = field4.getDefaultValue();

      capContactModel = thisCapContact.getCapContactModel();

      //Add an AKA row to Ref contact

      aa.print(capContactModel);
      var c = getContactObj(capId, thisPeople.contactType);
      aa.print(c);
      //add a row when there is atleast one value in any of the AKA fields.
      if (classification != null || firstname != null || middlename != null || lastname != null) {
        c.addAKA(firstname, middlename, lastname, classification, new Date(), null);
      }

    }
  }
}


if (appMatch("License/Real Estate Appraiser/Temporary Appraiser/Application"))
 {

      var answer = "N";
      var capContactResult = aa.people.getCapContactByCapID(capId);
      if (capContactResult.getSuccess()) 

        {
          capContactResult = capContactResult.getOutput();
          for (yy in capContactResult) 
          {
            thisCapContact = capContactResult[yy];
            thisPeople = thisCapContact.getPeople();
            aa.print(thisPeople.contactType);

        if (thisPeople.contactType == "Applicant")
        {
            var asiTemplate = thisPeople.template;
            if (asiTemplate != null) 
            {
                var templategroup = asiTemplate.getTemplateForms();
                aa.print(templategroup);
                
                if (answer == "N")
                {
                    var question = getFieldAttributeByName(templategroup, "DISCIPLINE HISTORY", "1. Has disciplinary action been taken against you by a licensing board in any jurisdiction?");
                    if (question)
                    answer = question.getDefaultValue();
                }

                if (answer == "N")
                {
                    var question = getFieldAttributeByName(templategroup, "DISCIPLINE HISTORY", "2. Are you the subject of pending disciplinary action by a licensing board in any jurisdiction?");
                    if (question)
                    answer = question.getDefaultValue();
                }


               if (answer == "N")
                {
                    var question = getFieldAttributeByName(templategroup, "DISCIPLINE HISTORY", "3. Have you voluntarily surrendered a professional license to a licensing board in any jurisdiction?");
                    if (question)
                    answer = question.getDefaultValue();
                }
              
               if (answer == "N")
                {
                    var question = getFieldAttributeByName(templategroup, "DISCIPLINE HISTORY", "4. Have you ever applied for and been denied a professional license in any jurisdiction?");
                    if (question)
                    answer = question.getDefaultValue();
                }
            
             if (answer == "N")
                {
                    var question = getFieldAttributeByName(templategroup, "DISCIPLINE HISTORY", "5. Have you been convicted of a felony or misdemeanor in any jurisdiction?");
                    if (question)
                    answer = question.getDefaultValue();
                }

             }

         }

        }

    }

      var condResult = aa.capCondition.getCapConditions(capId);

      var capConds = condResult.getOutput();
      var cStatusType;

      for (cc in capConds)

      {

        var thisCond = capConds[cc];
        //aa.print(thisCond);
        var cStatusType = thisCond.getConditionStatusType();
        var cDesc = thisCond.getConditionDescription();
        aa.print(cDesc);
        if (cDesc == "Validation of Discipline History Questions" && answer == "Y")
        {
          editCapConditionStatus("Application Checklist", "Validation of Discipline History Questions", "Met", "Not Applied");

        }
        
      }


} //Appmatch of Real EState Application ends


/* @desc This method copies Other name fields to AKA fields on a contact
* Release B Master Script List ID: 1124
*/
if (appMatch("License/Plumbers and Gas Fitters/Journeyman/Application")
 || appMatch("License/Plumbers and Gas Fitters/Master/Application")
 || appMatch("License/Plumbers and Gas Fitters/LP Installer/Application")
 || appMatch("License/Plumbers and Gas Fitters/Gas Fitter Journeyman/Application")
 || appMatch("License/Plumbers and Gas Fitters/Gas Fitter Master/Application")) {
    CWM_ELP_1124_ASA_DPL_waiveConditionRecordofStanding();
}


function getFieldAttributeByName(templateGroups, subGroupName, fieldName) {
  logDebug("ENTER: getFieldAttributeByName");

  if (templateGroups == null || templateGroups.size() == 0) {
    return null;
  }
  var subGroups = templateGroups.get(0).getSubgroups();
  for (var subGroupIndex = 0; subGroupIndex < subGroups.size(); subGroupIndex++) {
    var subGroup = subGroups.get(subGroupIndex);
    //logDebug(subGroup.getSubgroupName() + " " + subGroup.getFields().size());
    if (subGroupName == subGroup.getSubgroupName()) {
      var fields = subGroup.getFields();
      for (var fieldIndex = 0; fieldIndex < fields.size(); fieldIndex++) {
        var field = fields.get(fieldIndex);
        //logDebug(field.getDisplayFieldName());
        if (field.getDisplayFieldName() == fieldName) {
          //aa.print(field);
          return field;
        }
      }
    }
  }

  logDebug("EXIT: getFieldAttributeByName");
}


if (debug.indexOf("**ERROR") > 0 || debug.substr(0,7) == "**ERROR") {
    showDebug = true;
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
}
else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
    else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}


// added for DEFECT JIRA 3946
			logDebug("MAKING PRIMARY");
			if(appMatch("License/Optometry/Optometrist/Application") || appMatch("License/Allied Health/Athletic Trainer/Application") ||
			   appMatch("License/Allied Health/Occupational therapist/Application") || appMatch("License/Allied Health/Occupational therapist Asst/Application") ||
			   appMatch("License/Allied Health/Physical therapist/Application") || appMatch("License/Allied Health/Physical therapist Assistant/Application") ||
			   appMatch("License/Allied Mental Health/Applied Behavior Analyst/Application") || appMatch("License/Allied Mental Health/Educational Psychologist/Application") ||
			   appMatch("License/Allied Mental Health/Asst Applied Behavior Analyst/Application") || appMatch("License/Allied Mental Health/Marriage and Family Therapist/Application") ||
			   appMatch("License/Allied Mental Health/Mental Health Counselor/Application") || appMatch("License/Allied Mental Health/Rehabilitation Counselor/Application") ||
			   appMatch("License/Architect/Architect/Application") || appMatch("License/Architect/Architect Emeritus/Application") ||
			   appMatch("License/Barbers/Apprentice/Application") || appMatch("License/Barbers/Instructor/Application") ||
			   appMatch("License/Barbers/Master/Application") || appMatch("License/Barbers/Assistant Instructor/Application") ||
   			   appMatch("License/Chiropractor/Chiropractor/Application") || appMatch("License/Cosmetology/Type 1/Application") ||
			   appMatch("License/Cosmetology/Type 2/Application") || appMatch("License/Cosmetology/Type 3/Application") ||
			   appMatch("License/Cosmetology/Type 5/Application") || appMatch("License/Cosmetology/Type 6/Application") ||
			   appMatch("License/Cosmetology/Forfeiture/Application") || appMatch("License/Cosmetology/Instructor/Application") ||
			   appMatch("License/Cosmetology/Jr Instructor/Application") || appMatch("License/Cosmetology/Out of Country/Application") ||
			   appMatch("License/Cosmetology/Reciprocal/Application") || appMatch("License/Cosmetology/Out of State/Application") ||
			   appMatch("License/Cosmetology/Type 7/Application") || appMatch("License/Dietitians and Nutritionist/Dietitians and Nutritionist/Application") ||
			   appMatch("License/Dispensing Opticians/Dispensing Optician/Application") || appMatch("License/Drinking Water/Drinking Water Operator/Application") ||
			   appMatch("License/Elecricians/Fire Alarm Systems Contractor/Application") || appMatch("License/Elecricians/Fire Alarm Systems Technician/Application") ||
			   appMatch("License/Elecricians/journeyman Electrician/Application") || appMatch("License/Elecricians/Master Electrician/Application") ||
			   appMatch("License/Electrology/Electrologist/Application") || appMatch("License/Electrology/Electrology Instructor/Application") ||
			   appMatch("License/Electrology/Electrology Lecturer/Application") || appMatch("License/Electrology/Electrologist/Out of State Application") ||
			   appMatch("License/Engineers and Land Surveyors/Engineer in Training/Application") || appMatch("License/Engineers and Land Surveyors/Engineers in Training License/Application") ||
			   appMatch("License/Engineers and Land Surveyors/Land Surveyor in Training/Application") || appMatch("License/Funeral Directors/Embalmer Apprentice/Application") ||
			   appMatch("License/Funeral Directors/Funeral Assistant/Application") || appMatch("License/Funeral Directors/Type 3/Application") ||
			   appMatch("License/Funeral Directors/Type 6/Application") || appMatch("License/Hearing Instrument/Apprentice/Application") ||
			   appMatch("License/Hearing Instrument/Specialist/Application") || appMatch("License/Home Inspector/Home Inspector/Application") ||
			   appMatch("License/Home Inspector/Home Inspector Associate/Application") || appMatch("License/Home Inspector/Home Inspector/Application") ||
			   appMatch("License/Landscape Architects/Landscape Architect/Application") || appMatch("License/Massage Therapy/Massage Therapist/Application") ||
			   appMatch("License/Occupational Schools/Sales Representative/Application") || appMatch("License/Plumbers and Gas Fitters/Apprentice/Application") ||
			   appMatch("License/Plumbers and Gas Fitters/Gas Fitter Apprentice/Application") || appMatch("License/Plumbers and Gas Fitters/Journeyman/Application") ||
			   appMatch("License/Plumbers and Gas Fitters/Gas Fitter Master/Application") || appMatch("License/Plumbers and Gas Fitters/Inspector/Application") ||
			   appMatch("License/Plumbers and Gas Fitters/LP Installer/Application") || appMatch("License/Plumbers and Gas Fitters/LTD LP Installer/Application") ||
			   appMatch("License/Plumbers and Gas Fitters/Master/Application") || appMatch("License/Podiatry/Podiatrist/Application") ||
			   appMatch("License/Podiatry/Podiatrist Limited License/Application") || appMatch("License/Psychologist/Psychologist/Application") ||
			   appMatch("License/Public Accountancy/CPA/Full Reporting Application") || appMatch("License/Public Accountancy/CPA/Non-Reporting Application") ||
			   appMatch("License/Public Accountancy/CPA/Short Form Application") || appMatch("License/Real Estate/Attorney Broker/Application") ||
			   appMatch("License/Real Estate/Broker/Application") ||  appMatch("License/Real Estate/Instructor/Application") ||
			   appMatch("License/Real Estate/Reciprocal Broker/Application") ||  appMatch("License/Real Estate/Salesperson/Application") ||			   
			   appMatch("License/Real Estate Appraiser/Appraiser/Application") ||  appMatch("License/Real Estate Appraiser/Attorney Broker License/Application") ||
			   appMatch("License/Real Estate Appraiser/Reciprocal Appraiser/Application") ||  appMatch("License/Real Estate Appraiser/Temporary Appraiser/Application") ||
			   appMatch("License/Real Estate Appraiser/Trainee/Application") ||  appMatch("License/Sanitarian/Sanitarian/Application") ||
			   appMatch("License/Sheet Metal/Apprentice/Application") ||  appMatch("License/Sheet Metal/Instructor/Application") ||
			   appMatch("License/Sheet Metal/Journeyperson/Application") ||  appMatch("License/Sheet Metal/Master/Application") ||
			   appMatch("License/Social Workers/Social Workers/Application") ||  appMatch("License/Speech and Audiology/Audiologist/Application") ||
			   appMatch("License/Speech and Audiology/Audiology Assistant/Application") || appMatch("License/Speech and Audiology/Speech Language Pathologist/Application") ||
			   appMatch("License/Speech and Audiology/Speech Language Pathology Asst/Application") || appMatch("License/Veterinarian/Tufts Individual/Application") ||
			   appMatch("License/Veterinarian/Veterinarian License/Application") || appMatch("License/Health Officer/Certified Health Officer/Application"))
			 {
				logDebug("INSIDE NEW CODE TO MAKE Applicant contact PRIMARY");
				var capContactResults = aa.people.getCapContactByCapID(capId);
				if (capContactResults.getSuccess()) {
					var capContactArrays = capContactResults.getOutput();
				}

				for(xps in capContactArrays){	
					var vContactsModels = capContactArrays[xps].getCapContactModel();	
					//logDebug("Looping throug contacts "+vContactsModels.getContactType());
					
								if(vContactsModels.getContactType() == "Applicant"){	
								//logDebug("Applicant contact Found");								
								vContactsModels.setPrimaryFlag("Y");
                //Update by Evan Cai 9-26-2017 for EPLACE-4313
                var peopleBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactBusiness").getOutput(); 
peopleBiz.editCapContact(vContactsModels, currentUserID, true);
								//var result = aa.people.editCapContact(vContactsModels);
								//logDebug(result.getSuccess());
								}
				}
			}
			
			else if(appMatch("License/Allied Health/Physical Therapy Facility/Application") || appMatch("License/Cosmetology/Shop/Application") ||
			   appMatch("License/Barbers/Shop/Application") || appMatch("License/Chiropractor/Chiropractor Facility/Application") ||
			   appMatch("License/Plumbers and Gas Fitter/Business/Application") || appMatch("License/Plumbers and Gas Fitter/Gas Fitter Business/Application") ||
			   appMatch("License/Public Accountancy/CPA Firm License for LLP/Application") || appMatch("License/Public Accountancy/CPA Firm for Partnership/Application") ||
			   appMatch("License/Public Accountancy/CPA Firm for LLC/Application") || appMatch("License/Public Accountancy/CPA Firm for Business Corp/Application") ||
			   appMatch("License/Public Accountancy/CPA Firm for Professional Corp/Application") || appMatch("License/Real Estate/Business/Application") ||
			   appMatch("License/Sheet Metal/Business License/Application") || appMatch("License/Real Estate/School/Application") ||
			   appMatch("License/Real Estate Appraiser/Course/CE Course Application") || appMatch("License/Real Estate Appraiser/Course/Primary Course Application") ||
			   appMatch("License/Real Estate Appraiser/Course/Seminar Course Application") || appMatch("License/Real Estate Appraiser/Course/USPAP Course Application") ||
			   appMatch("License/Cosmetology/Mobile Manicuring/Application") || appMatch("License/Sheet Metal/School/Application"))
			{
				logDebug("INSIDE NEW CODE TO MAKE Business contact PRIMARY");
				var capContactResults = aa.people.getCapContactByCapID(capId);
				if (capContactResults.getSuccess()) {
					var capContactArrays = capContactResults.getOutput();
				}

				for(xps in capContactArrays){	
					var vContactsModels = capContactArrays[xps].getCapContactModel();	
					//logDebug("Looping throug contacts "+vContactsModels.getContactType());
					
								if(vContactsModels.getContactType() == "Business"){	
								//logDebug("Business contact Found");								
								vContactsModels.setPrimaryFlag("Y");
                //Update by Evan Cai 9-26-2017 for EPLACE-4313
                var peopleBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactBusiness").getOutput(); 
                peopleBiz.editCapContact(vContactsModels, currentUserID, true);
								 //aa.people.editCapContact(vContactsModels);
								//logDebug(result.getSuccess());
								}
							
				}	
			}
			else 
			{
				logDebug("INSIDE NEW CODE TO MAKE Other contact PRIMARY");
				var capContactResults = aa.people.getCapContactByCapID(capId);
				if (capContactResults.getSuccess()) {
					var capContactArrays = capContactResults.getOutput();
				}

				for(xps in capContactArrays){	
					var vContactsModels = capContactArrays[xps].getCapContactModel();	
					//logDebug("Looping throug contacts "+vContactsModels.getContactType());
					
								if((vContactsModels.getContactType() == "Manufacturer") ||(vContactsModels.getContactType() == "Massage Therapy Establishment") ||
								(vContactsModels.getContactType() == "Occupational School") || (vContactsModels.getContactType() == "School") ||
								(vContactsModels.getContactType() == "Funeral Establishment") ){	
								//logDebug("Business contact Found");								
								vContactsModels.setPrimaryFlag("Y");
                //Update by Evan Cai 9-26-2017 for EPLACE-4313
								//var result = aa.people.editCapContact(vContactsModels);
                 var peopleBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.CapContactBusiness").getOutput(); 
                peopleBiz.editCapContact(vContactsModels, currentUserID, true);
								//logDebug(result.getSuccess());
								}
							
				}
				
				
			}