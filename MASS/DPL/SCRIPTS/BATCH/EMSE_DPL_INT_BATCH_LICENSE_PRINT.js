/* ------------------------------------------------------------------------------------------------------ /
| Program : BatchPrint - License  Trigger : Batch
| Client : eLicensing System Implementation - DPL
|
| Version 2.0 - Base Version. 17 / 07 / 2014 - Amol Surjuse
|
| Script loops through set members, adds a report determined by a lookup table using the setName  to each record in the set
| then generates a batch report for printing and attaches the report to the set.

| Batch Requirements :
| - Valid Set of name convention.
| - Script to be run weekly every Monday
|
|
/ ------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------ /
| START : USER CONFIGURABLE PARAMETERS
/ ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0;
var documentOnly = false;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));

var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var paramsOK = true;
var licenseSeqName;
var reportName;
var bulkReportName;
var fileLocation;
var sdtChoiceForSrNumber;
var showDebug = true;
var recordsNotPresentInPDFArray = new Array();
var alreadyExistsInSetArray = new Array();
var invalidRecordsInSetArray = new Array();
var expiredRecordsInSetArray = new Array();
var expDateNotValidInSetArray = new Array();
var incorrectHierarchyInSetArray = new Array();
var setMemberStatus = "";

// Start : Code to send email
var senderEmailAddr = "noreply@dpl.state.ma.us";
var batchJobName = aa.env.getValue("BatchJobName");
var emailAddress = ""; // Add all text that you want to send in the email to this string variable

var emailAddress = lookup("BATCH_STATUS_EMAIL", "LICENSE PRINT"); // This email will be set by standard choice


var emailAddress2 = aa.env.getValue("emailAddress"); // This will be secondary email set by batch job param

if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined") {
	emailAddress2 = "";
}
// End : Code to send email


var issueDate = jsDateToASIDate(new Date());

/* ------------------------------------------------------------------------------------------------------ /
| END : USER CONFIGURABLE PARAMETERS
/ ------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------ /
| <=========== Main = Loop ================ >
|
/ ------------------------------------------------------------------------------------------------------ */

if (paramsOK) {
	logDebug("Start of Batch Print For License Batch Job.");
	try {
		//var numRecordsFeeProcessed = printBatchJob();
		var recordCounts = printBatchJob();
		//logDebug("INFO: Number of records processed: " + numRecordsFeeProcessed + ".");
		//EPLACE-2622	PRD_DPL_License Batch clone set and PDF numbers does not match in Log and PDF is missing 1 record
		logDebug("---------------------------------Batch Print Summary starts---------------------------------------")
		logDebug("INFO: Number of records in Set : " + recordCounts.setCount + ".");
		logDebug("INFO: Number of records already printed : " + recordCounts.alreadyPrinted + ".");
		logDebug("INFO: Number of records failed while updating the ASIT DUPLICATE LICENSE HISTORY : " +invalidRecordsInSetArray.length+ ".");
		logDebug("INFO: Number of records Invalid license status in the SET : " +expiredRecordsInSetArray.length + ".");
		logDebug("INFO: Number of records Invalid license Expiration date in the SET : " +expDateNotValidInSetArray.length + ".");
		logDebug("INFO: Number of records Incorrect hierarchy in the SET : " +incorrectHierarchyInSetArray.length + ".");
		logDebug("INFO: Number of duplicate records :       " +recordCounts.alreadyExistsInSet + ".");
		logDebug("INFO: Number of records not included in the PDF due to invalid address :  " +recordsNotPresentInPDFArray.length+ ".");
		logDebug("INFO: Number of records added to CLONE SET :       " +recordCounts.actualNbrOfRecordsInCloneSet + ".");
        // Commenting below log as PDF count can not be calculated from batch.
		//logDebug("INFO: Number of records in PDF :       " +recordCounts.actualNbrOfRecordsInCloneSet + "."); 
		
		//logDebug("Records in Clone SET = (Total in set) - (Already printed) - (Duplicate record)");
		//logDebug("INFO: Number of records added to CLONE SET :       " + recordCounts.numRecordsProcessed + ".");
		//Calculate the no. of records in PDF
		//logDebug("Number of records in PDF = No. of Records in CLONE SET - No. of records for missing address");
		//var noOfRecordsInPDF = parseInt(recordCounts.numRecordsProcessed) - parseInt(recordsNotPresentInPDFArray.length);
		
		logDebug("------------------------------------Batch Print Summary ends------------------------------------------------------");

		if (alreadyExistsInSetArray.length != 0) {
			logDebug("------Duplicate records in SET starts-----------");
			for (index in alreadyExistsInSetArray) {
				logDebug(alreadyExistsInSetArray[index]);
			}
			logDebug("------Duplicate records in SET Ends-----------");
		}

		if (recordsNotPresentInPDFArray.length != 0) {
			logDebug("------Excluded records from PDF starts-----------")
			for (index in recordsNotPresentInPDFArray) {
				logDebug(recordsNotPresentInPDFArray[index]);
			}
			logDebug("------Excluded records from PDF Ends-----------");
		}

		if (invalidRecordsInSetArray.length != 0) {
			logDebug("------Records do not have the ASIT DUPLICATE LICENSE HISTORY -----------")
			for (index in invalidRecordsInSetArray) {
				logDebug(invalidRecordsInSetArray[index]);
			}
			logDebug("------Records do not have the DUPLICATE ASIT LICENSE HISTORY Ends-----------");
		}
		//Sagar : EPLACE-2319	DPL_PROD_AA- Issues with License Print file of 01/30
		if (expiredRecordsInSetArray.length != 0) {
			logDebug("------ Expired license records in the SET starts -----------")
			for (index in expiredRecordsInSetArray) {
				logDebug(expiredRecordsInSetArray[index]);
			}
			logDebug("------Expired license records in the SET Ends-----------");
		}
		
		//expDateNotValidInSetArray
		if (expDateNotValidInSetArray.length != 0) {
			logDebug("------ ExpDate is not valid on license records in the SET starts -----------")
			for (index in expDateNotValidInSetArray) {
				logDebug(expDateNotValidInSetArray[index]);
			}
			logDebug("------ExpDate is not valid on license records in the SET Ends-----------");
		}
		//Sagar : EPLACE-2480 : License Registration Card-Incorrect Hierarchy and Runtime Exception errors that was found with ticket 2159 needs to be fixed 
		if (incorrectHierarchyInSetArray.length != 0) 
		{
			logDebug("------ Records with INCORRECT HIERARCHY OR VALUE NOT RETRIEVED FROM STD CHOICE FOR ADDRESS VALIDATION in the SET starts -----------");
			for (index in incorrectHierarchyInSetArray) 
			{
				logDebug(incorrectHierarchyInSetArray[index]);
			}
			logDebug("------ Records with INCORRECT HIERARCHY OR VALUE NOT RETRIEVED FROM STD CHOICE FOR ADDRESS VALIDATION in the SET ENDS -----------");
		}
		
		logDebug("End of BatchPrint For License Job: Elapsed Time : " + elapsed() + " Seconds.");
	} catch (ex) {
		logDebug("ERROR: " + ex.toString());
		logDebug("End of BatchPrint For License Job: Elapsed Time : " + elapsed() + " Seconds.");
	}
	finally {
		if (showDebug) {
			aa.env.setValue("ScriptReturnMessage", debug);
		}
		//Sagar: Fix for PROD Defect 7018: There's no way to be certain, without looking at the log file that a batch job ran correctly or not
		if (!ELPLogging.isFatal()) {
			aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
			logDebug("EMSEReturnCode", ScriptReturnCodes.SUCCESS);

			if (ELPLogging.getErrorCount() > 0) {
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_BATCH_LICENSE_PRINT completed with " + ELPLogging.getErrorCount() + " errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_BATCH_LICENSE_PRINT completed with " + ELPLogging.getErrorCount() + " errors.");
			} else {
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_BATCH_LICENSE_PRINT completed with no errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_BATCH_LICENSE_PRINT completed with no errors.");
			}
		}

		if (emailAddress && emailAddress != "" && emailAddress.length > 0) {
			aa.sendMail(senderEmailAddr, emailAddress, emailAddress2, "Result: " + batchJobName, debug);
		}
	}
}

