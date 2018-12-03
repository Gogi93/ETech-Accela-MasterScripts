/* ------------------------------------------------------------------------------------------------------ /
| Program : SQL_BATCH_SUSPEND_REVOKE_LIC
| Trigger : Batch
| Client : Massachusetts
|
| Version 1.1 - Base Version. 6/1/2014 - Jim White - Accela Inc
|
| Updates reference license status based on changes to the ref. license and conditions
|
| Batch Requirements :
| - Run nightly to update licenses
/ ------------------------------------------------------------------------------------------------------ */

/*------------------------------------------------------------------------------------------------------/
| Set Required Environment Variables Value
/------------------------------------------------------------------------------------------------------*/

aa.env.setValue("CurrentUserID","ADMIN");
var debugText = "";
var batchJobName = "BATCH_SUSPEND_REVOKE_LIC";
var batchStartDate = new Date();
// System Date
var batchStartTime = batchStartDate.getTime();
var startTime = batchStartTime;
// Start timer

var maxSeconds = 60 * 30;

/*------------------------------------------------------------------------------------------------------/
| Log Globals and Add Includes
/------------------------------------------------------------------------------------------------------*/
var SCRIPT_VERSION = 3.0

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
		eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));
}
catch (ex)
{
   var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
   ELPLogging.fatal(returnException.toString());
   throw returnException;
}

function getScriptText(vScriptName)
{
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1) servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try
	{
		var emseScript = emseBiz.getScriptByPK(servProvCode,vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";
	}
	catch(err)
	{
		return "";
	}
}


var ToEmailAddress = lookup("BATCH_STATUS_EMAIL", "SUSPEND REVOKE"); // This email will be set by standard choice
if (ToEmailAddress == null || ToEmailAddress == "") 
	logDebug("Email not sent. Standard Choice BATCH_STATUS_EMAIL lookup failed or not found.");
	
var emailAddress2 = getParam("emailAddress"); // This will be secondary email (as CC) set by batch job parameter
if(emailAddress2 ==null || emailAddress2 == "" || emailAddress2 == "undefined")
 emailAddress2="";
 
