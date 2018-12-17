/*------------------------------------------------------------------------------------------------------/
| Program : ACA Before Document Check.js
| Event   : ACA_BeforeButton Event
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false; // Set to true to see results in popup window
var showDebug = false; // Set to true to see debug messages in popup window
var useAppSpecificGroupName = false; // Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false; // Use Group name when populating Task Specific Info Values
var cancel = false;
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message = ""; // Message String
var debug = ""; // Debug String
var br = "<BR>"; // Break Tag

var useSA = false;
var SA = null;
var SAScript = null;
var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_FOR_EMSE");
if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") {
	useSA = true;
	SA = bzr.getOutput().getDescription();
	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS", "SUPER_AGENCY_INCLUDE_SCRIPT");
	if (bzr.getSuccess()) {
		SAScript = bzr.getOutput().getDescription();
	}
}

if (SA) {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS", SA));
	eval(getScriptText(SAScript, SA));
} else {
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
}

eval(getScriptText("INCLUDES_CUSTOM"));
eval(getScriptText("COSMETOLOGY_FUNCTIONS"));
eval(getScriptText("ELECTROLOGY_FUNCTIONS"));
eval(getScriptText("BARBER_FUNCTIONS"));

function getScriptText(vScriptName) {
	var servProvCode = aa.getServiceProviderCode();
	if (arguments.length > 1)
		servProvCode = arguments[1]; // use different serv prov code
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	try {
		var emseScript = emseBiz.getScriptByPK(servProvCode, vScriptName, "ADMIN");
		return emseScript.getScriptText() + "";
	} catch (err) {
		return "";
	}
}

var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var servProvCode = capId.getServiceProviderCode() // Service Provider Code
	var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) {
	currentUserID = "ADMIN";
	publicUser = true
} // ignore public users
var capIDString = capId.getCustomID(); // alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput(); // Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString(); // Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/"); // Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
	if (currentUserGroupObj)
		currentUserGroup = currentUserGroupObj.getGroupName();
	var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var under5000 = 0;
var over5000 = 0;
var AInfo = new Array(); // Create array for tokenized variables
var busCert = null;
loadAppSpecific4ACA(AInfo);
eval(getScriptText("DRINKING_WATER_FUNCTIONS"));
eval(getScriptText("PODIATRY_FUNCTIONS"));
eval(getScriptText("ELECTROLOGY_FUNCTIONS"));
eval(getScriptText("DISPENSING_OPTICIAN_FUNCTIONS"));
eval(getScriptText("HOME_INSPECTOR_FUNCTIONS"));
eval(getScriptText("FUNERAL_DIRECTORS_FUNCTIONS"));
eval(getScriptText("ARCHITECT_FUNCTIONS"));
eval(getScriptText("ALLIED_HEALTH_FUNCTIONS"));
eval(getScriptText("ALLIED_MENTAL_HEALTH_FUNCTIONS"));
eval(getScriptText("SANITARIANS_FUNCTIONS"));
eval(getScriptText("LANDSCAPE_ARCHITECT_FUNCTIONS"));
eval(getScriptText("SOCIAL_WORK_FUNCTIONS"));
eval(getScriptText("HEARING_INSTRUMENT_FUNCTIONS"));
eval(getScriptText("MASSAGE_THERAPY_FUNCTIONS"));
eval(getScriptText("BARBER_FUNCTIONS"));
eval(getScriptText("COSMETOLOGY_FUNCTIONS"));
eval(getScriptText("CHIROPRACTOR_FUNCTIONS"));
eval(getScriptText("PUBLIC_ACCOUNTANCY_FUNCTIONS"));
eval(getScriptText("SPEECH_AUDIOLOGY_FUNCTIONS"));
eval(getScriptText("BUSINESS_AMENDMENT_FUNCTIONS"));
eval(getScriptText("OCCUPATIONAL_SCHOOLS_FUNCTIONS"));
eval(getScriptText("PUBLIC_ACCOUNTANCY_FUNCTIONS"));

// For script#317, check if the Professional Resume doc attached or not.
// updated for Script #61 & 50
// Ankush: modified for Script#60
if ((appTypeResult == "License/Allied Health/Physical Therapist/Renewal") || (appTypeResult == "License/Allied Health/Physical Therapist Assistant/Renewal") || (appTypeResult == "License/Allied Health/Physical Therapist/Renewal") || (appTypeResult == "License/Allied Health/Occupational Therapist/Renewal")) {
	CWM_ELP_317_ACA_DPL_checkProfessionalResumeDoc();
}

// For Script#549, check the doc "CORI Notarized Form" is uploaded or not.
if (appTypeResult == "License/Massage Therapy/Solo Massage Establishment/Application") {
	CWM_ELP_549_ACA_DPL_checkCORINotarizedFormUploaded(); // CORI Notarized Form
	CWM_ELP_549_ACA_DPL_checkFloorPlanUploaded(); // Floor Plan
	CWM_ELP_549_ACA_DPL_checkArticlesOfCorporationOrOrganizationUploaded(); // Article or organisation
	CWM_ELP_549_ACA_DPL_checkLocalPermitUploaded(); // Local Permit
	CWM_ELP_549_ACA_DPL_checkInsurancePolicyUploaded(); // insurance Policy
}
//Script#:228 - Added by Byellapu
if (appTypeResult == "License/Public Accountancy/CPA Firm for Business Corp/Application")
{
	CWM_ELP_228_DPL_ACA_ASB_checkCPAFirmBuisnessCorpReqDocs();
}
//Script#:784 - Added by Byellapu
if (appTypeResult == "License/Occupational Schools/School/Application")
{
CWM_ELP_784_DPL_checkOSSchoolReqDocsUploaded();
}
if (appTypeResult == "License/Massage Therapy/Multiple Massage Establishment/Application") {
	CWM_ELP_602_ACA_ASB_DPL_checkMMDocs();
}
if (appTypeResult == "License/Barbers/Shop/Application") {
	//CWM_ELP_460_ACA_ASB_DPL_checkBSDocs();
CWM_ELP_CR807_ACA_checkConditionalDoumentBarberShopApp();//debashish.barik

}
// For Script#578, check the doc "Insurance Policy" and "CORI Acknowledgement Form" is uploaded or not.
if (appTypeResult == "License/Massage Therapy/Massage Therapist/Application") {
	CWM_ELP_578_ACA_ASB_DPL_checkInsurancePolicyDoc();
	CWM_ELP_578_ACA_ASB_DPL_checkCORIAcknowledgementFormUploaded();
}

// For script#392, check the ASI and document "Professional Resume" is uploaded or not. added by tofek.
//Sagar : Added for script: 390 and 393
//BYellapu: modified for Script # 391

if ((appTypeResult == "License/Speech and Audiology/Speech Language Pathologist/Renewal") || (appTypeResult == "License/Speech and Audiology/Audiologist/Renewal") || (appTypeResult == "License/Speech and Audiology/Speech Language Pathology Asst/Renewal")||(appTypeResult == "License/Speech and Audiology/Audiology Assistant/Renewal")) {

	CWM_ELP_392_ACA_DocumentPageFlow_SpeechLangPathologist(capId);
}
//Sagar : Added for script #254
if (appMatch("License/Public Accountancy/CPA Firm for Professional Corp/Application")) 
{

    CWM_ELP_254_ACA_CA_C_DocumentPageFlow(capId);
}
//Sagar : Added for script #255
if (appMatch("License/Public Accountancy/CPA Firm for LLC/Application")) 
{
	CWM_ELP_255_ACA_CA_LC_DocumentPageFlow(capId);
}
if (appMatch("License/Allied Mental Health/*/Application")) {
	CWM_ELP_578_ACA_ASB_DPL_checkCORIAcknowledgementFormUploaded();
}
// For script#510, check document "Passport Photo" and "Copy of Driver's License" are uploaded or not on ACA only. added by tofek.
if (appTypeResult == "License/Barbers/Reciprocal/Application") {
	CWM_ELP_510_DPL_ACA_ReciprocalBarberApplication(capId);
}

