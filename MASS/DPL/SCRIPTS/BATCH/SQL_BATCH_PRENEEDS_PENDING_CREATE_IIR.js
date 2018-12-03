/***********************************************************************************************************************************
* @Title 		: 	SQL_BATCH_PRENEEDS_PENDING_CREATE_IIR
* @Author		:	Ankush Kshirsagar
* @Date			:	08/24/2016
* @Description 	:	If batch is run to create IIR record of Funeral Establishments who have not yet submitted their Pre-Needs Amendment in this calendar year.
***********************************************************************************************************************************/
var SCRIPT_VERSION = 3.0;

showDebug = true;
showMessage = false;
var maxSeconds = 60 * 60 * 2;
var br = "<br>";

var sysDate = aa.date.getCurrentDate();
var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("BatchJobName");

// Global variables
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer
var timeExpired = false;
// Email address of the sender
var senderEmailAddr = "Noreply@elicensing.state.ma.us";
var emailAddress = "";

var capCount = 0;
var condAddedCount = 0;
var emailText = "";

// you can get rid of the ELPLogging debug
try
{
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_CUSTOM"));		
	eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
	eval(getScriptText("EMSE_MA_INT_C_DBUTILS"));
	eval(getScriptText("EMSE_MA_INT_C_PARAMETER"));
	eval(getScriptText("EMSE_MA_INT_C_STOREDPROCEDURE"));
	eval(getScriptText("EMSE_MA_INT_C_DATATYPE"));
	eval(getScriptText("EMSE_MA_INT_C_ELPLOGGING"));
	eval(getScriptText("EMSE_MA_INT_C_RETURNCODES"));
	eval(getScriptText("EMSE_MA_INT_C_EMSEEXCEPTION"));
	eval(getScriptText("EMSE_MA_INT_C_UTILITY"));
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var group = aa.env.getValue("group");
var recordType = aa.env.getValue("recordType");
var recordSubType = aa.env.getValue("recordSubType");
var recordCategory = aa.env.getValue("recordCategory");
var wTask = aa.env.getValue("wTask");
var wStatus = aa.env.getValue("wStatus");
//var duration = aa.env.getValue("duration"); 

/* *
 * User Parameters  Begin
 * */
var emailAddress = lookup("BATCH_STATUS_EMAIL", "PRE_NEEDS_PENDING"); // This email will be set by standard choice
if (emailAddress == null || emailAddress == "") 
	aa.print("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");

var emailAddress2 = getParam("emailAddress"); // This will be secondary (CC) email set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";

var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
		"supplemental":   [{\
					"tag":"queryFEPendingAmend",\
					"procedure":{\
						"name":"ELP_SP_FE_FUNERALEST_QUERY",\
						"resultSet":{"list":[\
														 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
														 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
														 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
														 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
						"parameters":{"list":[\
														 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
		}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);
try
{
	var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	if(dbConfiguration)
	{
		this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);
		logDebugAndEmail("Environment serviceName: " + dbConfiguration.connectionInfo.serviceName);

		// Create a connection to the Staging Table Database
		var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		* Obtain Stored Procedure for queryECBViolation into Staging Table
		*/
		var pendingExamProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryFEPendingAmend")
			{
				 var pendingExamProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (pendingExamProcedure == null)
		{
			var message = "Cannot find procedure queryFEPendingAmend";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryFEPendingAmend: " + supplementalConfiguration.procedure.name);

		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		pendingExamProcedure.prepareStatement();
		var inputParameters = pendingExamProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};
		 
		logDebugAndEmail("Searching for HD records with 'Pending Exam' record status and over days since Validate/Approved for Sit status");

		pendingExamProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		pendingExamProcedure.setParameters(inputParameters);
		var setName = "PRE-NEEDS REPORTS NOT SUBMITTED TO DATE";
		var setDescription = setName;
		var setType = "PRE-NEEDS REPORTS";
		var setStatus = "Pending";
		var licenseProcessed = 0;
		
		var setExists = false;
		var setGetResult = aa.set.getSetByPK(setName);
		if (setGetResult.getSuccess()) setExists = true;
		if(setExists){
			var setObj = new capSet(setName);
			for (var i in setObj.members) {
				var mCapId = aa.cap.getCapID(setObj.members[i].ID1, setObj.members[i].ID2, setObj.members[i].ID3).getOutput();
				//aa.print("mCapId.getCustomID() : "+mCapId.getCustomID());
				var setDetailScriptModel = aa.set.getSetDetailsScriptModel().getOutput();			
				setDetailScriptModel.setSetID(setName);
				setDetailScriptModel.setID1(setObj.members[i].ID1);
				setDetailScriptModel.setID2(setObj.members[i].ID2);
				setDetailScriptModel.setID3(setObj.members[i].ID3);
				aa.set.deleteSetMembers(setDetailScriptModel);
			}
		}else if(!setExists){
						aa.set.createSet(setName, setDescription, setType, setStatus);
		}
		//var dataSet = pendingExamProcedure.queryProcedure();
		var dataSet = getRecordsArray(emseParameters);
		
		for (var i in dataSet)
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next())
		{
			ObjKeyRename(dataSet[i], {"B1_ALT_ID": "customID"});
			var queryResult = dataSet[i];			
			//aa.print("queryResult.customID : "+queryResult.customID);
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			capIdResult = aa.cap.getCapID(queryResult.customID);
			if ( ! capIdResult.getSuccess())
			{
				ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}
			
			var capId = capIdResult.getOutput();
			capId = aa.cap.getCapID(capId.ID1, capId.ID2, capId.ID3).getOutput();

			var capResult = aa.cap.getCap(capId);
			if ( ! capResult.getSuccess())
			{
				ELPLogging.debug("getCap error: " + capResult.getErrorMessage());
				continue;
			}
			
			var cap = capResult.getOutput();
			var altId = capId.getCustomID();
			//ELPLogging.debug("altId : "+altId);
			var capStatus = cap.getCapStatus();
			var appTypeResult = cap.getCapType();
			var appTypeString = appTypeResult.toString();
			var appTypeArray = appTypeString.split("/");
			var board = appTypeArray[1];
			
			var isPreNeedsExist = false;
			var appRecordslist = aa.cap.getProjectByMasterID(capId ,null,null);
			if(appRecordslist.getSuccess())
			{
				var appRecordslistModel = appRecordslist.getOutput();
				for(index in appRecordslistModel)
				{			
					var childCapID = appRecordslistModel[index].getCapID();
					if(childCapID){
						childCapID = aa.cap.getCapID(childCapID.getID1(), childCapID.getID2(), childCapID.getID3()).getOutput();
						var childAltID = childCapID.getCustomID();
						var capTypeNew = aa.cap.getCapTypeModelByCapID(childCapID);
						if(capTypeNew && capTypeNew.getSuccess()){
							capTypeNew = capTypeNew.getOutput().toString();			
							if(capTypeNew == "License/Funeral Directors/Funeral Establishment/Pre Needs"){
								var vYear = getAppSpecific("Year",childCapID);
								var newDate=new Date();
								var currentYear = parseInt(newDate.getFullYear());
								currentYear = currentYear - 1;
								vYear = parseInt(vYear);
								if(vYear == currentYear){
									ELPLogging.debug("PreNeeds exists : "+childAltID +" on License having Id "+altId);
									isPreNeedsExist = true;									
								}
							}
						}
					}
				}
				if(!isPreNeedsExist){					
					var currentTime = new Date();
					var currentDate = currentTime.getDate();
					var currentMonth = (currentTime.getMonth()+1);
					var currentYearNew = currentTime.getFullYear();
					var isDateHigher = false;
					//check if its greater than July 21st
					if(currentMonth > 7) 
					{
						//ELPLogging.debug("currentMonth : "+currentMonth);
						isDateHigher = true;
					}else if(currentMonth == 7 && currentDate > 21){
						//ELPLogging.debug("currentMonth : "+currentMonth +" :: "+"currentDate : "+currentDate);
						isDateHigher = true;
					}
					if(isDateHigher){
						var childCap = createChildOne("Enforce", "Investigation", "Intake", "NA", "YES", capId);
						CWM_ELP_456_DPL_copyContact(childCap);
						CWM_ELP_456_DPL_copyContactsByTypeWithAddressandStartDate(capId, childCap,"Funeral Establishment", "Respondent Business", new Date());
						editAppSpecific("Business License #", altId, childCap);
						editAppSpecific("Trade/Profession", "Funeral Director", childCap);
						editAppSpecific("Type Class", "FE", childCap);
						editAppSpecific("Description of the Incident(s)", "Failure to Submit Pre-Needs Amendment for "+currentYearNew, childCap);
						editAppSpecific("Intake Method", "Board Request", childCap);
						editAppSpecific("Board", "Funeral Directors, Embalmers and Establishments", childCap);
						var vTempCapId = aa.cap.getCapID(childCap.getID1().toString(),childCap.getID2().toString(),childCap.getID3().toString()).getOutput();
						CWM_ELP_456_DPL_assignIIRToUser(vTempCapId);
						ELPLogging.debug("Investigation record created with ID: " + vTempCapId.getCustomID() +" for License " + altId);
						licenseProcessed++;
					}					
				}				
			}			
		}
		ELPLogging.debug("Licenses Processed: " + licenseProcessed);
	}
}
catch (ex)
{
   aa.print("exception caught: " + ex.message);

   //dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
   aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER); 
   aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_653_FORFEITURE_PENDING_EXAM" + ex.message);
   aa.print("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
   aa.print("EMSEReturnMessage: " + "Error executing SQL_BATCH_653_FORFEITURE_PENDING_EXAM. " + ex.message);
   
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}
finally 
{
	// close objects
	if (dataSet != null) {
		//dataSet.close();
	}
	if (pendingExamProcedure != null) {
		pendingExamProcedure.close();
	}
	if (databaseConnection != null) {
		databaseConnection.close();
	}
	
	if (!ELPLogging.isFatal()) 
	{
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		aa.print("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		//aa.print("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);
		
		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with " + ELPLogging.getErrorCount() + " errors.");
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with no errors.");
			logDebugAndEmail("EMSEReturnMessage: " + "SQL_BATCH_653_FORFEITURE_PENDING_EXAM completed with no errors.");					
		}
	}

	aa.print(ELPLogging.toString());
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
   var ret = "" + aa.env.getValue(pParamName);
   aa.print("PARAMETER " + pParamName + " = " + ret);
   return ret;
}

function logDebugAndEmail( debugText )
{
	emailText = emailText + debugText + br;
	aa.print(debugText);
}

function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

function getScriptText(vScriptName)
{
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),   vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

/**
 * @desc This method calculate the absolute date difference between two dates.
 * @param {date1,date2} - two JavaScript date objects
 * @returns {integer} - returns an integer value.
 */
function dateDifference(date1, date2) 
{
    var datediff = Math.abs(date1.getTime() - date2.getTime());
	
    return Math.ceil((datediff / (24 * 60 * 60 * 1000)));
}

function CWM_ELP_456_DPL_copyContactsByTypeWithAddressandStartDate(pFromCapId, pToCapId, pFromContactType, pToContactType, vStartDate)
{
   // Copies all contacts from pFromCapId to pToCapId
   // where type == pContactType
   if (pToCapId == null)
   var vToCapId = capId;
   else
   var vToCapId = pToCapId;
   var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
   var copied = 0;
   if (capContactResult.getSuccess())
   {
      var Contacts = capContactResult.getOutput();
      for (yy in Contacts)
      {
         if(Contacts[yy].getCapContactModel().getContactType() == pFromContactType)
         {
           var newContact = Contacts[yy].getCapContactModel();
			var newPeople = newContact.getPeople();
            var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
            newContact.setCapID(vToCapId);
			newContact.setStartDate(new Date(vStartDate));		
			newContact.setContactType(pToContactType);		
			newContact.setPrimaryFlag("N");			
            aa.people.createCapContact(newContact);
            var newerPeople = newContact.getPeople();
			//ELPLogging.debug("new contact");
			//update the branch number
			//ELPLogging.debug("adding branch #");
                        //var capContactTemplate = newContact.template;
			/* var asiTemplate = aa.genericTemplate.getTemplateStructureByGroupName("CT-TR-BOFLOC").getOutput();
            setTemplateValueByForm(asiTemplate, "BRANCH CERTIFCATE NUMBER", "Branch Certifcate Number", vSeqNum); */
            newContact.setTemplate(null);
			newContact.setPrimaryFlag("N");			
			aa.people.editCapContact(newContact);	

            // contact address copying
            if (addressList)
            {
               for (add in addressList)
               {
                  var transactionAddress = false;
                  contactAddressModel = addressList[add].getContactAddressModel();
                  if (contactAddressModel.getEntityType() == "CAP_CONTACT")
                  {
                     transactionAddress = true;
                     contactAddressModel.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                  }
                  // Commit if transaction contact address
                  if(transactionAddress)
                  {
                     var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
                     contactAddressModel.setContactAddressPK(newPK);
                     aa.address.createCapContactAddress(vToCapId, contactAddressModel);
                  }
                  // Commit if reference contact address
                  else
                  {
                     // build model
                     var Xref = aa.address.createXRefContactAddressModel().getOutput();
                     Xref.setContactAddressModel(contactAddressModel);
                     Xref.setAddressID(addressList[add].getAddressID());
                     Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                     Xref.setEntityType(contactAddressModel.getEntityType());
                     Xref.setCapID(vToCapId);
                     // commit address
                     aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
                  }
               }
               // end for
            }
            // end if
         }
	}
}

   else
   {
      ELPLogging.debug("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
      return false;
   }

   return copied;

}

function CWM_ELP_456_DPL_copyContact(childCap){
	
	//lookup the reference id of the hospital
	vHosRefId = lookup("Lookup:PreNeedsIIR","Funeral Directors, Embalmers and Establishments");
	//var contactType ="Affiliated Hospital (Organization)";
	var getResult = aa.people.getPeople(vHosRefId);
	if (getResult.getSuccess()) {
		var peopleObj = getResult.getOutput();
		// add the reference contact from the people object to the license record
		var contactNbr = addReferenceContactFromPeopleModel(peopleObj,childCap);
		var appContacts = aa.people.getCapContactByCapID(childCap).getOutput();

		for (c in appContacts) {
			var appContact = appContacts[c];
			//var licContact = licContacts[c];
			var licCapId = aa.cap.getCapID(childCap).getOutput();
		   var contactAddressScriptModel = aa.address.createContactAddressModel().getOutput();
				contactAddressScriptModel.setEntityID(parseInt(vHosRefId));
			var contactAddressModel = contactAddressScriptModel.getContactAddressModel();
			var contactAddressList = aa.address.getContactAddressList(contactAddressModel).getOutput();
			for (var g in contactAddressList){
				//logDebug(contactAddressList[g]);
			}				
			if (appContact.getPeople().getContactSeqNumber() == contactNbr) {
				// change the contact type of the newly added contact
				
				appContact.getPeople().setContactType("Complainant");
				var vRelDate = new Date()
				appContact.getPeople().setStartDate(vRelDate);

				var updateResult = aa.people.editCapContact(appContact.getCapContactModel());
				if (updateResult.getSuccess()) {
					//ELPLogging.debug("Contact " + contactNbr + " updated successfully");
				} else {
					ELPLogging.debug("Contact " + contactNbr + " update failed: " + updateResult.getErrorType() + ":" + updateResult.getErrorMessage());
				}

				// copy addresses
				 for (add in contactAddressList) {
					 //ELPLogging.debug("address found")
					 //only copy the first mailing address you find without an end date
					var transactionAddress = false;
					contactAddressModel = contactAddressList[add].getContactAddressModel();
					if(contactAddressModel.getAddressType()=="Mailing Address" && contactAddressModel.getExpirationDate()==null){
					
						if (contactAddressModel.getEntityType() == "CAP_CONTACT") {
							transactionAddress = true;
							contactAddressModel.setEntityID(parseInt(appContact.getPeople().getContactSeqNumber()));
						}
						// Commit if transaction contact address
						if (transactionAddress) {
							var newPK = new com.accela.orm.model.address.ContactAddressPKModel();
							contactAddressModel.setContactAddressPK(newPK);
							aa.address.createCapContactAddress(childCap, contactAddressModel);
						}
						// Commit if reference contact address
						else {
							// build model
							var Xref = aa.address.createXRefContactAddressModel().getOutput();
							Xref.setContactAddressModel(contactAddressModel);
							Xref.setAddressID(contactAddressList[add].getAddressID());
							Xref.setEntityID(parseInt(appContact.getPeople().getContactSeqNumber()));
							Xref.setEntityType(contactAddressModel.getEntityType());
							Xref.setCapID(childCap);
							// commit address
							aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
						}
						break;
					}
				} 
			   
			}
		}
	  
	} else {
		ELPLogging.debug("Can't find a reference contact number for this hospital" + getResult.getErrorType() + ":" + getResult.getErrorMessage());
	}
}

function CWM_ELP_456_DPL_assignIIRToUser(compCap){	
	var nextWfTask = "Triage";
    //var boardName = getBoardType(vParentCapID);
    //var boardCode = getBoard(vParentCapID);
    //ELPLogging.debug("The license altid is " + parentAltId + " with Board Name " + boardName + " and Board Code " + boardCode);
    var assignUser = lookup("IIR_TASK_ASSIGNMENT", "EM");
    //ELPLogging.debug(assignUser);
    //ELPLogging.debug("Assigning task " + nextWfTask + " to " + assignUser);
    
    if (assignUser != undefined && assignUser != null && assignUser != "") {
        var taskUserResult = aa.person.getUser(assignUser);
      
        if (taskUserResult.getSuccess()){
           taskUserObj = taskUserResult.getOutput();
        }
        var workflowResult = aa.workflow.getTasks(compCap);
        if (workflowResult.getSuccess())
        {
           var wfObj = workflowResult.getOutput();
        
           for (i in wfObj) {
              var fTask = wfObj[i];
              if (fTask.getTaskDescription().toUpperCase().equals("TRIAGE")) {
                 fTask.setAssignedUser(taskUserObj);
                 var taskItem = fTask.getTaskItem(); 
                 var adjustResult = aa.workflow.assignTask(taskItem);
                 //ELPLogging.debug("Assigned Workflow Task: " + "Review" + " to " + assignUser);
                 //ELPLogging.debug("Assigned Workflow Task: " + "Triage" + " to " + assignUser);
              }
           }
        }
    }
}

function getRecordsArray(emseParameters){
	var sql = 
			"select b.SERV_PROV_CODE, \
			b.B1_PER_ID1, \
			b.B1_PER_ID2, \
			b.B1_PER_ID3, \
			b.B1_PER_GROUP, \
			b.b1_per_type, \
			b.b1_per_sub_type, \
			b.b1_alt_id, \
			b.B1_APPL_STATUS as TASKSTATUS \
			from B1PERMIT b \
			where b.B1_PER_GROUP = 'License' \
			and b.B1_PER_TYPE = 'Funeral Directors' \
			and b.B1_PER_SUB_TYPE = 'Funeral Establishment' \
			and b.B1_PER_CATEGORY = 'License' \
			and b.B1_APPL_STATUS = 'Current'";
			aa.print(sql);

			var arr = doSQL(sql);
			return arr;
}

function doSQL(sql) {

	try {
		var array = [];
		var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
		var ds = initialContext.lookup("java:/AA");
		var conn = ds.getConnection();
		var sStmt = conn.prepareStatement(sql);

		if (sql.toUpperCase().indexOf("SELECT") == 0) {
			var rSet = sStmt.executeQuery();
			while (rSet.next()) {
				var obj = {};
				var md = rSet.getMetaData();
				var columns = md.getColumnCount();
				for (i = 1; i <= columns; i++) {
					obj[md.getColumnName(i)] = String(rSet.getString(md.getColumnName(i)));
				}
				obj.count = rSet.getRow();
				array.push(obj);
			}
			rSet.close();
			sStmt.close();
			conn.close();
			return array;
		}
	} catch (err) {
		aa.print(err.message);
	}
}

function ObjKeyRename(src, map) {
    var dst = {};
    // src --> dst
    for(var key in src){
        if(key in map)
            // rename key
            dst[map[key]] = src[key];
        else
            // same key
            dst[key] = src[key];
    }
    // clear src
    for(var key in src){
        delete src[key];
    }
    // dst --> src
    for(var key in dst){
        src[key] = dst[key];
    }
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	return ret;
}