var stagingConfigurationString = '{\
"connectionSC": "DB_CONNECTION_INFO",\
	"supplemental":   [{\
				"tag":"queryLicenseSpecialText",\
				"procedure":{\
					"name":"ELP_SP_SUSPEND_REVOKE_QUERY",\
					"resultSet":{"list":[\
													 {"source":"RESULT","name":"id1","parameterType":"OUT","property":"B1_PER_ID1","type":"STRING"},\
													 {"source":"RESULT","name":"id2","parameterType":"OUT","property":"B1_PER_ID2","type":"STRING"},\
													 {"source":"RESULT","name":"id3","parameterType":"OUT","property":"B1_PER_ID3","type":"STRING"},\
													 {"source":"RESULT","name":"customID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
					"parameters":{"list":[\
													 {"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
	}';


var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);
var jsDate = new Date();
var capCount = 0;
/*------------------------------------------------------------------------------------------------------/
| Execute Script
/------------------------------------------------------------------------------------------------------*/

logDebugAndEmail("Start of Job");

try 
{
	mainProcess();
	logDebugAndEmail("JOB COMPLETED SUCCESSFULLY");
} 
catch (err) 
{
	logDebugAndEmail("BATCH JOB COMPLETED WITH FOLLOWING ERRORS:" + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	logDebug("BATCH JOB COMPLETED WITH FOLLOWING ERRORS: " + err.message + " In " + batchJobName + " Line " + err.lineNumber);
	aa.print("JOB RAN WITH ERRORS: " + err.message + " In " + "SQL_BATCH_SUSPEND_REVOKE_LIC" + " Line " + err.lineNumber);
	logDebug("Stack: " + err.stack);
}
logDebugAndEmail("End of Job: Elapsed Time : " + elapsed() + " Seconds");
if (ToEmailAddress != null || ToEmailAddress != "") 
	aa.sendMail(sysFromEmail, ToEmailAddress, emailAddress2, "Result: " + "SQL_BATCH_SUSPEND_REVOKE_LIC" , debugText);


function mainProcess() 
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
		var licenseSpecialTextlProcedure = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++ )
		{
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryLicenseSpecialText")
			{
				 var licenseSpecialTextlProcedure = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (licenseSpecialTextlProcedure == null)
		{
			var message = "Cannot find procedure queryLicenseSpecialText";
			var exception = new Error(message);
			throw exception;
		}
		ELPLogging.debug("Found queryLicenseSpecialText: " + supplementalConfiguration.procedure.name);

		/* *
		* The ECB Violation procedure returns a ResultSet of ECB Violations
		*/
		var staticParameters = {} ;
		var dynamicParameters = {} ;
		var batchApplicationResult = {};
		licenseSpecialTextlProcedure.prepareStatement();
		var inputParameters = licenseSpecialTextlProcedure.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};
		licenseSpecialTextlProcedure.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		licenseSpecialTextlProcedure.setParameters(inputParameters);

		//var dataSet = licenseSpecialTextlProcedure.queryProcedure();

		//for each license record, get the reference LP Object and add to array
		var licArr = new Array();
		var licNumArr = new Array();		

		var dataSet = getRecordsArray(emseParameters);
		if (dataSet != false || dataSet.length > 0) 
			for (var i in dataSet) {
				ObjKeyRename(dataSet[i], {"B1_PER_ID1":"id1"});
				ObjKeyRename(dataSet[i], {"B1_PER_ID2":"id2"});
				ObjKeyRename(dataSet[i], {"B1_PER_ID3":"id3"});
				ObjKeyRename(dataSet[i], {"B1_ALT_ID":"customID"});
				var queryResult = dataSet[i];
		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()){
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			aa.print(queryResult.id1 + "-" + queryResult.id2 + "-" + queryResult.id3 +  " (" + queryResult.customID + ")" );
			capIdResult = aa.cap.getCapID(queryResult.customID);
			if ( ! capIdResult.getSuccess())
			{
				ELPLogging.debug("getCapID error: " + capIdResult.getErrorMessage());
				continue;
			}
			
			var licCapID = capIdResult.getOutput();
			licCapID = aa.cap.getCapID(licCapID.ID1, licCapID.ID2, licCapID.ID3).getOutput();

			var capResult = aa.cap.getCap(licCapID);
			if ( ! capResult.getSuccess())
			{
				ELPLogging.debug("getCap error: " + capResult.getErrorMessage());
				continue;
			}
			
			var cap = capResult.getOutput();
			var licenseAltID = licCapID.getCustomID();
			var capStatus = cap.getCapStatus();
			var appTypeResult = cap.getCapType();
			var appTypeString = appTypeResult.toString();
			var appTypeArray = appTypeString.split("/");
			var board = appTypeArray[1];
			capCount++;
			
			// Get Reference LP
			var refLP = getRefLicenseProf(licenseAltID);
			if (!refLP)
			{
				aa.print("Associated Ref LP not found for License:  " + licenseAltID +".Trying once agian with Licence Number and Type");
				refLP = getRefLicenseProfWithLicNbrAndTypeClass(licenseAltID);
				if(!refLP){
					aa.print("Associated Ref LP not found for License:  " + licenseAltID );
					continue;
				}
			}

			var refLPLicenseSeqNum2 = refLP.getLicSeqNbr();

			//aa.print("Processing: " + licenseAltID);
			var profArr = getLicenseProfessional(licCapID);

			for (y in profArr)
			{
				var thisLP = profArr[y];
				var refLPLicenseSeqNum1 = thisLP.getLicenseProfessionalModel().getLicSeqNbr();
				if (inArray(licNumArr,licenseAltID) == false && refLPLicenseSeqNum1 == refLPLicenseSeqNum2)
				{
					licArr.push(refLP);
					licNumArr.push(licenseAltID);
					aa.print("Recording: " + thisLP.getLicenseNbr());
				}
				else
				{
					aa.print("Dropping license duplicate/mismatch: " + thisLP.getLicenseNbr());
				}
			}
		} // END OF RESULT SET LOOP

		logDebugAndEmail("Total Number of Reference Licenses To Be Processed:" + licArr.length);

//Loop through the licenses and apply business rules
for (var xxLic in licArr)
{
	capId = null;
	var suspend=false;
	var revoke=false;
	var alreadyRevoked=false;
	var alreadySuspended=false;
	var stay=false;
	var count = 0;
	var probation = false;
	var dor = false;
	var reinstateS=false;
	var reinstateR=false;
	var jsExpDate = new Date(1900,0,1);
	var jsRenewDate = new Date();
	var jsInactiveDate = new Date();
	var licensestatus;
	var SuspensionFound = false;
	var RevocationFound = false;
	var ProbationFound = false;
	var StayedSuspensionFound = false;
	var VoluntaryFound = false;
	var RestitutionFound = false;
	var  SupervisionFound = false;
	var OtherFound = false;

	var vAltID = licNumArr[xxLic];
	var y = licArr[xxLic];
	if(y == null)
		continue;

	capId = aa.cap.getCapID(vAltID).getOutput();
	aa.print(capId);
	if (!capId)
		continue;
	capModel = aa.cap.getCap(capId).getOutput();
	aa.print(capModel);

	var ActiveConditions = y.getInsuranceCo();

	var peopleattribute = null;
	try
	{
		peopleattribute = licArr[xxLic].peopleAttributeScriptModels;
	}
	catch(err)
	{
		peopleattribute = null;
	}

	var PriorDiscipline = "";
	if(peopleattribute != null && peopleattribute.length > 0)
	{
		//aa.print(" The People Attribute:" + peopleattribute);

		for (var J in peopleattribute)
		{
			var a = peopleattribute[J];
			if (a.attributeName != "PRIOR DISCIPLINE" &&  a.attributeName != "OTHER DISCIPLINE")
			{
				aa.print("The prior discipline attribute not found");
				continue;
			}
			if (!a.getAttributeValue())
				continue;
			PriorDiscipline = a.getAttributeValue();
			if (PriorDiscipline == null)
				PriorDiscipline = "";
		}
	}

	aa.print("License:" + y.getStateLicense());

	//get Expiration Date and other related dates
	var expDate = y.getLicenseExpirationDate();
	if (expDate)
		jsExpDate = new Date(expDate.getMonth() + "/" + expDate.getDayOfMonth()+ "/" + expDate.getYear());
	jsRenewDate = new Date(jsExpDate.toString());

	//Set Values below to match agency policy
	jsRenewDate.setDate(jsRenewDate.getDate() - 90);
	jsInactiveDate = getInactiveDateBasedOnRenewalCycle(capModel, jsExpDate);
	aa.print("  License Expiration Date: " + jsExpDate + " Renewal Date: " + jsRenewDate + "; Inactive Date: " + jsInactiveDate);
	aa.print(y.getLicSeqNbr());

	//Get Conditions on the license
	condArr = aa.caeCondition.getCAEConditions(y.getLicSeqNbr()).getOutput();
	aa.print(condArr.length);

	for (c in condArr)
	{
		var condExpired = false;
		var condExpDate = condArr[c].getExpireDate();
		//aa.print(condExpDate);
		if (condExpDate)
		{
			var jsCondExpDate = new Date(condExpDate.getMonth() + "/" + condExpDate.getDayOfMonth()+ "/" + condExpDate.getYear());
			if (jsCondExpDate <= jsDate)
			{
				condExpired = true;
			}
		}
		aa.print(" " + condArr[c].getConditionDescription() + " " + condArr[c].getConditionStatusType() + " Expired? " + condExpired );

		if(condArr[c].getConditionDescription() == "Suspension Condition")
			SuspensionFound= true;
		if(condArr[c].getConditionDescription() == "Revocation Condition")
			RevocationFound= true;
		if(condArr[c].getConditionDescription() == "Probation Condition")
			ProbationFound= true;
		if(condArr[c].getConditionDescription() == "Stayed Suspension Condition")
			StayedSuspensionFound= true;
		if(condArr[c].getConditionDescription() == "Voluntary Surrender Condition")
			VoluntaryFound= true;
		if(condArr[c].getConditionDescription() == "Restitution Condition")
			RestitutionFound= true;
		if(condArr[c].getConditionDescription() == "Supervision Condition")
			SupervisionFound= true;
		//removed for defect 3748
/* 		if(condArr[c].getConditionDescription() == "Other Terms Condition")
			OtherFound= true; */

		//Check Suspension Condition
		// Line 286 to Line to Line 438 is the code to check if COndition is NOt expired and is in APPLIED status on Ref license and if Yes, write the Condition name to CURRENT DISCIPLNE field
		// This applies for all 8 conditions
		if (!condExpired && condArr[c].getConditionDescription() == "Suspension Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			suspend = true;
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Suspended";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Suspended")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Suspended";
				}
			
		      }
		  }

		//Check Revocation Condition
		if (!condExpired && condArr[c].getConditionDescription() == "Revocation Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			revoke = true;
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Revoked";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Revoked")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Revoked";
				}
			
		      }
		}

		//Check Stay of Enforcement
		if (!condExpired && condArr[c].getConditionDescription() == "Stay of Enforcement Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
			stay = true;

		//Check License Suspended
		if (!condExpired && condArr[c].getConditionDescription() == "Stayed Suspension Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			//Sagar : Fix EPLACE-578 - for DPL_PROD_RE/RA_Tammy DiMarzio - 9031016-Re-S
			//alreadySuspended = true;
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Stayed Suspension";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Stayed Suspension")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Stayed Suspension";
				}
			
		      }
		}

		//Check License Probation
		if (!condExpired && condArr[c].getConditionDescription() == "Probation Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			probation = true;
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Probation";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Probation")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Probation";
				}
			
		      }
		}

		//Check License DOR Condition
		// if (!condExpired && condArr[c].getConditionDescription() == "Right to Renew Stayed by DOR" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied")) dor = true;
		//Check Voluntary Surrender
		if (!condExpired && condArr[c].getConditionDescription() == "Voluntary Surrender Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Voluntary Surrender";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Voluntary Surrender")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Voluntary Surrender";
				}
			
		      }
		}
