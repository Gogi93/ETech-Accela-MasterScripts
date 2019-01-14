/*
 * Program: WTUA;Enforce!Investigation!Intake!~.js
 * Event: Workflow Task Update After - WTUA
 *
 * This is used to activate the next task when 'Board Review/Complaint Closed' is set.
 *
 */

//showDebug = 3;

// Check to see if task and status equal to required values.
if (wfTask == "Board Review" && wfStatus == "Complaint Closed") {
   setTask("Board Review","N", "Y");
   deactivateTask("Board Review");
   activateTask("Complaint Closure");
}

if (wfTask == "Board Review" && wfStatus == "No Action") {
   //	taskCloseAllExcept(wfStatus,"");
}

if (wfTask == "Board Review" && wfStatus == "Complaint Closed") {
   branchTask("Complaint Closure", "Notify Parties", "", "");
}


// Added the line to deactivate all active tasks for defect 2266
if (wfTask == "Complaint Closure" && wfStatus == "Closure Complete")

{
   viewCondInvestigativeIntakePendingRecordIdASI();
   deactivateActiveTasks("DPL_INVESTIGATIVE_INTAKE");
}

// To add child Adjudication record.

if(wfTask=="Order Issuance" && wfStatus=="Issuance Complete") {
  var childCap= createChildOne("Enforce", "Adjudication", "NA", "NA", "", capId);

  //added for Defect # 1307
  updateAppStatus("Pending", "", childCap);

 // copyASIFields(capId, childCap, "LICENSE INFORMATION", "CASE SUMMARY", "CLOSURE", "HEALTH CARE FRAUD", "ATTESTATION");

  // For defect 1654 copy only ASI whcih exists on adjudication record.
copyApplicationSpecificInfox(capId, childCap);

// To address the defect 2845, copying contacts along with address for only Respondnet and Respondnet Business.

copyContactsByTypeWithAddress(capId, childCap, "Respondent");
copyContactsByTypeWithAddress(capId, childCap, "Respondent Business");

  copyASITables(capId, childCap);
  copyLicensedProf(capId, childCap);
  //Added for CR-459
  CWM_ELP_459_WTUA_DPL_copyContactToAdjRecord(childCap);
  CWM_ELP_459_WTUA_DPL_exposeRecordOnACA(childCap);
  //End of CR-459
  removeASITable("NATURE CODE", childCap);
  removeASITable("EVIDENCE", childCap);
  removeASITable("DECISION CODE", childCap);
  removeASITable("ALLEGATIONS",childCap);
  var ActiveTable = loadASITable("ALLEGATIONS", capId);
  for (var I in ActiveTable)
      {
               y = ActiveTable[I];
               if (y.Status != "Active")
               continue;
               copyThisRow(y.Type,y.Description,y["Case Law"],y.Status);
   //for (var j in y) aa.print(j + " " + y[j]);
      }

  var vTempCapId = aa.cap.getCapID(capId.getID1().toString(),capId.getID2().toString(),capId.getID3().toString()).getOutput();
  capId = aa.cap.getCapID(childCap.getID1().toString(),childCap.getID2().toString(),childCap.getID3().toString()).getOutput();

  ASAForAllEnforce();

  capId = aa.cap.getCapID(vTempCapId.getID1().toString(),vTempCapId.getID2().toString(),vTempCapId.getID3().toString()).getOutput();

}

