//aa.env.setValue("SetID","VT|RENEWAL_NOTIFICATION|W|20140818");

//aa.env.setValue("SetID","SM|RENEWAL_NOTIFICATION|W|20141029");
//aa.env.setValue("emailTemplate","AA_RENEWAL_NOTIFICATION");

/* ------------------------------------------------------------------------------------------------------ /
 | Program : Batch_Renewal_Notification_Email - AutoAttachToRecord  Trigger : Batch
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
	 
	var ToEmailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL NOTICE EMAIL"); // This email will be set by standard choice
	if (ToEmailAddress == null || ToEmailAddress == "") 
	logDebug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

if (ToEmailAddress != null || ToEmailAddress != "") 
aa.sendMail(sysFromEmail, ToEmailAddress, "", "Batch Job: Renewal Email Notification", debug);
}



function processLics() {
   var capCount = 0;
   var setName = aa.env.getValue("SetID");
   var emailTemplate = aa.env.getValue("emailTemplate");
	 if(emailTemplate == null || emailTemplate == "")
		emailTemplate = "AA_RENEWAL_NOTIFICATION"; 
   logDebug("**INFO SetID: " + setName);
   logDebug("**INFO emailTemplate: " + emailTemplate);
   var reportSet = new capSet(setName);
   var reportMembers = reportSet.members;
   var capId = null;
   var myHashMap = null;
   var complainantEmail = null;
   var reportToBe = null;
   var setLkupName = null;
   var setNameArr = String(setName).split("|");
   var emailToWho = null;
   var versionValue = null;

   // aa.print(setNameArr);
   setLkupName = setNameArr[0];

   if (setNameArr.length >= 2)
      setLkupName += "|" + setNameArr[1];

   // aa.print(setLkupName);
   var lkupReport = String(lookup("LKUP_SetName_To_Correspondence", setLkupName));

   if (lkupReport == 'undefined') {
      logDebug("**WARNING Set Name: " + setLkupName + " is not tied to a correspondence.  No printing was done, please see administrator for help.");
      // If this error happens check LKUP_SetName_To_Correspondence and ensure the setName is correct
      return false;
   }
   // aa.print(lkupReport);
   reportToBe = lkupReport.split("|");
   logDebug("**INFO ReportTObe: " + reportToBe);
   if (reportToBe[0] != "NULL") {
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
         logDebug("**INFO: Retrieving " + reportMembers[rm].getID1() + "-" + reportMembers[rm].getID2() + "-" + reportMembers[rm].getID3());
         var capIdObj = aa.cap.getCapID(reportMembers[rm].getID1(), reportMembers[rm].getID2(), reportMembers[rm].getID3());

         if (capIdObj.getSuccess()) {
            capId = capIdObj.getOutput();
            cap = aa.cap.getCap(capId).getOutput();
            if (cap != null)
               var appTypeResult = cap.getCapType();

            var appTypeString = appTypeResult.toString();
            var appTypeArray = appTypeString.split("/");
            if (appTypeArray[3] == "License") {
               var toBeEmailedCapId = getLatestTempRenewal(capId);
               if (toBeEmailedCapId != null)
                  var emailParameters = getEmailTemplateParameters(capId);
							 else
							 {
								logDebug("**WARNING: " + capId.getCustomID() + " does not have a TMP renewal record associated. Email will not be sent." );
								continue;
							 }
            } else
               var toBeEmailedCapId = capId;

            logDebug("**INFO toBeEmailedCapId: "+toBeEmailedCapId);
						
						var emailParameters = getEmailTemplateParameters(capId);

            var contactEmails = new Array();
            var emailed = null;
            var stillPrint = false;
            // if false need to generate report and at to record otherwise email report and add to record
            logDebug("**INFO Processing :" + capId.getCustomID());
            if (sendEmail && sendEmail.toUpperCase() == "TRUE") {
               // only email if the correspondence can be emailed
              logDebug("**INFO Email value from Standard choice: " + emailToWho);
               switch (emailToWho) {
                  case "ALL":
                     var capContactArr = getContactArray(capId);
                     for (contactItem in capContactArr)
                        if (capContactArr[contactItem].email != null) {
                           var atIndex = String(capContactArr[contactItem].email).indexOf("@");
                           var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
                           if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1))
                              contactEmails.push(capContactArr[contactItem].email);
                        } else
                           stillPrint = true;
                        // comment(complainantEmail);
                        // complainantEmail = null;
                     break;
                  case "PRIMARY":
                     var capPrimaryObj = null;
                     var capIdScriptModel = aa.cap.createCapIDScriptModel(capId.getID1(), capId.getID2(), capId.getID3());
                     var capPriContact = aa.cap.getCapPrimaryContact(capIdScriptModel);
                     if (capPriContact.getSuccess());
                     capPrimaryObj = capPriContact.getOutput();
                     if (capPrimaryObj && capPrimaryObj.getEmail()) {
                        var capPrimaryEmail = capPrimaryObj.getEmail();
                        var atIndex = String(capPrimaryEmail).indexOf("@");
                        var periodIndex = String(capPrimaryEmail).indexOf(".", atIndex);
                        if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1))
                           contactEmails.push(capPrimaryObj.getEmail());
                     } else
                        stillPrint = true;

                     // for(cc in contactEmails)aa.print(contactEmails[cc]);
                     break;

                  default:
                     // check if given contact type has an email
                     if (emailToWho) {

                        //Added by Sameer for defect 1368 
                        var contactToMail = emailToWho.split(",");
                        var busContact = String(contactToMail[0]);
                        var liContact = String(contactToMail[1]);
                        logDebug("**INFO Business: " + busContact);
                        logDebug("**INFO Licensed Individual: " + liContact);

                        var capContactArr = getContactArray(capId);
                        for (contactItem in capContactArr)
                           if (capContactArr[contactItem].contactType != null && (String(capContactArr[contactItem].contactType).toUpperCase() == busContact.toUpperCase() || String(capContactArr[contactItem].contactType).toUpperCase() == liContact.toUpperCase())) {
                              logDebug("**INFO Contact type matched.");
                              if (capContactArr[contactItem].email != null) {
                                 logDebug("**INFO Checking email address format is valid.");
                                 var atIndex = String(capContactArr[contactItem].email).indexOf("@");
                                 var periodIndex = String(capContactArr[contactItem].email).indexOf(".", atIndex);
                                 // aa.print(atIndex + "  P: " + periodIndex);
                                 if (atIndex > 0 && periodIndex > 0 && periodIndex > (atIndex + 1)) {// basic email validation
                                    logDebug("**INFO Email added: " + capContactArr[contactItem].email);
                                    contactEmails.push(capContactArr[contactItem].email);
                                 } else {
                                    emailNotifTo = null;
                                    logDebug("**INFO Invalid email address format found. Will save on record and don't email.");
                                 // invalid email address so save on record and don't email
                                 // contactEmails.push(String(capContactArr[contactItem].email));
                                 }
                              } else
                                 stillPrint = true;
                           }
                     }
                     break;

               }
               // end determing email addresses

            }

            if (toBeEmailedCapId) {
               logDebug("**INFO Setting the report paramenter ALT_ID = "+toBeEmailedCapId.getCustomID());
               var myHashMap = aa.util.newHashMap();
               myHashMap.put("ALT_ID", String(toBeEmailedCapId.getCustomID()));
               if (versionValue) {
                  var vSplit = versionValue.split(":");
                  var varName = String(vSplit[0]);
                  var vValue = String(vSplit[1]);
                  myHashMap.put(varName, vValue);
                  // for the paymentDue / pastDue Notices  Scale & Collections, adjournment disposition letters
               }

            }
            /* if ( cap != null)
            var emailParameters = getEmailTemplateParameters(capId);
// If Temp Records then fetch parameters from License record.
               else
                  {
                     var altid = capId.getCustomID();
                     var ParentCapID = getParentCapID4Renewal(altid);
                     aa.print("Parent" +ParentCapID);
                     if ( ParentCapID != null)
                     var emailParameters = getEmailTemplateParameters(ParentCapID);
                  }*/


            // begin the transaction items to be commited to the database
            logDebug("**INFO Before aa.batchJob.beginTransaction(10)");
            aa.batchJob.beginTransaction(10);
            logDebug("**INFO After aa.batchJob.beginTransaction(10)");

            logDebug("**INFO Before getting set details model.");
            var setDetail = aa.set.getSetDetailsScriptModel();
            var setDetailsModel = null;
            if (setDetail.getSuccess()) {
               setDetailsModel = setDetail.getOutput();
               setDetailsModel.setID1(reportMembers[rm].getID1());
               setDetailsModel.setID2(reportMembers[rm].getID2());
               setDetailsModel.setID3(reportMembers[rm].getID3());
               setDetailsModel.setSetID(setName);
            }
            logDebug("**INFO After getting set details model.");

            if (toBeEmailedCapId) {
               logDebug("**INFO Beginning preparing report process.");
               var generatedCompletely = true;
               if (contactEmails.length > 0 && emailToWho != "SPECIAL") {
                  logDebug("**INFO Number of contacts emails to process : " + contactEmails.length);
                  for (validEmail in contactEmails) {
                     logDebug("**INFO Before generating, saving report and sending email to " + contactEmails[validEmail]);
                     if (!generateReportSaveAndEmail(reportToBe[0], myHashMap, emailTemplate, emailParameters, String(contactEmails[validEmail]), capId)) {
                        generatedCompletely = false;
                        logDebug("**WARNING Report not generated or sent for "+contactEmails[validEmail]);
                     }
                     // now set the setMember status to 'Emailed'
                     logDebug("**INFO After generating, saving report and sending email to " + contactEmails[validEmail]);
                  }      
                  if (setDetailsModel && generatedCompletely) {
                     logDebug("**INFO Setting the set member status to Emailed.");
                     setDetailsModel.setSetMemberStatus("Emailed");
                     var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
                     if (!updateResult.getSuccess())
                        logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
                     else logDebug("**INFO Set member status updated.");
                  }
               }
               if (stillPrint || (contactEmails.length == 0 && emailToWho != "SPECIAL")) // No valid email so needs to be printed and mailed
               {
                  logDebug("**INFO Begin generating and saving report if no valid email found.");
                  generatedCompletely = generateReportSaveAndEmail(reportToBe[0], myHashMap, emailTemplate, emailParameters, null, capId);
                  if (setDetailsModel && generatedCompletely) {
                     logDebug("**INFO Setting the set member status to Generated.");
                     setDetailsModel.setSetMemberStatus("Generated");
                     var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
                     if (!updateResult.getSuccess())
                        logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
                     else logDebug("**INFO Set member status updated.");

                     allSetMembersEmailed = false;
                  }
               }


               // aa.print("Member Error: " + generatedCompletely);
               if (!generatedCompletely) {
                  logDebug("**WARNING Not all set member where generated a report.");
                  setDetailsModel.setSetMemberStatus("Error");
                  var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
                  if (!updateResult.getSuccess())
                     logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
                  else logDebug("**INFO Set member status updated.");
                  allSetMembersEmailed = false;
               }
               logDebug("**INFO Before aa.batchJob.commitTransaction()");
               // commit the Transaction for the batch report to correctly identify the members that have been emailed
               aa.batchJob.commitTransaction();
               logDebug("**INFO After aa.batchJob.commitTransaction()")
               capCount++;

            }
         }
      }
   }
   //If all members of the set are e-mailed, then no need to sent for printing!
   if (allSetMembersEmailed) {
      logDebug("**INFO All set members were emailed.");
      var vgetSetByPK = aa.set.getSetByPK(setName).getOutput();
      if (vgetSetByPK != null) {
         vgetSetByPK.setSetStatusComment("All set members sent via e-mail");
         vgetSetByPK.setSetStatus("Emailed");
         aa.set.updateSetHeader(vgetSetByPK);
      }
   } else {
      if (reportMembers.length > 0 && reportToBe.length > 1) // If the set has members attach the bulk printing document
      {
         logDebug("**INFO Before setting the print only set " + reportToBe);
         var reportForSet = reportToBe;
         var batchHashParamaters = aa.util.newHashMap();
         batchHashParamaters.put("SET_ID", setName);
         if (versionValue) {
            batchHashParamaters.put(varName, vValue);
            // for the paymentDue / pastDue Notices  Scale & Collections
         }

         var batchCompleted = true;
         batchCompleted = generateReportSaveOnSet(reportForSet[1], batchHashParamaters, setName);
         if (batchCompleted)
            reportSet.updateSetStatus("Ready for Printing");
         else
            reportSet.updateSetStatus("Error Generating Report");
         logDebug("**INFO After setting the print only set " + reportToBe);
      }
   }
   logDebug("**INFO End of processLics routine. capCount: "+capCount);
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
function elapsed() {
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)

}