//removed for defect 3748
/* 		// For defect 1855 current discipline was not being set on  "Other Terms Condition" and "Restitution Condition"
		if (!condExpired && condArr[c].getConditionDescription() == "Other Terms Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Other Terms";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Other Terms")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Other Terms";
				}
			
		      }
		} */

		if (!condExpired && condArr[c].getConditionDescription() == "Restitution Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Restitution";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Restitution")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Restitution";
				}
			
		      }
		}

		if (!condExpired && condArr[c].getConditionDescription() == "Supervision Condition" && (condArr[c].getConditionStatusType() == "Applied" || condArr[c].getConditionStatus() == "Applied"))
		{
			if(ActiveConditions == null || ActiveConditions == "")
			{
				ActiveConditions = "Supervision";
			}
			else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Supervision")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Supervision";
				}
			
		      }
		}

		// Line 443 to Line 1102 indicates code to check id consition is expired or in UNAPPLIED status then remove the Condition from Current discipline and add it to Prior Disciplne field.
		// This applies to all 8 conditions.
		var PriorDisciplineArray = false;
		if ((condExpired && condArr[c].getConditionDescription() == "Suspension Condition")	||
		    (condArr[c].getConditionDescription() == "Suspension Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			aa.print("type:"+condArr[c].getConditionStatusType());
			aa.print("status:"+condArr[c].getConditionStatus());
			reinstateS = true;
			// Removing the "Suspended" value from "Discipline History" field

			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Suspended");
			}

			// Adding the Suspended value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Suspended";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Suspended")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Suspended";
				}
			}
		}

		//If Condition is expired remove the Revocation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Revocation Condition" && condArr[c].getConditionStatus() != "Satisfied") ||
		   (condArr[c].getConditionDescription() == "Revocation Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			reinstateR = true;

			// Removing the "Revoked" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Revoked");
			}

			// Adding the Revoked value to "Prior Discipline" field.
		if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Revoked";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Revoked")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Revoked";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Probation Condition") ||
		   (condArr[c].getConditionDescription() == "Probation Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Probation" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Probation");

			}

			// Adding the Probation value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Probation";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Probation")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Probation";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Stayed Suspension Condition") ||
		   (condArr[c].getConditionDescription() == "Stayed Suspension Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Stayed Suspension" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Stayed Suspension");
			}

			// Adding the Stayed Suspension value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Stayed Suspension";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Stayed Suspension")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Stayed Suspension";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Voluntary Surrender Condition") ||
		   (condArr[c].getConditionDescription() == "Voluntary Surrender Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Voluntary Surrender" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Voluntary Surrender");
			}

			// Adding the Voluntary Surrender value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Voluntary Surrender";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Voluntary Surrender")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Voluntary Surrender";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Restitution Condition") ||
		   (condArr[c].getConditionDescription() == "Restitution Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Restitution" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Restitution");
			}

			// Adding the Restitution value to "Prior Discipline" field.
	       if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Restitution";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Restitution")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Restitution";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
		if ((condExpired && condArr[c].getConditionDescription() == "Supervision Condition") ||
		   (condArr[c].getConditionDescription() == "Supervision Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Supervision" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Supervision");

			}

			// Adding the Supervision value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Supervision";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Supervision")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Supervision";
				}
			}
		}

		//If Condition is expired remove the Probation Condition.