// Add investigative Intake Pending condition on 'Respondent' or 'Respondent Business' Contact
if((wfTask == "Board Review" && wfStatus == "Formal Complaint") || (wfTask == "Triage" && wfStatus == "Board Review of Complaint") || (wfTask == "Supervisor Review" && wfStatus == "Formal Complaint") || (wfTask == "Triage" && wfStatus == "Formal Complaint")|| (wfTask == "Board Review" && wfStatus == "Refer to Prosecution"))
{
	var vComplaintASI = AInfo["Complaint"];
	if(vComplaintASI != "CHECKED"){
//add investigative intake condition
	var altId = capId.getCustomID()
	addCond_InvestigativeIntakePending(altId);
	//add to complaint set for labels To resolve defect 1091
	//only call the complaint label report of the complaint label checkbox is not checked

	logDebug("adding complaint to print label set");
	callReport("Complaint_Labels",false,true);
	
	//set the complaint checkbox To resolve defect 2668
	logDebug("Setting Complaint Checkbox");
	 var sourceASIResult = aa.appSpecificInfo.getByCapID(capId)
        if (sourceASIResult.getSuccess())
		 {
					var sourceASI = sourceASIResult.getOutput();
		 }
		for (ASICount in sourceASI)
		{
					thisASI = sourceASI[ASICount];
					if(thisASI.getCheckboxDesc() == "Complaint")
		  {
			 thisASI.setChecklistComment("CHECKED");
			 aa.appSpecificInfo.editAppSpecInfoValue(thisASI);
		  }
		}
}
}
if((wfTask == "Board Review" && wfStatus == "Refer to Prosecution")){
logDebug("On selected");
	var deptUser = lookup("TASK_ASSIGNMENT", "IIR|SUP"); 
	dplTaskAssign("Prosecution Review", deptUser);	
	dplTaskAssign("Consent Agreement", deptUser);	
}

// Added the missing function by NPHON on 8/4/14


if (wfTask == "Consent Agreement Distribution" && wfStatus == "Agreement Distributed") {
   logDebug("CapType: " + cap.getCapType().toString() + ", wfTask: " + wfTask + ", wfStatus: " + wfStatus);

  var vBoardASI = AInfo["Board"];
   var capType1 = "Enforce/Compliance/NA/NA";
	var childFlag = false;
	var arrChildCaps = getChildren(capType1, capId);
	
	if(arrChildCaps == null || arrChildCaps == 0 || arrChildCaps == "undefined")
	{
		childFlag = false;
	}
	else if(arrChildCaps != null)
	{
		for(zz in arrChildCaps)
		{
			var rec = aa.cap.getCap(arrChildCaps[zz]).getOutput();
			var childType = rec.getCapType();
			if(childType == "Enforce/Compliance/NA/NA")
			{
				childFlag = true;
				break;
			}
		}
	}
	
	//logDebug("Compliance Flag: " + childFlag);
	
	var capType2 = "Enforce/Adjudication/NA/NA";
	var indirectChildFlag = false;
	var arrChildCaps2 = getChildren(capType2, capId);
	
	if(arrChildCaps2 == null || arrChildCaps2 == 0 || arrChildCaps2 == "undefined")
	{
		indirectChildFlag = false;
	}
	else if(arrChildCaps2 != null)
	{
		//logDebug("Inside else");
		for(zz in arrChildCaps2)
		{
			if(!indirectChildFlag)
			{
				var rec = aa.cap.getCap(arrChildCaps2[zz]).getOutput();
				var childType = rec.getCapType();
				if(childType == "Enforce/Adjudication/NA/NA")
				{
					var childCapId = rec.getCapID();
					//logDebug("Adjudication rec: " + childCapId + " " + childType);
					var arrChildCaps3 = getChildren(capType1, childCapId);
					if(arrChildCaps3 == null || arrChildCaps3 == 0 || arrChildCaps3 == "undefined")
					{
						indirectChildFlag = false;
					}
					else if(arrChildCaps3 != null)
					{
						for(zz in arrChildCaps3)
						{
							var childRec = aa.cap.getCap(arrChildCaps3[zz]).getOutput();
							var adjChildType = childRec.getCapType();
							//logDebug("Adj child: " + childRec.getCapID() + " " + adjChildType);
							if(adjChildType == "Enforce/Compliance/NA/NA")
							{
								//logDebug("Compliance child found");
								indirectChildFlag = true;
								break;
							}
						}
					}
				}
			}
		}
	}

	if(!childFlag && !indirectChildFlag)
	{
   var childAppId = createChild("Enforce", "Compliance", "NA", "NA", "Compliance");

   logDebug("A Compliance child record has been created with capId: " + childAppId);

   copyContacts(capId, childAppId);
   //Added for defect JIRA-2494 to delete Complainant Contact from Compliance Record
   removeComplainantContactFromCompliance(childAppId);
   copyAddresses(capId, childAppId);
   copyLicensedProf(capId, childAppId);

   if (vBoardASI != undefined && vBoardASI != null && vBoardASI != "") {

      editAppSpecific("Board", vBoardASI, childAppId);

   }

   var vTempCapId = aa.cap.getCapID(capId.getID1().toString(),capId.getID2().toString(),capId.getID3().toString()).getOutput();
   capId = aa.cap.getCapID(childAppId.getID1().toString(),childAppId.getID2().toString(),childAppId.getID3().toString()).getOutput();

//added january 5, 2015 as per defect 2555
	var vBoardASI = AInfo["Board"];
	if (vBoardASI != undefined && vBoardASI != null && vBoardASI != "") {

    var deptUser = lookup("TASK_ASSIGNMENT", lookup("BOARDS", vBoardASI) + "|ED");
	dplTaskAssign("Intake", deptUser);


	}
	ASAForAllEnforce();

   capId = aa.cap.getCapID(vTempCapId.getID1().toString(),vTempCapId.getID2().toString(),vTempCapId.getID3().toString()).getOutput();
	}

   
   closeChildAdjudicationCase(capId);
}

