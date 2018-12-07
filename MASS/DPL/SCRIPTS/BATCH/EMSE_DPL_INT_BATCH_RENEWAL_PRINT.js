/* ------------------------------------------------------------------------------------------------------ /
 | Program : BatchPrint - Renewal  Trigger : Batch
 | Client : eLicensing System Implementation - DPL
 |
 | Version 2.0 - Base Version. 17 / 07 / 2014 - Amol Surjuse - 
 |
 | Script loops through set members, adds a report determined by a lookup table using the setName  to each record in the set
 | then generates a batch report for printing and attaches the report to the set.

 | Batch Requirements :
 | - Valid Set of name convention.
 | - Not meant to be a script run overnight, but a script that is ran manually.
 |
 |
 / ------------------------------------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------------------------------------ /
 | START : USER CONFIGURABLE PARAMETERS
 / ------------------------------------------------------------------------------------------------------ */
var SCRIPT_VERSION = 3.0
var documentOnly = false;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));

var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var paramsOK = true;
var reportName;
var bulkReportName;
var fileLocation;
var sdtChoiceForSrNumber;
var showDebug = true;
var alreadyExistsInSetArray = new Array();
var emailText="";
// Start : Code to send email 
var senderEmailAddr = "noreply@dpl.state.ma.us";
var jobName = "";
var batchJobName = aa.env.getValue("BatchJobName");
var emailAddress = ""; // Add all text that you want to send in the email to this string variable

var emailAddress = lookup("BATCH_STATUS_EMAIL", "RENEWAL PRINT"); // This email will be set by standard choice


var emailAddress2= aa.env.getValue("emailAddress"); // This will be secondary email set by batch job param

// CR451 : Start
var chunkSize = aa.env.getValue("chunkSize");
var chunkFlag = true;
var recordCounter = 0;
var chunkCounter = 1;
var setFlag = true;
var originalSetName = "";

if(chunkSize ==null || chunkSize == "" || chunkSize == "undefined")
{
	// Do not do chunking.
	chunkFlag=false;
	chunkSize = 0;
}
// CR451 : End

logDebug("batchJobName : --- " + batchJobName + "  Email : " + emailAddress2);
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
{
	emailAddress2="";
}
// End : Code to send email


/* ------------------------------------------------------------------------------------------------------ /
 | END : USER CONFIGURABLE PARAMETERS
 / ------------------------------------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------------------------------------ /
 | <=========== Main = Loop ================ >
 |
 / ------------------------------------------------------------------------------------------------------ */

if (paramsOK)
{
   logDebug("Start of Batch Print For Renewal Batch Job.");
   try
   {
		var transactionActive = false;
		var recordCounts = printBatchJob();
		logDebug("INFO: Number of records in Set:          " + recordCounts.setCount + ".");
		logDebug("INFO: Number of records processed:       " + recordCounts.numRecordsProcessed + ".");
		logDebug("INFO: Number of records already printed: " + recordCounts.alreadyPrinted + ".");
		logDebug("INFO: Number of records invalid Cap ID:  " + recordCounts.invalidCapID + ".");
		logDebug("INFO: Number of records no Temp Renewal: " + recordCounts.noRenewal + ".");

		logDebug("------------------------------------------------------------------------------------------");

		if(alreadyExistsInSetArray.length != 0)
		{
			logDebug("------Duplicate records in CLONE SET starts-----------");
			for(index in alreadyExistsInSetArray)
			{
				logDebug(alreadyExistsInSetArray[index]);
			}
			logDebug("------Duplicate records in CLONE SET Ends-----------");
		}

	   
	   logDebug("End of BatchPrint For Renewal Job: Elapsed Time : " + elapsed() + " Seconds.");
   }
   catch(ex)
   {
		logDebug("ERROR: Error encountered during execution: "+ex.toString());
   }
   finally
   {
		if (showDebug)
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
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_BATCH_RENEWAL_PRINT completed with " + ELPLogging.getErrorCount() + " errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_BATCH_RENEWAL_PRINT completed with " + ELPLogging.getErrorCount() + " errors.")
			}
			else 
			{
				aa.env.setValue("EMSEReturnMessage", "EMSE_DPL_INT_BATCH_RENEWAL_PRINT1 completed with no errors.");
				logDebug("EMSEReturnMessage: " + "EMSE_DPL_INT_BATCH_RENEWAL_PRINT2 completed with no errors.")
			}
		}

		//logDebug(ELPLogging.toString());
		if (emailAddress && emailAddress != "" && emailAddress.length > 0 )
		{
			batchJobName = jobName;
			aa.sendMail(senderEmailAddr, emailAddress, emailAddress2, "Result: " + batchJobName, debug);
		}
   }
}