/* 		if ((condExpired && condArr[c].getConditionDescription() == "Other Terms Condition") ||
		   (condArr[c].getConditionDescription() == "Other Terms Condition" &&
		    (condArr[c].getConditionStatusType() != "Applied" &&
		    condArr[c].getConditionStatus() != "Applied")))
		{
			// Removing the "Other Terms" value from "Discipline History" field
			if(ActiveConditions == null)
			{
				ActiveConditions = "";
			}
			else
			{
				ActiveConditions = removeCsvVal(ActiveConditions, "Other Terms");
			}

			// Adding the Other Terms value to "Prior Discipline" field.
			if((PriorDiscipline == null) || (PriorDiscipline == ""))
			{
				PriorDiscipline = "Other Terms";
			}
			else
			{
				vFound = false;
				PriorDisciplineArray = PriorDiscipline.split(",");
				for (var arrayvalue in PriorDisciplineArray)
				{
					aa.print(PriorDisciplineArray[arrayvalue]);
					if (PriorDisciplineArray[arrayvalue] == "Other Terms")
						vFound = true;
				}
				if(!vFound)
				{
					PriorDiscipline += ",Other Terms";
				}
			}
		} */
	} //end condition check loop

	aa.print(suspend);
	aa.print(revoke);
	aa.print(stay);
	aa.print(alreadySuspended);
	aa.print(alreadyRevoked);

	//update status if already suspended
	if (alreadySuspended)
	{
	
		if (suspend)
		{
			suspend=false;
			updateLicenseStdCondition(y.getLicSeqNbr(),"Compliance","Suspension Condition","Satisfied",null);
		}
	}

	//update status if already revoked
	if (alreadyRevoked)
	{
		if (!revoke)
			reinstateR = true;
		if (revoke)
			revoke = false;
	}

	//update status if a stay was found
	if (stay)
	{
		if(ActiveConditions == null || ActiveConditions == "")
		{
			ActiveConditions = "Stay Of Enforcement";
		}
		else
             {

				zFound = false;
				ActiveConditionsArray = ActiveConditions.split(",");
				for (var arrayvalue in ActiveConditionsArray)
				{
					//aa.print(PriorDisciplineArray[arrayvalue]);
					if (ActiveConditionsArray[arrayvalue] == "Stay Of Enforcement")
						zFound = true;
				}

				if(!zFound)
				{
					ActiveConditions += ",Stay Of Enforcement";
				}
			
		      }
		suspend = false;
		revoke = false;
	}

	//update status if a probation was found
	if (probation)
	{
		if (suspend)
			suspend = true;
		if (revoke)
			revoke = true;
	}

	aa.print(ActiveConditions);
	y.setInsuranceCo(ActiveConditions);
	if(ActiveConditions != null && ActiveConditions.length > 65) {
	y.setInsuranceCo("Please contact the board for details");
	}
	
	//removed as part of defect 3992