// Defect 160: Added by NPHON on 8/6/14
if (wfTask == "Board Review" && wfStatus == "No Action") {
   setTask("Board Review","N", "Y");
   deactivateTask("Board Review");
   closeCap(currentUserID);
}
CWM_ELP_4148_WTUA_DPL_Defect();
// Defect 160
if (wfTask == "Board Review" && wfStatus == "Complaint Closed") {
   setTask("Board Review","N", "Y");
   deactivateTask("Board Review");
   activateTask("Complaint Closure");
   //added for 1295
   updateLicWorkflowTask(capId);
   activateTask("Complaint Closure");
   updateAppStatus("Closed", "", capId);
}
// Defect 514
if (wfTask == "Order Approval" && wfStatus == "Revision Needed") {
   setTask("Order Approval","N", "Y");
   deactivateTask("Order Approval");
   activateTask("Prosecution Review");
   updateTask("Prosecution Review", "Under Review", "");
}
// Defect 160
if (wfTask == "Prosecution Review" && wfStatus == "Return to Board") {
   setTask("Prosecution Review","N", "Y");
   deactivateTask("Prosecution Review");
   deactivateTask("Consent Agreement");
   activateTask("Board Review");
}

if (wfTask == "Consent Agreement" && wfStatus == "Executed Consent Agreement") {
   deactivateTask("Prosecution Review");
}

if (wfTask == "Prosecution Review" && wfStatus == "Decision Issued") {
   deactivateTask("Consent Agreement");
}

//Added By Bhandhavya to resolve defect 1091 on 9/26 to create SET for ComplAINT LABELS

//if((wfTask == "Triage" && wfStatus == "Formal Complaint") || (wfTask == "Supervisor Review" && wfStatus == "Formal Complaint"))
//if((wfTask == "Triage" && wfStatus == "Board Review of Complaint") || (wfTask == "Supervisor Review" && wfStatus == "Formal Complaint") || (wfTask == "Triage" && wfStatus == "Formal Complaint"))
//{
//  callReport("Complaint_Labels",false,true);
//}