function getLatestTempRenewal(capId) {
   var result = aa.cap.getProjectByMasterID(capId, "Renewal", "Incomplete");
   if (result.getSuccess()) {
      var partialProjects = result.getOutput();
      if (partialProjects != null && partialProjects.length > 0) {
         var latestRenewalCapID;
         var latestDate = 0;
         for (var index in partialProjects) {
            // loop through each  record
            var thisChild = partialProjects[index];
            var capIDModel = thisChild.getCapID();
            var renewalCap = aa.cap.getCap(capIDModel).getOutput();
            if (renewalCap)
               var perID1 = capIDModel.getID1();

            var createdDate = aa.util.parseInt(dateFormatToMMDDYYYY(convertDate(renewalCap.getFileDate())));

            if ((createdDate > latestDate) && (perID1.indexOf("EST") > 0)) {
               latestDate = createdDate;
               latestRenewalCapID = renewalCap.getCapID();
            }

         }
         return latestRenewalCapID;
      }
   }
}


function dateFormatToMMDDYYYY(pJavaScriptDate) {

   //converts javascript date to string in YYYYMMDD format
   if (pJavaScriptDate != null) {
      if (Date.prototype.isPrototypeOf(pJavaScriptDate)) {
         var month = pJavaScriptDate.getMonth() + 1;
         if (month < 10)
            var formattedMonth = "0" + month;
         else
            var formattedMonth = month.toString();
         var dayOfMonth = pJavaScriptDate.getDate();
         if (dayOfMonth < 10)
            var formattedDay = "0" + dayOfMonth.toString();
         else
            var formattedDay = dayOfMonth.toString();
         return (pJavaScriptDate.getFullYear() + formattedMonth + formattedDay);
         logDebug("Date: " + pJavaScriptDate.getFullYear() + formattedMonth + formattedDay);
      } else {
         // logDebug("Parameter is not a javascript date");
         return ("INVALID JAVASCRIPT DATE");
      }
   } else {
      //  logDebug("Parameter is null");
      return ("NULL PARAMETER VALUE");
   }
}