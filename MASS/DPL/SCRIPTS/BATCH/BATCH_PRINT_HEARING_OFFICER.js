//aa.env.setValue("SetID", "HEARING_OFFICER_ASSIGNMENT|T|D|");
//aa.env.setValue("emailTemplate","HEARING_OFFICER_ASSIGNED_EMAIL_NOTIFICATION");
/* ------------------------------------------------------------------------------------------------------ /
 | Program : BatchPrint - AutoAttachToRecord  Trigger : Batch
 |
 | Script loops through set members, adds a report determined by a lookup table using the setName  to each record in the set
 | then generates a batch report for printing and attaches the report to the set.

 | Batch Requirements :
 | - Valid Set of name convention.
 | - Not meant to be a script run overnight, but a script that is ran manually.
 / ------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------ /
 | START : USER CONFIGURABLE PARAMETERS
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 2.0
var documentOnly = false;
var message = "";
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
var debug = "";
br = "<br>";
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

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


showDebug = 3;
//showDebug = true;
showMessage = false;
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

var ToEmailAddress = lookup("BATCH_STATUS_EMAIL", "HEARING OFFICER"); // This email will be set by standard choice
if (ToEmailAddress == null || ToEmailAddress == "") 
   logDebug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

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

if (paramsOK) 
{
	logDebug("START", "Start of Batch Print For Batch Job.");

	var numRecordsFeeProcessed = processLics();

	logDebug("INFO: Number of records processed: " + numRecordsFeeProcessed + ".");
	logDebug("END", "End of BatchPrint For Job: Elapsed Time : " + elapsed() + " Seconds.");


	if (ToEmailAddress != null || ToEmailAddress != "") 
		aa.sendMail(sysFromEmail, ToEmailAddress, "", "Batch Job: HEARING OFFICER", debug);

}

function processLics() 
{
   var capCount = 0;
   var setName = aa.env.getValue("SetID");
   aa.env.setValue("SetID", "HEARING_OFFICER_ASSIGNMENT|T|D|");
   var emailTemplate = aa.env.getValue("emailTemplate");
   aa.env.setValue("emailTemplate","HEARING_OFFICER_ASSIGNED_EMAIL_NOTIFICATION");

  var previousDayFlag = aa.env.getValue("RunforPreviousDay");
  logDebug("PreviousFlag " + previousDayFlag);

   logDebug("SetID: " + setName);
   logDebug("emailTemplate: " + emailTemplate);
   var setNameArr = String(setName).split("|");
   
   if (setNameArr.length == 3)
   {
		setName = setName + "|";
		setNameArr.push(" ");
   }
   
   if (!setNameArr[4] || setNameArr[4] == undefined || setNameArr[4].trim() == "")
   {
		if(previousDayFlag == "Y")
		{
			var fvToday = new Date();
			fvToday.setDate(fvToday.getDate() - 1);
			var fvToday  = new Date(fvToday);
			var fvYear = fvToday.getFullYear().toString();
			var fvMonth = ("0" + (fvToday.getMonth() + 1).toString()).slice(-2);
			var fvDay = ("0" + fvToday.getDate().toString()).slice(-2);
			setNameArr[4] = fvYear + fvMonth + fvDay;
			setName = setName + setNameArr[4];
		}
		else
       {
			var fvToday = new Date();
			var fvYear = fvToday.getFullYear().toString();
			var fvMonth = ("0" + (fvToday.getMonth() + 1).toString()).slice(-2);
			var fvDay = ("0" + fvToday.getDate().toString()).slice(-2);
			setNameArr[4] = fvYear + fvMonth + fvDay;
			setName = setName + setNameArr[4];
       }
   }
   var reportSet = new capSet(setName);
   var reportMembers = reportSet.members;
   var capId = null;
   var myHashMap = null;
   var complainantEmail = null;
   var reportToBe = null;
   var setLkupName = null;
   var emailToWho = null;
   var versionValue = null;
   var Issuer_Name = "";

   // aa.print(setNameArr);
   setLkupName = setNameArr[0];

   // aa.print(setLkupName);
   var lkupReport = String(lookup("LKUP_SetName_To_Correspondence", setLkupName));

   if (lkupReport == 'undefined') 
   {
		logDebug("Set Name: " + setLkupName + " is not tied to a correspondence.  No printing was done, please see administrator for help.");
		// If this error happens check LKUP_SetName_To_Correspondence and ensure the setName is correct
		return false;
   }
   
   // aa.print(lkupReport);
   reportToBe = lkupReport.split("|");
   logDebug("ReportTObe: " + reportToBe);
   if (reportToBe[0] != "NULL") 
   {
		var sendEmail = false;

		if (reportToBe.length >= 3)
			sendEmail = reportToBe[2];

		if (reportToBe.length >= 4)
			emailToWho = String(reportToBe[3]);

		if (reportToBe.length >= 5)
			versionValue = String(reportToBe[4]);

		//Flag to determine if all set members were e-mailed
		var allSetMembersEmailed = true;

		  // for (s in reportToBe) {
		  //    logDebug(s + ": " + reportToBe[s]);
		  // }

      // aa.print(reportToBe);
		  for (var rm = 0; rm < reportMembers.length; rm++) // for each individual record add the appropriate document
		  {
				var capIdObj = aa.cap.getCapID(reportMembers[rm].getID1(), reportMembers[rm].getID2(), reportMembers[rm].getID3());

				if (capIdObj.getSuccess()) 
				{
					capId = capIdObj.getOutput();
					cap = aa.cap.getCap(capId).getOutput();
					var contactsToEmail = new Array();
					var contactEmails = new Array();
					var em = new Array();
					var emailed = null;
					var stillPrint = false;
					// if false need to generate report and at to record otherwise email report and add to record
					logDebug("Processing :" + capId.getCustomID());
					if (sendEmail && sendEmail.toUpperCase() == "TRUE")
					{
					   // only email if the correspondence can be emailed
					   logDebug("Email value from Standard choice: " + emailToWho);
						switch (emailToWho) 
						{
							case "ALL":
								logDebug("Getting ALL CAP contacts.");
								var co = getContactObjs(capId);
								for (i in co) 
								{
									var cc = co[i].capContact;
									if (cc.email != null && validEmail(cc.email)) 
									{
									   contactsToEmail.push(co[i]);
									} 
									else
									   stillPrint = true;
								}
								break;

						case "PRIMARY":
								logDebug("Getting PRIMARY CAP contact.")
								var co = getContactObjs(capId);
								for (i in co) 
								{
									var cc = co[i].capContact;
									if (cc.email != null && validEmail(cc.email) && cc.primaryFlag == "Y") 
									{
									   logDebug("Primary contact with valid email found. "+cc.getContactName());
									   contactsToEmail.push(co[i]);
									} 
									else
									   stillPrint = true;
								}
								break;
						default:
						// check if given contact type has an email
                        if (emailToWho) 
						{
						   var contactToMail = emailToWho.split(",");
							var busContact = String(contactToMail[0]);
							var liContact = String(contactToMail[1]);
						  
							var capContactArr = getContactArray(capId);
							var fvSentToStdChcCont = false;
							var fvSentToStdChcContType = "";

							for (contactItem in capContactArr)
							{
								if (capContactArr[contactItem].contactType != null && String(capContactArr[contactItem].contactType).toUpperCase() == "OFFICER")
								{                           
									if (capContactArr[contactItem].email != null) 
									{
										 var atIndex = String(capContactArr[contactItem].email).indexOf("@");
										 var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
										 // aa.print(atIndex + "  P: " + periodIndex);
										 if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) // basic email validation
										{
											logDebug("Email added: " + capContactArr[contactItem].email);
											contactEmails.push(capContactArr[contactItem].email);
											//An Array of Email Parameters was added in order to handle muliple contacts with same contact type
											var co = getContactObjsBySeqNbr(capId, capContactArr[contactItem].contactSeqNumber);
											var emailParameters = getEmailTemplateParams(co);
											em.push(emailParameters);
										}
										else
											emailNotifTo = null;
											 // invalid email address so save on record and don't email
											 // contactEmails.push(String(capContactArr[contactItem].email));
									} 
									else
										stillPrint = true;
								}
							}

							for (var newCounter in contactToMail)
							{
								inContactType = contactToMail[newCounter];
								for (contactItem in capContactArr)
								{
								   if (capContactArr[contactItem].contactType != null && String(capContactArr[contactItem].contactType).toUpperCase() == inContactType.toUpperCase())
								   {
									   if (fvSentToStdChcCont && String(capContactArr[contactItem].contactType).toUpperCase() != fvSentToStdChcContType) continue;

									  if (capContactArr[contactItem].email != null) 
									  {
											 var atIndex = String(capContactArr[contactItem].email).indexOf("@");
											 var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
											 // aa.print(atIndex + "  P: " + periodIndex);
											 if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) // basic email validation
											{
												logDebug("Email added: " + capContactArr[contactItem].email);
												contactEmails.push(capContactArr[contactItem].email);
												fvSentToStdChcCont = true;
												fvSentToStdChcContType = String(capContactArr[contactItem].contactType).toUpperCase();

												//An Array of Email Parameters was added in order to handle muliple contacts with same contact type
												var co = getContactObjsBySeqNbr(capId, capContactArr[contactItem].contactSeqNumber);
												var emailParameters = getEmailTemplateParams(co);
												em.push(emailParameters);
											}
											else
											emailNotifTo = null;
											 // invalid email address so save on record and don't email
											 // contactEmails.push(String(capContactArr[contactItem].email));
										} 
										else
											stillPrint = true;
								}
							}
						}
                    }
                    break;
               }
               // end determing email addresses
            }

			 //aa.print(em.length);
			// aa.print(contactEmails.length);

			 var fvCC = "";
			 var fvCapTaskSR = aa.workflow.getTask(capId,"Intake");
			if (fvCapTaskSR && fvCapTaskSR.getSuccess())
			{
				var fvCapTask = fvCapTaskSR.getOutput();
				if (fvCapTask)
				{
					var fvAssignedStaff = fvCapTask.assignedStaff;
					var fvUserSR = aa.person.getUser(fvAssignedStaff.firstName,fvAssignedStaff.middleName,fvAssignedStaff.lastName);
					if (fvUserSR && fvUserSR.getSuccess())
					{
						var fvUser = fvUserSR.getOutput();
						if (fvUser)
						{
						 var fvEmail = fvUser.email;
						 if (fvEmail && fvEmail != "")
							fvCC = fvEmail;
						}
					}
				}	
			}

			 var myHashMap = aa.util.newHashMap();
			 myHashMap.put("ALT_ID", String(capId.getCustomID()));
			  //  myHashMap.put("Issuer_Name", " ");
			if (versionValue) 
			{
			   var vSplit = versionValue.split(":");
			   var varName = String(vSplit[0]);
			   var vValue = String(vSplit[1]);
			   myHashMap.put(varName, vValue);
			   // for the paymentDue / pastDue Notices  Scale & Collections, adjournment disposition letters
			}

            // begin the transaction items to be commited to the database
             aa.batchJob.beginTransaction(10);

			//Defect 6522
            var emailParameters = getEmailTemplateParametersNEW(capId); 

            var setDetail = aa.set.getSetDetailsScriptModel();
            var setDetailsModel = null;
            if (setDetail.getSuccess()) {
               setDetailsModel = setDetail.getOutput();
               setDetailsModel.setID1(reportMembers[rm].getID1());
               setDetailsModel.setID2(reportMembers[rm].getID2());
               setDetailsModel.setID3(reportMembers[rm].getID3());
               setDetailsModel.setSetID(setName);
            }

            var generatedCompletely = true;
            if (contactEmails.length > 0 && emailToWho != "SPECIAL") 
			{
				//for (validEmail in contactEmails)
                 // if (!generateReportSaveAndEmail(reportToBe[0], myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId, fvCC))
				for (validEmail in contactEmails)
				{
					//Defect 6522
					if (!generateReportSaveAndEmail(reportToBe[0], myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId, fvCC)) 
						generatedCompletely = false;
				}

				if (setDetailsModel && generatedCompletely) 
				{
				 //logDebug("Report "+reportToBe[0]+" was generated and sent to "+cc.getContactName() + " - " + cc.getContactType()+ " " + cc.email);
				 setDetailsModel.setSetMemberStatus("Emailed");
				 var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
				 if (!updateResult.getSuccess())
					logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
				}
            }

            if (stillPrint || (contactsToEmail.length == 0 && emailToWho != "SPECIAL")) 
			{
               var emailParameters = aa.util.newHashtable();
               generatedCompletely = generateReportSaveAndEmail(reportToBe[0], myHashMap, emailTemplate, emailParameters, null, capId);

               if (setDetailsModel && generatedCompletely) 
			   {
					logDebug("Report "+reportToBe[0]+" was generated and attached to CAP "+ capId);
					setDetailsModel.setSetMemberStatus("Generated");
					var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
					if (!updateResult.getSuccess())
						logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());

					allSetMembersEmailed = false;
               }
            }

            if (!generatedCompletely) 
			{
               setDetailsModel.setSetMemberStatus("Error");
               var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
               if (!updateResult.getSuccess())
                  logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());

               allSetMembersEmailed = false;
            }
            // commit the Transaction for the batch report to correctly identify the members that have been emailed
             aa.batchJob.commitTransaction();
            capCount++;
         }
     }
   }

   //If all members of the set are e-mailed, then no need to sent for printing!
   if (allSetMembersEmailed) 
   {
		var vgetSetByPK = aa.set.getSetByPK(setName).getOutput();
		if (vgetSetByPK != null) 
		{
			 vgetSetByPK.setSetStatusComment("All set members sent via e-mail");
			 vgetSetByPK.setSetStatus("Emailed");
			 aa.set.updateSetHeader(vgetSetByPK);
		}
	} 
   else 
   {
      if (reportMembers.length > 0 && reportToBe.length > 1) // If the set has members attach the bulk printing document
      {
		var reportForSet = reportToBe;
		var batchHashParamaters = aa.util.newHashMap();
		batchHashParamaters.put("SET_ID", setName);
         if (versionValue) 
		 {
            batchHashParamaters.put(varName, vValue);
            // for the paymentDue / pastDue Notices  Scale & Collections
         }

         var batchCompleted = true;
         batchCompleted = generateReportSaveOnSet(reportForSet[1], batchHashParamaters, setName);
         if (batchCompleted)
            reportSet.updateSetStatus("Ready for Printing");
         else
            reportSet.updateSetStatus("Error Generating Report");
      }
   }
   return capCount;
}


if (debug.indexOf("**ERROR") > 0) {
   aa.env.setValue("ScriptReturnCode", "1");
   aa.env.setValue("ScriptReturnMessage", debug);
} else {
   aa.env.setValue("ScriptReturnCode", "0");
   if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
   if (showDebug) aa.env.setValue("ScriptReturnMessage", debug);
}

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== External Functions (used by Action entries)
 / ------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Internal Functions and Classes (Used by this script)
 / ------------------------------------------------------------------------------------------------------ */
