restoreAmendContacts();

/**
JIRA#2925
Update Code present in CRCA, as fees were not adding because its changing few ASI like Capacity before the Fee calculation. all should be done after required fee payment and
 -Wholesaler-Amendment were moved to here from Its ASA Event to here for Fee Calculation for AA and ACA 
**/
if(appMatch("License/State License/Railroad Master/Amendment")){
addFeesRailroadCarFeesACA();
}

if(appMatch("License/State License/Wholesaler/Amendment")){
CWM_ELP_277_ASA_ABCC_AddTransportFee();
CWM_ASA_ABCC_addAssociatedLicensesASIT1();
addAmendmentVehicleInformationFees();
addWholesalerAmendmentCategoryCapacityFees();
}
if(!publicUser)
{
 if(!(appMatch("License/State License/Wholesaler/Amendment")|| appMatch("License/State License/Airline Master/Amendment"))){
	workflowReview = getWorkflowReviewLevel();

	if(workflowReview == "fasttrack")
	{
	  
	  updateLicenseWhenAmendmentApproval(capId);
          	   
	}
 }
}
if(appMatch("License/State License/Airline Master/Amendment")){
	addAmendmentFlightFees();
}
/**JIRA#2925 End*/
function restoreAmendContacts()
{
    try{
		var manager = false;
		var business = false;
		var bio = false;
		var bii = false;
		var licind = false;

		var parent = getParent();

		var targetPeople = aa.people.getCapContactByCapID(capId);
		if(targetPeople)
		{
			targetPeopleList = targetPeople.getOutput();
		} 
		for (s in targetPeopleList)
		{
			if(targetPeopleList[s].getCapContactModel().getContactType() == "Manager")
				{manager = true;}
			if(targetPeopleList[s].getCapContactModel().getContactType() == "Business")
				{business = true;}
			if(targetPeopleList[s].getCapContactModel().getContactType() == "Beneficial Interest - Individual")
				{bii = true;}
			if(targetPeopleList[s].getCapContactModel().getContactType() == "Beneficial Interest - Organization")
				{bio = true;}
			if(targetPeopleList[s].getCapContactModel().getContactType() == "Licensed Individual")
				{licind = true;}	
		}
        
      if(manager == false || business == false || bii == false || bio == false)
      { 
          var parentPeople = aa.people.getCapContactByCapID(parent);
          if(parentPeople)
          {
            parentPeopleList = parentPeople.getOutput();
          } 
          for (q in parentPeopleList)
          {
            if(((business == false && parentPeopleList[q].getCapContactModel().getContactType() == "Business") || (bii == false && parentPeopleList[q].getCapContactModel().getContactType() == "Beneficial Interest - Individual") || (bio == false && parentPeopleList[q].getCapContactModel().getContactType() == "Beneficial Interest - Organization") || licind == false && parentPeopleList[q].getCapContactModel().getContactType() == "Licensed Individual") || ((AInfo["Change of License Manager"] != "CHECKED" || appMatch("License/State License/Agent Broker Solicitor/Amendment") || appMatch("License/State License/Caterer/Amendment") || appMatch("License/State License/Manufacturer/Amendment") || appMatch("License/State License/Commercial Alcohol/Amendment") || appMatch("License/State License/Wholesaler/Amendment") || appMatch("License/State License/Ship Master/Amendment") || appMatch("License/State License/Farmer Brewery/Amendment") || appMatch("License/State License/Farmer Distillery/Amendment") || appMatch("License/State License/Farmer Winery/Amendment"))&& manager == false && parentPeopleList[q].getCapContactModel().getContactType() == "Manager"))
            {
                  var newContact = parentPeopleList[q].getCapContactModel();
                  newerPeople = newContact.getPeople();
				  var newPeople = newContact.getPeople();
                  var addressList = aa.address.getContactAddressListByCapContact(newContact).getOutput();
				  newContact.setCapID(capId);			  
				  aa.people.createCapContact(newContact);
				  
				  /*for (add in addressList)
                  {
                  // build model
                     var Xref = aa.address.createXRefContactAddressModel().getOutput();
                     Xref.setContactAddressModel(contactAddressModel);
                     Xref.setAddressID(addressList[add].getAddressID());
                     Xref.setEntityID(parseInt(newerPeople.getContactSeqNumber()));
                     Xref.setEntityType(contactAddressModel.getEntityType());
                     Xref.setCapID(capId);
                     // commit address
                     aa.address.createXRefContactAddress(Xref.getXRefContactAddressModel());
	              }*/
            }
          }
		  setContactsSyncFlag("N", capId);
        }    
		
	}catch(err){
        showMessage=true;
        comment("Error on ASB function restoreAmendContacts, Please contact administrator.\nERROR: " + err);
    } 
}
