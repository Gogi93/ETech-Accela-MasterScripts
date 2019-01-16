/*------------------------------------------------------------------------------------------------------/
| Program : ACA_BEFORE_AMENDMENT_DOCUMENT_CHECK_1.js
| Event   : ACA_BeforeButton Eventa
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
| Type: Agent Broker Amendment,Express Transportation Amendment,Wholesaler Amendment,Ship Master Amendment,Salesman Amendment,
        Transportation Amendment
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = true; // Set to true to see results in popup window
var showDebug = true; // Set to true to see debug messages in popup window
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
loadASITables4ACAXX1();
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//*******************************New Code Ended***************************************************************
if (appTypeResult == "License/State License/Agent Broker Solicitor/Amendment") 
{
	try
    { 
	    var DBAAmend = AInfo["Change of DBA"];
		var EntityAmend = AInfo["Change of Entity Name"];
		var LegalAmend = AInfo["Change of Legal Structure"];
		var EditContactAmend = AInfo["Edit Contact and / or Address Information"];
		var AddClientAmend = AInfo["Add Client Entity (Principal)"];
		var BCflag = false;
		
		if(DBAAmend == "CHECKED" || EntityAmend == "CHECKED" || LegalAmend == "CHECKED" || EditContactAmend == "CHECKED" || AddClientAmend == "CHECKED")
		{
            //check for Letter for Authorization Document
		    CheckForLetterOfAuthorization(capId);
		
		}
		
		if(DBAAmend == "CHECKED" || EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
            //Check for Vote of the Corporation Board or LLC Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
				
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//Check for Articles of Organization Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached();
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//Check for Partnership Agreement Document
			CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached();
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//check for Business Certificate Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached();
		}
		
		if(DBAAmend == "CHECKED")
		{
		    //Check for Business Certificate Document
		    Businessdoc = checkDocumentByType("Business Certificate");
		    if (!Businessdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Business Certificate Document to continue.");
			}

            BCflag = true;			
		}
				
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			if(BCflag == false)
			{
			 //check for Proof of Age of Named Beneficiaries Document
             CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached();
			}
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//check for Court Documents 
            CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached();
		}
		
		
		if(AddClientAmend == "CHECKED")
		{
		    //Check for Certificate of Appointment to Act as Agent Broker or Solicitor Document
		    AddClientdoc = checkDocumentByType("Certificate of Appointment to Act as Agent Broker or Solicitor");
		    if (!AddClientdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Certificate of Appointment to Act as Agent Broker or Solicitor Document to continue.");
			}
           			
		}
			    
    }
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);

    }
}

if (appTypeResult == "License/State License/Express Transportation Permit/Amendment") 
{
	try
    { 
	    var DBAAmend = AInfo["Change of DBA"];
		var EntityAmend = AInfo["Change of Entity Name"];
		var LegalAmend = AInfo["Change of Legal Structure"];
		var EditContactAmend = AInfo["Edit Contact and / or Address Information"];
		var EditVehicleAmend = AInfo["Add or Edit Number of Vehicles Being Permitted"];
		var BCflag = false;
		
		if(DBAAmend == "CHECKED" || EntityAmend == "CHECKED" || LegalAmend == "CHECKED" || EditContactAmend == "CHECKED" || EditVehicleAmend == "CHECKED")
		{
			//check for Letter for Authorization Document
		    CheckForLetterOfAuthorization(capId);
		}
		
		
		if(DBAAmend == "CHECKED" || EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//Check for Vote of the Corporation Board or LLC Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
		}
		
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//Check for Articles of Organization Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached();
		}
		
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//Check for Partnership AgreementDocument
			CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached();
		}
		
		if(DBAAmend == "CHECKED")
		{
		    //Check for Business Certificate Document
		    Businessdoc = checkDocumentByType("Business Certificate");
		    if (!Businessdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Business Certificate Document to continue.");
			}

            BCflag = true;
						
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			if(BCflag == false)
			{
				//check for Business Certificate Document
				CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached();
			}
		}
		
		if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//check for Proof of Age of Named Beneficiaries Document
            CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached();
		}
		
			if(EntityAmend == "CHECKED" || LegalAmend == "CHECKED")
		{
			//check for Court Documents 
            CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached();
		}
		    
	}
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);
    }
}

if (appTypeResult == "License/State License/Wholesaler/Amendment") 
{
	try
    { 
	    var editVehicle = AInfo["Add, Update, or Remove Vehicle Information"];
        var editPremiseD = AInfo["Alteration of Premises Detail"];	
        var editCapacity = AInfo["Change of Capacity"];
        var editCategory = AInfo["Change of Category"];
        var editDba = AInfo["Change of DBA"];	
        var editEntity = AInfo["Change of Entity Name"];	
		var editLegal = AInfo["Change of Legal Structure"];	
		var editManager = AInfo["Change of License Manager"];	
		var editPledgeL = AInfo["Change of Pledge of License"];	
		var editPledgeS = AInfo["Change of Pledge of Stock"];	
		var editPremiseL = AInfo["Change of Premises Location"];	
		var editContact = AInfo["Edit Contact and / or Address Information"];	
		//var editPlate = AInfo["Change of DBA"];	
		var editBI = AInfo["Change of Beneficial Interest"];	
		
		
		if(editManager == "CHECKED")
		{
			CORIdoc = checkDocumentByType("CORI Release Form");
		    if (!CORIdoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the CORI Release Form to continue.");
		    }
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editPremiseL== "CHECKED")
		{
			
			//check for FDA Registration Document
		    FDAdoc = checkDocumentByType("FDA Registration");
		    if (!FDAdoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the FDA Registration Documents to continue.");
		    }
		}
		
		if(editPremiseD== "CHECKED" || editPremiseL== "CHECKED")
		{
			//Check for Floor Plan(s) Document
		    Floordoc = checkDocumentByType("Floor Plan(s)");
		    if (!Floordoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the Floor Plan(s) Documents to continue.");
		    }
			
			//check for Lease/Occupancy Documents
		    Leasedoc = checkDocumentByType("Lease/Occupancy Documents");
		    if (!Leasedoc) {
				cancel = true;
				showMessage = true;
			    comment("Applicant must attach the Lease/Occupancy Documents to continue.");
		    }
		}
		
		
        if(editManager== "CHECKED")
		{
			//Check for Proof of Citizenship Document
			ProofCitizendoc = checkDocumentByType("Proof of Citizenship");
			if (!ProofCitizendoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Proof of Citizenship Documents to continue.");
			}
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editCategory== "CHECKED")
		{			
			//check for Surety Bond Document
		    Suretydoc = checkDocumentByType("Surety Bond");
		    if (!Suretydoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the Surety Bond Documents to continue.");
		    }
			
			//check for Alcohol and Tobacco Tax and Trade Bureau (TTB) Permit Document
		    TTBdoc = checkDocumentByType("Alcohol and Tobacco Tax and Trade Bureau (TTB) Permit");
		    if (!TTBdoc) {
			    cancel = true;
			    showMessage = true;
			     comment("Applicant must attach the Alcohol and Tobacco Tax and Trade Bureau (TTB) Permit Documents to continue.");
		    }
		
		}
		
		if(editManager == "CHECKED")
		{			
			//Check for Affidavit document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckConvDocAttached();			
		}
		
		if(editVehicle == "CHECKED")
		{
			//Check for Vehicle Registration document
		    CWM_ELP_7529_ACA_ABCC_checkVehicleRegDoc();
		}
		
		if(editPledgeL== "CHECKED" || editPledgeS== "CHECKED")
		{
			//check for Promissory Note Document
		    Promissorydoc = checkDocumentByType("Promissory Note");
		    if (!Promissorydoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the Promissory Note Documents to continue.");
		    }
			
			//check for Pledge Agreement Document
		    Pledgedoc = checkDocumentByType("Pledge Agreement");
		    if (!Pledgedoc) {
			    cancel = true;
			    showMessage = true;
			    comment("Applicant must attach the Pledge Agreement Documents to continue.");
		    }
		}
		
		//check for Letter for Authorization Document
		CheckForLetterOfAuthorization(capId);
		
		if (editVehicle == "CHECKED" || 
			editPremiseD == "CHECKED" || 
			editCapacity == "CHECKED" || 
			editCategory == "CHECKED" || 
			editDba == "CHECKED" ||
			editEntity == "CHECKED" ||
			editLegal == "CHECKED" ||
			editManager == "CHECKED" ||
			editPledgeL == "CHECKED" ||
			editPledgeS == "CHECKED" ||
			editPremiseL == "CHECKED" ||
			editBI == "CHECKED") {
				//Check for Vote of the Corporation Board or LLC Document
				CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
		}
		
		//this logic does not check for the Vote of Corp document if this amendment option is selected along with other amendment options
		//if(editContact != "CHECKED")
		//{
		    //Check for Vote of the Corporation Board or LLC Document
		    //CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
		//}
		
		var bc = false;
		if(editDba == "CHECKED")
		{
			//Check for Business Certificate Document
		    Businessdoc = checkDocumentByType("Business Certificate");
		    if (!Businessdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Business Certificate Document to continue.");
				bc = true;
			}	
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editBI== "CHECKED")
		{	
	        //Check for Articles of Organization Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached();
			
			//Check for Partnership Agreement Document
			CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached();
			
			if(bc == false)
			{
			    //check for Business Certificate Document
		        CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached();
			}
			
			//check for Proof of Age of Named Beneficiaries Document
            CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached();
			
			//check for Court Documents 
            CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached();
	    }
		       		
	}
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);
    }
}	
if (appTypeResult == "License/State License/Ship Master/Amendment") 
{
	try
    { 
	   
        var editDba = AInfo["Change of DBA"];	
        var editEntity = AInfo["Change of Entity Name"];	
		var editLegal = AInfo["Change of Legal Structure"];	
		var editManager = AInfo["Change of License Manager"];
        var editContact = AInfo["Edit Contact and / or Address Information"];		
		var editShip = AInfo["Add or Update Ship Information"];	
		var editBI = AInfo["Change of Beneficial Interest (Ownership)"];
		var editPledgeL = AInfo["Pledge of License, Stock or Collateral"];	
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED")
		{			
			//check for Coast Guard Certification Document
			Coastdoc = checkDocumentByType("Coast Guard Certification");
			if (!Coastdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Coast Guard Certification Documents to continue.");
			}
		}
		
		if(editPledgeL== "CHECKED")
		{
			//check for Promissory Note Document
			Promissorydoc = checkDocumentByType("Promissory Note");
			if (!Promissorydoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Promissory Note Document to continue.");
			}
			
			//check for Pledge Agreement Document
			Pledgedoc = checkDocumentByType("Pledge Agreement");
			if (!Pledgedoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Pledge Agreement Document to continue.");
			}
			
		}
		
		if(editShip== "CHECKED")
		{
		    //check for all document when ship information table has 1 row
		    CWM_ELP_7379_ACA_ABCC_AmendShipDocRequirement()
			
			
			//check for Letter for Authorization Document
			CheckForLetterOfAuthorization(capId);
		}
		
		if(editManager== "CHECKED")
		{
		    //Check for CORI Release Form Document
		    CORIdoc = checkDocumentByType("CORI Release Form");
		    if (!CORIdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the CORI Release Form to continue.");
			}
			
			//Check forPersonal Information Form Document
		    Personaldoc = checkDocumentByType("Personal Information Form");
		    if (!Personaldoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Personal Information Form Document to continue.");
			}
			
			//Check for Manager Information Form Document
		    Managerdoc = checkDocumentByType("Manager Information Form");
		    if (!Managerdoc) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Manager Information Form to continue.");
			}
		}
				
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editDba== "CHECKED" || editManager== "CHECKED" || editContact== "CHECKED" || editBI== "CHECKED" || editPledgeL== "CHECKED")
	    {
			//check for Letter for Authorization Document
			CheckForLetterOfAuthorization(capId);
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editDba== "CHECKED" || editManager== "CHECKED" ||  editBI== "CHECKED" || editPledgeL== "CHECKED")
	    {
	        //Check for Vote of the Corporation Board or LLC Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED" || editBI== "CHECKED")
		{
			//Check for Articles of Organization Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached();
			
			//Check for Partnership Agreement Document
			CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached();
			
			//check for Proof of Age of Named Beneficiaries Document
            CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached();
			
			//check for Court Documents 
            CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached();
		}
		
		if(editDba == "CHECKED" || editEntity== "CHECKED" || editLegal== "CHECKED" || editBI== "CHECKED")
		{
			//check for Business Certificate Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached();
		}
		
		
	}
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);
    }
}

if (appTypeResult == "License/State License/Salesman Permit/Amendment") 
{
	try
    {
        var editVehicle = AInfo["Add, Update, or Remove Vehicle Information"];	
		var editContact = AInfo["Edit Contact and / or Address Information"];
		var editPlate = AInfo["Update Plate Number"];
		
		if(editVehicle == "CHECKED" || editPlate == "CHECKED")
		{			
			//Check for Vehicle Registration document
		    CWM_ELP_7529_ACA_ABCC_checkVehicleRegDoc();
		}
		
		if(editVehicle == "CHECKED" || editContact == "CHECKED" || editPlate == "CHECKED")
		{			
			
			//check for Letter for Authorization Document
		    CheckForLetterOfAuthorization(capId);
		}
	}
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);
    }
}

if (appTypeResult == "License/State License/Transportation Permit/Amendment") 
{
	try
    {
	    var editVehicle = AInfo["Add, Update, or Remove Vehicle Information"];	
		var editContact = AInfo["Edit Contact and / or Address Information"];
		var editPlate = AInfo["Update Plate Number"];
		var editEntity = AInfo["Change of Entity Name"];	
		var editLegal = AInfo["Change of Legal Structure"];	
		
		if(editVehicle == "CHECKED" || editPlate == "CHECKED")
		{			
			//Check for Vehicle Registration document
		    CWM_ELP_7529_ACA_ABCC_checkVehicleRegDoc();
		}
		
		//check for Letter for Authorization Document
		CheckForLetterOfAuthorization(capId);
		
		if(editVehicle == "CHECKED" || editPlate == "CHECKED" || editEntity== "CHECKED" || editLegal== "CHECKED")
		{
			//Check for Vote of the Corporation Board or LLC Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached();
		}
		
		if(editEntity== "CHECKED" || editLegal== "CHECKED")
		{
			//Check for Articles of Organization Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached();
			
			//Check for Partnership Agreement Document
			CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached();
			
			//check for Business Certificate Document
		    CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached();
			
			//check for Proof of Age of Named Beneficiaries Document
            CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached();
			
			//check for Court Documents 
            CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached();
			
		}
	}
	catch (err) {
	showMessage = true;
	cancel = true;
	comment("Error**" + err.message);
    }
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
//***********************************************************************************************************************************************
function CWM_ELP_570_ELP_ACA_ABCC_CheckConvDocAttached() {
	var checkForDoc = false;
	try {
		var manager = getContactByType4ACA("Manager");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
							{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Have you ever been convicted of a state, federal or military crime?" &&
								field.defaultValue == "Y")
								{
								checkForDoc = true;

							}
						}
					}
				}
			}
		}

		if (checkForDoc) {
			if (!docCheckNew("Affidavit")) {
				cancel = true;
				showMessage = true;
				comment("You must provide the Affidavit before submitting the application for processing.");

			}
		}
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_7529_ACA_ABCC_checkVehicleRegDoc() {
var checkForDoc = false;
	if (typeof(VEHICLEINFORMATION) == "object") {
		//logDebug("Ship Info Obj found");
		var vehInfoLength = 0;
		var vehInfoTable = VEHICLEINFORMATION;

		//if (vehInfoTable.length > 0) {
         //   checkForDoc = true;
		//}
		
		if (vehInfoTable.length > 0) {
		if (!checkDocumentByType("Vehicle Registration")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Vehicle Registration document to continue.");

		}
		
	}
	}		
	    
	

	
}

//------------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_19_ASB_ABCC_StopSubmissionX() {
	//cancel = true;
	//showDebug = 3;
	//logDebug("**ERROR: Test");

	var plAgreement = false;
	var prNote = false;
	//var voteDoc = false;

	var asiApprovalToPledge = AInfo["1. Please indicate if you are seeking approval to pledge the license"];
	//updated by Miguel Gutierrez
	//var asiApprovalToPledgeAnyStock = AInfo["2.If a corporation, are you seeking approval to pledge any of the corporate stock"];
	var asiApprovalToPledgeAnyStock = AInfo["1. Are you seeking approval to pledge the license?"];
	var pcapIdString = capId.getID1() + "-" + capId.getID2() + "-" + capId.getID3();
	var acaDocResult = getAcaDocumentList(pcapIdString)

		//logDebug("CapID: " + capId.getCustomID());
		//logDebug("Document Result:" + acaDocResult.size());
		//logDebug("ASI : " + asiApprovalToPledge + " " + asiApprovalToPledgeAnyStock);

		if (acaDocResult.size() > 0) {
			acaDocResult = acaDocResult.toArray();

			for (var counter in acaDocResult)
				{
				var fvDocument = acaDocResult[counter];
				//logDebug("Doc Category: " + fvDocument.getDocCategory());
				if (fvDocument.getDocCategory() == "Pledge Agreement") {
					plAgreement = true;
				} else if (fvDocument.getDocCategory() == "Promissory Note") {
					prNote = true;
				}
				/*else if(fvDocument.getDocCategory() == "Vote of the Corporation Board or LLC"){
				voteDoc = true;
				}*/
			}
			//docAttached = checkApprovalToPledgeDocument(acaDocResult);
			//for(var cR in acaDocResult)
			//dumpObj(acaDocResult);
		}

		if ((asiApprovalToPledge == "Yes" || asiApprovalToPledgeAnyStock == "Yes")) {
			if (!plAgreement || !prNote) {
				cancel = true;
				showMessage = true;

				if (!plAgreement)
					{
					comment("Applicant must attach the Pledge Agreement to continue.");

				}
				if (!prNote)
					{
					comment("Applicant must attach the Promissory Note to continue.");

				}
				/*if(!voteDoc)
				{
				comment("Applicant must attach the Vote of Corporate Board or LLC to continue.");
				}*/
			}
		}
}
//--------------------------------------------------------------------------------------------------------------------------------------------------------
function CheckForLetterOfAuthorization(pTempCapId) {
  var conAppCon = getContactByType4ACA("Application Contact");
  if (conAppCon) {
    var genTemplateObj = conAppCon.getTemplate();
    if (genTemplateObj) {
      var formsResult = genTemplateObj.getTemplateForms().toArray();
      if (formsResult) {
        var asiResult = formsResult[0];
        var subGroups = asiResult.getSubgroups();
        for (var i = 0; i < subGroups.size(); i++) {
          var subGroup = subGroups.get(i);
          var asiFields = subGroup.getFields();
          for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++) {
            var field = asiFields.get(fieldIndex);
            if (field.getFieldName() == "Title" && field.defaultValue == "Authorized Representative") {
              CWM_ELP_XXX_ASB_ABCC_CheckLetterOfAuthorizationDoc(pTempCapId);
            }
          }
        }
      }
    }
  }
}
//------------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_570_ELP_ACA_ABCC_CheckVoteofCorporationAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && field.defaultValue != "" && field.defaultValue != "Sole Proprietor")
								{
								checkForBusinessDoc = true;

							    }
							 

						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Vote of the Corporation Board or LLC")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Vote of the Corporation Board or LLC to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_570_ELP_ACA_ABCC_CheckArticlesofOrganizationAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && (field.defaultValue == "LLC" || field.defaultValue == "LLP" || field.defaultValue == "Association" || field.defaultValue == "Corporation" || field.defaultValue == "Non-Profit Corporation"))
								{
								checkForBusinessDoc = true;

							    }
							 

						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Articles of Organization")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Articles of Organization document to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_570_ELP_ACA_ABCC_CheckBusinessCertificateAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && field.defaultValue == "Sole Proprietor" && AInfo["DBA Name (if different)"] != "")
								{
								checkForBusinessDoc = true;

							    }
						
						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Business Certificate")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Business Certificate to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_570_ELP_ACA_ABCC_CheckMABusinessTrustAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && field.defaultValue == "MA Business Trust")
								{
								checkForBusinessDoc = true;

							    }
						
						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Proof of Age of Named Beneficiaries")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Proof of Age of Named Beneficiaries to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}

