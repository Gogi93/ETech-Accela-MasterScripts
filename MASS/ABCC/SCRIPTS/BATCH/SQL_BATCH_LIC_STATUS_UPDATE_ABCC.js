/***********************************************************************************************************************************
 * @Title 		: 	SQL_BATCH_LIC_STATUS_UPDATE_ABCC
 * @Author		:	Sagar Cheke
 * @Date			:	04/25/2016
 * @Description 	:	For each discipline related condition on the license, the script will take actions outlined below.
Only Licenses where the Transaction License record has a Special Text field value of "Process" will
be processed by this script (this value should be set via script when a decision is issued in an
Adjudication case or set via script when a condition is Manually applied to a Reference License)
 ***********************************************************************************************************************************/

try {
	var SCRIPT_VERSION = 3.0;
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
	eval(getScriptText("EMSE_MA_INT_C_UTILITY_METHODS"));
} catch (ex) {
	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}

function getScriptText(vScriptName) {
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");
	return emseScript.getScriptText() + "";

}

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

var emailAddress = lookup("BATCH_STATUS_EMAIL", "LIC_STATUS_UPDATE"); // This email will be set by standard choice
aa.print("emailAddress : " + emailAddress);
var emailAddress2 = getParam("emailAddress"); // This will be secondary email set by batch job param
if (emailAddress2 == null || emailAddress2 == "" || emailAddress2 == "undefined")
	emailAddress2 = "";

/*var stagingConfigurationString = '{\
	"connectionSC": "DB_CONNECTION_INFO",\
	"supplemental":   [{\
	"tag":"queryRecordsFromView",\
	"procedure":{\
	"name":"ELP_SP_LIC_STATUS_UPDATE_ABCC",\
	"resultSet":{"list":[\{"source":"RESULT","name":"capID","parameterType":"OUT","property":"CAP_ID","type":"STRING"},\{"source":"RESULT","name":"perType","parameterType":"OUT","property":"B1_PER_TYPE","type":"STRING"},\{"source":"RESULT","name":"altID","parameterType":"OUT","property":"B1_ALT_ID","type":"STRING"}]},\
	"parameters":{"list":[\{"source":"RESULT","name":"REC_CURSOR","parameterType":"OUT","property":"REC_CURSOR","type":"RESULT_SET"}]}}}]\
	}';

var stagingConfiguration = datatypeHelper.loadObjectFromParameter(stagingConfigurationString);*/