// To resolve defect 2668
/* if((wfTask == "Triage" && wfStatus == "Board Review of Complaint") || (wfTask == "Board Review" && wfStatus == "Formal Complaint") || (wfTask == "Triage" && wfStatus == "Formal Complaint") || (wfTask == "Board Review" && wfStatus == "Refer to Prosecution"))
{
 var sourceASIResult = aa.appSpecificInfo.getByCapID(capId)
        if (sourceASIResult.getSuccess())
 {
            var sourceASI = sourceASIResult.getOutput();
 }
for (ASICount in sourceASI)
{
            thisASI = sourceASI[ASICount];
            if(thisASI.getCheckboxDesc() == "Complaint")
  {
     thisASI.setChecklistComment("CHECKED");
     aa.appSpecificInfo.editAppSpecInfoValue(thisASI);
  }
}

} */




//added for Defect # 1296

if (wfTask == "Prosecution Review" && wfStatus == "Decision Issued")
{
   updateAppStatus("Under Review", "", capId);
}

if (wfTask == "Investigation" && wfStatus == "Submit to Supervisor")
{
   updateAppStatus("Under Review", "", capId);
}

//added for Defect # 1295

if (wfTask == "Complaint Closure" && wfStatus == "Notice to Reporting Agencies")
{
   updateAppStatus("Closed", "", capId);
}


function updateLicWorkflowTask(associatedCapId)
{
	//Variables defined
	var sysDate = aa.date.getCurrentDate();
	var userId = "admin"
	var systemUserObjResult = aa.person.getUser(userId.toUpperCase());
	if (systemUserObjResult.getSuccess())
	{
		var systemUserObj = systemUserObjResult.getOutput();
	}

	//Access workflow
	var workflowResult = aa.workflow.getTasks(associatedCapId);
	if (workflowResult.getSuccess())
	{
		wfObj = workflowResult.getOutput();
		for (var i=0; i< wfObj.length; i++)
		{
			var fTask = wfObj[i];
			var desc = fTask.getTaskDescription();
			var activeFlag = fTask.getActiveFlag();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			logDebug("RecordId:"+ associatedCapId.getCustomID() + " DESC: " + desc+ " Active Flag: " + fTask.getActiveFlag() + " Step no: " + stepnumber + " Process ID: " + processID);

			// workflow
			if(desc == "Complaint Closure" && activeFlag == "Y")
			{
				var updateWorkflowTaskResult = aa.workflow.handleDisposition(associatedCapId,stepnumber,processID,"Notice to Reporting Agencies",sysDate, "","Updated via script",systemUserObj ,"Y");
				logDebug("Updated status: " + fTask.getDisposition() + " " + "Succeeded: " +updateWorkflowTaskResult.getSuccess());
			}
		}
	}
}


function copyApplicationSpecificInfox(srcCapId, targetCapId)
 {
    AInfo = new Array();
    capId = srcCapId;
    useAppSpecificGroupName = false;
    loadAppSpecific(AInfo, srcCapId);
    copyAppSpecific(targetCapId);
}


function copyThisRow(ipType,ipDesc,ipCase,ipStatus)
{
  var fvTableName = "ALLEGATIONS";
  var fvTable = loadASITable(fvTableName,childCap);
  if (!fvTable ) fvTable = new Array();

  var fvRow = new Array();
        fvRow["Type"] = ipType;
        fvRow["Description"] = ipDesc;
        fvRow["Case Law"] = ipCase;
  fvRow["Status"] = ipStatus;
        fvRow["Outcome"] = "";
  fvTable.push(fvRow);
  //removeASITable(fvTableName, childCap);
  addStringValuesToASITableXX(fvTableName,fvTable,childCap);
}