/* 	if (ActiveConditions == null || ActiveConditions == "")
		y.setWcExempt("Y");
	else
		y.setWcExempt("N"); */
	
	//Begin Business Rules for Suspend/Revoke
	//Perform the business rules for Suspension
	if (suspend)
	{
		aa.print("  ### Suspending License ###" + y.getStateLicense());
		//Update Transaction License
		if (!(revoke || alreadyRevoked))
		{
			var typeArr = aa.cap.getCap(capId).getOutput().getCapType().toString().split("/");
			var licType = typeArr[2];
			capModel.setCapStatus("Suspended");
			
			var licenseTaskStatus = getTaskStatus(capId);
			if(licenseTaskStatus != "Suspended")
			{
				updateTask("License","Suspended","Suspended by Automation","");
			}

			//Send Correspondence

			//Perform an Inspection

			//Do other stuff

		}
	} // end suspend

	//Reinstate from Suspension
	//Fix for 8674 - Do not reinstate the license if there is at least one active suspension condition.
	if (reinstateS && !suspend)
	{
		aa.print("  ### Reinstating License from Suspension ###" + y.getStateLicense());
		//Edit the Condition
		updateLicenseStdCondition(y.getLicSeqNbr(),"Compliance","Suspension Condition","Satisfied",null);
		//Update the transaction license
		if (!(revoke || alreadyRevoked))
		{
			//Check for surrender
			var TLStatus = aa.cap.getCap(capId).getOutput().getCapStatus();
			var licenseTaskStatus = getTaskStatus(capId);
			
			if (TLStatus != "Voluntary Surrender")
			{
				// Return to good standing
				capModel.setCapStatus("Current");

				//Set the Reference License active if needed
				if (jsDate < jsExpDate)
				{
					y.setAuditStatus("A");
					y.setWcExempt("Y");
					y.setAuditDate(sysDate);
					y.setAuditID("ADMIN");
				}
				
				//Set ready for renewal if needed
				if (jsDate > jsRenewDate && jsDate < jsExpDate)
				{
					capModel.setCapStatus("Current");
					//updateTask("License","About to Expire","Reinstated from Suspension by Automation","");
					if (TLStatus != "Current")
					{
						updateTask("License","Current","Reinstated from Suspension by Automation","");
					}	
				}
				else if (jsDate >= jsExpDate && jsDate < jsInactiveDate)
				{
					//Set expired renewal if needed
					capModel.setCapStatus("Expired");
					
					//var licenseTaskStatus = getTaskStatus(capId);
					if(licenseTaskStatus != "Lapsed")
					{
						updateTask("License","Lapsed","Reinstated from Suspension by Automation","");
					}
				}
				else if (jsDate >= jsInactiveDate)
				{
					//Set inactive if needed
					capModel.setCapStatus("Expired");
					//var licenseTaskStatus = getTaskStatus(capId);
					if(licenseTaskStatus != "Expired")
					{
						updateTask("License","Expired","Reinstated from Suspension by Automation","");
					}
				}
				else
				{
					if (TLStatus != "Current")
					{
						updateTask("License","Current","Reinstated from Suspension by Automation","");
					}
				}
				//added for defect 9238
				aa.print(ActiveConditions);
				y.setInsuranceCo(ActiveConditions);
			}
		}
	} //end reinstate

	//License revocation
	if (revoke)
	{
		aa.print("  ### Revoking License ###" + y.getStateLicense());

		//Set the Reference License inactive
		//Update Transaction License
		aa.print("  Found CAP: " + capId);

		capModel.setCapStatus("Revoked");
		
		var licenseTaskStatus = getTaskStatus(capId);
		if(licenseTaskStatus != "Revoked")
		{
			updateTask("License","Revoked","Revoked by Automation","");
		}

		//Send Correspondence

		//Schedule Inspection

		//Do other stuff

	} //end revoke

	//Reinstate from Revoke
	if (reinstateR)
	{
		aa.print("  ### Reinstating License from Revocation ###" + y.getStateLicense());
		//Edit the Condition
		//updateLicenseStdCondition(licArr[xxLic].getLicSeqNbr(),"Compliance","Revocation Condition","Satisfied",null);
		updateLicenseStdCondition(licArr[xxLic].getLicSeqNbr(),"Compliance","Revocation Condition","Satisfied");
		//Update the transaction license
		if (!(suspend || alreadySuspended))
		{
			//Check for surrender
			var TLStatus = aa.cap.getCap(capId).getOutput().getCapStatus();
			var licenseTaskStatus = getTaskStatus(capId);
			
			if (TLStatus != "Voluntary Surrender")
			{
				//Set the Reference License active if needed
				if (jsDate < jsExpDate)
				{
					y.setAuditStatus("A");
					y.setAuditDate(sysDate);
					y.setWcExempt("Y");
					y.setAuditID("ADMIN");
				}
				// Return to good standing
				aa.print ("Return to good: " + licArr[xxLic].getStateLicense());
				
				capModel.setCapStatus("Current");
				
				//Set ready for renewal if needed
				if (jsDate > jsRenewDate && jsDate < jsExpDate)
				{
					capModel.setCapStatus("Current");
					//updateTask("License","About to Expire","Reinstated  from Revocation by Automation","");
					if (TLStatus != "Current")
					{
						updateTask("License","Current","Reinstated from Revocation by Automation","");
					}
				}
				else if (jsDate >= jsExpDate && jsDate < jsInactiveDate)
				{
					//Set expired renewal if needed
					//Set to expire if already lapsed once, else set to lapsed.
					var workflowhistory = aa.workflow.getWorkflowHistory(capId, null);
					if (workflowhistory.getSuccess())
						var workflowhistoryresult = workflowhistory.getOutput();
					for (i in workflowhistoryresult)
					{
						var fTask = workflowhistoryresult[i];
						if (fTask.getTaskDescription() == "Lapsed");
							count++;
					}
					if(count>0)
						capModel.setCapStatus("Expired");
					else
						capModel.setCapStatus("Expired");
						
					//var licenseTaskStatus = getTaskStatus(capId);
					if(licenseTaskStatus != "Lapsed")
					{
						updateTask("License","Lapsed","Reinstated from Revocation by Automation","");
					}
				}
				else if (jsDate >= jsInactiveDate)
				{
					//Set inactive if needed
					capModel.setCapStatus("Expired");
					//var licenseTaskStatus = getTaskStatus(capId);
					if(licenseTaskStatus != "Expired")
					{
						updateTask("License","Expired","Reinstated from Revocation by Automation","");
					}
				}
				else
				{
					if (TLStatus != "Current")
					{
						updateTask("License","Current","Reinstated from Revocation by Automation","");
					}
				}	
			}
		}
		else
		{
			// the license is reinstated, but still suspended
			aa.print("### Reinstating from Revoke to Suspend ###");
			//Check for surrender
			var TLStatus = aa.cap.getCap(capId).getOutput().getCapStatus();
			if (TLStatus != "Voluntary Surrender")
			{
				//Set the Reference License active if needed
				if (jsDate < jsExpDate)
				{
					y.setAuditStatus("A");
					y.setWcExempt("N");
					y.setAuditDate(sysDate);
					y.setAuditID("ADMIN");
				}

				// Return to good standing, but suspended
				capModel.setCapStatus("Suspended");
				
				var licenseTaskStatus = getTaskStatus(capId);
				if(licenseTaskStatus != "Suspended")
				{
					updateTask("License","Suspended","Suspended after Revocation by Automation","");
				}
			}
		}
	} //end reinstate
	aa.print("End Processing License:" + y.getStateLicense());

	// From Line 1420 to Line 1828 addresses the requirement to remove the Condition from "Prior Discipline" field if condition is deleted from Refrence License.
	// This applies to all 8 conditions.

	if (PriorDiscipline && PriorDiscipline != "")
	{
		aa.print(PriorDiscipline);
		var PriorDisciplineArray = PriorDiscipline.split(",");
		var ProbFound = false;
		var RevokFound = false;
		var StaySuspedFound = false;
		var VoluntFound = false;
		var RestFound = false;
		var SuperFound = false;
		var OthFound = false;
		var SuspendFound = false;

		for ( var arrayvalue in PriorDisciplineArray)
		{
			aa.print(PriorDisciplineArray[arrayvalue]);
			if (PriorDisciplineArray[arrayvalue] == "Probation")
				ProbFound = true;
			if (PriorDisciplineArray[arrayvalue] == "Revoked")
				RevokFound = true;
			if (PriorDisciplineArray[arrayvalue] == "Stayed Suspension")
				StaySuspedFound = true;
			if (PriorDisciplineArray[arrayvalue] == "Voluntary Surrender")
				VoluntFound = true;
			if (PriorDisciplineArray[arrayvalue] == "Restitution")
				RestFound = true;
			if (PriorDisciplineArray[arrayvalue] == "Supervision")
				SuperFound = true;
/* 			if (PriorDisciplineArray[arrayvalue] == "Other Terms")
				OthFound = true; */
			if (PriorDisciplineArray[arrayvalue] == "Suspended")
				SuspendFound = true;
		}

/*
//removed this code for defect 3113 as it was causing issues with converted data that did not have matching conditions.
 		if (ProbationFound == false && ProbFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Probation");

		if (RevocationFound == false && RevokFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Revoked");

		if (StayedSuspensionFound == false && StaySuspedFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Stayed Suspension");

		if (VoluntaryFound == false && VoluntFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Voluntary Surrender");

		if (RestitutionFound == false && RestFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Restitution");

		if (SupervisionFound == false && SuperFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Supervision");

		//if (OtherFound == false && OthFound)
		//	PriorDiscipline = removeCsvVal(PriorDiscipline, "Other Terms"); 

		if (SuspensionFound == false && SuspendFound)
			PriorDiscipline = removeCsvVal(PriorDiscipline, "Suspended"); */

		if (PriorDiscipline == null)
			PriorDiscipline = "";
	}

	if(peopleattribute != null && peopleattribute.length > 0)
	{
		for (var J in peopleattribute)
		{
			var a = peopleattribute[J];
			if (a.attributeName != "PRIOR DISCIPLINE" && a.attributeName != "OTHER DISCIPLINE")
				continue;

			if(PriorDiscipline != null && PriorDiscipline.length > 200){
				PriorDiscipline = "Please contact the board for details";
			}
			a.setAttributeValue(PriorDiscipline);
			peopleattribute[J] = a;
		}

		y.setAttributes(peopleattribute);
	}

	var licensestatus = capModel.getCapStatus();
	aa.print(licensestatus);
	//added if condition to make the LP active or inactive based on the license status as part of defect 3992
	y.setPolicy(licensestatus);
	if(licensestatus != "Current"){
		y.setWcExempt("N");
	}
	else {
		y.setWcExempt("Y");
	}
	aa.cap.editCapByPK(capModel.getCapModel());