try {
	//var dbConfiguration = getDBConnectionInfo(stagingConfiguration.connectionSC);
	//if (dbConfiguration) {
		//this.stagingConfiguration.connectionInfo = dbConfiguration.connectionInfo;
		//ELPLogging.debug("ConnectionInfo", dbConfiguration.connectionInfo);

		// Create a connection to the Staging Table Database
		//var databaseConnection = DBUtils.connectDB(stagingConfiguration.connectionInfo);
		/* *
		 * Obtain Stored Procedure for queryECBViolation into Staging Table
		 */
		/*var queryRecordsFromView = null;
		for (var ii = 0; ii < stagingConfiguration.supplemental.length; ii++) {
			var supplementalConfiguration = stagingConfiguration.supplemental[ii];
			if (supplementalConfiguration.tag == "queryRecordsFromView") {
				var queryRecordsFromView = new StoredProcedure(supplementalConfiguration.procedure, databaseConnection);
			}
		}
		if (queryRecordsFromView == null) {
			var message = "Cannot find procedure ELP_SP_LIC_STATUS_UPDATE_ABCC";
			var exception = new Error(message);
			throw exception;
		}
		aa.print("Found queryRecordsFromView : " + supplementalConfiguration.procedure.name);

		var staticParameters = {};
		var dynamicParameters = {};
		var batchApplicationResult = {};
		queryRecordsFromView.prepareStatement();
		var inputParameters = queryRecordsFromView.prepareParameters(staticParameters, dynamicParameters, batchApplicationResult);
		var emseParameters = {};

		queryRecordsFromView.copyEMSEParameters(emseParameters, inputParameters);
		ELPLogging.debug("inputParameters for Query", inputParameters);
		queryRecordsFromView.setParameters(inputParameters);*/
		
		// Define the search criteria
		var capTypeModel = aa.cap.getCapTypeModel().getOutput();
		capTypeModel.setGroup("License");
		capTypeModel.setCategory("License");

		var capModel = aa.cap.getCapModel().getOutput();
		capModel.setCapType(capTypeModel);
		//capModel.setSpecialText("Process");

		// Get the list of records by search criteria
		var capIDList = aa.cap.getCapIDListByCapModel(capModel);
		if (!capIDList.getSuccess()) {
			logDebug("**INFO failed to get capIds list " + capIDList.getErrorMessage());
			capIDList = new Array(); //empty array script will exit
		} else {
			capIDList = capIDList.getOutput();
		}
		
		var dataSet = capIDList;
		
		//var dataSet = queryRecordsFromView.queryProcedure();

		//for (var queryResult = dataSet.next(); queryResult != null; queryResult = dataSet.next()) {
		var x = 0;
		for (x in dataSet){
			if (elapsed() > maxSeconds) // Only continue if time hasn't expired
			{
				logMessage("WARNING", "A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				logDebugAndEmail("WARNING: A script time out has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}

			//var capID = aa.cap.getCapID(queryResult.altID).getOutput();
			var capID = dataSet[x];
			var capIDString = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput().getCustomID();
			
			//var scanner = new Scanner(capID.toString(), "-");
			//var ID1 = scanner.next();
			//var ID2 = scanner.next();
			//var ID3 = scanner.next();

			var capId = aa.cap.getCapID(capID.getID1(), capID.getID2(), capID.getID3()).getOutput();
			//var capId = aa.cap.getCapIDModel(ID1, ID2, ID3).getOutput();
			evaluateLicenseRecords(capId, capIDString);
		}
	//}
} catch (ex) {
	aa.print("exception caught: " + ex.message);

	//dynamicParameters.lastRunStatus = "PROCESSED_EMSE_ERROR";
	aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.OTHER);
	aa.env.setValue("EMSEReturnMessage", "Error executing SQL_BATCH_LIC_STATUS_UPDATE_ABCC" + ex.message);
	ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.OTHER);
	ELPLogging.debug("EMSEReturnMessage: " + "Error executing SQL_BATCH_LIC_STATUS_UPDATE_ABCC. " + ex.message);

	var returnException = new ELPAccelaEMSEException("Error Loading Scripts " + ex.message, ScriptReturnCodes.EMSE_PROCEDURE);
	ELPLogging.fatal(returnException.toString());
	throw returnException;
}
finally {
	// close objects
	/*if (dataSet != null) {
		dataSet.close();
	}

	if (queryRecordsFromView != null) {
		queryRecordsFromView.close();
	}

	if (databaseConnection != null) {
		databaseConnection.close();
	}*/

	if (!ELPLogging.isFatal()) {
		//dynamicParameters.lastRunStatus = "PROCESSED_EMSE";
		aa.env.setValue("EMSEReturnCode", ScriptReturnCodes.SUCCESS);
		ELPLogging.debug("EMSEReturnCode: " + ScriptReturnCodes.SUCCESS);
		//ELPLogging.debug("dynamicParameters.lastRunStatus: " + dynamicParameters.lastRunStatus);

		if (ELPLogging.getErrorCount() > 0) {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with " + ELPLogging.getErrorCount() + " errors." + br;
		} else {
			aa.env.setValue("EMSEReturnMessage", "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors.");
			ELPLogging.debug("EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors.");
			emailText = emailText + "EMSEReturnMessage: " + "SQL_BATCH_LIC_STATUS_UPDATE_ABCC completed with no errors." + br;
		}
	}

	if (emailAddress && emailAddress != "" && emailAddress.length > 0) {
		aa.sendMail(sysFromEmail, emailAddress, emailAddress2, "Result: " + batchJobName, emailText);
	} else {
		aa.print("Email not sent. Standard Choice lookup failed or not found.");
	}

	aa.print(ELPLogging.toString());
}

/**
 * @desc This method processing records from view whose special text is "Process"
 * @param {capId} contains capID from query result.
 */
function evaluateLicenseRecords(pCapId, capIDString) {
	//aa.print("Processing license record : " + queryResult.altID);
	aa.print("Processing license record : " + capIDString);

	//Retrieve reference license number
	var refLicSeqNbr = retrieveLicSeqNumber(pCapId);

	retrieveCondtnOnRefLic(refLicSeqNbr, pCapId);
}