function addStringValuesToASITableXX(ipTableName,ipTableValueArray) //Optional capId
{
  var fvCapID = capId;
  if (arguments.length > 2)
    fvCapID = arguments[2]; // Use cap ID specified in args.

  var fvTssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(fvCapID,ipTableName);

  var fvTssm = fvTssmResult.getOutput();
  var fvTsm = fvTssm.getAppSpecificTableModel();
  var fvFld = fvTsm.getTableField();
  var fvFld_Readonly = fvTsm.getReadonlyField(); // get Readonly field

  for (fvThisrow in ipTableValueArray)
  {
    var fvCol = fvTsm.getColumns();
    var fvColi = fvCol.iterator();

    while (fvColi.hasNext())
    {
      var fvColname = fvColi.next();
      fvFld.add(ipTableValueArray[fvThisrow][fvColname.getColumnName()].toString());
      fvFld_Readonly.add(null);
    }
    fvTsm.setTableField(fvFld);

    fvTsm.setReadonlyField(fvFld_Readonly);
  }

  var fvResult = aa.appSpecificTableScript.editAppSpecificTableInfos(fvTsm,fvCapID,currentUserID);

  if (fvResult.getSuccess())
  {
    logDebug("Successfully added record to ASI Table: " + ipTableName);
    return true;
  }
  logDebug("**WARNING: error adding record to ASI Table:  " + ipTableName + " " + fvResult.getErrorMessage());
  return false;
}


//start task asisgnment code
	var vBoardASI = AInfo["Board"];
	if (vBoardASI != undefined && vBoardASI != null && vBoardASI != "") {
      var deptUser = lookup("TASK_ASSIGNMENT", lookup("BOARDS", vBoardASI) + "|ED");
      var deptUser2 = lookup("TASK_ASSIGNMENT", lookup("BOARDS", vBoardASI) + "|SUP");
	  }
         var prosecutionReviewUser = getTaskAssignedTo("Prosecution Review");
		if (prosecutionReviewUser=="DPL/NA/NA/NA/NA/NA/NA"){
		   prosecutionReviewUser = deptUser2;
	   }


var investigationUser = getTaskAssignedTo("Investigation");
      if (investigationUser != undefined && investigationUser != null && investigationUser != "") {
		  investigationUser = getTaskAssignedTo("Investigation");
		  logDebug("Investigation user1:" + investigationUser);
		if(investigationUser=="DPL/NA/NA/NA/NA/NA/NA"){
				investigationUser = deptUser2;
			}
		 }
		 else {
		 investigationUser = getTaskAssignedTo("Triage");
		 logDebug("Investigation user2:" + investigationUser);
		if(investigationUser=="DPL/NA/NA/NA/NA/NA/NA"){
				investigationUser = deptUser2;
			}
		 }

logDebug("Investigation user:" + investigationUser);
   if (wfTask == "Investigation" && wfStatus == "Submit to Supervisor") {
      if (deptUser2 != undefined && deptUser2 != null && deptUser2 != "") {
		dplTaskAssign("Supervisor Review", deptUser2);
      }
	}
	if (wfTask == "Supervisor Review" && (wfStatus == "Approved for Board Review" || wfStatus == "Formal Complaint" )) {
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		dplTaskAssign("Board Review", deptUser);
      }
	}
if ((wfTask == "Triage" && (wfStatus == "Board Review of Case" || wfStatus == "Board Review of Complaint" )) || (wfTask == "Prosecution Review" && wfStatus == "Return to Board")) {
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		dplTaskAssign("Board Review", deptUser);
      }
	}
	//defect 2793
if (wfTask == "Triage" && (wfStatus == "Investigation" || wfStatus == "Formal Complaint" )) {
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		  if(getTaskAssignedTo("Triage")){
		dplTaskAssign("Investigation", getTaskAssignedTo("Triage"));
		  }
		else {
		dplTaskAssign("Investigation", deptUser);
		}
      }
	}		
	
if ((wfTask == "Supervisor Review" || wfTask == "Board Review") && wfStatus == "Investigation") {
      if (investigationUser != undefined && investigationUser != null && investigationUser != "") {
		dplTaskAssign("Investigation", investigationUser);
      }
	}	
