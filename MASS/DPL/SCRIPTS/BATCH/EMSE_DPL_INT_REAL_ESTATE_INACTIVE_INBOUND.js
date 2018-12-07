/********************************************************************************************************************************
* Program : BATCH_REAL_ESTATE_INACTIVE
* Frequency : Weekly
* Script Name : EMSE_DPL_INT_REAL_ESTATE_INACTIVE_INBOUND
* The purpose of this script is to process through through Real Estate Inactive set members and add a report determined by 
* a lookup table using the setName to each record in the set. It then generates a batch report of all Real Estate inactive 
* renewal notices for printing and attaches the report to the set.
* @author Abhay Tripathi 03/20/2015
********************************************************************************************************************************/

var SCRIPT_VERSION = 3.0;
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
var transactionActive = true;
var recordsNotPresentInPDFArray = new Array();
var alreadyExistsInSetArray = new Array();
var invalidRecordIDArray = new Array();
var invalidRecordID = 0;

/* Start : Code to send email  */
var senderEmailAddr = "noreply@dpl.state.ma.us";

/* Get the Batch Job name */
var batchJobName = aa.env.getValue("BatchJobName");
var emailAddress = ""; // Add all text that you want to send in the email to this string variable

/* This email will be set by standard choice */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "REAL ESTATE INACTIVE"); 

/* This will be secondary email set by batch job param */
var emailAddress2= aa.env.getValue("emailAddress"); 

//aa.print("batchJobName : --- " + batchJobName + "  Email : " + emailAddress2);
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
{
	emailAddress2="";
}
/* End : Code to send email */

var issueDate = jsDateToASIDate(new Date());

if (paramsOK)
{
   logDebug("Start of Batch Print For License Batch Job.");
   try
   {
	   var recordCounts = printBatchJob();
	   logDebug("INFO: Number of records in Set: " + recordCounts.totalCount + ".");	   
	   logDebug("INFO: Number of records added to CLONE SET : " + recordCounts.numRecordsProcessed + ".");
	   //Fix for PROD defect 8810 : PRD_DPL_Real estate inactive notice 1/11 set has original 385 record and clone has 378 and 377 printed
	   logDebug("INFO: Number of duplicate records :       " + recordCounts.alreadyExistsInSet + ".");
	   if(alreadyExistsInSetArray.length != 0)
	   {
			logDebug("------Duplicate records in SET starts-----------");
			for(index in alreadyExistsInSetArray)
			{
				logDebug(alreadyExistsInSetArray[index]);
			}
			logDebug("------Duplicate records in SET Ends-----------");
	   }
	   logDebug("INFO: Number of records already printed : " + recordCounts.alreadyPrinted + ".");
	   logDebug("INFO: Number of invalid records  : " + invalidRecordID + ".");
	   if(invalidRecordIDArray.length != 0)
		{
		   logDebug("------Invalid record IDs starts-----------")
		   for(index in invalidRecordIDArray)
		   {
				logDebug(invalidRecordIDArray[index]);
		   }
		   logDebug("------Invalid record IDs Ends-----------");
		}
	   logDebug("INFO: Number of records not included in the PDF due to invalid address :  "+recordsNotPresentInPDFArray.length);
	   if(recordsNotPresentInPDFArray.length != 0)
	   {
		   logDebug("------Excluded records from PDF starts-----------")
		   for(index in recordsNotPresentInPDFArray)
		   {
				logDebug(recordsNotPresentInPDFArray[index]);
		   }
		   logDebug("------Excluded records from PDF Ends-----------");
	   }
	   logDebug("Processed may be greater than Print Set if more than one Related Record is included (Renewal, Amendment)");
	   logDebug("End of Batch run For Real Estate Inactive Job. Elapsed Time : " + elapsed() + " Seconds.");
   }
   catch(ex)
   {
	   logDebug("ERROR: "+ex.toString());
	   logDebug("End of Batch run For Real Estate Inactive Job: Elapsed Time : " + elapsed() + " Seconds.");	
   }
   finally
   {
		if(showDebug)
		{
			if(transactionActive)
				aa.batchJob.commitTransaction();
				
			aa.env.setValue("ScriptReturnMessage", debug);
		}
			
		//Sagar: Fix for PROD Defect 7018: There's no way to be certain, without looking at the log file that a batch job ran correctly or not
		if (!ELPLogging.isFatal()) 
		{
			aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
			ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);

			if (ELPLogging.getErrorCount() > 0) 
			{
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_REAL_ESTATE_INACTIVE_INBOUND completed with " + ELPLogging.getErrorCount() + " errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_REAL_ESTATE_INACTIVE_INBOUND completed with " + ELPLogging.getErrorCount() + " errors.");
			}
			else 
			{
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_REAL_ESTATE_INACTIVE_INBOUND completed with no errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_REAL_ESTATE_INACTIVE_INBOUND completed with no errors.");
			}
		}
		
		//logDebug(ELPLogging.toString());
		if (emailAddress && emailAddress != "" && emailAddress.length > 0 )
		{
			aa.sendMail(senderEmailAddr, emailAddress, emailAddress2, "Result: " + batchJobName, debug);
		}
		
   }
}