/**
 * @desc This method retrieves condition on the reference license.
 * @param {refLicSeqNbr} contains license professional sequence number
 * @param {capId} contains capIDModel.
 */
function retrieveCondtnOnRefLic(refLicSeqNbr, pCapId) {
	var conditionType = "Notice";
	var revocationCondtn = "Revocation Condition";
	var suspensionCondtn = "Suspension Condition";
	var stayOfEnforce = "Stay of Enforcement";
	var refLicStatus = "";
	var activeField = "";
	var jsDate = new Date();
	//Retrieve the conditions on the reference license
	var conditionList = aa.caeCondition.getCAEConditions(refLicSeqNbr);

	if (conditionList.getSuccess()) {
		var conditionModel = conditionList.getOutput();

		if (conditionModel) {
			for (index in conditionModel) {
				var condition = conditionModel[index];
				var condExpired = false;

				var condExpDate = condition.getExpireDate();
				aa.print("condExpDate : " + condExpDate);
				if (condExpDate) {
					var jsCondExpDate = new Date(condExpDate.getMonth() + "/" + condExpDate.getDayOfMonth() + "/" + condExpDate.getYear());

					if (jsCondExpDate <= jsDate) {
						condExpired = true;
					}
				}

				aa.print("condExpired : " + condExpired);
				//Check if the condition type and condition name both exists on the reference license
				if ((condition.getConditionType() == conditionType) && (condition.getConditionDescription() == revocationCondtn)) {
					//Verifying whether condition expired or not
					var licProfObj = getRefLicenseProf(queryResult.altID);
					if (licProfObj) {
						refLicStatus = licProfObj.getPolicy();
					}
					//case 1 : Revocation Condition Applied and Not Expired
					if ((condition.getConditionStatus() == "Applied") && (condExpired == false)) {
						//1. Set the Reference License status to Revoked.
						//2. Set the Active Field on the Reference License to No.
						refLicStatus = "Revoked";
						activeField = "N";
						var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

						//3. Set the Transaction License status to Revoked.
						updateAppStatus("Revoked", "", pCapId);

						//4. Update the workflow on the Transaction License record to License/Revoked.
						if (queryResult.perType == "Retail License") {
							updateTaskStatus("Retail License", "Revoked", "", "", "", pCapId);
						} else {
							updateTaskStatus("License", "Revoked", "", "", "", pCapId);
						}

						//5. Add license record to the SYNCSET
						addToLicenseSyncSet(pCapId);
					} else if (((condition.getConditionStatus() == "Not Applied" || condExpired == true) ||
							(condition.getConditionStatus() == "Applied" && condExpired == true)) && refLicStatus == "Revoked") {
						//Revocation Condition is Not Applied or Expired and the License  Status is Revoked
						//If the expiration date has not passed
						if (jsCondExpDate >= jsDate) {
							aa.print("Expiration date has not passed");
							//Set the Reference License status to Issued
							//Set the Active Field on the Reference License to Yes.
							refLicStatus = "Issued";
							activeField = "Y";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Issued.
							updateAppStatus("Issued", "", pCapId);

							//Update the workflow on the Transaction License record to License/Issued.
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Issued", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Issued", "", "", "", pCapId);
							}

							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						} else if (jsCondExpDate <= jsDate) {
							aa.print("Expiration date has passed");
							//Set the Reference License status to Expired
							//Set the Active Field on the Reference License to No.
							refLicStatus = "Expired";
							activeField = "N";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Expired.
							updateAppStatus("Expired", "", pCapId);

							//Update the workflow on the Transaction License record to License/Expired
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Expired", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Expired", "", "", "", pCapId);
							}
							//If Retail license, reduce the appropriate count in the Off Premise Licenses Issued or On Premise Licenses Issued standard choice to reflect an available license slot.

							if (queryResult.perType == "Retail License") {
								processRetailLicesens(pCapId);

							}

							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						}
					}
				} else if ((condition.getConditionType() == conditionType) && (condition.getConditionDescription() == suspensionCondtn)) {

					var licProfObj = getRefLicenseProf(queryResult.altID);
					if (licProfObj) {
						refLicStatus = licProfObj.getPolicy();
					}

					//Suspension Condition Applied and Not Expired and the License Status is not Revoked
					aa.print("refLicStatus : " + refLicStatus)
					if ((condition.getConditionStatus() == "Applied") && (condExpired == false) && refLicStatus != "Revoked") {
						//Set the Reference License status to Suspended.
						//Set the Active Field on the Reference License to No.
						refLicStatus = "Revoked";
						activeField = "N";
						var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

						//Set the Transaction License status to Suspended.
						updateAppStatus("Suspended", "", pCapId);

						//Update the workflow on the Transaction License record to License/Suspended.
						if (queryResult.perType == "Retail License") {
							updateTaskStatus("Retail License", "Suspended", "", "", "", pCapId);
						} else {
							updateTaskStatus("License", "Suspended", "", "", "", pCapId);
						}
						//Add license record to the SYNCSET.
						addToLicenseSyncSet(pCapId);
					} else if (((condition.getConditionStatus() == "Not Applied" || condExpired == true) ||
							(condition.getConditionStatus() == "Applied" && condExpired == true)) && refLicStatus == "Suspended") {
						//Revocation Condition is Not Applied or Expired and the License  Status is Revoked
						//If the expiration date has not passed
						if (jsCondExpDate >= jsDate) {
							aa.print("Expiration date has not passed");
							//Set the Reference License status to Issued
							//Set the Active Field on the Reference License to Yes.
							refLicStatus = "Issued";
							activeField = "Y";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Issued.
							updateAppStatus("Issued", "", pCapId);

							//Update the workflow on the Transaction License record to License/Issued.
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Issued", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Issued", "", "", "", pCapId);
							}
							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						} else if (jsCondExpDate <= jsDate) {
							aa.print("Expiration date has passed");
							//Set the Reference License status to Suspended
							//Set the Active Field on the Reference License to No.
							refLicStatus = "Suspended";
							activeField = "N";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Suspended.
							updateAppStatus("Suspended", "", pCapId);

							//Update the workflow on the Transaction License record to License/Suspended
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Suspended", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Suspended", "", "", "", pCapId);
							}
							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						}
					}
				} else if ((condition.getConditionType() == conditionType) && (condition.getConditionDescription() == stayOfEnforce)) {
					var licProfObj = getRefLicenseProf(queryResult.altID);
					if (licProfObj) {
						refLicStatus = licProfObj.getPolicy();
					}
					if ((condition.getConditionStatus() == "Applied") && (refLicStatus == "Suspended" || refLicStatus == "Revoked")) {
						//Stay of Enforcement is Applied and License Status is Suspended or Revoked
						//If the expiration date has not passed
						if (jsCondExpDate >= jsDate) {
							aa.print("Expiration date has not passed");
							//Set the Reference License status to Issued
							//Set the Active Field on the Reference License to Yes.
							refLicStatus = "Issued";
							activeField = "Y";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Issued.
							updateAppStatus("Issued", "", pCapId);

							//Update the workflow on the Transaction License record to License/Issued.
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Issued", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Issued", "", "", "", pCapId);
							}
							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						} else if (jsCondExpDate <= jsDate) {
							aa.print("Expiration date has passed");
							//Set the Reference License status to Expired
							//Set the Active Field on the Reference License to No.
							refLicStatus = "Expired";
							activeField = "N";
							var ref = updateRefLicProf(queryResult.altID, refLicStatus, activeField);

							//Set the Transaction License status to Expired.
							updateAppStatus("Expired", "", pCapId);

							//Update the workflow on the Transaction License record to License/Expired
							if (queryResult.perType == "Retail License") {
								updateTaskStatus("Retail License", "Expired", "", "", "", pCapId);
							} else {
								updateTaskStatus("License", "Expired", "", "", "", pCapId);
							}
							//If Retail license, reduce the appropriate count in the Off Premise Licenses Issued or On Premise Licenses Issued standard choice to reflect an available license slot.
							if (queryResult.perType == "Retail License") {
								processRetailLicesens(pCapId);
							}

							//Add license record to the SYNCSET
							addToLicenseSyncSet(pCapId);

						}

					}
				} else {
					//If the License Status is Issued or Expired and there are no active Conditions, then remove the string "Process" from the Special Text field on the transaction License Record
					var licProfObj = getRefLicenseProf(queryResult.altID);
					if (licProfObj) {
						refLicStatus = licProfObj.getPolicy();
						if ((refLicStatus == "Issued" || refLicStatus == "Expired") && ((condition.getConditionDescription() != revocationCondtn) || (condition.getConditionDescription() != suspensionCondtn) || (condition.getConditionDescription() != stayOfEnforce))) {
							var capScriptModelResult = aa.cap.getCap(pCapId);
							if (capScriptModelResult.getSuccess()) {
								var capModel = capScriptModelResult.getOutput().getCapModel();
								capModel.setSpecialText("");
								aa.cap.editCapByPK(capModel);
							}
						}
					}
				}
			}
		}
	}
}