function printBatchJob() {
	var recordCounts = {};
	recordCounts.alreadyPrinted = 0;
	recordCounts.setCount = 0;
	recordCounts.alreadyExistsInSet = 0;
	recordCounts.numRecordsProcessed = 0
	recordCounts.actualNbrOfRecordsInCloneSet=0;

	var capCount = 0;
	var setLkupName = null;
	var setName = aa.env.getValue("SetID");
	if (setName == "")
		setName = getSetName();
	logDebug("Set Name is: " + setName);
	var reportSet = new capSet(setName);
	var reportMembers = reportSet.members;
	var tempSetName = setName + "_LICENSE_CLONE";
	var tempSetResult = aa.set.getSetByPK(tempSetName);
	if (!tempSetResult.getSuccess()) {
		var tempLicResult = aa.set.createSet(tempSetName, tempSetName);
		if (!tempLicResult.getSuccess())
			throw new ELPAccelaEMSEException("Cannot create Temp License Set", ScriptReturnCodes.EMSE_PROCEDURE);
	}

	var tempLicSet = aa.set.getSetByPK(tempSetName).getOutput();
	logDebug("Temp Set Name is: " + tempLicSet.getSetID());

	var capId = null;
	var myHashMap = null;
	//Fetching LookUpReport from the standard choice based on key and value.
	var lkupReport = String(lookup("BATCH_PRINT_CONFIG_PARAM", "LICENSE"));
	var printStatus = "Printed";
	var errorStatus = "Error Generating Report";

	reportToBe = lkupReport.split("|");

	// Split LkupReport based on "|" and separated the reportName, bulkReportName, fileLocation and stdChoiceForSrNumber
	if (reportToBe[0] != "NULL") {
		if (reportToBe.length >= 2) {
			reportName = reportToBe[0];
			bulkReportName = reportToBe[1];
			fileLocation = reportToBe[2];
			sdtChoiceForSrNumber = reportToBe[3];
		}
	}

	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	setDetailScriptModel.setSetID(setName);
	var memberList = aa.set.getSetMembers(setDetailScriptModel).getOutput();

	logDebug("INFO: Number of records in Set: " + memberList.size() + ".");
	recordCounts.setCount = memberList.size();

	// for each individual record add the appropriate document
	for (var index = 0; index < memberList.size(); index++) 
	{
		//EPLACE-2548 : DPL_PRD_License Print of 03/06 is just generating 431 out of 3000+ records in print set
		try
		{
			var setMember = memberList.get(index);
			var recordID = retrieveRecordID(setMember);
			logDebug("----------------------------------------------------------Processing record : " +recordID);
			logDebug("Record added to SET by user : "+setMember.getAuditID())
			setMemberStatus = setMember.getSetMemberStatus();
			
			if ((setMemberStatus != printStatus) || (!setMemberStatus)) 
			{
				var capIdObj = aa.cap.getCapID(setMember.getID1(), setMember.getID2(), setMember.getID3());

				if (capIdObj.getSuccess()) 
				{
					var childCapID = capIdObj.getOutput();
					if (childCapID) 
					{
						var parentCapID = getParentLicenseRecord(childCapID);
						
						var licList = null;

						if (parentCapID) 
						{
							parentCapID = aa.cap.getCapID(parentCapID.getID1(), parentCapID.getID2(), parentCapID.getID3()).getOutput();
							logDebug("Child record : " + childCapID.getCustomID() + " || Parent record : " + parentCapID.getCustomID());
							capId = parentCapID;
							myHashMap = aa.util.newHashMap();
							myHashMap.put("ALT_ID", String(capId.getCustomID()));

							var reasonType = getReasonType(childCapID);
							logDebug("reasonType : "+reasonType);

							if (reasonType == "Name change") 
							{
								licList = getAmendmentLicList(childCapID);
								if (licList.length > 0) 
								{
									//for start
									for (thisLic in licList) 
									{
										var capIDResult = aa.cap.getCapID(licList[thisLic]);
										if (capIDResult.getSuccess()) 
										{
											var licCapID = capIDResult.getOutput();
											//logDebug("Amendment list : "+licCapID);

											//Fix for PROD defect 8263 and 7952
											var isDupRecord = cloneSetDuplicateRecordCheck(tempSetName, licCapID);
											logDebug("Is Clone SET duplicate record_1 ? = " + isDupRecord);
											if (!isDupRecord) 
											{
												//Perform validation for contact address. Those records fails validation for contact address will not be printed in PDF.
												//Sagar : Fix for PROD Defect # 12597 : DPL - License Print count of records printed in error
												var contactAddressValidationFlag = validateContactAddressForRecords(licCapID);
												//Sagar : EPLACE-2319 : DPL_PROD_AA- Issues with License Print file of 01/30
												var recStatus = validateRecordStatus(licCapID);
												var isValidExpDate = validateExpDateOnLic(licCapID);
												logDebug("contactAddressValidationFlag_1 : "+contactAddressValidationFlag+" || recStatus_1 : " +recStatus+" || isValidExpDate : "+isValidExpDate);
												
												if (contactAddressValidationFlag && (recStatus == "Current") && isValidExpDate) 
												{
													var result = aa.set.add(tempSetName, licCapID);
													if(result.getSuccess())
													{
														logDebug("Record has been added to CLONE set : "+licCapID.getCustomID());
													}
													else
													{
														logDebug("Record failed to add to CLONE set : "+licCapID.getCustomID()+" || Error : "+result.getErrorMessage());
													}
													capCount++;
													recordCounts.numRecordsProcessed++;
													var isSuccessful = generateReportSaveForGivenRecord(reportName, myHashMap, licCapID, childCapID);
													
													logDebug("Is report generated successfully for record_1 : " + licCapID.getCustomID() + " ? " + isSuccessful);
													if (isSuccessful) 
													{
														setMemberStatus = printStatus;
													}
													else 
													{
														setMemberStatus = errorStatus;
													}
												} 
												else 
												{
													logDebug("Address validation fails OR license is not in Current status OR not valid expDate for License record : " + licCapID.getCustomID());
												}
											} 
											else
											{
												logDebug("License record : " + licCapID + " already exists in the Clone set");
												//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
												if(setMemberStatus != null)
												{
													if(setMemberStatus.length != 0)
													{
														setMemberStatus = setMemberStatus + " || DuplicateRecord";
													}
												}
												else
												{
													setMemberStatus = "DuplicateRecord";
												}
												recordCounts.alreadyExistsInSet++;
												alreadyExistsInSetArray.push(licCapID.getCustomID());
											}
										}
										else 
										{
											logDebug("Error retrieving CAP ID for " + licList[thisLic] + ", Error: " + capIDResult.getErrorMessage());
										}
									} //for
								} 
								else 
								{ 
									//For Business amendmend
									var licCapID = capId;
									
									//Fix for PROD defect 8263 and 7952
									var isDupRecord = cloneSetDuplicateRecordCheck(tempSetName, licCapID);
									logDebug("Is Clone SET duplicate record_2 ? = " + isDupRecord);
									if (!isDupRecord) 
									{
										//Perform validation for contact address. Those records fails validation for contact address will not be printed in PDF.
										//Sagar : Fix for PROD Defect # 12597 : DPL - License Print count of records printed in error
										var contactAddressValidationFlag = validateContactAddressForRecords(licCapID);
										
										//Sagar : EPLACE-2319 : DPL_PROD_AA- Issues with License Print file of 01/30
										var recStatus = validateRecordStatus(licCapID);
										var isValidExpDate = validateExpDateOnLic(licCapID);
										
										logDebug("contactAddressValidationFlag_2 : "+contactAddressValidationFlag+" || recStatus_2 : " +recStatus+" || isValidExpDate_2 : "+isValidExpDate);
										
										if (contactAddressValidationFlag && (recStatus == "Current") && isValidExpDate) 
										{
											var result = aa.set.add(tempSetName, licCapID);
											if(result.getSuccess())
											{
												logDebug("Record has been added to CLONE set : "+licCapID.getCustomID());
											}
											else
											{
												logDebug("Record failed to add to CLONE set : "+licCapID.getCustomID()+" || Error : "+result.getErrorMessage());
											}
											capCount++;
											recordCounts.numRecordsProcessed++;
											var isSuccessful = generateReportSaveForGivenRecord(reportName, myHashMap, licCapID, childCapID);
											
											logDebug("Is report generated successfully for record_2 : " + licCapID.getCustomID() + " ? " + isSuccessful);
											
											if (isSuccessful) 
											{
												setMemberStatus = printStatus;
											} 
											else 
											{
												setMemberStatus = errorStatus;
											}
										} 
										else 
										{
											logDebug("Address validation fails OR license is not in Current status OR not valid expDate for License record : " + licCapID.getCustomID());
										}
									} 
									else 
									{
										logDebug("License record : " + licCapID + " already exists in the Clone set");
										//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
										if(setMemberStatus != null)
										{
											if(setMemberStatus.length != 0)
											{
												setMemberStatus = setMemberStatus + " || DuplicateRecord";
											}
										}
										else
										{
											setMemberStatus = "DuplicateRecord";
										}
										recordCounts.alreadyExistsInSet++;
										alreadyExistsInSetArray.push(licCapID.getCustomID());
									}
								}
							} 
							else 
							{
								if (licList == null) 
								{
									//Fix for PROD defect 8263 and 7952
									var isDupRecord = cloneSetDuplicateRecordCheck(tempSetName, capId);
									logDebug("Is Clone SET duplicate record_3 ? = " + isDupRecord);
									
									if (!isDupRecord) 
									{
										//Perform validation for contact address. Those records fails validation for contact address will not be printed in PDF.
										//Sagar : Fix for PROD Defect # 12597 : DPL - License Print count of records printed in error
										var contactAddressValidationFlag = validateContactAddressForRecords(capId);
										
										//Sagar : EPLACE-2319 : DPL_PROD_AA- Issues with License Print file of 01/30
										var recStatus = validateRecordStatus(capId);
										var isValidExpDate = validateExpDateOnLic(capId);
										logDebug("contactAddressValidationFlag_3 : "+contactAddressValidationFlag+" || recStatus_3 : " +recStatus +" || isValidExpDate : "+isValidExpDate);
										
										if (contactAddressValidationFlag && (recStatus == "Current") && isValidExpDate)
										{
											var result = aa.set.add(tempSetName, capId);
											if(result.getSuccess())
											{
												logDebug("Record has been added to CLONE set : "+capId.getCustomID());
											}
											else
											{
												logDebug("Record failed to add to CLONE set : "+capId.getCustomID()+" || Error : "+result.getErrorMessage());
											}
											capCount++;
											recordCounts.numRecordsProcessed++;
											var isSuccessful = generateReportSaveForGivenRecord(reportName, myHashMap, capId, childCapID);
											logDebug("Is report generated successfully for record_3 : " + capId.getCustomID() + " ? " + isSuccessful);
											if (isSuccessful) 
											{
												setMemberStatus = printStatus;
											}
											else 
											{
												setMemberStatus = errorStatus;
											}
										} 
										else 
										{
											logDebug("Address validation fails OR license is not in Current status OR not valid expDate for License record : " + capId.getCustomID());
										}
									}
									else 
									{
										logDebug("License record : " + capId + " already exists in the Clone set");
										//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
										if(setMemberStatus != null)
										{
											if(setMemberStatus.length != 0)
											{
												setMemberStatus = setMemberStatus + " || DuplicateRecord";
											}
										}
										else
										{
											setMemberStatus = "DuplicateRecord";
										}
										recordCounts.alreadyExistsInSet++;
										alreadyExistsInSetArray.push(capId.getCustomID());
									}
								}
							}
							var auditID = aa.env.getValue("CurrentUserID");
							
							var setDetailScriptModel = new com.accela.aa.emse.dom.SetDetailsScriptModel("DPL", auditID, setMember);
							setDetailScriptModel.setSetMemberStatus(setMemberStatus);
							var updateResult = aa.set.updateSetMemberStatus(setDetailScriptModel);
							if (!updateResult.getSuccess()) 
							{
								logDebug("Script failed up to update SetMemberStatus for record " + childCapID.getCustomID());
							}
						}
						else 
						{
							// Defect 4245 and 4645(Reactivate Real Estate License - RTM Requirement 4.12.1 [o])
							capId = childCapID;
							var tempCapID = null;
							myHashMap = aa.util.newHashMap();
							myHashMap.put("ALT_ID", String(capId.getCustomID()));

							//logDebug("Successfully attached report to record");
							//Check to see if this was a name change amendment
							if (licList == null) 
							{
								//logDebug("tempSetName # "+tempSetName+" $$ capId # "+capId);
								//Fix for PROD defect 8263 and 7952
								var isDupRecord = cloneSetDuplicateRecordCheck(tempSetName, capId);
								logDebug("Is Clone SET duplicate record_4 ? " + isDupRecord);
								if (!isDupRecord) 
								{
									//Perform validation for contact address. Those records fails validation for contact address will not be printed in PDF.
									//Sagar : Fix for PROD Defect # 12597 : DPL - License Print count of records printed in error
									var contactAddressValidationFlag = validateContactAddressForRecords(capId);
									//Sagar : EPLACE-2319 : DPL_PROD_AA- Issues with License Print file of 01/30
									var recStatus = validateRecordStatus(capId);
									var isValidExpDate = validateExpDateOnLic(capId);
									logDebug("contactAddressValidationFlag_4 : "+contactAddressValidationFlag+" || recStatus_4 : " +recStatus+" || isValidExpDate_4 : "+isValidExpDate);
									
									if (contactAddressValidationFlag && (recStatus == "Current") && isValidExpDate) 
									{
										var result = aa.set.add(tempSetName, capId);
										if(result.getSuccess())
										{
											logDebug("Record has been added to CLONE set : "+capId.getCustomID());
										}
										else
										{
											logDebug("Record failed to add to CLONE set : "+capId.getCustomID()+" || Error : "+result.getErrorMessage());
										}
										capCount++;
										recordCounts.numRecordsProcessed++;
										var isSuccessful = generateReportSaveForGivenRecord(reportName, myHashMap, capId, tempCapID);
										logDebug("Is report generated successfully for record_4 : " + capId.getCustomID() + " ? " + isSuccessful);
										if (isSuccessful) 
										{
											setMemberStatus = printStatus;
										} 
										else 
										{
											setMemberStatus = errorStatus;
										}
									} 
									else 
									{
										logDebug("Address validation fails OR license is not in Current status OR not valid expDate for License record : : " + capId.getCustomID());
									}
								} 
								else 
								{
									logDebug("License record : " + capId + " already exists in the Clone set");
									//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
									if(setMemberStatus != null)
									{
										if(setMemberStatus.length != 0)
										{
											setMemberStatus = setMemberStatus + " || DuplicateRecord";
										}
									}
									else
									{
										setMemberStatus = "DuplicateRecord";
									}
									recordCounts.alreadyExistsInSet++;
									alreadyExistsInSetArray.push(capId.getCustomID());
								}
							}

							var auditID = aa.env.getValue("CurrentUserID");

							var setDetailScriptModel = new com.accela.aa.emse.dom.SetDetailsScriptModel("DPL", auditID, setMember);
							setDetailScriptModel.setSetMemberStatus(setMemberStatus);
							var updateResult = aa.set.updateSetMemberStatus(setDetailScriptModel);
							if (!updateResult.getSuccess()) 
							{
								logDebug("Script failed up to update SetMemberStatus for record " + childCapID.getCustomID());
							}
						}
					} 
					else
					{
						logDebug("DEBUG: SKIP CapID " + setMember.getID1() + "-" + setMember.getID2() + "-" + setMember.getID3() + " NOT FOUND ");
					}
				} 
				else 
				{
					logDebug("DEBUG: SKIP CapID " + setMember.getID1() + "-" + setMember.getID2() + "-" + setMember.getID3() + " NOT FOUND ");
				}
			} 
			else 
			{
				recordCounts.alreadyPrinted++;
			}
		}
		catch(ex)
		{
			logDebug("****Exception # : "+ex.message);
		}
		
	}

	/*------------------- Print Batch REPORT ---------------------*/
	var tempSetDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	tempSetDetailScriptModel.setSetID(tempSetName);
	var tempList = aa.set.getSetMembers(tempSetDetailScriptModel).getOutput();
	recordCounts.actualNbrOfRecordsInCloneSet=tempList.size();
	logDebug("Print Batch REPORT size :" + tempList.size());
	if (tempList.size() > 0) 
	{
		var reportForSet = reportToBe;
		var batchHashParameters = aa.util.newHashMap();
		var batchCompleted = false;
		batchHashParameters.put("SET_ID", tempSetName);
		batchCompleted = generateReportSaveOnSetForLicense(reportForSet[1], batchHashParameters, setName);
		if (batchCompleted) 
		{
			reportSet.updateSetStatus(printStatus);
			logDebug("Updated Set Status to " + printStatus);
		}
		else 
		{
			reportSet.updateSetStatus(errorStatus);
			logDebug("Updated Set Status to " + errorStatus);
		}
	} 
	else 
	{
		logDebug("*******WARNING: No records were added to the TEMP SET**********");
	}
	
	return recordCounts;
}
/**
 * @desc This method calculates the time for end of BatchPrint For License Job
 * @param {}
 */

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

