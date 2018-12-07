//aa.env.setValue("SetID","PAYMENT_RECEIPT|T|D");
//aa.env.setValue("RunDate","");
//aa.env.setValue("emailTemplate","EMAIL RECEIPT");
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
var SCRIPT_VERSION = 3.0
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

var ToEmailAddress = lookup("BATCH_STATUS_EMAIL", "PAYMENT RECEIPTS"); // This email will be set by standard choice
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
       aa.sendMail(sysFromEmail, ToEmailAddress, "", "Batch Job: PAYMENT RECEIPTS", debug);

}

function processLics() {
	var capCount = 0;
	var fvToday = new Date();
	fvToday.setHours(0);
	fvToday.setMinutes(0);
	fvToday.setSeconds(0);
	fvToday.setMilliseconds(0);
	logDebug("Today is: " + fvToday);
	var setName = aa.env.getValue("SetID");
	var emailTemplate = aa.env.getValue("emailTemplate");
	var setDatetoProcess = aa.env.getValue("setDatetoProcess");
	var runDate = aa.env.getValue("RunDate");
        var previousDayFlag = aa.env.getValue("RunforPreviousDay");
        logDebug("PreviousFlag " + previousDayFlag);
	logDebug("SetID: " + setName);
	logDebug("emailTemplate: " + emailTemplate);
	logDebug("setDatetoProcess: " + setDatetoProcess);
	var SetRunDate = new Date();
	if (setDatetoProcess && setDatetoProcess != "")
		SetRunDate = new Date(setDatetoProcess);
	logDebug("SetRunDate set: " + SetRunDate);
	
	var fvRunDate = new Date();
	if (runDate && runDate != "")
		fvRunDate = new Date(runDate);
	logDebug("RunDate set: " + fvRunDate);
	var setNameArr = String(setName).split("|");

	if (setNameArr.length != 3) {
		logDebug("Invalid Set Name.");
		return;
	}

	setName = setName + "|";
	var setNameWODate = setName;
	var setNames = [];

	for (fvCounter = 0; fvCounter < 1; fvCounter++) {
		if(setDatetoProcess && setDatetoProcess != "")
    {
			processDate = new Date(SetRunDate);	
		}
			else 
      {
				if(previousDayFlag == "Y")
				{				
					fvRunDate.setDate(fvRunDate.getDate() - 1);
					processDate = new Date(fvRunDate);
					processDate.setHours(0);
					processDate.setMinutes(0);
					processDate.setSeconds(0);
					processDate.setMilliseconds(0);							
					logDebug("processDate1 " + processDate);
				}
		    else
		    {
		        processDate = new Date(fvRunDate);
						processDate.setHours(0);
						processDate.setMinutes(0);
						processDate.setSeconds(0);
						processDate.setMilliseconds(0);		
            logDebug("processDate2 " + processDate);	
		    }
      }

		processDate.setDate(processDate.getDate() + fvCounter);
                logDebug("processDate:" +processDate);
		setName = getSetName(setNameWODate, processDate);
		logDebug("Processing Date: " + processDate);
		var setNameArr = String(setName).split("|");
		setNames.push(setName);
		logDebug("Processing Set: " + setName);

		var reportSet = new capSet(setName);
		var reportMembers = reportSet.members;
		var capId = null;
		var myHashMap = null;
		var complainantEmail = null;
		var reportToBe = null;
		var setLkupName = null;
		var emailToWho = null;
		var versionValue = null;
		setLkupName = setNameArr[0];

		var lkupReport = String(lookup("LKUP_SetName_To_Correspondence", setLkupName));

		if (lkupReport == 'undefined') {
			logDebug("Set Name: " + setLkupName + " is not tied to a correspondence.  No printing was done, please see administrator for help.");
			// If this error happens check LKUP_SetName_To_Correspondence and ensure the setName is correct
			return false;
		}

		reportToBe = lkupReport.split("|");
		logDebug("ReportTObe: " + reportToBe);
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

			for (var rm = 0; rm < reportMembers.length; rm++) // for each individual record add the appropriate document
			{
				var capIdObj = aa.cap.getCapID(reportMembers[rm].getID1(), reportMembers[rm].getID2(), reportMembers[rm].getID3());
				if (capIdObj.getSuccess()) {
					capId = capIdObj.getOutput();
					if (fvCounter == 1) {
						var fvAlreadyProcessed = isCapIDInSet(setNames[0], capId);
						if (fvAlreadyProcessed)
							continue;
					}
					cap = aa.cap.getCap(capId).getOutput();
					var contactsToEmail = new Array();
					var emailed = null;
					var stillPrint = false;
					// if false need to generate report and at to record otherwise email report and add to record
					logDebug("Processing :" + capId.getCustomID());
					if (sendEmail && sendEmail.toUpperCase() == "TRUE") {
						// only email if the correspondence can be emailed
						switch (emailToWho) {
							case "ALL":
								logDebug("Getting ALL CAP contacts.");
								var co = getContactObjs(capId);
								for (i in co) {
									var cc = co[i].capContact;
									if (cc.email != null && validEmail(cc.email)) {
										contactsToEmail.push(co[i]);
									} else
										stillPrint = true;
								}
								break;

							case "PRIMARY":
								logDebug("Getting PRIMARY CAP contact.")
								var co = getContactObjs(capId);
								for (i in co) {
									var cc = co[i].capContact;
									if (cc.email != null && validEmail(cc.email) && cc.primaryFlag == "Y") {
										logDebug("Primary contact with valid email found. " + cc.getContactName());
										contactsToEmail.push(co[i]);
									} else
										stillPrint = true;
								}
								break;

							default:
								if (emailToWho) {
									var contactsToMail = emailToWho.split(",");
									for (c in contactsToMail) {
										logDebug("Getting CAP contact type " + contactsToMail[c]);
										var co = getContactObjs(capId);
										for (i in co) {
											var cc = co[i].capContact;
											if (cc.getContactType() != null && String(cc.getContactType()).toUpperCase().equals(contactsToMail[c].toUpperCase())) {
												if (cc.email != null) {
													if (validEmail(cc.email)) {
														logDebug("Contact type " + cc.getContactType() + " found with valid email. " + cc.getContactName());
														contactsToEmail.push(co[i]);
													} else
														emailNotifTo = null;
												} else
													stillPrint = true;
											}
										}
									}
								}
								break;
						}
						// end determing email addresses
					}

					// begin the transaction items to be committed to the database
					//aa.batchJob.beginTransaction(10);

					var setDetail = aa.set.getSetDetailsScriptModel();
					var setDetailsModel = null;
					if (setDetail.getSuccess()) {
						setDetailsModel = setDetail.getOutput();
						setDetailsModel.setID1(reportMembers[rm].getID1());
						setDetailsModel.setID2(reportMembers[rm].getID2());
						setDetailsModel.setID3(reportMembers[rm].getID3());
						setDetailsModel.setSetID(setName);
					}

					var fvReceiptReoprts = new Array();
					var fvReceiptsSR = aa.finance.getReceiptByCapID(capId, null);
					if (!fvReceiptsSR || !fvReceiptsSR.getSuccess())
						continue;
					var fvReceipts = fvReceiptsSR.getOutput();
					if (!fvReceipts || fvReceipts.length == 0)
						continue;
					var fvTotalAmtPaid = 0;
					for (var fvRcptCnt in fvReceipts) {
						var fvReceipt = fvReceipts[fvRcptCnt];
						var receiptnumber = fvReceipt.getReceiptNbr();
						var fvRcptDt = fvReceipt.getReceiptDate();
						var fvReceiptDate = new Date(fvRcptDt.getMonth() + "/" + fvRcptDt.getDayOfMonth() + "/" + fvRcptDt.getYear());
						logDebug("Receipt: " + receiptnumber + " Dt.: " + fvReceiptDate);
						
						// This logic is to check if CapID has multiple receipts then mail only receipt which matches either setDatetoProcess date or Today's date.
						if(setDatetoProcess && setDatetoProcess != "")
						{
							if (fvReceiptDate.getTime() != processDate.getTime())
								continue;
						}
						else
						{
							if (fvReceiptDate.getTime() != processDate.getTime())
								continue;
						}

						var myHashMap = aa.util.newHashMap();
						fvTotalAmtPaid = fvTotalAmtPaid + fvReceipt.getReceiptAmount();
						//myHashMap.put("Receipt_NBR", String(receiptnumber));
						//myHashMap.put("ALT_ID", String(capId.getCustomID()));
						myHashMap.put("receiptnbr", String(receiptnumber));
						myHashMap.put("capID", String(capId.getCustomID()));
						if (versionValue) {
							var vSplit = versionValue.split(":");
							var varName = String(vSplit[0]);
							var vValue = String(vSplit[1]);
							myHashMap.put(varName, vValue);
							// for the paymentDue / pastDue Notices  Scale & Collections, adjournment disposition letters
						}
						var fvReceiptReport = generateReportAndSave(reportToBe[0], myHashMap, capId);
						if (fvReceiptReport)
							fvReceiptReoprts.push(fvReceiptReport);
					}
					if (fvReceiptReoprts.length == 0) {
						logDebug("No Receipts found with date = " + processDate );
						continue;
					}
					logDebug(fvReceiptReoprts.length);

					var generatedCompletely = true;
					if (contactsToEmail.length > 0 && emailToWho != "SPECIAL") {
						for (c in contactsToEmail) {
							var cc = contactsToEmail[c].capContact;
							var emailParameters = getEmailTemplateParams(contactsToEmail[c]);
							addParameter(emailParameters, "$$TotalAmtPaid$$", fvTotalAmtPaid.toString());
							if (!emailReports(fvReceiptReoprts, emailTemplate, emailParameters, String(cc.email), capId))
								generatedCompletely = false;
							if (generatedCompletely)
								logDebug("Receipts sent to " + cc.getContactName() + " - " + cc.getContactType() + " " + cc.email);

							if (setDetailsModel && generatedCompletely) {
								setDetailsModel.setSetMemberStatus("Emailed");
								var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
								if (!updateResult.getSuccess())
									logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
							}
						}
					}

					if (!generatedCompletely) {
						setDetailsModel.setSetMemberStatus("Error");
						var updateResult = aa.set.updateSetMemberStatus(setDetailsModel);
						if (!updateResult.getSuccess())
							logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());

						allSetMembersEmailed = false;
					}
					// commit the Transaction for the batch report to correctly identify the members that have been emailed
					//aa.batchJob.commitTransaction();
					capCount++;
				}
			}
		}

		//If all members of the set are e-mailed, then no need to sent for printing!
		if (allSetMembersEmailed) {
			var vgetSetByPK = aa.set.getSetByPK(setName).getOutput();
			if (vgetSetByPK != null) {
				vgetSetByPK.setSetStatusComment("All set members sent via e-mail");
				vgetSetByPK.setSetStatus("Emailed");
				aa.set.updateSetHeader(vgetSetByPK);
			}
		} else {
			if (reportMembers.length > 0 && reportToBe.length > 1) // If the set has members attach the bulk printing document
			{
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
			}
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
function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

function getSetName(ipNameWODate, ipProcessDate) {
	var fvYear = ipProcessDate.getFullYear().toString();
	var fvMonth = ("0" + (ipProcessDate.getMonth() + 1).toString()).slice(-2);
	var fvDay = ("0" + ipProcessDate.getDate().toString()).slice(-2);
	var opSetName = ipNameWODate + fvYear + fvMonth + fvDay;
	return opSetName;
}

function generateReportAndSave(reportName, hashMapReportParameters) {
	var itemCap = capId;
	if (arguments.length > 2) // assume capId was passed
		itemCap = arguments[2];

	if (String(hashMapReportParameters.getClass()) !== "class java.util.HashMap") {
		logDebug("Function generateReportAndSave parameter hashMapReportParameters must be of class java.util.HashMap.  Usage: var myHashMap = aa.util.newHashMap()");
		return false;
	}

	var capIdStr = String(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());

	var report = aa.reportManager.getReportInfoModelByName(reportName);
	var reportResult = null;

	if (report.getSuccess()) {
		report = report.getOutput();
		report.setModule("*");
		report.setCapId(capIdStr);

		// specific to * Licensing
		report.setReportParameters(hashMapReportParameters);
		var ed1 = report.getEDMSEntityIdModel();
		ed1.setCapId(capIdStr);
		// Needed to determine which record the document is attached
		ed1.setAltId(itemCap.getCustomID());
		// Needed to determine which record the document is attached
		report.setEDMSEntityIdModel(ed1);

		reportResult = aa.reportManager.getReportResult(report);
	}
	if (reportResult) {
		reportResult = reportResult.getOutput();
		if (reportResult != null) {
			var reportFile = aa.reportManager.storeReportToDisk(reportResult);
			reportFile = reportFile.getOutput();
		} else {
			logDebug("Report Result is null in function generateReportAndSave with reportName: " + reportName);
			return false;
		}
	} else {
		logDebug("Unable to retrieve report result in function generateReportAndSave with reportName: " + reportName);
		return false;
	}

	return reportFile;
}

function emailReports(Reports, emailTemplate, hashTableEmailTemplateParameters, emailTo) {
	var itemCap = capId;
	var fvCC = "";

	if (arguments.length > 4) // assume capId was passed
		itemCap = arguments[4];

	if (arguments.length > 5) // assume CC was passed
		fvCC = arguments[5];

	if (emailTemplate == null || emailTemplate == "") {
		logDebug("function emailReports parameter emailTemplate is required");
		return false;
	}

	if (String(hashTableEmailTemplateParameters.getClass()) !== "class java.util.Hashtable") {
		logDebug("Function emailReports parameter hashTableEmailTemplateParameters must be of class java.util.newHashtable.  Usage: var myHashtable = aa.util.newHashtable()");
		return false;
	}

	if (emailTo && emailTo.indexOf("@") == -1) {
		logDebug("Function emailReports parameter emailTo must be a valid email address.");
		return false;
	}

	if (fvCC && fvCC != "" && fvCC.indexOf("@") == -1) {
		logDebug("Function emailReports parameter CC must be a valid email address.");
		return false;
	}

	if (Reports.length == 0) {
		logDebug("Function emailReports parameter Reports should have at least one report.");
		return false;
	}

	var capIdStr = String(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());
	if (emailTo) {
		var capIDScriptModel = aa.cap.createCapIDScriptModel(itemCap.getID1(), itemCap.getID2(), itemCap.getID3());
		var sendNotificationResult = null;
		sendNotificationResult = aa.document.sendEmailAndSaveAsDocument(sysFromEmail, emailTo, fvCC, emailTemplate, hashTableEmailTemplateParameters, capIDScriptModel, Reports);
		if (sendNotificationResult.getSuccess()) logDebug("SendNotification is: " + sendNotificationResult.getSuccess());
	}
	return true;
}