// For script#812, check document "Passport Photo", "Copy of Driver's License" and "Employer's Affidavit" are uploaded or not on ACA only. added by Ankush.
if (appTypeResult == "License/Cosmetology/Out of State/Application") {
	CWM_ELP_812_DPL_ACA_OutOfStateApplication();
}

//Script ID: 722 - By Byellapu
// calling one function to validate all the required documents (added by SKumar)
if (appMatch("License/Allied Mental Health/Mental Health Counselor/Application")) {
	//CWM_ELP_722_DPL_checkPostMasterClinicalDoc();
	//CWM_ELP_373_DPL_ACA_ASB_checkAHCReqDocsUploaded();
	//evt- Commenting out document check for EPAWS-1009 
	//CWM_ELP_720_DPL_ACA_ASB_checkAHCReqDocsUploaded();
}

if (appMatch("License/Cosmetology/Shop/Renovation")) { 
        
	CWM_ELP_DPL_267_validateDocs();
 }
if (appMatch("License/Cosmetology/Shop/Application")) {
	 CWM_ELP_DPL_requiredDocsCosmoShop();
	CWM_ELP_CR807_ACA_checkConditionalDoumentBarberShopApp();	
} 

//Script ID: 44 - By Tofek khan
	// Checking the requirement of document in ACA
	if(appMatch("License/Allied Health/Athletic Trainer/Renewal"))
	{
		CWM_ELP_44_ACA_DocumentPageFlow_AthleticTrainer(capId);
	}