//------------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_570_ELP_ACA_ABCC_CheckCourtDocumentAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && field.defaultValue == "Estate")
								{
								checkForBusinessDoc = true;

							    }
						
						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Court Documents")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Court Documents to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//-------------------------------------------------------------------------------------------------------------------------------------------------------
function docCheckNew(docName) {
  try {
    var docAttached = false;

    if (publicUser) // HANDLE ACA PAGEFLOW
    {
      var cap = aa.env.getValue('CapModel');
      var currentCapId = cap.getCapID();
      var pcapIdString = currentCapId.getID1() + "-" + currentCapId.getID2() + "-" + currentCapId.getID3();

      var acaDocResult = getAcaDocumentList(pcapIdString);
     // logDebug("Document Result:" + acaDocResult.size());

      if (acaDocResult.size() > 0) {
        acaDocResult = acaDocResult.toArray();
        docAttached = checkForTTBPermit(acaDocResult, docName);
      }
    }
    return docAttached;
  } catch (error) {
    cancel = true;
    showMessage = true;
    comment(error.message);

    if (cap == null) {
      comment("An error occurred while retrieving the cap");
    } else {
      comment("An error occurred while retrieving the document array");
    }
    return false;
  }
}
//-----------------------------------------------------------------------------------------------------------------------------------------------------
function CWM_ELP_7379_ACA_ABCC_AmendShipDocRequirement() {
	
	if (typeof(SHIPINFORMATION) == "object") {
		//logDebug("Ship Info Obj found");
		var tblShipLength = 0;
		var shipInfoTable = SHIPINFORMATION;
		if (shipInfoTable.length > 0) 
		{
			if (!checkDocumentByType("Coast Guard Certification")) 
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Coast Guard Certification document to continue.");

		    }
			
			if (!checkDocumentByType("Sailing Schedule")) 
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Sailing Schedule document to continue.");

		    }
			
			if (!checkDocumentByType("CORI Release Form"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the CORI Release Form document to continue.");

		    }	
			
			if (!checkDocumentByType("Floor Plan(s)"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Floor Plan(s) document to continue.");

		    }

            if (!checkDocumentByType("Security Policy"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Security Policy document to continue.");

		    }		

            if (!checkDocumentByType("Personal Information Form"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Personal Information Form document to continue.");

		    }			

            if (!checkDocumentByType("Manager Information Form"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Manager Information Form document to continue.");

		    }	

            /* if (!checkDocumentByType("Letter of Authorization"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Letter of Authorization document to continue.");

		    } */

            if (!checkDocumentByType("Vote of the Corporation Board or LLC"))
			{
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Vote of the Corporation Board or LLC document to continue.");

		    }				
			
			
		}
	}
}
//******************************************************************************************************************************************
function conditionallyReqSecurityPolicy1(capId) {
	try {
		var extServHrs = false;
		var cease = true;
		var shipInfoASIT;

		if (publicUser) {
			loadASITables4ACAXX1();
		}

		if (typeof(SHIPINFORMATION) == "object") {
			for (x in SHIPINFORMATION) {
				shipInfoASIT = SHIPINFORMATION[x];
				if (shipInfoASIT["Are you applying for extended service hours?"] == "Yes") {
					extServHrs = true;
					break;
				}
			}

			if (extServHrs) {
				if (publicUser) {
					cease = docCheck("Security Policy");
				}

				if (!cease) {
					cancel = true;
					showMessage = true;
					//comment("DocumentModelList exists, but there is no Vehicle Registration.");
					//comment("publicUser:"+publicUser);
					comment('You must provide the "Security Policy" before submitting the application for processing.');
				}
			}
		}
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An error occurred in conditionallyReqSecurityPolicy. " + error.message);
		logDebug("An error occurred in conditionallyReqSecurityPolicy. Please see below for more details.");
		logDebug(error.message);
	}
}
//********************************************************************************************************************************************
function CWM_ELP_570_ELP_ACA_ABCC_CheckPartnershipAgreementAttached() {
	var checkForBusinessDoc = false;
	var checkforAoADoc =false;
	try {
		var manager = getContactByType4ACA("Business");
		if (manager) {
			var genTemplateObj = manager.getTemplate();
			if (genTemplateObj)
				{
				var formsResult = genTemplateObj.getTemplateForms().toArray();
				if (formsResult)
					{
					var asiResult = formsResult[0];
					var subGroups = asiResult.getSubgroups();
					for (var i = 0; i < subGroups.size(); i++)
						{
						var subGroup = subGroups.get(i);
						var asiFields = subGroup.getFields();
						for (var fieldIndex = 0; fieldIndex < asiFields.size(); fieldIndex++)
						{
							var field = asiFields.get(fieldIndex);
							if (field.getFieldName() == "Legal Structure" && (field.defaultValue == "Partnership"))
								{
								checkForBusinessDoc = true;

							    }
							 

						}
					}
				}
			}
		}

		if (checkForBusinessDoc) {
			if (!docCheckNew("Partnership Agreement")) {
				cancel = true;
				showMessage = true;
				comment("Applicant must attach the Partnership Agreement document to continue.");

			}
		}
		
	
	} catch (error) {
		cancel = true;
		showMessage = true;
		comment("An unexpected error occurred. Please contact your administrator.");
		comment(error.message);
	}
}
//*****************************************************************************************************************************************
function loadASITables4ACAXX1() {
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
      var gm = cap.getAppSpecificTableGroupModel();
     }
if(gm)
{
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
     // logDebug("ASI Table Array : " + tn + " (" + numrows + " Rows)");
      eval(copyStr); // move to table name
     }
}
  }

//*******************************New Code Ended*************************************************************************************************

	

/*------------------------------------------------------------------------------------------------------/
| Custom Functions (End)
/------------------------------------------------------------------------------------------------------*/