var myResult = aa.licenseScript.editRefLicenseProf(y);
if (myResult.getSuccess()) {
		logDebug("Successfully updated License No. " + y.getStateLicense() + ", License Board: " + y.getLicenseBoard() + ", Type: " + y.getLicenseType());
	//	logMessage("Successfully added/updated License No. " + newLic.getStateLicense() + ", License Board: " + newLic.getLicenseBoard() + ", Type: " + newLic.getLicenseType());
		//return true;
	} else {
		logDebug("**ERROR: can't edit ref lic prof: " + myResult.getErrorMessage());
	//	logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		//return false;
	}
	// Add Transaction License to SET ID "SYNCSET"
			//Add license to set
		//	addTransLictoSet(capId);

		 addToLicenseSyncSet4Batch(capId);
}
}
 
} // END OF MAIN PROCESS

/*------------------------------------------------------------------------------------------------------/
| UTILITY FUNCTIONS
/------------------------------------------------------------------------------------------------------*/

function removeCsvVal(source, toRemove)              //source is a string of comma-separated values,
{                                                    //toRemove is the CSV to remove all instances of
	var sourceArr = source.split(",");               //Split the CSV's by commas
	var toReturn  = "";                              //Declare the new string we're going to create
	for (var i = 0; i < sourceArr.length; i++)       //Check all of the elements in the array
	{
		if (sourceArr[i] != toRemove)                //If the item is not equal
			toReturn += sourceArr[i] + ",";          //add it to the return string
	}
	return toReturn.substr(0, toReturn.length - 1);  //remove trailing comma
}