/**
 * @desc This method generates report PDF document for a given record.
 * @param reportName - Contains reportName
 * @param hashMapReportParameters - Contains hashMapReportParameters
 * @param capId - Contains the capID
 * @param childCapID - Contains the Child Cap ID
 */
function generateReportSaveForGivenRecord(reportName, hashMapReportParameters, capId, childCapID) {
	var itemCap = capId;
	var saveToCapID = capId;
	var licenseSeqValue = "";
	var saveToCapIdStr = String(saveToCapID.getID1() + "-" + saveToCapID.getID2() + "-" + saveToCapID.getID3());

	//-------------- Get latest sequence number from the standard choice --------------
	var bizDomainName = aa.bizDomain.getBizDomain(sdtChoiceForSrNumber);
	var bizDomainModel = bizDomainName.getOutput().get(0).getBizDomain();

	licenseSeqValue = bizDomainModel.getDescription();

	var length = licenseSeqValue.length();

	if (aa.util.compare(licenseSeqValue, 999999) >= 0) {
		licenseSeqValue = "1";
	} else {
		licenseSeqValue = (String)(aa.util.add(licenseSeqValue, 1));
	}

	//-------------- Set and update the new sequence number on record --------------
	try {
		//Updating DUPLICATE LICENSE HISTORY ASIT
		//Sagar : Fix for PROD 11135 : PRD_DPL_License print shows multiple issue
		var isASIUpdated = updateASIT(saveToCapID, childCapID, licenseSeqValue);
		if (!isASIUpdated) {
			invalidRecordsInSetArray.push(saveToCapID.getCustomID());
		}
		bizDomainModel.setDescription(licenseSeqValue);
		aa.bizDomain.editBizDomain(bizDomainModel);
		//logDebug("Updated the License Sequence Counter to "+licenseSeqValue);
	} catch (err) {
		logDebug("Error in adding serial number to record for  " + saveToCapID + ": " + err);

		return false;
	}

	//-------------- Generate individual report and set it on record --------------
	var report = aa.reportManager.getReportInfoModelByName(reportName);

	if (report.getSuccess()) {
		report = report.getOutput();
		report.setModule("DPL");
		var capIdStr = String(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());
		report.setCapId(capIdStr);

		report.setReportParameters(hashMapReportParameters);

		var ed1 = report.getEDMSEntityIdModel();
		ed1.setCapId(saveToCapIdStr);
		ed1.setAltId(saveToCapID.getCustomID());
		report.setEDMSEntityIdModel(ed1);

		var reportResult = aa.reportManager.getReportResult(report);

		//-------------- If file generated successfully then update record status of the child record--------------

		// Defect 4245 and 4645(Reactivate Real Estate License - RTM Requirement 4.12.1 [o])
		if (childCapID) {
			if (reportResult.getSuccess()) {
				reportResult = reportResult.getOutput();
				cap = aa.cap.getCap(childCapID).getOutput();
				cap.setCapStatus("Printed");
				aa.cap.updateAppWithModel(cap);
				logDebug("Updated the Cap Status to Printed for " + childCapID.getCustomID());

				//-------------- Update workflow task status after report is printed --------------
				wfObj = aa.workflow.getTasks(childCapID).getOutput();
				updateWFTask("Issuance", "Printed", "", "", "", childCapID);
				//logDebug("Updated the Workflow Status to Printed for "+childCapID.getCustomID());

				cap.setCapStatus("Closed");
				aa.cap.updateAppWithModel(cap);
				//logDebug("Updated the Cap Status to Closed for "+childCapID.getCustomID());

				wfObj = aa.workflow.getTasks(childCapID).getOutput();
				updateWFTask("Issuance", "Closed", "", "", "", childCapID);
				//logDebug("Updated the Workflow Status to Closed for "+childCapID.getCustomID());
				deactivateWFTask("Issuance", childCapID);
				//logDebug("Deactivated the Workflow Issuance  for "+childCapID.getCustomID());
				return true;
			} else {
				logDebug("\n +++++++++ Error: Unable to execute report " + reportName + " for Record ID:" + capId.getCustomID());
				return false;
			}
		} else if (reportResult.getSuccess()) {
			//logDebug("Updated the Cap Status to Printed for "+capId.getCustomID());
			return true;
		} else {
			logDebug("\n +++++++++ Error: Unable to execute report " + reportName + " for Record ID:" + capId.getCustomID());
			return false;
		}
	} else {
		logDebug("\n +++++++++ Error: Report Info model not found. License Print aborted for report name: " + reportName + " Record ID: " + capId.getCustomID() + " ++++++++ \n");
		return false;
	}

}