//added by CLOJE on 3/14
	if(appMatch("License/Barbers/Out of Country Apprentice/Application")){
		CWM_ELP_431_ACA_DPL_checkSupportingDocs();
	}
	

	if(appMatch("License/Cosmetology/Jr Instructor/Application")) {
		CWM_ELP_DEFECT_10494_ACA_DPL_checkSupportingDocs();
	}		
//Script ID: 256 added by ADOLE on 3/15/16
if(appMatch("License/Public Accountancy/CPA Firm License for LLP/Application"))
{
	CWM_ELP_256_ACA_DPL_CPAFirmLLP_checkDocs();
}
// Script ID: 493 (added by SKumar, 03/15/2016)
//Defect 12361 : (Updated by Carol, 06/07/2016)
if (appMatch("License/Barbers/Master/Application")) {
     //CWM_ELP_493_DPL_checkBMRequiredDocsUploaded();
	  CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("Work Experience Affidavit","You must attach your Work Experience Affidavit to submit this application.");
}
/***********************CR-540 Start[debashish.barik ,Dt:8/23/2016]**********************/
// For script#249, added by Ankush.
if (appTypeResult == "License/Cosmetology/Out of Country/Application") {
	CWM_ELP_249_DPL_ACA_OutOfCountryApplication();
}
// For script#654, added by Tofek.
if (appTypeResult == "License/Cosmetology/Forfeiture/Application") {
	//CWM_ELP_654_ACA_ASB_DPL_checkRquiredDocIsUploaded();
	CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("Passport Photo","Please upload the Passport Photo Document.");
	CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("Copy of Drivers License or other Government ID","Please upload the Copy of Deivers License or Government ID Document.");
	CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("CORI Notarized Form","Please upload the CORI Notarized Form Document.");
}
if ((appTypeResult == "License/Cosmetology/Type 1/Application") || (appTypeResult == "License/Cosmetology/Type 6/Application")) {
	CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("CORI Notarized Form","Please upload the CORI Notarized Form Document.");
}

/***********************CR-540 End[debashish.barik ,Dt:8/23/2016]**********************/

// For Defect 10851, added by Carol.
if (appTypeResult == "License/Public Accountancy/CPA Firm for Partnership/Application") {
	CWM_ELP_257_DPL_CPA_FirmPartnershipValidation();
}
if(appTypeResult == "License/Funeral Directors/Funeral Assistant/Application"){
	CWM_ELP_DPL_FuneralAsstDocCheck();
}
//Added by Ankush for CR440. Dt.:05/06/2016
if(appTypeResult == "License/Funeral Directors/Embalmer Apprentice/Application"){
	CWM_ELP_440_DPL_ACA_ASB_checkEmbalmerReqDocsUploaded();
}
//debashish.barik, Dt:5/11/2016, RTC#10920
if(appTypeResult == "License/Occupational Schools/Sales Representative/Application"){
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("CORI Notarized Form");
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("Sales Representative Information Form");
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("Resume or Curriculum Vitae");
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("Ethics Training Signature Page");
        CWM_ELP_ASB_ACA_DPL_checkDocumnets("Passport Photo");
}