function printBatchJob()
{
	var recordCounts = {};
	recordCounts.alreadyPrinted = 0;
	recordCounts.setCount = 0;	
	recordCounts.numRecordsProcessed = 0;
	recordCounts.alreadyExistsInSet = 0;
	recordCounts.noRenewal = 0;
	recordCounts.invalidCapID = 0;
	var capCount = 0;		
	var setLkupName = null;	
	var setName = aa.env.getValue("SetID");

	var reportSet = new capSet(setName);
	var reportMembers = reportSet.members;
	var tempSetName = setName+"_RENEWAL_CLONE";
	
	originalSetName = tempSetName;
	
	jobName = setName;
	
	if (!chunkFlag)
	{
		var tempSetResult = aa.set.getSetByPK(tempSetName);
		if(!tempSetResult.getSuccess())
		{
			var tempRenResult = aa.set.createSet(tempSetName,tempSetName);
			if(!tempRenResult.getSuccess())
				throw new ELPAccelaEMSEException("Cannot create Temp License Set", ScriptReturnCodes.EMSE_PROCEDURE);
		}
		
		recordCounter = 1;
	}
	
	aa.batchJob.beginTransaction(10);
	transactionActive = true;
	//var tempRenSet = aa.set.getSetByPK(tempSetName).getOutput();
	//logDebug("Temp Set Name is: "+tempRenSet.getSetID());
	
    var capId = null;
    var myHashMap = null;
	//Fetching LookUpReport from the standard choice based on key and value.
	var lkupReport = String(lookup("BATCH_PRINT_CONFIG_PARAM", "RENEWAL"));
	var printStatus = "Printed";
	var errorStatus = "Error Generating Report";
	
    var reportToBe = lkupReport.split("|");
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
	var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
	setDetailScriptModel.setSetID(setName);
	var memberList = aa.set.getSetMembers(setDetailScriptModel).getOutput()
	logDebug("INFO: Number of records in Set: " + memberList.size() + ".");	
	recordCounts.setCount = memberList.size();
    // for each individual record add the appropriate document
    for(var index = 0; index < memberList.size(); index ++)
	{
		// CR451 : Start
		if (chunkFlag)
		{
			if (setFlag)
			{
				var tempSetResult = aa.set.getSetByPK(originalSetName);
				if(!tempSetResult.getSuccess())
				{
					var tempRenResult = aa.set.createSet(originalSetName,originalSetName);
					if(!tempRenResult.getSuccess())
						throw new ELPAccelaEMSEException("Cannot create Temp License Set", ScriptReturnCodes.EMSE_PROCEDURE);
				}
				setFlag = false;
			}
			
			if (!recordCounter)
			{
				tempSetName = tempSetName+chunkCounter;
				var tempSetResult = aa.set.getSetByPK(tempSetName);
				if(!tempSetResult.getSuccess())
				{
					var tempRenResult = aa.set.createSet(tempSetName,tempSetName);
					if(!tempRenResult.getSuccess())
						throw new ELPAccelaEMSEException("Cannot create Temp License Set", ScriptReturnCodes.EMSE_PROCEDURE);
				}
			}
		}
		// CR451 : End
		var setMember = memberList.get(index);	
		var parentCapID = null;
		var altID = " ";		
		var capIdObj = aa.cap.getCapID(setMember.getID1(), setMember.getID2(), setMember.getID3());
			
		if(capIdObj.getSuccess())
		{
			parentCapID = capIdObj.getOutput();
			altID = parentCapID.getCustomID();
		}		

		var setMemberStatus = setMember.getSetMemberStatus();
		if((setMemberStatus != printStatus) || (!setMemberStatus))
		{
			if(parentCapID != null)
			{
				//var parentCapID = getParentLicenseRecord(childCapID);
				var childCapID = getLatestTempRenewal(parentCapID);
				
				if(childCapID)
				{
					logDebug("Child CAP: "+childCapID.getCustomID()+" Parent CAP: "+parentCapID.getCustomID());
					var capId = parentCapID;						
					myHashMap = aa.util.newHashMap();
					myHashMap.put("ALT_ID",  String(childCapID.getCustomID()));
					
					//Sagar : Fix for PROD defect 12110 : PRD_DPL_Duplicate Renewal were generated for EL Board
					var isDupRecord = true;
					if (chunkFlag)
					{
						isDupRecord = cloneSetDuplicateRecordCheck(originalSetName,childCapID);
					}
					else
					{
						isDupRecord = cloneSetDuplicateRecordCheck(tempSetName,childCapID);
					}

					if(!isDupRecord)
					{
						if (chunkFlag)
						{
							aa.set.add(originalSetName,childCapID);
						}
						aa.set.add(tempSetName,childCapID);
						logDebug("Added Record: "+childCapID+" to Set ID: "+tempSetName);
						var auditID = aa.env.getValue("CurrentUserID");
						//logDebug("The User ID is: "+auditID);
						
						var setDetailScriptModel = new com.accela.aa.emse.dom.SetDetailsScriptModel("DPL",auditID,setMember);
						setDetailScriptModel.setSetMemberStatus(printStatus);
						var updateResult = aa.set.updateSetMemberStatus(setDetailScriptModel);
						if( ! updateResult.getSuccess())
						{
							logDebug("Script failed up to update SetMemberStatus for record " + capId.getCustomID());
						}				
						
						recordCounts.numRecordsProcessed++;
					}
					else
					{
						logDebug("Renewal record : "+childCapID+" already exists in the Clone set");
						recordCounts.alreadyExistsInSet++;
						alreadyExistsInSetArray.push(childCapID.getCustomID());
					}
				} 
				else 
				{
					recordCounts.noRenewal++;
					logDebug("DEBUG: SKIP CapID " + setMember.getID1() + "-" + setMember.getID2() + "-" + setMember.getID3() + " : " + altID + ", NO RENEWAL FOUND ");			
				}
			} 
			else 
			{
				recordCounts.invalidCapID++;
				logDebug("DEBUG: SKIP CapID " + setMember.getID1() + "-" + setMember.getID2() + "-" + setMember.getID3() + " : " + altID + ", NOT FOUND ");			
			}
		} 
		else 
		{
			recordCounts.alreadyPrinted++;
		}
		
		if ((recordCounter == (chunkSize-1)) && chunkFlag)
		{
			aa.batchJob.commitTransaction();
			//transactionActive = false;
			
			var tempSetDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
			tempSetDetailScriptModel.setSetID(tempSetName);
			var tempList = aa.set.getSetMembers(tempSetDetailScriptModel).getOutput();
			
			/*------------------- Print combined Batch REPORT ---------------------*/
			if(tempList.size() > 0)  
			{	
				
				var reportForSet = reportToBe;
						
				var batchHashParameters = aa.util.newHashMap();
				var batchCompleted = true;
				
				batchHashParameters.put("SET_ID", tempSetName);				
				batchCompleted = generateReportSaveOnSetForRenewal(bulkReportName, batchHashParameters, setName);
				
				
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
			}
			else
			{
				logDebug("*******WARNING: No records were added to the TEMP SET**********" + tempSetName);
			}
			recordCounter = 0;
			chunkCounter = chunkCounter +1;
			tempSetName = originalSetName;
			aa.batchJob.commitTransaction();
		}
		else
		{
			recordCounter = recordCounter + 1;
		}
	}


	aa.batchJob.commitTransaction();
	transactionActive = false;
	
	if (recordCounter)
	{
		var tempSetDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();
		tempSetDetailScriptModel.setSetID(tempSetName);
		var tempList = aa.set.getSetMembers(tempSetDetailScriptModel).getOutput();
		
		/*------------------- Print combined Batch REPORT ---------------------*/
		if(tempList.size() > 0)  
		{	
			
			var reportForSet = reportToBe;
					
			var batchHashParameters = aa.util.newHashMap();
			var batchCompleted = true;
			
			batchHashParameters.put("SET_ID", tempSetName);				
			batchCompleted = generateReportSaveOnSetForRenewal(bulkReportName, batchHashParameters, setName);
			
			
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
		}
		else
		{
			logDebug("*******WARNING: No records were added to the TEMP SET**********" + tempSetName);
		}
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
	logDebug("For a record level PDF");
	
    var itemCap = capId;
	var saveToCapID = capId;
	var altID = saveToCapID.getCustomID();
	var scanner = new Scanner(altID, "-");
	var licenseNbr = scanner.next();
	var boardCode = scanner.next();
	var typeClass = scanner.next();
	
	var saveToCapIdStr = String(saveToCapID.getID1() + "-" + saveToCapID.getID2() + "-" + saveToCapID.getID3());
	var report = aa.reportManager.getReportInfoModelByName(reportName);
	     
	if(report.getSuccess())
	{
		report = report.getOutput();
		report.setModule("DPL");
		var capIdStr = String(itemCap.getID1() + "-" + itemCap.getID2() + "-" + itemCap.getID3());
		report.setCapId(capIdStr);
		report.setReportParameters(hashMapReportParameters);
		var ed1 = report.getEDMSEntityIdModel();
		ed1.setCapId(saveToCapIdStr);
		ed1.setAltId(saveToCapID.getCustomID());
		
		
		report.setEDMSEntityIdModel(ed1);
		var reportResult = null;
		
		reportResult = aa.reportManager.getReportResult(report);

		if(reportResult)
		{
			reportResult = reportResult.getOutput();
			
			//-------------- If file generated successfully then update record status of the child record--------------
			if (reportResult != null)
			{
				logDebug("File Generated Successfully");
			}
			else
			{
				 logDebug("\n +++++++++ Error: Unable to execute report " + reportName+" for record "+capId.getCustomID());
				 return false;
			}

		}
		else
		{
			logDebug("\n +++++++++ Error: Unable to retrieve report result in function generateReportSaveForRecord with reportName: " + reportName);
			return false;
		}
	}
	else
	{
		logDebug("\n +++++++++ Error: Report Info model not found. Renewal Notification Print aborted for report name: "+ reportName + " Record ID: "+ saveToCapIdStr +" ++++++++ \n");
		return false;
	}
   return true;
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
 * @desc This method generates Print combined Batch REPORT .
 * @param reportName - Contains reportName
 * @param hashMapReportParameters - Contains hashMapReportParameters
 * @param setIDStr - Contains setName
*/
function generateReportSaveOnSetForRenewal(reportName, hashMapReportParameters, setIDStr)
{
	logDebug("For a combined renewal notification PDF");
	//--------------------generateReportSaveOnSetForRenewal-----------------------------
	
    // Generates a report and save the document to set under the documents tab.
	
	setIDStr = String(setIDStr);
	var setNameArray = setIDStr.split("|");
	var boardCode = setNameArray[0];
	
	var report = aa.reportManager.getReportInfoModelByName(reportName);
	logDebug("The Report Name for the Batch is: "+reportName);
  
   if(report.getSuccess())
   {
		report = report.getOutput();
		report.setModule("DPL");
		
		report.setReportParameters(hashMapReportParameters);
		var ed1 = report.getEDMSEntityIdModel();		
		ed1.setSetId(setIDStr);
		//attach document to the set.
		report.setEDMSEntityIdModel(ed1);
		
		logDebug("The Report Parameters for the batch is: "+report.getReportParameters() +" Report name is : "+report);
		
		var reportResultScriptModelResult = aa.reportManager.getReportResult(report);
		  
		if(reportResultScriptModelResult.getSuccess())
		{
			var reportResultScriptModel = reportResultScriptModelResult.getOutput();
					
			var date = new Date();
			//Fix for PROD Defect 13108 : Date formats should match client conventions
			var dateResult = aa.util.formatDate(date, "MMddyyyy");
			//DPL Renewal_[BOARD_CODE]_[ddmmyyyy].pdf
			var fileName = "";
			if (chunkFlag)
			{
				fileName = fileLocation +"//" + "DPL Renewal_" + boardCode + "_" + dateResult + "RENEWAL_CLONE"+chunkCounter+ ".pdf";
			}
			else
			{
				fileName = fileLocation +"//" + "DPL Renewal_" + boardCode + "_" + dateResult + ".pdf";
			}
			
			if (reportResultScriptModel != null)
			{
				var reportResultModel = reportResultScriptModel.getReportResultModel();
				var reportContents = reportResultModel.getContent();
				var reportFile = createLocalDocument(reportContents, fileName);
				//-------------- If file printed successfully then update record status --------------
				if(reportFile)
				{
					logDebug("reportFile for combined PDF: " +reportFile);
					return true;
				} 
			}
			else
			{
			 logDebug("Report Result is null for reportName: " + reportName);
			 return false;
			}
		}
		else
		{
			logDebug("Unable to retreive report result for reportName: "+reportName+" "+reportResultScriptModelResult.getErrorMessage());
			return false;
		}
	}
	else
	{
		logDebug("\n +++++++++ Error: Report Info model not found. Batch Renewal Notification aborted for report name: "+reportName +" ++++++++ \n");
        return false; 
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
		logDebug("File Created Successfully");		
	}
	catch(ex)
	{
		logDebug("**ERROR : Not able to create Local file : "+ex.message);
	}
	var outFile = new java.io.File(File_PATH);
	return outFile;
}

function getLatestTempRenewal(capId)
{
	var result = aa.cap.getProjectByMasterID(capId, "Renewal", "Incomplete");
	if (result.getSuccess()) 
	{
		var partialProjects = result.getOutput();
		if (partialProjects != null && partialProjects.length > 0)
		{
			var latestRenewalCapID;
			var latestDate = 0;
			for(var index in partialProjects)
			{
				// loop through each child record
				var thisChild = partialProjects[index];
				var capIDModel = thisChild.getCapID();
				var renewalCap = aa.cap.getCap(capIDModel).getOutput();
				var perID1 = capIDModel.getID1();
				
				var createdDate = aa.util.parseInt(dateFormatToMMDDYYYY(convertDate(renewalCap.getFileDate())));
				
				if((createdDate > latestDate) && (perID1.indexOf("EST") > 0))
				{
					latestDate = createdDate;
					latestRenewalCapID = renewalCap.getCapID();
				}
				
			}
			return latestRenewalCapID;
		}		
	}
}

/**
 * @desc This method converts a javascript date object into a String with the format YYYYMMDD
 * @param {date} pJavaScriptDate - contains the javascript date object to be converted
 * @returns {string} - contains the string version of the javascript date object
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
			// logDebug("Parameter is not a javascript date");
			return ("INVALID JAVASCRIPT DATE");
		}
	}else{
		//  logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
	}
}

//Sagar : Fix for PROD defect 12110 : PRD_DPL_Duplicate Renewal were generated for EL Board
/**
 * @desc This method validates the duplicate record check in CLONE SET.
 * @param { capID } : capID from the Accela
 * @param { setName } : Clone set Name
 * @return { duplicateFlag } : Boolean
*/
function cloneSetDuplicateRecordCheck(setName, capID)
{
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
	logDebug("duplicateFlag = "+duplicateFlag);
	return duplicateFlag;
}