/**
 * @desc This method updates the Serial number ASIT field for a given license record.
 * @param serialNumber - Contains serialNumber
 * @param capIDForDPL - Contains the capIDForDPL
 */
function updateASIT(capIDForDPL, childCapID, serialNumber) {
	var tableValues;
	//Sagar : Fix for PROD 11135 : PRD_DPL_License print shows multiple issue
	var isASIUpdated = false;

	// Defect 4245 and 4645(Reactivate Real Estate License - RTM Requirement 4.12.1 [o])
	if (childCapID) {
		// For Application or Renewal records.
		tableValues = {
			"Serial Number" : serialNumber,
			"Record ID" : childCapID.getCustomID(),
			"Issue Date" : issueDate
		};
	} else {
		//logDebug("Updating ASIT for License Record ");
		// For License record.
		tableValues = {
			"Serial Number" : serialNumber,
			"Record ID" : capIDForDPL.getCustomID(),
			"Issue Date" : issueDate
		};
	}

	var tableName = "DUPLICATE LICENSE HISTORY";
	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(capIDForDPL, tableName);
	if (tssmResult) {
		var tssm = tssmResult.getOutput();
		if (tssm) {
			var tsm = tssm.getAppSpecificTableModel();
			var rowIndexdetails = tsm.getRowIndex();
			//Get the reason type for the ASIT Row based on the child record of the license
			var reason;
			if (childCapID) {
				reason = getReasonType(childCapID);
			} else {
				reason = getReasonType(capIDForDPL);
			}
			tableValues["Reason"] = reason;
			var fld = tsm.getTableField();
			var col = tsm.getColumns();
			var fld_readonly = tsm.getReadonlyField(); //get ReadOnly property
			var coli = col.iterator();
			while (coli.hasNext()) {
				colname = coli.next();
				//add the ASIT value
				fld.add(String(tableValues[colname.getColumnName()]));
				fld_readonly.add(null);
			}

			tsm.setTableField(fld);
			tsm.setReadonlyField(fld_readonly); // set readonly field
			//save the changes to the ASIT
			var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, capIDForDPL, "BATCHUSER");
			if (!addResult.getSuccess()) {
				//var returnException = new ELPAccelaEMSEException("Error adding record to " + tableName + " for record "+capIDForDPL+": "+addResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
				//throw returnException;

				logDebug("Error adding ASIT : " + tableName + " on record : " + capIDForDPL);
				logDebug("**ERROR : " + addResult.getErrorMessage());
			} else {
				isASIUpdated = true;
				//logDebug("Successfully added ASIT value for "+capIDForDPL.getCustomID());
			}
		} else {
			//var returnException = new ELPAccelaEMSEException("Error retrieving app specific table " + tableName + " for record "+capIDForDPL+": "+tssmResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			//throw returnException;
			logDebug("Error while retrieving ASIT " + tableName + " for record :  " + capIDForDPL);
			logDebug("**ERROR : " + tssmResult.getErrorMessage());
		}
	}

	return isASIUpdated;
}