function logDebugAndEmail(debugText1)
{
	debugText = debugText + debugText1 + br;
	ELPLogging.debug(debugText);
}


function elapsed()
{
   var thisDate = new Date();
   var thisTime = thisDate.getTime();
   return ((thisTime - batchStartTime) / 1000)
}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
   var ret = "" + aa.env.getValue(pParamName);
   logDebug("PARAMETER " + pParamName + " = " + ret);
   return ret;
}

function getInactiveDateBasedOnRenewalCycle(pCap, pExpirationDate)
{
	var appTypeResult = pCap.getCapType();
	var appTypeString = appTypeResult.toString();
	var appTypeArray = appTypeString.split("/");
	var board = appTypeArray[1];
	
	var renewalCycleInDays = lookup("BOARD_RENEWAL_CYCLE", board);
	
	//Set default renewal cycle to 1 year
	if(!renewalCycleInDays || isNaN(renewalCycleInDays))
		renewalCycleInDays = 365;
	else 
		renewalCycleInDays = parseInt(renewalCycleInDays);
		
	aa.print("Renewal Cycle Days for board " + board + " = " + renewalCycleInDays );		
		
	var inactiveDate = new Date(pExpirationDate.toString());
	inactiveDate.setDate(inactiveDate.getDate() + renewalCycleInDays);
	
	return inactiveDate;	
}

function updateLicenseStdCondition(licSeqNbr,type,desc,newStatus)
{
	var statusType = "Applied";
	if (arguments.length > 4)
	{
		statusType = arguments[4];
	}
	condArr = aa.caeCondition.getCAEConditions(licSeqNbr).getOutput();
	for (c in condArr)
	{
		if (condArr[c].getConditionDescription() == desc && condArr[c].getConditionType()== type)
		{
			condArr[c].setConditionStatus(newStatus);
			condArr[c].setConditionStatusType(statusType);
			aa.caeCondition.editCAECondition(condArr[c]);
		}
	}
}

function inArray(arr, obj)
{
	var inArr = false;
	for (x in arr)
	{
		if (matches(arr[x],obj))
		{
			inArr=true;
		}
	}
	return inArr;
}