/**
 * @desc This method will process retails license business rule.Reduce the appropriate count in the Off Premise Licenses Issued or On Premise Licenses Issued standard choice to reflect an available license slot
 * @param {capId} contains record ID.
 */
function processRetailLicesens(pCapId) {
	var vLicenseTypeApplying = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "Please indicate the type of license your are applying for");

	var vLicenseClass = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "License Class");
	var municipalityName = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "City/Town Name");
	aa.print("vLicenseTypeApplying : " + vLicenseTypeApplying + " vLicenseClass : " + vLicenseClass + " municipalityName : " + municipalityName);

	if (vLicenseTypeApplying == "On-Premises Consumption") {
		aa.print("vLicenseClass : " + vLicenseClass);
		if (vLicenseClass == "Seasonal") {
			var vLicenseCategoryOnPremises = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "On-Premises License Category");
			aa.print("vLicenseCategoryOnPremises : " + vLicenseCategoryOnPremises);
			if (vLicenseCategoryOnPremises == "All Alcoholic Beverages") {
				//update [Seasonal AL Issued]
				decreaseOnPremLLALicsIssued(municipalityName, "S", "AL");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"S","AL","On Premise Issued No Exmpt SpLeg"); //JIRA#1906
			} else {
				//update [Seasonal WM Issued]
				//decrease the Section 12 Wine and Malt Seasonal count by 1
				decreaseOnPremLLALicsIssued(municipalityName, "S", "WM");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"S","WM","On Premise Issued No Exmpt SpLeg"); //JIRA#1906
			}
		} else if (vLicenseClass == "Annual") {
			var vLicenseCategoryOnPremises = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "On-Premises License Category");
			aa.print("vLicenseCategoryOnPremises : " + vLicenseCategoryOnPremises);
			if (vLicenseCategoryOnPremises == "All Alcoholic Beverages") {
				//update [[Annual AL Issued]]
				//decrease All Alcohol Annual count by 1
				decreaseOnPremLLALicsIssued(municipalityName, "A", "AL");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"A","AL","On Premise Issued No Exmpt SpLeg"); //JIRA#1906
			} else {
				//update [Annual WM Issued]
				//decrease the Section 12 Wine and Malt Annual count by 1
				decreaseOnPremLLALicsIssued(municipalityName, "A", "WM");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"A","WM","On Premise Issued No Exmpt SpLeg"); //JIRA#1906
			}
		}
	} else if (vLicenseTypeApplying == "Off-Premises Consumption") {
		var vLicenseCategoryOffPremises = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "Off-Premises License Category");
		aa.print("vLicenseClass : " + vLicenseClass);
		if (vLicenseClass == "Seasonal") {
			var vLicenseCategoryOnPremises = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "On-Premises License Category");
			aa.print("vLicenseCategoryOnPremises : " + vLicenseCategoryOnPremises);
			if (vLicenseCategoryOnPremises == "All Alcoholic Beverages") {
				//update [Seasonal AL Issued]
				decreaseOffPremLLALicsIssued(municipalityName, "S", "AL");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"S","AL","Off Premise Issued No Exmpt SpLeg"); //JIRA#1906
			} else {
				//update [Seasonal WM Issued]
				//decrease the Section 12 Wine and Malt Seasonal count by 1
				decreaseOffPremLLALicsIssued(municipalityName, "S", "WM");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"S","WM","Off Premise Issued No Exmpt SpLeg"); //JIRA#1906
			}
		} else if (vLicenseClass == "Annual") {
			var vLicenseCategoryOnPremises = getASIValue(pCapId, "RETAIL APPLICATION INFORMATION", "On-Premises License Category");
			if (vLicenseCategoryOnPremises == "All Alcoholic Beverages") {
				//update [[Annual AL Issued]]
				//decrease All Alcohol Annual count by 1
				decreaseOffPremLLALicsIssued(municipalityName, "A", "AL");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"A","AL","Off Premise Issued No Exmpt SpLeg"); //JIRA#1906
			} else {
				//update [Annual WM Issued]
				//decrease the Section 12 Wine and Malt Annual count by 1
				decreaseOffPremLLALicsIssued(municipalityName, "A", "WM");
                                 decreaseOnOffPremLNoExemptSpLeg(municipalityName,"A","WM","Off Premise Issued No Exmpt SpLeg"); //JIRA#1906
			}
		}
	}
}