/**
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name
 * @throws  N/A
 */
function getScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1];
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

/**
 * @desc This method query for the latest Set created for the License Print and retrieve the latest Set created
 * @param {}
 * @returns {string} - contains the string version of the Set Name
 **/
function getSetName() {
	var setHeaderScriptModel = aa.set.getSetHeaderScriptModel().getOutput();
	setHeaderScriptModel.setRecordSetType("DPL License Print Set");
	setHeaderScriptModel.setSetStatus("Created");
	setHeaderScriptModel.setServiceProviderCode("DPL");
	var setHeaderList = aa.set.getSetHeaderListByModel(setHeaderScriptModel).getOutput();

	var date;
	var date2 = 0;
	var todayDate = aa.util.parseInt(dateFormatToMMDDYYYY(new Date()));
	var setID;
	if (setHeaderList) {
		for (i = 0; i < setHeaderList.size(); i++) {
			var setName = String(setHeaderList.get(i).getSetID());
			setNameArray = setName.split("|");
			if (setNameArray[3] != null) {
				var setDate = setNameArray[3];
				var formatedSetDate = setDate.substring(0, 4) + "-" + setDate.substring(4, 6) + "-" + setDate.substring(6, 8);
				var date = aa.util.parseInt(dateFormatToMMDDYYYY(new Date(aa.util.parseDate(formatedSetDate))));

				//date = aa.util.parseInt(dateFormatToMMDDYYYY(new Date(aa.util.parseDate(setHeaderList.get(i).getSetDate()))));
				if ((date > date2) && (date < todayDate)) {
					date2 = date;
					setID = setHeaderList.get(i).getSetID();
				}
			}
		}
	}
	if (setID)
		return setID;
	else {
		var returnException = new ELPAccelaEMSEException("Cannot Find a SET ID to process", ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc This method converts a javascript date object into a String with the format YYYYMMDD
 * @param {date} pJavaScriptDate - contains the javascript date object to be converted
 * @returns {string} - contains the string version of the javascript date object
 **/
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

/**
 * @desc This method generates report PDF document for a given record.
 * @param reportName - Contains reportName
 * @param hashMapReportParameters - Contains hashMapReportParameters
 * @param setIDStr - Contains setName
 */
function generateReportSaveOnSetForLicense(reportName, hashMapReportParameters, setIDStr) {
	/*--------------------generateReportSaveOnSetForLicense-----------------------------*/
	// Generates a report and save the document to set under the documents tab.

	var reportResult = null;

	var report = aa.reportManager.getReportInfoModelByName(reportName);
	if (report.getSuccess()) {
		report = report.getOutput();
		report.setModule("DPL");
		report.setReportParameters(hashMapReportParameters);
		var ed1 = report.getEDMSEntityIdModel();
		ed1.setSetId(setIDStr);

		//attach document to the set.
		report.setEDMSEntityIdModel(ed1);

		reportResult = aa.reportManager.getReportResult(report);

		if (reportResult) {
			var reportResultScriptModel = reportResult.getOutput();
			var date = new Date();
			//Fix for PROD Defect 13108 : Date formats should match client conventions
			var dateResult = aa.util.formatDate(date, "MMddyyyy");

			var fileName = fileLocation + "//" + "DPL License_" + dateResult + ".pdf";

			if (reportResultScriptModel != null) {
				//var reportFile = aa.util.writeToFile(reportResult, fileName);
				var reportResultModel = reportResultScriptModel.getReportResultModel();
				var reportContents = reportResultModel.getContent();
				var reportFile = createLocalDocument(reportContents, fileName);

				/*-------------- If file printed successfully then update set status --------------*/
				if (reportFile) {
					return true;
				} else {
					return false;
				}
			} else {
				logDebug("ERROR: Report Result is null for : " + reportName);
				return false;
			}
		} else {
			logDebug("Unable to retrieve report result in function generateReportSaveAndEmailForRecord with reportName: " + reportName);
			return false;
		}
	} else {
		logDebug("\n +++++++++ Error: Report Info model not found. Batch Print aborted for report name: " + reportName + " ++++++++ \n");
		return false;
	}
}
/**
 * @desc This method retrieves the Parent Cap ID for the given Child Cap
 * @param childAppID CapIDModel CAP ID of Child
 * @return parentCapID CapIDModel CAP ID of retrieved Parent License Record
 */
function getParentLicenseRecord(childAppID) {
	//Get the Cap Type
	var category = getRecordType(childAppID);

	//If cap is a renewal then retrieve the parent using aa.cap.getProjectByChildCapID()
	if (category == "Renewal") {
		var parentListResult = aa.cap.getProjectByChildCapID(childAppID, "Renewal", null);
		if (parentListResult.getSuccess()) {
			var parentList = parentListResult.getOutput();
			if (parentList.length)
				return parentList[0].getProjectID();
		}
		logDebug("Error Retrieving the Parent License Record for Child Record: " + childAppID + " " + parentListResult.getErrorMessage());

	} else {
		var i = 1;
		var parentListResult = aa.cap.getProjectParents(childAppID, i);
		if (parentListResult.getSuccess()) {
			var parentList = parentListResult.getOutput();
			if (parentList.length)
				return parentList[0].getCapID();
		} else {
			logDebug("**WARNING: GetParent found no project parent for this application: " + childAppID + " " + parentListResult.getErrorMessage());
		}
	}
}

/**
 * @desc This method takes in the passed in contents and write is to an output file
 * @param contents byte [] - Contains the contents of the document
 * @param fileName String - Contains the Path and filename of the document
 * @return outFile java.io.File - Contains the output file
 */
function createLocalDocument(contents, fileName) {
	var File_PATH = fileName;
	try {
		var fos = new java.io.FileOutputStream(File_PATH);
		fos.write(contents);
		fos.close();
		//logDebug("File Created Successfully: "+fileName);
	} catch (ex) {
		logDebug("**ERROR : Not able to create Local file : " + ex.message);
	}
	var outFile = new java.io.File(File_PATH);
	return outFile;
}

function getRecordType(capIDModel) {
	var recordType = "";
	var capScriptModel = aa.cap.getCap(capIDModel).getOutput();
	if (capScriptModel && capScriptModel != null) {
		var capTypeModel = capScriptModel.getCapType();
		var recordType = capTypeModel.getCategory();
	}
	return recordType;
}

/**
 * @desc This method retrieves the Record Type of the passed in Cap ID. It will be either Application, License, Renewal, or Amendment
 * @param capIDModel CAP ID
 * @return reason String Record Type for the Duplicate License History ASIT
 */
function getReasonType(capIDModel) {
	var recordType = getRecordType(capIDModel);
	var itemName = "What is your request?";

	var reason;

	switch (String(recordType)) {
	case "Application":
		reason = "Initital";
		break;
	case "Renewal":
		reason = "Renewal";
		break;
		// Defect 4245
	case "License":
		//Defect 8456: Reason should be Auto Renewal only for Active Duty military status.
		//reason = "Auto Renewal";
		var militaryStatus = getAppSpecific("Military Status", capIDModel);
		if (militaryStatus) {
			if (militaryStatus.equals("Active Duty")) {
				reason = "Auto Renewal";
			} else {
				reason = "Renewal";
			}
		} else {
			reason = "Renewal";
		}
		break;
	case "Amendment":
	case "Business Amendment":
		var amendmentReason = getAmendmentASIValue(itemName, capIDModel);
				
		if ((amendmentReason == "Duplicate License") || (amendmentReason == "Address Change and Duplicate License") || (amendmentReason == "Change of Mailing Address") ||(amendmentReason == "Change of Phone or Email") ||(amendmentReason == "Change of Address"))
			reason = "Duplicate request";
		else if ((amendmentReason == "Name and Address") || (amendmentReason == "Change of Name") || (amendmentReason == "Change of Business Entity Name") || (amendmentReason == "Change of Doing Business as Name"))
			reason = "Name change";
		else
			logDebug("Did not find a match for input value: " + recordType + " with amendment reason: " + amendmentReason);
		break;
	case "New Hospital or Preceptorship":
		reason = "Duplicate request";
		break;
	default:
		logDebug("Did not find a match for input value: " + recordType + " with amendment reason: " + amendmentReason);
		break;
	}
	return reason;
}

/**
 * @desc This method retrieves the ALT IDs of all license records associated to the Amendment Record
 * @param capIDModel CAP ID
 * @return licenseArray String [] ALT ID of License Records
 */
function getAmendmentLicList(capIDModel) 
{
	var licArray = new Array();
	try
	{
		var appSpecTableObjectScriptModel = aa.appSpecificTableScript.getAppSpecificTableModel(capIDModel, "ACTIVE LICENSE(S)");
		
		if(appSpecTableObjectScriptModel.getSuccess())
		{
			var appSpecTableObject = appSpecTableObjectScriptModel.getOutput();
			if(appSpecTableObject)
			{
				var arrayList = appSpecTableObject.getTableField();
				var iterator = 1;

				var counter = 0;
				while (iterator < arrayList.size()) 
				{
					logDebug(arrayList.get(iterator));
					licArray[counter] = arrayList.get(iterator);
					iterator += 3;
					counter++;
				}
			}
			else
			{
				logDebug("NO ACTIVE LICENSE(S) ASIT is present on record : "+capIDModel.getCustomID());
			}
		}
		else
		{
			logDebug("No value return by API call : "+appSpecTableObjectScriptModel.getErrorMessage());
		}	
	}
	catch(ex)
	{
		logDebug("**Exception occured in function getAmendmentLicList # "+ex.message);
	}
	
	return licArray;
}

function deactivateWFTask(wfstr, capId) 
{
	var workflowResult = aa.workflow.getTasks(capId);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	var wfnote = null;
	var wfcomment = "Closed by Script";
	for (i in wfObj) {
		var fTask = wfObj[i];
		//logDebug(fTask.getTaskDescription() + "----" + fTask.getProcessCode());
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())) {
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();
			completeFlag = "Y";
			var wfstat = fTask.getDisposition();
			//logDebug("Complete Flag " + completeFlag);
			aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
			//logDebug("Deactivating Workflow Task: " + wfstr);
		}
	}
}

function cloneSetDuplicateRecordCheck(setName, capID)
{
	var duplicateFlag = false;
	var scanner = new Scanner(capID.toString(),"-");
	var id1 = scanner.next();
	var id2 = scanner.next();
	var id3 = scanner.next();
		
	var setCap = aa.cap.getCapIDModel(id1,id2,id3).getOutput();
	var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(setCap).getOutput();
	
	for (i = 0; i < setsMemberIsPartOf.size(); i++) 
	{
		 //aa.print("Part of Set : " + setsMemberIsPartOf.get(i).getSetID());
		if (setName == setsMemberIsPartOf.get(i).getSetID()) {
				duplicateFlag = true;
				//logDebug("part of set - " + setsMemberIsPartOf.get(i).getSetID());
				break;
		}
	}
	
	return duplicateFlag;
}

function validateContactAddressForRecords(capIDModel)
{
	try
	{
		var contactAddressValidationFlag = false;
		var capScriptModel = aa.cap.getCap(capIDModel).getOutput();
		var model = capScriptModel.getCapModel();
		var appTypeAlias = model.getAppTypeAlias();
		
		//Sagar : EPLACE-2480 : License Registration Card-Incorrect Hierarchy and Runtime Exception errors
		var contactType = getSharedDropDownDescriptionDetails(appTypeAlias, "License_Registration_Card_Window");
		if(contactType)
		{
			var addressType = getSharedDropDownDescriptionDetails(contactType, "License_Registration_Card_Windowaddress");
			logDebug("--- contactType : "+contactType+" || addressType : "+addressType+" ---");
			
			if(addressType)
			{
				contactAddressValidationFlag = validateContactAddress(capIDModel, contactType, addressType);
				if (!contactAddressValidationFlag) 
				{
					//Add capIDModel to array those records will nt be included in the PDF
					recordsNotPresentInPDFArray.push(capIDModel.getCustomID());
					//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
					if(setMemberStatus != null)
					{
						if(setMemberStatus.length != 0)
						{
							setMemberStatus = setMemberStatus + " || InvalidAddress";
						}
					}
					else
					{
						setMemberStatus = "InvalidAddress";
					}
				}
			}
			else
			{
				//Add record to incorrect hierarchy array
				incorrectHierarchyInSetArray.push(capIDModel.getCustomID());
				//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
				if(setMemberStatus != null)
				{
					if(setMemberStatus.length != 0)
					{
						setMemberStatus = setMemberStatus + " || IncorrectHierarchy";
					}
				}
				else
				{
					setMemberStatus = "IncorrectHierarchy";
				}
				
			}
		}
		else
		{
			//Add record to incorrect hierarchy array
			incorrectHierarchyInSetArray.push(capIDModel.getCustomID());
			//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" 
			if(setMemberStatus != null)
			{
				if(setMemberStatus.length != 0)
				{
					setMemberStatus = setMemberStatus + " || IncorrectHierarchy";
				}
			}
			else
			{
				setMemberStatus = "IncorrectHierarchy";
			}
		}
		
		return contactAddressValidationFlag;
	}
	catch(ex)
	{
		logDebug("**Exception occured in function validateContactAddressForRecords : "+ex.message);
	}
}

function validateContactAddress(capIDModel, contactType, addressType) 
{
	try
	{
		var contactAddressValidationFlag = false;

		var capContactResult = aa.people.getCapContactByCapID(capIDModel);
		var capContactList;
		if (capContactResult.getSuccess()) 
		{
			capContactList = capContactResult.getOutput();

			if (capContactList) 
			{
				for (capContactIndex in capContactList) 
				{
					var contactModel = capContactList[capContactIndex];
					var capContactType = contactModel.getPeople().getContactType();

					if (capContactType == contactType) 
					{
						var addressModelResult = aa.address.getContactAddressListByCapContact(contactModel.getCapContactModel());
						if (addressModelResult.getSuccess()) 
						{
							var addressModelList = addressModelResult.getOutput();

							if (addressModelList.length != 0) 
							{
								for (addressIndex in addressModelList) 
								{
									var retrievedAddressType = addressModelList[addressIndex].getAddressType();
									logDebug("retrievedAddressType : "+retrievedAddressType+" || addressType : "+addressType);
									if (retrievedAddressType == addressType) 
									{
										//G7_EXPR_DATE IS NULL OR (TO_DATE(G7_EXPR_DATE) > TO_DATE(CURRENT_DATE)
										var currentDate = new Date();
										var addressExpDate = addressModelList[addressIndex].expirationDate;
										if (addressExpDate != null) 
										{
											addressExpDate = new Date(addressExpDate.getMonth() + "/" + addressExpDate.getDayOfMonth() + "/" + addressExpDate.getYear());
										}
										
										logDebug("RecordID : " + capIDModel.getCustomID() + " || addressID : " + addressModelList[addressIndex].addressID + " || addressExpDate : " + addressExpDate + " || currentDate : " + currentDate);
										if (addressExpDate == null || addressExpDate > currentDate) 
										{
											logDebug("Valid address found");
											contactAddressValidationFlag = true;
										}
									}
									else
									{
										logDebug("** WARNING : Iterating through all the address types - Retrieved address type does not match with expected address type for this record type. Expected address type : "+addressType+" should be for this record "+capIDModel.getCustomID());
									}
								}
							}
							else
							{
								logDebug("Zero address is found for capContactType : "+capContactType+" || for this record : "+capIDModel.getCustomID());
							}
						}
						else
						{
							logDebug("**WARNING : Not able to retrieve address : "+addressModelResult.getErrorMessage());
						}
					}
					else
					{
						logDebug("**WARNING : Iterating through all the contacts - No valid contact type has been found in License_Registration_Card_Window STD choice for this record type: "+capIDModel.getCustomID()+ "  Expected contact type is : "+contactType+"(Iterating through all contacts of record)");
					}
				}
			}
			else
			{
				logDebug("No contact is associated with this record :  "+capIDModel.getCustomID());
			}
		}
		else
		{
			logDebug("** WARNING :: API not able to retrieve contacts associated with record : "+capIDModel.getCustomID());
			logDebug("Error message: "+capContactResult.getErrorMessage());
		}

		return contactAddressValidationFlag;
	}
	catch(ex)
	{
		logDebug("**Exception occured in function validateContactAddress : "+ex.message);
	}
}

function getAmendmentASIValue(itemName, capId) {
	var i = 0;
	var itemCap = capId;

	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess()) {
		var appspecObj = appSpecInfoResult.getOutput();
		if (itemName != "") {
			for (i in appspecObj) {
				if ((appspecObj[i].getCheckboxType() == "AMENDMENT" && appspecObj[i].getChecklistComment() == "CHECKED")) {
					return appspecObj[i].getCheckboxDesc();
				} else if (appspecObj[i].getCheckboxDesc() == itemName) {
					return appspecObj[i].getChecklistComment();
				}
			}
		} // item name blank
	} else {
		logDebug("**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage())
	}
}

//Sagar : EPLACE-2319 : DPL_PROD_AA- Issues with License Print file of 01/30
function validateRecordStatus(capId)
{
	try
	{
		var recordStatus = null;
		var capResult = aa.cap.getCap(capId);
		if (capResult.getSuccess()) 
		{
			var recCap = capResult.getOutput();
			var recordStatus = recCap.getCapStatus();
			
			//Add records to array for logging
			if((recordStatus != "Current") && (!exists(capId.getCustomID(), expiredRecordsInSetArray)))
			{
				expiredRecordsInSetArray.push(capId.getCustomID());
				//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
				if(setMemberStatus != null)
				{
					if(setMemberStatus.length != 0)
					{
						setMemberStatus = setMemberStatus + " || ExpiredLicense";
					}
				}
				else
				{
					setMemberStatus = "ExpiredLicense";
				}
			}	
		}
		else
		{
			aa.print("API faild || getCap error : " + capResult.getErrorMessage());
		}

		return recordStatus;
	}
	catch(ex)
	{
		logDebug("Exception occured in function validateRecordStatus # "+ex.message);
	}
}

function validateExpDateOnLic(capId)
{
	try
	{
		//validate if parent license received and validate if there is no Renewal info on license
		var isValidExpDate = false;
		var capResult = aa.cap.getCap(capId);
		
		if (capResult.getSuccess()) 
		{
			var licenseCap = capResult.getOutput();
			var capType = licenseCap.getCapType();
			
			//Separating group, type, sub type and category from License/Real Estate/Broker/Application 
			var scanner = new Scanner(capType.toString(), "/");
			var group = scanner.next();
			var type = scanner.next();
			var subType = scanner.next();
			var category = scanner.next();
			
			//Validate expDate only if the category is License
			if(category == "License")
			{
				var licExpDate = null;
				var b1ExpResult = aa.expiration.getLicensesByCapID(capId);
				if (b1ExpResult.getSuccess())
				{
					var expObj = b1ExpResult.getOutput();
					licExpDate = expObj.getExpDate();
					licExpDate = licExpDate.getMonth() + "/" + licExpDate.getDayOfMonth() + "/" + licExpDate.getYear();
					
					licExpDate = new Date(licExpDate);
					var currentDate = new Date();
					
					logDebug("licExpDate : "+licExpDate+" || currentDate :"+currentDate);
					if(licExpDate > currentDate)
					{
						isValidExpDate = true;
					}
					
					//Adding record to array
					if((isValidExpDate == false) && (!exists(capId.getCustomID(), expDateNotValidInSetArray)))
					{
						expDateNotValidInSetArray.push(capId.getCustomID());
						//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
						if(setMemberStatus != null)
						{
							if(setMemberStatus.length != 0)
							{
								setMemberStatus = setMemberStatus + " || InvalidExpDate";
							}
						}
						else
						{
							setMemberStatus = "InvalidExpDate";
						}
						
					}
				}
				else
				{
					logDebug("**ERROR : "+b1ExpResult.getErrorMessage());
				}
			}
		}
		else
		{
			logDebug("getCap error: " + capResult.getErrorMessage());
		}
		
		return isValidExpDate;
	}
	catch(ex)
	{
		if(!exists(capId.getCustomID(), expDateNotValidInSetArray))
		{
			expDateNotValidInSetArray.push(capId.getCustomID());
			//Sagar : EPLACE-2626 : DPL_PROD_Need set member status to display in "set" tab
			if(setMemberStatus != null)
			{
				if(setMemberStatus.length != 0)
				{
					setMemberStatus = setMemberStatus + " || InvalidExpDate";
				}
			}
			else
			{
				setMemberStatus = "InvalidExpDate";
			}
		}
		logDebug("Exception occured in function validateExpDateOnLic : "+ex.message);
	}
}

function retrieveRecordID(setMember)
{
	try
	{
		var recordID = null;
		var capIdObj = aa.cap.getCapID(setMember.getID1(), setMember.getID2(), setMember.getID3());
		if (capIdObj.getSuccess()) 
		{
			var recCapID = capIdObj.getOutput();
			if (recCapID) 
			{
				recordID = recCapID.getCustomID();
			}
		}
		else
		{
			logDebug("No value return by API call : "+capIdObj.getErrorMessage());
		}
		
		return recordID;		
	}
	catch(ex)
	{
		logDebug("**Exception occured in function retrieveRecordID # "+ex.message);
	}
}