function addLicenseStdConditionSR(licSeqNum, cType, cDesc, shortDesc)
{
	var foundCondition = false;
	eDate = null;
	var cStatus = "Applied";
	var cStatusType = "Applied";
	if (arguments.length > 5)
		cStatus = arguments[5];
	// use condition status in args
	if (arguments.length > 6)
		cStatusType = arguments[6];
	// use consition status type (Applied or Not Applied) in args

	if (!aa.capCondition.getStandardConditions)
	{
		logDebug("addLicenseStdCondition function is not available in this version of Accela Automation.");
	}
	else
	{
		standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
		for (i = 0; i < standardConditions.length; i ++)
		{
			if (standardConditions[i].getConditionType().toUpperCase() == cType.toUpperCase() && standardConditions[i].getConditionDesc().toUpperCase() == cDesc.toUpperCase()) // EMSE Dom function does like search, needed for exact match
			{
				standardCondition = standardConditions[i];
				// add the last one found

				foundCondition = true;

				if (!licSeqNum) // add to all reference licenses on the current capId
				{
					var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
					if (capLicenseResult.getSuccess())
					{
						var refLicArr = capLicenseResult.getOutput();
					}
					else
					{
						logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage());
						return false;
					}

					for (var refLic in refLicArr)
					{
						if (refLicArr[refLic].getLicenseProfessionalModel().getLicSeqNbr())
						{
							var licSeq = refLicArr[refLic].getLicenseProfessionalModel().getLicSeqNbr();
							var addCAEResult = aa.caeCondition.addCAECondition(licSeq, standardCondition.getConditionType(), standardCondition.getConditionDesc(), shortDesc, null, null, standardCondition.getImpactCode(), cStatus, sysDate, eDate, sysDate, sysDate, systemUserObj, systemUserObj);

							if (addCAEResult.getSuccess())
							{
								logDebug("Successfully added licensed professional (" + licSeq + ") condition: " + cDesc);
								var ConditionIDNum = addCAEResult.getOutput();
								var newCAECond = aa.caeCondition.getCAECondition(ConditionIDNum, licSeq).getOutput();
								newCAECond.setConditionStatusType(cStatusType);
								aa.caeCondition.editCAECondition(newCAECond);
							}
							else
							{
								logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition: " + addCAEResult.getErrorMessage());
							}
						}
					}
				}
				else
				{
					var addCAEResult = aa.caeCondition.addCAECondition(licSeqNum, standardCondition.getConditionType(), standardCondition.getConditionDesc(), shortDesc, null, null, standardCondition.getImpactCode(), cStatus, sysDate, eDate, sysDate, sysDate, systemUserObj, systemUserObj);

					if (addCAEResult.getSuccess())
					{
						logDebug("Successfully added licensed professional (" + licSeqNum + ") condition: " + cDesc);
						var ConditionIDNum = addCAEResult.getOutput();

						var newCAECond = aa.caeCondition.getCAECondition(ConditionIDNum, licSeqNum).getOutput();
						newCAECond.setConditionStatusType(cStatusType);
						aa.caeCondition.editCAECondition(newCAECond);
					}
					else
					{
						logDebug( "**ERROR: adding licensed professional (" + licSeqNum + ") condition: " + addCAEResult.getErrorMessage());
					}
				}
			}
		}
	}
	if (!foundCondition)
		logDebug( "**WARNING: couldn't find standard condition for " + cType + " / " + cDesc);
}

function getTaskStatus(capId)
{
	var licenseTaskStatus = "";
	var wfTaskResult = aa.workflow.getTasks(capId);
	//var taskArray = "";

	if (wfTaskResult.getSuccess()) 
	{
		wfTaskResult = wfTaskResult.getOutput();
		if(wfTaskResult[0].getTaskDescription() == "License")
		{
			licenseTaskStatus = wfTaskResult[0].getDisposition();
		}
	}
	return(licenseTaskStatus);
}

function addToLicenseSyncSet4Batch(addToSetCapId) {
	var setCap = aa.cap.getCap(addToSetCapId).getOutput();

	var setName = lookup("Lookup:LicenseSync", "SET_NAME");

	if (matches(setName, null, "", undefined)) setName = "SYNCSET";

	var setExists = false;
	var setGetResult = aa.set.getSetByPK(setName);
	if (setGetResult.getSuccess()) setExists = true;

	if (!setExists) {
			//logDebug("Set doesn't exists.");
			setDescription = setName;
			setType = "License Sync";
			setStatus = "Pending";
			setExists = createSet(setName, setDescription, setType, setStatus);
	}

	if (setExists) {
		 // logDebug("Set exists. Adding " + addToSetCapId);

			var setsMemberIsPartOf = aa.set.getSetHeadersListByMember(addToSetCapId).getOutput();

			var doesExistInSync = false;
			for (i = 0; i < setsMemberIsPartOf.size(); i++) {
					// aa.print("Part of Set : " + setsMemberIsPartOf.get(i).getSetID());
					if (setName == setsMemberIsPartOf.get(i).getSetID()) {
							doesExistInSync = true;
							aa.print("part of set - " + setsMemberIsPartOf.get(i).getSetID());
					}
			}
			logDebug("doesExistInSync " + doesExistInSync);
			if (!doesExistInSync)
					aa.set.add(setName, addToSetCapId);
	}
}

function getRecordsArray(emseParameters){
	var sql = 
			"select\
			   b.SERV_PROV_CODE,\
			   b.B1_PER_ID1,\
			   b.B1_PER_ID2,\
			   b.B1_PER_ID3,\
			   b.B1_PER_GROUP,\
			   b.b1_per_type,\
			   b.b1_per_sub_type,\
			   b.B1_PER_CATEGORY,\
			   b.b1_alt_id,\
			   b.B1_APPL_STATUS,\
			   b.b1_special_text \
			from\
			   B1PERMIT b \
			where\
			   b.serv_prov_code = 'DPL' \
			   and b.B1_PER_CATEGORY = 'License' \
			   and b.b1_special_text = 'Process' \
			   and b.REC_STATUS = 'A'";
			
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