function elapsed() 
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

function getEmailTemplateParametersNEW(itemCap) 
{
   var emailParameters = aa.util.newHashtable();
   var itemCapScriptModel = aa.cap.getCap(itemCap).getOutput();
   var Boardtype=itemCapScriptModel.getCapType().toString();

   // Load all parameters to be used by the email template.
   addParameter(emailParameters, "$$AppType$$", itemCapScriptModel.getCapType().getAlias());
   addParameter(emailParameters, "$$AltID$$", itemCap.getCustomID());
	
	//Start Defect 6522
	var hearingContact;
	var capContactResult=aa.people.getCapContactByCapID(itemCap);
	if(capContactResult.getSuccess())
	{
		capContactResult=capContactResult.getOutput();
		for(yy in capContactResult)
		{
			var peopleModel= capContactResult[yy].getPeople();
			if(peopleModel.getContactType()=="Respondent")
			{
				hearingContact = peopleModel.getFirstName() + " " +peopleModel.getLastName();
			}
			else if(peopleModel.getContactType()=="Attorney")
			{
				hearingContact = peopleModel.getFirstName() + " " +peopleModel.getLastName();
			}
		}
	}
	//End Defect 6522
	
   /*var co = getContactObjs(capId);

   var tmpCapId = capId;
   capId = itemCap;
   getContactParams4Notification(emailParameters, "Attorney");
   getContactParams4Notification(emailParameters, "Officer");
   getContactParams4Notification(emailParameters, "Business");
   capId = tmpCapId;

    var licenseeName =(!matches(emailParameters.get("$$attorneyLastName$$"), null, "", "undefined")) ? (emailParameters.get("$$attorneyLastName$$") + ", " + emailParameters.get("$$attorneyFirstName$$")) : (emailParameters.get("$$officerLastName$$") + ", " + emailParameters.get("$$officerFirstName$$"));
      // var licenseeName = (!matches(emailParameters.get("$$license holderLastName$$"), null, "", "undefined")) ? (emailParameters.get("$$license holderLastName$$") + ", " + emailParameters.get("$$license holderFirstName$$")) : (emailParameters.get("$$authorized representativeLastName$$") + ", " + emailParameters.get("$$authorized representativeFirstName$$"));*/

   addParameter(emailParameters, "$$Hearing_Contact$$", hearingContact);
   return emailParameters;
}