if (wfTask == "Prosecution Review" && wfStatus == "Return to Investigation") {
      if (investigationUser != undefined && investigationUser != null && investigationUser != "") {
		dplTaskAssign("Investigation", investigationUser);
      }
	}	
if (wfTask == "Board Review" && wfStatus == "Issue Consent Agreement"){
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		dplTaskAssign("Board Consent Agreement", deptUser);
      }
	}
if ((wfTask == "Board Consent Agreement" && wfStatus == "Executed Consent Agreement") || (wfTask == "Board Review" && wfStatus == "Complaint Closed") || (wfTask == "Post Decision Notification" && wfStatus == "Parties Notified") || (wfTask == "Consent Agreement Distribution" && wfStatus == "Agreement Distributed")){
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		dplTaskAssign("Complaint Closure", deptUser);
      }
	}
if (wfTask == "Prosecution Review" && (wfStatus == "Order to Show Cause Drafted" || wfStatus == "Summary Suspension Drafted")){
      if (deptUser != undefined && deptUser != null && deptUser != "") {
		dplTaskAssign("Order Approval", deptUser);
      }

}
if (wfTask == "Prosecution Review" && wfStatus == "Decision Issued"){
         if (prosecutionReviewUser != undefined && prosecutionReviewUser != null && prosecutionReviewUser != "") {
            dplTaskAssign("Post Decision Notification", prosecutionReviewUser);
         }

	}
if (wfTask == "Consent Agreement" && wfStatus == "Executed Consent Agreement"){
         if (prosecutionReviewUser != undefined && prosecutionReviewUser != null && prosecutionReviewUser != "") {
            dplTaskAssign("Consent Agreement Distribution", prosecutionReviewUser);
         }

	}
	if (wfTask == "Order Approval" && wfStatus == "Order Approved"){
         if (prosecutionReviewUser != undefined && prosecutionReviewUser != null && prosecutionReviewUser != "") {
            dplTaskAssign("Order Issuance", prosecutionReviewUser);
         }

	}

function ASAForAllEnforce()
{
	syncContacts();

	vBoard = getBoard(capId);

	if (vBoard != undefined && vBoard != null && vBoard != "" && vBoard != "null")
		updateShortNotes(vBoard);

	/*var investigativeIntakeCapId = getAssociativeId(capId);
	if (investigativeIntakeCapId)
	{
		sendAssignedStaffEmailToParent(investigativeIntakeCapId);
		var childCapId = getChildCapId(investigativeIntakeCapId);
		if (childCapId)
		{
			sendAssignedStaffEmailtoChild(childCapId);
		}

	}*/
}
//Added for defect JIRA-2494 
function removeComplainantContactFromCompliance(ipLicCapID)
  {
	  logDebug("Inside removeComplainantContactFromCompliance function");
    if (!ipLicCapID)
      return;
    var fvContactsSR = aa.people.getCapContactByCapID(ipLicCapID);
    if (!fvContactsSR || !fvContactsSR.getSuccess())
      return;
    var fvContacts = fvContactsSR.getOutput();
    if (!fvContacts || fvContacts.length < 1)
      return;
    for (var fvCounter in fvContacts)
    {
      var fvContact = fvContacts[fvCounter];
      var fvPeople = fvContact.getPeople();
      var fvContactType = fvPeople.getContactType();
      if (fvContactType != "Complainant")
        continue;
      var fvContactModel = fvContact.getCapContactModel();
      var fvSeqNum = fvContactModel.getContactSeqNumber();
      var fvResult = aa.people.removeCapContact(ipLicCapID, fvSeqNum);
      if (fvResult.getSuccess())
        logDebug("Successfully removed 'Complainant' Contact.");
      else
        logDebug("Failed to remove 'Complainant' Contact.");
    }
  }

CWM_ELP_1486_WTUA_DPL_sendComplainantEmailFormal();
CWM_ELP_1455_WTUA_DPL_notifyProsHearOff();