/**
 * @desc This method will retrieves ASI value from the record.
 * @param {capId} contains record ID.
 * @param {subGroupName} contains ASI sub group name.
 * @param {fieldName} contains ASI field name.
 * @returns {NA} -
 */
function getASIValue(pCapId, subGroupName, fieldName) {
	var asiValue = "";

	var appSpecificInfoScriptModelResult = aa.appSpecificInfo.getAppSpecificInfos(pCapId, subGroupName, fieldName);
	if (appSpecificInfoScriptModelResult.getSuccess()) {
		var appSpecificInfoScriptModel = appSpecificInfoScriptModelResult.getOutput();

		for (index in appSpecificInfoScriptModel) {
			asiValue = appSpecificInfoScriptModel[index].getChecklistComment();
		}
	}

	return asiValue;
}

/**
 * @desc This method will update ref license professional status.
 * @param {altID} contains record ID.
 * @param {refLicStatus} contains LP status.
 * @param {activeField} contains active field of LP.
 * @returns {NA}
 */
function updateRefLicProf(altID, refLicStatus, activeField) {
	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(), altID);

	if (refLicenseResult.getSuccess()) {
		var newLicArray = refLicenseResult.getOutput();

		if (newLicArray == null) {
			aa.print("List of Reference Licenses is null. ");
			return null;
		}
		for (thisLic in newLicArray) {
			aa.print("Reference license professional Number : " + newLicArray[thisLic].getStateLicense());
			refLicObj = newLicArray[thisLic];
			refLicObj.setPolicy(refLicStatus);

			refLicObj.setWcExempt(activeField);
			var myResult = aa.licenseScript.editRefLicenseProf(refLicObj);
			if (myResult.getSuccess()) {
				aa.print("Successfully added/updated License No. " + refLicObj.getStateLicense() + ", License Board: " + refLicObj.getLicenseBoard() + ", Type: " + refLicObj.getLicenseType());
			} else {
				aa.print("**ERROR: can't edit reference license professional status to Inactive : " + myResult.getErrorMessage());
			}
		}
	} else {
		aa.print("**ERROR retrieving Reference License Professional : " + refLicenseResult.getErrorMessage());
	}

}