/**
 * @desc The main function in the batch job which carries out the business process to process the Real Estate Inactive 
 * Renewal records and generate the PDF reports.
 * @returns capCount - Successfully attached report counts
*/
function printBatchJob()
{
	var recordCounts = {totalCount : 0,
						numRecordsProcessed : 0,
						numRecordsPrintSet : 0,
						alreadyExistsInSet : 0,
						alreadyPrinted : 0
						};
	var capCount = 0;
	var setLkupName = null;	
	var setName = aa.env.getValue("SetID");
	// Get the SetName
	if(setName == "")
		 setName = getSetName();
	logDebug("Set Name is: "+setName);
    var reportSet = new capSet(setName);
    var reportMembers = reportSet.members;
	
	// Create a temporary Set named DPL|REAL_ESTATE_INACTIVE|W|yyyymmdd_LICENSE_CLONE
	var tempSetName = setName+"_LICENSE_CLONE";
	var tempSetResult = aa.set.getSetByPK(tempSetName);
	if(!tempSetResult.getSuccess())
	{
		var tempLicResult = aa.set.createSet(tempSetName,tempSetName);
		if(!tempLicResult.getSuccess())
			throw new ELPAccelaEMSEException("Cannot create Temp License Set", ScriptReturnCodes.EMSE_PROCEDURE);
	}	
	// Begin the job transaction
	aa.batchJob.beginTransaction(10);
	transactionActive = true;
	
	// Get set by primary key set code.
	var tempLicSet = aa.set.getSetByPK(tempSetName).getOutput();
	logDebug("Temp Set Name is: "+tempLicSet.getSetID());
	
    var capId = null; 
    var myHashMap = null;
	
	//Fetching LookUpReport from the standard choice based on key and value.
	var lkupReport = String(lookup("BATCH_PRINT_CONFIG_PARAM", "REAL ESTATE INACTIVE"));		
	var printStatus = "Printed";
	var errorStatus = "Error Generating Report";
	
    reportToBe = lkupReport.split("|");
	
    // Split LkupReport based on "|" and separated the reportName, bulkReportName, fileLocation and stdChoiceForSrNumber 
    if(reportToBe[0] != "NULL")
	{
		if(reportToBe.length >= 2)
		{
			reportName = reportToBe[0];
			bulkReportName = reportToBe[1];
			fileLocation = reportToBe[2];			
			sdtChoiceForSrNumber = reportToBe[3];
		}
    }
	
	// Get new SetDetailsScriptModel.
	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	//Set setID.
	setDetailScriptModel.setSetID(setName);
	
	// Get the list of members from the set.
	var memberList = aa.set.getSetMembers(setDetailScriptModel).getOutput();
	recordCounts.totalCount = memberList.size();
	// for each individual record add the appropriate PDF document
    for(var index = 0; index < memberList.size(); index ++)
	{
		var setMember = memberList.get(index);
		var setMemberStatus = setMember.getSetMemberStatus();		// Returns a String value
		var capIdObj = aa.cap.getCapID(setMember.getID1(), setMember.getID2(), setMember.getID3());
		
		if(capIdObj.getSuccess())
		{
			var childCapID = capIdObj.getOutput();
		} else {
			var childCapID = null;
			logDebug("Set Member : " +setMember.getID1()+":"+ setMember.getID2()+":"+ setMember.getID3()+ " failed to find CAP ID.");																
			continue;
		}
		// Verifying if the record in the set does not have a set member status of "Printed"
		if((setMemberStatus != printStatus) || (!setMemberStatus))
		{

				var parentCapID = getParentLicenseRecordForInactiveRecords(childCapID);
				var licList = null;
				
				if(parentCapID)
				{
					parentCapID = aa.cap.getCapID(parentCapID.getID1(),parentCapID.getID2(),parentCapID.getID3()).getOutput();
					logDebug("Child Record ID: "+childCapID.getCustomID()+" Parent Record ID: "+parentCapID.getCustomID());
					capId = parentCapID;
					if (isLicenseInactive(capId)) {
						myHashMap = aa.util.newHashMap();
						myHashMap.put("ALT_ID",  String(capId.getCustomID()));
						
						// Generate a report for individual license and attach it to the set
						var isSuccessful = generateReportSaveForGivenRecord(reportName,myHashMap,capId,childCapID);
						// Check if the report generation is successful, then mark the status as 'Printed' 
						if(isSuccessful)
						{
							logDebug("Successfully attached report to record");
							//Check to see if this was a name change amendment
							if(licList == null)
							{
								//Fix for PROD defect 8810 and 8625 : PRD_DPL_Real estate inactive notice 1/11 set has original 385 record and clone has 378 and 377 printed
								var isDupRecord = cloneSetDuplicateRecordCheck(tempSetName,capId);
								logDebug("isDupRecord = "+isDupRecord);
								if(!isDupRecord)
								{
									aa.set.add(tempSetName,capId);
									capCount ++;
									recordCounts.numRecordsProcessed++;
									//Perform validation for contact address. Those records fails validation for contact address will not be printed in PDF.
									validateContactAddressForRecords(capId);
								}
								else
								{
									logDebug("License record : "+capId+" already exists in the Clone set");
									recordCounts.alreadyExistsInSet++;
									alreadyExistsInSetArray.push(capId.getCustomID());
								}
								
							}
							var setMemberStatus = printStatus;
						} // Else mark the set status as 'Error Generating Report'
						else
						{
							logDebug("Set Member : " +childCapID.getCustomID()+ " failed to generate Report.");
							invalidRecordID++;
							invalidRecordIDArray.push(capId.getCustomID());
							var setMemberStatus = errorStatus;
						}
						
						var auditID = aa.env.getValue("CurrentUserID");
						//logDebug("The User ID is: "+auditID);
						
						var setDetailScriptModel = new com.accela.aa.emse.dom.SetDetailsScriptModel("DPL",auditID,setMember);
						setDetailScriptModel.setSetMemberStatus(setMemberStatus);
						var updateResult = aa.set.updateSetMemberStatus(setDetailScriptModel);
						if( ! updateResult.getSuccess())
						{
							logDebug("Script failed up to update SetMemberStatus for record " + childCapID.getCustomID());
						}						
					} else {
						logDebug("Set Member : " +childCapID.getCustomID()+ " found with License Status as not Inactive");						
					}

				}
		}
		else 
		{
			recordCounts.alreadyPrinted++;
			logDebug("Set Member : " +childCapID.getCustomID()+ " found with member Status as " +setMemberStatus);
		}
	}// END FOR for individual record in the set
	
	//commit the transaction
	aa.batchJob.commitTransaction();
	transactionActive = false;
	//recordCounts.numRecordsProcessed = capCount;
	/*------------------- Print Inactive Notice REPORT ---------------------*/
	
	// The set Clone is used to generate the Real Estate Inactive Notice document.
	var tempSetDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	tempSetDetailScriptModel.setSetID(tempSetName);
	var tempList = aa.set.getSetMembers(tempSetDetailScriptModel).getOutput();
	recordCounts.numRecordsPrintSet = tempList.size();
	if(tempList.size() > 0)  
	{
		var reportForSet = reportToBe;
		var batchHashParameters = aa.util.newHashMap();
		var batchCompleted = false;
		batchHashParameters.put("SET_ID", tempSetName);		
		batchCompleted = generateReportSaveOnSetForLicense(reportForSet[1], batchHashParameters, setName);
		
		if(batchCompleted)
		{
			reportSet.updateSetStatus(printStatus);
			logDebug("Updated Set Status to "+printStatus);
		}
		else
		{
			reportSet.updateSetStatus(errorStatus);
			logDebug("Updated Set Status to "+errorStatus);
		}
		logDebug("");
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

function elapsed(){
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
function generateReportSaveForGivenRecord(reportName, hashMapReportParameters, capId, childCapID)
{	
    var itemCap = capId;
	var saveToCapID = capId;
	var licenseSeqValue = "";
	var saveToCapIdStr = String(saveToCapID.getID1() + "-" + saveToCapID.getID2() + "-" + saveToCapID.getID3());
	//-------------- Get latest sequence number from the standard choice --------------
	var bizDomainName = aa.bizDomain.getBizDomain(sdtChoiceForSrNumber);
	var bizDomainModel = bizDomainName.getOutput().get(0).getBizDomain();
	licenseSeqValue = bizDomainModel.getDescription();
	
	var length = licenseSeqValue.length();
	
	if(aa.util.compare(licenseSeqValue, 999999) >= 0)
	{
		licenseSeqValue = "1";
	}
	else
	{
		licenseSeqValue = (String)(aa.util.add(licenseSeqValue , 1));		
	}
	
	//-------------- Set and update the new sequence number on record --------------
	try
	{
		updateASIT(saveToCapID,childCapID,licenseSeqValue);
		bizDomainModel.setDescription(licenseSeqValue);
		aa.bizDomain.editBizDomain(bizDomainModel);
	}
	catch(err)
	{
		logDebug("Error in adding serial number to record for  "+ saveToCapID + ": " +err);
		return false;
	}
	
	//-------------- Generate individual report and set it on record --------------
    var report = aa.reportManager.getReportInfoModelByName(reportName);
     
	if(report.getSuccess())
	{
		report = report.getOutput();
		//-------------- If file generated successfully then update record status of the child record--------------
		if (report != null)
		{
			logDebug("File Generated Successfully");
		}
		else
		{
			 logDebug("\n +++++++++ Error: Unable to execute report " + reportName+" for record "+capId.getCustomID());
			 return false;
		}
		report.setModule("DPL");
		var capIDModel = String(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());
		report.setCapId(capIDModel);
		
		report.setReportParameters(hashMapReportParameters);
		
		var ed1 = report.getEDMSEntityIdModel();
		ed1.setCapId(saveToCapIdStr);
		ed1.setAltId(saveToCapID.getCustomID());
		report.setEDMSEntityIdModel(ed1);
		
		var reportResult = aa.reportManager.getReportResult(report);
		
		//-------------- If file generated successfully then update record status of the child record--------------
		if(reportResult.getSuccess())
		{
			reportResult = reportResult.getOutput();
			cap = aa.cap.getCap(childCapID).getOutput();
			cap.setCapStatus("Printed");
			aa.cap.updateAppWithModel(cap);
			logDebug("Updated the Cap Status to Printed for "+childCapID.getCustomID());
			
			//-------------- Update workflow task status after report is printed --------------
			wfObj = aa.workflow.getTasks(childCapID).getOutput();
			updateWFTask("Issuance", "Printed", "", "", "", childCapID);
			logDebug("Updated the Workflow Status to Printed for "+childCapID.getCustomID());
			
			cap.setCapStatus("Closed");
			aa.cap.updateAppWithModel(cap);
			logDebug("Updated the Cap Status to Closed for "+childCapID.getCustomID());
			
			wfObj = aa.workflow.getTasks(childCapID).getOutput();
			updateWFTask("Issuance", "Closed", "", "", "", childCapID);
			logDebug("Updated the Workflow Status to Closed for "+childCapID.getCustomID());
			
			 return true;
		}
		else
		{
			logDebug("\n Error: Unable to execute report " + reportName+" for Record ID: "+capId.getCustomID());
			return false;
		}
	}
	else
	{
		logDebug("\n Error: Report Info model not found. Print aborted for report name: "+ reportName + " Record ID: "+ capId.getCustomID() +" ++++++++ \n");
		return false; 
	}
}

/**
 * @desc This method updates the Serial number ASIT field for a given license record.
 * @param serialNumber - Contains serialNumber
 * @param capIDForDPL - Contains the capIDForDPL
*/
function updateASIT(capIDForDPL,childCapID,serialNumber)
{		
	var tableValues = {"Serial Number":serialNumber, "Record ID":childCapID.getCustomID(), "Issue Date": issueDate };	
	var tableName = "DUPLICATE LICENSE HISTORY"; 		
	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(capIDForDPL, tableName); 		
		
	if(tssmResult){
		var tssm = tssmResult.getOutput();
		if(tssm)
		{
				var tsm = tssm.getAppSpecificTableModel();
							
				var rowIndexdetails = tsm.getRowIndex();
				//Get the reason type for the ASIT Row based on the child record of the license
				var reason = getReasonType(childCapID);
				
				tableValues["Reason"] = reason;
				var fld = tsm.getTableField();
				var column = tsm.getColumns();
				
				//get ReadOnly property
				var fld_readonly = tsm.getReadonlyField();
				var columnItem = column.iterator();

				while(columnItem.hasNext())
				{
					colname = columnItem.next();
					//add the ASIT value
					fld.add(String(tableValues[colname.getColumnName()]));
					fld_readonly.add(null);
				}

				tsm.setTableField(fld);
				
				// set readonly field
				tsm.setReadonlyField(fld_readonly); 
				
				//save the changes to the ASIT
				addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, capIDForDPL, "BATCHUSER");
				
				if (!addResult.getSuccess())
				{ 
					var returnException = new ELPAccelaEMSEException("Error adding record to " + tableName + " for record "+capIDForDPL+": "+addResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
					throw returnException;
				}
				else
				{
					logDebug("Successfully added ASIT value for "+capIDForDPL.getCustomID());
				}
		}
		else
		{
			var returnException = new ELPAccelaEMSEException("Error retrieving app specific table " + tableName + " for record "+capIDForDPL+": "+tssmResult.getErrorMessage(), ScriptReturnCodes.EMSE_PROCEDURE);
			throw returnException;
		}
	}
}

/** 
 * @desc This method load the utility script which contains functions that will be used later
 * @param {vScriptName} vScriptName - contains the script name 
 * @throws  N/A
 */
function getScriptText(vScriptName){ 
	var servProvCode = aa.getServiceProviderCode(); 
	if (arguments.length > 1) 
		servProvCode = arguments[1]; 
	vScriptName = vScriptName.toUpperCase(); 
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput(); 
	try{ 
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN"); 
		return emseScript.getScriptText() + ""; 
	}catch(err){ 
		return ""; 
	}
} 

/**
 * @desc This method query for the latest Set created for the Real Estate Inactive Notice and retrieve the latest Set created
 * @param {} 
 * @returns {string} - contains the string version of the Set Name
**/
function getSetName()
{
	// Prepare a setHeaderScriptModel
	var setHeaderScriptModel = aa.set.getSetHeaderScriptModel().getOutput();
	// Search for a set with set type as 'DPL Real Estate Inactive', Status as 'DPL', and servProvCode as 'DPL'
	setHeaderScriptModel.setRecordSetType("DPL Real Estate Inactive");
	setHeaderScriptModel.setSetStatus("Created");
	setHeaderScriptModel.setServiceProviderCode("DPL");
	var setHeaderList = aa.set.getSetHeaderListByModel(setHeaderScriptModel).getOutput();
	
	var date;
	var date2 = 0;
	var todayDate = aa.util.parseInt(dateFormatToMMDDYYYY(new Date()));
	var setID;
	if(setHeaderList)
	{
		for(i = 0; i < setHeaderList.size(); i++)
		{
			var setName = String(setHeaderList.get(i).getSetID());
			setNameArray = setName.split("|");
			if(setNameArray[3] != null)
			{
				// Returns the yyyyMMdd part of the set Name
				var setDate = setNameArray[3];
				var formatedSetDate = setDate.substring(0,4)+"-"+setDate.substring(4,6)+"-"+setDate.substring(6,8);
				var date = aa.util.parseInt(dateFormatToMMDDYYYY(new Date(aa.util.parseDate(formatedSetDate))));

				if((date > date2) && (date < todayDate))
				{
					date2 = date;
					setID = setHeaderList.get(i).getSetID();
				}
			}
		}// End FOR
	}
	if(setID)
	{
		// Return the setID if Set exists, else post an exception
		return setID;
	}
	else
	{
		var returnException = new ELPAccelaEMSEException("Cannot Find a SET ID to process", ScriptReturnCodes.EMSE_PROCEDURE);
		throw returnException;
	}
}

/**
 * @desc This method converts a JavaScript date object into a String with the format YYYYMMDD
 * @param {date} pJavaScriptDate - contains the JavaScript date object to be converted
 * @returns {string} - contains the string version of the JavaScript date object
**/
function dateFormatToMMDDYYYY(pJavaScriptDate){

	//converts javascript date to string in YYYYMMDD format
	if (pJavaScriptDate != null){
		if (Date.prototype.isPrototypeOf(pJavaScriptDate)){
			var month = pJavaScriptDate.getMonth()+1;
			if(month < 10)
				var formattedMonth = "0"+month;
			else
				var formattedMonth = month.toString();
			var dayOfMonth = pJavaScriptDate.getDate();
			if (dayOfMonth < 10)
				var formattedDay = "0"+dayOfMonth.toString();
			else
				var formattedDay = dayOfMonth.toString();            
			return (pJavaScriptDate.getFullYear()+formattedMonth+formattedDay);
			logDebug("Date: " +pJavaScriptDate.getFullYear()+formattedMonth+formattedDay);
		}
		else{
			logDebug("Parameter is not a JavaScript date");
			return ("INVALID JAVASCRIPT DATE");
		}
	}else{
		logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
	}
}

/**
 * @desc This method generates report PDF document for a given record.
 * @param reportName - Contains reportName
 * @param hashMapReportParameters - Contains hashMapReportParameters
 * @param setIDStr - Contains setName
*/
function generateReportSaveOnSetForLicense(reportName, hashMapReportParameters, setIDStr)
{
	/*--------------------generateReportSaveOnSetForLicense-----------------------------*/
    // Generates a report and save the document to set under the documents tab.
   
   var reportResult = null;

   var report = aa.reportManager.getReportInfoModelByName(reportName);
   if(report.getSuccess())
   {
		report = report.getOutput();
		report.setModule("DPL");
		report.setReportParameters(hashMapReportParameters);
		var ed1 = report.getEDMSEntityIdModel();
		ed1.setSetId(setIDStr);
		
		//attach document to the set.
		report.setEDMSEntityIdModel(ed1);
		
		reportResult = aa.reportManager.getReportResult(report);
		  
		if(reportResult)
		{
			var reportResultScriptModel = reportResult.getOutput();
			var date = new Date();
			//Fix for PROD Defect 13108 : Date formats should match client conventions
			var dateResult = aa.util.formatDate(date, "MMddyyyy");
			
			var fileName = fileLocation +"//" +"DPL Real Estate Inactive_" + dateResult + ".pdf";	//DPL Real Estate Inactive_yyyyMMdd
		
			if (reportResultScriptModel != null)
			{				
				//var reportFile = aa.util.writeToFile(reportResult, fileName);
				var reportResultModel = reportResultScriptModel.getReportResultModel();
				var reportContents = reportResultModel.getContent();
				var reportFile = createLocalDocument(reportContents, fileName);
				
 				/*-------------- If file printed successfully then update set status --------------*/
				if(reportFile)
				{
				   return true;
				} 
			}
			else
			{
			 logDebug("ERROR: Report Result is null for : " + reportName);
			 return false;
			}
		}
		else
		{
			logDebug("Unable to retrieve report result in function generateReportSaveAndEmailForRecord with reportName: " + reportName);
			return false;
		}
	}
	else
	{
		logDebug("\n +++++++++ Error: Report Info model not found. Batch Print aborted for report name: "+reportName+" ++++++++ \n");
		return false; 
	}
}
/**
 * @desc This method retrieves the Parent Cap ID for the given Child Cap
 * @param childAppID CapIDModel CAP ID of Child
 * @return parentCapID CapIDModel CAP ID of retrieved Parent License Record
*/
function getParentLicenseRecordForInactiveRecords(childAppID)
{
	//Get the Cap Type
	var category = getRecordType(childAppID);
	
	//If cap is a renewal then retrieve the parent using aa.cap.getProjectByChildCapID()
	if(category == "Renewal")
	{
		var parentListResult = aa.cap.getProjectByChildCapID(childAppID,"Renewal","");
		if(parentListResult.getSuccess())
		{
			var parentList = parentListResult.getOutput();
			if(parentList.length)
				return parentList[0].getProjectID();
		}
		logDebug("Error Retrieving the Parent License Record for Child Record: "+childAppID+" "+parentListResult.getErrorMessage());
	}
	//Use aa.cap.getProjectParents() to retrieve the parent for non renewal records
	else
	{
		var i = 1;
		var parentListResult = aa.cap.getProjectParents(childAppID,i);
		if(parentListResult.getSuccess())
		{
			var parentList = parentListResult.getOutput();
			if (parentList.length)
				return parentList[0].getCapID();
		}
		else
		{
			logDebug("**WARNING: GetParent found no project parent for this application: "+childAppID+" "+parentListResult.getErrorMessage());
			invalidRecordID++;
			invalidRecordIDArray.push(childAppID.getCustomID());
		}
	}
}

/**
* @desc This method takes in the passed in contents and write is to an output file
* @param contents byte [] - Contains the contents of the document
* @param fileName String - Contains the Path and filename of the document
* @return outFile java.io.File - Contains the output file
*/
function createLocalDocument(contents, fileName)
{
	var File_PATH = fileName;
	try
	{
		var fos = new java.io.FileOutputStream(File_PATH);
		fos.write(contents);
		fos.close();
		logDebug("File Created Successfully: "+fileName);		
	}
	catch(ex)
	{
		logDebug("**ERROR : Not able to create Local file : "+ex.message);
	}
	var outFile = new java.io.File(File_PATH);
	return outFile;
}

/*  */
/**
 * @desc This method retrieves the record category information
 * @param capIDModel CAP ID of the renewal record
 * @return reason String Record Type for the Duplicate License History ASIT
*/
function getRecordType(capIDModel)
{
	var capScriptModel = aa.cap.getCap(capIDModel).getOutput();
	var capTypeModel = capScriptModel.getCapType();
	var recordType = capTypeModel.getCategory();
	
	return recordType;
}

/**
 * @desc This method retrieves the Record Type of the passed in Cap ID. It will be process only Renewal records
 * @param capIDModel CAP ID of the renewal record
 * @return reason String Record Type for the Duplicate License History ASIT
*/
function getReasonType(capIDModel)
{
	var recordType = getRecordType(capIDModel);
	var reason;
	
	switch(String(recordType))
	{
		case "Renewal":
			reason = "Renewal";
			break;
		default:
			logDebug("Did not find a match for input value: "+recordType);
		break; 
	}
	return reason;
}

function isLicenseInactive(capId)
{    
    var workflowResult = aa.workflow.getTasks(capId);
    if (workflowResult.getSuccess())
        wfObj = workflowResult.getOutput();
    else
    { 
        ELPLogging.notify("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); 
		return false;
    }

    for (i in wfObj)
    {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals("LICENSE"))
        {
            var disp = String(fTask.getDisposition());        	
            if (disp == "Inactive") {
            	return true;
            }
        }
    }
    return false;
}
//Fix for PROD defect 8810 : PRD_DPL_Real estate inactive notice 1/11 set has original 385 record and clone has 378 and 377 printed
/**
 * @desc This method will validate whether record  in Clone set or not
 * @param {setName} : Clone set name
 * @param {capID} : record ID
 * @return {duplicateFlag} : validation result true or false
*/
function cloneSetDuplicateRecordCheck(setName, capID)
{
	logDebug("Duplicate record check for capID # "+capID);
	var duplicateFlag = false;
	var scanner = new Scanner(capID.toString(),"-");
	var id1 = scanner.next();
	var id2 = scanner.next();
	var id3 = scanner.next();
		
	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	setDetailScriptModel.setServiceProviderCode("DPL");
	setDetailScriptModel.setSetID(setName);
	setDetailScriptModel.setID1(id1);
	setDetailScriptModel.setID2(id2);
	setDetailScriptModel.setID3(id3);
	
	var memberListResult = aa.set.getSetMembers(setDetailScriptModel);
	
	if(memberListResult.getSuccess())
	{
		var memberList = memberListResult.getOutput();
		//If the member list size is more than zero then record is not present in the set
		if(memberList.size())
		{
			duplicateFlag = true;
		}
			
	}
	
	return duplicateFlag;
}

/**
 * @desc This method will validate mailing address on the record. If valid is not present on the license record then it will not print record in the PDF
 * @param {capIDModel} :  Contains recordID 
 * @return {recordsNotPresentInPDFArray} : recordsNotPresentInPDFArray contains recordIDs which will not be printed in PDF
*/
function validateContactAddressForRecords(capIDModel)
{
	logDebug("Validating contact address for record : "+capIDModel);
	var capScriptModel = aa.cap.getCap(capIDModel).getOutput();
	var model = capScriptModel.getCapModel(); 
	var appTypeAlias = model.getAppTypeAlias();
	var contactType = getSharedDropDownDescriptionDetails(appTypeAlias, "License_Registration_Card_Window");

	var addressType = getSharedDropDownDescriptionDetails(contactType, "License_Registration_Card_Windowaddress");
	
	var contactAddressValidationFlag = validateContactAddress(capIDModel, contactType, addressType);
	logDebug("contactAddressValidationFlag = "+contactAddressValidationFlag);
	if(!contactAddressValidationFlag)
	{
		//Add capIDModel to array those records will nt be included in the PDF
		recordsNotPresentInPDFArray.push(capIDModel.getCustomID());
	}
	
	
}

/**
 * @desc This method will validate mailing address on the record. If valid is not present on the license record then it will not print record in the PDF
 * @param {capIDModel} :  Contains recordID 
 * @param {contactType} : contains contact type associated with record
 * @param {addressType} : contains address type associated with record
 * @return {contactAddressValidationFlag} : Contact address validation flag contains address validation flag
*/
function validateContactAddress(capIDModel, contactType, addressType)
{
	var contactAddressValidationFlag = false;
	
	var capContactResult = aa.people.getCapContactByCapID(capIDModel);
	var capContactList;
	if(capContactResult.getSuccess())
	{
		capContactList = capContactResult.getOutput();	
	
		if(capContactList)
		{
			for(capContactIndex in capContactList)
			{
				var contactModel = capContactList[capContactIndex];
				var capContactType = contactModel.getPeople().getContactType();
				
				if(capContactType == contactType)
				{
					var addressModelResult = aa.address.getContactAddressListByCapContact(contactModel.getCapContactModel());
					if(addressModelResult.getSuccess())
					{
						var addressModelList = addressModelResult.getOutput();
						
						if(addressModelList.length != 0)
						{
							for(addressIndex in addressModelList)
							{	
								var retrievedAddressType = addressModelList[addressIndex].getAddressType();
								if(retrievedAddressType == addressType)
								{
									//G7_EXPR_DATE IS NULL OR (TO_DATE(G7_EXPR_DATE) > TO_DATE(CURRENT_DATE)
									var currentDate = new Date();
									var addressExpDate = addressModelList[addressIndex].expirationDate;
									if(addressExpDate!= null)
									{
										addressExpDate = new Date(addressExpDate.getMonth()+"/"+addressExpDate.getDayOfMonth()+"/"+addressExpDate.getYear());
									}
									logDebug("addressExpDate : "+addressExpDate+" || currentDate : "+currentDate);
									if(addressExpDate == null || addressExpDate > currentDate)
									{
										contactAddressValidationFlag = true;
									}
								}
							}
						}	
					}
				}
			}
		}
	}
	
	return contactAddressValidationFlag;
}