//debashish.barik, Dt:5/11/2016, RTC#12203
if ((appTypeResult == "License/Allied Health/Occupational Therapist Asst/Renewal")||(appTypeResult == "License/Allied Health/Physical Therapist Assistant/Renewal")) {

if(AInfo["Current Employment Status"] == "Practicing in another state (must upload resume)"){
CWM_ELP_ASB_ACA_DPL_checkCustomDocumnets("Professional Resume","You must upload your professional resume to reinstate your license.");
}
}
//ankush.s.kshirsagar, Defect#12985,Dt-06/27/2016
if (appTypeResult == "License/Occupational Schools/Program-Course/Application") {
	CWM_ELP_12985_ACA_ASB_DPL_checkSyllabusDocIsUploaded();
}
//kanhaiya.bhardwaj, Defect#13748, Date:-08/02/2016
if(appTypeResult == "License/Cosmetology/Type 5/Application"){
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("Passport Photo");
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("Copy of Government Issued ID");
	//CR-540, debashish.barik
	CWM_ELP_ASB_ACA_DPL_checkDocumnets("CORI Notarized Form");
}

if(appTypeResult == "License/Occupational Schools/School/Modify Employee"){
     CWM_ELP_CR471_ACA_ASB_DPL_checkDocs();
}
if( appTypeResult == "License/Occupational Schools/Instructor/Certification"){
	
	CWM_ELP_CR471_ACA_ASB_DPL_checkDocs1();
}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0 || debug.substr(0, 7) == "**ERROR") {
	showDebug = true;
	aa.env.setValue("ErrorCode", "1");
	aa.env.setValue("ErrorMessage", debug);
} else {
	if (cancel) {
		aa.env.setValue("ErrorCode", "-2");
		if (showMessage)
			aa.env.setValue("ErrorMessage", message);
		if (showDebug)
			aa.env.setValue("ErrorMessage", debug);
	} else {
		aa.env.setValue("ErrorCode", "0");
		if (showMessage)
			aa.env.setValue("ErrorMessage", message);
		if (showDebug)
			aa.env.setValue("ErrorMessage", debug);
	}
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
function loadASITables4ACAXX() {
	//
	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from.  If no CAP Id specified, use the capModel
	//
	var itemCap = capId;
	if (arguments.length == 1) {
		itemCap = arguments[0]; // use cap ID specified in args
		var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	} else {
		var gm = cap.getAppSpecificTableGroupModel()
	}
	var ta = gm.getTablesMap();
	var tai = ta.values().iterator();
	while (tai.hasNext()) {
		var tsm = tai.next();
		if (tsm.rowIndex.isEmpty())
			continue; // empty table
		var tempObject = new Array();
		var tempArray = new Array();
		var tn = tsm.getTableName();
		tn = String(tn).replace(/[^a-zA-Z0-9]+/g, '');
		if (!isNaN(tn.substring(0, 1)))
			tn = "TBL" + tn // prepend with TBL if it starts with a number
				var tsmfldi = tsm.getTableField().iterator();
		var tsmcoli = tsm.getColumns().iterator();
		var numrows = 1;
		while (tsmfldi.hasNext()) // cycle through fields
		{
			if (!tsmcoli.hasNext()) // cycle through columns
			{
				var tsmcoli = tsm.getColumns().iterator();
				tempArray.push(tempObject); // end of record
				var tempObject = new Array(); // clear the temp obj
				numrows++;
			}
			var tcol = tsmcoli.next();
			var tval = tsmfldi.next();

			//var tval = tnxt.getInputValue();
			tempObject[tcol.getColumnName()] = tval;
		}
		tempArray.push(tempObject); // end of record
		var copyStr = "" + tn + " = tempArray";
		logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
		eval(copyStr); // move to table name
	}
}

/*------------------------------------------------------------------------------------------------------/
| Custom Functions (End)
/------------------------------------------------------------------------------------------------------*/