function getParam(pParamName) // gets parameter value and logs message showing param value
{
	var ret = "" + aa.env.getValue(pParamName);
	aa.print("PARAMETER " + pParamName + " = " + ret);
	return ret;
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - batchStartTime) / 1000)
}

/**
 * @desc This method will work flow task status.
 * @param {capId} contains the record ID
 * @param {wfstr} contains the Work flow name
 * @param {wfstat} contains work flow status
 * @param {wfcomment} contains work flow comment
 * @param {wfnote} contains work flow note
 * @throws N/A
 */
function updateTaskStatus(wfstr, wfstat, wfcomment, wfnote, pCapId) // optional process name, cap id
{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 4) {
		if (arguments[4] != "") {
			processName = arguments[4]; // sub process
			useProcess = true;
		}
	}
	var itemCap = pCapId;
	if (arguments.length == 6)
		itemCap = arguments[5]; // use cap ID specified in args
	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else {
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
	}
	if (!wfstat)
		wfstat = "NA";
	for (i in wfObj) {
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && (!useProcess || fTask.getProcessCode().equals(processName))) {
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			if (useProcess)
				aa.workflow.handleDisposition(itemCap, stepnumber, processID, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "U");
			else
				aa.workflow.handleDisposition(itemCap, stepnumber, wfstat, dispositionDate, wfnote, wfcomment, systemUserObj, "U");
			aa.print("Updating Workflow Task " + wfstr + " with status " + wfstat);
			aa.print("Updating Workflow Task " + wfstr + " with status " + wfstat);
		}
	}
}
